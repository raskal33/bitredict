/**
 * Lightweight Pool State Service
 * Uses minimal contract calls with smart caching for settlement status
 */

import { readContract } from 'wagmi/actions';
import { config } from '@/config/wagmi';
import BitredictPoolCoreArtifact from '@/contracts/abis/BitredictPoolCore.json';

// Extract ABI array from artifact
const BitredictPoolCoreABI = BitredictPoolCoreArtifact.abi;

interface PoolStateCache {
  [poolId: number]: {
    creatorSideWon: boolean;
    settled: boolean;
    timestamp: number;
  };
}

class PoolStateService {
  private cache: PoolStateCache = {};
  private readonly CACHE_DURATION = 30000; // 30 seconds cache
  private readonly CONTRACT_ADDRESS = "0xf6C56Ef095d88a04a3C594ECA30F6e275EEbe3db";

  /**
   * Get pool settlement status with smart caching
   * Only makes contract call if not cached or cache expired
   */
  async getPoolState(poolId: number): Promise<{ creatorSideWon: boolean; settled: boolean }> {
    const now = Date.now();
    const cached = this.cache[poolId];

    // Return cached data if still valid
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      return {
        creatorSideWon: cached.creatorSideWon,
        settled: cached.settled
      };
    }

    try {
      // Get pool data and extract flags
      const poolData = await readContract(config, {
        address: this.CONTRACT_ADDRESS as `0x${string}`,
        abi: BitredictPoolCoreABI,
        functionName: 'getPool',
        args: [BigInt(poolId)]
      }) as any;

      // Extract flags from pool data (flags is at index 2 in the Pool struct)
      const flags = poolData.flags || poolData[2] || 0;
      
      // Decode flags (bit 0 = settled, bit 1 = creatorSideWon)
      const settled = (flags & 1) !== 0;
      const creatorSideWon = (flags & 2) !== 0;

      // Cache the result
      this.cache[poolId] = {
        creatorSideWon,
        settled,
        timestamp: now
      };

      return { creatorSideWon, settled };
    } catch (error) {
      console.warn(`Failed to fetch pool state for pool ${poolId}:`, error);
      
      // Return fallback values
      return {
        creatorSideWon: false,
        settled: false
      };
    }
  }

  /**
   * Batch get multiple pool states (more efficient for multiple pools)
   */
  async getBatchPoolStates(poolIds: number[]): Promise<{ [poolId: number]: { creatorSideWon: boolean; settled: boolean } }> {
    const results: { [poolId: number]: { creatorSideWon: boolean; settled: boolean } } = {};
    
    // Separate cached and uncached pool IDs
    const now = Date.now();
    const uncachedIds: number[] = [];
    
    for (const poolId of poolIds) {
      const cached = this.cache[poolId];
      if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
        results[poolId] = {
          creatorSideWon: cached.creatorSideWon,
          settled: cached.settled
        };
      } else {
        uncachedIds.push(poolId);
      }
    }

    // Fetch uncached pool states
    if (uncachedIds.length > 0) {
      try {
        // Use Promise.all for parallel contract calls (still efficient)
        const contractCalls = uncachedIds.map(poolId => 
          readContract(config, {
            address: this.CONTRACT_ADDRESS as `0x${string}`,
            abi: BitredictPoolCoreABI,
            functionName: 'getPool',
            args: [BigInt(poolId)]
          }).catch(error => {
            console.warn(`Failed to fetch pool state for pool ${poolId}:`, error);
            return { flags: 0 }; // Fallback
          })
        );

        const poolResults = await Promise.all(contractCalls);

        // Process results and update cache
        poolResults.forEach((poolData, index) => {
          const poolId = uncachedIds[index];
          const flags = (poolData as any).flags || (poolData as any)[2] || 0;
          
          const settled = (flags & 1) !== 0;
          const creatorSideWon = (flags & 2) !== 0;

          // Cache the result
          this.cache[poolId] = {
            creatorSideWon,
            settled,
            timestamp: now
          };

          results[poolId] = { creatorSideWon, settled };
        });
      } catch (error) {
        console.error('Batch pool state fetch failed:', error);
        
        // Provide fallback values for uncached pools
        uncachedIds.forEach(poolId => {
          results[poolId] = { creatorSideWon: false, settled: false };
        });
      }
    }

    return results;
  }

  /**
   * Clear cache for specific pool (useful after state changes)
   */
  clearPoolCache(poolId: number): void {
    delete this.cache[poolId];
  }

  /**
   * Clear entire cache
   */
  clearCache(): void {
    this.cache = {};
  }

  /**
   * Get cache stats for debugging
   */
  getCacheStats(): { totalCached: number; cacheKeys: number[] } {
    return {
      totalCached: Object.keys(this.cache).length,
      cacheKeys: Object.keys(this.cache).map(Number)
    };
  }
}

// Export singleton instance
export const poolStateService = new PoolStateService();

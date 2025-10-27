import { ethers } from 'ethers';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/wagmi';
import PoolCoreArtifact from '@/contracts/abis/BitredictPoolCore.json';

// Extract ABI array from artifact
const PoolCoreABI = PoolCoreArtifact.abi;

// ============================================================================
// CONTRACT ANALYTICS SERVICE - Real-time blockchain data
// ============================================================================

export interface ContractGlobalStats {
  totalPools: bigint;
  totalVolume: bigint;
  averagePoolSize: bigint;
  lastUpdated: bigint;
}

export interface ContractPoolAnalytics {
  totalVolume: bigint;
  participantCount: bigint;
  averageBetSize: bigint;
  creatorReputation: bigint;
  liquidityRatio: bigint;
  timeToFill: bigint;
  isHotPool: boolean;
  fillPercentage: bigint;
  lastActivityTime: bigint;
}

export interface ContractCreatorStats {
  totalPoolsCreated: bigint;
  successfulPools: bigint;
  totalVolumeGenerated: bigint;
  averagePoolSize: bigint;
  reputationScore: bigint;
  winRate: bigint;
  totalEarnings: bigint;
  activePoolsCount: bigint;
}

export interface ContractCategoryStats {
  totalPools: bigint;
  totalVolume: bigint;
  averageOdds: bigint;
  lastActivityTime: bigint;
}

export interface MarketTypeDistribution {
  moneyline: number;
  overUnder: number;
  spread: number;
  doubleChance: number;
  htft: number;
  goalScorer: number;
  correctScore: number;
  custom: number;
}

export interface OracleTypeDistribution {
  guided: number;
  open: number;
}

// Hook-based contract analytics service
export function useContractAnalytics() {
  // Global stats hook
  const { data: globalStats, isLoading: globalStatsLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.POOL_CORE,
    abi: PoolCoreABI,
    functionName: 'getGlobalStats',
  });

  return {
    globalStats: globalStats ? {
      totalPools: (globalStats as any)[0] || BigInt(0),
      totalVolume: (globalStats as any)[1] || BigInt(0),
      averagePoolSize: (globalStats as any)[2] || BigInt(0),
      lastUpdated: (globalStats as any)[3] || BigInt(0),
    } : null,
    globalStatsLoading,
  };
}

class ContractAnalyticsService {
  /**
   * Get global platform statistics from contract
   */
  async getGlobalStats(): Promise<ContractGlobalStats> {
    try {
      // This would need to be implemented with proper contract calls
      // For now, return mock data
      return {
        totalPools: BigInt(0),
        totalVolume: BigInt(0),
        averagePoolSize: BigInt(0),
        lastUpdated: BigInt(0),
      };
    } catch (error) {
      console.error('Error fetching global stats from contract:', error);
      throw error;
    }
  }

  /**
   * Get pool-specific analytics from contract
   */
  async getPoolAnalytics(poolId: number): Promise<ContractPoolAnalytics> {
    try {
      // Mock implementation - would need proper contract calls
      return {
        totalVolume: BigInt(0),
        participantCount: BigInt(0),
        averageBetSize: BigInt(0),
        creatorReputation: BigInt(0),
        liquidityRatio: BigInt(0),
        timeToFill: BigInt(0),
        isHotPool: false,
        fillPercentage: BigInt(0),
        lastActivityTime: BigInt(0),
      };
    } catch (error) {
      console.error(`Error fetching pool analytics for pool ${poolId}:`, error);
      throw error;
    }
  }

  /**
   * Get creator statistics from contract
   */
  async getCreatorStats(address: string): Promise<ContractCreatorStats> {
    try {
      // Mock implementation - would need proper contract calls
      return {
        totalPoolsCreated: BigInt(0),
        successfulPools: BigInt(0),
        totalVolumeGenerated: BigInt(0),
        averagePoolSize: BigInt(0),
        reputationScore: BigInt(0),
        winRate: BigInt(0),
        totalEarnings: BigInt(0),
        activePoolsCount: BigInt(0),
      };
    } catch (error) {
      console.error(`Error fetching creator stats for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get category statistics from contract
   */
  async getCategoryStats(categoryHash: string): Promise<ContractCategoryStats> {
    try {
      // Mock implementation - would need proper contract calls
      const stats = {
        totalPools: BigInt(0),
        totalVolume: BigInt(0),
        averageOdds: BigInt(0),
        lastActivityTime: BigInt(0),
      };
      return stats;
    } catch (error) {
      console.error(`Error fetching category stats for ${categoryHash}:`, error);
      throw error;
    }
  }

  /**
   * Get market type distribution from contract
   */
  async getMarketTypeDistribution(): Promise<MarketTypeDistribution> {
    try {
      // Mock implementation - would need proper contract calls
      const distribution = [0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n];
      
      // Convert BigInt array to numbers
      return {
        moneyline: Number(distribution[0] || 0n),
        overUnder: Number(distribution[1] || 0n),
        spread: Number(distribution[2] || 0n),
        doubleChance: Number(distribution[3] || 0n),
        htft: Number(distribution[4] || 0n),
        goalScorer: Number(distribution[5] || 0n),
        correctScore: Number(distribution[6] || 0n),
        custom: Number(distribution[7] || 0n),
      };
    } catch (error) {
      console.error('Error fetching market type distribution:', error);
      throw error;
    }
  }

  /**
   * Get oracle type distribution from contract
   */
  async getOracleTypeDistribution(): Promise<OracleTypeDistribution> {
    try {
      // Mock implementation - would need proper contract calls
      const distribution = [0n, 0n];
      
      return {
        guided: Number(distribution[0] || 0n),
        open: Number(distribution[1] || 0n),
      };
    } catch (error) {
      console.error('Error fetching oracle type distribution:', error);
      throw error;
    }
  }

  /**
   * Get active pools from contract
   */
  async getActivePools(limit: number = 50): Promise<bigint[]> {
    try {
      // Mock implementation - would need proper contract calls
      return [];
    } catch (error) {
      console.error('Error fetching active pools:', error);
      throw error;
    }
  }

  /**
   * Get pools by creator from contract
   */
  async getPoolsByCreator(creator: string, limit: number = 50): Promise<bigint[]> {
    try {
      // Mock implementation - would need proper contract calls
      return [];
    } catch (error) {
      console.error(`Error fetching pools by creator ${creator}:`, error);
      throw error;
    }
  }

  /**
   * Get pools by category from contract
   */
  async getPoolsByCategory(categoryHash: string): Promise<bigint[]> {
    try {
      // Mock implementation - would need proper contract calls
      return [];
    } catch (error) {
      console.error(`Error fetching pools by category ${categoryHash}:`, error);
      throw error;
    }
  }

  /**
   * Get pools by market type from contract
   */
  async getPoolsByMarketType(marketType: number, limit: number = 50): Promise<bigint[]> {
    try {
      // Mock implementation - would need proper contract calls
      return [];
    } catch (error) {
      console.error(`Error fetching pools by market type ${marketType}:`, error);
      throw error;
    }
  }

  /**
   * Get pools by oracle type from contract
   */
  async getPoolsByOracleType(oracleType: number, limit: number = 50): Promise<bigint[]> {
    try {
      // Mock implementation - would need proper contract calls
      return [];
    } catch (error) {
      console.error(`Error fetching pools by oracle type ${oracleType}:`, error);
      throw error;
    }
  }

  /**
   * Format BigInt values to human-readable strings
   */
  formatVolume(volume: bigint): string {
    const eth = Number(ethers.formatEther(volume));
    if (eth >= 1000000) return `${(eth / 1000000).toFixed(2)}M`;
    if (eth >= 1000) return `${(eth / 1000).toFixed(2)}K`;
    return eth.toFixed(4);
  }

  /**
   * Format win rate percentage
   */
  formatWinRate(winRate: bigint): string {
    return `${Number(winRate) / 100}%`;
  }

  /**
   * Format reputation score
   */
  formatReputation(reputation: bigint): string {
    return Number(reputation).toLocaleString();
  }
}

// Export singleton instance
const contractAnalyticsService = new ContractAnalyticsService();
export default contractAnalyticsService;


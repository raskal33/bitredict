/**
 * Direct Pool Contract Service
 * Fetches pool data directly from the BitredictPoolCore contract
 */

import { 
  createPublicClient, 
  http, 
  formatEther,
  type Address
} from 'viem';
import { CONTRACTS } from '@/contracts';
import { processRawPoolData } from '@/utils/contractDataDecoder';

// Somnia Testnet configuration
const somniaChain = {
  id: 50312,
  name: 'Somnia Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'STT',
    symbol: 'STT',
  },
  rpcUrls: {
    default: {
      http: [
        process.env.NODE_ENV === 'development' 
          ? 'http://localhost:8080/api/rpc-proxy'
          : process.env.NEXT_PUBLIC_RPC_URL || 'https://dream-rpc.somnia.network/'
      ],
    },
  },
  blockExplorers: {
    default: { name: 'Somnia Explorer', url: 'https://shannon-explorer.somnia.network' },
  },
  testnet: true,
};

export class PoolContractService {
  private static publicClient = createPublicClient({
    chain: somniaChain,
    transport: http()
  });

  /**
   * Get pool count from contract
   */
  static async getPoolCount(): Promise<number> {
    try {
      const result = await this.publicClient.readContract({
        address: CONTRACTS.POOL_CORE.address as Address,
        abi: CONTRACTS.POOL_CORE.abi,
        functionName: 'poolCount',
      });
      return Number(result);
    } catch (error) {
      console.error('Error getting pool count:', error);
      return 0;
    }
  }

  /**
   * Get pool data directly from contract
   */
  static async getPool(poolId: number): Promise<any | null> {
    try {
      console.log('🔗 Fetching pool directly from contract:', poolId);
      
      // Use the new getPoolWithDecodedNames function for readable team names
      const result = await this.publicClient.readContract({
        address: CONTRACTS.POOL_CORE.address as Address,
        abi: CONTRACTS.POOL_CORE.abi,
        functionName: 'getPoolWithDecodedNames',
        args: [BigInt(poolId)],
      });

      if (!result) {
        console.warn('No pool data returned for ID:', poolId);
        return null;
      }

      // Convert contract result to pool object (getPoolWithDecodedNames returns decoded strings)
      const resultArray = result as any;
      const rawPool = {
        poolId,
        creator: resultArray[0], // address creator
        odds: Number(resultArray[1]), // uint16 odds
        flags: Number(resultArray[2]), // uint8 flags
        oracleType: Number(resultArray[3]), // OracleType oracleType
        creatorStake: resultArray[4].toString(), // uint256 creatorStake
        eventStartTime: Number(resultArray[5]), // uint256 eventStartTime
        eventEndTime: Number(resultArray[6]), // uint256 eventEndTime
        marketId: resultArray[7], // string marketId (fixture ID)
        league: resultArray[8], // string league (decoded)
        category: resultArray[9], // string category (decoded)
        region: resultArray[10], // string region (decoded)
        homeTeam: resultArray[11], // string homeTeam (decoded)
        awayTeam: resultArray[12], // string awayTeam (decoded)
        title: resultArray[13], // string title (decoded)
        // Add missing fields with defaults
        reserved: 0,
        totalCreatorSideStake: resultArray[4].toString(), // Same as creatorStake
        maxBettorStake: 0,
        totalBettorStake: 0,
        predictedOutcome: '', // Not returned by this function
        result: '', // Not returned by this function
        bettingEndTime: 0, // Not returned by this function
        resultTimestamp: 0, // Not returned by this function
        arbitrationDeadline: 0, // Not returned by this function
        maxBetPerUser: 0, // Not returned by this function
      };

      console.log('📊 Decoded pool data from contract:', rawPool);
      console.log('📊 Decoded title:', rawPool.title);
      console.log('📊 Decoded homeTeam:', rawPool.homeTeam);
      console.log('📊 Decoded awayTeam:', rawPool.awayTeam);
      console.log('📊 Raw flags:', rawPool.flags);

      // Process the raw data to decode bytes32 and flags
      const processedPool = processRawPoolData(rawPool);
      console.log('📊 Processed pool data:', processedPool);
      
      console.log('✅ Processed pool data:', {
        poolId: processedPool.poolId,
        title: processedPool.title,
        homeTeam: processedPool.homeTeam,
        awayTeam: processedPool.awayTeam,
        usesBitr: processedPool.usesBitr,
        isPrivate: processedPool.isPrivate,
        settled: processedPool.settled
      });

      return processedPool;
    } catch (error) {
      console.error('Error fetching pool from contract:', error);
      return null;
    }
  }

  /**
   * Get multiple pools from contract
   */
  static async getPools(limit: number = 50, offset: number = 0): Promise<any[]> {
    try {
      const poolCount = await this.getPoolCount();
      console.log(`📊 Total pools in contract: ${poolCount}`);

      if (poolCount === 0) {
        return [];
      }

      // Calculate range - pools start from ID 0
      const startId = Math.max(0, poolCount - offset - limit);
      const endId = Math.max(0, poolCount - offset - 1);
      
      console.log(`🔗 Fetching pools ${startId} to ${endId} from contract`);

      const poolPromises = [];
      for (let i = startId; i <= endId; i++) {
        poolPromises.push(this.getPool(i));
      }

      const pools = await Promise.all(poolPromises);
      const validPools = pools.filter(pool => pool !== null);

      console.log(`✅ Fetched ${validPools.length} valid pools from contract`);
      return validPools.reverse(); // Return newest first
    } catch (error) {
      console.error('Error fetching pools from contract:', error);
      return [];
    }
  }

  /**
   * Get pool analytics data
   */
  static async getPoolAnalytics(poolId: number): Promise<any | null> {
    try {
      const result = await this.publicClient.readContract({
        address: CONTRACTS.POOL_CORE.address as Address,
        abi: CONTRACTS.POOL_CORE.abi,
        functionName: 'poolAnalytics',
        args: [BigInt(poolId)],
      });

      if (!result) return null;

      const resultArray = result as any;
      return {
        totalVolume: resultArray[0].toString(),
        participantCount: Number(resultArray[1]),
        averageBetSize: resultArray[2].toString(),
        creatorReputation: resultArray[3].toString(),
        liquidityRatio: resultArray[4].toString(),
        timeToFill: resultArray[5].toString(),
        isHotPool: resultArray[6],
        fillPercentage: Number(resultArray[7]),
        lastActivityTime: resultArray[8].toString(),
      };
    } catch (error) {
      console.error('Error fetching pool analytics:', error);
      return null;
    }
  }
}

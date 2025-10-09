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
      
      // Use the getPool function to get full pool data including predictedOutcome and marketType
      const result = await this.publicClient.readContract({
        address: CONTRACTS.POOL_CORE.address as Address,
        abi: CONTRACTS.POOL_CORE.abi,
        functionName: 'getPool',
        args: [BigInt(poolId)],
      });

      if (!result) {
        console.warn('No pool data returned for ID:', poolId);
        return null;
      }

      // Convert contract result to pool object (getPool returns full Pool struct)
      const pool = result as any;
      
      console.log('🔍 Raw pool data from contract:', {
        poolId,
        predictedOutcome: pool.predictedOutcome,
        homeTeam: pool.homeTeam,
        awayTeam: pool.awayTeam,
        league: pool.league,
        category: pool.category,
        region: pool.region,
        title: pool.title,
        marketId: pool.marketId,
        marketType: pool.marketType
      });
      
      const rawPool = {
        poolId,
        creator: pool.creator,
        odds: Number(pool.odds) / 100, // Convert from integer (165) to decimal (1.65)
        flags: Number(pool.flags),
        oracleType: Number(pool.oracleType),
        marketType: Number(pool.marketType), // Now available!
        creatorStake: pool.creatorStake.toString(),
        totalCreatorSideStake: pool.totalCreatorSideStake.toString(),
        maxBettorStake: pool.maxBettorStake.toString(),
        totalBettorStake: pool.totalBettorStake.toString(),
        predictedOutcome: pool.predictedOutcome, // Now available!
        result: pool.result,
        eventStartTime: Number(pool.eventStartTime),
        eventEndTime: Number(pool.eventEndTime),
        bettingEndTime: Number(pool.bettingEndTime),
        resultTimestamp: Number(pool.resultTimestamp),
        arbitrationDeadline: Number(pool.arbitrationDeadline),
        maxBetPerUser: Number(pool.maxBetPerUser),
        marketId: pool.marketId,
        league: pool.league,
        category: pool.category,
        region: pool.region,
        homeTeam: pool.homeTeam,
        awayTeam: pool.awayTeam,
        title: pool.title,
        reserved: Number(pool.reserved),
      };

      console.log('📊 Decoded pool data from contract:', rawPool);
      console.log('📊 Decoded title:', rawPool.title);
      console.log('📊 Decoded homeTeam:', rawPool.homeTeam);
      console.log('📊 Decoded awayTeam:', rawPool.awayTeam);
      console.log('📊 Raw flags:', rawPool.flags);
      console.log('📊 Predicted outcome:', rawPool.predictedOutcome);
      console.log('📊 Market type:', rawPool.marketType);

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
  static async getPoolStats(): Promise<any> {
    try {
      console.log('📊 Fetching pool stats from contract...');
      
      const totalPools = await this.getPoolCount();
      
      // Get all pools to calculate stats
      const allPools = await this.getPools(totalPools, 0);
      
      let totalVolume = 0;
      let bitrVolume = 0;
      let sttVolume = 0;
      let activeMarkets = 0;
      let participants = 0;
      
      for (const pool of allPools) {
        const creatorStake = parseFloat(pool.creatorStake || "0") / 1e18;
        const bettorStake = parseFloat(pool.totalBettorStake || "0") / 1e18;
        const poolVolume = creatorStake + bettorStake;
        
        totalVolume += poolVolume;
        
        if (creatorStake >= 1000) {
          bitrVolume += poolVolume;
        } else {
          sttVolume += poolVolume;
        }
        
        if (!pool.settled) {
          activeMarkets++;
        }
        
        participants += 1; // Each pool has at least 1 participant (creator)
      }
      
      return {
        totalVolume: totalVolume.toString(),
        bitrVolume: bitrVolume.toString(),
        sttVolume: sttVolume.toString(),
        activeMarkets,
        participants,
        totalPools,
        boostedPools: 0,
        comboPools: 0,
        privatePools: 0
      };
    } catch (error) {
      console.error('Error fetching pool stats:', error);
      return {
        totalVolume: "0",
        bitrVolume: "0",
        sttVolume: "0",
        activeMarkets: 0,
        participants: 0,
        totalPools: 0,
        boostedPools: 0,
        comboPools: 0,
        privatePools: 0
      };
    }
  }

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

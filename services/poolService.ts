// PoolService - Direct contract integration ONLY
import { processRawPoolData } from '@/utils/contractDataDecoder';
import { PoolContractService } from './poolContractService';

export interface Pool {
  poolId: number;
  creator: string;
  odds: number;
  creatorStake: string;
  totalBettorStake: string;
  predictedOutcome: string;
  marketId: string;
  eventStartTime: string;
  eventEndTime: string;
  bettingEndTime: string;
  league: string;
  category: string;
  region: string;
  // NEW FIELDS FROM CONTRACT
  title: string; // Professional title
  homeTeam: string; // Home team name
  awayTeam: string; // Away team name
  isPrivate: boolean;
  usesBitr: boolean;
  settled: boolean;
  creatorSideWon: boolean | null;
  boostTier?: "NONE" | "BRONZE" | "SILVER" | "GOLD";
  boostExpiry?: number;
  maxBetPerUser: string;
  // Additional fields from backend
  filledAbove60?: boolean;
  oracleType?: string;
  marketType?: number; // Market type enum from contract
  totalCreatorSideStake?: string;
  maxBettorStake?: string;
  result?: string | null;
  resultTimestamp?: string | null;
  arbitrationDeadline?: string | null;
  txHash?: string;
  blockNumber?: number;
  createdAt?: string;
}

export interface PoolStats {
  totalVolume: string;
  bitrVolume?: string;
  sttVolume?: string;
  activeMarkets: number;
  participants: number;
  totalPools: number;
  boostedPools: number;
  comboPools: number;
  privatePools: number;
}

export class PoolService {
  static async getPools(limit: number = 50, offset: number = 0): Promise<Pool[]> {
    try {
      console.log('🔗 Fetching pools DIRECTLY from contract (NO backend)');
      
      // Fetch directly from contract ONLY
      const pools = await PoolContractService.getPools(limit, offset);
      
      console.log('✅ Pools fetched directly from contract:', pools.length, 'pools');
      return pools;
    } catch (error) {
      console.error('❌ Error fetching pools from contract:', error);
      return [];
    }
  }

  static async getPoolsByCategory(category: string, limit: number = 50, offset: number = 0): Promise<Pool[]> {
    try {
      console.log('🔗 Fetching pools by category DIRECTLY from contract:', category);
      
      // Fetch all pools and filter by category
      const allPools = await PoolContractService.getPools(limit * 2, offset);
      const filteredPools = allPools.filter(pool => 
        pool.category && pool.category.toLowerCase().includes(category.toLowerCase())
      );
      
      console.log(`✅ Filtered ${filteredPools.length} pools for category: ${category}`);
      return filteredPools.slice(0, limit);
    } catch (error) {
      console.error('Error fetching pools by category:', error);
      return [];
    }
  }

  static async getPoolById(poolId: number): Promise<Pool | null> {
    try {
      console.log('🔍 Fetching pool by ID DIRECTLY from contract:', poolId);
      
      // Fetch directly from contract ONLY
      const pool = await PoolContractService.getPool(poolId);
      
      if (pool) {
        console.log(`✅ Pool ${poolId} fetched directly from contract:`, {
          title: pool.title,
          homeTeam: pool.homeTeam,
          awayTeam: pool.awayTeam,
          usesBitr: pool.usesBitr
        });
        return pool;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error fetching pool from contract:', error);
      return null;
    }
  }

  static async getActivePoolsByCreator(creatorAddress: string, limit: number = 50, offset: number = 0): Promise<Pool[]> {
    try {
      console.log('🔗 Fetching pools by creator DIRECTLY from contract:', creatorAddress);
      
      // Fetch all pools and filter by creator
      const allPools = await PoolContractService.getPools(limit * 2, offset);
      const filteredPools = allPools.filter(pool => 
        pool.creator && pool.creator.toLowerCase() === creatorAddress.toLowerCase()
      );
      
      console.log(`✅ Filtered ${filteredPools.length} pools for creator: ${creatorAddress}`);
      return filteredPools.slice(0, limit);
    } catch (error) {
      console.error('Error fetching creator pools:', error);
      return [];
    }
  }

  static async createPool(
    predictedOutcome: string,
    odds: number,
    creatorStake: string,
    eventStartTime: number,
    eventEndTime: number,
    bettingEndTime: number,
    arbitrationDeadline: number,
    maxBetPerUser: string,
    isPrivate: boolean,
    useBitr: boolean,
    oracleType: string,
    marketId: string,
    boostTier: string
  ): Promise<{ success: boolean; poolId?: number; error?: string }> {
    try {
      console.log('🚧 Pool creation requires wallet interaction - not implemented yet');
      return { success: false, error: 'Pool creation requires wallet connection' };
    } catch (error) {
      console.error('❌ Error creating pool:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async boostPool(poolId: number, tier: "BRONZE" | "SILVER" | "GOLD"): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🚧 Pool boosting requires wallet interaction - not implemented yet');
      return { success: false, error: 'Pool boosting requires wallet connection' };
    } catch (error) {
      console.error('❌ Error boosting pool:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async placeBet(poolId: number, amount: string, useBitr: boolean = false): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🚧 Placing bet requires wallet interaction - not implemented yet');
      return { success: false, error: 'Placing bet requires wallet connection' };
    } catch (error) {
      console.error('❌ Error placing bet:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async getPoolProgress(poolId: number): Promise<{
    success: boolean;
    data?: {
      totalPoolSize: string;
      currentBettorStake: string;
      maxBettorCapacity: string;
      fillPercentage: number;
      participantCount: number;
      avgBetSize: string;
      creatorReputation: string;
      liquidityRatio: string;
      timeToFill: string;
      isHotPool: boolean;
      lastActivityTime: string;
    };
    error?: string;
  }> {
    try {
      // Use direct contract service for progress data
      const analytics = await PoolContractService.getPoolAnalytics(poolId);
      if (!analytics) {
        return { success: false };
      }
      
      return {
        success: true,
        data: {
          totalPoolSize: analytics.totalVolume,
          currentBettorStake: analytics.totalVolume, // Simplified
          maxBettorCapacity: analytics.totalVolume, // Simplified
          fillPercentage: analytics.fillPercentage,
          participantCount: analytics.participantCount,
          avgBetSize: analytics.averageBetSize,
          creatorReputation: analytics.creatorReputation,
          liquidityRatio: analytics.liquidityRatio,
          timeToFill: analytics.timeToFill,
          isHotPool: analytics.isHotPool,
          lastActivityTime: analytics.lastActivityTime
        }
      };
    } catch (error) {
      console.error('❌ Error fetching pool progress:', error);
      return { success: false };
    }
  }

  static async addLiquidity(poolId: number, amount: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🚧 Adding liquidity requires wallet interaction - not implemented yet');
      return { success: false, error: 'Adding liquidity requires wallet connection' };
    } catch (error) {
      console.error('❌ Error adding liquidity:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async getPoolStats(): Promise<PoolStats> {
    try {
      console.log('📊 Fetching pool stats from direct contract implementation...');
      // Use direct contract service for stats
      const poolCount = await PoolContractService.getPoolCount();
      const pools = await PoolContractService.getPools(100, 0); // Get recent pools for stats
      
      // Calculate stats from contract data
      const totalVolume = pools.reduce((sum, pool) => {
        const stake = parseFloat(pool.creatorStake) || 0;
        return sum + stake;
      }, 0);
      
      const activePools = pools.filter(pool => !pool.settled).length;
      const privatePools = pools.filter(pool => pool.isPrivate).length;
      const boostedPools = pools.filter(pool => pool.boostTier && pool.boostTier !== 'NONE').length;
      
      return {
        totalVolume: totalVolume.toString(),
        bitrVolume: pools.filter(p => p.usesBitr).reduce((sum, pool) => sum + (parseFloat(pool.creatorStake) || 0), 0).toString(),
        sttVolume: pools.filter(p => !p.usesBitr).reduce((sum, pool) => sum + (parseFloat(pool.creatorStake) || 0), 0).toString(),
        activeMarkets: activePools,
        participants: pools.length, // Simplified
        totalPools: poolCount,
        boostedPools,
        comboPools: 0, // Not implemented yet
        privatePools
      };
    } catch (error) {
      console.error('❌ Error fetching pool stats from contract:', error);
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

  static getCategoryIcon(category: string): string {
    switch (category.toLowerCase()) {
      case "football":
      case "soccer":
        return "⚽";
      case "basketball":
        return "🏀";
      case "tennis":
        return "🎾";
      case "crypto":
        return "₿";
      case "combo":
        return "⭐";
      default:
        return "🎯";
    }
  }

  static formatStake(stake: string): string {
    try {
      if (!stake || stake === '0' || stake === '0x0') {
        return '0';
      }

      if (stake.includes('.')) {
        const amount = parseFloat(stake);
        if (isNaN(amount)) return '0';
        if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
        return amount.toFixed(1);
      }

      let amount: number;
      try {
        if (stake.startsWith('0x')) {
          const bigIntValue = BigInt(stake);
          amount = parseFloat((bigIntValue / BigInt(1e18)).toString());
        } else {
          const bigIntValue = BigInt(stake);
          amount = parseFloat((bigIntValue / BigInt(1e18)).toString());
        }
      } catch (error) {
        amount = parseFloat(stake) / 1e18;
      }

      if (isNaN(amount)) return '0';
      if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
      if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
      return amount.toFixed(1);
    } catch (error) {
      console.error('Error formatting stake:', error);
      return '0';
    }
  }

  static formatOdds(odds: number): string {
    return `${(odds / 100).toFixed(2)}x`;
  }

  static formatTimeLeft(timestamp: number): string {
    const now = Math.floor(Date.now() / 1000);
    const diff = timestamp - now;
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  static getBoostBadge(tier: string): string {
    switch (tier) {
      case 'GOLD': return '🥇';
      case 'SILVER': return '🥈';
      case 'BRONZE': return '🥉';
      default: return '';
    }
  }
}
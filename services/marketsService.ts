import { PoolContractService } from './poolContractService';
import { processRawPoolData } from '@/utils/contractDataDecoder';

// ============================================================================
// MARKETS SERVICE - Real-time pool and market data integration
// ============================================================================

export interface PoolWithMetadata {
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
  title: string;
  homeTeam: string;
  awayTeam: string;
  isPrivate: boolean;
  usesBitr: boolean;
  settled: boolean;
  creatorSideWon: boolean | null;
  boostTier?: "NONE" | "BRONZE" | "SILVER" | "GOLD";
  boostExpiry?: number;
  maxBetPerUser: string;
  filledAbove60?: boolean;
  oracleType?: string;
  totalCreatorSideStake?: string;
  maxBettorStake?: string;
  result?: string | null;
  resultTimestamp?: string | null;
  arbitrationDeadline?: string | null;
  txHash?: string;
  blockNumber?: number;
  createdAt?: string;
  // Enhanced metadata
  isBoosted?: boolean;
  isTrending?: boolean;
  isCombo?: boolean;
  comboConditions?: any[];
  popularityScore?: number;
  trendingScore?: number;
  boostScore?: number;
}

export interface PoolFilters {
  category?: string;
  status?: 'active' | 'settled' | 'all';
  isPrivate?: boolean;
  usesBitr?: boolean;
  sortBy?: 'created_at' | 'ending_soon' | 'odds' | 'stake';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export class MarketsService {
  // Direct contract integration - no backend API calls

  /**
   * Get all pools with filtering and sorting - DIRECT CONTRACT CALLS ONLY
   */
  static async getAllPools(filters: PoolFilters = {}): Promise<{
    pools: PoolWithMetadata[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    try {
      console.log('🔗 Fetching all pools DIRECTLY from contract (NO backend)');
      
      // Fetch directly from contract
      const limit = filters.limit || 50;
      const offset = ((filters.page || 1) - 1) * limit;
      const pools = await PoolContractService.getPools(limit, offset);
      
      // Apply client-side filtering
      let filteredPools = pools;
      
      if (filters.category) {
        filteredPools = filteredPools.filter(pool => 
          pool.category && pool.category.toLowerCase().includes(filters.category!.toLowerCase())
        );
      }
      
      if (filters.status) {
        filteredPools = filteredPools.filter(pool => {
          if (filters.status === 'active') return !pool.settled;
          if (filters.status === 'settled') return pool.settled;
          return true;
        });
      }
      
      if (filters.isPrivate !== undefined) {
        filteredPools = filteredPools.filter(pool => pool.isPrivate === filters.isPrivate);
      }
      
      if (filters.usesBitr !== undefined) {
        filteredPools = filteredPools.filter(pool => pool.usesBitr === filters.usesBitr);
      }
      
      // Apply sorting
      if (filters.sortBy) {
        filteredPools.sort((a, b) => {
          let aValue, bValue;
          
          switch (filters.sortBy) {
            case 'created_at':
              aValue = new Date(a.createdAt || 0).getTime();
              bValue = new Date(b.createdAt || 0).getTime();
              break;
            case 'ending_soon':
              aValue = new Date(a.eventEndTime).getTime();
              bValue = new Date(b.eventEndTime).getTime();
              break;
            case 'odds':
              aValue = a.odds;
              bValue = b.odds;
              break;
            case 'stake':
              aValue = parseFloat(a.creatorStake);
              bValue = parseFloat(b.creatorStake);
              break;
            default:
              return 0;
          }
          
          if (filters.sortOrder === 'desc') {
            return bValue - aValue;
          }
          return aValue - bValue;
        });
      }
      
      const enrichedPools = filteredPools.map(pool => this.enrichPoolData(pool));
      
      return {
        pools: enrichedPools,
        pagination: {
          page: filters.page || 1,
          limit,
          total: pools.length,
          totalPages: Math.ceil(pools.length / limit)
        }
      };
    } catch (error) {
      console.error('❌ Error fetching pools from contract:', error);
      return {
        pools: [],
        pagination: { page: 1, limit: 50, total: 0, totalPages: 0 }
      };
    }
  }

  /**
   * Get boosted pools - DIRECT CONTRACT CALLS ONLY
   */
  static async getBoostedPools(filters: Omit<PoolFilters, 'sortBy'> = {}): Promise<PoolWithMetadata[]> {
    try {
      console.log('🔗 Fetching boosted pools DIRECTLY from contract (NO backend)');
      
      // Fetch all pools and filter for boosted ones
      const allPools = await PoolContractService.getPools(100, 0);
      const boostedPools = allPools.filter(pool => 
        pool.boostTier && pool.boostTier !== 'NONE'
      );
      
      return boostedPools.map(pool => this.enrichPoolData(pool, { boosted: true }));
    } catch (error) {
      console.error('❌ Error fetching boosted pools from contract:', error);
      return [];
    }
  }

  /**
   * Get trending pools - DIRECT CONTRACT CALLS ONLY
   */
  static async getTrendingPools(filters: Omit<PoolFilters, 'sortBy'> = {}): Promise<PoolWithMetadata[]> {
    try {
      console.log('🔗 Fetching trending pools DIRECTLY from contract (NO backend)');
      
      // Fetch all pools and sort by activity/volume for trending
      const allPools = await PoolContractService.getPools(100, 0);
      const activePools = allPools.filter(pool => !pool.settled);
      
      // Sort by stake amount and recency for trending
      const trendingPools = activePools
        .sort((a, b) => {
          const aStake = parseFloat(a.creatorStake);
          const bStake = parseFloat(b.creatorStake);
          return bStake - aStake;
        })
        .slice(0, 20); // Top 20 trending
      
      return trendingPools.map(pool => this.enrichPoolData(pool, { trending: true }));
    } catch (error) {
      console.error('❌ Error fetching trending pools from contract:', error);
      return [];
    }
  }

  /**
   * Get private pools - DIRECT CONTRACT CALLS ONLY
   */
  static async getPrivatePools(filters: Omit<PoolFilters, 'isPrivate'> = {}): Promise<PoolWithMetadata[]> {
    try {
      console.log('🔗 Fetching private pools DIRECTLY from contract (NO backend)');
      
      // Fetch all pools and filter for private ones
      const allPools = await PoolContractService.getPools(100, 0);
      const privatePools = allPools.filter(pool => pool.isPrivate);
      
      return privatePools.map(pool => this.enrichPoolData(pool, { isPrivate: true }));
    } catch (error) {
      console.error('❌ Error fetching private pools from contract:', error);
      return [];
    }
  }

  /**
   * Get combo pools - DIRECT CONTRACT CALLS ONLY
   */
  static async getComboPools(filters: PoolFilters = {}): Promise<PoolWithMetadata[]> {
    try {
      console.log('🔗 Fetching combo pools DIRECTLY from contract (NO backend)');
      
      // Fetch all pools and filter for combo pools (pools with multiple conditions)
      const allPools = await PoolContractService.getPools(100, 0);
      const comboPools = allPools.filter(pool => 
        pool.comboConditions && pool.comboConditions.length > 1
      );
      
      return comboPools.map(pool => this.enrichPoolData(pool, { isCombo: true }));
    } catch (error) {
      console.error('❌ Error fetching combo pools from contract:', error);
      return [];
    }
  }

  /**
   * Get single pool - DIRECT CONTRACT CALLS ONLY
   */
  static async getPool(poolId: string): Promise<PoolWithMetadata | null> {
    try {
      console.log('🔗 Fetching pool DIRECTLY from contract (NO backend):', poolId);
      
      const pool = await PoolContractService.getPool(parseInt(poolId));
      if (!pool) return null;
      
      return this.enrichPoolData(pool);
    } catch (error) {
      console.error('❌ Error fetching pool from contract:', error);
      return null;
    }
  }

  /**
   * Get pool stats - DIRECT CONTRACT CALLS ONLY
   */
  static async getPoolStats(poolId: string): Promise<{
    totalBets: number;
    totalVolume: number;
    participants: number;
    averageBet: number;
    fillRate: number;
  } | null> {
    try {
      console.log('🔗 Fetching pool stats DIRECTLY from contract (NO backend):', poolId);
      
      const analytics = await PoolContractService.getPoolAnalytics(parseInt(poolId));
      if (!analytics) return null;
      
      return {
        totalBets: Number(analytics.totalBets || 0),
        totalVolume: Number(analytics.totalVolume || 0),
        participants: Number(analytics.participants || 0),
        averageBet: Number(analytics.averageBet || 0),
        fillRate: Number(analytics.fillRate || 0)
      };
    } catch (error) {
      console.error('❌ Error fetching pool stats from contract:', error);
      return null;
    }
  }

  /**
   * Get pools by category - DIRECT CONTRACT CALLS ONLY
   */
  static async getPoolsByCategory(category: string, filters: Omit<PoolFilters, 'category'> = {}): Promise<PoolWithMetadata[]> {
    try {
      console.log('🔗 Fetching pools by category DIRECTLY from contract (NO backend):', category);
      
      // Fetch all pools and filter by category
      const allPools = await PoolContractService.getPools(100, 0);
      const categoryPools = allPools.filter(pool => 
        pool.category && pool.category.toLowerCase().includes(category.toLowerCase())
      );
      
      return categoryPools.map(pool => this.enrichPoolData(pool));
    } catch (error) {
      console.error('❌ Error fetching pools by category from contract:', error);
      return [];
    }
  }

  /**
   * Search pools - DIRECT CONTRACT CALLS ONLY
   */
  static async searchPools(query: string, filters: PoolFilters = {}): Promise<PoolWithMetadata[]> {
    try {
      console.log('🔗 Searching pools DIRECTLY from contract (NO backend):', query);
      
      // Fetch all pools and search by title, team names, league
      const allPools = await PoolContractService.getPools(100, 0);
      const searchResults = allPools.filter(pool => {
        const searchText = [
          pool.title,
          pool.homeTeam,
          pool.awayTeam,
          pool.league,
          pool.category,
          pool.region
        ].join(' ').toLowerCase();
        
        return searchText.includes(query.toLowerCase());
      });
      
      return searchResults.map(pool => this.enrichPoolData(pool));
    } catch (error) {
      console.error('❌ Error searching pools from contract:', error);
      return [];
    }
  }

  /**
   * Get market metrics - DIRECT CONTRACT CALLS ONLY
   */
  static async getMarketMetrics(): Promise<{
    totalActivePools: number;
    totalVolume24h: number;
    topCategories: { category: string; count: number }[];
    averagePoolSize: number;
  }> {
    try {
      console.log('🔗 Fetching market metrics DIRECTLY from contract (NO backend)');
      
      const allPools = await PoolContractService.getPools(100, 0);
      const activePools = allPools.filter(pool => !pool.settled);
      
      // Calculate metrics
      const totalVolume24h = allPools.reduce((sum, pool) => {
        return sum + parseFloat(pool.creatorStake);
      }, 0);
      
      // Get top categories
      const categoryCounts: { [key: string]: number } = {};
      allPools.forEach(pool => {
        if (pool.category) {
          categoryCounts[pool.category] = (categoryCounts[pool.category] || 0) + 1;
        }
      });
      
      const topCategories = Object.entries(categoryCounts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      const averagePoolSize = allPools.length > 0 
        ? totalVolume24h / allPools.length 
        : 0;
      
      return {
        totalActivePools: activePools.length,
        totalVolume24h,
        topCategories,
        averagePoolSize
      };
    } catch (error) {
      console.error('❌ Error fetching market metrics from contract:', error);
      return {
        totalActivePools: 0,
        totalVolume24h: 0,
        topCategories: [],
        averagePoolSize: 0
      };
    }
  }

  /**
   * Enrich pool data with additional metadata
   */
  private static enrichPoolData(pool: any, metadata: any = {}): PoolWithMetadata {
    return {
      ...pool,
      ...metadata,
      // Add calculated fields
      popularityScore: this.calculatePopularityScore(pool),
      trendingScore: this.calculateTrendingScore(pool),
      boostScore: this.calculateBoostScore(pool)
    };
  }

  /**
   * Calculate popularity score based on stake and activity
   */
  private static calculatePopularityScore(pool: any): number {
    const stake = parseFloat(pool.creatorStake) || 0;
    const isActive = !pool.settled;
    const isRecent = new Date(pool.createdAt || 0) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    let score = stake / 1000; // Base score from stake
    if (isActive) score *= 1.5;
    if (isRecent) score *= 1.2;
    
    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Calculate trending score based on recent activity
   */
  private static calculateTrendingScore(pool: any): number {
    const stake = parseFloat(pool.creatorStake) || 0;
    const isActive = !pool.settled;
    const isRecent = new Date(pool.createdAt || 0) > new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    let score = stake / 2000; // Base score from stake
    if (isActive) score *= 2;
    if (isRecent) score *= 3;
    
    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Calculate boost score based on boost tier
   */
  private static calculateBoostScore(pool: any): number {
    if (!pool.boostTier || pool.boostTier === 'NONE') return 0;
    
    const boostMultipliers = {
      'BRONZE': 1.2,
      'SILVER': 1.5,
      'GOLD': 2.0
    };
    
    return boostMultipliers[pool.boostTier as keyof typeof boostMultipliers] || 0;
  }
}

export default MarketsService;
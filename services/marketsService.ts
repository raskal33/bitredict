import { apiRequest, API_CONFIG } from '@/config/api';

// ============================================================================
// MARKETS SERVICE - Real-time pool and market data integration
// ============================================================================

export interface Pool {
  id: string;
  creator: string;
  odds: number;
  isSettled: boolean;
  creatorSideWon?: boolean;
  isPrivate: boolean;
  usesBitr: boolean;
  oracleType: 'GUIDED' | 'OPEN';
  marketId?: string;
  predictedOutcome?: string;
  actualResult?: string;
  creatorStake: string;
  totalCreatorSideStake: string;
  totalBettorStake: string;
  maxBettorStake?: string;
  eventStartTime?: string;
  eventEndTime?: string;
  bettingEndTime?: string;
  league?: string;
  category?: string;
  region?: string;
  maxBetPerUser?: string;
  totalVolume: number;
  participantCount: number;
  fillPercentage: number;
  creationTime: string;
  settledAt?: string;
}

export interface PoolWithMetadata extends Pool {
  // Additional frontend-specific metadata
  shortAddress: string;
  timeRemaining?: number;
  status: 'active' | 'settled' | 'expired';
  difficulty?: 'easy' | 'medium' | 'hard';
  trending?: boolean;
  boosted?: boolean;
  boost?: {
    tier: 'bronze' | 'silver' | 'gold';
    expiry: string;
  };
}

export interface PoolsResponse {
  success: boolean;
  data: {
    pools: Pool[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface PoolFilters {
  category?: string;
  isPrivate?: boolean;
  usesBitr?: boolean;
  oracleType?: 'GUIDED' | 'OPEN';
  status?: 'active' | 'settled';
  minVolume?: number;
  maxVolume?: number;
  sortBy?: 'newest' | 'volume' | 'participants' | 'ending_soon';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export class MarketsService {
  private static baseURL = API_CONFIG.endpoints.pools || '/api/pools';

  /**
   * Helper to serialize filters to URLSearchParams
   */
  private static serializeFilters(filters: Record<string, any>): URLSearchParams {
    return new URLSearchParams(
      Object.fromEntries(
        Object.entries(filters)
          .filter(([_, value]) => value !== undefined && value !== null)
          .map(([key, value]) => [key, String(value)])
      )
    );
  }

  /**
   * Get all pools with filtering and sorting
   */
  static async getAllPools(filters: PoolFilters = {}): Promise<{
    pools: PoolWithMetadata[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const params = new URLSearchParams();
    
    // Add filters to query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiRequest<PoolsResponse>(
      `${this.baseURL}?${params.toString()}`
    );

    const pools = response.data.pools.map(pool => this.enrichPoolData(pool));
    
    return {
      pools,
      pagination: response.data.pagination
    };
  }

  /**
   * Get boosted pools
   */
  static async getBoostedPools(filters: Omit<PoolFilters, 'sortBy'> = {}): Promise<PoolWithMetadata[]> {
    const response = await apiRequest<PoolsResponse>(
      `${this.baseURL}/boosted?` + new URLSearchParams(
        Object.fromEntries(
          Object.entries({
            ...filters,
            limit: (filters.limit || 20).toString()
          })
          .filter(([_, value]) => value !== undefined && value !== null)
          .map(([key, value]) => [key, String(value)])
        )
      ).toString()
    );

    return response.data.pools.map(pool => this.enrichPoolData(pool, { boosted: true }));
  }

  /**
   * Get trending pools
   */
  static async getTrendingPools(filters: Omit<PoolFilters, 'sortBy'> = {}): Promise<PoolWithMetadata[]> {
    const response = await apiRequest<PoolsResponse>(
      `${this.baseURL}/trending?` + this.serializeFilters({
        ...filters,
        limit: (filters.limit || 20).toString()
      }).toString()
    );

    return response.data.pools.map(pool => this.enrichPoolData(pool, { trending: true }));
  }

  /**
   * Get private pools (requires authentication)
   */
  static async getPrivatePools(filters: Omit<PoolFilters, 'isPrivate'> = {}): Promise<PoolWithMetadata[]> {
    const response = await apiRequest<PoolsResponse>(
      `${this.baseURL}/private?` + this.serializeFilters({
        ...filters,
        limit: (filters.limit || 20).toString()
      }).toString()
    );

    return response.data.pools.map(pool => this.enrichPoolData(pool, { isPrivate: true }));
  }

  /**
   * Get combo pools (multi-condition pools)
   */
  static async getComboPools(filters: PoolFilters = {}): Promise<PoolWithMetadata[]> {
    const response = await apiRequest<PoolsResponse>(
      `${this.baseURL}/combo?` + this.serializeFilters({
        ...filters,
        limit: (filters.limit || 20).toString()
      }).toString()
    );

    return response.data.pools.map(pool => this.enrichPoolData(pool));
  }

  /**
   * Get a specific pool by ID
   */
  static async getPool(poolId: string): Promise<PoolWithMetadata | null> {
    try {
      const response = await apiRequest<{ success: boolean; data: Pool }>(
        `${this.baseURL}/${poolId}`
      );
      
      return this.enrichPoolData(response.data);
    } catch (error) {
      console.error('Error fetching pool:', error);
      return null;
    }
  }

  /**
   * Get pool statistics
   */
  static async getPoolStats(poolId: string): Promise<{
    totalBets: number;
    totalVolume: number;
    participants: number;
    recentActivity: any[];
  } | null> {
    try {
      const response = await apiRequest<{
        success: boolean;
        data: {
          totalBets: number;
          totalVolume: number;
          participants: number;
          recentActivity: any[];
        };
      }>(`${this.baseURL}/${poolId}/stats`);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching pool stats:', error);
      return null;
    }
  }

  /**
   * Get pools by category
   */
  static async getPoolsByCategory(category: string, filters: Omit<PoolFilters, 'category'> = {}): Promise<PoolWithMetadata[]> {
    const response = await apiRequest<PoolsResponse>(
      `${this.baseURL}/category/${category}?` + this.serializeFilters({
        ...filters,
        limit: (filters.limit || 20).toString()
      }).toString()
    );

    return response.data.pools.map(pool => this.enrichPoolData(pool));
  }

  /**
   * Search pools by text query
   */
  static async searchPools(query: string, filters: PoolFilters = {}): Promise<PoolWithMetadata[]> {
    const response = await apiRequest<PoolsResponse>(
      `${this.baseURL}/search?` + this.serializeFilters({
        q: query,
        ...filters,
        limit: (filters.limit || 20).toString()
      }).toString()
    );

    return response.data.pools.map(pool => this.enrichPoolData(pool));
  }

  /**
   * Enrich pool data with frontend-specific metadata
   */
  private static enrichPoolData(pool: Pool, overrides: Partial<PoolWithMetadata> = {}): PoolWithMetadata {
    const now = new Date().getTime();
    const eventEndTime = pool.eventEndTime ? new Date(pool.eventEndTime).getTime() : null;
    const bettingEndTime = pool.bettingEndTime ? new Date(pool.bettingEndTime).getTime() : null;
    
    let status: 'active' | 'settled' | 'expired' = 'active';
    if (pool.isSettled) {
      status = 'settled';
    } else if (bettingEndTime && now > bettingEndTime) {
      status = 'expired';
    }

    const timeRemaining = bettingEndTime ? Math.max(0, bettingEndTime - now) : undefined;

    // Determine difficulty based on various factors
    let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
    if (pool.fillPercentage > 80) {
      difficulty = 'easy';
    } else if (pool.fillPercentage < 30 || pool.odds > 300) {
      difficulty = 'hard';
    }

    return {
      ...pool,
      shortAddress: `${pool.creator.slice(0, 6)}...${pool.creator.slice(-4)}`,
      timeRemaining,
      status,
      difficulty,
      trending: false,
      boosted: false,
      ...overrides
    };
  }

  /**
   * Get real-time market metrics
   */
  static async getMarketMetrics(): Promise<{
    totalActivePools: number;
    totalVolume24h: number;
    topCategories: { category: string; count: number }[];
    averagePoolSize: number;
  }> {
    try {
      const response = await apiRequest<{
        success: boolean;
        data: {
          totalActivePools: number;
          totalVolume24h: number;
          topCategories: { category: string; count: number }[];
          averagePoolSize: number;
        };
      }>(`${this.baseURL}/metrics`);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching market metrics:', error);
      return {
        totalActivePools: 0,
        totalVolume24h: 0,
        topCategories: [],
        averagePoolSize: 0
      };
    }
  }
}

export default MarketsService; 
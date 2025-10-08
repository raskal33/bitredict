/**
 * Optimized Pool Service
 * Uses backend API for fast data fetching with contract fallback
 */

import { PoolService } from './poolService';
import { PoolContractService } from './poolContractService';

export interface OptimizedPool {
  id: number;
  title: string;
  category: string;
  creator: {
    address: string;
    username: string;
    successRate: number;
    totalPools: number;
    totalVolume: number;
    badges: string[];
  };
  odds: number;
  creatorStake: string;
  totalBettorStake: string;
  maxPoolSize: string;
  fillPercentage: number;
  participants: number;
  eventStartTime: number;
  eventEndTime: number;
  bettingEndTime: number;
  status: 'active' | 'closed' | 'settled';
  currency: 'BITR' | 'STT';
  boostTier: 'NONE' | 'BRONZE' | 'SILVER' | 'GOLD';
  trending: boolean;
  socialStats: {
    likes: number;
    comments: number;
    views: number;
  };
  timeLeft: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  };
  canBet: boolean;
  isEventStarted: boolean;
  isPoolFilled: boolean;
  homeTeam?: string;
  awayTeam?: string;
  league?: string;
  predictedOutcome?: string;
  marketType?: number;
  oracleType?: number;
}

export interface PoolProgress {
  poolId: number;
  fillPercentage: number;
  totalBettorStake: string;
  maxPoolSize: string;
  participants: number;
  lastUpdated: number;
}

export interface RecentBet {
  id: string;
  poolId: number;
  bettor: string;
  amount: string;
  isForOutcome: boolean;
  timestamp: number;
  poolTitle: string;
  category: string;
  league: string;
}

export interface Analytics {
  totalPools: number;
  activePools: number;
  settledPools: number;
  totalVolume: string;
  bitrVolume: string;
  sttVolume: string;
  participants: number;
  boostedPools: number;
  trendingPools: number;
}

export interface PoolFilters {
  category?: 'all' | 'football' | 'crypto' | 'basketball' | 'other';
  status?: 'all' | 'active' | 'closed' | 'settled';
  sortBy?: 'newest' | 'oldest' | 'volume' | 'ending-soon';
  limit?: number;
  offset?: number;
}

class OptimizedPoolService {
  private baseUrl: string;
  private fallbackEnabled: boolean = true;
  private retryAttempts: number = 3;
  private retryDelay: number = 1000;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'https://bitredict-backend.fly.dev') {
    // Append /api/optimized-pools if not already included
    this.baseUrl = baseUrl.includes('/api/optimized-pools') 
      ? baseUrl 
      : `${baseUrl}/api/optimized-pools`;
  }

  /**
   * Fetch pools with filters - uses backend API with contract fallback
   */
  async getPools(filters: PoolFilters = {}): Promise<{ pools: OptimizedPool[]; stats: Analytics }> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await this.fetchWithRetry(`${this.baseUrl}/pools?${params}`);
      
      if (response.success) {
        return {
          pools: response.data.pools,
          stats: response.data.stats
        };
      }
      
      throw new Error(response.error || 'Failed to fetch pools');
    } catch (error) {
      console.warn('Backend API failed, falling back to contract calls:', error);
      
      if (this.fallbackEnabled) {
        return this.getPoolsFromContract(filters);
      }
      
      throw error;
    }
  }

  /**
   * Get individual pool details - uses backend API with contract fallback
   */
  async getPool(poolId: number): Promise<OptimizedPool> {
    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/pools/${poolId}`);
      
      if (response.success) {
        return response.data.pool;
      }
      
      throw new Error(response.error || 'Failed to fetch pool');
    } catch (error) {
      console.warn('Backend API failed for pool', poolId, ', falling back to contract:', error);
      
      if (this.fallbackEnabled) {
        return this.getPoolFromContract(poolId);
      }
      
      throw error;
    }
  }

  /**
   * Get real-time pool progress - uses backend API with contract fallback
   */
  async getPoolProgress(poolId: number): Promise<PoolProgress> {
    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/pools/${poolId}/progress`);
      
      if (response.success) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to fetch progress');
    } catch (error) {
      console.warn('Backend API failed for progress', poolId, ', falling back to contract:', error);
      
      if (this.fallbackEnabled) {
        return this.getPoolProgressFromContract(poolId);
      }
      
      throw error;
    }
  }

  /**
   * Get recent bets - uses backend API with contract fallback
   */
  async getRecentBets(limit: number = 20): Promise<RecentBet[]> {
    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/recent-bets?limit=${limit}`);
      
      if (response.success) {
        return response.data.bets;
      }
      
      throw new Error(response.error || 'Failed to fetch recent bets');
    } catch (error) {
      console.warn('Backend API failed for recent bets, falling back to contract:', error);
      
      if (this.fallbackEnabled) {
        return this.getRecentBetsFromContract(limit);
      }
      
      throw error;
    }
  }

  /**
   * Get analytics - uses backend API with contract fallback
   */
  async getAnalytics(): Promise<Analytics> {
    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/analytics`);
      
      if (response.success) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to fetch analytics');
    } catch (error) {
      console.warn('Backend API failed for analytics, falling back to contract:', error);
      
      if (this.fallbackEnabled) {
        return this.getAnalyticsFromContract();
      }
      
      throw error;
    }
  }

  /**
   * Fetch with retry logic
   */
  private async fetchWithRetry(url: string, retries: number = this.retryAttempts): Promise<any> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // Add timeout
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.warn(`Attempt ${i + 1} failed for ${url}:`, error);
        
        if (i === retries - 1) {
          throw error;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * Math.pow(2, i)));
      }
    }
  }

  /**
   * Fallback: Get pools from contract
   */
  private async getPoolsFromContract(filters: PoolFilters): Promise<{ pools: OptimizedPool[]; stats: Analytics }> {
    console.log('Using contract fallback for pools');
    
    try {
      const pools = await PoolContractService.getPools();
      const stats = await PoolContractService.getPoolStats();
      
      // Transform contract data to OptimizedPool format
      const optimizedPools: OptimizedPool[] = pools.map(pool => this.transformPoolData(pool));
      
      // Apply filters
      let filteredPools = optimizedPools;
      
      if (filters.category && filters.category !== 'all') {
        filteredPools = filteredPools.filter(pool => 
          pool.category.toLowerCase() === filters.category
        );
      }
      
      if (filters.status && filters.status !== 'all') {
        filteredPools = filteredPools.filter(pool => 
          pool.status === filters.status
        );
      }
      
      // Apply sorting
      if (filters.sortBy) {
        filteredPools = this.sortPools(filteredPools, filters.sortBy);
      }
      
      // Apply pagination
      if (filters.limit) {
        filteredPools = filteredPools.slice(filters.offset || 0, (filters.offset || 0) + filters.limit);
      }
      
      return {
        pools: filteredPools,
        stats: this.transformStatsData(stats)
      };
    } catch (error) {
      console.error('Contract fallback failed:', error);
      throw error;
    }
  }

  /**
   * Fallback: Get individual pool from contract
   */
  private async getPoolFromContract(poolId: number): Promise<OptimizedPool> {
    console.log('Using contract fallback for pool', poolId);
    
    try {
      const pool = await PoolContractService.getPool(poolId);
      return this.transformPoolData(pool);
    } catch (error) {
      console.error('Contract fallback failed for pool', poolId, error);
      throw error;
    }
  }

  /**
   * Fallback: Get pool progress from contract
   */
  private async getPoolProgressFromContract(poolId: number): Promise<PoolProgress> {
    console.log('Using contract fallback for progress', poolId);
    
    try {
      const pool = await PoolContractService.getPool(poolId);
      const fillPercentage = (parseFloat(pool.totalBettorStake) / parseFloat(pool.maxBettorStake)) * 100;
      
      return {
        poolId,
        fillPercentage,
        totalBettorStake: pool.totalBettorStake,
        maxPoolSize: pool.maxBettorStake,
        participants: pool.bettorCount || 0,
        lastUpdated: Date.now() / 1000
      };
    } catch (error) {
      console.error('Contract fallback failed for progress', poolId, error);
      throw error;
    }
  }

  /**
   * Fallback: Get recent bets from contract
   */
  private async getRecentBetsFromContract(limit: number): Promise<RecentBet[]> {
    console.log('Using contract fallback for recent bets');
    
    try {
      // This would need to be implemented in PoolContractService
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Contract fallback failed for recent bets', error);
      throw error;
    }
  }

  /**
   * Fallback: Get analytics from contract
   */
  private async getAnalyticsFromContract(): Promise<Analytics> {
    console.log('Using contract fallback for analytics');
    
    try {
      const stats = await PoolContractService.getPoolStats();
      return this.transformStatsData(stats);
    } catch (error) {
      console.error('Contract fallback failed for analytics', error);
      throw error;
    }
  }

  /**
   * Transform contract pool data to OptimizedPool format
   */
  private transformPoolData(pool: any): OptimizedPool {
    const now = Date.now() / 1000;
    const eventStartTime = pool.eventStartTime;
    const eventEndTime = pool.eventEndTime;
    const bettingEndTime = pool.bettingEndTime;
    
    // Calculate time left
    const timeLeft = this.calculateTimeLeft(eventEndTime, now);
    
    // Determine status
    const status = this.determinePoolStatus(pool, now);
    
    // Calculate fill percentage
    const fillPercentage = (parseFloat(pool.totalBettorStake) / parseFloat(pool.maxBettorStake)) * 100;
    
    return {
      id: pool.id,
      title: pool.title || `Pool #${pool.id}`,
      category: pool.category || 'Sports',
      creator: {
        address: pool.creator,
        username: `User${pool.creator.slice(0, 6)}`,
        successRate: 0, // Would need to calculate from historical data
        totalPools: 0, // Would need to count from contract
        totalVolume: 0, // Would need to sum from contract
        badges: []
      },
      odds: pool.odds / 100, // Convert from basis points
      creatorStake: pool.creatorStake,
      totalBettorStake: pool.totalBettorStake,
      maxPoolSize: pool.maxBettorStake,
      fillPercentage,
      participants: pool.bettorCount || 0,
      eventStartTime,
      eventEndTime,
      bettingEndTime,
      status,
      currency: pool.usesBitr ? 'BITR' : 'STT',
      boostTier: 'NONE', // Would need to check boost status
      trending: false, // Would need to determine from activity
      socialStats: {
        likes: 0,
        comments: 0,
        views: 0
      },
      timeLeft,
      canBet: now < bettingEndTime && !pool.settled,
      isEventStarted: now >= eventStartTime,
      isPoolFilled: fillPercentage >= 100,
      homeTeam: pool.homeTeam,
      awayTeam: pool.awayTeam,
      league: pool.league,
      predictedOutcome: pool.predictedOutcome,
      marketType: pool.marketType,
      oracleType: pool.oracleType
    };
  }

  /**
   * Transform contract stats to Analytics format
   */
  private transformStatsData(stats: any): Analytics {
    return {
      totalPools: stats.totalPools || 0,
      activePools: stats.activePools || 0,
      settledPools: stats.settledPools || 0,
      totalVolume: stats.totalVolume || '0',
      bitrVolume: stats.bitrVolume || '0',
      sttVolume: stats.sttVolume || '0',
      participants: stats.participants || 0,
      boostedPools: 0, // Would need to count from contract
      trendingPools: 0 // Would need to determine from activity
    };
  }

  /**
   * Calculate time left until event ends
   */
  private calculateTimeLeft(eventEndTime: number, now: number): { days: number; hours: number; minutes: number; seconds: number } {
    const timeLeft = Math.max(0, eventEndTime - now);
    
    const days = Math.floor(timeLeft / 86400);
    const hours = Math.floor((timeLeft % 86400) / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = Math.floor(timeLeft % 60);
    
    return { days, hours, minutes, seconds };
  }

  /**
   * Determine pool status based on timestamps and settlement
   */
  private determinePoolStatus(pool: any, now: number): 'active' | 'closed' | 'settled' {
    if (pool.settled) {
      return 'settled';
    }
    
    if (now >= pool.eventEndTime) {
      return 'closed';
    }
    
    return 'active';
  }

  /**
   * Sort pools based on sort criteria
   */
  private sortPools(pools: OptimizedPool[], sortBy: string): OptimizedPool[] {
    switch (sortBy) {
      case 'newest':
        return pools.sort((a, b) => b.id - a.id);
      case 'oldest':
        return pools.sort((a, b) => a.id - b.id);
      case 'volume':
        return pools.sort((a, b) => parseFloat(b.totalBettorStake) - parseFloat(a.totalBettorStake));
      case 'ending-soon':
        return pools.sort((a, b) => a.eventEndTime - b.eventEndTime);
      default:
        return pools;
    }
  }

  /**
   * Enable/disable fallback to contract calls
   */
  setFallbackEnabled(enabled: boolean): void {
    this.fallbackEnabled = enabled;
  }

  /**
   * Set retry configuration
   */
  setRetryConfig(attempts: number, delay: number): void {
    this.retryAttempts = attempts;
    this.retryDelay = delay;
  }
}

export const optimizedPoolService = new OptimizedPoolService();
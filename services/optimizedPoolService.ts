/**
 * Optimized Pool Service with Caching
 * Direct contract calls with intelligent caching for better performance
 */

import { PoolContractService } from './poolContractService';
import { PoolExplanationService } from './poolExplanationService';

export interface OptimizedPool {
  id: string;
  title: string;
  description: string;
  category: string;
  creator: {
    address: string;
    username: string;
    avatar: string;
    reputation: number;
    totalPools: number;
    successRate: number;
    challengeScore: number;
    totalVolume: number;
    badges: string[];
    createdAt: string;
    bio: string;
  };
  challengeScore: number;
  qualityScore: number;
  difficultyTier: string;
  predictedOutcome: string;
  creatorPrediction: string;
  odds: number;
  participants: number;
  volume: number;
  image: string;
  cardTheme: string;
  tags: string[];
  trending: boolean;
  boosted: boolean;
  boostTier: number;
  socialStats: {
    comments: number;
    likes: number;
    views: number;
    shares: number;
  };
  defeated: number;
  currency: string;
  endDate: string;
  poolType: string;
  comments: any[];
  eventDetails: {
    league: string;
    region: string;
    venue: string;
    startTime: Date;
    endTime: Date;
  };
  settled: boolean;
  creatorSideWon: boolean | null;
  bettingEndTime: number;
  indexedData?: {
    participantCount: number;
    fillPercentage: number;
    totalVolume: number;
    betCount: number;
    avgBetSize: string;
    creatorReputation: number;
    categoryRank: number;
    isHot: boolean;
    lastActivity: Date;
  };
}

export interface OptimizedStats {
  totalVolume: string;
  bitrVolume: string;
  sttVolume: string;
  activeMarkets: number;
  participants: number;
  totalPools: number;
  boostedPools: number;
  comboPools: number;
  privatePools: number;
}

// Cache configuration
const CACHE_DURATION = 30000; // 30 seconds
const MAX_CACHE_SIZE = 100;

interface CacheEntry {
  data: any;
  timestamp: number;
  hits: number;
}

class OptimizedPoolService {
  private static cache = new Map<string, CacheEntry>();
  private static lastStatsUpdate = 0;
  private static cachedStats: OptimizedStats | null = null;

  /**
   * Get cache key for a request
   */
  private static getCacheKey(endpoint: string, params: any = {}): string {
    return `${endpoint}_${JSON.stringify(params)}`;
  }

  /**
   * Check if cache entry is valid
   */
  private static isCacheValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < CACHE_DURATION;
  }

  /**
   * Clean expired cache entries
   */
  private static cleanCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get data from cache or fetch fresh
   */
  private static async getCachedData<T>(
    cacheKey: string,
    fetchFn: () => Promise<T>,
    forceRefresh = false
  ): Promise<T> {
    // Clean expired entries
    this.cleanCache();

    // Check cache first
    if (!forceRefresh) {
      const cached = this.cache.get(cacheKey);
      if (cached && this.isCacheValid(cached)) {
        cached.hits++;
        console.log(`🎯 Cache hit for ${cacheKey} (${cached.hits} hits)`);
        return cached.data;
      }
    }

    // Fetch fresh data
    console.log(`🔄 Fetching fresh data for ${cacheKey}`);
    const data = await fetchFn();
    
    // Store in cache
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      hits: 0
    });

    // Limit cache size
    if (this.cache.size > MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    return data;
  }

  /**
   * Get all pools with caching
   */
  static async getPools(limit = 50, offset = 0, forceRefresh = false): Promise<OptimizedPool[]> {
    const cacheKey = this.getCacheKey('pools', { limit, offset });
    
    return this.getCachedData(cacheKey, async () => {
      console.log('📊 Fetching pools from contract...');
      const rawPools = await PoolContractService.getPools(limit, offset);
      
      return rawPools.map(pool => this.transformPool(pool));
    }, forceRefresh);
  }

  /**
   * Get pool stats with caching
   */
  static async getStats(forceRefresh = false): Promise<OptimizedStats> {
    const cacheKey = 'stats';
    
    return this.getCachedData(cacheKey, async () => {
      console.log('📈 Fetching pool stats...');
      const stats = await PoolContractService.getPoolStats();
      
      return {
        totalVolume: this.formatVolume(stats.totalVolume),
        bitrVolume: this.formatVolume(stats.bitrVolume || "0"),
        sttVolume: this.formatVolume(stats.sttVolume || "0"),
        activeMarkets: stats.activeMarkets,
        participants: stats.participants,
        totalPools: stats.totalPools,
        boostedPools: stats.boostedPools || 0,
        comboPools: stats.comboPools || 0,
        privatePools: stats.privatePools || 0
      };
    }, forceRefresh);
  }

  /**
   * Transform raw pool data to optimized format
   */
  private static transformPool(pool: any): OptimizedPool {
    const stakeAmount = parseFloat(pool.creatorStake || "0") / 1e18;
    const usesBitr = stakeAmount >= 1000;
    
    // Generate explanation for standardized content
    const explanationData = {
      id: pool.poolId.toString(),
      homeTeam: pool.homeTeam || 'Home Team',
      awayTeam: pool.awayTeam || 'Away Team',
      league: pool.league || 'Unknown League',
      category: pool.category || 'sports',
      region: pool.region || 'Global',
      predictedOutcome: pool.predictedOutcome,
      odds: pool.odds,
      marketType: pool.marketType || 0,
      eventStartTime: parseInt(pool.eventStartTime),
      eventEndTime: parseInt(pool.eventEndTime),
      usesBitr,
      creatorStake: pool.creatorStake
    };

    const explanation = PoolExplanationService.generateExplanation(explanationData);

    return {
      id: pool.poolId.toString(),
      title: explanation.title,
      description: explanation.description,
      category: pool.category || "sports",
      creator: {
        address: pool.creator,
        username: `${pool.creator.slice(0, 6)}...${pool.creator.slice(-4)}`,
        avatar: "/logo.png",
        reputation: 4.2,
        totalPools: 12,
        successRate: 73.5,
        challengeScore: Math.round(pool.odds * 20),
        totalVolume: stakeAmount,
        badges: ["verified", "active_creator"],
        createdAt: new Date().toISOString(),
        bio: "Active prediction market creator"
      },
      challengeScore: Math.round(pool.odds * 20),
      qualityScore: 88,
      difficultyTier: this.getDifficultyTier(pool.odds),
      predictedOutcome: pool.predictedOutcome,
      creatorPrediction: "no",
      odds: pool.odds,
      participants: 0, // Will be updated by real-time data
      volume: parseFloat(pool.totalBettorStake || "0") / 1e18,
      image: pool.category === "football" ? "⚽" : pool.category === "basketball" ? "🏀" : "🎯",
      cardTheme: pool.category === "football" ? "green" : pool.category === "basketball" ? "orange" : "purple",
      tags: [pool.category, pool.league, pool.region].filter(Boolean),
      trending: false,
      boosted: false,
      boostTier: 0,
      socialStats: {
        comments: 0,
        likes: Math.floor(Math.random() * 20),
        views: Math.floor(Math.random() * 100),
        shares: Math.floor(Math.random() * 5)
      },
      defeated: 0,
      currency: usesBitr ? "BITR" : "STT",
      endDate: pool.eventEndTime ? new Date(parseInt(pool.eventEndTime) * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      poolType: "single",
      comments: [],
      eventDetails: {
        league: pool.league,
        region: pool.region,
        venue: "TBD",
        startTime: new Date(parseInt(pool.eventStartTime) * 1000),
        endTime: new Date(parseInt(pool.eventEndTime) * 1000)
      },
      settled: pool.settled || false,
      creatorSideWon: pool.creatorSideWon,
      bettingEndTime: parseInt(pool.bettingEndTime || "0")
    };
  }

  /**
   * Format volume to human-readable format
   */
  private static formatVolume(volume: string): string {
    const num = parseFloat(volume);
    if (num === 0) return "0";
    if (num >= 1e21) return `${(num / 1e21).toFixed(1)}K BITR`;
    if (num >= 1e18) return `${(num / 1e18).toFixed(1)} BITR`;
    if (num >= 1e15) return `${(num / 1e15).toFixed(1)}M STT`;
    if (num >= 1e12) return `${(num / 1e12).toFixed(1)}K STT`;
    return num.toFixed(2);
  }

  /**
   * Get difficulty tier based on odds
   */
  private static getDifficultyTier(odds: number): string {
    if (odds >= 5.0) return "legendary";
    if (odds >= 3.0) return "very_hard";
    if (odds >= 2.0) return "hard";
    if (odds >= 1.5) return "medium";
    return "easy";
  }

  /**
   * Clear all cache
   */
  static clearCache(): void {
    this.cache.clear();
    this.cachedStats = null;
    console.log('🗑️ Cache cleared');
  }

  /**
   * Get cache stats
   */
  static getCacheStats(): { size: number; hits: number } {
    let totalHits = 0;
    for (const entry of this.cache.values()) {
      totalHits += entry.hits;
    }
    return {
      size: this.cache.size,
      hits: totalHits
    };
  }
}

export default OptimizedPoolService;

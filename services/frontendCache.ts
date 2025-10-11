/**
 * Frontend Cache Service
 * Prevents excessive API calls across all pages with intelligent caching
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheConfig {
  defaultTTL: number; // Time to live in milliseconds
  maxSize: number; // Maximum cache entries
}

class FrontendCacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private config: CacheConfig = {
    defaultTTL: 60000, // 1 minute default
    maxSize: 1000 // Max 1000 entries
  };

  // Cache durations for different data types
  private readonly CACHE_DURATIONS = {
    // Fast-changing data
    recentBets: 30000,        // 30 seconds
    poolProgress: 30000,      // 30 seconds
    
    // Medium-changing data
    poolList: 60000,          // 1 minute
    poolDetails: 60000,       // 1 minute
    userBets: 60000,          // 1 minute
    
    // Slow-changing data
    analytics: 300000,        // 5 minutes
    poolStates: 30000,        // 30 seconds (settlement status)
    
    // Very slow-changing data
    poolMetadata: 600000,     // 10 minutes (titles, descriptions)
    userProfiles: 300000,     // 5 minutes
  };

  /**
   * Get cached data or execute fetcher function
   */
  async get<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttl?: number
  ): Promise<T> {
    const now = Date.now();
    const cached = this.cache.get(key);

    // Return cached data if still valid
    if (cached && now < cached.expiresAt) {
      console.log(`🎯 Cache HIT for ${key}`);
      return cached.data;
    }

    console.log(`🚀 Cache MISS for ${key} - fetching...`);

    try {
      // Fetch new data
      const data = await fetcher();
      
      // Store in cache
      const cacheTTL = ttl || this.getCacheDuration(key);
      this.set(key, data, cacheTTL);
      
      return data;
    } catch (error) {
      // If we have stale cached data, return it as fallback
      if (cached) {
        console.warn(`⚠️ Using stale cache for ${key} due to fetch error:`, error);
        return cached.data;
      }
      throw error;
    }
  }

  /**
   * Set cache entry
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Ensure cache doesn't exceed max size
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    const cacheTTL = ttl || this.config.defaultTTL;
    const now = Date.now();

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + cacheTTL
    });
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    const now = Date.now();
    if (now >= cached.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Delete specific cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache duration based on key pattern
   */
  private getCacheDuration(key: string): number {
    for (const [pattern, duration] of Object.entries(this.CACHE_DURATIONS)) {
      if (key.includes(pattern)) {
        return duration;
      }
    }
    return this.config.defaultTTL;
  }

  /**
   * Evict oldest cache entries
   */
  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    hitRate: number;
    entries: { key: string; age: number; ttl: number }[];
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
      ttl: entry.expiresAt - entry.timestamp
    }));

    return {
      size: this.cache.size,
      hitRate: 0, // Would need to track hits/misses for accurate calculation
      entries
    };
  }

  /**
   * Prefetch data for common routes
   */
  async prefetchCommonData(): Promise<void> {
    try {
      // Import services dynamically to avoid circular dependencies
      const { optimizedPoolService } = await import('./optimizedPoolService');
      
      // Prefetch analytics (used on home page)
      await this.get('analytics', () => optimizedPoolService.getAnalytics());
      
      // Prefetch recent pools (used on home and markets)
      await this.get('poolList:recent:12', () => 
        optimizedPoolService.getPools({ limit: 12, sortBy: 'newest' })
      );
      
      // Prefetch recent bets (used on multiple pages)
      await this.get('recentBets:20', () => 
        optimizedPoolService.getRecentBets(20)
      );
      
      console.log('✅ Common data prefetched successfully');
    } catch (error) {
      console.warn('⚠️ Prefetch failed:', error);
    }
  }

  /**
   * Generate cache key for pool-related data
   */
  getPoolKey(operation: string, poolId?: number, params?: Record<string, any>): string {
    const baseKey = poolId ? `pool:${poolId}:${operation}` : `pools:${operation}`;
    
    if (params) {
      const paramString = Object.entries(params)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}:${value}`)
        .join('|');
      return `${baseKey}:${paramString}`;
    }
    
    return baseKey;
  }

  /**
   * Invalidate related cache entries when pool data changes
   */
  invalidatePoolCache(poolId: number): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.includes(`pool:${poolId}`) || key.includes('pools:') || key.includes('recentBets')) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`🗑️ Invalidated ${keysToDelete.length} cache entries for pool ${poolId}`);
  }
}

// Export singleton instance
export const frontendCache = new FrontendCacheService();

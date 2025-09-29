import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import MarketsService, { PoolWithMetadata, PoolFilters } from '@/services/marketsService';

// ============================================================================
// MARKETS HOOKS - Real-time pool and market data integration
// ============================================================================

export interface UseMarketsOptions extends PoolFilters {
  enabled?: boolean;
  refetchInterval?: number;
}

/**
 * Hook for all pools with filtering and pagination
 */
export function useAllPools(options: UseMarketsOptions = {}) {
  const { enabled = true, refetchInterval = 30000, ...filters } = options;

  return useQuery({
    queryKey: ['markets', 'all-pools', filters],
    queryFn: () => MarketsService.getAllPools(filters),
    enabled,
    refetchInterval, // Refetch every 30 seconds
    staleTime: 20000,
    gcTime: 300000,
  });
}

/**
 * Hook for boosted pools
 */
export function useBoostedPools(options: Omit<UseMarketsOptions, 'sortBy'> = {}) {
  const { enabled = true, refetchInterval = 60000, ...filters } = options;

  return useQuery({
    queryKey: ['markets', 'boosted-pools', filters],
    queryFn: () => MarketsService.getBoostedPools(filters),
    enabled,
    refetchInterval, // Refetch every minute
    staleTime: 30000,
    gcTime: 300000,
  });
}

/**
 * Hook for trending pools
 */
export function useTrendingPools(options: Omit<UseMarketsOptions, 'sortBy'> = {}) {
  const { enabled = true, refetchInterval = 30000, ...filters } = options;

  return useQuery({
    queryKey: ['markets', 'trending-pools', filters],
    queryFn: () => MarketsService.getTrendingPools(filters),
    enabled,
    refetchInterval, // Refetch every 30 seconds (trending changes fast)
    staleTime: 15000,
    gcTime: 300000,
  });
}

/**
 * Hook for private pools
 */
export function usePrivatePools(options: Omit<UseMarketsOptions, 'isPrivate'> = {}) {
  const { enabled = true, refetchInterval = 60000, ...filters } = options;

  return useQuery({
    queryKey: ['markets', 'private-pools', filters],
    queryFn: () => MarketsService.getPrivatePools(filters),
    enabled,
    refetchInterval, // Refetch every minute
    staleTime: 30000,
    gcTime: 300000,
  });
}

/**
 * Hook for combo pools
 */
export function useComboPools(options: UseMarketsOptions = {}) {
  const { enabled = true, refetchInterval = 60000, ...filters } = options;

  return useQuery({
    queryKey: ['markets', 'combo-pools', filters],
    queryFn: () => MarketsService.getComboPools(filters),
    enabled,
    refetchInterval, // Refetch every minute
    staleTime: 30000,
    gcTime: 300000,
  });
}

/**
 * Hook for a specific pool with real-time updates
 */
export function usePool(poolId: string, options: { enabled?: boolean; refetchInterval?: number } = {}) {
  const { enabled = true, refetchInterval = 30000 } = options;

  return useQuery({
    queryKey: ['markets', 'pool', poolId],
    queryFn: () => MarketsService.getPool(poolId),
    enabled: enabled && !!poolId,
    refetchInterval, // Refetch every 30 seconds
    staleTime: 15000,
    gcTime: 300000,
  });
}

/**
 * Hook for pool statistics with real-time updates
 */
export function usePoolStats(poolId: string, options: { enabled?: boolean; refetchInterval?: number } = {}) {
  const { enabled = true, refetchInterval = 15000 } = options;

  return useQuery({
    queryKey: ['markets', 'pool-stats', poolId],
    queryFn: () => MarketsService.getPoolStats(poolId),
    enabled: enabled && !!poolId,
    refetchInterval, // Refetch every 15 seconds (stats change frequently)
    staleTime: 10000,
    gcTime: 300000,
  });
}

/**
 * Hook for pools by category
 */
export function usePoolsByCategory(category: string, options: Omit<UseMarketsOptions, 'category'> = {}) {
  const { enabled = true, refetchInterval = 60000, ...filters } = options;

  return useQuery({
    queryKey: ['markets', 'pools-by-category', category, filters],
    queryFn: () => MarketsService.getPoolsByCategory(category, filters),
    enabled: enabled && !!category,
    refetchInterval, // Refetch every minute
    staleTime: 30000,
    gcTime: 300000,
  });
}

/**
 * Hook for pool search
 */
export function usePoolSearch(query: string, options: UseMarketsOptions = {}) {
  const { enabled = true, refetchInterval = 120000, ...filters } = options;

  return useQuery({
    queryKey: ['markets', 'pool-search', query, filters],
    queryFn: () => MarketsService.searchPools(query, filters),
    enabled: enabled && !!query && query.length > 2,
    refetchInterval, // Refetch every 2 minutes (search results change less frequently)
    staleTime: 60000,
    gcTime: 300000,
  });
}

/**
 * Hook for market metrics and overview
 */
export function useMarketMetrics(options: { enabled?: boolean; refetchInterval?: number } = {}) {
  const { enabled = true, refetchInterval = 60000 } = options;

  return useQuery({
    queryKey: ['markets', 'metrics'],
    queryFn: () => MarketsService.getMarketMetrics(),
    enabled,
    refetchInterval, // Refetch every minute
    staleTime: 30000,
    gcTime: 300000,
  });
}

/**
 * Infinite query hook for pools with pagination
 */
export function useInfinitePools(filters: PoolFilters = {}) {
  return useInfiniteQuery({
    queryKey: ['markets', 'infinite-pools', filters],
    queryFn: ({ pageParam = 1 }) =>
      MarketsService.getAllPools({ ...filters, page: pageParam }),
    getNextPageParam: (lastPage: any) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000,
    gcTime: 300000,
  });
}

/**
 * Comprehensive hook for market dashboard
 */
export function useMarketsDashboard(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;

  const allPools = useAllPools({ enabled, limit: 10, sortBy: 'created_at' });
  const trendingPools = useTrendingPools({ enabled, limit: 5 });
  const boostedPools = useBoostedPools({ enabled, limit: 5 });
  const marketMetrics = useMarketMetrics({ enabled });

  return {
    // Data
    allPools: allPools.data?.pools || [],
    trendingPools: trendingPools.data || [],
    boostedPools: boostedPools.data || [],
    metrics: marketMetrics.data,
    pagination: allPools.data?.pagination,

    // Loading states
    isLoading: allPools.isLoading || trendingPools.isLoading || 
               boostedPools.isLoading || marketMetrics.isLoading,

    // Error states
    error: allPools.error || trendingPools.error || 
           boostedPools.error || marketMetrics.error,

    // Refetch functions
    refetchAll: () => {
      allPools.refetch();
      trendingPools.refetch();
      boostedPools.refetch();
      marketMetrics.refetch();
    },

    // Individual loading states
    loadingStates: {
      allPools: allPools.isLoading,
      trendingPools: trendingPools.isLoading,
      boostedPools: boostedPools.isLoading,
      marketMetrics: marketMetrics.isLoading,
    }
  };
}

/**
 * Hook for real-time active pools monitoring
 */
export function useActivePools(options: { enabled?: boolean; refetchInterval?: number } = {}) {
  const { enabled = true, refetchInterval = 10000 } = options;

  return useQuery({
    queryKey: ['markets', 'active-pools'],
    queryFn: () => MarketsService.getAllPools({ 
      status: 'active', 
      sortBy: 'ending_soon',
      limit: 20 
    }),
    enabled,
    refetchInterval, // Very frequent updates for active pools
    staleTime: 5000,
    gcTime: 180000, // Shorter cache for active data
  });
} 
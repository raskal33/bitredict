"use client";

import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { PoolContractService } from '@/services/poolContractService';
import { EnhancedPool } from '@/components/EnhancedPoolCard';

// Query keys for consistent caching
export const QUERY_KEYS = {
  pools: ['pools'] as const,
  pool: (id: number) => ['pools', id] as const,
  poolsInfinite: (filters: any) => ['pools', 'infinite', filters] as const,
  poolProgress: (id: number) => ['pools', id, 'progress'] as const,
  recentBets: ['recent-bets'] as const,
} as const;

// Enhanced pool data fetching with React Query
export function usePoolsQuery(filters: {
  category?: string;
  status?: string;
  limit?: number;
  offset?: number;
} = {}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.pools, filters],
    queryFn: async () => {
      console.log('🔍 Fetching pools with React Query:', filters);
      
      // Get pool count first
      const poolCount = await PoolContractService.getPoolCount();
      const limit = filters.limit || 20;
      const offset = filters.offset || 0;
      
      // Calculate which pools to fetch
      const startId = Math.max(0, poolCount - 1 - offset);
      const endId = Math.max(0, startId - limit + 1);
      
      const poolIds = Array.from(
        { length: Math.min(limit, startId - endId + 1) },
        (_, i) => startId - i
      );
      
      // Fetch pools in batches
      const pools = await Promise.all(
        poolIds.map(id => 
          PoolContractService.getPool(id).catch(err => {
            console.warn(`Failed to fetch pool ${id}:`, err);
            return null;
          })
        )
      );
      
      const validPools = pools.filter(pool => pool !== null);
      
      return {
        pools: validPools,
        total: poolCount,
        hasMore: startId > 0
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

// Infinite scroll for markets page
export function useInfinitePoolsQuery(filters: {
  category?: string;
  status?: string;
  limit?: number;
} = {}) {
  return useInfiniteQuery({
    queryKey: [...QUERY_KEYS.poolsInfinite(filters)],
    queryFn: async ({ pageParam = 0 }) => {
      console.log('🔄 Infinite query page:', pageParam);
      
      const limit = filters.limit || 20;
      const offset = pageParam * limit;
      
      // Get pool count
      const poolCount = await PoolContractService.getPoolCount();
      const startId = Math.max(0, poolCount - 1 - offset);
      const endId = Math.max(0, startId - limit + 1);
      
      if (startId < endId) {
        return {
          pools: [],
          nextCursor: null,
          hasMore: false,
          total: poolCount
        };
      }
      
      const poolIds = Array.from(
        { length: Math.min(limit, startId - endId + 1) },
        (_, i) => startId - i
      );
      
      // Fetch pools in batches of 5
      const pools = [];
      for (let i = 0; i < poolIds.length; i += 5) {
        const batch = poolIds.slice(i, i + 5);
        const batchPools = await Promise.all(
          batch.map(id => 
            PoolContractService.getPool(id).catch(err => {
              console.warn(`Failed to fetch pool ${id}:`, err);
              return null;
            })
          )
        );
        pools.push(...batchPools.filter(pool => pool !== null));
        
        // Small delay between batches to avoid overwhelming the contract
        if (i + 5 < poolIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      return {
        pools,
        nextCursor: endId > 0 ? pageParam + 1 : null,
        hasMore: endId > 0,
        total: poolCount
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

// Individual pool query with aggressive caching
export function usePoolQuery(poolId: number, options: {
  enabled?: boolean;
  staleTime?: number;
} = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.pool(poolId),
    queryFn: async () => {
      console.log('🎯 Fetching individual pool:', poolId);
      return await PoolContractService.getPool(poolId);
    },
    enabled: options.enabled !== false && !!poolId,
    staleTime: options.staleTime || 1 * 60 * 1000, // 1 minute default
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    refetchOnWindowFocus: false,
  });
}

// Pool progress query for real-time updates
export function usePoolProgressQuery(poolId: number) {
  return useQuery({
    queryKey: QUERY_KEYS.poolProgress(poolId),
    queryFn: async () => {
      console.log('📊 Fetching pool progress:', poolId);
      return await PoolContractService.getPoolProgress(poolId);
    },
    enabled: !!poolId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
  });
}

// Prefetch hook for bet pages
export function usePoolPrefetch() {
  const queryClient = useQueryClient();
  
  const prefetchPool = useCallback(async (poolId: number) => {
    console.log('⚡ Prefetching pool:', poolId);
    
    await queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.pool(poolId),
      queryFn: async () => {
        return await PoolContractService.getPool(poolId);
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  }, [queryClient]);
  
  const prefetchPoolProgress = useCallback(async (poolId: number) => {
    console.log('⚡ Prefetching pool progress:', poolId);
    
    await queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.poolProgress(poolId),
      queryFn: async () => {
        return await PoolContractService.getPoolProgress(poolId);
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  }, [queryClient]);
  
  return {
    prefetchPool,
    prefetchPoolProgress,
    prefetchPoolAndProgress: async (poolId: number) => {
      await Promise.all([
        prefetchPool(poolId),
        prefetchPoolProgress(poolId)
      ]);
    }
  };
}

// Cache invalidation utilities
export function useCacheInvalidation() {
  const queryClient = useQueryClient();
  
  const invalidatePools = useCallback(() => {
    console.log('🔄 Invalidating pools cache');
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pools });
  }, [queryClient]);
  
  const invalidatePool = useCallback((poolId: number) => {
    console.log('🔄 Invalidating pool cache:', poolId);
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pool(poolId) });
  }, [queryClient]);
  
  const invalidateAll = useCallback(() => {
    console.log('🔄 Invalidating all caches');
    queryClient.invalidateQueries();
  }, [queryClient]);
  
  return {
    invalidatePools,
    invalidatePool,
    invalidateAll
  };
}

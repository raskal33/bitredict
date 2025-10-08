"use client";

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PoolContractService } from '@/services/poolContractService';
import { QUERY_KEYS } from './useMarketsQuery';

interface BetPageOptimizationProps {
  poolId: number;
  enabled?: boolean;
}

export function useBetPageOptimization({ poolId, enabled = true }: BetPageOptimizationProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  // Main pool data query
  const poolQuery = useQuery({
    queryKey: QUERY_KEYS.pool(poolId),
    queryFn: async () => {
      console.log('🎯 Fetching pool data for bet page:', poolId);
      return await PoolContractService.getPool(poolId);
    },
    enabled: enabled && !!poolId,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    refetchOnWindowFocus: false,
  });

  // Pool progress query for real-time updates
  const progressQuery = useQuery({
    queryKey: QUERY_KEYS.poolProgress(poolId),
    queryFn: async () => {
      console.log('📊 Fetching pool progress for bet page:', poolId);
      return await PoolContractService.getPoolProgress(poolId);
    },
    enabled: enabled && !!poolId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
  });

  // Prefetch related pools
  const prefetchRelatedPools = useCallback(async () => {
    if (!poolId) return;
    
    console.log('⚡ Prefetching related pools for:', poolId);
    
    try {
      // Get pool count to determine range
      const poolCount = await PoolContractService.getPoolCount();
      
      // Prefetch nearby pools (current pool ± 2)
      const relatedIds = [];
      for (let i = Math.max(0, poolId - 2); i <= Math.min(poolCount - 1, poolId + 2); i++) {
        if (i !== poolId) {
          relatedIds.push(i);
        }
      }
      
      // Prefetch in background
      const prefetchPromises = relatedIds.map(id => 
        queryClient.prefetchQuery({
          queryKey: QUERY_KEYS.pool(id),
          queryFn: async () => {
            return await PoolContractService.getPool(id);
          },
          staleTime: 5 * 60 * 1000, // 5 minutes
        }).catch(err => {
          console.warn(`Failed to prefetch pool ${id}:`, err);
        })
      );
      
      await Promise.allSettled(prefetchPromises);
      console.log('✅ Related pools prefetched');
    } catch (error) {
      console.warn('Failed to prefetch related pools:', error);
    }
  }, [poolId, queryClient]);

  // Prefetch on mount
  useEffect(() => {
    if (enabled && poolId) {
      prefetchRelatedPools();
    }
  }, [enabled, poolId, prefetchRelatedPools]);

  // Navigation with prefetch
  const navigateToPool = useCallback(async (targetPoolId: number) => {
    console.log('🎯 Navigating to pool with prefetch:', targetPoolId);
    
    // Prefetch target pool data
    await queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.pool(targetPoolId),
      queryFn: async () => {
        return await PoolContractService.getPool(targetPoolId);
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
    
    // Navigate
    router.push(`/bet/${targetPoolId}`);
  }, [queryClient, router]);

  // Cache optimization
  const optimizeCache = useCallback(() => {
    console.log('🔧 Optimizing cache for bet page');
    
    // Keep current pool data fresh
    queryClient.invalidateQueries({ 
      queryKey: QUERY_KEYS.pool(poolId),
      exact: true 
    });
    
    // Clean up old cache entries
    queryClient.removeQueries({
      predicate: (query) => {
        const queryKey = query.queryKey;
        if (Array.isArray(queryKey) && queryKey[0] === 'pools') {
          // Keep current pool and recent pools
          const queryPoolId = queryKey[1];
          if (typeof queryPoolId === 'number') {
            return Math.abs(queryPoolId - poolId) > 5; // Remove pools more than 5 away
          }
        }
        return false;
      }
    });
  }, [poolId, queryClient]);

  // Auto-optimize cache periodically
  useEffect(() => {
    if (!enabled) return;
    
    const interval = setInterval(optimizeCache, 2 * 60 * 1000); // Every 2 minutes
    return () => clearInterval(interval);
  }, [enabled, optimizeCache]);

  return {
    pool: poolQuery.data,
    progress: progressQuery.data,
    isLoading: poolQuery.isLoading,
    isProgressLoading: progressQuery.isLoading,
    error: poolQuery.error || progressQuery.error,
    isError: poolQuery.isError || progressQuery.isError,
    navigateToPool,
    optimizeCache,
    refetch: () => {
      poolQuery.refetch();
      progressQuery.refetch();
    }
  };
}

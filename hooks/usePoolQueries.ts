"use client";

import { useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { PoolContractService } from "@/services/poolContractService";
import { EnhancedPool } from "@/components/EnhancedPoolCard";
// Convert RawPool to EnhancedPool format
const convertToEnhancedPool = (pool: any): EnhancedPool => {
  return {
    id: pool.poolId,
    creator: pool.creator,
    odds: pool.odds,
    settled: pool.settled || false,
    creatorSideWon: pool.creatorSideWon || false,
    isPrivate: pool.isPrivate || false,
    usesBitr: pool.usesBitr || false,
    filledAbove60: pool.filledAbove60 || false,
    oracleType: pool.oracleType === 0 ? 'GUIDED' : 'OPEN',
    
    creatorStake: pool.creatorStake,
    totalCreatorSideStake: pool.totalCreatorSideStake || pool.creatorStake,
    maxBettorStake: pool.maxBettorStake || pool.totalBettorStake,
    totalBettorStake: pool.totalBettorStake,
    predictedOutcome: pool.predictedOutcome,
    result: pool.result || '',
    marketId: pool.marketId,
    
    eventStartTime: pool.eventStartTime,
    eventEndTime: pool.eventEndTime,
    bettingEndTime: pool.bettingEndTime,
    resultTimestamp: pool.resultTimestamp,
    arbitrationDeadline: pool.arbitrationDeadline || (pool.eventEndTime + (24 * 60 * 60)),
    
    league: pool.league,
    category: pool.category,
    region: pool.region,
    title: pool.title || '',
    homeTeam: pool.homeTeam || '',
    awayTeam: pool.awayTeam || '',
    maxBetPerUser: pool.maxBetPerUser.toString(),
    
    boostTier: (pool.boostTier === 0 ? 'NONE' : pool.boostTier === 1 ? 'BRONZE' : pool.boostTier === 2 ? 'SILVER' : 'GOLD') as 'NONE' | 'BRONZE' | 'SILVER' | 'GOLD',
    boostExpiry: pool.boostExpiry || 0,
    trending: false,
    socialStats: {
      likes: 0,
      comments: 0,
      views: 0
    },
    change24h: 0
  };
};

// Query keys for consistent caching
export const poolQueryKeys = {
  all: ['pools'] as const,
  lists: () => [...poolQueryKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...poolQueryKeys.lists(), { filters }] as const,
  details: () => [...poolQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...poolQueryKeys.details(), id] as const,
  infinite: (filters: Record<string, any>) => [...poolQueryKeys.all, 'infinite', { filters }] as const,
};

// Hook for fetching a single pool with caching
export function usePool(poolId: number) {
  return useQuery({
    queryKey: poolQueryKeys.detail(poolId),
    queryFn: async () => {
      const pool = await PoolContractService.getPool(poolId);
      return convertToEnhancedPool(pool);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!poolId,
  });
}

// Hook for prefetching a pool (for instant navigation)
export function usePrefetchPool() {
  const queryClient = useQueryClient();
  
  return (poolId: number) => {
    queryClient.prefetchQuery({
      queryKey: poolQueryKeys.detail(poolId),
      queryFn: async () => {
        const pool = await PoolContractService.getPool(poolId);
        return convertToEnhancedPool(pool);
      },
      staleTime: 2 * 60 * 1000,
    });
  };
}

// Hook for infinite scroll pagination
export function useInfinitePools(filters: Record<string, any> = {}) {
  return useInfiniteQuery({
    queryKey: poolQueryKeys.infinite(filters),
    queryFn: async ({ pageParam = 0 }) => {
      const limit = 10; // Load 10 pools per page
      const offset = pageParam * limit;
      
      try {
        const count = await PoolContractService.getPoolCount();
        const poolIds = Array.from(
          { length: Math.min(limit, count - offset) },
          (_, i) => count - 1 - (offset + i)
        );
        
        const pools = await Promise.all(
          poolIds.map(id => 
            PoolContractService.getPool(id).catch(() => null)
          )
        );
        
        const validPools = pools
          .filter((pool): pool is any => pool !== null)
          .map(convertToEnhancedPool);
        
        return {
          pools: validPools,
          nextCursor: validPools.length === limit ? pageParam + 1 : undefined,
          hasMore: validPools.length === limit && offset + limit < count,
        };
      } catch (error) {
        console.error('Error fetching pools:', error);
        return {
          pools: [],
          nextCursor: undefined,
          hasMore: false,
        };
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for prefetching multiple pools (for markets page optimization)
export function usePrefetchPools() {
  const queryClient = useQueryClient();
  
  return async (poolIds: number[]) => {
    const prefetchPromises = poolIds.slice(0, 5).map(poolId => // Prefetch first 5 pools
      queryClient.prefetchQuery({
        queryKey: poolQueryKeys.detail(poolId),
        queryFn: async () => {
          const pool = await PoolContractService.getPool(poolId);
          return convertToEnhancedPool(pool);
        },
        staleTime: 2 * 60 * 1000,
      })
    );
    
    await Promise.allSettled(prefetchPromises);
  };
}

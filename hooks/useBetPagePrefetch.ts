"use client";

import { useEffect } from 'react';
import { usePrefetchPool } from './usePoolQueries';

// Hook to prefetch bet pages when hovering over pool cards
export function useBetPagePrefetch() {
  const prefetchPool = usePrefetchPool();

  const prefetchOnHover = (poolId: number) => {
    // Prefetch when user hovers over a pool card
    prefetchPool(poolId);
  };

  const prefetchOnVisible = (poolId: number) => {
    // Prefetch when pool card becomes visible
    prefetchPool(poolId);
  };

  return {
    prefetchOnHover,
    prefetchOnVisible,
  };
}

// Hook to prefetch multiple pools for instant navigation
export function useBatchPrefetch() {
  const prefetchPool = usePrefetchPool();

  const prefetchVisiblePools = (poolIds: number[]) => {
    // Prefetch the first 3 visible pools
    poolIds.slice(0, 3).forEach(poolId => {
      prefetchPool(poolId);
    });
  };

  return {
    prefetchVisiblePools,
  };
}

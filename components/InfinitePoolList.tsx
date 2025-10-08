"use client";

import { useRef, useCallback } from 'react';
import { useInfinitePools } from '@/hooks/usePoolQueries';
import LazyPoolCard from './LazyPoolCard';
import SkeletonLoader from './SkeletonLoader';
import { EnhancedPool } from '@/components/EnhancedPoolCard';

interface InfinitePoolListProps {
  filters?: Record<string, unknown>;
  onPoolSelect?: (pool: EnhancedPool) => void;
}

export default function InfinitePoolList({ 
  filters = {}, 
  onPoolSelect 
}: InfinitePoolListProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfinitePools(filters as Record<string, any>);

  const observer = useRef<IntersectionObserver>();

  const lastPoolElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();
      
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      });
      
      if (node) observer.current.observe(node);
    },
    [isLoading, hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  if (isLoading) {
    return <SkeletonLoader type="markets-list" count={6} />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-400">
        <div className="text-center">
          <p className="text-lg font-semibold">Failed to load pools</p>
          <p className="text-sm text-gray-400 mt-2">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  const allPools = data?.pages.flatMap(page => page.pools) || [] as EnhancedPool[];

  if (allPools.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <p className="text-lg font-semibold">No pools found</p>
          <p className="text-sm text-gray-400 mt-2">Check back later for new predictions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="space-y-4">
        {allPools.map((pool: EnhancedPool, index: number) => (
          <div
            key={pool.id}
            ref={index === allPools.length - 1 ? lastPoolElementRef : undefined}
          >
            <LazyPoolCard
              pool={pool}
              index={index}
              onPoolSelect={onPoolSelect}
            />
          </div>
        ))}
      </div>
      
      {isFetchingNextPage && (
        <div className="mt-8">
          <SkeletonLoader type="markets-list" count={3} />
        </div>
      )}
      
      {!hasNextPage && allPools.length > 0 && (
        <div className="flex items-center justify-center mt-8 text-gray-400">
          <p className="text-sm">You&apos;ve reached the end of the list</p>
        </div>
      )}
    </div>
  );
}

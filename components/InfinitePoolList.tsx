"use client";

import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInfinitePoolsQuery } from '@/hooks/useMarketsQuery';
import LazyPoolCard from './LazyPoolCard';
import SkeletonLoader from './SkeletonLoader';
import { EnhancedPool } from './EnhancedPoolCard';

interface InfinitePoolListProps {
  filters?: {
    category?: string;
    status?: string;
    limit?: number;
  };
  onPoolSelect?: (pool: EnhancedPool) => void;
  className?: string;
}

export default function InfinitePoolList({ 
  filters = {}, 
  onPoolSelect,
  className = ""
}: InfinitePoolListProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    isError
  } = useInfinitePoolsQuery(filters);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Intersection Observer for infinite scroll
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [target] = entries;
    if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
      console.log('🔄 Loading more pools...');
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    });

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver]);

  // Flatten all pages into a single array
  const allPools = data?.pages.flatMap(page => page.pools) || [];

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <SkeletonLoader type="markets-list" count={6} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <div className="text-red-400 text-lg mb-2">⚠️ Failed to load pools</div>
          <div className="text-gray-400 text-sm">
            {error?.message || 'Something went wrong'}
          </div>
        </div>
      </div>
    );
  }

  if (allPools.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <div className="text-gray-400 text-lg mb-2">No pools found</div>
          <div className="text-gray-500 text-sm">
            Try adjusting your filters or check back later
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <AnimatePresence>
        {allPools.map((pool, index) => (
          <motion.div
            key={pool.poolId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ 
              duration: 0.3, 
              delay: Math.min(index * 0.05, 0.5) // Cap delay at 0.5s
            }}
          >
            <LazyPoolCard
              pool={pool}
              index={index}
              onPoolSelect={onPoolSelect}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Load more trigger */}
      <div ref={loadMoreRef} className="h-4" />

      {/* Loading indicator */}
      {isFetchingNextPage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-8"
        >
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
            <span className="text-gray-400">Loading more pools...</span>
          </div>
        </motion.div>
      )}

      {/* End of list indicator */}
      {!hasNextPage && allPools.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-8"
        >
          <div className="text-gray-400 text-sm">
            You&apos;ve reached the end of the list
          </div>
        </motion.div>
      )}
    </div>
  );
}

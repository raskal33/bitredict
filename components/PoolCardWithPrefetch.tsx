"use client";

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePoolPrefetch } from '@/hooks/useMarketsQuery';
import EnhancedPoolCard from './EnhancedPoolCard';
import { EnhancedPool } from './EnhancedPoolCard';

interface PoolCardWithPrefetchProps {
  pool: EnhancedPool;
  index: number;
  onPoolSelect?: (pool: EnhancedPool) => void;
  className?: string;
}

export default function PoolCardWithPrefetch({ 
  pool, 
  index, 
  onPoolSelect,
  className 
}: PoolCardWithPrefetchProps) {
  const router = useRouter();
  const { prefetchPoolAndProgress } = usePoolPrefetch();

  // Prefetch on hover
  const handleMouseEnter = useCallback(() => {
    console.log('⚡ Prefetching pool on hover:', pool.id);
    prefetchPoolAndProgress(pool.id);
  }, [pool.id, prefetchPoolAndProgress]);

  // Handle pool selection with prefetch
  const handlePoolSelect = useCallback((selectedPool: EnhancedPool) => {
    console.log('🎯 Pool selected, navigating to:', selectedPool.id);
    
    // Prefetch immediately before navigation
    prefetchPoolAndProgress(selectedPool.id);
    
    // Call original handler if provided
    if (onPoolSelect) {
      onPoolSelect(selectedPool);
    }
    
    // Navigate to bet page
    router.push(`/bet/${selectedPool.id}`);
  }, [onPoolSelect, router, prefetchPoolAndProgress]);

  // Prefetch on mount for visible pools
  useEffect(() => {
    // Only prefetch if pool is likely to be viewed soon
    if (index < 3) { // First 3 pools
      console.log('⚡ Prefetching visible pool:', pool.id);
      prefetchPoolAndProgress(pool.id);
    }
  }, [pool.id, index, prefetchPoolAndProgress]);

  return (
    <div 
      onMouseEnter={handleMouseEnter}
      className={className}
    >
      <EnhancedPoolCard
        pool={pool}
        index={index}
      />
    </div>
  );
}

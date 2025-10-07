"use client";

import { useRef } from 'react';
import { EnhancedPool } from '@/components/EnhancedPoolCard';
import LazyPoolCard from './LazyPoolCard';

interface VirtualizedPoolListProps {
  pools: EnhancedPool[];
}

export default function VirtualizedPoolList({
  pools
}: VirtualizedPoolListProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  if (pools.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        No pools found
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full">
      <div className="space-y-4">
        {pools.map((pool, index) => (
          <LazyPoolCard
            key={pool.id}
            pool={pool}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

// Hook for virtual scrolling with dynamic item heights
export function useVirtualScrolling<T>(
  items: T[],
  options: {
    containerHeight: number;
    estimatedItemHeight: number;
    overscan?: number;
  }
) {
  const [itemHeights, setItemHeights] = useState<number[]>([]);
  const [scrollOffset, setScrollOffset] = useState(0);

  const updateItemHeight = useCallback((index: number, height: number) => {
    setItemHeights(prev => {
      const newHeights = [...prev];
      newHeights[index] = height;
      return newHeights;
    });
  }, []);

  const getItemHeight = useCallback((index: number) => {
    return itemHeights[index] || options.estimatedItemHeight;
  }, [itemHeights, options.estimatedItemHeight]);

  const getVisibleRange = useCallback(() => {
    const { containerHeight, overscan = 3 } = options;
    let startIndex = 0;
    let endIndex = items.length;
    let currentHeight = 0;

    // Find start index
    for (let i = 0; i < items.length; i++) {
      const itemHeight = getItemHeight(i);
      if (currentHeight + itemHeight > scrollOffset) {
        startIndex = Math.max(0, i - overscan);
        break;
      }
      currentHeight += itemHeight;
    }

    // Find end index
    for (let i = startIndex; i < items.length; i++) {
      const itemHeight = getItemHeight(i);
      if (currentHeight > scrollOffset + containerHeight) {
        endIndex = Math.min(items.length, i + overscan);
        break;
      }
      currentHeight += itemHeight;
    }

    return { startIndex, endIndex };
  }, [items.length, scrollOffset, getItemHeight, options]);

  return {
    getVisibleRange,
    updateItemHeight,
    getItemHeight,
    scrollOffset,
    setScrollOffset
  };
}

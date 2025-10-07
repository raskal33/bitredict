"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Pool } from '@/lib/types';
import LazyPoolCard from './LazyPoolCard';

interface VirtualizedPoolListProps {
  pools: Pool[];
  height?: number;
  itemHeight?: number;
  onPoolSelect?: (pool: Pool) => void;
}

interface PoolItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    pools: Pool[];
    onPoolSelect?: (pool: Pool) => void;
  };
}

function PoolItem({ index, style, data }: PoolItemProps) {
  const { pools, onPoolSelect } = data;
  const pool = pools[index];

  if (!pool) return null;

  return (
    <div style={style} className="px-2">
      <LazyPoolCard
        pool={pool}
        index={index}
        onPoolSelect={onPoolSelect}
      />
    </div>
  );
}

export default function VirtualizedPoolList({
  pools,
  height = 600,
  itemHeight = 200,
  onPoolSelect
}: VirtualizedPoolListProps) {
  const [containerHeight, setContainerHeight] = useState(height);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate container height based on viewport
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const availableHeight = viewportHeight - rect.top - 100; // 100px padding
        setContainerHeight(Math.min(height, availableHeight));
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [height]);

  const itemData = {
    pools,
    onPoolSelect
  };

  if (pools.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        No pools found
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full">
      <List
        height={containerHeight}
        itemCount={pools.length}
        itemSize={itemHeight}
        itemData={itemData}
        overscanCount={3} // Render 3 extra items for smooth scrolling
      >
        {PoolItem}
      </List>
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

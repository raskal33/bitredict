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

// Simplified virtual scrolling - removed complex hook as it's not used

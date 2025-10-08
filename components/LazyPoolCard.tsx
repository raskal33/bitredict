"use client";

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import EnhancedPoolCard from './EnhancedPoolCard';
import { EnhancedPool } from '@/components/EnhancedPoolCard';
// import { useBetPagePrefetch } from '@/hooks/useBetPagePrefetch';

interface LazyPoolCardProps {
  pool: EnhancedPool;
  index: number;
  onPoolSelect?: (pool: EnhancedPool) => void;
}

export default function LazyPoolCard({ pool, index, onPoolSelect }: LazyPoolCardProps) {
  // const { prefetchOnHover } = useBetPagePrefetch();
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          setHasLoaded(true);
        }
      },
      {
        rootMargin: '100px', // Load 100px before entering viewport
        threshold: 0.1
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [hasLoaded]);

  return (
    <div ref={cardRef} className="w-full">
      {isVisible ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          // onMouseEnter={() => prefetchOnHover(pool.id)}
          onClick={() => onPoolSelect?.(pool)}
        >
          <EnhancedPoolCard 
            pool={pool}
            index={index}
          />
        </motion.div>
      ) : (
        <PoolCardSkeleton />
      )}
    </div>
  );
}

function PoolCardSkeleton() {
  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 bg-gray-700/50 rounded w-32"></div>
        <div className="h-6 bg-gray-700/50 rounded w-16"></div>
      </div>
      
      <div className="space-y-3 mb-4">
        <div className="h-4 bg-gray-700/50 rounded w-full"></div>
        <div className="h-4 bg-gray-700/50 rounded w-3/4"></div>
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <div className="h-8 bg-gray-700/50 rounded w-20"></div>
        <div className="h-8 bg-gray-700/50 rounded w-24"></div>
      </div>
      
      <div className="space-y-2">
        <div className="h-2 bg-gray-700/50 rounded w-full"></div>
        <div className="flex justify-between text-sm">
          <div className="h-3 bg-gray-700/50 rounded w-16"></div>
          <div className="h-3 bg-gray-700/50 rounded w-20"></div>
        </div>
      </div>
    </div>
  );
}

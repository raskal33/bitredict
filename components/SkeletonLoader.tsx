"use client";

import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  type: 'pool-card' | 'bet-page' | 'markets-list' | 'bet-form';
  count?: number;
}

export default function SkeletonLoader({ type, count = 1 }: SkeletonLoaderProps) {
  const renderSkeleton = () => {
    switch (type) {
      case 'pool-card':
        return <PoolCardSkeleton />;
      case 'bet-page':
        return <BetPageSkeleton />;
      case 'markets-list':
        return <MarketsListSkeleton />;
      case 'bet-form':
        return <BetFormSkeleton />;
      default:
        return <div className="animate-pulse bg-gray-700/50 rounded h-20"></div>;
    }
  };

  if (count > 1) {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            {renderSkeleton()}
          </motion.div>
        ))}
      </div>
    );
  }

  return renderSkeleton();
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

function BetPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-8 bg-gray-700/50 rounded w-48"></div>
          <div className="h-6 bg-gray-700/50 rounded w-20"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-700/50 rounded w-full"></div>
          <div className="h-4 bg-gray-700/50 rounded w-2/3"></div>
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 animate-pulse">
            <div className="h-4 bg-gray-700/50 rounded w-16 mb-2"></div>
            <div className="h-6 bg-gray-700/50 rounded w-20"></div>
          </div>
        ))}
      </div>

      {/* Bet Form Skeleton */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 animate-pulse">
        <div className="h-6 bg-gray-700/50 rounded w-32 mb-4"></div>
        <div className="space-y-4">
          <div className="h-12 bg-gray-700/50 rounded w-full"></div>
          <div className="h-12 bg-gray-700/50 rounded w-full"></div>
          <div className="h-12 bg-gray-700/50 rounded w-full"></div>
        </div>
      </div>
    </div>
  );
}

function MarketsListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <PoolCardSkeleton key={i} />
      ))}
    </div>
  );
}

function BetFormSkeleton() {
  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 animate-pulse">
      <div className="space-y-4">
        <div className="h-6 bg-gray-700/50 rounded w-32"></div>
        <div className="h-12 bg-gray-700/50 rounded w-full"></div>
        <div className="h-12 bg-gray-700/50 rounded w-full"></div>
        <div className="h-12 bg-gray-700/50 rounded w-full"></div>
      </div>
    </div>
  );
}

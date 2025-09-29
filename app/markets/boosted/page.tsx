"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { SparklesIcon, BoltIcon, ClockIcon } from "@heroicons/react/24/outline";
import { useBoostedPools } from "@/hooks/useMarkets";
import AnimatedTitle from "@/components/AnimatedTitle";

export default function BoostedMarketsPage() {
  const [filters, setFilters] = useState({
    category: '',
    sortBy: 'newest' as const,
    limit: 20
  });

  // Use real-time boosted pools data
  const { data: boostedPools = [], isLoading, error, refetch } = useBoostedPools({
    ...filters,
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Type assertion for the data
  const pools = Array.isArray(boostedPools) ? boostedPools : [];

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
          <p className="text-text-primary text-xl font-medium">Loading boosted markets...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-8 text-center"
        >
          <p className="text-red-400 text-xl font-medium mb-4">Error loading boosted markets</p>
          <p className="text-text-muted mb-4">{error.message}</p>
          <button 
            onClick={() => refetch()}
            className="btn-primary"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <AnimatedTitle 
        size="md"
        leftIcon={BoltIcon}
        rightIcon={SparklesIcon}
      >
        Boosted Markets
      </AnimatedTitle>
      
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-base text-text-secondary max-w-2xl mx-auto text-center mb-6"
      >
        Enhanced visibility pools with increased rewards and promotional benefits.
      </motion.p>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-wrap items-center gap-4 justify-center"
      >
        <select
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="bg-bg-card border border-border-primary rounded-button px-4 py-2 text-text-primary"
        >
          <option value="">All Categories</option>
          <option value="sports">Sports</option>
          <option value="crypto">Crypto</option>
          <option value="politics">Politics</option>
          <option value="weather">Weather</option>
        </select>

        <select
          value={filters.sortBy}
          onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          className="bg-bg-card border border-border-primary rounded-button px-4 py-2 text-text-primary"
        >
          <option value="newest">Newest First</option>
          <option value="volume">Highest Volume</option>
          <option value="participants">Most Participants</option>
          <option value="ending_soon">Ending Soon</option>
        </select>

        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-primary text-black rounded-button hover:shadow-button transition-all duration-200"
        >
          <SparklesIcon className="h-4 w-4" />
          Refresh
        </button>
      </motion.div>

      {/* Boosted Pools Grid */}
      {pools.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {pools.map((pool, index) => (
            <motion.div
              key={pool.poolId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="glass-card p-6 hover:glow-cyan transition-all duration-300 relative overflow-hidden"
            >
              {/* Boost Badge */}
              <div className="absolute top-4 right-4">
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                  pool.boostTier === 'GOLD' ? 'bg-yellow-400 text-black' :
                  pool.boostTier === 'SILVER' ? 'bg-gray-300 text-black' :
                  'bg-orange-400 text-black'
                }`}>
                  {pool.boostTier || 'BOOSTED'}
                </div>
              </div>

              {/* Pool Info */}
              <div className="mb-4">
                <h3 className="text-xl font-bold text-text-primary mb-2 pr-20">
                  {pool.title}
                </h3>
                <p className="text-text-muted text-sm">
                  {pool.category && (
                    <span className="inline-block bg-primary/20 text-primary px-2 py-1 rounded text-xs mr-2 mb-1">
                      {pool.category}
                    </span>
                  )}
                  by {pool.creator.slice(0, 6)}...{pool.creator.slice(-4)}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-text-muted text-xs">Total Volume</p>
                  <p className="text-text-primary font-semibold">{parseFloat(pool.creatorStake).toFixed(2)} {pool.usesBitr ? 'BITR' : 'STT'}</p>
                </div>
                <div>
                  <p className="text-text-muted text-xs">Participants</p>
                  <p className="text-text-primary font-semibold">{pool.totalBettorStake ? parseFloat(pool.totalBettorStake).toFixed(0) : 0}</p>
                </div>
                <div>
                  <p className="text-text-muted text-xs">Odds</p>
                  <p className="text-text-primary font-semibold">{pool.odds}%</p>
                </div>
                <div>
                  <p className="text-text-muted text-xs">Fill Rate</p>
                  <p className="text-text-primary font-semibold">{pool.settled ? '100' : '0'}%</p>
                </div>
              </div>

              {/* Status and Time */}
              <div className="flex items-center justify-between mb-4">
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  !pool.settled ? 'bg-green-400/20 text-green-400' :
                  'bg-blue-400/20 text-blue-400'
                }`}>
                  {pool.settled ? 'SETTLED' : 'ACTIVE'}
                </div>
                {pool.eventEndTime && Number(pool.eventEndTime) > Date.now() / 1000 && (
                  <div className="flex items-center gap-1 text-text-muted text-xs">
                    <ClockIcon className="h-3 w-3" />
                    {Math.floor((Number(pool.eventEndTime) - Date.now() / 1000) / (60 * 60))}h remaining
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button className="w-full btn-secondary">
                View Pool
              </button>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <BoltIcon className="h-16 w-16 mx-auto text-text-muted mb-4" />
          <h3 className="text-xl font-semibold text-text-primary mb-2">No Boosted Markets</h3>
          <p className="text-text-muted">
            {filters.category ? 
              `No boosted markets found in ${filters.category} category.` :
              'No boosted markets available right now. Check back soon!'
            }
          </p>
        </motion.div>
      )}

      {/* Real-time indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center text-xs text-text-muted"
      >
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          Live data • Updates every 30 seconds
        </div>
      </motion.div>
    </motion.div>
  );
} 
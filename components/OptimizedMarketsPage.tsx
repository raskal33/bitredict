/**
 * Optimized Markets Page Component
 * Uses backend API with WebSocket real-time updates and contract fallback
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOptimizedPools } from "@/hooks/useOptimizedPools";
import type { OptimizedPool } from "@/services/optimizedPoolService";
import { EnhancedPool } from "@/components/EnhancedPoolCard";
import LazyPoolCard from "@/components/LazyPoolCard";
import SkeletonLoader from "@/components/SkeletonLoader";
import RecentBetsLane from "@/components/RecentBetsLane";
import { 
  FaChartLine, 
  FaFilter, 
  FaSearch, 
  FaBolt, 
  FaFire, 
  FaLock, 
  FaLayerGroup,
  FaPlay,
  FaPause,
  FaCheckCircle,
  FaWifi
} from "react-icons/fa";
import { FiWifiOff } from "react-icons/fi";

type MarketCategory = "all" | "boosted" | "trending" | "private" | "combo" | "active" | "closed" | "settled";
type CategoryFilter = "all" | "football" | "crypto" | "basketball" | "other";
type SortBy = "newest" | "oldest" | "volume" | "ending-soon";

export default function OptimizedMarketsPage() {
  const [activeCategory, setActiveCategory] = useState<MarketCategory>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Map activeCategory to valid status
  const getStatusFromCategory = (category: MarketCategory): "active" | "closed" | "settled" | undefined => {
    switch (category) {
      case "all":
      case "boosted":
      case "trending":
      case "private":
      case "combo":
        return undefined;
      case "active":
        return "active";
      case "closed":
        return "closed";
      case "settled":
        return "settled";
      default:
        return undefined;
    }
  };

  // Use optimized pools hook
  const {
    pools: optimizedPools,
    stats: optimizedStats,
    loading: optimizedLoading,
    error: optimizedError,
    refetch: refetchOptimized,
    isConnected: isWebSocketConnected,
    lastUpdated
  } = useOptimizedPools({
    filters: {
      category: categoryFilter === 'all' ? undefined : categoryFilter,
      status: getStatusFromCategory(activeCategory),
      sortBy: sortBy,
      limit: 50
    },
    enableWebSocket: true,
    autoRefresh: true,
    refreshInterval: 30000
  });

  // Convert optimized pools to EnhancedPool format
  const convertToEnhancedPool = useCallback((pool: OptimizedPool): EnhancedPool => {
    return {
      id: pool.id,
      creator: pool.creator.address,
      odds: Math.round(pool.odds * 100), // Convert to basis points
      settled: pool.status === 'settled',
      creatorSideWon: false,
      isPrivate: false,
      usesBitr: pool.currency === 'BITR',
      filledAbove60: pool.fillPercentage > 60,
      oracleType: pool.oracleType === 0 ? 'GUIDED' : 'OPEN',
      
      creatorStake: pool.creatorStake,
      totalCreatorSideStake: pool.creatorStake,
      maxBettorStake: pool.maxPoolSize,
      totalBettorStake: pool.totalBettorStake,
      predictedOutcome: pool.predictedOutcome || '',
      result: '',
      marketId: '',
      
      eventStartTime: pool.eventStartTime,
      eventEndTime: pool.eventEndTime,
      bettingEndTime: pool.bettingEndTime,
      resultTimestamp: 0,
      arbitrationDeadline: 0,
      maxBetPerUser: '0',
      
      league: pool.league || '',
      category: pool.category,
      region: '',
      homeTeam: pool.homeTeam || '',
      awayTeam: pool.awayTeam || '',
      title: pool.title,
      
      boostTier: pool.boostTier === 'NONE' ? 'NONE' : 
                 pool.boostTier === 'BRONZE' ? 'BRONZE' :
                 pool.boostTier === 'SILVER' ? 'SILVER' : 'GOLD',
      boostExpiry: 0
    };
  }, []);

  // Convert optimized pools to EnhancedPool format
  const pools = optimizedPools.map(convertToEnhancedPool);
  
  // Apply search filter
  const filteredPools = pools.filter(pool => 
    (pool.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pool.homeTeam || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pool.awayTeam || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pool.league || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format volume to human-readable format
  const formatVolume = (volume: string): string => {
    const num = parseFloat(volume);
    if (num === 0) return "0";
    if (num >= 1e21) return `${(num / 1e21).toFixed(1)}K BITR`;
    if (num >= 1e18) return `${(num / 1e18).toFixed(1)} BITR`;
    if (num >= 1e15) return `${(num / 1e15).toFixed(1)}M STT`;
    if (num >= 1e12) return `${(num / 1e12).toFixed(1)}K STT`;
    return num.toFixed(2);
  };

  // Format last updated time
  const formatLastUpdated = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s ago`;
    }
    return `${seconds}s ago`;
  };

  const categories: { id: MarketCategory; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
    { id: "all", label: "All Markets", icon: FaChartLine, count: optimizedStats.totalPools },
    { id: "active", label: "Active", icon: FaPlay, count: optimizedStats.activePools },
    { id: "boosted", label: "Boosted", icon: FaBolt, count: optimizedStats.boostedPools },
    { id: "trending", label: "Trending", icon: FaFire, count: optimizedStats.trendingPools },
    { id: "private", label: "Private", icon: FaLock, count: 0 },
    { id: "combo", label: "Combo", icon: FaLayerGroup, count: 0 },
    { id: "closed", label: "Closed", icon: FaPause, count: optimizedStats.totalPools - optimizedStats.activePools },
    { id: "settled", label: "Settled", icon: FaCheckCircle, count: optimizedStats.settledPools }
  ];

  const categoryFilters: { id: CategoryFilter; label: string }[] = [
    { id: "all", label: "All Categories" },
    { id: "football", label: "Football" },
    { id: "crypto", label: "Crypto" },
    { id: "basketball", label: "Basketball" },
    { id: "other", label: "Other" }
  ];

  const sortOptions: { id: SortBy; label: string }[] = [
    { id: "newest", label: "Newest" },
    { id: "oldest", label: "Oldest" },
    { id: "volume", label: "Volume" },
    { id: "ending-soon", label: "Ending Soon" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">Markets</h1>
              <div className="flex items-center space-x-2">
                {isWebSocketConnected ? (
                  <div className="flex items-center space-x-1 text-green-400">
                    <FaWifi className="w-4 h-4" />
                    <span className="text-sm">Live</span>
                  </div>
          ) : (
            <div className="flex items-center space-x-1 text-red-400">
              <FiWifiOff className="w-4 h-4" />
              <span className="text-sm">Offline</span>
            </div>
          )}
                {lastUpdated > 0 && (
                  <span className="text-xs text-gray-400">
                    Updated {formatLastUpdated(lastUpdated)}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <FaFilter className="w-4 h-4" />
                <span>Filters</span>
              </button>
              
              <button
                onClick={() => refetchOptimized()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-gray-800/30 border-b border-gray-700/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{optimizedStats.totalPools}</div>
              <div className="text-sm text-gray-400">Total Pools</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{optimizedStats.activePools}</div>
              <div className="text-sm text-gray-400">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{formatVolume(optimizedStats.totalVolume)}</div>
              <div className="text-sm text-gray-400">Total Volume</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{optimizedStats.participants}</div>
              <div className="text-sm text-gray-400">Participants</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-800/50 border-b border-gray-700/50"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search pools, teams, leagues..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {categoryFilters.map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => setCategoryFilter(filter.id)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          categoryFilter === filter.id
                            ? "bg-blue-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
                  <div className="flex flex-wrap gap-2">
                    {sortOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setSortBy(option.id)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          sortBy === option.id
                            ? "bg-blue-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Tabs */}
      <div className="bg-gray-800/30 border-b border-gray-700/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-3 whitespace-nowrap transition-colors ${
                  activeCategory === category.id
                    ? "text-blue-400 border-b-2 border-blue-400"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <category.icon className="w-4 h-4" />
                <span>{category.label}</span>
                {category.count !== undefined && (
                  <span className="bg-gray-700 px-2 py-1 rounded-full text-xs">
                    {category.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {optimizedLoading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <SkeletonLoader key={i} type="pool-card" />
            ))}
          </div>
        ) : optimizedError ? (
          <div className="text-center py-12">
            <div className="text-red-400 text-lg font-semibold mb-2">Failed to load markets</div>
            <div className="text-gray-400 mb-4">{optimizedError}</div>
            <button
              onClick={() => refetchOptimized()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredPools.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg">No pools found</div>
            <div className="text-gray-500">Try adjusting your filters</div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPools.map((pool, index) => (
              <LazyPoolCard key={pool.id} pool={pool} index={index} />
            ))}
          </div>
        )}
      </div>

      {/* Recent Bets Lane */}
      <RecentBetsLane />
    </div>
  );
}

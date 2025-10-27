"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import AnimatedTitle from "@/components/AnimatedTitle";
import { optimizedPoolService, type OptimizedPool } from "@/services/optimizedPoolService";
import { poolStateService } from "@/services/poolStateService";
import { frontendCache } from "@/services/frontendCache";
import RecentBetsLane from "@/components/RecentBetsLane";
import SkeletonLoader from "@/components/SkeletonLoader";
import EnhancedPoolCard, { type EnhancedPool } from "@/components/EnhancedPoolCard";
import { 
  FaChartLine, 
  FaFilter, 
  FaSearch, 
  FaBolt, 
  FaTrophy, 
  FaLock, 
  FaStar,
  FaFire,
  FaClock,
  FaSort,
  FaShieldAlt,
  FaGift
} from "react-icons/fa";

type MarketCategory = "all" | "boosted" | "trending" | "private" | "combo" | "active" | "closed" | "settled";
type CategoryFilter = "all" | "football" | "crypto" | "basketball" | "other";
type SortBy = "newest" | "oldest" | "volume" | "ending-soon";
type PoolStatus = "active" | "closed" | "settled" | "all";



export default function MarketsPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<MarketCategory>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [enhancedPools, setEnhancedPools] = useState<Array<OptimizedPool & { isSettled?: boolean; creatorSideWon?: boolean }>>([]);
  const [filteredPools, setFilteredPools] = useState<Array<OptimizedPool & { isSettled?: boolean; creatorSideWon?: boolean }>>([]);
  const [stats, setStats] = useState({
    totalVolume: "0",
    bitrVolume: "0",
    sttVolume: "0",
    activeMarkets: 0,
    participants: 0,
    totalPools: 0,
    boostedPools: 0,
    trendingPools: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // Convert OptimizedPool to EnhancedPool
  const convertToEnhancedPool = (pool: OptimizedPool & { isSettled?: boolean; creatorSideWon?: boolean }): EnhancedPool => {
    return {
      id: pool.id,
      creator: pool.creator.address,
      odds: pool.odds,
      settled: pool.isSettled || false,
      creatorSideWon: pool.creatorSideWon || false,
      isPrivate: false, // Not supported in OptimizedPool
      usesBitr: pool.currency === 'BITR',
      filledAbove60: pool.fillPercentage >= 60,
      oracleType: (pool.oracleType as 'GUIDED' | 'OPEN') || 'GUIDED',
      status: pool.status as 'active' | 'closed' | 'settled' | 'cancelled',
      creatorStake: pool.creatorStake,
      totalCreatorSideStake: pool.creatorStake,
      maxBettorStake: pool.maxPoolSize,
      totalBettorStake: pool.totalBettorStake,
      predictedOutcome: pool.predictedOutcome || 'Unknown',
      result: '',
      marketId: pool.marketId || '',
      eventStartTime: pool.eventStartTime,
      eventEndTime: pool.eventEndTime,
      bettingEndTime: pool.bettingEndTime,
      resultTimestamp: 0,
      arbitrationDeadline: 0,
      league: pool.league || '',
      category: pool.category,
      region: pool.region || 'Global',
      title: pool.title,
      homeTeam: pool.homeTeam,
      awayTeam: pool.awayTeam,
      maxBetPerUser: '0',
      marketType: undefined,
      boostTier: pool.boostTier,
      boostExpiry: 0,
      trending: pool.trending,
      socialStats: pool.socialStats,
      change24h: undefined,
      isComboPool: false,
      comboConditions: undefined,
      indexedData: {
        participantCount: pool.participants,
        fillPercentage: pool.fillPercentage,
        totalVolume: pool.totalBettorStake,
        betCount: pool.totalBets || 0,
        avgBetSize: pool.avgBet ? pool.avgBet.toString() : '0',
        creatorReputation: 0,
        categoryRank: 0,
        isHot: false,
        lastActivity: new Date()
      },
      // Additional fields for EnhancedPoolCard
      totalBets: pool.totalBets || 0,
      avgBet: pool.avgBet ? pool.avgBet.toString() : '0'
    };
  };

  // Format numbers to human-readable format (no scientific notation)
  const formatNumber = (value: string | number): string => {
    try {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(num)) return '0';
      
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
      if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
      return num.toFixed(1);
    } catch (error) {
      console.error('Error formatting number:', error);
      return '0';
    }
  };


  // Backend integration for optimized data loading
  useEffect(() => {
    const loadPools = async () => {
      setIsLoading(true);
      try {
        console.log('🚀 Fetching pools from optimized backend API with caching...');
        
        // Create cache key based on current filters
        const cacheKey = frontendCache.getPoolKey('list', undefined, {
          category: categoryFilter === "all" ? undefined : categoryFilter,
          status: activeCategory === "all" ? undefined : (activeCategory as PoolStatus),
          sortBy: sortBy,
          limit: 50,
          offset: 0
        });
        
        // Fetch pools and analytics in parallel from cache or API
        const [poolsData, analyticsData] = await Promise.all([
          frontendCache.get(
            cacheKey,
            () => optimizedPoolService.getPools({ 
              category: categoryFilter === "all" ? undefined : categoryFilter,
              status: activeCategory === "all" ? undefined : (activeCategory as PoolStatus),
              sortBy: sortBy,
              limit: 50, 
              offset: 0 
            })
          ),
          frontendCache.get(
            'analytics',
            () => optimizedPoolService.getAnalytics()
          )
        ]);

        // Set pools data and enhance with contract states
        console.log('🔗 Enhancing pools with contract settlement status...');
        const poolIds = poolsData.pools.map(p => p.id);
        const poolStates = await poolStateService.getBatchPoolStates(poolIds);
        
        const enhanced = poolsData.pools.map(pool => ({
          ...pool,
          settled: poolStates[pool.id]?.settled || (pool.status === 'settled'),
          creatorSideWon: poolStates[pool.id]?.creatorSideWon || false
        }));
        
        setEnhancedPools(enhanced);
        setFilteredPools(enhanced);
        
        // Set analytics stats
        setStats({
          totalVolume: analyticsData.totalVolume,
          bitrVolume: analyticsData.bitrVolume,
          sttVolume: analyticsData.sttVolume,
          activeMarkets: analyticsData.activePools,
          participants: analyticsData.participants,
          totalPools: analyticsData.totalPools,
          boostedPools: analyticsData.boostedPools,
          trendingPools: analyticsData.trendingPools
        });
        
        console.log('✅ Markets data loaded with caching:', {
          pools: poolsData.pools.length,
          analytics: analyticsData
        });
      } catch (error) {
        console.error('❌ Error loading pools from backend API:', error);
        toast.error('Failed to load markets. Please try again.');
        
        // Fallback to empty state
        setEnhancedPools([]);
        setFilteredPools([]);
        setStats({
          totalVolume: "0",
          bitrVolume: "0", 
          sttVolume: "0",
          activeMarkets: 0,
          participants: 0,
          totalPools: 0,
          boostedPools: 0,
          trendingPools: 0
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPools();
  }, [categoryFilter, activeCategory, sortBy]);

  const handleCreateMarket = () => {
    router.push("/create-prediction");
  };

  const categories = [
    { 
      id: "all" as MarketCategory, 
      label: "All Markets", 
      icon: FaChartLine, 
      color: "text-blue-400",
      description: "Browse all available prediction markets"
    },
    { 
      id: "active" as MarketCategory, 
      label: "Active", 
      icon: FaFire, 
      color: "text-green-400",
      description: "Currently active markets accepting bets"
    },
    { 
      id: "closed" as MarketCategory, 
      label: "Closed", 
      icon: FaClock, 
      color: "text-orange-400",
      description: "Markets that have ended, awaiting results"
    },
    { 
      id: "settled" as MarketCategory, 
      label: "Settled", 
      icon: FaTrophy, 
      color: "text-purple-400",
      description: "Completed markets with final results"
    },
    { 
      id: "boosted" as MarketCategory, 
      label: "Boosted", 
      icon: FaBolt, 
      color: "text-yellow-400",
      description: "Markets with enhanced rewards and visibility"
    },
    { 
      id: "private" as MarketCategory, 
      label: "Private", 
      icon: FaLock, 
      color: "text-gray-400",
      description: "Exclusive whitelisted markets"
    },
  ];

  const sortOptions = [
    { id: "newest" as SortBy, label: "Newest First", icon: FaClock },
    { id: "oldest" as SortBy, label: "Oldest First", icon: FaClock },
    { id: "volume" as SortBy, label: "Highest Volume", icon: FaTrophy },
    { id: "ending-soon" as SortBy, label: "Ending Soon", icon: FaClock },
  ];


  // Filter and sort pools
  useEffect(() => {
    let filtered = enhancedPools;

    // Category filter
    if (activeCategory !== "all") {
      filtered = filtered.filter(pool => {
        switch (activeCategory) {
          case "active":
            return pool.status === 'active' && !pool.isSettled;
          case "closed":
            return pool.status === 'closed' && !pool.isSettled;
          case "settled":
            return pool.isSettled || pool.status === 'settled';
          case "boosted":
            return pool.boostTier && pool.boostTier !== "NONE";
          case "trending":
            return pool.trending;
          case "private":
            // Private pools not supported in current OptimizedPool interface
            return false;
          case "combo":
            // Combo pools not supported in current OptimizedPool interface
            return false;
          default:
            return true;
        }
      });
    }

    // Sport/Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(pool => {
        switch (categoryFilter) {
          case "football":
            return pool.category === "football";
          case "crypto":
            return pool.category === "crypto";
          case "basketball":
            return pool.category === "basketball";
          case "other":
            return !["football", "crypto", "basketball"].includes(pool.category);
          default:
            return true;
        }
      });
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(pool => 
        pool.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pool.predictedOutcome?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (pool.league?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        pool.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pool.homeTeam?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (pool.awayTeam?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return b.id - a.id;
        case "oldest":
          return a.id - b.id;
        case "volume":
          return parseFloat(b.totalBettorStake) - parseFloat(a.totalBettorStake);
        case "ending-soon":
          return a.bettingEndTime - b.bettingEndTime;
        default:
          return 0;
      }
    });

    setFilteredPools(filtered);
  }, [enhancedPools, activeCategory, categoryFilter, searchTerm, sortBy]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <AnimatedTitle 
        size="md"
        leftIcon={FaChartLine}
        rightIcon={FaTrophy}
      >
        Prediction Markets
      </AnimatedTitle>
      
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-base text-text-secondary max-w-2xl mx-auto text-center mb-6"
      >
        Discover and participate in prediction markets across sports, crypto, and more. 
        Put your knowledge to the test and earn rewards for accurate predictions.
      </motion.p>

      {/* Recent Bets Lane */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <RecentBetsLane />
      </motion.div>

      {/* Filters & Search */}
      <div className="mb-8">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all text-sm sm:text-base ${
                  activeCategory === category.id
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                    : "bg-white/10 text-gray-300 hover:text-white hover:bg-white/20"
                }`}
              >
                <Icon className={`h-4 w-4 ${category.color}`} />
                <span className="hidden sm:inline">{category.label}</span>
                <span className="sm:hidden">{category.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Sport/Category Filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {[
            { id: "all" as CategoryFilter, label: "All Sports", icon: "🏆" },
            { id: "football" as CategoryFilter, label: "Football", icon: "⚽" },
            { id: "crypto" as CategoryFilter, label: "Crypto", icon: "₿" },
            { id: "basketball" as CategoryFilter, label: "Basketball", icon: "🏀" },
            { id: "other" as CategoryFilter, label: "Other", icon: "🎯" }
          ].map((category) => (
            <button
              key={category.id}
              onClick={() => setCategoryFilter(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all text-sm sm:text-base ${
                categoryFilter === category.id
                  ? "bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg"
                  : "bg-white/10 text-gray-300 hover:text-white hover:bg-white/20"
              }`}
            >
              <span className="text-lg">{category.icon}</span>
              <span className="hidden sm:inline">{category.label}</span>
              <span className="sm:hidden">{category.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Search and Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center glass-card p-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search markets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <FaSort className="h-4 w-4 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {sortOptions.map((option) => (
                  <option key={option.id} value={option.id} className="bg-gray-800">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm ${
                showFilters 
                  ? "bg-blue-500 text-white" 
                  : "bg-white/10 text-gray-300 hover:text-white hover:bg-white/20"
              }`}
            >
              <FaFilter className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
        </div>

        {/* Active Category Description */}
        <div className="mt-4 text-center">
          <p className="text-gray-300">
            {categories.find(c => c.id === activeCategory)?.description}
          </p>
        </div>
      </div>

      {/* Markets Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Markets List */}
        <div className="xl:col-span-3">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-8 border border-white/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <FaChartLine className="h-5 w-5 text-blue-400" />
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  {categories.find(c => c.id === activeCategory)?.label || "All"} Markets
                </h2>
              </div>
              <div className="flex items-center gap-2 text-gray-300 justify-center sm:justify-start">
                <span className="text-sm sm:text-base">
                  {isLoading ? "Loading markets..." : `${filteredPools.length} markets found`}
                </span>
              </div>
            </div>
            
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading markets...</p>
              </div>
            ) : filteredPools.length === 0 ? (
              <div className="text-center py-12">
                <FaChartLine className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Markets Found</h3>
                <p className="text-gray-400 mb-6">
                  {activeCategory === "all" 
                    ? "No prediction markets are currently available."
                    : `No ${activeCategory} markets found. Try a different category or create a new market.`
                  }
                </p>
                <button
                  onClick={handleCreateMarket}
                  className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-all"
                >
                  Create Market
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {isLoading ? (
                  <SkeletonLoader type="markets-list" count={6} />
                ) : (
                <AnimatePresence>
                  {filteredPools.map((pool, index) => (
                    <EnhancedPoolCard
                      key={pool.id}
                      pool={convertToEnhancedPool(pool)}
                      index={index}
                      className="w-full"
                    />
                  ))}
                </AnimatePresence>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="xl:col-span-1">
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">Market Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">BITR Volume</span>
                  <span className="text-white font-semibold">{formatNumber(stats.bitrVolume || "0")} BITR</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">STT Volume</span>
                  <span className="text-white font-semibold">{formatNumber(stats.sttVolume || "0")} STT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Active Markets</span>
                  <span className="text-white font-semibold">{stats.activeMarkets}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Participants</span>
                  <span className="text-white font-semibold">{stats.participants}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Total Pools</span>
                  <span className="text-white font-semibold">{stats.totalPools}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={handleCreateMarket}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 px-4 rounded-lg transition-all"
                >
                  Create Market
                </button>
                
                <button
                  onClick={() => router.push("/oddyssey")}
                  className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-semibold py-3 px-4 rounded-lg transition-all"
                >
                  Play Oddyssey
                </button>
                
                <button
                  onClick={() => router.push("/staking")}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 px-4 rounded-lg transition-all"
                >
                  Stake BITR
                </button>
              </div>
            </div>

            {/* Boost Information */}
            <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <FaBolt className="h-6 w-6 text-yellow-400" />
                <h3 className="text-xl font-bold text-white">Boost Rewards</h3>
              </div>
              <p className="text-gray-300 mb-4 text-sm">
                Pool creators can boost their markets for better visibility and higher rewards.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-orange-400">🥉 Bronze</span>
                  <span className="text-white">2 STT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">🥈 Silver</span>
                  <span className="text-white">3 STT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-400">🥇 Gold</span>
                  <span className="text-white">5 STT</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Boost fees are distributed to winners as additional rewards.
              </p>
            </div>

            {/* Features Info */}
            <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <FaGift className="h-6 w-6 text-purple-400" />
                <h3 className="text-xl font-bold text-white">Features</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <FaStar className="h-3 w-3 text-green-400" />
                  <span className="text-gray-300">Combo Pools</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaLock className="h-3 w-3 text-purple-400" />
                  <span className="text-gray-300">Private Markets</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaBolt className="h-3 w-3 text-yellow-400" />
                  <span className="text-gray-300">Boost System</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaShieldAlt className="h-3 w-3 text-blue-400" />
                  <span className="text-gray-300">Oracle Integration</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

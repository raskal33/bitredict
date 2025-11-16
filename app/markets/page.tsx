"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { optimizedPoolService, type OptimizedPool } from "@/services/optimizedPoolService";
import { frontendCache } from "@/services/frontendCache";
import RecentBetsLane from "@/components/RecentBetsLane";
import { PoolCardCatalog, PoolCardModal, type EnhancedPool } from "@/components/PoolCard";
import { LivePoolUpdates } from "@/components/LivePoolUpdates";
import { 
  FaChartLine, 
  FaSearch, 
  FaBolt, 
  FaTrophy, 
  FaLock, 
  FaFire,
  FaClock,
  FaSort
} from "react-icons/fa";

type MarketCategory = "all" | "boosted" | "trending" | "private" | "combo" | "active" | "closed" | "settled";
type CategoryFilter = "all" | "football" | "crypto" | "basketball" | "other";
type SortBy = "newest" | "oldest" | "volume" | "ending-soon";



type StatsTab = "pools" | "stats";

export default function MarketsPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<MarketCategory>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPool, setSelectedPool] = useState<EnhancedPool | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
  const [mobileTab, setMobileTab] = useState<StatsTab>("pools"); // ✅ Mobile tab state

  // Convert OptimizedPool to EnhancedPool
  const convertToEnhancedPool = (pool: OptimizedPool & { isSettled?: boolean; creatorSideWon?: boolean }): EnhancedPool => {
    return {
      id: pool.id,
      creator: pool.creator.address,
      odds: pool.odds,
      settled: pool.isSettled || false,
      creatorSideWon: pool.creatorSideWon || false,
      isPrivate: false,
      usesBitr: pool.currency === 'BITR',
      filledAbove60: pool.fillPercentage >= 60,
      oracleType: (pool.oracleType as 'GUIDED' | 'OPEN') || 'GUIDED',
      status: pool.status as 'active' | 'closed' | 'settled' | 'cancelled',
      creatorStake: pool.creatorStake,
      totalCreatorSideStake: pool.totalCreatorSideStake || pool.creatorStake,
      // ✅ CRITICAL FIX: Backend returns maxBettorStake which is current_max_bettor_stake (remaining capacity)
      // NOT maxPoolSize (total pool size). Use maxBettorStake if available, fallback to calculated value
      maxBettorStake: (pool as OptimizedPool & { maxBettorStake?: string; currentMaxBettorStake?: string }).maxBettorStake || 
                      (pool as OptimizedPool & { maxBettorStake?: string; currentMaxBettorStake?: string }).currentMaxBettorStake || 
                      pool.maxPoolSize,
      totalBettorStake: pool.totalBettorStake,
      predictedOutcome: pool.predictedOutcome || 'Unknown',
      result: '',
      marketId: pool.marketId || '',
      ...(pool.fixtureId && { fixtureId: pool.fixtureId }),
      ...(pool.homeTeamLogo && { homeTeamLogo: pool.homeTeamLogo }),
      ...(pool.awayTeamLogo && { awayTeamLogo: pool.awayTeamLogo }),
      ...((pool as { leagueLogo?: string }).leagueLogo && { leagueLogo: (pool as { leagueLogo?: string }).leagueLogo }),
      ...(pool.cryptoLogo && { cryptoLogo: pool.cryptoLogo }),
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
        
        // ✅ FIX: Always fetch ALL pools, then filter client-side for accurate filtering
        // This ensures filters work correctly regardless of backend filter support
        const cacheKey = frontendCache.getPoolKey('list', undefined, {
          category: undefined, // Fetch all categories
          status: undefined, // Fetch all statuses
          sortBy: sortBy,
          limit: 100, // Fetch more pools to ensure we have data for all filters
          offset: 0
        });
        
        const [poolsData, analyticsData] = await Promise.all([
          frontendCache.get(
            cacheKey,
            () => optimizedPoolService.getPools({ 
              category: undefined, // Fetch all
              status: undefined, // Fetch all
              sortBy: sortBy,
              limit: 100, 
              offset: 0 
            })
          ),
          frontendCache.get(
            'analytics',
            () => optimizedPoolService.getAnalytics()
          )
        ]);

        // Pools already include isSettled and creatorSideWon from database (synced by backend event listeners)
        // No need to call contract - database is the source of truth
        const enhanced = poolsData.pools.map(pool => ({
          ...pool,
          settled: pool.isSettled || (pool.status === 'settled'),
          creatorSideWon: pool.creatorSideWon || false
        }));
        
        setEnhancedPools(enhanced);
        // Don't set filteredPools here - let the filter useEffect handle it
        
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
            return false;
          case "combo":
            return false;
          default:
            return true;
        }
      });
    }

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Subtle grid pattern background */}
      <div 
        className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative space-y-4 max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6"
      >
        {/* Compact Header - Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 flex items-center gap-2 sm:gap-3">
              <FaChartLine className="text-cyan-400 h-5 w-5 sm:h-6 sm:w-6" />
              Markets
            </h1>
            <p className="text-xs sm:text-sm text-gray-400">
              The Uniswap of prediction markets
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>{filteredPools.length} active</span>
          </div>
        </div>

        {/* Compact Recent Bets Lane */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-4"
        >
          <RecentBetsLane className="!p-3" />
        </motion.div>

        {/* Professional Filters & Search - Compact & Responsive */}
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-3 mb-4">
          <div className="space-y-3">
            {/* Top Row: Market Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              {/* Market Status Filters - Compact Horizontal */}
              <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const isActive = activeCategory === category.id;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-all text-xs whitespace-nowrap ${
                        isActive
                          ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md shadow-cyan-500/20"
                          : "bg-slate-700/50 text-gray-300 hover:text-white hover:bg-slate-700/70"
                      }`}
                    >
                      <Icon className={`h-3 w-3 ${isActive ? 'text-white' : category.color}`} />
                      <span className="hidden sm:inline">{category.label}</span>
                      <span className="sm:hidden">{category.label.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>

              {/* Search & Sort - Right Side */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Search */}
                <div className="relative flex-1 sm:flex-initial sm:w-48 min-w-[120px]">
                  <FaSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-xs placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                  />
                </div>

                {/* Sort */}
                <div className="flex items-center gap-1.5">
                  <FaSort className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortBy)}
                    className="bg-slate-700/50 border border-slate-600/50 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-cyan-500/50 min-w-[100px]"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.id} value={option.id} className="bg-slate-800">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Bottom Row: Category Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400 font-medium hidden sm:inline">Category:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "all" as CategoryFilter, label: "All", icon: "🏆", name: "All Sports" },
                  { id: "football" as CategoryFilter, label: "⚽", icon: "⚽", name: "Football" },
                  { id: "crypto" as CategoryFilter, label: "₿", icon: "₿", name: "Crypto" },
                  { id: "basketball" as CategoryFilter, label: "🏀", icon: "🏀", name: "Basketball" },
                  { id: "other" as CategoryFilter, label: "🎯", icon: "🎯", name: "Other" }
                ].map((category) => {
                  const isActive = categoryFilter === category.id;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setCategoryFilter(category.id)}
                      className={`px-2.5 py-1.5 rounded-lg font-medium transition-all text-xs ${
                        isActive
                          ? "bg-emerald-500/80 text-white shadow-md"
                          : "bg-slate-700/50 text-gray-400 hover:text-white hover:bg-slate-700/70"
                      }`}
                      title={category.name}
                    >
                      {category.icon}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Tabs - Only visible on mobile */}
        <div className="lg:hidden mb-4">
          <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-1 flex gap-1">
            <button
              onClick={() => setMobileTab("pools")}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all ${
                mobileTab === "pools"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Pools
            </button>
            <button
              onClick={() => setMobileTab("stats")}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all ${
                mobileTab === "stats"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Stats
            </button>
          </div>
        </div>

        {/* Markets Grid - Compact Layout - Fully Responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Markets List */}
          <div className={`lg:col-span-3 ${mobileTab === "pools" ? "block" : "hidden lg:block"} order-2 lg:order-1`}>
            <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">
                    {categories.find(c => c.id === activeCategory)?.label || "All"} Markets
                  </h2>
                  <span className="text-xs text-gray-400 bg-slate-700/50 px-2 py-0.5 rounded">
                    {isLoading ? "..." : filteredPools.length}
                  </span>
                </div>
              </div>
              
              {isLoading ? (
                <div className="text-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                  <p className="text-gray-400 text-sm">Loading markets...</p>
                </div>
              ) : filteredPools.length === 0 ? (
                <div className="text-center py-16">
                  <FaChartLine className="h-10 w-10 text-gray-500 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-white mb-2">No Markets Found</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    {activeCategory === "all" 
                      ? "No prediction markets available."
                      : `No ${activeCategory} markets found.`
                    }
                  </p>
                  <button
                    onClick={handleCreateMarket}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-all text-sm"
                  >
                    Create Market
                  </button>
                </div>
              ) : (
                <div className="w-full overflow-x-hidden">
                  <PoolCardCatalog
                    pools={filteredPools.map(convertToEnhancedPool)}
                    onPoolClick={(pool) => {
                      setSelectedPool(pool);
                      setIsModalOpen(true);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Compact Sidebar - Responsive */}
          <div className={`lg:col-span-1 space-y-3 ${mobileTab === "stats" ? "block" : "hidden lg:block"} order-1 lg:order-2`}>
            {/* Live Activity Feed */}
            <LivePoolUpdates />

            {/* Quick Stats - Compact */}
            <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <FaChartLine className="h-4 w-4 text-cyan-400" />
                Stats
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">BITR Vol</span>
                  <span className="text-white font-semibold">{formatNumber(stats.bitrVolume || "0")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">STT Vol</span>
                  <span className="text-white font-semibold">{formatNumber(stats.sttVolume || "0")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Active</span>
                  <span className="text-white font-semibold">{stats.activeMarkets}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Users</span>
                  <span className="text-white font-semibold">{stats.participants}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions - Compact */}
            <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
              <h3 className="text-sm font-bold text-white mb-3">Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={handleCreateMarket}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-2 px-3 rounded-lg transition-all text-xs"
                >
                  Create Market
                </button>
                <button
                  onClick={() => router.push("/oddyssey")}
                  className="w-full bg-gradient-to-r from-green-500/80 to-emerald-500/80 hover:from-green-500 hover:to-emerald-500 text-white font-semibold py-2 px-3 rounded-lg transition-all text-xs"
                >
                  Play Oddyssey
                </button>
              </div>
            </div>

            {/* Daily Stats - Compact */}
            <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <FaChartLine className="h-4 w-4 text-cyan-400" />
                Daily Stats
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">24h Volume</span>
                  <span className="text-cyan-400 font-semibold">{formatNumber(stats.totalVolume || "0")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">New Pools</span>
                  <span className="text-emerald-400 font-semibold">{stats.totalPools}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">New Users</span>
                  <span className="text-purple-400 font-semibold">{stats.participants}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Active Now</span>
                  <span className="text-yellow-400 font-semibold">{stats.activeMarkets}</span>
                </div>
              </div>
            </div>

            {/* Volume Breakdown - Compact */}
            <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <FaTrophy className="h-4 w-4 text-yellow-400" />
                Volume Breakdown
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Volume</span>
                  <span className="text-white font-semibold">{formatNumber(stats.totalVolume || "0")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">BITR Volume</span>
                  <span className="text-blue-400 font-semibold">{formatNumber(stats.bitrVolume || "0")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">STT Volume</span>
                  <span className="text-green-400 font-semibold">{formatNumber(stats.sttVolume || "0")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Avg Pool Size</span>
                  <span className="text-cyan-400 font-semibold">
                    {stats.totalPools > 0 ? formatNumber(parseFloat(stats.totalVolume || "0") / stats.totalPools) : "0"}
                  </span>
                </div>
              </div>
            </div>

            {/* Platform Activity - Compact */}
            <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <FaFire className="h-4 w-4 text-orange-400" />
                Platform Activity
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Pools</span>
                  <span className="text-white font-semibold">{stats.totalPools}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Boosted</span>
                  <span className="text-yellow-400 font-semibold">{stats.boostedPools}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Trending</span>
                  <span className="text-pink-400 font-semibold">{stats.trendingPools}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Participants</span>
                  <span className="text-cyan-400 font-semibold">{stats.participants}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pool Card Modal */}
        <PoolCardModal
          pool={selectedPool}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </motion.div>
    </div>
  );
}

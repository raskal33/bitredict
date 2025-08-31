"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import AnimatedTitle from "@/components/AnimatedTitle";
import { PoolService, type Pool, type PoolStats } from "@/services/poolService";
import EnhancedPoolCard, { EnhancedPool } from "@/components/EnhancedPoolCard";
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
type SortBy = "newest" | "oldest" | "volume" | "ending-soon";



export default function MarketsPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<MarketCategory>("all");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [pools, setPools] = useState<EnhancedPool[]>([]);
  const [filteredPools, setFilteredPools] = useState<EnhancedPool[]>([]);
  const [stats, setStats] = useState<PoolStats>({
    totalVolume: "0",
    bitrVolume: "0",
    sttVolume: "0",
    activeMarkets: 0,
    participants: 0,
    totalPools: 0,
    boostedPools: 0,
    comboPools: 0,
    privatePools: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // Convert service Pool to EnhancedPool format
  const convertToEnhancedPool = (pool: Pool): EnhancedPool => {
    return {
      id: pool.poolId, // Use poolId from backend
      creator: pool.creator,
      odds: pool.odds,
      settled: pool.settled,
      creatorSideWon: pool.creatorSideWon || false, // Handle null
      isPrivate: pool.isPrivate,
      usesBitr: pool.usesBitr,
      filledAbove60: pool.filledAbove60 || false, // Use from backend or default
      oracleType: (pool.oracleType as 'GUIDED' | 'OPEN') || 'GUIDED', // Use from backend or default
      
      creatorStake: pool.creatorStake,
      totalCreatorSideStake: pool.totalCreatorSideStake || pool.creatorStake, // Use from backend or fallback
      maxBettorStake: pool.maxBettorStake || pool.totalBettorStake, // Use from backend or fallback
      totalBettorStake: pool.totalBettorStake,
      predictedOutcome: pool.predictedOutcome,
      result: pool.result || '', // Use from backend or empty
      marketId: pool.marketId,
      
      eventStartTime: typeof pool.eventStartTime === 'string' ? new Date(pool.eventStartTime).getTime() / 1000 : pool.eventStartTime,
      eventEndTime: typeof pool.eventEndTime === 'string' ? new Date(pool.eventEndTime).getTime() / 1000 : pool.eventEndTime,
      bettingEndTime: typeof pool.bettingEndTime === 'string' ? new Date(pool.bettingEndTime).getTime() / 1000 : pool.bettingEndTime,
      resultTimestamp: pool.resultTimestamp ? new Date(pool.resultTimestamp).getTime() / 1000 : 0, // Convert ISO to timestamp
      arbitrationDeadline: pool.arbitrationDeadline ? new Date(pool.arbitrationDeadline).getTime() / 1000 : (typeof pool.eventEndTime === 'string' ? new Date(pool.eventEndTime).getTime() / 1000 + (24 * 60 * 60) : pool.eventEndTime + (24 * 60 * 60)), // Use from backend or calculate
      
      league: pool.league,
      category: pool.category,
      region: pool.region,
      maxBetPerUser: pool.maxBetPerUser,
      
      boostTier: pool.boostTier || 'NONE', // Use from backend or default
      boostExpiry: pool.boostExpiry || 0, // Use from backend or default
      trending: false, // Default value
      socialStats: {
        likes: 0,
        comments: 0,
        views: 0
      },
      change24h: 0 // Default value
    };
  };

  // Load pools from backend API
  useEffect(() => {
    const loadPools = async () => {
      setIsLoading(true);
      try {
        const fetchedPools = await PoolService.getPools(50, 0);
        const enhancedPools = fetchedPools.map(convertToEnhancedPool);
        setPools(enhancedPools);
        setFilteredPools(enhancedPools);
        
        // Load stats
        const poolStats = await PoolService.getPoolStats();
        setStats(poolStats);
      } catch (error) {
        console.error('Error loading pools:', error);
        toast.error('Failed to load markets');
      } finally {
        setIsLoading(false);
      }
    };

    loadPools();
  }, []);

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

  // Fetch pools from service
  useEffect(() => {
    const fetchPools = async () => {
      setIsLoading(true);
      try {
        const poolsData = await PoolService.getPoolsByCategory('all', 50, 0);
        const enhancedPools = poolsData.map(convertToEnhancedPool);
        setPools(enhancedPools);
        
        // Get stats from service
        const statsData = await PoolService.getPoolStats();
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching pools:', error);
        toast.error('Failed to load markets');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPools();
  }, []);

  // Filter and sort pools
  useEffect(() => {
    let filtered = pools;

    // Category filter
    if (activeCategory !== "all") {
      filtered = filtered.filter(pool => {
        switch (activeCategory) {
          case "active":
            return !pool.settled && new Date(pool.eventStartTime).getTime() > Date.now();
          case "closed":
            return !pool.settled && new Date(pool.eventStartTime).getTime() <= Date.now();
          case "settled":
            return pool.settled;
          case "boosted":
            return pool.boostTier !== "NONE";
          case "private":
            return pool.isPrivate;
          default:
            return true;
        }
      });
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(pool => 
        pool.predictedOutcome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pool.league.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pool.category.toLowerCase().includes(searchTerm.toLowerCase())
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
    }, [pools, activeCategory, searchTerm, sortBy]);

  // Utility functions for pool display (available for future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const formatStake = PoolService.formatStake;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const formatOdds = PoolService.formatOdds;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const formatTimeLeft = PoolService.formatTimeLeft;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getBoostBadge = PoolService.getBoostBadge;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getCategoryIcon = PoolService.getCategoryIcon;

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
                <AnimatePresence>
                  {filteredPools.map((pool) => (
                    <EnhancedPoolCard
                      key={pool.id}
                      pool={pool}
                      index={pool.id}
                    />
                  ))}
                </AnimatePresence>
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
                  <span className="text-white font-semibold">{stats.bitrVolume || "0"} BITR</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">STT Volume</span>
                  <span className="text-white font-semibold">{stats.sttVolume || "0"} STT</span>
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

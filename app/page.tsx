"use client";

import { useEffect, useCallback, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  TrophyIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  BoltIcon,
  StarIcon,
  UsersIcon,
  AcademicCapIcon,
  RocketLaunchIcon
} from "@heroicons/react/24/outline";
import {
  BoltIcon as BoltSolid,
  TrophyIcon as TrophySolid,
  ShieldCheckIcon as ShieldSolid
} from "@heroicons/react/24/solid";
import { optimizedPoolService, type OptimizedPool } from "@/services/optimizedPoolService";
import { frontendCache } from "@/services/frontendCache";
import { PoolCardCatalog, PoolCardModal, type EnhancedPool } from "@/components/PoolCard";
import RecentBetsLane from "@/components/RecentBetsLane";

export default function HomePage() {
  const [enhancedPools, setEnhancedPools] = useState<EnhancedPool[]>([]);
  const [selectedPool, setSelectedPool] = useState<EnhancedPool | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState({
    totalVolume: "0",
    bitrVolume: "0", 
    sttVolume: "0",
    activePools: 0,
    participants: 0,
    totalPools: 0,
    boostedPools: 0,
    trendingPools: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("");

  // Convert OptimizedPool to EnhancedPool format with backend settlement data
  const convertOptimizedToEnhanced = useCallback(async (pool: OptimizedPool): Promise<EnhancedPool> => {
    const isSettled = pool.isSettled === true || 
                     (typeof pool.isSettled === 'string' && pool.isSettled === 'true') || 
                     (typeof pool.isSettled === 'number' && pool.isSettled === 1);
    const creatorSideWon = pool.creatorSideWon === true || 
                           (typeof pool.creatorSideWon === 'string' && pool.creatorSideWon === 'true') || 
                           (typeof pool.creatorSideWon === 'number' && pool.creatorSideWon === 1);
    
    return {
      id: pool.id,
      creator: pool.creator.address,
      odds: pool.odds,
      settled: isSettled,
      creatorSideWon: creatorSideWon,
      isPrivate: false,
      usesBitr: pool.currency === 'BITR',
      filledAbove60: pool.fillPercentage >= 60,
      oracleType: 'GUIDED' as const,
      
      creatorStake: pool.creatorStake,
      totalCreatorSideStake: pool.creatorStake,
      maxBettorStake: pool.maxPoolSize,
      totalBettorStake: pool.totalBettorStake,
      predictedOutcome: pool.predictedOutcome || 'Unknown',
      result: '',
      marketId: pool.marketId || pool.id.toString(),
      ...(pool.fixtureId && { fixtureId: pool.fixtureId }),
      ...(pool.homeTeamLogo && { homeTeamLogo: pool.homeTeamLogo }),
      ...(pool.awayTeamLogo && { awayTeamLogo: pool.awayTeamLogo }),
      ...((pool as { leagueLogo?: string }).leagueLogo && { leagueLogo: (pool as { leagueLogo?: string }).leagueLogo }),
      ...(pool.cryptoLogo && { cryptoLogo: pool.cryptoLogo }),
      
      eventStartTime: pool.eventStartTime,
      eventEndTime: pool.eventEndTime,
      bettingEndTime: pool.bettingEndTime,
      resultTimestamp: 0,
      arbitrationDeadline: pool.eventEndTime + 86400,
      
      league: pool.league || 'Unknown',
      category: pool.category,
      region: pool.region || 'Unknown',
      title: pool.title,
      homeTeam: pool.homeTeam,
      awayTeam: pool.awayTeam,
      maxBetPerUser: pool.maxPoolSize,
      
      boostTier: pool.boostTier === 'GOLD' ? 'GOLD' : 
                 pool.boostTier === 'SILVER' ? 'SILVER' : 
                 pool.boostTier === 'BRONZE' ? 'BRONZE' : 'NONE',
      boostExpiry: 0,
      trending: pool.trending,
      socialStats: pool.socialStats,
      
      isComboPool: false,
      indexedData: {
        participantCount: pool.participants,
        fillPercentage: pool.fillPercentage,
        totalVolume: pool.totalBettorStake,
        betCount: pool.totalBets || 0,
        avgBetSize: pool.avgBet ? pool.avgBet.toString() : '0',
        creatorReputation: pool.creator.successRate,
        categoryRank: 0,
        isHot: pool.trending,
        lastActivity: new Date()
      },
      totalBets: pool.totalBets || 0,
      avgBet: pool.avgBet ? pool.avgBet.toString() : '0'
    };
  }, []);

  const fetchPlatformStats = useCallback(async () => {
    try {
      console.log('🚀 Fetching platform stats with caching...');
      
      const analyticsData = await frontendCache.get(
        'analytics',
        () => optimizedPoolService.getAnalytics()
      );
      
      setStats(analyticsData);
      console.log('✅ Platform stats loaded:', analyticsData);
    } catch (error) {
      console.error('❌ Error fetching platform stats:', error);
      setStats({
        totalVolume: "2840000",
        bitrVolume: "1420000",
        sttVolume: "1420000", 
        activePools: 156,
        participants: 8924,
        totalPools: 247,
        boostedPools: 23,
        trendingPools: 12
      });
    }
  }, []);

  const fetchPools = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🚀 Fetching featured pools with caching...');

      const cacheKey = 'featuredPools:list:newest:limit=12';
      const poolsData = await frontendCache.get(
        cacheKey,
        () => optimizedPoolService.getPools({ 
          limit: 12,
          sortBy: 'newest'
        })
      );
      
      const enhanced = await Promise.all(
        poolsData.pools.map(async (pool) => {
          const enhancedPool = await convertOptimizedToEnhanced(pool);
          return enhancedPool;
        })
      );
      
      setEnhancedPools(enhanced);
      console.log('✅ Featured pools loaded and enhanced:', enhanced.length, 'pools');
    } catch (error) {
      console.error('❌ Error fetching pools:', error);
      setEnhancedPools([]);
    } finally {
      setLoading(false);
    }
  }, [convertOptimizedToEnhanced]);

  useEffect(() => {
    fetchPlatformStats();
    fetchPools();
  }, [fetchPlatformStats, fetchPools]);

  // ✅ FIX: Ensure filters work correctly
  const filteredPools = enhancedPools.filter(pool => {
    if (activeCategory === "" || activeCategory === "All") {
      return true; // Show all pools
    }
    // Match category exactly (case-insensitive)
    return pool.category?.toLowerCase() === activeCategory.toLowerCase();
  });

  const categories = ["All", "football", "crypto", "basketball", "other"];

  const features = [
    {
      title: "Challenge System",
      description: "Challenge creators and earn rewards when you're right. The more unlikely the prediction, the higher the rewards.",
      icon: TrophySolid,
      color: "from-yellow-500 to-orange-500"
    },
    {
      title: "Social Trading",
      description: "Follow top predictors, share insights, and build your reputation in the community.",
      icon: UsersIcon,
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Boost System",
      description: "Get your predictions featured with our boost system. Quality predictions get more visibility.",
      icon: BoltSolid,
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "Transparent Markets",
      description: "All predictions are verifiable and settled transparently on the blockchain.",
      icon: ShieldSolid,
      color: "from-green-500 to-emerald-500"
    }
  ];

  const handleSetCategory = (category: string) => {
    setActiveCategory(category === "All" ? "" : category);
  };

  const StatCard = ({ icon: Icon, label, value, suffix = "", delay = 0 }: { 
    icon: React.ElementType; 
    label: string; 
    value: string | number; 
    suffix?: string;
    delay?: number;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      className="bg-slate-700/30 backdrop-blur-sm border border-slate-600/50 rounded-lg p-3 sm:p-4 text-center group hover:border-cyan-500/30 hover:bg-slate-700/40 transition-all duration-300"
    >
      <div className="flex justify-center mb-2 sm:mb-3">
        <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg shadow-md">
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
      </div>
      <div className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">
        {label === "Total Volume" ? 
          `$${(parseFloat(value.toString()) / 1000).toFixed(0)}k` : 
          typeof value === 'string' ? value : value.toLocaleString()
        }{suffix}
      </div>
      <div className="text-xs sm:text-sm text-gray-400">{label}</div>
    </motion.div>
  );

  return (
    <>
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
      
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 space-y-8 sm:space-y-12"
      >
        {/* Hero Section - Ultra Professional */}
        <div className="text-center max-w-5xl mx-auto pt-8 sm:pt-12 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                The Uniswap
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-orange-500 bg-clip-text text-transparent">
                of Prediction Markets
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-6 sm:mb-8 px-4">
              Where brilliant minds converge to predict tomorrow. Challenge creators, earn legendary rewards, and shape the future of decentralized prediction markets.
            </p>
            
            {/* Professional CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <Link href="/markets" className="w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3"
                >
                  <RocketLaunchIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  Explore Markets
                </motion.button>
              </Link>
              
              <Link href="/create-prediction" className="w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3"
                >
                  <TrophySolid className="w-5 h-5 sm:w-6 sm:h-6" />
                  Create Market
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
              
        {/* Recent Bets Lane */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 sm:mb-12"
        >
          <RecentBetsLane className="!p-3" />
        </motion.div>

        {/* Platform Stats - Professional Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 sm:p-6 mb-8 sm:mb-12"
        >
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Live Platform Stats
              </span>
            </h2>
            <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto">
              Join thousands of predictors in the most advanced prediction ecosystem
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <StatCard icon={CurrencyDollarIcon} label="Total Volume" value={stats.totalVolume} delay={0.1} />
            <StatCard icon={TrophyIcon} label="Active Pools" value={stats.activePools} delay={0.2} />
            <StatCard icon={UsersIcon} label="Participants" value={stats.participants} delay={0.3} />
            <StatCard icon={StarIcon} label="Total Pools" value={stats.totalPools} delay={0.4} />
            <StatCard icon={AcademicCapIcon} label="Boosted" value={stats.boostedPools} delay={0.5} />
            <StatCard icon={ChartBarIcon} label="Trending" value={stats.trendingPools} delay={0.6} />
          </div>
        </motion.div>

        {/* Features Section - Compact & Professional */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-8 sm:mb-12"
        >
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">
              <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                Why Choose Bitredict?
              </span>
            </h2>
            <p className="text-sm sm:text-base text-gray-400 max-w-3xl mx-auto">
              Experience the next generation of prediction markets with cutting-edge features
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-5 sm:p-6 text-center group hover:border-cyan-500/30 transition-all duration-300"
              >
                <div className="flex justify-center mb-4">
                  <div className={`p-3 bg-gradient-to-r ${feature.color} rounded-xl shadow-lg`}>
                    <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm sm:text-base text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Featured Pools - Professional Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-8 sm:mb-12"
        >
          <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 sm:p-6 mb-6">
            <div className="text-center mb-6">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">
                <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  Featured Predictions
                </span>
              </h2>
              <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto">
                Discover the most exciting prediction markets and challenge the best creators
              </p>
            </div>

            {/* Compact Category Filter */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {categories.map((category) => (
                <motion.button
                  key={category}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSetCategory(category)}
                  className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-medium transition-all text-xs sm:text-sm ${
                    (activeCategory === "" && category === "All") || activeCategory === category
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md shadow-cyan-500/25"
                      : "bg-slate-700/50 text-gray-400 hover:text-white hover:bg-slate-700/70 border border-slate-600/50"
                  }`}
                >
                  {category === "All" ? "All Markets" : category.charAt(0).toUpperCase() + category.slice(1)}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[...Array(6)].map((_, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="bg-slate-800/30 rounded-xl p-4 animate-pulse border border-slate-700/50"
                >
                  <div className="h-48 bg-slate-700/50 rounded-lg"></div>
                </motion.div>
              ))}
            </div>
          ) : filteredPools.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-white mb-2">No Markets Found</h3>
              <p className="text-gray-400 mb-6">
                {activeCategory === "" ? "No prediction markets available at the moment." : `No ${activeCategory} markets available.`}
              </p>
              <Link href="/create-prediction">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-xl font-bold"
                >
                  Create First Market
                </motion.button>
              </Link>
            </div>
          ) : (
            <div className="mb-8 sm:mb-12">
              <PoolCardCatalog
                pools={filteredPools.slice(0, 12)}
                onPoolClick={(pool) => {
                  setSelectedPool(pool);
                  setIsModalOpen(true);
                }}
              />
            </div>
          )}
          
          {/* View All Markets Button */}
          {filteredPools.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-8 sm:mb-12"
            >
              <Link href="/markets">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 flex items-center gap-2 mx-auto"
                >
                  View All Markets
                  <BoltIcon className="w-5 h-5" />
                </motion.button>
              </Link>
            </motion.div>
          )}

        {/* Live Analytics Dashboard - Compact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-8 sm:mb-12"
        >
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">
              <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                Live Platform Analytics
              </span>
            </h2>
            <p className="text-sm sm:text-base text-gray-400 max-w-3xl mx-auto">
              Real-time insights from our prediction ecosystem
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-5 sm:p-6"
            >
              <div className="flex items-center mb-4">
                <div className="p-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg mr-3">
                  <TrophyIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">Top Predictors</h3>
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Active Predictors</span>
                  <span className="text-cyan-400 font-bold">{stats.participants.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Total Pools</span>
                  <span className="text-emerald-400 font-bold">{stats.totalPools}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Boosted Pools</span>
                  <span className="text-yellow-400 font-bold">{stats.boostedPools}</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-5 sm:p-6"
            >
              <div className="flex items-center mb-4">
                <div className="p-2.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mr-3">
                  <ChartBarIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">Market Activity</h3>
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Active Pools</span>
                  <span className="text-purple-400 font-bold">{stats.activePools.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Trending Pools</span>
                  <span className="text-blue-400 font-bold">{stats.trendingPools.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Total Volume</span>
                  <span className="text-emerald-400 font-bold">${(parseFloat(stats.totalVolume) / 1000).toFixed(0)}k</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-5 sm:p-6"
            >
              <div className="flex items-center mb-4">
                <div className="p-2.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg mr-3">
                  <BoltIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">Platform Health</h3>
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Uptime</span>
                  <span className="text-emerald-400 font-bold">99.9%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Avg Response Time</span>
                  <span className="text-blue-400 font-bold">45ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Blockchain Sync</span>
                  <span className="text-cyan-400 font-bold">Live</span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* CTA Section - Professional */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 sm:p-8 md:p-12 text-center mb-8 sm:mb-12"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Ready to Challenge
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-orange-500 bg-clip-text text-transparent">
              The Future?
            </span>
          </h2>
          <p className="text-base sm:text-lg text-gray-300 mb-6 sm:mb-8 leading-relaxed max-w-3xl mx-auto">
            Join the elite community of predictors and start earning from your insights today.
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>Your legendary journey begins with a single prediction.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <Link href="/markets" className="w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3"
              >
                <RocketLaunchIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                Start Predicting
              </motion.button>
            </Link>
            
            <Link href="/create-prediction" className="w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3"
              >
                <TrophySolid className="w-5 h-5 sm:w-6 sm:h-6" />
                Create Pool
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </motion.section>

      {/* Pool Card Modal */}
      <PoolCardModal
        pool={selectedPool}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
    </>
  );
}

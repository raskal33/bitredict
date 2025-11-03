"use client";

import { useEffect, useCallback, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
import EnhancedPoolCard, { EnhancedPool } from "@/components/EnhancedPoolCard";
import RecentBetsLane from "@/components/RecentBetsLane";

export default function HomePage() {
  const [enhancedPools, setEnhancedPools] = useState<EnhancedPool[]>([]);
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
    // ✅ FIX: Use backend API values (already verified against contract in backend)
    // Backend API verifies settlement status against contract before returning data
    // isSettled and creatorSideWon are the source of truth from backend
    // ✅ FIX: Explicitly convert to boolean to handle string "true"/"false" from API
    const isSettled = pool.isSettled === true || 
                     (typeof pool.isSettled === 'string' && pool.isSettled === 'true') || 
                     (typeof pool.isSettled === 'number' && pool.isSettled === 1);
    const creatorSideWon = pool.creatorSideWon === true || 
                           (typeof pool.creatorSideWon === 'string' && pool.creatorSideWon === 'true') || 
                           (typeof pool.creatorSideWon === 'number' && pool.creatorSideWon === 1);
    
    // Debug logging to verify values
    if (pool.id === 8) {
      console.log('🔍 Pool 8 conversion:', {
        rawIsSettled: pool.isSettled,
        rawCreatorSideWon: pool.creatorSideWon,
        rawTypeIsSettled: typeof pool.isSettled,
        rawTypeCreatorSideWon: typeof pool.creatorSideWon,
        finalSettled: isSettled,
        finalCreatorSideWon: creatorSideWon
      });
    }
    
    return {
      id: pool.id,
      creator: pool.creator.address,
      odds: pool.odds, // Already in basis points format from backend (150 = 1.50x)
      settled: isSettled,
      creatorSideWon: creatorSideWon,
      isPrivate: false, // Not supported in OptimizedPool
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
      
      eventStartTime: pool.eventStartTime,
      eventEndTime: pool.eventEndTime,
      bettingEndTime: pool.bettingEndTime,
      resultTimestamp: 0,
      arbitrationDeadline: pool.eventEndTime + 86400,
      
      league: pool.league || 'Unknown',
      category: pool.category,
      region: pool.region || 'Unknown',
      title: pool.title, // Use backend-generated title
      homeTeam: pool.homeTeam,
      awayTeam: pool.awayTeam,
      maxBetPerUser: pool.maxPoolSize,
      
      boostTier: pool.boostTier === 'GOLD' ? 'GOLD' : 
                 pool.boostTier === 'SILVER' ? 'SILVER' : 
                 pool.boostTier === 'BRONZE' ? 'BRONZE' : 'NONE',
      boostExpiry: 0,
      trending: pool.trending,
      socialStats: pool.socialStats,
      
      // Optional fields
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
      // Additional fields for EnhancedPoolCard
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
      // Fallback to demo data
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

      // Fix: getPoolKey is a static method on FrontendCacheService, not on the instance
      const cacheKey = 'featuredPools:list:newest:limit=12';
      const poolsData = await frontendCache.get(
        cacheKey,
        () => optimizedPoolService.getPools({ 
          limit: 12,
          sortBy: 'newest'
        })
      );
      
      // Convert pools to enhanced format (API already verifies against contract)
      // No need to override with contract calls - backend API is source of truth
      const enhanced = await Promise.all(
        poolsData.pools.map(async (pool) => {
          const enhancedPool = await convertOptimizedToEnhanced(pool);
          // Use API values directly (already verified against contract in backend)
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

  const filteredPools = enhancedPools.filter(pool => 
    activeCategory === "" || pool.category === activeCategory
  );

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

  // Utility functions for pool display (available for future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getDifficultyColor = (tier: string) => {
    switch (tier) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-orange-400';
      case 'very_hard': return 'text-red-400';
      case 'legendary': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getBoostGlow = (tier?: number) => {
    if (!tier) return '';
    switch (tier) {
      case 1: return 'shadow-[0_0_20px_rgba(255,215,0,0.3)]';
      case 2: return 'shadow-[0_0_25px_rgba(192,192,192,0.4)]';
      case 3: return 'shadow-[0_0_30px_rgba(255,215,0,0.5)]';
      default: return '';
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getCardTheme = (theme: string) => {
    switch (theme) {
      case 'cyan':
        return {
          background: 'bg-gradient-to-br from-cyan-500/10 to-blue-500/10',
          border: 'border-cyan-500/20',
          glow: 'shadow-cyan-500/10',
          hoverGlow: 'hover:shadow-cyan-500/20',
          accent: 'text-cyan-400',
          progressBg: 'bg-gradient-to-r from-cyan-500 to-blue-500'
        };
      case 'purple':
        return {
          background: 'bg-gradient-to-br from-purple-500/10 to-pink-500/10',
          border: 'border-purple-500/20',
          glow: 'shadow-purple-500/10',
          hoverGlow: 'hover:shadow-purple-500/20',
          accent: 'text-purple-400',
          progressBg: 'bg-gradient-to-r from-purple-500 to-pink-500'
        };
      case 'green':
        return {
          background: 'bg-gradient-to-br from-green-500/10 to-emerald-500/10',
          border: 'border-green-500/20',
          glow: 'shadow-green-500/10',
          hoverGlow: 'hover:shadow-green-500/20',
          accent: 'text-green-400',
          progressBg: 'bg-gradient-to-r from-green-500 to-emerald-500'
        };
      case 'blue':
        return {
          background: 'bg-gradient-to-br from-blue-500/10 to-indigo-500/10',
          border: 'border-blue-500/20',
          glow: 'shadow-blue-500/10',
          hoverGlow: 'hover:shadow-blue-500/20',
          accent: 'text-blue-400',
          progressBg: 'bg-gradient-to-r from-blue-500 to-indigo-500'
        };
      case 'orange':
        return {
          background: 'bg-gradient-to-br from-orange-500/10 to-red-500/10',
          border: 'border-orange-500/20',
          glow: 'shadow-orange-500/10',
          hoverGlow: 'hover:shadow-orange-500/20',
          accent: 'text-orange-400',
          progressBg: 'bg-gradient-to-r from-orange-500 to-red-500'
        };
      case 'red':
        return {
          background: 'bg-gradient-to-br from-red-500/10 to-pink-500/10',
          border: 'border-red-500/20',
          glow: 'shadow-red-500/10',
          hoverGlow: 'hover:shadow-red-500/20',
          accent: 'text-red-400',
          progressBg: 'bg-gradient-to-r from-red-500 to-pink-500'
        };
      case 'magenta':
        return {
          background: 'bg-gradient-to-br from-pink-500/10 to-purple-500/10',
          border: 'border-pink-500/20',
          glow: 'shadow-pink-500/10',
          hoverGlow: 'hover:shadow-pink-500/20',
          accent: 'text-pink-400',
          progressBg: 'bg-gradient-to-r from-pink-500 to-purple-500'
        };
      default:
        return {
          background: 'bg-gradient-to-br from-gray-500/10 to-gray-600/10',
          border: 'border-gray-500/20',
          glow: 'shadow-gray-500/10',
          hoverGlow: 'hover:shadow-gray-500/20',
          accent: 'text-gray-400',
          progressBg: 'bg-gradient-to-r from-gray-500 to-gray-600'
        };
    }
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
      className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 text-center group hover:border-cyan-500/30 transition-all duration-300"
    >
      <div className="flex justify-center mb-4">
        <div className="p-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl shadow-lg">
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <div className="text-2xl font-bold text-white mb-2">
        {label === "Total Volume" ? 
          `$${(parseFloat(value.toString()) / 1000).toFixed(0)}k` : 
          typeof value === 'string' ? value : value.toLocaleString()
        }{suffix}
      </div>
      <div className="text-sm text-gray-400">{label}</div>
    </motion.div>
  );

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 space-y-12"
    >
      {/* Hero Section - Cleaner and More Focused */}
      <div className="text-center max-w-4xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">
            <span className="bg-gradient-to-r from-somnia-cyan via-somnia-blue to-somnia-violet bg-clip-text text-transparent">
              Challenge The Future
              </span>
            </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-8">
            Where brilliant minds converge to predict tomorrow. Challenge the Creators, earn legendary rewards, and shape the future of prediction markets.
          </p>
          
          {/* Streamlined CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/markets">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-somnia-cyan to-somnia-blue text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-somnia-cyan/25 hover:shadow-somnia-cyan/40 transition-all duration-300 flex items-center gap-3"
              >
                <RocketLaunchIcon className="w-6 h-6" />
                Explore Markets
              </motion.button>
            </Link>
            
            <Link href="/create-prediction">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-somnia-violet to-somnia-indigo text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-somnia-violet/25 hover:shadow-somnia-violet/40 transition-all duration-300 flex items-center gap-3"
              >
                <TrophySolid className="w-6 h-6" />
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
        transition={{ delay: 0.3 }}
        className="mb-12"
      >
        <RecentBetsLane />
      </motion.div>

      {/* Platform Stats - Compact and Focused */}
              <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
          <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Live Platform Stats
          </span>
        </h2>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
          Join thousands of predictors in the most advanced prediction ecosystem.
        </p>
            </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-16">
        <StatCard icon={CurrencyDollarIcon} label="Total Volume" value={stats.totalVolume} delay={0.1} />
        <StatCard icon={TrophyIcon} label="Active Pools" value={stats.activePools} delay={0.2} />
        <StatCard icon={UsersIcon} label="Participants" value={stats.participants} delay={0.3} />
        <StatCard icon={StarIcon} label="Total Pools" value={stats.totalPools} delay={0.4} />
        <StatCard icon={AcademicCapIcon} label="Boosted" value={stats.boostedPools} delay={0.5} />
        <StatCard icon={ChartBarIcon} label="Trending" value={stats.trendingPools} delay={0.6} />
      </div>

        {/* Features Section */}
        <section className="py-12 px-4 relative">
          <div className="container mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                  Why Choose Bitredict?
                </span>
              </h2>
              <p className="text-lg text-gray-400 max-w-3xl mx-auto">
                Experience the next generation of prediction markets with cutting-edge features
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
          <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 text-center group hover:border-cyan-500/30 transition-all duration-300"
                >
                  <div className="flex justify-center mb-6">
                    <div className={`p-4 bg-gradient-to-r ${feature.color} rounded-2xl shadow-lg`}>
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
        </div>
      </section>

        {/* Featured Pools - Simplified - Same width as Live Platform Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Featured Predictions
            </span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
            Discover the most exciting prediction markets and challenge the best creators
          </p>

          {/* Simplified Category Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((category) => (
              <motion.button
                key={category}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSetCategory(category)}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  (activeCategory === "" && category === "All") || activeCategory === category
                    ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25"
                    : "bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50 border border-gray-700/30"
                }`}
              >
                {category === "All" ? "All Markets" : category.charAt(0).toUpperCase() + category.slice(1)}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-gray-800/30 rounded-2xl p-6 animate-pulse border border-gray-700/30"
              >
                <div className="h-64 bg-gray-700/50 rounded-lg"></div>
              </motion.div>
            ))}
          </div>
        ) : filteredPools.length === 0 ? (
          <div className="text-center py-12">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-16">
            <AnimatePresence>
              {filteredPools.slice(0, 6).map((pool, index) => (
                <EnhancedPoolCard 
                  key={pool.id} 
                  pool={pool} 
                  index={index}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
        
        {/* View All Markets Button */}
        {filteredPools.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link href="/markets">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 flex items-center gap-2 mx-auto"
              >
                View All Markets
                <BoltIcon className="w-5 h-5" />
              </motion.button>
            </Link>
          </motion.div>
        )}

        {/* Live Analytics Dashboard */}
        <section className="py-12 px-4 relative">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                  Live Platform Analytics
                </span>
              </h2>
              <p className="text-lg text-gray-400 max-w-3xl mx-auto">
                Real-time insights from our prediction ecosystem
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8"
              >
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl mr-4">
                    <TrophyIcon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Top Predictors</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Active Predictors</span>
                    <span className="text-cyan-400 font-bold">{stats.participants.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Total Pools</span>
                    <span className="text-green-400 font-bold">{stats.totalPools}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Boosted Pools</span>
                    <span className="text-yellow-400 font-bold">{stats.boostedPools}</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8"
              >
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl mr-4">
                    <ChartBarIcon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Market Activity</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Active Pools</span>
                    <span className="text-purple-400 font-bold">{stats.activePools.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Trending Pools</span>
                    <span className="text-blue-400 font-bold">{stats.trendingPools.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Total Volume</span>
                    <span className="text-green-400 font-bold">${(parseFloat(stats.totalVolume) / 1000).toFixed(0)}k</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8"
              >
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl mr-4">
                    <BoltIcon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Platform Health</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Uptime</span>
                    <span className="text-green-400 font-bold">99.9%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Avg Response Time</span>
                    <span className="text-blue-400 font-bold">45ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Blockchain Sync</span>
                    <span className="text-cyan-400 font-bold">Live</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

      {/* CTA Section */}
        <section className="py-12 px-4 relative">
          <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center max-w-4xl mx-auto"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                  Ready to Challenge
                </span>
                <br />
                <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
                  The Future?
                </span>
            </h2>
              <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                Join the elite community of predictors and start earning from your insights today.
                <br />
                Your legendary journey begins with a single prediction.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/markets">
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 flex items-center gap-3"
                  >
                    <RocketLaunchIcon className="w-6 h-6" />
                    Start Predicting
                  </motion.button>
                </Link>
                
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 flex items-center gap-3"
                >
                  <TrophySolid className="w-6 h-6" />
                  Create Pool
                </motion.button>
            </div>
          </motion.div>
        </div>
      </section>
      </motion.section>
  );
}
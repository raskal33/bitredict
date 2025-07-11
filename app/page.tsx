"use client";

import { useEffect, useCallback, useState } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowTrendingUpIcon,
  TrophyIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  StarIcon,
  BoltIcon,
  ClockIcon,
  EyeIcon,
  HeartIcon,
  SparklesIcon
} from "@heroicons/react/24/outline";
import {
  BoltIcon as BoltSolid,
  StarIcon as StarSolid
} from "@heroicons/react/24/solid";
import { Pool, PlatformStats } from "@/lib/types";

export default function HomePage() {
  const { isConnected } = useAccount();
  const [pools, setPools] = useState<Pool[]>([]);
  const [stats, setStats] = useState<PlatformStats>({
    totalVolume: 0,
    activePools: 0,
    totalBets: 0,
    successRate: 0,
    totalCreators: 0,
    avgChallengeScore: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("");

  const fetchPlatformStats = useCallback(async () => {
    try {
      const response = await fetch('/api/analytics/platform-stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching platform stats:', error);
      // Fallback to demo data
      setStats({
        totalVolume: 2840000,
        activePools: 156,
        totalBets: 8924,
        successRate: 73.2,
        totalCreators: 1247,
        avgChallengeScore: 67
      });
    }
  }, []);

  const fetchPools = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pools/featured?limit=12&include_social=true');
      const data = await response.json();
      if (data.success) {
        setPools(data.data);
      } else {
        // Fallback to demo data
        setPools(getDemoPoolData());
      }
    } catch (error) {
      console.error('Error fetching pools:', error);
      setPools(getDemoPoolData());
    } finally {
      setLoading(false);
    }
  }, []);

  const getDemoPoolData = (): Pool[] => [
    {
      id: "1",
      title: "Bitcoin will reach $100,000 by March 2025",
      description: "Prediction market on Bitcoin reaching six-figure milestone",
      category: "crypto",
      creator: {
        address: "0x1234...5678",
        username: "CryptoSage",
        reputation: 4.8,
        totalPools: 23,
        successRate: 78.3,
        challengeScore: 89,
        totalVolume: 450000,
        badges: ["legendary", "crypto_expert", "whale"],
        createdAt: "2024-01-15T10:30:00Z",
        bio: "Macro crypto analyst with 8 years of experience."
      },
      challengeScore: 89,
      qualityScore: 94,
      difficultyTier: "very_hard",
      progress: 650,
      total: 1000,
      odds: 1.75,
      outcome: "Yes",
      participants: 247,
      volume: 125000,
      currency: "BITR",
      endDate: "2025-03-31",
      trending: true,
      boosted: true,
      boostTier: 3,
      poolType: "single",
      image: "🪙",
      cardTheme: "cyan",
      socialStats: {
        comments: 89,
        likes: 156,
        views: 2340,
        shares: 23
      },
      comments: [],
      defeated: 34,
      volume24h: 12500,
      change24h: 8.5,
      confidence: 73
    },
    {
      id: "2",
      title: "Manchester City wins Premier League 2024/25",
      description: "Premier League championship prediction market",
      category: "sports",
      creator: {
        address: "0x5678...9012",
        username: "FootballOracle",
        reputation: 4.5,
        totalPools: 15,
        successRate: 73.2,
        challengeScore: 76,
        totalVolume: 280000,
        badges: ["sports_expert", "predictor"],
        createdAt: "2024-02-01T14:20:00Z"
      },
      challengeScore: 76,
      qualityScore: 82,
      difficultyTier: "hard",
      progress: 420,
      total: 800,
      odds: 2.1,
      outcome: "Yes",
      participants: 189,
      volume: 89000,
      currency: "STT",
      endDate: "2025-05-25",
      trending: false,
      boosted: false,
      poolType: "single",
      image: "⚽",
      cardTheme: "magenta",
      socialStats: {
        comments: 34,
        likes: 67,
        views: 890,
        shares: 12
      },
      comments: [],
      defeated: 18,
      volume24h: 8900,
      change24h: -2.1,
      confidence: 65
    }
  ];

  useEffect(() => {
    fetchPlatformStats();
    fetchPools();
  }, [fetchPlatformStats, fetchPools]);

  const categories = ["All", "Crypto", "Sports", "Finance", "Stocks", "Politics", "Entertainment"];

  const filteredPools = activeCategory === "" || activeCategory === "All" 
    ? pools 
    : pools.filter(pool => pool.category === activeCategory);

  const handleSetCategory = (category: string) => {
    setActiveCategory(category === "All" ? "" : category);
  };

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

  const getBoostGlow = (tier?: number) => {
    if (!tier) return '';
    switch (tier) {
      case 1: return 'shadow-[0_0_20px_rgba(255,215,0,0.3)]';
      case 2: return 'shadow-[0_0_25px_rgba(192,192,192,0.4)]';
      case 3: return 'shadow-[0_0_30px_rgba(255,215,0,0.5)]';
      default: return '';
    }
  };

  const getCardTheme = (theme: string) => {
    const themes = {
      cyan: {
        background: "bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent",
        border: "border-cyan-500/20",
        glow: "shadow-[0_0_30px_rgba(34,199,255,0.1)]",
        hoverGlow: "hover:shadow-[0_0_40px_rgba(34,199,255,0.2)]",
        accent: "text-cyan-400",
        progressBg: "bg-gradient-to-r from-cyan-500 to-blue-500",
      },
      magenta: {
        background: "bg-gradient-to-br from-pink-500/10 via-purple-500/5 to-transparent",
        border: "border-pink-500/20",
        glow: "shadow-[0_0_30px_rgba(236,72,153,0.1)]",
        hoverGlow: "hover:shadow-[0_0_40px_rgba(236,72,153,0.2)]",
        accent: "text-pink-400",
        progressBg: "bg-gradient-to-r from-pink-500 to-purple-500",
      },
      violet: {
        background: "bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent",
        border: "border-violet-500/20",
        glow: "shadow-[0_0_30px_rgba(139,92,246,0.1)]",
        hoverGlow: "hover:shadow-[0_0_40px_rgba(139,92,246,0.2)]",
        accent: "text-violet-400",
        progressBg: "bg-gradient-to-r from-violet-500 to-purple-500",
      },
      blue: {
        background: "bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent",
        border: "border-blue-500/20",
        glow: "shadow-[0_0_30px_rgba(59,130,246,0.1)]",
        hoverGlow: "hover:shadow-[0_0_40px_rgba(59,130,246,0.2)]",
        accent: "text-blue-400",
        progressBg: "bg-gradient-to-r from-blue-500 to-indigo-500",
      }
    };
    return themes[theme as keyof typeof themes] || themes.cyan;
  };

  const StatCard = ({ icon: Icon, label, value, suffix = "" }: { 
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; 
    label: string; 
    value: number; 
    suffix?: string 
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-6 group cursor-pointer relative overflow-hidden"
    >
      <div className="flex items-center justify-center mb-3">
        <div className="p-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 group-hover:border-cyan-500/40 transition-all duration-300">
          <Icon className="h-6 w-6 text-cyan-400 group-hover:text-blue-400 transition-colors duration-300" />
        </div>
      </div>
      <div className="text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors duration-300 text-center">
        {value.toLocaleString()}{suffix}
      </div>
      <div className="text-sm text-gray-400 text-center">{label}</div>
      
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
    </motion.div>
  );

  const PoolCard = ({ pool }: { pool: Pool }) => {
    const theme = getCardTheme(pool.cardTheme);
    const progress = pool.progress && pool.total ? (pool.progress / pool.total) * 100 : 0;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4, scale: 1.02 }}
        className={`
          relative overflow-hidden group cursor-pointer p-6 rounded-2xl border
          ${theme.background} ${theme.border} ${theme.glow} ${theme.hoverGlow}
          ${pool.boosted ? getBoostGlow(pool.boostTier) : ''}
          transition-all duration-500
        `}
      >
        {/* Boost indicator */}
        {pool.boosted && (
          <div className="absolute top-3 right-3 z-10">
            <div className={`
              px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1
              ${pool.boostTier === 3 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black' :
                pool.boostTier === 2 ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-black' :
                'bg-gradient-to-r from-orange-600 to-orange-700 text-white'}
            `}>
              <BoltSolid className="w-3 h-3" />
              {pool.boostTier === 3 ? 'GOLD' : pool.boostTier === 2 ? 'SILVER' : 'BRONZE'}
            </div>
          </div>
        )}

        {/* Trending indicator */}
        {pool.trending && (
          <div className="absolute top-3 left-3 z-10">
            <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <BoltIcon className="w-3 h-3" />
              HOT
            </div>
          </div>
        )}

        <Link href={`/bet/${pool.id}`} className="block">
          {/* Header with creator info */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{pool.image}</div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Created by</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">
                    {pool.creator.username}
                  </span>
                  {pool.creator.badges.includes('legendary') && (
                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
                      <StarSolid className="w-2.5 h-2.5 text-black" />
                    </div>
                  )}
                  <div className="text-xs text-gray-400">
                    {pool.creator.successRate.toFixed(1)}% win rate
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400">Challenge Score</div>
              <div className={`text-lg font-bold ${getDifficultyColor(pool.difficultyTier)}`}>
                {pool.challengeScore}
              </div>
            </div>
          </div>
          
          {/* Title and category */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-1 rounded-full ${theme.accent} bg-current/10`}>
                {pool.category}
              </span>
              <div className={`flex items-center gap-1 text-xs ${getDifficultyColor(pool.difficultyTier)}`}>
                <SparklesIcon className="w-3 h-3" />
                {pool.difficultyTier.replace('_', ' ').toUpperCase()}
              </div>
            </div>
            <h3 className="text-lg font-bold text-white line-clamp-2 mb-2 group-hover:text-cyan-400 transition-colors">
              {pool.title}
            </h3>
            <p className="text-sm text-gray-400 line-clamp-2">
              {pool.description}
            </p>
          </div>

          {/* Challenge info */}
          <div className="mb-4 p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <TrophyIcon className="w-4 h-4 text-yellow-400" />
                <span className="text-gray-300">
                  {pool.defeated} defeated • Only {((pool.participants - pool.defeated) / pool.participants * 100).toFixed(0)}% succeed
                </span>
              </div>
              <div className={`font-bold ${theme.accent}`}>
                {pool.odds}x odds
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {pool.progress && pool.total && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-300">Pool Progress</span>
                <span className="text-white font-semibold">
                  {pool.progress.toLocaleString()} / {pool.total.toLocaleString()} {pool.currency}
                </span>
              </div>
              <div className="w-full bg-gray-700/30 h-2 rounded-full overflow-hidden">
                <motion.div 
                  className={theme.progressBg}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  style={{ height: '100%' }}
                />
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {progress.toFixed(1)}% filled
              </div>
            </div>
          )}
          
          {/* Social stats */}
          <div className="grid grid-cols-4 gap-3 mb-4 text-center">
            <div>
              <ChatBubbleLeftRightIcon className="w-4 h-4 text-gray-400 mx-auto mb-1" />
              <div className="text-xs font-semibold text-white">{pool.socialStats.comments}</div>
            </div>
            <div>
              <HeartIcon className="w-4 h-4 text-gray-400 mx-auto mb-1" />
              <div className="text-xs font-semibold text-white">{pool.socialStats.likes}</div>
            </div>
            <div>
              <EyeIcon className="w-4 h-4 text-gray-400 mx-auto mb-1" />
              <div className="text-xs font-semibold text-white">{pool.socialStats.views}</div>
            </div>
            <div>
              <UsersIcon className="w-4 h-4 text-gray-400 mx-auto mb-1" />
              <div className="text-xs font-semibold text-white">{pool.participants}</div>
            </div>
          </div>

          {/* Footer stats */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-700/20">
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <ClockIcon className="w-3 h-3" />
                {new Date(pool.endDate).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <CurrencyDollarIcon className="w-3 h-3" />
                {(pool.volume24h || 0).toLocaleString()} {pool.currency}
              </div>
            </div>
            <div className={`flex items-center gap-1 text-xs font-semibold ${
              (pool.change24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {(pool.change24h || 0) >= 0 ? (
                <ArrowTrendingUpIcon className="w-3 h-3" />
              ) : (
                <ArrowTrendingUpIcon className="w-3 h-3 rotate-180" />
              )}
              {Math.abs(pool.change24h || 0).toFixed(1)}%
            </div>
          </div>
        </Link>
      </motion.div>
    );
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading challenges...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center relative mb-12"
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div 
              className="absolute top-[20%] left-[15%] w-6 h-6 bg-cyan-400/20 rounded-full blur-sm"
              animate={{ y: [-10, 10, -10], x: [-5, 5, -5], scale: [1, 1.2, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute top-[60%] right-[20%] w-4 h-4 bg-blue-400/30 rounded-full blur-sm"
              animate={{ y: [10, -10, 10], x: [5, -5, 5], scale: [1, 1.3, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
          </div>

          <div className="relative z-10">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Challenge</span>{" "}
              <span className="text-white">the Creators</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Enter prediction battles where you challenge brilliant creators, earn recognition through victories, 
              and build your reputation in our vibrant community.
            </p>
            
            {!isConnected && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="inline-block px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
              >
                Connect Wallet to Start Challenging
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Platform Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6"
        >
          <StatCard icon={CurrencyDollarIcon} label="Total Volume" value={stats.totalVolume} suffix=" STT" />
          <StatCard icon={ChartBarIcon} label="Active Pools" value={stats.activePools} />
          <StatCard icon={UsersIcon} label="Total Bets" value={stats.totalBets} />
          <StatCard icon={TrophyIcon} label="Success Rate" value={stats.successRate} suffix="%" />
          <StatCard icon={StarIcon} label="Creators" value={stats.totalCreators} />
          <StatCard icon={BoltIcon} label="Avg Challenge" value={stats.avgChallengeScore} />
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap justify-center gap-3"
        >
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleSetCategory(category)}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                (category === "All" && activeCategory === "") || activeCategory === category
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg"
                  : "bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50"
              }`}
            >
              {category}
            </button>
          ))}
        </motion.div>

        {/* Pools Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-800/30 rounded-2xl p-6 animate-pulse">
                  <div className="h-80 bg-gray-700 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="wait">
                {filteredPools.map((pool, index) => (
                  <motion.div
                    key={pool.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <PoolCard pool={pool} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Load More */}
        {!loading && filteredPools.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center"
          >
            <Link 
              href="/markets"
              className="inline-block px-8 py-4 bg-gray-800/50 text-gray-300 rounded-lg font-medium hover:bg-gray-700/50 transition-all duration-300"
            >
              Load More Challenges
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
} 
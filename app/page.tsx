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
  StarIcon as StarSolid,
  TrophyIcon as TrophySolid,
  ShieldCheckIcon as ShieldSolid,
  SparklesIcon as SparklesSolid
} from "@heroicons/react/24/solid";
import { Pool, PlatformStats } from "@/lib/types";
import { getDemoPoolData } from "@/lib/demoData";

export default function HomePage() {
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
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      name: "CryptoSage",
      role: "Legendary Predictor",
      avatar: "🧙‍♂️",
      content: "Bitredict transformed my prediction skills. The challenge system keeps me sharp and the rewards are incredible!",
      rating: 5,
      earnings: "$45,000"
    },
    {
      name: "FootballOracle",
      role: "Sports Expert",
      avatar: "⚽",
      content: "The social features and reputation system make this the best prediction platform I've ever used.",
      rating: 5,
      earnings: "$28,000"
    },
    {
      name: "StockWizard",
      role: "Finance Analyst",
      avatar: "📊",
      content: "Amazing platform for testing market predictions. The boost system really helps get visibility for quality pools.",
      rating: 5,
      earnings: "$32,000"
    }
  ];

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

  useEffect(() => {
    fetchPlatformStats();
    fetchPools();
  }, [fetchPlatformStats, fetchPools]);

  // Testimonial rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const categories = ["All", "Crypto", "Sports", "Finance", "Politics", "Entertainment", "Technology"];

  const filteredPools = activeCategory === "" || activeCategory === "All" 
    ? pools 
    : pools.filter(pool => pool.category === activeCategory);

  const handleSetCategory = (category: string) => {
    setActiveCategory(category === "All" ? "" : category);
  };

  const features = [
    {
      icon: TrophySolid,
      title: "Challenge System",
      description: "Compete against the best predictors and climb the leaderboard",
      color: "from-yellow-400 to-orange-500"
    },
    {
      icon: BoltSolid,
      title: "Boost Your Pools",
      description: "Get premium visibility with our tiered boost system",
      color: "from-cyan-400 to-blue-500"
    },
    {
      icon: ShieldSolid,
      title: "Secure & Fair",
      description: "Smart contract powered with multiple oracle integrations",
      color: "from-green-400 to-emerald-500"
    },
    {
      icon: SparklesSolid,
      title: "Social Features",
      description: "Comment, like, and share insights with the community",
      color: "from-purple-400 to-pink-500"
    }
  ];

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
        glow: "shadow-[0_0_30px_rgba(6,182,212,0.1)]",
        hoverGlow: "hover:shadow-[0_0_40px_rgba(6,182,212,0.2)]",
        accent: "text-cyan-400",
        progressBg: "bg-gradient-to-r from-cyan-500 to-blue-500",
      },
      orange: {
        background: "bg-gradient-to-br from-orange-500/10 via-red-500/5 to-transparent",
        border: "border-orange-500/20",
        glow: "shadow-[0_0_30px_rgba(249,115,22,0.1)]",
        hoverGlow: "hover:shadow-[0_0_40px_rgba(249,115,22,0.2)]",
        accent: "text-orange-400",
        progressBg: "bg-gradient-to-r from-orange-500 to-red-500",
      },
      red: {
        background: "bg-gradient-to-br from-red-500/10 via-pink-500/5 to-transparent",
        border: "border-red-500/20",
        glow: "shadow-[0_0_30px_rgba(239,68,68,0.1)]",
        hoverGlow: "hover:shadow-[0_0_40px_rgba(239,68,68,0.2)]",
        accent: "text-red-400",
        progressBg: "bg-gradient-to-r from-red-500 to-pink-500",
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
      },
      green: {
        background: "bg-gradient-to-br from-green-500/10 via-teal-500/5 to-transparent",
        border: "border-green-500/20",
        glow: "shadow-[0_0_30px_rgba(74,222,128,0.1)]",
        hoverGlow: "hover:shadow-[0_0_40px_rgba(74,222,128,0.2)]",
        accent: "text-green-400",
        progressBg: "bg-gradient-to-r from-green-500 to-teal-500",
      },
      purple: {
        background: "bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent",
        border: "border-purple-500/20",
        glow: "shadow-[0_0_30px_rgba(168,85,247,0.1)]",
        hoverGlow: "hover:shadow-[0_0_40px_rgba(168,85,247,0.2)]",
        accent: "text-purple-400",
        progressBg: "bg-gradient-to-r from-purple-500 to-indigo-500",
      }
    };
    return themes[theme as keyof typeof themes] || themes.cyan;
  };

  const StatCard = ({ icon: Icon, label, value, prefix = "", suffix = "", delay = 0 }: { 
    icon: React.ElementType; 
    label: string; 
    value: number; 
    prefix?: string;
    suffix?: string;
    delay?: number;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ scale: 1.05, y: -5 }}
      className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 text-center group hover:border-cyan-500/30 transition-all duration-300"
    >
      <div className="flex justify-center mb-4">
        <div className="p-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl group-hover:from-cyan-500/30 group-hover:to-blue-500/30 transition-all duration-300">
          <Icon className="w-8 h-8 text-cyan-400 group-hover:text-cyan-300" />
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: delay + 0.2 }}
        className="text-3xl font-bold text-white mb-2"
      >
        {prefix}{(value / 1000000).toFixed(1)}{suffix}
      </motion.div>
      <div className="text-gray-400 text-sm font-medium">{label}</div>
    </motion.div>
  );

  const PoolCard = ({ pool, index }: { pool: Pool; index: number }) => {
    const theme = getCardTheme(pool.cardTheme);
    
    return (
      <Link href={`/bet/${pool.id}`} className="block">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: index * 0.1 }}
          whileHover={{ y: -8, scale: 1.02 }}
          className={`
            relative overflow-hidden group cursor-pointer h-[320px] flex flex-col
            ${theme.background} ${theme.border} ${theme.glow} ${theme.hoverGlow}
            ${pool.boosted ? getBoostGlow(pool.boostTier) : ''}
            transition-all duration-500 p-6 rounded-2xl border backdrop-blur-sm
          `}
        >
          {/* Badge Container */}
          <div className="absolute top-3 left-3 right-3 z-10 flex justify-between items-start pointer-events-none">
            {pool.trending && (
              <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <BoltIcon className="w-3 h-3" />
                HOT
              </div>
            )}
            {pool.boosted && (
              <div className={`
                px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1
                ${pool.boostTier === 3 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black' :
                  pool.boostTier === 2 ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-black' :
                  'bg-gradient-to-r from-orange-600 to-orange-700 text-white'}
              `}>
                <BoltSolid className="w-3 h-3" />
                {pool.boostTier === 3 ? 'GOLD' : pool.boostTier === 2 ? 'SILVER' : 'BRONZE'}
              </div>
            )}
          </div>

          {/* Header */}
          <div className="flex items-center gap-3 mb-4 mt-6">
            <div className="text-2xl">{pool.image}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-1 rounded-full ${theme.accent} bg-current/10`}>
                  {pool.category}
                </span>
                <div className="text-xs text-gray-400">
                  {pool.creator.successRate.toFixed(0)}% win rate
                </div>
              </div>
              <div className="text-xs text-gray-400">
                by {pool.creator.username}
              </div>
            </div>
            <div className="text-right">
              <div className={`text-lg font-bold ${getDifficultyColor(pool.difficultyTier)}`}>
                {pool.challengeScore}
              </div>
              <div className="text-xs text-gray-400">score</div>
            </div>
          </div>
          
          {/* Title */}
          <h3 className="text-lg font-bold text-white line-clamp-3 mb-4 group-hover:text-cyan-400 transition-colors flex-1">
            {pool.title}
          </h3>
          
          {/* Key Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4 text-center">
            <div>
              <div className="text-lg font-bold text-cyan-400">{pool.odds}x</div>
              <div className="text-xs text-gray-400">Odds</div>
            </div>
            <div>
              <div className="text-lg font-bold text-white">${(pool.volume / 1000).toFixed(0)}k</div>
              <div className="text-xs text-gray-400">Pool</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-400">{pool.participants}</div>
              <div className="text-xs text-gray-400">Players</div>
            </div>
          </div>

          {/* Creator Position */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-lg border border-red-500/20 mt-auto">
            <div className="text-xs text-red-400">Creator says: WON&apos;T happen</div>
            <div className="text-xs text-cyan-400 font-medium">Challenge them!</div>
          </div>
        </motion.div>
      </Link>
    );
  };

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 space-y-12"
    >
      {/* Hero Section */}
      <div className="text-center max-w-5xl mx-auto relative">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute top-[20%] left-[10%] w-20 h-20 bg-cyan-400/10 rounded-full blur-3xl"
            animate={{ y: [-20, 20, -20], x: [-10, 10, -10], scale: [1, 1.2, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute top-[60%] right-[15%] w-16 h-16 bg-purple-500/10 rounded-full blur-3xl"
            animate={{ y: [20, -20, 20], x: [10, -10, 10], scale: [1, 1.3, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
          <motion.div 
            className="absolute bottom-[20%] left-[70%] w-24 h-24 bg-blue-500/10 rounded-full blur-3xl"
            animate={{ y: [-15, 15, -15], x: [-8, 8, -8], scale: [1, 1.1, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12 relative z-10"
        >
          <motion.h1 
            className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Challenge
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
              The Future
            </span>
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Where brilliant minds converge to predict tomorrow. Challenge the Creators, earn legendary rewards, and shape the future of prediction markets.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Link href="/markets">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-10 py-5 rounded-2xl font-bold text-xl shadow-2xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 flex items-center gap-3 group"
              >
                <RocketLaunchIcon className="w-7 h-7 group-hover:animate-bounce" />
                Start Predicting
                <motion.div
                  className="w-2 h-2 bg-white rounded-full"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.button>
            </Link>
            
            <Link href="/create-prediction">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-10 py-5 rounded-2xl font-bold text-xl shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 flex items-center gap-3 group border-2 border-transparent hover:border-purple-400/30"
              >
                <TrophySolid className="w-7 h-7 group-hover:rotate-12 transition-transform" />
                Create Challenge
                <SparklesSolid className="w-5 h-5 text-yellow-300 group-hover:animate-pulse" />
              </motion.button>
            </Link>
          </motion.div>

          {/* Quick Stats */}
          <motion.div 
            className="flex justify-center items-center gap-8 mt-10 text-sm text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <div className="flex items-center gap-2">
              <UsersIcon className="w-4 h-4 text-cyan-400" />
              <span>10K+ Predictors</span>
            </div>
            <div className="flex items-center gap-2">
              <CurrencyDollarIcon className="w-4 h-4 text-green-400" />
              <span>$2.8M+ Volume</span>
            </div>
            <div className="flex items-center gap-2">
              <TrophyIcon className="w-4 h-4 text-yellow-400" />
              <span>73% Success Rate</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Platform Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          <StatCard icon={CurrencyDollarIcon} label="Total Volume" value={stats.totalVolume} prefix="$" suffix="M" delay={0.1} />
        <StatCard icon={TrophyIcon} label="Active Pools" value={stats.activePools} delay={0.2} />
        <StatCard icon={UsersIcon} label="Total Bets" value={stats.totalBets} delay={0.3} />
        <StatCard icon={StarIcon} label="Success Rate" value={stats.successRate} suffix="%" delay={0.4} />
        <StatCard icon={AcademicCapIcon} label="Creators" value={stats.totalCreators} delay={0.5} />
        <StatCard icon={ChartBarIcon} label="Avg Score" value={stats.avgChallengeScore} delay={0.6} />
      </div>
      </motion.div>

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
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
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

        {/* Featured Pools */}
        <section className="py-12 px-4 relative">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  Featured Predictions
                </span>
              </h2>
              <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-6">
                Discover the most exciting prediction markets and challenge the best creators
              </p>
              
              {/* Category Filter */}
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
                    {category}
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
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence>
                  {filteredPools.slice(0, 6).map((pool, index) => (
                    <PoolCard key={pool.id} pool={pool} index={index} />
                  ))}
                </AnimatePresence>
              </div>
            )}
            
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
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-12 px-4 relative">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                  Success Stories
                </span>
              </h2>
              <p className="text-lg text-gray-400 max-w-3xl mx-auto">
                Hear from our top predictors who&apos;ve built legendary reputations
              </p>
            </motion.div>
            
            <div className="relative max-w-4xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTestimonial}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.5 }}
                  className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 text-center"
                >
                  <div className="text-6xl mb-4">{testimonials[currentTestimonial].avatar}</div>
                  <p className="text-xl text-gray-300 mb-6 italic leading-relaxed">
                    &ldquo;{testimonials[currentTestimonial].content}&rdquo;
                  </p>
                  <div className="flex items-center justify-center gap-1 mb-4">
                    {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                      <StarSolid key={i} className="w-5 h-5 text-yellow-400" />
                    ))}
                  </div>
                  <h4 className="text-lg font-bold text-white mb-1">
                    {testimonials[currentTestimonial].name}
                  </h4>
                  <p className="text-gray-400 mb-2">{testimonials[currentTestimonial].role}</p>
                  <p className="text-green-400 font-semibold">
                    {testimonials[currentTestimonial].earnings} earned
                  </p>
                </motion.div>
              </AnimatePresence>
              
              <div className="flex justify-center mt-8 gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === currentTestimonial ? 'bg-cyan-400' : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
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
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
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
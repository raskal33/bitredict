"use client";

import { useEffect, useCallback, useState } from "react";
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
  EyeIcon,
  HeartIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  AcademicCapIcon,
  ArrowRightIcon,
  PlayIcon
} from "@heroicons/react/24/outline";
import {
  BoltIcon as BoltSolid,
  StarIcon as StarSolid,
  TrophyIcon as TrophySolid,
  ShieldCheckIcon as ShieldSolid,
  SparklesIcon as SparklesSolid
} from "@heroicons/react/24/solid";
import { Pool, PlatformStats } from "@/lib/types";

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
    },
    {
      id: "3",
      title: "Tesla stock will hit $300 by end of 2024",
      description: "Tesla's stock price prediction for year-end 2024",
      category: "finance",
      creator: {
        address: "0x9012...3456",
        username: "StockWizard",
        reputation: 4.2,
        totalPools: 31,
        successRate: 69.8,
        challengeScore: 82,
        totalVolume: 320000,
        badges: ["finance_expert", "analyst"],
        createdAt: "2024-01-20T09:15:00Z"
      },
      challengeScore: 82,
      qualityScore: 88,
      difficultyTier: "medium",
      progress: 320,
      total: 600,
      odds: 1.9,
      outcome: "Yes",
      participants: 156,
      volume: 67000,
      currency: "STT",
      endDate: "2024-12-31",
      trending: true,
      boosted: true,
      boostTier: 2,
      poolType: "single",
      image: "📈",
      cardTheme: "violet",
      socialStats: {
        comments: 45,
        likes: 78,
        views: 1240,
        shares: 15
      },
      comments: [],
      defeated: 22,
      volume24h: 5600,
      change24h: 3.2,
      confidence: 65
    }
  ];

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
      content: "The social features and reputation system make this the best prediction platform I&apos;ve ever used.",
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

  const StatCard = ({ icon: Icon, label, value, suffix = "", delay = 0 }: { 
    icon: React.ElementType; 
    label: string; 
    value: number; 
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
        {value.toLocaleString()}{suffix}
      </motion.div>
      <div className="text-gray-400 text-sm font-medium">{label}</div>
    </motion.div>
  );

  const PoolCard = ({ pool, index }: { pool: Pool; index: number }) => {
    const theme = getCardTheme(pool.cardTheme);
    const progressPercentage = pool.progress && pool.total ? (pool.progress / pool.total) * 100 : 0;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, delay: index * 0.1 }}
        whileHover={{ y: -8, scale: 1.02 }}
        className={`
          relative overflow-hidden group cursor-pointer
          ${theme.background} ${theme.border} ${theme.glow} ${theme.hoverGlow}
          ${pool.boosted ? getBoostGlow(pool.boostTier) : ''}
          transition-all duration-500 p-6 rounded-2xl border backdrop-blur-sm
        `}
      >
        {/* Trending Badge */}
        {pool.trending && (
          <div className="absolute top-3 left-3 z-10">
            <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <BoltIcon className="w-3 h-3" />
              HOT
            </div>
          </div>
        )}

        {/* Boost Badge */}
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

        <Link href={`/bet/${pool.id}`} className="block">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="text-3xl">{pool.image}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-1 rounded-full ${theme.accent} bg-current/10`}>
                  {pool.category}
                </span>
                <div className={`flex items-center gap-1 text-xs ${getDifficultyColor(pool.difficultyTier)}`}>
                  <StarIcon className="w-3 h-3" />
                  {pool.difficultyTier.replace('_', ' ').toUpperCase()}
                </div>
              </div>
              <div className="text-xs text-gray-400">
                by {pool.creator.username} • {pool.creator.successRate.toFixed(1)}% win rate
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400">Score</div>
              <div className={`text-lg font-bold ${theme.accent}`}>
                {pool.challengeScore}
              </div>
            </div>
          </div>
          
          {/* Title */}
          <h3 className="text-lg font-bold text-white line-clamp-2 mb-3 group-hover:text-cyan-400 transition-colors">
            {pool.title}
          </h3>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>Progress</span>
              <span>{progressPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700/50 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, delay: index * 0.1 + 0.5 }}
                className={`h-2 rounded-full ${theme.progressBg}`}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4 text-center">
            <div>
              <div className="text-xs text-gray-400">Volume</div>
              <div className="text-sm font-bold text-white">{pool.volume.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Participants</div>
              <div className="text-sm font-bold text-white">{pool.participants}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Odds</div>
              <div className="text-sm font-bold text-white">{pool.odds}x</div>
            </div>
          </div>

          {/* Social Stats */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-700/20">
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <HeartIcon className="w-3 h-3" />
                {pool.socialStats.likes}
              </div>
              <div className="flex items-center gap-1">
                <ChatBubbleLeftRightIcon className="w-3 h-3" />
                {pool.socialStats.comments}
              </div>
              <div className="flex items-center gap-1">
                <EyeIcon className="w-3 h-3" />
                {pool.socialStats.views}
              </div>
            </div>
            <div className={`flex items-center gap-1 text-xs font-semibold ${
              (pool.change24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              <ArrowTrendingUpIcon className={`w-3 h-3 ${(pool.change24h || 0) < 0 ? 'rotate-180' : ''}`} />
              {Math.abs(pool.change24h || 0).toFixed(1)}%
            </div>
          </div>
        </Link>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-cyan-500/5 via-blue-500/3 to-purple-500/5 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,199,255,0.1),transparent_70%)] pointer-events-none" />
      
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
          {/* Animated Background Grid */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(34,199,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(34,199,255,0.1)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
          </div>
          
          <div className="container mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="max-w-6xl mx-auto"
            >
              {/* Main Title */}
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="text-6xl md:text-8xl font-bold mb-6 leading-tight"
              >
                <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                  Challenge
                </span>
                <br />
                <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
                  The Future
                </span>
              </motion.h1>
              
              {/* Subtitle */}
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.4 }}
                className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed"
              >
                Where brilliant minds converge to predict tomorrow. 
                <br className="hidden md:block" />
                <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent font-semibold">
                  Challenge the Creators
                </span>
                , earn legendary rewards, and shape the future of prediction markets.
              </motion.p>
              
              {/* CTA Buttons */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
              >
                <Link href="/markets">
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 flex items-center gap-2"
                  >
                    <RocketLaunchIcon className="w-6 h-6" />
                    Explore Markets
                  </motion.button>
                </Link>
                
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 flex items-center gap-2"
                >
                  <PlayIcon className="w-6 h-6" />
                  Watch Demo
                </motion.button>
              </motion.div>
              
              {/* Trust Indicators */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.8 }}
                className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-400"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon className="w-5 h-5 text-green-400" />
                  <span>Audited Smart Contracts</span>
                </div>
                <div className="flex items-center gap-2">
                  <GlobeAltIcon className="w-5 h-5 text-blue-400" />
                  <span>Decentralized Oracles</span>
                </div>
                <div className="flex items-center gap-2">
                  <UsersIcon className="w-5 h-5 text-purple-400" />
                  <span>1,247+ Active Predictors</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Platform Stats */}
        <section className="py-20 px-4 relative">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Platform Statistics
                </span>
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Join thousands of predictors in the most advanced prediction ecosystem
              </p>
            </motion.div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              <StatCard icon={CurrencyDollarIcon} label="Total Volume" value={stats.totalVolume} suffix="" delay={0} />
              <StatCard icon={TrophyIcon} label="Active Pools" value={stats.activePools} suffix="" delay={0.1} />
              <StatCard icon={UsersIcon} label="Total Bets" value={stats.totalBets} suffix="" delay={0.2} />
              <StatCard icon={StarIcon} label="Success Rate" value={stats.successRate} suffix="%" delay={0.3} />
              <StatCard icon={AcademicCapIcon} label="Creators" value={stats.totalCreators} suffix="" delay={0.4} />
              <StatCard icon={ChartBarIcon} label="Avg Score" value={stats.avgChallengeScore} suffix="" delay={0.5} />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 relative">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                  Why Choose Bitredict?
                </span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
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
        <section className="py-20 px-4 relative">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  Featured Predictions
                </span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
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
                  <ArrowRightIcon className="w-5 h-5" />
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 px-4 relative">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                  Success Stories
                </span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Hear from our top predictors who've built legendary reputations
              </p>
            </motion.div>
            
            <div className="max-w-4xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTestimonial}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.5 }}
                  className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-3xl p-12 text-center"
                >
                  <div className="text-6xl mb-6">{testimonials[currentTestimonial].avatar}</div>
                  <div className="flex justify-center mb-4">
                    {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                      <StarSolid key={i} className="w-6 h-6 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-xl text-gray-300 mb-6 italic leading-relaxed">
                    &ldquo;{testimonials[currentTestimonial].content}&rdquo;
                  </p>
                  <div className="text-white font-bold text-lg">
                    {testimonials[currentTestimonial].name}
                  </div>
                  <div className="text-gray-400 mb-2">
                    {testimonials[currentTestimonial].role}
                  </div>
                  <div className="text-green-400 font-semibold">
                    Earned: {testimonials[currentTestimonial].earnings}
                  </div>
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
        <section className="py-20 px-4 relative">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center max-w-4xl mx-auto"
            >
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                  Ready to Challenge
                </span>
                <br />
                <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
                  The Future?
                </span>
              </h2>
              <p className="text-xl text-gray-300 mb-12 leading-relaxed">
                Join the elite community of predictors and start earning from your insights today.
                <br />
                Your legendary journey begins with a single prediction.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Link href="/markets">
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-10 py-5 rounded-2xl font-bold text-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 flex items-center gap-3"
                  >
                    <RocketLaunchIcon className="w-7 h-7" />
                    Start Predicting
                  </motion.button>
                </Link>
                
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-10 py-5 rounded-2xl font-bold text-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 flex items-center gap-3"
                >
                  <TrophySolid className="w-7 h-7" />
                  Create Pool
                </motion.button>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
} 
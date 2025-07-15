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
      id: "pool-1",
      title: "Bitcoin will reach $100,000 by March 2025",
      description: "Prediction market on Bitcoin reaching six-figure milestone before March 31, 2025. This challenge tests your ability to predict the macro crypto market trends and timing.",
      category: "crypto",
      creator: {
        address: "0x1234...5678",
        username: "CryptoSage",
        avatar: "/logo.png",
        reputation: 4.8,
        totalPools: 23,
        successRate: 78.3,
        challengeScore: 89,
        totalVolume: 450000,
        badges: ["legendary", "crypto_expert", "whale"],
        createdAt: "2024-01-15T10:30:00Z",
        bio: "Macro crypto analyst with 8 years of experience. Specialized in Bitcoin cycle analysis and institutional adoption trends."
      },
      challengeScore: 89,
      qualityScore: 94,
      difficultyTier: "very_hard",
      predictedOutcome: "Bitcoin will reach $100,000 by March 2025",
      odds: 1.75,
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
      conditions: [
        "Bitcoin (BTC) must reach or exceed $100,000 USD on any major exchange",
        "Price must be sustained for at least 1 hour on the target date",
        "Data will be sourced from CoinGecko API and verified by multiple oracles",
        "Settlement occurs within 24 hours of the event end date"
      ],
      tags: ["macro", "btc", "institutional", "halving"]
    },
    {
      id: "pool-2",
      title: "Ethereum will complete The Merge by September 2024",
      description: "Prediction on Ethereum's transition to Proof of Stake consensus mechanism. This historic event will test your understanding of blockchain technology evolution.",
      category: "crypto",
      creator: {
        address: "0x2345...6789",
        username: "EthereumOracle",
        avatar: "/logo.png",
        reputation: 4.6,
        totalPools: 18,
        successRate: 82.1,
        challengeScore: 85,
        totalVolume: 320000,
        badges: ["ethereum_expert", "developer", "validator"],
        createdAt: "2024-02-01T14:20:00Z",
        bio: "Ethereum developer and validator with deep knowledge of PoS consensus mechanisms and network upgrades."
      },
      challengeScore: 85,
      qualityScore: 91,
      difficultyTier: "hard",
      predictedOutcome: "Ethereum will complete The Merge by September 2024",
      odds: 2.1,
      participants: 189,
      volume: 89000,
      currency: "BITR",
      endDate: "2025-03-31",
      trending: false,
      boosted: true,
      boostTier: 2,
      poolType: "single",
      image: "🔷",
      cardTheme: "purple",
      socialStats: {
        comments: 67,
        likes: 134,
        views: 1890,
        shares: 18
      },
      comments: [],
      defeated: 28,
      conditions: [
        "Ethereum must complete the transition to Proof of Stake",
        "Merge must be confirmed by multiple validators",
        "Network must remain stable for 24 hours post-merge",
        "Settlement occurs within 48 hours of successful merge"
      ],
      tags: ["eth", "pos", "merge", "upgrade"]
    },
    {
      id: "pool-3",
      title: "Tesla stock will hit $300 by end of 2024",
      description: "Prediction market on Tesla's stock performance. This challenge evaluates your ability to analyze electric vehicle market dynamics and company fundamentals.",
      category: "stocks",
      creator: {
        address: "0x3456...7890",
        username: "StockMaster",
        avatar: "/logo.png",
        reputation: 4.7,
        totalPools: 31,
        successRate: 75.9,
        challengeScore: 82,
        totalVolume: 280000,
        badges: ["stock_expert", "tesla_bull", "ev_analyst"],
        createdAt: "2024-01-20T09:15:00Z",
        bio: "Equity analyst specializing in technology and electric vehicle sectors with 12 years of market experience."
      },
      challengeScore: 82,
      qualityScore: 88,
      difficultyTier: "medium",
      predictedOutcome: "Tesla stock will hit $300 by end of 2024",
      odds: 1.45,
      participants: 156,
      volume: 67000,
      currency: "BITR",
      endDate: "2025-03-31",
      trending: true,
      boosted: false,
      boostTier: 1,
      poolType: "single",
      image: "🚗",
      cardTheme: "green",
      socialStats: {
        comments: 45,
        likes: 98,
        views: 1450,
        shares: 12
      },
      comments: [],
      defeated: 22,
      conditions: [
        "Tesla stock must reach or exceed $300 per share",
        "Price must be sustained for at least 1 trading day",
        "Data sourced from major stock exchanges",
        "Settlement occurs within 24 hours of year end"
      ],
      tags: ["tesla", "stocks", "ev", "technology"]
    },
    {
      id: "pool-4",
      title: "US Federal Reserve will cut rates 3 times in 2024",
      description: "Prediction on Federal Reserve monetary policy decisions. This challenge tests your understanding of macroeconomic indicators and central bank behavior.",
      category: "economics",
      creator: {
        address: "0x4567...8901",
        username: "MacroGuru",
        avatar: "/logo.png",
        reputation: 4.9,
        totalPools: 27,
        successRate: 88.2,
        challengeScore: 93,
        totalVolume: 520000,
        badges: ["macro_expert", "fed_watcher", "economist"],
        createdAt: "2024-01-10T16:45:00Z",
        bio: "Macroeconomic analyst with expertise in Federal Reserve policy and interest rate forecasting."
      },
      challengeScore: 93,
      qualityScore: 96,
      difficultyTier: "very_hard",
      predictedOutcome: "US Federal Reserve will cut rates 3 times in 2024",
      odds: 1.25,
      participants: 312,
      volume: 189000,
      currency: "BITR",
      endDate: "2025-03-31",
      trending: true,
      boosted: true,
      boostTier: 3,
      poolType: "single",
      image: "🏦",
      cardTheme: "blue",
      socialStats: {
        comments: 123,
        likes: 234,
        views: 3450,
        shares: 34
      },
      comments: [],
      defeated: 45,
      conditions: [
        "Federal Reserve must announce rate cuts at FOMC meetings",
        "Total of 3 rate cuts must occur in 2024",
        "Official Fed statements will be the source of truth",
        "Settlement occurs within 24 hours of year end"
      ],
      tags: ["fed", "rates", "macro", "policy"]
    },
    {
      id: "pool-5",
      title: "OpenAI will release GPT-5 by Q3 2024",
      description: "Prediction on OpenAI's next major language model release. This challenge evaluates your understanding of AI development timelines and industry trends.",
      category: "technology",
      creator: {
        address: "0x5678...9012",
        username: "AIProphet",
        avatar: "/logo.png",
        reputation: 4.5,
        totalPools: 15,
        successRate: 71.4,
        challengeScore: 78,
        totalVolume: 180000,
        badges: ["ai_expert", "openai_watcher", "researcher"],
        createdAt: "2024-02-15T11:30:00Z",
        bio: "AI researcher and industry analyst with deep knowledge of language model development and OpenAI's roadmap."
      },
      challengeScore: 78,
      qualityScore: 85,
      difficultyTier: "medium",
      predictedOutcome: "OpenAI will release GPT-5 by Q3 2024",
      odds: 1.8,
      participants: 98,
      volume: 45000,
      currency: "BITR",
      endDate: "2025-03-31",
      trending: false,
      boosted: true,
      boostTier: 2,
      poolType: "single",
      image: "🤖",
      cardTheme: "orange",
      socialStats: {
        comments: 34,
        likes: 78,
        views: 1200,
        shares: 8
      },
      comments: [],
      defeated: 15,
      conditions: [
        "OpenAI must officially announce GPT-5 release",
        "Release must occur before end of Q3 2024",
        "Official OpenAI channels will be the source",
        "Settlement occurs within 24 hours of announcement"
      ],
      tags: ["ai", "openai", "gpt", "technology"]
    },
    {
      id: "pool-6",
      title: "SpaceX will successfully land on Mars by 2026",
      description: "Prediction on SpaceX's ambitious Mars mission timeline. This challenge tests your knowledge of space exploration and engineering feasibility.",
      category: "space",
      creator: {
        address: "0x6789...0123",
        username: "SpaceExplorer",
        avatar: "/logo.png",
        reputation: 4.3,
        totalPools: 12,
        successRate: 65.8,
        challengeScore: 72,
        totalVolume: 95000,
        badges: ["space_expert", "spacex_watcher", "engineer"],
        createdAt: "2024-01-25T13:20:00Z",
        bio: "Aerospace engineer and space industry analyst with expertise in rocket technology and Mars mission planning."
      },
      challengeScore: 72,
      qualityScore: 79,
      difficultyTier: "hard",
      predictedOutcome: "SpaceX will successfully land on Mars by 2026",
      odds: 2.5,
      participants: 67,
      volume: 32000,
      currency: "BITR",
      endDate: "2025-03-31",
      trending: false,
      boosted: false,
      boostTier: 1,
      poolType: "single",
      image: "🚀",
      cardTheme: "red",
      socialStats: {
        comments: 23,
        likes: 45,
        views: 890,
        shares: 5
      },
      comments: [],
      defeated: 12,
      conditions: [
        "SpaceX must successfully land a spacecraft on Mars",
        "Landing must occur before end of 2026",
        "Official SpaceX confirmation required",
        "Settlement occurs within 48 hours of landing"
      ],
      tags: ["spacex", "mars", "space", "rocket"]
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
      <Link href={`/bet/${pool.id}`} className="block">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: index * 0.1 }}
          whileHover={{ y: -8, scale: 1.02 }}
          className={`
            relative overflow-hidden group cursor-pointer h-[520px] flex flex-col
            ${theme.background} ${theme.border} ${theme.glow} ${theme.hoverGlow}
            ${pool.boosted ? getBoostGlow(pool.boostTier) : ''}
            transition-all duration-500 p-6 rounded-2xl border backdrop-blur-sm
          `}
        >
          {/* Badge Container - Fixed positioning to avoid overlaps */}
          <div className="absolute top-3 left-3 right-3 z-10 flex justify-between items-start pointer-events-none">
            {/* Trending Badge */}
            {pool.trending && (
              <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <BoltIcon className="w-3 h-3" />
                HOT
              </div>
            )}

            {/* Boost Badge */}
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
            <div className="text-3xl">{pool.image}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-1 rounded-full ${theme.accent} bg-current/10 truncate`}>
                  {pool.category}
                </span>
                <div className={`flex items-center gap-1 text-xs ${getDifficultyColor(pool.difficultyTier)}`}>
                  <StarIcon className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{pool.difficultyTier.replace('_', ' ').toUpperCase()}</span>
                </div>
              </div>
              <div className="text-xs text-gray-400 truncate">
                by {pool.creator.username} • {pool.creator.successRate.toFixed(1)}% win rate
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-xs text-gray-400">Score</div>
              <div className={`text-lg font-bold ${theme.accent}`}>
                {pool.challengeScore}
              </div>
            </div>
          </div>
          
          {/* Creator Prediction Section - The Core Mechanic */}
          <div className="mb-4 p-3 bg-gradient-to-r from-gray-800/40 to-gray-700/40 rounded-lg border border-gray-600/30 flex-shrink-0">
            <div className="mb-3">
              <div className="text-xs text-orange-400 mb-1">💡 Creator believes this WON&apos;T happen:</div>
              <div className="text-sm font-medium text-white line-clamp-2" style={{ minHeight: '2.5rem' }}>
                {pool.title}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Challenging users who think it WILL happen. Dare to challenge?
              </div>
            </div>
            
            {/* Pool Economics */}
            <div className="mb-3 p-2 bg-gray-700/40 rounded border border-gray-600/20">
              {(() => {
                // Working from creator stake and odds to calculate total pool
                const creatorStake = Math.round(pool.volume * 0.4); // Assume 40% is creator stake for demo
                const maxBettorStake = Math.round(creatorStake / (pool.odds - 1));
                const totalPool = creatorStake + maxBettorStake;
                return (
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="text-gray-400">Creator Stake</div>
                      <div className="font-semibold text-white">
                        {creatorStake.toLocaleString()} {pool.currency}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400">Max Bets</div>
                      <div className="font-semibold text-white">
                        {maxBettorStake.toLocaleString()} {pool.currency}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400">Total Pool</div>
                      <div className="font-semibold text-cyan-400">{totalPool.toLocaleString()} {pool.currency}</div>
                    </div>
                  </div>
                );
              })()}
            </div>
            
            {/* Betting Options */}
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="text-xs text-gray-400">Odds</div>
                <div className={`text-lg font-bold ${theme.accent}`}>
                  {pool.odds.toFixed(1)}x
                </div>
              </div>
              
              {/* Creator's Prediction Only */}
              <div className="text-center">
                <div className="text-xs text-gray-400">Creator Predicts</div>
                <div className="px-3 py-1 bg-orange-500/20 border border-orange-500/30 rounded text-xs text-orange-400 font-medium">
                  WON&apos;T HAPPEN
                </div>
              </div>
            </div>
          </div>
          
          {/* Title */}
          <h3 className="text-lg font-bold text-white line-clamp-2 mb-3 group-hover:text-cyan-400 transition-colors flex-shrink-0" style={{ minHeight: '3.5rem' }}>
            {pool.title}
          </h3>
          
          {/* Progress Bar */}
          <div className="mb-4 flex-shrink-0">
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
          <div className="grid grid-cols-3 gap-4 mb-4 text-center flex-shrink-0">
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

          {/* Social Stats - pushed to bottom */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-700/20 mt-auto">
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <BoltIcon className="w-3 h-3" />
                {pool.socialStats.likes}
              </div>
              <div className="flex items-center gap-1">
                <BoltIcon className="w-3 h-3" />
                {pool.socialStats.comments}
              </div>
              <div className="flex items-center gap-1">
                <BoltIcon className="w-3 h-3" />
                {pool.socialStats.views}
              </div>
            </div>
            <div className={`flex items-center gap-1 text-xs font-semibold ${
              (pool.change24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              <BoltIcon className={`w-3 h-3 ${(pool.change24h || 0) < 0 ? 'rotate-180' : ''}`} />
              {Math.abs(pool.change24h || 0).toFixed(1)}%
            </div>
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
      <div className="text-center max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Challenge The Future
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Where brilliant minds converge to predict tomorrow. Challenge the Creators, earn legendary rewards, and shape the future of prediction markets.
          </p>
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
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          <span className="bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
            Platform Statistics
          </span>
        </h2>
        <p className="text-lg text-gray-300 max-w-3xl mx-auto">
          Join thousands of predictors in the most advanced prediction ecosystem.
        </p>
      </motion.div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <StatCard icon={CurrencyDollarIcon} label="Total Volume" value={stats.totalVolume} suffix=" tokens" delay={0.1} />
        <StatCard icon={TrophyIcon} label="Active Pools" value={stats.activePools} delay={0.2} />
        <StatCard icon={UsersIcon} label="Total Bets" value={stats.totalBets} delay={0.3} />
        <StatCard icon={StarIcon} label="Success Rate" value={stats.successRate} suffix="%" delay={0.4} />
        <StatCard icon={AcademicCapIcon} label="Creators" value={stats.totalCreators} delay={0.5} />
        <StatCard icon={ChartBarIcon} label="Avg Score" value={stats.avgChallengeScore} delay={0.6} />
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
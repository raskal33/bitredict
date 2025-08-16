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
  RocketLaunchIcon,
  PlayIcon
} from "@heroicons/react/24/outline";
import {
  BoltIcon as BoltSolid,
  StarIcon as StarSolid,
  TrophyIcon as TrophySolid,
  ShieldCheckIcon as ShieldSolid
} from "@heroicons/react/24/solid";
import { Pool, PlatformStats } from "@/lib/types";
import EnhancedPoolCard, { EnhancedPool } from "@/components/EnhancedPoolCard";

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

  // Convert home page Pool to EnhancedPool format
  const convertHomePoolToEnhanced = (pool: Pool): EnhancedPool => {
    return {
      id: parseInt(pool.id),
      creator: pool.creator.address,
      odds: Math.round(pool.odds * 100), // Convert to contract format
      settled: false, // Default value
      creatorSideWon: false, // Default value
      isPrivate: false, // Default value
      usesBitr: pool.currency === 'BITR',
      filledAbove60: pool.progress ? pool.progress >= 60 : false,
      oracleType: 'GUIDED' as const, // Default value
      
      creatorStake: (pool.volume * 0.1).toString(), // Estimate creator stake as 10% of volume
      totalCreatorSideStake: (pool.volume * 0.1).toString(),
      maxBettorStake: (pool.volume * 0.9).toString(), // Estimate max bettor stake
      totalBettorStake: (pool.volume * 0.9).toString(),
      predictedOutcome: pool.predictedOutcome || pool.title,
      result: '',
      marketId: pool.id,
      
      eventStartTime: pool.eventDetails?.startTime ? Math.floor(pool.eventDetails.startTime.getTime() / 1000) : Math.floor(Date.now() / 1000),
      eventEndTime: pool.eventDetails?.endTime ? Math.floor(pool.eventDetails.endTime.getTime() / 1000) : Math.floor(Date.now() / 1000) + 86400,
      bettingEndTime: pool.eventDetails?.startTime ? Math.floor(pool.eventDetails.startTime.getTime() / 1000) - 3600 : Math.floor(Date.now() / 1000) + 82800,
      resultTimestamp: 0,
      arbitrationDeadline: pool.eventDetails?.endTime ? Math.floor(pool.eventDetails.endTime.getTime() / 1000) + 86400 : Math.floor(Date.now() / 1000) + 172800,
      
      league: pool.eventDetails?.league || 'Unknown',
      category: pool.category,
      region: pool.eventDetails?.region || 'Unknown',
      maxBetPerUser: (pool.volume * 0.1).toString(),
      
      boostTier: pool.boostTier ? (pool.boostTier === 3 ? 'GOLD' : pool.boostTier === 2 ? 'SILVER' : 'BRONZE') : 'NONE',
      boostExpiry: 0,
      trending: pool.trending,
      socialStats: pool.socialStats,
      change24h: pool.change24h
    };
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
      creatorPrediction: "no", // Creator thinks it WON'T happen
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
      creatorPrediction: "yes", // Creator thinks it WILL happen
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
        "The merge must be successfully executed on mainnet",
        "All validators must be able to propose and attest blocks",
        "Settlement occurs within 24 hours of the event end date"
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
      creatorPrediction: "no", // Creator thinks it WON'T happen
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
        "Tesla (TSLA) stock must reach or exceed $300 USD on any major exchange",
        "Price must be sustained for at least 1 hour on the target date",
        "Data will be sourced from Yahoo Finance API and verified by multiple oracles",
        "Settlement occurs within 24 hours of the event end date"
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
      creatorPrediction: "yes", // Creator thinks it WILL happen
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
        "Federal Reserve must announce at least 3 rate cuts in 2024",
        "Rate cuts must be officially announced by the FOMC",
        "Data will be sourced from Federal Reserve official statements",
        "Settlement occurs within 24 hours of the event end date"
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
      creatorPrediction: "no", // Creator thinks it WON'T happen
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
        "OpenAI must officially announce GPT-5 release by Q3 2024",
        "Release must be publicly available for testing",
        "Data will be sourced from OpenAI official announcements",
        "Settlement occurs within 24 hours of the event end date"
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
      creatorPrediction: "yes", // Creator thinks it WILL happen
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
        "SpaceX must successfully land a spacecraft on Mars by 2026",
        "Landing must be confirmed by multiple independent sources",
        "Data will be sourced from SpaceX official announcements and NASA verification",
        "Settlement occurs within 24 hours of the event end date"
      ],
      tags: ["spacex", "mars", "space", "rocket"]
    }
  ];

  useEffect(() => {
    fetchPlatformStats();
    fetchPools();
  }, [fetchPlatformStats, fetchPools]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const filteredPools = pools.filter(pool => 
    activeCategory === "" || pool.category === activeCategory
  );

  const categories = ["All", "crypto", "sports", "finance", "politics", "entertainment", "technology"];

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
    value: number; 
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
        {label === "Total Volume" ? `$${(value / 1000).toFixed(0)}k` : value.toLocaleString()}{suffix}
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
      {/* Hero Section */}
      <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            <span className="bg-gradient-to-r from-somnia-cyan via-somnia-blue to-somnia-violet bg-clip-text text-transparent">
              Challenge The Future
              </span>
            </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-8">
            Where brilliant minds converge to predict tomorrow. Challenge the Creators, earn legendary rewards, and shape the future of prediction markets.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/markets">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-somnia-cyan to-somnia-blue text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-somnia-cyan/25 hover:shadow-somnia-cyan/40 transition-all duration-300 flex items-center gap-3"
              >
                <RocketLaunchIcon className="w-6 h-6" />
                Start Predicting
              </motion.button>
            </Link>
            
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-somnia-magenta to-somnia-violet text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-somnia-magenta/25 hover:shadow-somnia-magenta/40 transition-all duration-300 flex items-center gap-3"
            >
              <PlayIcon className="w-6 h-6" />
              Watch Demo
            </motion.button>
            
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
              
      {/* Platform Stats - Removed title */}
              <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <p className="text-lg text-gray-300 max-w-3xl mx-auto mb-8">
          Join thousands of predictors in the most advanced prediction ecosystem.
        </p>
            </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <StatCard icon={CurrencyDollarIcon} label="Total Volume" value={stats.totalVolume} delay={0.1} />
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
                      <EnhancedPoolCard key={pool.id} pool={convertHomePoolToEnhanced(pool)} index={index} />
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
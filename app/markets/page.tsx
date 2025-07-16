"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  Squares2X2Icon,
  Bars3Icon,
  TrophyIcon,
  SparklesIcon,
  ShieldCheckIcon,
  CpuChipIcon,
  CurrencyDollarIcon,
  UsersIcon,
  StarIcon,
  BoltIcon,
  ChartBarIcon
} from "@heroicons/react/24/outline";
import { 
  BoltIcon as BoltSolid,
  FireIcon as FireSolid
} from "@heroicons/react/24/solid";
import { Pool } from "@/lib/types";
import AnimatedTitle from "@/components/AnimatedTitle";
import { TrophyIcon as TrophySolid, StarIcon as StarSolid } from "@heroicons/react/24/solid";

export default function MarketsPage() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string[]>([]);

  const categories = [
    { id: 'all', name: 'All Markets', icon: Squares2X2Icon },
    { id: 'crypto', name: 'Crypto', icon: CurrencyDollarIcon },
    { id: 'sports', name: 'Sports', icon: TrophyIcon },
    { id: 'finance', name: 'Finance', icon: ChartBarIcon },
    { id: 'politics', name: 'Politics', icon: UsersIcon },
    { id: 'entertainment', name: 'Entertainment', icon: SparklesIcon },
    { id: 'technology', name: 'Technology', icon: CpuChipIcon }
  ];

  const filters = [
    { id: 'all', name: 'All Pools', icon: Squares2X2Icon },
    { id: 'boosted', name: 'Boosted', icon: BoltSolid },
    { id: 'combo', name: 'Combo/Parlay', icon: SparklesIcon },
    { id: 'single', name: 'Single Bets', icon: ShieldCheckIcon },
    { id: 'trending', name: 'Trending', icon: FireSolid }
  ];

  const sortOptions = [
    { id: 'newest', name: 'Newest First' },
    { id: 'oldest', name: 'Oldest First' },
    { id: 'volume', name: 'Highest Volume' },
    { id: 'ending_soon', name: 'Ending Soon' },
    { id: 'most_liked', name: 'Most Liked' },
    { id: 'challenge_score', name: 'Challenge Score' }
  ];

  const difficultyOptions = [
    { id: 'easy', name: 'Easy', color: 'text-green-400' },
    { id: 'medium', name: 'Medium', color: 'text-yellow-400' },
    { id: 'hard', name: 'Hard', color: 'text-orange-400' },
    { id: 'very_hard', name: 'Very Hard', color: 'text-red-400' },
    { id: 'legendary', name: 'Legendary', color: 'text-purple-400' }
  ];

  const fetchPools = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pools/featured?limit=50&include_social=true');
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
    fetchPools();
  }, [fetchPools]);

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
      volume24h: 12500,
      change24h: 8.5
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
      volume24h: 8900,
      change24h: -2.1
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
      volume24h: 5600,
      change24h: 3.2
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
      volume24h: 18900,
      change24h: 12.5
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
      volume24h: 3400,
      change24h: -1.8
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
      volume24h: 2100,
      change24h: 5.2
    }
  ];

  const filteredPools = useMemo(() => {
    let filtered = [...pools];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(pool => 
        pool.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pool.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pool.creator.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(pool => pool.category === selectedCategory);
    }

    // Type filter
    if (selectedFilter !== 'all') {
      switch (selectedFilter) {
        case 'boosted':
          filtered = filtered.filter(pool => pool.boosted);
          break;
        case 'combo':
          filtered = filtered.filter(pool => pool.poolType === 'combo' || pool.poolType === 'parlay');
          break;
        case 'single':
          filtered = filtered.filter(pool => pool.poolType === 'single');
          break;
        case 'trending':
          filtered = filtered.filter(pool => pool.trending);
          break;
      }
    }

    // Difficulty filter
    if (selectedDifficulty.length > 0) {
      filtered = filtered.filter(pool => selectedDifficulty.includes(pool.difficultyTier));
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
        break;
      case 'volume':
        filtered.sort((a, b) => b.volume - a.volume);
        break;
      case 'ending_soon':
        filtered.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
        break;
      case 'most_liked':
        filtered.sort((a, b) => b.socialStats.likes - a.socialStats.likes);
        break;
      case 'challenge_score':
        filtered.sort((a, b) => b.challengeScore - a.challengeScore);
        break;
    }

    return filtered;
  }, [pools, searchTerm, selectedCategory, selectedFilter, selectedDifficulty, sortBy]);

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

  const getBoostGlow = (tier?: number) => {
    if (!tier) return '';
    switch (tier) {
      case 1: return 'shadow-[0_0_20px_rgba(255,215,0,0.3)]';
      case 2: return 'shadow-[0_0_25px_rgba(192,192,192,0.4)]';
      case 3: return 'shadow-[0_0_30px_rgba(255,215,0,0.5)]';
      default: return '';
    }
  };

  const PoolCard = ({ pool, isListView = false }: { pool: Pool, isListView?: boolean }) => {
    const theme = getCardTheme(pool.cardTheme);
    
    return (
      <Link href={`/bet/${pool.id}`} className="block">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -4, scale: 1.02 }}
          className={`
            relative overflow-hidden group cursor-pointer
            ${theme.background} ${theme.border} ${theme.glow} ${theme.hoverGlow}
            ${pool.boosted ? getBoostGlow(pool.boostTier) : ''}
            transition-all duration-500
            ${isListView ? 'flex items-center p-6 space-x-6' : 'p-4 rounded-2xl border h-[380px] flex flex-col'}
          `}
        >
          {/* Badge Container */}
          {!isListView && (
            <div className="absolute top-2 left-2 right-2 z-10 flex justify-between items-start pointer-events-none">
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
          )}

          <div className={isListView ? 'flex-1' : 'flex flex-col h-full'}>
            {/* Header */}
            <div className={`flex items-start justify-between mb-3 ${isListView ? '' : 'mt-4'}`}>
              <div className="flex items-center gap-2">
                <div className="text-2xl">{pool.image}</div>
                <div className="min-w-0 flex-1">
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
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs text-gray-400">Score</div>
                <div className={`text-lg font-bold ${theme.accent}`}>
                  {pool.challengeScore}
                </div>
              </div>
            </div>
            
            {/* Title */}
            <h3 className="text-base font-bold text-white line-clamp-2 mb-3 group-hover:text-cyan-400 transition-colors flex-shrink-0" style={{ minHeight: '2.5rem' }}>
              {pool.title}
            </h3>
            
            {/* Creator Prediction Section */}
            <div className="mb-3 p-2 bg-gradient-to-r from-gray-800/40 to-gray-700/40 rounded-lg border border-gray-600/30 flex-shrink-0">
              <div className="mb-2">
                <div className="text-xs text-orange-400 mb-1">💡 Creator believes this WON&apos;T happen</div>
                <div className="text-xs text-gray-400">
                  Challenging users who think it WILL happen
                </div>
              </div>
              
              {/* Betting Options */}
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-xs text-gray-400">Odds</div>
                  <div className={`text-lg font-bold ${theme.accent}`}>
                    {pool.odds.toFixed(1)}x
                  </div>
                </div>
                
                {/* Challenging Option */}
                <div className="text-center">
                  <div className="text-xs text-gray-400">Challenge</div>
                  <div className="px-3 py-1 rounded text-xs font-medium bg-green-500/20 border border-green-500/30 text-green-400">
                    YES
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-3 text-center flex-shrink-0">
              <div>
                <div className="text-xs text-gray-400">Volume</div>
                <div className="text-sm font-bold text-white">${(pool.volume / 1000).toFixed(0)}k</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Participants</div>
                <div className="text-sm font-bold text-white">{pool.participants}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Defeated</div>
                <div className="text-sm font-bold text-white">{pool.defeated}</div>
              </div>
            </div>

            {/* Social Stats - pushed to bottom */}
            <div className={`flex items-center justify-between pt-3 border-t border-gray-700/20 ${isListView ? '' : 'mt-auto'}`}>
              <div className="flex items-center gap-3 text-xs text-gray-400">
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
      {/* Animated Hero Header */}
      <AnimatedTitle 
        size="md"
        leftIcon={TrophySolid}
        rightIcon={StarSolid}
      >
        Prediction Markets
      </AnimatedTitle>
      
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="text-base text-gray-300 max-w-2xl mx-auto text-center leading-relaxed mb-12"
      >
        Where intellect meets opportunity. Challenge the brightest minds, earn from precision, and build your legendary reputation.
      </motion.p>

      {/* Search and Controls */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="space-y-8"
      >
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search markets, creators, or categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-gray-700/50 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <motion.button
                key={category.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  selectedCategory === category.id
                    ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25"
                    : "bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50 border border-gray-700/30"
                }`}
              >
                <category.icon className="w-5 h-5" />
                {category.name}
              </motion.button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-6 py-3 bg-gray-800/50 text-gray-400 rounded-xl hover:text-white transition-all border border-gray-700/30"
              >
                <AdjustmentsHorizontalIcon className="w-5 h-5" />
                Advanced Filters
              </motion.button>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
              >
                {sortOptions.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-xl transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25' 
                    : 'bg-gray-800/50 text-gray-400 hover:text-white border border-gray-700/30'
                }`}
              >
                <Squares2X2Icon className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode('list')}
                className={`p-3 rounded-xl transition-all ${
                  viewMode === 'list' 
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25' 
                    : 'bg-gray-800/50 text-gray-400 hover:text-white border border-gray-700/30'
                }`}
              >
                <Bars3Icon className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-gray-800/30 border border-gray-700/30 rounded-2xl p-6 space-y-6 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Advanced Filters</h3>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700/50"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pool Type Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Pool Type</label>
                    <div className="flex flex-wrap gap-2">
                      {filters.map((filter) => (
                        <motion.button
                          key={filter.id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedFilter(filter.id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                            selectedFilter === filter.id
                              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                              : 'bg-gray-700/50 text-gray-400 hover:text-white border border-gray-600/30'
                          }`}
                        >
                          <filter.icon className="w-4 h-4" />
                          {filter.name}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Difficulty</label>
                    <div className="flex flex-wrap gap-2">
                      {difficultyOptions.map((option) => (
                        <motion.button
                          key={option.id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            if (selectedDifficulty.includes(option.id)) {
                              setSelectedDifficulty(selectedDifficulty.filter(d => d !== option.id));
                            } else {
                              setSelectedDifficulty([...selectedDifficulty, option.id]);
                            }
                          }}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            selectedDifficulty.includes(option.id)
                              ? `bg-current/20 ${option.color} border-2 border-current`
                              : 'bg-gray-700/50 text-gray-400 hover:text-white border border-gray-600/30'
                          }`}
                        >
                          {option.name}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <div className="text-gray-400 text-lg">
              {loading ? 'Loading markets...' : `${filteredPools.length} markets found`}
            </div>
            {filteredPools.length > 0 && (
              <div className="text-sm text-gray-500 bg-gray-800/50 px-4 py-2 rounded-lg">
                Total Volume: <span className="text-cyan-400 font-semibold">
                  {filteredPools.reduce((sum, pool) => sum + pool.volume, 0).toLocaleString()} tokens
                </span>
              </div>
            )}
          </div>

          {loading ? (
            <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
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
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="text-8xl mb-6">🔍</div>
              <h3 className="text-3xl font-bold text-white mb-4">No markets found</h3>
              <p className="text-gray-400 text-lg">
                Try adjusting your filters or search terms to discover more opportunities
              </p>
            </motion.div>
          ) : (
            <div className={`${viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
              : 'space-y-6'
            }`}>
              <AnimatePresence>
                {filteredPools.map((pool, index) => (
                  <motion.div
                    key={pool.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    {/* Only one Link and one PoolCard per card, no nested structure */}
                    <PoolCard pool={pool} isListView={viewMode === 'list'} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </motion.section>
    );
} 
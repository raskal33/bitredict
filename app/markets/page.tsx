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
  ClockIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  EyeIcon,
  TrophyIcon,
  SparklesIcon,
  ShieldCheckIcon,
  LightBulbIcon,
  CpuChipIcon,
  RocketLaunchIcon,
  BeakerIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  StarIcon,
  BoltIcon,
  ChartBarIcon
} from "@heroicons/react/24/outline";
import { 
  BoltIcon as BoltSolid,
  FireIcon as FireSolid,
  StarIcon as StarSolid,
  TrophyIcon as TrophySolid
} from "@heroicons/react/24/solid";
import { Pool } from "@/lib/types";

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
      id: "1",
      title: "Bitcoin will reach $100,000 by March 2025",
      description: "Prediction market on Bitcoin reaching six-figure milestone before March 31, 2025. This challenge tests macro crypto market timing.",
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
      id: "2",
      title: "Manchester City wins Premier League 2024/25",
      description: "Premier League championship prediction market for the 2024/25 season. Will City claim another title?",
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
      odds: 2.1,
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
      change24h: -2.1
    },
    {
      id: "3",
      title: "Tesla stock will hit $300 by end of 2024",
      description: "Tesla's stock price prediction for year-end 2024. Will TSLA reach the $300 milestone?",
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
      odds: 1.9,
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
      change24h: 3.2
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

  const getDifficultyIcon = (tier: string) => {
    switch (tier) {
      case 'easy': return <LightBulbIcon className="w-3 h-3" />;
      case 'medium': return <BeakerIcon className="w-3 h-3" />;
      case 'hard': return <RocketLaunchIcon className="w-3 h-3" />;
      case 'very_hard': return <BoltIcon className="w-3 h-3" />;
      case 'legendary': return <StarIcon className="w-3 h-3" />;
      default: return <LightBulbIcon className="w-3 h-3" />;
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4, scale: 1.02 }}
        className={`
          relative overflow-hidden group cursor-pointer
          ${theme.background} ${theme.border} ${theme.glow} ${theme.hoverGlow}
          ${pool.boosted ? getBoostGlow(pool.boostTier) : ''}
          transition-all duration-500
          ${isListView ? 'flex items-center p-6 space-x-6' : 'p-6 rounded-2xl border'}
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
              <FireSolid className="w-3 h-3" />
              HOT
            </div>
          </div>
        )}

        <Link href={`/bet/${pool.id}`} className="block">
          <div className={isListView ? 'flex-1' : ''}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{pool.image}</div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Created by</div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      {pool.creator.username}
                    </span>
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
                  {getDifficultyIcon(pool.difficultyTier)}
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
                    {pool.defeated} defeated • {pool.odds}x odds
                  </span>
                </div>
                <div className={`font-bold ${theme.accent}`}>
                  {pool.volume.toLocaleString()} {pool.currency}
                </div>
              </div>
            </div>

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
          </div>
        </Link>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Animated Hero Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-6 relative overflow-hidden"
        >
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-purple-500/10 rounded-3xl blur-3xl"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent"></div>
          
          <div className="relative z-10 py-12">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="mb-6"
            >
              <h1 className="text-6xl md:text-7xl font-bold mb-4">
                <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                  Prediction
                </span>
                <br />
                <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
                  Markets
                </span>
              </h1>
              <div className="w-32 h-1 bg-gradient-to-r from-cyan-400 to-purple-500 mx-auto rounded-full"></div>
            </motion.div>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed"
            >
              Where intellect meets opportunity. Challenge the brightest minds, 
              <br className="hidden md:block" />
              earn from precision, and build your legendary reputation.
            </motion.p>
            
            {/* Sub-header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-8 p-6 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-2xl border border-gray-600/30 backdrop-blur-sm"
            >
              <h2 className="text-2xl font-bold text-white mb-2">
                <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  Challenge the Creators
                </span>
              </h2>
              <p className="text-gray-400">
                Join the elite prediction community where accuracy is rewarded and legends are born
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Search and Controls */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="space-y-6"
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
                    <PoolCard pool={pool} isListView={viewMode === 'list'} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
} 
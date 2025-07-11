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
  ArrowTrendingUpIcon
} from "@heroicons/react/24/outline";
import { 
  BoltIcon as BoltSolid,
  FireIcon as FireSolid
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
    { id: 'finance', name: 'Finance', icon: CurrencyDollarIcon },
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
      defeated: 34
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
      defeated: 18
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
      case 'easy': return <ShieldCheckIcon className="w-4 h-4" />;
      case 'medium': return <LightBulbIcon className="w-4 h-4" />;
      case 'hard': return <CpuChipIcon className="w-4 h-4" />;
      case 'very_hard': return <RocketLaunchIcon className="w-4 h-4" />;
      case 'legendary': return <BeakerIcon className="w-4 h-4" />;
      default: return <ShieldCheckIcon className="w-4 h-4" />;
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
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Prediction Markets
            </span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Challenge creators, earn from accuracy, and build your reputation in our vibrant prediction community.
          </p>
        </div>

        {/* Search and Controls */}
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-lg mx-auto">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search markets, creators, or categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedCategory === category.id
                    ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
                    : "bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50"
                }`}
              >
                <category.icon className="w-4 h-4" />
                {category.name}
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 text-gray-400 rounded-lg hover:text-white transition-colors"
              >
                <AdjustmentsHorizontalIcon className="w-4 h-4" />
                Filters
              </button>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50"
              >
                {sortOptions.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-cyan-500 text-white' : 'bg-gray-800/50 text-gray-400 hover:text-white'
                }`}
              >
                <Squares2X2Icon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-cyan-500 text-white' : 'bg-gray-800/50 text-gray-400 hover:text-white'
                }`}
              >
                <Bars3Icon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-800/30 border border-gray-700/30 rounded-lg p-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">Advanced Filters</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pool Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Pool Type</label>
                  <div className="flex flex-wrap gap-2">
                    {filters.map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => setSelectedFilter(filter.id)}
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-all ${
                          selectedFilter === filter.id
                            ? 'bg-cyan-500 text-white'
                            : 'bg-gray-700/50 text-gray-400 hover:text-white'
                        }`}
                      >
                        <filter.icon className="w-3 h-3" />
                        {filter.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
                  <div className="flex flex-wrap gap-2">
                    {difficultyOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          if (selectedDifficulty.includes(option.id)) {
                            setSelectedDifficulty(selectedDifficulty.filter(d => d !== option.id));
                          } else {
                            setSelectedDifficulty([...selectedDifficulty, option.id]);
                          }
                        }}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                          selectedDifficulty.includes(option.id)
                            ? `bg-current/20 ${option.color}`
                            : 'bg-gray-700/50 text-gray-400 hover:text-white'
                        }`}
                      >
                        {option.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-gray-400">
              {loading ? 'Loading...' : `${filteredPools.length} markets found`}
            </div>
            {filteredPools.length > 0 && (
              <div className="text-sm text-gray-500">
                Total Volume: {filteredPools.reduce((sum, pool) => sum + pool.volume, 0).toLocaleString()} tokens
              </div>
            )}
          </div>

          {loading ? (
            <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-800/30 rounded-2xl p-6 animate-pulse">
                  <div className="h-64 bg-gray-700 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : filteredPools.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-white mb-2">No markets found</h3>
              <p className="text-gray-400">
                Try adjusting your filters or search terms
              </p>
            </div>
          ) : (
            <div className={`${viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
              : 'space-y-4'
            }`}>
              <AnimatePresence>
                {filteredPools.map((pool) => (
                  <PoolCard key={pool.id} pool={pool} isListView={viewMode === 'list'} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
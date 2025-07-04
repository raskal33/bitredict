"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  ArrowsUpDownIcon,
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
  CurrencyDollarIcon
} from "@heroicons/react/24/outline";
import { 
  BoltIcon as BoltSolid,
  FireIcon as FireSolid,
  TrophyIcon as TrophySolid
} from "@heroicons/react/24/solid";
import { Pool } from "@/lib/types";

// Re-defining PoolData here as it seems to be out of sync with the shared type
interface PoolData {
  id: string;
  title: string;
  description: string;
  category: string;
  creator: {
    username: string;
    successRate: number;
  };
  challengeScore: number;
  difficultyTier: 'easy' | 'medium' | 'hard' | 'very_hard' | 'legendary';
  odds: number;
  participants: number;
  volume: number;
  currency: 'STT' | 'BITR';
  endDate: string;
  trending: boolean;
  boosted: boolean;
  boostTier?: number;
  poolType: 'single' | 'combo' | 'parlay';
  comboCount?: number;
  image: string;
  cardTheme: string;
  socialStats: {
    comments: number;
    likes: number;
    views: number;
  };
  defeated: number;
}

export default function MarketsPage() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");

  const categories = [
    { id: 'all', name: 'All', icon: Squares2X2Icon },
    { id: 'crypto', name: 'Crypto', icon: CurrencyDollarIcon }
  ];
  const filters = [
    { id: 'all', name: 'All', icon: Squares2X2Icon },
    { id: 'boosted', name: 'Boosted', icon: BoltSolid }
  ];
  const sortOptions = [
    { id: 'newest', name: 'Newest' },
    { id: 'ending_soon', name: 'Ending Soon' }
  ];
  const difficultyOptions = [
    { id: 'all', name: 'All', color: 'text-gray-400' },
    { id: 'easy', name: 'Easy', color: 'text-green-400' }
  ];

  const filteredPools = useMemo(() => {
    return pools.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [pools, searchTerm]);

  useEffect(() => {
    // Mock fetch
    setPools([
      // ... mock data
    ]);
  }, [pools]);

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

  const getBoostGlow = (tier?: number) => {
    if (!tier) return '';
    switch (tier) {
      case 1: return 'shadow-[0_0_20px_rgba(255,165,0,0.4)]'; // Bronze
      case 2: return 'shadow-[0_0_25px_rgba(192,192,192,0.5)]'; // Silver
      case 3: return 'shadow-[0_0_30px_rgba(255,215,0,0.6)]'; // Gold
      default: return '';
    }
  };

  const getCardTheme = (theme: string) => {
    const themes = {
      cyan: {
        background: "bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent",
        border: "border-cyan-500/20",
        accent: "text-cyan-400"
      },
      magenta: {
        background: "bg-gradient-to-br from-pink-500/10 via-purple-500/5 to-transparent",
        border: "border-pink-500/20",
        accent: "text-pink-400"
      },
      violet: {
        background: "bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent",
        border: "border-violet-500/20",
        accent: "text-violet-400"
      },
      blue: {
        background: "bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent",
        border: "border-blue-500/20",
        accent: "text-blue-400"
      },
      indigo: {
        background: "bg-gradient-to-br from-indigo-500/10 via-blue-500/5 to-transparent",
        border: "border-indigo-500/20",
        accent: "text-indigo-400"
      }
    };
    return themes[theme as keyof typeof themes] || themes.cyan;
  };

  const PoolCard = ({ pool, isListView = false }: { pool: PoolData, isListView?: boolean }) => {
    const theme = getCardTheme(pool.cardTheme);
    
    if (isListView) {
      return (
        <motion.div
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.01 }}
          className={`
            glass-card p-4 hover:bg-bg-card/80 transition-all duration-300
            ${pool.boosted ? getBoostGlow(pool.boostTier) : ''}
          `}
        >
          <Link href={`/bet/${pool.id}`} className="block">
            <div className="flex items-center gap-4">
              {/* Pool Icon & Basic Info */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-2xl">{pool.image}</div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-text-primary text-lg">{pool.title}</h3>
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
                    {pool.trending && (
                      <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <FireSolid className="w-3 h-3" />
                        HOT
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-muted">
                    <span className="capitalize">{pool.category}</span>
                    <span>•</span>
                    <span>{pool.creator.username}</span>
                    <span>•</span>
                    <div className={`flex items-center gap-1 ${getDifficultyColor(pool.difficultyTier)}`}>
                      {getDifficultyIcon(pool.difficultyTier)}
                      <span className="capitalize">{pool.difficultyTier.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 ml-auto">
                <div className="text-center">
                  <div className="text-lg font-bold text-text-primary">{pool.challengeScore}</div>
                  <div className="text-xs text-text-muted">Score</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-400">{pool.odds}x</div>
                  <div className="text-xs text-text-muted">Odds</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-text-primary">{pool.participants}</div>
                  <div className="text-xs text-text-muted">Players</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">{(pool.volume / 1000).toFixed(0)}k</div>
                  <div className="text-xs text-text-muted">{pool.currency}</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-text-primary">{pool.socialStats.likes}</div>
                  <div className="text-xs text-text-muted">Likes</div>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      );
    }

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4, scale: 1.02 }}
        className={`
          pool-card relative overflow-hidden group cursor-pointer
          ${theme.background} ${theme.border}
          ${pool.boosted ? getBoostGlow(pool.boostTier) : ''}
          transition-all duration-500 hover:shadow-xl
        `}
      >
        {/* Boost & Trending Indicators */}
        <div className="absolute top-3 right-3 z-10 flex gap-2">
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
          {pool.trending && (
            <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <FireSolid className="w-3 h-3" />
              HOT
            </div>
          )}
        </div>

        {/* Pool Type Indicator */}
        <div className="absolute top-3 left-3 z-10">
          {pool.poolType === 'combo' && (
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <SparklesIcon className="w-3 h-3" />
              COMBO {pool.comboCount}
            </div>
          )}
          {pool.poolType === 'parlay' && (
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <TrophySolid className="w-3 h-3" />
              PARLAY {pool.comboCount}
            </div>
          )}
        </div>

        <Link href={`/bet/${pool.id}`} className="block p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{pool.image}</div>
              <div>
                <div className="text-xs text-text-muted mb-1">Created by</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-text-primary">{pool.creator.username}</span>
                  <div className="text-xs text-text-muted">{pool.creator.successRate.toFixed(1)}%</div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-text-muted">Challenge Score</div>
              <div className={`text-lg font-bold ${getDifficultyColor(pool.difficultyTier)}`}>
                {pool.challengeScore}
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full capitalize">
                {pool.category}
              </span>
              <div className={`flex items-center gap-1 text-xs ${getDifficultyColor(pool.difficultyTier)}`}>
                {getDifficultyIcon(pool.difficultyTier)}
                {pool.difficultyTier.replace('_', ' ').toUpperCase()}
              </div>
            </div>
            <h3 className="text-lg font-bold text-text-primary line-clamp-2 mb-2 group-hover:text-primary transition-colors">
              {pool.title}
            </h3>
            <p className="text-sm text-text-muted line-clamp-2">{pool.description}</p>
          </div>

          {/* Challenge Info */}
          <div className="mb-4 p-3 bg-bg-card/30 rounded-lg border border-border/30">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <TrophyIcon className="w-4 h-4 text-yellow-400" />
                <span className="text-text-secondary">
                  {pool.defeated} defeated • {pool.odds}x odds
                </span>
              </div>
              <div className="text-right">
                <div className="font-bold text-primary">{(pool.volume / 1000).toFixed(0)}k {pool.currency}</div>
              </div>
            </div>
          </div>

          {/* Social Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4 text-center">
            <div>
              <ChatBubbleLeftRightIcon className="w-4 h-4 text-text-muted mx-auto mb-1" />
              <div className="text-xs font-semibold text-text-primary">{pool.socialStats.comments}</div>
            </div>
            <div>
              <HeartIcon className="w-4 h-4 text-text-muted mx-auto mb-1" />
              <div className="text-xs font-semibold text-text-primary">{pool.socialStats.likes}</div>
            </div>
            <div>
              <EyeIcon className="w-4 h-4 text-text-muted mx-auto mb-1" />
              <div className="text-xs font-semibold text-text-primary">{pool.socialStats.views}</div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-border/20">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <ClockIcon className="w-3 h-3" />
              {new Date(pool.endDate).toLocaleDateString()}
            </div>
            <div className="text-xs text-text-muted">
              {pool.participants} players
            </div>
          </div>
        </Link>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-main">
      <div className="container-nav py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-text-primary mb-2">Prediction Markets</h1>
            <p className="text-text-secondary">
              Discover and join prediction battles across all categories
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-bg-card/30 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid' ? 'bg-primary text-black' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <Squares2X2Icon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'list' ? 'bg-primary text-black' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <Bars3Icon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="glass-card p-6 space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              placeholder="Search markets by title, description, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-bg-card/50 border border-border/30 rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-primary/50"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedCategory === category.id
                      ? 'bg-primary text-black shadow-lg'
                      : 'bg-bg-card/50 text-text-secondary hover:text-text-primary hover:bg-bg-card/80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {category.name}
                </button>
              );
            })}
          </div>

          {/* Filter Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Pool Type Filters */}
              <div className="flex gap-2">
                {filters.map(filter => {
                  const Icon = filter.icon;
                  return (
                    <button
                      key={filter.id}
                      onClick={() => setSelectedFilter(filter.id)}
                      className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedFilter === filter.id
                          ? 'bg-secondary text-black'
                          : 'bg-bg-card/30 text-text-secondary hover:text-text-primary hover:bg-bg-card/50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {filter.name}
                    </button>
                  );
                })}
              </div>

              {/* Advanced Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 py-2 bg-bg-card/30 text-text-secondary hover:text-text-primary hover:bg-bg-card/50 rounded-lg text-sm transition-all"
              >
                <AdjustmentsHorizontalIcon className="w-4 h-4" />
                Filters
              </button>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-muted">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-bg-card/30 border border-border/30 rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-primary/50"
              >
                {sortOptions.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
              <ArrowsUpDownIcon className="w-4 h-4 text-text-muted" />
            </div>
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-bg-card/30 rounded-lg border border-border/30 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-text-primary">Advanced Filters</h4>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="text-text-muted hover:text-text-primary"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Difficulty Filter */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Difficulty Level
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {difficultyOptions.map(option => (
                        <button
                          key={option.id}
                          onClick={() => {
                            if (selectedDifficulty === option.id) {
                              setSelectedDifficulty('all');
                            } else {
                              setSelectedDifficulty(option.id);
                            }
                          }}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                            selectedDifficulty === option.id
                              ? `bg-current/20 ${option.color}`
                              : 'bg-bg-hover text-text-secondary hover:text-text-primary'
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
          </AnimatePresence>
        </div>

        {/* Pools */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPools.map(pool => (
            <PoolCard key={pool.id} pool={pool} isListView={viewMode === 'list'} />
          ))}
        </div>
      </div>
    </div>
  );
}
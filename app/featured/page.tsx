"use client";

import { useEffect, useCallback, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrophyIcon,
  StarIcon
} from "@heroicons/react/24/outline";
import {
  BoltIcon as BoltSolid,
  StarIcon as StarSolid,
  FireIcon as FireSolid
} from "@heroicons/react/24/solid";
import { Pool } from "@/lib/types";
import { getDemoPoolData } from "@/lib/demoData";

export default function FeaturedPage() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "boosted" | "trending">("all");

  const fetchPools = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pools/featured?limit=20&include_social=true');
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

  const getFilteredPools = () => {
    switch (activeFilter) {
      case "boosted":
        return pools.filter(pool => pool.boosted);
      case "trending": 
        return pools.filter(pool => pool.trending);
      default:
        return pools.filter(pool => pool.boosted || pool.trending);
    }
  };

  const filteredPools = getFilteredPools();
  const boostCount = pools.filter(pool => pool.boosted).length;
  const trendingCount = pools.filter(pool => pool.trending).length;

  const getCardTheme = (theme: string) => {
    const themes = {
      cyan: {
        background: "bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent",
        border: "border-cyan-500/20",
        glow: "shadow-[0_0_30px_rgba(6,182,212,0.1)]",
        hoverGlow: "hover:shadow-[0_0_40px_rgba(6,182,212,0.2)]",
        accent: "text-cyan-400",
      },
      orange: {
        background: "bg-gradient-to-br from-orange-500/10 via-red-500/5 to-transparent",
        border: "border-orange-500/20",
        glow: "shadow-[0_0_30px_rgba(249,115,22,0.1)]",
        hoverGlow: "hover:shadow-[0_0_40px_rgba(249,115,22,0.2)]",
        accent: "text-orange-400",
      },
      purple: {
        background: "bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent",
        border: "border-purple-500/20",
        glow: "shadow-[0_0_30px_rgba(168,85,247,0.1)]",
        hoverGlow: "hover:shadow-[0_0_40px_rgba(168,85,247,0.2)]",
        accent: "text-purple-400",
      },
      blue: {
        background: "bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent",
        border: "border-blue-500/20",
        glow: "shadow-[0_0_30px_rgba(59,130,246,0.1)]",
        hoverGlow: "hover:shadow-[0_0_40px_rgba(59,130,246,0.2)]",
        accent: "text-blue-400",
      },
      green: {
        background: "bg-gradient-to-br from-green-500/10 via-teal-500/5 to-transparent",
        border: "border-green-500/20",
        glow: "shadow-[0_0_30px_rgba(74,222,128,0.1)]",
        hoverGlow: "hover:shadow-[0_0_40px_rgba(74,222,128,0.2)]",
        accent: "text-green-400",
      },
      red: {
        background: "bg-gradient-to-br from-red-500/10 via-pink-500/5 to-transparent",
        border: "border-red-500/20",
        glow: "shadow-[0_0_30px_rgba(239,68,68,0.1)]",
        hoverGlow: "hover:shadow-[0_0_40px_rgba(239,68,68,0.2)]",
        accent: "text-red-400",
      },
    };
    return themes[theme as keyof typeof themes] || themes.cyan;
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

  const FeaturedPoolCard = ({ pool, index }: { pool: Pool; index: number }) => {
    const theme = getCardTheme(pool.cardTheme);
    
    return (
      <Link href={`/bet/${pool.id}`} className="block">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: index * 0.1 }}
          whileHover={{ y: -8, scale: 1.02 }}
          className={`
            relative overflow-hidden group cursor-pointer h-[380px] flex flex-col
            ${theme.background} ${theme.border} ${theme.glow} ${theme.hoverGlow}
            ${pool.boosted ? getBoostGlow(pool.boostTier) : ''}
            transition-all duration-500 p-6 rounded-2xl border backdrop-blur-sm
          `}
        >
          {/* Premium Badge Container */}
          <div className="absolute top-3 left-3 right-3 z-10 flex justify-between items-start pointer-events-none">
            {pool.trending && (
              <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                <FireSolid className="w-4 h-4" />
                TRENDING
              </div>
            )}
            {pool.boosted && (
              <div className={`
                px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2
                ${pool.boostTier === 3 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black' :
                  pool.boostTier === 2 ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-black' :
                  'bg-gradient-to-r from-orange-600 to-orange-700 text-white'}
              `}>
                <BoltSolid className="w-4 h-4" />
                {pool.boostTier === 3 ? 'GOLD BOOST' : pool.boostTier === 2 ? 'SILVER BOOST' : 'BRONZE BOOST'}
              </div>
            )}
          </div>

          {/* Header */}
          <div className="flex items-center gap-3 mb-4 mt-8">
            <div className="text-3xl">{pool.image}</div>
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
              <div className={`text-xl font-bold ${getDifficultyColor(pool.difficultyTier)}`}>
                {pool.challengeScore}
              </div>
              <div className="text-xs text-gray-400">score</div>
            </div>
          </div>
          
          {/* Title */}
          <h3 className="text-xl font-bold text-white line-clamp-3 mb-4 group-hover:text-cyan-400 transition-colors flex-1">
            {pool.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-400 line-clamp-2 mb-4">
            {pool.description}
          </p>

          {/* Key Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4 text-center">
            <div>
              <div className="text-xl font-bold text-cyan-400">{pool.odds}x</div>
              <div className="text-xs text-gray-400">Odds</div>
            </div>
            <div>
              <div className="text-xl font-bold text-white">${(pool.volume / 1000).toFixed(0)}k</div>
              <div className="text-xs text-gray-400">Pool</div>
            </div>
            <div>
              <div className="text-xl font-bold text-green-400">{pool.participants}</div>
              <div className="text-xs text-gray-400">Players</div>
            </div>
          </div>

          {/* Creator Position */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-lg border border-red-500/20 mt-auto">
            <div className="text-sm text-red-400">Creator says: WON&apos;T happen</div>
            <div className="text-sm text-cyan-400 font-medium">Challenge them!</div>
          </div>

          {/* Special Effects for Boosted */}
          {pool.boosted && pool.boostTier === 3 && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 animate-pulse"></div>
            </div>
          )}
        </motion.div>
      </Link>
    );
  };

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 space-y-8"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center relative"
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute top-[20%] left-[15%] w-6 h-6 bg-yellow-400/20 rounded-full blur-sm"
            animate={{ y: [-10, 10, -10], x: [-5, 5, -5], scale: [1, 1.2, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute top-[60%] right-[20%] w-4 h-4 bg-red-500/30 rounded-full blur-sm"
            animate={{ y: [10, -10, 10], x: [5, -5, 5], scale: [1, 1.3, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          <motion.div 
            className="absolute bottom-[30%] left-[70%] w-5 h-5 bg-cyan-400/25 rounded-full blur-sm"
            animate={{ y: [-8, 8, -8], x: [-3, 3, -3], scale: [1, 1.1, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
        </div>

        <div className="relative z-10 mb-8">
          <div className="flex items-center justify-center gap-4 mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <BoltSolid className="h-8 w-8 text-yellow-400" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold">
              <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                FEATURED POOLS
              </span>
            </h1>
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <FireSolid className="h-8 w-8 text-red-500" />
            </motion.div>
          </div>
          
          <div className="mx-auto mb-6 h-1 w-64 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full"></div>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Discover the hottest trending pools and premium boosted challenges. These are the markets everyone&apos;s talking about.
          </p>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-6 text-center">
          <BoltSolid className="h-12 w-12 mx-auto mb-4 text-yellow-400" />
          <h3 className="text-2xl font-bold text-white mb-1">{boostCount}</h3>
          <p className="text-lg font-semibold text-yellow-400 mb-1">Boosted Pools</p>
          <p className="text-sm text-gray-400">Premium visibility</p>
        </div>
        
        <div className="bg-gradient-to-br from-red-500/10 to-pink-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
          <FireSolid className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <h3 className="text-2xl font-bold text-white mb-1">{trendingCount}</h3>
          <p className="text-lg font-semibold text-red-400 mb-1">Trending Pools</p>
          <p className="text-sm text-gray-400">Hot discussions</p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-purple-500/20 rounded-2xl p-6 text-center">
          <StarSolid className="h-12 w-12 mx-auto mb-4 text-purple-400" />
          <h3 className="text-2xl font-bold text-white mb-1">{filteredPools.length}</h3>
          <p className="text-lg font-semibold text-purple-400 mb-1">Total Featured</p>
          <p className="text-sm text-gray-400">Special pools</p>
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex justify-center"
      >
        <div className="flex items-center gap-2 bg-gray-800/30 p-2 rounded-xl border border-gray-700/30">
          {[
            { id: "all", label: "All Featured", icon: StarSolid },
            { id: "boosted", label: "Boosted", icon: BoltSolid },
            { id: "trending", label: "Trending", icon: FireSolid },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id as "all" | "boosted" | "trending")}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeFilter === filter.id
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-gray-700/50"
              }`}
            >
              <filter.icon className="w-4 h-4" />
              {filter.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Pools Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
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
                <div className="h-80 bg-gray-700/50 rounded-lg"></div>
              </motion.div>
            ))}
          </div>
        ) : filteredPools.length === 0 ? (
          <div className="text-center py-16">
            <StarIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-xl font-bold text-white mb-2">No featured pools found</h3>
            <p className="text-gray-400">Check back soon for more exciting predictions!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {filteredPools.map((pool, index) => (
                <FeaturedPoolCard key={pool.id} pool={pool} index={index} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-center py-12"
      >
        <h3 className="text-2xl font-bold text-white mb-4">Want to Feature Your Pool?</h3>
                  <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
            Get premium visibility for your predictions with our boost system. 
            Reach more participants and maximize your pool&apos;s potential.
          </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/create-prediction">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-yellow-500 to-orange-600 text-black px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3"
            >
              <BoltSolid className="w-6 h-6" />
              Create & Boost Pool
            </motion.button>
          </Link>
          <Link href="/markets">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-gray-700 to-gray-800 text-white px-8 py-4 rounded-xl font-bold text-lg border border-gray-600 hover:border-gray-500 transition-all duration-300 flex items-center gap-3"
            >
              <TrophyIcon className="w-6 h-6" />
              Browse All Markets
            </motion.button>
          </Link>
        </div>
      </motion.div>
    </motion.section>
  );
} 
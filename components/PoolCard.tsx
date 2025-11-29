"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Users, Clock, TrendingUp } from "lucide-react";
import { HeartIcon, ShareIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { formatEther } from "viem";
import Image from "next/image";
import EnhancedPoolCard, { EnhancedPool } from "./EnhancedPoolCard";
import { calculateSellOdds } from "../utils/poolCalculations";
import { usePoolProgress } from "../hooks/useSomniaStreams";
import { usePoolSocialStats } from "../hooks/usePoolSocialStats";
import { useAccount } from "wagmi";
import { toast } from "@/utils/toast";

interface PoolCardProps {
  pool: EnhancedPool;
  onClick?: () => void;
  variant?: "compact" | "full";
}

// Calculate time remaining with urgency indicators
const timeRemaining = (endsAt: number | Date) => {
  const now = new Date();
  const end = endsAt instanceof Date ? endsAt : new Date(endsAt * 1000);
  const diff = end.getTime() - now.getTime();
  
  if (diff <= 0) return { text: "Ended", urgent: false };
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  
  const urgent = hours < 1;
  const text = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  
  return { text, urgent };
};

// Helper function to safely convert stake values
const parseStakeValue = (value: string | number | undefined): number => {
  if (!value) return 0;
  
  if (typeof value === 'number') {
    return value;
  }
  
  const str = value.toString();
  
  if (str.length > 15 && !str.includes('.')) {
    try {
      return parseFloat(formatEther(BigInt(str)));
    } catch {
      return parseFloat(str) || 0;
    }
  }
  
  return parseFloat(str) || 0;
};

// Buy/Sell Progress Bar - BUY (green) on left, SELL (red) on right
const BuySellMeter = ({ buyPct = 50, isHot = false }: { buyPct: number; isHot?: boolean }) => {
  // BUY is green (left side), SELL is red (right side - background)
  const getBuyGradient = () => {
    if (isHot && buyPct > 70) {
      // Hot market - bright green gradient
      return "linear-gradient(90deg, #6EE7B7, #86EFAC, #BBF7D0)";
    } else {
      // Standard - green gradient for BUY
      return "linear-gradient(90deg, #10B981, #34D399, #6EE7B7)";
    }
  };

  return (
    <div className="relative w-full bg-rose-500/30 rounded-full h-3 overflow-hidden border border-slate-700/50 backdrop-blur-sm">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${buyPct}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="h-full rounded-full relative overflow-hidden"
        style={{ background: getBuyGradient() }}
      >
        {/* Shimmer effect for hot markets */}
        {isHot && (
          <motion.div
            animate={{
              x: ["-100%", "200%"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
          />
        )}
      </motion.div>
    </div>
  );
};

// Compact NFT-style card - Premium Bitredict Design
export const PoolCardNFT = ({ pool, onClick }: PoolCardProps) => {
  // ✅ CRITICAL: Subscribe to real-time pool progress updates
  const [dynamicFillPercentage, setDynamicFillPercentage] = useState(pool.indexedData?.fillPercentage || 0);
  const [dynamicParticipants, setDynamicParticipants] = useState(pool.indexedData?.participantCount || 0);
  const [imageErrors, setImageErrors] = useState<{
    cryptoLogo?: boolean;
    homeTeamLogo?: boolean;
    awayTeamLogo?: boolean;
  }>({});
  
  usePoolProgress(pool.id.toString(), (progressData) => {
    console.log(`🔄 PoolCard: Received progress update for pool ${pool.id}:`, progressData);
    // ✅ CRITICAL FIX: Update fill percentage dynamically when LP is added or bets are placed
    if (progressData.fillPercentage !== undefined && !isNaN(progressData.fillPercentage)) {
      setDynamicFillPercentage(progressData.fillPercentage);
      console.log(`   ✅ Updated fill percentage: ${progressData.fillPercentage}%`);
    }
    // ✅ CRITICAL FIX: Update participant count dynamically
    if (progressData.participantCount !== undefined && !isNaN(progressData.participantCount)) {
      setDynamicParticipants(progressData.participantCount);
      console.log(`   ✅ Updated participants: ${progressData.participantCount}`);
    }
    // ✅ CRITICAL FIX: Also update stake values for progress bar calculation
    // Note: PoolCard uses indexedData for stake values, so we rely on parent component updates
    // But we ensure fillPercentage is updated which affects the progress bar
  });

  // Calculate buy/sell volumes
  // Sell side = creator + LPs (totalCreatorSideStake)
  // Buy side = bettors (totalBettorStake)
  const sellVolume = parseStakeValue(pool.totalCreatorSideStake);
  const buyVolume = parseStakeValue(pool.totalBettorStake);
  const totalVolume = sellVolume + buyVolume;
  const sellPct = totalVolume > 0 ? Math.round((sellVolume / totalVolume) * 100) : 50;
  const buyPct = 100 - sellPct;
  
  const isHot = sellPct > 70 || (pool.indexedData?.isHot ?? false) || (pool.trending ?? false);
  const isContrarian = sellPct < 35;
  
  // All pools are contrarian - calculate buy and sell odds
  const buyOdds = pool.odds ? pool.odds / 100 : 2.0;
  const sellOdds = pool.odds ? calculateSellOdds(buyOdds) : 2.0;
  
  const timeInfo = timeRemaining(pool.bettingEndTime || pool.eventEndTime);
  // ✅ Use dynamic values from WebSocket updates, fallback to API data
  const participants = dynamicParticipants || pool.indexedData?.participantCount || 0;
  const fillPercentage = dynamicFillPercentage || pool.indexedData?.fillPercentage || 0;
  const isBoosted = pool.boostTier && pool.boostTier !== 'NONE';
  
  // Bitredict-specific color schemes based on category and status
  const getCardTheme = () => {
    const category = (pool.category || '').toLowerCase();
    
    if (pool.settled) {
      return {
        bgGradient: 'from-slate-800/70 via-slate-700/60 to-slate-800/70',
        borderColor: 'border-slate-500/40',
        accentColor: 'text-slate-400',
        glowColor: 'shadow-slate-400/15',
        headerGradient: 'from-slate-600/35 via-slate-500/25 to-slate-600/35'
      };
    }
    
    if (isBoosted) {
      const boostThemes: Record<'GOLD' | 'SILVER' | 'BRONZE', {
        bgGradient: string;
        borderColor: string;
        accentColor: string;
        glowColor: string;
        headerGradient: string;
      }> = {
        'GOLD': {
          bgGradient: 'from-yellow-900/30 via-amber-800/25 to-yellow-900/30',
          borderColor: 'border-yellow-400/45',
          accentColor: 'text-yellow-300',
          glowColor: 'shadow-yellow-400/25',
          headerGradient: 'from-yellow-500/40 via-amber-400/30 to-yellow-500/40'
        },
        'SILVER': {
          bgGradient: 'from-gray-800/30 via-slate-700/25 to-gray-800/30',
          borderColor: 'border-slate-400/45',
          accentColor: 'text-slate-300',
          glowColor: 'shadow-slate-300/25',
          headerGradient: 'from-slate-500/40 via-gray-400/30 to-slate-500/40'
        },
        'BRONZE': {
          bgGradient: 'from-orange-900/30 via-orange-800/25 to-orange-900/30',
          borderColor: 'border-orange-400/45',
          accentColor: 'text-orange-300',
          glowColor: 'shadow-orange-400/25',
          headerGradient: 'from-orange-500/40 via-orange-400/30 to-orange-500/40'
        }
      };
      return pool.boostTier && pool.boostTier !== 'NONE' ? boostThemes[pool.boostTier] : boostThemes['BRONZE'];
    }
    
    if (category === 'football' || category === 'soccer') {
      return {
        bgGradient: 'from-emerald-900/30 via-green-800/25 to-emerald-900/30',
        borderColor: 'border-emerald-400/45',
        accentColor: 'text-emerald-300',
        glowColor: 'shadow-emerald-400/25',
        headerGradient: 'from-emerald-500/40 via-green-400/30 to-emerald-500/40'
      };
    }
    
    if (category === 'crypto') {
      return {
        bgGradient: 'from-amber-900/30 via-yellow-800/25 to-amber-900/30',
        borderColor: 'border-amber-400/45',
        accentColor: 'text-amber-300',
        glowColor: 'shadow-amber-400/25',
        headerGradient: 'from-amber-500/40 via-yellow-400/30 to-amber-500/40'
      };
    }
    
    // Default Bitredict theme - soft cyan to blue
    return {
      bgGradient: 'from-cyan-900/30 via-blue-800/25 to-cyan-900/30',
      borderColor: 'border-cyan-400/45',
      accentColor: 'text-cyan-300',
      glowColor: 'shadow-cyan-400/25',
      headerGradient: 'from-cyan-500/40 via-blue-400/30 to-cyan-500/40'
    };
  };

  const theme = getCardTheme();
  
  const getStatusBadge = () => {
    if (pool.settled) {
      return { 
        text: "SETTLED", 
        icon: "✓",
        color: "bg-gradient-to-r from-amber-500/80 to-orange-500/80 text-white border-amber-400/40",
        glow: ""
      };
    }
    if (isHot) {
      return { 
        text: "HOT", 
        icon: "🔥",
        color: "bg-gradient-to-r from-rose-500/80 to-orange-400/80 text-white border-rose-400/40",
        glow: "shadow-rose-400/30"
      };
    }
    if (isContrarian) {
      return { 
        text: "CONTRARIAN", 
        icon: "⚡",
        color: "bg-gradient-to-r from-purple-500/80 to-pink-400/80 text-white border-purple-400/40",
        glow: "shadow-purple-400/30"
      };
    }
    if (timeInfo.urgent) {
      return { 
        text: "URGENT", 
        icon: "⏰",
        color: "bg-gradient-to-r from-amber-500/80 to-orange-400/80 text-white border-amber-400/40",
        glow: "shadow-amber-400/30"
      };
    }
    if (isBoosted) {
      const boostBadges: Record<'GOLD' | 'SILVER' | 'BRONZE', {
        text: string;
        icon: string;
        color: string;
        glow: string;
      }> = {
        'GOLD': { text: "GOLD", icon: "🥇", color: "bg-gradient-to-r from-yellow-500/80 to-amber-400/80 text-white border-yellow-400/40", glow: "shadow-yellow-400/30" },
        'SILVER': { text: "SILVER", icon: "🥈", color: "bg-gradient-to-r from-slate-400/80 to-gray-400/80 text-white border-slate-300/40", glow: "shadow-slate-300/30" },
        'BRONZE': { text: "BRONZE", icon: "🥉", color: "bg-gradient-to-r from-orange-500/80 to-orange-600/80 text-white border-orange-400/40", glow: "shadow-orange-400/30" }
      };
      return pool.boostTier && pool.boostTier !== 'NONE' ? boostBadges[pool.boostTier] : boostBadges['BRONZE'];
    }
    return { 
      text: "ACTIVE", 
      icon: "📊",
      color: "bg-gradient-to-r from-cyan-500/80 to-blue-500/80 text-white border-cyan-400/40",
      glow: "shadow-cyan-400/30"
    };
  };

  const status = getStatusBadge();

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.05, y: -6, zIndex: 50 }}
      whileTap={{ scale: 0.98 }}
      className="relative cursor-pointer group"
    >
      {/* Premium glow effect on hover */}
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${theme.headerGradient} rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500 ${theme.glowColor}`} />
      
      {/* Card Container */}
      <div className={`relative w-full max-w-[180px] rounded-2xl overflow-hidden bg-gradient-to-br ${theme.bgGradient} border-2 ${theme.borderColor} backdrop-blur-xl group-hover:border-opacity-100 transition-all duration-300 group-hover:shadow-2xl ${theme.glowColor}`}>
          {/* Header Section with Premium Design */}
        <div className={`relative h-36 overflow-hidden bg-gradient-to-br ${theme.headerGradient}`}>
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                               radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
            }} />
          </div>
          
          {/* Overlay gradient for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
          
          {/* Status Badge - Compact Design - Aligned with Odds */}
          <div className={`absolute top-3 right-3 px-2 py-1 rounded-lg ${status.color} border backdrop-blur-md ${status.glow}`}>
            <div className="flex items-center gap-1">
              <span className="text-[8px]">{status.icon}</span>
              <span className="text-[8px] font-bold tracking-wide">{status.text}</span>
            </div>
          </div>
          
          {/* Team Logos for Football Pools - Positioned at top left */}
          {pool.homeTeam && pool.awayTeam && (pool.homeTeamLogo || pool.awayTeamLogo) && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
              {pool.homeTeamLogo && !imageErrors.homeTeamLogo ? (
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/20 shadow-lg backdrop-blur-sm bg-gray-700/50">
                  <Image 
                    src={pool.homeTeamLogo} 
                    alt={pool.homeTeam || 'Team logo'}
                    width={32}
                    height={32}
                    className="object-cover w-full h-full"
                    unoptimized
                    onError={() => {
                      console.warn('Failed to load home team logo:', pool.homeTeamLogo);
                      setImageErrors(prev => ({ ...prev, homeTeamLogo: true }));
                    }}
                  />
                </div>
              ) : null}
              {pool.awayTeamLogo && !imageErrors.awayTeamLogo ? (
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/20 shadow-lg backdrop-blur-sm bg-gray-700/50">
                  <Image 
                    src={pool.awayTeamLogo} 
                    alt={pool.awayTeam || 'Team logo'}
                    width={32}
                    height={32}
                    className="object-cover w-full h-full"
                    unoptimized
                    onError={() => {
                      console.warn('Failed to load away team logo:', pool.awayTeamLogo);
                      setImageErrors(prev => ({ ...prev, awayTeamLogo: true }));
                    }}
                  />
                </div>
              ) : null}
            </div>
          )}
          
          {/* Crypto Logo for Cryptocurrency Pools - Positioned at top left */}
          {(pool.category === 'cryptocurrency' || pool.category === 'crypto') && pool.cryptoLogo && !imageErrors.cryptoLogo ? (
            <div className="absolute top-3 left-3 z-10">
              <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-amber-400/40 shadow-lg backdrop-blur-sm bg-gray-700/50">
                <Image 
                  src={pool.cryptoLogo} 
                  alt={pool.homeTeam || 'Crypto logo'}
                  width={32}
                  height={32}
                  className="object-cover w-full h-full"
                  unoptimized
                  onError={() => {
                    console.warn('Failed to load crypto logo:', pool.cryptoLogo);
                    setImageErrors(prev => ({ ...prev, cryptoLogo: true }));
                  }}
                />
              </div>
            </div>
          ) : null}
          
          {/* Category & Title Section */}
          <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className={`text-[9px] font-bold ${theme.accentColor} uppercase tracking-widest`}>
                {pool.category === 'cryptocurrency' ? 'CRYPTO' : (pool.category || pool.league || "MARKET")}
              </span>
              {pool.trending && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-pink-400/15 border border-pink-400/25">
                  <TrendingUp className="w-2.5 h-2.5 text-pink-300" />
                  <span className="text-[8px] font-bold text-pink-300">TRENDING</span>
                </div>
              )}
            </div>
            <h3 className="text-sm font-black text-white leading-tight line-clamp-2 group-hover:text-cyan-200 transition-colors drop-shadow-lg">
              {pool.title || `${pool.homeTeam || ""} vs ${pool.awayTeam || ""}` || "Prediction Market"}
            </h3>
          </div>
        </div>

        {/* Content Section - Premium Layout */}
        <div className="p-3.5 space-y-3 bg-gradient-to-b from-slate-900/95 to-slate-950">
          {/* Buy/Sell Meter Section */}
          <div className="space-y-2">
            <BuySellMeter buyPct={buyPct} isHot={isHot} />
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-300 shadow-lg shadow-emerald-300/40" />
                  <span className="text-[10px] font-bold text-emerald-300">BUY {buyPct}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-rose-300 shadow-lg shadow-rose-300/40" />
                  <span className="text-[10px] font-bold text-rose-300">SELL {sellPct}%</span>
                </div>
              </div>
              <div className="flex justify-between items-center gap-2">
                <div className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/30 h-4 flex items-center">
                  <span className="text-[9px] font-bold text-emerald-300">{buyOdds.toFixed(2)}x</span>
                </div>
                <div className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-400/30 h-4 flex items-center">
                  <span className="text-[9px] font-bold text-rose-300">{sellOdds.toFixed(2)}x</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid - Premium Design */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/50">
            {/* Participants */}
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/30">
              <Users className="w-3 h-3 text-cyan-300" />
              <div className="flex flex-col">
                <span className="text-[8px] text-slate-400 uppercase tracking-wider">Users</span>
                <span className="text-xs font-bold text-white">{participants}</span>
              </div>
            </div>
            
            {/* Time Remaining */}
            <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/30 ${timeInfo.urgent ? 'border-amber-400/30 bg-amber-900/15' : ''}`}>
              <Clock className={`w-3 h-3 ${timeInfo.urgent ? 'text-amber-300' : 'text-blue-300'}`} />
              <div className="flex flex-col">
                <span className="text-[8px] text-slate-400 uppercase tracking-wider">Time</span>
                <span className={`text-xs font-bold ${timeInfo.urgent ? 'text-amber-300' : 'text-white'}`}>{timeInfo.text}</span>
              </div>
            </div>
          </div>

          {/* Volume & Fill Section */}
          <div className="space-y-1.5 pt-1 border-t border-slate-700/50">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-medium">Volume</span>
              <span className="text-[9px] font-bold text-white font-mono">
                {totalVolume.toFixed(2)} {pool.usesBitr ? "BITR" : "STT"}
              </span>
            </div>
            {fillPercentage > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-medium">Fill</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${fillPercentage}%` }}
                      transition={{ duration: 0.8 }}
                      className={`h-full rounded-full ${
                        fillPercentage >= 80 ? 'bg-gradient-to-r from-emerald-400 to-green-400' :
                        fillPercentage >= 50 ? 'bg-gradient-to-r from-cyan-400 to-blue-400' :
                        'bg-gradient-to-r from-amber-400 to-orange-400'
                      }`}
                    />
                  </div>
                  <span className="text-[9px] font-bold text-white">{Math.round(fillPercentage)}%</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Catalog view component - Grid of NFT cards with hover effects
// Swipeable Pool Cards Component for Mobile
const SwipeablePoolCards = ({ 
  pools, 
  onPoolClick 
}: { 
  pools: EnhancedPool[]; 
  onPoolClick?: (pool: EnhancedPool) => void;
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [direction, setDirection] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const [showListView, setShowListView] = React.useState(false);
  const constraintsRef = React.useRef<HTMLDivElement>(null);
  const { address } = useAccount();
  
  const currentPool = pools[currentIndex];
  const nextPool = pools[currentIndex + 1];
  const prevPool = pools[currentIndex - 1];
  
  // Social stats for current pool
  const { socialStats, isLiked, isLoading: isLikeLoading, toggleLike } = usePoolSocialStats(currentPool?.id || '');

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    const swipeThreshold = 50;
    const velocityThreshold = 500;

    if (Math.abs(info.offset.x) > swipeThreshold || Math.abs(info.velocity.x) > velocityThreshold) {
      if (info.offset.x > 0 && currentIndex > 0) {
        // Swipe right - go to previous
        setCurrentIndex(currentIndex - 1);
        setDirection(-1);
        setTimeout(() => setDirection(0), 300); // Reset direction after animation
      } else if (info.offset.x < 0 && currentIndex < pools.length - 1) {
        // Swipe left - go to next
        setCurrentIndex(currentIndex + 1);
        setDirection(1);
        setTimeout(() => setDirection(0), 300); // Reset direction after animation
      }
    }
  };

  const goToNext = () => {
    if (currentIndex < pools.length - 1) {
      setDirection(1);
      setCurrentIndex(currentIndex + 1);
      setTimeout(() => setDirection(0), 300);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(currentIndex - 1);
      setTimeout(() => setDirection(0), 300);
    }
  };

  // Share pool function
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentPool) return;
    
    const poolUrl = `${window.location.origin}/bet/${currentPool.id}`;
    const shareText = `Check out this prediction pool: ${currentPool.title || `Pool #${currentPool.id}`}`;
    
    // Try Web Share API first (mobile native sharing)
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentPool.title || `Pool #${currentPool.id}`,
          text: shareText,
          url: poolUrl,
        });
        toast.success('Shared!');
        return;
      } catch (error: unknown) {
        // User cancelled or error, fall back to clipboard
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    }
    
    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(poolUrl);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy link');
    }
  };

  // Handle like
  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!address) {
      toast.error('Please connect your wallet to like pools');
      return;
    }
    toggleLike();
  };

  if (pools.length === 0) return null;

  return (
    <div className="relative w-full h-[600px] md:hidden flex flex-col" ref={constraintsRef}>
      {/* Progress Indicator */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-1.5">
        {pools.map((_, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'w-8 bg-cyan-400'
                : index < currentIndex
                ? 'w-1.5 bg-cyan-400/50'
                : 'w-1.5 bg-slate-600/50'
            }`}
          />
        ))}
      </div>

      {/* Card Counter */}
      <div className="absolute top-4 right-4 z-20 bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-white font-semibold">
        {currentIndex + 1} / {pools.length}
      </div>

      {/* Swipeable Cards Stack - Centered with proper spacing to prevent overlap */}
      <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden" style={{ paddingBottom: '200px', maxHeight: '400px' }}>
        {/* Previous Card (peeking) */}
        {prevPool && (
          <motion.div
            initial={{ x: -100, opacity: 0, scale: 0.9 }}
            animate={{ 
              x: direction === -1 ? -20 : -100,
              opacity: direction === -1 ? 0.3 : 0,
              scale: direction === -1 ? 0.95 : 0.9,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 1 }}
          >
            <div className="w-full h-full flex items-center justify-center px-4 py-4">
              <div className="w-full max-w-[320px] mx-auto">
                <PoolCardNFT pool={prevPool} onClick={() => {}} />
              </div>
            </div>
          </motion.div>
        )}

        {/* Current Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            drag="x"
            dragConstraints={{ left: -200, right: 200 }}
            dragElastic={0.2}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            initial={{ x: direction === 1 ? -300 : direction === -1 ? 300 : 0, opacity: 0, scale: 0.9 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: direction === 1 ? 300 : -300, opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute inset-0"
            style={{ zIndex: 2, cursor: isDragging ? 'grabbing' : 'grab' }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-full h-full flex items-center justify-center px-4 py-4">
              <div className="w-full max-w-[320px] mx-auto">
                <PoolCardNFT 
                  pool={currentPool} 
                  onClick={() => onPoolClick?.(currentPool)}
                />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Next Card (peeking) */}
        {nextPool && (
          <motion.div
            initial={{ x: 100, opacity: 0, scale: 0.9 }}
            animate={{ 
              x: direction === 1 ? 20 : 100,
              opacity: direction === 1 ? 0.3 : 0,
              scale: direction === 1 ? 0.95 : 0.9,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 1 }}
          >
            <div className="w-full h-full flex items-center justify-center px-4 py-4">
              <div className="w-full max-w-[320px] mx-auto">
                <PoolCardNFT pool={nextPool} onClick={() => {}} />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Social Actions Bar - Mobile - Positioned with clear separation from card */}
      {currentPool && !showListView && (
        <div className="absolute bottom-28 left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center gap-3 w-full px-4">
          <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-full border border-slate-700/50 shadow-lg">
            {/* Like Button */}
            <button
              onClick={handleLike}
              disabled={isLikeLoading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                isLiked
                  ? 'bg-pink-500/20 text-pink-400'
                  : 'bg-slate-800/50 text-gray-300 hover:bg-slate-700/50 hover:text-pink-400'
              } ${isLikeLoading ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
            >
              {isLiked ? (
                <HeartIconSolid className="w-4 h-4" />
              ) : (
                <HeartIcon className="w-4 h-4" />
              )}
              <span className="text-xs font-semibold">{socialStats?.likes || 0}</span>
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/50 text-gray-300 hover:bg-slate-700/50 hover:text-cyan-400 transition-all active:scale-95"
            >
              <ShareIcon className="w-4 h-4" />
              <span className="text-xs font-semibold">Share</span>
            </button>
          </div>
          
          {/* View All Button */}
          <button
            onClick={() => setShowListView(true)}
            className="w-full max-w-[200px] px-4 py-2.5 bg-gradient-primary text-black font-semibold rounded-lg hover:opacity-90 transition-opacity active:scale-95 text-sm shadow-lg"
          >
            View All Pools
          </button>
        </div>
      )}

      {/* Navigation Buttons - Positioned at bottom with clear separation */}
      {!showListView && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-4">
          <button
            onClick={goToPrev}
            disabled={currentIndex === 0}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              currentIndex === 0
                ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
                : 'bg-slate-800/80 backdrop-blur-sm text-white hover:bg-slate-700/80 active:scale-95'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNext}
            disabled={currentIndex === pools.length - 1}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              currentIndex === pools.length - 1
                ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
                : 'bg-slate-800/80 backdrop-blur-sm text-white hover:bg-slate-700/80 active:scale-95'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Swipe Hint */}
      {currentIndex === 0 && !isDragging && !showListView && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          className="absolute bottom-36 left-1/2 transform -translate-x-1/2 z-10 text-white/60 text-xs flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
          <span>Swipe to browse</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </motion.div>
      )}

      {/* List View */}
      {showListView && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute inset-0 z-30 bg-gradient-main overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50 px-4 py-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">All Pools</h2>
            <button
              onClick={() => setShowListView(false)}
              className="px-4 py-2 bg-slate-800/50 text-white rounded-lg hover:bg-slate-700/50 transition-colors text-sm font-medium"
            >
              Back
            </button>
          </div>

          {/* Scrollable List - Centered */}
          <div className="p-4 space-y-4 flex flex-col items-center w-full">
            {pools.map((pool, index) => (
              <motion.div
                key={pool.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  onPoolClick?.(pool);
                  setShowListView(false);
                }}
                className="cursor-pointer w-full max-w-[320px] mx-auto"
              >
                <PoolCardNFT pool={pool} onClick={() => {}} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export const PoolCardCatalog = ({ 
  pools, 
  onPoolClick 
}: { 
  pools: EnhancedPool[]; 
  onPoolClick?: (pool: EnhancedPool) => void;
}) => {
  const [hoveredPoolId, setHoveredPoolId] = React.useState<string | number | null>(null);

  return (
    <div className="w-full overflow-hidden">
      {/* Mobile: Swipeable Cards */}
      <div className="md:hidden">
        <SwipeablePoolCards pools={pools} onPoolClick={onPoolClick} />
      </div>

      {/* Desktop: Grid Layout - Centered */}
      <div className="hidden md:flex flex-wrap gap-4 p-3 justify-center items-start w-full">
        {pools.map((pool, index) => {
          const isHovered = hoveredPoolId === pool.id;
          return (
            <motion.div
              key={pool.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: hoveredPoolId === null ? 1 : isHovered ? 1 : 0.25,
                scale: hoveredPoolId === null ? 1 : isHovered ? 1 : 0.92,
              }}
              transition={{ delay: index * 0.03, duration: 0.3, ease: "easeOut" }}
              className="relative flex-shrink-0 flex justify-center"
              style={{ width: '180px' }}
              onMouseEnter={() => setHoveredPoolId(pool.id)}
              onMouseLeave={() => setHoveredPoolId(null)}
            >
              <div className={hoveredPoolId && !isHovered ? 'blur-[2px] pointer-events-none transition-all duration-300' : 'transition-all duration-300'}>
                <PoolCardNFT 
                  pool={pool} 
                  onClick={() => onPoolClick?.(pool)}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// Modal/Overlay that shows EnhancedPoolCard
export const PoolCardModal = ({ 
  pool, 
  isOpen, 
  onClose 
}: { 
  pool: EnhancedPool | null; 
  isOpen: boolean; 
  onClose: () => void;
}) => {
  if (!pool) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-1 sm:p-2 pt-14 sm:pt-16 pb-1 sm:pb-2"
          >
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] overflow-hidden rounded-xl my-auto flex flex-col"
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-neutral-800 border border-neutral-700 text-white hover:bg-neutral-700 transition-colors flex items-center justify-center shadow-lg text-xs sm:text-sm"
              >
                ✕
              </button>
              
              {/* EnhancedPoolCard - Scrollable content */}
              <div className="bg-transparent overflow-y-auto flex-1">
                <EnhancedPoolCard pool={pool} />
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PoolCardNFT;
export type { EnhancedPool } from "./EnhancedPoolCard";


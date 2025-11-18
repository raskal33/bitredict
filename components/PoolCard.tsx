"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Clock, TrendingUp } from "lucide-react";
import { formatEther } from "viem";
import Image from "next/image";
import EnhancedPoolCard, { EnhancedPool } from "./EnhancedPoolCard";
import { calculateSellOdds } from "../utils/poolCalculations";
import { usePoolProgress } from "../hooks/useSomniaStreams";

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
    // Update fill percentage dynamically when LP is added or bets are placed
    if (progressData.fillPercentage !== undefined && !isNaN(progressData.fillPercentage)) {
      setDynamicFillPercentage(progressData.fillPercentage);
      console.log(`   ✅ Updated fill percentage: ${progressData.fillPercentage}%`);
    }
    // Update participant count dynamically
    if (progressData.participantCount !== undefined && !isNaN(progressData.participantCount)) {
      setDynamicParticipants(progressData.participantCount);
      console.log(`   ✅ Updated participants: ${progressData.participantCount}`);
    }
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
      <div className="flex flex-wrap gap-4 p-3 justify-center items-start">
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
              className="relative flex-shrink-0"
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


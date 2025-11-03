"use client";

import { motion } from "framer-motion";
import { 
  BoltIcon,
  StarIcon,
  UserIcon,
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  EyeIcon
} from "@heroicons/react/24/outline";
import { formatEther } from "viem";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { calculatePoolFill } from "../utils/poolCalculations";
import { getPoolStatusDisplay, getStatusBadgeProps } from "../utils/poolStatus";
import { getPoolIcon } from "../services/crypto-icons";
import { titleTemplatesService } from "../services/title-templates";
import PlaceBetModal from "./PlaceBetModal";
import { usePoolSocialStats } from "../hooks/usePoolSocialStats";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import UserAddressLink from "./UserAddressLink";

  // Enhanced Pool interface with indexed data
export interface EnhancedPool {
  id: number;
  creator: string;
  odds: number; // e.g., 150 = 1.50x
  settled: boolean;
  creatorSideWon: boolean;
  isPrivate: boolean;
  usesBitr: boolean;
  filledAbove60: boolean;
  oracleType: 'GUIDED' | 'OPEN';
  status?: 'active' | 'closed' | 'settled' | 'cancelled';
  
  creatorStake: string; // BigInt as string
  totalCreatorSideStake: string;
  maxBettorStake: string;
  totalBettorStake: string;
  predictedOutcome: string; // What creator thinks WON'T happen
  result: string;
  marketId: string;
  
  eventStartTime: number;
  eventEndTime: number;
  bettingEndTime: number;
  resultTimestamp: number;
  arbitrationDeadline: number;
  
  league: string;
  category: string;
  region: string;
  title?: string; // Professional title
  homeTeam?: string;
  awayTeam?: string;
  maxBetPerUser: string;
  marketType?: string; // Market type for title generation
  
  // Optional fields for enhanced display
  boostTier: 'NONE' | 'BRONZE' | 'SILVER' | 'GOLD';
  boostExpiry: number;
  trending?: boolean;
  socialStats?: {
    likes: number;
    comments: number;
    views: number;
  };
  change24h?: number;
  
  // Combo pool fields
  isComboPool?: boolean;
  comboConditions?: Array<{
    marketId: string;
    expectedOutcome: string;
    odds: number;
  }>;
  comboOdds?: number;
  liquidityProviders?: Array<{
    address: string;
    stake: string;
    timestamp: number;
  }>;
  
  // Indexed data fields
  indexedData?: {
    participantCount: number;
    fillPercentage: number;
    totalVolume: string;
    timeToFill?: number;
    betCount: number;
    avgBetSize: string;
    creatorReputation: number;
    categoryRank: number;
    isHot: boolean;
    lastActivity: Date;
  };
  
  // Additional API fields that may be present
  participants?: string;
  avgBet?: string;
  totalBets?: number;
}

interface EnhancedPoolCardProps {
  pool: EnhancedPool;
  index?: number;
  showSocialStats?: boolean;
  className?: string;
  showBoostButton?: boolean;
  onBoostPool?: (poolId: number, tier: 'BRONZE' | 'SILVER' | 'GOLD') => void;
}

export default function EnhancedPoolCard({ 
  pool, 
  index = 0, 
  showSocialStats = true, 
  className = "",
  showBoostButton = false,
  onBoostPool
}: EnhancedPoolCardProps) {
  const router = useRouter();
  const { address } = useAccount();
  const [indexedData, setIndexedData] = useState(pool.indexedData);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [showBetModal, setShowBetModal] = useState(false);
  
  // ✅ Social stats hook
  const { socialStats, isLiked, isLoading, trackView, toggleLike, fetchStats } = usePoolSocialStats(pool.id);
  
  // Track view when card is mounted
  useEffect(() => {
    trackView();
    fetchStats();
  }, [trackView, fetchStats]);
  
  // Update local social stats when pool data changes
  const [localSocialStats, setLocalSocialStats] = useState(pool.socialStats || {
    likes: 0,
    comments: 0,
    views: 0,
    shares: 0
  });
  
  useEffect(() => {
    if (socialStats && (socialStats.likes > 0 || socialStats.comments > 0 || socialStats.views > 0)) {
      setLocalSocialStats(socialStats);
    }
  }, [socialStats]);
  
  // ✅ FIX: Poll for pool progress updates (especially for crypto pools)
  useEffect(() => {
    // Only poll if pool is not settled and we don't have indexedData or need updates
    if (pool.settled) return;
    
    let intervalId: NodeJS.Timeout | null = null;
    
    // Poll every 10 seconds for active pools
    const pollProgress = async () => {
      try {
        const response = await fetch(`/api/optimized-pools/pools/${pool.id}/progress`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setIndexedData(prev => ({
              participantCount: data.data.participants ?? prev?.participantCount ?? 0,
              fillPercentage: data.data.fillPercentage ?? prev?.fillPercentage ?? 0,
              totalVolume: data.data.totalBettorStake?.toString() ?? prev?.totalVolume ?? '0',
              betCount: data.data.participants ?? prev?.betCount ?? 0,
              timeToFill: data.data.timeToFill ?? prev?.timeToFill,
              avgBetSize: prev?.avgBetSize ?? '0',
              creatorReputation: prev?.creatorReputation ?? 0,
              categoryRank: prev?.categoryRank ?? 0,
              isHot: prev?.isHot ?? false,
              lastActivity: prev?.lastActivity ?? new Date()
            }));
          }
        }
      } catch (error) {
        console.warn(`Failed to poll progress for pool ${pool.id}:`, error);
      }
    };
    
    // Poll immediately on mount, then every 10 seconds
    pollProgress();
    intervalId = setInterval(pollProgress, 10000);
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [pool.id, pool.settled]);

  const getDifficultyColor = (odds: number) => {
    if (odds >= 500) return 'text-purple-400'; // Legendary
    if (odds >= 300) return 'text-red-400'; // Expert
    if (odds >= 200) return 'text-orange-400'; // Advanced
    if (odds >= 150) return 'text-yellow-400'; // Intermediate
    return 'text-green-400'; // Beginner
  };

  const getBoostGlow = (tier?: string) => {
    if (!tier || tier === 'NONE') return '';
    switch (tier) {
      case 'GOLD': return 'shadow-lg shadow-yellow-500/30';
      case 'SILVER': return 'shadow-lg shadow-gray-400/30';
      case 'BRONZE': return 'shadow-lg shadow-orange-500/30';
      default: return '';
    }
  };

  const getCardTheme = (category: string) => {
    const themes: { [key: string]: { background: string; border: string; glow: string; hoverGlow: string; accent: string } } = {
      'football': {
        background: 'bg-gradient-to-br from-green-500/10 to-blue-500/10',
        border: 'border-green-500/20',
        glow: 'shadow-green-500/10',
        hoverGlow: 'hover:shadow-green-500/20',
        accent: 'text-green-400'
      },
      'cryptocurrency': {
        background: 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10',
        border: 'border-yellow-500/20',
        glow: 'shadow-yellow-500/10',
        hoverGlow: 'hover:shadow-yellow-500/20',
        accent: 'text-yellow-400'
      },
      'basketball': {
        background: 'bg-gradient-to-br from-orange-500/10 to-red-500/10',
        border: 'border-orange-500/20',
        glow: 'shadow-orange-500/10',
        hoverGlow: 'hover:shadow-orange-500/20',
        accent: 'text-orange-400'
      },
      'politics': {
        background: 'bg-gradient-to-br from-red-500/10 to-purple-500/10',
        border: 'border-red-500/20',
        glow: 'shadow-red-500/10',
        hoverGlow: 'hover:shadow-red-500/20',
        accent: 'text-red-400'
      },
      'entertainment': {
        background: 'bg-gradient-to-br from-pink-500/10 to-purple-500/10',
        border: 'border-pink-500/20',
        glow: 'shadow-pink-500/10',
        hoverGlow: 'hover:shadow-pink-500/20',
        accent: 'text-pink-400'
      },
      'technology': {
        background: 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10',
        border: 'border-blue-500/20',
        glow: 'shadow-blue-500/10',
        hoverGlow: 'hover:shadow-blue-500/20',
        accent: 'text-blue-400'
      },
      'finance': {
        background: 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10',
        border: 'border-emerald-500/20',
        glow: 'shadow-emerald-500/10',
        hoverGlow: 'hover:shadow-emerald-500/20',
        accent: 'text-emerald-400'
      }
    };
    
    return themes[category] || themes['football'];
  };


  const theme = getCardTheme(pool.category);
  const difficultyColor = getDifficultyColor(pool.odds);
  const difficultyTier = pool.odds >= 500 ? 'LEGENDARY' : 
                        pool.odds >= 300 ? 'EXPERT' : 
                        pool.odds >= 200 ? 'ADVANCED' : 
                        pool.odds >= 150 ? 'INTERMEDIATE' : 'BEGINNER';
  
  
  // Enhanced title generation with proper market type detection
  const displayTitle = pool.isComboPool 
    ? `Combo Pool #${pool.id} (${pool.comboConditions?.length || 0} conditions)`
    : (() => {
        // If we have a backend-generated title, use it
        if (pool.title) {
          return pool.title;
        }
        
        // Generate title based on market type and predicted outcome
        if (pool.marketType && pool.predictedOutcome && pool.homeTeam && pool.awayTeam) {
          try {
            
            const marketData = {
              marketType: pool.marketType,
              homeTeam: pool.homeTeam,
              awayTeam: pool.awayTeam,
              predictedOutcome: pool.predictedOutcome,
              league: pool.league,
              category: pool.category
            };
            
            const generatedTitle = titleTemplatesService.generateTitle(marketData, { short: false });
            console.log('🏷️ Generated title:', generatedTitle, 'for market type:', pool.marketType, 'outcome:', pool.predictedOutcome);
            return generatedTitle;
          } catch (error) {
            console.warn('Failed to generate title:', error);
          }
        }
        
        // Fallback to basic team vs team format
        return `${pool.homeTeam || 'Team A'} vs ${pool.awayTeam || 'Team B'}`;
      })();
  
  const formatStake = (stake: string) => {
    try {
      // Handle empty or invalid stake
      if (!stake || stake === '0' || stake === '0x0') {
        return '0';
      }

      // If stake is already formatted (contains decimal), use as-is
      if (stake.includes('.')) {
        const amount = parseFloat(stake);
        if (isNaN(amount)) return '0';
        if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
        return amount.toFixed(1);
      }

      // Handle BigInt conversion safely
      let amount: number;
      try {
        // Check if stake is a valid BigInt string
        if (stake.startsWith('0x')) {
          // Handle hex strings
          const bigIntValue = BigInt(stake);
          amount = parseFloat(formatEther(bigIntValue));
        } else {
          // Handle decimal strings
          const bigIntValue = BigInt(stake);
          amount = parseFloat(formatEther(bigIntValue));
        }
      } catch (error) {
        // Fallback: try to parse as regular number
        console.warn('Failed to parse BigInt, falling back to regular number:', error);
        amount = parseFloat(stake);
        if (isNaN(amount)) return '0';
      }

      if (isNaN(amount)) return '0';
      if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
      if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
      return amount.toFixed(1);
    } catch (error) {
      console.warn('Error formatting stake:', error, 'stake:', stake);
      return '0';
    }
  };

  const handleClick = () => {
    // Navigate to the specific bet page for this pool
    console.log('Navigating to pool:', pool.id);
    router.push(`/bet/${pool.id}`);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getCategoryIcon = (category: string) => {
    const poolIcon = getPoolIcon(category, pool.homeTeam);
    return poolIcon.icon;
  };

  const getCategoryBadgeProps = (category: string) => {
    const poolIcon = getPoolIcon(category, pool.homeTeam);
    return {
      color: poolIcon.color,
      bgColor: poolIcon.bgColor,
      label: poolIcon.name
    };
  };

  // Check if current user is the pool creator
  const isCreator = address && address.toLowerCase() === pool.creator.toLowerCase();
  
  // Check if pool can be boosted (before event starts)
  const canBoost = isCreator && pool.eventStartTime > Date.now() / 1000;
  
  // Boost tier costs
  const boostCosts = {
    'BRONZE': 2,
    'SILVER': 3,
    'GOLD': 5
  };

  const handleBoostClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (canBoost && onBoostPool) {
      setShowBoostModal(true);
    }
  };

  const handleBoostTierSelect = (tier: 'BRONZE' | 'SILVER' | 'GOLD') => {
    if (onBoostPool) {
      onBoostPool(pool.id, tier);
      setShowBoostModal(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ y: -4, scale: 1.01 }}
      onClick={handleClick}
      className={`
        relative overflow-hidden group cursor-pointer min-h-[420px] md:min-h-[450px] flex flex-col
        glass-card ${theme.glow} ${theme.hoverGlow}
        ${pool.boostTier && pool.boostTier !== 'NONE' ? getBoostGlow(pool.boostTier) : ''}
        transition-all duration-500 backdrop-blur-card
        w-full
        ${className}
      `}
    >
      {/* Badge Container - Organized and Clean */}
      <div className="absolute top-2 left-2 right-2 sm:top-3 sm:left-3 sm:right-3 z-10 flex justify-between items-start pointer-events-none">
        {/* Left side badges */}
        <div className="flex flex-col gap-1.5 sm:gap-2">
          {/* Primary Status Badge */}
          {(() => {
            const statusInfo = getPoolStatusDisplay({
              id: pool.id,
              settled: pool.settled,
              creatorSideWon: pool.creatorSideWon,
              eventStartTime: pool.eventStartTime,
              eventEndTime: pool.eventEndTime,
              bettingEndTime: pool.bettingEndTime,
              oracleType: pool.oracleType,
              marketId: pool.marketId
            });
            
            const badgeProps = getStatusBadgeProps(statusInfo);
            
            return (
              <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
                <div className={`${badgeProps.className} pointer-events-auto text-xs sm:text-xs`}>
                  <span className="mr-1">{badgeProps.icon}</span>
                  <span className="hidden sm:inline">{badgeProps.label}</span>
                  <span className="sm:hidden">{badgeProps.label.split(' ')[0]}</span>
                </div>
                
                {/* Trending Badge - next to status */}
                {pool.trending && (
                  <div className="bg-gradient-to-r from-red-500/90 to-pink-500/90 backdrop-blur-sm text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-1 pointer-events-auto">
                    <BoltIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span className="hidden sm:inline">TRENDING</span>
                  </div>
                )}
                
                {/* Hot Badge - next to status and trending */}
                {indexedData?.isHot && (
                  <div className="bg-gradient-to-r from-orange-500/90 to-red-500/90 backdrop-blur-sm text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-1 pointer-events-auto">
                    <ChartBarIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span className="hidden sm:inline">HOT</span>
                  </div>
                )}
              </div>
            );
          })()}

        </div>

        {/* Right side badges */}
        <div className="flex flex-col gap-1.5 sm:gap-2 items-end">
        {/* Boost Badge */}
        {pool.boostTier && pool.boostTier !== 'NONE' && (
          <div className={`
              px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-1 backdrop-blur-sm pointer-events-auto
              ${pool.boostTier === 'GOLD' ? 'bg-gradient-to-r from-yellow-500/90 to-yellow-600/90 text-black' :
                pool.boostTier === 'SILVER' ? 'bg-gradient-to-r from-gray-400/90 to-gray-500/90 text-black' :
                'bg-gradient-to-r from-orange-600/90 to-orange-700/90 text-white'}
          `}>
            <BoltIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            {pool.boostTier}
          </div>
        )}

        {/* Private Badge */}
        {pool.isPrivate && (
            <div className="bg-gradient-to-r from-purple-500/90 to-pink-500/90 backdrop-blur-sm text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-1 pointer-events-auto">
            <UserIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span className="hidden sm:inline">PRIVATE</span>
          </div>
        )}

        {/* Combo Pool Badge */}
        {pool.isComboPool && (
            <div className="bg-gradient-to-r from-purple-500/90 to-indigo-500/90 backdrop-blur-sm text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-1 pointer-events-auto">
            <SparklesIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span className="hidden sm:inline">COMBO</span>
          </div>
        )}

        {/* Boost Button - Only show for creators */}
        {showBoostButton && canBoost && (
          <button
            onClick={handleBoostClick}
              className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-1 bg-gradient-to-r from-yellow-500/90 to-orange-500/90 backdrop-blur-sm text-black hover:from-yellow-400 hover:to-orange-400 transition-all transform hover:scale-105 pointer-events-auto"
          >
            <BoltIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span className="hidden sm:inline">BOOST</span>
          </button>
        )}
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center gap-2 mb-2 sm:mb-3 mt-12 sm:mt-16 px-5 sm:px-6">
        <div className="text-xl sm:text-2xl">{getCategoryIcon(pool.category)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
            {(() => {
              const badgeProps = getCategoryBadgeProps(pool.category);
              return (
                <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium border ${badgeProps.color} ${badgeProps.bgColor} border-current/30`}>
                  {badgeProps.label}
            </span>
              );
            })()}
            <div className={`flex items-center gap-1 text-[10px] sm:text-xs ${difficultyColor}`}>
              <StarIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
              <span className="truncate">{difficultyTier}</span>
            </div>
          </div>
          <div className="text-[10px] sm:text-xs text-gray-400 truncate">
            by <UserAddressLink address={pool.creator} className="text-gray-400 hover:text-primary" /> • {pool.oracleType} Oracle
            {indexedData?.creatorReputation && <span className="hidden sm:inline"> • {indexedData.creatorReputation} rep</span>}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-[10px] sm:text-xs text-gray-400">Pool ID</div>
          <div className={`text-base sm:text-lg font-bold ${theme.accent}`}>
            #{pool.id}
          </div>
        </div>
      </div>

      {/* Professional Title */}
      <h3 className="text-sm sm:text-base font-bold text-white line-clamp-2 mb-2 sm:mb-3 group-hover:text-primary transition-colors flex-shrink-0 px-5 sm:px-6">
        {displayTitle}
      </h3>

      {/* Team Names Display */}
      {pool.homeTeam && pool.awayTeam && (
        <div className="mb-2 sm:mb-3 flex-shrink-0 px-5 sm:px-6">
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-300">
            <span className="font-semibold text-white truncate max-w-[40%]">{pool.homeTeam}</span>
            <span className="text-gray-400 flex-shrink-0">vs</span>
            <span className="font-semibold text-white truncate max-w-[40%]">{pool.awayTeam}</span>
          </div>
        </div>
      )}

      {/* Progress Bar - Always show with fallback */}
        <div className="mb-2 sm:mb-3 flex-shrink-0 px-5 sm:px-6">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">Pool Progress</span>
          <span className="text-xs text-white font-medium">
            {(() => {
              if (indexedData && indexedData.fillPercentage > 0) {
                const roundedPercentage = Math.round(indexedData.fillPercentage * 10) / 10;
                return `${roundedPercentage}%`;
              }
              // API returns already-converted decimal strings, not wei
              const creatorStake = parseFloat(pool.creatorStake || "0");
              const totalBettorStake = parseFloat(pool.totalBettorStake || "0");
              const totalFilled = creatorStake + totalBettorStake;
              
              // Calculate total pool capacity (creator stake + max bettor stake)
              const poolCalculation = calculatePoolFill({
                creatorStake: creatorStake.toString(),
                totalBettorStake: totalBettorStake.toString(),
                odds: pool.odds / 100, // Convert from 160 -> 1.60 format
                isWei: false // API returns already-converted values
              });
              
              // Calculate base capacity
              let totalCapacity = creatorStake + poolCalculation.maxBettorStake;
              
              // Add LP events to capacity if they exist
              if (pool.liquidityProviders && pool.liquidityProviders.length > 0) {
                const lpTotal = pool.liquidityProviders.reduce((sum, lp) => {
                  const lpAmount = parseFloat(lp.stake || "0");
                  // Calculate additional capacity from LP: LP amount / (odds - 1)
                  const oddsDecimal = pool.odds / 100;
                  const additionalCapacity = lpAmount / (oddsDecimal - 1);
                  return sum + additionalCapacity;
                }, 0);
                totalCapacity += lpTotal;
              }
              
              // Calculate percentage of total capacity filled
              const fillPercentage = totalCapacity > 0 ? Math.min((totalFilled / totalCapacity) * 100, 100) : 0;
              
              console.log(`📊 Pool ${pool.id} progress calculation:`, {
                creatorStake,
                totalBettorStake,
                totalFilled,
                totalCapacity,
                fillPercentage
              });
              
              // Round to 1 decimal place for better display
              const displayPercentage = fillPercentage >= 99.95 ? 100 : Math.round(fillPercentage * 10) / 10;
              return `${displayPercentage}%`;
            })()}
          </span>
          </div>
        <div className="w-full rounded-full h-2 bg-gray-800/30 border border-gray-600/20 shadow-inner">
          <div
            className={`h-2 rounded-full transition-all duration-500 shadow-sm ${
              (() => {
                if (indexedData && indexedData.fillPercentage > 0) {
                  return getProgressColor(indexedData.fillPercentage);
                }
                // API returns already-converted decimal strings, not wei
                const creatorStake = parseFloat(pool.creatorStake || "0");
                const totalBettorStake = parseFloat(pool.totalBettorStake || "0");
                const totalFilled = creatorStake + totalBettorStake;
                
                // Calculate total pool capacity (creator stake + max bettor stake)
                const poolCalculation = calculatePoolFill({
                  creatorStake: creatorStake.toString(),
                  totalBettorStake: totalBettorStake.toString(),
                  odds: pool.odds / 100, // Convert from 160 -> 1.60 format
                  isWei: false // API returns already-converted values
                });
                const totalCapacity = creatorStake + poolCalculation.maxBettorStake;
                
                // Calculate percentage of total capacity filled
                const fillPercentage = totalCapacity > 0 ? Math.min((totalFilled / totalCapacity) * 100, 100) : 0;
                
                return getProgressColor(fillPercentage);
              })()
            }`}
            style={{ 
              width: `${(() => {
                if (indexedData && indexedData.fillPercentage > 0) {
                  return Math.min(indexedData.fillPercentage, 100);
                }
                // API returns already-converted decimal strings, not wei
                const creatorStake = parseFloat(pool.creatorStake || "0");
                const totalBettorStake = parseFloat(pool.totalBettorStake || "0");
                const totalFilled = creatorStake + totalBettorStake;
                
                // Calculate total pool capacity (creator stake + max bettor stake)
                const poolCalculation = calculatePoolFill({
                  creatorStake: creatorStake.toString(),
                  totalBettorStake: totalBettorStake.toString(),
                  odds: pool.odds / 100, // Convert from 160 -> 1.60 format
                  isWei: false // API returns already-converted values
                });
                const totalCapacity = creatorStake + poolCalculation.maxBettorStake;
                
                // Calculate percentage of total capacity filled
                const fillPercentage = totalCapacity > 0 ? Math.min((totalFilled / totalCapacity) * 100, 100) : 0;
                
                console.log(`📊 Pool ${pool.id} progress calculation:`, {
                  creatorStake,
                  totalBettorStake,
                  totalFilled,
                  totalCapacity,
                  fillPercentage
                });
                
                return Math.min(fillPercentage, 100);
              })()}%`,
              minWidth: '2px' // Ensure minimum visibility
            }}
            />
          </div>
        
        {/* Pool Capacity Info with LP Events */}
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>
            {(() => {
              // API returns already-converted decimal strings
              const totalBettorStake = parseFloat(pool.totalBettorStake || "0");
              const creatorStake = parseFloat(pool.creatorStake || "0");
              const totalFilled = totalBettorStake + creatorStake;
              
              // Show precise number to avoid confusion
              return totalFilled.toFixed(2);
            })()} {pool.usesBitr ? 'BITR' : 'STT'} Filled
          </span>
          <span>
            {(() => {
              // API returns already-converted decimal strings
              const creatorStake = parseFloat(pool.creatorStake || "0");
              const poolCalculation = calculatePoolFill({
                creatorStake: creatorStake.toString(),
                totalBettorStake: (parseFloat(pool.totalBettorStake || "0")).toString(),
                odds: pool.odds / 100, // Convert from 160 -> 1.60 format
                isWei: false // API returns already-converted values
              });
              
              // Calculate base capacity
              let totalCapacity = creatorStake + poolCalculation.maxBettorStake;
              
              // Add LP events to capacity if they exist
              if (pool.liquidityProviders && pool.liquidityProviders.length > 0) {
                const lpTotal = pool.liquidityProviders.reduce((sum, lp) => {
                  const lpAmount = parseFloat(lp.stake || "0");
                  // Calculate additional capacity from LP: LP amount / (odds - 1)
                  const oddsDecimal = pool.odds / 100;
                  const additionalCapacity = lpAmount / (oddsDecimal - 1);
                  return sum + additionalCapacity;
                }, 0);
                totalCapacity += lpTotal;
              }
              
              // Show precise number to avoid confusion and reverted transactions
              return totalCapacity.toFixed(2);
            })()} {pool.usesBitr ? 'BITR' : 'STT'} Capacity
          </span>
        </div>
      </div>

      {/* Creator Prediction Section or Combo Pool Section */}
      {pool.isComboPool ? (
        <div className="mb-2 sm:mb-3 p-3 sm:p-4 glass-card bg-gradient-to-br from-purple-800/40 to-indigo-900/40 rounded-lg border border-purple-600/30 flex-shrink-0 backdrop-blur-md shadow-lg mx-5 sm:mx-6">
          <div className="mb-2">
            <div className="text-xs text-purple-400 mb-1 flex items-center gap-1">
              <SparklesIcon className="w-3 h-3" />
              Multi-Condition Pool
            </div>
            <div className="text-xs text-gray-400">
              All {pool.comboConditions?.length || 0} conditions must be correct to win
            </div>
          </div>
          
          {/* Combo Pool Info */}
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="text-xs text-gray-400">Combined Odds</div>
              <div className={`text-lg font-bold ${theme.accent}`}>
                {pool.comboOdds ? 
                  (typeof pool.comboOdds === 'number' ? (pool.comboOdds / 100).toFixed(2) : (parseFloat(String(pool.comboOdds)) / 100).toFixed(2)) :
                  (typeof pool.odds === 'number' ? (pool.odds / 100).toFixed(2) : (parseFloat(String(pool.odds)) / 100).toFixed(2))
                }x
              </div>
            </div>
            
            {/* Conditions Count */}
            <div className="text-center">
              <div className="text-xs text-gray-400">Conditions</div>
              <div className="px-3 py-1 rounded text-xs font-medium bg-purple-500/20 border border-purple-500/30 text-purple-400">
                {pool.comboConditions?.length || 0}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-2 sm:mb-3 p-3 sm:p-4 glass-card bg-gradient-to-br from-gray-800/40 to-gray-900/40 rounded-lg border border-gray-600/30 flex-shrink-0 backdrop-blur-md shadow-lg mx-5 sm:mx-6">
          <div className="mb-2">
            <div className="text-xs text-warning mb-1 flex items-center gap-1">
              <BoltIcon className="w-3 h-3" />
              Creator believes this WON&apos;T happen
            </div>
            <div className="text-xs text-text-muted">
              Challenging users who think it WILL happen
            </div>
            
            {/* Creator Selection Display with Enhanced Market Type Detection */}
            {pool.predictedOutcome && (
              <div className="mt-2 p-2 bg-primary/10 border border-primary/20 rounded text-xs">
                <div className="text-primary font-medium">
                  {(() => {
                    // Enhanced market type detection
                    const marketTypeDisplay = (() => {
                      if (pool.marketType === '1X2' || pool.marketType === 'MONEYLINE') return 'Moneyline';
                      if (pool.marketType === 'OU25' || pool.marketType === 'OVER_UNDER') {
                        // Check predicted outcome to determine the specific over/under
                        if (pool.predictedOutcome.toLowerCase().includes('2.5')) return 'Over/Under 2.5';
                        if (pool.predictedOutcome.toLowerCase().includes('1.5')) return 'Over/Under 1.5';
                        if (pool.predictedOutcome.toLowerCase().includes('3.5')) return 'Over/Under 3.5';
                        if (pool.predictedOutcome.toLowerCase().includes('0.5')) return 'Over/Under 0.5';
                        return 'Over/Under';
                      }
                      if (pool.marketType === 'OU15') return 'Over/Under 1.5';
                      if (pool.marketType === 'OU35') return 'Over/Under 3.5';
                      if (pool.marketType === 'OU05') return 'Over/Under 0.5';
                      if (pool.marketType === 'BTTS' || pool.marketType === 'BOTH_TEAMS_SCORE') return 'Both Teams to Score';
                      if (pool.marketType === 'HTFT' || pool.marketType === 'HALF_TIME_FULL_TIME') return 'Half Time/Full Time';
                      if (pool.marketType === 'DC' || pool.marketType === 'DOUBLE_CHANCE') return 'Double Chance';
                      if (pool.marketType === 'CS' || pool.marketType === 'CORRECT_SCORE') return 'Correct Score';
                      if (pool.marketType === 'FG' || pool.marketType === 'FIRST_GOAL') return 'First Goal';
                      if (pool.marketType === 'HT_1X2' || pool.marketType === 'HALF_TIME') return 'Half Time Result';
                      if (pool.marketType === 'CRYPTO_UP') return 'Crypto Price Up';
                      if (pool.marketType === 'CRYPTO_DOWN') return 'Crypto Price Down';
                      if (pool.marketType === 'CRYPTO_TARGET') return 'Crypto Price Target';
                      return 'Market';
                    })();
                    
                    return `${marketTypeDisplay}: ${pool.predictedOutcome}`;
                  })()}
                </div>
              </div>
            )}
          </div>
          
          {/* Betting Options */}
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="text-xs text-gray-400">Odds</div>
              <div className={`text-lg font-bold ${theme.accent}`}>
                {typeof pool.odds === 'number' ? (pool.odds / 100).toFixed(2) : (parseFloat(String(pool.odds)) / 100).toFixed(2)}x
              </div>
            </div>
            
            {/* Challenge Button - Orange marked area */}
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-2">Challenge</div>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card navigation
                  setShowBetModal(true);
                }}
                disabled={pool.settled || (pool.bettingEndTime ? Date.now() / 1000 > pool.bettingEndTime : false)}
                className="px-6 py-2 rounded-lg text-sm font-bold bg-gradient-to-r from-primary to-secondary text-black hover:from-primary/90 hover:to-secondary/90 transition-all transform hover:scale-105 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
              >
                <BoltIcon className="w-4 h-4" />
                Challenge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Stats with Indexed Data */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-2 sm:mb-3 text-center flex-shrink-0 px-5 sm:px-6">
        <div>
          <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
            <CurrencyDollarIcon className="w-3 h-3" />
            Creator Stake
          </div>
          <div className="text-sm font-bold text-white">{formatStake(pool.creatorStake)} {pool.usesBitr ? 'BITR' : 'STT'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
            <UserIcon className="w-3 h-3" />
            Participants
          </div>
          <div className="text-sm font-bold text-white">
            {(() => {
              // Use indexed data first, then fallback to API data
              if (indexedData?.participantCount !== undefined) {
                return indexedData.participantCount.toString();
              }
              
              // Fallback: use participants from API (total YES bet amount in BITR)
              const participantAmount = parseFloat(pool.participants || "0");
              if (participantAmount > 0) {
                // Show formatted amount with abbreviation
                if (participantAmount >= 1000000) return `${(participantAmount / 1000000).toFixed(1)}M`;
                if (participantAmount >= 1000) return `${(participantAmount / 1000).toFixed(1)}K`;
                return participantAmount.toFixed(0);
              }
              
              // Fallback: return 0
              return '0';
            })()}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
            <ClockIcon className="w-3 h-3" />
            {(() => {
              const statusInfo = getPoolStatusDisplay({
                id: pool.id,
                settled: pool.settled,
                creatorSideWon: pool.creatorSideWon,
                eventStartTime: pool.eventStartTime,
                eventEndTime: pool.eventEndTime,
                bettingEndTime: pool.bettingEndTime,
                oracleType: pool.oracleType,
                marketId: pool.marketId
              });
              
              if (statusInfo.status === 'active' && statusInfo.timeRemainingFormatted) {
                return 'Time Left';
              } else if (statusInfo.status === 'pending_settlement' && statusInfo.timeRemainingFormatted) {
                return 'Settlement In';
              } else {
                return 'Status';
              }
            })()}
          </div>
          <div className="text-sm font-bold text-white">
            {(() => {
              const statusInfo = getPoolStatusDisplay({
                id: pool.id,
                settled: pool.settled,
                creatorSideWon: pool.creatorSideWon,
                eventStartTime: pool.eventStartTime,
                eventEndTime: pool.eventEndTime,
                bettingEndTime: pool.bettingEndTime,
                oracleType: pool.oracleType,
                marketId: pool.marketId
              });
              
              if (statusInfo.timeRemainingFormatted) {
                return statusInfo.timeRemainingFormatted;
              } else {
                return statusInfo.label;
              }
            })()}
          </div>
        </div>
      </div>

      {/* Additional Stats - Total Bets, Avg Bet */}
      <div className="grid grid-cols-2 gap-2 sm:gap-2 mb-2 sm:mb-3 text-center flex-shrink-0 px-5 sm:px-6">
        <div>
          <div className="text-xs text-gray-400">Total Bets</div>
          <div className="text-xs font-bold text-white">
            {indexedData?.betCount ?? pool.totalBets ?? 0}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400">Avg Bet</div>
          <div className="text-xs font-bold text-white">
            {(() => {
              // Calculate average bet from total bettor stake and bet count
              const totalBettorStake = parseFloat(pool.totalBettorStake || "0");
              const betCount = indexedData?.betCount ?? pool.totalBets ?? 0;
              
              if (betCount > 0 && totalBettorStake > 0) {
                const avgBet = totalBettorStake / betCount;
                if (avgBet >= 1000000) return `${(avgBet / 1000000).toFixed(1)}M`;
                if (avgBet >= 1000) return `${(avgBet / 1000).toFixed(1)}K`;
                return avgBet.toFixed(2);
              }
              
              // Fallback to indexed data or pool data
              const avgBet = indexedData?.avgBetSize ? parseFloat(indexedData.avgBetSize) : parseFloat(pool.avgBet || "0");
              if (avgBet >= 1000000) return `${(avgBet / 1000000).toFixed(1)}M`;
              if (avgBet >= 1000) return `${(avgBet / 1000).toFixed(1)}K`;
              return avgBet > 0 ? avgBet.toFixed(2) : '0.00';
            })()} {pool.usesBitr ? 'BITR' : 'STT'}
          </div>
        </div>
      </div>
      
      {/* Social Stats - pushed to bottom */}
      {showSocialStats && (
        <div className="flex items-center justify-between pt-2 sm:pt-3 px-5 sm:px-6 pb-3 sm:pb-4 border-t border-gray-700/20 mt-auto">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleLike();
              }}
              disabled={isLoading}
              className={`flex items-center gap-1 transition-colors hover:text-pink-400 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm ${
                isLiked ? 'text-pink-400' : ''
              }`}
            >
              {isLiked ? (
                <HeartIconSolid className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              ) : (
                <HeartIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
              {localSocialStats.likes}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/bet/${pool.id}#comments`);
              }}
              className="flex items-center gap-1 hover:text-blue-400 transition-colors cursor-pointer text-xs sm:text-sm"
            >
              <ChatBubbleLeftIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {localSocialStats.comments}
            </button>
            <div className="flex items-center gap-1 text-xs sm:text-sm">
              <EyeIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {localSocialStats.views}
            </div>
          </div>
          {pool.change24h !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-semibold ${
              pool.change24h >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              <BoltIcon className={`w-3 h-3 ${pool.change24h < 0 ? 'rotate-180' : ''}`} />
              {Math.abs(pool.change24h).toFixed(1)}%
            </div>
          )}
        </div>
      )}

      {/* Boost Modal */}
      {showBoostModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-gray-600/30"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <BoltIcon className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Boost Your Pool</h3>
              <p className="text-gray-400 text-sm">
                Increase visibility and attract more participants with a boost
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {(['BRONZE', 'SILVER', 'GOLD'] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => handleBoostTierSelect(tier)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    tier === 'GOLD' 
                      ? 'border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/20' 
                      : tier === 'SILVER'
                      ? 'border-gray-400/50 bg-gray-400/10 hover:bg-gray-400/20'
                      : 'border-orange-500/50 bg-orange-500/10 hover:bg-orange-500/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        tier === 'GOLD' ? 'bg-yellow-500' : 
                        tier === 'SILVER' ? 'bg-gray-400' : 'bg-orange-500'
                      }`}>
                        <BoltIcon className="w-4 h-4 text-black" />
                      </div>
                      <div>
                        <div className="font-bold text-white">{tier}</div>
                        <div className="text-xs text-gray-400">
                          {tier === 'GOLD' ? 'Pinned to top + Gold badge' :
                           tier === 'SILVER' ? 'Front page + highlighted' :
                           'Higher ranking'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white">{boostCosts[tier]} STT</div>
                      <div className="text-xs text-gray-400">24h duration</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBoostModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Place Bet Modal */}
      <PlaceBetModal
        pool={pool}
        isOpen={showBetModal}
        onClose={() => setShowBetModal(false)}
      />
    </motion.div>
  );
} 
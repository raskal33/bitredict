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
  EyeIcon,
  PlusCircleIcon
} from "@heroicons/react/24/outline";
import { formatEther } from "viem";
import { useState, useEffect, startTransition } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import Image from "next/image";
import { getPoolStatusDisplay, getStatusBadgeProps } from "../utils/poolStatus";
import { getPoolIcon } from "../services/crypto-icons";
import { titleTemplatesService } from "../services/title-templates";
import PlaceBetModal from "./PlaceBetModal";
import AddLiquidityModal from "./AddLiquidityModal";
import { usePoolSocialStats } from "../hooks/usePoolSocialStats";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import UserAddressLink from "./UserAddressLink";
import { RealtimePoolProgress } from "./RealtimePoolProgress";
import { usePoolProgress } from "../hooks/useSomniaStreams";

export interface EnhancedPool {
  id: number;
  creator: string;
  odds: number;
  settled: boolean;
  creatorSideWon: boolean;
  isPrivate: boolean;
  usesBitr: boolean;
  filledAbove60: boolean;
  oracleType: 'GUIDED' | 'OPEN';
  status?: 'active' | 'closed' | 'settled' | 'cancelled';

  creatorStake: string;
  totalCreatorSideStake: string;
  maxBettorStake: string;
  totalBettorStake: string;
  predictedOutcome: string;
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
  title?: string;
  homeTeam?: string;
  awayTeam?: string;
  maxBetPerUser: string;
  marketType?: string;

  boostTier: 'NONE' | 'BRONZE' | 'SILVER' | 'GOLD';
  boostExpiry: number;
  trending?: boolean;
  socialStats?: {
    likes: number;
    comments: number;
    views: number;
  };
  change24h?: number;

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

  homeTeamLogo?: string | null;
  awayTeamLogo?: string | null;
  cryptoLogo?: string | null;

  participants?: string;
  avgBet?: string;
  totalBets?: number;
  isRefunded?: boolean;
  betCount?: number;
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
  const [showLiquidityModal, setShowLiquidityModal] = useState(false);
  const [imageErrors, setImageErrors] = useState<{
    cryptoLogo?: boolean;
    homeTeamLogo?: boolean;
    awayTeamLogo?: boolean;
  }>({});
  
  // ✅ CRITICAL: Use real-time pool progress updates to get latest pool data
  // ✅ CRITICAL FIX: Initialize maxBettorStake correctly
  // Backend returns maxBettorStake which is current_max_bettor_stake (remaining capacity)
  // If it's 0 or missing, calculate it from effectiveCreatorSideStake and odds
  const calculateInitialMaxBettorStake = () => {
    let maxBettorStake = parseFloat(pool.maxBettorStake || "0");
    if (!maxBettorStake || maxBettorStake === 0) {
      const effectiveCreatorSideStake = parseFloat(pool.totalCreatorSideStake || pool.creatorStake || "0");
      const odds = pool.odds || 130;
      const denominator = odds - 100;
      if (denominator > 0 && effectiveCreatorSideStake > 0) {
        maxBettorStake = (effectiveCreatorSideStake * 100) / denominator;
      }
    }
    return maxBettorStake;
  };

  const [currentPoolData, setCurrentPoolData] = useState({
    totalCreatorSideStake: parseFloat(pool.totalCreatorSideStake || pool.creatorStake || "0"),
    totalBettorStake: parseFloat(pool.totalBettorStake || "0"),
    maxBettorStake: calculateInitialMaxBettorStake(),
    fillPercentage: indexedData?.fillPercentage || 0
  });
  
  usePoolProgress(pool.id.toString(), (progressData) => {
    console.log(`🔄 EnhancedPoolCard: Received progress update for pool ${pool.id}:`, progressData);
    // Update pool data when progress changes (e.g., LP added, bets placed)
    setCurrentPoolData(prev => {
      const newData = {
        ...prev,
        totalCreatorSideStake: parseFloat(progressData.effectiveCreatorSideStake || progressData.totalCreatorSideStake || "0"),
        totalBettorStake: parseFloat(progressData.totalBettorStake || "0"),
        maxBettorStake: parseFloat(progressData.currentMaxBettorStake || "0"),
        fillPercentage: progressData.fillPercentage ?? prev.fillPercentage
      };
      console.log(`   ✅ Updated pool data:`, newData);
      return newData;
    });
    
    // Also update indexedData for participant count and bet count
    if (progressData.participantCount !== undefined || progressData.betCount !== undefined) {
      setIndexedData(prev => ({
        participantCount: progressData.participantCount ?? prev?.participantCount ?? 0,
        betCount: progressData.betCount ?? prev?.betCount ?? 0,
        fillPercentage: progressData.fillPercentage ?? prev?.fillPercentage ?? 0,
        totalVolume: prev?.totalVolume ?? '0',
        timeToFill: prev?.timeToFill,
        avgBetSize: prev?.avgBetSize ?? '0',
        creatorReputation: prev?.creatorReputation ?? 0,
        categoryRank: prev?.categoryRank ?? 0,
        isHot: prev?.isHot ?? false,
        lastActivity: prev?.lastActivity ?? new Date()
      }));
    }
  });

  const { socialStats, isLiked, isLoading, trackView, toggleLike, fetchStats } = usePoolSocialStats(pool.id);

  useEffect(() => {
    trackView();
    fetchStats();
    router.prefetch(`/bet/${pool.id}`);
  }, [trackView, fetchStats, router, pool.id]);

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

  useEffect(() => {
    if (pool.settled) return;

    let intervalId: NodeJS.Timeout | null = null;

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

    pollProgress();
    intervalId = setInterval(pollProgress, 10000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [pool.id, pool.settled]);

  const getDifficultyColor = (odds: number) => {
    if (odds >= 500) return 'text-purple-400';
    if (odds >= 300) return 'text-red-400';
    if (odds >= 200) return 'text-orange-400';
    if (odds >= 150) return 'text-yellow-400';
    return 'text-green-400';
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

  const buyOdds = pool.odds ? pool.odds / 100 : 2.0;
  const sellOdds = buyOdds > 1 ? buyOdds / (buyOdds - 1) : 2.0;

  const displayTitle = pool.isComboPool 
    ? `Combo Pool #${pool.id} (${pool.comboConditions?.length || 0} conditions)`
    : (() => {
        if (pool.title) {
          return pool.title;
        }

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

        return `${pool.homeTeam || 'Team A'} vs ${pool.awayTeam || 'Team B'}`;
      })();

  const formatStake = (stake: string) => {
    try {

      if (!stake || stake === '0' || stake === '0x0') {
        return '0';
      }
      if (stake.includes('.')) {
        const amount = parseFloat(stake);
        if (isNaN(amount)) return '0';
        if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
        return amount.toFixed(1);
      }
      let amount: number;
      try {

        if (stake.startsWith('0x')) {

          const bigIntValue = BigInt(stake);
          amount = parseFloat(formatEther(bigIntValue));
        } else {

          const bigIntValue = BigInt(stake);
          amount = parseFloat(formatEther(bigIntValue));
        }
      } catch (error) {

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

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, a, [role="button"]')) {
      return;
    }

    startTransition(() => {
      router.push(`/bet/${pool.id}`, { scroll: false });
    });
  };

  const handleMouseEnter = () => {
    router.prefetch(`/bet/${pool.id}`);
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
  const isCreator = address && address.toLowerCase() === pool.creator.toLowerCase();
  const canBoost = isCreator && pool.eventStartTime > Date.now() / 1000;
  const boostCosts = {
    'BRONZE': 2,
    'SILVER': 3,
    'GOLD': 5
  };

  const handleBoostClick = (e: React.MouseEvent) => {
    e.stopPropagation(); 
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
      onMouseEnter={handleMouseEnter}
      className={`
        relative overflow-hidden group cursor-pointer min-h-[360px] md:min-h-[380px] flex flex-col
        glass-card ${theme.glow} ${theme.hoverGlow}
        ${pool.boostTier && pool.boostTier !== 'NONE' ? getBoostGlow(pool.boostTier) : ''}
        transition-all duration-500 backdrop-blur-card
        w-full max-w-full overflow-x-hidden
        ${className}
      `}
    >
      <div className="absolute top-2 left-2 right-2 sm:top-3 sm:left-3 sm:right-3 z-10 flex justify-between items-start pointer-events-none">

        <div className="flex flex-col gap-1.5 sm:gap-2">

          {(() => {
            const statusInfo = getPoolStatusDisplay({
              id: pool.id,
              settled: pool.settled,
              creatorSideWon: pool.creatorSideWon,
              eventStartTime: pool.eventStartTime,
              eventEndTime: pool.eventEndTime,
              bettingEndTime: pool.bettingEndTime,
              oracleType: pool.oracleType,
              marketId: pool.marketId,
              result: pool.result, // ✅ Pass result for refund detection
              resultTimestamp: pool.resultTimestamp, // ✅ Pass resultTimestamp for refund detection
              // ✅ CRITICAL: Pass isRefunded and bet data from API (backend calculates correctly)
              isRefunded: pool.isRefunded,
              totalBettorStake: pool.totalBettorStake,
              betCount: pool.totalBets || pool.betCount || pool.indexedData?.betCount
            });

            const badgeProps = getStatusBadgeProps(statusInfo);

            return (
              <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
                <div className={`${badgeProps.className} pointer-events-auto text-xs sm:text-xs`}>
                  <span className="mr-1">{badgeProps.icon}</span>
                  <span className="hidden sm:inline">{badgeProps.label}</span>
                  <span className="sm:hidden">{badgeProps.label.split(' ')[0]}</span>
                </div>
                {pool.trending && (
                  <div className="bg-gradient-to-r from-red-500/90 to-pink-500/90 backdrop-blur-sm text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-1 pointer-events-auto">
                    <BoltIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span className="hidden sm:inline">TRENDING</span>
                  </div>
                )}
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
        <div className="flex flex-col gap-1.5 sm:gap-2 items-end">

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
        {pool.isPrivate && (
            <div className="bg-gradient-to-r from-purple-500/90 to-pink-500/90 backdrop-blur-sm text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-1 pointer-events-auto">
            <UserIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span className="hidden sm:inline">PRIVATE</span>
          </div>
        )}
        {pool.isComboPool && (
            <div className="bg-gradient-to-r from-purple-500/90 to-indigo-500/90 backdrop-blur-sm text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-1 pointer-events-auto">
            <SparklesIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span className="hidden sm:inline">COMBO</span>
          </div>
        )}
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
      <div className="flex items-center gap-2 mb-1 sm:mb-1.5 mt-8 sm:mt-10 px-3 sm:px-4 md:px-5">

        {(pool.category === 'cryptocurrency' || pool.category === 'crypto') && pool.cryptoLogo && !imageErrors.cryptoLogo ? (
          <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-yellow-500/30 flex-shrink-0 bg-gray-700/50">
            <Image 
              src={pool.cryptoLogo} 
              alt="Crypto logo"
              width={40}
              height={40}
              className="object-cover w-full h-full"
              unoptimized
              onError={() => {
                console.warn('Failed to load crypto logo:', pool.cryptoLogo);
                setImageErrors(prev => ({ ...prev, cryptoLogo: true }));
              }}
            />
          </div>
        ) : (
          <div className="text-xl sm:text-2xl">{getCategoryIcon(pool.category)}</div>
        )}
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
          <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-400 truncate">
            <span>by <UserAddressLink address={pool.creator} className="text-gray-400 hover:text-primary" /> • {pool.oracleType} Oracle
            {indexedData?.creatorReputation && <span className="hidden sm:inline"> • {indexedData.creatorReputation} rep</span>}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-[10px] sm:text-xs text-gray-400">Pool ID</div>
          <div className={`text-base sm:text-lg font-bold ${theme.accent}`}>
            #{pool.id}
          </div>
        </div>
      </div>
      <h3 className="text-sm sm:text-base font-bold text-white line-clamp-2 mb-1 sm:mb-1.5 group-hover:text-primary transition-colors flex-shrink-0 px-3 sm:px-4 md:px-5">
        {displayTitle}
      </h3>
      {pool.homeTeam && pool.awayTeam && (
        <div className="mb-1 sm:mb-1.5 flex-shrink-0 px-3 sm:px-4 md:px-5">
          <div className="flex items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-300">

            <div className="flex items-center gap-1.5 sm:gap-2 truncate max-w-[40%]">
              {pool.homeTeamLogo && !imageErrors.homeTeamLogo ? (
                <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden flex-shrink-0 border border-gray-600/50 bg-gray-700/50">
                  <Image 
                    src={pool.homeTeamLogo} 
                    alt={pool.homeTeam || 'Team logo'}
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                    unoptimized
                    onError={() => {
                      console.warn('Failed to load home team logo:', pool.homeTeamLogo);
                      setImageErrors(prev => ({ ...prev, homeTeamLogo: true }));
                    }}
                  />
                </div>
              ) : null}
              <span className="font-semibold text-white truncate">{pool.homeTeam}</span>
            </div>
            <span className="text-gray-400 flex-shrink-0">vs</span>

            <div className="flex items-center gap-1.5 sm:gap-2 truncate max-w-[40%]">
              {pool.awayTeamLogo && !imageErrors.awayTeamLogo ? (
                <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden flex-shrink-0 border border-gray-600/50 bg-gray-700/50">
                  <Image 
                    src={pool.awayTeamLogo} 
                    alt={pool.awayTeam || 'Team logo'}
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                    unoptimized
                    onError={() => {
                      console.warn('Failed to load away team logo:', pool.awayTeamLogo);
                      setImageErrors(prev => ({ ...prev, awayTeamLogo: true }));
                    }}
                  />
                </div>
              ) : null}
              <span className="font-semibold text-white truncate">{pool.awayTeam}</span>
            </div>
          </div>
        </div>
      )}
        <div className="mb-1 sm:mb-1.5 flex-shrink-0 px-3 sm:px-4 md:px-5">
          <RealtimePoolProgress 
            poolId={pool.id.toString()}
            initialFillPercentage={indexedData?.fillPercentage || 0}
            initialParticipants={pool.totalBets || indexedData?.participantCount || 0}
            initialBetCount={pool.betCount || pool.totalBets || indexedData?.betCount || 0}
          />
        </div>
      {pool.isComboPool ? (
        <div className="mb-1 sm:mb-1.5 p-2 sm:p-2.5 glass-card bg-gradient-to-br from-purple-800/40 to-indigo-900/40 rounded-lg border border-purple-600/30 flex-shrink-0 backdrop-blur-md shadow-lg mx-3 sm:mx-4 md:mx-5">
          <div className="mb-2">
            <div className="text-xs text-purple-400 mb-1 flex items-center gap-1">
              <SparklesIcon className="w-3 h-3" />
              Multi-Condition Pool
            </div>
            <div className="text-xs text-gray-400">
              All {pool.comboConditions?.length || 0} conditions must be correct to win
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="text-xs text-gray-400">Combined Odds</div>
              <div className={`text-lg font-bold ${theme.accent}`}>
                {pool.comboOdds ? 
                  (typeof pool.comboOdds === 'number' ? (pool.comboOdds / 100).toFixed(2) : (parseFloat(String(pool.comboOdds)) / 100).toFixed(2)) :
                  sellOdds.toFixed(2)
                }x
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400">Conditions</div>
              <div className="px-3 py-1 rounded text-xs font-medium bg-purple-500/20 border border-purple-500/30 text-purple-400">
                {pool.comboConditions?.length || 0}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-1 sm:mb-1.5 p-2 sm:p-2.5 glass-card bg-gradient-to-br from-gray-800/40 to-gray-900/40 rounded-lg border border-gray-600/30 flex-shrink-0 backdrop-blur-md shadow-lg mx-3 sm:mx-4 md:mx-5">
          <div className="mb-2">
            <div className="text-xs text-warning mb-1 flex items-center gap-1">
              <BoltIcon className="w-3 h-3" />
              Creator believes this WON&apos;T happen
            </div>
            <div className="text-xs text-text-muted">
              Challenging users who think it WILL happen
            </div>
            {pool.predictedOutcome && (
              <div className="mt-2 p-2 bg-primary/10 border border-primary/20 rounded text-xs">
                <div className="text-primary font-medium">
                  {(() => {

                    const marketTypeDisplay = (() => {
                      if (pool.marketType === '1X2' || pool.marketType === 'MONEYLINE') return 'Moneyline';
                      if (pool.marketType === 'OU25' || pool.marketType === 'OVER_UNDER') {

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
        </div>

        <div className="mb-2 sm:mb-3 mt-2 sm:mt-3 px-3 sm:px-4 md:px-5">
            <div className="flex items-center gap-2">
              <div 
                className="text-center flex-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowBetModal(true);
                  }}
                  disabled={pool.settled || (pool.bettingEndTime ? Date.now() / 1000 > pool.bettingEndTime : false)}
                  className="w-full px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600 transition-all transform hover:scale-105 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                  <BoltIcon className="w-3.5 h-3.5" />
                  <span>Buy</span>
                  <span className="px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-sm border border-white/30 text-[10px] sm:text-[11px] font-bold">{buyOdds.toFixed(2)}x</span>
                </button>
              </div>

              <div 
                className="text-center flex-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLiquidityModal(true);
                  }}
                  disabled={pool.settled || (pool.bettingEndTime ? Date.now() / 1000 > pool.bettingEndTime : false)}
                  className="w-full px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:from-rose-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-lg shadow-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                  <PlusCircleIcon className="w-3.5 h-3.5" />
                  <span>Sell</span>
                  <span className="px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-sm border border-white/30 text-[10px] sm:text-[11px] font-bold">{sellOdds.toFixed(2)}x</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-1 sm:mb-1.5 text-center flex-shrink-0 px-3 sm:px-4 md:px-5">
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
              // ✅ FIX: Use real-time participant count from RealtimePoolProgress
              // Don't use indexedData.participantCount as it might be wrong
              // RealtimePoolProgress component handles the display correctly
              const participantCount = pool.totalBets || pool.betCount || indexedData?.participantCount || 0;
              return participantCount.toString();
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
      <div className="grid grid-cols-2 gap-2 sm:gap-2 mb-1 sm:mb-1.5 text-center flex-shrink-0 px-3 sm:px-4 md:px-5">
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

              const totalBettorStake = parseFloat(pool.totalBettorStake || "0");
              const betCount = indexedData?.betCount ?? pool.totalBets ?? 0;

              if (betCount > 0 && totalBettorStake > 0) {
                const avgBet = totalBettorStake / betCount;
                if (avgBet >= 1000000) return `${(avgBet / 1000000).toFixed(1)}M`;
                if (avgBet >= 1000) return `${(avgBet / 1000).toFixed(1)}K`;
                return avgBet.toFixed(2);
              }
              const avgBet = indexedData?.avgBetSize ? parseFloat(indexedData.avgBetSize) : parseFloat(pool.avgBet || "0");
              if (avgBet >= 1000000) return `${(avgBet / 1000000).toFixed(1)}M`;
              if (avgBet >= 1000) return `${(avgBet / 1000).toFixed(1)}K`;
              return avgBet > 0 ? avgBet.toFixed(2) : '0.00';
            })()} {pool.usesBitr ? 'BITR' : 'STT'}
          </div>
        </div>
      </div>
      {showSocialStats && (
        <div className="flex items-center justify-between pt-1.5 sm:pt-2 px-3 sm:px-4 md:px-5 pb-2 sm:pb-3 border-t border-gray-700/20 mt-auto">
          <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-400">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleLike();
              }}
              disabled={isLoading}
              className={`flex items-center gap-1 transition-colors hover:text-pink-400 disabled:opacity-50 disabled:cursor-not-allowed text-xs ${
                isLiked ? 'text-pink-400' : ''
              }`}
            >
              {isLiked ? (
                <HeartIconSolid className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              ) : (
                <HeartIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              )}
              {localSocialStats.likes}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/bet/${pool.id}#comments`);
              }}
              className="flex items-center gap-1 hover:text-blue-400 transition-colors cursor-pointer text-xs"
            >
              <ChatBubbleLeftIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              {localSocialStats.comments}
            </button>
            <div className="flex items-center gap-1 text-xs">
              <EyeIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              {localSocialStats.views}
            </div>
          </div>
          {pool.change24h !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-semibold ${
              pool.change24h >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              <BoltIcon className={`w-2.5 h-2.5 ${pool.change24h < 0 ? 'rotate-180' : ''}`} />
              {Math.abs(pool.change24h).toFixed(1)}%
            </div>
          )}
        </div>
      )}
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
      <PlaceBetModal
        pool={{
          ...pool,
          // ✅ CRITICAL: Pass real-time updated pool data
          totalCreatorSideStake: currentPoolData.totalCreatorSideStake.toString(),
          totalBettorStake: currentPoolData.totalBettorStake.toString(),
          maxBettorStake: currentPoolData.maxBettorStake.toString()
        }}
        isOpen={showBetModal}
        onClose={() => setShowBetModal(false)}
      />
      <AddLiquidityModal
        pool={{
          ...pool,
          // ✅ CRITICAL: Pass real-time updated pool data
          totalCreatorSideStake: currentPoolData.totalCreatorSideStake.toString(),
          maxBettorStake: currentPoolData.maxBettorStake.toString()
        }}
        isOpen={showLiquidityModal}
        onClose={() => setShowLiquidityModal(false)}
      />
    </motion.div>
  );
} 
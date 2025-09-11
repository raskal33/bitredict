"use client";

import { motion } from "framer-motion";
import { 
  BoltIcon,
  StarIcon,
  UserIcon,
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon
} from "@heroicons/react/24/outline";
import { formatEther } from "viem";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

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
  maxBetPerUser: string;
  
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
}

interface EnhancedPoolCardProps {
  pool: EnhancedPool;
  index?: number;
  showSocialStats?: boolean;
  className?: string;
}

export default function EnhancedPoolCard({ 
  pool, 
  index = 0, 
  showSocialStats = true, 
  className = ""
}: EnhancedPoolCardProps) {
  const router = useRouter();
  const [isLoadingIndexedData, setIsLoadingIndexedData] = useState(false);
  const [indexedData, setIndexedData] = useState(pool.indexedData);

  const fetchIndexedData = useCallback(async () => {
    setIsLoadingIndexedData(true);
    try {
      // Get pool progress data
      const progressResponse = await fetch(`/api/guided-markets/pools/${pool.id}/progress`);
      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        if (progressData.success && progressData.data) {
          setIndexedData({
            participantCount: progressData.data.bettorCount + progressData.data.lpCount,
            fillPercentage: progressData.data.fillPercentage,
            totalVolume: progressData.data.totalPoolSize,
            betCount: progressData.data.bettorCount,
            avgBetSize: progressData.data.currentBettorStake && progressData.data.bettorCount > 0 
              ? (parseFloat(progressData.data.currentBettorStake) / progressData.data.bettorCount).toString()
              : '0',
            creatorReputation: 0, // TODO: Implement reputation system
            categoryRank: 0, // TODO: Implement ranking
            isHot: progressData.data.fillPercentage > 50,
            lastActivity: new Date()
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch indexed data:', error);
    } finally {
      setIsLoadingIndexedData(false);
    }
  }, [pool.id]);

  // Fetch indexed data if not provided, with reduced polling frequency
  useEffect(() => {
    if (!pool.indexedData && !isLoadingIndexedData) {
      fetchIndexedData();
    }
  }, [pool.id, pool.indexedData, isLoadingIndexedData, fetchIndexedData]);

  // Set up periodic refresh with longer intervals to reduce API calls
  useEffect(() => {
    if (!pool.indexedData) return;

    const interval = setInterval(() => {
      // Only refresh if the pool is active and not settled
      if (!pool.settled && pool.bettingEndTime > Date.now() / 1000) {
        fetchIndexedData();
      }
    }, 30000); // Refresh every 30 seconds instead of continuous polling

    return () => clearInterval(interval);
  }, [pool.settled, pool.bettingEndTime, pool.indexedData, fetchIndexedData]);

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

  // Generate professional betting market title
  const generateProfessionalTitle = (predictedOutcome: string, category: string) => {
    // For football markets, try to extract team names and create proper format
    if (category === 'football') {
      // Common patterns for football predictions
      const patterns = [
        /(.+?)\s+(?:will\s+)?(?:NOT\s+)?(?:win|beat|defeat)\s+(.+?)(?:\s+in\s+.+)?$/i,
        /(.+?)\s+vs\s+(.+?)\s+(.+)/i,
        /(.+?)\s+and\s+(.+?)\s+(.+)/i
      ];
      
      for (const pattern of patterns) {
        const match = predictedOutcome.match(pattern);
        if (match) {
          const team1 = match[1]?.trim();
          const team2 = match[2]?.trim();
          const outcome = match[3]?.trim();
          
          if (team1 && team2) {
            // Clean up team names
            const cleanTeam1 = team1.replace(/\s+(?:will\s+)?(?:NOT\s+)?(?:win|beat|defeat)/i, '').trim();
            const cleanTeam2 = team2.replace(/\s+(?:will\s+)?(?:NOT\s+)?(?:win|beat|defeat)/i, '').trim();
            
            if (outcome && outcome.includes('2.5')) {
              return `${cleanTeam1} vs ${cleanTeam2} 2.5 Over?`;
            } else if (outcome && outcome.includes('1.5')) {
              return `${cleanTeam1} vs ${cleanTeam2} 1.5 Over?`;
            } else if (outcome && outcome.includes('3.5')) {
              return `${cleanTeam1} vs ${cleanTeam2} 3.5 Over?`;
            } else if (outcome && outcome.includes('win')) {
              return `${cleanTeam1} vs ${cleanTeam2} Winner`;
            } else {
              return `${cleanTeam1} vs ${cleanTeam2}`;
            }
          }
        }
      }
    }
    
    // For cryptocurrency markets
    if (category === 'cryptocurrency') {
      const cryptoMatch = predictedOutcome.match(/(.+?)\s+(?:will\s+)?(?:NOT\s+)?(?:reach|hit|exceed)\s+(\$[\d,]+)/i);
      if (cryptoMatch) {
        const crypto = cryptoMatch[1]?.trim();
        const price = cryptoMatch[2]?.trim();
        return `${crypto} ${price} Target`;
      }
    }
    
    // For basketball markets
    if (category === 'basketball') {
      const bballMatch = predictedOutcome.match(/(.+?)\s+(?:will\s+)?(?:NOT\s+)?(?:beat|defeat)\s+(.+?)/i);
      if (bballMatch) {
        const team1 = bballMatch[1]?.trim();
        const team2 = bballMatch[2]?.trim();
        return `${team1} vs ${team2}`;
      }
    }
    
    // Fallback: clean up the predicted outcome
    return predictedOutcome
      .replace(/\s+(?:will\s+)?(?:NOT\s+)?(?:happen|occur|take place)/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 50) + (predictedOutcome.length > 50 ? '...' : '');
  };

  const theme = getCardTheme(pool.category);
  const difficultyColor = getDifficultyColor(pool.odds);
  const difficultyTier = pool.odds >= 500 ? 'LEGENDARY' : 
                        pool.odds >= 300 ? 'EXPERT' : 
                        pool.odds >= 200 ? 'ADVANCED' : 
                        pool.odds >= 150 ? 'INTERMEDIATE' : 'BEGINNER';
  
  // Generate a proper title from the pool data
  const displayTitle = pool.predictedOutcome && pool.predictedOutcome !== '0x' && pool.predictedOutcome.length > 10 
    ? generateProfessionalTitle(pool.predictedOutcome, pool.category || 'sports')
    : `${(pool.category || 'sports').charAt(0).toUpperCase() + (pool.category || 'sports').slice(1)} Pool #${pool.id}`;
  
  const formatStake = (stake: string) => {
    try {
      // If stake is already formatted (contains decimal), use as-is
      if (stake.includes('.')) {
        const amount = parseFloat(stake);
        if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
        return amount.toFixed(1);
      }
      // If stake is in wei format, convert it
      const amount = parseFloat(formatEther(BigInt(stake)));
      if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
      if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
      return amount.toFixed(1);
    } catch {
      return '0';
    }
  };

  const formatTimeLeft = (endTime: number) => {
    try {
      const now = Math.floor(Date.now() / 1000);
      const timeLeft = endTime - now;
      
      if (timeLeft <= 0) return "Ended";
      if (isNaN(timeLeft)) return "TBD";
      
      const days = Math.floor(timeLeft / 86400);
      const hours = Math.floor((timeLeft % 86400) / 3600);
      const minutes = Math.floor((timeLeft % 3600) / 60);
      
      if (days > 0) return `${days}d ${hours}h`;
      if (hours > 0) return `${hours}h ${minutes}m`;
      if (minutes > 0) return `${minutes}m`;
      return `${Math.floor(timeLeft)}s`;
    } catch {
      return "TBD";
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return "Unknown";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
    const icons: { [key: string]: string } = {
      'football': '⚽',
      'cryptocurrency': '₿',
      'basketball': '🏀',
      'politics': '🏛️',
      'entertainment': '🎬',
      'technology': '💻',
      'finance': '💰',
      'sports': '🏆'
    };
    return icons[category] || '🎯';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ y: -4, scale: 1.01 }}
      onClick={handleClick}
      className={`
        relative overflow-hidden group cursor-pointer min-h-[480px] max-h-[520px] flex flex-col
        glass-card ${theme.glow} ${theme.hoverGlow}
        ${pool.boostTier && pool.boostTier !== 'NONE' ? getBoostGlow(pool.boostTier) : ''}
        transition-all duration-500 backdrop-blur-card
        ${className}
      `}
    >
      {/* Badge Container */}
      <div className="absolute top-2 left-2 right-2 z-10 flex justify-between items-start pointer-events-none">
        {/* Trending Badge */}
        {pool.trending && (
          <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <BoltIcon className="w-3 h-3" />
            TRENDING
          </div>
        )}

        {/* Boost Badge */}
        {pool.boostTier && pool.boostTier !== 'NONE' && (
          <div className={`
            px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1
            ${pool.boostTier === 'GOLD' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black' :
              pool.boostTier === 'SILVER' ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-black' :
              'bg-gradient-to-r from-orange-600 to-orange-700 text-white'}
          `}>
            <BoltIcon className="w-3 h-3" />
            {pool.boostTier}
          </div>
        )}

        {/* Private Badge */}
        {pool.isPrivate && (
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <UserIcon className="w-3 h-3" />
            PRIVATE
          </div>
        )}

        {/* Hot Badge from indexed data */}
        {indexedData?.isHot && (
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <ChartBarIcon className="w-3 h-3" />
            HOT
          </div>
        )}

        {/* Pool Status Badge */}
        {pool.status && (
          <div className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
            pool.status === 'active' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' :
            pool.status === 'closed' ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white' :
            pool.status === 'settled' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' :
            'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
          }`}>
            <ClockIcon className="w-3 h-3" />
            {pool.status.toUpperCase()}
          </div>
        )}
      </div>

      {/* Header */}
      <div className="flex items-center gap-2 mb-3 mt-4">
        <div className="text-2xl">{getCategoryIcon(pool.category)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2 py-1 rounded-full ${theme.accent} bg-current/10 truncate capitalize`}>
              {pool.category}
            </span>
            <div className={`flex items-center gap-1 text-xs ${difficultyColor}`}>
              <StarIcon className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{difficultyTier}</span>
            </div>
          </div>
          <div className="text-xs text-gray-400 truncate">
            by {formatAddress(pool.creator)} • {pool.oracleType} Oracle
            {indexedData?.creatorReputation && ` • ${indexedData.creatorReputation} rep`}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xs text-gray-400">Pool ID</div>
          <div className={`text-lg font-bold ${theme.accent}`}>
            #{pool.id}
          </div>
        </div>
      </div>

      {/* Professional Title */}
      <h3 className="text-base font-bold text-white line-clamp-2 mb-3 group-hover:text-primary transition-colors flex-shrink-0" style={{ minHeight: '2.5rem' }}>
        {displayTitle}
      </h3>

      {/* Progress Bar - Indexed Data */}
      {indexedData && (
        <div className="mb-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">Pool Progress</span>
            <span className="text-xs text-white font-medium">{indexedData.fillPercentage}%</span>
          </div>
          <div className="w-full glass-card rounded-full h-0.5 bg-gray-800/30 border border-gray-600/20 shadow-inner">
            <div
              className={`h-0.5 rounded-full transition-all duration-500 shadow-sm ${getProgressColor(indexedData.fillPercentage)}`}
              style={{ width: `${Math.min(indexedData.fillPercentage, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Creator Prediction Section */}
              <div className="mb-3 p-3 glass-card bg-gradient-to-br from-gray-800/40 to-gray-900/40 rounded-lg border border-gray-600/30 flex-shrink-0 backdrop-blur-md shadow-lg">
        <div className="mb-2">
          <div className="text-xs text-warning mb-1 flex items-center gap-1">
            <BoltIcon className="w-3 h-3" />
            Creator believes this WON&apos;T happen
          </div>
          <div className="text-xs text-text-muted">
            Challenging users who think it WILL happen
          </div>
        </div>
        
        {/* Betting Options */}
        <div className="flex items-center justify-between">
          <div className="text-center">
            <div className="text-xs text-gray-400">Odds</div>
            <div className={`text-lg font-bold ${theme.accent}`}>
              {pool.odds.toFixed(2)}x
            </div>
          </div>
          
          {/* Challenging Option */}
          <div className="text-center">
            <div className="text-xs text-gray-400">Challenge</div>
            <div className="px-3 py-1 rounded text-xs font-medium bg-success/20 border border-success/30 text-success">
              YES
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats with Indexed Data */}
      <div className="grid grid-cols-3 gap-3 mb-3 text-center flex-shrink-0">
        <div>
          <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
            <CurrencyDollarIcon className="w-3 h-3" />
            Creator Stake
          </div>
          <div className="text-sm font-bold text-white">{formatStake(pool.creatorStake)} {pool.usesBitr ? 'BITR' : 'MON'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
            <UserIcon className="w-3 h-3" />
            {indexedData ? 'Participants' : 'Total Stake'}
          </div>
          <div className="text-sm font-bold text-white">
            {indexedData ? indexedData.participantCount : formatStake(pool.totalBettorStake)} {indexedData ? '' : pool.usesBitr ? 'BITR' : 'MON'}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
            <ClockIcon className="w-3 h-3" />
            Time Left
          </div>
          <div className="text-sm font-bold text-white">{formatTimeLeft(pool.bettingEndTime)}</div>
        </div>
      </div>

      {/* Additional Indexed Data */}
      {indexedData && (
        <div className="grid grid-cols-2 gap-2 mb-3 text-center flex-shrink-0">
          <div>
            <div className="text-xs text-gray-400">Avg Bet</div>
            <div className="text-xs font-bold text-white">{formatStake(indexedData.avgBetSize)} {pool.usesBitr ? 'BITR' : 'MON'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Total Bets</div>
            <div className="text-xs font-bold text-white">{indexedData.betCount}</div>
          </div>
        </div>
      )}
      
      {/* Social Stats - pushed to bottom */}
      {showSocialStats && pool.socialStats && (
        <div className="flex items-center justify-between pt-3 border-t border-gray-700/20 mt-auto">
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
    </motion.div>
  );
} 
"use client";

import { useAccount } from "wagmi";
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  MessageSquare,
  User,
  Wallet,
  Scale,
  Trophy,
  Send,
  MessageCircle,
  BarChart3,
  Check,
  Zap,
  ThumbsUp,
  ThumbsDown,
  Info,
  Clock,
  Shield,
  Activity,
  Globe
} from "lucide-react";
import { Pool, Comment } from "@/lib/types";
import { usePools } from "@/hooks/usePools";
import { useBITRToken } from "@/hooks/useBITRToken";
import { TransactionFeedback } from "@/components/TransactionFeedback";
import { optimizedPoolService } from "@/services/optimizedPoolService";
import { frontendCache } from "@/services/frontendCache";
import { toast } from "@/utils/toast";
import { PoolExplanationService, PoolExplanation } from "@/services/poolExplanationService";
import PoolTitleRow from "@/components/PoolTitleRow";
import CryptoTitleRow from "@/components/CryptoTitleRow";
import PoolStatusBanner from "@/components/PoolStatusBanner";
import BetDisplay from "@/components/BetDisplay";
import SettlementResults from "@/components/SettlementResults";
import MatchCenter from "@/components/MatchCenter";
import ClaimRewards from "@/components/ClaimRewards";
import { CONTRACT_ADDRESSES } from "@/contracts";
import SkeletonLoader from "@/components/SkeletonLoader";
import UserAddressLink from "@/components/UserAddressLink";
import { usePoolProgress } from "@/hooks/useSomniaStreams";
import BoostPoolModal from "@/components/BoostPoolModal";
import { motion, AnimatePresence } from "framer-motion";

interface ApiComment {
  id: number;
  content: string;
  user_address?: string;
  reputation?: number;
  user_badge?: string;
  created_at?: string;
  likes_count?: number;
  dislikes_count?: number;
  sentiment?: string;
  confidence?: number;
}

export default function BetPage() {
  const { address } = useAccount();
  const params = useParams();
  const poolId = params.id as string;
  const { placeBet, addLiquidity } = usePools();
  const { approve, isConfirmed: isApproveConfirmed } = useBITRToken();

  // Helper function to check if BITR approval is needed
  const needsApproval = (): boolean => {
    return false; // Simplified - no approval needed
  };

  const [activeTab, setActiveTab] = useState<"bet" | "liquidity" | "analysis" | "settlement">("bet");
  const [betAmount, setBetAmount] = useState<number>(0);
  const [hasUserBet, setHasUserBet] = useState(false);
  const [userBetAmount, setUserBetAmount] = useState(0);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [comment, setComment] = useState("");
  const [commentSentiment, setCommentSentiment] = useState<'bullish' | 'bearish' | 'neutral'>('neutral');
  const [commentConfidence, setCommentConfidence] = useState(75);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [submittingComment, setSubmittingComment] = useState(false);

  const [loading, setLoading] = useState(true);
  const [pool, setPool] = useState<Pool | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [betType, setBetType] = useState<'yes' | 'no' | null>(null);
  const [poolExplanation, setPoolExplanation] = useState<PoolExplanation | null>(null);

  // Pool state checks for betting
  const [isPoolFilled, setIsPoolFilled] = useState(false);
  const [canBet, setCanBet] = useState(true);
  const [contractData, setContractData] = useState<{
    flags: number;
    eventStartTime: number;
    eventEndTime: number;
    bettingEndTime: number;
    arbitrationDeadline: number;
    result: string;
    resultTimestamp: number;
    oracleType: number;
    marketId: string;
  } | null>(null);
  const [poolStatusType, setPoolStatusType] = useState<'creator_won' | 'bettor_won' | 'settled' | 'active' | 'refunded' | null>(null);
  const [isRefunded, setIsRefunded] = useState<boolean>(false); // ✅ Store isRefunded flag
  const [poolApiData, setPoolApiData] = useState<{
    totalBettorStake?: string;
    betCount?: number;
    totalBets?: number;
  } | null>(null); // ✅ Store pool API data for PoolStatusBanner

  // Backend formatted data to avoid scientific notation
  const [creatorStakeFormatted, setCreatorStakeFormatted] = useState<number>(0);
  const [totalBettorStakeFormatted, setTotalBettorStakeFormatted] = useState<number>(0);
  const [potentialWinFormatted, setPotentialWinFormatted] = useState<number>(0);
  const [maxPoolSizeFormatted, setMaxPoolSizeFormatted] = useState<number>(0);
  const [fillPercentage, setFillPercentage] = useState<number>(0);

  // Pool statistics
  const [defeatedCount, setDefeatedCount] = useState<number>(0);
  const [challengersCount, setChallegersCount] = useState<number>(0);
  const [totalBetsCount, setTotalBetsCount] = useState<number>(0);
  const [totalLiquidityFormatted, setTotalLiquidityFormatted] = useState<number>(0);
  const [totalVolumeFormatted, setTotalVolumeFormatted] = useState<number>(0);

  // Rate limiting for API calls
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const FETCH_COOLDOWN = 5000; // 5 seconds between fetches

  // Boost modal state
  const [showBoostModal, setShowBoostModal] = useState(false);




  // ✅ FIX: Add function to fetch comments - includes author address for creator check
  const fetchComments = useCallback(async () => {
    if (!poolId) return;

    try {
      const response = await fetch(`/api/social/pools/${poolId}/comments`, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Transform API comments to Comment type
          const transformedComments: Comment[] = data.data.map((c: ApiComment) => ({
            id: c.id.toString(),
            content: c.content || '',
            author: {
              username: c.user_address?.slice(0, 6) + '...' + c.user_address?.slice(-4) || 'Anonymous',
              address: c.user_address || '', // ✅ FIX: Include address for creator check
              avatar: '/logo.png',
              reputation: c.reputation || 0,
              badges: c.user_badge ? [c.user_badge] : []
            },
            likes: c.likes_count || 0,
            dislikes: 0,
            replies: [],
            isVerifiedBetter: hasUserBet, // Could check user's bet status
            hasUserLiked: false, // Would need to check if user liked this comment
            hasUserDisliked: false,
            sentiment: c.sentiment || 'neutral',
            confidence: c.confidence || 75,
            createdAt: c.created_at || new Date().toISOString()
          }));
          setComments(transformedComments);
        }
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  }, [poolId, hasUserBet]);

  // Track view when page loads
  useEffect(() => {
    if (poolId) {
      // Track view
      fetch(`/api/social/pools/${poolId}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress: address || null })
      }).catch(err => console.warn('Failed to track view:', err));
    }
  }, [poolId, address]);

  const fetchPoolData = useCallback(async () => {
    // Rate limiting check
    const now = Date.now();
    if (now - lastFetchTime < FETCH_COOLDOWN) {
      return;
    }
    setLastFetchTime(now);

    try {
      setLoading(true);

      // Fetch pool data from optimized backend API with caching

      const poolCacheKey = frontendCache.getPoolKey('details', parseInt(poolId));
      const poolData = await frontendCache.get(
        poolCacheKey,
        () => optimizedPoolService.getPool(parseInt(poolId))
      );

      if (!poolData) {
        throw new Error(`Pool ${poolId} not found`);
      }



      // Generate pool explanation using the service
      const explanationData = {
        id: poolId,
        homeTeam: poolData.homeTeam || '',
        awayTeam: poolData.awayTeam || '',
        league: poolData.league || '',
        category: poolData.category,
        region: poolData.region || '',
        predictedOutcome: poolData.predictedOutcome || '',
        odds: poolData.odds,
        marketType: poolData.marketType || 0, // Use actual marketType from API
        eventStartTime: poolData.eventStartTime,
        eventEndTime: poolData.eventEndTime,
        usesBitr: poolData.currency === 'BITR',
        creatorStake: poolData.creatorStake
      };

      const explanation = PoolExplanationService.generateExplanation(explanationData);
      setPoolExplanation(explanation);

      // Use API data with proper formatting
      const creatorStakeNum = parseFloat(poolData.creatorStake);
      const totalBettorStakeNum = parseFloat(poolData.totalBettorStake);
      const maxPoolSizeNum = parseFloat(poolData.maxPoolSize);
      const fillPercentageNum = poolData.fillPercentage || 0;
      // Calculate creator potential win: creatorStake / (odds - 1) + creatorStake
      // Convert odds from basis points to decimal (140 -> 1.4)
      const decimalOdds = poolData.odds / 100;
      const potentialWinNum = (creatorStakeNum / (decimalOdds - 1)) + creatorStakeNum;

      // Set state variables
      setCreatorStakeFormatted(creatorStakeNum);
      setTotalBettorStakeFormatted(totalBettorStakeNum);
      setPotentialWinFormatted(potentialWinNum);
      setFillPercentage(fillPercentageNum);
      setMaxPoolSizeFormatted(maxPoolSizeNum);

      const getDifficultyTier = (odds: number) => {
        // Convert basis points to decimal odds (150 -> 1.50)
        const decimalOdds = odds / 100;
        if (decimalOdds >= 5.0) return "legendary";
        if (decimalOdds >= 3.0) return "very_hard";
        if (decimalOdds >= 2.0) return "hard";
        if (decimalOdds >= 1.5) return "medium";
        return "easy";
      };

      // Use explanation service for standardized content
      const title = explanation.title;
      const description = explanation.description;

      const transformedPool: Pool = {
        id: poolId,
        title: title,
        description: description,
        category: poolData.category || "sports",
        homeTeam: poolData.homeTeam || '',
        awayTeam: poolData.awayTeam || '',
        creatorAddress: poolData.creator.address, // ✅ FIX: Store creator address for creator check in comments
        creator: {
          address: poolData.creator.address,
          username: poolData.creator.username,
          avatar: "/logo.png",
          reputation: 0,
          totalPools: poolData.creator.totalPools || 0,
          successRate: poolData.creator.successRate || 0,
          challengeScore: Math.round((poolData.odds / 100) * 20), // Convert basis points to decimal first
          totalVolume: typeof poolData.creator.totalVolume === 'string'
            ? parseFloat(poolData.creator.totalVolume) / 1e18  // Convert from Wei to ETH/BITR
            : (poolData.creator.totalVolume || 0) / 1e18,
          badges: poolData.creator.badges || [],
          createdAt: new Date().toISOString(),
          bio: ""
        },
        challengeScore: Math.round((poolData.odds / 100) * 20), // Convert basis points to decimal first
        qualityScore: 0,
        difficultyTier: getDifficultyTier(poolData.odds),
        predictedOutcome: poolData.predictedOutcome || '',
        creatorPrediction: "no",
        odds: poolData.odds,
        participants: poolData.participants || 0,
        volume: totalBettorStakeNum,
        image: poolData.category === "football" ? "⚽" : poolData.category === "basketball" ? "🏀" : "🎯",
        cardTheme: poolData.category === "football" ? "green" : poolData.category === "basketball" ? "orange" : "purple",
        tags: [poolData.category, poolData.league || '', poolData.region || ''].filter(Boolean),
        trending: poolData.trending || false,
        boosted: poolData.boostTier !== 'NONE',
        boostTier: poolData.boostTier === 'GOLD' ? 3 : poolData.boostTier === 'SILVER' ? 2 : poolData.boostTier === 'BRONZE' ? 1 : 0,
        socialStats: poolData.socialStats || { likes: 0, comments: 0, shares: 0, views: 0 },
        defeated: poolData.defeated || 0,
        currency: poolData.currency || 'STT',
        endDate: new Date(poolData.eventEndTime * 1000).toISOString().split('T')[0],
        poolType: "single",
        comments: [],
        marketId: poolData.marketId || '',
        fixtureId: poolData.fixtureId || '',
        eventDetails: {
          league: poolData.league || '',
          region: poolData.region || '',
          venue: "TBD",
          startTime: new Date(poolData.eventStartTime * 1000),
          endTime: new Date(poolData.eventEndTime * 1000)
        }
      };

      setPool(transformedPool);

      // ✅ CRITICAL: Use verified API data directly (API verifies against contract for settled pools)
      // This ensures EnhancedPoolCard and Bet Page always see the same status
      const isSettled = poolData.isSettled || poolData.status === 'settled';
      const refundedFlag = (poolData as { isRefunded?: boolean }).isRefunded || false; // ✅ CRITICAL: Check API's isRefunded flag
      const creatorSideWon = poolData.creatorSideWon; // Already verified against contract in API

      // ✅ Store in state for use in PoolStatusBanner
      setIsRefunded(refundedFlag);
      setPoolApiData({
        totalBettorStake: poolData.totalBettorStake,
        betCount: (poolData as { betCount?: number; totalBets?: number }).betCount,
        totalBets: (poolData as { betCount?: number; totalBets?: number }).totalBets
      });

      // Set contract data for status banner using verified API data
      const flags =
        (isSettled ? 1 : 0) |  // Bit 0: settled
        (creatorSideWon === true ? 2 : 0); // Bit 1: creatorSideWon

      console.log('🔍 Pool Status DEBUG:', {
        poolId: poolData.id,
        status: poolData.status,
        isSettled,
        isRefunded: refundedFlag, // ✅ Added refund check
        creatorSideWon: creatorSideWon, // Verified against contract
        totalBettorStake: poolData.totalBettorStake, // ✅ Added for debugging
        betCount: (poolData as { betCount?: number; totalBets?: number }).betCount || (poolData as { betCount?: number; totalBets?: number }).totalBets, // ✅ Added for debugging
        source: 'API (verified against contract)',
        flagsCalculation: {
          settled: (isSettled ? 1 : 0),
          creatorSideWon: (creatorSideWon === true ? 2 : 0),
          combinedFlags: flags,
          flagBits: {
            bit0_settled: (flags & 1) !== 0,
            bit1_creatorSideWon: (flags & 2) !== 0
          }
        }
      });

      setContractData({
        flags,
        eventStartTime: poolData.eventStartTime,
        eventEndTime: poolData.eventEndTime,
        bettingEndTime: poolData.bettingEndTime,
        arbitrationDeadline: poolData.eventEndTime + (24 * 60 * 60),
        result: '',
        resultTimestamp: 0,
        oracleType: 0,
        marketId: poolData.marketId || ''
      });

      // ✅ CRITICAL FIX: Determine pool status type using verified API data (source of truth)
      // Check for refund FIRST (before checking winner)
      const settled = isSettled; // Use verified API data

      if (settled) {
        // ✅ CRITICAL: Check if pool is refunded FIRST
        // Pools with bets are NEVER refunded (backend ensures this)
        if (refundedFlag) {
          setPoolStatusType('refunded'); // Mark as refunded
        } else if (creatorSideWon) {
          setPoolStatusType('creator_won');
        } else {
          setPoolStatusType('bettor_won');
        }
      } else {
        // Check if pool should be considered settled based on timing
        const nowTime = Date.now();
        const eventEndTime = poolData.eventEndTime * 1000;

        if (nowTime > eventEndTime && poolData.status === 'settled') {
          setPoolStatusType('settled'); // Awaiting settlement
        } else {
          setPoolStatusType('active');
        }
      }

      // Check pool state for betting eligibility
      const nowTime = Date.now();
      const eventStartTime = poolData.eventStartTime * 1000;
      const eventEndTime = poolData.eventEndTime * 1000;
      const bettingEndTime = poolData.bettingEndTime * 1000;

      // Check if event has started
      const eventStarted = poolData.isEventStarted || nowTime >= eventStartTime;

      // ✅ FIX: Check if pool is filled (99% or more) - lock YES bets at 99%
      const poolFilled = poolData.isPoolFilled || poolData.fillPercentage >= 99;
      setIsPoolFilled(poolFilled);

      // Check if betting is still allowed
      // YES bets (Challenge Creator) are disabled when pool is 100% filled
      // NO bets (Support Creator/Liquidity) are always allowed until event starts
      const bettingAllowed = poolData.canBet ?? (nowTime < bettingEndTime && !eventStarted);
      setCanBet(bettingAllowed);


      // Calculate time left using real event end time
      const timeRemaining = Math.max(0, eventEndTime - nowTime);

      if (timeRemaining > 0) {
        const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      }

      // Calculate pool statistics
      // Defeated: If pool is settled and bettor side won, count defeated as creators/LPs
      const defeated = (poolData.status === 'settled' && poolData.defeated === 1)
        ? Math.max(1, Math.ceil((creatorStakeNum + (poolData.liquidityProviders?.reduce((sum, lp) => sum + parseFloat(lp.stake), 0) || 0)) / 1500))
        : 0;
      setDefeatedCount(defeated);

      // Challengers: Use actual participants count from backend
      const challengers = poolData.participants || 0;
      setChallegersCount(challengers);

      // Total Bets: Use from backend if available, otherwise estimate
      const totalBets = poolData.totalBets || Math.max(1, Math.ceil(totalBettorStakeNum / 1500));
      setTotalBetsCount(totalBets);

      // Total Liquidity: Creator stake + all LP stakes
      const totalLPStake = poolData.liquidityProviders?.reduce((sum, lp) => sum + parseFloat(lp.stake), 0) || 0;
      const totalLiquidity = creatorStakeNum + totalLPStake;
      setTotalLiquidityFormatted(totalLiquidity);

      // Total Volume: Total bettor stake
      setTotalVolumeFormatted(totalBettorStakeNum);

    } catch (error) {
      console.error('Error fetching pool data from API:', error);
      console.error('Pool not found or failed to load:', poolId);
    } finally {
      setLoading(false);
    }
  }, [poolId, lastFetchTime]);
  // eslint-disable-next-line react-hooks/exhaustive-deps

  const checkUserBetStatus = useCallback(async () => {
    if (!address) return;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`/api/pools/${poolId}/user-bet?address=${address}`, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data.hasBet) {
        setHasUserBet(true);
        // ✅ FIX: Convert betAmount from wei to readable format (divide by 1e18 if it's in wei)
        const betAmount = data.data.betAmount;
        // Check if betAmount is in wei format (very large number > 1e15)
        const formattedAmount = betAmount > 1e15 ? betAmount / 1e18 : betAmount;
        setUserBetAmount(formattedAmount);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('User bet status check timed out');
      } else {
        console.error('Error checking bet status:', error);
      }
    }
  }, [poolId, address]);

  // ✅ CRITICAL: Subscribe to real-time pool progress updates (LP added, bets placed)
  usePoolProgress(poolId, (progressData) => {
    console.log(`🔄 Bet page: Received progress update for pool ${poolId}:`, progressData);
    // Update fill percentage dynamically
    if (progressData.fillPercentage !== undefined && !isNaN(progressData.fillPercentage)) {
      setFillPercentage(progressData.fillPercentage);
      console.log(`   ✅ Updated fill percentage: ${progressData.fillPercentage}%`);
    }
    // Update max pool size dynamically
    if (progressData.maxPoolSize) {
      const maxPoolSizeNum = parseFloat(progressData.maxPoolSize);
      if (!isNaN(maxPoolSizeNum)) {
        setMaxPoolSizeFormatted(maxPoolSizeNum);
        console.log(`   ✅ Updated max pool size: ${maxPoolSizeNum}`);
      }
    }
    // Update total bettor stake dynamically
    if (progressData.totalBettorStake) {
      const totalBettorStakeNum = parseFloat(progressData.totalBettorStake);
      if (!isNaN(totalBettorStakeNum)) {
        setTotalBettorStakeFormatted(totalBettorStakeNum);
        console.log(`   ✅ Updated total bettor stake: ${totalBettorStakeNum}`);
      }
    }
    // Update max bettor stake dynamically (for bet validation)
    if (progressData.currentMaxBettorStake && pool) {
      const maxBettorStakeNum = typeof progressData.currentMaxBettorStake === 'string'
        ? parseFloat(progressData.currentMaxBettorStake)
        : (progressData.currentMaxBettorStake || 0);
      if (!isNaN(maxBettorStakeNum)) {
        // Update pool object with new max bettor stake
        setPool(prev => prev ? {
          ...prev,
          maxBettorStake: maxBettorStakeNum,
          totalBettorStake: progressData.totalBettorStake || prev.totalBettorStake,
          totalCreatorSideStake: progressData.totalCreatorSideStake || prev.totalCreatorSideStake
        } : null);
        console.log(`   ✅ Updated max bettor stake: ${maxBettorStakeNum}`);
      }
    }
  });

  useEffect(() => {
    fetchPoolData();
    checkUserBetStatus();
    fetchComments(); // ✅ FIX: Fetch comments when pool loads
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolId]); // Only run when poolId changes


  // State to track if we're waiting for approval to complete
  const [waitingForApproval, setWaitingForApproval] = useState(false);
  const [pendingBetData, setPendingBetData] = useState<{ amount: number, type: 'yes' | 'no' } | null>(null);

  // Handle BITR approval confirmation and proceed with bet
  useEffect(() => {
    if (isApproveConfirmed && waitingForApproval && pendingBetData && address) {
      const proceedWithBet = async () => {
        try {
          toast.loading('Placing bet...', { id: 'bet-tx' });
          const useBitr = pool?.currency === 'BITR';

          if (pendingBetData.type === 'yes') {
            // Challenge creator - use placeBet
            await placeBet(parseInt(poolId), pendingBetData.amount.toString(), useBitr);
          } else if (pendingBetData.type === 'no') {
            // Support creator - use addLiquidity
            await addLiquidity(parseInt(poolId), pendingBetData.amount.toString(), useBitr);
          }
          toast.success('Bet placed successfully!', { id: 'bet-tx' });

          // Clear pending state
          setWaitingForApproval(false);
          setPendingBetData(null);

          // Refresh pool data after a longer delay to respect rate limiting
          setTimeout(() => {
            setLastFetchTime(0); // Reset rate limit for manual refresh
            fetchPoolData();
            checkUserBetStatus();
          }, 6000);
        } catch (error) {
          console.error('Error placing bet after approval:', error);
          toast.error('Failed to place bet after approval. Please try again.', { id: 'bet-tx' });
          setWaitingForApproval(false);
          setPendingBetData(null);
        }
      };

      proceedWithBet();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApproveConfirmed, waitingForApproval, pendingBetData, address, poolId, placeBet, pool?.currency]); // Exclude functions to prevent loops

  // ✅ FIX: Countdown timer that shows timeframe after event starts
  useEffect(() => {
    if (pool && pool.eventDetails) {
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const start = pool.eventDetails!.startTime.getTime();
        const end = pool.eventDetails!.endTime?.getTime() || null;

        // ✅ FIX: If event has started, countdown to event end (timeframe)
        // If event hasn't started, countdown to event start
        if (now >= start && end) {
          // Event started - countdown to event end (timeframe remaining)
          const distance = end - now;
          if (distance > 0) {
            setTimeLeft({
              days: Math.floor(distance / (1000 * 60 * 60 * 24)),
              hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
              minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
              seconds: Math.floor((distance % (1000 * 60)) / 1000)
            });
          } else {
            // Event ended
            setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
          }
        } else if (now < start) {
          // Event not started - countdown to event start
          const distance = start - now;
          setTimeLeft({
            days: Math.floor(distance / (1000 * 60 * 60 * 24)),
            hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((distance % (1000 * 60)) / 1000)
          });
        } else {
          // Event ended but no end time available
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [pool]);

  const handleAddComment = async () => {
    if (!address) {
      toast.error('Please connect your wallet to post comments');
      return;
    }
    if (!comment.trim() || submittingComment) return; // ✅ FIX: Removed hasUserBet check - allow all users (including creators) to comment

    setSubmittingComment(true);

    try {
      // ✅ FIX: Use correct API endpoint /api/social/pools instead of /api/pools
      const response = await fetch(`/api/social/pools/${poolId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: address, // ✅ FIX: API expects userAddress (not user_address)
          content: comment,
          sentiment: commentSentiment,
          // Note: API doesn't accept confidence field, but we keep it for future use
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Comment posted successfully!');
        setComment("");
        setCommentSentiment('neutral');
        setCommentConfidence(75);
        setShowCommentBox(false);
        fetchComments(); // ✅ FIX: Refresh comments after posting
      } else {
        toast.error(data.error || 'Failed to post comment');
      }
    } catch (error: unknown) {
      console.error('Error adding comment:', error);
      toast.error('Failed to post comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!address) {
      toast.error('Please connect your wallet to like comments');
      return;
    }

    try {
      // ✅ FIX: Use correct API endpoint /api/social/pools instead of /api/pools
      const response = await fetch(`/api/social/pools/${poolId}/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userAddress: address })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('Comment liked!');
        }
        fetchComments(); // ✅ FIX: Refresh comments after liking
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to like comment');
      }
    } catch (error: unknown) {
      console.error('Error liking comment:', error);
      toast.error('Failed to like comment. Please try again.');
    }
  };

  const handlePlaceBet = async () => {
    if (!betType || betAmount <= 0 || !address) return;

    // ✅ FIX: Calculate and validate remaining capacity correctly
    // Get maxBettorStake (max bettor stake, NOT total pool size)
    let maxBettorStake = parseFloat(pool?.maxBettorStake?.toString() || "0");
    if (maxBettorStake > 1e15) maxBettorStake = maxBettorStake / 1e18;

    // ✅ FALLBACK: If maxBettorStake is 0 or invalid, calculate it
    if (!maxBettorStake || maxBettorStake === 0) {
      // Use creatorStakeFormatted which is already in token format
      const effectiveCreatorSideStake = creatorStakeFormatted || 0;
      const odds = pool?.odds || 130;
      const denominator = odds - 100;
      if (denominator > 0 && effectiveCreatorSideStake > 0) {
        maxBettorStake = (effectiveCreatorSideStake * 100) / denominator;
      }
    }

    // Get total bettor stake (use formatted value which is already in token format)
    const totalBettorStake = totalBettorStakeFormatted || 0;

    // Calculate remaining = maxBettorStake - totalBettorStake
    const remaining = Math.max(0, maxBettorStake - totalBettorStake);

    console.log('🔍 Bet page remaining capacity:', {
      maxBettorStake,
      totalBettorStake,
      remaining,
      poolMaxBettorStake: pool?.maxBettorStake,
      poolOdds: pool?.odds
    });

    if (betAmount > remaining) {
      toast.error(`Bet amount exceeds remaining capacity of ${remaining.toFixed(2)} ${pool?.currency || 'STT'}`, { id: 'bet-tx' });
      return;
    }

    try {

      // Show loading toast
      toast.loading('Preparing transaction...', { id: 'bet-tx' });

      // Check if this is a BITR pool and if approval is needed
      if (pool && pool.currency === 'BITR' && needsApproval()) {

        // Store bet data for after approval
        setPendingBetData({ amount: betAmount, type: betType });
        setWaitingForApproval(true);

        toast.loading('Approving BITR tokens...', { id: 'bet-tx' });
        await approve(CONTRACT_ADDRESSES.POOL_CORE as `0x${string}`, betAmount.toString());

        // The useEffect will handle the bet placement after approval
        toast.loading('Waiting for approval confirmation...', { id: 'bet-tx' });
        return;
      }

      // For STT pools or if no approval needed, place bet or add liquidity based on bet type
      const useBitr = pool?.currency === 'BITR';

      if (betType === 'yes') {
        // Challenge creator - use placeBet
        await placeBet(parseInt(poolId), betAmount.toString(), useBitr);
      } else if (betType === 'no') {
        // Support creator - use addLiquidity
        await addLiquidity(parseInt(poolId), betAmount.toString(), useBitr);
      }

      // Success toast is handled by placeBet function
      // Refresh pool data after a delay to allow for blockchain confirmation
      setTimeout(() => {
        setLastFetchTime(0); // Reset rate limit for manual refresh
        fetchPoolData();
        checkUserBetStatus();
      }, 6000);

    } catch (error: unknown) {
      console.error('Error placing bet:', error);
      toast.error('Failed to place bet. Please try again.', { id: 'bet-tx' });
      // Clear pending state on error
      setWaitingForApproval(false);
      setPendingBetData(null);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-somnia-cyan';
      case 'bearish': return 'text-somnia-magenta';
      default: return 'text-somnia-blue';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return <TrendingUp className="w-4 h-4" />;
      case 'bearish': return <TrendingUp className="w-4 h-4 rotate-180" />;
      default: return <Scale className="w-4 h-4" />;
    }
  };

  const getDifficultyColor = (tier: string) => {
    switch (tier) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-somnia-blue';
      case 'hard': return 'text-somnia-violet';
      case 'very_hard': return 'text-somnia-magenta';
      case 'legendary': return 'text-amber-400';
      default: return 'text-white/60';
    }
  };

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'legendary': return 'bg-amber-400 text-black';
      case 'crypto_expert': return 'bg-somnia-cyan text-black';
      case 'whale': return 'bg-somnia-violet text-white';
      case 'sports_expert': return 'bg-somnia-blue text-white';
      default: return 'bg-white/10 text-white/60';
    }
  };

  const getBoostGlow = (tier?: number) => {
    if (!tier) return '';
    switch (tier) {
      case 1: return 'shadow-lg shadow-somnia-blue/20';
      case 2: return 'shadow-xl shadow-somnia-violet/30';
      case 3: return 'shadow-2xl shadow-somnia-cyan/40';
      default: return '';
    }
  };

  const renderComment = (comment: Comment): React.JSX.Element => {
    const isCreator = pool?.creatorAddress && comment.author.address?.toLowerCase() === pool.creatorAddress.toLowerCase();

    return (
      <motion.div
        key={comment.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 border-white/5 hover:border-somnia-cyan/30 transition-all group"
      >
        <div className="flex items-start gap-5">
          <div className="relative">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border ${isCreator ? 'border-somnia-magenta/40' : 'border-white/10'}`}>
              <span className="text-sm font-black text-white">{(comment.author.username || comment.author.address?.slice(0, 2) || 'U').toUpperCase()}</span>
            </div>
            {isCreator && (
              <div className="absolute -bottom-1 -right-1 bg-somnia-magenta p-1 rounded-md">
                <Shield className="w-2 h-2 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <UserAddressLink
                  address={comment.author.address || ''}
                  className={`text-sm font-black uppercase tracking-tight ${isCreator ? 'text-somnia-magenta' : 'text-white'}`}
                />
                {isCreator && (
                  <span className="text-[10px] font-black uppercase text-somnia-magenta/60 border border-somnia-magenta/20 px-1.5 py-0.5 rounded">Creator</span>
                )}
              </div>

              <div className="flex gap-1.5">
                {comment.author.badges?.map((badge, idx) => (
                  <span key={idx} className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${getBadgeColor(badge)}`}>
                    {badge.replace('_', ' ')}
                  </span>
                ))}
                {comment.isVerifiedBetter && (
                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/20">Verified</span>
                )}
              </div>

              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-text-muted/60 ml-auto">
                {comment.sentiment && (
                  <div className={`flex items-center gap-1.5 ${getSentimentColor(comment.sentiment)}`}>
                    {getSentimentIcon(comment.sentiment)}
                    <span>{comment.sentiment}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(comment.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-text-muted leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">
              {comment.content}
            </p>

            <div className="flex items-center gap-6 pt-4 border-t border-white/5">
              <button
                onClick={() => handleLikeComment(comment.id.toString())}
                className={`flex items-center gap-2 text-xs font-black uppercase transition-colors ${comment.hasUserLiked ? 'text-somnia-cyan' : 'text-text-muted hover:text-white'}`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>{comment.likes || 0}</span>
              </button>

              <button className="flex items-center gap-2 text-xs font-black uppercase text-text-muted hover:text-somnia-magenta transition-colors">
                <ThumbsDown className="w-3.5 h-3.5" />
                <span>{comment.dislikes || 0}</span>
              </button>

              <button className="flex items-center gap-2 text-xs font-black uppercase text-text-muted hover:text-somnia-blue transition-colors">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Reply</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0A0A1A] flex items-center justify-center p-4">
      <div className="max-w-7xl mx-auto w-full">
        <SkeletonLoader type="bet-page" />
      </div>
    </div>
  );

  if (!pool) return (
    <div className="min-h-screen bg-[#0A0A1A] flex items-center justify-center text-center p-6">
      <div className="glass-card p-10 max-w-md w-full border-somnia-magenta/20 backdrop-blur-3xl">
        <div className="w-20 h-20 bg-somnia-magenta/10 rounded-[32px] flex items-center justify-center mx-auto mb-6 border border-somnia-magenta/20">
          <Globe className="w-10 h-10 text-somnia-magenta animate-pulse" />
        </div>
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Signal Lost</h2>
        <p className="text-xs text-text-muted mb-10 leading-relaxed uppercase tracking-widest font-black"> The requested prediction node does not exist or has been decommissioned from the global nexus. </p>
        <button onClick={() => window.history.back()} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/10 transition-all hover:scale-105 active:scale-95">Return to Neural Hub</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A1A] text-white selection:bg-somnia-cyan/30">
      <TransactionFeedback status={null} onClose={() => { }} />

      {pool.category === 'football' && (pool.fixtureId || pool.marketId) && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container mx-auto px-4 py-8"
        >
          <div className="glass-card border-somnia-blue/20 overflow-hidden relative shadow-2xl shadow-somnia-blue/10">
            <div className="absolute top-0 left-0 w-1 h-full bg-somnia-blue" />
            <MatchCenter fixtureId={pool.fixtureId} marketId={pool.marketId} className="w-full" />
          </div>
        </motion.div>
      )}

      <div className="container mx-auto px-4 py-8 space-y-12">
        {/* Header Section */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative">
          <div className="glass-card border-white/5 space-y-10 relative overflow-hidden p-8 lg:p-12">
            <div className="absolute -top-48 -right-48 w-96 h-96 bg-somnia-cyan/10 blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-48 -left-48 w-96 h-96 bg-somnia-magenta/10 blur-[150px] rounded-full pointer-events-none" />

            <div className="absolute top-8 right-8 z-10 flex items-center gap-3">
              {pool.boosted && (
                <div className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] flex items-center gap-2 border ${pool.boostTier === 3 ? 'bg-somnia-cyan/10 border-somnia-cyan/30 text-somnia-cyan' :
                  pool.boostTier === 2 ? 'bg-somnia-violet/10 border-somnia-violet/30 text-somnia-violet' :
                    'bg-somnia-magenta/10 border-somnia-magenta/30 text-somnia-magenta'
                  } ${getBoostGlow(pool.boostTier)}`}>
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  {pool.boostTier === 3 ? 'Platinum Priority' : pool.boostTier === 2 ? 'Gold Priority' : 'Silver Priority'}
                </div>
              )}

              {address && pool.creator.address?.toLowerCase() === address.toLowerCase() &&
                contractData?.eventStartTime && Date.now() / 1000 < contractData.eventStartTime &&
                pool.boostTier !== 3 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowBoostModal(true)}
                    className="px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] bg-white text-black hover:bg-somnia-cyan transition-colors shadow-xl"
                  >
                    Enhance Node
                  </motion.button>
                )}
            </div>

            <div className="flex flex-col lg:flex-row gap-10 items-start justify-between relative z-10">
              <div className="flex items-center gap-8">
                <div className="relative group">
                  <div className="w-24 h-24 bg-white/5 rounded-[40px] flex items-center justify-center border border-white/10 group-hover:border-somnia-cyan/50 transition-all duration-700 overflow-hidden">
                    <User className="w-12 h-12 text-white/30 group-hover:text-somnia-cyan transition-colors" />
                    <div className="absolute inset-0 bg-gradient-to-t from-somnia-cyan/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 p-2.5 bg-[#0A0A1A] border border-white/10 rounded-2xl shadow-xl">
                    <Activity className="w-4 h-4 text-somnia-cyan" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <h3 className="text-3xl font-black text-white uppercase tracking-tight">{pool.creator.username}</h3>
                    <div className="flex gap-2">
                      {pool.creator.badges.slice(0, 2).map((badge: string, idx: number) => (
                        <span key={idx} className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${getBadgeColor(badge)}`}>
                          {badge.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-8 text-[11px] font-black uppercase tracking-[0.2em] text-text-muted/60">
                    <div className="flex items-center gap-2.5">
                      <Trophy className="w-3.5 h-3.5 text-somnia-cyan" />
                      <span>{pool.creator.successRate.toFixed(1)}% Ratio</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Globe className="w-3.5 h-3.5 text-somnia-blue" />
                      <span>{pool.creator.totalPools} Sectors</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Activity className="w-3.5 h-3.5 text-somnia-violet" />
                      <span>{pool.creator.totalVolume.toFixed(0)} Vol</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl text-center min-w-[180px] shadow-inner">
                <div className="text-[11px] font-black text-text-muted uppercase tracking-widest mb-2">Complexity Rating</div>
                <div className={`text-5xl font-black ${getDifficultyColor(pool.difficultyTier)}`}>
                  {pool.challengeScore}
                </div>
                <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mt-2">{pool.difficultyTier.replace('_', ' ')}</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-8 pt-8 border-t border-white/5 relative z-10">
              <button onClick={() => document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' })} className="flex items-center gap-3 group transition-all">
                <MessageSquare className="w-5 h-5 text-somnia-blue group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-black text-text-muted group-hover:text-white uppercase tracking-widest">{pool.socialStats.comments} Pulses</span>
              </button>
              <button onClick={async () => {
                if (!address) return toast.error('Authority required');
                const res = await fetch(`/api/social/pools/${poolId}/like`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userAddress: address }) });
                if ((await res.json()).success) fetchPoolData();
              }} className="flex items-center gap-3 group transition-all">
                <ThumbsUp className="w-5 h-5 text-somnia-magenta group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-black text-text-muted group-hover:text-white uppercase tracking-widest">{pool.socialStats.likes} Trust</span>
              </button>
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-somnia-cyan" />
                <span className="text-[11px] font-black text-text-muted uppercase tracking-widest">{pool.participants || 0} Entities</span>
              </div>
              <div className="flex items-center gap-3">
                <Send className="w-5 h-5 text-white/30" />
                <span className="text-[11px] font-black text-text-muted uppercase tracking-widest">{pool.socialStats.shares} Links</span>
              </div>
            </div>

            <div className="space-y-8 relative z-10">
              {poolExplanation && (
                pool.category === 'crypto' || pool.category === 'cryptocurrency' ? (
                  <CryptoTitleRow
                    asset={pool.homeTeam || 'BTC'}
                    targetPrice={parseFloat(pool.predictedOutcome?.match(/\$?([\d,]+)/)?.[1].replace(/,/g, '') || '0')}
                    direction={pool.predictedOutcome?.toLowerCase().includes('below') ? 'below' : 'above'}
                    timeframe="1d"
                    odds={(pool.odds / 100).toFixed(2)}
                    currency={pool.currency || 'BITR'}
                  />
                ) : (
                  <PoolTitleRow
                    title={`${pool.homeTeam || 'Team A'} vs ${pool.awayTeam || 'Team B'}`}
                    currencyBadge={poolExplanation.currencyBadge}
                    marketTypeBadge={{
                      label: pool.predictedOutcome || 'Unknown',
                      color: poolExplanation.marketTypeBadge.color,
                      bgColor: poolExplanation.marketTypeBadge.bgColor
                    }}
                    league={pool.eventDetails?.league || 'Unknown Sector'}
                    time={pool.eventDetails?.startTime ? pool.eventDetails.startTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC' : 'TBD'}
                    odds={(pool.odds / 100).toFixed(2)}
                  />
                )
              )}

              {contractData && (
                <div className="glass-card border-white/5 p-1">
                  <PoolStatusBanner
                    pool={{
                      id: parseInt(poolId),
                      settled: (contractData.flags & 1) !== 0,
                      creatorSideWon: (contractData.flags & 2) !== 0,
                      eventStartTime: contractData.eventStartTime,
                      eventEndTime: contractData.eventEndTime,
                      bettingEndTime: contractData.bettingEndTime,
                      arbitrationDeadline: contractData.arbitrationDeadline,
                      result: contractData.result,
                      resultTimestamp: contractData.resultTimestamp,
                      oracleType: contractData.oracleType === 0 ? 'GUIDED' : 'OPEN',
                      marketId: contractData.marketId,
                      isRefunded: isRefunded,
                      totalBettorStake: poolApiData?.totalBettorStake,
                      betCount: poolApiData?.betCount || poolApiData?.totalBets
                    }}
                  />
                </div>
              )}
            </div>

            <div className="p-8 bg-somnia-magenta/5 border border-somnia-magenta/10 rounded-[40px] relative z-10 overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Shield className="w-32 h-32" />
              </div>
              <div className="text-[11px] font-black text-somnia-magenta uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-somnia-magenta animate-pulse" />
                Operational Directive
              </div>
              <div className="text-2xl font-black text-white uppercase tracking-tight mb-3">
                {poolExplanation?.creatorPosition || `Protocol Origin: "${pool.title}" void status.`}
              </div>
              <p className="text-sm text-text-muted mb-10 max-w-3xl leading-relaxed">
                Staging a challenge against conflicting state predictions. Execute arbitrage protocol if you predict manifestation.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { label: 'Origin Stake', value: `${creatorStakeFormatted.toFixed(0)} ${pool.currency}`, sub: 'Principal Risk', color: 'text-white' },
                  { label: 'Active Stream', value: `${totalBettorStakeFormatted.toFixed(0)} ${pool.currency}`, sub: 'Current Liquidity', color: 'text-somnia-cyan' },
                  { label: 'Potential Yield', value: `${potentialWinFormatted.toFixed(0)} ${pool.currency}`, sub: 'Max Arbitrage', color: 'text-somnia-blue' }
                ].map((stat, i) => (
                  <div key={i} className="p-5 bg-white/[0.03] border border-white/5 rounded-3xl group-hover:bg-white/[0.05] transition-colors">
                    <div className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2">{stat.label}</div>
                    <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                    <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-1">{stat.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-somnia-cyan animate-pulse" />
                  <span className="text-[11px] font-black text-text-muted uppercase tracking-[0.25em]">Sync Progress</span>
                </div>
                <span className="text-lg font-black text-white">{fillPercentage.toFixed(1)}%</span>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(fillPercentage, 100)}%` }}
                  transition={{ duration: 2, ease: "circOut" }}
                  className="h-full bg-gradient-to-r from-somnia-cyan via-somnia-blue to-somnia-magenta rounded-full relative"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] bg-[length:200%_100%] animate-scan" />
                </motion.div>
              </div>
              <div className="flex justify-between text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                <span>{(creatorStakeFormatted + totalBettorStakeFormatted).toFixed(2)} {pool.currency} Committed</span>
                <span>Node Capacity: {maxPoolSizeFormatted.toFixed(2)} {pool.currency}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
              {[
                { label: 'Defeated Nodes', value: defeatedCount, color: 'text-somnia-magenta', icon: Shield },
                { label: 'Origin Success', value: `${pool.creator.successRate.toFixed(1)}%`, color: 'text-green-400', icon: Trophy },
                { label: 'Arbitrage Ratio', value: `${(pool.odds / 100).toFixed(2)}x`, color: 'text-somnia-cyan', icon: TrendingUp },
                { label: 'Resident Count', value: challengersCount, color: 'text-somnia-blue', icon: User }
              ].map((stat, i) => (
                <div key={i} className="p-6 glass-card border-white/5 text-center group hover:border-somnia-cyan/20 transition-all hover:-translate-y-1">
                  <div className="flex justify-center mb-3">
                    <stat.icon className={`w-5 h-5 ${stat.color} opacity-40`} />
                  </div>
                  <div className={`text-4xl font-black mb-1 ${stat.color}`}>{stat.value}</div>
                  <div className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">{stat.label}</div>
                </div>
              ))}
            </div>

            {pool.eventDetails && (
              <div className="p-10 bg-[#0D0D1F] border border-white/5 rounded-[48px] text-center relative overflow-hidden group">
                <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(0,243,255,0.1),transparent_70%)]" />
                <div className="flex items-center justify-center gap-3 mb-8 text-somnia-cyan/60">
                  <Clock className="w-5 h-5 animate-spin-slow" />
                  <span className="text-[11px] font-black uppercase tracking-[0.5em]">Temporal Sync Remaining</span>
                </div>
                <div className="flex items-center justify-center gap-12 relative z-10">
                  {[
                    { val: timeLeft.days, label: 'Cycles' },
                    { val: timeLeft.hours, label: 'Hours' },
                    { val: timeLeft.minutes, label: 'Marks' }
                  ].map((time, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="text-7xl font-black text-white uppercase tracking-tighter tabular-nums mb-2 group-hover:text-somnia-cyan transition-colors duration-500 drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                        {String(time.val).padStart(2, '0')}
                      </div>
                      <div className="text-[11px] font-black text-white/30 uppercase tracking-[0.5em]">{time.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex p-1.5 bg-white/5 rounded-[24px] border border-white/10 backdrop-blur-xl relative z-10">
          {[
            { id: 'bet', label: 'Tactical', icon: Wallet },
            { id: 'analysis', label: 'Intelligence', icon: BarChart3 },
            { id: 'settlement', label: 'Resolution', icon: Trophy },
            { id: 'liquidity', label: 'Liquidity', icon: Scale }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "bet" | "liquidity" | "analysis" | "settlement")}
              className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[18px] font-black text-[10px] uppercase tracking-[0.2em] transition-all relative ${activeTab === tab.id ? 'text-black bg-white shadow-xl shadow-white/10' : 'text-text-muted hover:text-white hover:bg-white/5'
                }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-black' : 'text-white/20'}`} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Dynamic Content Panel */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          {activeTab === 'bet' && (
            <div className="space-y-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Tactical Selection */}
                <div className="space-y-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-1 h-8 bg-somnia-cyan" />
                    <div>
                      <h4 className="text-xl font-black text-white uppercase tracking-tight">Select Outcome Vector</h4>
                      <p className="text-[11px] font-black text-text-muted uppercase tracking-widest">Contest or sustain the origin prediction</p>
                    </div>
                  </div>

                  {!canBet && (
                    <div className="p-4 bg-somnia-magenta/10 border border-somnia-magenta/20 rounded-2xl flex items-center gap-4">
                      <Shield className="w-5 h-5 text-somnia-magenta" />
                      <p className="text-xs font-black text-somnia-magenta uppercase tracking-widest">Temporal locked: Signal finalized</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <motion.div
                      whileHover={canBet && !isPoolFilled ? { scale: 1.02, y: -4 } : {}}
                      onClick={() => canBet && !isPoolFilled && setBetType('yes')}
                      className={`p-8 rounded-[32px] border-2 transition-all cursor-pointer relative overflow-hidden group ${betType === 'yes' ? 'bg-somnia-cyan/10 border-somnia-cyan shadow-[0_0_30px_rgba(0,243,255,0.15)]' : 'bg-white/5 border-white/5 hover:border-white/20'
                        } ${(!canBet || isPoolFilled) ? 'opacity-40 cursor-not-allowed grayscale' : ''}`}
                    >
                      <div className="relative z-10 space-y-6 text-center">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto transition-colors ${betType === 'yes' ? 'bg-somnia-cyan text-black' : 'bg-white/5 text-white/40 group-hover:text-white'}`}>
                          <TrendingUp className="w-8 h-8" />
                        </div>
                        <div>
                          <div className="text-lg font-black text-white uppercase tracking-tight mb-1">Affirmative</div>
                          <div className="text-[10px] font-black text-somnia-cyan uppercase tracking-widest">Manifestation Predicted</div>
                        </div>
                        <div className="py-3 px-4 bg-white/5 rounded-2xl text-xs font-black text-white tracking-widest">
                          {(pool.odds / 100).toFixed(2)}x Yield
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      whileHover={canBet ? { scale: 1.02, y: -4 } : {}}
                      onClick={() => canBet && setBetType('no')}
                      className={`p-8 rounded-[32px] border-2 transition-all cursor-pointer relative overflow-hidden group ${betType === 'no' ? 'bg-somnia-blue/10 border-somnia-blue shadow-[0_0_30px_rgba(0,122,255,0.15)]' : 'bg-white/5 border-white/5 hover:border-white/20'
                        } ${!canBet ? 'opacity-40 cursor-not-allowed grayscale' : ''}`}
                    >
                      <div className="relative z-10 space-y-6 text-center">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto transition-colors ${betType === 'no' ? 'bg-somnia-blue text-white' : 'bg-white/5 text-white/40 group-hover:text-white'}`}>
                          <Check className="w-8 h-8" />
                        </div>
                        <div>
                          <div className="text-lg font-black text-white uppercase tracking-tight mb-1">Negative</div>
                          <div className="text-[10px] font-black text-somnia-blue uppercase tracking-widest">Void Sustained</div>
                        </div>
                        <div className="py-3 px-4 bg-white/5 rounded-2xl text-xs font-black text-white tracking-widest">
                          LP Provision
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Magnitude Input */}
                <div className="space-y-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-1 h-8 bg-somnia-magenta" />
                    <div>
                      <h4 className="text-xl font-black text-white uppercase tracking-tight">Resource Allocation</h4>
                      <p className="text-[11px] font-black text-text-muted uppercase tracking-widest">Define stake magnitude for this node</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="relative group">
                      <input
                        type="number"
                        value={betAmount || ''}
                        onChange={(e) => canBet && setBetAmount(Number(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full bg-white/5 border border-white/10 rounded-[32px] px-8 py-6 text-2xl font-black text-white focus:outline-none focus:border-somnia-cyan/50 transition-all placeholder:text-white/10"
                      />
                      <div className="absolute right-8 top-1/2 -translate-y-1/2 text-xl font-black text-somnia-cyan uppercase tracking-tighter">
                        {pool.currency}
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      {[10, 50, 100, 500].map(amt => (
                        <button key={amt} onClick={() => canBet && setBetAmount(amt)} className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${betAmount === amt ? 'bg-white text-black' : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-white border border-white/5'}`}>
                          {amt}
                        </button>
                      ))}
                    </div>

                    <AnimatePresence>
                      {betAmount > 0 && betType && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[32px] space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">
                              <span>Calculated Projection</span>
                              <Activity className="w-3.5 h-3.5 text-somnia-cyan" />
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-black uppercase text-white/40">Total Stake</span>
                                <span className="text-sm font-black text-white">{betAmount} {pool.currency}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-black uppercase text-white/40">Manifest Return</span>
                                <span className="text-sm font-black text-somnia-cyan">
                                  {betType === 'yes' ? (betAmount * (pool.odds / 100)).toFixed(2) : (betAmount / ((pool.odds / 100) - 1)).toFixed(2)} {pool.currency}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-black uppercase text-white/40">Net Arbitrage</span>
                                <span className="text-sm font-black text-somnia-magenta">
                                  +{betType === 'yes' ? (betAmount * ((pool.odds / 100) - 1)).toFixed(2) : ((betAmount / ((pool.odds / 100) - 1)) - betAmount).toFixed(2)} {pool.currency}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <div className="text-center pt-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePlaceBet}
                  disabled={!canBet || !betType || betAmount <= 0}
                  className={`w-full max-w-lg py-6 rounded-[32px] text-xl font-black uppercase tracking-[0.3em] transition-all relative overflow-hidden shadow-2xl ${!canBet || !betType || betAmount <= 0 ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-white text-black shadow-white/10 hover:shadow-white/20'
                    }`}
                >
                  <div className="relative z-10 flex items-center justify-center gap-4">
                    {betType === 'yes' ? 'Execute Assertion' : betType === 'no' ? 'Execute Validation' : 'Await parameters'}
                    {betType && betAmount > 0 && <Activity className="w-5 h-5 animate-pulse" />}
                  </div>
                  {betType && betAmount > 0 && (
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-somnia-cyan/20 via-transparent to-somnia-magenta/20 animate-scan pointer-events-none" />
                  )}
                </motion.button>
              </div>

              {/* Resolution States */}
              <div className="pt-10">
                {poolStatusType === 'refunded' ? (
                  <div className="glass-card p-12 text-center border-somnia-magenta/20">
                    <div className="w-20 h-20 bg-somnia-magenta/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Shield className="w-10 h-10 text-somnia-magenta" />
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Protocol Refunded</h3>
                    <p className="text-sm text-text-muted mb-8">System anomaly or event cancellation detected. All committed resources returned.</p>
                    <BetDisplay poolId={poolId} />
                  </div>
                ) : poolStatusType && ['creator_won', 'bettor_won', 'settled'].includes(poolStatusType) ? (
                  <div className="space-y-12">
                    <ClaimRewards pool={{
                      id: pool.id,
                      currency: pool.currency,
                      settled: poolStatusType === 'settled',
                      eventEndTime: pool.eventDetails?.endTime?.getTime() ? Math.floor(pool.eventDetails.endTime.getTime() / 1000) : 0,
                      status: poolStatusType
                    }} />
                    <div className="glass-card p-8 border-white/5">
                      <div className="text-[11px] font-black text-somnia-cyan uppercase tracking-[0.4em] mb-6">Historical Log</div>
                      <BetDisplay poolId={poolId} />
                    </div>
                  </div>
                ) : (
                  <div className="glass-card p-8 border-white/5">
                    <div className="flex items-center justify-between mb-8">
                      <div className="text-[11px] font-black text-somnia-cyan uppercase tracking-[0.4em]">Active Node Streams</div>
                      <div className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        Live Telemetry
                      </div>
                    </div>
                    <BetDisplay poolId={poolId} />
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="glass-card p-8 border-white/5 space-y-6">
                  <div className="text-[10px] font-black text-somnia-cyan uppercase tracking-[0.3em] flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Integrity Analysis
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs font-black">
                      <span className="text-text-muted uppercase">Reliability Index</span>
                      <span className="text-green-400">{pool.creator.successRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-black">
                      <span className="text-text-muted uppercase">Sector Saturation</span>
                      <span className="text-white">{pool.creator.totalPools}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-black">
                      <span className="text-text-muted uppercase">Economic Throughput</span>
                      <span className="text-somnia-blue">{pool.creator.totalVolume >= 1000 ? `${(pool.creator.totalVolume / 1000).toFixed(1)}k` : pool.creator.totalVolume.toFixed(1)} {pool.currency}</span>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-8 border-white/5 space-y-6">
                  <div className="text-[10px] font-black text-somnia-magenta uppercase tracking-[0.3em] flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Network Sentiment
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs font-black">
                      <span className="text-text-muted uppercase">Resident Entities</span>
                      <span className="text-white">{pool.participants || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-black">
                      <span className="text-text-muted uppercase">Conflict Density</span>
                      <span className="text-somnia-magenta">{pool.defeated} VOIDED</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-black">
                      <span className="text-text-muted uppercase">Arbitrage Vector</span>
                      <span className="text-somnia-cyan">{(pool.odds / 100).toFixed(2)}x</span>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-8 border-white/5 flex flex-col justify-center text-center space-y-4 md:col-span-2 lg:col-span-1">
                  <Info className="w-8 h-8 text-white/20 mx-auto" />
                  <div className="text-lg font-black text-white uppercase tracking-tight">Risk Protocol</div>
                  <p className="text-xs text-text-muted leading-relaxed uppercase tracking-widest font-black"> High-confidence state assertion by verified origin. Yield premium exceeds 80th percentile. </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settlement' && (
            <div className="glass-card p-8 border-white/5 min-h-[400px]">
              <div className="text-[11px] font-black text-somnia-cyan uppercase tracking-[0.4em] mb-10">Resolution Protocol Data</div>
              <SettlementResults poolId={poolId} className="w-full" />
            </div>
          )}

          {activeTab === 'liquidity' && (
            <div className="space-y-10">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Network Depth', val: totalLiquidityFormatted.toFixed(0), col: 'text-somnia-cyan', sub: pool.currency },
                  { label: 'Origin Reliability', val: `${pool.creator.successRate.toFixed(1)}%`, col: 'text-green-400', sub: 'Win Rate' },
                  { label: 'Signal Count', val: totalBetsCount, col: 'text-somnia-blue', sub: 'Unique Stakes' },
                  { label: 'Market Volume', val: totalVolumeFormatted.toFixed(0), col: 'text-somnia-violet', sub: pool.currency }
                ].map((s, i) => (
                  <div key={i} className="glass-card p-8 border-white/5 text-center transition-all hover:bg-white/[0.03]">
                    <div className={`text-4xl font-black mb-1 ${s.col}`}>{s.val}</div>
                    <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">{s.label}</div>
                    <div className="text-[8px] font-black text-white/20 uppercase tracking-widest">{s.sub}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="p-10 glass-card border-white/5 space-y-8">
                  <div className="text-[11px] font-black text-somnia-blue uppercase tracking-[0.4em]">MP Mechanism</div>
                  <div className="space-y-6">
                    <p className="text-sm text-text-muted font-bold leading-relaxed uppercase tracking-tight"> Sustaining the origin position earns resource yield from manifests of defeated nodes. Yield is distributed pro-rata. </p>
                    <div className="p-6 bg-white/5 rounded-3xl space-y-3">
                      <div className="text-[9px] font-black text-somnia-cyan uppercase tracking-widest">Projection Scenario</div>
                      <div className="text-xs font-black text-white leading-relaxed">
                        Stake 100 {pool.currency} @ {(pool.odds / 100).toFixed(2)}x yield potential of {(100 * ((pool.odds / 100) - 1)).toFixed(0)} {pool.currency} Net Profit on Origin Victory.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-10 glass-card border-white/5 space-y-8">
                  <div className="text-[11px] font-black text-somnia-violet uppercase tracking-[0.4em]">Resident Market Makers</div>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-4 scrollbar-hide">
                    {pool.liquidityProviders?.map((lp, i) => (
                      <div key={i} className="flex justify-between items-center p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-somnia-violet/20 rounded-xl flex items-center justify-center border border-somnia-violet/20 font-black text-[10px] text-somnia-violet">LP</div>
                          <div>
                            <UserAddressLink address={lp.address} className="text-xs font-black text-white uppercase tracking-tight" />
                            <div className="text-[9px] font-black text-text-muted uppercase">{new Date(lp.timestamp * 1000).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-somnia-violet">{parseFloat(lp.stake).toFixed(2)}</div>
                          <div className="text-[9px] font-black text-text-muted uppercase tracking-widest">{pool.currency} Allocated</div>
                        </div>
                      </div>
                    ))}
                    {(!pool.liquidityProviders || pool.liquidityProviders.length === 0) && (
                      <div className="text-center py-10 opacity-30 text-xs font-black uppercase tracking-widest">No market makers detected</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Neural Command Discussion */}
        <div id="comments" className="pt-12 border-t border-white/5 space-y-10 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-somnia-cyan/10 rounded-2xl flex items-center justify-center border border-somnia-cyan/20">
                <MessageSquare className="w-6 h-6 text-somnia-cyan" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Neural Protocol Link</h3>
                <p className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em]">{address ? 'Channel Secure - Transmit Signal' : 'Join Network to Sync Signals'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCommentBox(!showCommentBox)}
                className="flex items-center gap-3 px-8 py-3.5 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                Initialize Signal
              </motion.button>

              {userBetAmount > 0 && (
                <div className="px-5 py-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5" />
                  Verified Resident • {userBetAmount.toLocaleString()} {pool.currency}
                </div>
              )}
              {address && pool?.creatorAddress && address.toLowerCase() === pool.creatorAddress.toLowerCase() && (
                <div className="px-5 py-3 bg-somnia-magenta/10 border border-somnia-magenta/20 text-somnia-magenta rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5" />
                  Origin Authority
                </div>
              )}
            </div>

            <AnimatePresence>
              {showCommentBox && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card p-10 border-somnia-cyan/20 space-y-8 shadow-[0_0_50px_rgba(0,243,255,0.05)]">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Encode your analysis and reasoning for the collective..."
                    className="w-full bg-white/5 border border-white/5 rounded-[32px] px-8 py-8 text-white placeholder-white/20 focus:outline-none focus:border-somnia-cyan/30 transition-all text-lg font-bold leading-relaxed resize-none"
                    rows={6}
                  />

                  <div className="flex flex-wrap items-center justify-between gap-10 border-t border-white/5 pt-8">
                    <div className="flex items-center gap-10">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Signal Vibe</label>
                        <select
                          value={commentSentiment}
                          onChange={(e) => setCommentSentiment(e.target.value as "bullish" | "bearish" | "neutral")}
                          className="w-40 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-black text-white hover:border-somnia-cyan/30 transition-all uppercase outline-none"
                        >
                          <option value="bullish" className="bg-[#0A0A1A]">Bullish</option>
                          <option value="neutral" className="bg-[#0A0A1A]">Neutral</option>
                          <option value="bearish" className="bg-[#0A0A1A]">Bearish</option>
                        </select>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                          <span className="text-text-muted">Certainty</span>
                          <span className="text-white">{commentConfidence}%</span>
                        </div>
                        <input
                          type="range"
                          min="1" max="100"
                          value={commentConfidence}
                          onChange={(e) => setCommentConfidence(parseInt(e.target.value))}
                          className="w-40 accent-somnia-cyan h-1 bg-white/10 rounded-full appearance-none hover:accent-somnia-magenta transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex gap-6">
                      <button onClick={() => setShowCommentBox(false)} className="px-6 py-2 text-xs font-black text-text-muted hover:text-white uppercase tracking-widest transition-colors">Abort</button>
                      <button
                        onClick={handleAddComment}
                        disabled={!comment.trim() || submittingComment}
                        className="px-10 py-4 bg-somnia-cyan text-black rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-somnia-cyan/20 hover:scale-105 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-3"
                      >
                        {submittingComment ? <Activity className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Transmit Signal
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-8 pb-20">
            {comments.length === 0 ? (
              <div className="glass-card p-20 text-center border-white/5 flex flex-col items-center justify-center space-y-6 opacity-30">
                <Globe className="w-16 h-16" />
                <p className="text-sm font-black uppercase tracking-[0.4em]">Zero Signals Captured in this Sector</p>
              </div>
            ) : (
              comments.map(renderComment)
            )}
          </div>
        </div>
      </div>

      <BoostPoolModal
        poolId={parseInt(poolId)}
        currentTier={pool?.boostTier === 3 ? 'GOLD' : pool?.boostTier === 2 ? 'SILVER' : pool?.boostTier === 1 ? 'BRONZE' : 'NONE'}
        isOpen={showBoostModal}
        onClose={() => setShowBoostModal(false)}
        onSuccess={() => {
          setPool(prev => prev ? { ...prev, boosted: true, boostTier: (prev.boostTier || 0) + 1 } : prev);
        }}
      />
    </div>

  );
}
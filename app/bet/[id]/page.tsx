"use client";

import { useAccount } from "wagmi";
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { 
  ArrowTrendingUpIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  BanknotesIcon,
  ScaleIcon,
  TrophyIcon,
  PaperAirplaneIcon,
  ChatBubbleOvalLeftIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  HandRaisedIcon,
  CheckIcon
} from "@heroicons/react/24/outline";
import { 
  StarIcon as StarSolid,
  BoltIcon as BoltSolid,
  HandThumbUpIcon as ThumbUpSolid,
  HandThumbDownIcon as ThumbDownSolid
} from "@heroicons/react/24/solid";
import { Pool, Comment } from "@/lib/types";
import { usePools } from "@/hooks/usePools";
import { useBITRToken } from "@/hooks/useBITRToken";
import { TransactionFeedback } from "@/components/TransactionFeedback";
import { optimizedPoolService } from "@/services/optimizedPoolService";
import { frontendCache } from "@/services/frontendCache";
import { toast } from "react-hot-toast";
import { PoolExplanationService, PoolExplanation } from "@/services/poolExplanationService";
import PoolTitleRow from "@/components/PoolTitleRow";
import CryptoTitleRow from "@/components/CryptoTitleRow";
import PoolStatusBanner from "@/components/PoolStatusBanner";
import BetDisplay from "@/components/BetDisplay";
import SettlementResults from "@/components/SettlementResults";
import MatchCenter from "@/components/MatchCenter";
import ClaimRewards from "@/components/ClaimRewards";
import SkeletonLoader from "@/components/SkeletonLoader";

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
  const [comments] = useState<Comment[]>([]);
  const [betType, setBetType] = useState<'yes' | 'no' | null>(null);
  const [poolExplanation, setPoolExplanation] = useState<PoolExplanation | null>(null);
  
  // Pool state checks for betting
  const [isEventStarted, setIsEventStarted] = useState(false);
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
  const [poolStatusType, setPoolStatusType] = useState<'creator_won' | 'bettor_won' | 'settled' | 'active' | null>(null);
  
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
      
      // Set contract data for status banner (API provides all needed fields)
      const flags = 
        (poolData.status === 'settled' ? 1 : 0) |  // Bit 0: settled
        (
          poolData.creatorSideWon === true || poolData.defeated === 0
          ? 2 : 0  // Bit 1: creatorSideWon
        );
      
      console.log('🔍 Pool Status DEBUG:', {
        poolId: poolData.id,
        status: poolData.status,
        creatorSideWon: poolData.creatorSideWon,
        defeated: poolData.defeated,
        flagsCalculation: {
          settled: (poolData.status === 'settled' ? 1 : 0),
          creatorSideWon: (poolData.creatorSideWon === true || poolData.defeated === 0 ? 2 : 0),
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
        
      // Determine pool status type using local flags (not async state)
      const settled = (flags & 1) !== 0; // Bit 0: settled
      const creatorSideWon = (flags & 2) !== 0; // Bit 1: creatorSideWon
      
      if (settled) {
        if (creatorSideWon) {
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
      setIsEventStarted(eventStarted);
      
      // Check if pool is filled (100% or more)
      const poolFilled = poolData.isPoolFilled || poolData.fillPercentage >= 100;
      setIsPoolFilled(poolFilled);
      
      // Check if betting is still allowed
      const bettingAllowed = poolData.canBet ?? (nowTime < bettingEndTime && !eventStarted && !poolFilled);
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
      
      // Challengers: Calculate number of YES bettors (bettor side)
      // Estimate based on total bettor stake, assuming average bet of 500-2000 tokens
      const challengers = totalBettorStakeNum > 0 
        ? Math.max(1, Math.ceil(totalBettorStakeNum / 1500))
        : 0;
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
        setUserBetAmount(data.data.betAmount);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('User bet status check timed out');
      } else {
        console.error('Error checking bet status:', error);
      }
    }
  }, [poolId, address]);

  useEffect(() => {
    fetchPoolData();
    checkUserBetStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [poolId]); // Only run when poolId changes
  

  // State to track if we're waiting for approval to complete
  const [waitingForApproval, setWaitingForApproval] = useState(false);
  const [pendingBetData, setPendingBetData] = useState<{amount: number, type: 'yes' | 'no'} | null>(null);

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

  useEffect(() => {
    if (pool && pool.eventDetails) {
    const timer = setInterval(() => {
      const now = new Date().getTime();
        const end = pool.eventDetails!.endTime.getTime();
        const distance = end - now;
      
      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(timer);
    }
  }, [pool]);

  const handleAddComment = async () => {
    if (!comment.trim() || !hasUserBet || submittingComment) return;
    
    setSubmittingComment(true);
    
    try {
      const response = await fetch(`/api/pools/${poolId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: comment,
          sentiment: commentSentiment,
          confidence: commentConfidence,
          userAddress: address
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setComment("");
        setCommentSentiment('neutral');
        setCommentConfidence(75);
        setShowCommentBox(false);
        fetchPoolData(); // Refresh comments
      }
    } catch (error: unknown) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!address) return;
    
    try {
      const response = await fetch(`/api/pools/${poolId}/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userAddress: address })
      });
      
      if (response.ok) {
        fetchPoolData(); // Refresh comments
      }
    } catch (error: unknown) {
      console.error('Error liking comment:', error);
    }
  };

  const handlePlaceBet = async () => { 
    if(!betType || betAmount <= 0 || !address) return;
    
    try {
      
      // Show loading toast
      toast.loading('Preparing transaction...', { id: 'bet-tx' });
      
      // Check if this is a BITR pool and if approval is needed
        if (pool && pool.currency === 'BITR' && needsApproval()) {
        
        // Store bet data for after approval
        setPendingBetData({ amount: betAmount, type: betType });
        setWaitingForApproval(true);
        
        toast.loading('Approving BITR tokens...', { id: 'bet-tx' });
        await approve("0x0000000000000000000000000000000000000000", betAmount.toString());
        
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
      case 'bullish': return 'text-green-400';
      case 'bearish': return 'text-red-400';
      default: return 'text-blue-400';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return <ArrowTrendingUpIcon className="w-4 h-4" />;
      case 'bearish': return <ArrowTrendingUpIcon className="w-4 h-4 rotate-180" />;
      default: return <ScaleIcon className="w-4 h-4" />;
    }
  };

  const getDifficultyColor = (tier: string) => {
    switch (tier) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-orange-400';
      case 'very_hard': return 'text-red-400';
      case 'legendary': return 'text-purple-400';
      default: return 'text-blue-400';
    }
  };

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'legendary': return 'bg-gradient-to-r from-yellow-400 to-orange-500';
      case 'crypto_expert': return 'bg-gradient-to-r from-cyan-400 to-blue-500';
      case 'whale': return 'bg-gradient-to-r from-blue-400 to-purple-500';
      case 'sports_expert': return 'bg-gradient-to-r from-green-400 to-emerald-500';
      default: return 'bg-gradient-to-r from-gray-400 to-gray-500';
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

  const renderComment = (comment: Comment): React.JSX.Element => {
  return (
      <div key={comment.id} className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/30">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-cyan-400">
              {(comment.author.username || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-white">{comment.author.username}</span>
              
              {comment.isVerifiedBetter && (
                <div className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                  Verified Better
            </div>
              )}

              {comment.author.badges.map((badge: string, index: number) => (
                <div key={index} className={`px-2 py-1 rounded-full text-xs font-bold text-black ${getBadgeColor(badge)}`}>
                  {badge.replace('_', ' ')}
                </div>
              ))}
              
              {comment.sentiment && (
                <div className={`flex items-center gap-1 text-xs ${getSentimentColor(comment.sentiment)}`}>
                  {getSentimentIcon(comment.sentiment)}
                  {comment.sentiment}
                </div>
              )}

              {comment.confidence && (
                <span className="text-xs text-gray-400">{comment.confidence}% confident</span>
              )}
              <span className="text-xs text-gray-400">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </div>

            <p className="text-gray-300 mb-3">{comment.content}</p>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleLikeComment(comment.id)}
                className={`flex items-center gap-1 text-sm ${
                  comment.hasUserLiked ? 'text-green-400' : 'text-gray-400 hover:text-green-400'
                }`}
              >
                <ThumbUpSolid className="w-4 h-4" />
                {comment.likes}
              </button>
              
              <button
                className={`flex items-center gap-1 text-sm ${
                  comment.hasUserDisliked ? 'text-red-400' : 'text-gray-400 hover:text-red-400'
                }`}
              >
                <ThumbDownSolid className="w-4 h-4" />
                {comment.dislikes}
              </button>
              
              <button className="flex items-center gap-1 text-sm text-gray-400 hover:text-white">
                <ChatBubbleLeftRightIcon className="w-4 h-4" />
                Reply
              </button>
            </div>
            
            {/* Replies */}
            {comment.replies.length > 0 && (
              <div className="mt-4 space-y-3 pl-4 border-l-2 border-gray-700/30">
                {comment.replies.map((reply) => renderComment(reply))}
              </div>
            )}
                    </div>
                  </div>
                </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <SkeletonLoader type="bet-page" />
                      </div>
                    </div>
  );

  if (!pool) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                    <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Pool not found</h2>
        <p className="text-gray-400">The requested prediction pool could not be found.</p>
                      </div>
                    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Transaction Feedback Modal */}
      <TransactionFeedback status={null} onClose={() => {}} />
      
      {/* Match Center - Only show for football pools */}
      {(() => {
        console.log('🔍 MATCH CENTER DEBUG:', {
          poolCategory: pool.category,
          poolFixtureId: pool.fixtureId,
          poolMarketId: pool.marketId,
          poolMarketType: pool.marketType,
          shouldShowMatchCenter: pool.category === 'football'
        });
        return pool.category === 'football' && pool.fixtureId && (
          <div className="container mx-auto px-4 py-4">
            <MatchCenter 
              fixtureId={pool.fixtureId} 
              className="w-full"
            />
          </div>
        );
      })()}
      
      <div className="container mx-auto px-4 py-4 sm:py-8 space-y-4 sm:space-y-8">
        {/* Header Section */}
        <div className="relative">
          <div className="glass-card space-y-4 sm:space-y-6 relative overflow-hidden">
            {/* Boost indicator - Fixed positioning inside container */}
            {pool.boosted && (
              <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10">
                <div className={`
                  px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold flex items-center gap-1
                  ${pool.boostTier === 3 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black' :
                    pool.boostTier === 2 ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-black' :
                    'bg-gradient-to-r from-orange-600 to-orange-700 text-white'}
                  ${getBoostGlow(pool.boostTier)}
                `}>
                  <BoltSolid className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">
                    {pool.boostTier === 3 ? 'GOLD BOOST' : pool.boostTier === 2 ? 'SILVER BOOST' : 'BRONZE BOOST'}
                  </span>
                  <span className="sm:hidden">
                    {pool.boostTier === 3 ? 'GOLD' : pool.boostTier === 2 ? 'SILVER' : 'BRONZE'}
                  </span>
                      </div>
                    </div>
            )}

            {/* Creator Info */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="relative">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center border-2 border-cyan-500/30">
                    <UserIcon className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" />
                      </div>
                  {pool.creator.badges.includes('legendary') && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                      <StarSolid className="w-2 h-2 sm:w-3 sm:h-3 text-black" />
                  </div>
                )}
                      </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-lg sm:text-xl font-bold text-white">{pool.creator.username}</h3>
                    <div className="flex gap-1">
                      {pool.creator.badges.slice(0, 2).map((badge: string, index: number) => (
                        <div key={index} className={`px-1 sm:px-2 py-1 rounded-full text-xs font-bold text-black ${getBadgeColor(badge)}`}>
                          <span className="hidden sm:inline">{badge.replace('_', ' ').toUpperCase()}</span>
                          <span className="sm:hidden">{(badge || 'B').charAt(0).toUpperCase()}</span>
                    </div>
                      ))}
                      </div>
                    </div>
                  <div className="text-xs sm:text-sm text-gray-400 line-clamp-2">{pool.creator.bio}</div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-300">
                    <div className="flex items-center gap-1">
                      <TrophyIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      {pool.creator.successRate.toFixed(1)}% win rate
                      </div>
                    <div className="flex items-center gap-1">
                      <ChartBarIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      {pool.creator.totalPools} pools
                    </div>
                    <div className="flex items-center gap-1">
                      <CurrencyDollarIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      {pool.creator.totalVolume >= 1000 
                        ? `${(pool.creator.totalVolume / 1000).toFixed(1)}k` 
                        : pool.creator.totalVolume.toFixed(1)} volume
                  </div>
                  </div>
                </div>
              </div>
              <div className="text-center sm:text-right">
                <div className="text-xs sm:text-sm text-gray-400 mb-1">Challenge Score</div>
                <div className={`text-2xl sm:text-3xl font-bold ${getDifficultyColor(pool.difficultyTier)}`}>
                  {pool.challengeScore}
                </div>
                <div className="text-xs text-gray-400 uppercase">
                  {pool.difficultyTier.replace('_', ' ')}
                </div>
              </div>
            </div>

            {/* Community Stats - Moved to top */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-800/30 to-gray-700/30 rounded-lg border border-gray-600/30">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <ChatBubbleLeftRightIcon className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-400">{pool.socialStats.comments}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ThumbUpSolid className="w-4 h-4 text-pink-400" />
                  <span className="text-sm text-gray-400">{pool.socialStats.likes}</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-gray-400">{pool.participants || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <PaperAirplaneIcon className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-400">{pool.socialStats.shares}</span>
                </div>
              </div>
            </div>

            {/* Pool Title & Description */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-xs sm:text-sm px-2 sm:px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full">
                  {pool.category}
                </span>
                <div className="flex gap-1">
                  {pool.tags?.map((tag: string, index: number) => (
                    <span key={index} className="text-xs px-1 sm:px-2 py-1 bg-gray-700/50 text-gray-400 rounded-full">
                      #{tag}
                    </span>
                  ))}
                      </div>
                    </div>
              
              {/* Title Section - Moved to top */}
              <div className="mb-6">
                {poolExplanation && (
                  // Check if this is a crypto market
                  pool.category === 'crypto' || pool.category === 'cryptocurrency' ? (
                    <CryptoTitleRow
                      asset={pool.homeTeam || 'BTC'}
                      targetPrice={(() => {
                        // Extract target price from predictedOutcome
                        const match = pool.predictedOutcome?.match(/\$?([\d,]+)/);
                        return match ? parseFloat(match[1].replace(/,/g, '')) : undefined;
                      })()}
                      direction={(() => {
                        const outcome = pool.predictedOutcome?.toLowerCase() || '';
                        if (outcome.includes('above')) return 'above';
                        if (outcome.includes('below')) return 'below';
                        if (outcome.includes('up')) return 'up';
                        if (outcome.includes('down')) return 'down';
                        return 'above';
                      })()}
                      timeframe="1d" // Default timeframe, should be extracted from pool data
                      odds={(pool.odds / 100).toFixed(2)}
                      currency={pool.currency || 'BITR'}
                      className="mb-4"
                    />
                  ) : (
                    <PoolTitleRow
                      title={`${pool.homeTeam || 'Team A'} vs ${pool.awayTeam || 'Team B'}`}
                      currencyBadge={poolExplanation.currencyBadge}
                      marketTypeBadge={{
                        label: pool.predictedOutcome || 'Unknown', // Use actual predicted outcome
                        color: poolExplanation.marketTypeBadge.color,
                        bgColor: poolExplanation.marketTypeBadge.bgColor
                      }}
                      league={pool.eventDetails?.league || 'Unknown League'}
                      time={pool.eventDetails?.startTime ? pool.eventDetails.startTime.toLocaleTimeString('en-GB', { 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        timeZone: 'UTC' 
                      }) + ' UTC' : 'TBD'}
                      odds={(pool.odds / 100).toFixed(2)}
                      className="mb-4"
                    />
                  )
                )}
                
                {/* Pool Status Banner */}
                {contractData && (
                  <PoolStatusBanner 
                    pool={{
                      id: parseInt(poolId),
                      settled: (contractData.flags & 1) !== 0, // Bit 0: settled
                      creatorSideWon: (contractData.flags & 2) !== 0, // Bit 1: creatorSideWon
                      eventStartTime: contractData.eventStartTime,
                      eventEndTime: contractData.eventEndTime,
                      bettingEndTime: contractData.bettingEndTime,
                      arbitrationDeadline: contractData.arbitrationDeadline,
                      result: contractData.result,
                      resultTimestamp: contractData.resultTimestamp,
                      oracleType: contractData.oracleType === 0 ? 'GUIDED' : 'OPEN',
                      marketId: contractData.marketId
                    }}
                    className="mb-6"
                  />
                )}
                    </div>
              
              {/* Creator Prediction - Core Mechanic */}
              <div className="mb-4 p-3 sm:p-4 bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-lg">
                <div className="text-xs sm:text-sm text-red-400 font-medium mb-2">🎯 Creator&apos;s Position:</div>
                <div className="text-base sm:text-lg font-bold text-white mb-2">
                  {poolExplanation?.creatorPosition || `Creator believes "${pool.title}" WON'T happen`}
                      </div>
                <div className="text-xs sm:text-sm text-gray-400 mb-3">
                  Challenging users who think it WILL happen. Dare to challenge?
                    </div>
                
                {/* Pool Economics - Real Data */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 p-2 sm:p-3 bg-gray-800/30 rounded border border-gray-700/30">
                  <div className="text-center">
                    <div className="text-xs text-gray-400">Creator Stake</div>
                    <div className="text-sm sm:text-lg font-bold text-white">
                      {creatorStakeFormatted > 1000 
                        ? `${(creatorStakeFormatted / 1000).toFixed(1)}K` 
                        : creatorStakeFormatted.toFixed(0)} {pool.currency}
                    </div>
                    <div className="text-xs text-gray-400">Risked by creator</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400">Current Bets</div>
                    <div className="text-sm sm:text-lg font-bold text-cyan-400">
                      {totalBettorStakeFormatted > 1000 
                        ? `${(totalBettorStakeFormatted / 1000).toFixed(1)}K` 
                        : totalBettorStakeFormatted.toFixed(0)} {pool.currency}
                    </div>
                    <div className="text-xs text-gray-400">Total bet volume</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400">
                      {address === pool.creator.address ? 'Your Potential Win' : 'Creator\'s Potential Win'}
                    </div>
                    <div className="text-sm sm:text-lg font-bold text-yellow-400">
                      {potentialWinFormatted > 1000 
                        ? `${(potentialWinFormatted / 1000).toFixed(1)}K` 
                        : potentialWinFormatted.toFixed(0)} {pool.currency}
                    </div>
                    <div className="text-xs text-gray-400">
                      {address === pool.creator.address ? 'If you win' : 'If creator wins'}
                  </div>
                </div>
                  </div>
            </div>

            {/* Enhanced Pool Progress Bar */}
            <div className="mb-4 p-4 sm:p-6 bg-gradient-to-br from-gray-800/50 to-gray-700/50 rounded-xl border border-gray-600/30 backdrop-blur-sm shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-300">Pool Fill Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white">
                    {fillPercentage.toFixed(1)}%
                </span>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              </div>
              </div>
              <div className="w-full bg-gray-700/50 rounded-full h-4 mb-3 relative overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 h-4 rounded-full transition-all duration-1000 relative overflow-hidden"
                  style={{ width: `${Math.min(fillPercentage, 100)}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/50 to-blue-400/50 animate-pulse"></div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>
                  {(creatorStakeFormatted + totalBettorStakeFormatted).toFixed(2)} {pool.currency} Filled
                </span>
                <span>
                  {maxPoolSizeFormatted.toFixed(2)} {pool.currency} Capacity
                </span>
              </div>
            </div>

            {/* Enhanced Challenge Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-6 bg-gradient-to-br from-gray-800/40 to-gray-700/40 rounded-xl border border-gray-600/30 backdrop-blur-sm shadow-lg">
              <div className="text-center group hover:scale-105 transition-transform">
                <div className="text-xl sm:text-3xl font-bold text-white mb-1 group-hover:text-red-400 transition-colors">{defeatedCount}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Defeated</div>
                <div className="w-full h-0.5 bg-red-500/20 rounded-full mt-2"></div>
              </div>
              <div className="text-center group hover:scale-105 transition-transform">
                <div className="text-xl sm:text-3xl font-bold text-green-400 mb-1 group-hover:text-green-300 transition-colors">{pool.creator.successRate.toFixed(1)}%</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Creator Success</div>
                <div className="w-full h-0.5 bg-green-500/20 rounded-full mt-2"></div>
              </div>
              <div className="text-center group hover:scale-105 transition-transform">
                <div className="text-xl sm:text-3xl font-bold text-yellow-400 mb-1 group-hover:text-yellow-300 transition-colors">{(pool.odds / 100).toFixed(2)}x</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Odds</div>
                <div className="w-full h-0.5 bg-yellow-500/20 rounded-full mt-2"></div>
              </div>
              <div className="text-center group hover:scale-105 transition-transform">
                <div className="text-xl sm:text-3xl font-bold text-cyan-400 mb-1 group-hover:text-cyan-300 transition-colors">
                  {challengersCount}
                </div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Challengers</div>
                <div className="w-full h-0.5 bg-cyan-500/20 rounded-full mt-2"></div>
              </div>
            </div>

            {/* Enhanced Time Remaining */}
            {pool.eventDetails && (
              <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl border border-cyan-500/30 backdrop-blur-sm shadow-lg">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                  <div className="text-sm font-medium text-gray-300 uppercase tracking-wider">Time Remaining</div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                    </div>
                <div className="flex items-center justify-center gap-3 sm:gap-6 text-2xl sm:text-4xl font-bold text-cyan-400">
                  <div className="text-center group hover:scale-110 transition-transform">
                    <div className="bg-cyan-500/20 rounded-lg px-3 py-2 group-hover:bg-cyan-500/30 transition-colors">{timeLeft.days}</div>
                    <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Days</div>
                  </div>
                  <div className="text-cyan-400 animate-pulse">:</div>
                  <div className="text-center group hover:scale-110 transition-transform">
                    <div className="bg-cyan-500/20 rounded-lg px-3 py-2 group-hover:bg-cyan-500/30 transition-colors">{timeLeft.hours}</div>
                    <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Hours</div>
                  </div>
                  <div className="text-cyan-400 animate-pulse">:</div>
                  <div className="text-center group hover:scale-110 transition-transform">
                    <div className="bg-cyan-500/20 rounded-lg px-3 py-2 group-hover:bg-cyan-500/30 transition-colors">{timeLeft.minutes}</div>
                    <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Minutes</div>
                </div>
              </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-800/30 p-1 rounded-lg">
          {[
            { id: 'bet', label: 'Place Bet', icon: BanknotesIcon },
            { id: 'analysis', label: 'Analysis', icon: ChartBarIcon },
            { id: 'settlement', label: 'Settlement', icon: TrophyIcon },
            { id: 'liquidity', label: 'Liquidity', icon: ScaleIcon }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "bet" | "liquidity" | "analysis" | "settlement")}
              className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-all text-xs sm:text-sm ${
                activeTab === tab.id
                  ? 'bg-cyan-500 text-black shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <tab.icon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-4 sm:p-8">
          {activeTab === 'bet' && (
            <div className="space-y-6">
              {/* Betting Interface */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Betting Options */}
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Choose Your Position</h3>
                    <p className="text-sm sm:text-base text-gray-400">
                      Challenge the creator or agree with their prediction
                    </p>
                    {!canBet && (
                      <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                        <p className="text-red-400 text-sm font-medium">
                          {isEventStarted ? 'Event has started - betting closed' : 
                           isPoolFilled ? 'Pool is 100% filled - no more bets allowed' : 
                           'Betting period has ended'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Betting Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* YES - Challenge Creator */}
                    <div className={`
                      p-4 sm:p-6 rounded-xl border-2 transition-all relative overflow-hidden group
                      ${!canBet 
                        ? 'bg-gray-800/50 border-gray-600/30 cursor-not-allowed opacity-50' 
                        : betType === 'yes' 
                          ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/50 shadow-lg shadow-green-500/20 cursor-pointer' 
                          : 'bg-gray-700/30 border-gray-600/50 hover:border-green-500/30 hover:bg-green-500/10 cursor-pointer'
                      }
                    `} onClick={() => canBet && setBetType('yes')}>
                      {betType === 'yes' && (
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent animate-pulse"></div>
                      )}
                      <div className="text-center space-y-3 relative z-10">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                          <HandRaisedIcon className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
                        </div>
                        <div>
                          <div className="text-lg sm:text-xl font-bold text-green-400 mb-1">YES - CHALLENGE</div>
                          <div className="text-xs sm:text-sm text-blue-400">I think it WILL happen</div>
                          <div className="text-xs text-green-400/80 mt-1">
                            Challenge the creator&apos;s prediction
                          </div>
                        </div>
                        <div className="text-sm sm:text-base font-bold text-white bg-green-500/20 rounded-lg py-2 px-3">
                          Win {(pool.odds / 100).toFixed(2)}x your stake
                        </div>
                      </div>
                    </div>

                    {/* NO - Agree with Creator */}
                    <div className={`
                      p-4 sm:p-6 rounded-xl border-2 transition-all relative overflow-hidden group
                      ${!canBet 
                        ? 'bg-gray-800/50 border-gray-600/30 cursor-not-allowed opacity-50' 
                        : betType === 'no' 
                          ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/50 shadow-lg shadow-blue-500/20 cursor-pointer' 
                          : 'bg-gray-700/30 border-gray-600/50 hover:border-blue-500/30 hover:bg-blue-500/10 cursor-pointer'
                      }
                    `} onClick={() => canBet && setBetType('no')}>
                      {betType === 'no' && (
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent animate-pulse"></div>
                      )}
                      <div className="text-center space-y-3 relative z-10">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                          <CheckIcon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                        </div>
                        <div>
                          <div className="text-lg sm:text-xl font-bold text-blue-400 mb-1">NO - AGREE</div>
                          <div className="text-xs sm:text-sm text-blue-400">I think it WON&apos;T happen</div>
                          <div className="text-xs text-blue-400/80 mt-1">
                            Support the creator&apos;s prediction
                          </div>
                        </div>
                                                  <div className="text-sm sm:text-base font-bold text-white bg-blue-500/20 rounded-lg py-2 px-3">
                            Add liquidity
                          </div>
                      </div>
                    </div>
              </div>
              </div>

                {/* Right Column - Bet Amount & Preview */}
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Bet Amount</h3>
                    <p className="text-sm sm:text-base text-blue-400">
                      Enter your stake amount
                    </p>
                      </div>

                  {/* Bet Amount Input */}
                  <div className="space-y-4">
                    <div className="relative group">
                      <input
                        type="number"
                        value={betAmount}
                        onChange={(e) => canBet && setBetAmount(Number(e.target.value))}
                        placeholder="0.00"
                        disabled={!canBet}
                        className={`w-full px-4 py-3 sm:py-4 bg-bg-card border border-border-input rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-lg sm:text-xl group-hover:border-primary/30 transition-all backdrop-blur-sm ${
                          !canBet ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400 text-sm sm:text-base font-medium">
                        {pool.currency}
                      </div>
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    </div>

                    {/* Quick Amount Buttons */}
                    <div className="grid grid-cols-4 gap-2">
                      {[10, 50, 100, 500].map(amount => (
                        <button 
                          key={amount}
                          onClick={() => canBet && setBetAmount(amount)}
                          disabled={!canBet}
                          className={`px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm transition-all font-medium ${
                            !canBet 
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50' 
                              : betAmount === amount 
                              ? 'bg-primary text-black shadow-lg' 
                              : 'bg-bg-card hover:bg-bg-card/80 text-white hover:scale-105 border border-border-card'
                          }`}
                        >
                          {amount}
                        </button>
                      ))}
                    </div>

                    {/* Bet Preview */}
                    {betAmount > 0 && betType && (
                      <div className="p-4 bg-bg-card rounded-xl border border-border-card backdrop-blur-sm">
                        <div className="text-sm sm:text-base font-medium text-white mb-3 flex items-center gap-2">
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                          Bet Preview
                        </div>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between items-center p-2 bg-bg-card/50 rounded-lg border border-border-card/30">
                            <span className="text-text-secondary">Your Stake:</span>
                            <span className="text-text-primary font-bold">{betAmount.toLocaleString()} {pool.currency}</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-success/10 rounded-lg border border-success/20">
                            <span className="text-text-secondary">Potential Win:</span>
                            <span className="text-success font-bold">
                              {betType === 'yes' 
                                ? (betAmount * (pool.odds / 100)).toLocaleString()
                                : (betAmount / ((pool.odds / 100) - 1)).toLocaleString() // Correct NO bet calculation: stake / (odds - 1)
                              } {pool.currency}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-primary/10 rounded-lg border border-primary/20">
                            <span className="text-text-secondary">Profit:</span>
                            <span className="text-primary font-bold">
                              +{betType === 'yes' 
                                ? (betAmount * ((pool.odds / 100) - 1)).toLocaleString()
                                : ((betAmount / ((pool.odds / 100) - 1)) - betAmount).toLocaleString() // Correct NO bet profit: potential win - stake
                              } {pool.currency}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                      </div>
                    </div>

              {/* Place Bet Button */}
              <div className="text-center">
                <button
                  onClick={handlePlaceBet}
                  disabled={!canBet || !betType || betAmount <= 0}
                  className={`
                    relative px-8 py-3 sm:py-4 rounded-xl font-bold text-lg sm:text-xl transition-all transform group overflow-hidden
                    ${!canBet 
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50' 
                      : betType && betAmount > 0
                      ? 'bg-gradient-primary hover:brightness-110 text-black shadow-lg hover:shadow-primary/25 hover:scale-105 active:scale-95'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  {betType && betAmount > 0 && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {betType === 'yes' ? '🎯 Challenge Creator' : betType === 'no' ? '🤝 Support Creator' : 'Place Bet'}
                    {betType && betAmount > 0 && (
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
                    )}
                  </span>
                </button>
                
                {betType && betAmount > 0 && (
                  <p className="text-xs text-gray-400 mt-2">
                    {betType === 'yes' 
                      ? `You're betting that "${pool.title}" WILL happen` 
                      : `You're providing liquidity, betting it WON'T happen`
                    }
                  </p>
                )}
              </div>
              
               {/* Bet Display or Claim Rewards - Conditional based on pool status */}
               <div className="mt-8">
                 {(() => {
                   
                  if (poolStatusType && (poolStatusType === 'creator_won' || poolStatusType === 'bettor_won' || poolStatusType === 'settled')) {
                    return <ClaimRewards pool={{
                      id: pool.id,
                      currency: pool.currency,
                      settled: poolStatusType === 'settled',
                      eventEndTime: pool.eventDetails?.endTime?.getTime() ? Math.floor(pool.eventDetails.endTime.getTime() / 1000) : 0,
                      status: poolStatusType
                    }} />;
                  } else {
                    return <BetDisplay poolId={poolId} />;
                  }
                 })()}
              </div>
                          </div>
          )}

            {activeTab === 'analysis' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Market Analysis</h3>
                  <p className="text-sm sm:text-base text-gray-400">
                    Detailed analysis and insights for this prediction
                  </p>
                            </div>

                {/* Analysis Content */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="p-4 sm:p-6 bg-gray-700/30 rounded-lg border border-gray-600/30">
                    <h4 className="text-lg sm:text-xl font-bold text-white mb-3">Creator Track Record</h4>
                    <div className="space-y-3 text-sm sm:text-base">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Success Rate:</span>
                        <span className="text-green-400">{pool.creator.successRate.toFixed(1)}%</span>
                            </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Pools:</span>
                        <span className="text-white">{pool.creator.totalPools}</span>
                          </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Volume:</span>
                        <span className="text-cyan-400">
                          {pool.creator.totalVolume >= 1000 
                            ? `${(pool.creator.totalVolume / 1000).toFixed(1)}k` 
                            : pool.creator.totalVolume.toFixed(1)} {pool.currency}
                        </span>
                        </div>
                      </div>
                  </div>

                  <div className="p-4 sm:p-6 bg-gray-700/30 rounded-lg border border-gray-600/30">
                    <h4 className="text-lg sm:text-xl font-bold text-white mb-3">Market Sentiment</h4>
                    <div className="space-y-3 text-sm sm:text-base">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Participants:</span>
                        <span className="text-white">0</span>
              </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Defeated:</span>
                        <span className="text-red-400">{pool.defeated}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Odds:</span>
                        <span className="text-yellow-400">{(pool.odds / 100).toFixed(2)}x</span>
                      </div>
                    </div>
                  </div>
          </div>

                {/* Additional Analysis */}
                <div className="p-4 sm:p-6 bg-gray-700/30 rounded-lg border border-gray-600/30">
                  <h4 className="text-lg sm:text-xl font-bold text-white mb-3">Risk Assessment</h4>
                  <div className="text-sm sm:text-base text-gray-300 space-y-2">
                    <p>
                      This creator has a {pool.creator.successRate.toFixed(1)}% success rate, meaning they&apos;ve been right 
                      in {pool.creator.successRate.toFixed(1)}% of their predictions. This suggests they have a good track 
                      record of identifying unlikely events.
                    </p>
                    <p>
                              The {(pool.odds / 100).toFixed(1)}x odds indicate the creator is offering a {(((pool.odds / 100) - 1) * 100).toFixed(0)}% 
                      premium to challengers, suggesting they have high confidence in their prediction.
                    </p>
                  </div>
              </div>

              </div>
            )}

            {activeTab === 'settlement' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Settlement Results</h3>
                  <p className="text-sm sm:text-base text-gray-400">
                    View detailed settlement information and transparency data
                  </p>
                </div>

                <SettlementResults 
                  poolId={poolId}
                  className="w-full"
                />
              </div>
            )}
            
            {activeTab === 'liquidity' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Liquidity Pool</h3>
                  <p className="text-sm sm:text-base text-gray-400">
                    Provide liquidity and earn from trading fees
                  </p>
                  </div>

                {/* Liquidity Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6">
                  <div className="p-4 sm:p-6 bg-gray-700/30 rounded-lg border border-gray-600/30 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-cyan-400 mb-2">
                      {totalLiquidityFormatted > 1000 
                        ? `${(totalLiquidityFormatted / 1000).toFixed(1)}K` 
                        : totalLiquidityFormatted.toFixed(0)}
                </div>
                    <div className="text-sm sm:text-base text-gray-400">Total Liquidity</div>
              </div>
                  <div className="p-4 sm:p-6 bg-gray-700/30 rounded-lg border border-gray-600/30 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-green-400 mb-2">
                      {pool.creator.successRate.toFixed(1)}%
                </div>
                    <div className="text-sm sm:text-base text-gray-400">Creator Success Rate</div>
                </div>
                  <div className="p-4 sm:p-6 bg-gray-700/30 rounded-lg border border-gray-600/30 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-2">
                      {totalBetsCount}
              </div>
                    <div className="text-sm sm:text-base text-gray-400">Total Bets</div>
                  </div>
                  <div className="p-4 sm:p-6 bg-gray-700/30 rounded-lg border border-gray-600/30 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-purple-400 mb-2">
                      {totalVolumeFormatted > 1000 
                        ? `${(totalVolumeFormatted / 1000).toFixed(1)}K` 
                        : totalVolumeFormatted.toFixed(0)}
              </div>
                    <div className="text-sm sm:text-base text-gray-400">Total Volume</div>
                  </div>
              </div>

                {/* LP Information */}
                <div className="p-4 sm:p-6 bg-gray-700/30 rounded-lg border border-gray-600/30">
                  <h4 className="text-lg sm:text-xl font-bold text-white mb-3">How LP Works</h4>
                  <div className="text-sm sm:text-base text-gray-300 space-y-3">
                    <p>
                      As a liquidity provider, you agree with the creator&apos;s prediction and share in the 
                      rewards when they&apos;re correct. Your returns are proportional to your stake in the pool.
                    </p>
                    <p>
                      <strong>Risk:</strong> If the creator is wrong, you lose your stake to the winning bettors.
                    </p>
                    <p>
                      <strong>Reward:</strong> If the creator is right, you get your stake back plus a proportional 
                      share of the bettor stakes, based on your stake in the total creator-side pool.
                    </p>
                    <p>
                      <strong>Example:</strong> If you stake 100 {pool.currency} and the odds are {(pool.odds / 100).toFixed(2)}x, 
                      you can win up to {(100 * ((pool.odds / 100) - 1)).toFixed(0)} {pool.currency} in profit 
                      (plus your original 100 {pool.currency} stake back).
                    </p>
                    </div>
                    </div>

                {/* Liquidity Providers Section */}
                {pool.liquidityProviders && pool.liquidityProviders.length > 0 && (
                  <div className="p-4 sm:p-6 bg-gray-700/30 rounded-lg border border-gray-600/30">
                    <h4 className="text-lg sm:text-xl font-bold text-white mb-4">Liquidity Providers</h4>
                    <div className="space-y-3">
                      {pool.liquidityProviders.map((lp, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-600/20">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-purple-400">LP</span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">
                                {lp.address.slice(0, 6)}...{lp.address.slice(-4)}
                              </div>
                              <div className="text-xs text-gray-400">
                                {new Date(lp.timestamp * 1000).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-purple-400">
                              {parseFloat(lp.stake).toFixed(2)} {pool.currency}
                            </div>
                            <div className="text-xs text-gray-400">Stake</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

        </div>
      </div>

      {/* Sidebar */}
          <div className="space-y-6">



        {/* Comments Section */}
        <div className="glass-card space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Discussion</h3>
            <div className="text-sm text-gray-400">
              {hasUserBet ? 'You can comment after betting' : 'Bet to join the discussion'}
                </div>
          </div>

          {/* Add Comment */}
          {hasUserBet && (
                <div className="space-y-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowCommentBox(!showCommentBox)}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
                >
                  <ChatBubbleOvalLeftIcon className="w-4 h-4" />
                  Add Comment
                </button>
                {userBetAmount > 0 && (
                  <div className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                    Verified Better • {userBetAmount} {pool.currency}
                    </div>
                )}
                    </div>

              {showCommentBox && (
                <div className="p-4 bg-bg-card/50 rounded-lg border border-border-card/30 space-y-4 backdrop-blur-sm">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your analysis and reasoning..."
                    className="w-full px-4 py-3 bg-bg-card border border-border-input rounded-lg text-white focus:outline-none focus:border-primary/50 resize-none backdrop-blur-sm"
                    rows={3}
                  />

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">Sentiment:</span>
                      <select
                        value={commentSentiment}
                        onChange={(e) => setCommentSentiment(e.target.value as 'bullish' | 'bearish' | 'neutral')}
                        className="px-3 py-1 bg-bg-card border border-border-input rounded text-white text-sm backdrop-blur-sm"
                      >
                        <option value="bullish">Bullish</option>
                        <option value="neutral">Neutral</option>
                        <option value="bearish">Bearish</option>
                      </select>
                  </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">Confidence:</span>
                    <input
                        type="range"
                        min="1"
                        max="100"
                        value={commentConfidence}
                        onChange={(e) => setCommentConfidence(parseInt(e.target.value))}
                        className="w-20"
                      />
                      <span className="text-sm text-white">{commentConfidence}%</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowCommentBox(false)}
                      className="px-4 py-2 text-gray-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddComment}
                      disabled={!comment.trim() || submittingComment}
                      className="px-4 py-2 bg-primary text-black rounded-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {submittingComment ? (
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      ) : (
                        <PaperAirplaneIcon className="w-4 h-4" />
                      )}
                      Post Comment
                    </button>
                    </div>
                    </div>
              )}
                  </div>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <ChatBubbleOvalLeftIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No comments yet. Be the first to share your analysis!</p>
                </div>
            ) : (
              comments.map(renderComment)
              )}
          </div>
        </div>
        </div>
      </div>
      
    </div>
  );
}
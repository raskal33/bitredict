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
// import { PoolService } from "@/services/poolService"; // Unused import
import { usePools } from "@/hooks/usePools";
import { useBITRToken } from "@/hooks/useBITRToken";
import { CONTRACTS } from "@/contracts";
import { parseUnits } from "viem";
import { toast } from "react-hot-toast";

export default function BetPage() {
  const { address } = useAccount();
  const params = useParams();
  const poolId = params.id as string;
  const { placeBet } = usePools();
  const { approve, isConfirmed: isApproveConfirmed, getAllowance } = useBITRToken();
  
  // Helper function to check if BITR approval is needed
  const needsApproval = (amount: string): boolean => {
    if (!pool || pool.currency !== 'BITR') return false;
    const allowance = getAllowance(CONTRACTS.BITREDICT_POOL.address);
    if (!allowance) return true;
    const requiredAmount = parseUnits(amount, 18);
    return allowance < requiredAmount;
  };
  
  const [activeTab, setActiveTab] = useState<"bet" | "liquidity" | "analysis">("bet");
  const [betAmount, setBetAmount] = useState<number>(0);
  const [hasUserBet, setHasUserBet] = useState(false);
  const [userBetAmount, setUserBetAmount] = useState(0);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [comment, setComment] = useState("");
  const [commentSentiment, setCommentSentiment] = useState<'bullish' | 'bearish' | 'neutral'>('neutral');
  const [commentConfidence, setCommentConfidence] = useState(75);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [pool, setPool] = useState<Pool | null>(null);
  const [comments] = useState<Comment[]>([]);
  const [betType, setBetType] = useState<'yes' | 'no' | null>(null);
  
  // Backend formatted data to avoid scientific notation
  const [creatorStakeFormatted, setCreatorStakeFormatted] = useState<number>(0);
  const [totalBettorStakeFormatted, setTotalBettorStakeFormatted] = useState<number>(0);
  const [potentialWinFormatted, setPotentialWinFormatted] = useState<number>(0);
  const [poolFillProgressFormatted, setPoolFillProgressFormatted] = useState<number>(0);
  
  // Rate limiting for API calls
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const FETCH_COOLDOWN = 5000; // 5 seconds between fetches



  const fetchPoolData = useCallback(async () => {
    // Rate limiting check
    const now = Date.now();
    if (now - lastFetchTime < FETCH_COOLDOWN) {
      console.log('Fetch cooldown active, skipping request');
      return;
    }
    setLastFetchTime(now);
    
    try {
      setLoading(true);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      // Fetch pool data from guided markets API
      const poolResponse = await fetch(`/api/guided-markets/pools/${poolId}`, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!poolResponse.ok) {
        throw new Error(`Failed to fetch pool data: HTTP ${poolResponse.status}`);
      }
      const poolResult = await poolResponse.json();
      const poolData = poolResult.data.pool;
      
      // Fetch pool progress data
      const progressResponse = await fetch(`/api/guided-markets/pools/${poolId}/progress`, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      const progressData = progressResponse.ok ? await progressResponse.json() : null;
      
      clearTimeout(timeoutId);
      
      // Transform real data to Pool interface - use backend formatted data
      const progressInfo = progressData?.data || {};
      
      // Use backend formatted numbers to avoid scientific notation
      const creatorStakeNum = parseFloat(poolData.creatorStake || "0");
      const totalBettorStakeNum = parseFloat(poolData.totalBettorStake || "0");
      const potentialWinNum = parseFloat(poolData.potentialWinAmount || "0");
      const poolFillProgressNum = poolData.poolFillProgress || 0;
      
      // Set state variables
      setCreatorStakeFormatted(creatorStakeNum);
      setTotalBettorStakeFormatted(totalBettorStakeNum);
      setPotentialWinFormatted(potentialWinNum);
      setPoolFillProgressFormatted(poolFillProgressNum);
      const getDifficultyTier = (odds: number) => {
        if (odds >= 5.0) return "legendary";
        if (odds >= 3.0) return "very_hard";
        if (odds >= 2.0) return "hard";
        if (odds >= 1.5) return "medium";
        return "easy";
      };
      
      // Create a better title using bet market type and readable outcome
      const title = poolData.betMarketType 
        ? `${poolData.betMarketType}: ${poolData.predictedOutcome}`
        : poolData.predictedOutcome || `${poolData.league} - ${poolData.category}`;
      
      const transformedPool: Pool = {
        id: poolId,
        title: title,
        description: `Creator believes "${poolData.predictedOutcome}" WON'T happen. Challenge them if you think it WILL!`,
        category: poolData.category || "sports",
        creator: {
          address: poolData.creator,
          username: `${poolData.creator.slice(0, 6)}...${poolData.creator.slice(-4)}`,
          avatar: "/logo.png",
          reputation: 4.2,
          totalPools: 12,
          successRate: 73.5,
          challengeScore: Math.round(poolData.odds * 20),
          totalVolume: creatorStakeNum, // Use formatted backend data
          badges: ["verified", "active_creator"],
          createdAt: poolData.createdAt || new Date().toISOString(),
          bio: "Active prediction market creator"
        },
        challengeScore: Math.round(poolData.odds * 20),
        qualityScore: 88,
        difficultyTier: getDifficultyTier(poolData.odds),
        predictedOutcome: poolData.predictedOutcome,
        creatorPrediction: "no", // Creator thinks it WON'T happen
        odds: poolData.odds, // Already in decimal format
        participants: (progressInfo.bettorCount || 0) + (progressInfo.lpCount || 0),
        volume: totalBettorStakeNum, // Use formatted backend data for bettor stakes
        image: poolData.category === "football" ? "⚽" : poolData.category === "basketball" ? "🏀" : "🎯",
        cardTheme: poolData.category === "football" ? "green" : poolData.category === "basketball" ? "orange" : "purple",
        tags: [poolData.category, poolData.league, poolData.region, poolData.betMarketType].filter(Boolean),
        trending: progressInfo.fillPercentage > 50,
        boosted: false,
        boostTier: 0,
        socialStats: {
          comments: 0,
          likes: Math.floor(Math.random() * 20),
          views: progressInfo.bettorCount * 3 || 10,
          shares: Math.floor(Math.random() * 5)
        },
        defeated: 0,
        currency: poolData.usesBitr ? "BITR" : "STT",
        endDate: poolData.eventEndTime ? new Date(poolData.eventEndTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        poolType: "single",
        comments: [],
        eventDetails: {
          league: poolData.league,
          region: poolData.region,
          venue: poolData.venue || "TBD",
          startTime: new Date(poolData.eventStartTime),
          endTime: new Date(poolData.eventEndTime)
        }
      };
      
      setPool(transformedPool);
      
      // Calculate time left using real event end time
      const now = Date.now();
      const endTime = new Date(poolData.eventEndTime).getTime();
      const timeRemaining = Math.max(0, endTime - now);
      
      if (timeRemaining > 0) {
        const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
        
        setTimeLeft({ days, hours, minutes, seconds });
      }
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('Pool data fetch timed out');
      } else {
        console.error('Error fetching pool data:', error);
        console.error('Pool not found or failed to load:', poolId);
      }
      setPool(null);
    } finally {
      setLoading(false);
    }
  }, [poolId, lastFetchTime, FETCH_COOLDOWN]);

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
  }, [fetchPoolData, checkUserBetStatus]);

  // State to track if we're waiting for approval to complete
  const [waitingForApproval, setWaitingForApproval] = useState(false);
  const [pendingBetData, setPendingBetData] = useState<{amount: number, type: 'yes' | 'no'} | null>(null);

  // Handle BITR approval confirmation and proceed with bet
  useEffect(() => {
    if (isApproveConfirmed && waitingForApproval && pendingBetData && address) {
      const proceedWithBet = async () => {
        try {
          console.log('Approval confirmed, placing bet with data:', pendingBetData);
          toast.loading('Placing bet...', { id: 'bet-tx' });
          const useBitr = pool?.currency === 'BITR';
          await placeBet(parseInt(poolId), pendingBetData.amount.toString(), useBitr);
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
  }, [isApproveConfirmed, waitingForApproval, pendingBetData, address, poolId, placeBet, fetchPoolData, checkUserBetStatus, pool?.currency]);

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
      console.log('Placing bet:', { address, poolId, betType, betAmount });
      
      // Show loading toast
      toast.loading('Preparing transaction...', { id: 'bet-tx' });
      
      // Check if this is a BITR pool and if approval is needed
      if (pool?.currency === 'BITR' && needsApproval(betAmount.toString())) {
        console.log('BITR approval needed, starting approval process...');
        
        // Store bet data for after approval
        setPendingBetData({ amount: betAmount, type: betType });
        setWaitingForApproval(true);
        
        toast.loading('Approving BITR tokens...', { id: 'bet-tx' });
        await approve(CONTRACTS.BITREDICT_POOL.address, betAmount.toString());
        
        // The useEffect will handle the bet placement after approval
        toast.loading('Waiting for approval confirmation...', { id: 'bet-tx' });
        return;
      }
      
      // For STT pools or if no approval needed, place bet directly
      console.log('No approval needed, placing bet directly...');
      const useBitr = pool?.currency === 'BITR';
      await placeBet(parseInt(poolId), betAmount.toString(), useBitr);
      
      // Success will be handled by the wagmi transaction hooks
      toast.success('Transaction submitted! Please wait for confirmation.', { id: 'bet-tx' });
      
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

              {comment.author.badges.map((badge, index) => (
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                    <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading challenge...</p>
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
                      {pool.creator.badges.slice(0, 2).map((badge, index) => (
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
                      {(pool.creator.totalVolume / 1000).toFixed(0)}k volume
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

            {/* Pool Title & Description */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-xs sm:text-sm px-2 sm:px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full">
                  {pool.category}
                </span>
                <div className="flex gap-1">
                  {pool.tags?.map((tag, index) => (
                    <span key={index} className="text-xs px-1 sm:px-2 py-1 bg-gray-700/50 text-gray-400 rounded-full">
                      #{tag}
                    </span>
                  ))}
                      </div>
                    </div>
              
              {/* Creator Prediction - Core Mechanic */}
              <div className="mb-4 p-3 sm:p-4 bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-lg">
                <div className="text-xs sm:text-sm text-red-400 font-medium mb-2">🎯 Creator&apos;s Position:</div>
                <div className="text-base sm:text-lg font-bold text-white mb-2">
                  Creator believes <span className="text-red-400">&quot;{pool.title}&quot; WON&apos;T happen</span>
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
                    <div className="text-xs text-gray-400">Potential Win</div>
                    <div className="text-sm sm:text-lg font-bold text-yellow-400">
                      {potentialWinFormatted > 1000 
                        ? `${(potentialWinFormatted / 1000).toFixed(1)}K` 
                        : potentialWinFormatted.toFixed(0)} {pool.currency}
                    </div>
                    <div className="text-xs text-gray-400">If you win</div>
                  </div>
                </div>
                  </div>
              
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">{pool.title}</h1>
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed">{pool.description}</p>
            </div>

            {/* Pool Progress Bar */}
            <div className="mb-4 p-3 sm:p-4 bg-gradient-to-r from-gray-800/40 to-gray-700/40 rounded-lg border border-gray-600/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Pool Fill Progress</span>
                <span className="text-sm font-medium text-white">
                  {poolFillProgressFormatted.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-500 relative overflow-hidden"
                  style={{ width: `${Math.min(100, poolFillProgressFormatted)}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>
                  {totalBettorStakeFormatted > 1000 
                    ? `${(totalBettorStakeFormatted / 1000).toFixed(1)}K` 
                    : totalBettorStakeFormatted.toFixed(0)} {pool.currency} filled
                </span>
                <span>
                  {creatorStakeFormatted > 1000 
                    ? `${(creatorStakeFormatted / 1000).toFixed(1)}K` 
                    : creatorStakeFormatted.toFixed(0)} {pool.currency} capacity
                </span>
              </div>
            </div>

            {/* Challenge Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-white">{pool.defeated}</div>
                <div className="text-xs text-gray-400">Defeated</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-green-400">{pool.creator.successRate.toFixed(1)}%</div>
                <div className="text-xs text-gray-400">Creator Success</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-yellow-400">{pool.odds.toFixed(2)}x</div>
                <div className="text-xs text-gray-400">Odds</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-cyan-400">{pool.participants}</div>
                <div className="text-xs text-gray-400">Challengers</div>
              </div>
            </div>

            {/* Time Remaining */}
            {pool.eventDetails && (
              <div className="text-center p-3 sm:p-4 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-lg border border-cyan-500/20">
                <div className="text-xs sm:text-sm text-gray-400 mb-2">Time Remaining</div>
                <div className="flex items-center justify-center gap-2 sm:gap-4 text-lg sm:text-2xl font-bold text-cyan-400">
                  <div className="text-center">
                    <div>{timeLeft.days}</div>
                    <div className="text-xs text-gray-400">Days</div>
                    </div>
                  <div className="text-cyan-400">:</div>
                  <div className="text-center">
                    <div>{timeLeft.hours}</div>
                    <div className="text-xs text-gray-400">Hours</div>
                  </div>
                  <div className="text-cyan-400">:</div>
                  <div className="text-center">
                    <div>{timeLeft.minutes}</div>
                    <div className="text-xs text-gray-400">Minutes</div>
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
            { id: 'liquidity', label: 'Liquidity', icon: ScaleIcon }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "bet" | "liquidity" | "analysis")}
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
                  </div>

                  {/* Betting Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* YES - Challenge Creator */}
                    <div className={`
                      p-4 sm:p-6 rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden group
                      ${betType === 'yes' 
                        ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/50 shadow-lg shadow-green-500/20' 
                        : 'bg-gray-700/30 border-gray-600/50 hover:border-green-500/30 hover:bg-green-500/10'
                      }
                    `} onClick={() => setBetType('yes')}>
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
                          Win {pool.odds.toFixed(2)}x your stake
                        </div>
                      </div>
                    </div>

                    {/* NO - Agree with Creator */}
                    <div className={`
                      p-4 sm:p-6 rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden group
                      ${betType === 'no' 
                        ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/50 shadow-lg shadow-blue-500/20' 
                        : 'bg-gray-700/30 border-gray-600/50 hover:border-blue-500/30 hover:bg-blue-500/10'
                      }
                    `} onClick={() => setBetType('no')}>
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
                        onChange={(e) => setBetAmount(Number(e.target.value))}
                        placeholder="0.00"
                        className="w-full px-4 py-3 sm:py-4 bg-bg-card border border-border-input rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-lg sm:text-xl group-hover:border-primary/30 transition-all backdrop-blur-sm"
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
                          onClick={() => setBetAmount(amount)}
                          className={`px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm transition-all font-medium ${
                            betAmount === amount 
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
                                ? (betAmount * pool.odds).toLocaleString()
                                : (betAmount + (betAmount * 0.1)).toLocaleString() // Simplified for liquidity
                              } {pool.currency}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-primary/10 rounded-lg border border-primary/20">
                            <span className="text-text-secondary">Profit:</span>
                            <span className="text-primary font-bold">
                              +{betType === 'yes' 
                                ? (betAmount * (pool.odds - 1)).toLocaleString()
                                : (betAmount * 0.1).toLocaleString() // Simplified for liquidity
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
                  disabled={!betType || betAmount <= 0}
                  className={`
                    relative px-8 py-3 sm:py-4 rounded-xl font-bold text-lg sm:text-xl transition-all transform group overflow-hidden
                    ${betType && betAmount > 0
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
                        <span className="text-cyan-400">{(pool.creator.totalVolume / 1000).toFixed(0)}k {pool.currency}</span>
                        </div>
                      </div>
                  </div>

                  <div className="p-4 sm:p-6 bg-gray-700/30 rounded-lg border border-gray-600/30">
                    <h4 className="text-lg sm:text-xl font-bold text-white mb-3">Market Sentiment</h4>
                    <div className="space-y-3 text-sm sm:text-base">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Participants:</span>
                        <span className="text-white">{pool.participants}</span>
              </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Defeated:</span>
                        <span className="text-red-400">{pool.defeated}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Odds:</span>
                        <span className="text-yellow-400">{pool.odds}x</span>
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
                      The {pool.odds}x odds indicate the creator is offering a {((pool.odds - 1) * 100).toFixed(0)}% 
                      premium to challengers, suggesting they have high confidence in their prediction.
                    </p>
                  </div>
              </div>
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  <div className="p-4 sm:p-6 bg-gray-700/30 rounded-lg border border-gray-600/30 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-cyan-400 mb-2">
                      {pool.volume.toLocaleString()}
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
                      {pool.participants}
              </div>
                    <div className="text-sm sm:text-base text-gray-400">Active Participants</div>
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
                      <strong>Example:</strong> If you stake 100 {pool.currency} and the odds are {pool.odds}x, 
                      you can win up to {(100 * (pool.odds - 1)).toFixed(0)} {pool.currency} in profit 
                      (plus your original 100 {pool.currency} stake back).
                    </p>
                    </div>
                    </div>
              </div>
            )}
                  </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Social Stats */}
            <div className="glass-card">
              <h3 className="text-lg font-bold text-white mb-4">Community</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{pool.socialStats.comments}</div>
                  <div className="text-xs text-gray-400">Comments</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-400">{pool.socialStats.likes}</div>
                  <div className="text-xs text-gray-400">Likes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{pool.socialStats.views}</div>
                  <div className="text-xs text-gray-400">Views</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{pool.socialStats.shares}</div>
                  <div className="text-xs text-gray-400">Shares</div>
                </div>
              </div>
                  </div>

            {/* Event Details */}
            {pool.eventDetails && (
              <div className="glass-card">
                <h3 className="text-lg font-bold text-white mb-4">Event Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">League:</span>
                    <span className="text-white">{pool.eventDetails.league}</span>
                    </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Region:</span>
                    <span className="text-white">{pool.eventDetails.region}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Start:</span>
                    <span className="text-white">
                      {pool.eventDetails.startTime.toLocaleDateString()}
                      </span>
                    </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">End:</span>
                    <span className="text-white">
                      {pool.eventDetails.endTime.toLocaleDateString()}
                    </span>
                  </div>
                        </div>
                      </div>
            )}
                    </div>
                  </div>

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
  
  );
}
"use client";

import { useAccount } from "wagmi";
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  ClockIcon, 
  UsersIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  EyeIcon,
  ShareIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  CalendarIcon,
  UserIcon,
  BanknotesIcon,
  ScaleIcon,
  TrophyIcon,
  BoltIcon,
  ShieldCheckIcon,
  FireIcon,
  SparklesIcon,
  PaperAirplaneIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  ChatBubbleOvalLeftIcon,
  CurrencyDollarIcon,
  ChartBarIcon
} from "@heroicons/react/24/outline";
import { 
  HeartIcon as HeartSolid,
  StarIcon as StarSolid,
  FireIcon as FireSolid,
  TrophyIcon as TrophySolid,
  BoltIcon as BoltSolid,
  HandThumbUpIcon as ThumbUpSolid,
  HandThumbDownIcon as ThumbDownSolid
} from "@heroicons/react/24/solid";
import { Pool, Comment, UserBetData } from "@/lib/types";

export default function BetPage() {
  const { address } = useAccount();
  const params = useParams();
  const poolId = params.id as string;
  
  const [activeTab, setActiveTab] = useState<"bet" | "liquidity" | "analysis">("bet");
  const [betAmount, setBetAmount] = useState<string>("10");
  const [betSide, setBetSide] = useState<"yes" | "no" | null>(null);
  const [isLiked, setIsLiked] = useState(false);
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
  const [comments, setComments] = useState<Comment[]>([]);

  const fetchPoolData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/pools/${poolId}?include_social=true`);
      const data = await response.json();
      
      if (data.success) {
        setPool(data.data);
        setIsLiked(data.data.hasUserLiked);
        setComments(data.data.comments || []);
      } else {
        // Fallback to demo data
        setPool(getDemoPoolData());
      }
    } catch (error) {
      console.error('Error fetching pool data:', error);
      setPool(getDemoPoolData());
    } finally {
      setLoading(false);
    }
  }, [poolId]);

  const checkUserBetStatus = useCallback(async () => {
    if (!address) return;
    
    try {
      const response = await fetch(`/api/pools/${poolId}/user-bet?address=${address}`);
      const data = await response.json();
      
      if (data.success && data.data.hasBet) {
        setHasUserBet(true);
        setUserBetAmount(data.data.betAmount);
      }
    } catch (error) {
      console.error('Error checking bet status:', error);
    }
  }, [poolId, address]);

  useEffect(() => {
    fetchPoolData();
    checkUserBetStatus();
  }, [fetchPoolData, checkUserBetStatus]);

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

  const getDemoPoolData = (): Pool => ({
    id: poolId,
    title: "Bitcoin will reach $100,000 by March 2025",
    description: "Prediction market on Bitcoin reaching six-figure milestone before March 31, 2025. This challenge tests your ability to predict the macro crypto market trends and timing.",
    category: "crypto",
    creator: {
      address: "0x1234...5678",
      username: "CryptoSage",
      avatar: "/logo.png",
      reputation: 4.8,
      totalPools: 23,
      successRate: 78.3,
      challengeScore: 89,
      totalVolume: 450000,
      badges: ["legendary", "crypto_expert", "whale"],
      createdAt: "2024-01-15T10:30:00Z",
      bio: "Macro crypto analyst with 8 years of experience. Specialized in Bitcoin cycle analysis and institutional adoption trends."
    },
    challengeScore: 89,
    qualityScore: 94,
    difficultyTier: "very_hard",
    predictedOutcome: "Yes",
    eventDetails: {
      startTime: new Date("2024-12-01T00:00:00Z"),
      endTime: new Date("2025-03-31T23:59:59Z"),
      venue: "Global Markets",
      league: "Cryptocurrency",
      region: "Global"
    },
    odds: 1.75,
    participants: 247,
    volume: 125000,
    currency: "BITR",
    endDate: "2025-03-31",
    trending: true,
    boosted: true,
    boostTier: 3,
    poolType: "single",
    image: "🪙",
    cardTheme: "cyan",
    socialStats: {
      comments: 89,
      likes: 156,
      views: 2340,
      shares: 23
    },
    comments: [],
    defeated: 34,
    conditions: [
      "Bitcoin (BTC) must reach or exceed $100,000 USD on any major exchange",
      "Price must be sustained for at least 1 hour on the target date",
      "Data will be sourced from CoinGecko API and verified by multiple oracles",
      "Settlement occurs within 24 hours of the event end date"
    ],
    tags: ["macro", "btc", "institutional", "halving"]
  });

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
    } catch (error) {
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
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleBet = async () => { 
    if(!betSide || !betAmount) return;
    
    try {
      console.log('Placing bet:', { address, poolId, betSide, betAmount });
      // Add actual bet placement logic here
      // For now, just log the action
    } catch (error) {
      console.error('Error placing bet:', error);
    }
  };

  const calculatePayout = () => {
    const amount = parseFloat(betAmount) || 0;
    return (amount * (pool?.odds || 1)).toFixed(2);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-green-400';
      case 'bearish': return 'text-red-400';
      default: return 'text-gray-400';
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
      default: return 'text-gray-400';
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
              {comment.author.username.charAt(0).toUpperCase()}
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
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header Section */}
        <div className="relative">
          {/* Boost indicator */}
          {pool.boosted && (
            <div className="absolute -top-2 -right-2 z-10">
              <div className={`
                px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1
                ${pool.boostTier === 3 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black' :
                  pool.boostTier === 2 ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-black' :
                  'bg-gradient-to-r from-orange-600 to-orange-700 text-white'}
                ${getBoostGlow(pool.boostTier)}
              `}>
                <BoltSolid className="w-4 h-4" />
                {pool.boostTier === 3 ? 'GOLD BOOST' : pool.boostTier === 2 ? 'SILVER BOOST' : 'BRONZE BOOST'}
              </div>
            </div>
          )}

          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-8 space-y-6">
            {/* Creator Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center border-2 border-cyan-500/30">
                    <UserIcon className="w-8 h-8 text-cyan-400" />
                  </div>
                  {pool.creator.badges.includes('legendary') && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                      <StarSolid className="w-3 h-3 text-black" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-white">{pool.creator.username}</h3>
                    <div className="flex gap-1">
                      {pool.creator.badges.slice(0, 2).map((badge, index) => (
                        <div key={index} className={`px-2 py-1 rounded-full text-xs font-bold text-black ${getBadgeColor(badge)}`}>
                          {badge.replace('_', ' ').toUpperCase()}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">{pool.creator.bio}</div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-300">
                    <div className="flex items-center gap-1">
                      <TrophyIcon className="w-4 h-4" />
                      {pool.creator.successRate.toFixed(1)}% win rate
                    </div>
                    <div className="flex items-center gap-1">
                      <ChartBarIcon className="w-4 h-4" />
                      {pool.creator.totalPools} pools
                    </div>
                    <div className="flex items-center gap-1">
                      <CurrencyDollarIcon className="w-4 h-4" />
                      {(pool.creator.totalVolume / 1000).toFixed(0)}k volume
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400 mb-1">Challenge Score</div>
                <div className={`text-3xl font-bold ${getDifficultyColor(pool.difficultyTier)}`}>
                  {pool.challengeScore}
                </div>
                <div className="text-xs text-gray-400 uppercase">
                  {pool.difficultyTier.replace('_', ' ')}
                </div>
              </div>
            </div>

            {/* Pool Title & Description */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full">
                  {pool.category}
                </span>
                <div className="flex gap-1">
                  {pool.tags?.map((tag, index) => (
                    <span key={index} className="text-xs px-2 py-1 bg-gray-700/50 text-gray-400 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
              <h1 className="text-3xl font-bold text-white mb-3">{pool.title}</h1>
              <p className="text-gray-300 leading-relaxed">{pool.description}</p>
            </div>

            {/* Challenge Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{pool.defeated}</div>
                <div className="text-xs text-gray-400">Defeated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{pool.creator.successRate.toFixed(1)}%</div>
                <div className="text-xs text-gray-400">Creator Success</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{pool.odds}x</div>
                <div className="text-xs text-gray-400">Odds</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">{pool.participants}</div>
                <div className="text-xs text-gray-400">Challengers</div>
              </div>
            </div>

            {/* Time Remaining */}
            {pool.eventDetails && (
              <div className="text-center p-4 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-lg border border-cyan-500/20">
                <div className="text-sm text-gray-400 mb-2">Time Remaining</div>
                <div className="flex items-center justify-center gap-4 text-2xl font-bold text-cyan-400">
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
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-cyan-500 text-black shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'bet' && (
              <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-6 space-y-6">
                <h3 className="text-xl font-bold text-white">Challenge the Creator</h3>
                
                {/* Bet Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bet Amount ({pool.currency})
                  </label>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                    placeholder="Enter amount"
                  />
                </div>

                {/* Bet Side Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Your Prediction
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setBetSide('yes')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        betSide === 'yes'
                          ? 'border-green-500 bg-green-500/10 text-green-400'
                          : 'border-gray-600/50 hover:border-green-500/50 text-gray-300'
                      }`}
                    >
                      <div className="text-lg font-bold">YES</div>
                      <div className="text-sm">Agree with creator</div>
                    </button>
                    <button
                      onClick={() => setBetSide('no')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        betSide === 'no'
                          ? 'border-red-500 bg-red-500/10 text-red-400'
                          : 'border-gray-600/50 hover:border-red-500/50 text-gray-300'
                      }`}
                    >
                      <div className="text-lg font-bold">NO</div>
                      <div className="text-sm">Challenge the creator</div>
                    </button>
                  </div>
                </div>

                {/* Payout Calculation */}
                <div className="p-4 bg-gray-700/30 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Potential Payout:</span>
                    <span className="text-xl font-bold text-cyan-400">
                      {calculatePayout()} {pool.currency}
                    </span>
                  </div>
                </div>

                {/* Place Bet Button */}
                <button
                  onClick={handleBet}
                  disabled={!betSide || !betAmount || parseFloat(betAmount) <= 0}
                  className="w-full px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <TrophyIcon className="w-5 h-5" />
                  Place Bet & Challenge
                </button>
              </div>
            )}

            {activeTab === 'analysis' && (
              <div className="space-y-6">
                {/* Market Analysis */}
                {pool.market && (
                  <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Market Analysis</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-400">Current Price</div>
                        <div className="text-2xl font-bold text-white">
                          ${pool.market.currentPrice.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Target Price</div>
                        <div className="text-2xl font-bold text-cyan-400">
                          ${pool.market.targetPrice.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Progress</div>
                        <div className="text-2xl font-bold text-yellow-400">
                          {pool.market.progress.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">24h Volume</div>
                        <div className="text-2xl font-bold text-white">
                          ${(pool.market.volume24h / 1000000000).toFixed(2)}B
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Conditions */}
                {pool.conditions && (
                  <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Settlement Conditions</h3>
                    <div className="space-y-3">
                      {pool.conditions.map((condition, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-cyan-400">{index + 1}</span>
                          </div>
                          <p className="text-gray-300">{condition}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'liquidity' && (
              <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Pool Liquidity</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Total Pool Size:</span>
                    <span className="font-bold text-white">
                      {pool.volume.toLocaleString()} {pool.currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">24h Volume:</span>
                    <span className="font-bold text-white">
                      {(pool.volume24h || 0).toLocaleString()} {pool.currency}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Social Stats */}
            <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-6">
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
              <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-6">
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
        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-6 space-y-6">
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
                <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/30 space-y-4">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your analysis and reasoning..."
                    className="w-full px-4 py-3 bg-gray-600/50 border border-gray-500/50 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 resize-none"
                    rows={3}
                  />

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">Sentiment:</span>
                      <select
                        value={commentSentiment}
                        onChange={(e) => setCommentSentiment(e.target.value as any)}
                        className="px-3 py-1 bg-gray-600/50 border border-gray-500/50 rounded text-white text-sm"
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
                      className="px-4 py-2 bg-cyan-500 text-black rounded-lg hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
  );
} 
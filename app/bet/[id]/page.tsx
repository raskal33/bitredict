"use client";

import Button from "@/components/button";
import { usePreferences } from "@/store/usePreferences";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ClockIcon, 
  UsersIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  ShareIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  MapPinIcon,
  TagIcon,
  UserIcon,
  BanknotesIcon,
  ScaleIcon
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { useStore } from "zustand";
import Image from "next/image";

export default function BetPage() {
  const { preferences } = useStore(usePreferences);
  const params = useParams();
  const poolId = params.id as string;
  
  const [activeTab, setActiveTab] = useState<"bet" | "liquidity">("bet");
  const [betAmount, setBetAmount] = useState<string>(preferences?.defaultStake?.toString() || "10");
  const [isLiked, setIsLiked] = useState(false);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [comment, setComment] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Dynamic pool data based on poolId
  const getPoolData = (id: string) => {
    const pools = {
      "1": {
        id: "1",
        title: "Bitcoin will reach $100,000 by March 2025",
        description: "Prediction market on Bitcoin reaching six-figure milestone before March 31, 2025",
        category: "Crypto",
        cardTheme: "cyan",
        predictedOutcome: "Yes", // What the creator thinks WILL happen
        creator: {
          address: "0x1234...5678",
          username: "CryptoTrader",
          avatar: "/logo.png",
          reputation: 4.8,
          totalPools: 23,
          successRate: 78.3
        },
        eventDetails: {
          startTime: new Date("2024-12-01T00:00:00Z"),
          endTime: new Date("2025-03-31T23:59:59Z"),
          venue: "Global Markets",
          league: "Cryptocurrency",
          region: "Global"
        },
        odds: 1.75,
        pool: {
          totalStake: 1000,
          creatorStake: 650,
          bettorStake: 350,
          participants: 247,
          volume24h: 12500,
          priceChange24h: 8.5
        },
        market: {
          currentPrice: 67500,
          targetPrice: 100000,
          progress: 67.5,
          high24h: 68200,
          low24h: 66800,
          volume24h: 2400000000
        },
        conditions: [
          "Bitcoin (BTC) must reach or exceed $100,000 USD on any major exchange",
          "Price must be sustained for at least 1 hour on the target date",
          "Data will be sourced from CoinGecko API and verified by multiple oracles",
          "Settlement occurs within 24 hours of the event end date"
        ]
      },
      "2": {
        id: "2",
        title: "Manchester City wins Premier League 2024/25",
        description: "Premier League championship prediction market for the 2024/25 season",
        category: "Sports",
        cardTheme: "magenta",
        predictedOutcome: "Yes",
        creator: {
          address: "0x5678...9012",
          username: "FootballExpert",
          avatar: "/logo.png",
          reputation: 4.5,
          totalPools: 15,
          successRate: 73.2
        },
        eventDetails: {
          startTime: new Date("2024-08-17T00:00:00Z"),
          endTime: new Date("2025-05-25T23:59:59Z"),
          venue: "Premier League",
          league: "English Premier League",
          region: "England"
        },
        odds: 2.1,
        pool: {
          totalStake: 800,
          creatorStake: 420,
          bettorStake: 380,
          participants: 189,
          volume24h: 8900,
          priceChange24h: -2.1
        },
        market: {
          currentPrice: 0,
          targetPrice: 0,
          progress: 45,
          high24h: 0,
          low24h: 0,
          volume24h: 0
        },
        conditions: [
          "Manchester City must finish 1st in the Premier League 2024/25 season",
          "Official Premier League final table determines the winner",
          "Data sourced from Sportmonks API and official Premier League sources",
          "Settlement occurs within 48 hours of season completion"
        ]
      },
      "3": {
        id: "3",
        title: "US Federal Reserve cuts rates by 0.5% in Q1 2025",
        description: "Federal Reserve monetary policy prediction for Q1 2025",
        category: "Finance",
        cardTheme: "violet",
        predictedOutcome: "Yes",
        creator: {
          address: "0x9012...3456",
          username: "MacroAnalyst",
          avatar: "/logo.png",
          reputation: 4.9,
          totalPools: 31,
          successRate: 81.2
        },
        eventDetails: {
          startTime: new Date("2025-01-01T00:00:00Z"),
          endTime: new Date("2025-03-31T23:59:59Z"),
          venue: "Federal Reserve",
          league: "US Monetary Policy",
          region: "United States"
        },
        odds: 1.6,
        pool: {
          totalStake: 600,
          creatorStake: 380,
          bettorStake: 220,
          participants: 156,
          volume24h: 15600,
          priceChange24h: 12.3
        },
        market: {
          currentPrice: 5.25,
          targetPrice: 4.75,
          progress: 0,
          high24h: 5.25,
          low24h: 5.25,
          volume24h: 0
        },
        conditions: [
          "Federal Reserve must cut the federal funds rate by at least 0.5% in Q1 2025",
          "Rate cut must be announced in official FOMC meeting",
          "Data sourced from Federal Reserve official announcements",
          "Settlement occurs within 24 hours of official announcement"
        ]
      }
    };
    
    return pools[id as keyof typeof pools] || pools["1"];
  };

  const poolData = getPoolData(poolId);

  const [comments, setComments] = useState([
    {
      id: 1,
      user: "BitcoinMaxi",
      avatar: "/logo.png",
      message: "Bitcoin halving effects plus institutional adoption. This is inevitable! 🚀",
      timestamp: "2 hours ago",
      likes: 12,
      replies: []
    },
    {
      id: 2,
      user: "TradingPro",
      avatar: "/logo.png", 
      message: "Market cycles suggest we might see a correction before the next bull run. Being cautious here.",
      timestamp: "4 hours ago",
      likes: 8,
      replies: [
        {
          id: 21,
          user: "CryptoAnalyst",
          avatar: "/logo.png",
          message: "Good point, but institutional demand is different this cycle.",
          timestamp: "3 hours ago",
          likes: 3
        }
      ]
    }
  ]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = poolData.eventDetails.endTime.getTime() - now;
      
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
  }, [poolData.eventDetails.endTime]);

  const calculatePayout = () => {
    const amount = parseFloat(betAmount) || 0;
    return (amount * poolData.odds).toFixed(2);
  };

  const getCardTheme = (theme: string) => {
    const themes = {
      cyan: {
        background: "bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent",
        border: "border-cyan-500/20",
        glow: "shadow-[0_0_30px_rgba(34,199,255,0.1)]",
        hoverGlow: "hover:shadow-[0_0_40px_rgba(34,199,255,0.2)]",
        accent: "text-cyan-400",
        progressBg: "bg-gradient-to-r from-cyan-500 to-blue-500"
      },
      magenta: {
        background: "bg-gradient-to-br from-pink-500/10 via-rose-500/5 to-transparent",
        border: "border-pink-500/20",
        glow: "shadow-[0_0_30px_rgba(255,0,128,0.1)]",
        hoverGlow: "hover:shadow-[0_0_40px_rgba(255,0,128,0.2)]",
        accent: "text-pink-400",
        progressBg: "bg-gradient-to-r from-pink-500 to-rose-500"
      },
      violet: {
        background: "bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent",
        border: "border-violet-500/20",
        glow: "shadow-[0_0_30px_rgba(140,0,255,0.1)]",
        hoverGlow: "hover:shadow-[0_0_40px_rgba(140,0,255,0.2)]",
        accent: "text-violet-400",
        progressBg: "bg-gradient-to-r from-violet-500 to-purple-500"
      }
    };
    return themes[theme as keyof typeof themes] || themes.cyan;
  };

  const theme = getCardTheme(poolData.cardTheme);

  const handleAddComment = () => {
    if (comment.trim()) {
      const newComment = {
        id: Date.now(),
        user: "You",
        avatar: "/logo.png",
        message: comment,
        timestamp: "Just now",
        likes: 0,
        replies: []
      };
      setComments([...comments, newComment]);
      setComment("");
      setShowCommentBox(false);
    }
  };

  const handleReply = (commentId: number) => {
    if (replyText.trim()) {
      const newReply = {
        id: Date.now(),
        user: "You",
        avatar: "/logo.png",
        message: replyText,
        timestamp: "Just now",
        likes: 0
      };
      
      setComments(comments.map(comment => 
        comment.id === commentId 
          ? { ...comment, replies: [...comment.replies, newReply] }
          : comment
      ));
      setReplyText("");
      setReplyTo(null);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Link href="/" className="text-text-muted hover:text-primary transition-colors">
              Markets
            </Link>
            <span className="text-text-muted">/</span>
            <span className="text-primary">Pool #{poolId}</span>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-text-primary mb-2">
                {poolData.title}
              </h1>
              <p className="text-text-secondary text-lg">
                {poolData.description}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsLiked(!isLiked)}
                className="p-3 rounded-button bg-bg-card border border-border-card hover:bg-[rgba(255,255,255,0.05)] transition-all duration-200"
              >
                {isLiked ? (
                  <HeartSolid className="h-5 w-5 text-red-500" />
                ) : (
                  <HeartIcon className="h-5 w-5 text-text-muted" />
                )}
              </button>
              <button className="p-3 rounded-button bg-bg-card border border-border-card hover:bg-[rgba(255,255,255,0.05)] transition-all duration-200">
                <ShareIcon className="h-5 w-5 text-text-muted" />
              </button>
              <button className="p-3 rounded-button bg-bg-card border border-border-card hover:bg-[rgba(255,255,255,0.05)] transition-all duration-200">
                <EyeIcon className="h-5 w-5 text-text-muted" />
              </button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Market Overview Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl p-6 ${theme.background} ${theme.border} ${theme.glow}`}
            >
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-text-primary">Market Overview</h2>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${theme.background.replace('bg-gradient-to-br', 'bg-gradient-to-r')} ${theme.border}`}>
                      {poolData.category}
                    </span>
                    <div className="flex items-center gap-1 text-sm">
                      <StarIcon className="h-4 w-4 text-yellow-400" />
                      <span className="text-text-muted">Active</span>
                    </div>
                  </div>
                </div>

                {/* Dynamic Market Data based on category */}
                {poolData.category === "Crypto" && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${theme.accent}`}>
                        ${poolData.market.currentPrice.toLocaleString()}
                      </div>
                      <div className="text-xs text-text-muted">Current Price</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-text-primary">
                        ${poolData.market.targetPrice.toLocaleString()}
                      </div>
                      <div className="text-xs text-text-muted">Target Price</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-xl font-bold text-green-400">
                        <ArrowTrendingUpIcon className="h-5 w-5" />
                        {poolData.pool.priceChange24h}%
                      </div>
                      <div className="text-xs text-text-muted">24h Change</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-text-primary">
                        {poolData.market.progress.toFixed(1)}%
                      </div>
                      <div className="text-xs text-text-muted">Progress</div>
                    </div>
                  </div>
                )}

                {poolData.category === "Sports" && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${theme.accent}`}>
                        {poolData.odds}x
                      </div>
                      <div className="text-xs text-text-muted">Current Odds</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-text-primary">
                        {poolData.market.progress}%
                      </div>
                      <div className="text-xs text-text-muted">Season Progress</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-xl font-bold text-red-400">
                        <ArrowTrendingDownIcon className="h-5 w-5" />
                        {Math.abs(poolData.pool.priceChange24h)}%
                      </div>
                      <div className="text-xs text-text-muted">24h Change</div>
                    </div>
                  </div>
                )}

                {poolData.category === "Finance" && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${theme.accent}`}>
                        {poolData.market.currentPrice}%
                      </div>
                      <div className="text-xs text-text-muted">Current Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-text-primary">
                        {poolData.market.targetPrice}%
                      </div>
                      <div className="text-xs text-text-muted">Target Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-xl font-bold text-green-400">
                        <ArrowTrendingUpIcon className="h-5 w-5" />
                        {poolData.pool.priceChange24h}%
                      </div>
                      <div className="text-xs text-text-muted">Market Sentiment</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-text-primary">
                        Q1 2025
                      </div>
                      <div className="text-xs text-text-muted">Timeline</div>
                    </div>
                  </div>
                )}

                {/* Pool Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-text-primary flex items-center justify-center gap-1">
                      <UsersIcon className="h-4 w-4" />
                      {poolData.pool.participants}
                    </div>
                    <div className="text-xs text-text-muted">Participants</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-text-primary">
                      {poolData.pool.totalStake} SOL
                    </div>
                    <div className="text-xs text-text-muted">Total Pool</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-text-primary">
                      ${(poolData.pool.volume24h / 1000).toFixed(1)}k
                    </div>
                    <div className="text-xs text-text-muted">24h Volume</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Event Details Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card"
            >
              <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                <InformationCircleIcon className="h-5 w-5" />
                Event Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-5 w-5 text-text-muted" />
                  <div>
                    <div className="text-sm text-text-muted">Event Period</div>
                    <div className="text-text-primary font-medium">
                      {poolData.eventDetails.startTime.toLocaleDateString()} - {poolData.eventDetails.endTime.toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPinIcon className="h-5 w-5 text-text-muted" />
                  <div>
                    <div className="text-sm text-text-muted">Market</div>
                    <div className="text-text-primary font-medium">{poolData.eventDetails.venue}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <TagIcon className="h-5 w-5 text-text-muted" />
                  <div>
                    <div className="text-sm text-text-muted">Category</div>
                    <div className="text-text-primary font-medium">{poolData.eventDetails.league}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <UserIcon className="h-5 w-5 text-text-muted" />
                  <div>
                    <div className="text-sm text-text-muted">Creator</div>
                    <Link href={`/profile/${poolData.creator.username}`} className="text-primary hover:text-cyan-300 font-medium">
                      {poolData.creator.username}
                    </Link>
                  </div>
                </div>
              </div>

              {/* Conditions */}
              <div className="bg-bg-card rounded-xl p-4 border border-border-card">
                <h4 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <ScaleIcon className="h-4 w-4" />
                  Resolution Conditions
                </h4>
                <ul className="space-y-2">
                  {poolData.conditions.map((condition, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-text-secondary">
                      <CheckCircleIcon className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                      {condition}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* Comments Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <ChatBubbleLeftRightIcon className="h-5 w-5" />
                  Discussion ({comments.length})
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCommentBox(!showCommentBox)}
                >
                  Add Comment
                </Button>
              </div>

              <AnimatePresence>
                {showCommentBox && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6"
                  >
                    <div className="bg-bg-card rounded-xl p-4 border border-border-card">
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share your thoughts on this prediction..."
                        className="w-full h-20 bg-transparent text-text-primary placeholder-text-muted resize-none focus:outline-none"
                      />
                      <div className="flex justify-end gap-2 mt-3">
                        <Button size="sm" variant="ghost" onClick={() => setShowCommentBox(false)}>
                          Cancel
                        </Button>
                        <Button size="sm" variant="primary" onClick={handleAddComment}>
                          Post Comment
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="space-y-3">
                    <div className="flex gap-3">
                      <Image
                        src={comment.avatar}
                        alt={comment.user}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                      <div className="flex-1">
                        <div className="bg-bg-card rounded-xl p-4 border border-border-card">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-text-primary">{comment.user}</span>
                            <span className="text-xs text-text-muted">{comment.timestamp}</span>
                          </div>
                          <p className="text-text-secondary text-sm">{comment.message}</p>
                          <div className="flex items-center gap-4 mt-3">
                            <button className="flex items-center gap-1 text-xs text-text-muted hover:text-primary transition-colors">
                              <HeartIcon className="h-3 w-3" />
                              {comment.likes}
                            </button>
                            <button 
                              onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                              className="text-xs text-text-muted hover:text-primary transition-colors"
                            >
                              Reply
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Reply Box */}
                    <AnimatePresence>
                      {replyTo === comment.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="ml-12"
                        >
                          <div className="bg-bg-card rounded-xl p-3 border border-border-card">
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Write a reply..."
                              className="w-full h-16 bg-transparent text-text-primary placeholder-text-muted resize-none focus:outline-none text-sm"
                            />
                            <div className="flex justify-end gap-2 mt-2">
                              <Button size="sm" variant="ghost" onClick={() => setReplyTo(null)}>
                                Cancel
                              </Button>
                              <Button size="sm" variant="primary" onClick={() => handleReply(comment.id)}>
                                Reply
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Replies */}
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="ml-12 flex gap-3">
                        <Image
                          src={reply.avatar}
                          alt={reply.user}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                        <div className="flex-1">
                          <div className="bg-bg-card/50 rounded-xl p-3 border border-border-card/50">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-text-primary text-sm">{reply.user}</span>
                              <span className="text-xs text-text-muted">{reply.timestamp}</span>
                            </div>
                            <p className="text-text-secondary text-sm">{reply.message}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <button className="flex items-center gap-1 text-xs text-text-muted hover:text-primary transition-colors">
                                <HeartIcon className="h-3 w-3" />
                                {reply.likes}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Countdown Timer */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card text-center"
            >
              <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center justify-center gap-2">
                <ClockIcon className="h-5 w-5" />
                Time Remaining
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Days", value: timeLeft.days },
                  { label: "Hours", value: timeLeft.hours },
                  { label: "Min", value: timeLeft.minutes },
                  { label: "Sec", value: timeLeft.seconds }
                ].map((item) => (
                  <div key={item.label} className="bg-bg-card rounded-lg p-3 border border-border-card">
                    <div className="text-2xl font-bold text-primary">{item.value.toString().padStart(2, '0')}</div>
                    <div className="text-xs text-text-muted">{item.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Creator Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card"
            >
              <h3 className="text-lg font-bold text-text-primary mb-4">Pool Creator</h3>
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src={poolData.creator.avatar}
                  alt={poolData.creator.username}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
                <div>
                  <Link href={`/profile/${poolData.creator.username}`} className="font-semibold text-primary hover:text-cyan-300">
                    {poolData.creator.username}
                  </Link>
                  <div className="flex items-center gap-1 text-sm">
                    <StarIcon className="h-3 w-3 text-yellow-400" />
                    <span className="text-text-muted">{poolData.creator.reputation}/5.0</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-text-primary">{poolData.creator.totalPools}</div>
                  <div className="text-xs text-text-muted">Total Pools</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-400">{poolData.creator.successRate}%</div>
                  <div className="text-xs text-text-muted">Success Rate</div>
                </div>
              </div>
            </motion.div>

            {/* Betting Interface */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card"
            >
              <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                <BanknotesIcon className="h-5 w-5" />
                Place Your Bet
              </h3>

              {/* Tab Selection */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setActiveTab("bet")}
                  className={`flex-1 py-2 px-4 rounded-button text-sm font-medium transition-all duration-200 ${
                    activeTab === "bet"
                      ? "bg-gradient-primary text-black shadow-button"
                      : "bg-bg-card text-text-secondary hover:bg-[rgba(255,255,255,0.05)] hover:text-text-primary border border-border-card"
                  }`}
                >
                  Bet {poolData.predictedOutcome}
                </button>
                <button
                  onClick={() => setActiveTab("liquidity")}
                  className={`flex-1 py-2 px-4 rounded-button text-sm font-medium transition-all duration-200 ${
                    activeTab === "liquidity"
                      ? "bg-gradient-primary text-black shadow-button"
                      : "bg-bg-card text-text-secondary hover:bg-[rgba(255,255,255,0.05)] hover:text-text-primary border border-border-card"
                  }`}
                >
                  Bet Against
                </button>
              </div>

              {activeTab === "bet" && (
                <div className="space-y-4">
                  {/* Outcome Display */}
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                    <div className="text-lg font-bold text-green-400 mb-1">
                      Betting {poolData.predictedOutcome} - {poolData.odds}x
                    </div>
                    <div className="text-sm text-text-muted">
                      You believe this prediction will happen
                    </div>
                  </div>

                  {/* Bet Amount */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Bet Amount (SOL)</label>
                    <input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full p-3 bg-bg-card border border-border-card rounded-button text-text-primary placeholder-text-muted focus:outline-none focus:border-primary/50"
                    />
                  </div>

                  {/* Payout Calculation */}
                  <div className="bg-bg-card rounded-xl p-4 border border-border-card">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-text-muted">Potential Payout:</span>
                      <span className="text-lg font-bold text-green-400">{calculatePayout()} SOL</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-text-muted">Potential Profit:</span>
                      <span className="text-sm font-medium text-text-primary">
                        {(parseFloat(calculatePayout()) - parseFloat(betAmount || "0")).toFixed(2)} SOL
                      </span>
                    </div>
                  </div>

                  {/* Risk Warning */}
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
                    <div className="flex items-start gap-2">
                      <ExclamationTriangleIcon className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-yellow-400 mb-1">Risk Warning</div>
                        <div className="text-xs text-text-muted">
                          Prediction markets involve risk. Only bet what you can afford to lose.
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button fullWidth size="lg" variant="primary">
                    Place Bet - {betAmount || "0"} SOL
                  </Button>
                </div>
              )}

              {activeTab === "liquidity" && (
                <div className="space-y-4">
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                    <div className="text-lg font-bold text-red-400 mb-1">
                      Betting Against - {(1 / (poolData.odds - 1) + 1).toFixed(2)}x
                    </div>
                    <div className="text-sm text-text-muted">
                      You believe this prediction will NOT happen
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Liquidity Amount (SOL)</label>
                    <input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full p-3 bg-bg-card border border-border-card rounded-button text-text-primary placeholder-text-muted focus:outline-none focus:border-primary/50"
                    />
                  </div>

                  <div className="bg-bg-card rounded-xl p-4 border border-border-card">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-text-muted">Expected Return:</span>
                      <span className="text-lg font-bold text-blue-400">{(parseFloat(betAmount || "0") * (1 / (poolData.odds - 1) + 1)).toFixed(2)} SOL</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-text-muted">If prediction fails:</span>
                      <span className="text-sm font-medium text-text-primary">
                        You win the bet
                      </span>
                    </div>
                  </div>

                  <Button fullWidth size="lg" variant="secondary">
                    Add Liquidity - {betAmount || "0"} SOL
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

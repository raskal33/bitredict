"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  TrophyIcon, 
  CurrencyDollarIcon,
  ClockIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { 
  TrophyIcon as TrophySolid
} from "@heroicons/react/24/solid";

interface RecentBet {
  id: string;
  user: {
    address: string;
    username: string;
    avatar?: string;
  };
  pool: {
    id: string;
    title: string;
    category: string;
    odds: number;
    currency: 'BITR' | 'STT';
  };
  amount: string;
  side: 'creator' | 'bettor';
  timestamp: number;
  boostTier?: 'BRONZE' | 'SILVER' | 'GOLD';
  trending?: boolean;
}

interface RecentBetsLaneProps {
  className?: string;
}

export default function RecentBetsLane({ className = "" }: RecentBetsLaneProps) {
  const [bets, setBets] = useState<RecentBet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Demo data for the moving lane
  const demoBets: RecentBet[] = [
    {
      id: "bet-1",
      user: {
        address: "0x1234...5678",
        username: "CryptoWhale",
        avatar: "/logo.png"
      },
      pool: {
        id: "pool-1",
        title: "Bitcoin will reach $100,000 by March 2025",
        category: "crypto",
        odds: 1.75,
        currency: "BITR"
      },
      amount: "2,500",
      side: "bettor",
      timestamp: Date.now() - 30000,
      boostTier: "GOLD",
      trending: true
    },
    {
      id: "bet-2",
      user: {
        address: "0x2345...6789",
        username: "StockMaster",
        avatar: "/logo.png"
      },
      pool: {
        id: "pool-2",
        title: "Tesla stock will hit $300 by end of 2024",
        category: "stocks",
        odds: 2.1,
        currency: "BITR"
      },
      amount: "1,800",
      side: "creator",
      timestamp: Date.now() - 45000,
      boostTier: "SILVER"
    },
    {
      id: "bet-3",
      user: {
        address: "0x3456...7890",
        username: "MacroGuru",
        avatar: "/logo.png"
      },
      pool: {
        id: "pool-3",
        title: "US Federal Reserve will cut rates 3 times in 2024",
        category: "economics",
        odds: 1.25,
        currency: "BITR"
      },
      amount: "5,200",
      side: "bettor",
      timestamp: Date.now() - 60000,
      boostTier: "GOLD",
      trending: true
    },
    {
      id: "bet-4",
      user: {
        address: "0x4567...8901",
        username: "TechProphet",
        avatar: "/logo.png"
      },
      pool: {
        id: "pool-4",
        title: "OpenAI will release GPT-5 by Q3 2024",
        category: "technology",
        odds: 1.8,
        currency: "STT"
      },
      amount: "3,100",
      side: "creator",
      timestamp: Date.now() - 75000,
      boostTier: "BRONZE"
    },
    {
      id: "bet-5",
      user: {
        address: "0x5678...9012",
        username: "SpaceExplorer",
        avatar: "/logo.png"
      },
      pool: {
        id: "pool-5",
        title: "SpaceX will successfully land on Mars by 2026",
        category: "space",
        odds: 2.5,
        currency: "BITR"
      },
      amount: "950",
      side: "bettor",
      timestamp: Date.now() - 90000,
      trending: true
    },
    {
      id: "bet-6",
      user: {
        address: "0x6789...0123",
        username: "EthereumOracle",
        avatar: "/logo.png"
      },
      pool: {
        id: "pool-6",
        title: "Ethereum will complete The Merge by September 2024",
        category: "crypto",
        odds: 2.1,
        currency: "BITR"
      },
      amount: "4,200",
      side: "creator",
      timestamp: Date.now() - 105000,
      boostTier: "SILVER"
    }
  ];

  useEffect(() => {
    const fetchRecentBets = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/bets/recent?limit=8');
        const data = await response.json();
        
        if (data.success) {
          setBets(data.data);
        } else {
          // Fallback to demo data
          setBets(demoBets);
        }
      } catch (error) {
        console.error('Error fetching recent bets:', error);
        // Fallback to demo data
        setBets(demoBets);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentBets();
  }, [demoBets]);

  // Auto-rotate through bets
  useEffect(() => {
    if (bets.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % bets.length);
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [bets.length]);

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    if (minutes > 0) {
      return `${minutes}m ago`;
    }
    return `${seconds}s ago`;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'crypto': return '₿';
      case 'stocks': return '📈';
      case 'economics': return '🏦';
      case 'technology': return '🤖';
      case 'space': return '🚀';
      case 'sports': return '⚽';
      default: return '🎯';
    }
  };

  const getBoostColor = (tier?: string) => {
    switch (tier) {
      case 'GOLD': return 'text-yellow-400';
      case 'SILVER': return 'text-gray-300';
      case 'BRONZE': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  const getBoostIcon = (tier?: string) => {
    switch (tier) {
      case 'GOLD': return '🥇';
      case 'SILVER': return '🥈';
      case 'BRONZE': return '🥉';
      default: return '';
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-gradient-to-r from-gray-800/20 to-gray-900/20 backdrop-blur-lg border border-gray-700/30 rounded-2xl p-4 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400"></div>
          <span className="ml-3 text-gray-400">Loading recent bets...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-gray-800/20 to-gray-900/20 backdrop-blur-lg border border-gray-700/30 rounded-2xl p-4 sm:p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg">
            <FireSolid className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">Recent Bets</h3>
            <p className="text-xs sm:text-sm text-gray-400">Live betting activity</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs sm:text-sm text-gray-400">Live</span>
        </div>
      </div>

      {/* Moving Lane */}
      <div className="relative overflow-hidden">
        <motion.div
          className="flex gap-3 sm:gap-4"
          animate={{
            x: -currentIndex * 288 // Responsive width (72 * 4 = 288 for mobile, 80 * 4 = 320 for desktop)
          }}
          transition={{
            duration: 0.5,
            ease: "easeInOut"
          }}
        >
          {bets.map((bet, _) => (
            <motion.div
              key={bet.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-shrink-0 w-72 sm:w-80"
            >
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 hover:border-cyan-500/30 transition-all duration-300 group">
                {/* User Info */}
                <div className="flex items-center gap-2 sm:gap-3 mb-3">
                  <div className="relative">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                      <UserIcon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                    </div>
                    {bet.trending && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-white truncate">
                      {bet.user.username}
                    </p>
                    <p className="text-xs text-gray-400 truncate hidden sm:block">
                      {bet.user.address}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <ClockIcon className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-400">
                      {formatTimeAgo(bet.timestamp)}
                    </span>
                  </div>
                </div>

                {/* Bet Details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-lg">{getCategoryIcon(bet.pool.category)}</span>
                    <span className="text-xs sm:text-sm font-medium text-white truncate">
                      {bet.pool.title}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${
                        bet.side === 'creator' 
                          ? 'bg-purple-500/20 text-purple-400' 
                          : 'bg-cyan-500/20 text-cyan-400'
                      }`}>
                        {bet.side === 'creator' ? 'Creator' : 'Bettor'}
                      </span>
                      {bet.boostTier && (
                        <span className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-yellow-500/20 ${getBoostColor(bet.boostTier)}`}>
                          {getBoostIcon(bet.boostTier)} {bet.boostTier}
                        </span>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <p className="text-xs sm:text-sm font-bold text-white">
                        {bet.amount} {bet.pool.currency}
                      </p>
                      <p className="text-xs text-gray-400">
                        {bet.pool.odds}x odds
                      </p>
                    </div>
                  </div>
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Navigation Dots */}
        <div className="flex justify-center gap-2 mt-4">
          {bets.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-cyan-400 w-6' 
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 border-t border-gray-700/30 gap-2 sm:gap-0">
        <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <TrophyIcon className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>{bets.length} recent bets</span>
          </div>
          <div className="flex items-center gap-1">
            <CurrencyDollarIcon className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Live updates</span>
          </div>
        </div>
        
        <div className="text-xs text-gray-500">
          Auto-refresh every 3s
        </div>
      </div>
    </div>
  );
}

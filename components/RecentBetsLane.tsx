"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  TrophyIcon, 
  CurrencyDollarIcon,
  ClockIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { optimizedPoolService } from "@/services/optimizedPoolService";
import { getPoolIcon } from "@/services/crypto-icons";

interface RecentBet {
  id: number;
  poolId: string;
  bettorAddress: string;
  amount: string;
  amountFormatted: string;
  isForOutcome: boolean;
  createdAt: string;
  timeAgo: string;
  eventType?: 'bet' | 'pool_created' | 'liquidity_added'; // Enhanced event types
  action?: string; // Human-readable action
  icon?: string; // Icon for event type
  odds?: number; // Odds that user took
  currency?: string; // Currency used
  pool: {
    predictedOutcome: string;
    league: string;
    category: string;
    homeTeam: string;
    awayTeam: string;
    title: string;
    useBitr: boolean;
    odds: number;
    creatorAddress: string;
  };
}

interface RecentBetsLaneProps {
  className?: string;
}

export default function RecentBetsLane({ className = "" }: RecentBetsLaneProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Demo data for the moving lane
  const demoBets: RecentBet[] = useMemo(() => [
    {
      id: 1,
      poolId: "1",
      bettorAddress: "0x1234567890123456789012345678901234567890",
      amount: "2500000000000000000000",
      amountFormatted: "2,500.00",
      isForOutcome: true,
      eventType: 'bet',
      action: 'Placed bet',
      icon: '🎯',
      odds: 175,
      currency: 'STT',
      createdAt: new Date(Date.now() - 30000).toISOString(),
      timeAgo: "5m ago",
      pool: {
        predictedOutcome: "Over 2.5",
        league: "Premier League",
        category: "football",
        homeTeam: "Manchester United",
        awayTeam: "Liverpool",
        title: "Manchester United vs Liverpool",
        useBitr: true,
        odds: 175,
        creatorAddress: "0x9876543210987654321098765432109876543210"
      }
    },
    {
      id: 2,
      poolId: "2",
      bettorAddress: "0x2345678901234567890123456789012345678901",
      amount: "1800000000000000000000",
      amountFormatted: "1,800.00",
      isForOutcome: false,
      eventType: 'bet',
      createdAt: new Date(Date.now() - 45000).toISOString(),
      timeAgo: "8m ago",
      pool: {
        predictedOutcome: "Under 2.5",
        league: "La Liga",
        category: "football",
        homeTeam: "Barcelona",
        awayTeam: "Real Madrid",
        title: "Barcelona vs Real Madrid",
        useBitr: true,
        odds: 210,
        creatorAddress: "0x8765432109876543210987654321098765432109"
      }
    },
    {
      id: 3,
      poolId: "3",
      bettorAddress: "0x3456789012345678901234567890123456789012",
      amount: "5200000000000000000000",
      amountFormatted: "5,200.00",
      isForOutcome: true,
      eventType: 'pool_created', // Pool creation event
      action: 'Created pool',
      icon: '🏗️',
      odds: 125,
      currency: 'STT',
      createdAt: new Date(Date.now() - 60000).toISOString(),
      timeAgo: "12m ago",
      pool: {
        predictedOutcome: "Home wins",
        league: "Serie A",
        category: "football",
        homeTeam: "Juventus",
        awayTeam: "AC Milan",
        title: "Juventus vs AC Milan",
        useBitr: true,
        odds: 125,
        creatorAddress: "0x7654321098765432109876543210987654321098"
      }
    },
    {
      id: 4,
      poolId: "3",
      bettorAddress: "0x4567890123456789012345678901234567890123",
      amount: "2000000000000000000000",
      amountFormatted: "2,000.00",
      isForOutcome: false,
      eventType: 'liquidity_added', // Liquidity provider event
      action: 'Added liquidity',
      icon: '💧',
      odds: 125,
      currency: 'STT',
      createdAt: new Date(Date.now() - 75000).toISOString(),
      timeAgo: "10m ago",
      pool: {
        predictedOutcome: "Home wins",
        league: "Serie A",
        category: "football",
        homeTeam: "Juventus",
        awayTeam: "AC Milan",
        title: "Juventus vs AC Milan",
        useBitr: true,
        odds: 125,
        creatorAddress: "0x7654321098765432109876543210987654321098"
      }
    },
    {
      id: 5,
      poolId: "4",
      bettorAddress: "0x4567890123456789012345678901234567890123",
      amount: "3500000000000000000000",
      amountFormatted: "3,500.00",
      isForOutcome: true,
      eventType: 'bet',
      createdAt: new Date(Date.now() - 90000).toISOString(),
      timeAgo: "15m ago",
      pool: {
        predictedOutcome: "BTC above $1450",
        league: "crypto",
        category: "cryptocurrency",
        homeTeam: "BTC",
        awayTeam: "USD",
        title: "BTC Price Prediction",
        useBitr: true,
        odds: 190,
        creatorAddress: "0x6543210987654321098765432109876543210987"
      }
    }
  ], []);

  const [apiData, setApiData] = useState<RecentBet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch recent bets using optimized API service
  useEffect(() => {
    const fetchRecentBets = async () => {
      try {
        setIsLoading(true);
        const bets = await optimizedPoolService.getRecentBets(20);
        
        // Transform API data to component format
        const transformedBets: RecentBet[] = bets.map((bet, index) => ({
          id: index + 1,
          poolId: bet.poolId.toString(),
          bettorAddress: bet.bettor,
          amount: bet.amount,
          amountFormatted: parseFloat(bet.amount).toFixed(2),
          isForOutcome: bet.isForOutcome,
          eventType: bet.eventType || 'bet', // Default to 'bet' if not provided
          action: bet.action || (bet.eventType === 'liquidity_added' ? 'Added liquidity' : 'Placed bet'),
          icon: bet.icon || (bet.eventType === 'liquidity_added' ? '💧' : '🎯'),
          odds: bet.odds,
          currency: bet.currency || 'STT',
          createdAt: new Date(bet.timestamp * 1000).toISOString(),
          timeAgo: `${Math.floor((Date.now() - bet.timestamp * 1000) / 60000)}m ago`,
          pool: {
            predictedOutcome: '',
            league: bet.league || 'Unknown',
            category: bet.category,
            homeTeam: '',
            awayTeam: '',
            title: bet.poolTitle,
            useBitr: false,
            odds: bet.odds || 0,
            creatorAddress: ''
          }
        }));
        
        setApiData(transformedBets);
      } catch (error) {
        console.error('Failed to fetch recent bets:', error);
        setApiData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentBets();
    
    // Set up polling interval
    const interval = setInterval(fetchRecentBets, 60000); // 1 minute
    return () => clearInterval(interval);
  }, []);

  // Use API data or fallback to demo data
  const bets = apiData || demoBets;

  // Auto-rotate through bets
  useEffect(() => {
    if (bets.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % bets.length);
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [bets.length]);

  const formatTimeAgo = (timeAgo: string): string => {
    // Use the timeAgo string directly from the API
    return timeAgo;
  };

  const getCategoryIcon = (category: string, homeTeam?: string) => {
    const poolIcon = getPoolIcon(category, homeTeam);
    return poolIcon.icon;
  };


  if (isLoading && bets.length === 0) {
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
            <TrophyIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
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
          {bets.map((bet: RecentBet) => (
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
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-white truncate">
                      {bet.bettorAddress.slice(0, 6)}...{bet.bettorAddress.slice(-4)}
                    </p>
                    <p className="text-xs text-gray-400 truncate hidden sm:block">
                      {bet.bettorAddress}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <ClockIcon className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-400">
                      {formatTimeAgo(bet.timeAgo)}
                    </span>
                  </div>
                </div>

                {/* Bet Details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-lg">{getCategoryIcon(bet.pool.category, bet.pool.homeTeam)}</span>
                    <span className="text-xs sm:text-sm font-medium text-white truncate">
                      {bet.pool.title}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 sm:gap-2">
                      {/* Event Type Badge */}
                      <div className="flex items-center gap-1">
                        <span className="text-sm">{bet.icon}</span>
                        <span className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${
                          bet.eventType === 'pool_created' 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : bet.eventType === 'liquidity_added'
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : bet.isForOutcome 
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                            : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        }`}>
                          {bet.eventType === 'pool_created' ? 'Created' : 
                           bet.eventType === 'liquidity_added' ? 'LP Added' :
                           bet.isForOutcome ? 'YES' : 'NO'}
                        </span>
                      </div>
                      
                      {/* Action Badge */}
                      {bet.action && (
                        <span className="text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-gray-500/20 text-gray-400">
                          {bet.action}
                        </span>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <p className="text-xs sm:text-sm font-bold text-white">
                        {bet.amountFormatted} {bet.currency || (bet.pool.useBitr ? 'BITR' : 'STT')}
                      </p>
                      {bet.odds && (
                        <p className="text-xs text-gray-400">
                          @{(bet.odds / 100).toFixed(2)}x odds
                        </p>
                      )}
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
          {bets.map((bet: RecentBet, index: number) => (
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

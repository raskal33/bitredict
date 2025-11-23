"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { 
  TrophyIcon, 
  CurrencyDollarIcon,
  ClockIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { optimizedPoolService } from "@/services/optimizedPoolService";
import { getPoolIcon } from "@/services/crypto-icons";
import { useBetUpdates, usePoolCreatedUpdates, useLiquidityAddedUpdates } from "@/hooks/useSomniaStreams";

interface RecentBet {
  id: string | number;
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
  
  // ✅ Deduplication: Track seen events to prevent duplicates
  const seenEventsRef = useRef<Set<string>>(new Set());
  
  // Load seen events from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('seen_recent_bets');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          seenEventsRef.current = new Set(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load seen events from localStorage:', e);
    }
  }, []);

  // ✅ CRITICAL: Use real-time updates via SDS for all event types
  
  // Helper to create unique event key for deduplication
  const createEventKey = (poolId: string, eventType: string, address: string, timestamp: number): string => {
    return `${eventType}:${poolId}:${address}:${timestamp}`;
  };
  
  // Helper to check if event was already seen
  const isEventSeen = (key: string): boolean => {
    return seenEventsRef.current.has(key);
  };
  
  // Helper to mark event as seen
  const markEventSeen = (key: string) => {
    seenEventsRef.current.add(key);
    // Persist to localStorage
    try {
      const eventsArray = Array.from(seenEventsRef.current);
      // Keep only last 500 events
      const trimmed = eventsArray.slice(-500);
      localStorage.setItem('seen_recent_bets', JSON.stringify(trimmed));
      seenEventsRef.current = new Set(trimmed);
    } catch (e) {
      console.warn('Failed to save seen events to localStorage:', e);
    }
  };
  
  // Helper to format pool ID for display (truncate huge numbers)
  const formatPoolId = (poolId: string | number | undefined): string => {
    if (!poolId) return 'Unknown';
    const poolIdStr = poolId.toString();
    // If it's a huge number, truncate it
    if (poolIdStr.length > 20) {
      return `Pool #${poolIdStr.slice(0, 10)}...${poolIdStr.slice(-6)}`;
    }
    return `Pool #${poolIdStr}`;
  };
  
  // Helper to fetch pool info asynchronously (non-blocking)
  const fetchPoolInfo = async (poolId: string) => {
    try {
      // Try to get pool by ID (convert string to number)
      const poolIdNum = parseInt(poolId, 10);
      if (!isNaN(poolIdNum)) {
        const pool = await optimizedPoolService.getPool(poolIdNum);
        return {
          title: pool.title || formatPoolId(poolId),
          currency: pool.currency || 'STT',
          category: pool.category || 'Unknown'
        };
      }
      return null;
    } catch (e) {
      console.warn(`Failed to fetch pool info for ${poolId}:`, e);
      return null;
    }
  };
  
  // Handle bet placed events
  useBetUpdates((betData: {
    poolId?: string | number;
    bettor?: string;
    amount?: string;
    isForOutcome?: boolean;
    timestamp?: number;
    poolTitle?: string;
    category?: string;
    league?: string;
    odds?: number;
    currency?: string;
  }) => {
    console.log('📡 Recent Bets Lane: Received real-time bet update:', betData);
    
    // Validate required fields
    const poolIdStr = betData.poolId?.toString() || '';
    if (!poolIdStr || poolIdStr === '0') {
      console.warn('⚠️ Skipping bet with invalid poolId:', poolIdStr);
      return;
    }
    
    // Extract bettor address from multiple possible fields
    const betDataAny = betData as unknown as Record<string, unknown>;
    const bettorAddress = (betDataAny.bettorAddress as string) || betData.bettor || (betDataAny.bettor_address as string) || '';
    
    // Skip if bettor address is invalid (looks like an offset)
    if (bettorAddress && /^0x0{30,39}[0-9a-f]{1,9}$/i.test(bettorAddress) && parseInt(bettorAddress, 16) < 1000) {
      console.warn('⚠️ Skipping bet with invalid bettor address (looks like offset):', bettorAddress);
      return;
    }
    
    // Validate bettor address
    if (!bettorAddress || bettorAddress.length !== 42 || !bettorAddress.startsWith('0x')) {
      console.warn('⚠️ Skipping bet with invalid bettor address format:', bettorAddress);
      return;
    }
    
    const timestamp = betData.timestamp || Math.floor(Date.now() / 1000);
    const eventKey = createEventKey(poolIdStr, 'bet', bettorAddress, timestamp);
    
    // Skip if already seen
    if (isEventSeen(eventKey)) {
      console.log('⚠️ Skipping duplicate bet event:', eventKey);
      return;
    }
    
    // Mark as seen
    markEventSeen(eventKey);
    
    // Convert amount from wei to token if needed
    let amountInToken = betData.amount || '0';
    const amountNum = parseFloat(amountInToken);
    if (amountNum > 1e12) {
      amountInToken = (amountNum / 1e18).toString(); // Bet amounts use 1e18
    }
    
    const currency = betData.currency || (betDataAny.useBitr ? 'BITR' : 'STT');
    
    // Create unique ID using poolId + bettor + timestamp
    const uniqueId = `${poolIdStr}-${bettorAddress}-${timestamp}`;
    
    const newBet: RecentBet = {
      id: uniqueId,
      poolId: poolIdStr,
      bettorAddress: bettorAddress,
      amount: amountInToken,
      amountFormatted: parseFloat(amountInToken).toFixed(2),
      isForOutcome: betData.isForOutcome !== undefined ? betData.isForOutcome : true,
      eventType: 'bet',
      action: 'Placed bet',
      icon: '🎯',
      odds: betData.odds,
      currency: currency,
      createdAt: new Date(timestamp * 1000).toISOString(),
      timeAgo: 'Just now',
      pool: {
        predictedOutcome: '',
        league: betData.league || 'Unknown',
        category: betData.category || 'Unknown',
        homeTeam: '',
        awayTeam: '',
        title: betData.poolTitle || formatPoolId(poolIdStr),
        useBitr: currency === 'BITR',
        odds: betData.odds || 0,
        creatorAddress: ''
      }
    };
    
    setApiData(prev => {
      // Check if this exact bet already exists (by unique ID)
      const exists = prev.some(bet => bet.id === uniqueId);
      if (exists) {
        console.log('⚠️ Bet already exists in state, skipping:', uniqueId);
        return prev;
      }
      return [newBet, ...prev].slice(0, 20);
    });
    
    // Fetch pool info asynchronously to update title
    if (poolIdStr && !betData.poolTitle) {
      fetchPoolInfo(poolIdStr).then(poolInfo => {
        if (poolInfo) {
          setApiData(prev => prev.map(bet => 
            bet.poolId === poolIdStr && bet.id === uniqueId
              ? { ...bet, pool: { ...bet.pool, title: poolInfo.title, category: poolInfo.category }, currency: poolInfo.currency }
              : bet
          ));
        }
      });
    }
  });
  
  // Handle pool created events
  usePoolCreatedUpdates((poolData: {
    poolId: string;
    creator: string;
    creatorStake: string;
    title?: string;
    category?: string;
    odds?: number;
    timestamp?: number;
    currency?: string;
    useBitr?: boolean;
  }) => {
    console.log('📡 Recent Bets Lane: Received pool created update:', poolData);
    
    // Validate required fields
    const poolIdStr = poolData.poolId?.toString() || '';
    if (!poolIdStr || poolIdStr === '0') {
      console.warn('⚠️ Skipping pool created with invalid poolId:', poolIdStr);
      return;
    }
    
    // Extract creator address from multiple possible fields
    const poolDataAny = poolData as unknown as Record<string, unknown>;
    const creatorAddress = (poolDataAny.creatorAddress as string) || poolData.creator || (poolDataAny.creator_address as string) || '';
    
    // Skip if creator address is invalid (looks like an offset)
    if (creatorAddress && /^0x0{30,39}[0-9a-f]{1,9}$/i.test(creatorAddress) && parseInt(creatorAddress, 16) < 1000) {
      console.warn('⚠️ Skipping pool created with invalid creator address (looks like offset):', creatorAddress);
      return;
    }
    
    // Validate creator address
    if (!creatorAddress || creatorAddress.length !== 42 || !creatorAddress.startsWith('0x')) {
      console.warn('⚠️ Skipping pool created with invalid creator address format:', creatorAddress);
      return;
    }
    
    const timestamp = poolData.timestamp || Math.floor(Date.now() / 1000);
    const eventKey = createEventKey(poolIdStr, 'pool_created', creatorAddress, timestamp);
    
    // Skip if already seen
    if (isEventSeen(eventKey)) {
      console.log('⚠️ Skipping duplicate pool created event:', eventKey);
      return;
    }
    
    // Mark as seen
    markEventSeen(eventKey);
    
    // Convert creator stake from wei to token
    let amountInToken = poolData.creatorStake || '0';
    const amountNum = parseFloat(amountInToken);
    if (amountNum > 1e12) {
      amountInToken = (amountNum / 1e18).toString();
    }
    
    const currency = poolData.currency || (poolData.useBitr || (poolDataAny.use_bitr as boolean) ? 'BITR' : 'STT');
    
    // Create unique ID using poolId + creator + timestamp
    const uniqueId = `pool-${poolIdStr}-${creatorAddress}-${timestamp}`;
    
    const newBet: RecentBet = {
      id: uniqueId,
      poolId: poolIdStr,
      bettorAddress: creatorAddress,
      amount: amountInToken,
      amountFormatted: parseFloat(amountInToken).toFixed(2),
      isForOutcome: false,
      eventType: 'pool_created',
      action: 'Created pool',
      icon: '🏗️',
      odds: poolData.odds,
      currency: currency,
      createdAt: new Date(timestamp * 1000).toISOString(),
      timeAgo: 'Just now',
      pool: {
        predictedOutcome: '',
        league: 'Unknown',
        category: poolData.category || 'Unknown',
        homeTeam: '',
        awayTeam: '',
        title: poolData.title || formatPoolId(poolIdStr),
        useBitr: currency === 'BITR',
        odds: poolData.odds || 0,
        creatorAddress: creatorAddress
      }
    };
    
    setApiData(prev => {
      // Check if this exact event already exists (by unique ID)
      const exists = prev.some(bet => bet.id === uniqueId);
      if (exists) {
        console.log('⚠️ Pool created already exists in state, skipping:', uniqueId);
        return prev;
      }
      return [newBet, ...prev].slice(0, 20);
    });
    
    // Fetch pool info asynchronously to update title
    if (poolIdStr && !poolData.title) {
      fetchPoolInfo(poolIdStr).then(poolInfo => {
        if (poolInfo) {
          setApiData(prev => prev.map(bet => 
            bet.poolId === poolIdStr && bet.id === uniqueId
              ? { ...bet, pool: { ...bet.pool, title: poolInfo.title, category: poolInfo.category }, currency: poolInfo.currency }
              : bet
          ));
        }
      });
    }
  });
  
  // Handle liquidity added events
  useLiquidityAddedUpdates((liquidityData: {
    poolId: string;
    provider: string;
    amount: string;
    timestamp: number;
    currency?: string;
  }) => {
    console.log('📡 Recent Bets Lane: Received liquidity added update:', liquidityData);
    
    // Validate required fields
    const poolIdStr = liquidityData.poolId?.toString() || '';
    if (!poolIdStr || poolIdStr === '0') {
      console.warn('⚠️ Skipping liquidity added with invalid poolId:', poolIdStr);
      return;
    }
    
    // Extract provider address from multiple possible fields
    const liquidityDataAny = liquidityData as unknown as Record<string, unknown>;
    const providerAddress = (liquidityDataAny.providerAddress as string) || liquidityData.provider || (liquidityDataAny.provider_address as string) || '';
    
    // Skip if provider address is invalid (looks like an offset)
    if (providerAddress && /^0x0{30,39}[0-9a-f]{1,9}$/i.test(providerAddress) && parseInt(providerAddress, 16) < 1000) {
      console.warn('⚠️ Skipping liquidity added with invalid provider address (looks like offset):', providerAddress);
      return;
    }
    
    // Validate provider address
    if (!providerAddress || providerAddress.length !== 42 || !providerAddress.startsWith('0x')) {
      console.warn('⚠️ Skipping liquidity added with invalid provider address format:', providerAddress);
      return;
    }
    
    const timestamp = liquidityData.timestamp || Math.floor(Date.now() / 1000);
    const eventKey = createEventKey(poolIdStr, 'liquidity_added', providerAddress, timestamp);
    
    // Skip if already seen
    if (isEventSeen(eventKey)) {
      console.log('⚠️ Skipping duplicate liquidity added event:', eventKey);
      return;
    }
    
    // Mark as seen
    markEventSeen(eventKey);
    
    // ✅ Detect if amount is in wei (large numbers) or tokens (small numbers)
    // SDS now sends token amounts, but handle both for backward compatibility
    let amountInToken = liquidityData.amount || '0';
    const amountNum = parseFloat(amountInToken);
    if (amountNum > 1e15) {
      // Amount is in wei, convert to tokens
      amountInToken = (amountNum / 1e18).toString();
    }
    // Otherwise, amount is already in tokens
    
    const currency = liquidityData.currency || 'STT';
    
    // Create unique ID using poolId + provider + timestamp
    const uniqueId = `liquidity-${poolIdStr}-${providerAddress}-${timestamp}`;
    
    const newBet: RecentBet = {
      id: uniqueId,
      poolId: poolIdStr,
      bettorAddress: providerAddress,
      amount: amountInToken,
      amountFormatted: parseFloat(amountInToken).toFixed(2),
      isForOutcome: false,
      eventType: 'liquidity_added',
      action: 'Added liquidity',
      icon: '💧',
      odds: undefined,
      currency: currency,
      createdAt: new Date(timestamp * 1000).toISOString(),
      timeAgo: 'Just now',
      pool: {
        predictedOutcome: '',
        league: 'Unknown',
        category: 'Unknown',
        homeTeam: '',
        awayTeam: '',
        title: formatPoolId(poolIdStr),
        useBitr: currency === 'BITR',
        odds: 0,
        creatorAddress: ''
      }
    };
    
    setApiData(prev => {
      // Check if this exact event already exists (by unique ID)
      const exists = prev.some(bet => bet.id === uniqueId);
      if (exists) {
        console.log('⚠️ Liquidity added already exists in state, skipping:', uniqueId);
        return prev;
      }
      return [newBet, ...prev].slice(0, 20);
    });
    
    // Fetch pool info asynchronously to update title
    if (poolIdStr) {
      fetchPoolInfo(poolIdStr).then(poolInfo => {
        if (poolInfo) {
          setApiData(prev => prev.map(bet => 
            bet.poolId === poolIdStr && bet.id === uniqueId
              ? { ...bet, pool: { ...bet.pool, title: poolInfo.title, category: poolInfo.category }, currency: poolInfo.currency }
              : bet
          ));
        }
      });
    }
  });

  // Fetch initial recent bets using optimized API service
  useEffect(() => {
    const fetchRecentBets = async () => {
      try {
        setIsLoading(true);
        const bets = await optimizedPoolService.getRecentBets(20);
        
        // Transform API data to component format
        const transformedBets: RecentBet[] = bets.map((bet) => {
          // ✅ FIX: Backend already converts amounts, but ensure they're formatted correctly
          const amount = parseFloat(bet.amount || '0');
          // Extract bettor address from multiple possible fields
          const betAny = bet as unknown as Record<string, unknown>;
          const bettorAddress = (betAny.bettorAddress as string) || bet.bettor || (betAny.bettor_address as string) || '0x0000000000000000000000000000000000000000';
          const poolIdStr = bet.poolId?.toString() || '';
          const eventType = bet.eventType || 'bet';
          const timestamp = bet.timestamp || Math.floor(Date.now() / 1000);
          
          // Create unique ID using poolId + bettor + timestamp + eventType
          const uniqueId = `${eventType}-${poolIdStr}-${bettorAddress}-${timestamp}`;
          
          return {
            id: uniqueId,
            poolId: poolIdStr,
            bettorAddress: bettorAddress,
            amount: amount.toString(),
            amountFormatted: amount.toFixed(2),
            isForOutcome: bet.isForOutcome,
            eventType: eventType,
            action: bet.action || (eventType === 'liquidity_added' ? 'Added liquidity' : eventType === 'pool_created' ? 'Created pool' : 'Placed bet'),
            icon: bet.icon || (eventType === 'liquidity_added' ? '💧' : eventType === 'pool_created' ? '🏗️' : '🎯'),
            odds: bet.odds,
            currency: bet.currency || 'STT',
            createdAt: new Date(timestamp * 1000).toISOString(),
            timeAgo: (() => {
              const timestampMs = timestamp * 1000;
              const now = Date.now();
              const diffMs = now - timestampMs;
              if (isNaN(diffMs) || diffMs < 0) return 'Just now';
              const diffMins = Math.floor(diffMs / 60000);
              if (diffMins < 1) return 'Just now';
              if (diffMins < 60) return `${diffMins}m ago`;
              const diffHours = Math.floor(diffMins / 60);
              if (diffHours < 24) return `${diffHours}h ago`;
              const diffDays = Math.floor(diffHours / 24);
              return `${diffDays}d ago`;
            })(),
            pool: {
              predictedOutcome: '',
              league: bet.league || 'Unknown',
              category: bet.category || 'Unknown',
              homeTeam: '',
              awayTeam: '',
              title: bet.poolTitle || formatPoolId(poolIdStr),
              useBitr: bet.currency === 'BITR',
              odds: bet.odds || 0,
              creatorAddress: ''
            }
          };
        });
        
        setApiData(transformedBets);
      } catch (error) {
        console.error('Failed to fetch recent bets:', error);
        setApiData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentBets();
    
    // ✅ FIX: Reduced polling interval as fallback (real-time updates via WebSocket/SDS are primary)
    // Only poll every 5 minutes as backup if WebSocket/SDS fails
    const interval = setInterval(fetchRecentBets, 300000); // 5 minutes (fallback only)
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
          {bets.map((bet: RecentBet, index: number) => (
            <motion.div
              key={`${bet.id}-${bet.poolId}-${bet.bettorAddress}-${index}`}
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
                      {bet.bettorAddress && typeof bet.bettorAddress === 'string' && bet.bettorAddress.length >= 10
                        ? `${bet.bettorAddress.slice(0, 6)}...${bet.bettorAddress.slice(-4)}`
                        : 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-400 truncate hidden sm:block">
                      {bet.bettorAddress && typeof bet.bettorAddress === 'string' ? bet.bettorAddress : 'Unknown address'}
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
          Real-time updates via Somnia Data Streams
        </div>
      </div>
    </div>
  );
}

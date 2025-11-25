/**
 * Oddyssey Live Updates Component
 * 
 * Real-time cycle resolution and slip evaluation notifications
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useCycleUpdates, useSlipUpdates } from '@/hooks/useSomniaStreams';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/utils/toast';
import { useAccount } from 'wagmi';
import { useSoundEffects } from '@/hooks/useSoundEffects';

export function OddysseyLiveUpdates() {
  const { address } = useAccount();
  const [cycleStatus, setCycleStatus] = useState<string | null>(null);
  const [userSlipResult, setUserSlipResult] = useState<{
    isWinner: boolean;
    rank: number;
    prize: string;
    currency: string; // ✅ Add currency to state
  } | null>(null);
  const { playNotification, playWin } = useSoundEffects({ volume: 0.5 });

  // ✅ Rate limiting: Track last notification to prevent bombing
  const lastCycleNotificationRef = useRef<Map<string, number>>(new Map());
  const lastSlipNotificationRef = useRef<Map<string, number>>(new Map());
  const CYCLE_NOTIFICATION_RATE_LIMIT_MS = 5000; // Max 1 notification per 5 seconds per cycle
  const SLIP_NOTIFICATION_RATE_LIMIT_MS = 10000; // Max 1 notification per 10 seconds per slip
  
  // ✅ Track cycles user has interacted with (placed slips)
  const userCyclesRef = useRef<Set<string>>(new Set());
  
  // Load user's cycles from localStorage on mount
  useEffect(() => {
    if (!address) return;
    try {
      const stored = localStorage.getItem(`user_cycles_${address.toLowerCase()}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          userCyclesRef.current = new Set(parsed);
          console.log(`✅ Loaded ${parsed.length} cycles from localStorage for user ${address}`);
        }
      }
    } catch (e) {
      console.warn('Failed to load user cycles from localStorage:', e);
    }
  }, [address]);
  
  // Save user's cycles to localStorage
  const saveUserCycles = (cycleId: string) => {
    if (!address) return;
    try {
      userCyclesRef.current.add(cycleId);
      const cyclesArray = Array.from(userCyclesRef.current);
      localStorage.setItem(`user_cycles_${address.toLowerCase()}`, JSON.stringify(cyclesArray));
      // Clean up old cycles (keep last 100)
      if (userCyclesRef.current.size > 100) {
        const firstCycle = userCyclesRef.current.values().next().value;
        if (firstCycle) {
          userCyclesRef.current.delete(firstCycle);
        }
      }
    } catch (e) {
      console.warn('Failed to save user cycles to localStorage:', e);
    }
  };

  // ✅ Helper to normalize IDs (convert BigInt/hex to readable numbers) - safety check
  const normalizeId = (id: unknown): string => {
    if (!id || id === '0') return '0';
    if (typeof id === 'string') {
      // If it's a hex string (starts with 0x), convert to number
      if (id.startsWith('0x')) {
        try {
          const bigInt = BigInt(id);
          return bigInt.toString();
        } catch {
          return id;
        }
      }
      // If it's already a number string, return as-is
      return id;
    }
    if (typeof id === 'bigint' || typeof id === 'number') {
      return id.toString();
    }
    return String(id);
  };
  
  // ✅ Helper to format large IDs for display (truncate huge numbers)
  const formatIdForDisplay = (id: string): string => {
    if (!id || id === '0') return '0';
    const idStr = id.toString();
    // If ID is very large (> 20 digits), truncate to last 8 digits for readability
    if (idStr.length > 20) {
      return `#${idStr.slice(-8)}`;
    }
    return `#${idStr}`;
  };

  // Listen for cycle resolutions
  useCycleUpdates((cycleData) => {
    // ✅ CRITICAL: Only process cycle:resolved events (prevent notifications on unrelated transactions)
    const cycleDataRecord = cycleData as unknown as Record<string, unknown>;
    if (!cycleData.cycleId && !cycleDataRecord.cycle_id && !cycleDataRecord.cycleId) {
      console.log('⚠️ OddysseyLiveUpdates: Skipping non-cycle event:', cycleData);
      return;
    }
    
    // ✅ CRITICAL: Normalize cycleId explicitly (safety check even if useSomniaStreams normalizes)
    const rawCycleId = cycleData.cycleId || (cycleDataRecord.cycle_id as string) || (cycleDataRecord.cycleId as string) || '0';
    const cycleId = normalizeId(rawCycleId);
    
    if (cycleId === '0' || !cycleId || cycleId === 'Unknown') {
      console.warn('⚠️ OddysseyLiveUpdates: Invalid cycleId after normalization:', { raw: rawCycleId, normalized: cycleId, data: cycleData });
      return;
    }
    
    // ✅ CRITICAL: Require valid timestamp - reject events without timestamp
    const eventTimestamp = cycleData.timestamp;
    if (!eventTimestamp || typeof eventTimestamp !== 'number' || eventTimestamp <= 0) {
      console.log(`⚠️ OddysseyLiveUpdates: Rejecting cycle:resolved event without valid timestamp:`, cycleData);
      return;
    }
    
    // ✅ TIME FILTERING: Only show recent events (within last 1 minute for real-time)
    const now = Math.floor(Date.now() / 1000);
    const oneMinuteAgo = now - (1 * 60); // ✅ Changed from 5 minutes to 1 minute for real-time only
    if (eventTimestamp < oneMinuteAgo) {
      console.log(`⚠️ OddysseyLiveUpdates: Skipping old cycle:resolved event (cycle: ${cycleId}, timestamp: ${eventTimestamp}, age: ${now - eventTimestamp}s)`);
      return;
    }
    
    // ✅ CRITICAL: Only show cycle resolved notifications for cycles user interacted with (placed a slip)
    if (!address) {
      console.log(`⚠️ OddysseyLiveUpdates: No user address, skipping cycle resolved notification`);
      return;
    }
    
    if (!userCyclesRef.current.has(cycleId)) {
      console.log(`⚠️ OddysseyLiveUpdates: User ${address} has not interacted with cycle ${cycleId}, skipping notification`);
      return; // User hasn't placed a slip in this cycle, skip notification (show in Live Activity instead)
    }
    
    // ✅ Rate limiting: Prevent duplicate notifications for the same cycle
    const lastTime = lastCycleNotificationRef.current.get(cycleId);
    const currentTime = Date.now();
    if (lastTime && (currentTime - lastTime) < CYCLE_NOTIFICATION_RATE_LIMIT_MS) {
      console.log(`⚠️ OddysseyLiveUpdates: Rate limit: Skipping cycle ${cycleId} notification (last ${currentTime - lastTime}ms ago)`);
      return;
    }
    lastCycleNotificationRef.current.set(cycleId, currentTime);
    
    // ✅ CRITICAL: Detect currency from cycle data (useBitr flag or currency field)
    const useBitr = (cycleDataRecord.useBitr as boolean) ?? (cycleDataRecord.use_bitr as boolean) ?? false;
    const currency = (cycleDataRecord.currency as string) || (useBitr ? 'BITR' : 'STT');
    const currencySymbol = currency.toUpperCase();
    
    // ✅ CRITICAL: Backend sends prizePool as raw wei string (e.g., "1000000000000000000" for 1 token)
    // Always convert from wei to token (divide by 1e18)
    let prizePoolInToken = cycleData.prizePool || '0';
    
    // ✅ Handle BigInt strings properly (from backend JSON)
    try {
      // Convert string to BigInt to handle very large numbers
      const prizePoolBigInt = BigInt(prizePoolInToken);
      const prizePoolNum = Number(prizePoolBigInt);
      
      // ✅ CRITICAL: Backend ALWAYS sends wei amounts, so ALWAYS convert
      if (prizePoolNum > 0) {
        // Convert from wei to token
        prizePoolInToken = (prizePoolNum / 1e18).toString();
        console.log(`   💰 Converted prize pool from wei: ${prizePoolBigInt.toString()} → ${prizePoolInToken} ${currencySymbol}`);
      } else {
        console.warn(`   ⚠️ Prize pool value is zero or negative: ${prizePoolBigInt.toString()}, using 0`);
        prizePoolInToken = '0';
      }
    } catch {
      // If BigInt conversion fails, try parseFloat as fallback
      const prizePoolNum = parseFloat(prizePoolInToken);
      if (prizePoolNum > 0) {
        prizePoolInToken = (prizePoolNum / 1e18).toString();
        console.log(`   💰 Converted prize pool from wei (fallback): ${prizePoolNum} → ${prizePoolInToken} ${currencySymbol}`);
      } else {
        console.warn(`   ⚠️ Prize pool value is zero or negative: ${prizePoolNum}, using 0`);
        prizePoolInToken = '0';
      }
    }
    
    const formattedPrizePool = parseFloat(prizePoolInToken).toFixed(2);
    const displayCycleId = formatIdForDisplay(cycleId);
    
    setCycleStatus(`Cycle ${displayCycleId} resolved! 🎉 Prize pool: ${formattedPrizePool} ${currencySymbol}`);
    
    // ✅ CRITICAL: Use unique toast ID with normalized cycleId + timestamp to prevent duplicates
    // Include timestamp to prevent same cycle from different times triggering multiple notifications
    const toastId = `cycle-resolved-${cycleId}-${eventTimestamp}`;
    
    // ✅ CRITICAL: react-hot-toast automatically deduplicates by ID
    toast.success(
      `🏆 Cycle ${displayCycleId} Results Are In!`,
      { 
        duration: 5000,
        id: toastId // ✅ Unique deduplication key for toast (react-hot-toast handles deduplication)
      }
    );
    playNotification();

    // Clear status after 10 seconds
    setTimeout(() => setCycleStatus(null), 10000);
  });

  // Listen for slip evaluations (for current user)
  useSlipUpdates((slipData) => {
    // ✅ Safety check: Skip if player is missing or invalid
    if (!slipData.player || typeof slipData.player !== 'string') {
      console.warn('⚠️ OddysseyLiveUpdates: Skipping slip update - missing or invalid player:', slipData);
      return;
    }
    
    // ✅ TIME FILTERING: Only show recent events (within last 1 minute for real-time)
    const slipDataRecord = slipData as unknown as Record<string, unknown>;
    const eventTimestamp = (slipDataRecord.timestamp as number) || Math.floor(Date.now() / 1000);
    const now = Math.floor(Date.now() / 1000);
    const oneMinuteAgo = now - (1 * 60); // ✅ Changed to 1 minute for real-time only
    if (eventTimestamp < oneMinuteAgo) {
      console.log(`⚠️ OddysseyLiveUpdates: Skipping old slip:evaluated event (timestamp: ${eventTimestamp})`);
      return;
    }
    
    // Only show if it's the current user's slip
    if (slipData.player.toLowerCase() === address?.toLowerCase()) {
      // ✅ CRITICAL: Detect currency from slip data (useBitr flag or currency field)
      const slipDataRecord = slipData as unknown as Record<string, unknown>;
      
      // ✅ CRITICAL: Track cycle when user's slip is evaluated (user has interacted with this cycle)
      const cycleId = normalizeId((slipDataRecord.cycleId as string) || (slipDataRecord.cycle_id as string) || '0');
      if (cycleId && cycleId !== '0') {
        saveUserCycles(cycleId);
        console.log(`✅ OddysseyLiveUpdates: Tracked cycle ${cycleId} for user ${address} (slip evaluated)`);
      }
      const slipUseBitr = (slipDataRecord.useBitr as boolean) ?? (slipDataRecord.use_bitr as boolean) ?? false;
      const slipCurrency = (slipDataRecord.currency as string) || (slipUseBitr ? 'BITR' : 'STT');
      const slipCurrencySymbol = slipCurrency.toUpperCase();
      
      // ✅ Normalize slipId for deduplication
      const slipId = normalizeId((slipDataRecord.slipId as string) || (slipDataRecord.slip_id as string) || '0');
      
      // ✅ Rate limiting: Prevent duplicate notifications for the same slip
      const lastTime = lastSlipNotificationRef.current.get(slipId);
      const currentTime = Date.now();
      if (lastTime && (currentTime - lastTime) < SLIP_NOTIFICATION_RATE_LIMIT_MS) {
        console.log(`⚠️ OddysseyLiveUpdates: Rate limit: Skipping slip ${slipId} notification (last ${currentTime - lastTime}ms ago)`);
        return;
      }
      lastSlipNotificationRef.current.set(slipId, currentTime);
      
      // ✅ Normalize prizeAmount from wei to token (like RecentBetsLane)
      let prizeAmountInToken = (slipDataRecord.prizeAmount as string) || (slipDataRecord.prize as string) || '0';
      const prizeAmountNum = parseFloat(prizeAmountInToken.toString());
      if (prizeAmountNum > 1e12 && prizeAmountNum < 1e30) {
        prizeAmountInToken = (prizeAmountNum / 1e18).toString(); // Convert from wei to token
      } else if (prizeAmountNum >= 1e30) {
        console.warn(`   ⚠️ Prize amount seems invalid (too large): ${prizeAmountNum}, using 0`);
        prizeAmountInToken = '0';
      }
      const formattedPrize = parseFloat(prizeAmountInToken.toString()).toFixed(2);
      
      // ✅ Normalize rank and winner status
      const rank = (slipDataRecord.rank as number) ?? (slipDataRecord.leaderboard_rank as number) ?? 0;
      const isWinner = (slipDataRecord.isWinner as boolean) ?? (rank > 0 && rank <= 5);
      
      // ✅ Normalize correct predictions
      const correctCount = (slipDataRecord.correctCount as number) ?? (slipDataRecord.correctPredictions as number) ?? 0;
      const totalPredictions = (slipDataRecord.totalPredictions as number) ?? 10; // Oddyssey always has 10 predictions
      
      setUserSlipResult({
        isWinner: isWinner,
        rank: Number(rank),
        prize: formattedPrize,
        currency: slipCurrencySymbol // ✅ Store currency in state
      });

      if (isWinner) {
        // ✅ CRITICAL: Use unique toast ID with slipId + timestamp to prevent duplicates
        const toastId = `slip-won-${slipId}-${Date.now()}`;
        
        // ✅ CRITICAL: react-hot-toast automatically deduplicates by ID
        // Winner notification + BIG sound
        toast.success(
          <div>
            <div className="font-bold">🎉 You Won!</div>
            <div>Rank #{rank}</div>
            <div>Prize: {formattedPrize} {slipCurrencySymbol}</div>
          </div>,
          { 
            duration: 8000,
            id: toastId, // ✅ Unique deduplication key for toast
            position: 'top-right' // ✅ CRITICAL: Explicitly set position to top-right
          }
        );
        playWin();
      } else {
        // ✅ CRITICAL: Use unique toast ID with slipId + timestamp to prevent duplicates
        const toastId = `slip-evaluated-${slipId}-${Date.now()}`;
        
        // ✅ CRITICAL: react-hot-toast automatically deduplicates by ID
        // Participation notification
        toast.success(
          `✅ Slip evaluated: ${correctCount}/${totalPredictions} correct`,
          { 
            duration: 5000,
            id: toastId, // ✅ Unique deduplication key for toast
            position: 'top-right' // ✅ CRITICAL: Explicitly set position to top-right
          }
        );
        playNotification();
      }

      // Clear result after 15 seconds
      setTimeout(() => setUserSlipResult(null), 15000);
    }
  });

  return (
    <>
      {/* Cycle Status Banner */}
      <AnimatePresence>
        {cycleStatus && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-full shadow-2xl">
              <p className="font-semibold">{cycleStatus}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Slip Result Modal */}
      <AnimatePresence>
        {userSlipResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setUserSlipResult(null)}
          >
            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              className={`${
                userSlipResult.isWinner
                  ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                  : 'bg-gradient-to-br from-gray-700 to-gray-800'
              } p-8 rounded-2xl shadow-2xl max-w-md w-full text-center`}
              onClick={(e) => e.stopPropagation()}
            >
              {userSlipResult.isWinner ? (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className="text-6xl mb-4"
                  >
                    🏆
                  </motion.div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Congratulations!
                  </h2>
                  <p className="text-white/90 mb-4">
                    You ranked #{userSlipResult.rank}
                  </p>
                  <div className="bg-white/20 backdrop-blur rounded-lg p-4 mb-4">
                    <p className="text-sm text-white/70 mb-1">Your Prize</p>
                    <p className="text-3xl font-bold text-white">
                      {userSlipResult.prize} {userSlipResult.currency || 'STT'}
                    </p>
                  </div>
                  <button
                    onClick={() => setUserSlipResult(null)}
                    className="bg-white text-orange-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Awesome! 🎉
                  </button>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-4">📊</div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Results Are In
                  </h2>
                  <p className="text-white/70 mb-4">
                    Your slip has been evaluated
                  </p>
                  <button
                    onClick={() => setUserSlipResult(null)}
                    className="bg-white/20 text-white px-6 py-2 rounded-lg font-semibold hover:bg-white/30 transition-colors"
                  >
                    View Details
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}



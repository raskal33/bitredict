/**
 * Oddyssey Live Updates Component
 * 
 * Real-time cycle resolution and slip evaluation notifications
 */

'use client';

import { useState, useRef } from 'react';
import { useCycleUpdates, useSlipUpdates } from '@/hooks/useSomniaStreams';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useAccount } from 'wagmi';
import { useSoundEffects } from '@/hooks/useSoundEffects';

export function OddysseyLiveUpdates() {
  const { address } = useAccount();
  const [cycleStatus, setCycleStatus] = useState<string | null>(null);
  const [userSlipResult, setUserSlipResult] = useState<{
    isWinner: boolean;
    rank: number;
    prize: string;
  } | null>(null);
  const { playNotification, playWin } = useSoundEffects({ volume: 0.5 });

  // ✅ Rate limiting: Track last notification to prevent bombing
  const lastCycleNotificationRef = useRef<Map<string, number>>(new Map());
  const CYCLE_NOTIFICATION_RATE_LIMIT_MS = 5000; // Max 1 notification per 5 seconds per cycle

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

  // Listen for cycle resolutions
  useCycleUpdates((cycleData) => {
    // ✅ CRITICAL: Normalize cycleId explicitly (safety check even if useSomniaStreams normalizes)
    const cycleDataRecord = cycleData as Record<string, unknown>;
    const rawCycleId = cycleData.cycleId || (cycleDataRecord.cycle_id as string) || '0';
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
    
    // ✅ Rate limiting: Prevent duplicate notifications for the same cycle
    const lastTime = lastCycleNotificationRef.current.get(cycleId);
    const currentTime = Date.now();
    if (lastTime && (currentTime - lastTime) < CYCLE_NOTIFICATION_RATE_LIMIT_MS) {
      console.log(`⚠️ OddysseyLiveUpdates: Rate limit: Skipping cycle ${cycleId} notification (last ${currentTime - lastTime}ms ago)`);
      return;
    }
    lastCycleNotificationRef.current.set(cycleId, currentTime);
    
    // ✅ Normalize prizePool from wei to STT (only if it's in wei format)
    let prizePoolInSTT = cycleData.prizePool || '0';
    const prizePoolNum = parseFloat(prizePoolInSTT);
    
    // ✅ CRITICAL: Only convert if it's clearly in wei (very large number > 1e12)
    // If it's already in STT format (small number), don't convert
    if (prizePoolNum > 1e12 && prizePoolNum < 1e30) {
      // Likely in wei, convert to STT
      prizePoolInSTT = (prizePoolNum / 1e18).toString();
      console.log(`   💰 Converted prize pool from wei: ${prizePoolNum} → ${prizePoolInSTT} STT`);
    } else if (prizePoolNum >= 1e30) {
      // Extremely large number, might be a hash or invalid - log warning
      console.warn(`   ⚠️ Prize pool value seems invalid (too large): ${prizePoolNum}, using 0`);
      prizePoolInSTT = '0';
    } else {
      // Already in STT format or small number, use as-is
      console.log(`   💰 Prize pool already in STT format: ${prizePoolInSTT}`);
    }
    
    const formattedPrizePool = parseFloat(prizePoolInSTT).toFixed(2);
    
    setCycleStatus(`Cycle ${cycleId} resolved! 🎉 Prize pool: ${formattedPrizePool} STT`);
    
    // ✅ Use unique toast ID with normalized cycleId to prevent duplicates
    const toastId = `cycle-resolved-${cycleId}`;
    toast.success(
      `🏆 Cycle ${cycleId} Results Are In!`,
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
    
    // ✅ TIME FILTERING: Only show recent events (within last 5 minutes)
    const slipDataRecord = slipData as unknown as Record<string, unknown>;
    const eventTimestamp = (slipDataRecord.timestamp as number) || Math.floor(Date.now() / 1000);
    const now = Math.floor(Date.now() / 1000);
    const fiveMinutesAgo = now - (5 * 60);
    if (eventTimestamp < fiveMinutesAgo) {
      console.log(`⚠️ OddysseyLiveUpdates: Skipping old slip:evaluated event (timestamp: ${eventTimestamp})`);
      return;
    }
    
    // Only show if it's the current user's slip
    if (slipData.player.toLowerCase() === address?.toLowerCase()) {
      // ✅ Normalize prizeAmount from wei to STT (like RecentBetsLane)
      const slipDataRecord = slipData as unknown as Record<string, unknown>;
      let prizeAmountInSTT = (slipDataRecord.prizeAmount as string) || (slipDataRecord.prize as string) || '0';
      const prizeAmountNum = parseFloat(prizeAmountInSTT.toString());
      if (prizeAmountNum > 1e12) {
        prizeAmountInSTT = (prizeAmountNum / 1e18).toString(); // Convert from wei to STT
      }
      const formattedPrize = parseFloat(prizeAmountInSTT.toString()).toFixed(2);
      
      // ✅ Normalize rank and winner status
      const rank = (slipDataRecord.rank as number) ?? (slipDataRecord.leaderboard_rank as number) ?? 0;
      const isWinner = (slipDataRecord.isWinner as boolean) ?? (rank > 0 && rank <= 5);
      
      // ✅ Normalize correct predictions
      const correctCount = (slipDataRecord.correctCount as number) ?? (slipDataRecord.correctPredictions as number) ?? 0;
      const totalPredictions = (slipDataRecord.totalPredictions as number) ?? 10; // Oddyssey always has 10 predictions
      
      setUserSlipResult({
        isWinner: isWinner,
        rank: Number(rank),
        prize: formattedPrize
      });

      if (isWinner) {
        // Winner notification + BIG sound
        toast.success(
          <div>
            <div className="font-bold">🎉 You Won!</div>
            <div>Rank #{rank}</div>
            <div>Prize: {formattedPrize} STT</div>
          </div>,
          { duration: 8000 }
        );
        playWin();
      } else {
        // Participation notification
        toast(
          `Your slip evaluated: ${correctCount}/${totalPredictions} correct`,
          { icon: '📊', duration: 5000 }
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
                      {userSlipResult.prize} STT
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



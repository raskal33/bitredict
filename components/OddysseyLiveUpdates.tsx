/**
 * Oddyssey Live Updates Component
 * 
 * Real-time cycle resolution and slip evaluation notifications
 */

'use client';

import { useState } from 'react';
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

  // Listen for cycle resolutions
  useCycleUpdates((cycleData) => {
    // ✅ Normalize cycleId (convert BigInt/hex to readable number)
    const normalizeId = (id: unknown): string => {
      if (!id || id === '0') return 'Unknown';
      if (typeof id === 'string' && id.startsWith('0x')) {
        try {
          return BigInt(id).toString();
        } catch {
          return id;
        }
      }
      return String(id);
    };
    
    const cycleId = normalizeId(cycleData.cycleId);
    if (cycleId === 'Unknown' || cycleId === '0') {
      console.warn('⚠️ OddysseyLiveUpdates: Invalid cycleId:', cycleData.cycleId);
      return;
    }
    
    // ✅ TIME FILTERING: Only show recent events (within last 5 minutes)
    const eventTimestamp = cycleData.timestamp || Math.floor(Date.now() / 1000);
    const now = Math.floor(Date.now() / 1000);
    const fiveMinutesAgo = now - (5 * 60);
    if (eventTimestamp < fiveMinutesAgo) {
      console.log(`⚠️ OddysseyLiveUpdates: Skipping old cycle:resolved event (cycle: ${cycleId}, timestamp: ${eventTimestamp})`);
      return;
    }
    
    // ✅ Normalize prizePool from wei to STT (like RecentBetsLane)
    let prizePoolInSTT = cycleData.prizePool || '0';
    const prizePoolNum = parseFloat(prizePoolInSTT);
    if (prizePoolNum > 1e12) {
      prizePoolInSTT = (prizePoolNum / 1e18).toString(); // Convert from wei to STT
    }
    const formattedPrizePool = parseFloat(prizePoolInSTT).toFixed(2);
    
    setCycleStatus(`Cycle ${cycleId} resolved! 🎉 Prize pool: ${formattedPrizePool} STT`);
    
    // ✅ Use unique toast ID with timestamp to prevent duplicates
    const toastId = `cycle-resolved-${cycleId}-${eventTimestamp}`;
    toast.success(
      `🏆 Cycle ${cycleId} Results Are In!`,
      { 
        duration: 5000,
        id: toastId // ✅ Unique deduplication key for toast
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



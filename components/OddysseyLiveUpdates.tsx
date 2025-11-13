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
    setCycleStatus(`Cycle ${cycleData.cycleId} resolved! 🎉 Prize pool: ${cycleData.prizePool} STT`);
    
    toast.success(
      `🏆 Cycle ${cycleData.cycleId} Results Are In!`,
      { duration: 5000 }
    );
    playNotification();

    // Clear status after 10 seconds
    setTimeout(() => setCycleStatus(null), 10000);
  });

  // Listen for slip evaluations (for current user)
  useSlipUpdates((slipData) => {
    // Only show if it's the current user's slip
    if (slipData.player.toLowerCase() === address?.toLowerCase()) {
      setUserSlipResult({
        isWinner: slipData.isWinner,
        rank: slipData.rank,
        prize: slipData.prizeAmount
      });

      if (slipData.isWinner) {
        // Winner notification + BIG sound
        toast.success(
          <div>
            <div className="font-bold">🎉 You Won!</div>
            <div>Rank #{slipData.rank}</div>
            <div>Prize: {slipData.prizeAmount} STT</div>
          </div>,
          { duration: 8000 }
        );
        playWin();
      } else {
        // Participation notification
        toast(
          `Your slip evaluated: ${slipData.correctPredictions}/${slipData.totalPredictions} correct`,
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



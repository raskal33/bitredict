/**
 * Real-time Pool Progress Component
 * 
 * Shows live fill percentage with smooth animations
 * Updates without page refresh using SDS
 */

'use client';

import { useState } from 'react';
import { usePoolProgress, useBetUpdates } from '@/hooks/useSomniaStreams';
import { motion } from 'framer-motion';
import { useAnimationProps } from '@/utils/animationUtils';

interface RealtimePoolProgressProps {
  poolId: string;
  initialFillPercentage?: number;
  initialParticipants?: number;
  initialBetCount?: number; // ✅ Added bet count
}

export function RealtimePoolProgress({
  poolId,
  initialFillPercentage = 0,
  initialParticipants = 0,
  initialBetCount = 0 // ✅ Added bet count
}: RealtimePoolProgressProps) {
  const [fillPercentage, setFillPercentage] = useState(initialFillPercentage);
  const [participants, setParticipants] = useState(initialParticipants);
  const [betCount, setBetCount] = useState(initialBetCount); // ✅ Added bet count state
  const [isUpdating, setIsUpdating] = useState(false);
  const { animationsEnabled, getMotionProps } = useAnimationProps();

  // Subscribe to real-time progress updates for this specific pool
  usePoolProgress(poolId, (progressData) => {
    setIsUpdating(true);
    setFillPercentage(progressData.fillPercentage);
    setParticipants(progressData.participantCount);
    setBetCount(progressData.betCount || 0); // ✅ Update bet count
    
    // Flash animation
    setTimeout(() => setIsUpdating(false), 1000);
  });

  // Also update on new bets
  useBetUpdates((betData) => {
    if (betData.poolId === poolId) {
      setIsUpdating(true);
      setTimeout(() => setIsUpdating(false), 1000);
    }
  });

  return (
    <div className="space-y-2">
      {/* Progress Bar */}
      <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
        {animationsEnabled ? (
          <>
            <motion.div
              className={`h-full rounded-full ${
                isUpdating ? 'bg-gradient-to-r from-green-400 to-blue-500' : 'bg-green-500'
              }`}
              {...getMotionProps({
                initial: { width: `${initialFillPercentage}%` },
                animate: { width: `${fillPercentage}%` },
                transition: { duration: 0.5, ease: 'easeOut' },
              })}
            />
            {isUpdating && (
              <motion.div
                className="absolute inset-0 bg-white/20"
                {...getMotionProps({
                  initial: { x: '-100%' },
                  animate: { x: '100%' },
                  transition: { duration: 0.8, ease: 'easeInOut' },
                })}
              />
            )}
          </>
        ) : (
          <div
            className="h-full rounded-full bg-green-500"
            style={{ width: `${fillPercentage}%` }}
          />
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm">
        {animationsEnabled ? (
          <>
            <motion.span
              key={`fill-${fillPercentage}`}
              {...getMotionProps({
                initial: { scale: 1.2 },
                animate: { scale: 1 },
              })}
              className={`font-semibold ${
                fillPercentage >= 100 ? 'text-green-400' : 'text-gray-300'
              }`}
            >
              {fillPercentage.toFixed(1)}% filled
            </motion.span>
            <motion.span
              key={`participants-${participants}`}
              {...getMotionProps({
                initial: { scale: 1.2 },
                animate: { scale: 1 },
              })}
              className="text-gray-400"
            >
              {participants} participant{participants !== 1 ? 's' : ''} • {betCount} bet{betCount !== 1 ? 's' : ''}
            </motion.span>
          </>
        ) : (
          <>
            <span className={`font-semibold ${
              fillPercentage >= 100 ? 'text-green-400' : 'text-gray-300'
            }`}>
              {fillPercentage.toFixed(1)}% filled
            </span>
            <span className="text-gray-400">
              {participants} participant{participants !== 1 ? 's' : ''} • {betCount} bet{betCount !== 1 ? 's' : ''}
            </span>
          </>
        )}
      </div>

      {/* Live indicator */}
      {isUpdating && (
        animationsEnabled ? (
          <motion.div
            {...getMotionProps({
              initial: { opacity: 0, y: -10 },
              animate: { opacity: 1, y: 0 },
              exit: { opacity: 0 },
            })}
            className="flex items-center gap-2 text-xs text-green-400"
          >
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>Updated</span>
          </motion.div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-green-400">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <span>Updated</span>
          </div>
        )
      )}
    </div>
  );
}



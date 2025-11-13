/**
 * Live Reputation Badge
 * 
 * Shows real-time reputation updates with celebration animations
 */

'use client';

import { useState } from 'react';
import { useReputationUpdates } from '@/hooks/useSomniaStreams';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useAnimationProps } from '@/utils/animationUtils';

interface LiveReputationBadgeProps {
  initialReputation?: number;
}

export function LiveReputationBadge({ initialReputation = 40 }: LiveReputationBadgeProps) {
  const { address } = useAccount();
  const [reputation, setReputation] = useState(initialReputation);
  const [reputationChange, setReputationChange] = useState<number | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const { playSuccess, playNotification } = useSoundEffects({ volume: 0.3 });
  const { animationsEnabled, getMotionProps } = useAnimationProps();

  // Real-time reputation updates
  useReputationUpdates(address || '', (repData) => {
    const change = repData.newReputation - repData.oldReputation;
    setReputationChange(change);
    setLastAction(repData.actionName);
    setReputation(repData.newReputation);

    // Play sound based on change
    if (change > 0) {
      playSuccess();
    } else {
      playNotification();
    }

    // Clear the change indicator after animation
    setTimeout(() => {
      setReputationChange(null);
      setLastAction(null);
    }, 3000);
  });

  const getReputationColor = (rep: number) => {
    if (rep >= 100) return 'text-yellow-400 border-yellow-400';
    if (rep >= 70) return 'text-green-400 border-green-400';
    if (rep >= 40) return 'text-blue-400 border-blue-400';
    return 'text-gray-400 border-gray-400';
  };

  const getReputationRank = (rep: number) => {
    if (rep >= 100) return '👑 Elite';
    if (rep >= 70) return '⭐ Expert';
    if (rep >= 40) return '🎯 Active';
    return '🌱 Newbie';
  };

  const BadgeComponent = animationsEnabled ? motion.div : 'div';
  const badgeProps = animationsEnabled 
    ? getMotionProps({
        animate: reputationChange ? { scale: [1, 1.1, 1] } : {},
        transition: { duration: 0.3 },
      })
    : {};

  return (
    <div className="relative">
      <BadgeComponent
        className={`px-4 py-2 rounded-lg border-2 ${getReputationColor(reputation)} bg-gray-800/50 backdrop-blur`}
        {...badgeProps}
      >
        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold">{reputation}</div>
            <div className="text-xs opacity-70">Reputation</div>
          </div>
          <div className="text-sm">
            {getReputationRank(reputation)}
          </div>
        </div>
      </BadgeComponent>

      {/* Floating change indicator */}
      {animationsEnabled ? (
        <AnimatePresence>
          {reputationChange !== null && (
            <motion.div
              {...getMotionProps({
                initial: { opacity: 0, y: 0, scale: 0.8 },
                animate: { opacity: 1, y: -30, scale: 1 },
                exit: { opacity: 0, y: -50 },
              })}
              className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2"
            >
              <div
                className={`px-3 py-1 rounded-full font-bold shadow-lg ${
                  reputationChange > 0
                    ? 'bg-green-500 text-white'
                    : 'bg-red-500 text-white'
                }`}
              >
                {reputationChange > 0 ? '+' : ''}{reputationChange}
              </div>
              {lastAction && (
                <div className="mt-1 text-xs text-center text-gray-300 whitespace-nowrap">
                  {lastAction}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        reputationChange !== null && (
          <div className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2">
            <div
              className={`px-3 py-1 rounded-full font-bold shadow-lg ${
                reputationChange > 0
                  ? 'bg-green-500 text-white'
                  : 'bg-red-500 text-white'
              }`}
            >
              {reputationChange > 0 ? '+' : ''}{reputationChange}
            </div>
            {lastAction && (
              <div className="mt-1 text-xs text-center text-gray-300 whitespace-nowrap">
                {lastAction}
              </div>
            )}
          </div>
        )
      )}

      {/* Particle effect on reputation gain */}
      {animationsEnabled && reputationChange && reputationChange > 0 && (
        <AnimatePresence>
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              {...getMotionProps({
                initial: {
                  opacity: 1,
                  x: 0,
                  y: 0,
                  scale: 1
                },
                animate: {
                  opacity: 0,
                  x: (Math.random() - 0.5) * 100,
                  y: -50 - Math.random() * 50,
                  scale: 0
                },
                exit: { opacity: 0 },
                transition: { duration: 0.8, delay: i * 0.1 },
              })}
              className="absolute top-1/2 left-1/2 w-2 h-2 bg-yellow-400 rounded-full"
              style={{ pointerEvents: 'none' }}
            />
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}



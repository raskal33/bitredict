/**
 * Live Reputation Badge
 * 
 * Shows real-time reputation updates with celebration animations
 */

'use client';

import { useState, useEffect } from 'react';
import { useReputationUpdates } from '@/hooks/useSomniaStreams';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useAnimationProps } from '@/utils/animationUtils';

interface LiveReputationBadgeProps {
  initialReputation?: number;
}

export function LiveReputationBadge({ initialReputation }: LiveReputationBadgeProps) {
  const { address } = useAccount();
  const [reputation, setReputation] = useState<number | null>(initialReputation || null);
  const [tier, setTier] = useState<string>('');
  const [reputationChange, setReputationChange] = useState<number | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { playSuccess, playNotification } = useSoundEffects({ volume: 0.3 });
  const { animationsEnabled, getMotionProps } = useAnimationProps();

  // ✅ Fetch reputation from API when address changes
  useEffect(() => {
    if (!address) {
      setReputation(null);
      setIsLoading(false);
      return;
    }

    const fetchReputation = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/reputation/user/${address}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setReputation(data.data.reputation || 40);
            setTier(data.data.tier || 'ACTIVE');
          } else {
            // Default to 40 if API fails
            setReputation(40);
            setTier('ACTIVE');
          }
        } else {
          setReputation(40);
          setTier('ACTIVE');
        }
      } catch (error) {
        console.error('Failed to fetch reputation:', error);
        setReputation(40);
        setTier('ACTIVE');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReputation();
  }, [address]);

  // Real-time reputation updates
  useReputationUpdates(address || '', (repData) => {
    const oldRep = reputation || 40;
    const newRep = repData.newReputation || repData.oldReputation || 40;
    const change = newRep - oldRep;
    
    if (change !== 0) {
    setReputationChange(change);
      setLastAction(repData.actionName || '');
      setReputation(newRep);
      
      // Update tier based on new reputation
      if (newRep >= 400) setTier('LEGENDARY');
      else if (newRep >= 300) setTier('EXPERT');
      else if (newRep >= 200) setTier('VETERAN');
      else if (newRep >= 100) setTier('REGULAR');
      else if (newRep >= 40) setTier('ACTIVE');
      else setTier('NEWCOMER');

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
    }
  });

  const getReputationColor = (rep: number | null) => {
    if (!rep) return 'text-gray-400 border-gray-400';
    if (rep >= 400) return 'text-purple-400 border-purple-400';
    if (rep >= 300) return 'text-blue-400 border-blue-400';
    if (rep >= 200) return 'text-green-400 border-green-400';
    if (rep >= 100) return 'text-yellow-400 border-yellow-400';
    if (rep >= 40) return 'text-blue-400 border-blue-400';
    return 'text-gray-400 border-gray-400';
  };

  const getReputationTierLabel = (tierName: string, rep: number | null) => {
    if (!rep) return 'Loading...';
    
    // Use tier from API if available, otherwise calculate
    if (tierName) {
      return tierName;
    }
    
    // Fallback calculation
    if (rep >= 400) return 'LEGENDARY';
    if (rep >= 300) return 'EXPERT';
    if (rep >= 200) return 'VETERAN';
    if (rep >= 100) return 'REGULAR';
    if (rep >= 40) return 'ACTIVE';
    return 'NEWCOMER';
  };

  const BadgeComponent = animationsEnabled ? motion.div : 'div';
  const badgeProps = animationsEnabled 
    ? getMotionProps({
        animate: reputationChange ? { scale: [1, 1.1, 1] } : {},
        transition: { duration: 0.3 },
      })
    : {};

  // Don't render if no address or still loading
  if (!address || isLoading) {
    return null;
  }

  const currentReputation = reputation || 40;
  const tierLabel = getReputationTierLabel(tier, reputation);

  return (
    <div className="relative">
      <BadgeComponent
        className={`px-3 py-1.5 rounded-lg border ${getReputationColor(reputation)} bg-gray-800/50 backdrop-blur`}
        {...badgeProps}
      >
        <div className="flex items-center gap-2">
          <div className="text-center min-w-[50px]">
            <div className="text-lg font-bold leading-tight">{currentReputation}</div>
            <div className="text-[10px] opacity-70 leading-tight">Score</div>
          </div>
          <div className="text-xs font-medium opacity-90">
            {tierLabel}
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



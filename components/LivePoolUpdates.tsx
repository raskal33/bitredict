/**
 * Live Pool Updates Component
 * 
 * Shows real-time pool activity with smooth animations
 * Uses SDS for enriched data + fallback to WebSocket
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePoolUpdates, useBetUpdates, useSomniaStreams, type SDSPoolData, type SDSBetData } from '@/hooks/useSomniaStreams';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useAnimationProps } from '@/utils/animationUtils';

interface LiveActivity {
  id: string;
  type: 'pool_created' | 'pool_settled' | 'bet_placed';
  message: string;
  timestamp: number;
  poolId?: string;
  amount?: string;
}

export function LivePoolUpdates() {
  const [activities, setActivities] = useState<LiveActivity[]>([]);
  const [newActivityCount, setNewActivityCount] = useState(0);
  const { playNotification, playSuccess } = useSoundEffects({ volume: 0.3 });
  const { animationsEnabled, getMotionProps } = useAnimationProps();

  // ✅ FIX: Memoize callbacks to prevent re-subscriptions
  const handlePoolUpdate = useCallback((poolData: SDSPoolData) => {
    console.log('🏊 LivePoolUpdates: Received pool update:', poolData);
    
    const activity: LiveActivity = {
      id: `pool-${poolData.poolId}-${Date.now()}`,
      type: poolData.isSettled ? 'pool_settled' : 'pool_created',
      message: poolData.isSettled 
        ? (poolData.isRefunded || poolData.status === 'refunded' || 
           (poolData.creatorSideWon === false && parseFloat(poolData.totalBettorStake || '0') === 0))
          ? `${poolData.title} was refunded - No bets placed`
          : `${poolData.title} settled! Winner: ${poolData.creatorSideWon ? 'Creator' : 'Bettors'}`
        : `New pool: ${poolData.title} (${poolData.category})`,
      timestamp: Date.now(),
      poolId: poolData.poolId
    };

    setActivities(prev => [activity, ...prev].slice(0, 10));
    setNewActivityCount(prev => prev + 1);
    
    // Show toast notification + play sound
    if (poolData.isSettled) {
      toast.success(`🏆 ${poolData.title} settled!`, { duration: 4000 });
      playSuccess();
    } else {
      playNotification();
    }
  }, [playNotification, playSuccess]);

  const handleBetUpdate = useCallback((betData: SDSBetData) => {
    console.log('🎯 LivePoolUpdates: Received bet update:', betData);
    
    // ✅ FIX: Convert amount from wei to token if needed
    let amountInToken = betData.amount || '0';
    const amountNum = parseFloat(amountInToken);
    if (amountNum > 1e15) {
      amountInToken = (amountNum / 1e18).toString();
    }
    
    const activity: LiveActivity = {
      id: `bet-${betData.poolId}-${Date.now()}`,
      type: 'bet_placed',
      message: `${betData.bettor.slice(0, 6)}...${betData.bettor.slice(-4)} bet ${amountInToken} ${betData.currency || 'STT'} on ${betData.poolTitle}`,
      timestamp: Date.now(),
      poolId: betData.poolId,
      amount: amountInToken
    };

    setActivities(prev => [activity, ...prev].slice(0, 10));
    setNewActivityCount(prev => prev + 1);
    playNotification();
  }, [playNotification]);

  // Real-time pool updates
  usePoolUpdates(handlePoolUpdate);
  
  // Real-time bet updates
  useBetUpdates(handleBetUpdate);
  
  // ✅ CRITICAL: Subscribe to liquidity:added events for Live Activity feed
  const { subscribe } = useSomniaStreams({ enabled: true });
  
  const handleLiquidityUpdate = useCallback((liquidityData: unknown) => {
    console.log('💧 LivePoolUpdates: Received liquidity update:', liquidityData);
    
    interface LiquidityData {
      poolId: string;
      provider: string;
      amount: string;
      currency?: string;
      poolTitle?: string;
    }
    
    // Type assertion for liquidity data
    const data = liquidityData as LiquidityData;
    // ✅ FIX: Convert amount from wei to token if needed
    let amountInToken = data.amount || '0';
    const amountNum = parseFloat(amountInToken);
    if (amountNum > 1e15) {
      amountInToken = (amountNum / 1e18).toString();
    }
    
    const activity: LiveActivity = {
      id: `liquidity-${data.poolId}-${Date.now()}`,
      type: 'bet_placed', // Use same type for display consistency
      message: `${data.provider.slice(0, 6)}...${data.provider.slice(-4)} added ${amountInToken} ${data.currency || 'BITR'} liquidity to ${data.poolTitle || `Pool #${data.poolId}`}`,
      timestamp: Date.now(),
      poolId: data.poolId,
      amount: amountInToken
    };

    setActivities(prev => [activity, ...prev].slice(0, 10));
    setNewActivityCount(prev => prev + 1);
    playNotification();
  }, [playNotification]);
  
  useEffect(() => {
    const unsubscribe = subscribe('liquidity:added', handleLiquidityUpdate);
    return unsubscribe;
  }, [subscribe, handleLiquidityUpdate]);

  // Reset counter when user views
  useEffect(() => {
    const timer = setTimeout(() => {
      setNewActivityCount(0);
    }, 3000);
    return () => clearTimeout(timer);
  }, [newActivityCount]);

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          🔴 Live Activity
          {newActivityCount > 0 && (
            <motion.span
              {...getMotionProps({
                initial: { scale: 0 },
                animate: { scale: 1 },
              })}
              className="bg-red-500 text-white text-xs rounded-full px-2 py-1"
            >
              +{newActivityCount}
            </motion.span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-gray-400">Live</span>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {animationsEnabled ? (
          <AnimatePresence mode="popLayout">
            {activities.map((activity) => (
              <motion.div
                key={activity.id}
                {...getMotionProps({
                  initial: { opacity: 0, x: -20 },
                  animate: { opacity: 1, x: 0 },
                  exit: { opacity: 0, x: 20 },
                })}
                className={`p-3 rounded-lg border ${
                  activity.type === 'pool_settled'
                    ? 'bg-green-900/20 border-green-500/30'
                    : activity.type === 'pool_created'
                    ? 'bg-blue-900/20 border-blue-500/30'
                    : 'bg-purple-900/20 border-purple-500/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-200">{activity.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  {activity.amount && (
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-400">
                        {activity.amount} STT
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="space-y-2">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className={`p-3 rounded-lg border ${
                  activity.type === 'pool_settled'
                    ? 'bg-green-900/20 border-green-500/30'
                    : activity.type === 'pool_created'
                    ? 'bg-blue-900/20 border-blue-500/30'
                    : 'bg-purple-900/20 border-purple-500/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-200">{activity.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  {activity.amount && (
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-400">
                        {activity.amount} STT
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activities.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p>Waiting for activity...</p>
          </div>
        )}
      </div>
    </div>
  );
}


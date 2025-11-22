/**
 * Universal Notifications Component
 * 
 * Centralized notification system for all events:
 * - pool:settled, pool:created
 * - bet:placed
 * - cycle:resolved
 * - slip:evaluated, slip:placed
 * - prize:claimed
 * - liquidity:added
 * 
 * All notifications use unique IDs to prevent duplicates
 */

'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useAccount } from 'wagmi';
import {
  usePoolUpdates,
  useBetUpdates,
  usePoolCreatedUpdates,
  useLiquidityAddedUpdates,
  useSomniaStreams,
  type SDSPoolData,
  type SDSBetData,
  type SDSLiquidityData
} from '@/hooks/useSomniaStreams';

// Helper to normalize IDs
const normalizeId = (id: unknown): string => {
  if (!id) return '0';
  if (typeof id === 'string' && id.startsWith('0x')) {
    try {
      return BigInt(id).toString();
    } catch {
      return id;
    }
  }
  return String(id);
};

export function UniversalNotifications() {
  const { address } = useAccount();
  const { subscribe } = useSomniaStreams({ enabled: true });
  
  // Track seen events to prevent duplicates
  const seenEventsRef = useRef<Set<string>>(new Set());
  
  // Rate limiting: Track last notification time per event type
  const lastNotificationTime = useRef<Map<string, number>>(new Map());
  const RATE_LIMIT_MS = 2000; // 2 seconds between same event type

  // Helper to check if event is recent (within last 1 minute)
  const isRecentEvent = (timestamp: number | string | undefined): boolean => {
    if (!timestamp) return false;
    const ts = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
    if (isNaN(ts) || ts <= 0) return false;
    const now = Math.floor(Date.now() / 1000);
    const oneMinuteAgo = now - 60;
    return ts >= oneMinuteAgo;
  };

  // Helper to show notification with deduplication
  const showNotification = (
    type: 'success' | 'error' | 'info',
    message: string,
    uniqueId: string,
    options?: { duration?: number; icon?: string }
  ) => {
    // Check rate limiting
    const lastTime = lastNotificationTime.current.get(uniqueId);
    const now = Date.now();
    if (lastTime && (now - lastTime) < RATE_LIMIT_MS) {
      console.log(`⚠️ Rate limit: Skipping notification ${uniqueId} (last ${now - lastTime}ms ago)`);
      return;
    }

    // Check if already seen
    if (seenEventsRef.current.has(uniqueId)) {
      console.log(`⚠️ Duplicate: Skipping notification ${uniqueId}`);
      return;
    }

    // Mark as seen and update rate limit
    seenEventsRef.current.add(uniqueId);
    lastNotificationTime.current.set(uniqueId, now);

    // Clean up old entries (keep last 1000)
    if (seenEventsRef.current.size > 1000) {
      const firstKey = seenEventsRef.current.values().next().value;
      if (firstKey) seenEventsRef.current.delete(firstKey);
    }

    // Show toast with unique ID
    const toastOptions = {
      duration: options?.duration || 4000,
      id: uniqueId, // ✅ CRITICAL: Unique ID for deduplication
      ...(options?.icon && { icon: options.icon })
    };

    if (type === 'success') {
      toast.success(message, toastOptions);
    } else if (type === 'error') {
      toast.error(message, toastOptions);
    } else {
      toast(message, toastOptions);
    }
  };

  // Pool Created notifications
  usePoolCreatedUpdates((poolData: SDSPoolData) => {
    const poolId = normalizeId(poolData.poolId);
    const timestamp = poolData.timestamp || Math.floor(Date.now() / 1000);
    
    if (!isRecentEvent(timestamp)) return;
    
    const uniqueId = `pool-created-${poolId}-${timestamp}`;
    const poolTitle = poolData.title || `Pool #${poolId}`;
    
    showNotification('success', `🏗️ New Pool: ${poolTitle}`, uniqueId, {
      duration: 5000,
      icon: '🏗️'
    });
  });

  // Pool Settled notifications
  usePoolUpdates((poolData: SDSPoolData) => {
    if (!poolData.isSettled) return; // Only show for settled pools
    
    const poolId = normalizeId(poolData.poolId);
    const timestamp = poolData.timestamp || Math.floor(Date.now() / 1000);
    
    if (!isRecentEvent(timestamp)) return;
    
    const uniqueId = `pool-settled-${poolId}-${timestamp}`;
    const poolTitle = poolData.title || `Pool #${poolId}`;
    const winner = poolData.creatorSideWon ? 'Creator' : 'Bettors';
    
    showNotification('success', `🏆 ${poolTitle} settled! Winner: ${winner}`, uniqueId, {
      duration: 5000,
      icon: '🏆'
    });
  });

  // Bet Placed notifications
  useBetUpdates((betData: SDSBetData) => {
    const poolId = normalizeId(betData.poolId);
    const timestamp = betData.timestamp || Math.floor(Date.now() / 1000);
    
    if (!isRecentEvent(timestamp)) return;
    
    // Only show if it's the current user's bet
    const bettor = betData.bettor || (betData as Record<string, unknown>).bettorAddress as string | undefined;
    if (address && bettor?.toLowerCase() !== address.toLowerCase()) {
      return; // Not user's bet, skip notification
    }
    
    const uniqueId = `bet-placed-${poolId}-${bettor}-${timestamp}`;
    const poolTitle = betData.poolTitle || `Pool #${poolId}`;
    const amount = betData.amount || '0';
    const currency = betData.currency || 'STT';
    
    // Convert from wei if needed
    let amountInToken = amount;
    const amountNum = parseFloat(amount);
    if (amountNum > 1e12) {
      amountInToken = (amountNum / 1e18).toFixed(2);
    }
    
    showNotification('success', `🎯 Bet placed: ${amountInToken} ${currency} on ${poolTitle}`, uniqueId, {
      duration: 4000,
      icon: '🎯'
    });
  });

  // Cycle Resolved notifications - SKIPPED (handled by OddysseyLiveUpdates with detailed info)
  // useCycleUpdates is handled by OddysseyLiveUpdates component

  // Slip Evaluated notifications - SKIPPED (handled by OddysseyLiveUpdates with detailed info)
  // useSlipUpdates is handled by OddysseyLiveUpdates component

  // Liquidity Added notifications
  useLiquidityAddedUpdates((liquidityData: SDSLiquidityData) => {
    const poolId = normalizeId(liquidityData.poolId);
    const timestamp = liquidityData.timestamp || Math.floor(Date.now() / 1000);
    
    if (!isRecentEvent(timestamp)) return;
    
    const uniqueId = `liquidity-added-${poolId}-${timestamp}`;
    const amount = liquidityData.amount || '0';
    const currency = liquidityData.currency || 'STT';
    
    // Convert from wei if needed
    let amountInToken = amount;
    const amountNum = parseFloat(amount);
    if (amountNum > 1e12) {
      amountInToken = (amountNum / 1e18).toFixed(2);
    }
    
    showNotification('success', `💧 ${amountInToken} ${currency} liquidity added to Pool #${poolId}`, uniqueId, {
      duration: 4000,
      icon: '💧'
    });
  });

  // Prize Claimed notifications
  useEffect(() => {
    if (!address) return;

    const handlePrizeClaimed = (data: { slipId?: string | number; timestamp?: number; prizeAmount?: string; currency?: string }) => {
      const slipId = normalizeId(data.slipId);
      const timestamp = data.timestamp || Math.floor(Date.now() / 1000);
      
      if (!isRecentEvent(timestamp)) return;
      
      const uniqueId = `prize-claimed-${slipId}-${timestamp}`;
      const prizeAmount = data.prizeAmount || '0';
      const currency = data.currency || 'STT';
      
      // Convert from wei if needed
      let amountInToken = prizeAmount;
      const amountNum = parseFloat(prizeAmount);
      if (amountNum > 1e12) {
        amountInToken = (amountNum / 1e18).toFixed(2);
      }
      
      showNotification('success', `💰 Prize claimed: ${amountInToken} ${currency}!`, uniqueId, {
        duration: 5000,
        icon: '💰'
      });
    };

    const unsubscribe = subscribe('prize:claimed', handlePrizeClaimed);
    return unsubscribe;
  }, [subscribe, address]);

  // Slip Placed notifications
  useEffect(() => {
    if (!address) return;

    const handleSlipPlaced = (data: { slipId?: string | number; cycleId?: string | number; timestamp?: number }) => {
      const slipId = normalizeId(data.slipId);
      const cycleId = normalizeId(data.cycleId);
      const timestamp = data.timestamp || Math.floor(Date.now() / 1000);
      
      if (!isRecentEvent(timestamp)) return;
      
      const uniqueId = `slip-placed-${slipId}-${timestamp}`;
      
      showNotification('success', `🎉 Slip placed for Cycle ${cycleId}!`, uniqueId, {
        duration: 4000,
        icon: '🎉'
      });
    };

    // Listen for custom slip:placed events
    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        handleSlipPlaced(customEvent.detail);
      }
    };

    window.addEventListener('oddyssey:slip:placed', handleCustomEvent);
    
    return () => {
      window.removeEventListener('oddyssey:slip:placed', handleCustomEvent);
    };
  }, [address]);

  return null; // This component doesn't render anything
}


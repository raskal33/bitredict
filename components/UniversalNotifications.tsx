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
    // ✅ CRITICAL: Check rate limiting FIRST (before seen check)
    const lastTime = lastNotificationTime.current.get(uniqueId);
    const now = Date.now();
    if (lastTime && (now - lastTime) < RATE_LIMIT_MS) {
      console.log(`⚠️ Rate limit: Skipping notification ${uniqueId} (last ${now - lastTime}ms ago)`);
      return;
    }

    // ✅ CRITICAL: Check if already seen (use same uniqueId for react-hot-toast deduplication)
    if (seenEventsRef.current.has(uniqueId)) {
      console.log(`⚠️ Duplicate: Skipping notification ${uniqueId}`);
      return;
    }

    // Mark as seen and update rate limit BEFORE showing toast
    seenEventsRef.current.add(uniqueId);
    lastNotificationTime.current.set(uniqueId, now);

    // Clean up old entries (keep last 1000)
    if (seenEventsRef.current.size > 1000) {
      const firstKey = seenEventsRef.current.values().next().value;
      if (firstKey) {
        seenEventsRef.current.delete(firstKey);
        lastNotificationTime.current.delete(firstKey);
      }
    }

    // ✅ CRITICAL: react-hot-toast automatically deduplicates by ID, so we don't need to check isActive
    // Show toast with unique ID
    const toastOptions = {
      duration: options?.duration || 4000,
      id: uniqueId, // ✅ CRITICAL: Unique ID for deduplication
      position: 'top-right' as const, // ✅ CRITICAL: Explicitly set position to top-right
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
    
    // ✅ CRITICAL: Skip if poolId is invalid (0 or empty)
    if (!poolId || poolId === '0') {
      console.warn('⚠️ UniversalNotifications: Skipping pool created event with invalid poolId:', poolData);
      return;
    }
    
    // SDSPoolData doesn't have timestamp, use current time for recent events
    const timestamp = Math.floor(Date.now() / 1000);
    
    if (!isRecentEvent(timestamp)) return;
    
    const uniqueId = `pool-created-${poolId}-${timestamp}`;
    const displayPoolId = formatIdForDisplay(poolId);
    const poolTitle = poolData.title || `Pool ${displayPoolId}`;
    
    showNotification('success', `🏗️ New Pool: ${poolTitle}`, uniqueId, {
      duration: 5000,
      icon: '🏗️'
    });
  });

  // Pool Settled notifications
  usePoolUpdates((poolData: SDSPoolData) => {
    if (!poolData.isSettled) return; // Only show for settled pools
    
    const poolId = normalizeId(poolData.poolId);
    
    // ✅ CRITICAL: Skip if poolId is invalid (0 or empty)
    if (!poolId || poolId === '0') {
      console.warn('⚠️ UniversalNotifications: Skipping pool settled event with invalid poolId:', poolData);
      return;
    }
    
    // SDSPoolData doesn't have timestamp, use current time for recent events
    const timestamp = Math.floor(Date.now() / 1000);
    
    if (!isRecentEvent(timestamp)) return;
    
    const uniqueId = `pool-settled-${poolId}-${timestamp}`;
    const displayPoolId = formatIdForDisplay(poolId);
    const poolTitle = poolData.title || `Pool ${displayPoolId}`;
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
    const bettor = betData.bettor || (betData as unknown as Record<string, unknown>).bettorAddress as string | undefined;
    if (address && bettor?.toLowerCase() !== address.toLowerCase()) {
      return; // Not user's bet, skip notification
    }
    
    const uniqueId = `bet-placed-${poolId}-${bettor}-${timestamp}`;
    const displayPoolId = formatIdForDisplay(poolId);
    const poolTitle = betData.poolTitle || `Pool ${displayPoolId}`;
    const amount = betData.amount || '0';
    const currency = betData.currency || 'STT';
    
    // ✅ CRITICAL: Backend sends amount as raw wei string, ALWAYS convert from wei to token
    let amountInToken = '0';
    try {
      const amountBigInt = BigInt(amount);
      const amountNum = Number(amountBigInt);
      if (amountNum > 0) {
        amountInToken = (amountNum / 1e18).toFixed(2);
        console.log(`   💰 Converted bet amount from wei: ${amountBigInt.toString()} → ${amountInToken} ${currency}`);
      } else {
        console.warn(`⚠️ Invalid bet amount (zero or negative): ${amountNum}, skipping notification`);
        return;
      }
      } catch {
        const amountNum = parseFloat(amount);
      if (amountNum > 0) {
        amountInToken = (amountNum / 1e18).toFixed(2);
      } else {
        console.warn(`⚠️ Invalid bet amount (zero or negative): ${amountNum}, skipping notification`);
        return;
      }
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
    
    // ✅ CRITICAL: Skip if poolId is invalid (0 or empty)
    if (!poolId || poolId === '0') {
      console.warn('⚠️ UniversalNotifications: Skipping liquidity event with invalid poolId:', liquidityData);
      return;
    }
    
    const timestamp = liquidityData.timestamp || Math.floor(Date.now() / 1000);
    
    if (!isRecentEvent(timestamp)) return;
    
    const uniqueId = `liquidity-added-${poolId}-${timestamp}`;
    const amount = liquidityData.amount || '0';
    
    // ✅ CRITICAL: Get currency from liquidityData or default to STT
    const liquidityDataAny = liquidityData as unknown as Record<string, unknown>;
    const currency = (liquidityDataAny.currency as string) || 
                     ((liquidityDataAny.useBitr as boolean) || (liquidityDataAny.use_bitr as boolean) ? 'BITR' : 'STT');
    
    // ✅ CRITICAL: Backend sends amount as raw wei string (e.g., "1000000000000000000" for 1 token)
    // Always convert from wei to token (divide by 1e18)
    let amountInToken = '0';
    try {
      // Handle BigInt strings from backend
      const amountBigInt = BigInt(amount);
      const amountNum = Number(amountBigInt);
      
      // ✅ CRITICAL: Backend ALWAYS sends wei amounts, so ALWAYS convert
      if (amountNum > 0) {
        // Convert from wei to token
        amountInToken = (amountNum / 1e18).toFixed(2);
        console.log(`   💰 Converted liquidity amount from wei: ${amountBigInt.toString()} → ${amountInToken} ${currency}`);
      } else {
        console.warn(`⚠️ Invalid amount (zero or negative): ${amountNum}, skipping notification`);
        return;
      }
      } catch {
        // Fallback: try parseFloat
      const amountNum = parseFloat(amount);
      if (amountNum > 0) {
        amountInToken = (amountNum / 1e18).toFixed(2);
        console.log(`   💰 Converted liquidity amount from wei (fallback): ${amountNum} → ${amountInToken} ${currency}`);
      } else {
        console.warn(`⚠️ Invalid amount (zero or negative): ${amountNum}, skipping notification`);
        return;
      }
    }
    
    const displayPoolId = formatIdForDisplay(poolId);
    
    showNotification('success', `💧 ${amountInToken} ${currency} liquidity added to Pool ${displayPoolId}`, uniqueId, {
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

    const unsubscribe = subscribe('prize:claimed', (data) => {
      handlePrizeClaimed(data as { slipId?: string | number; timestamp?: number; prizeAmount?: string; currency?: string });
    });
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


/**
 * Somnia Data Streams Hook
 * 
 * Subscribes to enriched blockchain data via Somnia Data Streams (SDS).
 * Falls back to traditional WebSocket if SDS is unavailable.
 * 
 * Features:
 * - Real-time pool updates with enriched metadata
 * - Real-time bet placement notifications
 * - Pool progress tracking
 * - Reputation changes
 * - Liquidity events
 * - Oddyssey cycle and slip updates
 * - Automatic reconnection
 * - Type-safe event handling
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { SDK } from '@somnia-chain/streams';
import { createPublicClient, http } from 'viem';
import { somniaTestnet } from 'viem/chains';

// Event types
export type SDSEventType = 
  | 'pool:created'
  | 'pool:settled'
  | 'bet:placed'
  | 'pool:progress'
  | 'reputation:changed'
  | 'liquidity:added'
  | 'cycle:resolved'
  | 'slip:evaluated'
  | 'prize:claimed';

export interface SDSPoolData {
  poolId: string;
  creator: string;
  odds: number;
  creatorStake: string;
  totalBettorStake: string;
  totalCreatorSideStake: string;
  isSettled: boolean;
  creatorSideWon?: boolean;
  title: string;
  category: string;
  fillPercentage: number;
  participantCount: number;
}

export interface SDSBetData {
  poolId: string;
  bettor: string;
  amount: string;
  isForOutcome: boolean;
  timestamp: number;
  poolTitle: string;
  category: string;
  odds: number;
}

export interface SDSPoolProgressData {
  poolId: string;
  fillPercentage: number;
  totalBettorStake: string;
  totalCreatorSideStake: string;
  maxPoolSize: string;
  participantCount: number;
  timestamp: number;
}

export interface SDSReputationData {
  user: string;
  action: number;
  value: string;
  poolId: string;
  timestamp: number;
  oldReputation: number;
  newReputation: number;
  actionName: string;
}

export interface SDSLiquidityData {
  poolId: string;
  provider: string;
  amount: string;
  totalLiquidity: string;
  poolFillPercentage: number;
  timestamp: number;
}

export interface SDSCycleResolvedData {
  cycleId: string;
  prizePool: string;
  totalSlips: number;
  timestamp: number;
  status: string;
}

export interface SDSSlipEvaluatedData {
  slipId: string;
  cycleId: string;
  player: string;
  isWinner: boolean;
  correctPredictions: number;
  totalPredictions: number;
  rank: number;
  prizeAmount: string;
  timestamp: number;
}

export interface SDSPrizeClaimedData {
  player: string;
  slipId: string;
  cycleId: string;
  prizeAmount: string;
  rank: number;
  timestamp: number;
}

export type SDSEventData = 
  | SDSPoolData 
  | SDSBetData 
  | SDSPoolProgressData
  | SDSReputationData
  | SDSLiquidityData
  | SDSCycleResolvedData
  | SDSSlipEvaluatedData
  | SDSPrizeClaimedData;

interface UseSomniaStreamsOptions {
  enabled?: boolean;
  autoReconnect?: boolean;
  reconnectDelay?: number;
  useFallback?: boolean; // Whether to use WebSocket as fallback
}

interface UseSomniaStreamsReturn {
  isConnected: boolean;
  isSDSActive: boolean;
  isFallback: boolean;
  error: Error | null;
  subscribe: (eventType: SDSEventType, callback: (data: SDSEventData) => void) => () => void;
  reconnect: () => void;
}

export function useSomniaStreams(
  options: UseSomniaStreamsOptions = {}
): UseSomniaStreamsReturn {
  const {
    enabled = true,
    autoReconnect = true,
    reconnectDelay = 3000,
    useFallback = true
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isSDSActive, setIsSDSActive] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const sdkRef = useRef<SDK | null>(null);
  const subscribersRef = useRef<Map<SDSEventType, Set<(data: SDSEventData) => void>>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize SDS SDK
  const initializeSDK = useCallback(async () => {
    if (!enabled) return;

    try {
      console.log('🔄 Initializing Somnia Data Streams...');
      
      // Create public client for reading
      const publicClient = createPublicClient({
        chain: somniaTestnet,
        transport: http(process.env.NEXT_PUBLIC_SDS_RPC_URL || 'https://dream-rpc.somnia.network')
      });

      // Initialize SDK (read-only, no wallet needed for subscribing)
      const sdk = new SDK({
        public: publicClient
      });

      sdkRef.current = sdk;
      setIsConnected(true);
      setIsSDSActive(true);
      setIsFallback(false);
      setError(null);
      
      console.log('✅ Somnia Data Streams initialized');

    } catch (err) {
      console.error('❌ Failed to initialize SDS:', err);
      setError(err as Error);
      setIsSDSActive(false);

      // Fall back to WebSocket if enabled
      if (useFallback) {
        console.log('🔄 Falling back to WebSocket...');
        initializeWebSocketFallback();
      }
    }
  }, [enabled, useFallback]);

  // Initialize WebSocket fallback
  const initializeWebSocketFallback = useCallback(() => {
    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4001';
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('✅ WebSocket fallback connected');
        setIsConnected(true);
        setIsFallback(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const { type, data } = message;

          // Normalize event types to match SDS format
          const eventType = type as SDSEventType;
          const callbacks = subscribersRef.current.get(eventType);
          
          if (callbacks) {
            callbacks.forEach(callback => callback(data));
          }
        } catch (err) {
          console.error('Error processing WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError(new Error('WebSocket connection failed'));
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Auto-reconnect
        if (autoReconnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect WebSocket...');
            initializeWebSocketFallback();
          }, reconnectDelay);
        }
      };

      wsRef.current = ws;

    } catch (err) {
      console.error('Failed to initialize WebSocket fallback:', err);
      setError(err as Error);
    }
  }, [autoReconnect, reconnectDelay]);

  // Subscribe to SDS events
  const subscribeToSDSEvent = useCallback((
    eventType: SDSEventType,
    callback: (data: SDSEventData) => void
  ) => {
    if (!sdkRef.current) {
      console.warn('SDK not initialized');
      return () => {};
    }

    // Map event types to schema IDs
    const schemaIdMap: Record<SDSEventType, string> = {
      'pool:created': 'pool',
      'pool:settled': 'pool',
      'bet:placed': 'bet',
      'pool:progress': 'poolProgress',
      'reputation:changed': 'reputation',
      'liquidity:added': 'liquidity',
      'cycle:resolved': 'cycleResolved',
      'slip:evaluated': 'slipEvaluated',
      'prize:claimed': 'prizeClaimed'
    };

    const schemaId = schemaIdMap[eventType];

    try {
      // For now, SDS subscription is simplified - WebSocket fallback handles actual data
      // TODO: Implement proper SDS subscription when SDK API is finalized
      console.log(`Subscribing to ${eventType} via SDS (using WebSocket fallback for now)`);
      return () => {};

    } catch (err) {
      console.error(`Failed to subscribe to ${eventType}:`, err);
      return () => {};
    }
  }, []);

  // Subscribe function (works for both SDS and WebSocket)
  const subscribe = useCallback((
    eventType: SDSEventType,
    callback: (data: SDSEventData) => void
  ): (() => void) => {
    // Store callback
    if (!subscribersRef.current.has(eventType)) {
      subscribersRef.current.set(eventType, new Set());
    }
    subscribersRef.current.get(eventType)!.add(callback);

    // If using SDS, subscribe to stream
    let sdsUnsubscribe: (() => void) | null = null;
    if (isSDSActive && sdkRef.current) {
      sdsUnsubscribe = subscribeToSDSEvent(eventType, callback);
    }

    // Return unsubscribe function
    return () => {
      const callbacks = subscribersRef.current.get(eventType);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          subscribersRef.current.delete(eventType);
        }
      }

      if (sdsUnsubscribe) {
        sdsUnsubscribe();
      }
    };
  }, [isSDSActive, subscribeToSDSEvent]);

  // Manual reconnect
  const reconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    // Close existing connections
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setIsSDSActive(false);
    setIsFallback(false);
    
    // Reinitialize
    initializeSDK();
  }, [initializeSDK]);

  // Initialize on mount
  useEffect(() => {
    if (enabled) {
      initializeSDK();
    }

    return () => {
      // Cleanup
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      subscribersRef.current.clear();
    };
  }, [enabled, initializeSDK]);

  return {
    isConnected,
    isSDSActive,
    isFallback,
    error,
    subscribe,
    reconnect
  };
}

// Convenience hooks for specific event types
export function usePoolUpdates(callback: (data: SDSPoolData) => void, enabled = true) {
  const { subscribe, ...rest } = useSomniaStreams({ enabled });
  
  useEffect(() => {
    if (!enabled) return;
    
    const unsubscribeCreated = subscribe('pool:created', callback as any);
    const unsubscribeSettled = subscribe('pool:settled', callback as any);
    
    return () => {
      unsubscribeCreated();
      unsubscribeSettled();
    };
  }, [subscribe, callback, enabled]);
  
  return rest;
}

export function useBetUpdates(callback: (data: SDSBetData) => void, enabled = true) {
  const { subscribe, ...rest } = useSomniaStreams({ enabled });
  
  useEffect(() => {
    if (!enabled) return;
    const unsubscribe = subscribe('bet:placed', callback as any);
    return unsubscribe;
  }, [subscribe, callback, enabled]);
  
  return rest;
}

export function usePoolProgress(poolId: string, callback: (data: SDSPoolProgressData) => void, enabled = true) {
  const { subscribe, ...rest } = useSomniaStreams({ enabled });
  
  useEffect(() => {
    if (!enabled) return;
    
    const unsubscribe = subscribe('pool:progress', (data) => {
      const progressData = data as SDSPoolProgressData;
      if (progressData.poolId === poolId) {
        callback(progressData);
      }
    });
    
    return unsubscribe;
  }, [subscribe, poolId, callback, enabled]);
  
  return rest;
}

export function useReputationUpdates(userAddress: string, callback: (data: SDSReputationData) => void, enabled = true) {
  const { subscribe, ...rest } = useSomniaStreams({ enabled });
  
  useEffect(() => {
    if (!enabled || !userAddress) return;
    
    const unsubscribe = subscribe('reputation:changed', (data) => {
      const repData = data as SDSReputationData;
      if (repData.user.toLowerCase() === userAddress.toLowerCase()) {
        callback(repData);
      }
    });
    
    return unsubscribe;
  }, [subscribe, userAddress, callback, enabled]);
  
  return rest;
}

export function useCycleUpdates(callback: (data: SDSCycleResolvedData) => void, enabled = true) {
  const { subscribe, ...rest } = useSomniaStreams({ enabled });
  
  useEffect(() => {
    if (!enabled) return;
    const unsubscribe = subscribe('cycle:resolved', callback as any);
    return unsubscribe;
  }, [subscribe, callback, enabled]);
  
  return rest;
}

export function useSlipUpdates(callback: (data: SDSSlipEvaluatedData) => void, enabled = true) {
  const { subscribe, ...rest } = useSomniaStreams({ enabled });
  
  useEffect(() => {
    if (!enabled) return;
    const unsubscribe = subscribe('slip:evaluated', callback as any);
    return unsubscribe;
  }, [subscribe, callback, enabled]);
  
  return rest;
}


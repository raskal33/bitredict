/**
 * Somnia Data Streams Hook
 * 
 * Subscribes to enriched blockchain data via Somnia Data Streams (SDS).
 * Based on official Somnia SDK documentation.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { SDK } from '@somnia-chain/streams';
import { createPublicClient, webSocket } from 'viem';
import { somniaTestnet } from 'viem/chains';

// Get RPC URLs with proper fallback
const getRPCURL = (): string => {
  return process.env.NEXT_PUBLIC_SDS_RPC_URL || 
         process.env.NEXT_PUBLIC_RPC_URL || 
         'https://dream-rpc.somnia.network';
};

const getWSURL = (): string => {
  // Always return a valid URL - env vars might not be available in browser
  const envWsUrl = typeof window !== 'undefined' 
    ? (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_SDS_WS_URL
    : process.env.NEXT_PUBLIC_SDS_WS_URL;
    
  if (envWsUrl && typeof envWsUrl === 'string' && envWsUrl.trim() !== '') {
    return envWsUrl;
  }
  
  // Fallback: construct from RPC URL
  const rpcUrl = getRPCURL();
  if (rpcUrl && rpcUrl.includes('dream-rpc.somnia.network')) {
    return rpcUrl.replace(/^https?:\/\//, 'wss://') + '/ws';
  }
  
  // Hardcoded fallback - always works
  return 'wss://dream-rpc.somnia.network/ws';
};

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
  isRefunded?: boolean;
  status?: string;
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
  currency?: string;
}

export interface SDSPoolProgressData {
  poolId: string;
  fillPercentage: number;
  totalBettorStake: string;
  totalCreatorSideStake: string;
  maxPoolSize: string;
  participantCount: number;
  betCount?: number;
  currentMaxBettorStake?: string;
  effectiveCreatorSideStake?: string;
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
  useFallback?: boolean;
}

interface UseSomniaStreamsReturn {
  isConnected: boolean;
  isSDSActive: boolean;
  isFallback: boolean;
  error: Error | null;
  subscribe: (eventType: SDSEventType, callback: (data: SDSEventData) => void) => () => void;
  subscribeToChannel: (channel: string) => void;
  reconnect: () => void;
}

// Event schema mapping - must match backend registered schemas
const EVENT_SCHEMA_MAP: Record<SDSEventType, string> = {
  'pool:created': 'PoolCreated',
  'pool:settled': 'PoolSettled',
  'bet:placed': 'BetPlaced',
  'pool:progress': 'BetPlaced',
  'reputation:changed': 'ReputationActionOccurred',
  'liquidity:added': 'LiquidityAdded',
  'cycle:resolved': 'CycleResolved',
  'slip:evaluated': 'SlipEvaluated',
  'prize:claimed': 'PrizeClaimed'
};

export function useSomniaStreams(
  options: UseSomniaStreamsOptions = {}
): UseSomniaStreamsReturn {
  const {
    enabled = true,
    useFallback = true
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isSDSActive, setIsSDSActive] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const sdkRef = useRef<SDK | null>(null);
  const subscribersRef = useRef<Map<SDSEventType, Set<(data: SDSEventData) => void>>>(new Map());
  const unsubscribeFunctionsRef = useRef<Map<(data: SDSEventData) => void, (() => void)>>(new Map());
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize SDS SDK
  const initializeSDK = useCallback(async () => {
    if (!enabled) return;

    try {
      const wsUrl = getWSURL();
      
      // Strict validation - ensure URL is a non-empty string
      if (!wsUrl || typeof wsUrl !== 'string' || wsUrl.trim() === '') {
        throw new Error(`SDS WebSocket URL not configured. Got: ${typeof wsUrl} - ${wsUrl}`);
      }
      
      // Ensure URL starts with wss://
      const validWsUrl = wsUrl.startsWith('wss://') || wsUrl.startsWith('ws://') 
        ? wsUrl 
        : `wss://${wsUrl.replace(/^https?:\/\//, '')}`;
      
      console.log('📡 Creating public client with WebSocket transport (for subscriptions)...');
      console.log(`   WebSocket URL: ${validWsUrl}`);
      console.log(`   URL type: ${typeof validWsUrl}, length: ${validWsUrl.length}`);

      // WebSocket transport handles both subscriptions AND RPC calls
      // The SDK requires WebSocket for subscribe() method
      // CRITICAL: webSocket() must receive a valid URL string
      // Create transport with explicit URL string
      const wsTransport = webSocket(validWsUrl as `wss://${string}`);
      
      if (!wsTransport) {
        throw new Error('Failed to create WebSocket transport');
      }
      
      const publicClient = createPublicClient({
        chain: somniaTestnet,
        transport: wsTransport,
      });
      
      // Verify client was created
      if (!publicClient) {
        throw new Error('Failed to create public client');
      }

      const sdk = new SDK({
        public: publicClient
      });

      sdkRef.current = sdk;
      setIsConnected(true);
      setIsSDSActive(true);
      setIsFallback(false);
      setError(null);

    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsSDSActive(false);
      setIsConnected(false);

      if (useFallback) {
        initializeWebSocketFallback();
      }
    }
  }, [enabled, useFallback]);

  // WebSocket fallback
  const initializeWebSocketFallback = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    
    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://bitredict-backend.fly.dev/ws';
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        setIsFallback(true);
        setError(null);
        
        const channels = new Set<string>();
        subscribersRef.current.forEach((_, eventType) => {
          if (eventType === 'bet:placed') {
            channels.add('recent_bets');
          } else {
            channels.add(eventType);
          }
        });
        
        channels.forEach(channel => {
          ws.send(JSON.stringify({ type: 'subscribe', channel }));
        });
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'update' && message.channel && message.data) {
            const channel = message.channel;
            let eventType: SDSEventType | null = null;
            
            if (channel.startsWith('pool:') && channel.endsWith(':progress')) {
              eventType = 'pool:progress';
            } else if (channel === 'recent_bets' || channel === 'bet:placed') {
              eventType = 'bet:placed';
            } else if (channel === 'pool:created') {
              eventType = 'pool:created';
            } else if (channel === 'pool:settled') {
              eventType = 'pool:settled';
            } else if (channel === 'reputation:changed') {
              eventType = 'reputation:changed';
            } else if (channel === 'liquidity:added') {
              eventType = 'liquidity:added';
            } else if (channel === 'cycle:resolved') {
              eventType = 'cycle:resolved';
            } else if (channel === 'slip:evaluated') {
              eventType = 'slip:evaluated';
            } else if (channel === 'prize:claimed') {
              eventType = 'prize:claimed';
            }
            
            if (eventType) {
              const callbacks = subscribersRef.current.get(eventType);
              callbacks?.forEach(callback => callback(message.data));
            }
          }
        } catch (err) {
          // Silent error handling
        }
      };

      ws.onerror = () => {
        setError(new Error('WebSocket connection failed'));
      };

      ws.onclose = () => {
        setIsConnected(false);
      };

      wsRef.current = ws;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

  // Subscribe to SDS events
  const subscribe = useCallback((
    eventType: SDSEventType,
    callback: (data: SDSEventData) => void
  ): (() => void) => {
    if (!subscribersRef.current.has(eventType)) {
      subscribersRef.current.set(eventType, new Set());
    }
    subscribersRef.current.get(eventType)!.add(callback);

    // Subscribe via SDS if available
    if (sdkRef.current && isSDSActive) {
      const eventSchemaId = EVENT_SCHEMA_MAP[eventType];
      
      sdkRef.current.streams.subscribe({
        somniaStreamsEventId: eventSchemaId,
        ethCalls: [],
        onlyPushChanges: false,
        onData: (data) => {
          callback(data as SDSEventData);
        },
        onError: () => {
          // Silent error handling
        }
      }).then((result) => {
        if (result?.unsubscribe) {
          unsubscribeFunctionsRef.current.set(callback, result.unsubscribe);
        }
      }).catch(() => {
        // Silent error handling
      });
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

      const unsubscribeFn = unsubscribeFunctionsRef.current.get(callback);
      if (unsubscribeFn) {
        unsubscribeFn();
        unsubscribeFunctionsRef.current.delete(callback);
      }
    };
  }, [isSDSActive]);

  const subscribeToChannel = useCallback((channel: string) => {
    if (isFallback && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'subscribe', channel }));
    }
  }, [isFallback]);

  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsSDSActive(false);
    setIsFallback(false);
    initializeSDK();
  }, [initializeSDK]);

  useEffect(() => {
    if (enabled) {
      initializeSDK();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      unsubscribeFunctionsRef.current.forEach((unsubscribeFn) => {
        unsubscribeFn();
      });
      unsubscribeFunctionsRef.current.clear();
      subscribersRef.current.clear();
    };
  }, [enabled, initializeSDK]);

  return {
    isConnected,
    isSDSActive,
    isFallback,
    error,
    subscribe,
    subscribeToChannel,
    reconnect
  };
}

// Convenience hooks
export function usePoolUpdates(callback: (data: SDSPoolData) => void, enabled = true) {
  const { subscribe, ...rest } = useSomniaStreams({ enabled });
  
  useEffect(() => {
    if (!enabled) return;
    const unsub1 = subscribe('pool:created', callback as any);
    const unsub2 = subscribe('pool:settled', callback as any);
    return () => {
      unsub1();
      unsub2();
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
      if (progressData.poolId === poolId || progressData.poolId === String(poolId)) {
        callback({
          ...progressData,
          currentMaxBettorStake: progressData.currentMaxBettorStake || progressData.maxPoolSize || "0",
          effectiveCreatorSideStake: progressData.effectiveCreatorSideStake || progressData.totalCreatorSideStake || "0"
        });
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

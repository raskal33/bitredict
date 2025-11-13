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
import { createPublicClient, http, webSocket } from 'viem';
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
  isRefunded?: boolean; // ✅ Added refund detection
  status?: string; // ✅ Added status field
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
  subscribeToChannel: (channel: string) => void;
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
      
      // SDS SDK REQUIRES WebSocket for subscriptions (as per error: "Invalid public client config - websocket required")
      // However, WebSocket connections to dream-rpc.somnia.network are failing
      // Solution: Try WebSocket, but immediately fall back to custom WebSocket service if it fails
      const rpcUrl = process.env.NEXT_PUBLIC_SDS_RPC_URL || 'https://dream-rpc.somnia.network';
      const wsUrl = rpcUrl.replace('https://', 'wss://').replace('http://', 'ws://');
      
      let publicClient;
      let useWebSocket = true;
      
      try {
        // SDS SDK requires WebSocket for subscriptions - try it first
        publicClient = createPublicClient({
          chain: somniaTestnet,
          transport: webSocket(wsUrl, {
            reconnect: {
              attempts: 3,
              delay: 1000
            }
          })
        });
        
        console.log('📡 Using WebSocket transport for SDS subscriptions (required by SDK)');
      } catch (wsError) {
        console.warn('⚠️ WebSocket transport failed for SDS:', wsError);
        // If WebSocket fails, we can't use SDS subscriptions
        // Will fall back to custom WebSocket service below
        throw new Error('SDS WebSocket connection failed - will use fallback');
      }

      // Initialize SDK (read-only, no wallet needed for subscribing)
      const sdk = new SDK({
        public: publicClient
      });

      sdkRef.current = sdk;
      setIsConnected(true);
      setIsSDSActive(true);
      setIsFallback(false);
      setError(null);
      
      console.log(`✅ Somnia Data Streams initialized (${useWebSocket ? 'WebSocket' : 'HTTP'} transport)`);

    } catch (err) {
      console.error('❌ Failed to initialize SDS:', err);
      setError(err as Error);
      setIsSDSActive(false);

      // Always fall back to custom WebSocket if SDS fails
      // This is expected when WebSocket connections to dream-rpc.somnia.network fail
      if (useFallback) {
        console.log('🔄 SDS unavailable - falling back to custom WebSocket service...');
        initializeWebSocketFallback();
      } else {
        // If fallback disabled, still mark as connected but using fallback
        setIsFallback(true);
        setIsConnected(false);
      }
    }
  }, [enabled, useFallback]);

  // Initialize WebSocket fallback
  const initializeWebSocketFallback = useCallback(() => {
    // Don't initialize if already initialized
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('WebSocket fallback already connected');
      return;
    }
    
    try {
      // Use the backend WebSocket URL (not localhost)
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://bitredict-backend.fly.dev/ws';
      console.log(`🔌 Connecting to WebSocket fallback: ${wsUrl}`);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('✅ WebSocket fallback connected');
        setIsConnected(true);
        setIsFallback(true);
        setError(null);
        
        // Subscribe to all active channels
        const channelsToSubscribe = new Set<string>();
        
        // Subscribe to pool progress channels
        subscribersRef.current.forEach((callbacks, eventType) => {
          if (eventType === 'pool:progress') {
            // Will subscribe per pool when usePoolProgress is called
          } else if (eventType === 'bet:placed') {
            channelsToSubscribe.add('recent_bets');
          } else if (eventType === 'pool:created' || eventType === 'pool:settled') {
            // These are handled via general pool updates
          }
        });
        
        // Subscribe to general channels
        channelsToSubscribe.forEach(channel => {
          ws.send(JSON.stringify({ type: 'subscribe', channel }));
        });
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Handle WebSocket protocol messages
          if (message.type === 'connected' || message.type === 'subscribed' || message.type === 'pong') {
            return; // Protocol messages, ignore
          }
          
          // Handle update messages
          if (message.type === 'update' && message.channel && message.data) {
            const channel = message.channel;
            
            // Map WebSocket channels to SDS event types
            let eventType: SDSEventType | null = null;
            if (channel.startsWith('pool:') && channel.endsWith(':progress')) {
              eventType = 'pool:progress';
            } else if (channel === 'recent_bets') {
              eventType = 'bet:placed';
            }
            
            if (eventType) {
              const callbacks = subscribersRef.current.get(eventType);
              if (callbacks) {
                callbacks.forEach(callback => callback(message.data));
              }
            }
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

    // Map event types to event schema IDs and data schema IDs
    const eventSchemaMap: Record<SDSEventType, string> = {
      'pool:created': 'PoolCreated',
      'pool:settled': 'PoolSettled',
      'bet:placed': 'BetPlaced',
      'pool:progress': 'BetPlaced', // Progress updates use BetPlaced events
      'reputation:changed': 'ReputationActionOccurred',
      'liquidity:added': 'LiquidityAdded',
      'cycle:resolved': 'CycleResolved',
      'slip:evaluated': 'SlipEvaluated',
      'prize:claimed': 'PrizeClaimed'
    };

    const dataSchemaMap: Record<SDSEventType, string> = {
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

    const eventSchemaId = eventSchemaMap[eventType];
    const dataSchemaId = dataSchemaMap[eventType];

    try {
      console.log(`📡 Subscribing to ${eventType} via SDS (event: ${eventSchemaId}, data: ${dataSchemaId})`);
      
      // ✅ Subscribe to SDS events using the SDK
      // Based on Somnia SDS API: subscribe to event schema and optionally fetch enriched data
      const subscriptionPromise = sdkRef.current.streams.subscribe({
        somniaStreamsEventId: eventSchemaId,
        ethCalls: [], // Optional: Add ethCalls to fetch enriched data when event occurs
        onlyPushChanges: false, // Receive all events, not just changes
        onData: (data) => {
          try {
            // The SDK provides enriched data when event is emitted
            // Transform to match our SDSEventData interface
            const transformedData = {
              ...data,
              poolId: data.poolId?.toString() || data.args?.poolId?.toString(),
              // Ensure all required fields are present
              fillPercentage: data.fillPercentage || 0,
              participantCount: data.participantCount || data.participants || 0
            };
            
            console.log(`✅ Received SDS data for ${eventType}:`, transformedData);
            callback(transformedData as SDSEventData);
          } catch (transformError) {
            console.error(`Error transforming SDS data for ${eventType}:`, transformError);
            // Still try to call callback with raw data
            callback(data as any);
          }
        },
        onError: (error) => {
          console.error(`SDS subscription error for ${eventType}:`, error);
        }
      });

      // Handle async subscription result
      // According to docs: subscribe() returns Promise<{ subscriptionId: string, unsubscribe: () => void } | undefined>
      let unsubscribeFn: (() => void) | null = null;
      
      subscriptionPromise.then((result) => {
        if (result && result.unsubscribe) {
          unsubscribeFn = result.unsubscribe;
          console.log(`✅ Successfully subscribed to ${eventType} via SDS (subscriptionId: ${result.subscriptionId})`);
        } else {
          console.warn(`⚠️ SDS subscription for ${eventType} returned undefined`);
        }
      }).catch((err) => {
        console.error(`❌ Failed to establish SDS subscription for ${eventType}:`, err);
        console.log(`   Error: ${err.message || err}`);
        // If subscription fails (e.g., "websocket required" error), fallback immediately
        setIsFallback(true);
        setIsSDSActive(false);
        if (useFallback && !wsRef.current) {
          console.log(`   Falling back to WebSocket for ${eventType}...`);
          initializeWebSocketFallback();
        }
      });

      // Return unsubscribe function (will be set when promise resolves)
      return () => {
        if (unsubscribeFn) {
          unsubscribeFn();
        }
      };

    } catch (err) {
      console.error(`Failed to subscribe to ${eventType} via SDS:`, err);
      console.warn(`Falling back to WebSocket for ${eventType}`);
      // Fallback to WebSocket if SDS subscription fails
      setIsFallback(true);
      setIsSDSActive(false);
      if (useFallback && !wsRef.current) {
        initializeWebSocketFallback();
      }
      return () => {};
    }
  }, [useFallback, initializeWebSocketFallback]);

  // Subscribe to WebSocket channel
  const subscribeToChannel = useCallback((channel: string) => {
    if (isFallback && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ 
        type: 'subscribe', 
        channel 
      }));
      console.log(`📡 Subscribed to ${channel} via WebSocket`);
    }
  }, [isFallback]);

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
    // But if SDS isn't active (WebSocket failed), use WebSocket fallback instead
    let sdsUnsubscribe: (() => void) | null = null;
    if (isSDSActive && sdkRef.current) {
      try {
        sdsUnsubscribe = subscribeToSDSEvent(eventType, callback);
      } catch (err) {
        console.warn(`SDS subscription failed for ${eventType}, using WebSocket fallback:`, err);
        // If SDS subscription fails, ensure fallback is initialized
        if (useFallback && !wsRef.current) {
          initializeWebSocketFallback();
        }
      }
    } else if (isFallback && wsRef.current) {
      // If already in fallback mode, subscribe via WebSocket
      subscribeToChannel(eventType === 'pool:progress' ? `pool:*:progress` : eventType);
    } else if (useFallback && !wsRef.current) {
      // Initialize fallback if not already done
      initializeWebSocketFallback();
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
    subscribeToChannel,
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
  const { subscribe, subscribeToChannel, isFallback, isConnected, ...rest } = useSomniaStreams({ enabled });
  
  useEffect(() => {
    if (!enabled) return;
    
    // Subscribe via SDS/WebSocket hook
    const unsubscribe = subscribe('pool:progress', (data) => {
      const progressData = data as SDSPoolProgressData;
      if (progressData.poolId === poolId || progressData.poolId === String(poolId)) {
        callback(progressData);
      }
    });
    
    // ✅ CRITICAL: Subscribe to WebSocket channel when connection is ready
    if (isFallback && isConnected) {
      subscribeToChannel(`pool:${poolId}:progress`);
    }
    
    return unsubscribe;
  }, [subscribe, subscribeToChannel, poolId, callback, enabled, isFallback, isConnected]);
  
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


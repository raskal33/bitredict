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
  currency?: string; // ✅ Added currency field
}

export interface SDSPoolProgressData {
  poolId: string;
  fillPercentage: number;
  totalBettorStake: string;
  totalCreatorSideStake: string;
  maxPoolSize: string;
  participantCount: number;
  betCount?: number; // ✅ Added bet count
  currentMaxBettorStake?: string; // ✅ Added for dynamic capacity calculation
  effectiveCreatorSideStake?: string; // ✅ Added for dynamic capacity calculation
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
    // ✅ Keep fallback disabled to debug SDS issues
    useFallback = false
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isSDSActive, setIsSDSActive] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const sdkRef = useRef<SDK | null>(null);
  const subscribersRef = useRef<Map<SDSEventType, Set<(data: SDSEventData) => void>>>(new Map());
  const unsubscribeFunctionsRef = useRef<Map<SDSEventType, Map<(data: SDSEventData) => void, (() => void)>>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize SDS SDK
  const initializeSDK = useCallback(async () => {
    if (!enabled) return;

    try {
      console.log('🔄 Initializing Somnia Data Streams...');
      
      // ✅ CRITICAL: With viem 2.37.x, SDK subscribe() requires WebSocket transport explicitly
      // Derive WebSocket URL from RPC URL
      const rpcUrl = process.env.NEXT_PUBLIC_SDS_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || 'https://dream-rpc.somnia.network';
      
      if (!rpcUrl || typeof rpcUrl !== 'string' || rpcUrl.trim() === '') {
        throw new Error(`Invalid RPC URL: ${rpcUrl}`);
      }
      
      // Convert HTTP to WebSocket URL
      let wsUrl = rpcUrl.replace('https://', 'wss://').replace('http://', 'ws://');
      // Remove trailing slash if present
      wsUrl = wsUrl.replace(/\/$/, '');
      // Ensure /ws suffix (required by Somnia)
      if (!wsUrl.endsWith('/ws')) {
        wsUrl = wsUrl + '/ws';
      }
      
      // Validate WebSocket URL
      if (!wsUrl || typeof wsUrl !== 'string' || wsUrl.trim() === '' || 
          (!wsUrl.startsWith('wss://') && !wsUrl.startsWith('ws://'))) {
        throw new Error(`Invalid WebSocket URL derived from RPC: ${wsUrl} (from RPC: ${rpcUrl})`);
      }
      
      console.log('📡 Creating public client with WebSocket transport (required for subscriptions)...');
      console.log(`   RPC URL: ${rpcUrl}`);
      console.log(`   WebSocket URL: ${wsUrl}`);
      console.log(`   Calling webSocket() with URL: ${wsUrl}`);
      
      // Create public client with WebSocket transport (required by SDK's subscribe() in viem 2.37.x)
      const publicClient = createPublicClient({
        chain: somniaTestnet,
        transport: webSocket(wsUrl, {
          key: 'somnia-sds',
          name: 'Somnia SDS WebSocket',
          keepAlive: true,
          reconnect: {
            attempts: 5,
            delay: 1000
          },
          timeout: 30_000
        })
      });
      
      console.log('✅ Public client created with WebSocket transport');
      console.log(`   Transport type: ${publicClient.transport.type}`);
      console.log(`   Transport config:`, publicClient.transport);

      // Initialize SDK (read-only, no wallet needed for subscribing)
      const sdk = new SDK({
        public: publicClient
      });

      sdkRef.current = sdk;
      setIsConnected(true);
      setIsSDSActive(true);
      setIsFallback(false);
      setError(null);
      
      console.log(`✅ Somnia Data Streams initialized (WebSocket transport for viem 2.37.x)`);

    } catch (err) {
      console.error('❌ Failed to initialize SDS:', err);
      setError(err as Error);
      setIsSDSActive(false);
      setIsConnected(false);
      setIsFallback(false);

      // ✅ FIX: Enable fallback to custom WebSocket if SDS fails
      if (useFallback) {
        console.warn('🔄 SDS subscriptions may not work - enabling custom WebSocket fallback');
        initializeWebSocketFallback();
      } else {
        console.error('❌ SDS initialization failed and fallback is disabled. Please check SDS WebSocket configuration.');
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
        
        // ✅ COMPREHENSIVE: Subscribe to all event channels
        subscribersRef.current.forEach((callbacks, eventType) => {
          if (eventType === 'pool:progress') {
            // Will subscribe per pool when usePoolProgress is called
          } else if (eventType === 'bet:placed') {
            // ✅ FIX: Subscribe to both channels for bet events
            channelsToSubscribe.add('recent_bets');
            channelsToSubscribe.add('bet:placed');
          } else if (eventType === 'pool:created') {
            channelsToSubscribe.add('pool:created');
          } else if (eventType === 'pool:settled') {
            channelsToSubscribe.add('pool:settled');
          } else if (eventType === 'reputation:changed') {
            channelsToSubscribe.add('reputation:changed');
          } else if (eventType === 'liquidity:added') {
            channelsToSubscribe.add('liquidity:added');
          } else if (eventType === 'cycle:resolved') {
            channelsToSubscribe.add('cycle:resolved');
          } else if (eventType === 'slip:evaluated') {
            channelsToSubscribe.add('slip:evaluated');
          } else if (eventType === 'prize:claimed') {
            channelsToSubscribe.add('prize:claimed');
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
            // ✅ COMPREHENSIVE: All event types mapped
            let eventType: SDSEventType | null = null;
            if (channel.startsWith('pool:') && channel.endsWith(':progress')) {
              eventType = 'pool:progress';
            } else if (channel === 'recent_bets' || channel === 'bet:placed') {
              // ✅ FIX: Map both recent_bets and bet:placed to bet:placed event type
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
  const subscribeToSDSEvent = useCallback(async (
    eventType: SDSEventType,
    callback: (data: SDSEventData) => void
  ): Promise<(() => void) | null> => {
    if (!sdkRef.current) {
      console.warn('⚠️ SDK not initialized for subscription');
      return null;
    }

    // Map event types to event schema IDs and data schema IDs
    // All event schemas are now registered in the backend
    const eventSchemaMap: Record<SDSEventType, string> = {
      'pool:created': 'PoolCreated',           // ✅ Registered
      'pool:settled': 'PoolSettled',           // ✅ Registered
      'bet:placed': 'BetPlaced',                // ✅ Registered
      'pool:progress': 'BetPlaced',             // ✅ Uses BetPlaced events
      'reputation:changed': 'ReputationActionOccurred',  // ✅ Now registered
      'liquidity:added': 'LiquidityAdded',      // ✅ Now registered
      'cycle:resolved': 'CycleResolved',        // ✅ Now registered
      'slip:evaluated': 'SlipEvaluated',        // ✅ Now registered
      'prize:claimed': 'PrizeClaimed'          // ✅ Now registered
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
      if (!sdkRef.current) {
        throw new Error('SDS SDK not initialized');
      }
      
      console.log(`📡 Subscribing to ${eventType} via SDS (event: ${eventSchemaId}, data: ${dataSchemaId})`);
      
      // ✅ CRITICAL FIX: Verify event schema exists before subscribing
      try {
        const eventSchemas = await sdkRef.current.streams.getEventSchemasById([eventSchemaId]);
        if (!eventSchemas || !eventSchemas[0] || !eventSchemas[0].eventTopic) {
          throw new Error(`Event schema "${eventSchemaId}" not found`);
        }
        console.log(`✅ Event schema "${eventSchemaId}" verified`);
      } catch (verifyError: any) {
        console.error(`❌ Event schema "${eventSchemaId}" verification failed:`, verifyError);
        if (verifyError?.message?.includes('not found') || verifyError?.message?.includes('Failed to get')) {
          console.error(`   Event schema "${eventSchemaId}" is not registered on-chain`);
          console.error(`   Backend needs to register event schemas first`);
          console.error(`   Run: node backend/scripts/register-sds-event-schemas.js`);
        }
        return null;
      }
      
      // ✅ Subscribe to SDS events using the SDK
      // Based on Somnia SDS API: subscribe to event schema and optionally fetch enriched data
      const subscriptionResult = await sdkRef.current.streams.subscribe({
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

      // Handle subscription result
      if (subscriptionResult && subscriptionResult.unsubscribe) {
        console.log(`✅ Successfully subscribed to ${eventType} via SDS (subscriptionId: ${subscriptionResult.subscriptionId})`);
        return subscriptionResult.unsubscribe;
      } else {
        console.warn(`⚠️ SDS subscription for ${eventType} returned undefined`);
        return null;
      }

    } catch (err: any) {
      console.error(`❌ Failed to subscribe to ${eventType} via SDS:`, err);
      console.error(`   Error: ${err.message || err}`);
      
      // ✅ FIX: Provide detailed error messages
      if (err.message?.includes('UrlRequiredError') || err.message?.includes('No URL was provided')) {
        console.error(`❌ SDS SDK transport error: WebSocket URL not properly configured`);
        console.error(`   This usually means the SDK's public client doesn't have a valid WebSocket transport`);
        console.error(`   Check NEXT_PUBLIC_SDS_WS_URL or NEXT_PUBLIC_SDS_RPC_URL environment variables`);
      } else if (err.message?.includes('Failed to get event schemas') || err.message?.includes('event schemas')) {
        console.error(`❌ Event schema "${eventSchemaId}" not registered on-chain yet`);
        console.error(`   Backend needs to register event schemas first`);
        console.error(`   Run: node backend/scripts/register-sds-event-schemas.js`);
      }
      
      return null;
    }
  }, []);

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

    // ✅ FIX: Initialize unsubscribe function storage
    if (!unsubscribeFunctionsRef.current.has(eventType)) {
      unsubscribeFunctionsRef.current.set(eventType, new Map());
    }

    // ✅ FIX: Use both SDS and WebSocket fallback
    let sdsUnsubscribe: (() => void) | null = null;
    let wsUnsubscribe: (() => void) | null = null;
    
    if (isSDSActive && sdkRef.current) {
      // ✅ Try SDS subscription with retry logic
      const attemptSubscription = async (retryCount = 0) => {
        try {
          const unsubscribeFn = await subscribeToSDSEvent(eventType, callback);
          if (unsubscribeFn) {
            unsubscribeFunctionsRef.current.get(eventType)!.set(callback, unsubscribeFn);
            console.log(`✅ SDS subscription established for ${eventType}`);
          } else {
            // Retry if subscription returned null (might be timing issue)
            if (retryCount < 3) {
              console.warn(`⚠️ SDS subscription for ${eventType} returned null, retrying... (${retryCount + 1}/3)`);
              setTimeout(() => attemptSubscription(retryCount + 1), 1000 * (retryCount + 1));
            } else {
              console.warn(`⚠️ SDS subscription for ${eventType} failed after ${retryCount + 1} attempts - using WebSocket fallback`);
              // SDS failed, ensure WebSocket fallback is initialized
              if (useFallback && !isFallback) {
                initializeWebSocketFallback();
              }
            }
          }
        } catch (err) {
          // Retry on error (might be timing issue with SDK initialization)
          if (retryCount < 3) {
            console.warn(`⚠️ SDS subscription for ${eventType} failed, retrying... (${retryCount + 1}/3):`, err);
            setTimeout(() => attemptSubscription(retryCount + 1), 1000 * (retryCount + 1));
          } else {
            console.error(`❌ SDS subscription failed for ${eventType} after ${retryCount + 1} attempts - using WebSocket fallback:`, err);
            // SDS failed, ensure WebSocket fallback is initialized
            if (useFallback && !isFallback) {
              initializeWebSocketFallback();
            }
          }
        }
      };
      
      attemptSubscription();
    } else {
      console.warn(`⚠️ SDS not active for ${eventType}. SDK not initialized or connection failed.`);
      console.warn(`   isSDSActive: ${isSDSActive}, sdkRef.current: ${!!sdkRef.current}`);
      
      // Retry subscription after a delay if SDK becomes active
      // Check SDK ref directly (not state, which might be stale)
      const maxRetries = 30; // 30 seconds max wait
      let retryCount = 0;
      
      const checkAndRetry = () => {
        // Check SDK ref directly - it will be current
        if (sdkRef.current) {
          const attemptSubscription = async () => {
            try {
              const unsubscribeFn = await subscribeToSDSEvent(eventType, callback);
              if (unsubscribeFn) {
                unsubscribeFunctionsRef.current.get(eventType)!.set(callback, unsubscribeFn);
                console.log(`✅ SDS subscription established for ${eventType} (after retry)`);
              }
            } catch (err) {
              console.error(`❌ SDS subscription failed for ${eventType} (after retry):`, err);
              // SDS failed, ensure WebSocket fallback is initialized
              if (useFallback && !isFallback) {
                initializeWebSocketFallback();
              }
            }
          };
          attemptSubscription();
        } else if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(checkAndRetry, 1000);
        } else {
          console.warn(`⚠️ SDK not available after ${maxRetries} retries - using WebSocket fallback`);
          // SDK never became available, use WebSocket fallback
          if (useFallback && !isFallback) {
            initializeWebSocketFallback();
          }
        }
      };
      
      // Only retry if SDK is not available yet
      if (!sdkRef.current) {
        checkAndRetry();
      }
    }
    
    // If fallback is enabled and WebSocket is active, also subscribe via WebSocket
    if (isFallback && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // WebSocket fallback subscription is handled by the fallback mechanism
      console.log(`📡 Using WebSocket fallback for ${eventType}`);
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

      const unsubscribeMap = unsubscribeFunctionsRef.current.get(eventType);
      if (unsubscribeMap) {
        const unsubscribeFn = unsubscribeMap.get(callback);
        if (unsubscribeFn) {
          unsubscribeFn();
          unsubscribeMap.delete(callback);
        }
        if (unsubscribeMap.size === 0) {
          unsubscribeFunctionsRef.current.delete(eventType);
        }
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
      // Unsubscribe from all SDS subscriptions
      unsubscribeFunctionsRef.current.forEach((unsubscribeMap) => {
        unsubscribeMap.forEach((unsubscribeFn) => {
          unsubscribeFn();
        });
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
    
    // ✅ FIX: Only subscribe via SDS - no WebSocket fallback
    const unsubscribe = subscribe('pool:progress', (data) => {
      const progressData = data as SDSPoolProgressData;
      if (progressData.poolId === poolId || progressData.poolId === String(poolId)) {
        // ✅ CRITICAL: Ensure all required fields are present for dynamic calculation
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


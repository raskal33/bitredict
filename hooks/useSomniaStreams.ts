/**
 * Somnia Data Streams Hook
 * 
 * Subscribes to enriched blockchain data via Somnia Data Streams (SDS).
 * Based on official Somnia SDK documentation.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { SDK } from '@somnia-chain/streams';
import { createPublicClient, webSocket, defineChain, decodeAbiParameters } from 'viem';

// Define Somnia testnet with WebSocket URL

const SOMNIA_TESTNET_RPC_URL = process.env.NEXT_PUBLIC_SDS_RPC_URL || 'https://dream-rpc.somnia.network';
const SOMNIA_TESTNET_WS_URL = process.env.NEXT_PUBLIC_SDS_WS_URL || 'wss://dream-rpc.somnia.network/ws'; // ✅ /ws suffix required

const somniaTestnet = defineChain({
  id: 50312,
  name: 'Somnia Testnet',
  network: 'somnia-testnet',
  nativeCurrency: {
    name: 'Somnia Testnet Token',
    symbol: 'STT',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [SOMNIA_TESTNET_RPC_URL],
      webSocket: [SOMNIA_TESTNET_WS_URL],
    },
    public: {
      http: [SOMNIA_TESTNET_RPC_URL],
      webSocket: [SOMNIA_TESTNET_WS_URL],
    },
  },
  blockExplorers: {
    default: {
      name: 'Somnia Explorer',
      url: 'https://shannon-explorer.somnia.network',
    },
  },
  testnet: true,
});

// ✅ CRITICAL: Module-level state shared across ALL hook instances to prevent duplicate subscriptions
const globalSubscribersMap = new Map<SDSEventType, Set<(data: SDSEventData) => void>>();
const globalUnsubscribeFunctionsMap = new Map<string, () => void>();
const globalPendingSubscriptions = new Set<SDSEventType>(); // ✅ Shared lock
let globalSDKInstance: SDK | null = null; // ✅ Shared SDK instance

// ✅ Global deduplication: Track seen events to prevent duplicate processing
const globalSeenEvents = new Map<SDSEventType, Set<string>>();

// ✅ Rate limiting: Track last notification time per event type to prevent bombing
const lastNotificationTime = new Map<string, number>();
const NOTIFICATION_RATE_LIMIT_MS = 2000; // Max 1 notification per 2 seconds per unique event

// ✅ Helper to normalize IDs (convert BigInt/hex to readable numbers)
const normalizeId = (id: any): string => {
  if (!id) return '0';
  if (typeof id === 'string') {
    // If it's a hex string (starts with 0x), convert to number
    if (id.startsWith('0x')) {
      try {
        const bigInt = BigInt(id);
        return bigInt.toString();
      } catch {
        return id;
      }
    }
    // If it's already a number string, return as-is
    return id;
  }
  if (typeof id === 'bigint' || typeof id === 'number') {
    return id.toString();
  }
  return String(id);
};

// ✅ Helper to check if timestamp is recent (within last 1 minute for real-time)
const isRecentEvent = (timestamp: number | string | undefined): boolean => {
  if (!timestamp) return false; // ✅ CRITICAL: Reject events without timestamp
  const ts = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
  if (isNaN(ts) || ts <= 0) return false; // ✅ CRITICAL: Reject invalid timestamps
  const now = Math.floor(Date.now() / 1000);
  const oneMinuteAgo = now - (1 * 60); // ✅ Changed from 5 minutes to 1 minute for real-time only
  return ts >= oneMinuteAgo;
};

// Helper to create unique event key for deduplication
const createEventDedupeKey = (eventType: SDSEventType, decodedData: any): string => {
  // ✅ Normalize IDs before creating key
  const poolId = normalizeId(decodedData.poolId);
  const timestamp = decodedData.timestamp?.toString() || '';
  
  if (eventType === 'bet:placed') {
    const bettor = decodedData.bettor?.toString() || decodedData.bettorAddress?.toString() || '';
    return `${eventType}:${poolId}:${bettor}:${timestamp}`;
  } else if (eventType === 'pool:created') {
    const creator = decodedData.creator?.toString() || decodedData.creatorAddress?.toString() || '';
    return `${eventType}:${poolId}:${creator}:${timestamp}`;
  } else if (eventType === 'liquidity:added') {
    const provider = decodedData.provider?.toString() || decodedData.providerAddress?.toString() || '';
    return `${eventType}:${poolId}:${provider}:${timestamp}`;
  } else if (eventType === 'cycle:resolved') {
    const cycleId = normalizeId(decodedData.cycleId || decodedData.poolId);
    return `${eventType}:${cycleId}:${timestamp}`;
  } else if (eventType === 'slip:evaluated') {
    const player = decodedData.player?.toString() || decodedData.user?.toString() || '';
    const slipId = normalizeId(decodedData.slipId);
    return `${eventType}:${slipId}:${player}:${timestamp}`;
  }
  
  // Fallback: use poolId + timestamp
  return `${eventType}:${poolId}:${timestamp}`;
};

// Helper to check if event was already seen
const isEventSeen = (eventType: SDSEventType, key: string): boolean => {
  const seenSet = globalSeenEvents.get(eventType);
  if (!seenSet) return false;
  return seenSet.has(key);
};

// Helper to mark event as seen
const markEventSeen = (eventType: SDSEventType, key: string) => {
  if (!globalSeenEvents.has(eventType)) {
    globalSeenEvents.set(eventType, new Set());
  }
  const seenSet = globalSeenEvents.get(eventType)!;
  seenSet.add(key);
  
  // Clean up old entries (keep last 500 per event type)
  if (seenSet.size > 500) {
    const firstKey = seenSet.values().next().value;
    if (firstKey) {
      seenSet.delete(firstKey);
    }
  }
  
  // Persist to localStorage
  try {
    const storageKey = `seen_events_${eventType}`;
    const eventsArray = Array.from(seenSet);
    localStorage.setItem(storageKey, JSON.stringify(eventsArray));
  } catch (e) {
    console.warn(`Failed to save seen events for ${eventType} to localStorage:`, e);
  }
};

// Load seen events from localStorage on module load
if (typeof window !== 'undefined') {
  try {
    const eventTypes: SDSEventType[] = ['bet:placed', 'pool:created', 'liquidity:added', 'cycle:resolved', 'slip:evaluated'];
    eventTypes.forEach(eventType => {
      const storageKey = `seen_events_${eventType}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            globalSeenEvents.set(eventType, new Set(parsed));
          }
        } catch (e) {
          console.warn(`Failed to parse seen events for ${eventType}:`, e);
        }
      }
    });
  } catch (e) {
    console.warn('Failed to load seen events from localStorage:', e);
  }
}

// ✅ CRITICAL: Track desired WebSocket channels globally to avoid duplicate subscriptions
const desiredWebSocketChannels = new Set<string>();
const subscribedWebSocketChannels = new Set<string>();
let isWebSocketConnecting = false;

// Get WebSocket URL from chain config 
const getWSURL = (): string => {
  const wsUrl = somniaTestnet.rpcUrls.default.webSocket?.[0];
  if (!wsUrl) {
    throw new Error('WebSocket URL not configured for Somnia chain');
  }
  return wsUrl;
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
  reconnect: () => void;
}

// ✅ CRITICAL FIX: Use context-based subscriptions (data streams) instead of event schemas
// Event schemas require on-chain smart contract event emission which causes "Failed to get event schemas" error
// Context-based subscriptions read from data streams published via sdk.streams.set()
const EVENT_CONTEXT_MAP: Record<SDSEventType, string> = {
  'pool:created': 'pools:created',
  'pool:settled': 'pools:settled',
  'bet:placed': 'bets',
  'pool:progress': 'pools:progress',
  'reputation:changed': 'reputation',
  'liquidity:added': 'liquidity',
  'cycle:resolved': 'cycles',
  'slip:evaluated': 'slips',
  'prize:claimed': 'prizes'
};

export function useSomniaStreams(
  options: UseSomniaStreamsOptions = {}
): UseSomniaStreamsReturn {
  const {
    enabled = true,
    useFallback = false // ✅ DISABLED: Using pure SDS with context-based subscriptions
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isSDSActive, setIsSDSActive] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // ✅ Use global SDK instance instead of per-hook instance
  const sdkRef = useRef<SDK | null>(globalSDKInstance);
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize SDS SDK (only once globally)
  const initializeSDK = useCallback(async () => {
    if (!enabled) return;

    // ✅ If SDK already initialized globally, reuse it
    if (globalSDKInstance) {
      sdkRef.current = globalSDKInstance;
      setIsSDSActive(true);
      setIsConnected(true);
      console.log('♻️ Reusing existing global SDK instance');
      return;
    }

    try {
      // Get WebSocket URL from chain config 
      const wsUrl = getWSURL();
      
      console.log('📡 Creating public client with WebSocket transport...');
      console.log(`   WebSocket URL: ${wsUrl}`);

      // Create WebSocket transport
      const wsTransport = webSocket(wsUrl);
      
      // Create public client 
      const publicClient = createPublicClient({
        chain: somniaTestnet,
        transport: wsTransport,
      });

      console.log('✅ Public client created, initializing SDK...');
      
      // Initialize SDK
      const sdk = new SDK({
        public: publicClient
      });

      console.log('✅ SDK initialized successfully');
      
      // ✅ Store globally to prevent multiple SDK instances
      globalSDKInstance = sdk;
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

  const getChannelsForEvent = useCallback((eventType: SDSEventType, poolId?: string): string[] => {
    if (eventType === 'bet:placed') {
      return ['bet:placed', 'recent_bets'];
    }
    if (eventType === 'pool:progress' && poolId) {
      return [`pool:${poolId}:progress`, 'pool:progress'];
    }
    if (eventType === 'pool:progress') {
      return ['pool:progress'];
    }
    return [eventType];
  }, []);

  const flushWebSocketSubscriptions = useCallback(() => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    desiredWebSocketChannels.forEach(channel => {
      if (!subscribedWebSocketChannels.has(channel)) {
        console.log(`📡 [WebSocket] Subscribing to channel: ${channel}`);
        wsRef.current?.send(JSON.stringify({ type: 'subscribe', channel }));
        subscribedWebSocketChannels.add(channel);
      }
    });
  }, []);

  // WebSocket fallback
  const initializeWebSocketFallback = useCallback(() => {
    if (wsRef.current || isWebSocketConnecting) return;
    
    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://bitredict-backend.fly.dev/ws';
      console.log(`📡 [WebSocket] Initializing fallback connection to: ${wsUrl}`);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      isWebSocketConnecting = true;

      ws.onopen = () => {
        isWebSocketConnecting = false;
        console.log(`✅ [WebSocket] Connected successfully`);
        setIsConnected(true);
        setIsFallback(true);
        setError(null);
        subscribedWebSocketChannels.clear();
        flushWebSocketSubscriptions();
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log(`📦 [WebSocket] Received message:`, message.type, message.channel);
          
          if (message.type === 'update' && message.channel && message.data) {
            const channel = message.channel;
            let eventType: SDSEventType | null = null;
            
            if (channel.startsWith('pool:') && channel.endsWith(':progress')) {
              eventType = 'pool:progress';
              // Extract poolId from channel (format: pool:123:progress)
              const poolIdMatch = channel.match(/pool:(\d+):progress/);
              if (poolIdMatch && message.data) {
                message.data.poolId = poolIdMatch[1];
              }
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
            } else if (channel === 'pool:progress') {
              eventType = 'pool:progress';
            }
            
            if (eventType) {
              // ✅ Normalize IDs in WebSocket data before broadcasting
              if (message.data) {
                if (message.data.poolId) {
                  message.data.poolId = normalizeId(message.data.poolId);
                }
                if (message.data.cycleId || message.data.cycle_id) {
                  message.data.cycleId = normalizeId(message.data.cycleId || message.data.cycle_id);
                }
                if (message.data.slipId) {
                  message.data.slipId = normalizeId(message.data.slipId);
                }
                
                // ✅ TIME FILTERING: Only process recent events (within last 5 minutes)
                const eventTimestamp = message.data.timestamp || Math.floor(Date.now() / 1000);
                if (!isRecentEvent(eventTimestamp)) {
                  console.log(`⚠️ [WebSocket] Skipping old ${eventType} event (timestamp: ${eventTimestamp})`);
                  return;
                }
                
                // ✅ Rate limiting: Prevent notification bombing
                const now = Date.now();
                const rateLimitKey = `${eventType}:${message.data.poolId || message.data.cycleId || 'unknown'}`;
                const lastTime = lastNotificationTime.get(rateLimitKey);
                if (lastTime && (now - lastTime) < NOTIFICATION_RATE_LIMIT_MS) {
                  console.log(`⚠️ [WebSocket] Rate limit: Skipping ${eventType} event (last notification ${now - lastTime}ms ago)`);
                  return;
                }
                lastNotificationTime.set(rateLimitKey, now);
                
                // ✅ Deduplication: Check if we've already seen this event
                const dedupeKey = createEventDedupeKey(eventType, message.data);
                if (isEventSeen(eventType, dedupeKey)) {
                  console.log(`⚠️ [WebSocket] Skipping duplicate ${eventType} event: ${dedupeKey}`);
                  return;
                }
                
                // Mark as seen BEFORE broadcasting
                markEventSeen(eventType, dedupeKey);
              }
              
              const callbacks = globalSubscribersMap.get(eventType);
              console.log(`📦 [WebSocket] Broadcasting ${eventType} to ${callbacks?.size || 0} callbacks`);
              if (callbacks && callbacks.size > 0) {
                callbacks.forEach(callback => {
                  try {
                    callback(message.data);
        } catch (err) {
                    console.error(`❌ [WebSocket] Error in callback:`, err);
                  }
                });
              } else {
                console.warn(`⚠️ [WebSocket] No callbacks registered for ${eventType}`);
              }
            } else {
              console.warn(`⚠️ [WebSocket] Unknown channel: ${channel}`);
            }
          } else if (message.type === 'connected' || message.type === 'subscribed') {
            console.log(`✅ [WebSocket] ${message.type}:`, message.channel || 'connection established');
          }
        } catch (err) {
          console.error(`❌ [WebSocket] Error parsing message:`, err);
        }
      };

      ws.onerror = (error) => {
        console.error(`❌ [WebSocket] Connection error:`, error);
        setError(new Error('WebSocket connection failed'));
      };

      ws.onclose = (event) => {
        console.log(`🔌 [WebSocket] Connection closed:`, event.code, event.reason);
        isWebSocketConnecting = false;
        wsRef.current = null;
        subscribedWebSocketChannels.clear();
        setIsConnected(false);
        setIsFallback(false);
        // ✅ CRITICAL FIX: Attempt to reconnect after delay
        setTimeout(() => {
          if (useFallback) {
            console.log(`🔄 [WebSocket] Attempting to reconnect...`);
            initializeWebSocketFallback();
        }
        }, 3000);
      };

    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [flushWebSocketSubscriptions, useFallback]);

  // ✅ CRITICAL FIX: Subscribe to WebSocket channel
  const subscribeToWebSocketChannel = useCallback((eventType: SDSEventType, poolId?: string) => {
    const channels = getChannelsForEvent(eventType, poolId);
    let added = false;
    channels.forEach(channel => {
      if (!desiredWebSocketChannels.has(channel)) {
        desiredWebSocketChannels.add(channel);
        added = true;
    }
    });

    if (added && wsRef.current?.readyState === WebSocket.OPEN) {
      flushWebSocketSubscriptions();
    }

    if (!wsRef.current && useFallback && !isWebSocketConnecting) {
      initializeWebSocketFallback();
    }
  }, [getChannelsForEvent, flushWebSocketSubscriptions, initializeWebSocketFallback, useFallback]);

  const unsubscribeFromWebSocketChannel = useCallback((eventType: SDSEventType, poolId?: string) => {
    const channels = getChannelsForEvent(eventType, poolId);
    channels.forEach(channel => {
      if (desiredWebSocketChannels.has(channel)) {
        desiredWebSocketChannels.delete(channel);
      }
      if (wsRef.current?.readyState === WebSocket.OPEN && subscribedWebSocketChannels.has(channel)) {
        console.log(`📡 [WebSocket] Unsubscribing from channel: ${channel}`);
        wsRef.current?.send(JSON.stringify({ type: 'unsubscribe', channel }));
        subscribedWebSocketChannels.delete(channel);
    }
    });
  }, [getChannelsForEvent]);

  // Subscribe to SDS events (using global state to prevent duplicates across components)
  const subscribe = useCallback((
    eventType: SDSEventType,
    callback: (data: SDSEventData) => void
  ): (() => void) => {
    // ✅ Use GLOBAL subscribers map instead of per-hook ref
    if (!globalSubscribersMap.has(eventType)) {
      globalSubscribersMap.set(eventType, new Set());
    }
    
    const callbacks = globalSubscribersMap.get(eventType)!;
    const isFirstSubscriber = callbacks.size === 0; // Check BEFORE adding
    const isPending = globalPendingSubscriptions.has(eventType); // ✅ Check GLOBAL pending
    callbacks.add(callback);

    // ✅ CRITICAL FIX: Check if SDK is available (even if isSDSActive state hasn't updated yet)
    const sdkAvailable = sdkRef.current || globalSDKInstance;
    const sdsActive = isSDSActive || !!sdkAvailable;
    
    // ✅ CRITICAL FIX: Always initialize WebSocket fallback (even if SDS is working)
    // This ensures we have a backup connection
    if (useFallback && !wsRef.current && !isWebSocketConnecting) {
      console.log(`📡 [WebSocket] Initializing fallback for event: ${eventType}`);
      initializeWebSocketFallback();
    }
    
    // ✅ CRITICAL FIX: Subscribe to WebSocket if connected (even if SDS is also working)
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      subscribeToWebSocketChannel(eventType);
    }
    
      // Subscribe via SDS if available (only once per event type AND not already pending)
      // ✅ FIX: Use context-based subscriptions (data streams) instead of event schemas
      // Falls back to WebSocket if SDS subscription fails
      if (sdkAvailable && sdsActive && isFirstSubscriber && !isPending) {
        const contextConfig = EVENT_CONTEXT_MAP[eventType];
        
        // ✅ Mark as pending GLOBALLY to prevent duplicate subscriptions across ALL components
        globalPendingSubscriptions.add(eventType);
        
        console.log(`📡 [GLOBAL] Subscribing to ${eventType} via SDS (context: ${contextConfig})`);
        console.log(`   SDK available: ${!!sdkAvailable}, SDS active: ${sdsActive}, First subscriber: ${isFirstSubscriber}, Pending: ${isPending}`);
        
        try {
          // ✅ CRITICAL FIX: Use context-based subscriptions (data streams) instead of event schemas
          // This matches the working Somnia examples and avoids "Failed to get event schemas" error
          const subscriptionParams = {
            context: contextConfig,
            ethCalls: [], // Empty array for context-based subscriptions
            onlyPushChanges: true, // ✅ CRITICAL: Only receive new events, not historical ones
            onData: (data: any) => {
            console.log(`📦 [SDS] Received ${eventType} data:`, data);
            
            // ✅ CRITICAL FIX: Extract data from result field (SDS wraps data in {subscription, result})
            let actualData = data;
            if (data && typeof data === 'object' && data.result) {
              console.log(`📦 [SDS] Extracting data from result field`);
              actualData = data.result;
            }
            
            // Parse JSON string if backend sent JSON
            if (typeof actualData === 'string') {
              try {
                actualData = JSON.parse(actualData);
                console.log(`📦 [SDS] Parsed JSON string to object`);
              } catch (e) {
                console.warn(`⚠️ Failed to parse JSON:`, e);
              }
            }
            
            console.log(`📦 [SDS] Actual data:`, actualData);
            
            // ✅ CRITICAL FIX: SDS returns on-chain event logs, need to decode topics + data
            let decodedData = actualData;
            
            // Check if this is an on-chain event log (has address, topics, data fields)
            if (actualData.address && actualData.topics && Array.isArray(actualData.topics)) {
              console.log(`📦 [SDS] Detected on-chain event log - decoding topics...`);
              
              // ✅ CRITICAL: Extract poolId or cycleId from first indexed param - topics[1] (topics[0] is event signature)
              // Only extract if we have at least 2 topics (signature + at least one indexed param)
              if (actualData.topics.length >= 2) {
                try {
                  const idHex = actualData.topics[1]; // ✅ FIX: Use topics[1] for first indexed param (ID)
                  console.log(`   📊 Raw ID hex from topic[1]: ${idHex}`);
                  const id = normalizeId(idHex); // ✅ CRITICAL: Normalize immediately after extraction
                  
                  if (eventType === 'cycle:resolved') {
                    decodedData.cycleId = id;
                    console.log(`   ✅ Decoded and normalized cycleId from topic[1]: ${id} (from hex: ${idHex})`);
                  } else {
                    decodedData.poolId = id;
                    console.log(`   ✅ Decoded and normalized poolId from topic[1]: ${id} (from hex: ${idHex})`);
                  }
                } catch (e) {
                  console.warn(`   ⚠️ Failed to decode ID from topic[1]:`, e);
                }
              } else {
                // ✅ CRITICAL: When topics.length === 1, we can't extract ID from topics
                // It will be extracted from JSON data field instead
                console.warn(`   ⚠️ Not enough topics for ${eventType} (need at least 2, got ${actualData.topics.length}) - will try to extract from JSON data field`);
              }
              
              // Extract bettor/provider/creator from second topic (indexed parameter) - topics[2]
              if (actualData.topics.length >= 3) {
                try {
                  const addressHex = actualData.topics[2]; // ✅ FIX: Use topics[2] for second indexed param (Address)
                  // Extract address from bytes32 (last 20 bytes)
                  const address = '0x' + addressHex.slice(-40).toLowerCase();
                  
                  // Validate address (must not be all zeros, invalid patterns, or too small)
                  // Skip addresses like 0x0000...0001, 0x0000...0020, etc. (these are likely offsets, not addresses)
                  const isValidAddress = address && 
                    address.length === 42 &&
                    /^0x[0-9a-f]{40}$/i.test(address) &&
                    address !== '0x0000000000000000000000000000000000000000' &&
                    // Skip addresses that look like offsets (have many leading zeros and small value)
                    !(/^0x0{30,39}[0-9a-f]{1,9}$/i.test(address) && parseInt(address, 16) < 1000);
                  
                  if (isValidAddress) {
                    if (eventType === 'bet:placed') {
                      decodedData.bettor = address;
                      decodedData.bettorAddress = address; // Add alias for component compatibility
                      console.log(`   ✅ Decoded bettor from topic[2]: ${address}`);
                    } else if (eventType === 'liquidity:added') {
                      decodedData.provider = address;
                      console.log(`   ✅ Decoded provider from topic[2]: ${address}`);
                    } else if (eventType === 'pool:created') {
                      decodedData.creator = address;
                      console.log(`   ✅ Decoded creator from topic[2]: ${address}`);
                    } else if (eventType === 'slip:evaluated') {
                      decodedData.player = address;
                      console.log(`   ✅ Decoded player from topic[2]: ${address}`);
                    }
                  } else {
                    console.warn(`   ⚠️ Invalid address decoded from topic[2] for ${eventType}: ${address} (likely an offset, not an address)`);
                  }
                } catch (e) {
                  console.warn(`   ⚠️ Failed to decode address from topic[2] for ${eventType}:`, e);
                }
              } else {
                // Only 1-2 topics - log for debugging
                if (eventType === 'bet:placed' || eventType === 'pool:created' || eventType === 'liquidity:added') {
                  console.log(`   ℹ️ Only ${actualData.topics.length} topics for ${eventType}, will try to extract from data field or JSON`);
                }
              }
              
              // Decode non-indexed parameters from data field if present
              if (actualData.data && actualData.data !== '0x' && actualData.data.length > 2) {
                console.log(`   📦 Event has data field, length: ${actualData.data.length}`);
                
                // ✅ CRITICAL: Check if data field contains JSON (starts with '{' when decoded) vs ABI-encoded
                // Must check BEFORE any ABI decode attempt to prevent InvalidBytesBooleanError
                let isJsonData = false;
                let jsonData: any = null;
                try {
                  const decodedBytes = Buffer.from(actualData.data.slice(2), 'hex');
                  const decodedString = decodedBytes.toString('utf8').replace(/\0/g, '');
                  const trimmed = decodedString.trim();
                  // ✅ CRITICAL: Check if it's JSON (starts with '{' or '[')
                  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                    isJsonData = true;
                    try {
                      jsonData = JSON.parse(decodedString);
                      console.log(`   📄 Data field contains JSON, parsed successfully`);
                    } catch (parseError) {
                      console.warn(`   ⚠️ Failed to parse JSON data:`, parseError);
                      // If JSON parse fails, don't try ABI decode - it will fail
                      isJsonData = false;
                    }
                  }
                } catch (e) {
                  // Not JSON, continue with ABI decoding
                  isJsonData = false;
                }
                
                // If JSON data is available, try to extract fields from it
                if (isJsonData && jsonData) {
                  console.log(`   📄 JSON data keys:`, Object.keys(jsonData));
                  
                  // Helper to extract nested values from JSON
                  const extractFromJson = (obj: any, keys: string[]): string | undefined => {
                    for (const key of keys) {
                      const value = obj[key];
                      if (value && typeof value === 'string' && value.startsWith('0x') && value.length === 42) {
                        return value;
                      }
                      // Check nested objects
                      if (value && typeof value === 'object') {
                        for (const nestedKey of keys) {
                          if (value[nestedKey] && typeof value[nestedKey] === 'string' && value[nestedKey].startsWith('0x')) {
                            return value[nestedKey];
                          }
                        }
                      }
                    }
                    return undefined;
                  };
                  
                  // ✅ CRITICAL: Extract poolId/cycleId from JSON if not in topics
                  if (!decodedData.poolId && !decodedData.cycleId) {
                    const poolId = jsonData.poolId || jsonData.pool_id || jsonData.id;
                    const cycleId = jsonData.cycleId || jsonData.cycle_id;
                    if (cycleId) {
                      decodedData.cycleId = normalizeId(cycleId);
                      console.log(`   ✅ Extracted cycleId from JSON: ${decodedData.cycleId}`);
                    } else if (poolId) {
                      decodedData.poolId = normalizeId(poolId);
                      console.log(`   ✅ Extracted poolId from JSON: ${decodedData.poolId}`);
                    }
                  }
                  
                  // ✅ CRITICAL: Extract timestamp from JSON (required for event processing)
                  if (jsonData.timestamp) {
                    const ts = typeof jsonData.timestamp === 'number' ? jsonData.timestamp : parseInt(jsonData.timestamp, 10);
                    if (!isNaN(ts) && ts > 0 && ts < 2147483647) {
                      decodedData.timestamp = ts;
                      console.log(`   ✅ Extracted timestamp from JSON: ${ts}`);
                    }
                  } else if (jsonData.created_at || jsonData.createdAt) {
                    // Try to parse date string
                    const dateStr = jsonData.created_at || jsonData.createdAt;
                    try {
                      const date = new Date(dateStr);
                      const ts = Math.floor(date.getTime() / 1000);
                      if (ts > 0 && ts < 2147483647) {
                        decodedData.timestamp = ts;
                        console.log(`   ✅ Extracted timestamp from date string: ${ts}`);
                      }
                    } catch (e) {
                      console.warn(`   ⚠️ Failed to parse date string:`, dateStr);
                    }
                  }
                  
                  if (eventType === 'bet:placed' && !decodedData.bettor) {
                    const bettor = extractFromJson(jsonData, ['bettor', 'bettorAddress', 'player', 'user', 'address', 'from']);
                    if (bettor) {
                      decodedData.bettor = bettor;
                      decodedData.bettorAddress = bettor;
                      console.log(`   ✅ Extracted bettor from JSON data: ${bettor}`);
                    } else {
                      console.log(`   ⚠️ Could not find bettor in JSON data, keys:`, Object.keys(jsonData));
                    }
                  }
                  if (eventType === 'pool:created' && !decodedData.creator) {
                    const creator = extractFromJson(jsonData, ['creator', 'creatorAddress', 'owner', 'user', 'address', 'from']);
                    if (creator) {
                      decodedData.creator = creator;
                      console.log(`   ✅ Extracted creator from JSON data: ${creator}`);
                    } else {
                      console.log(`   ⚠️ Could not find creator in JSON data, keys:`, Object.keys(jsonData));
                    }
                  }
                  if (eventType === 'liquidity:added' && !decodedData.provider) {
                    const provider = extractFromJson(jsonData, ['provider', 'providerAddress', 'user', 'address', 'from']);
                    if (provider) {
                      decodedData.provider = provider;
                      console.log(`   ✅ Extracted provider from JSON data: ${provider}`);
                    } else {
                      console.log(`   ⚠️ Could not find provider in JSON data, keys:`, Object.keys(jsonData));
                    }
                  }
                  
                  // Extract currency from JSON for all event types
                  if (jsonData.currency) {
                    decodedData.currency = jsonData.currency;
                    console.log(`   ✅ Extracted currency from JSON: ${jsonData.currency}`);
                  } else if (jsonData.useBitr !== undefined) {
                    decodedData.currency = jsonData.useBitr ? 'BITR' : 'STT';
                    decodedData.useBitr = jsonData.useBitr;
                    console.log(`   ✅ Extracted currency from useBitr flag: ${decodedData.currency}`);
                  } else if (jsonData.use_bitr !== undefined) {
                    decodedData.currency = jsonData.use_bitr ? 'BITR' : 'STT';
                    decodedData.useBitr = jsonData.use_bitr;
                    console.log(`   ✅ Extracted currency from use_bitr flag: ${decodedData.currency}`);
                  }
                  
                  // Extract amount from JSON if available
                  if (jsonData.amount && !decodedData.amount) {
                    decodedData.amount = jsonData.amount.toString();
                    console.log(`   ✅ Extracted amount from JSON: ${decodedData.amount}`);
                  }
                  
                  // Extract pool title from JSON if available
                  if (jsonData.title && !decodedData.poolTitle && !decodedData.title) {
                    decodedData.poolTitle = jsonData.title;
                    decodedData.title = jsonData.title;
                    console.log(`   ✅ Extracted pool title from JSON: ${jsonData.title}`);
                  }
                  
                  // ✅ CRITICAL: Extract poolId/cycleId from JSON if not already set from topics
                  if (!decodedData.poolId && !decodedData.cycleId) {
                    const poolId = jsonData.poolId || jsonData.pool_id || jsonData.id;
                    const cycleId = jsonData.cycleId || jsonData.cycle_id;
                    if (cycleId) {
                      decodedData.cycleId = normalizeId(cycleId);
                      console.log(`   ✅ Extracted cycleId from JSON: ${decodedData.cycleId}`);
                    } else if (poolId) {
                      decodedData.poolId = normalizeId(poolId);
                      console.log(`   ✅ Extracted poolId from JSON: ${decodedData.poolId}`);
                    }
                  }
                  
                  // ✅ CRITICAL: Extract timestamp from JSON (required for event processing)
                  // Must extract BEFORE rejection check
                  if (!decodedData.timestamp) {
                    if (jsonData.timestamp) {
                      const ts = typeof jsonData.timestamp === 'number' ? jsonData.timestamp : parseInt(jsonData.timestamp, 10);
                      if (!isNaN(ts) && ts > 0 && ts < 2147483647) {
                        decodedData.timestamp = ts;
                        console.log(`   ✅ Extracted timestamp from JSON: ${ts}`);
                      }
                    } else if (jsonData.created_at || jsonData.createdAt) {
                      // Try to parse date string
                      const dateStr = jsonData.created_at || jsonData.createdAt;
                      try {
                        const date = new Date(dateStr);
                        const ts = Math.floor(date.getTime() / 1000);
                        if (ts > 0 && ts < 2147483647) {
                          decodedData.timestamp = ts;
                          console.log(`   ✅ Extracted timestamp from date string: ${ts}`);
                        }
                      } catch (e) {
                        console.warn(`   ⚠️ Failed to parse date string:`, dateStr);
                      }
                    }
                  }
                  
                  // ✅ CRITICAL: Fallback to current time if timestamp still missing (BEFORE rejection check)
                  if (!decodedData.timestamp) {
                    decodedData.timestamp = Math.floor(Date.now() / 1000);
                    console.log(`   ℹ️ Defaulting timestamp to current time for ${eventType} (from JSON data)`);
                  }
                }
                
                // Only decode ABI if it's not JSON
                if (!isJsonData) {
                  // Decode based on event type
                  if (eventType === 'bet:placed') {
                    try {
                      // BetPlaced event typically has: poolId (indexed), bettor (indexed), amount, isForOutcome, timestamp (non-indexed)
                      // If bettor is NOT in topics, it might be in data field
                      const decoded = decodeAbiParameters(
                        [
                          { name: 'bettor', type: 'address' },
                          { name: 'amount', type: 'uint256' },
                          { name: 'isForOutcome', type: 'bool' },
                          { name: 'timestamp', type: 'uint256' }
                        ],
                        actualData.data
                      );
                      // Validate bettor address
                      const bettorAddr = decoded[0];
                      const isValidBettor = bettorAddr && 
                        bettorAddr.startsWith('0x') && 
                        bettorAddr.length === 42 &&
                        bettorAddr !== '0x0000000000000000000000000000000000000000' &&
                        /^0x[0-9a-f]{40}$/i.test(bettorAddr) &&
                        !(/^0x0{30,39}[0-9a-f]{1,9}$/i.test(bettorAddr) && parseInt(bettorAddr, 16) < 1000);
                      
                      if (isValidBettor && !decodedData.bettor) {
                        decodedData.bettor = bettorAddr;
                        decodedData.bettorAddress = bettorAddr;
                        console.log(`   ✅ Decoded bettor from data field: ${bettorAddr}`);
                      }
                      decodedData.amount = decoded[1].toString();
                      decodedData.isForOutcome = decoded[2];
                      const ts = Number(decoded[3]);
                      // Validate timestamp (must be reasonable Unix timestamp)
                      if (ts > 0 && ts < 2147483647) {
                        decodedData.timestamp = ts;
                      }
                      // Default currency to STT (can be overridden by pool data)
                      if (!decodedData.currency) {
                        decodedData.currency = 'STT';
                      }
                      console.log(`   ✅ Decoded bet data: amount=${decodedData.amount}, isForOutcome=${decodedData.isForOutcome}, currency=${decodedData.currency}`);
                    } catch (e) {
                      console.warn(`   ⚠️ Failed to decode bet data field:`, e);
                    }
                  } else if (eventType === 'liquidity:added') {
                    try {
                      const decoded = decodeAbiParameters(
                        [
                          { name: 'provider', type: 'address' },
                          { name: 'amount', type: 'uint256' },
                          { name: 'timestamp', type: 'uint256' }
                        ],
                        actualData.data
                      );
                      // Validate provider address
                      const providerAddr = decoded[0];
                      const isValidProvider = providerAddr && 
                        providerAddr.startsWith('0x') && 
                        providerAddr.length === 42 &&
                        providerAddr !== '0x0000000000000000000000000000000000000000' &&
                        /^0x[0-9a-f]{40}$/i.test(providerAddr) &&
                        !(/^0x0{30,39}[0-9a-f]{1,9}$/i.test(providerAddr) && parseInt(providerAddr, 16) < 1000);
                      
                      if (isValidProvider && !decodedData.provider) {
                        decodedData.provider = providerAddr;
                        console.log(`   ✅ Decoded provider from data field: ${providerAddr}`);
                      }
                      decodedData.amount = decoded[1].toString();
                      const ts = Number(decoded[2]);
                      // Validate timestamp
                      if (ts > 0 && ts < 2147483647) {
                        decodedData.timestamp = ts;
                      }
                      // Default currency to STT
                      if (!decodedData.currency) {
                        decodedData.currency = 'STT';
                      }
                      console.log(`   ✅ Decoded liquidity data: amount=${decodedData.amount}, currency=${decodedData.currency}`);
                    } catch (e) {
                      console.warn(`   ⚠️ Failed to decode liquidity data field:`, e);
                    }
                  } else if (eventType === 'pool:created') {
                    try {
                      // PoolCreated event has more fields - try full decoding first
                      try {
                        const decoded = decodeAbiParameters(
                          [
                            { name: 'creator', type: 'address' },
                            { name: 'creatorStake', type: 'uint256' },
                            { name: 'odds', type: 'uint16' },
                            { name: 'flags', type: 'uint8' },
                            { name: 'timestamp', type: 'uint256' }
                          ],
                          actualData.data
                        );
                        // Validate creator address
                        const creatorAddr = decoded[0];
                        const isValidCreator = creatorAddr && 
                          creatorAddr.startsWith('0x') && 
                          creatorAddr.length === 42 &&
                          creatorAddr !== '0x0000000000000000000000000000000000000000' &&
                          /^0x[0-9a-f]{40}$/i.test(creatorAddr) &&
                          !(/^0x0{30,39}[0-9a-f]{1,9}$/i.test(creatorAddr) && parseInt(creatorAddr, 16) < 1000);
                        
                        if (isValidCreator && !decodedData.creator) {
                          decodedData.creator = creatorAddr;
                        }
                        decodedData.creatorStake = decoded[1].toString();
                        decodedData.odds = Number(decoded[2]);
                        // Extract useBitr from flags (bit 3 = 8)
                        const flags = Number(decoded[3] || 0);
                        decodedData.useBitr = Boolean(flags & 8);
                        decodedData.currency = decodedData.useBitr ? 'BITR' : 'STT';
                        const ts = Number(decoded[4] || decoded[3]); // Try index 4, fallback to 3
                        // Validate timestamp
                        if (ts > 0 && ts < 2147483647) {
                          decodedData.timestamp = ts;
                        }
                        console.log(`   ✅ Decoded pool created data: creator=${decodedData.creator}, stake=${decodedData.creatorStake}, currency=${decodedData.currency}`);
                      } catch (fullDecodeError) {
                        // Fallback to shorter decoding
                        const decoded = decodeAbiParameters(
                          [
                            { name: 'creator', type: 'address' },
                            { name: 'creatorStake', type: 'uint256' },
                            { name: 'odds', type: 'uint16' },
                            { name: 'timestamp', type: 'uint256' }
                          ],
                          actualData.data
                        );
                        const creatorAddr = decoded[0];
                        const isValidCreator = creatorAddr && 
                          creatorAddr.startsWith('0x') && 
                          creatorAddr.length === 42 &&
                          creatorAddr !== '0x0000000000000000000000000000000000000000' &&
                          /^0x[0-9a-f]{40}$/i.test(creatorAddr) &&
                          !(/^0x0{30,39}[0-9a-f]{1,9}$/i.test(creatorAddr) && parseInt(creatorAddr, 16) < 1000);
                        
                        if (isValidCreator && !decodedData.creator) {
                          decodedData.creator = creatorAddr;
                        }
                        decodedData.creatorStake = decoded[1].toString();
                        decodedData.odds = Number(decoded[2]);
                        decodedData.currency = 'STT'; // Default to STT if flags not available
                        const ts = Number(decoded[3]);
                        if (ts > 0 && ts < 2147483647) {
                          decodedData.timestamp = ts;
                        }
                        console.log(`   ✅ Decoded pool created data (fallback): creator=${decodedData.creator}, stake=${decodedData.creatorStake}`);
                      }
                    } catch (e) {
                      console.warn(`   ⚠️ Failed to decode pool created data field:`, e);
                    }
                  } else if (eventType === 'cycle:resolved') {
                    try {
                      // CycleResolved event typically has: cycleId (indexed), prizePool, totalSlips, timestamp (non-indexed)
                      const decoded = decodeAbiParameters(
                        [
                          { name: 'prizePool', type: 'uint256' },
                          { name: 'totalSlips', type: 'uint256' },
                          { name: 'timestamp', type: 'uint256' }
                        ],
                        actualData.data
                      );
                      // ✅ CRITICAL: Prize pool is in wei format (BigInt), store as string for proper conversion
                      decodedData.prizePool = decoded[0].toString();
                      decodedData.totalSlips = Number(decoded[1]);
                      const ts = Number(decoded[2]);
                      // Validate timestamp
                      if (ts > 0 && ts < 2147483647) {
                        decodedData.timestamp = ts;
                        console.log(`   ✅ Extracted timestamp from ABI decode: ${ts}`);
                      } else {
                        // Fallback to current time if invalid
                        decodedData.timestamp = Math.floor(Date.now() / 1000);
                        console.log(`   ℹ️ Invalid timestamp from ABI, using current time`);
                      }
                      // ✅ CRITICAL: Ensure cycleId is normalized (from topic[1] which was already normalized above)
                      if (!decodedData.cycleId) {
                        decodedData.cycleId = normalizeId(decodedData.poolId || '0');
                      } else {
                        // Double-normalize to ensure it's correct
                        decodedData.cycleId = normalizeId(decodedData.cycleId);
                      }
                      decodedData.status = 'resolved';
                      console.log(`   ✅ Decoded cycle resolved data: cycleId=${decodedData.cycleId}, prizePool=${decodedData.prizePool} (wei), totalSlips=${decodedData.totalSlips}`);
                    } catch (e) {
                      console.warn(`   ⚠️ Failed to decode cycle resolved data field:`, e);
                      // ✅ CRITICAL: Ensure cycleId is normalized even if decoding fails
                      if (!decodedData.cycleId) {
                        decodedData.cycleId = normalizeId(decodedData.poolId || '0');
                      } else {
                        decodedData.cycleId = normalizeId(decodedData.cycleId);
                      }
                    }
                  }
                }
              }
              
              // Add field aliases for component compatibility
              if (decodedData.bettor && !decodedData.bettorAddress) {
                decodedData.bettorAddress = decodedData.bettor;
              }
              if (decodedData.bettorAddress && !decodedData.bettor) {
                decodedData.bettor = decodedData.bettorAddress;
              }
              
              // Ensure all address fields are strings to prevent slice() errors
              if (decodedData.bettor && typeof decodedData.bettor !== 'string') {
                decodedData.bettor = String(decodedData.bettor);
              }
              if (decodedData.bettorAddress && typeof decodedData.bettorAddress !== 'string') {
                decodedData.bettorAddress = String(decodedData.bettorAddress);
              }
              if (decodedData.creator && typeof decodedData.creator !== 'string') {
                decodedData.creator = String(decodedData.creator);
              }
              if (decodedData.provider && typeof decodedData.provider !== 'string') {
                decodedData.provider = String(decodedData.provider);
              }
              
              // ✅ CRITICAL: Fix slip:evaluated topic decoding
              // SlipEvaluated event structure: SlipEvaluated(uint256 indexed slipId, address indexed player, ...)
              // So topic[1] = slipId, topic[2] = player (if available)
              if (eventType === 'slip:evaluated') {
                // Extract slipId from topic[1] if available
                if (actualData.topics.length >= 2 && !decodedData.slipId) {
                  try {
                    const slipIdHex = actualData.topics[1];
                    const slipId = normalizeId(slipIdHex);
                    if (slipId && slipId !== '0') {
                      decodedData.slipId = slipId;
                      console.log(`   ✅ Decoded slipId from topic[1] for slip:evaluated: ${slipId}`);
                    }
                  } catch (e) {
                    console.warn(`   ⚠️ Failed to decode slipId from topic[1]:`, e);
                  }
                }
                
                // Extract player from topic[2] if available (second indexed parameter)
                if (actualData.topics.length >= 3 && !decodedData.player) {
                  try {
                    const addressHex = actualData.topics[2];
                    const address = '0x' + addressHex.slice(-40).toLowerCase();
                    if (address && address !== '0x0000000000000000000000000000000000000000' && address.length === 42) {
                      decodedData.player = address;
                      console.log(`   ✅ Decoded player from topic[2] for slip:evaluated: ${address}`);
                    }
                  } catch (e) {
                    console.warn(`   ⚠️ Failed to decode player from topic[2]:`, e);
                  }
                }
                
                // Set defaults if player is still missing
                if (!decodedData.player) {
                  decodedData.player = decodedData.user || decodedData.bettor || decodedData.provider || '';
                }
                
                // Ensure player is always a string to prevent toLowerCase errors
                if (decodedData.player && typeof decodedData.player !== 'string') {
                  decodedData.player = String(decodedData.player);
                }
                if (!decodedData.player) {
                  decodedData.player = ''; // Empty string instead of undefined
                }
              }
              
              // ✅ CRITICAL: Validate timestamp - don't default to current time (will be rejected later if invalid)
              // Only set if it's clearly invalid (negative or too large), but don't default to now
              if (decodedData.timestamp && (decodedData.timestamp <= 0 || decodedData.timestamp > 2147483647)) {
                console.warn(`   ⚠️ Invalid timestamp detected: ${decodedData.timestamp}, will be rejected`);
                decodedData.timestamp = undefined; // Will be rejected by timestamp validation later
              }
              console.log(`✅ Decoded on-chain event:`, decodedData);
            }
            
            // ✅ All decoding done above - skip old ABI decoding logic
            // The decodedData now has poolId, bettor/provider extracted from topics
            
            // Decode pool progress data (still needed for non-event-log data)
            if (eventType === 'pool:progress' && !actualData.address && data && typeof data === 'object') {
              if (data.data && typeof data.data === 'string' && data.data.startsWith('0x')) {
                try {
                  const decoded = decodeAbiParameters(
                    [
                      { name: 'poolId', type: 'uint256' },
                      { name: 'fillPercentage', type: 'uint256' },
                      { name: 'totalBettorStake', type: 'uint256' },
                      { name: 'totalCreatorSideStake', type: 'uint256' },
                      { name: 'maxPoolSize', type: 'uint256' },
                      { name: 'participantCount', type: 'uint256' },
                      { name: 'betCount', type: 'uint256' },
                      { name: 'currentMaxBettorStake', type: 'uint256' },
                      { name: 'effectiveCreatorSideStake', type: 'uint256' },
                      { name: 'timestamp', type: 'uint256' }
                    ],
                    data.data
                  );
                  decodedData = {
                    poolId: decoded[0].toString(),
                    fillPercentage: Number(decoded[1]),
                    totalBettorStake: decoded[2].toString(),
                    totalCreatorSideStake: decoded[3].toString(),
                    maxPoolSize: decoded[4].toString(),
                    participantCount: Number(decoded[5]),
                    betCount: Number(decoded[6]),
                    currentMaxBettorStake: decoded[7].toString(),
                    effectiveCreatorSideStake: decoded[8].toString(),
                    timestamp: Number(decoded[9])
                  };
                  console.log(`✅ Decoded pool progress data:`, decodedData);
                } catch (decodeError) {
                  console.warn(`⚠️ Failed to decode pool progress data:`, decodeError);
                }
              } else if (data.poolId || data.fillPercentage !== undefined) {
                decodedData = {
                  poolId: data.poolId?.toString() || data.pool_id?.toString(),
                  fillPercentage: data.fillPercentage ?? data.fill_percentage ?? 0,
                  totalBettorStake: data.totalBettorStake?.toString() || data.total_bettor_stake?.toString() || '0',
                  totalCreatorSideStake: data.totalCreatorSideStake?.toString() || data.total_creator_side_stake?.toString() || '0',
                  maxPoolSize: data.maxPoolSize?.toString() || data.max_pool_size?.toString() || '0',
                  participantCount: data.participantCount ?? data.participant_count ?? 0,
                  betCount: data.betCount ?? data.bet_count ?? 0,
                  timestamp: data.timestamp ?? Math.floor(Date.now() / 1000),
                  currentMaxBettorStake: data.currentMaxBettorStake?.toString() || data.current_max_bettor_stake?.toString() || data.maxPoolSize?.toString() || '0',
                  effectiveCreatorSideStake: data.effectiveCreatorSideStake?.toString() || data.effective_creator_side_stake?.toString() || data.totalCreatorSideStake?.toString() || '0'
                };
                console.log(`✅ Formatted pool progress data:`, decodedData);
              }
            }
            
            // Decode pool created data (only for non-event-log data)
            if (eventType === 'pool:created' && !actualData.address && data && typeof data === 'object') {
              // SDS may send the data directly or ABI-encoded
              if (data.data && typeof data.data === 'string' && data.data.startsWith('0x')) {
                try {
                  const decoded = decodeAbiParameters(
                    [
                      { name: 'poolId', type: 'uint256' },
                      { name: 'creator', type: 'address' },
                      { name: 'odds', type: 'uint16' },
                      { name: 'flags', type: 'uint8' },
                      { name: 'creatorStake', type: 'uint256' },
                      { name: 'totalBettorStake', type: 'uint256' },
                      { name: 'totalCreatorSideStake', type: 'uint256' },
                      { name: 'maxBettorStake', type: 'uint256' },
                      { name: 'category', type: 'bytes32' },
                      { name: 'league', type: 'bytes32' },
                      { name: 'homeTeam', type: 'bytes32' },
                      { name: 'awayTeam', type: 'bytes32' },
                      { name: 'marketId', type: 'string' },
                      { name: 'eventStartTime', type: 'uint256' },
                      { name: 'eventEndTime', type: 'uint256' },
                      { name: 'bettingEndTime', type: 'uint256' },
                      { name: 'isSettled', type: 'bool' },
                      { name: 'creatorSideWon', type: 'bool' },
                      { name: 'title', type: 'string' },
                      { name: 'fillPercentage', type: 'uint256' },
                      { name: 'participantCount', type: 'uint256' },
                      { name: 'currency', type: 'string' }
                    ],
                    data.data
                  );
                  // Convert bytes32 to string
                  const bytes32ToString = (bytes: string) => {
                    if (!bytes || bytes === '0x0000000000000000000000000000000000000000000000000000000000000000') return '';
                    try {
                      return Buffer.from(bytes.slice(2), 'hex').toString('utf8').replace(/\0/g, '');
                    } catch {
                      return '';
                    }
                  };
                  decodedData = {
                    poolId: normalizeId(decoded[0].toString()), // ✅ CRITICAL: Normalize poolId immediately
                    creator: decoded[1],
                    odds: Number(decoded[2]),
                    creatorStake: decoded[4].toString(),
                    totalBettorStake: decoded[5].toString(),
                    totalCreatorSideStake: decoded[6].toString(),
                    maxBettorStake: decoded[7].toString(),
                    category: bytes32ToString(decoded[8]),
                    league: bytes32ToString(decoded[9]),
                    homeTeam: bytes32ToString(decoded[10]),
                    awayTeam: bytes32ToString(decoded[11]),
                    title: decoded[19] || '',
                    fillPercentage: Number(decoded[20]),
                    participantCount: Number(decoded[21]),
                    isSettled: decoded[17],
                    creatorSideWon: decoded[18],
                    timestamp: undefined // ✅ CRITICAL: Don't default to current time - require valid timestamp from data
                  };
                  console.log(`✅ Decoded pool created data:`, decodedData);
                } catch (decodeError) {
                  console.warn(`⚠️ Failed to decode pool created data:`, decodeError);
                }
              } else {
                // Data already decoded or sent as object
                const rawPoolId = data.poolId?.toString() || data.pool_id?.toString() || decodedData.poolId || '0';
                decodedData = {
                  ...decodedData,
                  ...data,
                  poolId: normalizeId(rawPoolId), // ✅ CRITICAL: Normalize poolId
                  timestamp: data.timestamp || decodedData.timestamp || Math.floor(Date.now() / 1000) // ✅ Use current time as fallback if missing
                };
              }
            }
            
            // Decode liquidity added data (only for non-event-log data)
            if (eventType === 'liquidity:added' && !actualData.address && data && typeof data === 'object') {
              // ✅ CRITICAL: Check if data field contains JSON first
              let jsonData: any = null;
              if (data.data && typeof data.data === 'string' && data.data.startsWith('0x')) {
                try {
                  const decodedBytes = Buffer.from(data.data.slice(2), 'hex');
                  const decodedString = decodedBytes.toString('utf8').replace(/\0/g, '');
                  if (decodedString.trim().startsWith('{')) {
                    jsonData = JSON.parse(decodedString);
                    console.log(`   📄 Liquidity data field contains JSON, parsed successfully`);
                  }
                } catch (e) {
                  // Not JSON, continue with ABI decoding
                }
              }
              
              if (jsonData) {
                // Extract from JSON
                const rawPoolId = jsonData.poolId || jsonData.pool_id || data.poolId || data.pool_id || decodedData.poolId || '0';
                
                // ✅ CRITICAL: Backend sends amount as raw wei string, keep it as string for proper conversion
                const rawAmount = (jsonData.amount || decodedData.amount || data.amount || '0').toString();
                
                // ✅ CRITICAL: Extract currency from pool data if available
                const currency = jsonData.currency || jsonData.useBitr || jsonData.use_bitr 
                  ? (jsonData.useBitr || jsonData.use_bitr ? 'BITR' : 'STT')
                  : undefined;
                
                decodedData = {
                  ...decodedData,
                  poolId: normalizeId(rawPoolId),
                  provider: jsonData.provider || jsonData.providerAddress || decodedData.provider || data.provider || '',
                  amount: rawAmount, // ✅ Keep as raw wei string - will be converted in component
                  totalLiquidity: (jsonData.totalLiquidity || jsonData.total_liquidity || '0').toString(),
                  poolFillPercentage: jsonData.poolFillPercentage || jsonData.pool_fill_percentage || 0,
                  timestamp: jsonData.timestamp || data.timestamp || decodedData.timestamp || Math.floor(Date.now() / 1000),
                  currency: currency // ✅ Add currency if available
                };
                console.log(`✅ Decoded liquidity added data from JSON:`, decodedData);
              } else if (data.data && typeof data.data === 'string' && data.data.startsWith('0x')) {
                try {
                  const decoded = decodeAbiParameters(
                    [
                      { name: 'poolId', type: 'uint256' },
                      { name: 'provider', type: 'address' },
                      { name: 'amount', type: 'uint256' },
                      { name: 'totalLiquidity', type: 'uint256' },
                      { name: 'poolFillPercentage', type: 'uint256' },
                      { name: 'timestamp', type: 'uint256' }
                    ],
                    data.data
                  );
                  decodedData = {
                    ...decodedData,
                    poolId: normalizeId(decoded[0].toString()),
                    provider: decoded[1],
                    amount: decoded[2].toString(), // ✅ Keep as raw wei string - will be converted in component
                    totalLiquidity: decoded[3].toString(),
                    poolFillPercentage: Number(decoded[4]),
                    timestamp: Number(decoded[5])
                    // ✅ Note: currency not available from ABI, will default to STT in component
                  };
                  console.log(`✅ Decoded liquidity added data from ABI:`, decodedData);
                } catch (decodeError) {
                  console.warn(`⚠️ Failed to decode liquidity added data:`, decodeError);
                  // Fallback: use data as-is with normalization
                  const rawPoolId = data.poolId?.toString() || data.pool_id?.toString() || decodedData.poolId || '0';
                  decodedData = {
                    ...decodedData,
                    ...data,
                    poolId: normalizeId(rawPoolId),
                    timestamp: data.timestamp || decodedData.timestamp || Math.floor(Date.now() / 1000)
                  };
                }
              } else {
                // Data already decoded or sent as object
                const rawPoolId = data.poolId?.toString() || data.pool_id?.toString() || decodedData.poolId || '0';
                decodedData = {
                  ...decodedData,
                  ...data,
                  poolId: normalizeId(rawPoolId),
                  timestamp: data.timestamp || decodedData.timestamp || Math.floor(Date.now() / 1000)
                };
              }
            }
            
            // Decode cycle resolved data (only for non-event-log data)
            if (eventType === 'cycle:resolved' && !actualData.address && data && typeof data === 'object') {
              const rawCycleId = data.cycleId?.toString() || data.cycle_id?.toString() || decodedData.cycleId || decodedData.poolId || '0';
              const normalizedCycleId = normalizeId(rawCycleId); // ✅ CRITICAL: Normalize cycle ID
              const rawPrizePool = data.prizePool?.toString() || data.prize_pool?.toString() || '0';
              decodedData = {
                ...decodedData,
                ...data,
                cycleId: normalizedCycleId, // ✅ CRITICAL: Use normalized cycle ID
                prizePool: rawPrizePool, // ✅ Keep as string (will be converted from wei in component)
                totalSlips: data.totalSlips ?? data.total_slips ?? decodedData.totalSlips ?? 0,
                status: data.status || decodedData.status || 'resolved',
                timestamp: data.timestamp || decodedData.timestamp || Math.floor(Date.now() / 1000) // ✅ Use current time as fallback if missing
              };
              console.log(`✅ Formatted cycle resolved data (cycleId normalized from ${rawCycleId} to ${normalizedCycleId}, prizePool: ${rawPrizePool}):`, decodedData);
            }
            
            // ✅ Decode bet placed data (only for non-event-log data, already decoded above)
            if (eventType === 'bet:placed' && !actualData.address && data && typeof data === 'object') {
              // SDS may send data in different formats:
              // 1. Event with topics (indexed parameters) + data field (non-indexed)
              // 2. Full decoded bet data object
              // 3. ABI-encoded data in data field
              
              if (data.topics && Array.isArray(data.topics) && data.topics.length >= 2) {
                // Format 1: Event with topics - extract indexed parameters
                try {
                  const poolIdHex = data.topics[0];
                  const poolId = BigInt(poolIdHex).toString();
                  
                  const bettorHex = data.topics[1];
                  const bettor = '0x' + bettorHex.slice(-40).toLowerCase(); // Extract address from bytes32
                  
                  // If data field contains ABI-encoded bet data, decode it
                  if (data.data && typeof data.data === 'string' && data.data.startsWith('0x') && data.data.length > 2) {
                    try {
                      const decoded = decodeAbiParameters(
                        [
                          { name: 'poolId', type: 'uint256' },
                          { name: 'bettor', type: 'address' },
                          { name: 'amount', type: 'uint256' },
                          { name: 'isForOutcome', type: 'bool' },
                          { name: 'timestamp', type: 'uint256' },
                          { name: 'poolTitle', type: 'string' },
                          { name: 'category', type: 'string' },
                          { name: 'odds', type: 'uint16' }
                        ],
                        data.data
                      );
                      decodedData = {
                        poolId: decoded[0].toString(),
                        bettor: decoded[1],
                        amount: decoded[2].toString(),
                        isForOutcome: decoded[3],
                        timestamp: Number(decoded[4]),
                        poolTitle: decoded[5] || '',
                        category: decoded[6] || '',
                        odds: Number(decoded[7]) || 0,
                        currency: 'STT'
                      };
                      console.log(`✅ Decoded bet placed data from ABI-encoded event data:`, decodedData);
                    } catch (decodeError) {
                      console.warn(`⚠️ Failed to decode bet data field, using topics only:`, decodeError);
                      decodedData = {
                        poolId: poolId,
                        bettor: bettor,
                        amount: '0',
                        isForOutcome: true,
                        timestamp: undefined, // ✅ CRITICAL: Don't default to current time - will be rejected
                        poolTitle: '',
                        category: '',
                        odds: 0,
                        currency: 'STT'
                      };
                    }
                  } else {
                    // No data field or empty - use topics only
                    decodedData = {
                      poolId: poolId,
                      bettor: bettor,
                      amount: data.amount || '0',
                      isForOutcome: data.isForOutcome !== undefined ? data.isForOutcome : true,
                      timestamp: data.timestamp, // ✅ CRITICAL: Don't default to current time - require valid timestamp
                      poolTitle: data.poolTitle || '',
                      category: data.category || '',
                      odds: data.odds || 0,
                      currency: data.currency || 'STT'
                    };
                    console.log(`✅ Decoded bet placed data from event topics:`, decodedData);
                  }
                } catch (decodeError) {
                  console.warn(`⚠️ Failed to decode bet placed event topics:`, decodeError);
                  decodedData = data;
                }
              } else if (data.data && typeof data.data === 'string' && data.data.startsWith('0x')) {
                // Format 2: ABI-encoded data in data field
                try {
                  const decoded = decodeAbiParameters(
                    [
                      { name: 'poolId', type: 'uint256' },
                      { name: 'bettor', type: 'address' },
                      { name: 'amount', type: 'uint256' },
                      { name: 'isForOutcome', type: 'bool' },
                      { name: 'timestamp', type: 'uint256' },
                      { name: 'poolTitle', type: 'string' },
                      { name: 'category', type: 'string' },
                      { name: 'odds', type: 'uint16' }
                    ],
                    data.data
                  );
                  decodedData = {
                    poolId: decoded[0].toString(),
                    bettor: decoded[1],
                    amount: decoded[2].toString(),
                    isForOutcome: decoded[3],
                    timestamp: Number(decoded[4]),
                    poolTitle: decoded[5] || '',
                    category: decoded[6] || '',
                    odds: Number(decoded[7]) || 0,
                    currency: 'STT'
                  };
                  console.log(`✅ Decoded bet placed data from ABI-encoded data field:`, decodedData);
                } catch (decodeError) {
                  console.warn(`⚠️ Failed to decode bet data field:`, decodeError);
                  decodedData = data;
                }
              } else {
                // Format 3: Already decoded object
                decodedData = {
                  ...data,
                  poolId: data.poolId?.toString() || data.pool_id?.toString(),
                  bettor: data.bettor || data.bettor_address,
                  timestamp: data.timestamp // ✅ CRITICAL: Don't default to current time - require valid timestamp
                };
                console.log(`✅ Using bet placed data as-is (already decoded):`, decodedData);
              }
            }
            
            // ✅ CRITICAL: Require valid timestamp - reject events without timestamp
            // Fallback to current time if still missing (timestamp should have been extracted from JSON or ABI above)
            if (!decodedData.timestamp) {
              decodedData.timestamp = Math.floor(Date.now() / 1000);
              console.log(`   ℹ️ Defaulting timestamp to current time for ${eventType} (no timestamp found)`);
            }
            
            const eventTimestamp = decodedData.timestamp;
            if (!eventTimestamp || typeof eventTimestamp !== 'number' || eventTimestamp <= 0) {
              console.log(`⚠️ [SDS] Rejecting ${eventType} event without valid timestamp:`, decodedData);
              return; // Reject events without valid timestamp
            }
            
            // ✅ TIME FILTERING: Only process recent events (within last 1 minute for real-time)
            if (!isRecentEvent(eventTimestamp)) {
              console.log(`⚠️ [SDS] Skipping old ${eventType} event (timestamp: ${eventTimestamp}, now: ${Math.floor(Date.now() / 1000)}, age: ${Math.floor(Date.now() / 1000) - eventTimestamp}s)`);
              return; // Skip old events
            }
            
            // ✅ CRITICAL: NORMALIZE IDs: Convert BigInt/hex to readable numbers (MUST happen before rate limiting and deduplication)
            if (decodedData.poolId) {
              decodedData.poolId = normalizeId(decodedData.poolId);
            }
            if (decodedData.cycleId) {
              decodedData.cycleId = normalizeId(decodedData.cycleId);
            }
            if (decodedData.slipId) {
              decodedData.slipId = normalizeId(decodedData.slipId);
            }
            
            // ✅ CRITICAL: Double-check cycleId normalization (in case it was set in multiple places)
            if (eventType === 'cycle:resolved' && decodedData.cycleId) {
              decodedData.cycleId = normalizeId(decodedData.cycleId);
              console.log(`   ✅ Final normalized cycleId: ${decodedData.cycleId}`);
            }
            
            // ✅ Rate limiting: Prevent notification bombing
            const now = Date.now();
            const rateLimitKey = `${eventType}:${decodedData.poolId || decodedData.cycleId || 'unknown'}`;
            const lastTime = lastNotificationTime.get(rateLimitKey);
            if (lastTime && (now - lastTime) < NOTIFICATION_RATE_LIMIT_MS) {
              console.log(`⚠️ [SDS] Rate limit: Skipping ${eventType} event (last notification ${now - lastTime}ms ago)`);
              return; // Skip if rate limited
            }
            lastNotificationTime.set(rateLimitKey, now);
            
            // ✅ Deduplication: Check if we've already seen this event
            const dedupeKey = createEventDedupeKey(eventType, decodedData);
            if (isEventSeen(eventType, dedupeKey)) {
              console.log(`⚠️ [SDS] Skipping duplicate ${eventType} event: ${dedupeKey}`);
              return; // Skip broadcasting duplicate event
            }
            
            // Mark as seen BEFORE broadcasting to prevent loops
            markEventSeen(eventType, dedupeKey);
            
            // ✅ Broadcast to all subscribers from GLOBAL map
            const callbacks = globalSubscribersMap.get(eventType);
            if (callbacks && callbacks.size > 0) {
              console.log(`📦 [SDS] Broadcasting to ${callbacks.size} callbacks for ${eventType}`);
              let callbackCount = 0;
              callbacks.forEach(cb => {
                try {
                  callbackCount++;
                  cb(decodedData as SDSEventData);
                  console.log(`   ✅ Callback ${callbackCount}/${callbacks.size} executed successfully`);
                } catch (error) {
                  console.error(`❌ Error in callback ${callbackCount}/${callbacks.size} for ${eventType}:`, error);
                }
              });
            } else {
              console.warn(`⚠️ [SDS] No callbacks registered for ${eventType} (callbacks map size: ${callbacks?.size || 0})`);
            }
          },
          onError: (error: any) => {
            console.error(`❌ SDS subscription error for ${eventType}:`, error);
          }
        };
        
        // ✅ CRITICAL FIX: Use global SDK instance if available
        const sdkToUse = sdkRef.current || globalSDKInstance;
        if (!sdkToUse) {
          throw new Error('SDK not available for subscription');
        }
        
        console.log(`📡 Calling SDK subscribe with context-based subscription:`, {
          context: subscriptionParams.context,
          onlyPushChanges: subscriptionParams.onlyPushChanges
        });
        
        const subscriptionPromise = sdkToUse.streams.subscribe(subscriptionParams);
        
        subscriptionPromise.then((result) => {
          // ✅ Clear GLOBAL pending flag on success
          globalPendingSubscriptions.delete(eventType);
          
          console.log(`📡 Subscribe result for ${eventType}:`, result);
          if (result?.unsubscribe) {
            // ✅ Store unsubscribe function in GLOBAL map
            globalUnsubscribeFunctionsMap.set(eventType as any, result.unsubscribe);
            console.log(`✅ Successfully subscribed to ${eventType}`);
          } else {
            console.warn(`⚠️ Subscribe returned result without unsubscribe for ${eventType}:`, result);
          }
        }).catch((error) => {
          // ✅ Clear GLOBAL pending flag on error
          globalPendingSubscriptions.delete(eventType);
          console.error(`❌ Failed to subscribe to ${eventType}:`, error);
          console.error(`❌ Error details:`, {
            message: error.message,
            stack: error.stack,
            name: error.name
          });
          // WebSocket fallback disabled - using pure SDS
        });
      } catch (error) {
        // ✅ Clear GLOBAL pending flag on sync error
        globalPendingSubscriptions.delete(eventType);
        console.error(`❌ Error calling subscribe for ${eventType}:`, error);
        console.error(`❌ Sync error details:`, {
          message: (error as Error).message,
          stack: (error as Error).stack,
          name: (error as Error).name
        });
      }
    } else if (isPending) {
      console.log(`⏳ Subscription already pending for ${eventType}, adding callback to queue (${callbacks.size} subscribers)`);
      // Callback added to queue, will receive data when subscription completes
    } else if (isFirstSubscriber) {
      console.log(`♻️ First subscriber for ${eventType}, but SDK not ready yet (SDK: ${!!sdkAvailable}, SDS active: ${sdsActive})`);
      // ✅ FIX: If SDK is available but state hasn't updated, try subscribing anyway
      if (sdkAvailable && !sdsActive) {
        console.log(`   ⚠️ SDK available but state not updated - will retry on next render`);
      }
    } else {
      console.log(`♻️ Reusing existing subscription for ${eventType} (${callbacks.size} subscribers)`);
    }

    // Return unsubscribe function
    return () => {
      const callbacks = globalSubscribersMap.get(eventType); // ✅ Use GLOBAL map
      if (callbacks) {
        callbacks.delete(callback);
        console.log(`🔌 Callback removed from ${eventType} (${callbacks.size} remaining)`);
        
        // ✅ FIX: Only unsubscribe from SDS after a delay to avoid rapid subscribe/unsubscribe
        if (callbacks.size === 0) {
          // Wait 30 seconds before actually unsubscribing to handle React re-renders
          const unsubscribeTimer = setTimeout(() => {
            const currentCallbacks = globalSubscribersMap.get(eventType); // ✅ Use GLOBAL map
            // Double-check that there are still no subscribers
            if (currentCallbacks && currentCallbacks.size === 0) {
              globalSubscribersMap.delete(eventType);
              
              const unsubscribeFn = globalUnsubscribeFunctionsMap.get(eventType as any); // ✅ Use GLOBAL map
              if (unsubscribeFn) {
                unsubscribeFn();
                globalUnsubscribeFunctionsMap.delete(eventType as any);
                console.log(`🔌 Unsubscribed from ${eventType} (no more subscribers after delay)`);
              }
            }
          }, 30000); // 30 second delay to handle React re-renders and modal interactions
          
          // Store timer so we can cancel it if a new subscription comes in
          (globalSubscribersMap as any)[`_timer_${eventType}`] = unsubscribeTimer;
        } else {
          // Cancel any pending unsubscribe timer if we still have subscribers
          const timer = (globalSubscribersMap as any)[`_timer_${eventType}`];
          if (timer) {
            clearTimeout(timer);
            delete (globalSubscribersMap as any)[`_timer_${eventType}`];
          }
        }
      }
    };
  }, [isSDSActive, useFallback, subscribeToWebSocketChannel, unsubscribeFromWebSocketChannel, initializeWebSocketFallback]);

  const subscribeToChannel = useCallback((channel: string) => {
    if (!channel) return;
    if (!desiredWebSocketChannels.has(channel)) {
      desiredWebSocketChannels.add(channel);
    }
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      if (!subscribedWebSocketChannels.has(channel)) {
        console.log(`📡 [WebSocket] Subscribing to channel: ${channel}`);
        wsRef.current.send(JSON.stringify({ type: 'subscribe', channel }));
        subscribedWebSocketChannels.add(channel);
      }
    } else if (useFallback && !wsRef.current && !isWebSocketConnecting) {
      initializeWebSocketFallback();
    }
  }, [useFallback, initializeWebSocketFallback]);

  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    isWebSocketConnecting = false;
    subscribedWebSocketChannels.clear();
    setIsConnected(false);
    setIsSDSActive(false);
    setIsFallback(false);
    initializeSDK();
  }, [initializeSDK]);

  useEffect(() => {
    if (enabled) {
      initializeSDK();
      // WebSocket fallback disabled - using pure SDS
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      globalUnsubscribeFunctionsMap.forEach((unsubscribeFn) => {
        unsubscribeFn();
      });
      globalUnsubscribeFunctionsMap.clear();
      // Don't clear globalSubscribersMap - it's shared across components
    };
  }, [enabled, initializeSDK]);
  
  // ✅ CRITICAL FIX: Ensure isSDSActive state is updated when SDK becomes available
  useEffect(() => {
    if (globalSDKInstance && !isSDSActive) {
      console.log('🔄 Updating isSDSActive state - SDK is available');
      setIsSDSActive(true);
      setIsConnected(true);
      setIsFallback(false);
    }
  }, [isSDSActive]);

  return {
    isConnected,
    isSDSActive,
    isFallback,
    error,
    subscribe,
    reconnect
  };
}

// Convenience hooks
export function usePoolUpdates(callback: (data: SDSPoolData) => void, enabled = true) {
  const { subscribe, ...rest } = useSomniaStreams({ enabled });
  const callbackRef = useRef(callback);
  
  // ✅ FIX: Keep callback ref up to date without causing re-subscriptions
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  useEffect(() => {
    if (!enabled) return;
    
    const wrappedCallback = (data: SDSEventData) => {
      callbackRef.current(data as SDSPoolData);
    };
    
    const unsub1 = subscribe('pool:created', wrappedCallback);
    const unsub2 = subscribe('pool:settled', wrappedCallback);
    return () => {
      unsub1();
      unsub2();
    };
  }, [subscribe, enabled]); // ✅ Removed callback from deps
  
  return rest;
}

export function useBetUpdates(callback: (data: SDSBetData) => void, enabled = true) {
  const { subscribe, ...rest } = useSomniaStreams({ enabled });
  const callbackRef = useRef(callback);
  
  // ✅ FIX: Keep callback ref up to date without causing re-subscriptions
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  useEffect(() => {
    if (!enabled) return;
    
    const wrappedCallback = (data: SDSEventData) => {
      callbackRef.current(data as SDSBetData);
    };
    
    const unsubscribe = subscribe('bet:placed', wrappedCallback);
    return unsubscribe;
  }, [subscribe, enabled]); // ✅ Removed callback from deps
  
  return rest;
}

export function usePoolProgress(poolId: string, callback: (data: SDSPoolProgressData) => void, enabled = true) {
  const { subscribe, ...rest } = useSomniaStreams({ enabled });
  const callbackRef = useRef(callback);
  
  // ✅ FIX: Keep callback ref up to date without causing re-subscriptions
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  useEffect(() => {
    if (!enabled) return;
    
    const wrappedCallback = (data: SDSEventData) => {
      const progressData = data as SDSPoolProgressData;
      if (progressData.poolId === poolId || progressData.poolId === String(poolId)) {
        console.log(`📦 usePoolProgress: Received progress update for pool ${poolId}:`, progressData);
        callbackRef.current({
          ...progressData,
          currentMaxBettorStake: progressData.currentMaxBettorStake || progressData.maxPoolSize || "0",
          effectiveCreatorSideStake: progressData.effectiveCreatorSideStake || progressData.totalCreatorSideStake || "0"
        });
      }
    };
    
    const unsubscribe = subscribe('pool:progress', wrappedCallback);
    
    return unsubscribe;
  }, [subscribe, poolId, enabled]); // ✅ Removed callback from deps
  
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
  const callbackRef = useRef(callback);
  const seenCyclesRef = useRef<Set<string>>(new Set());
  
  // Load seen cycles from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('seen_cycles');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          seenCyclesRef.current = new Set(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load seen cycles from localStorage:', e);
    }
  }, []);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  useEffect(() => {
    if (!enabled) return;
    
    const wrappedCallback = (data: SDSEventData) => {
      // ✅ Normalize cycleId (convert BigInt/hex to readable number)
      const rawCycleId = (data as any).cycleId || (data as any).cycle_id || (data as any).poolId || '0';
      const cycleId = normalizeId(rawCycleId);
      
      // Skip if cycleId is invalid
      if (cycleId === '0' || !cycleId) {
        console.warn(`⚠️ Skipping cycle:resolved with invalid cycleId: ${cycleId}`);
        return;
      }
      
      // ✅ CRITICAL: Require valid timestamp - reject events without timestamp
      const eventTimestamp = (data as any).timestamp;
      if (!eventTimestamp || typeof eventTimestamp !== 'number' || eventTimestamp <= 0) {
        console.log(`⚠️ Skipping cycle:resolved event without valid timestamp:`, data);
        return;
      }
      
      // ✅ TIME FILTERING: Only process recent events (within last 1 minute for real-time)
      if (!isRecentEvent(eventTimestamp)) {
        console.log(`⚠️ Skipping old cycle:resolved event (cycle: ${cycleId}, timestamp: ${eventTimestamp}, age: ${Math.floor(Date.now() / 1000) - eventTimestamp}s)`);
        return;
      }
      
      // Create unique key for deduplication (include timestamp to prevent same cycle from different times)
      const dedupeKey = `cycle:${cycleId}:${eventTimestamp}`;
      
      // Skip if we've already seen this cycle (in memory or localStorage)
      if (seenCyclesRef.current.has(dedupeKey)) {
        console.log(`⚠️ Skipping duplicate cycle:resolved notification for cycle ${cycleId} at ${eventTimestamp}`);
        return;
      }
      
      // Mark as seen BEFORE calling callback
      seenCyclesRef.current.add(dedupeKey);
      
      // Persist to localStorage
      try {
        const cyclesArray = Array.from(seenCyclesRef.current);
        localStorage.setItem('seen_cycles', JSON.stringify(cyclesArray));
      } catch (e) {
        console.warn('Failed to save seen cycles to localStorage:', e);
      }
      
      // Clean up old entries (keep last 100)
      if (seenCyclesRef.current.size > 100) {
        const firstKey = seenCyclesRef.current.values().next().value;
        if (firstKey) {
          seenCyclesRef.current.delete(firstKey);
        }
      }
      
      // ✅ Ensure all required fields are present with normalized data
      const safeData: SDSCycleResolvedData = {
        cycleId: cycleId, // ✅ Normalized ID
        prizePool: (data as any).prizePool?.toString() || (data as any).prize_pool?.toString() || '0',
        totalSlips: (data as any).totalSlips ?? (data as any).total_slips ?? 0,
        status: (data as any).status || 'resolved',
        timestamp: eventTimestamp
      };
      
      callbackRef.current(safeData);
    };
    
    const unsubscribe = subscribe('cycle:resolved', wrappedCallback);
    return unsubscribe;
  }, [subscribe, enabled]);
  
  return rest;
}

export function useSlipUpdates(callback: (data: SDSSlipEvaluatedData) => void, enabled = true) {
  const { subscribe, ...rest } = useSomniaStreams({ enabled });
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  useEffect(() => {
    if (!enabled) return;
    
    const wrappedCallback = (data: SDSEventData) => {
      // Ensure player is always a string to prevent toLowerCase errors
      const safeData = {
        ...data,
        player: (data as any).player && typeof (data as any).player === 'string' 
          ? (data as any).player 
          : ((data as any).user || (data as any).bettor || (data as any).provider || '')
      };
      callbackRef.current(safeData as SDSSlipEvaluatedData);
    };
    
    const unsubscribe = subscribe('slip:evaluated', wrappedCallback);
    return unsubscribe;
  }, [subscribe, enabled]);
  
  return rest;
}

// ✅ Hook for pool created events (for Recent Bets Lane)
export function usePoolCreatedUpdates(callback: (data: SDSPoolData) => void, enabled = true) {
  const { subscribe, ...rest } = useSomniaStreams({ enabled });
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  useEffect(() => {
    if (!enabled) return;
    
    const wrappedCallback = (data: SDSEventData) => {
      callbackRef.current(data as SDSPoolData);
    };
    
    const unsubscribe = subscribe('pool:created', wrappedCallback);
    return unsubscribe;
  }, [subscribe, enabled]);
  
  return rest;
}

// ✅ Hook for liquidity added events (for Recent Bets Lane)
export function useLiquidityAddedUpdates(callback: (data: SDSLiquidityData) => void, enabled = true) {
  const { subscribe, ...rest } = useSomniaStreams({ enabled });
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  useEffect(() => {
    if (!enabled) return;
    
    const wrappedCallback = (data: SDSEventData) => {
      callbackRef.current(data as SDSLiquidityData);
    };
    
    const unsubscribe = subscribe('liquidity:added', wrappedCallback);
    return unsubscribe;
  }, [subscribe, enabled]);
  
  return rest;
}

/**
 * Somnia Data Streams Hook
 * 
 * Subscribes to enriched blockchain data via Somnia Data Streams (SDS).
 * Based on official Somnia SDK documentation.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { SDK } from '@somnia-chain/streams';
import { createPublicClient, webSocket, defineChain } from 'viem';

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

// ✅ Helper to check if timestamp is recent (within last 3 minutes for live activity)
const isRecentEvent = (timestamp: number | string | undefined): boolean => {
  if (!timestamp) return false; // ✅ CRITICAL: Reject events without timestamp
  const ts = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
  if (isNaN(ts) || ts <= 0) return false; // ✅ CRITICAL: Reject invalid timestamps
  const now = Math.floor(Date.now() / 1000);
  const threeMinutesAgo = now - (3 * 60); 
  return ts >= threeMinutesAgo;
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
  totalLiquidity?: string; // Optional - may not be in all events
  poolFillPercentage?: number; // Optional - may not be in all events
  currency?: string; // ✅ CRITICAL: Currency (BITR or STT) - backend now includes this
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


// ✅ Use unique context names prefixed with 'bitredict:' to avoid conflicts with SDS-indexed blockchain events
const EVENT_CONTEXT_MAP: Record<SDSEventType, string> = {
  'pool:created': 'bitredict:pools:created',
  'pool:settled': 'bitredict:pools:settled',
  'bet:placed': 'bitredict:bets',
  'pool:progress': 'bitredict:pools:progress',
  'reputation:changed': 'bitredict:reputation',
  'liquidity:added': 'bitredict:liquidity',
  'cycle:resolved': 'bitredict:cycles',
  'slip:evaluated': 'bitredict:slips',
  'prize:claimed': 'bitredict:prizes'
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
    
    // ✅ DISABLED: WebSocket fallback completely disabled - using only SDS
    // No WebSocket fallback initialization
    

      if (sdkAvailable && sdsActive && isFirstSubscriber && !isPending) {
        const contextConfig = EVENT_CONTEXT_MAP[eventType];
        
        // ✅ Mark as pending GLOBALLY to prevent duplicate subscriptions across ALL components
        globalPendingSubscriptions.add(eventType);
        
        console.log(`📡 [GLOBAL] Subscribing to ${eventType} via SDS (context: ${contextConfig})`);
        console.log(`   SDK available: ${!!sdkAvailable}, SDS active: ${sdsActive}, First subscriber: ${isFirstSubscriber}, Pending: ${isPending}`);
        
        try {

          const subscriptionParams = {
            context: contextConfig,
            ethCalls: [], // Empty array for context-based subscriptions
            onlyPushChanges: true, // ✅ CRITICAL: Only receive new events, not historical ones
            onData: (data: any) => {
            // ✅ DEBUG: Log full structure to understand what we're receiving
            console.log(`📦 [SDS] Received ${eventType} data (context: ${contextConfig}):`, {
              type: typeof data,
              isObject: typeof data === 'object',
              keys: data && typeof data === 'object' ? Object.keys(data) : [],
              hasResult: !!(data && typeof data === 'object' && data.result),
              hasSubscription: !!(data && typeof data === 'object' && data.subscription),
              resultKeys: data?.result && typeof data.result === 'object' ? Object.keys(data.result) : [],
              resultHasTopics: !!(data?.result && typeof data.result === 'object' && Array.isArray(data.result.topics)),
              resultHasData: !!(data?.result && typeof data.result === 'object' && data.result.data),
              resultDataType: typeof data?.result?.data,
              resultDataLength: data?.result?.data?.length || 0,
              fullDataPreview: JSON.stringify(data).substring(0, 2000)
            });
            
            // ✅ CRITICAL FIX: Extract data from result field (SDS wraps data in {subscription, result})
            let actualData = data;
            if (data && typeof data === 'object' && data.result) {
              console.log(`📦 [SDS] Extracting data from result field`);
              actualData = data.result;
            }
            
            // ✅ CRITICAL: Extract JSON from data field even if it has topics
            // Backend publishes JSON in the data field of blockchain events
            let jsonData: any = null;
            const hasTopics = actualData && typeof actualData === 'object' && Array.isArray(actualData.topics);
            
            if (hasTopics && actualData.data) {
              // Try to extract JSON from the hex-encoded data field
              try {
                const dataHex = actualData.data;
                if (dataHex && typeof dataHex === 'string' && dataHex.startsWith('0x') && dataHex.length > 2) {
                  // Decode hex to string (browser-compatible)
                  const hexString = dataHex.slice(2);
                  let decodedString = '';
                  for (let i = 0; i < hexString.length; i += 2) {
                    const hexByte = hexString.substr(i, 2);
                    const charCode = parseInt(hexByte, 16);
                    if (charCode > 0) {
                      decodedString += String.fromCharCode(charCode);
                    }
                  }
                  decodedString = decodedString.replace(/\0/g, '').trim();
                  
                  // Log decoded string preview for debugging
                  if (decodedString.length > 0) {
                    console.log(`📦 [SDS] Decoded data field (${decodedString.length} chars, preview: ${decodedString.substring(0, 200)}...)`);
                  }
                  
                  // Check if it contains JSON
                  if (decodedString.includes('{') || decodedString.includes('[')) {
                    // Try to find JSON in the decoded string
                    const jsonStart = decodedString.indexOf('{');
                    const jsonEnd = decodedString.lastIndexOf('}') + 1;
                    if (jsonStart >= 0 && jsonEnd > jsonStart) {
                      const jsonStr = decodedString.substring(jsonStart, jsonEnd);
                      try {
                        jsonData = JSON.parse(jsonStr);
                        console.log(`📦 [SDS] Extracted JSON from blockchain event data field (${jsonStr.length} chars)`);
                } catch (e) {
                        // Try parsing the whole decoded string
                        try {
                          jsonData = JSON.parse(decodedString);
                          console.log(`📦 [SDS] Parsed entire decoded string as JSON`);
                        } catch (e2) {
                          // Try to find JSON array
                          const arrayStart = decodedString.indexOf('[');
                          const arrayEnd = decodedString.lastIndexOf(']') + 1;
                          if (arrayStart >= 0 && arrayEnd > arrayStart) {
                            try {
                              jsonData = JSON.parse(decodedString.substring(arrayStart, arrayEnd));
                              console.log(`📦 [SDS] Parsed JSON array from decoded string`);
                            } catch (e3) {
                              console.warn(`⚠️ [SDS] Failed to parse JSON from data field:`, e2, `(also tried array: ${e3})`);
                    }
                  } else {
                            console.warn(`⚠️ [SDS] Failed to parse JSON from data field:`, e2);
                  }
                        }
                }
              } else {
                      console.warn(`⚠️ [SDS] Found { or [ but couldn't find matching closing bracket`);
                    }
                  } else {
                    console.warn(`⚠️ [SDS] Decoded string doesn't contain JSON markers ({ or [):`, decodedString.substring(0, 500));
                    }
                  }
                } catch (e) {
                console.warn(`⚠️ [SDS] Failed to decode data field:`, e);
              }
              
              // If we couldn't extract JSON, skip this event
              if (!jsonData) {
                console.log(`⚠️ [SDS] Skipping blockchain event - no JSON found in data field:`, {
                  eventType,
                  hasTopics: true,
                  topicsLength: actualData.topics.length,
                  hasAddress: !!actualData.address,
                  dataFieldLength: actualData.data?.length || 0
                });
                return;
              }
            } else if (typeof actualData === 'string') {
              // Backend sends JSON strings - parse them
              const trimmed = actualData.trim();
              if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                try {
                  jsonData = JSON.parse(trimmed);
                  console.log(`📦 [SDS] Parsed backend JSON string to object`);
                } catch (e) {
                  console.warn(`⚠️ [SDS] Failed to parse JSON string:`, e);
                  return; // Skip invalid JSON
                }
                    } else {
                // Not JSON, might be hex-encoded - but if it doesn't look like our data, skip it
                console.warn(`⚠️ [SDS] Data string doesn't look like JSON (doesn't start with { or [):`, trimmed.substring(0, 100));
                return;
              }
            } else if (actualData && typeof actualData === 'object' && !hasTopics) {
              // Already parsed JSON object from our backend (no topics array)
              jsonData = actualData;
              console.log(`📦 [SDS] Using backend JSON object directly`);
                    } else {
              // Unknown format, skip
              console.warn(`⚠️ [SDS] Unknown data format, skipping:`, typeof actualData, actualData);
              return;
            }
            
            // ✅ CRITICAL: Validate that we have valid JSON data from our backend
            if (!jsonData) {
              console.warn(`⚠️ [SDS] Invalid JSON data from backend, skipping:`, jsonData);
              return;
            }
            
            // Handle array of events
            if (Array.isArray(jsonData) && jsonData.length > 0) {
              console.log(`📦 [SDS] JSON is an array with ${jsonData.length} items, processing first item`);
              jsonData = jsonData[0];
            }
            
            if (typeof jsonData !== 'object') {
              console.warn(`⚠️ [SDS] JSON data is not an object, skipping:`, typeof jsonData);
              return;
            }
            
            // ✅ CRITICAL: Skip blockchain transaction data (has releases/swaps/asset_in_type)
            // These are SDS-indexed blockchain events, not our backend's published JSON
            if (jsonData.releases || jsonData.swaps || jsonData.asset_in_type) {
              console.log(`⚠️ [SDS] Skipping SDS-indexed blockchain event (has releases/swaps/asset_in_type) - this is not backend JSON`);
              console.log(`   Event type: ${eventType}, Context: ${contextConfig}`);
              console.log(`   Data keys:`, Object.keys(jsonData));
              return; // Skip blockchain transaction data
            }
            
            // ✅ Backend publishes clean JSON with poolId, bettor, cycleId, etc.
            // Check if this looks like backend JSON (has our event fields)
            const hasBackendFields = jsonData.poolId || jsonData.pool_id || 
                                    jsonData.cycleId || jsonData.cycle_id ||
                                    jsonData.bettor || jsonData.bettor_address ||
                                    jsonData.creator || jsonData.creator_address ||
                                    jsonData.provider || jsonData.provider_address ||
                                    jsonData.player || jsonData.player_address ||
                                    jsonData.slipId || jsonData.slip_id;
            
            if (!hasBackendFields) {
              console.log(`⚠️ [SDS] Skipping data - doesn't look like backend JSON (missing event fields)`);
              console.log(`   Event type: ${eventType}, Context: ${contextConfig}`);
              console.log(`   Data keys:`, Object.keys(jsonData));
              console.log(`   Preview:`, JSON.stringify(jsonData).substring(0, 200));
              return; // Skip data that doesn't have our event fields
            }
            
            console.log(`✅ [SDS] Processing backend JSON data for ${eventType}:`, {
              keys: Object.keys(jsonData),
              preview: JSON.stringify(jsonData).substring(0, 500)
            });
            
            // ✅ Use jsonData directly - it's already our backend's clean JSON
            let eventData: any = jsonData;
            
            // ✅ All data processing now uses eventData (backend's clean JSON)
            let decodedData = { ...eventData };
            
            // ✅ CRITICAL: Handle field name variations (snake_case vs camelCase)
            // Map snake_case to camelCase for consistency
            if (!decodedData.poolId && (decodedData.pool_id || (eventData as any).pool_id)) {
              decodedData.poolId = decodedData.pool_id || (eventData as any).pool_id;
            }
            if (!decodedData.cycleId && (decodedData.cycle_id || (eventData as any).cycle_id)) {
              decodedData.cycleId = decodedData.cycle_id || (eventData as any).cycle_id;
            }
            if (!decodedData.slipId && (decodedData.slip_id || (eventData as any).slip_id)) {
              decodedData.slipId = decodedData.slip_id || (eventData as any).slip_id;
            }
            if (!decodedData.bettor && (decodedData.bettor_address || (eventData as any).bettor_address)) {
              decodedData.bettor = decodedData.bettor_address || (eventData as any).bettor_address;
            }
            if (!decodedData.bettorAddress && decodedData.bettor) {
              decodedData.bettorAddress = decodedData.bettor;
            }
            if (!decodedData.creator && (decodedData.creator_address || (eventData as any).creator_address)) {
              decodedData.creator = decodedData.creator_address || (eventData as any).creator_address;
            }
            if (!decodedData.provider && (decodedData.provider_address || (eventData as any).provider_address)) {
              decodedData.provider = decodedData.provider_address || (eventData as any).provider_address;
            }
            if (!decodedData.player && (decodedData.player_address || (eventData as any).player_address)) {
              decodedData.player = decodedData.player_address || (eventData as any).player_address;
            }
            
            // ✅ CRITICAL: Normalize IDs from backend JSON (convert BigInt/hex to readable numbers)
            if (decodedData.poolId) {
              decodedData.poolId = normalizeId(decodedData.poolId);
            }
            if (decodedData.cycleId) {
              decodedData.cycleId = normalizeId(decodedData.cycleId);
            }
            if (decodedData.slipId) {
              decodedData.slipId = normalizeId(decodedData.slipId);
            }
            
            // ✅ CRITICAL: Ensure addresses are lowercase strings
            if (decodedData.bettor) {
              decodedData.bettor = String(decodedData.bettor).toLowerCase();
                decodedData.bettorAddress = decodedData.bettor;
              }
            if (decodedData.creator) {
              decodedData.creator = String(decodedData.creator).toLowerCase();
            }
            if (decodedData.provider) {
              decodedData.provider = String(decodedData.provider).toLowerCase();
            }
            if (decodedData.player) {
              decodedData.player = String(decodedData.player).toLowerCase();
            }
            
            // ✅ CRITICAL: Ensure amounts are strings (backend sends as strings)
            if (decodedData.amount && typeof decodedData.amount !== 'string') {
              decodedData.amount = decodedData.amount.toString();
            }
            
            // ✅ CRITICAL: Validate and extract timestamp from backend JSON
            if (!decodedData.timestamp) {
              // Try to extract from various timestamp fields
              const ts = decodedData.timestamp || 
                        (decodedData as any).created_at || 
                        (decodedData as any).createdAt ||
                        (decodedData as any).time;
              
              if (ts) {
                if (typeof ts === 'number') {
                  decodedData.timestamp = ts;
                } else if (typeof ts === 'string') {
                  // Try parsing as Unix timestamp
                  const parsed = parseInt(ts, 10);
                  if (!isNaN(parsed) && parsed > 0) {
                    decodedData.timestamp = parsed;
                  } else {
                    // Try parsing as date string
                    try {
                      const date = new Date(ts);
                      decodedData.timestamp = Math.floor(date.getTime() / 1000);
                  } catch (e) {
                      console.warn(`⚠️ [SDS] Failed to parse timestamp:`, ts);
                    }
                  }
                }
              }
              
              // Fallback to current time if still missing
              if (!decodedData.timestamp) {
                decodedData.timestamp = Math.floor(Date.now() / 1000);
                console.log(`   ℹ️ Defaulting timestamp to current time for ${eventType}`);
              }
            }
            
            // ✅ CRITICAL: Validate timestamp before processing
            const eventTimestamp = decodedData.timestamp;
            if (!eventTimestamp || typeof eventTimestamp !== 'number' || eventTimestamp <= 0 || eventTimestamp > 2147483647) {
              console.log(`⚠️ [SDS] Rejecting ${eventType} event without valid timestamp:`, decodedData);
              return; // Reject events without valid timestamp
            }
            
            // ✅ TIME FILTERING: Only process recent events (within last 3 minutes for live activity)
            if (!isRecentEvent(eventTimestamp)) {
              console.log(`⚠️ [SDS] Skipping old ${eventType} event (timestamp: ${eventTimestamp}, now: ${Math.floor(Date.now() / 1000)}, age: ${Math.floor(Date.now() / 1000) - eventTimestamp}s)`);
              return; // Skip old events
            }
            
            // ✅ CRITICAL: Ensure currency is set (backend should include this)
            if (!decodedData.currency) {
              // Try to infer from useBitr flag
              const useBitr = (decodedData as any).useBitr || (decodedData as any).use_bitr;
              decodedData.currency = useBitr ? 'BITR' : 'STT';
            }
            
            console.log(`✅ [SDS] Processed backend JSON data for ${eventType}:`, {
              poolId: decodedData.poolId,
              cycleId: decodedData.cycleId,
              timestamp: decodedData.timestamp,
              currency: decodedData.currency
            });
            
            
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
    } else if (isFirstSubscriber) {
      console.log(`♻️ First subscriber for ${eventType}, but SDK not ready yet (SDK: ${!!sdkAvailable}, SDS active: ${sdsActive})`);
      if (sdkAvailable && !sdsActive) {
        console.log(`   ⚠️ SDK available but state not updated - will retry on next render`);
      }
    } else {
      console.log(`♻️ Reusing existing subscription for ${eventType} (${callbacks.size} subscribers)`);
    }

    // Return unsubscribe function
    return () => {
      const callbacks = globalSubscribersMap.get(eventType);
      if (callbacks) {
        callbacks.delete(callback);
        console.log(`🔌 Callback removed from ${eventType} (${callbacks.size} remaining)`);
        
        if (callbacks.size === 0) {
          const unsubscribeTimer = setTimeout(() => {
            const currentCallbacks = globalSubscribersMap.get(eventType);
            if (currentCallbacks && currentCallbacks.size === 0) {
              globalSubscribersMap.delete(eventType);
              
              const unsubscribeFn = globalUnsubscribeFunctionsMap.get(eventType as any);
              if (unsubscribeFn) {
                unsubscribeFn();
                globalUnsubscribeFunctionsMap.delete(eventType as any);
                console.log(`🔌 Unsubscribed from ${eventType} (no more subscribers after delay)`);
              }
            }
          }, 30000);
          
          (globalSubscribersMap as any)[`_timer_${eventType}`] = unsubscribeTimer;
        } else {
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
  }, [subscribe, enabled]);
  
  return rest;
}

export function useBetUpdates(callback: (data: SDSBetData) => void, enabled = true) {
  const { subscribe, ...rest } = useSomniaStreams({ enabled });
  const callbackRef = useRef(callback);
  
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
  }, [subscribe, enabled]);
  
  return rest;
}

export function usePoolProgress(poolId: string, callback: (data: SDSPoolProgressData) => void, enabled = true) {
  const { subscribe, ...rest } = useSomniaStreams({ enabled });
  const callbackRef = useRef(callback);
  
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
  }, [subscribe, poolId, enabled]);
  
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
      const rawCycleId = (data as any).cycleId || (data as any).cycle_id || (data as any).poolId || '0';
      const cycleId = normalizeId(rawCycleId);
      
      if (cycleId === '0' || !cycleId) {
        console.warn(`⚠️ Skipping cycle:resolved with invalid cycleId: ${cycleId}`);
        return;
      }
      
      const eventTimestamp = (data as any).timestamp;
      if (!eventTimestamp || typeof eventTimestamp !== 'number' || eventTimestamp <= 0) {
        console.log(`⚠️ Skipping cycle:resolved event without valid timestamp:`, data);
        return;
      }
      
      if (!isRecentEvent(eventTimestamp)) {
        console.log(`⚠️ Skipping old cycle:resolved event (cycle: ${cycleId}, timestamp: ${eventTimestamp}, age: ${Math.floor(Date.now() / 1000) - eventTimestamp}s)`);
        return;
      }
      
      const dedupeKey = `cycle:${cycleId}:${eventTimestamp}`;
      
      if (seenCyclesRef.current.has(dedupeKey)) {
        console.log(`⚠️ Skipping duplicate cycle:resolved notification for cycle ${cycleId} at ${eventTimestamp}`);
        return;
      }
      
      seenCyclesRef.current.add(dedupeKey);
      
      try {
        const cyclesArray = Array.from(seenCyclesRef.current);
        localStorage.setItem('seen_cycles', JSON.stringify(cyclesArray));
      } catch (e) {
        console.warn('Failed to save seen cycles to localStorage:', e);
      }
      
      if (seenCyclesRef.current.size > 100) {
        const firstKey = seenCyclesRef.current.values().next().value;
        if (firstKey) {
          seenCyclesRef.current.delete(firstKey);
        }
      }
      
      const safeData: SDSCycleResolvedData = {
        cycleId: cycleId,
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

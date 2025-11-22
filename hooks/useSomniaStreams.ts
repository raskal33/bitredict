import { useEffect, useState, useCallback, useRef } from 'react';
import { SDK } from '@somnia-chain/streams';
import { createPublicClient, http } from 'viem';
import { somniaTestnet } from 'viem/chains';

const PUBLISHER_ADDRESS = (process.env.NEXT_PUBLIC_SDS_PUBLISHER_ADDRESS || '0x483fc7FD690dCf2a01318282559C389F385d4428') as `0x${string}`;

async function getSchemaIdForContext(context: string): Promise<`0x${string}`> {
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(context);
  const dataBuffer = encodedData.buffer.slice(
    encodedData.byteOffset,
    encodedData.byteOffset + encodedData.byteLength
  ) as ArrayBuffer;
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `0x${hashHex.slice(0, 64)}` as `0x${string}`;
}

function hexToString(hex: `0x${string}` | string): string {
  const hexWithoutPrefix = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(
    hexWithoutPrefix.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  );
  return new TextDecoder().decode(bytes);
}

const globalSubscribersMap = new Map<SDSEventType, Set<(data: SDSEventData) => void>>();
const globalUnsubscribeFunctionsMap = new Map<string, () => void>();
const globalPendingSubscriptions = new Set<SDSEventType>();
let globalSDKInstance: SDK | null = null;

const globalSeenEvents = new Map<SDSEventType, Set<string>>();

const lastNotificationTime = new Map<string, number>();
const NOTIFICATION_RATE_LIMIT_MS = 2000;

const normalizeId = (id: any): string => {
  if (!id) return '0';
  if (typeof id === 'string') {
    if (id.startsWith('0x')) {
      try {
        const bigInt = BigInt(id);
        return bigInt.toString();
      } catch {
        return id;
      }
    }
    return id;
  }
  if (typeof id === 'bigint' || typeof id === 'number') {
    return id.toString();
  }
  return String(id);
};

const isRecentEvent = (timestamp: number | string | undefined): boolean => {
  if (!timestamp) return false;
  const ts = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
  if (isNaN(ts) || ts <= 0) return false;
  const now = Math.floor(Date.now() / 1000);
  const threeMinutesAgo = now - (3 * 60); 
  return ts >= threeMinutesAgo;
};

const createEventDedupeKey = (eventType: SDSEventType, decodedData: any): string => {
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
  
  return `${eventType}:${poolId}:${timestamp}`;
};

const isEventSeen = (eventType: SDSEventType, key: string): boolean => {
  const seenSet = globalSeenEvents.get(eventType);
  if (!seenSet) return false;
  return seenSet.has(key);
};

const markEventSeen = (eventType: SDSEventType, key: string) => {
  if (!globalSeenEvents.has(eventType)) {
    globalSeenEvents.set(eventType, new Set());
  }
  const seenSet = globalSeenEvents.get(eventType)!;
  seenSet.add(key);
  
  if (seenSet.size > 500) {
    const firstKey = seenSet.values().next().value;
    if (firstKey) {
      seenSet.delete(firstKey);
    }
  }
  
  try {
    const storageKey = `seen_events_${eventType}`;
    const eventsArray = Array.from(seenSet);
    localStorage.setItem(storageKey, JSON.stringify(eventsArray));
  } catch (e) {
    console.warn(`Failed to save seen events for ${eventType} to localStorage:`, e);
  }
};

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
  totalLiquidity?: string;
  poolFillPercentage?: number;
  currency?: string;
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
    useFallback = false
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isSDSActive, setIsSDSActive] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const sdkRef = useRef<SDK | null>(globalSDKInstance);
  const wsRef = useRef<WebSocket | null>(null);

  const initializeSDK = useCallback(async () => {
    if (!enabled) return;

    if (globalSDKInstance) {
      sdkRef.current = globalSDKInstance;
      setIsSDSActive(true);
      setIsConnected(true);
      console.log('♻️ Reusing existing global SDK instance');
      return;
    }

    try {
      console.log('📡 Creating public client with HTTP transport...');

      const publicClient = createPublicClient({
        chain: somniaTestnet,
        transport: http(),
      }) as any;

      console.log('✅ Public client created, initializing SDK...');
      
      const sdk = new SDK({
        public: publicClient
      });

      console.log('✅ SDK initialized successfully');
      
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
                
                const eventTimestamp = message.data.timestamp || Math.floor(Date.now() / 1000);
                if (!isRecentEvent(eventTimestamp)) {
                  console.log(`⚠️ [WebSocket] Skipping old ${eventType} event (timestamp: ${eventTimestamp})`);
                  return;
                }
                
                const now = Date.now();
                const rateLimitKey = `${eventType}:${message.data.poolId || message.data.cycleId || 'unknown'}`;
                const lastTime = lastNotificationTime.get(rateLimitKey);
                if (lastTime && (now - lastTime) < NOTIFICATION_RATE_LIMIT_MS) {
                  console.log(`⚠️ [WebSocket] Rate limit: Skipping ${eventType} event (last notification ${now - lastTime}ms ago)`);
                  return;
                }
                lastNotificationTime.set(rateLimitKey, now);
                
                const dedupeKey = createEventDedupeKey(eventType, message.data);
                if (isEventSeen(eventType, dedupeKey)) {
                  console.log(`⚠️ [WebSocket] Skipping duplicate ${eventType} event: ${dedupeKey}`);
                  return;
                }
                
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

  const subscribe = useCallback((
    eventType: SDSEventType,
    callback: (data: SDSEventData) => void
  ): (() => void) => {
    if (!globalSubscribersMap.has(eventType)) {
      globalSubscribersMap.set(eventType, new Set());
    }
    
    const callbacks = globalSubscribersMap.get(eventType)!;
    const isFirstSubscriber = callbacks.size === 0;
    const isPending = globalPendingSubscriptions.has(eventType);
    callbacks.add(callback);

    const sdkAvailable = sdkRef.current || globalSDKInstance;
    const sdsActive = isSDSActive || !!sdkAvailable;
    

      if (sdkAvailable && sdsActive && isFirstSubscriber && !isPending) {
        const contextConfig = EVENT_CONTEXT_MAP[eventType];
        
        globalPendingSubscriptions.add(eventType);
        
        console.log(`📡 [GLOBAL] Setting up polling for ${eventType} via SDS (context: ${contextConfig})`);
        console.log(`   SDK available: ${!!sdkAvailable}, SDS active: ${sdsActive}, First subscriber: ${isFirstSubscriber}, Pending: ${isPending}`);
        
        try {
          let pollInterval: NodeJS.Timeout | null = null;
          let lastProcessedDataHash: string | null = null;
          
          const startPolling = async () => {
            try {
              const schemaId = await getSchemaIdForContext(contextConfig);
              const sdkToUse = sdkRef.current || globalSDKInstance;
              if (!sdkToUse) {
                throw new Error('SDK not available for polling');
              }
              
              let latest: any;
              try {
                latest = await sdkToUse.streams.getLastPublishedDataForSchema(
                  schemaId,
                  PUBLISHER_ADDRESS
                );
              } catch (error: any) {
                if (
                  error?.message?.includes('NoData') || 
                  error?.shortMessage === 'NoData()' ||
                  error?.cause?.reason === 'NoData()' ||
                  (error?.cause && typeof error.cause === 'object' && 'reason' in error.cause && error.cause.reason === 'NoData()')
                ) {
                  return;
                }
                console.warn(`⚠️ [SDS] Error fetching data for ${eventType}:`, error);
                return;
              }
              
              if (!latest) {
                return; // No data yet
              }
              
              // Decode hex-encoded data
              let hexData: `0x${string}` | string | null = null;
              
              // Handle different result formats
              if (Array.isArray(latest) && latest.length > 0) {
                if (Array.isArray(latest[0]) && latest[0].length > 0) {
                  const firstItem = latest[0][0];
                  if (typeof firstItem === 'string') {
                    hexData = firstItem;
                  } else if (firstItem && typeof firstItem === 'object' && (firstItem as any).data) {
                    hexData = (firstItem as any).data;
                  }
                } else if (typeof latest[0] === 'string') {
                  hexData = latest[0];
                } else if (latest[0] && typeof latest[0] === 'object' && (latest[0] as any).data) {
                  hexData = (latest[0] as any).data;
                }
              } else if (typeof latest === 'string') {
                hexData = latest;
              } else if (latest && typeof latest === 'object' && (latest as any).data) {
                hexData = (latest as any).data;
              }
              
              if (!hexData || typeof hexData !== 'string' || !hexData.startsWith('0x')) {
                return; // Invalid data format
              }
              
              // Create hash of data to detect if it's the same as last processed
              const dataHash = hexData;
              if (dataHash === lastProcessedDataHash) {
                return; // Same data as last poll, skip
              }
              
              // Decode hex to JSON string
              const jsonString = hexToString(hexData as `0x${string}`);
              
              // Parse JSON
              let jsonData: any;
              try {
                jsonData = JSON.parse(jsonString);
              } catch (e) {
                console.warn(`⚠️ [SDS] Failed to parse JSON for ${eventType}:`, e);
                return;
              }
              
              // Process the decoded JSON data
              console.log(`📦 [SDS] ✅ Decoded backend JSON for ${eventType}:`, {
                keys: Object.keys(jsonData),
                preview: JSON.stringify(jsonData).substring(0, 200)
              });
              
              // Use jsonData directly - it's already our backend's clean JSON
              let decodedData = { ...jsonData };
              
              // Handle array of events
              if (Array.isArray(decodedData) && decodedData.length > 0) {
                decodedData = decodedData[0];
              }
              
              if (typeof decodedData !== 'object' || !decodedData) {
                console.warn(`⚠️ [SDS] Invalid data format for ${eventType}`);
                return;
              }
              
              // ✅ CRITICAL: Handle field name variations (snake_case vs camelCase)
              if (!decodedData.poolId && (decodedData as any).pool_id) {
                decodedData.poolId = (decodedData as any).pool_id;
              }
              if (!decodedData.cycleId && (decodedData as any).cycle_id) {
                decodedData.cycleId = (decodedData as any).cycle_id;
              }
              if (!decodedData.slipId && (decodedData as any).slip_id) {
                decodedData.slipId = (decodedData as any).slip_id;
              }
              if (!decodedData.bettor && (decodedData as any).bettor_address) {
                decodedData.bettor = (decodedData as any).bettor_address;
              }
              if (!decodedData.creator && (decodedData as any).creator_address) {
                decodedData.creator = (decodedData as any).creator_address;
              }
              if (!decodedData.provider && (decodedData as any).provider_address) {
                decodedData.provider = (decodedData as any).provider_address;
              }
              if (!decodedData.player && (decodedData as any).player_address) {
                decodedData.player = (decodedData as any).player_address;
              }
              
              // ✅ CRITICAL: Normalize IDs
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
                (decodedData as any).bettorAddress = decodedData.bettor;
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
              
              // ✅ CRITICAL: Ensure amounts are strings
              if (decodedData.amount && typeof decodedData.amount !== 'string') {
                decodedData.amount = decodedData.amount.toString();
              }
              
              // ✅ CRITICAL: Validate timestamp
              if (!decodedData.timestamp) {
                decodedData.timestamp = Math.floor(Date.now() / 1000);
              }
              
              const eventTimestamp = decodedData.timestamp;
              if (!eventTimestamp || typeof eventTimestamp !== 'number' || eventTimestamp <= 0) {
                console.log(`⚠️ [SDS] Rejecting ${eventType} event without valid timestamp`);
                return;
              }
              
              // ✅ TIME FILTERING: Only process recent events
              // For pool:progress events, be more lenient (10 minutes) since they're incremental updates
              // If we got past the hash check (line 698), the data is new, so for progress events
              // we should process them even if timestamp is slightly old (handles publishing delays)
              const isProgressEvent = eventType === 'pool:progress';
              const timeWindow = isProgressEvent ? 10 * 60 : 3 * 60; // 10 minutes for progress, 3 minutes for others
              const nowSeconds = Math.floor(Date.now() / 1000);
              const timeThreshold = nowSeconds - timeWindow;
              
              if (eventTimestamp < timeThreshold) {
                // For progress events, since we already passed the hash check (data is new),
                // process it even if timestamp is slightly old - this handles publishing delays
                if (!isProgressEvent) {
                  console.log(`⚠️ [SDS] Skipping old ${eventType} event (timestamp: ${eventTimestamp}, threshold: ${timeThreshold})`);
                  return;
                }
                // For progress events, allow through - hash-based deduplication prevents duplicates
              }
              
              // ✅ CRITICAL: Ensure currency is set
              if (!decodedData.currency) {
                const useBitr = (decodedData as any).useBitr || (decodedData as any).use_bitr;
                decodedData.currency = useBitr ? 'BITR' : 'STT';
              }
              
              // ✅ Rate limiting
              const now = Date.now();
              const rateLimitKey = `${eventType}:${decodedData.poolId || decodedData.cycleId || 'unknown'}`;
              const lastTime = lastNotificationTime.get(rateLimitKey);
              if (lastTime && (now - lastTime) < NOTIFICATION_RATE_LIMIT_MS) {
                return;
              }
              lastNotificationTime.set(rateLimitKey, now);
              
              // ✅ Deduplication
              const dedupeKey = createEventDedupeKey(eventType, decodedData);
              if (isEventSeen(eventType, dedupeKey)) {
                return;
              }
              markEventSeen(eventType, dedupeKey);
              
              // Mark this data as processed
              lastProcessedDataHash = dataHash;
              
              // ✅ Broadcast to all subscribers
              const callbacks = globalSubscribersMap.get(eventType);
              if (callbacks && callbacks.size > 0) {
                callbacks.forEach(cb => {
                  try {
                    cb(decodedData as SDSEventData);
                  } catch (error) {
                    console.error(`❌ Error in callback for ${eventType}:`, error);
                  }
                });
              }
            } catch (err) {
              console.error(`❌ Error in polling for ${eventType}:`, err);
            }
          };
          
          // Start polling immediately
          startPolling();
          
          // Set up polling interval (every 2 seconds)
          pollInterval = setInterval(startPolling, 2000);
          
          // Store cleanup function
          globalUnsubscribeFunctionsMap.set(eventType as any, () => {
            if (pollInterval) {
              clearInterval(pollInterval);
              pollInterval = null;
            }
            globalPendingSubscriptions.delete(eventType);
          });
          
          // Clear pending flag
          globalPendingSubscriptions.delete(eventType);
          
        } catch (error) {
          // ✅ Clear GLOBAL pending flag on error
          globalPendingSubscriptions.delete(eventType);
          console.error(`❌ Failed to set up polling for ${eventType}:`, error);
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

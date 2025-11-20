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
            onlyPushChanges: false,
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
            
            // ✅ Use data as-is (no ABI decoding for context-based subscriptions)
            let decodedData = actualData;
            
            // Decode pool progress data
            if (eventType === 'pool:progress' && data && typeof data === 'object') {
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
            
            // Decode pool created data (SDS publishes enriched pool data)
            if (eventType === 'pool:created' && data && typeof data === 'object') {
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
                    poolId: decoded[0].toString(),
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
                    timestamp: Math.floor(Date.now() / 1000)
                  };
                  console.log(`✅ Decoded pool created data:`, decodedData);
                } catch (decodeError) {
                  console.warn(`⚠️ Failed to decode pool created data:`, decodeError);
                }
              } else {
                // Data already decoded or sent as object
                decodedData = {
                  ...data,
                  poolId: data.poolId?.toString() || data.pool_id?.toString(),
                  timestamp: data.timestamp || Math.floor(Date.now() / 1000)
                };
              }
            }
            
            // Decode liquidity added data
            if (eventType === 'liquidity:added' && data && typeof data === 'object') {
              if (data.data && typeof data.data === 'string' && data.data.startsWith('0x')) {
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
                    poolId: decoded[0].toString(),
                    provider: decoded[1],
                    amount: decoded[2].toString(),
                    totalLiquidity: decoded[3].toString(),
                    poolFillPercentage: Number(decoded[4]),
                    timestamp: Number(decoded[5])
                  };
                  console.log(`✅ Decoded liquidity added data:`, decodedData);
                } catch (decodeError) {
                  console.warn(`⚠️ Failed to decode liquidity added data:`, decodeError);
                }
              } else {
                decodedData = {
                  ...data,
                  poolId: data.poolId?.toString() || data.pool_id?.toString(),
                  timestamp: data.timestamp || Math.floor(Date.now() / 1000)
                };
              }
            }
            
            // ✅ CRITICAL FIX: Decode bet placed data (SDS sends BetPlaced events)
            if (eventType === 'bet:placed' && data && typeof data === 'object') {
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
                        timestamp: Math.floor(Date.now() / 1000),
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
                      timestamp: data.timestamp || Math.floor(Date.now() / 1000),
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
                  timestamp: data.timestamp || Math.floor(Date.now() / 1000)
                };
                console.log(`✅ Using bet placed data as-is (already decoded):`, decodedData);
              }
            }
            
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

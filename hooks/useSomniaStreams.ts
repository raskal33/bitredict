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
  subscribeToChannel: (channel: string) => void;
  subscribeToWebSocketChannel: (eventType: SDSEventType, poolId?: string) => void;
  reconnect: () => void;
}

// Event schema mapping - must match backend registered schemas
const EVENT_SCHEMA_MAP: Record<SDSEventType, string> = {
  'pool:created': 'PoolCreated',
  'pool:settled': 'PoolSettled',
  'bet:placed': 'BetPlaced',
  'pool:progress': 'PoolProgress', // ✅ Fixed: Use PoolProgress event schema (not BetPlaced)
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

  // ✅ CRITICAL FIX: Subscribe to WebSocket channel
  const subscribeToWebSocketChannel = useCallback((eventType: SDSEventType, poolId?: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }
    
    const channels = new Set<string>();
    if (eventType === 'bet:placed') {
      channels.add('bet:placed');
      channels.add('recent_bets'); // legacy channel for moving lane
    } else if (eventType === 'pool:progress' && poolId) {
      // ✅ CRITICAL FIX: Subscribe to per-pool progress channel
      channels.add(`pool:${poolId}:progress`);
      // Also subscribe to general pool:progress if backend supports it
      channels.add('pool:progress');
    } else if (eventType === 'pool:progress') {
      // General pool progress subscription (for all pools)
      channels.add('pool:progress');
    } else {
      channels.add(eventType);
    }
    
    channels.forEach(channel => {
      console.log(`📡 [WebSocket] Subscribing to channel: ${channel} (for event: ${eventType}${poolId ? `, pool: ${poolId}` : ''})`);
      wsRef.current?.send(JSON.stringify({ type: 'subscribe', channel }));
    });
  }, []);

  // WebSocket fallback
  const initializeWebSocketFallback = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    
    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://bitredict-backend.fly.dev/ws';
      console.log(`📡 [WebSocket] Initializing fallback connection to: ${wsUrl}`);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log(`✅ [WebSocket] Connected successfully`);
        setIsConnected(true);
        setIsFallback(true);
        setError(null);
        
        // ✅ CRITICAL FIX: Subscribe to all existing channels that components have requested
        const channels = new Set<string>();
        globalSubscribersMap.forEach((callbacks, eventType) => {
          if (callbacks.size > 0) { // Only subscribe if there are active callbacks
            if (eventType === 'bet:placed') {
              channels.add('bet:placed');
              channels.add('recent_bets'); // legacy channel for moving lane
            } else if (eventType === 'pool:progress') {
              channels.add('pool:progress');
            } else {
              channels.add(eventType);
            }
          }
        });
        
        console.log(`📡 [WebSocket] Subscribing to ${channels.size} channels:`, Array.from(channels));
        channels.forEach(channel => {
          ws.send(JSON.stringify({ type: 'subscribe', channel }));
        });
        
        // ✅ CRITICAL FIX: Also subscribe to any new channels that get added after connection
        // This is handled by subscribeToWebSocketChannel being called when new subscriptions are added
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
        setIsConnected(false);
        setIsFallback(false);
        // ✅ CRITICAL FIX: Attempt to reconnect after delay
        setTimeout(() => {
          if (useFallback && !wsRef.current) {
            console.log(`🔄 [WebSocket] Attempting to reconnect...`);
            initializeWebSocketFallback();
          }
        }, 3000);
      };

      wsRef.current = ws;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

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
    if (useFallback && !wsRef.current) {
      console.log(`📡 [WebSocket] Initializing fallback for event: ${eventType}`);
      initializeWebSocketFallback();
    }
    
    // ✅ CRITICAL FIX: Subscribe to WebSocket if connected (even if SDS is also working)
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      subscribeToWebSocketChannel(eventType);
    }
    
    // Subscribe via SDS if available (only once per event type AND not already pending)
    if (sdkAvailable && sdsActive && isFirstSubscriber && !isPending) {
      const eventSchemaId = EVENT_SCHEMA_MAP[eventType];
      
      // ✅ Mark as pending GLOBALLY to prevent duplicate subscriptions across ALL components
      globalPendingSubscriptions.add(eventType);
      
      console.log(`📡 [GLOBAL] Subscribing to ${eventType} via SDS (event: ${eventSchemaId})`);
      console.log(`   SDK available: ${!!sdkAvailable}, SDS active: ${sdsActive}, First subscriber: ${isFirstSubscriber}, Pending: ${isPending}`);
      
      try {
        // ✅ CRITICAL FIX: For BetPlaced events, we need to subscribe to the data stream, not just the event
        // SDS events only contain indexed topics, but we need the full bet data from the data stream
        const needsDataStream = eventType === 'bet:placed' || eventType === 'pool:progress';
        
        // Create subscription parameters matching stream-rank-sync approach
        const subscriptionParams = {
          somniaStreamsEventId: eventSchemaId,
          ethCalls: needsDataStream ? [
            // ✅ CRITICAL: Add ethCall to fetch bet data when BetPlaced event is received
            ...(eventType === 'bet:placed' ? [{
              to: '0x0000000000000000000000000000000000000000' as `0x${string}`, // Placeholder - will be replaced by SDK
              data: '0x' as `0x${string}` // Will fetch bet data from data stream
            }] : []),
            // ✅ CRITICAL: Add ethCall to fetch pool progress data when BetPlaced event is received (for pool:progress)
            ...(eventType === 'pool:progress' ? [{
              to: '0x0000000000000000000000000000000000000000' as `0x${string}`,
              data: '0x' as `0x${string}` // Will fetch pool progress data from data stream
            }] : [])
          ] : [],
          onlyPushChanges: false, 
          onData: (data: any) => {
            console.log(`📦 [SDS] Received ${eventType} data:`, data);
            console.log(`📦 [SDS] Data type:`, typeof data, 'Keys:', data ? Object.keys(data) : 'null');
            if (data && typeof data === 'object') {
              console.log(`📦 [SDS] Data structure:`, {
                hasData: !!data.data,
                hasTopics: !!data.topics,
                poolId: data.poolId || data.pool_id,
                keys: Object.keys(data)
              });
            }
            
            // ✅ CRITICAL: Decode ABI-encoded data if needed
            let decodedData = data;
            
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
        
        console.log(`📡 Calling SDK subscribe with params:`, subscriptionParams);
        
        // ✅ CRITICAL FIX: Use global SDK instance if available
        const sdkToUse = sdkRef.current || globalSDKInstance;
        if (!sdkToUse) {
          throw new Error('SDK not available for subscription');
        }
        
        console.log(`📡 Calling SDK subscribe with params:`, {
          somniaStreamsEventId: subscriptionParams.somniaStreamsEventId,
          ethCalls: subscriptionParams.ethCalls?.length || 0,
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
          // Try fallback if SDS subscription fails
          if (useFallback) {
            console.log(`🔄 Falling back to WebSocket for ${eventType}`);
          }
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
      // ✅ CRITICAL FIX: Still subscribe to WebSocket even if SDS subscription is pending
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        subscribeToWebSocketChannel(eventType);
      }
    } else if (isFirstSubscriber) {
      console.log(`♻️ First subscriber for ${eventType}, but SDK not ready yet (SDK: ${!!sdkAvailable}, SDS active: ${sdsActive})`);
      // ✅ CRITICAL FIX: If SDK is available but state hasn't updated, try subscribing anyway
      if (sdkAvailable && !sdsActive) {
        console.log(`   ⚠️ SDK available but state not updated - will retry on next render`);
      }
      // ✅ CRITICAL FIX: Subscribe to WebSocket fallback immediately
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        subscribeToWebSocketChannel(eventType);
      } else if (useFallback && !wsRef.current) {
        initializeWebSocketFallback();
      }
    } else {
      console.log(`♻️ Reusing existing subscription for ${eventType} (${callbacks.size} subscribers)`);
      // ✅ CRITICAL FIX: Ensure WebSocket is subscribed even for existing subscriptions
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        subscribeToWebSocketChannel(eventType);
      }
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
  }, [isSDSActive, useFallback, subscribeToWebSocketChannel, initializeWebSocketFallback]);

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
      // ✅ CRITICAL FIX: Always initialize WebSocket fallback
      if (useFallback) {
        initializeWebSocketFallback();
      }
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
  }, [enabled, initializeSDK, useFallback, initializeWebSocketFallback]);
  
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
    subscribeToChannel,
    subscribeToWebSocketChannel, // ✅ Export for usePoolProgress to subscribe to per-pool channels
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
  const { subscribe, subscribeToWebSocketChannel, ...rest } = useSomniaStreams({ enabled });
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
    
    // ✅ CRITICAL FIX: Also subscribe to WebSocket per-pool channel
    if (subscribeToWebSocketChannel) {
      subscribeToWebSocketChannel('pool:progress', poolId);
    }
    
    return unsubscribe;
  }, [subscribe, subscribeToWebSocketChannel, poolId, enabled]); // ✅ Removed callback from deps
  
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

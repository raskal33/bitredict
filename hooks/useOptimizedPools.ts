/**
 * Optimized Pools Hook
 * Combines backend API with WebSocket real-time updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { optimizedPoolService, OptimizedPool, PoolFilters, Analytics } from '@/services/optimizedPoolService';
import { websocketService } from '@/services/websocketService';
import { websocketClient } from '@/services/websocket-client';

export interface UseOptimizedPoolsOptions {
  filters?: PoolFilters;
  enableWebSocket?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseOptimizedPoolsReturn {
  pools: OptimizedPool[];
  stats: Analytics;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isConnected: boolean;
  lastUpdated: number;
}

export function useOptimizedPools(options: UseOptimizedPoolsOptions = {}): UseOptimizedPoolsReturn {
  const {
    filters = {},
    enableWebSocket = true,
    autoRefresh = true,
    refreshInterval = 30000 // 30 seconds
  } = options;

  const [pools, setPools] = useState<OptimizedPool[]>([]);
  const [stats, setStats] = useState<Analytics>({
    totalPools: 0,
    activePools: 0,
    settledPools: 0,
    totalVolume: '0',
    bitrVolume: '0',
    sttVolume: '0',
    participants: 0,
    boostedPools: 0,
    trendingPools: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(0);

  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  /**
   * Fetch pools data
   */
  const fetchPools = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await optimizedPoolService.getPools(filters);
      
      setPools(data.pools);
      setStats(data.stats);
      setLastUpdated(Date.now());
      
    } catch (err) {
      console.error('Failed to fetch pools:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch pools');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  /**
   * Refetch data manually
   */
  const refetch = useCallback(async () => {
    await fetchPools();
  }, [fetchPools]);

  /**
   * Handle WebSocket connection status
   */
  const handleConnectionStatus = useCallback((status: { connected: boolean; connecting: boolean }) => {
    setIsConnected(status.connected);
  }, []);

  /**
   * Handle pool progress updates
   */
  const handlePoolProgress = useCallback((data: any) => {
    setPools(prevPools => 
      prevPools.map(pool => 
        pool.id === data.poolId 
          ? {
              ...pool,
              fillPercentage: data.fillPercentage,
              totalBettorStake: data.totalBettorStake,
              maxPoolSize: data.maxPoolSize,
              participants: data.participants
            }
          : pool
      )
    );
  }, []);

  /**
   * Handle new bet updates
   */
  const handleNewBet = useCallback((data: any) => {
    // Update pool with new bet data
    setPools(prevPools => 
      prevPools.map(pool => 
        pool.id === data.poolId 
          ? {
              ...pool,
              participants: pool.participants + 1,
              totalBettorStake: (parseFloat(pool.totalBettorStake) + parseFloat(data.amount)).toString(),
              fillPercentage: ((parseFloat(pool.totalBettorStake) + parseFloat(data.amount)) / parseFloat(pool.maxPoolSize)) * 100
            }
          : pool
      )
    );
  }, []);

  /**
   * Handle pool updates
   */
  const handlePoolUpdate = useCallback((data: any) => {
    setPools(prevPools => 
      prevPools.map(pool => 
        pool.id === data.poolId 
          ? {
              ...pool,
              status: data.status,
              canBet: data.canBet,
              isEventStarted: data.isEventStarted,
              isPoolFilled: data.isPoolFilled
            }
          : pool
      )
    );
  }, []);

  /**
   * Setup WebSocket listeners
   */
  useEffect(() => {
    if (!enableWebSocket) return;

    // Connect to WebSocket
    websocketClient.connect();

    // Add event listeners
    websocketClient.on('connected', handleConnectionStatus);
    websocketClient.on('disconnected', handleConnectionStatus);
    websocketClient.on('pool_progress', handlePoolProgress);
    websocketClient.on('new_bet', handleNewBet);
    websocketClient.on('pool_update', handlePoolUpdate);

    return () => {
      websocketClient.off('connected', handleConnectionStatus);
      websocketClient.off('disconnected', handleConnectionStatus);
      websocketClient.off('pool_progress', handlePoolProgress);
      websocketClient.off('new_bet', handleNewBet);
      websocketClient.off('pool_update', handlePoolUpdate);
    };
  }, [enableWebSocket, handleConnectionStatus, handlePoolProgress, handleNewBet, handlePoolUpdate]);

  /**
   * Setup auto-refresh
   */
  useEffect(() => {
    if (!autoRefresh) return;

    const scheduleRefresh = () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      refreshTimeoutRef.current = setTimeout(() => {
        fetchPools();
        scheduleRefresh(); // Schedule next refresh
      }, refreshInterval);
    };

    scheduleRefresh();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, fetchPools]);

  /**
   * Initial data fetch
   */
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      fetchPools();
    }
  }, [fetchPools]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  return {
    pools,
    stats,
    loading,
    error,
    refetch,
    isConnected,
    lastUpdated
  };
}

/**
 * Hook for individual pool with real-time updates
 */
export interface UseOptimizedPoolOptions {
  poolId: number;
  enableWebSocket?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseOptimizedPoolReturn {
  pool: OptimizedPool | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isConnected: boolean;
  lastUpdated: number;
}

export function useOptimizedPool(options: UseOptimizedPoolOptions): UseOptimizedPoolReturn {
  const {
    poolId,
    enableWebSocket = true,
    autoRefresh = true,
    refreshInterval = 30000
  } = options;

  const [pool, setPool] = useState<OptimizedPool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(0);

  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch pool data
   */
  const fetchPool = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const poolData = await optimizedPoolService.getPool(poolId);
      
      setPool(poolData);
      setLastUpdated(Date.now());
      
    } catch (err) {
      console.error('Failed to fetch pool:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch pool');
    } finally {
      setLoading(false);
    }
  }, [poolId]);

  /**
   * Refetch data manually
   */
  const refetch = useCallback(async () => {
    await fetchPool();
  }, [fetchPool]);

  /**
   * Handle WebSocket connection status
   */
  const handleConnectionStatus = useCallback((status: { connected: boolean; connecting: boolean }) => {
    setIsConnected(status.connected);
  }, []);

  /**
   * Handle pool progress updates
   */
  const handlePoolProgress = useCallback((data: any) => {
    if (data.poolId === poolId) {
      setPool(prevPool => 
        prevPool ? {
          ...prevPool,
          fillPercentage: data.fillPercentage,
          totalBettorStake: data.totalBettorStake,
          maxPoolSize: data.maxPoolSize,
          participants: data.participants
        } : null
      );
    }
  }, [poolId]);

  /**
   * Handle pool updates
   */
  const handlePoolUpdate = useCallback((data: any) => {
    if (data.poolId === poolId) {
      setPool(prevPool => 
        prevPool ? {
          ...prevPool,
          status: data.status,
          canBet: data.canBet,
          isEventStarted: data.isEventStarted,
          isPoolFilled: data.isPoolFilled
        } : null
      );
    }
  }, [poolId]);

  /**
   * Setup WebSocket listeners
   */
  useEffect(() => {
    if (!enableWebSocket) return;

    // Connect to WebSocket
    websocketClient.connect();

    // Subscribe to pool-specific updates
    websocketClient.subscribeToPoolProgress(poolId, handlePoolProgress);
    websocketClient.subscribeToPool(poolId, handlePoolUpdate);

    // Add event listeners
    websocketClient.on('connected', handleConnectionStatus);
    websocketClient.on('disconnected', handleConnectionStatus);

    return () => {
      websocketClient.unsubscribeFromPoolProgress(poolId, handlePoolProgress);
      websocketClient.unsubscribeFromPool(poolId, handlePoolUpdate);
      websocketClient.off('connected', handleConnectionStatus);
      websocketClient.off('disconnected', handleConnectionStatus);
    };
  }, [enableWebSocket, poolId, handleConnectionStatus, handlePoolProgress, handlePoolUpdate]);

  /**
   * Setup auto-refresh
   */
  useEffect(() => {
    if (!autoRefresh) return;

    const scheduleRefresh = () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      refreshTimeoutRef.current = setTimeout(() => {
        fetchPool();
        scheduleRefresh(); // Schedule next refresh
      }, refreshInterval);
    };

    scheduleRefresh();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, fetchPool]);

  /**
   * Initial data fetch
   */
  useEffect(() => {
    fetchPool();
  }, [fetchPool]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  return {
    pool,
    loading,
    error,
    refetch,
    isConnected,
    lastUpdated
  };
}

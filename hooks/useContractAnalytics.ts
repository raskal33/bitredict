import { useQuery } from '@tanstack/react-query';
import contractAnalyticsService from '@/services/contractAnalyticsService';
import unifiedAnalyticsService from '@/services/unifiedAnalyticsService';

// ============================================================================
// CONTRACT ANALYTICS HOOKS - Real-time blockchain data
// ============================================================================

interface UseContractAnalyticsOptions {
  enabled?: boolean;
  refetchInterval?: number | false;
}

/**
 * Hook for real-time contract global statistics
 */
export function useContractGlobalStats(options: UseContractAnalyticsOptions = {}) {
  const { enabled = true, refetchInterval = 30000 } = options; // 30 seconds

  return useQuery({
    queryKey: ['contract-analytics', 'global'],
    queryFn: () => contractAnalyticsService.getGlobalStats(),
    enabled,
    refetchInterval,
    staleTime: 20000, // Consider stale after 20 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
  });
}

/**
 * Hook for contract pool analytics
 */
export function useContractPoolAnalytics(
  poolId: number | undefined,
  options: UseContractAnalyticsOptions = {}
) {
  const { enabled = true, refetchInterval = 30000 } = options;

  return useQuery({
    queryKey: ['contract-analytics', 'pool', poolId],
    queryFn: () => contractAnalyticsService.getPoolAnalytics(poolId!),
    enabled: enabled && poolId !== undefined,
    refetchInterval,
    staleTime: 20000,
    gcTime: 300000,
  });
}

/**
 * Hook for contract creator statistics
 */
export function useContractCreatorStats(
  address: string | undefined,
  options: UseContractAnalyticsOptions = {}
) {
  const { enabled = true, refetchInterval = 60000 } = options; // 1 minute

  return useQuery({
    queryKey: ['contract-analytics', 'creator', address],
    queryFn: () => contractAnalyticsService.getCreatorStats(address!),
    enabled: enabled && !!address,
    refetchInterval,
    staleTime: 30000,
    gcTime: 300000,
  });
}

/**
 * Hook for market type distribution
 */
export function useMarketTypeDistribution(options: UseContractAnalyticsOptions = {}) {
  const { enabled = true, refetchInterval = 300000 } = options; // 5 minutes

  return useQuery({
    queryKey: ['contract-analytics', 'market-distribution'],
    queryFn: () => contractAnalyticsService.getMarketTypeDistribution(),
    enabled,
    refetchInterval,
    staleTime: 120000,
    gcTime: 600000,
  });
}

/**
 * Hook for oracle type distribution
 */
export function useOracleTypeDistribution(options: UseContractAnalyticsOptions = {}) {
  const { enabled = true, refetchInterval = 300000 } = options; // 5 minutes

  return useQuery({
    queryKey: ['contract-analytics', 'oracle-distribution'],
    queryFn: () => contractAnalyticsService.getOracleTypeDistribution(),
    enabled,
    refetchInterval,
    staleTime: 120000,
    gcTime: 600000,
  });
}

/**
 * Hook for active pools from contract
 */
export function useActivePools(
  limit: number = 50,
  options: UseContractAnalyticsOptions = {}
) {
  const { enabled = true, refetchInterval = 30000 } = options; // 30 seconds

  return useQuery({
    queryKey: ['contract-analytics', 'active-pools', limit],
    queryFn: () => contractAnalyticsService.getActivePools(limit),
    enabled,
    refetchInterval,
    staleTime: 15000,
    gcTime: 300000,
  });
}

// ============================================================================
// UNIFIED ANALYTICS HOOKS - Contract + Backend Combined
// ============================================================================

/**
 * Hook for unified global statistics (contract + backend)
 */
export function useUnifiedGlobalStats(
  timeframe: '24h' | '7d' | '30d' | 'all' = '7d',
  options: UseContractAnalyticsOptions = {}
) {
  const { enabled = true, refetchInterval = 30000 } = options;

  return useQuery({
    queryKey: ['unified-analytics', 'global', timeframe],
    queryFn: () => unifiedAnalyticsService.getUnifiedGlobalStats(timeframe),
    enabled,
    refetchInterval,
    staleTime: 20000,
    gcTime: 300000,
  });
}

/**
 * Hook for unified pool analytics (contract + backend)
 */
export function useUnifiedPoolAnalytics(
  poolId: number | undefined,
  options: UseContractAnalyticsOptions = {}
) {
  const { enabled = true, refetchInterval = 30000 } = options;

  return useQuery({
    queryKey: ['unified-analytics', 'pool', poolId],
    queryFn: () => unifiedAnalyticsService.getUnifiedPoolAnalytics(poolId!),
    enabled: enabled && poolId !== undefined,
    refetchInterval,
    staleTime: 20000,
    gcTime: 300000,
  });
}

/**
 * Hook for unified creator profile (contract + backend)
 */
export function useUnifiedCreatorProfile(
  address: string | undefined,
  options: UseContractAnalyticsOptions = {}
) {
  const { enabled = true, refetchInterval = 60000 } = options;

  return useQuery({
    queryKey: ['unified-analytics', 'creator', address],
    queryFn: () => unifiedAnalyticsService.getUnifiedCreatorProfile(address!),
    enabled: enabled && !!address,
    refetchInterval,
    staleTime: 30000,
    gcTime: 300000,
  });
}

/**
 * Hook for market intelligence (contract + backend)
 */
export function useMarketIntelligence(
  timeframe: '24h' | '7d' | '30d' = '7d',
  options: UseContractAnalyticsOptions = {}
) {
  const { enabled = true, refetchInterval = 300000 } = options; // 5 minutes

  return useQuery({
    queryKey: ['unified-analytics', 'market-intelligence', timeframe],
    queryFn: () => unifiedAnalyticsService.getMarketIntelligence(timeframe),
    enabled,
    refetchInterval,
    staleTime: 120000,
    gcTime: 600000,
  });
}

/**
 * Comprehensive dashboard hook combining all analytics
 */
export function useUnifiedAnalyticsDashboard(
  timeframe: '24h' | '7d' | '30d' | 'all' = '7d'
) {
  const globalStats = useUnifiedGlobalStats(timeframe);
  const marketIntel = useMarketIntelligence(
    timeframe === 'all' ? '30d' : timeframe
  );
  const activePoolsContract = useActivePools(50);

  return {
    // Data
    globalStats: globalStats.data,
    marketIntelligence: marketIntel.data,
    activePools: activePoolsContract.data,

    // Loading states
    isLoading: globalStats.isLoading || marketIntel.isLoading || activePoolsContract.isLoading,
    
    // Error states
    error: globalStats.error || marketIntel.error || activePoolsContract.error,

    // Refetch functions
    refetchAll: () => {
      globalStats.refetch();
      marketIntel.refetch();
      activePoolsContract.refetch();
    },

    // Individual loading states
    loadingStates: {
      globalStats: globalStats.isLoading,
      marketIntelligence: marketIntel.isLoading,
      activePools: activePoolsContract.isLoading,
    },
  };
}


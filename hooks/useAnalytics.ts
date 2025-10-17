import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/config/api';

// ============================================================================
// ANALYTICS HOOKS - Global platform statistics and analytics
// ============================================================================

export interface GlobalStats {
  totalVolume: number;
  activePools: number;
  totalPools: number;
  totalBets: number;
  totalUsers: number;
  totalLiquidity: number;
  averagePoolSize: number;
  platformGrowth: number;
  topCategory: string;
  recentActivity: number;
}

export interface UseAnalyticsOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

/**
 * Hook for global platform statistics
 */
export function useGlobalStats(options: UseAnalyticsOptions = {}) {
  const { enabled = true, refetchInterval = 60000 } = options; // 1 minute

  return useQuery({
    queryKey: ['analytics', 'global-stats'],
    queryFn: async (): Promise<GlobalStats> => {
      const response = await apiRequest('/api/analytics/global') as any;
      
      // Transform backend data to match our interface
      return {
        totalVolume: response?.total_volume || 0,
        activePools: response?.active_pools || 0,
        totalPools: response?.total_pools || 0,
        totalBets: response?.total_bets || 0,
        totalUsers: response?.total_users || 0,
        totalLiquidity: response?.total_liquidity || 0,
        averagePoolSize: response?.average_pool_size || 0,
        platformGrowth: response?.platform_growth || 0,
        topCategory: response?.top_category || 'General',
        recentActivity: response?.recent_activity || 0
      };
    },
    enabled,
    refetchInterval,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  });
}

/**
 * Hook for user leaderboard data
 */
export function useLeaderboard(
  metric: 'profit_loss' | 'win_rate' | 'total_volume' | 'reputation' = 'profit_loss',
  limit: number = 100,
  options: UseAnalyticsOptions = {}
) {
  const { enabled = true, refetchInterval = 180000 } = options; // 3 minutes

  return useQuery({
    queryKey: ['analytics', 'leaderboard', metric, limit],
    queryFn: async () => {
      const response = await apiRequest(`/api/analytics/leaderboard/users?sortBy=${metric}&limit=${limit}`);
      return response;
    },
    enabled,
    refetchInterval,
    staleTime: 120000, // 2 minutes
    gcTime: 300000, // 5 minutes
  });
}

/**
 * Hook for category statistics
 */
export function useCategoryStats(options: UseAnalyticsOptions = {}) {
  const { enabled = true, refetchInterval = 300000 } = options; // 5 minutes

  return useQuery({
    queryKey: ['analytics', 'category-stats'],
    queryFn: async () => {
      const response = await apiRequest('/api/analytics/category-stats');
      return response;
    },
    enabled,
    refetchInterval,
    staleTime: 180000, // 3 minutes
    gcTime: 600000, // 10 minutes
  });
}

/**
 * Hook for platform performance metrics
 */
export function usePlatformPerformance(options: UseAnalyticsOptions = {}) {
  const { enabled = true, refetchInterval = 300000 } = options; // 5 minutes

  return useQuery({
    queryKey: ['analytics', 'platform-performance'],
    queryFn: async () => {
      const response = await apiRequest('/api/analytics/platform-stats');
      return response;
    },
    enabled,
    refetchInterval,
    staleTime: 180000, // 3 minutes
    gcTime: 600000, // 10 minutes
  });
}

/**
 * Hook for market type statistics
 */
export function useMarketTypeStats(options: UseAnalyticsOptions = {}) {
  const { enabled = true, refetchInterval = 300000 } = options; // 5 minutes

  return useQuery({
    queryKey: ['analytics', 'market-type-stats'],
    queryFn: async () => {
      const response = await apiRequest('/api/analytics/market-type-stats');
      return response;
    },
    enabled,
    refetchInterval,
    staleTime: 180000, // 3 minutes
    gcTime: 600000, // 10 minutes
  });
}

/**
 * Hook for league statistics
 */
export function useLeagueStats(options: UseAnalyticsOptions = {}) {
  const { enabled = true, refetchInterval = 300000 } = options; // 5 minutes

  return useQuery({
    queryKey: ['analytics', 'league-stats'],
    queryFn: async () => {
      const response = await apiRequest('/api/analytics/league-stats');
      return response;
    },
    enabled,
    refetchInterval,
    staleTime: 180000, // 3 minutes
    gcTime: 600000, // 10 minutes
  });
}

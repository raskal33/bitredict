import { useQuery } from '@tanstack/react-query';
import AnalyticsService, { 
  GlobalStats, 
  VolumeHistoryItem, 
  CategoryDistribution,
  CategoryStats, 
  UserActivityItem, 
  TopCreator, 
  TopBettor 
} from '@/services/analyticsService';

// ============================================================================
// ANALYTICS HOOKS - Real-time data integration with React Query
// ============================================================================

export interface UseAnalyticsOptions {
  timeframe?: '24h' | '7d' | '30d' | 'all';
  enabled?: boolean;
  refetchInterval?: number;
}

/**
 * Hook for global platform statistics with real-time updates
 */
export function useGlobalStats(options: UseAnalyticsOptions = {}) {
  const { timeframe = '7d', enabled = true, refetchInterval = 30000 } = options;

  return useQuery({
    queryKey: ['analytics', 'global', timeframe],
    queryFn: () => AnalyticsService.getGlobalStats(timeframe),
    enabled,
    refetchInterval, // Refetch every 30 seconds
    staleTime: 20000, // Consider data stale after 20 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
  });
}

/**
 * Hook for volume history data for charts
 */
export function useVolumeHistory(options: { 
  timeframe?: '24h' | '7d' | '30d'; 
  enabled?: boolean; 
  refetchInterval?: number | false; 
} = {}) {
  const { timeframe = '7d', enabled = true, refetchInterval = 300000 } = options; // 5 minutes

  return useQuery({
    queryKey: ['analytics', 'volume-history', timeframe],
    queryFn: () => AnalyticsService.getVolumeHistory(timeframe),
    enabled,
    refetchInterval,
    staleTime: 120000,
    gcTime: 300000,
  });
}

/**
 * Hook for category statistics and distribution
 */
export function useCategoryStats(options: { 
  timeframe?: '24h' | '7d' | '30d' | 'all'; 
  enabled?: boolean; 
  refetchInterval?: number | false; 
} = {}) {
  const { timeframe = '7d', enabled = true, refetchInterval = 300000 } = options; // 5 minutes

  return useQuery({
    queryKey: ['analytics', 'category-stats', timeframe],
    queryFn: () => AnalyticsService.getCategoryStats(timeframe),
    enabled,
    refetchInterval,
    staleTime: 120000,
    gcTime: 300000,
  });
}

/**
 * Hook for user activity patterns
 */
export function useUserActivity(options: Pick<UseAnalyticsOptions, 'enabled' | 'refetchInterval'> = {}) {
  const { enabled = true, refetchInterval = 300000 } = options;

  return useQuery({
    queryKey: ['analytics', 'user-activity'],
    queryFn: () => AnalyticsService.getUserActivity(),
    enabled,
    refetchInterval, // Refetch every 5 minutes
    staleTime: 120000,
    gcTime: 600000,
  });
}

/**
 * Hook for top creators leaderboard
 */
export function useTopCreators(options: { 
  limit?: number; 
  sortBy?: 'total_volume' | 'win_rate' | 'total_pools';
  enabled?: boolean;
  refetchInterval?: number;
} = {}) {
  const { limit = 10, sortBy = 'total_volume', enabled = true, refetchInterval = 120000 } = options;

  return useQuery({
    queryKey: ['analytics', 'leaderboard', 'creators', limit, sortBy],
    queryFn: () => AnalyticsService.getTopCreators(limit, sortBy),
    enabled,
    refetchInterval, // Refetch every 2 minutes
    staleTime: 60000,
    gcTime: 300000,
  });
}

/**
 * Hook for top bettors leaderboard
 */
export function useTopBettors(options: { 
  limit?: number; 
  sortBy?: 'profit_loss' | 'total_volume' | 'win_rate' | 'total_bets';
  enabled?: boolean;
  refetchInterval?: number;
} = {}) {
  const { limit = 10, sortBy = 'profit_loss', enabled = true, refetchInterval = 120000 } = options;

  return useQuery({
    queryKey: ['analytics', 'leaderboard', 'bettors', limit, sortBy],
    queryFn: () => AnalyticsService.getTopBettors(limit, sortBy),
    enabled,
    refetchInterval, // Refetch every 2 minutes
    staleTime: 60000,
    gcTime: 300000,
  });
}

/**
 * Comprehensive hook that combines all analytics data for dashboard/stats pages
 */
export function useAnalyticsDashboard(options: UseAnalyticsOptions = {}) {
  const { timeframe = '7d', enabled = true } = options;

  // Only pass 'timeframe' to hooks that accept 'all' as a valid value
  // Fix type error: useGlobalStats, useVolumeHistory, useCategoryStats expect '24h' | '7d' | '30d' | undefined
  // So if timeframe is 'all', pass undefined instead

  const safeTimeframe = (['24h', '7d', '30d'].includes(timeframe) ? timeframe : undefined) as '24h' | '7d' | '30d' | undefined;

  const globalStats = useGlobalStats({ timeframe: safeTimeframe, enabled });
  const volumeHistory = useVolumeHistory({ timeframe: safeTimeframe, enabled });
  const categoryStats = useCategoryStats({ timeframe: safeTimeframe, enabled });
  const userActivity = useUserActivity({ enabled });
  const topCreators = useTopCreators({ enabled });
  const topBettors = useTopBettors({ enabled });

  return {
    // Individual queries
    globalStats: globalStats.data,
    volumeHistory: volumeHistory.data || [],
    categoryDistribution: (categoryStats.data as any)?.distribution || {},
    categoryDetails: (categoryStats.data as any)?.detailed || [],
    userActivity: userActivity.data || [],
    topCreators: topCreators.data || [],
    topBettors: topBettors.data || [],

    // Loading states
    isLoading: globalStats.isLoading || volumeHistory.isLoading || categoryStats.isLoading || 
               userActivity.isLoading || topCreators.isLoading || topBettors.isLoading,
    
    // Error states
    error: globalStats.error || volumeHistory.error || categoryStats.error || 
           userActivity.error || topCreators.error || topBettors.error,

    // Refetch functions
    refetchAll: () => {
      globalStats.refetch();
      volumeHistory.refetch();
      categoryStats.refetch();
      userActivity.refetch();
      topCreators.refetch();
      topBettors.refetch();
    },

    // Loading state for each section
    loadingStates: {
      globalStats: globalStats.isLoading,
      volumeHistory: volumeHistory.isLoading,
      categoryStats: categoryStats.isLoading,
      userActivity: userActivity.isLoading,
      topCreators: topCreators.isLoading,
      topBettors: topBettors.isLoading,
    }
  };
}

/**
 * Hook for real-time platform overview (optimized for frequent updates)
 */
export function usePlatformOverview(timeframe: '24h' | '7d' | '30d' | 'all' = '7d') {
  return useQuery({
    queryKey: ['analytics', 'platform-overview', timeframe],
    queryFn: () => AnalyticsService.getPlatformOverview(timeframe),
    refetchInterval: 30000, // Every 30 seconds for overview
    staleTime: 15000, // Consider stale after 15 seconds
    gcTime: 300000,
  });
}

/**
 * Hook for leaderboard data (creators and bettors combined)
 */
export function useLeaderboards() {
  return useQuery({
    queryKey: ['analytics', 'leaderboards'],
    queryFn: () => AnalyticsService.getLeaderboards(),
    refetchInterval: 120000, // Every 2 minutes for leaderboards
    staleTime: 60000,
    gcTime: 300000,
  });
} 
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import UserService, { 
  UserProfile, 
  UserStats, 
  UserBadge, 
  UserActivity, 
  CategoryPerformance,
  SocialStats,
  UserRanking
} from '@/services/userService';

// ============================================================================
// USER PROFILE HOOKS - Real-time user data with React Query
// ============================================================================

export interface UseUserProfileOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

/**
 * Hook for complete user profile data
 */
export function useUserProfile(address?: string, options: UseUserProfileOptions = {}) {
  const { address: connectedAddress } = useAccount();
  const userAddress = address || connectedAddress;
  const { enabled = true, refetchInterval = 60000 } = options; // 1 minute default

  return useQuery({
    queryKey: ['user-profile', userAddress],
    queryFn: () => UserService.getUserProfile(userAddress!),
    enabled: enabled && !!userAddress,
    refetchInterval,
    staleTime: 30000, // 30 seconds
    select: (data: UserProfile) => ({
      ...data,
      // Compute derived stats
      computedStats: {
        winRateFormatted: `${data.stats.winRate.toFixed(1)}%`,
        profitLossFormatted: UserService.formatCurrency(data.stats.profitLoss),
        totalVolumeFormatted: UserService.formatCurrency(data.stats.totalVolume),
        averageBetSizeFormatted: UserService.formatCurrency(data.stats.averageBetSize),
        topBadge: UserService.getTopBadge(data.badges),
        activeBadgeCount: data.badges.filter(b => b.isActive).length,
        recentActivityCount: data.recentActivity.length
      }
    })
  });
}

/**
 * Hook for user's current connected profile
 */
export function useMyProfile(options: UseUserProfileOptions = {}) {
  const { address } = useAccount();
  return useUserProfile(address, {
    ...options,
    refetchInterval: options.refetchInterval || 30000 // More frequent for own profile
  });
}

/**
 * Hook for user badges and achievements
 */
export function useUserBadges(address?: string, options: UseUserProfileOptions = {}) {
  const { address: connectedAddress } = useAccount();
  const userAddress = address || connectedAddress;
  const { enabled = true, refetchInterval = 120000 } = options; // 2 minutes

  return useQuery({
    queryKey: ['user-badges', userAddress],
    queryFn: () => UserService.getUserBadges(userAddress!),
    enabled: enabled && !!userAddress,
    refetchInterval,
    staleTime: 60000,
    select: (badges: UserBadge[]) => {
      const activeBadges = badges.filter(b => b.isActive);
      const badgesByCategory = activeBadges.reduce((acc, badge) => {
        if (!acc[badge.badgeCategory]) acc[badge.badgeCategory] = [];
        acc[badge.badgeCategory].push(badge);
        return acc;
      }, {} as Record<string, UserBadge[]>);

      const badgesByRarity = activeBadges.reduce((acc, badge) => {
        if (!acc[badge.rarity]) acc[badge.rarity] = [];
        acc[badge.rarity].push(badge);
        return acc;
      }, {} as Record<string, UserBadge[]>);

      return {
        all: badges,
        active: activeBadges,
        byCategory: badgesByCategory,
        byRarity: badgesByRarity,
        topBadge: UserService.getTopBadge(badges),
        totalScore: activeBadges.reduce((sum, badge) => {
          const scores = { legendary: 100, epic: 50, rare: 25, uncommon: 10, common: 5 };
          return sum + (scores[badge.rarity] || 0);
        }, 0)
      };
    }
  });
}

/**
 * Hook for user activity timeline
 */
export function useUserActivity(address?: string, limit: number = 20, options: UseUserProfileOptions = {}) {
  const { address: connectedAddress } = useAccount();
  const userAddress = address || connectedAddress;
  const { enabled = true, refetchInterval = 30000 } = options;

  return useQuery({
    queryKey: ['user-activity', userAddress, limit],
    queryFn: () => UserService.getUserActivity(userAddress!, limit),
    enabled: enabled && !!userAddress,
    refetchInterval,
    staleTime: 15000,
    select: (activities: UserActivity[]) => ({
      activities,
      recentWins: activities.filter(a => a.type === 'bet_won').length,
      recentLosses: activities.filter(a => a.type === 'bet_lost').length,
      recentPools: activities.filter(a => a.type === 'pool_created').length,
      totalActivities: activities.length
    })
  });
}

/**
 * Hook for user reputation and access level
 */
export function useUserReputation(address?: string, options: UseUserProfileOptions = {}) {
  const { address: connectedAddress } = useAccount();
  const userAddress = address || connectedAddress;
  const { enabled = true, refetchInterval = 60000 } = options;

  return useQuery({
    queryKey: ['user-reputation', userAddress],
    queryFn: () => UserService.getUserReputation(userAddress!),
    enabled: enabled && !!userAddress,
    refetchInterval,
    staleTime: 30000,
    select: (data) => ({
      ...data,
      // Add percentage to next level
      progressToNext: (() => {
        if (data.reputation >= 150) return 100;
        if (data.reputation >= 100) return ((data.reputation - 100) / 50) * 100;
        if (data.reputation >= 40) return ((data.reputation - 40) / 60) * 100;
        return (data.reputation / 40) * 100;
      })(),
      nextMilestone: (() => {
        if (data.reputation >= 150) return null;
        if (data.reputation >= 100) return { level: 'Verified', points: 150 };
        if (data.reputation >= 40) return { level: 'Trusted', points: 100 };
        return { level: 'Elementary', points: 40 };
      })()
    })
  });
}

/**
 * Hook for category performance analytics
 */
export function useCategoryPerformance(address?: string, options: UseUserProfileOptions = {}) {
  const { address: connectedAddress } = useAccount();
  const userAddress = address || connectedAddress;
  const { enabled = true, refetchInterval = 120000 } = options;

  return useQuery({
    queryKey: ['category-performance', userAddress],
    queryFn: () => UserService.getCategoryPerformance(userAddress!),
    enabled: enabled && !!userAddress,
    refetchInterval,
    staleTime: 60000,
    select: (categories: CategoryPerformance[]) => {
      const bestCategory = categories.reduce((best, current) => 
        current.winRate > best.winRate ? current : best, categories[0]);
      
      const totalVolume = categories.reduce((sum, cat) => sum + cat.totalVolume, 0);
      const totalBets = categories.reduce((sum, cat) => sum + cat.totalBets, 0);
      
      return {
        categories,
        bestCategory,
        totalVolume,
        totalBets,
        diversityScore: categories.length,
        overallWinRate: totalBets > 0 ? 
          categories.reduce((sum, cat) => sum + cat.wonBets, 0) / totalBets * 100 : 0
      };
    }
  });
}

/**
 * Hook for social statistics
 */
export function useSocialStats(address?: string, options: UseUserProfileOptions = {}) {
  const { address: connectedAddress } = useAccount();
  const userAddress = address || connectedAddress;
  const { enabled = true, refetchInterval = 300000 } = options; // 5 minutes

  return useQuery({
    queryKey: ['social-stats', userAddress],
    queryFn: () => UserService.getSocialStats(userAddress!),
    enabled: enabled && !!userAddress,
    refetchInterval,
    staleTime: 120000,
    select: (stats: SocialStats) => ({
      ...stats,
      // Compute engagement metrics
      engagementRatio: stats.totalComments > 0 ? 
        stats.totalLikesReceived / stats.totalComments : 0,
      contributionScore: stats.totalComments + stats.totalReflections,
      socialRank: Math.min(100, stats.communityInfluenceScore / 10)
    })
  });
}

/**
 * Hook for leaderboard rankings
 */
export function useLeaderboard(
  metric: 'profit_loss' | 'win_rate' | 'total_volume' | 'reputation' = 'profit_loss',
  limit: number = 100,
  options: UseUserProfileOptions = {}
) {
  const { enabled = true, refetchInterval = 180000 } = options; // 3 minutes

  return useQuery({
    queryKey: ['leaderboard', metric, limit],
    queryFn: () => UserService.getLeaderboard(metric, limit),
    enabled,
    refetchInterval,
    staleTime: 120000,
    select: (rankings: UserRanking[]) => ({
      rankings,
      topPerformers: rankings.slice(0, 10),
      totalUsers: rankings.length,
      averageValue: rankings.reduce((sum, user) => sum + user.value, 0) / rankings.length
    })
  });
}

/**
 * Hook for user's position in leaderboard
 */
export function useMyLeaderboardPosition(
  metric: 'profit_loss' | 'win_rate' | 'total_volume' | 'reputation' = 'profit_loss',
  options: UseUserProfileOptions = {}
) {
  const { address } = useAccount();
  const { data: leaderboard } = useLeaderboard(metric, 1000, options);

  return {
    position: leaderboard?.rankings.findIndex(user => user.address.toLowerCase() === address?.toLowerCase()) ?? -1,
    isInTop100: (leaderboard?.rankings.findIndex(user => user.address.toLowerCase() === address?.toLowerCase()) ?? -1) < 100,
    isInTop10: (leaderboard?.rankings.findIndex(user => user.address.toLowerCase() === address?.toLowerCase()) ?? -1) < 10,
    percentile: leaderboard ? 
      ((leaderboard.rankings.findIndex(user => user.address.toLowerCase() === address?.toLowerCase()) + 1) / leaderboard.totalUsers) * 100 : 0
  };
}

/**
 * Hook for user portfolio summary
 */
export function useUserPortfolio(address?: string, options: UseUserProfileOptions = {}) {
  const { address: connectedAddress } = useAccount();
  const userAddress = address || connectedAddress;
  const { enabled = true, refetchInterval = 30000 } = options;

  return useQuery({
    queryKey: ['user-portfolio', userAddress],
    queryFn: () => UserService.getUserPortfolio(userAddress!),
    enabled: enabled && !!userAddress,
    refetchInterval,
    staleTime: 15000
  });
}

/**
 * Utility hook to invalidate and refetch user data
 */
export function useRefreshUserData() {
  const queryClient = useQueryClient();
  const { address } = useAccount();

  return {
    refreshProfile: () => {
      if (address) {
        queryClient.invalidateQueries({ queryKey: ['user-profile', address] });
      }
    },
    refreshBadges: () => {
      if (address) {
        queryClient.invalidateQueries({ queryKey: ['user-badges', address] });
      }
    },
    refreshActivity: () => {
      if (address) {
        queryClient.invalidateQueries({ queryKey: ['user-activity', address] });
      }
    },
    refreshAll: () => {
      if (address) {
        queryClient.invalidateQueries({ queryKey: ['user-profile'] });
        queryClient.invalidateQueries({ queryKey: ['user-badges'] });
        queryClient.invalidateQueries({ queryKey: ['user-activity'] });
        queryClient.invalidateQueries({ queryKey: ['category-performance'] });
        queryClient.invalidateQueries({ queryKey: ['social-stats'] });
        queryClient.invalidateQueries({ queryKey: ['user-portfolio'] });
      }
    }
  };
} 
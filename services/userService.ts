import { apiRequest, API_CONFIG } from '@/config/api';

// ============================================================================
// USER SERVICE - Complete user profile and performance data integration
// ============================================================================

export interface UserStats {
  totalBets: number;
  wonBets: number;
  winRate: number;
  profitLoss: number;
  totalVolume: number;
  averageBetSize: number;
  biggestWin: number;
  biggestLoss: number;
  currentStreak: number;
  maxWinStreak: number;
  maxLossStreak: number;
  streakIsWin: boolean;
  favoriteCategory: string;
  totalPoolsCreated: number;
  poolsWon: number;
  reputation: number;
  riskScore: number;
  joinedAt: string;
  lastActive: string;
}

export interface UserBadge {
  id: number;
  badgeType: string;
  badgeCategory: 'creator' | 'bettor' | 'community' | 'special';
  title: string;
  description: string;
  iconName: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  earnedAt: string;
  isActive: boolean;
  expiresAt?: string;
}

export interface UserActivity {
  id: number;
  type: 'bet_placed' | 'bet_won' | 'bet_lost' | 'pool_created' | 'pool_settled' | 'achievement_unlocked' | 'staking_event';
  description: string;
  amount?: string;
  poolId?: string;
  category?: string;
  timestamp: string;
  blockNumber?: number;
  txHash?: string;
}

export interface CategoryPerformance {
  category: string;
  totalBets: number;
  wonBets: number;
  winRate: number;
  totalVolume: number;
  profitLoss: number;
  avgBetSize: number;
  bestStreak: number;
}

export interface SocialStats {
  totalComments: number;
  totalLikesGiven: number;
  totalLikesReceived: number;
  totalReflections: number;
  communityInfluenceScore: number;
  weeklyEngagementScore: number;
  favoriteDiscussionCategory: string;
  lastSocialActivity: string;
}

export interface UserProfile {
  address: string;
  stats: UserStats;
  badges: UserBadge[];
  recentActivity: UserActivity[];
  categoryPerformance: CategoryPerformance[];
  socialStats: SocialStats;
  stakingData?: {
    totalStaked: string;
    totalRewards: string;
    activeStakes: number;
  };
  oddysseyStats?: {
    totalSlips: number;
    winRate: number;
    totalWinnings: string;
    currentRank: number;
  };
}

export interface UserRanking {
  address: string;
  shortAddress: string;
  rank: number;
  metric: 'profit_loss' | 'win_rate' | 'total_volume' | 'reputation';
  value: number;
  badge?: string;
  reputation: number;
}

class UserService {
  /**
   * Get complete user profile with all stats and data
   */
  async getUserProfile(address: string): Promise<UserProfile> {
    try {
      const [basicProfile, badges, activity, categoryPerf, socialStats, stakingData] = await Promise.all([
        this.getUserBasicStats(address),
        this.getUserBadges(address),
        this.getUserActivity(address),
        this.getCategoryPerformance(address),
        this.getSocialStats(address),
        this.getStakingData(address)
      ]);

      return {
        address,
        stats: basicProfile,
        badges,
        recentActivity: activity,
        categoryPerformance: categoryPerf,
        socialStats,
        stakingData
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  /**
   * Get basic user statistics and performance metrics
   */
  async getUserBasicStats(address: string): Promise<UserStats> {
    const response = await apiRequest(`${API_CONFIG.endpoints.users}/${address}`);
    // Type guard: ensure response is an object
    if (typeof response !== 'object' || response === null) {
      throw new Error('Invalid response from user stats API');
    }

    // Type assertions for expected fields
    const totalBets = Number((response as any).total_bets) || 0;
    const wonBets = Number((response as any).won_bets) || 0;
    const profitLoss = parseFloat((response as any).profit_loss ?? '0');
    const totalVolume = parseFloat((response as any).total_volume ?? '0');

    return {
      totalBets,
      wonBets,
      winRate: totalBets > 0 ? (wonBets / totalBets) * 100 : 0,
      profitLoss,
      totalVolume,
      averageBetSize: parseFloat((response as any).avg_bet_size ?? '0'),
      biggestWin: parseFloat((response as any).biggest_win ?? '0'),
      biggestLoss: parseFloat((response as any).biggest_loss ?? '0'),
      currentStreak: (response as any).current_streak ?? 0,
      maxWinStreak: (response as any).max_win_streak ?? 0,
      maxLossStreak: (response as any).max_loss_streak ?? 0,
      streakIsWin: (response as any).streak_is_win ?? false,
      favoriteCategory: (response as any).favorite_category ?? 'General',
      totalPoolsCreated: (response as any).total_pools_created ?? 0,
      poolsWon: (response as any).pools_won ?? 0,
      reputation: (response as any).reputation ?? 40,
      riskScore: (response as any).risk_score ?? 500,
      joinedAt: (response as any).joined_at ?? null,
      lastActive: (response as any).last_active ?? null
    };
  }

  /**
   * Get user badges and achievements
   */
  async getUserBadges(address: string): Promise<UserBadge[]> {
    const response = await apiRequest(`${API_CONFIG.endpoints.users}/${address}/badges`);
    if (!Array.isArray(response)) {
      throw new Error('Invalid response from user badges API');
    }
    return response.map((badge: any) => ({
      id: badge.id,
      badgeType: badge.badge_type,
      badgeCategory: badge.badge_category,
      title: badge.title,
      description: badge.description,
      iconName: badge.icon_name,
      rarity: badge.rarity,
      earnedAt: badge.earned_at,
      isActive: badge.is_active,
      expiresAt: badge.expires_at
    }));
  }

  /**
   * Get user activity history
   */
  async getUserActivity(address: string, limit: number = 20): Promise<UserActivity[]> {
    const response = await apiRequest(`${API_CONFIG.endpoints.users}/${address}/activity?limit=${limit}`);

    if (!Array.isArray(response)) {
      throw new Error('Invalid response from user activity API');
    }

    return response.map((activity: any) => ({
      id: activity.id,
      type: activity.activity_type,
      description: activity.description,
      amount: activity.amount,
      poolId: activity.pool_id,
      category: activity.category,
      timestamp: activity.timestamp,
      blockNumber: activity.block_number,
      txHash: activity.tx_hash
    }));
  }

  /**
   * Get user performance by category
   */
  async getCategoryPerformance(address: string): Promise<CategoryPerformance[]> {
    const response = await apiRequest(`${API_CONFIG.endpoints.users}/${address}/category-performance`);
    if (!Array.isArray(response)) {
      throw new Error('Invalid response from category performance API');
    }
    return response.map((category: any) => ({
      category: category.category,
      totalBets: category.total_bets,
      wonBets: category.won_bets,
      winRate: category.total_bets > 0 ? (category.won_bets / category.total_bets) * 100 : 0,
      totalVolume: parseFloat(category.total_volume || '0'),
      profitLoss: parseFloat(category.profit_loss || '0'),
      avgBetSize: parseFloat(category.avg_bet_size || '0'),
      bestStreak: category.best_streak || 0
    }));
  }

  /**
   * Get user social statistics
   */
  async getSocialStats(address: string): Promise<SocialStats> {
    const response = await apiRequest(`${API_CONFIG.endpoints.social}/users/${address}/social-stats`);
    
    return {
      totalComments: typeof (response as any).total_comments === 'number' ? (response as any).total_comments : 0,
      totalLikesGiven: typeof (response as any).total_likes_given === 'number' ? (response as any).total_likes_given : 0,
      totalLikesReceived: typeof (response as any).total_likes_received === 'number' ? (response as any).total_likes_received : 0,
      totalReflections: typeof (response as any).total_reflections === 'number' ? (response as any).total_reflections : 0,
      communityInfluenceScore: typeof (response as any).community_influence_score === 'number' ? (response as any).community_influence_score : 0,
      weeklyEngagementScore: typeof (response as any).weekly_engagement_score === 'number' ? (response as any).weekly_engagement_score : 0,
      favoriteDiscussionCategory: typeof (response as any).favorite_discussion_category === 'string' ? (response as any).favorite_discussion_category : 'general',
      lastSocialActivity: (response as any).last_social_activity ?? null
    };
  }

  /**
   * Get user staking data summary
   */
  async getStakingData(address: string) {
    try {
      const response = await apiRequest(`${API_CONFIG.endpoints.staking}/user/${address}`);
      
      // Ensure response is typed to avoid 'unknown' errors
      const stakingResponse = response as {
        summary?: {
          totalStaked?: string;
          totalClaimedRewards?: string;
          activeStakes?: number;
        };
      };

      return {
        totalStaked: stakingResponse.summary?.totalStaked ?? '0',
        totalRewards: stakingResponse.summary?.totalClaimedRewards ?? '0',
        activeStakes: stakingResponse.summary?.activeStakes ?? 0
      };
      return {
        totalStaked: '0',
        totalRewards: '0',
        activeStakes: 0
      };
    } catch (error) {
      return {
        totalStaked: '0',
        totalRewards: '0',
        activeStakes: 0
      };
    }
  }

  /**
   * Get user reputation details and access level
   */
  async getUserReputation(address: string) {
    const response = await apiRequest(`${API_CONFIG.endpoints.reputation}/user/${address}`);
    // Backend returns { success: true, data: {...} }
    const repData = (response as any)?.data || response;
    
    return {
      reputation: repData.reputation ?? 40,
      accessLevel: repData.tier ?? 'ACTIVE',
      accessLevelName: repData.tier ?? 'ACTIVE',
      capabilities: repData.privileges ?? [],
      canCreateGuided: repData.canCreateGuided ?? false,
      canCreateOpen: repData.canCreateOpen ?? false,
      canPropose: repData.canPropose ?? false,
      joinedAt: repData.lastUpdated ?? '',
      lastActive: repData.lastUpdated ?? ''
    };
  }

  /**
   * Get leaderboard rankings for different metrics
   */
  async getLeaderboard(
    metric: 'profit_loss' | 'win_rate' | 'total_volume' | 'reputation' = 'profit_loss',
    limit: number = 100
  ): Promise<UserRanking[]> {
    const response = await apiRequest(`${API_CONFIG.endpoints.analytics}/leaderboard/users?sortBy=${metric}&limit=${limit}`);

    // Explicitly type the response to avoid 'unknown' errors
    const users = response as Array<{
      address: string;
      [key: string]: any;
    }>;

    return users.map((user, index) => ({
      address: user.address,
      shortAddress: `${user.address.slice(0, 6)}...${user.address.slice(-4)}`,
      rank: index + 1,
      metric,
      value: user[metric] || 0,
      badge: user.topBadge,
      reputation: user.reputation || 40
    }));
  }

  /**
   * Get user portfolio summary
   */
  async getUserPortfolio(address: string) {
    const response = await apiRequest(`${API_CONFIG.endpoints.users}/${address}/portfolio`);
    
    // Explicitly type the response to avoid 'unknown' errors
    const portfolio = response as {
      activeBets?: any[];
      activePoolsCreated?: any[];
      totalValue?: string | number;
      potentialWinnings?: string | number;
      riskedAmount?: string | number;
    };

    return {
      activeBets: portfolio.activeBets ?? [],
      activePoolsCreated: portfolio.activePoolsCreated ?? [],
      totalValue: parseFloat(String(portfolio.totalValue ?? '0')),
      potentialWinnings: parseFloat(String(portfolio.potentialWinnings ?? '0')),
      riskedAmount: parseFloat(String(portfolio.riskedAmount ?? '0'))
    };
  }

  /**
   * Format large numbers for display
   */
  formatNumber(value: number): string {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  }

  /**
   * Format currency amounts
   */
  formatCurrency(value: number, currency: 'STT' | 'BITR' = 'STT'): string {
    const formatted = value >= 1000 ? this.formatNumber(value) : value.toFixed(2);
    return `${formatted} ${currency}`;
  }

  /**
   * Get badge rarity color
   */
  getBadgeRarityColor(rarity: string): string {
    switch (rarity) {
      case 'legendary': return 'text-orange-400 border-orange-400';
      case 'epic': return 'text-purple-400 border-purple-400';
      case 'rare': return 'text-blue-400 border-blue-400';
      case 'uncommon': return 'text-green-400 border-green-400';
      case 'common': return 'text-gray-400 border-gray-400';
      default: return 'text-gray-400 border-gray-400';
    }
  }

  /**
   * Check if user has specific badge
   */
  hasBadge(badges: UserBadge[], badgeType: string): boolean {
    return badges.some(badge => badge.badgeType === badgeType && badge.isActive);
  }

  /**
   * Get highest rarity badge
   */
  getTopBadge(badges: UserBadge[]): UserBadge | null {
    const rarityOrder = ['legendary', 'epic', 'rare', 'uncommon', 'common'];
    const activeBadges = badges.filter(badge => badge.isActive);
    
    for (const rarity of rarityOrder) {
      const badge = activeBadges.find(b => b.rarity === rarity);
      if (badge) return badge;
    }
    
    return null;
  }
}

export default new UserService(); 
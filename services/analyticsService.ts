import { apiRequest, API_CONFIG } from '@/config/api';

// ============================================================================
// ANALYTICS SERVICE - Real-time platform statistics integration
// ============================================================================

export interface GlobalStats {
  totalVolume: number;
  totalPools: number;
  totalBets: number;
  activePools: number;
}

export interface VolumeHistoryItem {
  date: string;
  volume: number;
  pools: number;
  users: number;
}

export interface CategoryStats {
  category: string;
  poolCount: number;
  totalVolume: number;
  avgPoolSize: number;
  participantCount: number;
}

export interface CategoryDistribution {
  [category: string]: number;
}

export interface UserActivityItem {
  hour: string;
  users: number;
  volume: number;
  bets: number;
}

export interface TopCreator {
  address: string;
  shortAddress: string;
  reputation: number;
  stats: {
    totalPools: number;
    totalVolume: number;
    winRate: number;
  };
}

export interface TopBettor {
  address: string;
  shortAddress: string;
  stats: {
    totalBets: number;
    wonBets: number;
    totalStaked: number;
    totalWinnings: number;
    winRate: number;
    profitLoss: number;
    biggestWin: number;
    currentStreak: number;
    maxWinStreak: number;
    streakIsWin: boolean;
  };
  joinedAt: string;
}

export interface AnalyticsResponse<T> {
  success: boolean;
  data: T;
  timeframe?: string;
}

export class AnalyticsService {
  private static baseURL = API_CONFIG.endpoints.analytics || '/api/analytics';

  /**
   * Get global platform statistics
   */
  static async getGlobalStats(timeframe: '24h' | '7d' | '30d' | 'all' = '7d'): Promise<GlobalStats> {
    const response = await apiRequest<AnalyticsResponse<GlobalStats>>(
      `${this.baseURL}/global?timeframe=${timeframe}`
    );
    return response.data;
  }

  /**
   * Get volume history for charts
   */
  static async getVolumeHistory(timeframe: '24h' | '7d' | '30d' = '7d'): Promise<VolumeHistoryItem[]> {
    const response = await apiRequest<AnalyticsResponse<VolumeHistoryItem[]>>(
      `${this.baseURL}/volume-history?timeframe=${timeframe}`
    );
    return response.data;
  }

  /**
   * Get category statistics and distribution
   */
  static async getCategoryStats(timeframe: '24h' | '7d' | '30d' | 'all' = '7d'): Promise<{
    distribution: CategoryDistribution;
    detailed: CategoryStats[];
  }> {
    const response = await apiRequest<AnalyticsResponse<{
      distribution: CategoryDistribution;
      detailed: CategoryStats[];
    }>>(
      `${this.baseURL}/categories?timeframe=${timeframe}`
    );
    return response.data;
  }

  /**
   * Get top pool creators leaderboard
   */
  static async getTopCreators(limit: number = 10, sortBy: 'total_volume' | 'win_rate' | 'total_pools' = 'total_volume'): Promise<TopCreator[]> {
    const response = await apiRequest<AnalyticsResponse<TopCreator[]>>(
      `${this.baseURL}/leaderboard/creators?limit=${limit}&sortBy=${sortBy}`
    );
    return response.data;
  }

  /**
   * Get top bettors leaderboard
   */
  static async getTopBettors(limit: number = 10, sortBy: 'profit_loss' | 'total_volume' | 'win_rate' | 'total_bets' = 'profit_loss'): Promise<TopBettor[]> {
    const response = await apiRequest<AnalyticsResponse<TopBettor[]>>(
      `${this.baseURL}/leaderboard/bettors?limit=${limit}&sortBy=${sortBy}`
    );
    return response.data;
  }

  /**
   * Get hourly user activity patterns
   */
  static async getUserActivity(): Promise<UserActivityItem[]> {
    const response = await apiRequest<AnalyticsResponse<UserActivityItem[]>>(
      `${this.baseURL}/user-activity`
    );
    return response.data;
  }

  /**
   * Get platform overview stats (combination of multiple endpoints)
   */
  static async getPlatformOverview(timeframe: '24h' | '7d' | '30d' | 'all' = '7d') {
    try {
      const [globalStats, volumeHistory, categoryStats, userActivity] = await Promise.all([
        this.getGlobalStats(timeframe),
        this.getVolumeHistory(timeframe === 'all' ? '30d' : timeframe),
        this.getCategoryStats(timeframe),
        this.getUserActivity()
      ]);

      return {
        globalStats,
        volumeHistory,
        categoryDistribution: categoryStats.distribution,
        categoryDetails: categoryStats.detailed,
        userActivity
      };
    } catch (error) {
      console.error('Error fetching platform overview:', error);
      throw error;
    }
  }

  /**
   * Get leaderboard data (creators and bettors)
   */
  static async getLeaderboards() {
    try {
      const [topCreators, topBettors] = await Promise.all([
        this.getTopCreators(10),
        this.getTopBettors(10)
      ]);

      return {
        topCreators,
        topBettors
      };
    } catch (error) {
      console.error('Error fetching leaderboards:', error);
      throw error;
    }
  }
}

export default AnalyticsService; 
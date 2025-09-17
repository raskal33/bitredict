/**
 * Leaderboard Service
 * 
 * Handles API calls to the backend leaderboard system
 * Provides type-safe interfaces for leaderboard data
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface LeaderboardEntry {
  address: string;
  rank: number;
  score: number;
  poolsCreated?: number;
  totalWon?: number;
  successRate?: number;
  volumeGenerated?: number;
  reputation?: number;
  totalActions?: number;
  influenceScore?: number;
  predictionStreak?: number;
  isVerified?: boolean;
  lastUpdated?: string;
}

export interface UserStats {
  address: string;
  totalPoolsCreated: number;
  totalBetsPlaced: number;
  totalStakedAmount: number;
  totalWonAmount: number;
  successRate: number;
  totalVolumeGenerated: number;
  reputationScore: number;
  influenceScore: number;
  predictionStreak: number;
  isVerifiedCreator: boolean;
  lastUpdated: string;
}

export interface UserRank {
  address: string;
  leaderboardType: string;
  metric: string;
  rank: number;
  score: number;
  additionalData: any;
  timestamp: string;
}

export interface LeaderboardResponse {
  success: boolean;
  data: {
    leaderboard: LeaderboardEntry[];
    metric?: string;
    limit: number;
    total: number;
    timestamp: string;
  };
}

export interface UserStatsResponse {
  success: boolean;
  data: UserStats;
}

export interface UserRankResponse {
  success: boolean;
  data: UserRank;
}

export class LeaderboardService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  /**
   * Get guided markets leaderboard
   */
  async getGuidedMarketsLeaderboard(
    metric: 'total_staked' | 'total_won' | 'success_rate' | 'volume_generated' = 'total_staked',
    limit: number = 30,
    useCache: boolean = true
  ): Promise<LeaderboardResponse> {
    try {
      const params = new URLSearchParams({
        metric,
        limit: limit.toString(),
        useCache: useCache.toString()
      });

      const response = await fetch(`${this.baseUrl}/api/leaderboards/guided-markets?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching guided markets leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get reputation leaderboard
   */
  async getReputationLeaderboard(
    limit: number = 30,
    useCache: boolean = true
  ): Promise<LeaderboardResponse> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        useCache: useCache.toString()
      });

      const response = await fetch(`${this.baseUrl}/api/leaderboards/reputation?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching reputation leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get user's rank in leaderboards
   */
  async getUserRank(
    address: string,
    leaderboardType: 'guided_markets' | 'reputation' = 'guided_markets',
    metric: 'total_staked' | 'total_won' | 'success_rate' | 'volume_generated' = 'total_staked'
  ): Promise<UserRankResponse> {
    try {
      const params = new URLSearchParams({
        leaderboardType,
        metric
      });

      const response = await fetch(`${this.baseUrl}/api/leaderboards/user/${address}/rank?${params}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('User not found in leaderboard');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching user rank:', error);
      throw error;
    }
  }

  /**
   * Get user's aggregated statistics
   */
  async getUserStats(address: string): Promise<UserStatsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/leaderboards/user/${address}/stats`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('User statistics not found');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  }

  /**
   * Refresh leaderboard caches
   */
  async refreshLeaderboardCache(
    leaderboardType: 'guided_markets' | 'reputation' | 'all' = 'all',
    metric: 'total_staked' | 'total_won' | 'success_rate' | 'volume_generated' = 'total_staked',
    limit: number = 100
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/leaderboards/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leaderboardType,
          metric,
          limit
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error refreshing leaderboard cache:', error);
      throw error;
    }
  }

  /**
   * Get leaderboard metrics summary
   */
  async getLeaderboardMetrics(): Promise<{ success: boolean; data: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/leaderboards/metrics`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching leaderboard metrics:', error);
      throw error;
    }
  }

  /**
   * Health check for leaderboard service
   */
  async healthCheck(): Promise<{ success: boolean; data: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/leaderboards/health`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking leaderboard health:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const leaderboardService = new LeaderboardService();

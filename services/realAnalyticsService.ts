/**
 * Real Analytics Service
 * 
 * Connects to actual backend endpoints instead of mock data
 * Properly handles BigInt serialization and data types
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://bitredict-backend.fly.dev';

// Helper to safely parse BigInt values
function parseBigIntSafe(value: any): string {
  if (value === null || value === undefined) return '0';
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'string') {
    // Handle scientific notation
    if (value.includes('e') || value.includes('E')) {
      const num = Number(value);
      return Math.floor(num).toString();
    }
    return value;
  }
  if (typeof value === 'number') {
    return Math.floor(value).toString();
  }
  return '0';
}

// Helper to safely parse numbers
function parseNumberSafe(value: any): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value === 'bigint') {
    return Number(value);
  }
  return 0;
}

export interface GlobalStats {
  totalVolume: number;
  totalPools: number;
  totalBets: number;
  activePools: number;
  totalUsers?: number;
  totalSlips?: number;
  averageWinRate?: number;
}

export interface OddysseyStats {
  totalSlips: number;
  uniquePlayers: number;
  averageAccuracy: number;
  evaluatedSlips: number;
  perfectSlips: number;
  cyclesCompleted: number;
}

export interface LeaderboardEntry {
  user_address: string;
  slips_count: number;
  accuracy_percentage: number;
  correct_predictions: number;
  rank?: number;
}

export interface UserPerformance {
  address: string;
  totalSlips: number;
  winRate: number;
  averageScore: number;
  rank?: number;
}

export interface CategoryStats {
  category: string;
  poolCount: number;
  totalVolume: number;
  percentage: number;
}

export class RealAnalyticsService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private CACHE_DURATION = 30000; // 30 seconds

  /**
   * Get global platform statistics
   */
  async getGlobalStats(timeframe: '24h' | '7d' | '30d' | 'all' = '7d'): Promise<GlobalStats> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/analytics/global?timeframe=${timeframe}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const result = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error('Invalid response format');
      }

      return {
        totalVolume: parseNumberSafe(result.data.totalVolume),
        totalPools: parseNumberSafe(result.data.totalPools),
        totalBets: parseNumberSafe(result.data.totalBets),
        activePools: parseNumberSafe(result.data.activePools)
      };
    } catch (error) {
      console.error('❌ Error fetching global stats:', error);
      // Return zero values instead of mock data
      return {
        totalVolume: 0,
        totalPools: 0,
        totalBets: 0,
        activePools: 0
      };
    }
  }

  /**
   * Get Oddyssey statistics
   */
  async getOddysseyStats(timeframe: '7d' | '30d' | '90d' = '30d'): Promise<OddysseyStats> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/analytics/oddyssey?timeframe=${timeframe}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const result = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error('Invalid response format');
      }

      return {
        totalSlips: parseNumberSafe(result.data.overview.total_slips),
        uniquePlayers: parseNumberSafe(result.data.overview.unique_players),
        averageAccuracy: parseNumberSafe(result.data.overview.platform_accuracy),
        evaluatedSlips: parseNumberSafe(result.data.overview.total_evaluated),
        perfectSlips: parseNumberSafe(result.data.trends?.perfect_slips || 0),
        cyclesCompleted: parseNumberSafe(result.data.overview.cycles_completed || 0)
      };
    } catch (error) {
      console.error('❌ Error fetching Oddyssey stats:', error);
      return {
        totalSlips: 0,
        uniquePlayers: 0,
        averageAccuracy: 0,
        evaluatedSlips: 0,
        perfectSlips: 0,
        cyclesCompleted: 0
      };
    }
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(
    sortBy: 'accuracy' | 'volume' | 'recent' = 'accuracy',
    timeframe: '7d' | '30d' | 'all' = 'all',
    limit: number = 50
  ): Promise<LeaderboardEntry[]> {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/analytics/leaderboard?sortBy=${sortBy}&timeframe=${timeframe}&limit=${limit}&minSlips=5`
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const result = await response.json();
      
      if (!result.success || !result.data || !Array.isArray(result.data.leaderboard)) {
        throw new Error('Invalid response format');
      }

      return result.data.leaderboard.map((entry: any, index: number) => ({
        user_address: entry.user_address || entry.address || '0x0',
        slips_count: parseNumberSafe(entry.slips_count),
        accuracy_percentage: parseNumberSafe(entry.accuracy_percentage),
        correct_predictions: parseNumberSafe(entry.correct_predictions),
        rank: index + 1
      }));
    } catch (error) {
      console.error('❌ Error fetching leaderboard:', error);
      return [];
    }
  }

  /**
   * Get user performance
   */
  async getUserPerformance(address: string): Promise<UserPerformance | null> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/analytics/user/${address}/performance`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const result = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error('Invalid response format');
      }

      return {
        address,
        totalSlips: parseNumberSafe(result.data.totalSlips || result.data.total_slips),
        winRate: parseNumberSafe(result.data.winRate || result.data.win_rate),
        averageScore: parseNumberSafe(result.data.averageScore || result.data.average_score),
        rank: parseNumberSafe(result.data.rank)
      };
    } catch (error) {
      console.error('❌ Error fetching user performance:', error);
      return null;
    }
  }

  /**
   * Get category statistics
   */
  async getCategoryStats(timeframe: '7d' | '30d' | 'all' = '7d'): Promise<CategoryStats[]> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/analytics/categories?timeframe=${timeframe}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const result = await response.json();
      
      if (!result.success || !result.data || !Array.isArray(result.data.categories)) {
        throw new Error('Invalid response format');
      }

      return result.data.categories.map((cat: any) => ({
        category: cat.category || cat.name || 'Unknown',
        poolCount: parseNumberSafe(cat.pool_count || cat.count),
        totalVolume: parseNumberSafe(cat.total_volume || cat.volume),
        percentage: parseNumberSafe(cat.percentage)
      }));
    } catch (error) {
      console.error('❌ Error fetching category stats:', error);
      return [];
    }
  }

  /**
   * Get comprehensive overview for stats page
   */
  async getOverview(timeframe: '24h' | '7d' | '30d' | 'all' = '7d') {
    try {
      const response = await fetch(`${BACKEND_URL}/api/analytics/overview?timeframe=${timeframe}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const result = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error('Invalid response format');
      }

      // Process and sanitize the data
      const overview = result.data.overview;
      const trends = result.data.trends;

      return {
        oddyssey: {
          totalSlips: parseNumberSafe(overview.oddyssey?.total_slips),
          avgDailyPlayers: parseNumberSafe(overview.oddyssey?.avg_daily_players),
          platformAccuracy: parseNumberSafe(overview.oddyssey?.platform_accuracy),
          bestPerformance: parseNumberSafe(overview.oddyssey?.best_performance),
          totalEvaluated: parseNumberSafe(overview.oddyssey?.total_evaluated)
        },
        users: {
          totalUsers: parseNumberSafe(overview.users?.total_users),
          avgSlipsPerUser: parseNumberSafe(overview.users?.avg_slips_per_user),
          avgUserAccuracy: parseNumberSafe(overview.users?.avg_user_accuracy),
          activeUsers: parseNumberSafe(overview.users?.active_users)
        },
        activity: trends?.activity || [],
        topPerformers: trends?.topPerformers || []
      };
    } catch (error) {
      console.error('❌ Error fetching overview:', error);
      return null;
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

export const realAnalyticsService = new RealAnalyticsService();


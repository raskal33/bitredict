import { useState, useEffect, useCallback } from 'react';
import { leaderboardService, LeaderboardEntry, UserStats, UserRank } from '@/services/leaderboardService';

export interface UseLeaderboardOptions {
  metric?: 'total_staked' | 'total_won' | 'success_rate' | 'volume_generated';
  limit?: number;
  useCache?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseLeaderboardReturn {
  // Data
  leaderboardData: LeaderboardEntry[];
  userStats: UserStats | null;
  userRank: UserRank | null;
  
  // Loading states
  loading: boolean;
  searching: boolean;
  
  // Error states
  error: string | null;
  
  // Actions
  loadLeaderboard: (type: 'prediction' | 'reputation') => Promise<void>;
  searchUser: (address: string) => Promise<void>;
  refreshData: () => Promise<void>;
  clearError: () => void;
  clearUserData: () => void;
}

export function useLeaderboard(options: UseLeaderboardOptions = {}): UseLeaderboardReturn {
  const {
    metric = 'total_staked',
    limit = 50,
    useCache = true,
    autoRefresh = false,
    refreshInterval = 300000 // 5 minutes
  } = options;

  // State
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userRank, setUserRank] = useState<UserRank | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load leaderboard data
  const loadLeaderboard = useCallback(async (type: 'prediction' | 'reputation') => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      if (type === 'prediction') {
        response = await leaderboardService.getGuidedMarketsLeaderboard(metric, limit, useCache);
      } else {
        response = await leaderboardService.getReputationLeaderboard(limit, useCache);
      }
      
      if (response.success) {
        setLeaderboardData(response.data.leaderboard);
      } else {
        setError('Failed to load leaderboard data');
      }
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      setError('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  }, [metric, limit, useCache]);

  // Search user
  const searchUser = useCallback(async (address: string) => {
    if (!address.trim()) return;
    
    setSearching(true);
    setError(null);
    
    try {
      const [statsResponse, rankResponse] = await Promise.all([
        leaderboardService.getUserStats(address),
        leaderboardService.getUserRank(
          address, 
          'guided_markets', // Default to guided markets for user search
          metric
        )
      ]);
      
      if (statsResponse.success) {
        setUserStats(statsResponse.data);
      } else {
        setError('User statistics not found');
      }
      
      if (rankResponse.success) {
        setUserRank(rankResponse.data);
      } else {
        setUserRank(null); // User not in leaderboard
      }
    } catch (err) {
      console.error('Error searching user:', err);
      setError('Failed to search user');
    } finally {
      setSearching(false);
    }
  }, [metric]);

  // Refresh data
  const refreshData = useCallback(async () => {
    try {
      await leaderboardService.refreshLeaderboardCache('all', metric, limit);
      // Reload current data
      await loadLeaderboard('prediction');
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh data');
    }
  }, [loadLeaderboard, metric, limit]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear user data
  const clearUserData = useCallback(() => {
    setUserStats(null);
    setUserRank(null);
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(() => {
        loadLeaderboard('prediction');
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, loadLeaderboard]);

  return {
    leaderboardData,
    userStats,
    userRank,
    loading,
    searching,
    error,
    loadLeaderboard,
    searchUser,
    refreshData,
    clearError,
    clearUserData
  };
}

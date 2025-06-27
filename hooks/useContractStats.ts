import { useState, useEffect } from 'react';
// EVM/Ethers integration can be added here when needed
// import { ethers } from 'ethers';

// Contract interfaces based on the BitredictPool.sol
interface GlobalStats {
  totalPools: number;
  totalVolume: number;
  totalBets: number;
  activePools: number;
}

interface CreatorStats {
  totalPools: number;
  wonPools: number;
  settledPools: number;
  totalVolume: number;
  winRate: number;
  accuracy: number;
}

interface BettorStats {
  totalBets: number;
  wonBets: number;
  totalStaked: number;
  totalWinnings: number;
  winRate: number;
  profitLoss: number;
}

interface TopCreator {
  address: string;
  stats: CreatorStats;
  reputation: number;
}

interface TopBettor {
  address: string;
  stats: BettorStats;
}

interface ContractStats {
  globalStats: GlobalStats;
  topCreators: TopCreator[];
  topBettors: TopBettor[];
  categoryDistribution: { [category: string]: number };
  volumeHistory: { date: string; volume: number }[];
  userActivity: { hour: string; users: number }[];
  isLoading: boolean;
  error: string | null;
}

const MOCK_DATA = {
  globalStats: {
    totalPools: 1247,
    totalVolume: 892450,
    totalBets: 15672,
    activePools: 234,
  },
  topCreators: [
    {
      address: "3B8F...9D2A",
      stats: {
        totalPools: 45,
        wonPools: 32,
        settledPools: 44,
        totalVolume: 12450,
        winRate: 72.3,
        accuracy: 97.8,
      },
      reputation: 4.8,
    },
    {
      address: "7K9L...1F4E",
      stats: {
        totalPools: 38,
        wonPools: 26,
        settledPools: 37,
        totalVolume: 10230,
        winRate: 69.1,
        accuracy: 94.6,
      },
      reputation: 4.6,
    },
    {
      address: "2M5N...8R7C",
      stats: {
        totalPools: 33,
        wonPools: 23,
        settledPools: 32,
        totalVolume: 9876,
        winRate: 71.2,
        accuracy: 96.9,
      },
      reputation: 4.5,
    },
  ],
  topBettors: [
    {
      address: "8X7C...4V5B",
      stats: {
        totalBets: 234,
        wonBets: 150,
        totalStaked: 15670,
        totalWinnings: 19120,
        winRate: 64.2,
        profitLoss: 3450,
      },
    },
    {
      address: "1W2E...9R8T",
      stats: {
        totalBets: 198,
        wonBets: 122,
        totalStaked: 13420,
        totalWinnings: 16310,
        winRate: 61.8,
        profitLoss: 2890,
      },
    },
  ],
  categoryDistribution: {
    Sports: 35,
    Crypto: 28,
    Politics: 15,
    Weather: 12,
    Entertainment: 10,
  },
  volumeHistory: [
    { date: "Mon", volume: 12450 },
    { date: "Tue", volume: 15670 },
    { date: "Wed", volume: 18230 },
    { date: "Thu", volume: 16780 },
    { date: "Fri", volume: 21340 },
    { date: "Sat", volume: 19870 },
    { date: "Sun", volume: 23450 },
  ],
  userActivity: [
    { hour: "00:00", users: 45 },
    { hour: "04:00", users: 23 },
    { hour: "08:00", users: 78 },
    { hour: "12:00", users: 156 },
    { hour: "16:00", users: 198 },
    { hour: "20:00", users: 167 },
    { hour: "24:00", users: 89 },
  ],
};

export function useContractStats(timeframe: '24h' | '7d' | '30d' | 'all' = '7d'): ContractStats {
  const [stats, setStats] = useState<ContractStats>({
    globalStats: { totalPools: 0, totalVolume: 0, totalBets: 0, activePools: 0 },
    topCreators: [],
    topBettors: [],
    categoryDistribution: {},
    volumeHistory: [],
    userActivity: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      try {
        setStats(prev => ({ ...prev, isLoading: true, error: null }));

        // Simulate API call to contract
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (isMounted) {
          setStats({
            ...MOCK_DATA,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        if (isMounted) {
          setStats(prev => ({
            ...prev,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch stats',
          }));
        }
      }
    };

    fetchStats();

    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [timeframe]);

  return stats;
}

// Hook for getting individual user stats
export function useUserStats(address: string | null) {
  const [userStats, setUserStats] = useState<{
    creatorStats: CreatorStats | null;
    bettorStats: BettorStats | null;
    isLoading: boolean;
    error: string | null;
  }>({
    creatorStats: null,
    bettorStats: null,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    if (!address) {
      setUserStats({
        creatorStats: null,
        bettorStats: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    let isMounted = true;

    const fetchUserStats = async () => {
      try {
        setUserStats(prev => ({ ...prev, isLoading: true, error: null }));

        // Simulate contract call
        await new Promise(resolve => setTimeout(resolve, 500));

        if (isMounted) {
          // Mock user stats - in real implementation, this would call the contract
          setUserStats({
            creatorStats: {
              totalPools: 5,
              wonPools: 3,
              settledPools: 4,
              totalVolume: 1250,
              winRate: 75.0,
              accuracy: 80.0,
            },
            bettorStats: {
              totalBets: 28,
              wonBets: 19,
              totalStaked: 2840,
              totalWinnings: 3420,
              winRate: 67.9,
              profitLoss: 580,
            },
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        if (isMounted) {
          setUserStats(prev => ({
            ...prev,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch user stats',
          }));
        }
      }
    };

    fetchUserStats();

    return () => {
      isMounted = false;
    };
  }, [address]);

  return userStats;
}

// Hook for category-specific stats
export function useCategoryStats(category: string) {
  const [categoryStats, setCategoryStats] = useState<{
    pools: number;
    volume: number;
    avgSuccessRate: number;
    topPools: any[];
    isLoading: boolean;
    error: string | null;
  }>({
    pools: 0,
    volume: 0,
    avgSuccessRate: 0,
    topPools: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    const fetchCategoryStats = async () => {
      try {
        setCategoryStats(prev => ({ ...prev, isLoading: true, error: null }));

        // Simulate contract call
        await new Promise(resolve => setTimeout(resolve, 800));

        if (isMounted) {
          setCategoryStats({
            pools: 45,
            volume: 125000,
            avgSuccessRate: 68.5,
            topPools: [], // Would fetch actual pool data
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        if (isMounted) {
          setCategoryStats(prev => ({
            ...prev,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch category stats',
          }));
        }
      }
    };

    fetchCategoryStats();

    return () => {
      isMounted = false;
    };
  }, [category]);

  return categoryStats;
} 
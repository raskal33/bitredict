import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://bitredict-backend.fly.dev';

export interface UserPerformanceAnalytics {
  creator: {
    totalPools: number;
    settledPools: number;
    activePools: number;
    totalVolume: number;
    avgPoolSize: number;
    totalLiquidityProvided: number;
  };
  bettor: {
    totalBets: number;
    totalStaked: number;
    avgBetSize: number;
  };
  oddyssey: {
    totalSlips: number;
    evaluatedSlips: number;
    avgScore: number;
    bestScore: number;
    winningSlips: number;
    winRate: number;
    profitLoss: number;
    totalEntryFees: number;
    totalPrizes: number;
  };
  combined: {
    totalActivity: number;
    totalVolume: number;
  };
  trends: {
    monthly: Array<{
      month: string;
      volume: number;
      bets: number;
    }>;
    categories: Array<{
      category: string;
      bets: number;
      volume: number;
    }>;
  };
}

/**
 * Hook to fetch user performance analytics
 */
export function useUserPerformance(timeframe: '7d' | '30d' | '90d' | 'all' = '30d') {
  const { address } = useAccount();

  return useQuery({
    queryKey: ['userPerformance', address, timeframe],
    queryFn: async () => {
      if (!address) throw new Error('No wallet connected');

      const response = await fetch(
        `${BACKEND_URL}/api/analytics/user/${address}/performance?timeframe=${timeframe}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch user performance');
      }

      const result = await response.json();
      return result.data as UserPerformanceAnalytics;
    },
    enabled: !!address,
    staleTime: 60000, // 1 minute
    refetchInterval: 120000, // Refetch every 2 minutes
  });
}

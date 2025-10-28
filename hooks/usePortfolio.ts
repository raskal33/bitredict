import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://bitredict-backend.fly.dev';

interface PortfolioPosition {
  id: string;
  poolId?: string;
  marketId?: string;
  cycleId?: number;
  type: 'pool_bet' | 'oddyssey';
  title: string;
  outcome?: string;
  amount: string;
  shares?: string;
  currentValue: string;
  unrealizedPL: string;
  realizedPL: string;
  status: 'active' | 'won' | 'lost' | 'ended' | 'pending';
  category: string;
  createdAt: string;
  endDate?: string;
  claimed: boolean;
  payoutAmount?: string;
  prizeAmount?: string;
  transactionHash?: string;
  token: 'STT' | 'BITR';
  score?: number | null;
  rank?: number | null;
}

interface PortfolioSummary {
  totalInvested: number;
  currentValue: number;
  unrealizedPL: number;
  realizedPL: number;
  totalPositions: number;
  activePositions: number;
  wonPositions: number;
  lostPositions: number;
  pendingPositions: number;
}

interface PortfolioData {
  summary: PortfolioSummary;
  positions: PortfolioPosition[];
  totalCount: number;
}

/**
 * Hook to fetch user's portfolio
 */
export function usePortfolio() {
  const { address } = useAccount();

  return useQuery({
    queryKey: ['portfolio', address],
    queryFn: async () => {
      if (!address) throw new Error('No wallet connected');

      const response = await fetch(`${BACKEND_URL}/api/users/${address}/portfolio`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch portfolio');
      }

      const data = await response.json();
      return data as PortfolioData;
    },
    enabled: !!address,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}

/**
 * Hook to fetch only active positions
 */
export function useActivePositions() {
  const { data: portfolio } = usePortfolio();

  return {
    data: portfolio?.positions.filter(p => p.status === 'active') || [],
    summary: portfolio?.summary,
  };
}

/**
 * Hook to fetch betting history (completed positions)
 */
export function useBettingHistory() {
  const { data: portfolio } = usePortfolio();

  return {
    data: portfolio?.positions.filter(p => 
      ['won', 'lost', 'ended'].includes(p.status)
    ) || [],
    summary: portfolio?.summary,
  };
}


// PoolService - Real backend integration
import { API_CONFIG } from '@/config/api';

// Backend API Base URL
const API_BASE_URL = `${API_CONFIG.baseURL}/api`;

// Mock data for development - replace with actual contract integration
const MOCK_POOLS = [
  {
    id: 1,
    creator: "0x1234...5678",
    odds: 250,
    creatorStake: "1000000000000000000000", // 1000 tokens
    totalBettorStake: "500000000000000000000", // 500 tokens
    predictedOutcome: "Manchester United will NOT win",
    marketId: "0x1234567890abcdef",
    eventStartTime: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
    eventEndTime: Math.floor(Date.now() / 1000) + 90000,
    bettingEndTime: Math.floor(Date.now() / 1000) + 85800,
    league: "Premier League",
    category: "football",
    region: "England",
    isPrivate: false,
    usesBitr: false,
    settled: false,
    creatorSideWon: false,
    boostTier: "SILVER" as const,
    boostExpiry: Math.floor(Date.now() / 1000) + 86400,
    maxBetPerUser: "100000000000000000000" // 100 tokens
  },
  {
    id: 2,
    creator: "0x8765...4321",
    odds: 180,
    creatorStake: "500000000000000000000", // 500 tokens
    totalBettorStake: "300000000000000000000", // 300 tokens
    predictedOutcome: "Bitcoin will NOT reach $50,000",
    marketId: "0xabcdef1234567890",
    eventStartTime: Math.floor(Date.now() / 1000) + 172800, // 48 hours from now
    eventEndTime: Math.floor(Date.now() / 1000) + 176400,
    bettingEndTime: Math.floor(Date.now() / 1000) + 171800,
    league: "Cryptocurrency",
    category: "cryptocurrency",
    region: "Global",
    isPrivate: true,
    usesBitr: true,
    settled: false,
    creatorSideWon: false,
    boostTier: "GOLD" as const,
    boostExpiry: Math.floor(Date.now() / 1000) + 172800,
    maxBetPerUser: "50000000000000000000" // 50 tokens
  },
  {
    id: 3,
    creator: "0xabcd...efgh",
    odds: 320,
    creatorStake: "2000000000000000000000", // 2000 tokens
    totalBettorStake: "800000000000000000000", // 800 tokens
    predictedOutcome: "Lakers will NOT beat Warriors",
    marketId: "0x9876543210fedcba",
    eventStartTime: Math.floor(Date.now() / 1000) + 43200, // 12 hours from now
    eventEndTime: Math.floor(Date.now() / 1000) + 46800,
    bettingEndTime: Math.floor(Date.now() / 1000) + 42600,
    league: "NBA",
    category: "basketball",
    region: "USA",
    isPrivate: false,
    usesBitr: false,
    settled: false,
    creatorSideWon: false,
    boostTier: "BRONZE" as const,
    boostExpiry: Math.floor(Date.now() / 1000) + 43200,
    maxBetPerUser: "200000000000000000000" // 200 tokens
  },
  {
    id: 4,
    creator: "0xdef0...1234",
    odds: 150,
    creatorStake: "300000000000000000000", // 300 tokens
    totalBettorStake: "150000000000000000000", // 150 tokens
    predictedOutcome: "Ethereum will NOT reach $3,000",
    marketId: "0xfedcba0987654321",
    eventStartTime: Math.floor(Date.now() / 1000) + 259200, // 72 hours from now
    eventEndTime: Math.floor(Date.now() / 1000) + 262800,
    bettingEndTime: Math.floor(Date.now() / 1000) + 258600,
    league: "Cryptocurrency",
    category: "cryptocurrency",
    region: "Global",
    isPrivate: false,
    usesBitr: false,
    settled: false,
    creatorSideWon: false,
    boostTier: "NONE" as const,
    boostExpiry: 0,
    maxBetPerUser: "50000000000000000000" // 50 tokens
  }
];

export interface Pool {
  poolId: number; // Changed from 'id' to match backend
  creator: string;
  odds: number;
  creatorStake: string;
  totalBettorStake: string;
  predictedOutcome: string;
  marketId: string;
  eventStartTime: string; // Changed from number to string to match backend ISO format
  eventEndTime: string; // Changed from number to string to match backend ISO format
  bettingEndTime: string; // Changed from number to string to match backend ISO format
  league: string;
  category: string;
  region: string;
  isPrivate: boolean;
  usesBitr: boolean;
  settled: boolean;
  creatorSideWon: boolean | null; // Changed to match backend
  boostTier?: "NONE" | "BRONZE" | "SILVER" | "GOLD"; // Made optional
  boostExpiry?: number; // Made optional
  maxBetPerUser: string;
  // Additional fields from backend
  filledAbove60?: boolean;
  oracleType?: string;
  totalCreatorSideStake?: string;
  maxBettorStake?: string;
  result?: string | null;
  resultTimestamp?: string | null;
  arbitrationDeadline?: string | null;
  txHash?: string;
  blockNumber?: number;
  createdAt?: string;
}

export interface PoolStats {
  totalVolume: string;
  activeMarkets: number;
  participants: number;
  totalPools: number;
  boostedPools: number;
  comboPools: number;
  privatePools: number;
}

export class PoolService {
  static async getPools(limit: number = 50, offset: number = 0): Promise<Pool[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/guided-markets/pools?limit=${limit}&offset=${offset}`);
      const data = await response.json();
      
      if (!data.success) {
        console.error('Failed to fetch pools:', data.error);
        return [];
      }
      
      return data.data.pools || [];
    } catch (error) {
      console.error('Error fetching pools:', error);
      return [];
    }
  }

  static async getPoolsByCategory(category: string, limit: number = 50, offset: number = 0): Promise<Pool[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/guided-markets/pools/category/${category}?limit=${limit}&offset=${offset}`);
      const data = await response.json();
      
      if (!data.success) {
        console.error('Failed to fetch pools by category:', data.error);
        return [];
      }
      
      return data.data.pools || [];
    } catch (error) {
      console.error('Error fetching pools by category:', error);
      return [];
    }
  }

  static async getPoolById(poolId: number): Promise<Pool | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/guided-markets/pools/${poolId}`);
      const data = await response.json();
      
      if (!data.success) {
        console.error('Failed to fetch pool:', data.error);
        return null;
      }
      
      return data.data.pool || null;
    } catch (error) {
      console.error('Error fetching pool:', error);
      return null;
    }
  }

  static async getActivePoolsByCreator(creatorAddress: string, limit: number = 50, offset: number = 0): Promise<Pool[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/guided-markets/pools/creator/${creatorAddress}?limit=${limit}&offset=${offset}`);
      const data = await response.json();
      
      if (!data.success) {
        console.error('Failed to fetch creator pools:', data.error);
        return [];
      }
      
      return data.data.pools || [];
    } catch (error) {
      console.error('Error fetching creator pools:', error);
      return [];
    }
  }

  static async createPool(
    predictedOutcome: string,
    odds: number,
    creatorStake: string,
    eventStartTime: number,
    eventEndTime: number,
    league: string,
    category: string,
    region: string,
    isPrivate: boolean,
    maxBetPerUser: number,
    useBitr: boolean,
    oracleType: number,
    marketId: string,
    boostTier: "NONE" | "BRONZE" | "SILVER" | "GOLD" = "NONE"
  ): Promise<{ success: boolean; poolId?: number; error?: string }> {
    try {
      // Mock implementation - replace with actual contract calls
      console.log('Creating pool with params:', {
        predictedOutcome,
        odds,
        creatorStake,
        eventStartTime,
        eventEndTime,
        league,
        category,
        region,
        isPrivate,
        maxBetPerUser,
        useBitr,
        oracleType,
        marketId,
        boostTier
      });
      
      // Simulate success
      return { success: true, poolId: MOCK_POOLS.length + 1 };
    } catch (error) {
      console.error('Error creating pool:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async boostPool(poolId: number, tier: "BRONZE" | "SILVER" | "GOLD"): Promise<{ success: boolean; error?: string }> {
    try {
      // Mock implementation - replace with actual contract calls
      console.log('Boosting pool:', poolId, 'with tier:', tier);
      return { success: true };
    } catch (error) {
      console.error('Error boosting pool:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async placeBet(poolId: number, amount: string, useBitr: boolean = false): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/guided-markets/pools/${poolId}/bet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          useBitr
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to place bet'
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error placing bet:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  static async getPoolProgress(poolId: number): Promise<{
    success: boolean;
    data?: {
      totalPoolSize: string;
      currentBettorStake: string;
      maxBettorCapacity: string;
      creatorSideStake: string;
      fillPercentage: number;
      bettorCount: number;
      lpCount: number;
      creatorStake: string;
      totalCreatorSideStake: string;
      totalBettorStake: string;
      maxBettorStake: string;
      odds: number;
      usesBitr: boolean;
      poolData: {
        id: number;
        creator: string;
        predictedOutcome: string;
        league: string;
        category: string;
        region: string;
        isPrivate: boolean;
        status: string;
        createdAt: string;
      };
    };
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/guided-markets/pools/${poolId}/progress`);
      const result = await response.json();
      
      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to get pool progress'
        };
      }

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      console.error('Error getting pool progress:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  static async addLiquidity(poolId: number, amount: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/guided-markets/pools/${poolId}/liquidity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });

      const result = await response.json();
      
      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to add liquidity'
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error adding liquidity:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  static async getPoolStats(): Promise<PoolStats> {
    try {
      const response = await fetch(`${API_BASE_URL}/guided-markets/stats`);
      const data = await response.json();
      
      if (!data.success) {
        console.error('Failed to fetch pool stats:', data.error);
        return {
          totalVolume: "0",
          activeMarkets: 0,
          participants: 0,
          totalPools: 0,
          boostedPools: 0,
          comboPools: 0,
          privatePools: 0
        };
      }
      
      return data.data.stats || {
        totalVolume: "0",
        activeMarkets: 0,
        participants: 0,
        totalPools: 0,
        boostedPools: 0,
        comboPools: 0,
        privatePools: 0
      };
    } catch (error) {
      console.error('Error fetching pool stats:', error);
      return {
        totalVolume: "0",
        activeMarkets: 0,
        participants: 0,
        totalPools: 0,
        boostedPools: 0,
        comboPools: 0,
        privatePools: 0
      };
    }
  }

  static formatStake(stake: string): string {
    try {
      const amount = parseFloat(stake) / 1e18;
      if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
      if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
      return amount.toFixed(1);
    } catch (error) {
      return '0';
    }
  }

  static formatOdds(odds: number): string {
    try {
      return (odds / 100).toFixed(2);
    } catch (error) {
      return '1.00';
    }
  }

  static formatTimeLeft(endTime: number): string {
    try {
      const now = Math.floor(Date.now() / 1000);
      const timeLeft = endTime - now;
      
      if (timeLeft <= 0) return "Ended";
      if (isNaN(timeLeft) || !isFinite(timeLeft)) return "TBD";
      
      const days = Math.floor(timeLeft / 86400);
      const hours = Math.floor((timeLeft % 86400) / 3600);
      const minutes = Math.floor((timeLeft % 3600) / 60);
      
      if (days > 0) return `${days}d ${hours}h`;
      if (hours > 0) return `${hours}h ${minutes}m`;
      if (minutes > 0) return `${minutes}m`;
      return `${Math.floor(timeLeft)}s`;
    } catch (error) {
      return "TBD";
    }
  }

  static getBoostBadge(tier: string) {
    switch (tier) {
      case "BRONZE":
        return { icon: "🥉", color: "text-orange-400", label: "Bronze" };
      case "SILVER":
        return { icon: "🥈", color: "text-gray-400", label: "Silver" };
      case "GOLD":
        return { icon: "🥇", color: "text-yellow-400", label: "Gold" };
      default:
        return null;
    }
  }

  static getCategoryIcon(category: string): string {
    switch (category) {
      case "football":
        return "⚽";
      case "basketball":
        return "🏀";
      case "cryptocurrency":
        return "₿";
      case "combo":
        return "⭐";
      default:
        return "🎯";
    }
  }
} 
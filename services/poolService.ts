// PoolService - Real backend integration
import { API_CONFIG } from '@/config/api';

// Backend API Base URL
const API_BASE_URL = `${API_CONFIG.baseURL}/api`;

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
  bitrVolume?: string;
  sttVolume?: string;
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
      console.log('Fetching pools from:', `${API_BASE_URL}/guided-markets/pools?limit=${limit}&offset=${offset}`);
      const response = await fetch(`${API_BASE_URL}/guided-markets/pools?limit=${limit}&offset=${offset}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch pools:', response.status, errorText);
        return [];
      }
      
      const data = await response.json();
      console.log('Pools response:', data);
      
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
      console.log('Fetching pool by ID:', poolId, 'from:', `${API_BASE_URL}/guided-markets/pools/${poolId}`);
      const response = await fetch(`${API_BASE_URL}/guided-markets/pools/${poolId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch pool:', response.status, errorText);
        return null;
      }
      
      const data = await response.json();
      console.log('Pool by ID response:', data);
      
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
      console.log('Creating pool with backend API:', {
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
      
      const response = await fetch(`${API_BASE_URL}/bitredict-pool/pools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        return {
          success: false,
          error: result.error?.message || result.error || 'Failed to create pool'
        };
      }

      return { 
        success: true, 
        poolId: result.data?.poolId || result.data?.id 
      };
    } catch (error) {
      console.error('Error creating pool:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async boostPool(poolId: number, tier: "BRONZE" | "SILVER" | "GOLD"): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Boosting pool via web3 service:', poolId, 'with tier:', tier);
      
      // Since there's no direct backend endpoint for boosting, we'll use the web3 service
      // This would typically be done through a wallet connection and contract interaction
      const response = await fetch(`${API_BASE_URL}/guided-markets/pools/${poolId}/boost`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier,
          poolId
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to boost pool:', response.status, errorText);
        return { 
          success: false, 
          error: `Failed to boost pool: ${response.status} - ${errorText}` 
        };
      }

      const result = await response.json();
      
      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to boost pool'
        };
      }

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
          bitrVolume: "0",
          sttVolume: "0",
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
        bitrVolume: "0",
        sttVolume: "0",
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
        bitrVolume: "0",
        sttVolume: "0",
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
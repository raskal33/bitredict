import { apiRequest, API_CONFIG } from '@/config/api';

export interface OptimisticMarket {
  marketId: string;
  poolId: number;
  question: string;
  category: string;
  proposedOutcome: string | null;
  proposer: string | null;
  proposalTime: number;
  proposalBond: string;
  disputer: string | null;
  disputeTime: number;
  disputeBond: string;
  state: MarketState;
  finalOutcome: string | null;
  resolutionTime: number;
}

export enum MarketState {
  PENDING = 0,
  PROPOSED = 1,
  DISPUTED = 2,
  RESOLVED = 3,
  EXPIRED = 4
}

export interface MarketStatistics {
  contract: {
    totalMarkets: number;
    activeMarkets: number;
    resolvedMarkets: number;
    totalBondsLocked: string;
    totalRewardsPaid: string;
    contractAddress: string;
  };
  analytics: {
    avgResolutionTime: number;
    disputeRate: number;
    successfulProposals: number;
    totalProposers: number;
    totalDisputers: number;
    marketsLast24h: number;
    resolutionsLast24h: number;
  };
  formatted: {
    totalBondsLocked: string;
    totalRewardsPaid: string;
    avgResolutionTime: string;
    disputeRate: string;
  };
}

export interface UserMarketActivity {
  user: string;
  statistics: {
    totalProposals: number;
    successfulProposals: number;
    totalDisputes: number;
    successfulDisputes: number;
    totalBondsLocked: string;
    totalRewardsEarned: string;
    reputation: number;
    successRate: number;
  };
  recentActivity: {
    proposals: OptimisticMarket[];
    disputes: OptimisticMarket[];
  };
  formatted: {
    totalBondsLocked: string;
    totalRewardsEarned: string;
    successRate: string;
  };
}

export class OptimisticOracleService {
  /**
   * Get comprehensive OptimisticOracle statistics
   */
  static async getStatistics(): Promise<MarketStatistics> {
    try {
      const response = await apiRequest<{
        success: boolean;
        data: MarketStatistics;
      }>(`${API_CONFIG.endpoints.optimisticOracle}/statistics`);

      if (!response.success) {
        throw new Error('Failed to fetch OptimisticOracle statistics');
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching OptimisticOracle statistics:', error);
      throw error;
    }
  }

  /**
   * Get market by ID
   */
  static async getMarket(marketId: string): Promise<OptimisticMarket> {
    try {
      const response = await apiRequest<{
        success: boolean;
        data: OptimisticMarket;
      }>(`${API_CONFIG.endpoints.optimisticOracle}/market/${marketId}`);

      if (!response.success) {
        throw new Error(`Failed to fetch market ${marketId}`);
      }

      return response.data;
    } catch (error) {
      console.error(`Error fetching market ${marketId}:`, error);
      throw error;
    }
  }

  /**
   * Get all markets with optional filtering
   */
  static async getMarkets(options: {
    state?: MarketState;
    category?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{
    markets: OptimisticMarket[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const params = new URLSearchParams();
      if (options.state !== undefined) params.append('state', options.state.toString());
      if (options.category) params.append('category', options.category);
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.offset) params.append('offset', options.offset.toString());

      const response = await apiRequest<{
        success: boolean;
        data: {
          markets: OptimisticMarket[];
          total: number;
          hasMore: boolean;
        };
      }>(`${API_CONFIG.endpoints.optimisticOracle}/markets?${params.toString()}`);

      if (!response.success) {
        throw new Error('Failed to fetch markets');
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching markets:', error);
      throw error;
    }
  }

  /**
   * Get user market activity and statistics
   */
  static async getUserActivity(userAddress: string): Promise<UserMarketActivity> {
    try {
      const response = await apiRequest<{
        success: boolean;
        data: UserMarketActivity;
      }>(`${API_CONFIG.endpoints.optimisticOracle}/user/${userAddress}/activity`);

      if (!response.success) {
        throw new Error(`Failed to fetch user activity for ${userAddress}`);
      }

      return response.data;
    } catch (error) {
      console.error(`Error fetching user activity for ${userAddress}:`, error);
      throw error;
    }
  }

  /**
   * Get user reputation
   */
  static async getUserReputation(userAddress: string): Promise<{
    reputation: number;
    canPropose: boolean;
    canDispute: boolean;
    minReputationToPropose: number;
    minReputationToDispute: number;
  }> {
    try {
      const response = await apiRequest<{
        success: boolean;
        data: {
          reputation: number;
          canPropose: boolean;
          canDispute: boolean;
          minReputationToPropose: number;
          minReputationToDispute: number;
        };
      }>(`${API_CONFIG.endpoints.optimisticOracle}/user/${userAddress}/reputation`);

      if (!response.success) {
        throw new Error(`Failed to fetch user reputation for ${userAddress}`);
      }

      return response.data;
    } catch (error) {
      console.error(`Error fetching user reputation for ${userAddress}:`, error);
      throw error;
    }
  }

  /**
   * Get markets by category with analytics
   */
  static async getMarketsByCategory(): Promise<{
    [category: string]: {
      markets: OptimisticMarket[];
      statistics: {
        totalMarkets: number;
        activeMarkets: number;
        avgResolutionTime: number;
        disputeRate: number;
      };
    };
  }> {
    try {
      const response = await apiRequest<{
        success: boolean;
        data: {
          [category: string]: {
            markets: OptimisticMarket[];
            statistics: {
              totalMarkets: number;
              activeMarkets: number;
              avgResolutionTime: number;
              disputeRate: number;
            };
          };
        };
      }>(`${API_CONFIG.endpoints.optimisticOracle}/markets/by-category`);

      if (!response.success) {
        throw new Error('Failed to fetch markets by category');
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching markets by category:', error);
      throw error;
    }
  }

  /**
   * Get pending markets that need resolution
   */
  static async getPendingMarkets(): Promise<OptimisticMarket[]> {
    try {
      const response = await apiRequest<{
        success: boolean;
        data: OptimisticMarket[];
      }>(`${API_CONFIG.endpoints.optimisticOracle}/markets/pending`);

      if (!response.success) {
        throw new Error('Failed to fetch pending markets');
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching pending markets:', error);
      throw error;
    }
  }

  /**
   * Get disputed markets that need community resolution
   */
  static async getDisputedMarkets(): Promise<OptimisticMarket[]> {
    try {
      const response = await apiRequest<{
        success: boolean;
        data: OptimisticMarket[];
      }>(`${API_CONFIG.endpoints.optimisticOracle}/markets/disputed`);

      if (!response.success) {
        throw new Error('Failed to fetch disputed markets');
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching disputed markets:', error);
      throw error;
    }
  }

  /**
   * Get market resolution history
   */
  static async getResolutionHistory(limit: number = 50): Promise<{
    resolutions: Array<{
      marketId: string;
      question: string;
      category: string;
      finalOutcome: string;
      resolutionTime: number;
      winner: string;
      rewardAmount: string;
      wasDisputed: boolean;
    }>;
    total: number;
  }> {
    try {
      const response = await apiRequest<{
        success: boolean;
        data: {
          resolutions: Array<{
            marketId: string;
            question: string;
            category: string;
            finalOutcome: string;
            resolutionTime: number;
            winner: string;
            rewardAmount: string;
            wasDisputed: boolean;
          }>;
          total: number;
        };
      }>(`${API_CONFIG.endpoints.optimisticOracle}/resolutions?limit=${limit}`);

      if (!response.success) {
        throw new Error('Failed to fetch resolution history');
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching resolution history:', error);
      throw error;
    }
  }

  /**
   * Format market state for display
   */
  static formatMarketState(state: MarketState): string {
    switch (state) {
      case MarketState.PENDING:
        return 'Pending Proposal';
      case MarketState.PROPOSED:
        return 'Proposed (Challenge Window)';
      case MarketState.DISPUTED:
        return 'Disputed (Community Resolution)';
      case MarketState.RESOLVED:
        return 'Resolved';
      case MarketState.EXPIRED:
        return 'Expired (Auto-Resolved)';
      default:
        return 'Unknown';
    }
  }

  /**
   * Format time remaining for challenge/resolution windows
   */
  static formatTimeRemaining(timestamp: number, windowHours: number): string {
    const now = Math.floor(Date.now() / 1000);
    const deadline = timestamp + (windowHours * 3600);
    const remaining = deadline - now;

    if (remaining <= 0) {
      return 'Expired';
    }

    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  }

  /**
   * Check if user can propose outcome (reputation check)
   */
  static async canUserPropose(userAddress: string): Promise<boolean> {
    try {
      const reputation = await this.getUserReputation(userAddress);
      return reputation.canPropose;
    } catch (error) {
      console.error('Error checking user proposal eligibility:', error);
      return false;
    }
  }

  /**
   * Check if user can dispute outcome (reputation check)
   */
  static async canUserDispute(userAddress: string): Promise<boolean> {
    try {
      const reputation = await this.getUserReputation(userAddress);
      return reputation.canDispute;
    } catch (error) {
      console.error('Error checking user dispute eligibility:', error);
      return false;
    }
  }
}

export default OptimisticOracleService;

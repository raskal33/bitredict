import { apiRequest, API_CONFIG } from '@/config/api';

export interface StakingStatistics {
  contract: {
    totalStakers: number;
    totalStaked: string;
    totalRewards: string;
    totalRewardsPaid: string;
    active: boolean;
    contractAddress: string;
  };
  analytics: {
    uniqueStakers: number;
    totalStakes: number;
    avgStakeAmount: string;
    firstStakeTime: string;
    lastActivity: string;
    stakes24h: number;
    unstakes24h: number;
  };
  tiers: StakingTier[];
  formatted: {
    totalStaked: string;
    totalRewards: string;
    totalRewardsPaid: string;
  };
}

export interface StakingTier {
  id: number;
  name: string;
  baseAPY: number;
  minStake: string;
  revenueShareRate: number;
  apyMultiplier: number;
  statistics: {
    uniqueStakers: number;
    totalStakes: number;
    totalAmount: string;
    avgStakeAmount: string;
  };
  formatted: {
    minStake: string;
    baseAPY: string;
    revenueShare: string;
  };
}

export interface UserStake {
  index: number;
  amount: string;
  startTime: number;
  tierId: number;
  durationOption: number;
  claimedRewardBITR: string;
  rewardDebtBITR: string;
  rewardDebtSTT: string;
  pendingBITRRewards: string;
  pendingSTTRewards: string;
}

export interface UserStakingData {
  address: string;
  stakes: UserStake[];
  summary: {
    totalStakes: number;
    totalStaked: string;
    totalPendingRewards: string;
    totalClaimedRewards: string;
    activeStakes: number;
  };
  history: StakingEvent[];
  formatted: {
    totalStaked: string;
    totalPendingRewards: string;
    totalClaimedRewards: string;
  };
}

export interface StakingEvent {
  actionType: string;
  amount: string;
  tierId: number;
  durationOption: number;
  timestamp: string;
  txHash: string;
  blockNumber: number;
}

export interface LeaderboardEntry {
  rank: number;
  address: string;
  totalStaked: string;
  totalClaimed: string;
  stakeCount: number;
  firstStake: string;
  lastActivity: string;
  avgTier: string;
}

export interface StakingAnalytics {
  timeframe: string;
  dailyActivity: {
    date: string;
    stakes: number;
    unstakes: number;
    claims: number;
    stake_volume: string;
    unique_users: number;
  }[];
  tierDistribution: {
    tierId: number;
    tierName: string;
    stakeCount: number;
    totalAmount: string;
  }[];
  durationDistribution: {
    durationOption: number;
    durationName: string;
    stakeCount: number;
    totalAmount: string;
  }[];
}

class StakingService {
  private baseEndpoint = '/api/staking';

  /**
   * Get overall staking statistics
   */
  async getStatistics(): Promise<StakingStatistics> {
    return apiRequest<StakingStatistics>(`${this.baseEndpoint}/statistics`);
  }

  /**
   * Get user's staking data and history
   */
  async getUserStakingData(address: string): Promise<UserStakingData> {
    return apiRequest<UserStakingData>(`${this.baseEndpoint}/user/${address}`);
  }

  /**
   * Get staking leaderboard
   */
  async getLeaderboard(params: {
    limit?: number;
    timeframe?: '7d' | '30d' | '90d' | 'all';
  } = {}): Promise<{
    leaderboard: LeaderboardEntry[];
    timeframe: string;
    totalUsers: number;
    showingTop: number;
  }> {
    const searchParams = new URLSearchParams();
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.timeframe) searchParams.append('timeframe', params.timeframe);

    const queryString = searchParams.toString();
    const endpoint = `${this.baseEndpoint}/leaderboard${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<{
      leaderboard: LeaderboardEntry[];
      timeframe: string;
      totalUsers: number;
      showingTop: number;
    }>(endpoint);
  }

  /**
   * Get detailed tier information
   */
  async getTiers(): Promise<{
    tiers: StakingTier[];
    durationMultipliers: {
      thirtyDays: number;
      sixtyDays: number;
      ninetyDays: number;
    };
  }> {
    return apiRequest<{
      tiers: StakingTier[];
      durationMultipliers: {
        thirtyDays: number;
        sixtyDays: number;
        ninetyDays: number;
      };
    }>(`${this.baseEndpoint}/tiers`);
  }

  /**
   * Get detailed staking analytics
   */
  async getAnalytics(timeframe: '7d' | '30d' | '90d' = '30d'): Promise<StakingAnalytics> {
    return apiRequest<StakingAnalytics>(
      `${this.baseEndpoint}/analytics?timeframe=${timeframe}`
    );
  }

  /**
   * Get tier name by ID
   */
  getTierName(tierId: number): string {
    const tierNames = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
    return tierNames[tierId] || `Tier ${tierId}`;
  }

  /**
   * Get duration name by option
   */
  getDurationName(durationOption: number): string {
    const durationNames = ['30 Days', '60 Days', '90 Days'];
    return durationNames[durationOption] || `Duration ${durationOption}`;
  }

  /**
   * Calculate effective APY with duration multiplier
   */
  calculateEffectiveAPY(baseAPY: number, durationOption: number): number {
    const multipliers = [100, 110, 125]; // 30d, 60d, 90d
    const multiplier = multipliers[durationOption] || 100;
    return (baseAPY * multiplier) / 100;
  }

  /**
   * Format stake amount for display
   */
  formatStakeAmount(amount: string): string {
    try {
      const numAmount = parseFloat(amount);
      if (numAmount >= 1000000) {
        return (numAmount / 1000000).toFixed(2) + 'M';
      } else if (numAmount >= 1000) {
        return (numAmount / 1000).toFixed(2) + 'K';
      } else {
        return numAmount.toFixed(2);
      }
    } catch {
      return '0';
    }
  }
}

export const stakingService = new StakingService(); 
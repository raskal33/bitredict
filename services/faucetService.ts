import { apiRequest, API_CONFIG } from '@/config/api';

export interface FaucetEligibility {
  address: string;
  eligible: boolean;
  reason: string;
  status: {
    hasClaimed: boolean;
    claimTime: string;
    hasSTTActivity: boolean;
    faucetHasBalance: boolean;
  };
  activity: {
    poolsCreated: number;
    betsPlaced: number;
    firstActivity: string | null;
    lastActivity: string | null;
    totalSTTActions: number;
  };
  requirements: {
    sttActivityRequired: boolean;
    message: string;
  };
}

export interface FaucetStatistics {
  faucet: {
    active: boolean;
    balance: string;
    totalDistributed: string;
    totalUsers: string;
    maxPossibleClaims: string;
    hasSufficientBalance: boolean;
  };
  constants: {
    faucetAmount: string;
    contractAddress: string;
  };
  formatted: {
    balance: string;
    totalDistributed: string;
    faucetAmount: string;
  };
}

export interface FaucetActivity {
  address: string;
  summary: {
    poolsCreated: number;
    betsPlaced: number;
    totalSTTActions: number;
    firstActivity: string | null;
    lastActivity: string | null;
  };
  activities: {
    poolId: number;
    type: string;
    amount: string;
    timestamp: string;
    description: string;
    category: string;
    league: string;
  }[];
  eligibility: {
    hasSTTActivity: boolean;
    message: string;
  };
}

export interface FaucetClaimRequest {
  address: string;
  signature?: string;
}

export interface FaucetClaimResponse {
  success: boolean;
  message: string;
  contractAddress?: string;
  method?: string;
  amount?: string;
  instructions?: string;
  activity?: any;
  error?: string;
}

class FaucetService {
  private baseEndpoint = API_CONFIG.endpoints.faucet;

  /**
   * Check if user is eligible to claim BITR from faucet
   */
  async checkEligibility(address: string): Promise<FaucetEligibility> {
    return apiRequest<FaucetEligibility>(`${this.baseEndpoint}/eligibility/${address}`);
  }

  /**
   * Get overall faucet statistics
   */
  async getStatistics(): Promise<FaucetStatistics> {
    return apiRequest<FaucetStatistics>(`${this.baseEndpoint}/statistics`);
  }

  /**
   * Get user's STT activity history for faucet eligibility
   */
  async getUserActivity(address: string): Promise<FaucetActivity> {
    return apiRequest<FaucetActivity>(`${this.baseEndpoint}/activity/${address}`);
  }

  /**
   * Validate eligibility and get claim instructions
   */
  async claimFaucet(request: FaucetClaimRequest): Promise<FaucetClaimResponse> {
    try {
      return await apiRequest<FaucetClaimResponse>(`${this.baseEndpoint}/claim`, {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch (error) {
      console.error('Error claiming faucet:', error);
      return {
        success: false,
        message: 'Network error occurred while claiming faucet',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Format address for display
   */
  formatAddress(address: string): string {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Format amount for display
   */
  formatAmount(amount: string): string {
    try {
      const numAmount = parseFloat(amount);
      if (numAmount >= 1000000) {
        return (numAmount / 1000000).toFixed(1) + 'M';
      } else if (numAmount >= 1000) {
        return (numAmount / 1000).toFixed(1) + 'K';
      } else {
        return numAmount.toLocaleString();
      }
    } catch {
      return '0';
    }
  }

  /**
   * Get activity type display name
   */
  getActivityTypeDisplay(type: string): string {
    const typeMap: { [key: string]: string } = {
      'POOL_CREATE': 'Pool Created',
      'BET_PLACE': 'Bet Placed',
      'STAKE': 'Staking',
      'UNSTAKE': 'Unstaking',
      'CLAIM_REWARDS': 'Rewards Claimed'
    };
    return typeMap[type] || type;
  }

  /**
   * Check if user has sufficient STT activity
   */
  hasSufficientActivity(activity: FaucetActivity): boolean {
    return activity.summary.totalSTTActions > 0;
  }

  /**
   * Get next steps for ineligible users
   */
  getNextSteps(eligibility: FaucetEligibility): string[] {
    const steps: string[] = [];

    if (eligibility.status.hasClaimed) {
      steps.push('You have already claimed from the faucet');
      return steps;
    }

    if (!eligibility.status.hasSTTActivity) {
      steps.push('Create a pool or place a bet using STT (Somnia Test Tokens)');
      steps.push('Visit the pool creation page to create your first pool');
      steps.push('Or browse existing pools to place a bet');
    }

    if (!eligibility.status.faucetHasBalance) {
      steps.push('Faucet needs to be refilled - contact team');
    }

    if (steps.length === 0) {
      steps.push('You are eligible to claim!');
    }

    return steps;
  }
}

export const faucetService = new FaucetService(); 
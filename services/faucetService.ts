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

export class FaucetService {
  private static baseUrl = API_CONFIG.baseURL;

  // Retry configuration
  private static retryConfig = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 5000,  // 5 seconds
  };

  // Exponential backoff retry function
  private static async retryWithBackoff<T>(
    fn: () => Promise<T>,
    retries = 0
  ): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (retries >= this.retryConfig.maxRetries) {
        throw error;
      }

      // Check if it's a rate limit error
      if (error.message?.includes('429') || error.status === 429) {
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(2, retries),
          this.retryConfig.maxDelay
        );
        
        console.log(`Rate limited, retrying in ${delay}ms... (attempt ${retries + 1}/${this.retryConfig.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryWithBackoff(fn, retries + 1);
      }

      throw error;
    }
  }

  static async getFaucetStatistics(): Promise<FaucetStatistics> {
    return this.retryWithBackoff(async () => {
      try {
        const response = await fetch(`${this.baseUrl}/api/faucet/statistics`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
        });

        if (!response.ok) {
          if (response.status === 429) {
            throw new Error(`Rate limited: ${response.status}`);
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('🔍 Backend Faucet Data:', data);
        return data;
      } catch (error) {
        console.error('Error fetching faucet statistics:', error);
        
        // Return fallback data if API is unavailable
        if (error instanceof Error && (error.message.includes('429') || error.message.includes('Failed to fetch'))) {
          console.warn('⚠️ API unavailable, using fallback data');
          return {
            faucet: {
              active: true,
              balance: '20000000000000000000000000', // 20M BITR
              totalDistributed: '0',
              totalUsers: '0',
              maxPossibleClaims: '1000',
              hasSufficientBalance: true,
            },
            constants: {
              faucetAmount: '20000000000000000000000', // 20K BITR
              contractAddress: '0x1656712131BB07dDE6EeC7D88757Db24782cab71',
            },
            formatted: {
              balance: '20,000,000.0 BITR',
              totalDistributed: '0.0 BITR',
              faucetAmount: '20,000 BITR',
            },
          };
        }
        
        throw error;
      }
    });
  }

  static async checkEligibility(address: string): Promise<any> {
    return this.retryWithBackoff(async () => {
      try {
        const response = await fetch(`${this.baseUrl}/api/faucet/eligibility/${address}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
        });

        if (!response.ok) {
          if (response.status === 429) {
            throw new Error(`Rate limited: ${response.status}`);
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        console.error('Error checking faucet eligibility:', error);
        
        // Return fallback eligibility data if API is unavailable
        if (error instanceof Error && (error.message.includes('429') || error.message.includes('Failed to fetch'))) {
          console.warn('⚠️ API unavailable, using fallback eligibility data');
          return {
            address,
            eligible: false,
            reason: 'API temporarily unavailable',
            status: {
              hasClaimed: false,
              claimTime: '0',
              hasSTTActivity: false,
              faucetHasBalance: true,
            },
            activity: {
              poolsCreated: 0,
              betsPlaced: 0,
              firstActivity: null,
              lastActivity: null,
              totalSTTActions: 0,
            },
            requirements: {
              sttActivityRequired: true,
              message: '❌ API temporarily unavailable - please try again later',
            },
          };
        }
        
        throw error;
      }
    });
  }
} 
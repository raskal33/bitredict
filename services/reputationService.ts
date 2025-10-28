/**
 * Unified Reputation Service
 * 
 * This service provides a unified interface for reputation management,
 * syncing between the on-chain ReputationSystem contract and local state.
 */

import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/wagmi';
import ReputationSystemArtifact from '@/contracts/abis/ReputationSystem.json';

// Extract ABI array from artifact
const ReputationSystemABI = ReputationSystemArtifact.abi;

export interface ReputationData {
  score: number;
  canCreateGuided: boolean;
  canCreateOpen: boolean;
  canPropose: boolean;
  isLoading: boolean;
  lastUpdated: Date;
}

export interface ReputationAction {
  id: string;
  type: string;
  points: number;
  description: string;
  timestamp: string;
  transactionHash?: string;
}

export interface UserReputationProfile {
  address: string;
  reputation: ReputationData;
  actions: ReputationAction[];
  tier: 'NEWCOMER' | 'ACTIVE' | 'REGULAR' | 'VETERAN' | 'EXPERT' | 'LEGENDARY';
  privileges: string[];
}

/**
 * Get reputation tier based on score
 */
export function getReputationTier(score: number): 'NEWCOMER' | 'ACTIVE' | 'REGULAR' | 'VETERAN' | 'EXPERT' | 'LEGENDARY' {
  if (score < 40) return 'NEWCOMER';
  if (score < 100) return 'ACTIVE';
  if (score < 200) return 'REGULAR';
  if (score < 300) return 'VETERAN';
  if (score < 400) return 'EXPERT';
  return 'LEGENDARY';
}

/**
 * Get privileges based on reputation score
 */
export function getReputationPrivileges(score: number): string[] {
  const privileges: string[] = [];
  
  if (score >= 0) privileges.push('Place bets');
  if (score >= 40) privileges.push('Create guided markets');
  if (score >= 100) privileges.push('Create open markets');
  if (score >= 100) privileges.push('Propose outcomes');
  if (score >= 300) privileges.push('Sell predictions');
  if (score >= 300) privileges.push('Share articles');
  
  return privileges;
}

/**
 * Hook to get user's reputation from contract
 */
export function useReputationData(address?: `0x${string}`) {
  const { data: reputationData, isLoading, refetch, error } = useReadContract({
    address: CONTRACT_ADDRESSES.REPUTATION_SYSTEM,
    abi: ReputationSystemABI,
    functionName: 'getReputationBundle',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    }
  });

  const parseReputationData = (): ReputationData => {
    if (!reputationData || !Array.isArray(reputationData)) {
      return {
        score: 0,
        canCreateGuided: false,
        canCreateOpen: false,
        canPropose: false,
        isLoading,
        lastUpdated: new Date(),
      };
    }

    const [score, canCreateGuided, canCreateOpen, canPropose] = reputationData;

    return {
      score: Number(score || 0),
      canCreateGuided: Boolean(canCreateGuided),
      canCreateOpen: Boolean(canCreateOpen),
      canPropose: Boolean(canPropose),
      isLoading,
      lastUpdated: new Date(),
    };
  };

  const reputation = parseReputationData();

  return {
    ...reputation,
    refetch,
    error,
  };
}

/**
 * Hook to get complete user reputation profile
 */
export function useUserReputationProfile(address?: `0x${string}`) {
  const reputationData = useReputationData(address);

  const profile: UserReputationProfile | null = address ? {
    address,
    reputation: reputationData,
    actions: [], // TODO: Fetch from backend API
    tier: getReputationTier(reputationData.score),
    privileges: getReputationPrivileges(reputationData.score),
  } : null;

  return {
    profile,
    isLoading: reputationData.isLoading,
    refetch: reputationData.refetch,
    error: reputationData.error,
  };
}

/**
 * Service class for reputation management
 */
export class ReputationService {
  private static instance: ReputationService;
  private cache: Map<string, ReputationData> = new Map();
  private lastFetch: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 seconds

  static getInstance(): ReputationService {
    if (!ReputationService.instance) {
      ReputationService.instance = new ReputationService();
    }
    return ReputationService.instance;
  }

  /**
   * Get reputation data with caching
   */
  async getReputationData(address: string): Promise<ReputationData> {
    const now = Date.now();
    const lastFetchTime = this.lastFetch.get(address) || 0;
    
    // Return cached data if still fresh
    if (now - lastFetchTime < this.CACHE_DURATION && this.cache.has(address)) {
      return this.cache.get(address)!;
    }

    try {
      // Fetch from contract (this would need to be implemented with a provider)
      const reputationData = await this.fetchFromContract(address);
      
      // Cache the result
      this.cache.set(address, reputationData);
      this.lastFetch.set(address, now);
      
      return reputationData;
    } catch (error) {
      console.error('Failed to fetch reputation data:', error);
      throw error;
    }
  }

  /**
   * Fetch reputation data from contract
   */
  private async fetchFromContract(address: string): Promise<ReputationData> {
    // This would need to be implemented with a proper provider
    // For now, return default data
    return {
      score: 40,
      canCreateGuided: true,
      canCreateOpen: false,
      canPropose: false,
      isLoading: false,
      lastUpdated: new Date(),
    };
  }

  /**
   * Clear cache for a specific address
   */
  clearCache(address: string): void {
    this.cache.delete(address);
    this.lastFetch.delete(address);
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.cache.clear();
    this.lastFetch.clear();
  }

  /**
   * Get reputation actions from backend
   */
  async getReputationActions(address: string): Promise<ReputationAction[]> {
    try {
      const response = await fetch(`/api/reputation/user/${address}`);
      if (!response.ok) {
        throw new Error('Failed to fetch reputation actions');
      }
      const data = await response.json();
      // Backend returns { success: true, data: { history: [...] } }
      return data?.data?.history || [];
    } catch (error) {
      console.error('Failed to fetch reputation actions:', error);
      return [];
    }
  }

  /**
   * Get reputation leaderboard
   */
  async getReputationLeaderboard(limit: number = 100): Promise<UserReputationProfile[]> {
    try {
      const response = await fetch(`/api/reputation/leaderboard?limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      const data = await response.json();
      // Backend returns { success: true, data: [...] }
      return data?.data || [];
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      return [];
    }
  }
}

// Export singleton instance
export const reputationService = ReputationService.getInstance();

import { ethers } from 'ethers';

// ============================================================================
// CONTRACT ANALYTICS SERVICE - Real-time blockchain data
// ============================================================================

export interface ContractGlobalStats {
  totalPools: bigint;
  totalVolume: bigint;
  averagePoolSize: bigint;
  lastUpdated: bigint;
}

export interface ContractPoolAnalytics {
  totalVolume: bigint;
  participantCount: bigint;
  averageBetSize: bigint;
  creatorReputation: bigint;
  liquidityRatio: bigint;
  timeToFill: bigint;
  isHotPool: boolean;
  fillPercentage: bigint;
  lastActivityTime: bigint;
}

export interface ContractCreatorStats {
  totalPoolsCreated: bigint;
  successfulPools: bigint;
  totalVolumeGenerated: bigint;
  averagePoolSize: bigint;
  reputationScore: bigint;
  winRate: bigint;
  totalEarnings: bigint;
  activePoolsCount: bigint;
}

export interface ContractCategoryStats {
  totalPools: bigint;
  totalVolume: bigint;
  averageOdds: bigint;
  lastActivityTime: bigint;
}

export interface MarketTypeDistribution {
  moneyline: number;
  overUnder: number;
  spread: number;
  doubleChance: number;
  htft: number;
  goalScorer: number;
  correctScore: number;
  custom: number;
}

export interface OracleTypeDistribution {
  guided: number;
  open: number;
}

class ContractAnalyticsService {
  /**
   * Get global platform statistics from contract
   */
  async getGlobalStats(): Promise<ContractGlobalStats> {
    try {
      const stats = await web3Service.getGlobalPoolStats();
      return {
        totalPools: stats.totalPools,
        totalVolume: stats.totalVolume,
        averagePoolSize: stats.averagePoolSize,
        lastUpdated: stats.lastUpdated,
      };
    } catch (error) {
      console.error('Error fetching global stats from contract:', error);
      throw error;
    }
  }

  /**
   * Get pool-specific analytics from contract
   */
  async getPoolAnalytics(poolId: number): Promise<ContractPoolAnalytics> {
    try {
      const analytics = await web3Service.getPoolAnalytics(poolId);
      return analytics;
    } catch (error) {
      console.error(`Error fetching pool analytics for pool ${poolId}:`, error);
      throw error;
    }
  }

  /**
   * Get creator statistics from contract
   */
  async getCreatorStats(address: string): Promise<ContractCreatorStats> {
    try {
      const stats = await web3Service.getCreatorStats(address);
      return stats;
    } catch (error) {
      console.error(`Error fetching creator stats for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get category statistics from contract
   */
  async getCategoryStats(categoryHash: string): Promise<ContractCategoryStats> {
    try {
      const stats = await web3Service.getCategoryStats(categoryHash);
      return stats;
    } catch (error) {
      console.error(`Error fetching category stats for ${categoryHash}:`, error);
      throw error;
    }
  }

  /**
   * Get market type distribution from contract
   */
  async getMarketTypeDistribution(): Promise<MarketTypeDistribution> {
    try {
      const distribution = await web3Service.getMarketTypeDistribution();
      
      // Convert BigInt array to numbers
      return {
        moneyline: Number(distribution[0] || 0n),
        overUnder: Number(distribution[1] || 0n),
        spread: Number(distribution[2] || 0n),
        doubleChance: Number(distribution[3] || 0n),
        htft: Number(distribution[4] || 0n),
        goalScorer: Number(distribution[5] || 0n),
        correctScore: Number(distribution[6] || 0n),
        custom: Number(distribution[7] || 0n),
      };
    } catch (error) {
      console.error('Error fetching market type distribution:', error);
      throw error;
    }
  }

  /**
   * Get oracle type distribution from contract
   */
  async getOracleTypeDistribution(): Promise<OracleTypeDistribution> {
    try {
      const distribution = await web3Service.getOracleTypeDistribution();
      
      return {
        guided: Number(distribution[0] || 0n),
        open: Number(distribution[1] || 0n),
      };
    } catch (error) {
      console.error('Error fetching oracle type distribution:', error);
      throw error;
    }
  }

  /**
   * Get active pools from contract
   */
  async getActivePools(limit: number = 50): Promise<bigint[]> {
    try {
      return await web3Service.getActivePools(limit);
    } catch (error) {
      console.error('Error fetching active pools:', error);
      throw error;
    }
  }

  /**
   * Get pools by creator from contract
   */
  async getPoolsByCreator(creator: string, limit: number = 50): Promise<bigint[]> {
    try {
      return await web3Service.getPoolsByCreator(creator, limit);
    } catch (error) {
      console.error(`Error fetching pools by creator ${creator}:`, error);
      throw error;
    }
  }

  /**
   * Get pools by category from contract
   */
  async getPoolsByCategory(categoryHash: string): Promise<bigint[]> {
    try {
      return await web3Service.getPoolsByCategory(categoryHash);
    } catch (error) {
      console.error(`Error fetching pools by category ${categoryHash}:`, error);
      throw error;
    }
  }

  /**
   * Get pools by market type from contract
   */
  async getPoolsByMarketType(marketType: number, limit: number = 50): Promise<bigint[]> {
    try {
      return await web3Service.getPoolsByMarketType(marketType, limit);
    } catch (error) {
      console.error(`Error fetching pools by market type ${marketType}:`, error);
      throw error;
    }
  }

  /**
   * Get pools by oracle type from contract
   */
  async getPoolsByOracleType(oracleType: number, limit: number = 50): Promise<bigint[]> {
    try {
      return await web3Service.getPoolsByOracleType(oracleType, limit);
    } catch (error) {
      console.error(`Error fetching pools by oracle type ${oracleType}:`, error);
      throw error;
    }
  }

  /**
   * Format BigInt values to human-readable strings
   */
  formatVolume(volume: bigint): string {
    const eth = Number(ethers.formatEther(volume));
    if (eth >= 1000000) return `${(eth / 1000000).toFixed(2)}M`;
    if (eth >= 1000) return `${(eth / 1000).toFixed(2)}K`;
    return eth.toFixed(4);
  }

  /**
   * Format win rate percentage
   */
  formatWinRate(winRate: bigint): string {
    return `${Number(winRate) / 100}%`;
  }

  /**
   * Format reputation score
   */
  formatReputation(reputation: bigint): string {
    return Number(reputation).toLocaleString();
  }
}

// Export singleton instance
const contractAnalyticsService = new ContractAnalyticsService();
export default contractAnalyticsService;


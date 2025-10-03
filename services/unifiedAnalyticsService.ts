import contractAnalyticsService, {
  ContractGlobalStats,
  ContractPoolAnalytics,
  ContractCreatorStats,
  MarketTypeDistribution,
  OracleTypeDistribution,
} from './contractAnalyticsService';
import analyticsService, {
  GlobalStats,
  CategoryStats,
  TopCreator,
  TopBettor,
} from './analyticsService';
import { ethers } from 'ethers';

// ============================================================================
// UNIFIED ANALYTICS SERVICE - Best of Contract + Backend
// ============================================================================

export interface UnifiedGlobalStats {
  // Real-time contract data
  contract: {
    totalPools: number;
    totalVolume: string; // formatted ETH
    averagePoolSize: string;
    lastUpdated: Date;
  };
  // Historical backend data
  backend: {
    totalBets: number;
    activePools: number;
    growth24h: number;
    growth7d: number;
  };
  // Combined insights
  combined: {
    platformHealth: 'healthy' | 'growing' | 'declining';
    activityScore: number;
    volumeTrend: 'up' | 'down' | 'stable';
  };
}

export interface UnifiedPoolAnalytics {
  contract: {
    totalVolume: string;
    participantCount: number;
    averageBetSize: string;
    liquidityRatio: number;
    isHotPool: boolean;
    fillPercentage: number;
  };
  backend: {
    viewCount: number;
    commentCount: number;
    shareCount: number;
    viralityScore: number;
  };
  insights: {
    trending: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    recommendation: string;
  };
}

export interface UnifiedCreatorProfile {
  contract: {
    totalPools: number;
    totalVolume: string;
    reputationScore: number;
    winRate: number;
    activePoolsCount: number;
  };
  backend: {
    followers: number;
    avgPoolPerformance: number;
    lastActive: Date;
    verifiedStatus: boolean;
  };
  insights: {
    reliability: number;
    expertise: string[];
    badges: string[];
  };
}

class UnifiedAnalyticsService {
  /**
   * Get comprehensive global statistics
   */
  async getUnifiedGlobalStats(timeframe: '24h' | '7d' | '30d' | 'all' = '7d'): Promise<UnifiedGlobalStats> {
    try {
      // Fetch both contract and backend data in parallel
      const [contractData, backendData] = await Promise.all([
        contractAnalyticsService.getGlobalStats(),
        analyticsService.getGlobalStats(timeframe),
      ]);

      const totalVolume = Number(ethers.formatEther(contractData.totalVolume));
      const totalPools = Number(contractData.totalPools);
      const avgPoolSize = totalPools > 0 ? totalVolume / totalPools : 0;

      // Calculate combined insights
      const volumeTrend = this.calculateVolumeTrend(backendData);
      const activityScore = this.calculateActivityScore(
        Number(contractData.totalPools),
        backendData.totalBets,
        backendData.activePools
      );

      return {
        contract: {
          totalPools: Number(contractData.totalPools),
          totalVolume: this.formatVolume(totalVolume),
          averagePoolSize: this.formatVolume(avgPoolSize),
          lastUpdated: new Date(Number(contractData.lastUpdated) * 1000),
        },
        backend: {
          totalBets: backendData.totalBets || 0,
          activePools: backendData.activePools || 0,
          growth24h: 0, // TODO: Calculate from historical data
          growth7d: 0,
        },
        combined: {
          platformHealth: this.determinePlatformHealth(activityScore),
          activityScore,
          volumeTrend,
        },
      };
    } catch (error) {
      console.error('Error fetching unified global stats:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive pool analytics
   */
  async getUnifiedPoolAnalytics(poolId: number): Promise<UnifiedPoolAnalytics> {
    try {
      const contractData = await contractAnalyticsService.getPoolAnalytics(poolId);

      const totalVolume = Number(ethers.formatEther(contractData.totalVolume));
      const avgBetSize = Number(contractData.participantCount) > 0
        ? totalVolume / Number(contractData.participantCount)
        : 0;

      // Determine risk level
      const riskLevel = this.calculateRiskLevel(
        Number(contractData.fillPercentage),
        Number(contractData.liquidityRatio)
      );

      return {
        contract: {
          totalVolume: this.formatVolume(totalVolume),
          participantCount: Number(contractData.participantCount),
          averageBetSize: this.formatVolume(avgBetSize),
          liquidityRatio: Number(contractData.liquidityRatio) / 100,
          isHotPool: contractData.isHotPool,
          fillPercentage: Number(contractData.fillPercentage) / 100,
        },
        backend: {
          viewCount: 0, // TODO: Implement view tracking
          commentCount: 0,
          shareCount: 0,
          viralityScore: 0,
        },
        insights: {
          trending: contractData.isHotPool,
          riskLevel,
          recommendation: this.generatePoolRecommendation(
            contractData.isHotPool,
            riskLevel,
            Number(contractData.fillPercentage)
          ),
        },
      };
    } catch (error) {
      console.error(`Error fetching unified pool analytics for pool ${poolId}:`, error);
      throw error;
    }
  }

  /**
   * Get comprehensive creator profile
   */
  async getUnifiedCreatorProfile(address: string): Promise<UnifiedCreatorProfile> {
    try {
      const contractData = await contractAnalyticsService.getCreatorStats(address);

      const totalVolume = Number(ethers.formatEther(contractData.totalVolumeGenerated));
      const winRate = Number(contractData.winRate) / 100;

      return {
        contract: {
          totalPools: Number(contractData.totalPoolsCreated),
          totalVolume: this.formatVolume(totalVolume),
          reputationScore: Number(contractData.reputationScore),
          winRate,
          activePoolsCount: Number(contractData.activePoolsCount),
        },
        backend: {
          followers: 0, // TODO: Implement follower system
          avgPoolPerformance: 0,
          lastActive: new Date(),
          verifiedStatus: false,
        },
        insights: {
          reliability: this.calculateReliability(winRate, Number(contractData.totalPoolsCreated)),
          expertise: this.determineExpertise(Number(contractData.totalPoolsCreated), winRate),
          badges: this.generateBadges(contractData),
        },
      };
    } catch (error) {
      console.error(`Error fetching unified creator profile for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get market intelligence combining contract + backend data
   */
  async getMarketIntelligence(timeframe: '24h' | '7d' | '30d' = '7d') {
    try {
      const [marketDistribution, oracleDistribution, categoryStats] = await Promise.all([
        contractAnalyticsService.getMarketTypeDistribution(),
        contractAnalyticsService.getOracleTypeDistribution(),
        analyticsService.getCategoryStats(timeframe),
      ]);

      return {
        marketTypes: marketDistribution,
        oracleTypes: oracleDistribution,
        categories: categoryStats,
        insights: {
          mostPopularMarketType: this.findMostPopular(marketDistribution),
          preferredOracleType: oracleDistribution.guided > oracleDistribution.open ? 'Guided' : 'Open',
          trendingCategories: this.findTrendingCategories(categoryStats),
        },
      };
    } catch (error) {
      console.error('Error fetching market intelligence:', error);
      throw error;
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private formatVolume(volume: number): string {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(2)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(2)}K`;
    return volume.toFixed(4);
  }

  private calculateVolumeTrend(data: GlobalStats): 'up' | 'down' | 'stable' {
    // TODO: Implement actual trend calculation with historical data
    return 'stable';
  }

  private calculateActivityScore(totalPools: number, totalBets: number, activePools: number): number {
    if (totalPools === 0) return 0;
    
    const poolUtilization = activePools / totalPools;
    const avgBetsPerPool = totalBets / totalPools;
    
    // Score from 0-100
    return Math.min(100, Math.round((poolUtilization * 40) + (Math.min(avgBetsPerPool / 10, 1) * 60)));
  }

  private determinePlatformHealth(activityScore: number): 'healthy' | 'growing' | 'declining' {
    if (activityScore >= 70) return 'growing';
    if (activityScore >= 40) return 'healthy';
    return 'declining';
  }

  private calculateRiskLevel(fillPercentage: number, liquidityRatio: number): 'low' | 'medium' | 'high' {
    if (fillPercentage < 50 || liquidityRatio < 100) return 'high';
    if (fillPercentage < 80 || liquidityRatio < 150) return 'medium';
    return 'low';
  }

  private generatePoolRecommendation(isHot: boolean, risk: string, fill: number): string {
    if (isHot && risk === 'low') return 'Highly recommended - Hot pool with low risk';
    if (risk === 'high') return 'Proceed with caution - High risk pool';
    if (fill > 80) return 'Almost full - Join quickly!';
    return 'Good opportunity - Moderate risk and activity';
  }

  private calculateReliability(winRate: number, totalPools: number): number {
    // Reliability based on win rate and experience
    const experienceWeight = Math.min(totalPools / 100, 1);
    return Math.round((winRate * 0.7 + experienceWeight * 0.3) * 100);
  }

  private determineExpertise(totalPools: number, winRate: number): string[] {
    const expertise: string[] = [];
    
    if (totalPools >= 100) expertise.push('Experienced Creator');
    if (totalPools >= 50) expertise.push('Active Creator');
    if (winRate >= 70) expertise.push('High Success Rate');
    if (winRate >= 85) expertise.push('Elite Performance');
    
    return expertise.length > 0 ? expertise : ['New Creator'];
  }

  private generateBadges(stats: ContractCreatorStats): string[] {
    const badges: string[] = [];
    
    if (Number(stats.totalPoolsCreated) >= 100) badges.push('Century Maker');
    if (Number(stats.totalPoolsCreated) >= 50) badges.push('Active Creator');
    if (Number(stats.winRate) >= 8500) badges.push('Elite Winner');
    if (Number(stats.totalVolumeGenerated) >= ethers.parseEther('1000')) badges.push('Volume Leader');
    
    return badges;
  }

  private findMostPopular(distribution: MarketTypeDistribution): string {
    const entries = Object.entries(distribution);
    const max = entries.reduce((a, b) => (a[1] > b[1] ? a : b));
    return max[0].charAt(0).toUpperCase() + max[0].slice(1);
  }

  private findTrendingCategories(stats: any): string[] {
    // TODO: Implement with actual category data
    return ['Football', 'Crypto', 'NBA'];
  }
}

// Export singleton instance
const unifiedAnalyticsService = new UnifiedAnalyticsService();
export default unifiedAnalyticsService;


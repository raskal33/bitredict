import { Address } from 'viem';

// Analytics API endpoints
const API_BASE = '/api/oddyssey/smart-analytics';

// Type definitions for analytics data
export interface SlipProbability {
  slipId: string;
  overallProbability: number;
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  confidenceScore: number;
  predictionBreakdown: {
    matchId: number;
    probability: number;
    selection: string;
    confidence: number;
  }[];
}

export interface PopularSelections {
  cycleId: number;
  totalSlips: number;
  selections: {
    selection: string;
    count: number;
    percentage: number;
    matchId: number;
    homeTeam: string;
    awayTeam: string;
  }[];
  trends: {
    mostPopular: string;
    leastPopular: string;
    surprisingPick: string;
  };
}

export interface MatchAnalytics {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  totalPredictions: number;
  selectionBreakdown: {
    '1': { count: number; percentage: number };
    'X': { count: number; percentage: number };
    '2': { count: number; percentage: number };
    'Over': { count: number; percentage: number };
    'Under': { count: number; percentage: number };
  };
  communityConfidence: number;
  expectedOutcome: string;
  surpriseFactor: number;
}

export interface CycleAnalytics {
  cycleId: number;
  participationMetrics: {
    totalSlips: number;
    uniqueUsers: number;
    averageSlipsPerUser: number;
    participationGrowth: number;
  };
  performanceMetrics: {
    averageCorrectPredictions: number;
    winRate: number;
    highestScore: number;
    perfectSlips: number;
  };
  popularityTrends: {
    mostPopularMatch: { matchId: number; predictions: number };
    mostPopularSelection: { selection: string; count: number };
    surprisingResults: string[];
  };
  insights: string[];
}

export interface UserAnalytics {
  address: string;
  performanceMetrics: {
    totalSlips: number;
    winRate: number;
    averageScore: number;
    bestStreak: number;
    currentStreak: number;
    improvement: number;
  };
  behaviorPatterns: {
    favoriteSelections: { selection: string; frequency: number }[];
    riskProfile: 'conservative' | 'balanced' | 'aggressive';
    activityPattern: 'casual' | 'regular' | 'hardcore';
  };
  achievements: {
    badges: string[];
    milestones: string[];
    rankings: { category: string; position: number; total: number }[];
  };
  insights: string[];
}

export interface PlatformAnalytics {
  globalMetrics: {
    totalUsers: number;
    totalSlips: number;
    totalVolume: number;
    averageWinRate: number;
    cyclesCompleted: number;
  };
  engagementMetrics: {
    dailyActiveUsers: number;
    retentionRate: number;
    averageSessionTime: number;
    bounceRate: number;
  };
  performanceInsights: {
    topPerformers: { address: string; score: number }[];
    communityTrends: string[];
    platformHealth: 'excellent' | 'good' | 'fair' | 'poor';
  };
  insights: string[];
}

export interface VisualizationData {
  cycleId: number;
  charts: {
    selectionDistribution: {
      labels: string[];
      data: number[];
      colors: string[];
    };
    performanceTrends: {
      labels: string[];
      datasets: {
        label: string;
        data: number[];
        color: string;
      }[];
    };
    participationFlow: {
      nodes: { id: string; label: string; value: number }[];
      links: { source: string; target: string; value: number }[];
    };
    heatmap: {
      matches: { matchId: number; intensity: number; selections: number }[];
      maxIntensity: number;
    };
  };
  infographics: {
    keyStats: { label: string; value: string; trend: number }[];
    insights: { title: string; description: string; impact: 'positive' | 'negative' | 'neutral' }[];
  };
}

// ============================================================================
// NEW: Pool Analytics Interfaces
// ============================================================================

export interface PoolAnalytics {
  poolId: number;
  popularityScore: number; // 0-10000
  riskLevel: number; // 1-5
  riskFactors: string[];
  efficiencyScore: number; // 0-10000
  utilizationRate: number; // 0-100%
  participantCount: number;
  totalVolume: string;
  creatorReputation: number;
}

export interface PotentialWinnings {
  poolId: number;
  stake: string;
  grossPayout: string;
  netPayout: string;
  feeAmount: string;
  profit: string;
  roi: string; // percentage
  winProbability: number; // 0-100
  breakEvenOdds: string;
}

export interface CreatorReputation {
  creatorAddress: Address;
  reputationScore: number; // 0-100
  totalPoolsCreated: number;
  successfulPools: number;
  totalVolumeCreated: string;
  averagePoolSize: string;
  averageRoi: string;
  participantSatisfaction: number; // 0-100
  trustScore: number; // 0-100
  badges: string[];
}

export interface MarketTrend {
  poolId: number;
  trendDirection: 'up' | 'down' | 'stable';
  trendStrength: number; // 0-100
  volumeRatio: string;
  participantMomentum: number; // -100 to 100
  priceMovement: string;
  predictedOutcome: string;
  confidenceLevel: number; // 0-100
}

// ============================================================================
// API Service
// ============================================================================

export class PoolAnalyticsService {
  private static readonly API_BASE = '/api/pool-analytics';
  private static readonly CACHE_DURATION = 30000; // 30 seconds
  private static cache = new Map<string, { data: any; timestamp: number }>();

  /**
   * Get pool analytics
   */
  static async getPoolAnalytics(poolId: number): Promise<PoolAnalytics | null> {
    const cacheKey = `pool-analytics-${poolId}`;
    
    if (this.isCached(cacheKey)) {
      return this.cache.get(cacheKey)?.data;
    }

    try {
      const response = await fetch(`${this.API_BASE}/${poolId}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      this.setCache(cacheKey, data.data);
      return data.data;
    } catch (error) {
      console.error('Error fetching pool analytics:', error);
      return null;
    }
  }

  /**
   * Get potential winnings for a bet
   */
  static async getPotentialWinnings(
    poolId: number,
    stakeAmount: string,
    selectedOdds: number
  ): Promise<PotentialWinnings | null> {
    const cacheKey = `potential-winnings-${poolId}-${stakeAmount}`;
    
    if (this.isCached(cacheKey)) {
      return this.cache.get(cacheKey)?.data;
    }

    try {
      const params = new URLSearchParams({
        stake: stakeAmount,
        odds: selectedOdds.toString()
      });

      const response = await fetch(
        `${this.API_BASE}/${poolId}/potential-winnings?${params}`
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      this.setCache(cacheKey, data.data);
      return data.data;
    } catch (error) {
      console.error('Error fetching potential winnings:', error);
      return null;
    }
  }

  /**
   * Get creator reputation
   */
  static async getCreatorReputation(
    creatorAddress: Address
  ): Promise<CreatorReputation | null> {
    const cacheKey = `creator-reputation-${creatorAddress}`;
    
    if (this.isCached(cacheKey)) {
      return this.cache.get(cacheKey)?.data;
    }

    try {
      const response = await fetch(
        `${this.API_BASE}/creator/${creatorAddress}`
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      this.setCache(cacheKey, data.data);
      return data.data;
    } catch (error) {
      console.error('Error fetching creator reputation:', error);
      return null;
    }
  }

  /**
   * Get market trend
   */
  static async getMarketTrend(poolId: number): Promise<MarketTrend | null> {
    const cacheKey = `market-trend-${poolId}`;
    
    if (this.isCached(cacheKey)) {
      return this.cache.get(cacheKey)?.data;
    }

    try {
      const response = await fetch(`${this.API_BASE}/${poolId}/market-trend`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      this.setCache(cacheKey, data.data);
      return data.data;
    } catch (error) {
      console.error('Error fetching market trend:', error);
      return null;
    }
  }

  /**
   * Clear cache
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Private helper methods
   */
  private static isCached(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    const isExpired = Date.now() - cached.timestamp > this.CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  private static setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}


class AnalyticsService {
  // Slip probability analysis
  async getSlipProbability(slipId: string): Promise<SlipProbability> {
    try {
      const response = await fetch(`${API_BASE}/slip/${slipId}/probability`);
      if (!response.ok) throw new Error('Failed to fetch slip probability');
      return await response.json();
    } catch (error) {
      console.error('Error fetching slip probability:', error);
      // Return mock data for development
      return this.getMockSlipProbability(slipId);
    }
  }

  // Popular selections for a cycle
  async getCycleSelections(cycleId: number): Promise<PopularSelections> {
    try {
      const response = await fetch(`${API_BASE}/cycle/${cycleId}/selections`);
      if (!response.ok) throw new Error('Failed to fetch cycle selections');
      return await response.json();
    } catch (error) {
      console.error('Error fetching cycle selections:', error);
      return this.getMockCycleSelections(cycleId);
    }
  }

  // Match-specific analytics
  async getMatchAnalytics(matchId: number): Promise<MatchAnalytics> {
    try {
      const response = await fetch(`${API_BASE}/match/${matchId}/analytics`);
      if (!response.ok) throw new Error('Failed to fetch match analytics');
      return await response.json();
    } catch (error) {
      console.error('Error fetching match analytics:', error);
      return this.getMockMatchAnalytics(matchId);
    }
  }

  // Cycle analytics
  async getCycleAnalytics(cycleId: number): Promise<CycleAnalytics> {
    try {
      // Fetch from smart analytics backend endpoint
      const response = await fetch(`${API_BASE}/cycle/${cycleId}/analytics`, {
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch cycle analytics');
      
      const result = await response.json();
      const data = result.data;
      
      // Safe number parsing with explicit null/undefined handling
      const totalSlips = parseInt(String(data.databaseAnalytics?.total_slips || '0')) || 0;
      const participants = parseInt(String(data.databaseAnalytics?.unique_players || '0')) || 0;
      const avgCorrectRaw = data.databaseAnalytics?.avg_correct_predictions;
      const avgCorrect = (avgCorrectRaw === null || avgCorrectRaw === undefined || isNaN(parseFloat(String(avgCorrectRaw)))) ? 0 : parseFloat(String(avgCorrectRaw));
      const maxCorrectRaw = data.databaseAnalytics?.max_correct_predictions;
      const maxCorrect = (maxCorrectRaw === null || maxCorrectRaw === undefined || isNaN(parseInt(String(maxCorrectRaw)))) ? 0 : parseInt(String(maxCorrectRaw));
      
      // Transform backend data to match CycleAnalytics interface
      return {
        cycleId: data.cycleId || cycleId,
        participationMetrics: {
          totalSlips,
          uniqueUsers: participants,
          averageSlipsPerUser: participants > 0 ? parseFloat((totalSlips / participants).toFixed(2)) : 0,
          participationGrowth: 0 // TODO: calculate from historical data
        },
        performanceMetrics: {
          averageCorrectPredictions: parseFloat(avgCorrect.toFixed(2)),
          winRate: maxCorrect >= 7 && totalSlips > 0 ? parseFloat(((1 / totalSlips) * 100).toFixed(2)) : 0,
          highestScore: maxCorrect,
          perfectSlips: 0 // TODO: query slips with all correct
        },
        popularityTrends: {
          mostPopularMatch: data.matchAnalytics && data.matchAnalytics.length > 0 ? {
            matchId: parseInt(data.matchAnalytics[0].matchId) || 0,
            predictions: data.matchAnalytics[0].selections?.length || 0
          } : { matchId: 0, predictions: 0 },
          mostPopularSelection: data.popularSelections && data.popularSelections.length > 0 ? {
            selection: data.popularSelections[0].prediction?.selection || '1',
            count: data.popularSelections[0].playCount || 0
          } : { selection: '1', count: 0 },
          surprisingResults: []
        },
        insights: data.insights && data.insights.length > 0 
          ? data.insights.map((i: any) => i.message || '') 
          : totalSlips > 0 
            ? [`${totalSlips} slips placed by ${participants} participants`, `Average ${avgCorrect.toFixed(1)} correct predictions per slip`]
            : ['No data available for this cycle yet']
      };
    } catch (error) {
      console.error('Error fetching cycle analytics:', error);
      return this.getMockCycleAnalytics(cycleId);
    }
  }

  // User analytics
  async getUserAnalytics(address: Address): Promise<UserAnalytics> {
    try {
      // Fetch from smart analytics backend endpoint
      const response = await fetch(`${API_BASE}/user/${address}/analytics`, {
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch user analytics');
      
      const result = await response.json();
      const data = result.data;
      
      // Safe number parsing with explicit null/undefined handling
      const totalSlipsRaw = data.contractData?.totalSlips || data.databaseAnalytics?.total_slips;
      const totalSlips = (totalSlipsRaw === null || totalSlipsRaw === undefined || isNaN(parseInt(String(totalSlipsRaw)))) ? 0 : parseInt(String(totalSlipsRaw));
      const winRateRaw = data.contractData?.winRate;
      const winRate = (winRateRaw === null || winRateRaw === undefined || isNaN(parseFloat(String(winRateRaw)))) ? 0 : parseFloat(String(winRateRaw));
      const averageScoreRaw = data.contractData?.averageScore || data.databaseAnalytics?.avg_accuracy;
      const averageScore = (averageScoreRaw === null || averageScoreRaw === undefined || isNaN(parseFloat(String(averageScoreRaw)))) ? 0 : parseFloat(String(averageScoreRaw));
      const bestStreakRaw = data.contractData?.bestStreak;
      const bestStreak = (bestStreakRaw === null || bestStreakRaw === undefined || isNaN(parseInt(String(bestStreakRaw)))) ? 0 : parseInt(String(bestStreakRaw));
      const currentStreakRaw = data.contractData?.currentStreak;
      const currentStreak = (currentStreakRaw === null || currentStreakRaw === undefined || isNaN(parseInt(String(currentStreakRaw)))) ? 0 : parseInt(String(currentStreakRaw));
      
      // Transform backend data to match UserAnalytics interface
      return {
        address,
        performanceMetrics: {
          totalSlips,
          winRate: parseFloat((winRate * 100).toFixed(2)), // Convert to percentage
          averageScore: parseFloat(averageScore.toFixed(2)),
          bestStreak,
          currentStreak,
          improvement: 0 // TODO: calculate improvement over time
        },
        behaviorPatterns: {
          favoriteSelections: [], // TODO: analyze user predictions
          riskProfile: 'balanced',
          activityPattern: totalSlips > 5 ? 'regular' : 'casual'
        },
        achievements: {
          badges: [], // TODO: implement badge system
          milestones: [],
          rankings: [] // TODO: fetch from leaderboard
        },
        insights: data.insights && data.insights.length > 0 
          ? data.insights.map((i: any) => i.message || '') 
          : totalSlips > 0 
            ? [`${totalSlips} total slips placed`, `${(winRate * 100).toFixed(1)}% win rate`]
            : ['No data available yet']
      };
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      return this.getMockUserAnalytics(address);
    }
  }

  // Platform analytics
  async getPlatformAnalytics(): Promise<PlatformAnalytics> {
    try {
      // Fetch from smart analytics backend endpoint
      const response = await fetch(`${API_BASE}/platform/analytics`, {
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch platform analytics');
      
      const result = await response.json();
      const data = result.data;
      
      // Safe number parsing with explicit null/undefined handling
      const totalPlayersRaw = data.platformStats?.unique_players;
      const totalPlayers = (totalPlayersRaw === null || totalPlayersRaw === undefined || isNaN(parseInt(String(totalPlayersRaw)))) ? 0 : parseInt(String(totalPlayersRaw));
      const totalSlipsRaw = data.platformStats?.total_slips;
      const totalSlips = (totalSlipsRaw === null || totalSlipsRaw === undefined || isNaN(parseInt(String(totalSlipsRaw)))) ? 0 : parseInt(String(totalSlipsRaw));
      const totalCyclesRaw = data.platformStats?.total_cycles;
      const totalCycles = (totalCyclesRaw === null || totalCyclesRaw === undefined || isNaN(parseInt(String(totalCyclesRaw)))) ? 0 : parseInt(String(totalCyclesRaw));
      const avgAccuracyRaw = data.platformStats?.avg_accuracy;
      const avgAccuracy = (avgAccuracyRaw === null || avgAccuracyRaw === undefined || isNaN(parseFloat(String(avgAccuracyRaw)))) ? 0 : parseFloat(String(avgAccuracyRaw));
      const bestScoreRaw = data.platformStats?.best_score;
      const bestScore = (bestScoreRaw === null || bestScoreRaw === undefined || isNaN(parseFloat(String(bestScoreRaw)))) ? 0 : parseFloat(String(bestScoreRaw));
      
      // Transform backend data to match PlatformAnalytics interface
      return {
        globalMetrics: {
          totalUsers: totalPlayers,
          totalSlips,
          totalVolume: 0, // TODO: calculate from prize pools
          averageWinRate: 0, // TODO: calculate win rate
          cyclesCompleted: totalCycles
        },
        engagementMetrics: {
          dailyActiveUsers: totalPlayers, // TODO: implement DAU tracking
          retentionRate: 0, // TODO: calculate retention
          averageSessionTime: 0, // TODO: track session time
          bounceRate: 0 // TODO: track bounce rate
        },
        performanceInsights: {
          topPerformers: [], // TODO: fetch leaderboard
          communityTrends: totalSlips > 0 ? [`${avgAccuracy.toFixed(1)} average correct predictions`] : [],
          platformHealth: totalSlips > 0 && totalPlayers > 0 ? 'good' : 'fair'
        },
        insights: data.insights && data.insights.length > 0
          ? data.insights.map((i: any) => i.message || '')
          : [
              `${totalPlayers} active players`,
              `${totalSlips} total slips placed`,
              `${bestScore.toFixed(2)} best score achieved`
            ]
      };
    } catch (error) {
      console.error('Error fetching platform analytics:', error);
      return this.getMockPlatformAnalytics();
    }
  }

  // Visualization data
  async getVisualizationData(cycleId: number): Promise<VisualizationData> {
    try {
      // Fetch cycle analytics from smart analytics endpoint
      const response = await fetch(`${API_BASE}/cycle/${cycleId}/analytics`, {
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch visualization data');
      }
      
      const result = await response.json();
      const data = result.data;
      
      // Safe number parsing with explicit null/undefined handling
      const totalSlips = parseInt(String(data.databaseAnalytics?.total_slips || '0')) || 0;
      const participants = parseInt(String(data.databaseAnalytics?.unique_players || '0')) || 0;
      const avgCorrectRaw = data.databaseAnalytics?.avg_correct_predictions;
      const avgCorrect = (avgCorrectRaw === null || avgCorrectRaw === undefined || isNaN(parseFloat(String(avgCorrectRaw)))) ? 0 : parseFloat(String(avgCorrectRaw));
      const maxCorrectRaw = data.databaseAnalytics?.max_correct_predictions;
      const maxCorrect = (maxCorrectRaw === null || maxCorrectRaw === undefined || isNaN(parseInt(String(maxCorrectRaw)))) ? 0 : parseInt(String(maxCorrectRaw));
      
      // Transform backend data to visualization format
      return {
        cycleId: data.cycleId || cycleId,
        charts: {
          selectionDistribution: {
            labels: ['Home Win', 'Draw', 'Away Win', 'Over 2.5', 'Under 2.5'],
            data: [0, 0, 0, 0, 0], // TODO: fetch actual selection distribution
            colors: ['#22C7FF', '#FF0080', '#8C00FF', '#00FF88', '#FFB800']
          },
          performanceTrends: {
            labels: [`Cycle ${Math.max(1, cycleId - 2)}`, `Cycle ${Math.max(1, cycleId - 1)}`, `Cycle ${cycleId}`],
            datasets: [{
              label: 'Average Correct',
              data: [0, 0, avgCorrect],
              color: '#22C7FF'
            }]
          },
          participationFlow: {
            nodes: [],
            links: []
          },
          heatmap: {
            matches: [],
            maxIntensity: 0
          }
        },
        infographics: {
          keyStats: [
            { label: 'Total Slips', value: String(totalSlips), trend: 0 },
            { label: 'Win Rate', value: maxCorrect >= 7 && totalSlips > 0 ? `${((1/totalSlips) * 100).toFixed(1)}%` : '0%', trend: 0 },
            { label: 'Perfect Slips', value: '0', trend: 0 }, // TODO: calculate perfect slips
            { label: 'Active Users', value: String(participants), trend: 0 }
          ],
          insights: data.insights && data.insights.length > 0
            ? data.insights.map((i: any) => ({
                title: i.type || 'Insight',
                description: i.message || '',
                impact: i.type === 'success' ? 'positive' : i.type === 'trend' ? 'neutral' : 'neutral'
              }))
            : totalSlips > 0 
              ? [
                  {
                    title: `${totalSlips} Slips Placed`,
                    description: `${participants} unique participants in this cycle`,
                    impact: 'neutral'
                  },
                  {
                    title: `Average ${avgCorrect.toFixed(1)} Correct`,
                    description: `Out of 10 total matches`,
                    impact: avgCorrect >= 7 ? 'positive' : 'neutral'
                  }
                ]
              : [
                  {
                    title: 'No Data Yet',
                    description: 'This cycle has no slips placed yet',
                    impact: 'neutral'
                  }
                ]
        }
      };
    } catch (error) {
      console.error('Error fetching visualization data:', error);
      return this.getMockVisualizationData(cycleId);
    }
  }

  // Mock data methods for development/fallback
  private getMockSlipProbability(slipId: string): SlipProbability {
      return {
      slipId,
      overallProbability: 12.5,
      riskLevel: 'high',
      confidenceScore: 78,
      predictionBreakdown: [
        { matchId: 1, probability: 65, selection: '1', confidence: 82 },
        { matchId: 2, probability: 45, selection: 'Over', confidence: 71 },
        { matchId: 3, probability: 38, selection: 'X', confidence: 63 },
      ]
    };
  }

  private getMockCycleSelections(cycleId: number): PopularSelections {
    return {
      cycleId,
      totalSlips: 156,
      selections: [
        { selection: '1', count: 89, percentage: 57.1, matchId: 1, homeTeam: 'Team A', awayTeam: 'Team B' },
        { selection: 'Over', count: 67, percentage: 43.0, matchId: 2, homeTeam: 'Team C', awayTeam: 'Team D' },
        { selection: 'X', count: 45, percentage: 28.8, matchId: 3, homeTeam: 'Team E', awayTeam: 'Team F' },
      ],
      trends: {
        mostPopular: 'Home Win (57.1%)',
        leastPopular: 'Draw (28.8%)',
        surprisingPick: 'Away Win in Derby Match'
      }
    };
  }

  private getMockMatchAnalytics(matchId: number): MatchAnalytics {
    return {
      matchId,
      homeTeam: 'Manchester United',
      awayTeam: 'Liverpool',
      totalPredictions: 89,
      selectionBreakdown: {
        '1': { count: 45, percentage: 50.6 },
        'X': { count: 23, percentage: 25.8 },
        '2': { count: 21, percentage: 23.6 },
        'Over': { count: 56, percentage: 62.9 },
        'Under': { count: 33, percentage: 37.1 }
      },
      communityConfidence: 78,
      expectedOutcome: 'Home Win',
      surpriseFactor: 0.3
    };
  }

  private getMockCycleAnalytics(cycleId: number): CycleAnalytics {
    return {
      cycleId,
      participationMetrics: {
        totalSlips: 234,
        uniqueUsers: 156,
        averageSlipsPerUser: 1.5,
        participationGrowth: 23.4
      },
      performanceMetrics: {
        averageCorrectPredictions: 4.2,
        winRate: 12.8,
        highestScore: 8.5,
        perfectSlips: 3
      },
      popularityTrends: {
        mostPopularMatch: { matchId: 1, predictions: 89 },
        mostPopularSelection: { selection: 'Home Win', count: 145 },
        surprisingResults: ['Underdog victory in Match 3', 'High-scoring game exceeded expectations']
      },
      insights: [
        'High accuracy cycle! Average 4.2 correct predictions per slip',
        'Strong community confidence in home teams this cycle',
        'Surprising upset in Match 3 caught most players off-guard'
      ]
    };
  }

  private getMockUserAnalytics(address: Address): UserAnalytics {
    return {
      address,
      performanceMetrics: {
        totalSlips: 23,
        winRate: 78.5,
        averageScore: 5.2,
        bestStreak: 7,
        currentStreak: 3,
        improvement: 15.3
      },
      behaviorPatterns: {
        favoriteSelections: [
          { selection: 'Home Win', frequency: 0.65 },
          { selection: 'Over 2.5', frequency: 0.78 },
        ],
        riskProfile: 'balanced',
        activityPattern: 'regular'
      },
      achievements: {
        badges: ['Streak Master', 'High Accuracy', 'Consistent Player'],
        milestones: ['10 Wins', '50 Slips', '5 Win Streak'],
        rankings: [
          { category: 'Win Rate', position: 23, total: 156 },
          { category: 'Total Score', position: 45, total: 156 }
        ]
      },
      insights: [
        'Excellent win rate of 78.5% - well above average!',
        'Strong preference for home teams and high-scoring games',
        'Consistent improvement trend over last 5 cycles'
      ]
    };
  }

  private getMockPlatformAnalytics(): PlatformAnalytics {
    return {
      globalMetrics: {
        totalUsers: 1247,
        totalSlips: 8934,
        totalVolume: 4567.8,
        averageWinRate: 23.4,
        cyclesCompleted: 45
      },
      engagementMetrics: {
        dailyActiveUsers: 234,
        retentionRate: 67.8,
        averageSessionTime: 12.5,
        bounceRate: 15.2
      },
      performanceInsights: {
        topPerformers: [
          { address: '0x123...', score: 95.6 },
          { address: '0x456...', score: 89.2 }
        ],
        communityTrends: ['Increasing participation', 'Higher accuracy rates'],
        platformHealth: 'excellent'
      },
      insights: [
        'Platform showing strong growth with 23% increase in active users',
        'Community accuracy improving - average win rate up 5.2%',
        'High engagement with 67.8% user retention rate'
      ]
    };
  }

  private getMockVisualizationData(cycleId: number): VisualizationData {
      return {
      cycleId,
      charts: {
        selectionDistribution: {
          labels: ['Home Win', 'Draw', 'Away Win', 'Over 2.5', 'Under 2.5'],
          data: [45, 23, 32, 67, 33],
          colors: ['#22C7FF', '#FF0080', '#8C00FF', '#00FF88', '#FFB800']
        },
        performanceTrends: {
          labels: ['Cycle 1', 'Cycle 2', 'Cycle 3', 'Cycle 4', 'Cycle 5'],
          datasets: [
            { label: 'Win Rate', data: [18, 22, 25, 23, 28], color: '#22C7FF' },
            { label: 'Participation', data: [120, 145, 167, 189, 234], color: '#FF0080' }
          ]
        },
        participationFlow: {
          nodes: [
            { id: 'new', label: 'New Users', value: 45 },
            { id: 'returning', label: 'Returning', value: 189 },
            { id: 'active', label: 'Active', value: 234 }
          ],
          links: [
            { source: 'new', target: 'active', value: 45 },
            { source: 'returning', target: 'active', value: 189 }
          ]
        },
        heatmap: {
          matches: [
            { matchId: 1, intensity: 89, selections: 89 },
            { matchId: 2, intensity: 67, selections: 67 },
            { matchId: 3, intensity: 45, selections: 45 }
          ],
          maxIntensity: 89
        }
      },
      infographics: {
        keyStats: [
          { label: 'Total Slips', value: '234', trend: 23.4 },
          { label: 'Win Rate', value: '12.8%', trend: 5.2 },
          { label: 'Perfect Slips', value: '3', trend: 0 }
        ],
        insights: [
          { title: 'High Accuracy Cycle', description: 'Players achieving 4.2 avg correct predictions', impact: 'positive' },
          { title: 'Strong Participation', description: '23% growth in active users', impact: 'positive' },
          { title: 'Surprising Upsets', description: 'Several unexpected results this cycle', impact: 'neutral' }
        ]
      }
    };
  }
}

export const analyticsService = new AnalyticsService();
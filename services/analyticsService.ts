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
      const response = await fetch(`${API_BASE}/cycle/${cycleId}/analytics`);
      if (!response.ok) throw new Error('Failed to fetch cycle analytics');
      return await response.json();
    } catch (error) {
      console.error('Error fetching cycle analytics:', error);
      return this.getMockCycleAnalytics(cycleId);
    }
  }

  // User analytics
  async getUserAnalytics(address: Address): Promise<UserAnalytics> {
    try {
      const response = await fetch(`${API_BASE}/user/${address}/analytics`);
      if (!response.ok) throw new Error('Failed to fetch user analytics');
      return await response.json();
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      return this.getMockUserAnalytics(address);
    }
  }

  // Platform analytics
  async getPlatformAnalytics(): Promise<PlatformAnalytics> {
    try {
      const response = await fetch(`${API_BASE}/platform/analytics`);
      if (!response.ok) throw new Error('Failed to fetch platform analytics');
      return await response.json();
    } catch (error) {
      console.error('Error fetching platform analytics:', error);
      return this.getMockPlatformAnalytics();
    }
  }

  // Visualization data
  async getVisualizationData(cycleId: number): Promise<VisualizationData> {
    try {
      const response = await fetch(`${API_BASE}/visualization/${cycleId}`);
      if (!response.ok) throw new Error('Failed to fetch visualization data');
      return await response.json();
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
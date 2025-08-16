import { apiRequest, API_CONFIG } from '@/config/api';

export interface OddysseyCycle {
  cycle_id: number;
  created_at: string;
  updated_at: string;
  matches_count: number;
  matches_data: string;
  cycle_start_time: string;
  cycle_end_time: string;
  resolved_at?: string;
  is_resolved: boolean;
  tx_hash?: string;
  resolution_tx_hash?: string;
  seconds_remaining?: number;
  matches: OddysseyMatch[];
}

export interface OddysseyMatch {
  id: number;
  fixture_id: number;
  home_team: string;
  away_team: string;
  match_date: string;
  league_name: string;
  home_odds: number;
  draw_odds: number;
  away_odds: number;
  over_odds?: number;
  under_odds?: number;
  market_type: string;
  display_order: number;
  odds_data?: any;
}

export interface OddysseySlip {
  slip_id: number;
  cycle_id: number;
  player_address: string;
  placed_at: string;
  predictions: any[];
  final_score: number;
  correct_count: number;
  is_evaluated: boolean;
  leaderboard_rank?: number;
  prize_claimed: boolean;
  tx_hash?: string;
  cycle_status?: string;
}

export interface LeaderboardEntry {
  player_address: string;
  slip_id: number;
  final_score: number;
  correct_count: number;
  calculated_rank: number;
  cycle_id: number;
}

export interface OddysseyStats {
  cycle_id: number;
  matches_count: number;
  total_slips: number;
  evaluated_slips: number;
  avg_correct_predictions: number;
  highest_score: number;
  leaderboard_participants: number;
}

export interface MatchesData {
  today: {
    date: string;
    matches: OddysseyMatch[];
  };
  tomorrow: {
    date: string;
    matches: OddysseyMatch[];
  };
  yesterday?: {
    date: string;
    matches: OddysseyMatch[];
  };
}

class OddysseyService {
  private baseEndpoint = API_CONFIG.endpoints.oddyssey;

  /**
   * Get current Oddyssey matches (yesterday, today, tomorrow)
   */
  async getMatches(date?: string): Promise<{
    data: MatchesData;
  }> {
    try {
      const endpoint = date 
        ? `${this.baseEndpoint}/matches?date=${date}`
        : `${this.baseEndpoint}/matches`;
      
      console.log('🎯 OddysseyService: Fetching matches from:', endpoint);
      
      const response = await apiRequest<{
        success: boolean;
        data: MatchesData;
      }>(endpoint);
      
      console.log('✅ OddysseyService: Matches result:', response);
      
      // Extract the data from the API response - backend now returns individual odds fields directly
      const transformedData = {
        ...response.data,
        today: response.data.today ? {
          ...response.data.today,
          matches: response.data.today.matches.map((match: any) => ({
            ...match,
            // Convert string odds to numbers
            home_odds: typeof match.home_odds === 'string' ? parseFloat(match.home_odds) : (match.home_odds || 0),
            draw_odds: typeof match.draw_odds === 'string' ? parseFloat(match.draw_odds) : (match.draw_odds || 0),
            away_odds: typeof match.away_odds === 'string' ? parseFloat(match.away_odds) : (match.away_odds || 0),
            over_odds: typeof match.over_odds === 'string' ? parseFloat(match.over_odds) : (match.over_odds || 0),
            under_odds: typeof match.under_odds === 'string' ? parseFloat(match.under_odds) : (match.under_odds || 0)
          }))
        } : { date: '', matches: [] },
        tomorrow: response.data.tomorrow ? {
          ...response.data.tomorrow,
          matches: response.data.tomorrow.matches.map((match: any) => ({
            ...match,
            // Convert string odds to numbers
            home_odds: typeof match.home_odds === 'string' ? parseFloat(match.home_odds) : (match.home_odds || 0),
            draw_odds: typeof match.draw_odds === 'string' ? parseFloat(match.draw_odds) : (match.draw_odds || 0),
            away_odds: typeof match.away_odds === 'string' ? parseFloat(match.away_odds) : (match.away_odds || 0),
            over_odds: typeof match.over_odds === 'string' ? parseFloat(match.over_odds) : (match.over_odds || 0),
            under_odds: typeof match.under_odds === 'string' ? parseFloat(match.under_odds) : (match.under_odds || 0)
          }))
        } : { date: '', matches: [] },
        yesterday: response.data.yesterday ? {
          ...response.data.yesterday,
          matches: response.data.yesterday.matches.map((match: any) => ({
            ...match,
            // Convert string odds to numbers
            home_odds: typeof match.home_odds === 'string' ? parseFloat(match.home_odds) : (match.home_odds || 0),
            draw_odds: typeof match.draw_odds === 'string' ? parseFloat(match.draw_odds) : (match.draw_odds || 0),
            away_odds: typeof match.away_odds === 'string' ? parseFloat(match.away_odds) : (match.away_odds || 0),
            over_odds: typeof match.over_odds === 'string' ? parseFloat(match.over_odds) : (match.over_odds || 0),
            under_odds: typeof match.under_odds === 'string' ? parseFloat(match.under_odds) : (match.under_odds || 0)
          }))
        } : { date: '', matches: [] }
      };
      
      return {
        data: transformedData
      };
    } catch (error) {
      console.error('❌ OddysseyService: Error fetching matches:', error);
      throw error;
    }
  }

  /**
   * Get current cycle information
   */
  async getCurrentCycle(): Promise<{
    cycle: OddysseyCycle | null;
    status: 'active' | 'no_active_cycle';
  }> {
    const response = await apiRequest<{
      success: boolean;
      data: OddysseyCycle | null;
      message?: string;
    }>(`${this.baseEndpoint}/current-cycle`);
    
    // Transform the API response to match the expected interface
    if (response.data) {
      // Parse matches_data if it's a string and populate the matches field
      let matches: OddysseyMatch[] = [];
      if (response.data.matches_data) {
        try {
          const matchesData = typeof response.data.matches_data === 'string' 
            ? JSON.parse(response.data.matches_data) 
            : response.data.matches_data;
          
          matches = Array.isArray(matchesData) ? matchesData : [];
        } catch (error) {
          console.error('❌ Error parsing matches_data:', error);
          matches = [];
        }
      }
      
      return {
        cycle: {
          ...response.data,
          matches: matches
        },
        status: 'active'
      };
    }
    
    return {
      cycle: null,
      status: 'no_active_cycle'
    };
  }

  /**
   * Get live match data for current cycle
   */
  async getLiveMatches(matchIds: number[]): Promise<{
    matches: Record<number, OddysseyMatch>;
  }> {
    return apiRequest<{
      matches: Record<number, OddysseyMatch>;
    }>(`${this.baseEndpoint}/live-matches`, {
      method: 'POST',
      body: JSON.stringify({ matchIds }),
    });
  }

  /**
   * Get daily matches preview (for tomorrow's cycle)
   */
  async getMatchesPreview(): Promise<{
    matches: OddysseyMatch[];
    count: number;
    targetDate: string;
  }> {
    return apiRequest<{
      matches: OddysseyMatch[];
      count: number;
      targetDate: string;
    }>(`${this.baseEndpoint}/matches/preview`);
  }

  /**
   * Get cycle leaderboard
   */
  async getLeaderboard(cycleId?: string | number): Promise<{
    leaderboard: LeaderboardEntry[];
    cycleId: string | number;
  }> {
    const endpoint = cycleId 
      ? `${this.baseEndpoint}/leaderboard/${cycleId}`
      : `${this.baseEndpoint}/leaderboard`;
    
    return apiRequest<{
      leaderboard: LeaderboardEntry[];
      cycleId: string | number;
    }>(endpoint);
  }

  /**
   * Get user slips for a cycle
   */
  async getUserSlips(address: string, cycleId?: string | number): Promise<{
    slips: OddysseySlip[];
  }> {
    const endpoint = cycleId
      ? `${this.baseEndpoint}/user-slips/${cycleId}/${address}`
      : `${this.baseEndpoint}/slips/${address}`;
    
    return apiRequest<{
      slips: OddysseySlip[];
    }>(endpoint);
  }

  /**
   * Get cycle statistics
   */
  async getCycleStats(cycleId?: string | number): Promise<{
    stats: OddysseyStats;
  }> {
    const endpoint = cycleId
      ? `${this.baseEndpoint}/stats/${cycleId}`
      : `${this.baseEndpoint}/stats`;
    
    return apiRequest<{
      stats: OddysseyStats;
    }>(endpoint);
  }

  /**
   * Get global or user statistics
   */
  async getStats(type: 'global' | 'user', address?: string): Promise<{
    data: any;
  }> {
    try {
      const endpoint = `${this.baseEndpoint}/stats?type=${type}${address ? `&address=${address}` : ''}`;
      
      console.log('🎯 OddysseyService: Fetching stats from:', endpoint);
      
      const response = await apiRequest<{
        success: boolean;
        data: any;
      }>(endpoint);
      
      console.log('✅ OddysseyService: Stats result:', response);
      
      // Extract the data from the API response
      return {
        data: response.data
      };
    } catch (error) {
      console.error('❌ OddysseyService: Error fetching stats:', error);
      throw error;
    }
  }

  /**
   * Get match availability for a specific date
   */
  async getMatchAvailability(date: string): Promise<{
    date: string;
    stats: any;
    suitable: boolean;
  }> {
    return apiRequest<{
      date: string;
      stats: any;
      suitable: boolean;
    }>(`${this.baseEndpoint}/matches/availability/${date}`);
  }

  /**
   * Place a new slip (submit predictions)
   */
  async placeSlip(playerAddress: string, predictions: any[], cycleId?: number): Promise<{
    success: boolean;
    data: {
      slipId: number;
      totalOdds: number;
      predictionsCount: number;
    };
  }> {
    return apiRequest<{
      success: boolean;
      data: {
        slipId: number;
        totalOdds: number;
        predictionsCount: number;
      };
    }>(`${this.baseEndpoint}/place-slip`, {
      method: 'POST',
      body: JSON.stringify({
        playerAddress,
        predictions,
        cycleId
      }),
    });
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(address: string): Promise<{
    data: {
      user_address: string;
      auto_evaluate: boolean;
      auto_claim: boolean;
      notifications: boolean;
    };
  }> {
    return apiRequest<{
      data: {
        user_address: string;
        auto_evaluate: boolean;
        auto_claim: boolean;
        notifications: boolean;
      };
    }>(`${this.baseEndpoint}/preferences/${address}`);
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    address: string, 
    preferences: {
      auto_evaluate: boolean;
      auto_claim: boolean;
      notifications: boolean;
    }
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    return apiRequest<{
      success: boolean;
      message: string;
    }>(`${this.baseEndpoint}/preferences/${address}`, {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  /**
   * Admin: Manually trigger new cycle
   */
  async triggerNewCycle(): Promise<{
    success: boolean;
    result: any;
  }> {
    return apiRequest<{
      success: boolean;
      result: any;
    }>(`${this.baseEndpoint}/admin/trigger-cycle`, {
      method: 'POST',
    });
  }

  /**
   * Admin: Manually trigger cycle resolution
   */
  async resolveCycle(): Promise<{
    success: boolean;
    result: any;
  }> {
    return apiRequest<{
      success: boolean;
      result: any;
    }>(`${this.baseEndpoint}/admin/resolve-cycle`, {
      method: 'POST',
    });
  }

  /**
   * Admin: Select matches for Oddyssey
   */
  async selectMatches(): Promise<{
    success: boolean;
    data: any;
  }> {
    return apiRequest<{
      success: boolean;
      data: any;
    }>(`${this.baseEndpoint}/select-matches`, {
      method: 'POST',
    });
  }
}

export const oddysseyService = new OddysseyService(); 
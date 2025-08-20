import { managedApiRequest } from './connectionManager';

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
  private baseEndpoint = '/api/oddyssey';

  /**
   * Get current Oddyssey matches (yesterday, today, tomorrow)
   */
  async getMatches(date?: string): Promise<{
    data: MatchesData;
  }> {
    try {
      // Use contract-matches endpoint to get data directly from contract with correct data types
      const endpoint = `${this.baseEndpoint}/contract-matches`;
      
      console.log('🎯 OddysseyService: Fetching contract matches from:', endpoint);
      
      const response = await managedApiRequest<{
        success: boolean;
        data: any[];
        cycleId: string;
        totalMatches: number;
        source: string;
      }>(endpoint);
      
      console.log('✅ OddysseyService: Contract matches result:', response);
      
      if (!response.data || response.data.length === 0) {
        console.warn('⚠️ No contract matches found');
        return {
          data: {
            today: { date: '', matches: [] },
            tomorrow: { date: '', matches: [] },
            yesterday: { date: '', matches: [] }
          }
        };
      }

      // Transform contract matches to the expected format
      const transformedMatches: OddysseyMatch[] = response.data.map((match, index) => ({
        id: match.id, // This is now a number, matching contract data type
        fixture_id: match.id,
        home_team: match.homeTeam,
        away_team: match.awayTeam,
        match_date: new Date(match.startTime * 1000).toISOString(),
        league_name: match.leagueName,
        home_odds: match.oddsHome / 1000, // Convert from scaled format
        draw_odds: match.oddsDraw / 1000,
        away_odds: match.oddsAway / 1000,
        over_odds: match.oddsOver / 1000,
        under_odds: match.oddsUnder / 1000,
        market_type: 'moneyline',
        display_order: index + 1
      }));

      // Return in the expected format
      return {
        data: {
          today: {
            date: new Date().toISOString().split('T')[0],
            matches: transformedMatches
          },
          tomorrow: {
            date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            matches: []
          },
          yesterday: {
            date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            matches: []
          }
        }
      };
    } catch (error) {
      console.error('❌ OddysseyService: Error fetching contract matches:', error);
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
    try {
      const response = await managedApiRequest<{
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
            
            // Get team names from fixtures for each match
            if (Array.isArray(matchesData)) {
              // Fetch team names for the matches
              const matchesWithTeams = await this.enrichMatchesWithTeamNames(matchesData);
              matches = matchesWithTeams;
            }
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
    } catch (error) {
      console.error('❌ Error fetching current cycle:', error);
      return {
        cycle: null,
        status: 'no_active_cycle'
      };
    }
  }

  /**
   * Enrich match data with team names from fixtures
   */
  private async enrichMatchesWithTeamNames(matchesData: any[]): Promise<OddysseyMatch[]> {
    try {
      // Use the matches endpoint to get enriched data
      const matchesResponse = await this.getMatches();
      const enrichedMatches = matchesResponse.data.today.matches;
      
      // Map the contract matches to enriched matches
      return matchesData.map((match: any, index: number) => {
        const enrichedMatch = enrichedMatches.find(em => em.id.toString() === match.id.toString());
        
        return {
          id: match.id,
          fixture_id: match.id,
          home_team: enrichedMatch?.home_team || `Team ${match.id}`,
          away_team: enrichedMatch?.away_team || `Team ${match.id}`,
          league_name: enrichedMatch?.league_name || 'Unknown League',
          match_date: new Date(match.startTime * 1000).toISOString(),
          home_odds: match.oddsHome / 1000,
          draw_odds: match.oddsDraw / 1000,
          away_odds: match.oddsAway / 1000,
          over_odds: match.oddsOver / 1000,
          under_odds: match.oddsUnder / 1000,
          market_type: "1x2_ou25",
          display_order: index + 1
        };
      });
    } catch (error) {
      console.error('❌ Error enriching matches with team names:', error);
      // Fallback to basic format
      return matchesData.map((match: any, index: number) => ({
        id: match.id,
        fixture_id: match.id,
        home_team: `Team ${match.id}`,
        away_team: `Team ${match.id}`,
        league_name: 'Unknown League',
        match_date: new Date(match.startTime * 1000).toISOString(),
        home_odds: match.oddsHome / 1000,
        draw_odds: match.oddsDraw / 1000,
        away_odds: match.oddsAway / 1000,
        over_odds: match.oddsOver / 1000,
        under_odds: match.oddsUnder / 1000,
        market_type: "1x2_ou25",
        display_order: index + 1
      }));
    }
  }

  /**
   * Get live match data for current cycle
   */
  async getLiveMatches(matchIds: number[]): Promise<{
    matches: Record<number, OddysseyMatch>;
  }> {
    return managedApiRequest<{
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
    return managedApiRequest<{
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
    
    return managedApiRequest<{
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
    
    return managedApiRequest<{
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
    
    return managedApiRequest<{
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
      
      const response = await managedApiRequest<{
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
    return managedApiRequest<{
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
    return managedApiRequest<{
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
    return managedApiRequest<{
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
    return managedApiRequest<{
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
    return managedApiRequest<{
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
    return managedApiRequest<{
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
    return managedApiRequest<{
      success: boolean;
      data: any;
    }>(`${this.baseEndpoint}/select-matches`, {
      method: 'POST',
    });
  }
}

export const oddysseyService = new OddysseyService(); 
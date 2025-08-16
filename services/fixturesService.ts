import { apiRequest, API_CONFIG } from '@/config/api';

export interface Fixture {
  id: number;
  homeTeam: {
    id: number;
    name: string;
  };
  awayTeam: {
    id: number;
    name: string;
  };
  league: {
    id: number;
    name: string;
    season?: number;
  };
  round?: string;
  matchDate: string;
  venue?: {
    name: string;
    city: string;
  };
  status: string;
  odds?: {
    home: number;
    draw: number;
    away: number;
    over25: number;
    under25: number;
    bttsYes: number;
    bttsNo: number;
    updatedAt: string;
  };
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface League {
  id: number;
  name: string;
  country: string;
  countryCode: string;
  logoUrl?: string;
  upcomingFixtures: number;
}

export interface FixturesResponse {
  success: boolean;
  data: {
    fixtures: Fixture[];
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

class FixturesService {
  private baseEndpoint = API_CONFIG.endpoints.fixtures;

  /**
   * Get upcoming fixtures with optional filtering
   */
  async getUpcomingFixtures(params: {
    days?: number;
    leagues?: number[];
    page?: number;
    limit?: number;
  } = {}): Promise<FixturesResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.days) searchParams.append('days', params.days.toString());
    if (params.leagues?.length) {
      params.leagues.forEach(league => searchParams.append('leagues', league.toString()));
    }
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const queryString = searchParams.toString();
    const endpoint = `${this.baseEndpoint}/upcoming${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<FixturesResponse>(endpoint);
  }

  /**
   * Get specific fixture by ID
   */
  async getFixtureById(fixtureId: number): Promise<Fixture> {
    const response = await apiRequest<{ success: boolean; data: Fixture }>(
      `${this.baseEndpoint}/${fixtureId}`
    );
    return response.data;
  }

  /**
   * Get popular leagues with upcoming fixtures count
   */
  async getPopularLeagues(): Promise<League[]> {
    const response = await apiRequest<{ success: boolean; data: League[] }>(
      `${this.baseEndpoint}/leagues/popular`
    );
    return response.data;
  }

  /**
   * Get today's fixtures
   */
  async getTodaysFixtures(): Promise<Fixture[]> {
    const response = await apiRequest<{ success: boolean; data: Fixture[] }>(
      `${this.baseEndpoint}/today`
    );
    return response.data;
  }

  /**
   * Manually refresh fixtures data (admin function)
   */
  async refreshFixtures(): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>(
      `${this.baseEndpoint}/refresh`,
      {
        method: 'POST',
      }
    );
  }
}

export const fixturesService = new FixturesService(); 
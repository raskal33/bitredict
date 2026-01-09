/**
 * Platinum Predictions API Service
 * 
 * Fetches combined Top Tips + xG predictions from backend
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://tiprexws.onrender.com';

/**
 * Helper function to make authenticated API requests
 */
async function apiRequest<T>(url: string): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': token ? `Token ${token}` : '',
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }
  
  return response.json();
}

export interface PlatinumPrediction {
  fixture_id: number;
  match: {
    home_team: string;
    away_team: string;
    home_team_id: number;
    away_team_id: number;
    league: string;
    league_id: number;
    start_time: string;
  };
  combined: {
    prediction: string;
    confidence: number;
    agreement_score: number;
  };
  top_pick: {
    market: string;
    prediction: string;
    probability: number | null;
    reasoning: string;
  };
  next_best: {
    market: string;
    prediction: string;
    probability: number | null;
    reasoning: string;
  };
  is_recommended: boolean;
  data_quality: number;
  top_tips?: {
    prediction: string;
    confidence: number;
    probabilities: {
      home: number;
      draw: number;
      away: number;
    };
    feature_scores: Record<string, number>;
  };
  xg_analysis?: {
    home_xg: number;
    away_xg: number;
    total_xg: number;
    breakdown: {
      home_open_play: number;
      away_open_play: number;
      home_set_pieces: number;
      away_set_pieces: number;
    };
    probabilities: {
      home: number;
      draw: number;
      away: number;
    };
    goals_markets: {
      over_15: number;
      over_25: number;
      over_35: number;
      btts_yes: number;
    };
    most_likely_score: string;
    score_probabilities: Record<string, number>;
  };
}

export interface PlatinumLeague {
  league_id: number;
  league_name: string;
  predictions: PlatinumPrediction[];
}

export interface PlatinumResponse {
  status: string;
  date: string;
  total_predictions: number;
  recommended_count: number;
  leagues: PlatinumLeague[];
}

export interface PlatinumPerformance {
  status: string;
  period_days: number;
  overall: {
    accuracy: number;
    avg_agreement: number;
    top_pick_win_rate: number;
  };
  daily_performance: Array<{
    date: string;
    total: number;
    finished: number;
    accuracy: number;
    agreement: number;
  }>;
}

/**
 * Get Platinum predictions for a specific date
 */
export async function getPlatinumPredictionsByDate(date?: string): Promise<PlatinumResponse> {
  try {
    const params = new URLSearchParams();
    if (date) {
      params.append('date', date);
    }
    
    return await apiRequest<PlatinumResponse>(
      `${BACKEND_URL}/api/platinum/predictions/date/?${params}`
    );
  } catch (error) {
    console.error('Error fetching Platinum predictions:', error);
    throw error;
  }
}

/**
 * Get recommended Platinum predictions
 */
export async function getRecommendedPlatinumPredictions(days: number = 2): Promise<{
  status: string;
  count: number;
  predictions: PlatinumPrediction[];
}> {
  try {
    return await apiRequest(
      `${BACKEND_URL}/api/platinum/recommended/?days=${days}`
    );
  } catch (error) {
    console.error('Error fetching recommended Platinum predictions:', error);
    throw error;
  }
}

/**
 * Get Platinum prediction for a specific fixture
 */
export async function getPlatinumFixture(fixtureId: number): Promise<{
  status: string;
  prediction: PlatinumPrediction;
}> {
  try {
    return await apiRequest(
      `${BACKEND_URL}/api/platinum/fixture/${fixtureId}/`
    );
  } catch (error) {
    console.error(`Error fetching Platinum fixture ${fixtureId}:`, error);
    throw error;
  }
}

/**
 * Get Platinum performance statistics
 */
export async function getPlatinumPerformance(days: number = 30): Promise<PlatinumPerformance> {
  try {
    return await apiRequest(
      `${BACKEND_URL}/api/platinum/performance/?days=${days}`
    );
  } catch (error) {
    console.error('Error fetching Platinum performance:', error);
    throw error;
  }
}


import { API_CONFIG } from '@/config/api';

// Backend API Base URL
const API_BASE_URL = `${API_CONFIG.baseURL}/api`;

// Updated interfaces to match backend response
export interface FootballMatch {
  id: string;
  homeTeam: {
    id: number | null;
    name: string;
    logoUrl?: string;
  };
  awayTeam: {
    id: number | null;
    name: string;
    logoUrl?: string;
  };
  league: {
    id: number;
    name: string | null;
    season: number | null;
    logoUrl?: string;
  };
  round: string | null;
  matchDate: string;
  venue: {
    name: string | null;
    city: string | null;
  };
  status: string;
  odds: {
    home: number;
    draw: number;
    away: number;
    over15: number;
    under15: number;
    over25: number;
    under25: number;
    over35: number;
    under35: number;
    bttsYes: number;
    bttsNo: number;
    htHome: number;
    htDraw: number;
    htAway: number;
    ht_over_05: number;
    ht_under_05: number;
    ht_over_15: number;
    ht_under_15: number;
    updatedAt: string;
  };
}

export interface Competition {
  id: string;
  name: string;
  country: string;
  logo: string;
}

export interface Cryptocurrency {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  price_usd?: number; // Backend field name
  logo: string;
  coingeckoId?: string;
  rank?: number;
}

export interface TimeOption {
  value: string;
  label: string;
  days: number;
}

export class GuidedMarketService {
  // Football Methods - Updated to use backend API with current date + 7 days
  static async getFootballMatches(days: number = 7, limit: number = 500): Promise<FootballMatch[]> {
    try {
      // Call the upcoming fixtures endpoint (original endpoint for guided markets)
      const response = await fetch(`${API_BASE_URL}/fixtures/upcoming?limit=${limit}`);
      const data = await response.json();
      
      if (!data.success) {
        console.error('Failed to fetch fixtures:', data.error);
        return [];
      }
      
      // The /upcoming endpoint returns data.fixtures, not data.matches
      const fixtures = data.data?.fixtures || [];
      
      // Transform the fixtures data to match our interface - FILTER OUT MATCHES WITHOUT REAL ODDS
      return fixtures.map((match: any) => ({
            id: match.id.toString(),
            homeTeam: {
              id: match.homeTeam?.id || null,
              name: match.homeTeam?.name || 'Unknown',
              logoUrl: match.homeTeam?.logoUrl || null
            },
            awayTeam: {
              id: match.awayTeam?.id || null,
              name: match.awayTeam?.name || 'Unknown',
              logoUrl: match.awayTeam?.logoUrl || null
            },
            league: {
              id: match.league?.id || 0,
              name: match.league?.name || null,
              season: match.league?.season || null,
              logoUrl: match.league?.logoUrl || null
            },
            round: match.round || null,
            matchDate: match.matchDate,
            venue: {
              name: match.venue?.name || null,
              city: match.venue?.city || null
            },
            status: match.status || 'NS',
            odds: {
              // FIXED: No fallback odds - only real odds from database, skip matches without real odds
              home: typeof match.odds?.home === 'number' && match.odds.home > 1.0 ? match.odds.home : null,
              draw: typeof match.odds?.draw === 'number' && match.odds.draw > 1.0 ? match.odds.draw : null,
              away: typeof match.odds?.away === 'number' && match.odds.away > 1.0 ? match.odds.away : null,
              over15: typeof match.odds?.over15 === 'number' && match.odds.over15 > 1.0 ? match.odds.over15 : null,
              under15: typeof match.odds?.under15 === 'number' && match.odds.under15 > 1.0 ? match.odds.under15 : null,
              over25: typeof match.odds?.over25 === 'number' && match.odds.over25 > 1.0 ? match.odds.over25 : null,
              under25: typeof match.odds?.under25 === 'number' && match.odds.under25 > 1.0 ? match.odds.under25 : null,
              over35: typeof match.odds?.over35 === 'number' && match.odds.over35 > 1.0 ? match.odds.over35 : null,
              under35: typeof match.odds?.under35 === 'number' && match.odds.under35 > 1.0 ? match.odds.under35 : null,
              bttsYes: typeof match.odds?.bttsYes === 'number' && match.odds.bttsYes > 1.0 ? match.odds.bttsYes : null,
              bttsNo: typeof match.odds?.bttsNo === 'number' && match.odds.bttsNo > 1.0 ? match.odds.bttsNo : null,
              htHome: typeof match.odds?.htHome === 'number' && match.odds.htHome > 1.0 ? match.odds.htHome : null,
              htDraw: typeof match.odds?.htDraw === 'number' && match.odds.htDraw > 1.0 ? match.odds.htDraw : null,
              htAway: typeof match.odds?.htAway === 'number' && match.odds.htAway > 1.0 ? match.odds.htAway : null,
              ht_over_05: typeof match.odds?.ht_over_05 === 'number' && match.odds.ht_over_05 > 1.0 ? match.odds.ht_over_05 : null,
              ht_under_05: typeof match.odds?.ht_under_05 === 'number' && match.odds.ht_under_05 > 1.0 ? match.odds.ht_under_05 : null,
              ht_over_15: typeof match.odds?.ht_over_15 === 'number' && match.odds.ht_over_15 > 1.0 ? match.odds.ht_over_15 : null,
              ht_under_15: typeof match.odds?.ht_under_15 === 'number' && match.odds.ht_under_15 > 1.0 ? match.odds.ht_under_15 : null,
              updatedAt: new Date().toISOString()
            }
        })).filter((match: FootballMatch) => {
          // Only include matches with at least 3 real odds values (home/draw/away)
          const realOddsCount = Object.values(match.odds).filter(odd => odd !== null && typeof odd === 'number' && odd > 1.0).length;
          return realOddsCount >= 3;
        });
    } catch (error) {
      console.error('Error fetching football matches:', error);
      return [];
    }
  }

  // Get matches by date range for guided markets with pagination
  static async getFootballMatchesByDateRange(startDate: string, endDate: string, limit: number = 50, page: number = 1): Promise<FootballMatch[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/fixtures/date-range?start_date=${startDate}&end_date=${endDate}&limit=${limit}&page=${page}`);
      const data = await response.json();
      
      if (!data.success) {
        console.error('Failed to fetch fixtures by date range:', data.error);
        // Fallback to day-by-day fetching
        return this.getFootballMatchesByDateRangeFallback(startDate, endDate, limit, page);
      }
      
      return data.data.fixtures.map((fixture: any) => ({
        id: fixture.id.toString(),
        homeTeam: {
          id: fixture.homeTeam?.id || null,
          name: fixture.homeTeam?.name || 'Unknown',
          logoUrl: fixture.homeTeam?.logoUrl || null
        },
        awayTeam: {
          id: fixture.awayTeam?.id || null,
          name: fixture.awayTeam?.name || 'Unknown',
          logoUrl: fixture.awayTeam?.logoUrl || null
        },
        league: {
          id: fixture.league?.id || 0,
          name: fixture.league?.name || null,
          season: fixture.league?.season || null,
          logoUrl: fixture.league?.logoUrl || null
        },
        round: fixture.round || null,
        matchDate: fixture.matchDate,
        venue: {
          name: fixture.venue?.name || null,
          city: fixture.venue?.city || null
        },
        status: fixture.status || 'NS',
        odds: fixture.odds || {
          home: null,
          draw: null,
          away: null,
          over25: null,
          under25: null,
          over35: null,
          under35: null,
          bttsYes: null,
          bttsNo: null,
          updatedAt: new Date().toISOString()
        }
      }));
    } catch (error) {
      console.error('Error fetching fixtures by date range:', error);
      // Fallback to day-by-day fetching
      return this.getFootballMatchesByDateRangeFallback(startDate, endDate, limit, page);
    }
  }

  // Fallback method: Fetch fixtures day by day if date range fails
  static async getFootballMatchesByDateRangeFallback(startDate: string, endDate: string, limit: number = 50, page: number = 1): Promise<FootballMatch[]> {
    try {
      console.log('🔄 Using day-by-day fallback for fixture fetching');
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      const allFixtures: FootballMatch[] = [];
      
      // Fetch fixtures day by day
      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const dayStr = date.toISOString().slice(0, 10);
        const nextDayStr = new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        
        try {
          const response = await fetch(`${API_BASE_URL}/fixtures/date-range?start_date=${dayStr}&end_date=${nextDayStr}&limit=100&page=1`);
          const data = await response.json();
          
          if (data.success && data.data.fixtures) {
            const dayFixtures = data.data.fixtures.map((fixture: any) => ({
              id: fixture.id.toString(),
              homeTeam: {
                id: fixture.homeTeam?.id || null,
                name: fixture.homeTeam?.name || 'Unknown'
              },
              awayTeam: {
                id: fixture.awayTeam?.id || null,
                name: fixture.awayTeam?.name || 'Unknown'
              },
              league: {
                id: fixture.league?.id || 0,
                name: fixture.league?.name || null,
                season: fixture.league?.season || null
              },
              round: fixture.round || null,
              matchDate: fixture.matchDate,
              venue: {
                name: fixture.venue?.name || null,
                city: fixture.venue?.city || null
              },
              status: fixture.status || 'NS',
              odds: fixture.odds || {
                home: 2.0,
                draw: 3.0,
                away: 2.5,
                over25: 1.8,
                under25: 2.0,
                over35: 2.2,
                under35: 1.6,
                bttsYes: 1.9,
                bttsNo: 1.8,
                updatedAt: new Date().toISOString()
              }
            }));
            
            allFixtures.push(...dayFixtures);
          }
        } catch (dayError) {
          console.warn(`Failed to fetch fixtures for ${dayStr}:`, dayError);
        }
      }
      
      // Apply pagination to the combined results
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      return allFixtures.slice(startIndex, endIndex);
      
    } catch (error) {
      console.error('Error in day-by-day fallback:', error);
      return [];
    }
  }

  static getCompetitions(): Competition[] {
    // Static data for now, could be moved to backend later
    return [
      { id: '8', name: 'Premier League', country: 'England', logo: '/icons/premier-league.png' },
      { id: '564', name: 'La Liga', country: 'Spain', logo: '/icons/la-liga.png' },
      { id: '82', name: 'Bundesliga', country: 'Germany', logo: '/icons/bundesliga.png' },
      { id: '301', name: 'Serie A', country: 'Italy', logo: '/icons/serie-a.png' },
      { id: '501', name: 'Ligue 1', country: 'France', logo: '/icons/ligue-1.png' }
    ];
  }

  static async searchFootballMatches(query: string): Promise<FootballMatch[]> {
    const matches = await this.getFootballMatches();
    const lowerQuery = query.toLowerCase();
    
    return matches.filter(match => 
      match.homeTeam.name.toLowerCase().includes(lowerQuery) ||
      match.awayTeam.name.toLowerCase().includes(lowerQuery) ||
      match.league.name?.toLowerCase().includes(lowerQuery) ||
      match.venue.name?.toLowerCase().includes(lowerQuery) ||
      match.venue.city?.toLowerCase().includes(lowerQuery)
    );
  }

  static async getMatchById(id: string): Promise<FootballMatch | null> {
    const matches = await this.getFootballMatches();
    return matches.find(match => match.id === id) || null;
  }

  static formatMatchDisplay(match: FootballMatch): string {
    const date = new Date(match.matchDate);
    const dateStr = date.toLocaleDateString();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${match.homeTeam.name} vs ${match.awayTeam.name} - ${match.league.name || 'Unknown League'} (${dateStr} ${timeStr})`;
  }

  // Cryptocurrency Methods - Updated to use backend API
  static async getCryptocurrencies(limit: number = 500): Promise<Cryptocurrency[]> {
    try {
      // Try to get all coins with higher limit
      const response = await fetch(`${API_BASE_URL}/crypto/all?limit=${limit}&page=1`);
      const data = await response.json();
      
      if (!data.success) {
        console.error('Failed to fetch cryptocurrencies:', data.error);
        // Fallback to popular coins if all coins fails
        return this.getPopularCryptocurrencies();
      }
      
      // Filter out coins with no price data and sort by rank
      const validCoins = data.data
        .filter((crypto: any) => crypto.price_usd && crypto.price_usd > 0)
        .sort((a: any, b: any) => (a.rank || 999) - (b.rank || 999))
        .slice(0, limit);
      
      return validCoins.map((crypto: any) => ({
        id: crypto.id || crypto.symbol?.toLowerCase() || '',
        symbol: crypto.symbol || '',
        name: crypto.name || '',
        currentPrice: crypto.price_usd || 0,
        price_usd: crypto.price_usd,
        logo: crypto.logo_url || this.getCryptoLogoUrl(crypto.id || crypto.symbol),
        rank: crypto.rank || 999
      }));
    } catch (error) {
      console.error('Error fetching cryptocurrencies:', error);
      // Fallback to popular coins
      return this.getPopularCryptocurrencies();
    }
  }

  // Get popular cryptocurrencies as fallback
  static async getPopularCryptocurrencies(): Promise<Cryptocurrency[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/crypto/popular`);
      const data = await response.json();
      
      if (!data.success) {
        console.error('Failed to fetch popular cryptocurrencies:', data.error);
        return [];
      }
      
      return data.data.map((crypto: any) => ({
        id: crypto.id || crypto.symbol?.toLowerCase() || '',
        symbol: crypto.symbol || '',
        name: crypto.name || '',
        currentPrice: crypto.price_usd || 0,
        price_usd: crypto.price_usd,
        logo: crypto.logo_url || this.getCryptoLogoUrl(crypto.id || crypto.symbol),
        rank: crypto.rank || 999
      }));
    } catch (error) {
      console.error('Error fetching popular cryptocurrencies:', error);
      return [];
    }
  }

  static getTimeOptions(): TimeOption[] {
    return [
      { value: '1h', label: '1 Hour', days: 0.04 },
      { value: '6h', label: '6 Hours', days: 0.25 },
      { value: '1d', label: '1 Day', days: 1 },
      { value: '3d', label: '3 Days', days: 3 },
      { value: '7d', label: '1 Week', days: 7 },
      { value: '30d', label: '1 Month', days: 30 }
    ];
  }

  static async searchCryptocurrencies(query: string): Promise<Cryptocurrency[]> {
    const cryptos = await this.getCryptocurrencies();
    const lowerQuery = query.toLowerCase();
    
    return cryptos.filter(crypto => 
      crypto.name.toLowerCase().includes(lowerQuery) ||
      crypto.symbol.toLowerCase().includes(lowerQuery)
    );
  }

  static async getCryptocurrencyById(id: string): Promise<Cryptocurrency | null> {
    const cryptos = await this.getCryptocurrencies();
    return cryptos.find(crypto => crypto.id === id) || null;
  }

  static formatCryptoDisplay(crypto: Cryptocurrency): string {
    return `${crypto.logo} ${crypto.name} (${crypto.symbol}) - $${crypto.currentPrice.toLocaleString()}`;
  }

  // Helper method to get crypto logo URL with fallbacks
  static getCryptoLogoUrl(coinId: string): string {
    if (!coinId) return 'https://ui-avatars.com/api/?name=CRYPTO&background=22C7FF&color=000&size=32';
    
    // Extract symbol from coinId (e.g., "btc-bitcoin" -> "BTC")
    const symbol = coinId.split('-')[0]?.toUpperCase() || coinId.toUpperCase();
    
    // Use UI Avatars as primary source since external APIs may be unreliable
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(symbol)}&background=22C7FF&color=000&size=32`;
  }

  // Market Creation Helpers
  static generateFootballMarketTitle(match: FootballMatch, outcome: 'home' | 'away' | 'draw' | 'over25' | 'under25' | 'over35' | 'under35' | 'bttsYes' | 'bttsNo'): string {
    switch (outcome) {
      case 'home':
        return `${match.homeTeam.name} will beat ${match.awayTeam.name}`;
      case 'away':
        return `${match.awayTeam.name} will beat ${match.homeTeam.name}`;
      case 'draw':
        return `${match.homeTeam.name} vs ${match.awayTeam.name} will end in a draw`;
      case 'over25':
        return `${match.homeTeam.name} vs ${match.awayTeam.name} will have over 2.5 goals`;
      case 'under25':
        return `${match.homeTeam.name} vs ${match.awayTeam.name} will have under 2.5 goals`;
      case 'over35':
        return `${match.homeTeam.name} vs ${match.awayTeam.name} will have over 3.5 goals`;
      case 'under35':
        return `${match.homeTeam.name} vs ${match.awayTeam.name} will have under 3.5 goals`;
      case 'bttsYes':
        return `${match.homeTeam.name} vs ${match.awayTeam.name} will have both teams score`;
      case 'bttsNo':
        return `${match.homeTeam.name} vs ${match.awayTeam.name} will not have both teams score`;
      default:
        return `${match.homeTeam.name} vs ${match.awayTeam.name}`;
    }
  }

  static generateCryptoMarketTitle(crypto: Cryptocurrency, targetPrice: number, timeframe: string, direction: 'above' | 'below'): string {
    const directionText = direction === 'above' ? 'above' : 'below';
    return `${crypto.name} (${crypto.symbol}) will be ${directionText} $${targetPrice.toLocaleString()} in ${timeframe}`;
  }

  static calculateEventTimes(timeOption: TimeOption): { startTime: Date; endTime: Date } {
    const now = new Date();
    const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now (betting closes)
    const endTime = new Date(startTime.getTime() + timeOption.days * 24 * 60 * 60 * 1000); // End time based on selected duration
    
    return { startTime, endTime };
  }

  static validateMarketCreation(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Common validations
    if (!data.odds || data.odds < 101 || data.odds > 1000) {
      errors.push('Odds must be between 1.01x and 10x for guided markets');
    }

    if (!data.creatorStake || data.creatorStake < 10) {
      errors.push('Minimum creator stake is 10 tokens for guided markets');
    }

    // Category-specific validations
    if (data.category === 'football') {
      if (!data.selectedMatch) {
        errors.push('Please select a football match');
      }
      if (!data.outcome || !['home', 'away', 'draw', 'over25', 'under25', 'over35', 'under35', 'bttsYes', 'bttsNo'].includes(data.outcome)) {
        errors.push('Please select a valid outcome (Home Win, Away Win, Draw, Over 2.5 Goals, Under 2.5 Goals, Over 3.5 Goals, Under 3.5 Goals, Both Teams to Score - Yes, or Both Teams to Score - No)');
      }
    }

    if (data.category === 'cryptocurrency') {
      if (!data.selectedCrypto) {
        errors.push('Please select a cryptocurrency');
      }
      if (!data.targetPrice || data.targetPrice <= 0) {
        errors.push('Please enter a target price');
      }
      if (!data.timeframe) {
        errors.push('Please select a timeframe');
      }
      if (!data.direction || !['above', 'below'].includes(data.direction)) {
        errors.push('Please select price direction (Above or Below)');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Backend API Integration Methods - Updated to use prepare/confirm flow
  static async createFootballMarket(marketData: {
    fixtureId: string;
    homeTeam: string;
    awayTeam: string;
    league: string;
    matchDate: string;
    outcome: string;
    predictedOutcome: string;
    odds: number;
    creatorStake: number;
    useBitr?: boolean;
    description?: string;
    isPrivate?: boolean;
    maxBetPerUser?: number;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    console.warn('⚠️ createFootballMarket is deprecated. Use prepareFootballMarket + wallet transaction + confirmFootballMarket instead.');
    
    // For now, just prepare the transaction data
    return this.prepareFootballMarket(marketData);
  }

  /**
   * Prepare football market transaction data for frontend wallet integration
   */
  static async prepareFootballMarket(marketData: {
    fixtureId: string;
    homeTeam: string;
    awayTeam: string;
    league: string;
    matchDate: string;
    outcome: string;
    predictedOutcome: string;
    odds: number;
    creatorStake: number;
    useBitr?: boolean;
    description?: string;
    isPrivate?: boolean;
    maxBetPerUser?: number;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/guided-markets/football/prepare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(marketData),
      });

      const result = await response.json();
      
      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to prepare football market'
        };
      }

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      console.error('Error preparing football market:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Confirm football market creation after successful transaction
   */
  static async confirmFootballMarket(
    transactionHash: string,
    marketDetails: any
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/guided-markets/football/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionHash,
          marketDetails
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to confirm football market'
        };
      }

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      console.error('Error confirming football market:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  static async createCryptoMarket(marketData: {
    cryptocurrency: {
      symbol: string;
      name: string;
    };
    targetPrice: number;
    direction: 'above' | 'below';
    timeframe: string;
    predictedOutcome: string;
    odds: number;
    creatorStake: number;
    useBitr?: boolean;
    description?: string;
    isPrivate?: boolean;
    maxBetPerUser?: number;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/guided-markets/cryptocurrency`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(marketData),
      });

      const result = await response.json();
      
      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to create crypto market'
        };
      }

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      console.error('Error creating crypto market:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }
} 
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date'); // Optional: specific date

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://bitredict-backend.fly.dev';
    const url = `${backendUrl}/api/oddyssey/matches${date ? `?date=${date}` : ''}`;

    console.log('🎯 Fetching Oddyssey matches from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout for better error handling
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      console.error(`Backend responded with status: ${response.status}`);
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Backend response:', data);

    // Transform the matches data to match the expected format
    const transformMatches = (matches: Array<{
      id?: number;
      fixture_id?: number;
      home_team?: string;
      away_team?: string;
      match_date?: string;
      matchDate?: string;
      league_name?: string;
      home_odds?: number;
      draw_odds?: number;
      away_odds?: number;
      over_odds?: number;
      under_odds?: number;
      odds?: {
        home?: number;
        draw?: number;
        away?: number;
        over25?: number;
        under25?: number;
      };
      odds_data?: {
        home?: number;
        draw?: number;
        away?: number;
        over25?: number;
        under25?: number;
        bttsYes?: number;
        bttsNo?: number;
        bookmaker?: string;
        updatedAt?: string;
      };
      display_order?: number;
    }>) => {
      return matches.map((match) => {
        // Extract odds from odds_data if available
        const oddsData = match.odds_data || match.odds || {};
        
        return {
          id: match.id || match.fixture_id || Math.floor(Math.random() * 1000000),
          fixture_id: match.fixture_id || match.id || Math.floor(Math.random() * 1000000),
          home_team: match.home_team || 'Unknown Team',
          away_team: match.away_team || 'Unknown Team',
          match_date: match.match_date || match.matchDate || new Date().toISOString(),
          league_name: match.league_name || 'Unknown League',
          home_odds: match.home_odds || oddsData.home || 2.0,
          draw_odds: match.draw_odds || oddsData.draw || 3.0,
          away_odds: match.away_odds || oddsData.away || 2.5,
          over_odds: match.over_odds || oddsData.over25 || 1.8,
          under_odds: match.under_odds || oddsData.under25 || 2.0,
          market_type: 'moneyline',
          display_order: match.display_order || 1
        };
      });
    };

    let transformedData;
    if (date) {
      // Single date request
      transformedData = {
        date: date,
        matches: transformMatches(data.data?.matches || [])
      };
    } else {
      // Full data request (today, tomorrow, yesterday)
      transformedData = {
        today: {
          date: data.data?.today?.date || new Date().toISOString().split('T')[0],
          matches: transformMatches(data.data?.today?.matches || [])
        },
        tomorrow: {
          date: data.data?.tomorrow?.date || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          matches: transformMatches(data.data?.tomorrow?.matches || [])
        },
        yesterday: data.data?.yesterday ? {
          date: data.data.yesterday.date,
          matches: transformMatches(data.data.yesterday.matches || [])
        } : undefined
      };
    }

    console.log('✅ Transformed data:', transformedData);

    return NextResponse.json({
      success: true,
      data: transformedData,
      message: 'Oddyssey matches fetched successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching Oddyssey matches:', error);

    // Return mock data as fallback
    const generateMockMatches = (date: string, count: number = 5) => {
      return Array.from({ length: count }, (_, i) => ({
        id: i + 1,
        fixture_id: i + 1,
        home_team: `Team ${i + 1}A`,
        away_team: `Team ${i + 1}B`,
        match_date: date,
        league_name: 'Mock League',
        home_odds: 2.0 + Math.random() * 1.5,
        draw_odds: 3.0 + Math.random() * 1.0,
        away_odds: 2.5 + Math.random() * 1.5,
        over_odds: 1.8 + Math.random() * 0.8,
        under_odds: 2.0 + Math.random() * 0.8,
        market_type: 'moneyline',
        display_order: i + 1
      }));
    };

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const mockData = {
      today: {
        date: today,
        matches: generateMockMatches(today)
      },
      tomorrow: {
        date: tomorrow,
        matches: generateMockMatches(tomorrow)
      },
      yesterday: {
        date: yesterday,
        matches: generateMockMatches(yesterday)
      }
    };

    return NextResponse.json({
      success: true,
      data: mockData,
      message: 'Using mock data - backend connection failed'
    });
  }
} 
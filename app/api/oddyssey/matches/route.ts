import { NextResponse } from 'next/server';
import { safeStartTimeToISOString } from '@/utils/time-helpers';

export async function GET() {
  try {
    // const { searchParams } = new URL(request.url);
    // const date = searchParams.get('date'); // Optional: specific date - not currently used

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://bitredict-backend.fly.dev';
    // Use contract-matches endpoint to get data directly from contract with correct data types
    const url = `${backendUrl}/api/oddyssey/contract-matches`;

    console.log('🎯 Fetching Oddyssey contract matches from:', url);

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
    console.log('✅ Backend contract response:', data);

    // Transform the contract matches data to match the expected format
    const transformMatches = (matches: Array<{
      id: number;
      startTime: number;
      oddsHome: number;
      oddsDraw: number;
      oddsAway: number;
      oddsOver: number;
      oddsUnder: number;
      homeTeam: string;
      awayTeam: string;
      leagueName: string;
      displayOrder: number;
    }>) => {
      return matches.map((match) => {
        return {
          id: match.id, // This is now a number, matching contract data type
          fixture_id: match.id,
          home_team: match.homeTeam,
          away_team: match.awayTeam,
          match_date: safeStartTimeToISOString(match.startTime),
          league_name: match.leagueName,
          home_odds: match.oddsHome / 1000, // Convert from scaled format
          draw_odds: match.oddsDraw / 1000,
          away_odds: match.oddsAway / 1000,
          over_odds: match.oddsOver / 1000,
          under_odds: match.oddsUnder / 1000,
          market_type: 'moneyline',
          display_order: match.displayOrder
        };
      });
    };

    // Transform contract data to expected format
    const transformedData = {
      today: {
        date: new Date().toISOString().split('T')[0],
        matches: transformMatches(data.data || []),
        count: data.data?.length || 0
      },
      tomorrow: {
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        matches: [],
        count: 0
      },
      yesterday: {
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        matches: [],
        count: 0
      }
    };

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
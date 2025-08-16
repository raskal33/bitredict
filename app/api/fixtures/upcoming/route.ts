import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const league = searchParams.get('league');
    const team = searchParams.get('team');
    const limit = searchParams.get('limit');
    const oddyssey = searchParams.get('oddyssey');
    const days = searchParams.get('days') || '7';

    // Build query parameters for backend
    const queryParams = new URLSearchParams();
    if (league) queryParams.append('league', league);
    if (team) queryParams.append('team', team);
    if (limit) queryParams.append('limit', limit);
    if (oddyssey) queryParams.append('oddyssey', oddyssey);
    if (days) queryParams.append('days', days);

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://bitredict-backend.fly.dev';
    const url = `${backendUrl}/api/fixtures/upcoming?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();

    // Transform the fixtures data to match the expected format
    const transformedMatches = data.data.fixtures.map((fixture: {
      id?: string | number;
      homeTeam?: { id?: number; name?: string; logo?: string };
      awayTeam?: { id?: number; name?: string; logo?: string };
      league?: { id?: number; name?: string; logo?: string };
      matchDate?: string;
      startingAt?: string;
      venue?: { name?: string };
      status?: string;
      odds?: {
        home?: string | number;
        draw?: string | number;
        away?: string | number;
        over25?: string | number;
        under25?: string | number;
        bttsYes?: string | number;
        bttsNo?: string | number;
        over35?: string | number;
        under35?: string | number;
        htHome?: string | number;
        htDraw?: string | number;
        htAway?: string | number;
      };
    }) => ({
      fixture_id: parseInt(String(fixture.id || '')) || Math.floor(Math.random() * 1000000),
      home_team_id: fixture.homeTeam?.id || Math.floor(Math.random() * 1000000),
      home_team: fixture.homeTeam?.name || 'Unknown Team',
      home_team_logo: fixture.homeTeam?.logo || null,
      away_team_id: fixture.awayTeam?.id || Math.floor(Math.random() * 1000000),
      away_team: fixture.awayTeam?.name || 'Unknown Team',
      away_team_logo: fixture.awayTeam?.logo || null,
      league_id: fixture.league?.id || Math.floor(Math.random() * 1000000),
      league_name: fixture.league?.name || 'Unknown League',
      league_logo: fixture.league?.logo || null,
      match_time: fixture.matchDate || fixture.startingAt || new Date().toISOString(),
      venue_name: fixture.venue?.name || 'TBD',
      status: fixture.status || 'NS',
      // Use real odds from backend if available, otherwise use null
      home_odds: fixture.odds?.home ? parseFloat(String(fixture.odds.home)) : null,
      draw_odds: fixture.odds?.draw ? parseFloat(String(fixture.odds.draw)) : null,
      away_odds: fixture.odds?.away ? parseFloat(String(fixture.odds.away)) : null,
      over_25_odds: fixture.odds?.over25 ? parseFloat(String(fixture.odds.over25)) : null,
      under_25_odds: fixture.odds?.under25 ? parseFloat(String(fixture.odds.under25)) : null,
      btts_yes_odds: fixture.odds?.bttsYes ? parseFloat(String(fixture.odds.bttsYes)) : null,
      btts_no_odds: fixture.odds?.bttsNo ? parseFloat(String(fixture.odds.bttsNo)) : null,
      over_35_odds: fixture.odds?.over35 ? parseFloat(String(fixture.odds.over35)) : null,
      under_35_odds: fixture.odds?.under35 ? parseFloat(String(fixture.odds.under35)) : null,
      ht_home_odds: fixture.odds?.htHome ? parseFloat(String(fixture.odds.htHome)) : null,
      ht_draw_odds: fixture.odds?.htDraw ? parseFloat(String(fixture.odds.htDraw)) : null,
      ht_away_odds: fixture.odds?.htAway ? parseFloat(String(fixture.odds.htAway)) : null,
    }));

    return NextResponse.json({
      success: true,
      matches: transformedMatches,
      total: transformedMatches.length,
      message: 'Upcoming fixtures fetched successfully'
    });

  } catch (error) {
    console.error('Error fetching upcoming fixtures:', error);

    // Fallback to mock data if API fails
    const mockFixtures = [
      {
        id: 1,
        date: new Date().toISOString(),
        homeTeam: { name: 'Team A', logo: null },
        awayTeam: { name: 'Team B', logo: null },
        league: { name: 'Premier League', logo: null },
        venue: { name: 'Stadium A' },
        status: 'NS',
        odds: {
          home: null,
          draw: null,
          away: null,
          over25: null,
          under25: null,
          bttsYes: null,
          bttsNo: null,
          over35: null,
          under35: null,
          htHome: null,
          htDraw: null,
          htAway: null
        }
      }
    ];

    return NextResponse.json({
      success: true,
      matches: mockFixtures,
      total: mockFixtures.length,
      message: 'Using mock data - backend connection failed'
    });
  }
} 
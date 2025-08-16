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
      // Use real odds from backend if available, otherwise use defaults
      // Convert string odds to numbers
      home_odds: fixture.odds?.home ? parseFloat(String(fixture.odds.home)) : 2.0,
      draw_odds: fixture.odds?.draw ? parseFloat(String(fixture.odds.draw)) : 3.0,
      away_odds: fixture.odds?.away ? parseFloat(String(fixture.odds.away)) : 2.5,
      over_25_odds: fixture.odds?.over25 ? parseFloat(String(fixture.odds.over25)) : 1.8,
      under_25_odds: fixture.odds?.under25 ? parseFloat(String(fixture.odds.under25)) : 2.0,
      btts_yes_odds: fixture.odds?.bttsYes ? parseFloat(String(fixture.odds.bttsYes)) : 1.7,
      btts_no_odds: fixture.odds?.bttsNo ? parseFloat(String(fixture.odds.bttsNo)) : 1.9
    }));

    return NextResponse.json({
      success: true,
      matches: transformedMatches,
      total: transformedMatches.length,
      message: 'Upcoming fixtures fetched successfully'
    });

  } catch (error) {
    console.error('Error fetching upcoming fixtures:', error);

    // Return mock data as fallback with varied dates
    const generateMatchTime = (index: number): string => {
      const now = new Date();
      const baseTime = new Date(now.getTime() + (2 * 60 * 60 * 1000)); // 2 hours from now
      const hoursOffset = 2 + (index * 3) + Math.floor(Math.random() * 6);
      const matchTime = new Date(baseTime.getTime() + (hoursOffset * 60 * 60 * 1000));
      return matchTime.toISOString();
    };

    const mockFixtures = [
      {
        fixture_id: 1,
        home_team_id: 1,
        home_team: "Arsenal",
        home_team_logo: "https://media.api-sports.io/football/teams/42.png",
        away_team_id: 2,
        away_team: "Liverpool",
        away_team_logo: "https://media.api-sports.io/football/teams/40.png",
        league_id: 39,
        league_name: "Premier League",
        league_logo: "https://media.api-sports.io/football/leagues/39.png",
        match_time: generateMatchTime(0),
        venue_name: "Emirates Stadium",
        status: "NS",
        home_odds: 2.45,
        draw_odds: 3.40,
        away_odds: 2.90,
        over_25_odds: 1.75,
        under_25_odds: 2.15,
        btts_yes_odds: 1.9,
        btts_no_odds: 1.8
      },
      {
        fixture_id: 2,
        home_team_id: 3,
        home_team: "Barcelona",
        home_team_logo: "https://media.api-sports.io/football/teams/529.png",
        away_team_id: 4,
        away_team: "Real Madrid",
        away_team_logo: "https://media.api-sports.io/football/teams/541.png",
        league_id: 140,
        league_name: "La Liga",
        league_logo: "https://media.api-sports.io/football/leagues/140.png",
        match_time: generateMatchTime(1),
        venue_name: "Camp Nou",
        status: "NS",
        home_odds: 2.10,
        draw_odds: 3.50,
        away_odds: 3.20,
        over_25_odds: 1.65,
        under_25_odds: 2.30,
        btts_yes_odds: 1.7,
        btts_no_odds: 1.9
      },
      {
        fixture_id: 3,
        home_team_id: 5,
        home_team: "Bayern Munich",
        home_team_logo: "https://media.api-sports.io/football/teams/157.png",
        away_team_id: 6,
        away_team: "Borussia Dortmund",
        away_team_logo: "https://media.api-sports.io/football/teams/165.png",
        league_id: 78,
        league_name: "Bundesliga",
        league_logo: "https://media.api-sports.io/football/leagues/78.png",
        match_time: generateMatchTime(2),
        venue_name: "Allianz Arena",
        status: "NS",
        home_odds: 1.85,
        draw_odds: 3.60,
        away_odds: 4.20,
        over_25_odds: 1.55,
        under_25_odds: 2.45,
        btts_yes_odds: 1.6,
        btts_no_odds: 2.0
      },
      {
        fixture_id: 4,
        home_team_id: 7,
        home_team: "PSG",
        home_team_logo: "https://media.api-sports.io/football/teams/85.png",
        away_team_id: 8,
        away_team: "Marseille",
        away_team_logo: "https://media.api-sports.io/football/teams/81.png",
        league_id: 61,
        league_name: "Ligue 1",
        league_logo: "https://media.api-sports.io/football/leagues/61.png",
        match_time: generateMatchTime(3),
        venue_name: "Parc des Princes",
        status: "NS",
        home_odds: 1.65,
        draw_odds: 3.80,
        away_odds: 5.10,
        over_25_odds: 1.45,
        under_25_odds: 2.65,
        btts_yes_odds: 1.5,
        btts_no_odds: 2.2
      },
      {
        fixture_id: 5,
        home_team_id: 9,
        home_team: "AC Milan",
        home_team_logo: "https://media.api-sports.io/football/teams/489.png",
        away_team_id: 10,
        away_team: "Inter Milan",
        away_team_logo: "https://media.api-sports.io/football/teams/505.png",
        league_id: 135,
        league_name: "Serie A",
        league_logo: "https://media.api-sports.io/football/leagues/135.png",
        match_time: generateMatchTime(4),
        venue_name: "San Siro",
        status: "NS",
        home_odds: 2.30,
        draw_odds: 3.20,
        away_odds: 3.10,
        over_25_odds: 1.70,
        under_25_odds: 2.20,
        btts_yes_odds: 1.8,
        btts_no_odds: 1.9
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
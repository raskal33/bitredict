import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const popularLeagues = [
      { id: 1, name: "Premier League", country: "England", flag: "🇬🇧" },
      { id: 2, name: "La Liga", country: "Spain", flag: "🇪🇸" },
      { id: 3, name: "Bundesliga", country: "Germany", flag: "🇩🇪" },
      { id: 4, name: "Serie A", country: "Italy", flag: "🇮🇹" },
      { id: 5, name: "Ligue 1", country: "France", flag: "🇫🇷" },
      { id: 6, name: "Champions League", country: "Europe", flag: "🇪🇺" },
      { id: 7, name: "Europa League", country: "Europe", flag: "🇪🇺" },
      { id: 8, name: "World Cup", country: "International", flag: "🌍" }
    ];

    return NextResponse.json({ success: true, data: popularLeagues });
  } catch (error) {
    console.error('Error fetching popular leagues:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch popular leagues' },
      { status: 500 }
    );
  }
} 
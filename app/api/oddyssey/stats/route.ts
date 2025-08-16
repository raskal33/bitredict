import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const userAddress = searchParams.get('address');
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://bitredict-backend.fly.dev';

    console.log('🎯 Fetching Oddyssey stats:', { type, userAddress });

    const url = `${backendUrl}/api/oddyssey/stats?type=${type}${userAddress ? `&address=${userAddress}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json' 
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      console.error(`Backend responded with status: ${response.status}`);
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Backend stats response:', data);
    
    return NextResponse.json({ 
      success: true, 
      data: data.data, 
      message: 'Stats fetched successfully' 
    });
  } catch (error) {
    console.error('❌ Error fetching Oddyssey stats:', error);
    
    // Get type from URL params in catch block
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    // Fallback to mock data
    const mockData = type === 'user' ? {
      totalSlips: 15,
      totalWins: 8,
      bestScore: 1250,
      averageScore: 850,
      winRate: 5333, // 53.33%
      currentStreak: 3,
      bestStreak: 5,
      lastActiveCycle: 42
    } : {
      totalPlayers: 1234,
      totalSlips: 2847,
      totalCycles: 127,
      activeCycles: 3,
      completedCycles: 124,
      avgPrizePool: 5.2,
      winRate: 23.4,
      avgCorrect: 8.7,
      averageScore: 850,
      highestScore: 2500,
      totalWins: 665,
      leaderboard: []
    };

    return NextResponse.json({ 
      success: true, 
      data: mockData, 
      message: 'Using mock data - backend connection failed' 
    });
  }
} 
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') || 'profit_loss';
    const limit = searchParams.get('limit') || '100';
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://bitredict-backend.fly.dev';

    console.log('🎯 Fetching user leaderboard:', { sortBy, limit });

    const response = await fetch(`${backendUrl}/api/analytics/leaderboard/users?sortBy=${sortBy}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      console.error(`Backend responded with status: ${response.status}`);
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ User leaderboard fetched successfully:', data);

    return NextResponse.json({
      success: true,
      data: data.data || data,
      message: 'User leaderboard fetched successfully'
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('❌ Error fetching user leaderboard:', error);

    return NextResponse.json({
      success: false,
      data: [],
      message: 'Failed to fetch user leaderboard'
    }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🎯 Fetching current Oddyssey cycle');

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://bitredict-backend.fly.dev';

    const response = await fetch(`${backendUrl}/api/oddyssey/current`, {
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
    console.log('✅ Current cycle fetched successfully:', data);

    return NextResponse.json({
      success: true,
      data: data.data,
      message: 'Current cycle fetched successfully'
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('❌ Error fetching current cycle:', error);

    return NextResponse.json({
      success: false,
      data: {
        cycleId: null,
        isResolved: false,
        matches: [],
        totalMatches: 0,
        finishedMatches: 0
      },
      message: 'Failed to fetch current cycle'
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}

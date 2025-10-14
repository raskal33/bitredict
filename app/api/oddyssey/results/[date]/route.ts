import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;
    console.log('🎯 Fetching Oddyssey results for date:', date);

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://bitredict-backend.fly.dev';

    const response = await fetch(`${backendUrl}/api/oddyssey/results/${date}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      console.error(`Backend responded with status: ${response.status}`);
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Results fetched successfully:', data);

    return NextResponse.json({
      success: true,
      data: data.data,
      message: 'Results fetched successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching results:', error);

    return NextResponse.json({
      success: false,
      data: {
        date: 'unknown',
        cycleId: null,
        isResolved: false,
        matches: [],
        totalMatches: 0,
        finishedMatches: 0
      },
      message: 'Failed to fetch results'
    }, { status: 500 });
  }
}



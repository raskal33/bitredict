import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string; cycleId: string }> }
) {
  try {
    const { address, cycleId } = await params;
    console.log('🎯 Fetching live slip evaluation for user and cycle:', { address, cycleId });

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://bitredict-backend.fly.dev';

    const response = await fetch(`${backendUrl}/api/live-slip-evaluation/user/${address}/cycle/${cycleId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate', // Disable caching for live data
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
    console.log('✅ Live user cycle evaluation fetched successfully:', data);

    return NextResponse.json({
      success: true,
      data: data.data,
      message: 'Live user cycle evaluation fetched successfully'
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('❌ Error fetching live user cycle evaluation:', error);

    return NextResponse.json({
      success: false,
      data: null,
      message: 'Failed to fetch live user cycle evaluation'
    }, { status: 500 });
  }
}

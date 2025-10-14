import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slipId: string }> }
) {
  try {
    const { slipId } = await params;
    console.log('🎯 Fetching live slip evaluation for slipId:', slipId);

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://bitredict-backend.fly.dev';

    const response = await fetch(`${backendUrl}/api/live-slip-evaluation/${slipId}`, {
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
    console.log('✅ Live slip evaluation fetched successfully:', data);

    return NextResponse.json({
      success: true,
      data: data.data,
      message: 'Live slip evaluation fetched successfully'
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('❌ Error fetching live slip evaluation:', error);

    return NextResponse.json({
      success: false,
      data: null,
      message: 'Failed to fetch live slip evaluation'
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { poolId: string } }) {
  try {
    const { poolId } = params;
    console.log(`🎯 Fetching settlement results for pool ID: ${poolId}`);

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://bitredict-backend.fly.dev';
    const response = await fetch(`${backendUrl}/api/settlement-results/${poolId}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Backend settlement-results API responded with status ${response.status}: ${errorText}`);
      return NextResponse.json({ success: false, error: `Failed to fetch settlement results: ${errorText}` }, { status: response.status });
    }

    const data = await response.json();
    console.log(`✅ Successfully fetched settlement results for pool ID: ${poolId}`);
    return NextResponse.json({ success: true, data }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('❌ Error in settlement-results API route:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

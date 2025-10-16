import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ poolId: string }> }) {
  try {
    const { poolId } = await params;
    console.log(`🎯 Fetching transparency data for pool ID: ${poolId}`);

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://bitredict-backend.fly.dev';
    const response = await fetch(`${backendUrl}/api/settlement-results/transparency/${poolId}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Backend transparency API responded with status ${response.status}: ${errorText}`);
      return NextResponse.json({ success: false, error: `Failed to fetch transparency data: ${errorText}` }, { status: response.status });
    }

    const data = await response.json();
    console.log(`✅ Successfully fetched transparency data for pool ID: ${poolId}`);
    return NextResponse.json({ success: true, data }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('❌ Error in transparency API route:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

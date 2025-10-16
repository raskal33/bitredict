import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ poolId: string }> }
) {
  try {
    const { poolId } = await params;
    const { searchParams } = new URL(request.url);
    const stake = searchParams.get('stake');
    const odds = searchParams.get('odds');

    console.log(`🎯 Fetching potential winnings for pool ${poolId}: stake=${stake}, odds=${odds}`);

    if (!stake || !odds) {
      return NextResponse.json(
        { success: false, error: 'Missing stake or odds parameter' },
        { status: 400 }
      );
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://bitredict-backend.fly.dev';
    const url = new URL(`${backendUrl}/api/pool-analytics/${poolId}/potential-winnings`);
    url.searchParams.append('stake', stake);
    url.searchParams.append('odds', odds);

    const response = await fetch(url.toString(), {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { success: false, message: 'Potential winnings data not found' },
          { status: 404 }
        );
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Successfully fetched potential winnings for pool ${poolId}`);

    return NextResponse.json(
      { success: true, data: data.data },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error) {
    console.error('❌ Error fetching potential winnings:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

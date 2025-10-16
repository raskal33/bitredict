import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ marketId: string }> }
) {
  try {
    const { marketId } = await params;
    console.log(`🎯 Fetching match center data for market ID: ${marketId}`);

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://bitredict-backend.fly.dev';
    const response = await fetch(`${backendUrl}/api/match-center/market/${marketId}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`ℹ️ Match data not found for market ID: ${marketId}`);
        return NextResponse.json(
          { success: false, message: 'Match data not found' },
          { status: 404 }
        );
      }
      const errorText = await response.text();
      console.error(`❌ Backend match-center API responded with status ${response.status}: ${errorText}`);
      return NextResponse.json(
        { success: false, error: `Failed to fetch match data: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`✅ Successfully fetched match center data for market ID: ${marketId}`);
    
    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error) {
    console.error('❌ Error in match-center/market API route:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

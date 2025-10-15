import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🎯 Fetching live matches');

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://bitredict-backend.fly.dev';
    const response = await fetch(`${backendUrl}/api/match-center/live`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Backend match-center/live API responded with status ${response.status}: ${errorText}`);
      return NextResponse.json({ success: false, error: `Failed to fetch live matches: ${errorText}` }, { status: response.status });
    }

    const data = await response.json();
    console.log('✅ Successfully fetched live matches');
    return NextResponse.json({ success: true, data }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('❌ Error in match-center/live API route:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    console.log(`🎯 Fetching fixture details for ID: ${id}`);

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://bitredict-backend.fly.dev';
    const response = await fetch(`${backendUrl}/api/match-center/fixture/${id}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Backend match-center/fixture API responded with status ${response.status}: ${errorText}`);
      return NextResponse.json({ success: false, error: `Failed to fetch fixture details: ${errorText}` }, { status: response.status });
    }

    const data = await response.json();
    console.log(`✅ Successfully fetched fixture details for ID: ${id}`);
    return NextResponse.json({ success: true, data }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('❌ Error in match-center/fixture API route:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

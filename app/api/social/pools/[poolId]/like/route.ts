import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ poolId: string }> }
) {
  try {
    const { poolId } = await params;
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://bitredict-backend.fly.dev';
    
    const body = await request.json();
    const { userAddress } = body;

    console.log('🎯 Toggling pool like:', { poolId, userAddress });

    if (!poolId) {
      return NextResponse.json({
        success: false,
        error: 'Pool ID is required'
      }, { status: 400 });
    }

    if (!userAddress) {
      return NextResponse.json({
        success: false,
        error: 'User address is required'
      }, { status: 400 });
    }

    const response = await fetch(`${backendUrl}/api/social/pools/${poolId}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userAddress }),
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      console.error(`Backend responded with status: ${response.status}`);
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Pool like toggled successfully:', data);

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('❌ Error toggling pool like:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to toggle pool like',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}


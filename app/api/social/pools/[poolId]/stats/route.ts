import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ poolId: string }> }
) {
  try {
    const { poolId } = await params;
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://bitredict-backend.fly.dev';

    console.log('🎯 Fetching pool social stats:', poolId);

    if (!poolId) {
      return NextResponse.json({
        success: false,
        error: 'Pool ID is required'
      }, { status: 400 });
    }

    const response = await fetch(`${backendUrl}/api/social/pools/${poolId}/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      console.error(`Backend responded with status: ${response.status}`);
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      
      // If pool not found, return empty stats instead of error
      if (response.status === 404) {
        return NextResponse.json({
          success: true,
          data: {
            likes: 0,
            comments: 0,
            views: 0,
            shares: 0
          }
        });
      }
      
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Pool social stats fetched successfully:', data);

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('❌ Error fetching pool social stats:', error);

    // Return empty stats on error instead of failing
    return NextResponse.json({
      success: true,
      data: {
        likes: 0,
        comments: 0,
        views: 0,
        shares: 0
      }
    });
  }
}


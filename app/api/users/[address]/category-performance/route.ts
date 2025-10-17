import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://bitredict-backend.fly.dev';

    console.log('🎯 Fetching user category performance for address:', address);

    if (!address) {
      return NextResponse.json({
        success: false,
        message: 'Address is required'
      }, { status: 400 });
    }

    const response = await fetch(`${backendUrl}/api/users/${address}/category-performance`, {
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
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ User category performance fetched successfully:', data);

    return NextResponse.json({
      success: true,
      data: data.data || data,
      message: 'User category performance fetched successfully'
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('❌ Error fetching user category performance:', error);

    return NextResponse.json({
      success: false,
      data: [],
      message: 'Failed to fetch user category performance'
    }, { status: 500 });
  }
}

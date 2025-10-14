import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '50';
    const offset = searchParams.get('offset') || '0';
    const cycleId = searchParams.get('cycleId');

    console.log('🎯 Fetching user slips for address:', { address, limit, offset, cycleId });

    if (!address) {
      return NextResponse.json({
        success: false,
        message: 'Address is required'
      }, { status: 400 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://bitredict-backend.fly.dev';

    // Build query parameters
    const queryParams = new URLSearchParams({ limit, offset });
    if (cycleId) queryParams.append('cycleId', cycleId);

    const response = await fetch(`${backendUrl}/api/slips/user/${address}?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate', // Disable caching
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
    console.log('✅ User slips fetched successfully:', data);

    return NextResponse.json({
      success: true,
      data: data.data,
      message: 'User slips fetched successfully'
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('❌ Error fetching user slips:', error);

    return NextResponse.json({
      success: false,
      data: [],
      message: 'Failed to fetch user slips'
    }, { status: 500 });
  }
}

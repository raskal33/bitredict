import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '50';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    console.log('🎯 Fetching user slips for address:', { address, limit, startDate, endDate });

    if (!address) {
      return NextResponse.json({
        success: false,
        message: 'Address is required'
      }, { status: 400 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://bitredict-backend.fly.dev';

    // Build query parameters
    const queryParams = new URLSearchParams({ limit });
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    const response = await fetch(`${backendUrl}/api/oddyssey/user-slips/${address}?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
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

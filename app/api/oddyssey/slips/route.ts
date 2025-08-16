import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playerAddress = searchParams.get('address');
    const limit = searchParams.get('limit') || '10';

    console.log('🎯 Fetching user slips:', { playerAddress, limit });

    if (!playerAddress) {
      return NextResponse.json({
        success: false,
        message: 'Player address is required'
      }, { status: 400 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://bitredict-backend.fly.dev';

    const response = await fetch(`${backendUrl}/api/oddyssey/slips/${playerAddress}?limit=${limit}`, {
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
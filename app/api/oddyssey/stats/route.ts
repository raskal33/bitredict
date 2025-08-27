import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const userAddress = searchParams.get('address');
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://bitredict-backend.fly.dev';

    console.log('🎯 Fetching Oddyssey stats:', { type, userAddress });

    const url = `${backendUrl}/api/oddyssey/stats?type=${type}${userAddress ? `&address=${userAddress}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json' 
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      console.error(`Backend responded with status: ${response.status}`);
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Backend stats response:', data);
    
    return NextResponse.json({ 
      success: true, 
      data: data.data, 
      message: 'Stats fetched successfully' 
    });
  } catch (error) {
    console.error('❌ Error fetching Oddyssey stats:', error);
    
    // Get type from URL params in catch block
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    // Return error instead of mock data to help debug the issue
    return NextResponse.json({ 
      success: false, 
      data: null, 
      message: `Failed to fetch ${type} stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
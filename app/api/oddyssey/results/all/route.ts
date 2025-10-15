import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🎯 Fetching all Oddyssey results');

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://bitredict-backend.fly.dev';

    const response = await fetch(`${backendUrl}/api/oddyssey/results/all`, {
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
    console.log('✅ All results fetched successfully:', data);

    return NextResponse.json({
      success: true,
      data: data.data,
      message: 'All results fetched successfully'
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('❌ Error fetching all results:', error);

    return NextResponse.json({
      success: false,
      data: {
        cycles: [],
        totalCycles: 0
      },
      message: 'Failed to fetch all results'
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}

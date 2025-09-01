import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://bitredict-backend.fly.dev';
    const url = `${backendUrl}/api/oddyssey/contract-matches`;

    console.log('🎯 Validating contract matches from:', url);

    const response = await fetch(url, {
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
    console.log('✅ Contract validation response:', data);

    // Check if we have valid contract matches
    const hasMatches = data.data && Array.isArray(data.data) && data.data.length > 0;
    const matchCount = hasMatches ? data.data.length : 0;
    const expectedCount = 10;
    const isValid = hasMatches && matchCount === expectedCount;

    return NextResponse.json({
      success: true,
      validation: {
        hasMatches,
        matchCount,
        expectedCount,
        isValid,
        contractMatches: hasMatches ? data.data : []
      }
    });

  } catch (error) {
    console.error('❌ Error validating contract:', error);

    return NextResponse.json({
      success: false,
      validation: {
        hasMatches: false,
        matchCount: 0,
        expectedCount: 10,
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}

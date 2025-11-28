import { NextRequest, NextResponse } from 'next/server';

// ✅ Excluded from static export (proxied to backend via vercel.json)
export const dynamic = 'force-dynamic';
export const revalidate = false;
export const runtime = 'nodejs';

const BACKEND_URL = process.env.BACKEND_URL || 'https://bitredict-backend.fly.dev';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '100';
    
    // Validate limit
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
      return NextResponse.json(
        { error: 'Invalid limit parameter. Must be between 1 and 1000.' },
        { status: 400 }
      );
    }

    // Proxy request to backend
    const backendResponse = await fetch(`${BACKEND_URL}/api/airdrop/leaderboard?limit=${limitNum}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to fetch leaderboard' },
        { status: backendResponse.status }
      );
    }

    // Backend returns { leaderboard: [...], totalEligible: ..., totalUsers: ..., showingTop: ... }
    // Frontend expects just the array, so extract leaderboard property
    if (data.leaderboard && Array.isArray(data.leaderboard)) {
      return NextResponse.json(data.leaderboard);
    }

    // Fallback: return empty array if structure is unexpected
    console.warn('Unexpected leaderboard response structure:', data);
    return NextResponse.json([]);
  } catch (error) {
    console.error('Error fetching airdrop leaderboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
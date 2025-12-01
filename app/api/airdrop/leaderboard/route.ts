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

    // ✅ FIX: Backend route is at /airdrop/leaderboard (not /api/airdrop/leaderboard)
    const backendResponse = await fetch(`${BACKEND_URL}/airdrop/leaderboard?limit=${limitNum}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      console.error('❌ Backend leaderboard API error:', data);
      return NextResponse.json(
        { error: data.error || 'Failed to fetch leaderboard' },
        { status: backendResponse.status }
      );
    }

    // ✅ FIX: Backend returns { leaderboard: [...], totalEligible: ..., totalUsers: ..., showingTop: ... }
    // Frontend expects just the array, so extract leaderboard property
    if (data.leaderboard && Array.isArray(data.leaderboard)) {
      console.log(`✅ Leaderboard API: Returning ${data.leaderboard.length} users`);
      return NextResponse.json(data.leaderboard);
    }

    // ✅ FIX: If data is already an array (direct response), return it
    if (Array.isArray(data)) {
      console.log(`✅ Leaderboard API: Data is already array with ${data.length} users`);
      return NextResponse.json(data);
    }

    // Fallback: return empty array if structure is unexpected
    console.warn('⚠️ Unexpected leaderboard response structure:', data);
    return NextResponse.json([]);
  } catch (error) {
    console.error('Error fetching airdrop leaderboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
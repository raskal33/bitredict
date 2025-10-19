import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://bitredict-backend.fly.dev';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '50';
    const offset = searchParams.get('offset') || '0';
    // const category = searchParams.get('category') || 'all'; // Unused variable

    // Fetch pools from backend
    const response = await fetch(`${API_BASE_URL}/api/guided-markets/pools?limit=${limit}&offset=${offset}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch pools');
    }

    // Transform and format the data for frontend
    const formattedPools = data.data.pools.map((pool: Record<string, unknown>) => ({
      poolId: pool.id,
      creator: pool.creator,
      odds: pool.odds,
      settled: pool.settled || false,
      creatorSideWon: pool.creatorSideWon || false,
      isPrivate: pool.isPrivate || false,
      usesBitr: pool.usesBitr || false,
      filledAbove60: pool.filledAbove60 || false,
      oracleType: pool.oracleType || 'GUIDED',
      
      creatorStake: pool.creatorStake,
      totalCreatorSideStake: pool.totalCreatorSideStake || pool.creatorStake,
      maxBettorStake: pool.maxBettorStake || pool.totalBettorStake,
      totalBettorStake: pool.totalBettorStake,
      predictedOutcome: pool.predictedOutcome,
      result: pool.result || '',
      marketId: pool.marketId,
      marketType: pool.marketType || 0, // Add marketType field
      
      eventStartTime: typeof pool.eventStartTime === 'string' ? new Date(pool.eventStartTime).getTime() / 1000 : pool.eventStartTime,
      eventEndTime: typeof pool.eventEndTime === 'string' ? new Date(pool.eventEndTime).getTime() / 1000 : pool.eventEndTime,
      bettingEndTime: typeof pool.bettingEndTime === 'string' ? new Date(pool.bettingEndTime).getTime() / 1000 : pool.bettingEndTime,
      resultTimestamp: pool.resultTimestamp ? new Date(pool.resultTimestamp as string).getTime() / 1000 : 0,
      arbitrationDeadline: pool.arbitrationDeadline ? new Date(pool.arbitrationDeadline as string).getTime() / 1000 : (typeof pool.eventEndTime === 'string' ? new Date(pool.eventEndTime as string).getTime() / 1000 + (24 * 60 * 60) : (pool.eventEndTime as number) + (24 * 60 * 60)),
      
      league: pool.league || 'Unknown',
      category: pool.category || 'sports',
      region: pool.region || 'Global',
      maxBetPerUser: pool.maxBetPerUser,
      
      boostTier: pool.boostTier || 'NONE',
      boostExpiry: pool.boostExpiry || 0,
      trending: pool.trending || false,
      socialStats: pool.socialStats || {
        likes: 0,
        comments: 0,
        views: 0
      },
      change24h: pool.change24h || 0
    }));

    return NextResponse.json({
      success: true,
      data: {
        pools: formattedPools,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: formattedPools.length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching pools:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch pools'
      },
      { status: 500 }
    );
  }
}

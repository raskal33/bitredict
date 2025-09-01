import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface PoolData {
  id: string;
  creator: string;
  predicted_outcome: string;
  category: string;
  league: string;
  region: string;
  venue?: string;
  event_start_time: string;
  event_end_time: string;
  odds: number;
  creator_stake: string;
  total_bettor_stake: string;
  potential_win_amount: string;
  pool_fill_progress: number;
  uses_bitr: boolean;
  bet_market_type: string;
  created_at: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: poolId } = await params;

    // Fetch pool data from database
    const pools = (await query(`
      SELECT 
        id,
        creator_address as creator,
        predicted_outcome,
        category,
        league,
        region,
        venue,
        event_start_time,
        event_end_time,
        odds,
        creator_stake,
        COALESCE(
          (SELECT SUM(bet_amount) FROM pool_bets WHERE pool_id = pools.id AND bet_side = 'yes'), 
          0
        ) as total_bettor_stake,
        (creator_stake * odds) as potential_win_amount,
        CASE 
          WHEN creator_stake > 0 THEN 
            (COALESCE(
              (SELECT SUM(bet_amount) FROM pool_bets WHERE pool_id = pools.id AND bet_side = 'yes'), 
              0
            ) / creator_stake) * 100
          ELSE 0 
        END as pool_fill_progress,
        uses_bitr,
        bet_market_type,
        created_at
      FROM pools 
      WHERE id = ?
    `, [poolId]) as unknown) as PoolData[];

    if (pools.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Pool not found' },
        { status: 404 }
      );
    }

    const pool = pools[0];

    return NextResponse.json({
      success: true,
      data: {
        pool: {
          id: pool.id,
          creator: pool.creator,
          predictedOutcome: pool.predicted_outcome,
          category: pool.category,
          league: pool.league,
          region: pool.region,
          venue: pool.venue,
          eventStartTime: pool.event_start_time,
          eventEndTime: pool.event_end_time,
          odds: pool.odds,
          creatorStake: pool.creator_stake,
          totalBettorStake: pool.total_bettor_stake,
          potentialWinAmount: pool.potential_win_amount,
          poolFillProgress: pool.pool_fill_progress,
          usesBitr: pool.uses_bitr,
          betMarketType: pool.bet_market_type,
          createdAt: pool.created_at
        }
      }
    });

  } catch (error) {
    console.error('Error fetching pool data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pool data' },
      { status: 500 }
    );
  }
}

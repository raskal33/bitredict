import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface Bet {
  bet_id: number;
  pool_id: string;
  bettor_address: string;
  amount: string;
  is_for_outcome: boolean;
  transaction_hash: string;
  block_number: number;
  created_at: string;
  home_team?: string;
  away_team?: string;
  title?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: poolId } = await params;
    const { searchParams } = new URL(request.url);
    
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Validate sort parameters
    const validSortFields = ['created_at', 'amount', 'block_number'];
    const validSortOrders = ['asc', 'desc'];
    
    if (!validSortFields.includes(sortBy)) {
      return NextResponse.json(
        { success: false, error: 'Invalid sortBy parameter' },
        { status: 400 }
      );
    }
    
    if (!validSortOrders.includes(sortOrder)) {
      return NextResponse.json(
        { success: false, error: 'Invalid sortOrder parameter' },
        { status: 400 }
      );
    }

    // Get bets for the pool
    const bets = await query(`
      SELECT 
        bet_id,
        pool_id,
        bettor_address,
        amount,
        is_for_outcome,
        transaction_hash,
        block_number,
        created_at,
        home_team,
        away_team,
        title
      FROM oracle.bets 
      WHERE pool_id = $1
      ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $2 OFFSET $3
    `, [poolId, limit, offset]) as unknown as Bet[];

    // Get total count for pagination
    const countResult = await query(`
      SELECT COUNT(*) as total_count
      FROM oracle.bets 
      WHERE pool_id = $1
    `, [poolId]) as unknown as { total_count: string }[];

    const totalCount = parseInt(countResult[0]?.total_count || '0');

    // Calculate statistics
    const statsResult = await query(`
      SELECT 
        COUNT(*) as total_bets,
        SUM(CAST(amount AS NUMERIC)) as total_volume,
        COUNT(CASE WHEN is_for_outcome = true THEN 1 END) as yes_bets,
        COUNT(CASE WHEN is_for_outcome = false THEN 1 END) as no_bets,
        SUM(CASE WHEN is_for_outcome = true THEN CAST(amount AS NUMERIC) ELSE 0 END) as yes_volume,
        SUM(CASE WHEN is_for_outcome = false THEN CAST(amount AS NUMERIC) ELSE 0 END) as no_volume
      FROM oracle.bets 
      WHERE pool_id = $1
    `, [poolId]) as unknown as {
      total_bets: string;
      total_volume: string;
      yes_bets: string;
      no_bets: string;
      yes_volume: string;
      no_volume: string;
    }[];

    const stats = statsResult[0] || {
      total_bets: '0',
      total_volume: '0',
      yes_bets: '0',
      no_bets: '0',
      yes_volume: '0',
      no_volume: '0'
    };

    return NextResponse.json({
      success: true,
      data: {
        bets,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        },
        stats: {
          totalBets: parseInt(stats.total_bets),
          totalVolume: parseFloat(stats.total_volume),
          yesBets: parseInt(stats.yes_bets),
          noBets: parseInt(stats.no_bets),
          yesVolume: parseFloat(stats.yes_volume),
          noVolume: parseFloat(stats.no_volume)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching pool bets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pool bets' },
      { status: 500 }
    );
  }
}

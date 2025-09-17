import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface UserStats {
  user_address: string;
  total_bets: number;
  total_bet_amount: number;
  total_liquidity: number;
  total_liquidity_amount: number;
  total_pools_created: number;
  total_volume: number;
  win_count: number;
  loss_count: number;
  reputation_score: number;
  last_activity: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'total_volume';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const userAddress = searchParams.get('address');

    // Validate sort parameters
    const validSortFields = ['total_volume', 'total_bets', 'total_liquidity', 'reputation_score', 'last_activity'];
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

    let whereClause = '';
    let queryParams: (string | number)[] = [];

    if (userAddress) {
      whereClause = 'WHERE user_address = ?';
      queryParams = [userAddress];
    }

    // Get user statistics
    const userStatsResult = await query(`
      SELECT 
        user_address,
        total_bets,
        total_bet_amount,
        total_liquidity,
        total_liquidity_amount,
        total_pools_created,
        total_volume,
        win_count,
        loss_count,
        reputation_score,
        last_activity
      FROM oracle.user_stats
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
      LIMIT ? OFFSET ?
    `, [...queryParams, limit, offset]) as unknown as UserStats[];

    // Get total count for pagination
    const totalCountResult = await query(`
      SELECT COUNT(*) as count FROM oracle.user_stats ${whereClause}
    `, queryParams) as [{ count: string }];

    const totalCount = parseInt(totalCountResult[0]?.count || '0');

    // Enhance the stats with calculated fields
    const enhancedStats = userStatsResult.map(stat => ({
      ...stat,
      win_rate: stat.win_count + stat.loss_count > 0 
        ? (stat.win_count / (stat.win_count + stat.loss_count) * 100).toFixed(1)
        : '0.0',
      total_activity: stat.total_bets + stat.total_liquidity,
      avg_bet_size: stat.total_bets > 0 
        ? (stat.total_bet_amount / stat.total_bets).toFixed(2)
        : '0.00',
      avg_liquidity_size: stat.total_liquidity > 0 
        ? (stat.total_liquidity_amount / stat.total_liquidity).toFixed(2)
        : '0.00',
      reputation_tier: getReputationTier(stat.reputation_score)
    }));

    return NextResponse.json({
      success: true,
      data: {
        users: enhancedStats,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user statistics' },
      { status: 500 }
    );
  }
}

function getReputationTier(score: number): string {
  if (score >= 150) return 'Legendary';
  if (score >= 100) return 'Expert';
  if (score >= 75) return 'Veteran';
  if (score >= 50) return 'Trusted';
  if (score >= 25) return 'Regular';
  if (score >= 10) return 'Beginner';
  return 'New';
}

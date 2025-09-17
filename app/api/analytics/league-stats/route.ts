import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface LeagueStats {
  league_name: string;
  total_pools: number;
  total_volume: number;
  total_participants: number;
  avg_pool_size: number;
  most_popular_market_type: number;
  last_activity: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'total_volume';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Validate sort parameters
    const validSortFields = ['total_volume', 'total_pools', 'total_participants', 'avg_pool_size', 'last_activity'];
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

    // Get league statistics
    const leagueStatsResult = await query(`
      SELECT 
        league_name,
        total_pools,
        total_volume,
        total_participants,
        avg_pool_size,
        most_popular_market_type,
        last_activity
      FROM oracle.league_stats
      ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
      LIMIT ? OFFSET ?
    `, [limit, offset]) as unknown as LeagueStats[];

    // Get total count for pagination
    const totalCountResult = await query(`
      SELECT COUNT(*) as count FROM oracle.league_stats
    `) as [{ count: string }];

    const totalCount = parseInt(totalCountResult[0]?.count || '0');

    // Get market type names for display
    const marketTypesResult = await query(`
      SELECT market_type, market_type_name 
      FROM oracle.market_type_stats
    `) as unknown as { market_type: number; market_type_name: string }[];

    const marketTypeMap = new Map(
      marketTypesResult.map(mt => [mt.market_type, mt.market_type_name])
    );

    // Enhance the stats with market type names
    const enhancedStats = leagueStatsResult.map(stat => ({
      ...stat,
      most_popular_market_type_name: marketTypeMap.get(stat.most_popular_market_type) || 'Unknown'
    }));

    return NextResponse.json({
      success: true,
      data: {
        leagues: enhancedStats,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        }
      }
    });

  } catch (error) {
    console.error('Error fetching league stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch league statistics' },
      { status: 500 }
    );
  }
}

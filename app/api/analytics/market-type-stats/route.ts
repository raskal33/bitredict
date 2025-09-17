import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface MarketTypeStats {
  market_type: number;
  market_type_name: string;
  total_pools: number;
  total_volume: number;
  total_participants: number;
  avg_pool_size: number;
  win_rate: number;
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
    const validSortFields = ['total_volume', 'total_pools', 'total_participants', 'avg_pool_size', 'win_rate', 'last_activity'];
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

    // Get market type statistics
    const marketTypeStatsResult = await query(`
      SELECT 
        market_type,
        market_type_name,
        total_pools,
        total_volume,
        total_participants,
        avg_pool_size,
        win_rate,
        last_activity
      FROM oracle.market_type_stats
      ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
      LIMIT ? OFFSET ?
    `, [limit, offset]) as unknown as MarketTypeStats[];

    // Get total count for pagination
    const totalCountResult = await query(`
      SELECT COUNT(*) as count FROM oracle.market_type_stats
    `) as [{ count: string }];

    const totalCount = parseInt(totalCountResult[0]?.count || '0');

    // Enhance the stats with market type icons and descriptions
    const enhancedStats = marketTypeStatsResult.map(stat => ({
      ...stat,
      icon: getMarketTypeIcon(stat.market_type),
      description: getMarketTypeDescription(stat.market_type),
      color: getMarketTypeColor(stat.market_type)
    }));

    return NextResponse.json({
      success: true,
      data: {
        marketTypes: enhancedStats,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        }
      }
    });

  } catch (error) {
    console.error('Error fetching market type stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch market type statistics' },
      { status: 500 }
    );
  }
}

function getMarketTypeIcon(marketType: number): string {
  const iconMap: { [key: number]: string } = {
    0: '🏆', // MONEYLINE
    1: '📊', // OVER_UNDER
    2: '⚽', // BOTH_TEAMS_SCORE
    3: '⏰', // HALF_TIME
    4: '🎯', // DOUBLE_CHANCE
    5: '🎲', // CORRECT_SCORE
    6: '⚡', // FIRST_GOAL
    7: '💡'  // CUSTOM
  };
  return iconMap[marketType] || '📈';
}

function getMarketTypeDescription(marketType: number): string {
  const descriptionMap: { [key: number]: string } = {
    0: 'Match winner (1X2)',
    1: 'Total goals over/under',
    2: 'Both teams to score',
    3: 'Half-time result',
    4: 'Double chance betting',
    5: 'Exact score prediction',
    6: 'First goal scorer',
    7: 'Custom prediction'
  };
  return descriptionMap[marketType] || 'Unknown market type';
}

function getMarketTypeColor(marketType: number): string {
  const colorMap: { [key: number]: string } = {
    0: 'blue',
    1: 'green',
    2: 'orange',
    3: 'purple',
    4: 'red',
    5: 'yellow',
    6: 'pink',
    7: 'gray'
  };
  return colorMap[marketType] || 'gray';
}

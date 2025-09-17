import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface CategoryStats {
  category_name: string;
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

    // Get category statistics
    const categoryStatsResult = await query(`
      SELECT 
        category_name,
        total_pools,
        total_volume,
        total_participants,
        avg_pool_size,
        most_popular_market_type,
        last_activity
      FROM oracle.category_stats
      ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
      LIMIT ? OFFSET ?
    `, [limit, offset]) as unknown as CategoryStats[];

    // Get total count for pagination
    const totalCountResult = await query(`
      SELECT COUNT(*) as count FROM oracle.category_stats
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

    // Enhance the stats with market type names and category icons
    const enhancedStats = categoryStatsResult.map(stat => ({
      ...stat,
      most_popular_market_type_name: marketTypeMap.get(stat.most_popular_market_type) || 'Unknown',
      icon: getCategoryIcon(stat.category_name),
      color: getCategoryColor(stat.category_name)
    }));

    return NextResponse.json({
      success: true,
      data: {
        categories: enhancedStats,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        }
      }
    });

  } catch (error) {
    console.error('Error fetching category stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch category statistics' },
      { status: 500 }
    );
  }
}

function getCategoryIcon(category: string): string {
  const iconMap: { [key: string]: string } = {
    'football': '⚽',
    'basketball': '🏀',
    'cryptocurrency': '₿',
    'politics': '🏛️',
    'entertainment': '🎬',
    'technology': '💻',
    'sports': '🏆',
    'esports': '🎮'
  };
  return iconMap[category.toLowerCase()] || '📊';
}

function getCategoryColor(category: string): string {
  const colorMap: { [key: string]: string } = {
    'football': 'green',
    'basketball': 'orange',
    'cryptocurrency': 'yellow',
    'politics': 'red',
    'entertainment': 'pink',
    'technology': 'blue',
    'sports': 'purple',
    'esports': 'indigo'
  };
  return colorMap[category.toLowerCase()] || 'gray';
}

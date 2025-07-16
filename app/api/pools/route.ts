import { NextRequest, NextResponse } from 'next/server';
import { Pool } from '@/lib/types';

// This would connect to your actual database in production
// For now, using the same demo data structure for consistency
import { getDemoPoolData } from '@/lib/demoData';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const featured = searchParams.get('featured') === 'true';
    const boosted = searchParams.get('boosted') === 'true';
    const trending = searchParams.get('trending') === 'true';

    // In production, this would be a database query like:
    // const pools = await db.pools.findMany({
    //   where: {
    //     ...(category && { category }),
    //     ...(featured && { OR: [{ boosted: true }, { trending: true }] }),
    //     ...(boosted && { boosted: true }),
    //     ...(trending && { trending: true }),
    //   },
    //   take: limit,
    //   include: {
    //     creator: true,
    //     eventDetails: true,
    //     socialStats: true,
    //   },
    //   orderBy: [
    //     { boosted: 'desc' },
    //     { volume: 'desc' },
    //     { createdAt: 'desc' }
    //   ]
    // });

    // For demo purposes, generate consistent pool data
    let pools: Pool[] = [];
    
    // Generate multiple pools with different IDs for demo
    for (let i = 1; i <= limit; i++) {
      const poolData = getDemoPoolData(`pool-${i}`);
      pools.push(poolData[0]);
    }

    // Apply filters
    if (category) {
      pools = pools.filter(pool => pool.category === category);
    }
    
    if (featured) {
      pools = pools.filter(pool => pool.boosted || pool.trending);
    }
    
    if (boosted) {
      pools = pools.filter(pool => pool.boosted);
    }
    
    if (trending) {
      pools = pools.filter(pool => pool.trending);
    }

    return NextResponse.json({
      success: true,
      data: pools.slice(0, limit),
      pagination: {
        total: pools.length,
        limit,
        page: 1,
        totalPages: Math.ceil(pools.length / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching pools:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pools' },
      { status: 500 }
    );
  }
} 
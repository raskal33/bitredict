import { NextRequest, NextResponse } from 'next/server';
import { getDemoPoolData } from '@/lib/demoData';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '12');

    // In production, this would be a database query:
    // const pools = await db.pools.findMany({
    //   where: {
    //     OR: [
    //       { boosted: true },
    //       { trending: true },
    //       { volume: { gte: 50000 } }, // High volume pools
    //       { creator: { successRate: { gte: 80 } } } // High success rate creators
    //     ]
    //   },
    //   take: limit,
    //   include: {
    //     creator: true,
    //     eventDetails: true,
    //     socialStats: includeSocial,
    //   },
    //   orderBy: [
    //     { boosted: 'desc' },
    //     { trending: 'desc' },
    //     { volume: 'desc' },
    //     { createdAt: 'desc' }
    //   ]
    // });

    // For demo, generate diverse featured pools
    const pools = getDemoPoolData('featured');

    return NextResponse.json({
      success: true,
      data: pools.slice(0, limit)
    });

  } catch (error) {
    console.error('Error fetching featured pools:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch featured pools' },
      { status: 500 }
    );
  }
} 
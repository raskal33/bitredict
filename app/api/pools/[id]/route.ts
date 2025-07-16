import { NextRequest, NextResponse } from 'next/server';
import { getDemoPoolData } from '@/lib/demoData';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: poolId } = await params;
    const { searchParams } = new URL(request.url);
    const includeSocial = searchParams.get('include_social') === 'true';

    // In production, this would be a database query:
    // const pool = await db.pools.findUnique({
    //   where: { id: poolId },
    //   include: {
    //     creator: true,
    //     eventDetails: true,
    //     socialStats: true,
    //     comments: includeSocial ? {
    //       include: {
    //         author: true,
    //         replies: {
    //           include: { author: true }
    //         }
    //       },
    //       orderBy: { createdAt: 'desc' }
    //     } : false,
    //   }
    // });

    // For demo, use the same data source as pool cards
    const poolData = getDemoPoolData(poolId);
    
    if (!poolData || poolData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Pool not found' },
        { status: 404 }
      );
    }

    const pool = poolData[0];

    // Add mock comments if social data requested
    if (includeSocial) {
      pool.comments = [
        {
          id: 'comment-1',
          content: 'Based on technical analysis, this prediction has strong fundamentals. The creator has shown consistent accuracy in this category.',
          author: {
            address: '0x1234...5678',
            username: 'TechAnalyst',
            badges: ['analyst', 'verified']
          },
          sentiment: 'bullish',
          confidence: 85,
          likes: 23,
          dislikes: 2,
          hasUserLiked: false,
          hasUserDisliked: false,
          isVerifiedBetter: true,
          createdAt: '2024-12-01T10:30:00Z',
          replies: []
        },
        {
          id: 'comment-2',
          content: 'I disagree with the creator on this one. Market conditions suggest a different outcome is more likely.',
          author: {
            address: '0x5678...9012',
            username: 'MarketWatch',
            badges: ['market_expert']
          },
          sentiment: 'bearish',
          confidence: 78,
          likes: 15,
          dislikes: 5,
          hasUserLiked: false,
          hasUserDisliked: false,
          isVerifiedBetter: true,
          createdAt: '2024-12-01T14:15:00Z',
          replies: []
        }
      ];
    }

    return NextResponse.json({
      success: true,
      data: pool
    });

  } catch (error) {
    console.error('Error fetching pool:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pool' },
      { status: 500 }
    );
  }
} 
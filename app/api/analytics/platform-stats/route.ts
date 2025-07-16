import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // In production, this would aggregate data from your database:
    // const stats = await db.$transaction([
    //   db.pools.aggregate({ _sum: { volume: true } }),
    //   db.pools.count({ where: { status: 'active' } }),
    //   db.bets.count(),
    //   db.bets.aggregate({ _avg: { successRate: true } }),
    //   db.users.count({ where: { totalPools: { gt: 0 } } }),
    //   db.pools.aggregate({ _avg: { challengeScore: true } })
    // ]);

    // For demo purposes, return consistent stats
    const stats = {
      totalVolume: 2840000,
      activePools: 156,
      totalBets: 8924,
      successRate: 73.2,
      totalCreators: 1247,
      avgChallengeScore: 67
    };

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching platform stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch platform stats' },
      { status: 500 }
    );
  }
} 
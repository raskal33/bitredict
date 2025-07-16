import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface QueryResult {
  count?: string;
  total?: string;
  rate?: string;
  avg_score?: string;
}

export async function GET() {
  try {
    // Get platform statistics
    const [poolsResult, betsResult, volumeResult, creatorsResult] = await Promise.all([
      query('SELECT COUNT(*) as count FROM prediction_pools WHERE status = ?', ['active']),
      query('SELECT COUNT(*) as count FROM pool_bets'),
      query('SELECT SUM(bet_amount) as total FROM pool_bets'),
      query('SELECT COUNT(DISTINCT created_by) as count FROM prediction_pools')
    ]) as [QueryResult[], QueryResult[], QueryResult[], QueryResult[]];

    // Calculate success rate
    const successRateResult = (await query(`
      SELECT 
        COUNT(CASE WHEN outcome = predicted_outcome THEN 1 END) * 100.0 / COUNT(*) as rate
      FROM prediction_pools 
      WHERE status = 'resolved'
    `)) as QueryResult[];

    // Calculate average challenge score
    const challengeScoreResult = (await query(`
      SELECT AVG(challenge_score) as avg_score 
      FROM prediction_pools 
      WHERE challenge_score IS NOT NULL
    `)) as QueryResult[];

    const stats = {
      totalVolume: parseInt(volumeResult[0]?.total || '0'),
      activePools: parseInt(poolsResult[0]?.count || '0'),
      totalBets: parseInt(betsResult[0]?.count || '0'),
      successRate: parseFloat(successRateResult[0]?.rate || '0'),
      totalCreators: parseInt(creatorsResult[0]?.count || '0'),
      avgChallengeScore: parseInt(challengeScoreResult[0]?.avg_score || '0')
    };

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching platform stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch platform statistics' },
      { status: 500 }
    );
  }
} 
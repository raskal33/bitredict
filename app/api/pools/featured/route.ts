import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface Badge {
  badge_id: string;
}

interface Activity {
  activity_type: 'comment' | 'bet' | 'like';
  count: string;
  latest: string;
}

interface PoolQueryResult {
  id: string;
  title: string;
  description: string;
  category: string;
  created_by: string;
  creator_username: string;
  creator_reputation: string;
  creator_total_pools: string;
  creator_success_rate: string;
  creator_challenge_score: string;
  creator_total_volume: string;
  creator_bio: string;
  creator_created_at: string;
  challenge_score: string;
  quality_score: string;
  difficulty_tier: string;
  total_volume: string;
  target_amount: string;
  odds: string;
  predicted_outcome: string;
  participant_count: string;
  end_date: string;
  trending: number;
  boosted: number;
  boost_tier: string;
  image_emoji: string;
  card_theme: string;
  volume_24h: string;
  price_change_24h: string;
  confidence_score: string;
  currency: string;
  comment_count?: string;
  like_count?: string;
  view_count?: string;
  share_count?: string;
  defeated_count?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '12');
    const includeSocial = searchParams.get('include_social') === 'true';

    // Get featured pools with creator and social data
    const pools = (await query(`
      SELECT 
        p.*,
        u.username as creator_username,
        u.reputation as creator_reputation,
        u.total_pools as creator_total_pools,
        u.success_rate as creator_success_rate,
        u.challenge_score as creator_challenge_score,
        u.total_volume as creator_total_volume,
        u.bio as creator_bio,
        u.created_at as creator_created_at,
        ${includeSocial ? `
        (SELECT COUNT(*) FROM pool_comments WHERE pool_id = p.id) as comment_count,
        (SELECT COUNT(*) FROM pool_reactions WHERE pool_id = p.id AND reaction_type = 'like') as like_count,
        (SELECT COUNT(*) FROM pool_views WHERE pool_id = p.id) as view_count,
        (SELECT COUNT(*) FROM pool_shares WHERE pool_id = p.id) as share_count,
        (SELECT COUNT(*) FROM pool_bets WHERE pool_id = p.id AND status = 'lost') as defeated_count,
        ` : ''}
        (SELECT COUNT(*) FROM pool_bets WHERE pool_id = p.id) as participant_count,
        (SELECT SUM(bet_amount) FROM pool_bets WHERE pool_id = p.id) as total_volume,
        (SELECT SUM(bet_amount) FROM pool_bets WHERE pool_id = p.id AND created_at >= NOW() - INTERVAL 1 DAY) as volume_24h
      FROM prediction_pools p
      JOIN users u ON p.created_by = u.address
      WHERE p.status = 'active'
      ORDER BY 
        p.featured DESC,
        p.boosted DESC,
        p.created_at DESC
      LIMIT ?
    `, [limit]) as unknown) as PoolQueryResult[];

    // Get creator badges for each pool
    const poolsWithData = await Promise.all(pools.map(async (pool: PoolQueryResult) => {
      const badges = (await query(`
        SELECT badge_id 
        FROM user_badges 
        WHERE user_address = ? AND earned_at IS NOT NULL
      `, [pool.created_by]) as unknown) as Badge[];

      let activities: Activity[] = [];
      if (includeSocial) {
        activities = (await query(`
          SELECT activity_type, COUNT(*) as count, MAX(created_at) as latest
          FROM (
            SELECT 'comment' as activity_type, created_at FROM pool_comments WHERE pool_id = ?
            UNION ALL
            SELECT 'bet' as activity_type, created_at FROM pool_bets WHERE pool_id = ?
            UNION ALL
            SELECT 'like' as activity_type, created_at FROM pool_reactions WHERE pool_id = ?
          ) activities
          WHERE created_at >= NOW() - INTERVAL 1 DAY
          GROUP BY activity_type
          ORDER BY latest DESC
          LIMIT 3
        `, [pool.id, pool.id, pool.id]) as unknown) as Activity[];
      }

      return {
        id: pool.id,
        title: pool.title,
        description: pool.description,
        category: pool.category,
        creator: {
          address: pool.created_by,
          username: pool.creator_username,
          reputation: parseFloat(pool.creator_reputation || '0'),
          totalPools: parseInt(pool.creator_total_pools || '0'),
          successRate: parseFloat(pool.creator_success_rate || '0'),
          challengeScore: parseInt(pool.creator_challenge_score || '0'),
          totalVolume: parseInt(pool.creator_total_volume || '0'),
          badges: badges.map(b => b.badge_id),
          createdAt: pool.creator_created_at,
          bio: pool.creator_bio
        },
        challengeScore: parseInt(pool.challenge_score || '0'),
        qualityScore: parseInt(pool.quality_score || '0'),
        difficultyTier: pool.difficulty_tier || 'medium',
        progress: parseInt(pool.total_volume || '0'),
        total: parseInt(pool.target_amount || '100000'),
        odds: parseFloat(pool.odds || '1.5'),
        outcome: pool.predicted_outcome,
        participants: parseInt(pool.participant_count || '0'),
        endDate: pool.end_date,
        trending: pool.trending === 1,
        boosted: pool.boosted === 1,
        boostTier: parseInt(pool.boost_tier || '0'),
        image: pool.image_emoji || '🎯',
        cardTheme: pool.card_theme || 'cyan',
        volume24h: parseInt(pool.volume_24h || '0'),
        change24h: parseFloat(pool.price_change_24h || '0'),
        confidence: parseInt(pool.confidence_score || '75'),
        currency: pool.currency || 'STT',
        ...(includeSocial && {
          socialStats: {
            comments: parseInt(pool.comment_count || '0'),
            likes: parseInt(pool.like_count || '0'),
            views: parseInt(pool.view_count || '0'),
            shares: parseInt(pool.share_count || '0')
          },
          recentActivity: activities.map((activity: Activity) => ({
            type: activity.activity_type,
            count: parseInt(activity.count),
            timeAgo: getTimeAgo(activity.latest)
          })),
          defeated: parseInt(pool.defeated_count || '0')
        })
      };
    }));

    return NextResponse.json({
      success: true,
      data: poolsWithData
    });

  } catch (error) {
    console.error('Error fetching featured pools:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch featured pools' },
      { status: 500 }
    );
  }
}

function getTimeAgo(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
  return `${Math.floor(diffInMinutes / 1440)}d`;
} 
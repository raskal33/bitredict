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

const getDemoPoolData = () => [
  {
    id: "1",
    title: "Bitcoin will reach $100,000 by March 2025",
    description: "Prediction market on Bitcoin reaching six-figure milestone before March 31, 2025. This challenge tests macro crypto market timing.",
    category: "crypto",
    creator: {
      address: "0x1234...5678",
      username: "CryptoSage",
      reputation: 4.8,
      totalPools: 23,
      successRate: 78.3,
      challengeScore: 89,
      totalVolume: 450000,
      badges: ["legendary", "crypto_expert", "whale"],
      createdAt: "2024-01-15T10:30:00Z",
      bio: "Macro crypto analyst with 8 years of experience."
    },
    challengeScore: 89,
    qualityScore: 94,
    difficultyTier: "very_hard",
    odds: 1.75,
    participants: 247,
    volume: 125000,
    currency: "BITR",
    endDate: "2025-03-31",
    trending: true,
    boosted: true,
    boostTier: 3,
    poolType: "single",
    image: "🪙",
    cardTheme: "cyan",
    socialStats: {
      comments: 89,
      likes: 156,
      views: 2340,
      shares: 23
    },
    comments: [],
    defeated: 34,
    volume24h: 12500,
    change24h: 8.5,
    predictedOutcome: "No" // What creator thinks WON'T happen
  },
  {
    id: "2",
    title: "Manchester City wins Premier League 2024/25",
    description: "Premier League championship prediction market for the 2024/25 season. Will City claim another title?",
    category: "sports",
    creator: {
      address: "0x5678...9012",
      username: "FootballOracle",
      reputation: 4.5,
      totalPools: 15,
      successRate: 73.2,
      challengeScore: 76,
      totalVolume: 280000,
      badges: ["sports_expert", "predictor"],
      createdAt: "2024-02-01T14:20:00Z"
    },
    challengeScore: 76,
    qualityScore: 82,
    difficultyTier: "hard",
    odds: 2.1,
    participants: 189,
    volume: 89000,
    currency: "STT",
    endDate: "2025-05-25",
    trending: false,
    boosted: false,
    poolType: "single",
    image: "⚽",
    cardTheme: "magenta",
    socialStats: {
      comments: 34,
      likes: 67,
      views: 890,
      shares: 12
    },
    comments: [],
    defeated: 18,
    volume24h: 8900,
    change24h: -2.1,
    predictedOutcome: "Yes" // What creator thinks WON'T happen
  },
  {
    id: "3",
    title: "Tesla stock will hit $300 by end of 2024",
    description: "Tesla's stock price prediction for year-end 2024. Will TSLA reach the $300 milestone?",
    category: "finance",
    creator: {
      address: "0x9012...3456",
      username: "StockWizard",
      reputation: 4.2,
      totalPools: 31,
      successRate: 69.8,
      challengeScore: 82,
      totalVolume: 320000,
      badges: ["finance_expert", "analyst"],
      createdAt: "2024-01-20T09:15:00Z"
    },
    challengeScore: 82,
    qualityScore: 88,
    difficultyTier: "medium",
    odds: 1.9,
    participants: 156,
    volume: 67000,
    currency: "STT",
    endDate: "2024-12-31",
    trending: true,
    boosted: true,
    boostTier: 2,
    poolType: "single",
    image: "📈",
    cardTheme: "violet",
    socialStats: {
      comments: 45,
      likes: 78,
      views: 1240,
      shares: 15
    },
    comments: [],
    defeated: 22,
    volume24h: 5600,
    change24h: 3.2,
    predictedOutcome: "No" // What creator thinks WON'T happen
  }
];

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

    // If no pools found in database, return demo data
    if (!pools || pools.length === 0) {
      return NextResponse.json({
        success: true,
        data: getDemoPoolData().slice(0, limit)
      });
    }

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
        predictedOutcome: pool.predicted_outcome, // What creator thinks WON'T happen
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
    // Return demo data on error
    return NextResponse.json({
      success: true,
      data: getDemoPoolData().slice(0, parseInt(new URL(request.url).searchParams.get('limit') || '12'))
    });
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
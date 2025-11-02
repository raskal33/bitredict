export interface Creator {
  address: string;
  username: string;
  reputation: number;
  totalPools: number;
  successRate: number;
  challengeScore: number;
  totalVolume: number;
  badges: string[];
  createdAt: string;
  bio?: string;
  avatar?: string;
}

export interface SocialStats {
  comments: number;
  likes: number;
  views: number;
  shares: number;
}

export interface Pool {
  id: string;
  title: string;
  description: string;
  category: string;
  homeTeam?: string;
  awayTeam?: string;
  creatorAddress?: string; // ✅ FIX: Store creator address for creator check in comments
  creator: Creator;
  challengeScore: number;
  qualityScore?: number;
  difficultyTier: 'easy' | 'medium' | 'hard' | 'very_hard' | 'legendary';
  odds: number;
  participants: number;
  volume: number;
  currency: 'STT' | 'BITR';
  endDate: string;
  trending: boolean;
  boosted: boolean;
  boostTier?: number;
  poolType: 'single' | 'combo' | 'parlay';
  comboCount?: number;
  image: string;
  cardTheme: string;
  socialStats: SocialStats;
  comments: Comment[];
  defeated: number;
  marketType?: string;
  marketId?: string;
  fixtureId?: string;  // SportMonks fixture ID for football pools
  progress?: number;
  total?: number;
  outcome?: string;
  predictedOutcome?: string;
  creatorPrediction?: 'yes' | 'no';
  eventDetails?: {
    startTime: Date;
    endTime: Date;
    venue: string;
    league: string;
    region: string;
  };
  market?: {
    currentPrice: number;
    targetPrice: number;
    progress: number;
    high24h: number;
    low24h: number;
    volume24h: number;
  };
  conditions?: string[];
  tags?: string[];
  createdAt?: string;
  volume24h?: number;
  change24h?: number;
  confidence?: number;
  successRate?: number;
  totalValue?: number;
  totalBettorStake?: string;
  liquidityProviders?: Array<{
    address: string;
    stake: string;
    timestamp: number;
  }>;
}

export interface CommentAuthor {
  address: string;
  username: string;
  badges: string[];
  avatar?: string;
  reputation?: number; // ✅ FIX: Add reputation field for API response
}

export interface Comment {
  id: string;
  author: CommentAuthor;
  content: string;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  confidence?: number;
  betAmount?: number;
  betSide?: 'yes' | 'no';
  likes: number;
  dislikes: number;
  replies: Comment[];
  createdAt: string;
  hasUserLiked: boolean;
  hasUserDisliked: boolean;
  isVerifiedBetter: boolean;
}

export interface User {
  address: string;
  username: string;
  reputation: number;
  totalPools: number;
  successRate: number;
  challengeScore: number;
  totalVolume: number;
  badges: string[];
  createdAt: string;
  bio?: string;
  avatar?: string;
  followerCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
}

export interface BetSide {
  side: 'yes' | 'no';
  amount: number;
}

export interface UserBetData {
  hasBet: boolean;
  betAmount: number;
  betCount: number;
  lastBetDate: string | null;
  betSides: BetSide[];
}

export interface PlatformStats {
  totalVolume: number;
  activePools: number;
  totalBets: number;
  successRate: number;
  totalCreators: number;
  avgChallengeScore: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
} 
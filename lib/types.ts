export interface User {
  address: string;
  username: string;
  avatar?: string;
  reputation: number;
  totalPools: number;
  successRate: number;
  challengeScore: number;
  totalVolume: number;
  badges: Badge[];
  createdAt: string;
  bio?: string;
}

export interface Badge {
  type: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  createdAt: string;
  likes: number;
  dislikes: number;
}

export interface Pool {
  id: string;
  title: string;
  description: string;
  category: string;
  creator: User;
  challengeScore: number;
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
  socialStats: {
    comments: number;
    likes: number;
    views: number;
  };
  comments: Comment[];
  defeated: number;
} 
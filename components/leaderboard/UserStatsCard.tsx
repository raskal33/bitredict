"use client";

import { motion } from 'framer-motion';
import { 
  ChartBarIcon,
  CurrencyDollarIcon,
  TrophyIcon,
  ArrowTrendingUpIcon,
  StarIcon,
  FireIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface UserStats {
  address: string;
  totalPoolsCreated: number;
  totalBetsPlaced: number;
  totalStakedAmount: number;
  totalWonAmount: number;
  successRate: number;
  totalVolumeGenerated: number;
  reputationScore: number;
  influenceScore: number;
  predictionStreak: number;
  isVerifiedCreator: boolean;
  lastUpdated: string;
}

interface UserRank {
  address: string;
  leaderboardType: string;
  metric: string;
  rank: number;
  score: number;
  additionalData: Record<string, unknown>;
  timestamp: string;
}

interface UserStatsCardProps {
  userStats: UserStats | null;
  userRank: UserRank | null;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

export default function UserStatsCard({ 
  userStats, 
  userRank, 
  loading = false, 
  error = null,
  className = ""
}: UserStatsCardProps) {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toFixed(2);
  };

  const formatPercentage = (num: number) => {
    return (num * 100).toFixed(1) + '%';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <TrophyIcon className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <TrophyIcon className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <TrophyIcon className="h-5 w-5 text-amber-600" />;
    return <span className="text-text-muted font-bold">#{rank}</span>;
  };

  if (loading) {
    return (
      <div className={`glass-card p-6 ${className}`}>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`glass-card p-6 ${className}`}>
        <div className="text-center py-12">
          <XCircleIcon className="h-12 w-12 text-error mx-auto mb-4" />
          <p className="text-error">{error}</p>
        </div>
      </div>
    );
  }

  if (!userStats) {
    return (
      <div className={`glass-card p-6 ${className}`}>
        <div className="text-center py-12">
          <ChartBarIcon className="h-12 w-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-muted">No user data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* User Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <ChartBarIcon className="h-5 w-5 text-primary" />
          User Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-bg-card p-4 rounded-lg border border-border-card">
            <div className="flex items-center gap-2 mb-2">
              <ChartBarIcon className="h-5 w-5 text-primary" />
              <span className="text-text-secondary">Pools Created</span>
            </div>
            <p className="text-2xl font-bold text-text-primary">{userStats.totalPoolsCreated}</p>
          </div>
          <div className="bg-bg-card p-4 rounded-lg border border-border-card">
            <div className="flex items-center gap-2 mb-2">
              <CurrencyDollarIcon className="h-5 w-5 text-primary" />
              <span className="text-text-secondary">Total Staked</span>
            </div>
            <p className="text-2xl font-bold text-text-primary">{formatNumber(userStats.totalStakedAmount)}</p>
          </div>
          <div className="bg-bg-card p-4 rounded-lg border border-border-card">
            <div className="flex items-center gap-2 mb-2">
              <TrophyIcon className="h-5 w-5 text-primary" />
              <span className="text-text-secondary">Total Won</span>
            </div>
            <p className="text-2xl font-bold text-text-primary">{formatNumber(userStats.totalWonAmount)}</p>
          </div>
          <div className="bg-bg-card p-4 rounded-lg border border-border-card">
            <div className="flex items-center gap-2 mb-2">
              <ArrowTrendingUpIcon className="h-5 w-5 text-primary" />
              <span className="text-text-secondary">Success Rate</span>
            </div>
            <p className="text-2xl font-bold text-text-primary">{formatPercentage(userStats.successRate)}</p>
          </div>
          <div className="bg-bg-card p-4 rounded-lg border border-border-card">
            <div className="flex items-center gap-2 mb-2">
              <StarIcon className="h-5 w-5 text-primary" />
              <span className="text-text-secondary">Reputation</span>
            </div>
            <p className="text-2xl font-bold text-text-primary">{userStats.reputationScore}</p>
          </div>
          <div className="bg-bg-card p-4 rounded-lg border border-border-card">
            <div className="flex items-center gap-2 mb-2">
              <FireIcon className="h-5 w-5 text-primary" />
              <span className="text-text-secondary">Prediction Streak</span>
            </div>
            <p className="text-2xl font-bold text-text-primary">{userStats.predictionStreak}</p>
          </div>
        </div>
      </motion.div>

      {/* User Rank */}
      {userRank && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <TrophyIcon className="h-5 w-5 text-primary" />
            Current Rank
          </h3>
          <div className="flex items-center justify-between p-4 bg-gradient-primary rounded-lg text-black">
            <div className="flex items-center gap-4">
              {getRankIcon(userRank.rank)}
              <div>
                <p className="font-bold text-lg">Rank #{userRank.rank}</p>
                <p className="text-sm opacity-80">Score: {formatNumber(userRank.score)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-80">Address</p>
              <p className="font-mono text-sm">{formatAddress(userRank.address)}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Verification Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
          {userStats.isVerifiedCreator ? (
            <CheckCircleIcon className="h-5 w-5 text-success" />
          ) : (
            <XCircleIcon className="h-5 w-5 text-text-muted" />
          )}
          Verification Status
        </h3>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${userStats.isVerifiedCreator ? 'bg-success' : 'bg-text-muted'}`}></div>
          <span className="text-text-secondary">
            {userStats.isVerifiedCreator ? 'Verified Creator' : 'Not Verified'}
          </span>
        </div>
      </motion.div>
    </div>
  );
}

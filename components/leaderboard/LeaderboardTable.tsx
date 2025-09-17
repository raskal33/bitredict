"use client";

import { motion } from 'framer-motion';
import { 
  TrophyIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { 
  TrophyIcon as TrophyIconSolid
} from '@heroicons/react/24/solid';

interface LeaderboardEntry {
  address: string;
  rank: number;
  score: number;
  poolsCreated?: number;
  totalWon?: number;
  successRate?: number;
  volumeGenerated?: number;
  reputation?: number;
  totalActions?: number;
  influenceScore?: number;
  predictionStreak?: number;
  isVerified?: boolean;
  lastUpdated?: string;
}

interface LeaderboardTableProps {
  data: LeaderboardEntry[];
  type: 'prediction' | 'reputation';
  loading?: boolean;
  error?: string | null;
  className?: string;
}

export default function LeaderboardTable({ 
  data, 
  type, 
  loading = false, 
  error = null,
  className = ""
}: LeaderboardTableProps) {
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
    if (rank === 1) return <TrophyIconSolid className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <TrophyIconSolid className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <TrophyIconSolid className="h-5 w-5 text-amber-600" />;
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

  return (
    <div className={`glass-card p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          {type === 'prediction' ? (
            <>
              <ChartBarIcon className="h-6 w-6 text-primary" />
              Prediction Market Leaderboard
            </>
          ) : (
            <>
              <StarIcon className="h-6 w-6 text-primary" />
              Reputation Leaderboard
            </>
          )}
        </h2>
        <div className="text-text-muted text-sm">
          {data.length} entries
        </div>
      </div>

      <div className="space-y-3">
        {data.map((entry, index) => (
          <motion.div
            key={entry.address}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-card-hover ${
              index < 3
                ? 'bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30'
                : 'bg-bg-card border-border-card hover:border-primary/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {getRankIcon(entry.rank)}
                </div>
                <div>
                  <p className="font-mono text-sm text-text-secondary">
                    {formatAddress(entry.address)}
                  </p>
                  {entry.isVerified && (
                    <div className="flex items-center gap-1 mt-1">
                      <CheckCircleIcon className="h-3 w-3 text-success" />
                      <span className="text-xs text-success">Verified</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-6">
                {type === 'prediction' ? (
                  <>
                    <div className="text-right">
                      <p className="text-text-muted text-sm">Score</p>
                      <p className="text-lg font-bold text-text-primary">
                        {formatNumber(entry.score)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-text-muted text-sm">Pools</p>
                      <p className="text-lg font-bold text-text-primary">
                        {entry.poolsCreated || 0}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-text-muted text-sm">Success Rate</p>
                      <p className="text-lg font-bold text-text-primary">
                        {formatPercentage(entry.successRate || 0)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-text-muted text-sm">Volume</p>
                      <p className="text-lg font-bold text-text-primary">
                        {formatNumber(entry.volumeGenerated || 0)}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-right">
                      <p className="text-text-muted text-sm">Reputation</p>
                      <p className="text-lg font-bold text-text-primary">
                        {entry.reputation || 0}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-text-muted text-sm">Actions</p>
                      <p className="text-lg font-bold text-text-primary">
                        {entry.totalActions || 0}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-text-muted text-sm">Streak</p>
                      <p className="text-lg font-bold text-text-primary">
                        {entry.predictionStreak || 0}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-text-muted text-sm">Influence</p>
                      <p className="text-lg font-bold text-text-primary">
                        {entry.influenceScore || 0}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {data.length === 0 && (
        <div className="text-center py-12">
          <TrophyIcon className="h-12 w-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-muted">No leaderboard data available</p>
        </div>
      )}
    </div>
  );
}

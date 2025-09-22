"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  TrophyIcon,
  UserIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { oddysseyService } from '@/services/oddysseyService';

interface LeaderboardEntry {
  rank: number;
  slipId: number;
  playerAddress: string;
  finalScore: number;
  correctCount: number;
  placedAt: string;
  prizePercentage: number;
}

interface OddysseyLeaderboardProps {
  cycleId?: number;
  className?: string;
}

export default function OddysseyLeaderboard({ cycleId, className = '' }: OddysseyLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaderboardInfo, setLeaderboardInfo] = useState<{
    cycleId: number | null;
    totalPlayers: number;
    qualifiedPlayers: number;
  } | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await oddysseyService.getLeaderboard(cycleId);
      
      if (response.success && response.data) {
        setLeaderboard(response.data.leaderboard || []);
        setLeaderboardInfo({
          cycleId: response.data.cycleId,
          totalPlayers: response.data.totalPlayers || 0,
          qualifiedPlayers: response.data.qualifiedPlayers || 0
        });
      } else {
        setLeaderboard([]);
        setLeaderboardInfo({
          cycleId: null,
          totalPlayers: 0,
          qualifiedPlayers: 0
        });
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [cycleId]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <span className="text-2xl">🥇</span>;
      case 2:
        return <span className="text-2xl">🥈</span>;
      case 3:
        return <span className="text-2xl">🥉</span>;
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-sm flex items-center justify-center">
            {rank}
          </div>
        );
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 2:
        return 'text-gray-300 bg-gray-300/10 border-gray-300/20';
      case 3:
        return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      default:
        return 'text-primary bg-primary/10 border-primary/20';
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatScore = (score: number) => {
    return (score / 1000).toFixed(2);
  };

  if (loading) {
    return (
      <div className={`glass-card p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-text-secondary">Loading leaderboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`glass-card p-6 ${className}`}>
        <div className="text-center py-8">
          <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <h3 className="text-lg font-semibold text-white mb-2">Error Loading Leaderboard</h3>
          <p className="text-text-muted">{error}</p>
          <button 
            onClick={fetchLeaderboard}
            className="mt-4 px-4 py-2 bg-primary text-black rounded-button hover:bg-primary/80 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Leaderboard Info */}
      {leaderboardInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <TrophyIcon className="h-6 w-6 text-yellow-400" />
              <div>
                <h3 className="text-lg font-bold text-white">
                  {leaderboardInfo.cycleId ? `Cycle #${leaderboardInfo.cycleId} Leaderboard` : 'Current Leaderboard'}
                </h3>
                <p className="text-sm text-text-muted">
                  {leaderboardInfo.qualifiedPlayers} qualified / {leaderboardInfo.totalPlayers} total players
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-text-muted">Min. 7 correct</div>
              <div className="text-lg font-bold text-yellow-400">Top 5 Win</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Leaderboard Entries */}
      <div className="space-y-3">
        {leaderboard.map((entry, index) => (
          <motion.div
            key={entry.slipId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`glass-card p-4 border ${getRankColor(entry.rank)}`}
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Rank */}
              <div className="md:col-span-1 text-center">
                {getRankIcon(entry.rank)}
              </div>

              {/* Player */}
              <div className="md:col-span-4">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-text-muted" />
                  <span className="font-mono text-sm text-white">
                    {formatAddress(entry.playerAddress)}
                  </span>
                </div>
                <div className="text-xs text-text-muted mt-1">
                  Slip #{entry.slipId}
                </div>
              </div>

              {/* Score */}
              <div className="md:col-span-2 text-center">
                <div className="text-lg font-bold text-white">
                  {formatScore(entry.finalScore)}x
                </div>
                <div className="text-xs text-text-muted">Final Score</div>
              </div>

              {/* Correct Count */}
              <div className="md:col-span-2 text-center">
                <div className="text-lg font-bold text-green-400">
                  {entry.correctCount}/10
                </div>
                <div className="text-xs text-text-muted">Correct</div>
              </div>

              {/* Prize */}
              <div className="md:col-span-2 text-center">
                <div className="flex items-center justify-center gap-1">
                  <CurrencyDollarIcon className="h-4 w-4 text-yellow-400" />
                  <span className="text-lg font-bold text-yellow-400">
                    {entry.prizePercentage}%
                  </span>
                </div>
                <div className="text-xs text-text-muted">Prize Share</div>
              </div>

              {/* Time */}
              <div className="md:col-span-1 text-center">
                <div className="flex items-center justify-center gap-1">
                  <ClockIcon className="h-3 w-3 text-text-muted" />
                  <span className="text-xs text-text-muted">
                    {new Date(entry.placedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {leaderboard.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-8 text-center"
        >
          <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-text-muted" />
          <h3 className="text-lg font-semibold text-white mb-2">No Qualified Players Yet</h3>
          <p className="text-text-muted">
            Players need at least 7 correct predictions to appear on the leaderboard.
          </p>
        </motion.div>
      )}
    </div>
  );
}

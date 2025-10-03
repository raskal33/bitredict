"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  TrophyIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { OddysseyContractService, Slip, UserData } from '@/services/oddysseyContractService';

interface UserSlipsDisplayProps {
  userAddress: string;
  className?: string;
}

export default function UserSlipsDisplay({ userAddress, className = "" }: UserSlipsDisplayProps) {
  const [slips, setSlips] = useState<Slip[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'evaluated' | 'pending'>('all');

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user data and slips in parallel
      const [userDataResult, slipsResult] = await Promise.all([
        OddysseyContractService.getUserData(userAddress),
        OddysseyContractService.getAllUserSlipsWithData(userAddress)
      ]);

      setUserData(userDataResult);
      setSlips(slipsResult.slipsData);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  }, [userAddress]);

  useEffect(() => {
    if (userAddress) {
      fetchUserData();
    }
  }, [userAddress, fetchUserData]);

  const filteredSlips = slips.filter(slip => {
    switch (filter) {
      case 'evaluated':
        return slip.isEvaluated;
      case 'pending':
        return !slip.isEvaluated;
      default:
        return true;
    }
  });


  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getBetTypeLabel = (betType: number) => {
    return betType === 0 ? 'Moneyline' : 'Over/Under';
  };

  const getSelectionLabel = (selection: string, betType: number) => {
    if (betType === 0) {
      switch (selection) {
        case '1': return 'Home Win';
        case 'X': return 'Draw';
        case '2': return 'Away Win';
        default: return selection;
      }
    } else {
      return selection;
    }
  };

  const getSelectionColor = () => {
    // Standard yellowish color for all selections
    return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
  };

  const getScoreColor = (correctCount: number) => {
    if (correctCount >= 8) return 'text-green-400';
    if (correctCount >= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreIcon = (correctCount: number) => {
    if (correctCount >= 8) return <TrophyIcon className="w-5 h-5 text-yellow-500" />;
    if (correctCount >= 6) return <StarIcon className="w-5 h-5 text-blue-500" />;
    return <XCircleIcon className="w-5 h-5 text-red-500" />;
  };

  if (loading) {
    return (
      <div className={`bg-gray-800/50 rounded-xl p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-900/20 border border-red-500/30 rounded-xl p-6 ${className}`}>
        <div className="flex items-center gap-2 text-red-400">
          <XCircleIcon className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800/50 rounded-xl p-6 ${className}`}>
      {/* Header with User Stats */}
      {userData && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Your Slips</h2>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>Total: {userData.userStats.totalSlips}</span>
              <span>•</span>
              <span>Wins: {userData.userStats.totalWins}</span>
              <span>•</span>
              <span>Win Rate: {(userData.userStats.winRate / 100).toFixed(1)}%</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-700/50 rounded-lg p-3">
              <div className="text-sm text-gray-400">Best Score</div>
              <div className="text-lg font-bold text-yellow-400">
                {userData.userStats.bestScore.toFixed(2)}x
              </div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-3">
              <div className="text-sm text-gray-400">Current Streak</div>
              <div className="text-lg font-bold text-green-400">
                {userData.userStats.currentStreak}
              </div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-3">
              <div className="text-sm text-gray-400">Reputation</div>
              <div className="text-lg font-bold text-purple-400">
                {userData.reputation}
              </div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-3">
              <div className="text-sm text-gray-400">Correct Predictions</div>
              <div className="text-lg font-bold text-blue-400">
                {userData.correctPredictions}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-4">
        {[
          { id: 'all', label: 'All Slips', count: slips.length },
          { id: 'evaluated', label: 'Evaluated', count: slips.filter(s => s.isEvaluated).length },
          { id: 'pending', label: 'Pending', count: slips.filter(s => !s.isEvaluated).length }
        ].map(({ id, label, count }) => (
          <button
            key={id}
            onClick={() => setFilter(id as 'all' | 'evaluated' | 'pending')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              filter === id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Slips List */}
      <div className="space-y-4">
        {filteredSlips.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <TrophyIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No slips found</p>
          </div>
        ) : (
          filteredSlips.map((slip) => (
            <div
              key={`${slip.cycleId}-${slip.placedAt}`}
              className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/30 hover:border-gray-500/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getScoreIcon(slip.correctCount)}
                    <span className="text-sm text-gray-400">Cycle #{slip.cycleId}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <ClockIcon className="w-4 h-4" />
                    <span>{formatTime(slip.placedAt)}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {slip.isEvaluated ? (
                    <div className="flex items-center gap-1">
                      <CheckCircleIcon className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-green-400">Evaluated</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <ClockIcon className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-yellow-400">Pending</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Slip Results */}
              {slip.isEvaluated && (
                <div className="mb-3 p-3 bg-gray-600/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="text-sm text-gray-400">Correct Predictions</div>
                        <div className={`text-lg font-bold ${getScoreColor(slip.correctCount)}`}>
                          {slip.correctCount}/10
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Final Score</div>
                        <div className="text-lg font-bold text-white">
                          {slip.finalScore.toFixed(2)}x
                        </div>
                      </div>
                    </div>
                    
                    {slip.correctCount >= 7 && (
                      <div className="flex items-center gap-1 text-yellow-400">
                        <TrophyIcon className="w-5 h-5" />
                        <span className="text-sm font-medium">Winner!</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Predictions */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-300 mb-2">Predictions:</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {slip.predictions.map((prediction, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-600/20 rounded text-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white truncate">
                          {prediction.homeTeam} vs {prediction.awayTeam}
                        </div>
                        <div className="text-xs text-gray-400">
                          {prediction.leagueName}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <div className="text-right">
                          <div className="text-xs text-gray-400">
                            {getBetTypeLabel(prediction.betType)}
                          </div>
                          <div className={`font-medium px-2 py-1 rounded border ${getSelectionColor()}`}>
                            {getSelectionLabel(prediction.selection, prediction.betType)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-400">Odds</div>
                          <div className="font-bold text-green-400">
                            {(prediction.selectedOdd / 100).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

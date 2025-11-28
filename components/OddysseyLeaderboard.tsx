"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrophyIcon,
  UserIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  XCircleIcon
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
  predictions?: SlipPrediction[]; // Include predictions with match results from backend
}

interface SlipPrediction {
  matchId: number | string;
  prediction: string;
  odds: number;
  homeTeam?: string;
  awayTeam?: string;
  leagueName?: string;
  isCorrect?: boolean;
  result?: {
    home_score?: number;
    away_score?: number;
    outcome_1x2?: string;
    outcome_ou25?: string;
  };
}

interface SlipDetails {
  slipId: number;
  predictions: SlipPrediction[];
  finalScore: number;
  correctCount: number;
}

interface OddysseyLeaderboardProps {
  cycleId?: number;
  className?: string;
}

interface Cycle {
  cycleId: number;
  startDate: string;
  endDate: string;
  slipCount: number;
  playerCount: number;
  isResolved: boolean;
}

export default function OddysseyLeaderboard({ cycleId: propCycleId, className = '' }: OddysseyLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCycleId, setSelectedCycleId] = useState<number | undefined>(propCycleId);
  const [availableCycles, setAvailableCycles] = useState<Cycle[]>([]);
  const [loadingCycles, setLoadingCycles] = useState(false);
  const [leaderboardInfo, setLeaderboardInfo] = useState<{
    cycleId: number | null;
    totalPlayers: number;
    qualifiedPlayers: number;
  } | null>(null);
  const [expandedSlips, setExpandedSlips] = useState<Set<number>>(new Set());
  const [slipDetails, setSlipDetails] = useState<Map<number, SlipDetails>>(new Map());
  const [loadingSlips, setLoadingSlips] = useState<Set<number>>(new Set());

  // Fetch available cycles
  const fetchAvailableCycles = useCallback(async () => {
    try {
      setLoadingCycles(true);
      const response = await fetch('/api/oddyssey/cycles');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setAvailableCycles(data.data);
        }
      }
    } catch (err) {
      console.error('Error fetching cycles:', err);
    } finally {
      setLoadingCycles(false);
    }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use selectedCycleId or propCycleId, or default to previous cycle
      let targetCycleId = selectedCycleId || propCycleId;
      if (!targetCycleId) {
        try {
          const currentCycle = await oddysseyService.getCurrentCycle();
          const currentCycleNum = Number(currentCycle);
          // Use previous cycle (currentCycle - 1), but ensure it's at least 1
          targetCycleId = Math.max(1, currentCycleNum - 1);
          setSelectedCycleId(targetCycleId);
          console.log(`[OddysseyLeaderboard] No cycleId provided, using previous cycle: ${targetCycleId} (current: ${currentCycleNum})`);
        } catch (err) {
          console.warn('[OddysseyLeaderboard] Failed to get current cycle, using undefined:', err);
        }
      }
      
      const response = await oddysseyService.getLeaderboard(targetCycleId);
      
      if (response.success && response.data) {
        const leaderboardData = response.data.leaderboard || [];
        
        console.log(`[OddysseyLeaderboard] Received ${leaderboardData.length} entries, checking for predictions...`);
        
        // Store predictions from leaderboard response directly (no need to fetch separately)
        const leaderboardWithPredictions = leaderboardData.map((entry: LeaderboardEntry) => {
          // If predictions are already included from backend, use them
          if (entry.predictions && entry.predictions.length > 0) {
            console.log(`[OddysseyLeaderboard] Entry ${entry.slipId} has ${entry.predictions.length} predictions from backend`);
            setSlipDetails(prev => {
              const newMap = new Map(prev);
              newMap.set(entry.slipId, {
                slipId: entry.slipId,
                predictions: entry.predictions!,
                finalScore: entry.finalScore,
                correctCount: entry.correctCount
              });
              return newMap;
            });
          } else {
            console.log(`[OddysseyLeaderboard] Entry ${entry.slipId} has NO predictions in response`);
          }
          return entry;
        });
        
        setLeaderboard(leaderboardWithPredictions);
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
  }, [selectedCycleId, propCycleId]);

  useEffect(() => {
    fetchAvailableCycles();
  }, [fetchAvailableCycles]);

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

  const fetchSlipDetails = useCallback(async (slipId: number) => {
    // If already loaded, don't fetch again
    if (slipDetails.has(slipId)) {
      return;
    }

    // Check if predictions are already in the leaderboard entry
    const leaderboardEntry = leaderboard.find(e => e.slipId === slipId);
    if (leaderboardEntry && leaderboardEntry.predictions && leaderboardEntry.predictions.length > 0) {
      setSlipDetails(prev => {
        const newMap = new Map(prev);
        newMap.set(slipId, {
          slipId: slipId,
          predictions: leaderboardEntry.predictions!,
          finalScore: leaderboardEntry.finalScore,
          correctCount: leaderboardEntry.correctCount
        });
        return newMap;
      });
      return;
    }

    // Fallback: fetch from API if not in leaderboard response
    setLoadingSlips(prev => new Set(prev).add(slipId));
    try {
      const response = await fetch(`/api/oddyssey/evaluated-slip/${slipId}?t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const slip = data.data;
          setSlipDetails(prev => {
            const newMap = new Map(prev);
            newMap.set(slipId, {
              slipId: slip.slipId || slipId,
              predictions: slip.predictions || [],
              finalScore: slip.finalScore || 0,
              correctCount: slip.correctCount || 0
            });
            return newMap;
          });
        }
      }
    } catch (err) {
      console.error(`Error fetching slip ${slipId} details:`, err);
    } finally {
      setLoadingSlips(prev => {
        const newSet = new Set(prev);
        newSet.delete(slipId);
        return newSet;
      });
    }
  }, [slipDetails, leaderboard]);

  const toggleSlipExpansion = useCallback((slipId: number) => {
    setExpandedSlips(prev => {
      const newSet = new Set(prev);
      if (newSet.has(slipId)) {
        newSet.delete(slipId);
      } else {
        newSet.add(slipId);
        // Fetch details when expanding
        fetchSlipDetails(slipId);
      }
      return newSet;
    });
  }, [fetchSlipDetails]);

  const formatPrediction = (prediction: string) => {
    // Format prediction for display
    if (prediction === '1') return 'Home Win';
    if (prediction === 'X') return 'Draw';
    if (prediction === '2') return 'Away Win';
    if (prediction.toLowerCase() === 'over') return 'Over 2.5';
    if (prediction.toLowerCase() === 'under') return 'Under 2.5';
    return prediction;
  };

  const formatOdds = (odds: number) => {
    // Odds might be in different formats, normalize to decimal
    if (odds > 100) {
      return (odds / 1000).toFixed(2);
    }
    return odds.toFixed(2);
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
      {/* Leaderboard Info with Cycle Picker */}
      {leaderboardInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
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
            <div className="flex items-center gap-4">
              {/* Cycle Picker */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-text-muted whitespace-nowrap">Cycle:</label>
                <select
                  value={selectedCycleId || ''}
                  onChange={(e) => {
                    const newCycleId = e.target.value ? parseInt(e.target.value) : undefined;
                    setSelectedCycleId(newCycleId);
                    // Clear expanded slips when changing cycle
                    setExpandedSlips(new Set());
                    setSlipDetails(new Map());
                  }}
                  className="px-3 py-1.5 bg-bg-dark border border-primary/30 rounded-lg text-white text-sm focus:outline-none focus:border-primary min-w-[200px]"
                  disabled={loadingCycles}
                >
                  {loadingCycles ? (
                    <option>Loading cycles...</option>
                  ) : (
                    <>
                      <option value="">Auto (Previous Cycle)</option>
                      {availableCycles.map((cycle) => (
                        <option key={cycle.cycleId} value={cycle.cycleId}>
                          Cycle #{cycle.cycleId} ({new Date(cycle.startDate).toLocaleDateString()}) - {cycle.playerCount} players
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>
              <div className="text-right">
                <div className="text-sm text-text-muted">Min. 7 correct</div>
                <div className="text-lg font-bold text-yellow-400">Top 5 Win</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Leaderboard Entries */}
      <div className="space-y-3">
        {leaderboard.map((entry, index) => {
          const isExpanded = expandedSlips.has(entry.slipId);
          const details = slipDetails.get(entry.slipId);
          const isLoading = loadingSlips.has(entry.slipId);

          return (
            <motion.div
              key={entry.slipId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`glass-card border ${getRankColor(entry.rank)} overflow-hidden`}
            >
              {/* Main Entry Row - Clickable */}
              <div
                onClick={() => toggleSlipExpansion(entry.slipId)}
                className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
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
                    <div className="text-xs text-text-muted mt-1 flex items-center gap-1">
                      Slip #{entry.slipId}
                      {isExpanded ? (
                        <ChevronUpIcon className="h-3 w-3 ml-1" />
                      ) : (
                        <ChevronDownIcon className="h-3 w-3 ml-1" />
                      )}
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
              </div>

              {/* Expanded Predictions Dropdown */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-2 border-t border-white/10 bg-bg-dark/30">
                      {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                          <span className="ml-3 text-text-secondary">Loading predictions...</span>
                        </div>
                      ) : details && details.predictions.length > 0 ? (
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                            <ChartBarIcon className="h-4 w-4" />
                            All 10 Predictions
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {details.predictions.map((pred, predIndex) => {
                              const isCorrect = pred.isCorrect === true;
                              const isIncorrect = pred.isCorrect === false;
                              
                              return (
                                <motion.div
                                  key={predIndex}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: predIndex * 0.05 }}
                                  className={`p-3 rounded-lg border ${
                                    isCorrect
                                      ? 'bg-green-500/10 border-green-500/30'
                                      : isIncorrect
                                      ? 'bg-red-500/10 border-red-500/30'
                                      : 'bg-white/5 border-white/10'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        {isCorrect && (
                                          <CheckCircleIcon className="h-4 w-4 text-green-400 flex-shrink-0" />
                                        )}
                                        {isIncorrect && (
                                          <XCircleIcon className="h-4 w-4 text-red-400 flex-shrink-0" />
                                        )}
                                        <span className="text-xs font-semibold text-white">
                                          Match #{predIndex + 1}
                                        </span>
                                      </div>
                                      {pred.homeTeam && pred.awayTeam && (
                                        <div className="text-xs text-text-muted mb-1">
                                          {pred.homeTeam} vs {pred.awayTeam}
                                        </div>
                                      )}
                                      {pred.leagueName && (
                                        <div className="text-xs text-text-muted mb-2">
                                          {pred.leagueName}
                                        </div>
                                      )}
                                      <div className="flex items-center gap-2">
                                        <span className={`text-sm font-semibold ${
                                          isCorrect ? 'text-green-400' : isIncorrect ? 'text-red-400' : 'text-white'
                                        }`}>
                                          {formatPrediction(pred.prediction)}
                                        </span>
                                        <span className="text-xs text-text-muted">
                                          @ {formatOdds(pred.odds)}x
                                        </span>
                                      </div>
                                      {pred.result && (
                                        <div className="text-xs text-text-muted mt-1">
                                          Result: {pred.result.home_score !== undefined && pred.result.away_score !== undefined
                                            ? `${pred.result.home_score}-${pred.result.away_score}`
                                            : pred.result.outcome_1x2 || pred.result.outcome_ou25 || 'N/A'}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-text-muted text-sm">
                          No prediction details available
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
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

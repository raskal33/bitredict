"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  TrophyIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  StarIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { OddysseyContractService, Slip, UserData } from '@/services/oddysseyContractService';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface UserSlipsDisplayProps {
  userAddress: string;
  className?: string;
}

interface EnhancedPrediction {
  homeTeam: string;
  awayTeam: string;
  leagueName: string;
  betType: number;
  selection: string;
  selectedOdd: number;
  isCorrect?: boolean;
  matchId?: number;
}

interface EnhancedSlip {
  player: string;
  cycleId: number;
  placedAt: number;
  predictions: EnhancedPrediction[];
  finalScore: number;
  correctCount: number;
  isEvaluated: boolean;
  wonOdds?: number;
  slip_id?: number;
}

export default function UserSlipsDisplay({ userAddress, className = "" }: UserSlipsDisplayProps) {
  const [slips, setSlips] = useState<EnhancedSlip[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'evaluated' | 'pending'>('all');
  const [wsConnected, setWsConnected] = useState(false);

  // Calculate won odds: (correct predictions / total) × combined odds
  const calculateWonOdds = useCallback((predictions: EnhancedPrediction[], correctCount: number) => {
    if (predictions.length === 0) return 0;
    const combinedOdds = predictions.reduce((acc, pred) => {
      const odds = (pred.selectedOdd / 1000) || 1;
      return acc * odds;
    }, 1);
    return (correctCount / predictions.length) * combinedOdds;
  }, []);

  // Enrich slips with evaluation data from backend
  const enrichSlipsWithEvaluation = useCallback(async (baseSlips: Slip[]): Promise<EnhancedSlip[]> => {
    try {
      const enrichedSlips = await Promise.all(
        baseSlips.map(async (slip, slipIndex) => {
          const enrichedSlip: EnhancedSlip = {
            ...slip,
            slip_id: slipIndex,
            predictions: slip.predictions as EnhancedPrediction[],
            wonOdds: calculateWonOdds(slip.predictions as EnhancedPrediction[], slip.correctCount)
          };

          // If evaluated, fetch detailed evaluation data
          if (slip.isEvaluated) {
            try {
              const response = await fetch(`/api/oddyssey/evaluated-slip/${slip.cycleId}?t=${Date.now()}`, {
                headers: { 'Cache-Control': 'no-cache' }
              });

              if (response.ok) {
                const data = await response.json();
                console.log(`📊 Evaluation data for slip ${slip.cycleId}:`, data);

                // Map evaluation results to predictions
                if (data.data?.predictions) {
                  enrichedSlip.predictions = slip.predictions.map((pred: EnhancedPrediction, index: number) => {
                    const evalPred = data.data.predictions[index];
                    return {
                      ...pred,
                      isCorrect: evalPred?.isCorrect
                    };
                  });
                }

                // Recalculate won odds based on evaluation
                enrichedSlip.wonOdds = calculateWonOdds(enrichedSlip.predictions, slip.correctCount);
              }
            } catch (error) {
              console.warn(`⚠️ Could not fetch evaluation for slip ${slip.cycleId}:`, error);
            }
          }

          return enrichedSlip;
        })
      );

      return enrichedSlips;
    } catch (error) {
      console.error('Error enriching slips:', error);
      return baseSlips.map((slip, index) => ({
        ...slip,
        slip_id: index,
        predictions: slip.predictions as EnhancedPrediction[],
        wonOdds: calculateWonOdds(slip.predictions as EnhancedPrediction[], slip.correctCount)
      }));
    }
  }, [calculateWonOdds]);

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
      
      // Enrich slips with won odds and evaluation data
      const enrichedSlips = await enrichSlipsWithEvaluation(slipsResult.slipsData);
      setSlips(enrichedSlips);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  }, [userAddress, enrichSlipsWithEvaluation]);

  useEffect(() => {
    if (userAddress) {
      fetchUserData();
    }
  }, [userAddress, fetchUserData]);

  // Setup WebSocket for real-time updates
  useEffect(() => {
    if (!userAddress) return;

    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connectWebSocket = () => {
      try {
        ws = new WebSocket('wss://bitredict-backend.fly.dev/ws');

        ws.onopen = () => {
          console.log('✅ WebSocket connected for slip updates');
          setWsConnected(true);

          // Subscribe to user's slip updates
          ws?.send(JSON.stringify({
            type: 'subscribe',
            channel: `slips:user:${userAddress}`
          }));
        };

        ws.onmessage = async (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('📡 WebSocket message:', message);

            if (message.type === 'update') {
              const { data } = message;

              if (data.type === 'slip:evaluated') {
                console.log('🎯 Slip evaluated:', data);
                
                // Update the specific slip with evaluation data
                setSlips(prevSlips =>
                  prevSlips.map(slip => {
                    if (slip.cycleId === data.cycleId) {
                      const wonOdds = calculateWonOdds(slip.predictions, data.correctPredictions);
                      toast.success(`🎉 Slip evaluated! ${data.correctPredictions}/10 correct`, {
                        duration: 5000,
                        icon: data.correctPredictions >= 7 ? '🏆' : '📊'
                      });
                      return {
                        ...slip,
                        isEvaluated: true,
                        correctCount: data.correctPredictions,
                        wonOdds,
                        finalScore: wonOdds
                      };
                    }
                    return slip;
                  })
                );

                // Refetch to get detailed evaluation data
                setTimeout(() => fetchUserData(), 2000);
              } else if (data.type === 'slip:placed') {
                console.log('✅ New slip placed:', data);
                toast.success('Slip placed successfully!', { duration: 3000 });
                fetchUserData();
              }
            }
          } catch (error) {
            console.error('Error processing WebSocket message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setWsConnected(false);
        };

        ws.onclose = () => {
          console.log('❌ WebSocket disconnected');
          setWsConnected(false);
          // Attempt to reconnect after 5 seconds
          reconnectTimeout = setTimeout(connectWebSocket, 5000);
        };
      } catch (error) {
        console.error('Error connecting to WebSocket:', error);
        setWsConnected(false);
        reconnectTimeout = setTimeout(connectWebSocket, 5000);
      }
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [userAddress, fetchUserData, calculateWonOdds]);

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

  const getPredictionResultIcon = (isCorrect?: boolean) => {
    if (isCorrect === true) {
      return <CheckIcon className="w-5 h-5 text-green-400" />;
    } else if (isCorrect === false) {
      return <XMarkIcon className="w-5 h-5 text-red-400" />;
    }
    return null;
  };

  const getPredictionBorderColor = (isCorrect?: boolean) => {
    if (isCorrect === true) return 'border-green-500/50 bg-green-500/5';
    if (isCorrect === false) return 'border-red-500/50 bg-red-500/5';
    return 'border-gray-600/30';
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
      {/* WebSocket Status Indicator */}
      <div className="mb-4 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`}></div>
        <span className="text-xs text-gray-400">
          {wsConnected ? '🔄 Real-time updates enabled' : '📴 Offline mode'}
        </span>
      </div>

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
          
          {/* Mobile-first responsive stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="bg-gray-700/50 rounded-lg p-3">
              <div className="text-xs sm:text-sm text-gray-400">Best Score</div>
              <div className="text-base sm:text-lg font-bold text-yellow-400">
                {userData.userStats.bestScore.toFixed(2)}x
              </div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-3">
              <div className="text-xs sm:text-sm text-gray-400">Current Streak</div>
              <div className="text-base sm:text-lg font-bold text-green-400">
                {userData.userStats.currentStreak}
              </div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-3">
              <div className="text-xs sm:text-sm text-gray-400">Reputation</div>
              <div className="text-base sm:text-lg font-bold text-purple-400">
                {userData.reputation}
              </div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-3">
              <div className="text-xs sm:text-sm text-gray-400">Correct Predictions</div>
              <div className="text-base sm:text-lg font-bold text-blue-400">
                {userData.correctPredictions}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile-responsive filter buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { id: 'all', label: 'All Slips', count: slips.length },
          { id: 'evaluated', label: 'Evaluated', count: slips.filter(s => s.isEvaluated).length },
          { id: 'pending', label: 'Pending', count: slips.filter(s => !s.isEvaluated).length }
        ].map(({ id, label, count }) => (
          <button
            key={id}
            onClick={() => setFilter(id as 'all' | 'evaluated' | 'pending')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
              filter === id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.split(' ')[0]}</span>
            <span className="ml-1">({count})</span>
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
          filteredSlips.map((slip, slipIndex) => (
            <motion.div
              key={`${slip.cycleId}-${slip.placedAt}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: slipIndex * 0.05 }}
              className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/30 hover:border-gray-500/50 transition-colors"
            >
              {/* Mobile-responsive header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getScoreIcon(slip.correctCount)}
                    <span className="text-sm text-gray-400">Cycle #{slip.cycleId}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <ClockIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">{formatTime(slip.placedAt)}</span>
                    <span className="sm:hidden">{new Date(slip.placedAt * 1000).toLocaleDateString()}</span>
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
                      <ClockIcon className="w-4 h-4 text-yellow-400 animate-spin" />
                      <span className="text-sm text-yellow-400">Pending</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile-responsive slip results */}
              {slip.isEvaluated && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-3 p-3 bg-gray-600/30 rounded-lg border border-green-500/20"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="text-xs sm:text-sm text-gray-400">Correct Predictions</div>
                        <div className={`text-base sm:text-lg font-bold ${getScoreColor(slip.correctCount)}`}>
                          {slip.correctCount}/10
                        </div>
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm text-gray-400">Won Odds</div>
                        <div className={`text-base sm:text-lg font-bold ${
                          slip.correctCount >= 7 ? 'text-green-400' : 'text-yellow-400'
                        }`}>
                          {(slip.wonOdds || slip.finalScore).toFixed(2)}x
                        </div>
                      </div>
                    </div>
                    
                    {slip.correctCount >= 7 && (
                      <motion.div 
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                        className="flex items-center gap-1 text-yellow-400"
                      >
                        <TrophyIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="text-sm font-medium">Winner!</span>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Mobile-responsive predictions with evaluation icons */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-300 mb-2">Predictions ({slip.predictions.filter(p => p.isCorrect !== undefined).length}/{slip.predictions.length}):</div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                  {slip.predictions.map((prediction, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-3 bg-gray-600/20 rounded-lg text-sm border transition-colors ${getPredictionBorderColor(prediction.isCorrect)}`}
                    >
                      {/* Mobile-first match info with correctness indicator */}
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-medium text-white text-sm leading-tight">
                            {prediction.homeTeam} vs {prediction.awayTeam}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {prediction.leagueName}
                          </div>
                        </div>
                        
                        {/* Correctness Icon */}
                        {slip.isEvaluated && getPredictionResultIcon(prediction.isCorrect) && (
                          <div className="flex-shrink-0">
                            {getPredictionResultIcon(prediction.isCorrect)}
                          </div>
                        )}
                      </div>
                      
                      {/* Mobile-responsive prediction details */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-gray-400">
                            {getBetTypeLabel(prediction.betType)}
                          </div>
                          <div className={`font-medium px-2 py-1 rounded border text-xs ${
                            prediction.isCorrect === true ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                            prediction.isCorrect === false ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                            'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                          }`}>
                            {getSelectionLabel(prediction.selection, prediction.betType)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-gray-400">Odds</div>
                          <div className="font-bold text-green-400 text-sm">
                            {(prediction.selectedOdd / 1000).toFixed(2)}x
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

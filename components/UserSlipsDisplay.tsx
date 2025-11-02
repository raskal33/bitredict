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
import { OddysseyContractService, UserData } from '@/services/oddysseyContractService';
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
  actualResult?: string; // Add actual result from API
  startingAt?: string; // Add match start time
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
  cycleResolved?: boolean; // Added for filtering
  leaderboardRank?: number; // ✅ Add leaderboard rank
  prizeAmount?: number; // ✅ Add prize amount
  prizeClaimed?: boolean; // ✅ Add claim status
}

export default function UserSlipsDisplay({ userAddress, className = "" }: UserSlipsDisplayProps) {
  const [slips, setSlips] = useState<EnhancedSlip[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'evaluated' | 'pending'>('all');
  const [wsConnected, setWsConnected] = useState(false);

  // Calculate won odds: Only multiply odds of CORRECT predictions
  const calculateWonOdds = useCallback((predictions: EnhancedPrediction[]) => {
    if (predictions.length === 0) {
      console.log('⚠️ No predictions to calculate odds from');
      return 0;
    }
    
    // Only multiply odds of CORRECT predictions
    const correctPredictions = predictions.filter(pred => pred.isCorrect === true);
    console.log(`📊 Calculating won odds: ${correctPredictions.length}/${predictions.length} correct predictions`);
    
    if (correctPredictions.length === 0) {
      console.log('⚠️ No correct predictions found');
      return 0;
    }
    
    const wonOdds = correctPredictions.reduce((acc, pred) => {
      const odds = (pred.selectedOdd / 1000) || 1;
      console.log(`  - Prediction odds: ${odds.toFixed(3)}x, Running total: ${(acc * odds).toFixed(3)}x`);
      return acc * odds;
    }, 1);
    
    console.log(`✅ Final won odds: ${wonOdds.toFixed(3)}x`);
    return wonOdds;
  }, []);


  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user slips from REST API
      const response = await fetch(`/api/oddyssey/user-slips/${userAddress}?limit=50&offset=0&t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user slips: ${response.status}`);
      }

      const slipsData = await response.json();
      
      if (slipsData.success && slipsData.data) {
        console.log('📥 Raw API Response:', JSON.stringify(slipsData.data[0], null, 2));
        
        // Map REST API data to our interface
        const mappedSlips: EnhancedSlip[] = slipsData.data.map((slip: { player_address: string; cycle_id: string; created_at: string; predictions: Array<{ home_team: string; away_team: string; league_name: string; bet_type: number; selection: string; selected_odd: number; is_correct?: boolean; match_id?: number; actualResult?: string; starting_at?: string }>; final_score: string; correctCount?: number; correct_count?: number; is_evaluated: boolean; slip_id: string; cycle_resolved: boolean; leaderboard_rank?: number; prize_amount?: number; prize_claimed?: boolean }) => {
          console.log(`🔍 Slip #${slip.slip_id}: cycle_resolved=${slip.cycle_resolved}, is_evaluated=${slip.is_evaluated}, cycleId=${slip.cycle_id}`);
          return {
          player: slip.player_address,
          cycleId: parseInt(slip.cycle_id),
          placedAt: new Date(slip.created_at).getTime(),
          predictions: slip.predictions.map((pred: { home_team?: string; away_team?: string; league_name?: string; bet_type?: number; selection?: string; selected_odd?: number; is_correct?: boolean; isCorrect?: boolean; match_id?: number; matchId?: number; actualResult?: string; starting_at?: string; homeTeam?: string; awayTeam?: string; leagueName?: string; betType?: number; selectedOdd?: number }) => ({
            homeTeam: pred.home_team || pred.homeTeam || 'Unknown',
            awayTeam: pred.away_team || pred.awayTeam || 'Unknown',
            leagueName: pred.league_name || pred.leagueName || 'Unknown League',
            betType: pred.bet_type || pred.betType || 0,
            selection: pred.selection || '',
            selectedOdd: pred.selected_odd || pred.selectedOdd || 0,
            // ✅ FIX: Check both snake_case and camelCase for isCorrect
            isCorrect: pred.is_correct !== undefined ? pred.is_correct : (pred.isCorrect !== undefined ? pred.isCorrect : undefined),
            matchId: pred.match_id || pred.matchId,
            actualResult: pred.actualResult,
            startingAt: pred.starting_at
          })),
          // ✅ FIX: finalScore is stored as integer (multiplied by 1000), divide by 1000 for display
          finalScore: typeof slip.final_score === 'number' ? slip.final_score : (typeof slip.final_score === 'string' ? parseInt(slip.final_score) : 0),
          correctCount: slip.correctCount || slip.correct_count, // ✅ Use API value (correctCount) with fallback
          isEvaluated: slip.is_evaluated,
          wonOdds: calculateWonOdds(slip.predictions.map((pred: { home_team?: string; away_team?: string; league_name?: string; bet_type?: number; selection?: string; selected_odd?: number; is_correct?: boolean; isCorrect?: boolean; match_id?: number; matchId?: number; actualResult?: string; starting_at?: string; homeTeam?: string; awayTeam?: string; leagueName?: string; betType?: number; selectedOdd?: number }) => ({
            homeTeam: pred.home_team || pred.homeTeam || 'Unknown',
            awayTeam: pred.away_team || pred.awayTeam || 'Unknown',
            leagueName: pred.league_name || pred.leagueName || 'Unknown League',
            betType: pred.bet_type || pred.betType || 0,
            selection: pred.selection || '',
            selectedOdd: pred.selected_odd || pred.selectedOdd || 0,
            // ✅ FIX: Check both snake_case and camelCase for isCorrect
            isCorrect: pred.is_correct !== undefined ? pred.is_correct : (pred.isCorrect !== undefined ? pred.isCorrect : undefined),
            matchId: pred.match_id || pred.matchId,
            actualResult: pred.actualResult,
            startingAt: pred.starting_at
          }))),
          slip_id: parseInt(slip.slip_id),
          cycleResolved: slip.cycle_resolved, // Use backend field directly
          leaderboardRank: slip.leaderboard_rank, // ✅ Add from API
          prizeAmount: slip.prize_amount, // ✅ Add from API
          prizeClaimed: slip.prize_claimed // ✅ Add from API
          };
        });
        
        console.log('✅ Mapped Slips:', mappedSlips.map(s => ({
          slip_id: s.slip_id,
          cycleId: s.cycleId,
          cycleResolved: s.cycleResolved,
          isEvaluated: s.isEvaluated,
          correctCount: s.correctCount
        })));

        setSlips(mappedSlips);
        
        // Set mock user data for now
        setUserData({
          userStats: {
            totalSlips: mappedSlips.length,
            totalWins: mappedSlips.filter(s => s.isEvaluated && s.correctCount > 0).length,
            // ✅ FIX: Divide by 1000 to convert from integer format to decimal
            bestScore: Math.max(...mappedSlips.map(s => s.finalScore / 1000), 0),
            averageScore: mappedSlips.length > 0 ? mappedSlips.reduce((acc, s) => acc + (s.finalScore / 1000), 0) / mappedSlips.length : 0,
            winRate: mappedSlips.length > 0 ? (mappedSlips.filter(s => s.isEvaluated && s.correctCount > 0).length / mappedSlips.filter(s => s.isEvaluated).length) * 100 : 0,
            currentStreak: 0,
            bestStreak: 0,
            lastActiveCycle: Math.max(...mappedSlips.map(s => s.cycleId), 0)
          },
          reputation: 0,
          correctPredictions: mappedSlips.reduce((acc, s) => acc + s.correctCount, 0)
        });
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  }, [userAddress, calculateWonOdds]);

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
                      const wonOdds = calculateWonOdds(slip.predictions);
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

  // Poll live evaluation for slips in active cycles
  useEffect(() => {
    if (!userAddress) return;
    
    const pollLiveEvaluation = async () => {
      try {
        const activeSlips = slips.filter(slip => !slip.cycleResolved);
        
        if (activeSlips.length === 0) return;
        
        for (const slip of activeSlips) {
          try {
            const response = await fetch(
              `/api/live-slip-evaluation/${slip.slip_id}?t=${Date.now()}`,
              {
                headers: { 'Cache-Control': 'no-cache' }
              }
            );
            
            if (response.ok) {
              const data = await response.json();
              console.log(`📊 Live eval for slip ${slip.slip_id}:`, data.data);
              
              if (data.data?.liveStatus && data.data?.predictions) {
                // Update the specific slip with live evaluation data
                setSlips(prevSlips =>
                  prevSlips.map(s => {
                    if (s.slip_id === slip.slip_id) {
                      const updatedPredictions = s.predictions.map((pred: EnhancedPrediction, idx: number) => ({
                        ...pred,
                        isCorrect: data.data.predictions[idx]?.isCorrect,
                        actualResult: data.data.predictions[idx]?.actualResult
                      }));
                      
                      // Recalculate won odds with updated isCorrect values
                      const wonOdds = calculateWonOdds(updatedPredictions);
                      
                      return {
                        ...s,
                        correctCount: data.data.liveStatus.correct,
                        predictions: updatedPredictions,
                        wonOdds: wonOdds
                      };
                    }
                    return s;
                  })
                );
              }
            }
          } catch (error) {
            console.warn(`⚠️ Error fetching live evaluation for slip ${slip.slip_id}:`, error);
          }
        }
      } catch (error) {
        console.error('Error in live evaluation poll:', error);
      }
    };
    
    // Initial poll
    pollLiveEvaluation();
    
    // Set up interval for continuous polling
    const pollInterval = setInterval(pollLiveEvaluation, 15000); // Poll every 15 seconds
    
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [slips, userAddress, calculateWonOdds]);

  // ✅ Real-time On-Chain Evaluation Status Polling
  useEffect(() => {
    if (!userAddress) return;
    
    const pollEvaluationStatus = async () => {
      try {
        const unevaluatedSlips = slips.filter(slip => !slip.isEvaluated);
        
        if (unevaluatedSlips.length === 0) return;
        
        for (const slip of unevaluatedSlips) {
          try {
            // Check if slip has been evaluated on-chain
            const slipData = await OddysseyContractService.getSlip(slip.slip_id!);
            
            if (slipData && slipData.isEvaluated) {
              // Update slip status
              setSlips(prevSlips =>
                prevSlips.map(s => {
                  if (s.slip_id === slip.slip_id) {
                    return {
                      ...s,
                      isEvaluated: true,
                      correctCount: slipData.correctCount,
                      finalScore: slipData.finalScore
                    };
                  }
                  return s;
                })
              );
              
              toast.success(`Slip #${slip.slip_id} has been evaluated!`, { duration: 3000 });
            }
          } catch (error) {
            console.warn(`Error checking evaluation status for slip ${slip.slip_id}:`, error);
          }
        }
      } catch (error) {
        console.error('Error in evaluation status poll:', error);
      }
    };
    
    const interval = setInterval(pollEvaluationStatus, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [userAddress, slips]);

  // ✅ Enhanced Status Indicators - FIXED: Check cycleResolved first
  const getEvaluationStatus = (slip: EnhancedSlip) => {
    console.log(`🎯 getEvaluationStatus - Slip #${slip.slip_id}: cycleResolved=${slip.cycleResolved}, isEvaluated=${slip.isEvaluated}, correctCount=${slip.correctCount}`);
    console.log(`🎯 Raw slip data:`, slip);
    
    // CRITICAL: If cycle is NOT resolved, slip MUST be pending
    if (!slip.cycleResolved) {
      console.log(`   → Status: PENDING (cycle not resolved)`);
      return {
        icon: <ClockIcon className="w-4 h-4 text-yellow-400 animate-spin" />,
        text: "Pending",
        color: "text-yellow-400",
        bgColor: "bg-yellow-500/20",
        borderColor: "border-yellow-500/30"
      };
    }

    // Only check isEvaluated if cycle IS resolved
    if (slip.cycleResolved && slip.isEvaluated) {
      if (slip.correctCount >= 7) {
        return {
          icon: <TrophyIcon className="w-4 h-4 text-yellow-400" />,
          text: "Winner",
          color: "text-yellow-400",
          bgColor: "bg-yellow-500/20",
          borderColor: "border-yellow-500/30"
        };
      } else {
        return {
          icon: <CheckCircleIcon className="w-4 h-4 text-green-400" />,
          text: "Evaluated",
          color: "text-green-400",
          bgColor: "bg-green-500/20",
          borderColor: "border-green-500/30"
        };
      }
    } else {
      return {
        icon: <ClockIcon className="w-4 h-4 text-yellow-400 animate-spin" />,
        text: "Pending",
        color: "text-yellow-400",
        bgColor: "bg-yellow-500/20",
        borderColor: "border-yellow-500/30"
      };
    }
  };

  // ✅ Prize Button States
  const getPrizeButtonState = (slip: EnhancedSlip) => {
    if (!slip.isEvaluated) {
      return { disabled: true, text: "Not Evaluated", variant: "gray" };
    }
    
    if (slip.correctCount < 7) {
      return { disabled: true, text: "Not Qualified", variant: "gray" };
    }
    
    if (slip.prizeClaimed) {
      return { disabled: true, text: "Claimed", variant: "green" };
    }
    
    if (slip.leaderboardRank === undefined) {
      return { disabled: true, text: "Awaiting Rank", variant: "yellow" };
    }
    
    return { disabled: false, text: "Claim Prize", variant: "primary" };
  };

  // ✅ Prize Claiming Function
  const handleClaimPrize = async (cycleId: number, slipId: number) => {
    try {
      setLoading(true);
      
      // Call contract method to claim prize
      const result = await OddysseyContractService.claimPrize(cycleId, slipId);
      
      if (result.success) {
        toast.success(`Prize claimed successfully! ${result.prizeAmount} BITR`, { duration: 5000 });
        
        // Update slip status
        setSlips(prevSlips =>
          prevSlips.map(slip => {
            if (slip.cycleId === cycleId && slip.slip_id === slipId) {
              return { ...slip, prizeClaimed: true };
            }
            return slip;
          })
        );
      } else {
        toast.error(`Failed to claim prize: ${result.error}`, { duration: 5000 });
      }
    } catch (error) {
      console.error('Error claiming prize:', error);
      toast.error('Failed to claim prize', { duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const filteredSlips = slips.filter(slip => {
    switch (filter) {
      case 'evaluated':
        // Only show as evaluated if cycle is resolved AND slip is evaluated
        return slip.cycleResolved && slip.isEvaluated;
      case 'pending':
        // Show if cycle is active OR slip not evaluated yet
        return !slip.cycleResolved || !slip.isEvaluated;
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
      switch (selection.toLowerCase()) {
        case '1':
        case 'home': return '1';
        case 'x':
        case 'draw': return 'X';
        case '2':
        case 'away': return '2';
        default: return selection;
      }
    } else {
      return selection.charAt(0).toUpperCase() + selection.slice(1).toLowerCase();
    }
  };

  const getSelectionColor = (selection: string, betType: number, isCorrect?: boolean) => {
    let baseColor = '';
    const correctColor = 'bg-green-500/20 text-green-400 border-green-500/30';
    const incorrectColor = 'bg-red-500/20 text-red-400 border-red-500/30';
    
    if (betType === 0) { // 1X2
      switch (selection.toLowerCase()) {
        case '1':
        case 'home':
          baseColor = 'bg-primary/20 text-primary border-primary/30';
          break;
        case 'x':
        case 'draw':
          baseColor = 'bg-secondary/20 text-secondary border-secondary/30';
          break;
        case '2':
        case 'away':
          baseColor = 'bg-accent/20 text-accent border-accent/30';
          break;
        default:
          baseColor = 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      }
    } else if (betType === 1) { // Over/Under
      switch (selection.toLowerCase()) {
        case 'over':
          baseColor = 'bg-blue-500/20 text-blue-400 border-blue-500/30';
          break;
        case 'under':
          baseColor = 'bg-purple-500/20 text-purple-400 border-purple-500/30';
          break;
        default:
          baseColor = 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      }
    } else {
      baseColor = 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }

    // Return appropriate color based on correctness
    if (isCorrect === true) return correctColor;
    if (isCorrect === false) return incorrectColor;
    return baseColor;
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
          
          {/* Mobile-optimized responsive stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4">
            <div className="bg-gray-700/50 rounded-lg p-2 sm:p-3">
              <div className="text-xs text-gray-400 mb-1">Best Score</div>
              <div className="text-sm sm:text-base font-bold text-yellow-400">
                {userData.userStats.bestScore.toFixed(2)}x
              </div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-2 sm:p-3">
              <div className="text-xs text-gray-400 mb-1">Current Streak</div>
              <div className="text-sm sm:text-base font-bold text-green-400">
                {userData.userStats.currentStreak}
              </div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-2 sm:p-3">
              <div className="text-xs text-gray-400 mb-1">Reputation</div>
              <div className="text-sm sm:text-base font-bold text-purple-400">
                {userData.reputation}
              </div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-2 sm:p-3">
              <div className="text-xs text-gray-400 mb-1">Correct Predictions</div>
              <div className="text-sm sm:text-base font-bold text-blue-400">
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
                  {/* ✅ Enhanced Status Indicator with Blockchain Status */}
                  <div className={`flex items-center gap-2 px-2 py-1 rounded-lg border ${getEvaluationStatus(slip).bgColor} ${getEvaluationStatus(slip).borderColor}`}>
                    <div className="flex items-center gap-1">
                      {getEvaluationStatus(slip).icon}
                      <span className={`text-sm ${getEvaluationStatus(slip).color}`}>
                        {getEvaluationStatus(slip).text}
                      </span>
                    </div>
                    {/* Blockchain Status Indicator */}
                    <div 
                      className={`w-2 h-2 rounded-full ${
                        slip.isEvaluated 
                          ? 'bg-green-400' 
                          : 'bg-yellow-400 animate-pulse'
                      }`}
                      title={slip.isEvaluated ? "On-chain verified" : "Awaiting on-chain evaluation"}
                    />
                  </div>
                </div>
              </div>

              {/* ✅ Leaderboard Ranking Display */}
              {slip.isEvaluated && slip.leaderboardRank !== undefined && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-3 p-3 bg-gray-600/30 rounded-lg border border-blue-500/20"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="text-xs sm:text-sm text-gray-400">Leaderboard Rank</div>
                        <div className="text-base sm:text-lg font-bold text-blue-400">
                          #{slip.leaderboardRank}
                        </div>
                      </div>
                      {slip.prizeAmount && (
                        <div>
                          <div className="text-xs sm:text-sm text-gray-400">Prize Amount</div>
                          <div className="text-base sm:text-lg font-bold text-yellow-400">
                            {slip.prizeAmount.toFixed(4)} BITR
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Prize Claiming Button */}
                    {slip.prizeAmount && !slip.prizeClaimed && (
                      <button
                        onClick={() => handleClaimPrize(slip.cycleId, slip.slip_id!)}
                        disabled={getPrizeButtonState(slip).disabled}
                        className={`px-4 py-3 sm:px-6 sm:py-2 font-medium rounded-lg transition-colors touch-manipulation ${
                          getPrizeButtonState(slip).variant === 'primary' 
                            ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                            : getPrizeButtonState(slip).variant === 'green'
                            ? 'bg-green-500 text-white cursor-not-allowed'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {getPrizeButtonState(slip).text}
                      </button>
                    )}
                    
                    {/* Prize Claimed Indicator */}
                    {slip.prizeClaimed && (
                      <div className="flex items-center gap-1 text-green-400">
                        <CheckCircleIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">Prize Claimed</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

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
                          {/* ✅ FIX: Divide by 1000 to convert from integer format to decimal */}
                          {(slip.wonOdds && slip.wonOdds > 0) ? (slip.wonOdds / 1000).toFixed(3) : '0.00'}x
                        </div>
                        <div className="text-xs text-gray-500">
                          {slip.correctCount} correct × odds
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

              {/* Enhanced predictions display with three columns */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-300 mb-2">Predictions ({slip.predictions.filter(p => p.isCorrect !== undefined).length}/{slip.predictions.length}):</div>
                <div className="grid grid-cols-1 gap-2">
                  {slip.predictions.map((prediction, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-3 bg-gray-600/20 rounded-lg text-sm border transition-colors ${getPredictionBorderColor(prediction.isCorrect)}`}
                    >
                      {/* Match Header */}
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-medium text-white text-sm leading-tight">
                            {prediction.homeTeam || 'Unknown'} vs {prediction.awayTeam || 'Unknown'}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {prediction.leagueName || 'Unknown League'}
                          </div>
                          {prediction.startingAt && (
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(prediction.startingAt).toLocaleString()}
                            </div>
                          )}
                        </div>
                        
                        {/* Evaluation Status */}
                        <div className="flex-shrink-0">
                          {prediction.isCorrect !== undefined ? (
                            <div className={`flex items-center gap-1 px-2 py-1 rounded border text-xs ${
                              prediction.isCorrect === true 
                                ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                                : 'bg-red-500/20 text-red-400 border-red-500/30'
                            }`}>
                              {prediction.isCorrect ? (
                                <CheckIcon className="w-3 h-3" />
                              ) : (
                                <XMarkIcon className="w-3 h-3" />
                              )}
                              <span>{prediction.isCorrect ? 'Correct' : 'Wrong'}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 px-2 py-1 rounded border text-xs bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                              <ClockIcon className="w-3 h-3" />
                              <span>Pending</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Mobile-responsive Prediction Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {/* User Prediction Column */}
                        <div className="space-y-2">
                          <div className="text-xs text-gray-400 font-medium">Your Prediction</div>
                          <div className="space-y-2">
                            <div className="text-xs text-gray-500">
                              {getBetTypeLabel(prediction.betType)}
                            </div>
                            <div className={`font-medium px-2 py-1 rounded border text-xs ${getSelectionColor(prediction.selection || '', prediction.betType)}`}>
                              {getSelectionLabel(prediction.selection || '', prediction.betType)}
                            </div>
                            <div className="text-xs text-gray-400">
                              Odds: <span className="font-bold text-green-400">{(prediction.selectedOdd / 1000).toFixed(2)}x</span>
                            </div>
                          </div>
                        </div>

                        {/* Current Result Column */}
                        <div className="space-y-2">
                          <div className="text-xs text-gray-400 font-medium">Match Result</div>
                          {prediction.actualResult ? (
                            <div className="space-y-2">
                              <div className="font-medium px-2 py-1 rounded border text-xs bg-purple-500/20 text-purple-400 border-purple-500/30">
                                {prediction.actualResult || 'Unknown'}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <ClockIcon className="w-3 h-3" />
                              <span>Not finished</span>
                            </div>
                          )}
                        </div>

                        {/* Evaluation Column */}
                        <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                          <div className="text-xs text-gray-400 font-medium">Evaluation</div>
                          <div className="flex items-center gap-2">
                            {prediction.isCorrect === true && (
                              <>
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 border border-green-500/30">
                                  <CheckIcon className="w-4 h-4 text-green-400" />
                                </div>
                                <span className="text-xs font-medium text-green-400">Correct</span>
                              </>
                            )}
                            {prediction.isCorrect === false && (
                              <>
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500/20 border border-red-500/30">
                                  <XMarkIcon className="w-4 h-4 text-red-400" />
                                </div>
                                <span className="text-xs font-medium text-red-400">Wrong</span>
                              </>
                            )}
                            {prediction.isCorrect === undefined && (
                              <>
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500/20 border border-yellow-500/30">
                                  <ClockIcon className="w-4 h-4 text-yellow-400" />
                                </div>
                                <span className="text-xs font-medium text-yellow-400">Pending</span>
                              </>
                            )}
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

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { 
  FireIcon, 
  TrophyIcon, 
  ChartBarIcon, 
  ClockIcon,
  CheckCircleIcon,
  UserGroupIcon,
  CalendarIcon,
  TableCellsIcon,
  GiftIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from "@heroicons/react/24/outline";

import { useOddyssey } from "@/hooks/useOddyssey";
import { useTransactionFeedback } from "@/components/TransactionFeedback";
import { oddysseyService } from "@/services/oddysseyService";
import Button from "@/components/button";

// Types
interface Match {
  id: number;
  fixture_id: number;
  home_team: string;
  away_team: string;
  match_date: string;
  league_name: string;
  home_odds: number | null;
  draw_odds: number | null;
  away_odds: number | null;
  over_odds?: number | null;
  under_odds?: number | null;
  market_type: string;
  display_order: number;
}

interface UserPrediction {
  matchId: number;
  betType: 'MONEYLINE' | 'OVER_UNDER';
  selection: string;
  selectedOdd: number;
}

interface Slip {
  slip_id: string;
  cycle_id: string;
  player_address: string;
  created_at: string;
  predictions: Array<{
    matchId: number;
    match_id: number;
    prediction: string;
    pick: string;
    selectedOdd: number;
    home_team: string;
    away_team: string;
    team1: string;
    team2: string;
    league_name: string;
    match_time: string;
    time: string;
    odds: number;
    odd: number;
    id: number;
    isCorrect?: boolean | null;
    actualResult?: string | null;
  }>;
  final_score: string;
  correct_count: number;
  is_evaluated: boolean;
  leaderboard_rank?: number;
  prize_claimed: boolean;
  tx_hash?: string;
  status: string;
  total_odds: number;
}

export default function OddysseyPage() {
  const { address, isConnected } = useAccount();
  
  // Use the main Oddyssey hook for contract interactions
  const {
    // Contract data
    entryFee,
    dailyCycleId,
    prizePool,
    isBettingOpen,
    timeRemaining,
    prizeDistribution,
    
    // Backend data
    leaderboard,
    backendStats,
    
    // Actions
    placeSlip,
    claimPrize,
    
    // Transaction state
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    
    // Helpers
    getSelectionName,
    calculatePotentialScore,
    refetchAll
  } = useOddyssey();

  // Transaction feedback
  const { showSuccess, showError, showPending, showConfirming } = useTransactionFeedback();

  // Local state
  const [activeTab, setActiveTab] = useState<"today" | "slips" | "stats" | "results">("today");
  const [selectedDate, setSelectedDate] = useState<"yesterday" | "today">("today");
  const [matches, setMatches] = useState<Match[]>([]);
  const [userSlips, setUserSlips] = useState<Slip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [picks, setPicks] = useState<UserPrediction[]>([]);
  const [collapsedSlips, setCollapsedSlips] = useState<Set<number>>(new Set());

  // Fetch matches data
  const fetchMatches = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await oddysseyService.getMatches();
      
      if (result.data) {
        const selectedData = selectedDate === "today" ? result.data.today : result.data.yesterday;
        setMatches(selectedData?.matches || []);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast.error('Failed to fetch matches');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  // Fetch user slips
  const fetchUserSlips = useCallback(async () => {
    if (!address) return;
    
    try {
      const result = await oddysseyService.getUserSlipsWithEvaluation(address);
      if (result.success && result.data) {
        setUserSlips(result.data);
      }
    } catch (error) {
      console.error('Error fetching user slips:', error);
    }
  }, [address]);

  // Initialize data
  useEffect(() => {
    fetchMatches();
    fetchUserSlips();
  }, [fetchMatches, fetchUserSlips]);

  // Update matches when date changes
  useEffect(() => {
    fetchMatches();
  }, [selectedDate, fetchMatches]);

  // Transaction state monitoring
  useEffect(() => {
    if (isPending) {
      showPending("Wallet Confirmation Required", "Please open your wallet and confirm the transaction to place your slip");
    }
  }, [isPending, showPending]);

  useEffect(() => {
    if (isConfirming) {
      showConfirming("Processing Transaction", "Your slip is being processed on the blockchain. This may take a few moments...", hash || undefined);
    }
  }, [isConfirming, showConfirming, hash]);

  useEffect(() => {
    if (isConfirmed && hash) {
      showSuccess(
        "Slip Placed Successfully!", 
        "Your predictions have been submitted to the blockchain and are now active in the competition",
        hash
      );
      setPicks([]);
      refetchAll();
      fetchUserSlips();
    }
  }, [isConfirmed, hash, showSuccess, refetchAll, fetchUserSlips]);

  // Handle prediction selection
  const handlePredictionSelect = (matchId: number, prediction: string, odds: number) => {
    const betType = ['1', 'X', '2'].includes(prediction) ? 'MONEYLINE' : 'OVER_UNDER';
    
    setPicks(prev => {
      const existingIndex = prev.findIndex(p => p.matchId === matchId);
      const newPick: UserPrediction = {
        matchId,
        betType,
        selection: prediction,
        selectedOdd: Math.round(odds * 1000) // Contract uses 1000 scaling factor
      };

      if (existingIndex >= 0) {
        // Update existing pick
        const updated = [...prev];
        updated[existingIndex] = newPick;
        return updated;
      } else {
        // Add new pick
        return [...prev, newPick];
      }
    });
  };

  // Handle slip submission
  const handleSubmitSlip = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (picks.length !== 10) {
      toast.error('Please select exactly 10 predictions');
      return;
    }

    if (!isBettingOpen) {
      toast.error('Betting is closed for this cycle');
      return;
    }

    try {
      // Convert picks to the format expected by the contract
      const contractPredictions = picks.map(pick => ({
        matchId: pick.matchId,
        betType: pick.betType,
        selection: pick.selection,
        selectedOdd: pick.selectedOdd
      }));

      await placeSlip(contractPredictions);
    } catch (error) {
      console.error('Error placing slip:', error);
      showError("Transaction Failed", error instanceof Error ? error.message : "Failed to place slip. Please try again.");
    }
  };

  // Handle prize claiming
  const handleClaimPrize = async (cycleId: number, slipId: number) => {
    try {
      showPending('Claiming prize...', 'info');
      await claimPrize(cycleId);
      showSuccess(`Prize claim initiated for Slip #${slipId}!`, 'success');
      fetchUserSlips();
    } catch (error) {
      console.error('Prize claim error:', error);
      showError('Failed to claim prize. Please try again.', 'error');
    }
  };

  // Toggle slip collapse
  const toggleSlipCollapse = (slipIndex: number) => {
    setCollapsedSlips(prev => {
      const newSet = new Set(prev);
      if (newSet.has(slipIndex)) {
        newSet.delete(slipIndex);
      } else {
        newSet.add(slipIndex);
      }
      return newSet;
    });
  };

  // Format time remaining
  const formatTimeRemaining = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get slip status info
  const getSlipStatusInfo = (slip: Slip) => {
    if (!slip.is_evaluated) {
      return { 
        text: 'Pending Evaluation', 
        color: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20', 
        icon: ClockIcon 
      };
    }
    
    if (slip.leaderboard_rank && slip.leaderboard_rank <= 5) {
      if (slip.prize_claimed) {
        return { 
          text: 'Prize Claimed', 
          color: 'bg-green-500/10 text-green-400 border border-green-500/20', 
          icon: CheckCircleIcon 
        };
      } else {
        return { 
          text: `🏆 Winner! Rank #${slip.leaderboard_rank}`, 
          color: 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 text-yellow-400 border border-yellow-500/30 animate-pulse-glow', 
          icon: TrophyIcon 
        };
      }
    }
    
    return { 
      text: 'Evaluated', 
      color: 'bg-blue-500/10 text-blue-400 border border-blue-500/20', 
      icon: CheckCircleIcon 
    };
  };

  // Calculate prize amount
  const calculatePrizeAmount = (rank: number) => {
    if (rank < 1 || rank > 5) return '0';
    const percentages = [40, 30, 20, 5, 5]; // 1st, 2nd, 3rd, 4th, 5th
    const percentage = percentages[rank - 1];
    const prizePoolAmount = parseFloat(prizePool) || 0;
    return ((prizePoolAmount * percentage) / 100).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <FireIcon className="h-10 w-10 text-orange-500" />
            Oddyssey
          </h1>
          <p className="text-xl text-gray-300">
            Daily Prediction Competition - Win Big with Perfect Predictions
          </p>
        </div>

        {/* Current Cycle Info */}
        <div className="glass-card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-2">Cycle #{dailyCycleId}</div>
              <div className="text-sm text-gray-400">Current Cycle</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400 mb-2">{prizePool} STT</div>
              <div className="text-sm text-gray-400">Prize Pool</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400 mb-2">
                {isBettingOpen ? formatTimeRemaining(timeRemaining) : 'Closed'}
              </div>
              <div className="text-sm text-gray-400">
                {isBettingOpen ? 'Time Remaining' : 'Betting Status'}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { id: 'today', label: 'Today\'s Matches', icon: CalendarIcon },
            { id: 'slips', label: 'My Slips', icon: TableCellsIcon },
            { id: 'stats', label: 'Statistics', icon: ChartBarIcon },
            { id: 'results', label: 'Results', icon: TrophyIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "today" | "slips" | "stats" | "results")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'today' && (
            <motion.div
              key="today"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Date Selector */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setSelectedDate('yesterday')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    selectedDate === 'yesterday'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Yesterday
                </button>
                <button
                  onClick={() => setSelectedDate('today')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    selectedDate === 'today'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Today
                </button>
              </div>

              {/* Matches */}
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading matches...</p>
                </div>
              ) : matches.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">No matches available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {matches.map((match, index) => (
                    <div key={match.id} className="glass-card p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {match.home_team} vs {match.away_team}
                          </h3>
                          <p className="text-sm text-gray-400">{match.league_name}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(match.match_date).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400">Match #{index + 1}</div>
                        </div>
                      </div>

                      {/* Prediction Options */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Moneyline */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-300 mb-2">1X2</h4>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { label: '1', odds: match.home_odds, selection: '1' },
                              { label: 'X', odds: match.draw_odds, selection: 'X' },
                              { label: '2', odds: match.away_odds, selection: '2' }
                            ].map((option) => {
                              const isSelected = picks.some(p => p.matchId === match.id && p.selection === option.selection);
                              return (
                                <button
                                  key={option.selection}
                                  onClick={() => handlePredictionSelect(match.id, option.selection, option.odds || 0)}
                                  disabled={!isBettingOpen}
                                  className={`p-2 rounded-lg text-sm font-medium transition-all ${
                                    isSelected
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
                                  }`}
                                >
                                  <div>{option.label}</div>
                                  <div className="text-xs">{option.odds?.toFixed(2) || 'N/A'}</div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Over/Under */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-300 mb-2">O/U 2.5</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { label: 'Over', odds: match.over_odds, selection: 'Over' },
                              { label: 'Under', odds: match.under_odds, selection: 'Under' }
                            ].map((option) => {
                              const isSelected = picks.some(p => p.matchId === match.id && p.selection === option.selection);
                              return (
                                <button
                                  key={option.selection}
                                  onClick={() => handlePredictionSelect(match.id, option.selection, option.odds || 0)}
                                  disabled={!isBettingOpen}
                                  className={`p-2 rounded-lg text-sm font-medium transition-all ${
                                    isSelected
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
                                  }`}
                                >
                                  <div>{option.label}</div>
                                  <div className="text-xs">{option.odds?.toFixed(2) || 'N/A'}</div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Submit Slip */}
                  <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          Your Slip ({picks.length}/10)
                        </h3>
                        <p className="text-sm text-gray-400">
                          {picks.length === 10 ? 'Ready to submit!' : `Select ${10 - picks.length} more predictions`}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-400">
                          {picks.length > 0 ? calculatePotentialScore(picks).toFixed(0) : '0'}x
                        </div>
                        <div className="text-sm text-gray-400">Potential Score</div>
                      </div>
                    </div>

                    {picks.length > 0 && (
                      <div className="mb-4">
                        <div className="text-sm text-gray-300 mb-2">Selected Predictions:</div>
                        <div className="flex flex-wrap gap-2">
                          {picks.map((pick, index) => (
                            <div
                              key={index}
                              className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm"
                            >
                              Match {pick.matchId}: {getSelectionName(pick.selection, pick.betType)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleSubmitSlip}
                      disabled={picks.length !== 10 || !isBettingOpen || !isConnected}
                      className="w-full"
                    >
                      {!isConnected
                        ? 'Connect Wallet'
                        : picks.length !== 10
                        ? `Select ${10 - picks.length} More Predictions`
                        : !isBettingOpen
                        ? 'Betting Closed'
                        : isPending
                        ? 'Submitting...'
                        : `Submit Slip (${entryFee} STT)`
                      }
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'slips' && (
            <motion.div
              key="slips"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {!isConnected ? (
                <div className="text-center py-12">
                  <UserGroupIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">Please connect your wallet to view your slips</p>
                </div>
              ) : userSlips.length === 0 ? (
                <div className="text-center py-12">
                  <TableCellsIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">No slips found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userSlips.map((slip, index) => {
                    const statusInfo = getSlipStatusInfo(slip);
                    const isCollapsed = collapsedSlips.has(index);
                    
                    return (
                      <div key={slip.slip_id} className="glass-card p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div>
                              <h3 className="text-lg font-semibold text-white">
                                Slip #{slip.slip_id}
                              </h3>
                              <p className="text-sm text-gray-400">
                                Cycle #{slip.cycle_id} • {new Date(slip.created_at).toLocaleString()}
                              </p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 ${statusInfo.color}`}>
                              <statusInfo.icon className="h-4 w-4" />
                              {statusInfo.text}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-lg font-bold text-white">
                                {slip.correct_count}/10
                              </div>
                              <div className="text-sm text-gray-400">Correct</div>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-400">
                                {parseFloat(slip.final_score).toFixed(0)}x
                              </div>
                              <div className="text-sm text-gray-400">Score</div>
                            </div>
                            
                            {slip.leaderboard_rank && slip.leaderboard_rank <= 5 && !slip.prize_claimed && (
                              <Button
                                onClick={() => handleClaimPrize(parseInt(slip.cycle_id), parseInt(slip.slip_id))}
                                className="bg-yellow-600 hover:bg-yellow-700"
                              >
                                <GiftIcon className="h-4 w-4 mr-2" />
                                Claim Prize
                              </Button>
                            )}
                            
                            <button
                              onClick={() => toggleSlipCollapse(index)}
                              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                            >
                              {isCollapsed ? (
                                <ChevronDownIcon className="h-5 w-5 text-gray-300" />
                              ) : (
                                <ChevronUpIcon className="h-5 w-5 text-gray-300" />
                              )}
                            </button>
                          </div>
                        </div>

                        {!isCollapsed && (
                          <div className="space-y-3">
                            {slip.predictions.map((prediction, predIndex) => (
                              <div key={predIndex} className="bg-gray-800 p-4 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium text-white">
                                      {prediction.home_team} vs {prediction.away_team}
                                    </div>
                                    <div className="text-sm text-gray-400">
                                      {prediction.league_name} • {new Date(prediction.match_time).toLocaleString()}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-4">
                                    <div className="text-center">
                                      <div className="font-medium text-white">
                                        {prediction.prediction}
                                      </div>
                                      <div className="text-sm text-gray-400">
                                        {prediction.selectedOdd / 1000}x
                                      </div>
                                    </div>
                                    
                                    {prediction.isCorrect !== null && (
                                      <div className={`px-3 py-1 rounded-full text-sm ${
                                        prediction.isCorrect
                                          ? 'bg-green-500/20 text-green-400'
                                          : 'bg-red-500/20 text-red-400'
                                      }`}>
                                        {prediction.isCorrect ? '✓' : '✗'}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Global Stats */}
                <div className="glass-card p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <UserGroupIcon className="h-6 w-6" />
                    Global Statistics
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Players</span>
                      <span className="text-white font-semibold">
                        {backendStats?.totalPlayers?.toLocaleString() || 'N/A'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Slips</span>
                      <span className="text-white font-semibold">
                        {backendStats?.totalSlips?.toLocaleString() || 'N/A'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-400">Average Score</span>
                      <span className="text-white font-semibold">
                        {backendStats?.avgCorrect?.toFixed(1) || 'N/A'}x
                      </span>
                    </div>
                  </div>
                </div>

                {/* Current Cycle Stats */}
                <div className="glass-card p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <TrophyIcon className="h-6 w-6" />
                    Current Cycle
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Cycle ID</span>
                      <span className="text-white font-semibold">#{dailyCycleId}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-400">Prize Pool</span>
                      <span className="text-green-400 font-semibold">{prizePool} STT</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status</span>
                      <span className={`font-semibold ${
                        isBettingOpen ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {isBettingOpen ? 'Open' : 'Closed'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Prize Distribution */}
                <div className="glass-card p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <GiftIcon className="h-6 w-6" />
                    Prize Distribution
                  </h3>
                  
                  <div className="space-y-3">
                    {prizeDistribution.map((prize, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-gray-400">Rank #{prize.rank}</span>
                        <span className="text-white font-semibold">
                          {prize.percentage}% ({calculatePrizeAmount(prize.rank)} STT)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="glass-card p-6">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <TrophyIcon className="h-6 w-6" />
                  Current Leaderboard
                </h3>
                
                {leaderboard.length === 0 ? (
                  <div className="text-center py-8">
                    <TrophyIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">No leaderboard data available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.map((entry, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg ${
                          index < 3
                            ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20'
                            : 'bg-gray-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              index === 0 ? 'bg-yellow-500 text-black' :
                              index === 1 ? 'bg-gray-400 text-black' :
                              index === 2 ? 'bg-orange-500 text-white' :
                              'bg-gray-600 text-white'
                            }`}>
                              {index + 1}
                            </div>
                            
                            <div>
                              <div className="font-medium text-white">
                                {entry.player_address.slice(0, 6)}...{entry.player_address.slice(-4)}
                              </div>
                              <div className="text-sm text-gray-400">
                                {entry.correct_count}/10 correct
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-lg font-bold text-white">
                              {parseFloat(entry.final_score.toString()).toFixed(0)}x
                            </div>
                            <div className="text-sm text-gray-400">Score</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

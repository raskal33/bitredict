"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { toast } from "react-hot-toast";
import Button from "@/components/button";
import AnimatedTitle from "@/components/AnimatedTitle";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useOddyssey, Match, UserPrediction, BetType, LeaderboardEntry } from "@/hooks/useOddyssey";

interface MatchWithLiveData extends Match {
  isLive?: boolean;
  currentScore?: { home: number; away: number };
  liveData?: { status?: string; minute?: number };
}
import { useBITRToken } from "@/hooks/useBITRToken";
import { 
  FaGamepad, 
  FaFootballBall,
  FaTrophy,
  FaMedal,
  FaCoins,
  FaUsers,
  FaChartLine,
  FaChevronDown,
  FaChevronUp
} from "react-icons/fa";
import { 
  PlayIcon as PlaySolid,
  TrophyIcon as TrophySolid
} from "@heroicons/react/24/solid";

interface MatchPrediction {
  matchId: bigint;
  betType: BetType;
  selection: string;
  selectedOdd: number;
}

export default function OddysseyPage() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState("play");
  const [predictions, setPredictions] = useState<MatchPrediction[]>([]);
  const [expandedMatch, setExpandedMatch] = useState<number | null>(null);
  
  // Smart contract hooks
  const oddyssey = useOddyssey();
  const token = useBITRToken();

  // Initialize predictions when matches are loaded
  useEffect(() => {
    if (oddyssey.dailyMatches && Array.isArray(oddyssey.dailyMatches) && oddyssey.dailyMatches.length === 10) {
      const initialPredictions = oddyssey.dailyMatches.map((match: Match) => ({
        matchId: match.id,
        betType: BetType.MONEYLINE,
        selection: '1', // Default to home win
        selectedOdd: match.oddsHome
      }));
      setPredictions(initialPredictions);
    }
  }, [oddyssey.dailyMatches]);

  // Handle prediction change
  const updatePrediction = (matchIndex: number, field: keyof MatchPrediction, value: string | number | BetType) => {
    const newPredictions = [...predictions];
    const match = Array.isArray(oddyssey.dailyMatches) ? oddyssey.dailyMatches[matchIndex] : null;
    
    if (field === 'betType') {
      newPredictions[matchIndex].betType = value as BetType;
      // Reset selection to first option for new bet type
      if (value === BetType.MONEYLINE) {
        newPredictions[matchIndex].selection = '1';
        newPredictions[matchIndex].selectedOdd = match.oddsHome;
      } else {
        newPredictions[matchIndex].selection = 'Over';
        newPredictions[matchIndex].selectedOdd = match.oddsOver;
      }
    } else if (field === 'selection') {
      newPredictions[matchIndex].selection = value as string;
      newPredictions[matchIndex].selectedOdd = oddyssey.getOddsForSelection(
        match, 
        value as string, 
        newPredictions[matchIndex].betType
      );
    }
    
    setPredictions(newPredictions);
  };

  // Handle slip placement
  const handlePlaceSlip = async () => {
    if (predictions.length !== 10) {
      toast.error("Please make predictions for all 10 matches");
      return;
    }

    try {
      const userPredictions: UserPrediction[] = predictions.map(p => ({
        matchId: p.matchId,
        betType: p.betType,
        selection: oddyssey.getSelectionHash(p.selection),
        selectedOdd: p.selectedOdd
      }));

      await oddyssey.placeSlip(userPredictions);
      toast.success("Slip placed successfully!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to place slip";
      toast.error(errorMessage);
    }
  };

  // Handle prize claim
  const handleClaimPrize = async () => {
    try {
      await oddyssey.claimPrize(oddyssey.dailyCycleId);
      toast.success("Prize claim transaction submitted!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to claim prize";
      toast.error(errorMessage);
    }
  };

  // Watch for successful transactions
  useEffect(() => {
    if (oddyssey.isConfirmed) {
      toast.success("Transaction confirmed! 🎉");
      oddyssey.refetchAll();
      token.refetchBalance();
    }
  }, [oddyssey.isConfirmed, oddyssey, token]);

  const formatTimeRemaining = (): string => {
    const remaining = oddyssey.timeRemaining;
    if (remaining <= 0) return "Betting Closed";
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getSelectionOptions = (match: Match, betType: BetType) => {
    if (betType === BetType.MONEYLINE) {
      return [
        { value: '1', label: 'Home Win', odds: match.oddsHome },
        { value: 'X', label: 'Draw', odds: match.oddsDraw },
        { value: '2', label: 'Away Win', odds: match.oddsAway }
      ];
    } else {
      return [
        { value: 'Over', label: 'Over', odds: match.oddsOver },
        { value: 'Under', label: 'Under', odds: match.oddsUnder }
      ];
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center"
        >
          <PlaySolid className="h-16 w-16 text-purple-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
          <p className="text-gray-300 mb-6">
            Connect your wallet to participate in the daily Oddyssey prediction game.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <AnimatedTitle 
        size="md"
        leftIcon={PlaySolid}
        rightIcon={TrophySolid}
      >
        Daily Oddyssey
      </AnimatedTitle>
      
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-base text-text-secondary max-w-2xl mx-auto text-center mb-6"
      >
        Daily prediction game - predict outcomes of 10 matches and compete for daily prizes!
      </motion.p>

        {/* Game Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-8"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <FaGamepad className="h-8 w-8 text-purple-400 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Cycle #{oddyssey.dailyCycleId}</p>
              <p className="text-xl font-bold text-white">{formatTimeRemaining()}</p>
            </div>
            
            <div>
              <FaCoins className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Prize Pool</p>
              <p className="text-xl font-bold text-white">{oddyssey.prizePool} STT</p>
            </div>
            
            <div>
              <FaUsers className="h-8 w-8 text-blue-400 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Players</p>
              <p className="text-xl font-bold text-white">{oddyssey.cycleStats?.slips || 0}</p>
            </div>
            
            <div>
              <FaTrophy className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Entry Fee</p>
              <p className="text-xl font-bold text-white">{oddyssey.entryFee} STT</p>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-1 bg-black/20 rounded-xl p-1">
            {["play", "leaderboard", "history"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-6 rounded-lg font-medium transition-all ${
                  activeTab === tab
                    ? "bg-purple-500 text-white"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                }`}
              >
                {tab === "play" && "Play Game"}
                {tab === "leaderboard" && "Leaderboard"}
                {tab === "history" && "History"}
              </button>
            ))}
          </div>
        </div>

        {/* Play Game Tab */}
        {activeTab === "play" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Matches */}
            <div className="lg:col-span-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Today&apos;s Matches</h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    oddyssey.isBettingOpen ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                  }`}>
                    {oddyssey.isBettingOpen ? "Betting Open" : "Betting Closed"}
                  </span>
                </div>

                {!oddyssey.dailyMatches || !Array.isArray(oddyssey.dailyMatches) || oddyssey.dailyMatches.length === 0 ? (
                  <div className="text-center py-12">
                    <FaFootballBall className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Matches Available</h3>
                    <p className="text-gray-400">Check back later for today&apos;s matches</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Array.isArray(oddyssey.dailyMatches) && oddyssey.dailyMatches.map((match: Match, index: number) => (
                      <div key={Number(match.id)} className="bg-black/20 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-white">Match #{index + 1}</h3>
                            <p className="text-gray-400 text-sm">
                              {new Date(Number(match.startTime) * 1000).toLocaleString()}
                            </p>
                            
                            {/* Live Score Display */}
                            {(match as MatchWithLiveData).isLive && (match as MatchWithLiveData).currentScore && (
                              <div className="mt-2 flex items-center gap-2">
                                <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded-full animate-pulse">
                                  LIVE
                                </span>
                                <span className="text-green-400 font-medium text-sm">
                                  {(match as MatchWithLiveData).currentScore!.home} - {(match as MatchWithLiveData).currentScore!.away}
                                </span>
                                {(match as MatchWithLiveData).liveData?.minute && (
                                  <span className="text-gray-400 text-xs">
                                    {(match as MatchWithLiveData).liveData?.minute}&apos;
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {/* Match Status */}
                            {(match as MatchWithLiveData).liveData?.status && !(match as MatchWithLiveData).isLive && (
                              <div className="mt-2">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  (match as MatchWithLiveData).liveData!.status === 'FT' 
                                    ? 'bg-gray-500/20 text-gray-400'
                                    : 'bg-orange-500/20 text-orange-400'
                                }`}>
                                  {(match as MatchWithLiveData).liveData!.status}
                                </span>
                                {(match as MatchWithLiveData).liveData!.status === 'FT' && (match as MatchWithLiveData).currentScore && (
                                  <span className="ml-2 text-gray-400 text-sm">
                                    Final: {(match as MatchWithLiveData).currentScore?.home} - {(match as MatchWithLiveData).currentScore?.away}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => setExpandedMatch(expandedMatch === index ? null : index)}
                            className="text-gray-400 hover:text-white transition-colors"
                          >
                            {expandedMatch === index ? (
                              <FaChevronUp className="h-5 w-5" />
                            ) : (
                              <FaChevronDown className="h-5 w-5" />
                            )}
                          </button>
                        </div>

                        {expandedMatch === index && predictions[index] && (
                          <div className="space-y-4">
                            {/* Bet Type Selection */}
                            <div>
                              <label className="block text-white font-medium mb-2">Bet Type</label>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => updatePrediction(index, 'betType', BetType.MONEYLINE)}
                                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                    predictions[index].betType === BetType.MONEYLINE
                                      ? "bg-purple-500 text-white"
                                      : "bg-black/30 text-gray-300 hover:text-white"
                                  }`}
                                >
                                  Moneyline
                                </button>
                                <button
                                  onClick={() => updatePrediction(index, 'betType', BetType.OVER_UNDER)}
                                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                    predictions[index].betType === BetType.OVER_UNDER
                                      ? "bg-purple-500 text-white"
                                      : "bg-black/30 text-gray-300 hover:text-white"
                                  }`}
                                >
                                  Over/Under
                                </button>
                              </div>
                            </div>

                            {/* Selection Options */}
                            <div>
                              <label className="block text-white font-medium mb-2">Your Prediction</label>
                              <div className="grid grid-cols-3 gap-2">
                                {getSelectionOptions(match, predictions[index].betType).map((option) => (
                                  <button
                                    key={option.value}
                                    onClick={() => updatePrediction(index, 'selection', option.value)}
                                    disabled={option.odds === 0}
                                    className={`p-3 rounded-lg text-center transition-all ${
                                      predictions[index].selection === option.value
                                        ? "bg-purple-500 text-white"
                                        : option.odds === 0
                                          ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                                          : "bg-black/30 text-gray-300 hover:bg-black/50 hover:text-white"
                                    }`}
                                  >
                                    <div className="font-medium">{option.label}</div>
                                    <div className="text-sm opacity-75">
                                      {option.odds > 0 ? oddyssey.formatOdds(option.odds) + 'x' : 'N/A'}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Selected Prediction Summary */}
                            <div className="bg-purple-500/20 border border-purple-500/50 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <span className="text-white font-medium">
                                  Your Prediction: {oddyssey.getSelectionName(
                                    predictions[index].selection, 
                                    predictions[index].betType
                                  )}
                                </span>
                                <span className="text-purple-400 font-bold">
                                  {oddyssey.formatOdds(predictions[index].selectedOdd)}x
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Slip Panel */}
            <div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 sticky top-6"
              >
                <h3 className="text-xl font-bold text-white mb-6">Your Slip</h3>
                
                {predictions.length === 10 ? (
                  <div className="space-y-6">
                    {/* Potential Score */}
                    <div className="bg-black/20 rounded-xl p-4">
                      <div className="text-center">
                        <p className="text-gray-400 text-sm mb-1">Potential Score</p>
                        <p className="text-2xl font-bold text-yellow-400">
                          {oddyssey.calculatePotentialScore(predictions).toLocaleString()}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          (if all predictions are correct)
                        </p>
                      </div>
                    </div>

                    {/* Entry Fee */}
                    <div className="bg-black/20 rounded-xl p-4">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Entry Fee</span>
                        <span className="text-white font-medium">{oddyssey.entryFee} STT</span>
                      </div>
                    </div>

                    {/* Place Slip Button */}
                    <Button
                      onClick={handlePlaceSlip}
                      disabled={
                        !oddyssey.isBettingOpen ||
                        oddyssey.isPending ||
                        oddyssey.isConfirming ||
                        predictions.some(p => p.selectedOdd === 0)
                      }
                      className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      {oddyssey.isPending || oddyssey.isConfirming ? (
                        <div className="flex items-center justify-center gap-2">
                          <LoadingSpinner size="sm" />
                          Processing...
                        </div>
                      ) : !oddyssey.isBettingOpen ? (
                        "Betting Closed"
                      ) : (
                        "Place Slip"
                      )}
                    </Button>

                    {/* User Slips Count */}
                    <div className="text-center">
                      <p className="text-gray-400 text-sm">
                        You have {oddyssey.userSlips.length} slip(s) this cycle
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FaGamepad className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">
                      Make predictions for all 10 matches to place your slip
                    </p>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === "leaderboard" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-8">Daily Leaderboard</h2>
              
              {!oddyssey.dailyLeaderboard || oddyssey.dailyLeaderboard.length === 0 ? (
                <div className="text-center py-12">
                  <FaTrophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">No Entries Yet</h3>
                  <p className="text-gray-400">Be the first to place a slip today!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Prize Distribution */}
                  <div className="bg-black/20 rounded-xl p-6 mb-6">
                    <h3 className="text-lg font-bold text-white mb-4">Prize Distribution</h3>
                    <div className="grid grid-cols-5 gap-4 text-center">
                      {oddyssey.prizeDistribution.map((prize, index) => (
                        <div key={index} className="bg-black/30 rounded-lg p-3">
                          <div className="text-yellow-400 font-bold">#{prize.rank}</div>
                          <div className="text-white text-sm">{prize.percentage}%</div>
                          <div className="text-gray-400 text-xs">
                            {oddyssey.calculatePrizeAmount(index)} STT
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Leaderboard Entries */}
                  {oddyssey.dailyLeaderboard.map((entry: LeaderboardEntry, index: number) => {
                    const isCurrentUser = entry.player.toLowerCase() === address?.toLowerCase();
                    
                    return (
                      <div
                        key={Number(entry.slipId)}
                        className={`p-6 rounded-xl border ${
                          isCurrentUser
                            ? "bg-purple-500/20 border-purple-500/50"
                            : "bg-black/20 border-gray-600"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                              index === 0 ? "bg-yellow-500 text-black" :
                              index === 1 ? "bg-gray-400 text-black" :
                              index === 2 ? "bg-orange-500 text-black" :
                              "bg-gray-600 text-white"
                            }`}>
                              {index < 3 ? <FaMedal className="h-6 w-6" /> : `#${index + 1}`}
                            </div>
                            <div>
                              <p className="text-white font-medium">
                                {entry.player.slice(0, 6)}...{entry.player.slice(-4)}
                                {isCurrentUser && <span className="text-purple-400 ml-2">(You)</span>}
                              </p>
                              <p className="text-gray-400 text-sm">
                                {entry.correctCount}/10 correct predictions
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-bold text-lg">
                              {Number(entry.finalScore).toLocaleString()}
                            </p>
                            <p className="text-gray-400 text-sm">points</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Current User Position */}
                  {oddyssey.userRank >= 0 && (
                    <div className="mt-6 p-4 bg-purple-500/20 border border-purple-500/50 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">
                          Your Position: #{oddyssey.userRank + 1}
                        </span>
                        <Button
                          onClick={handleClaimPrize}
                          disabled={
                            oddyssey.userRank >= 5 ||
                            !oddyssey.isCycleResolved ||
                            oddyssey.isPending ||
                            oddyssey.isConfirming
                          }
                          className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                        >
                          {oddyssey.isPending || oddyssey.isConfirming ? (
                            <div className="flex items-center gap-2">
                              <LoadingSpinner size="sm" />
                              Claiming...
                            </div>
                          ) : oddyssey.userRank >= 5 ? (
                            "Not in top 5"
                          ) : !oddyssey.isCycleResolved ? (
                            "Cycle not resolved"
                          ) : (
                            `Claim ${oddyssey.userPrizeAmount} STT`
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-8">Game History</h2>
              
              <div className="text-center py-12">
                <FaChartLine className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Coming Soon</h3>
                <p className="text-gray-400">Historical game data and statistics will be available here</p>
              </div>
            </div>
          </motion.div>
        )}
    </motion.div>
  );
}

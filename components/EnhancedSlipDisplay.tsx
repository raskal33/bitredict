"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TrophyIcon,
  CalendarIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

interface LivePrediction {
  matchId: number;
  currentScore?: string;
  actualResult?: string;
  isCorrect?: boolean;
  status?: string;
}

interface LiveEvaluation {
  cycleResolved: boolean;
  predictions: LivePrediction[];
}

interface EnhancedSlip {
  id: number;
  cycleId: number;
  placedAt: number;
  predictions: {
    matchId: number;
    betType: number;
    selection: string;
    selectedOdd: number;
    homeTeam: string;
    awayTeam: string;
    leagueName: string;
    isCorrect?: boolean; // Will be determined by evaluation
    actualResult?: string; // Added for match result display
  }[];
  finalScore: number;
  correctCount: number;
  isEvaluated: boolean;
  status: 'pending' | 'evaluated' | 'won' | 'lost';
  cycleResolved?: boolean; // Added for proper status logic
}

interface EnhancedSlipDisplayProps {
  slips: EnhancedSlip[];
}

const EnhancedSlipDisplay: React.FC<EnhancedSlipDisplayProps> = ({ slips }) => {
  const [expandedSlips, setExpandedSlips] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<'all' | 'realtime' | 'won' | 'lost'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [liveEvaluations, setLiveEvaluations] = useState<Map<number, unknown>>(new Map());

  console.log('🔍 EnhancedSlipDisplay received slips:', slips);
  console.log('🔍 Slips count:', slips?.length);
  console.log('🔍 Slips type:', typeof slips);
  console.log('🔍 Slips is array:', Array.isArray(slips));

  // Fetch live evaluation data for slips and calculate correctness
  useEffect(() => {
    const fetchLiveEvaluations = async () => {
      if (!slips || slips.length === 0) return;
      
      const evaluations = new Map();
      
      // Get unique cycle IDs from slips
      const cycleIds = [...new Set(slips.map(slip => slip.cycleId))];
      
      // Fetch match results for each cycle
      const matchResultsMap = new Map();
      for (const cycleId of cycleIds) {
        try {
          const response = await fetch(`/api/oddyssey/results/all?t=${Date.now()}`, {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data?.cycles?.length > 0) {
              // Find the specific cycle
              const targetCycle = data.data.cycles.find((cycle: { cycleId: number }) => 
                Number(cycle.cycleId) === Number(cycleId)
              );
              
              if (targetCycle && targetCycle.matches) {
                matchResultsMap.set(cycleId, targetCycle.matches);
                console.log(`✅ Found ${targetCycle.matches.length} match results for cycle ${cycleId}`);
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching match results for cycle ${cycleId}:`, error);
        }
      }
      
      // Process each slip
      for (const slip of slips) {
        try {
          // Try to get live evaluation data first
          const response = await fetch(`/api/live-slip-evaluation/${slip.id}`);
          if (response.ok) {
            const data = await response.json();
            evaluations.set(slip.id, data.data);
          } else {
            // If no live evaluation, calculate correctness using match results
            const matchResults = matchResultsMap.get(slip.cycleId);
            if (matchResults && matchResults.length > 0) {
              const calculatedPredictions = slip.predictions.map((prediction: { matchId: number; betType: number; selection: string }) => {
                const matchResult = matchResults.find((match: { matchId: number; result: { moneyline: number; overUnder: number }; status?: string }) => 
                  Number(match.matchId) === Number(prediction.matchId)
                );
                
                if (matchResult && matchResult.result) {
                  const isCorrect = calculatePredictionCorrectness(prediction, matchResult);
                  return {
                    ...prediction,
                    isCorrect,
                    status: matchResult.status || 'FINISHED'
                  };
                }
                
                return {
                  ...prediction,
                  isCorrect: undefined,
                  status: 'NOT_STARTED'
                };
              });
              
              evaluations.set(slip.id, {
                predictions: calculatedPredictions,
                calculated: true
              });
            }
          }
        } catch (error) {
          console.error(`Error processing slip ${slip.id}:`, error);
        }
      }
      
      setLiveEvaluations(evaluations);
    };

    fetchLiveEvaluations();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchLiveEvaluations, 30000);
    return () => clearInterval(interval);
  }, [slips]);

  // Helper function to calculate prediction correctness
  const calculatePredictionCorrectness = (prediction: { betType: number; selection: string }, matchResult: { result?: { outcome_1x2?: string; outcome_ou25?: string; moneyline?: number; overUnder?: number } }): boolean => {
    if (!matchResult || !matchResult.result) {
      return false; // No result available
    }

    const { betType, selection } = prediction;
    const result = matchResult.result;

    // FIXED: Handle both string outcomes (outcome_1x2, outcome_ou25) and numeric (moneyline, overUnder)
    if (betType === 0) { // MONEYLINE (1X2)
      // Check if we have outcome_1x2 (string format: "Home", "Draw", "Away")
      if (result.outcome_1x2) {
        const normalizedSelection = selection === "1" ? "home" : selection === "X" ? "draw" : selection === "2" ? "away" : selection.toLowerCase();
        const normalizedOutcome = result.outcome_1x2.toLowerCase();
        return normalizedSelection === normalizedOutcome;
      }
      
      // Fallback to numeric moneyline format
      if (typeof result.moneyline === 'number') {
        if (selection === "1" && result.moneyline === 1) return true; // Home win
        if (selection === "X" && result.moneyline === 2) return true; // Draw
        if (selection === "2" && result.moneyline === 3) return true; // Away win
        
        // Also handle text format: "home", "draw", "away"
        const normalizedSelection = selection.toLowerCase();
        if (normalizedSelection === "home" && result.moneyline === 1) return true;
        if (normalizedSelection === "draw" && result.moneyline === 2) return true;
        if (normalizedSelection === "away" && result.moneyline === 3) return true;
      }
    } else if (betType === 1) { // OVER_UNDER
      // Check if we have outcome_ou25 (string format: "Over", "Under")
      if (result.outcome_ou25) {
        const normalizedSelection = selection.toLowerCase();
        const normalizedOutcome = result.outcome_ou25.toLowerCase();
        return normalizedSelection === normalizedOutcome;
      }
      
      // Fallback to numeric overUnder format  
      if (typeof result.overUnder === 'number') {
        if (selection === "Over" && result.overUnder === 1) return true; // Over
        if (selection === "Under" && result.overUnder === 2) return true; // Under
        
        // Also handle lowercase
        const normalizedSelection = selection.toLowerCase();
        if (normalizedSelection === "over" && result.overUnder === 1) return true;
        if (normalizedSelection === "under" && result.overUnder === 2) return true;
      }
    }

    return false;
  };

  const toggleSlipExpansion = (slipId: number) => {
    const newExpanded = new Set(expandedSlips);
    if (newExpanded.has(slipId)) {
      newExpanded.delete(slipId);
    } else {
      newExpanded.add(slipId);
    }
    setExpandedSlips(newExpanded);
  };

  const getSlipStatus = React.useCallback((slip: EnhancedSlip): 'pending' | 'evaluated' | 'won' | 'lost' => {
    // Check live evaluation data first for cycleResolved
    const liveEval = liveEvaluations.get(slip.id);
    let cycleResolved = slip.cycleResolved;
    
    if (liveEval && typeof liveEval === 'object' && 'cycleResolved' in liveEval) {
      cycleResolved = (liveEval as LiveEvaluation).cycleResolved;
    }
    
    // FIXED: Only show "evaluated" when cycle is actually resolved AND slip is evaluated on blockchain
    if (cycleResolved && slip.isEvaluated) {
      if (slip.correctCount >= 7) return 'won'; // 7+ correct predictions is a win
      return 'lost';
    }
    
    // If cycle is resolved but slip is NOT evaluated on blockchain, it's pending
    if (cycleResolved && !slip.isEvaluated) {
      return 'pending';
    }
    
    // If cycle is NOT resolved (active cycle), always show as pending
    // Even if some matches are finished, the slip is not fully evaluated until cycle ends
    return 'pending';
  }, [liveEvaluations]);

  // Filter slips based on status and date
  const filteredSlips = React.useMemo(() => {
    return slips?.filter(slip => {
      // Status filter
      let statusMatch = true;
      if (filter !== 'all') {
        const status = getSlipStatus(slip);
        if (filter === 'won') {
          statusMatch = status === 'won';
        } else if (filter === 'lost') {
          statusMatch = status === 'lost';
        } else if (filter === 'realtime') {
          // Realtime shows pending slips (active cycles with live evaluation)
          statusMatch = status === 'pending';
        }
      }

      // Date filter
      let dateMatch = true;
      if (dateFilter !== 'all') {
        // Handle different date formats from backend
        let slipDate: Date;
        
        if (slip.placedAt && slip.placedAt > 0) {
          // If placedAt is a timestamp
          slipDate = new Date(slip.placedAt > 1000000000000 ? slip.placedAt : slip.placedAt * 1000);
        } else {
          // Fallback to current date if no valid timestamp
          console.warn('Invalid slip date for slip:', slip.id, 'placedAt:', slip.placedAt);
          slipDate = new Date();
        }
        
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        if (dateFilter === 'today') {
          dateMatch = slipDate >= today;
        } else if (dateFilter === 'week') {
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateMatch = slipDate >= weekAgo;
        } else if (dateFilter === 'month') {
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          dateMatch = slipDate >= monthAgo;
        }
      }

      return statusMatch && dateMatch;
    }) || [];
  }, [slips, filter, dateFilter, getSlipStatus]);

  const getSelectionDisplay = (selection: string, betType: number): string => {
    // For 1X2 bets, show 1, X, 2 with proper styling
    if (betType === 0) {
      switch (selection.toLowerCase()) {
        case '1': return '1';
        case 'x': return 'X';
        case '2': return '2';
        default: return selection;
      }
    }
    
    // For Over/Under bets
    if (betType === 1) {
      return selection.toUpperCase();
    }
    
    // For other bet types, return as is
    return selection;
  };

  const getSelectionColor = (selection: string, betType: number, isCorrect?: boolean) => {
    // Base colors for different selections matching the match table
    let baseColor = '';
    let correctColor = '';
    let incorrectColor = '';
    
    if (betType === 0) { // 1X2
      switch (selection.toLowerCase()) {
        case '1': // Home
          baseColor = 'bg-primary/20 text-primary border border-primary/30';
          correctColor = 'bg-gradient-primary text-black border border-primary/50';
          incorrectColor = 'bg-red-500/20 text-red-400 border border-red-500/30';
          break;
        case 'x': // Draw
          baseColor = 'bg-secondary/20 text-secondary border border-secondary/30';
          correctColor = 'bg-gradient-secondary text-black border border-secondary/50';
          incorrectColor = 'bg-red-500/20 text-red-400 border border-red-500/30';
          break;
        case '2': // Away
          baseColor = 'bg-accent/20 text-accent border border-accent/30';
          correctColor = 'bg-gradient-accent text-black border border-accent/50';
          incorrectColor = 'bg-red-500/20 text-red-400 border border-red-500/30';
          break;
        default:
          baseColor = 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
          correctColor = 'bg-green-500/20 text-green-400 border border-green-500/30';
          incorrectColor = 'bg-red-500/20 text-red-400 border border-red-500/30';
      }
    } else if (betType === 1) { // Over/Under
      switch (selection.toLowerCase()) {
        case 'over':
          baseColor = 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
          correctColor = 'bg-gradient-to-r from-blue-500 to-primary text-black border border-blue-500/50';
          incorrectColor = 'bg-red-500/20 text-red-400 border border-red-500/30';
          break;
        case 'under':
          baseColor = 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
          correctColor = 'bg-gradient-to-r from-purple-500 to-blue-600 text-black border border-purple-500/50';
          incorrectColor = 'bg-red-500/20 text-red-400 border border-red-500/30';
          break;
        default:
          baseColor = 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
          correctColor = 'bg-green-500/20 text-green-400 border border-green-500/30';
          incorrectColor = 'bg-red-500/20 text-red-400 border border-red-500/30';
      }
    } else {
      // Other bet types
      baseColor = 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
      correctColor = 'bg-green-500/20 text-green-400 border border-green-500/30';
      incorrectColor = 'bg-red-500/20 text-red-400 border border-red-500/30';
    }

    // Return appropriate color based on correctness
    if (isCorrect === true) return correctColor;
    if (isCorrect === false) return incorrectColor;
    return baseColor;
  };

  const getSlipStatusInfo = (slip: EnhancedSlip) => {
    // Use the corrected getSlipStatus function for consistent logic
    const status = getSlipStatus(slip);
    
    switch (status) {
      case 'won':
        return { 
          text: 'Winner', 
          color: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
          icon: TrophyIcon 
        };
      case 'lost':
        return { 
          text: 'Lost', 
          color: 'bg-red-500/10 text-red-400 border border-red-500/20',
          icon: XCircleIcon 
        };
      case 'pending':
      default:
        return { 
          text: 'Realtime', 
          color: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
          icon: ClockIcon 
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* Mobile-optimized Filter Tabs */}
      <div className="space-y-3 mb-4 md:mb-6">
        {/* Status Filter - Mobile-first design */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
            <FunnelIcon className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Status:</span>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {[
              { key: 'all', label: 'All', shortLabel: 'All', count: slips.length },
              { key: 'realtime', label: 'Realtime', shortLabel: 'Live', count: slips.filter(s => getSlipStatus(s) === 'pending').length },
              { key: 'won', label: 'Won', shortLabel: 'Won', count: slips.filter(s => getSlipStatus(s) === 'won').length },
              { key: 'lost', label: 'Lost', shortLabel: 'Lost', count: slips.filter(s => getSlipStatus(s) === 'lost').length },
            ].map(({ key, label, shortLabel, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key as 'all' | 'realtime' | 'won' | 'lost')}
                className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex-shrink-0 ${
                  filter === key
                    ? 'bg-primary text-black'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{shortLabel}</span>
                <span className="ml-1">({count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Date Filter - Mobile-optimized */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
            <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Date:</span>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {[
              { key: 'all', label: 'All Time', shortLabel: 'All' },
              { key: 'today', label: 'Today', shortLabel: 'Today' },
              { key: 'week', label: 'This Week', shortLabel: 'Week' },
              { key: 'month', label: 'This Month', shortLabel: 'Month' },
            ].map(({ key, label, shortLabel }) => (
              <button
                key={key}
                onClick={() => setDateFilter(key as 'all' | 'today' | 'week' | 'month')}
                className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex-shrink-0 ${
                  dateFilter === key
                    ? 'bg-secondary text-black'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{shortLabel}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Slips List */}
      <div className="space-y-3">
        {filteredSlips.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <TrophyIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No slips found matching your filters</p>
          </div>
        ) : (
          filteredSlips.map((slip) => {
          const status = getSlipStatus(slip);
          const isExpanded = expandedSlips.has(slip.id);
          
          return (
            <motion.div
              key={slip.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card border border-gray-600/30 overflow-hidden"
            >
              {/* Mobile-optimized Slip Header */}
              <div 
                className="p-3 sm:p-4 md:p-5 cursor-pointer hover:bg-gray-800/30 transition-all duration-200 border-b border-gray-700/30"
                onClick={() => toggleSlipExpansion(slip.id)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  {/* Left section - Slip info */}
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <TrophyIcon className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm sm:text-base font-semibold text-white truncate">
                        Slip #{slip.id}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs text-gray-400">
                        <span>Cycle {slip.cycleId}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="truncate">
                          {slip.placedAt && slip.placedAt > 0 
                            ? new Date(slip.placedAt * 1000).toLocaleDateString()
                            : 'Date pending'
                          }
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span>{slip.predictions.length} predictions</span>
                        {slip.predictions.some(p => p.isCorrect !== undefined) && !slip.isEvaluated && (
                          <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs flex-shrink-0">
                            Live
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Right section - Status and controls */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                    {/* Mobile: Stack score and status vertically */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                      <div className="text-right">
                        <div className="text-xs sm:text-sm font-semibold text-white">
                          {slip.correctCount}/{slip.predictions.length} correct
                        </div>
                        <div className="text-xs text-gray-400">
                          Score: {(slip.finalScore / 1000).toFixed(2)}x
                        </div>
                      </div>
                      
                      <div className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-bold ${getSlipStatusInfo(slip).color}`}>
                        {getSlipStatusInfo(slip).text}
                      </div>
                    </div>
                    
                    {isExpanded ? (
                      <ChevronUpIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform duration-200 flex-shrink-0" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform duration-200 flex-shrink-0" />
                    )}
                  </div>
                </div>
              </div>

              {/* Slip Details (Collapsible) */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-gray-600/30"
                  >
                    <div className="p-3 md:p-4 space-y-3">
                      {/* Predictions */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-300 mb-3">Predictions</h4>
                        {slip.predictions.map((prediction: EnhancedSlip['predictions'][0], index: number) => (
                          <div key={index} className="p-3 md:p-4 bg-gray-800/40 rounded-xl border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200">
                            {/* Match Header */}
                            <div className="mb-3 flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="font-medium text-white text-sm leading-tight">
                                  {prediction.homeTeam || 'Unknown'} vs {prediction.awayTeam || 'Unknown'}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  {prediction.leagueName || 'Unknown League'}
                                </div>
                              </div>
                            </div>
                            
                            {/* Mobile-responsive Layout: Stack on mobile, grid on larger screens */}
                            <div className={`grid gap-3 items-start ${
                              filter === 'all' 
                                ? 'grid-cols-1 sm:grid-cols-2' 
                                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                            }`}>
                              {/* Your Prediction Column */}
                              <div className="space-y-2">
                                <div className="text-xs text-gray-400 font-medium">Prediction</div>
                                <div className="space-y-2">
                                  <div className={`font-medium px-2 py-1 rounded border text-xs ${getSelectionColor(prediction.selection || '', prediction.betType)}`}>
                                    {getSelectionDisplay(prediction.selection || '', prediction.betType)}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    Odds: <span className="font-bold text-green-400">{(prediction.selectedOdd || 0).toFixed(2)}x</span>
                                  </div>
                                </div>
                              </div>

                              {/* Match Result Column */}
                              <div className="space-y-2">
                                <div className="text-xs text-gray-400 font-medium">Score</div>
                                <div className="space-y-2">
                                  {(() => {
                                    // Check live evaluation data for actual result
                                    const liveEval = liveEvaluations.get(slip.id);
                                    let actualResult = prediction.actualResult || 'Pending';
                                    
                                    if (liveEval && typeof liveEval === 'object' && 'predictions' in liveEval) {
                                      const livePreds = (liveEval as LiveEvaluation).predictions;
                                      const livePred = livePreds.find((p) => String(p.matchId) === String(prediction.matchId));
                                      
                                      // Debug: Log the prediction data structure
                                      if (livePred) {
                                        console.log(`🔍 Live prediction data for match ${prediction.matchId}:`, livePred);
                                      }
                                      
                                      if (livePred) {
                                        // Use backend fields in correct priority order
                                        // 1. currentScore for live score (e.g., "2-1")
                                        if (livePred.currentScore) {
                                          actualResult = livePred.currentScore;
                                        }
                                        // 2. actualResult for outcome (e.g., "Home", "Over")
                                        else if (livePred.actualResult) {
                                          actualResult = livePred.actualResult;
                                        }
                                        // 3. Check status for match state
                                        else if (livePred.status === 'FINISHED' || livePred.status === 'finished') {
                                          actualResult = 'Finished';
                                        }
                                        else if (livePred.status === 'LIVE' || livePred.status === 'live') {
                                          actualResult = 'Live';
                                        }
                                        else if (livePred.status === 'UPCOMING' || livePred.status === 'upcoming') {
                                          actualResult = 'Upcoming';
                                        }
                                        // 4. Fallback to Pending
                                        else {
                                          actualResult = 'Pending';
                                        }
                                      }
                                    }
                                    
                                    // Try to get actual match result based on bet type
                                    if (actualResult === 'Pending' && liveEval && typeof liveEval === 'object' && 'predictions' in liveEval) {
                                      const livePreds = (liveEval as LiveEvaluation).predictions;
                                      const livePred = livePreds.find((p) => String(p.matchId) === String(prediction.matchId));
                                      
                                      if (livePred) {
                                        // Use backend fields in correct priority order
                                        // 1. currentScore for live score (e.g., "2-1")
                                        if (livePred.currentScore) {
                                          actualResult = livePred.currentScore;
                                        }
                                        // 2. actualResult for outcome (e.g., "Home", "Over")
                                        else if (livePred.actualResult) {
                                          actualResult = livePred.actualResult;
                                        }
                                        // 3. Check status for match state
                                        else if (livePred.status === 'FINISHED' || livePred.status === 'finished') {
                                          actualResult = 'Finished';
                                        }
                                        else if (livePred.status === 'LIVE' || livePred.status === 'live') {
                                          actualResult = 'Live';
                                        }
                                        else if (livePred.status === 'UPCOMING' || livePred.status === 'upcoming') {
                                          actualResult = 'Upcoming';
                                        }
                                        // 4. Fallback to Pending
                                        else {
                                          actualResult = 'Pending';
                                        }
                                      }
                                    }
                                    
                                    return (
                                      <div className="font-medium px-2 py-1 rounded border text-xs bg-purple-500/20 text-purple-400 border-purple-500/30">
                                        {actualResult}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>

                              {/* Evaluation Column - Only show for Realtime/Won/Lost views */}
                              {filter !== 'all' && (
                                <div className="space-y-2">
                                  <div className="text-xs text-gray-400 font-medium">Evaluation</div>
                                  <div className="space-y-2">
                                    {(() => {
                                      // ✅ FIX: For evaluated slips, use isCorrect from prediction directly
                                      // Backend API returns isCorrect in enriched predictions
                                      if (slip.isEvaluated && prediction.isCorrect !== undefined && prediction.isCorrect !== null) {
                                        console.log(`✅ Using evaluated data for slip ${slip.id}, prediction isCorrect=${prediction.isCorrect}`);
                                        return (
                                          <div className={`flex items-center gap-1 px-2 py-1 rounded border text-xs ${
                                            prediction.isCorrect === true 
                                              ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                                              : 'bg-red-500/20 text-red-400 border-red-500/30'
                                          }`}>
                                            {prediction.isCorrect ? (
                                              <CheckCircleIcon className="w-3 h-3" />
                                            ) : (
                                              <XCircleIcon className="w-3 h-3" />
                                            )}
                                            <span>{prediction.isCorrect ? 'Correct' : 'Wrong'}</span>
                                          </div>
                                        );
                                      }
                                      
                                      // For pending slips, use live evaluation data
                                      const liveEval = liveEvaluations.get(slip.id);
                                      let isCorrect = prediction.isCorrect;
                                      let matchStatus = 'pending';
                                      
                                      if (liveEval && typeof liveEval === 'object' && 'predictions' in liveEval) {
                                        const livePreds = (liveEval as LiveEvaluation).predictions;
                                        const livePred = livePreds.find((p) => String(p.matchId) === String(prediction.matchId));
                                        
                                        if (livePred) {
                                          // ✅ FIX: Check if match has finished - use isCorrect from live evaluation
                                          if (livePred.status === 'FINISHED' && livePred.isCorrect !== null && livePred.isCorrect !== undefined) {
                                            isCorrect = livePred.isCorrect;
                                            matchStatus = 'finished';
                                          } else if (livePred.status === 'LIVE' || livePred.status === 'IN_PROGRESS') {
                                            matchStatus = 'live';
                                          } else {
                                            matchStatus = 'pending';
                                          }
                                        }
                                      }
                                      
                                      // ✅ FIX: Also check if prediction already has isCorrect set (from backend API)
                                      if (isCorrect === undefined && prediction.isCorrect !== undefined && prediction.isCorrect !== null) {
                                        isCorrect = prediction.isCorrect;
                                        matchStatus = 'finished';
                                      }
                                      
                                      // Show evaluation based on match status
                                      if (matchStatus === 'finished' && isCorrect !== undefined && isCorrect !== null) {
                                        console.log(`✅ Using live evaluation for slip ${slip.id}, isCorrect=${isCorrect}`);
                                        return (
                                          <div className={`flex items-center gap-1 px-2 py-1 rounded border text-xs ${
                                            isCorrect === true 
                                              ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                                              : 'bg-red-500/20 text-red-400 border-red-500/30'
                                          }`}>
                                            {isCorrect ? (
                                              <CheckCircleIcon className="w-3 h-3" />
                                            ) : (
                                              <XCircleIcon className="w-3 h-3" />
                                            )}
                                            <span>{isCorrect ? 'Correct' : 'Wrong'}</span>
                                          </div>
                                        );
                                      } else if (matchStatus === 'live') {
                                        return (
                                          <div className="flex items-center gap-1 px-2 py-1 rounded border text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
                                            <ClockIcon className="w-3 h-3 animate-pulse" />
                                            <span>Live</span>
                                          </div>
                                        );
                                      } else {
                                        // Pending or not started - don't show as wrong!
                                        return (
                                          <div className="flex items-center gap-1 px-2 py-1 rounded border text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                            <ClockIcon className="w-3 h-3" />
                                            <span>Awaiting</span>
                                          </div>
                                        );
                                      }
                                    })()}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Mobile-responsive Slip Summary */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-4 border-t border-gray-600/30">
                        <div className="text-center p-3 bg-gray-800/30 rounded-lg">
                          <div className="text-xs text-gray-400 mb-1">Total Odds</div>
                          <div className="text-sm sm:text-base font-bold text-white">
                            {slip.predictions.every(p => p.selectedOdd && p.selectedOdd > 0)
                              ? (slip.predictions.reduce((acc, p) => acc * (p.selectedOdd || 1), 1)).toFixed(2) + 'x'
                              : '—'
                            }
                          </div>
                        </div>
                        <div className="text-center p-3 bg-gray-800/30 rounded-lg">
                          <div className="text-xs text-gray-400 mb-1">Winning Probability</div>
                          <div className="text-sm sm:text-base font-bold text-cyan-400">
                            {/* TODO: Fetch from backend - using default for now */}
                            {slip.correctCount >= 7 ? '85%' : slip.correctCount >= 5 ? '45%' : '15%'}
                          </div>
                        </div>
                        <div className="text-center p-3 bg-gray-800/30 rounded-lg sm:col-span-2 lg:col-span-1">
                          <div className="text-xs text-gray-400 mb-1">Status</div>
                          <div className={`text-sm sm:text-base font-bold ${
                            status === 'won' ? 'text-green-400' : 
                            status === 'lost' ? 'text-red-400' : 
                            'text-yellow-400'
                          }`}>
                            {status.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })
        )}
      </div>
    </div>
  );
};

export default EnhancedSlipDisplay;

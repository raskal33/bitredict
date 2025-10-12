"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';

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
  }[];
  finalScore: number;
  correctCount: number;
  isEvaluated: boolean;
  status: 'pending' | 'evaluated' | 'won' | 'lost';
}

interface EnhancedSlipDisplayProps {
  slips: EnhancedSlip[];
}

const EnhancedSlipDisplay: React.FC<EnhancedSlipDisplayProps> = ({ slips }) => {
  const [expandedSlips, setExpandedSlips] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<'all' | 'pending' | 'evaluated' | 'won' | 'lost'>('all');

  console.log('🔍 EnhancedSlipDisplay received slips:', slips);
  console.log('🔍 Slips count:', slips?.length);
  console.log('🔍 Slips type:', typeof slips);
  console.log('🔍 Slips is array:', Array.isArray(slips));

  const toggleSlipExpansion = (slipId: number) => {
    const newExpanded = new Set(expandedSlips);
    if (newExpanded.has(slipId)) {
      newExpanded.delete(slipId);
    } else {
      newExpanded.add(slipId);
    }
    setExpandedSlips(newExpanded);
  };

  const getSlipStatus = (slip: EnhancedSlip): 'pending' | 'evaluated' | 'won' | 'lost' => {
    if (!slip.isEvaluated) {
      // Check if we have real-time results available
      const hasResults = slip.predictions.some(pred => pred.isCorrect !== undefined);
      return hasResults ? 'evaluated' : 'pending';
    }
    if (slip.correctCount >= 8) return 'won'; // Assuming 8+ correct predictions is a win
    return 'lost';
  };


  const filteredSlips = slips.filter(slip => {
    if (filter === 'all') return true;
    const status = getSlipStatus(slip);
    return status === filter;
  });

  const getBetTypeDisplay = (betType: number) => {
    switch (betType) {
      case 0: return '1X2';
      case 1: return 'Over/Under';
      case 2: return 'BTTS';
      case 3: return 'Half Time';
      case 4: return 'Double Chance';
      case 5: return 'Correct Score';
      case 6: return 'First Goal';
      case 7: return 'Half Time/Full Time';
      default: return 'Unknown';
    }
  };

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

  const getPredictionResult = (prediction: EnhancedSlip['predictions'][0], isCorrect?: boolean) => {
    if (isCorrect === undefined) {
      return <ClockIcon className="w-4 h-4 text-yellow-400" />;
    }
    return isCorrect ? 
      <CheckCircleIcon className="w-4 h-4 text-green-400" /> : 
      <XCircleIcon className="w-4 h-4 text-red-400" />;
  };

  const getSlipStatusInfo = (slip: EnhancedSlip) => {
    const status = getSlipStatus(slip);
    const hasRealTimeResults = slip.predictions.some(pred => pred.isCorrect !== undefined);
    
    if (status === 'pending' && !hasRealTimeResults) {
      return { 
        text: 'Pending', 
        color: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
        icon: ClockIcon 
      };
    }
    
    if (status === 'evaluated' && !slip.isEvaluated) {
      return { 
        text: 'Real-time Results', 
        color: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
        icon: CheckCircleIcon 
      };
    }
    
    if (status === 'won') {
      return { 
        text: 'Won', 
        color: 'bg-green-500/10 text-green-400 border border-green-500/20',
        icon: TrophyIcon 
      };
    }
    
    if (status === 'lost') {
      return { 
        text: 'Lost', 
        color: 'bg-red-500/10 text-red-400 border border-red-500/20',
        icon: XCircleIcon 
      };
    }
    
    return { 
      text: 'Evaluated', 
      color: 'bg-gray-500/10 text-gray-400 border border-gray-500/20',
      icon: CheckCircleIcon 
    };
  };

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
        {[
          { key: 'all', label: 'All Slips', count: slips.length },
          { key: 'pending', label: 'Pending', count: slips.filter(s => getSlipStatus(s) === 'pending' && !s.predictions.some(p => p.isCorrect !== undefined)).length },
          { key: 'evaluated', label: 'Real-time', count: slips.filter(s => getSlipStatus(s) === 'evaluated' && !s.isEvaluated).length },
          { key: 'won', label: 'Won', count: slips.filter(s => getSlipStatus(s) === 'won').length },
          { key: 'lost', label: 'Lost', count: slips.filter(s => getSlipStatus(s) === 'lost').length },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key as 'all' | 'pending' | 'evaluated' | 'won' | 'lost')}
            className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
              filter === key
                ? 'bg-primary text-black'
                : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Slips List */}
      <div className="space-y-3">
        {filteredSlips.map((slip) => {
          const status = getSlipStatus(slip);
          const isExpanded = expandedSlips.has(slip.id);
          
          return (
            <motion.div
              key={slip.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card border border-gray-600/30 overflow-hidden"
            >
              {/* Slip Header */}
              <div 
                className="p-4 md:p-5 cursor-pointer hover:bg-gray-800/30 transition-all duration-200 border-b border-gray-700/30"
                onClick={() => toggleSlipExpansion(slip.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <TrophyIcon className="w-4 h-4 md:w-5 md:h-5 text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm md:text-base font-semibold text-white truncate">
                        Slip #{slip.id}
                      </div>
                      <div className="flex items-center gap-2 md:gap-3 text-xs text-gray-400 flex-wrap">
                        <span>Cycle {slip.cycleId}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="truncate">{new Date(slip.placedAt * 1000).toLocaleDateString()}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>{slip.predictions.length} predictions</span>
                        {slip.predictions.some(p => p.isCorrect !== undefined) && !slip.isEvaluated && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs flex-shrink-0">
                            Live Results
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-xs md:text-sm font-semibold text-white">
                        {slip.correctCount}/{slip.predictions.length} correct
                      </div>
                      <div className="text-xs text-gray-400">
                        Score: {slip.finalScore} points
                      </div>
                    </div>
                    
                    <div className={`px-2 md:px-4 py-1 md:py-2 rounded-full text-xs font-bold ${getSlipStatusInfo(slip).color}`}>
                      {getSlipStatusInfo(slip).text}
                    </div>
                    
                    {isExpanded ? (
                      <ChevronUpIcon className="w-4 h-4 md:w-5 md:h-5 text-gray-400 transition-transform duration-200 flex-shrink-0" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4 md:w-5 md:h-5 text-gray-400 transition-transform duration-200 flex-shrink-0" />
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
                          <div key={index} className="flex items-center justify-between p-3 md:p-4 bg-gray-800/40 rounded-xl border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200">
                            <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                              {getPredictionResult(prediction, prediction.isCorrect)}
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-white text-sm mb-1 truncate">
                                  {prediction.homeTeam} vs {prediction.awayTeam}
                                </div>
                                <div className="text-gray-400 text-xs mb-2 truncate">
                                  {prediction.leagueName} • {getBetTypeDisplay(prediction.betType)}
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium ${getSelectionColor(prediction.selection, prediction.betType, prediction.isCorrect)}`}>
                                    {getSelectionDisplay(prediction.selection, prediction.betType)}
                                  </span>
                                  <span className="text-xs text-gray-500 flex-shrink-0">
                                    {prediction.selectedOdd / 100}x
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Slip Summary */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4 pt-4 border-t border-gray-600/30">
                        <div className="text-center p-2 md:p-3 bg-gray-800/30 rounded-lg">
                          <div className="text-xs text-gray-400 mb-1">Total Odds</div>
                          <div className="text-sm md:text-lg font-bold text-white">
                            {(slip.predictions.reduce((acc, p) => acc * (p.selectedOdd / 100), 1)).toFixed(2)}x
                          </div>
                        </div>
                        <div className="text-center p-2 md:p-3 bg-gray-800/30 rounded-lg">
                          <div className="text-xs text-gray-400 mb-1">Potential Win</div>
                          <div className="text-sm md:text-lg font-bold text-cyan-400">
                            {((slip.predictions.reduce((acc, p) => acc * (p.selectedOdd / 100), 1)) * 1).toFixed(2)} STT
                          </div>
                        </div>
                        <div className="text-center p-2 md:p-3 bg-gray-800/30 rounded-lg col-span-2 md:col-span-1">
                          <div className="text-xs text-gray-400 mb-1">Status</div>
                          <div className={`text-sm md:text-lg font-bold ${
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
        })}
      </div>

      {filteredSlips.length === 0 && (
        <div className="text-center py-12">
          <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Slips Found</h3>
          <p className="text-gray-400">
            {filter === 'all' 
              ? "You haven't placed any slips yet." 
              : `No ${filter} slips found.`
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default EnhancedSlipDisplay;

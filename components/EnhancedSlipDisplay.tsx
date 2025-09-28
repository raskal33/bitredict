"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TrophyIcon,
  ChartBarIcon
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
    if (!slip.isEvaluated) return 'pending';
    if (slip.correctCount >= 8) return 'won'; // Assuming 8+ correct predictions is a win
    return 'lost';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'won':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'lost':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'evaluated':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'won':
        return <TrophyIcon className="w-4 h-4" />;
      case 'lost':
        return <XCircleIcon className="w-4 h-4" />;
      case 'evaluated':
        return <ChartBarIcon className="w-4 h-4" />;
      case 'pending':
        return <ClockIcon className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
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

  const getPredictionResult = (prediction: EnhancedSlip['predictions'][0], isCorrect?: boolean) => {
    if (isCorrect === undefined) {
      return <ClockIcon className="w-4 h-4 text-yellow-400" />;
    }
    return isCorrect ? 
      <CheckCircleIcon className="w-4 h-4 text-green-400" /> : 
      <XCircleIcon className="w-4 h-4 text-red-400" />;
  };

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: 'all', label: 'All Slips', count: slips.length },
          { key: 'pending', label: 'Pending', count: slips.filter(s => getSlipStatus(s) === 'pending').length },
          { key: 'evaluated', label: 'Evaluated', count: slips.filter(s => getSlipStatus(s) === 'evaluated').length },
          { key: 'won', label: 'Won', count: slips.filter(s => getSlipStatus(s) === 'won').length },
          { key: 'lost', label: 'Lost', count: slips.filter(s => getSlipStatus(s) === 'lost').length },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key as 'all' | 'pending' | 'evaluated' | 'won' | 'lost')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
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
                className="p-4 cursor-pointer hover:bg-gray-800/30 transition-colors"
                onClick={() => toggleSlipExpansion(slip.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(status)}
                        <span className="capitalize">{status}</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      Cycle #{slip.cycleId}
                    </div>
                    <div className="text-sm text-gray-400">
                      {new Date(slip.placedAt * 1000).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {slip.isEvaluated && (
                      <div className="text-sm">
                        <span className="text-gray-400">Score: </span>
                        <span className="font-bold text-white">{slip.correctCount}/10</span>
                      </div>
                    )}
                    <div className="text-sm">
                      <span className="text-gray-400">Final Score: </span>
                      <span className="font-bold text-white">{slip.finalScore}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5 text-gray-400" />
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
                    <div className="p-4 space-y-3">
                      {/* Predictions */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-300 mb-3">Predictions</h4>
                        {slip.predictions.map((prediction: EnhancedSlip['predictions'][0], index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                            <div className="flex items-center gap-3">
                              {getPredictionResult(prediction, prediction.isCorrect)}
                              <div className="text-sm">
                                <div className="font-medium text-white">
                                  {prediction.homeTeam} vs {prediction.awayTeam}
                                </div>
                                <div className="text-gray-400 text-xs">
                                  {prediction.leagueName} • {getBetTypeDisplay(prediction.betType)}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-white">
                                {prediction.selection}
                              </div>
                              <div className="text-xs text-gray-400">
                                {prediction.selectedOdd / 100}x
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Slip Summary */}
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-600/30">
                        <div className="text-center">
                          <div className="text-xs text-gray-400 mb-1">Total Odds</div>
                          <div className="text-lg font-bold text-white">
                            {(slip.predictions.reduce((acc, p) => acc * (p.selectedOdd / 100), 1)).toFixed(2)}x
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-400 mb-1">Potential Win</div>
                          <div className="text-lg font-bold text-primary">
                            {((slip.predictions.reduce((acc, p) => acc * (p.selectedOdd / 100), 1)) * 1).toFixed(2)} STT
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

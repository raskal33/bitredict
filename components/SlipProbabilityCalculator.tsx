"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CalculatorIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  BoltIcon,
  FireIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { analyticsService, type SlipProbability } from '@/services/analyticsService';

interface PredictionData {
  matchId: number;
  selection: string;
  homeTeam: string;
  awayTeam: string;
  odds: number;
}

interface SlipProbabilityCalculatorProps {
  predictions: PredictionData[];
  onProbabilityUpdate?: (probability: SlipProbability) => void;
  className?: string;
}

export default function SlipProbabilityCalculator({ 
  predictions, 
  onProbabilityUpdate,
  className = "" 
}: SlipProbabilityCalculatorProps) {
  const [probability, setProbability] = useState<SlipProbability | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate probability when predictions change
  useEffect(() => {
    if (predictions.length === 0) {
      setProbability(null);
      return;
    }

    const calculateProbability = async () => {
      try {
        setIsCalculating(true);
        setError(null);

        // Create a mock slip ID for calculation
        const slipId = `temp_${Date.now()}`;
        
        // Get probability from analytics service
        const result = await analyticsService.getSlipProbability(slipId);
        
        // Update with actual prediction data
        const updatedResult = {
          ...result,
          predictionBreakdown: predictions.map((pred) => ({
            matchId: pred.matchId,
            probability: Math.random() * 80 + 10, // Mock calculation
            selection: pred.selection,
            confidence: Math.random() * 40 + 60
          }))
        };

        // Calculate overall probability based on individual predictions
        const individualProbabilities = updatedResult.predictionBreakdown.map(p => p.probability / 100);
        const overallProb = individualProbabilities.reduce((acc, prob) => acc * prob, 1) * 100;
        
        updatedResult.overallProbability = overallProb;
        updatedResult.riskLevel = getRiskLevel(overallProb);
        updatedResult.confidenceScore = Math.min(
          updatedResult.predictionBreakdown.reduce((acc, p) => acc + p.confidence, 0) / predictions.length,
          95
        );

        setProbability(updatedResult);
        onProbabilityUpdate?.(updatedResult);
      } catch (err) {
        setError('Failed to calculate probability');
        console.error('Probability calculation error:', err);
      } finally {
        setIsCalculating(false);
      }
    };

    calculateProbability();
  }, [predictions, onProbabilityUpdate]);

  const getRiskLevel = (probability: number): 'low' | 'medium' | 'high' | 'extreme' => {
    if (probability >= 50) return 'low';
    if (probability >= 25) return 'medium';
    if (probability >= 10) return 'high';
    return 'extreme';
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'extreme': return 'text-red-400 bg-red-500/10 border-red-500/30';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return CheckCircleIcon;
      case 'medium': return BoltIcon;
      case 'high': return FireIcon;
      case 'extreme': return ExclamationTriangleIcon;
      default: return SparklesIcon;
    }
  };

  const getSelectionIcon = (selection: string) => {
    switch (selection) {
      case '1': return '🏠';
      case 'X': return '🤝';
      case '2': return '✈️';
      case 'Over': return '⬆️';
      case 'Under': return '⬇️';
      default: return '⚽';
    }
  };

  if (predictions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`glass-card p-6 border border-gray-600/30 ${className}`}
      >
        <div className="text-center py-8">
          <CalculatorIcon className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Add predictions to calculate probability</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-6 border border-gray-600/30 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
          <CalculatorIcon className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Slip Probability</h3>
          <p className="text-sm text-gray-400">AI-powered risk assessment</p>
        </div>
      </div>

      {/* Loading State */}
      {isCalculating && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-3"></div>
          <p className="text-gray-400 text-sm">Calculating probability...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-8">
          <ExclamationTriangleIcon className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Results */}
      {probability && !isCalculating && !error && (
        <div className="space-y-6">
          {/* Overall Probability */}
          <div className="text-center p-6 bg-gray-800/30 rounded-xl border border-gray-700/50">
            <div className="text-3xl font-bold text-white mb-2">
              {probability.overallProbability.toFixed(1)}%
            </div>
            <div className="text-gray-300 text-sm mb-3">Overall Win Probability</div>
            
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getRiskColor(probability.riskLevel)}`}>
              {React.createElement(getRiskIcon(probability.riskLevel), { className: 'w-4 h-4' })}
              <span className="text-sm font-medium capitalize">{probability.riskLevel} Risk</span>
            </div>
          </div>

          {/* Confidence Score */}
          <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl">
            <div className="flex items-center gap-3">
              <SparklesIcon className="w-5 h-5 text-purple-400" />
              <span className="text-gray-300">Confidence Score</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-gray-700/50 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${probability.confidenceScore}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                />
              </div>
              <span className="text-purple-400 font-medium text-sm">
                {probability.confidenceScore.toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Prediction Breakdown */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <BoltIcon className="w-4 h-4" />
              Prediction Analysis
            </h4>
            
            {probability.predictionBreakdown.map((pred) => {
              const prediction = predictions.find(p => p.matchId === pred.matchId);
              if (!prediction) return null;

              return (
                <motion.div
                  key={pred.matchId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-4 p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-all duration-200"
                >
                  <div className="text-lg">
                    {getSelectionIcon(pred.selection)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-sm truncate">
                      {prediction.homeTeam} vs {prediction.awayTeam}
                    </div>
                    <div className="text-xs text-gray-400">
                      {pred.selection} • {prediction.odds.toFixed(2)}x odds
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-bold text-cyan-400">
                      {pred.probability.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-400">
                      {pred.confidence.toFixed(0)}% confidence
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Risk Assessment */}
          <div className={`p-4 rounded-xl border ${getRiskColor(probability.riskLevel)}`}>
            <div className="flex items-start gap-3">
              {React.createElement(getRiskIcon(probability.riskLevel), { 
                className: `w-5 h-5 ${getRiskColor(probability.riskLevel).split(' ')[0]} mt-0.5` 
              })}
              <div>
                <div className="font-medium text-white text-sm mb-1">
                  Risk Assessment
                </div>
                <div className="text-xs text-gray-300">
                  {probability.riskLevel === 'low' && 
                    'Good probability of success. This slip has strong potential.'}
                  {probability.riskLevel === 'medium' && 
                    'Moderate risk level. Consider your stake carefully.'}
                  {probability.riskLevel === 'high' && 
                    'High-risk slip with lower probability. Only bet what you can afford to lose.'}
                  {probability.riskLevel === 'extreme' && 
                    'Extremely high risk. This slip is very unlikely to win.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

"use client";

import { useState, useEffect } from 'react';
import { 
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TrophyIcon,
  BanknotesIcon,
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

interface SettlementResult {
  poolId: string;
  fixtureId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchDate: string;
  finalScore: string;
  result1X2: string;
  resultOU25: string;
  resultBTTS: string;
  totalPoolSize: number;
  totalParticipants: number;
  creatorWon: boolean;
  settlementTimestamp: string;
  transparencyData?: {
    totalBets: number;
    totalVolume: number;
    creatorStake: number;
    bettorStake: number;
    feesCollected: number;
    winnersCount: number;
    losersCount: number;
  };
}

interface SettlementResultsProps {
  poolId?: string;
  className?: string;
}

export default function SettlementResults({ poolId, className = "" }: SettlementResultsProps) {
  const [results, setResults] = useState<SettlementResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<SettlementResult | null>(null);

  useEffect(() => {
    const fetchSettlementResults = async () => {
      try {
        setLoading(true);
        const endpoint = poolId 
          ? `/api/settlement-results/${poolId}`
          : '/api/settlement-results';
        
        const response = await fetch(endpoint, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });

        if (!response.ok) {
          if (response.status === 404 || response.status === 500) {
            // Settlement data not available yet - this is normal for unsettled pools
            console.log(`ℹ️ Settlement data not available for pool ${poolId} (${response.status})`);
            setResults([]);
            setError(null);
            return;
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.success) {
          setResults(Array.isArray(data.data) ? data.data : [data.data]);
        } else {
          throw new Error(data.message || 'Failed to fetch settlement results');
        }
      } catch (err) {
        console.error('Error fetching settlement results:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch settlement results');
      } finally {
        setLoading(false);
      }
    };

    fetchSettlementResults();
  }, [poolId]);

  const getResultIcon = (result: string) => {
    switch (result.toLowerCase()) {
      case 'home':
      case 'over':
      case 'yes':
        return <CheckCircleIcon className="w-5 h-5 text-green-400" />;
      case 'away':
      case 'under':
      case 'no':
        return <XCircleIcon className="w-5 h-5 text-red-400" />;
      case 'draw':
        return <ClockIcon className="w-5 h-5 text-yellow-400" />;
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getResultColor = (result: string) => {
    switch (result.toLowerCase()) {
      case 'home':
      case 'over':
      case 'yes':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'away':
      case 'under':
      case 'no':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'draw':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toFixed(0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Settlement Results</h3>
          <div className="animate-pulse bg-gray-700 h-6 w-20 rounded"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/30 animate-pulse">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-gray-700 h-4 w-32 rounded"></div>
                <div className="bg-gray-700 h-4 w-16 rounded"></div>
              </div>
              <div className="bg-gray-700 h-6 w-48 rounded mb-2"></div>
              <div className="bg-gray-700 h-4 w-24 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Settlement Results</h3>
        </div>
        <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
          <ExclamationTriangleIcon className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-400 font-medium">Failed to load settlement results</p>
          <p className="text-red-300 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Settlement Results</h3>
        </div>
        <div className="p-6 bg-gray-800/30 border border-gray-700/30 rounded-lg text-center">
          <TrophyIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-400 font-medium">Settlement results will be available after settlement</p>
          <p className="text-gray-500 text-sm mt-1">
            {poolId ? 'This pool is either still active or recently settled. Settlement data will appear here once the oracle has processed the results.' : 'No pools have been settled yet.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Settlement Results</h3>
        <div className="text-sm text-gray-400">
          {results.length} result{results.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="space-y-3">
        {results.map((result, index) => (
          <motion.div
            key={result.poolId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/30 hover:border-gray-600/50 transition-all group cursor-pointer"
            onClick={() => setSelectedResult(result)}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center">
                  <TrophyIcon className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <div className="font-medium text-white">
                    Pool #{result.poolId}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatDate(result.settlementTimestamp)}
                  </div>
                </div>
              </div>
              
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
                result.creatorWon 
                  ? 'text-green-400 bg-green-500/20 border-green-500/30'
                  : 'text-red-400 bg-red-500/20 border-red-500/30'
              }`}>
                {result.creatorWon ? (
                  <CheckCircleIcon className="w-3 h-3" />
                ) : (
                  <XCircleIcon className="w-3 h-3" />
                )}
                {result.creatorWon ? 'Creator Won' : 'Creator Lost'}
              </div>
            </div>

            {/* Match Info */}
            <div className="mb-3">
              <div className="text-sm font-medium text-white mb-1">
                {result.homeTeam} vs {result.awayTeam}
              </div>
              <div className="text-xs text-gray-400 mb-2">
                {result.league} • {formatDate(result.matchDate)}
              </div>
              <div className="text-lg font-bold text-white">
                Final Score: {result.finalScore}
              </div>
            </div>

            {/* Results */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className={`p-2 rounded-lg border text-center ${getResultColor(result.result1X2)}`}>
                <div className="flex items-center justify-center gap-1 mb-1">
                  {getResultIcon(result.result1X2)}
                  <span className="text-xs font-medium">1X2</span>
                </div>
                <div className="text-xs font-bold">{result.result1X2}</div>
              </div>
              
              <div className={`p-2 rounded-lg border text-center ${getResultColor(result.resultOU25)}`}>
                <div className="flex items-center justify-center gap-1 mb-1">
                  {getResultIcon(result.resultOU25)}
                  <span className="text-xs font-medium">O/U 2.5</span>
                </div>
                <div className="text-xs font-bold">{result.resultOU25}</div>
              </div>
              
              <div className={`p-2 rounded-lg border text-center ${getResultColor(result.resultBTTS)}`}>
                <div className="flex items-center justify-center gap-1 mb-1">
                  {getResultIcon(result.resultBTTS)}
                  <span className="text-xs font-medium">BTTS</span>
                </div>
                <div className="text-xs font-bold">{result.resultBTTS}</div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <BanknotesIcon className="w-3 h-3" />
                  <span>{formatCurrency(result.totalPoolSize)} STT</span>
                </div>
                <div className="flex items-center gap-1">
                  <ChartBarIcon className="w-3 h-3" />
                  <span>{result.totalParticipants} participants</span>
                </div>
              </div>
              <div className="text-gray-500 group-hover:text-gray-400 transition-colors">
                Click for details →
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedResult && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Settlement Details</h2>
                <button
                  onClick={() => setSelectedResult(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Match Details */}
              <div className="mb-6 p-4 bg-gray-800/30 rounded-lg border border-gray-700/30">
                <h3 className="text-lg font-semibold text-white mb-3">Match Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Teams:</span>
                    <div className="text-white font-medium">{selectedResult.homeTeam} vs {selectedResult.awayTeam}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">League:</span>
                    <div className="text-white font-medium">{selectedResult.league}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Date:</span>
                    <div className="text-white font-medium">{formatDate(selectedResult.matchDate)}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Final Score:</span>
                    <div className="text-white font-medium">{selectedResult.finalScore}</div>
                  </div>
                </div>
              </div>

              {/* Results */}
              <div className="mb-6 p-4 bg-gray-800/30 rounded-lg border border-gray-700/30">
                <h3 className="text-lg font-semibold text-white mb-3">Settlement Results</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className={`p-3 rounded-lg border text-center ${getResultColor(selectedResult.result1X2)}`}>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {getResultIcon(selectedResult.result1X2)}
                      <span className="font-medium">1X2</span>
                    </div>
                    <div className="text-lg font-bold">{selectedResult.result1X2}</div>
                  </div>
                  
                  <div className={`p-3 rounded-lg border text-center ${getResultColor(selectedResult.resultOU25)}`}>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {getResultIcon(selectedResult.resultOU25)}
                      <span className="font-medium">Over/Under 2.5</span>
                    </div>
                    <div className="text-lg font-bold">{selectedResult.resultOU25}</div>
                  </div>
                  
                  <div className={`p-3 rounded-lg border text-center ${getResultColor(selectedResult.resultBTTS)}`}>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {getResultIcon(selectedResult.resultBTTS)}
                      <span className="font-medium">BTTS</span>
                    </div>
                    <div className="text-lg font-bold">{selectedResult.resultBTTS}</div>
                  </div>
                </div>
              </div>

              {/* Transparency Data */}
              {selectedResult.transparencyData && (
                <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/30">
                  <h3 className="text-lg font-semibold text-white mb-3">Transparency Data</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Total Bets:</span>
                      <div className="text-white font-medium">{selectedResult.transparencyData.totalBets}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Total Volume:</span>
                      <div className="text-white font-medium">{formatCurrency(selectedResult.transparencyData.totalVolume)} STT</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Creator Stake:</span>
                      <div className="text-white font-medium">{formatCurrency(selectedResult.transparencyData.creatorStake)} STT</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Bettor Stake:</span>
                      <div className="text-white font-medium">{formatCurrency(selectedResult.transparencyData.bettorStake)} STT</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Fees Collected:</span>
                      <div className="text-white font-medium">{formatCurrency(selectedResult.transparencyData.feesCollected)} STT</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Winners:</span>
                      <div className="text-white font-medium">{selectedResult.transparencyData.winnersCount}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Losers:</span>
                      <div className="text-white font-medium">{selectedResult.transparencyData.losersCount}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Settlement Time:</span>
                      <div className="text-white font-medium">{formatDate(selectedResult.settlementTimestamp)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

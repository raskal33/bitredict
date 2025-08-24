"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  TrophyIcon,
  // UserGroupIcon, // Removed unused import
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { oddysseyService, OddysseyMatchWithResult } from '@/services/oddysseyService';

interface OddysseyMatchResultsProps {
  cycleId: number;
  className?: string;
}

export default function OddysseyMatchResults({ cycleId, className = '' }: OddysseyMatchResultsProps) {
  const [results, setResults] = useState<OddysseyMatchWithResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cycleInfo, setCycleInfo] = useState<{
    isResolved: boolean;
    totalMatches: number;
    finishedMatches: number;
  } | null>(null);

  const fetchResults = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await oddysseyService.getCycleResults(cycleId);
      
      if (response.success) {
        setResults(response.data.matches);
        setCycleInfo({
          isResolved: response.data.isResolved,
          totalMatches: response.data.totalMatches,
          finishedMatches: response.data.finishedMatches
        });
      } else {
        setError('Failed to fetch match results');
      }
    } catch (err) {
      console.error('Error fetching match results:', err);
      setError('Failed to load match results');
    } finally {
      setLoading(false);
    }
  }, [cycleId]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'finished':
        return <CheckCircleIcon className="h-4 w-4 text-green-400" />;
      case 'live':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-400 animate-pulse" />;
      case 'upcoming':
        return <ClockIcon className="h-4 w-4 text-blue-400" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'finished':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'live':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'upcoming':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const formatScore = (match: OddysseyMatchWithResult) => {
    if (match.result.home_score !== null && match.result.away_score !== null) {
      return `${match.result.home_score} - ${match.result.away_score}`;
    }
    return 'TBD';
  };

  const getOutcomeText = (outcome: string | null) => {
    if (!outcome) return 'TBD';
    
    switch (outcome) {
      case '1':
        return 'Home Win';
      case 'X':
        return 'Draw';
      case '2':
        return 'Away Win';
      case 'Over':
        return 'Over 2.5';
      case 'Under':
        return 'Under 2.5';
      default:
        return outcome;
    }
  };

  const getOutcomeColor = (outcome: string | null) => {
    if (!outcome) return 'text-gray-400';
    
    switch (outcome) {
      case '1':
        return 'text-primary';
      case 'X':
        return 'text-secondary';
      case '2':
        return 'text-accent';
      case 'Over':
        return 'text-blue-400';
      case 'Under':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className={`glass-card p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-text-secondary">Loading match results...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`glass-card p-6 ${className}`}>
        <div className="text-center py-8">
          <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <h3 className="text-lg font-semibold text-white mb-2">Error Loading Results</h3>
          <p className="text-text-muted">{error}</p>
          <button 
            onClick={fetchResults}
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
      {/* Cycle Info */}
      {cycleInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <TrophyIcon className="h-6 w-6 text-primary" />
              <div>
                <h3 className="text-lg font-bold text-white">Cycle #{cycleId}</h3>
                <p className="text-sm text-text-muted">
                  {cycleInfo.finishedMatches}/{cycleInfo.totalMatches} matches finished
                </p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              cycleInfo.isResolved 
                ? 'text-green-400 bg-green-400/10 border border-green-400/20' 
                : 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/20'
            }`}>
              {cycleInfo.isResolved ? 'Resolved' : 'Active'}
            </div>
          </div>
        </motion.div>
      )}

      {/* Match Results */}
      <div className="space-y-4">
        {results.map((match, index) => (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card p-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Match Number */}
              <div className="md:col-span-1 text-center">
                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-sm flex items-center justify-center mx-auto">
                  {match.display_order}
                </div>
              </div>

              {/* Teams */}
              <div className="md:col-span-4">
                <div className="text-sm font-semibold text-white text-center md:text-left">
                  <div className="truncate">{match.home_team}</div>
                  <div className="text-xs text-text-muted">vs</div>
                  <div className="truncate">{match.away_team}</div>
                </div>
                <div className="text-xs text-text-muted text-center md:text-left mt-1">
                  {match.league_name}
                </div>
              </div>

              {/* Status */}
              <div className="md:col-span-2 text-center">
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(match.status)}`}>
                  {getStatusIcon(match.status)}
                  <span className="capitalize">{match.status}</span>
                </div>
              </div>

              {/* Score */}
              <div className="md:col-span-2 text-center">
                <div className="text-lg font-bold text-white">
                  {formatScore(match)}
                </div>
                {match.result.finished_at && (
                  <div className="text-xs text-text-muted">
                    {new Date(match.result.finished_at).toLocaleTimeString()}
                  </div>
                )}
              </div>

              {/* Outcomes */}
              <div className="md:col-span-3 text-center space-y-1">
                <div className="text-xs">
                  <span className="text-text-muted">1X2: </span>
                  <span className={`font-medium ${getOutcomeColor(match.result.outcome_1x2)}`}>
                    {getOutcomeText(match.result.outcome_1x2)}
                  </span>
                </div>
                <div className="text-xs">
                  <span className="text-text-muted">O/U: </span>
                  <span className={`font-medium ${getOutcomeColor(match.result.outcome_ou25)}`}>
                    {getOutcomeText(match.result.outcome_ou25)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {results.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-8 text-center"
        >
          <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-text-muted" />
          <h3 className="text-lg font-semibold text-white mb-2">No Match Results</h3>
          <p className="text-text-muted">Match results will appear here once they become available.</p>
        </motion.div>
      )}
    </div>
  );
}

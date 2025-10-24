"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CalendarIcon, 
  TrophyIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { FaSpinner } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

import { oddysseyService, ResultsByDate } from '@/services/oddysseyService';
import DatePicker from './DatePicker';

interface MatchResult {
  id: string;
  fixture_id: string;
  home_team: string;
  away_team: string;
  league_name: string;
  match_date: string;
  status: string;
  display_order: number;
  result: {
    home_score: number | null;
    away_score: number | null;
    outcome_1x2: string | null;
    outcome_ou25: string | null;
    finished_at: string | null;
    is_finished: boolean;
  };
}

interface OddysseyResultsProps {
  className?: string;
}

export default function OddysseyResults({ className = "" }: OddysseyResultsProps) {
  const [selectedDate, setSelectedDate] = useState(() => {
    // Default to today's date
    return format(new Date(), 'yyyy-MM-dd');
  });
  
  const [results, setResults] = useState<ResultsByDate | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);


  // Fetch available dates for the date picker
  const fetchAvailableDates = useCallback(async () => {
    try {
      const response = await oddysseyService.getAvailableDates();
      
      if (response.success && response.data) {
        setAvailableDates(response.data);
      }
    } catch (error) {
      console.error('❌ Error fetching available dates:', error);
      toast.error('Failed to fetch available dates');
    }
  }, []);

  // Fetch results for the selected date
  const fetchResults = useCallback(async (date: string) => {
    try {
      setIsLoading(true);
      const response = await oddysseyService.getResultsByDate(date);
      
      if (response.success && response.data) {
        setResults(response.data);
      } else {
        setResults(null);
        toast.error('No results found for this date');
      }
    } catch (error) {
      console.error('❌ Error fetching results:', error);
      toast.error('Failed to fetch results');
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle date change
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    fetchResults(date);
  };

  // Load initial data
  useEffect(() => {
    fetchAvailableDates();
    fetchResults(selectedDate);
  }, [fetchAvailableDates, fetchResults, selectedDate]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'finished':
        return <CheckCircleIcon className="w-4 h-4 text-green-400" />;
      case 'live':
        return <ClockIcon className="w-4 h-4 text-red-400 animate-pulse" />;
      case 'upcoming':
        return <EyeIcon className="w-4 h-4 text-primary" />;
      default:
        return <ClockIcon className="w-4 h-4 text-text-muted" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'finished':
        return 'Finished';
      case 'live':
        return 'Live';
      case 'upcoming':
        return 'Upcoming';
      case 'delayed':
        return 'Delayed';
      default:
        return 'Unknown';
    }
  };

  const getOutcomeText = (outcome: string | null) => {
    if (!outcome) return 'Pending';
    
    // ✅ FIXED: Handle normalized format (Home/Draw/Away, Over/Under) AND legacy format
    switch (outcome) {
      // New normalized format
      case 'Home':
      case 'home':
        return 'Home Win';
      case 'Draw':
      case 'draw':
        return 'Draw';
      case 'Away':
      case 'away':
        return 'Away Win';
      case 'Over':
      case 'over':
        return 'Over 2.5';
      case 'Under':
      case 'under':
        return 'Under 2.5';
      // Legacy single-digit codes
      case '1':
        return 'Home Win';
      case 'X':
      case 'x':
        return 'Draw';
      case '2':
        return 'Away Win';
      // Legacy single-letter format
      case 'O':
        return 'Over 2.5';
      case 'U':
        return 'Under 2.5';
      default:
        return outcome;
    }
  };

  const getOutcomeColor = (outcome: string | null) => {
    if (!outcome) return 'text-text-muted';
    
    // ✅ FIXED: Handle normalized format (Home/Draw/Away, Over/Under) AND legacy format
    switch (outcome) {
      // New normalized format
      case 'Home':
      case 'home':
      case 'Away':
      case 'away':
      case 'Over':
      case 'over':
      case 'Under':
      case 'under':
        return 'text-green-400 font-semibold';
      case 'Draw':
      case 'draw':
        return 'text-primary font-semibold';
      // Legacy format
      case '1':
      case '2':
        return 'text-green-400 font-semibold';
      case 'X':
      case 'x':
        return 'text-primary font-semibold';
      case 'O':
      case 'U':
        return 'text-green-400 font-semibold';
      default:
        return 'text-text-secondary';
    }
  };

  return (
    <div className={`glass-card p-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center">
          <TrophyIcon className="w-6 h-6 text-yellow-500 mr-2" />
          <h2 className="text-xl font-bold text-white">Oddyssey Results</h2>
        </div>
        
        {/* Date Picker */}
        <div className="w-full sm:w-48 min-w-0">
          <DatePicker
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            availableDates={availableDates}
          />
        </div>
      </div>

              {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <FaSpinner className="w-8 h-8 text-primary animate-spin mr-3" />
          <span className="text-text-secondary">Loading results...</span>
        </div>
      )}

      {/* Results Content */}
      <AnimatePresence mode="wait">
        {!isLoading && results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Results Summary */}
            <div className="glass-card p-4 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{results.totalMatches}</div>
                  <div className="text-sm text-text-muted">Total Matches</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{results.finishedMatches}</div>
                  <div className="text-sm text-text-muted">Finished</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{results.cycleId || 'N/A'}</div>
                  <div className="text-sm text-text-muted">Cycle ID</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">
                    {results.isResolved ? 'Resolved' : 'Pending'}
                  </div>
                  <div className="text-sm text-text-muted">Status</div>
                </div>
              </div>
            </div>

            {/* Matches List */}
            <div className="space-y-4">
              {results.matches.map((match: MatchResult, index: number) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card p-4 hover:bg-primary/5 transition-all duration-200 border-l-2 border-transparent hover:border-primary/50"
                >
                  <div className="flex items-center justify-between">
                    {/* Match Info */}
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        {getStatusIcon(match.status)}
                        <span className="ml-2 text-sm font-medium text-text-secondary">
                          {getStatusText(match.status)}
                        </span>
                        <span className="ml-2 text-xs text-text-muted">
                          {format(parseISO(match.match_date || ''), 'HH:mm')}
                        </span>
                      </div>
                      
                      <div className="text-lg font-semibold text-white mb-1">
                        {match.home_team} vs {match.away_team}
                      </div>
                      
                      <div className="text-sm text-text-secondary">
                        {match.league_name}
                      </div>
                    </div>

                    {/* Results */}
                    <div className="text-right">
                      {match.result?.is_finished ? (
                        <div className="space-y-1">
                          <div className="text-lg font-bold text-white">
                            {match.result?.home_score !== null && match.result?.away_score !== null 
                              ? `${match.result.home_score} - ${match.result.away_score}`
                              : 'Score unavailable'
                            }
                          </div>
                          <div className="text-sm">
                            <span className={getOutcomeColor(match.result?.outcome_1x2)}>
                              1X2: {getOutcomeText(match.result?.outcome_1x2)}
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className={getOutcomeColor(match.result?.outcome_ou25)}>
                              O/U: {getOutcomeText(match.result?.outcome_ou25)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-text-muted">
                          {match.status === 'upcoming' ? 'Not started' : 'In progress'}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* No Results Message */}
            {results.matches.length === 0 && (
              <div className="text-center py-12">
                <CalendarIcon className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Results Found</h3>
                <p className="text-text-secondary">
                  No matches were found for {format(parseISO(selectedDate), 'MMMM dd, yyyy')}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* No Results State */}
        {!isLoading && !results && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <XCircleIcon className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Results Available</h3>
            <p className="text-text-secondary">
              Try selecting a different date or check back later
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

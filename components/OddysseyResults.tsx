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
        const dates = response.data.availableDates.map(date => date.date);
        setAvailableDates(dates);
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
        if (response.message) {
          toast.error(response.message);
        }
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
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'live':
        return <ClockIcon className="w-4 h-4 text-red-500 animate-pulse" />;
      case 'upcoming':
        return <EyeIcon className="w-4 h-4 text-blue-500" />;
      default:
        return <ClockIcon className="w-4 h-4 text-gray-400" />;
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
    
    switch (outcome) {
      case '1':
        return 'Home Win';
      case 'X':
        return 'Draw';
      case '2':
        return 'Away Win';
      case 'over':
        return 'Over 2.5';
      case 'under':
        return 'Under 2.5';
      default:
        return outcome;
    }
  };

  const getOutcomeColor = (outcome: string | null) => {
    if (!outcome) return 'text-gray-500';
    
    switch (outcome) {
      case '1':
      case '2':
      case 'over':
      case 'under':
        return 'text-green-600 font-semibold';
      case 'X':
        return 'text-blue-600 font-semibold';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <TrophyIcon className="w-6 h-6 text-yellow-500 mr-2" />
          <h2 className="text-xl font-bold text-gray-900">Oddyssey Results</h2>
        </div>
        
        {/* Date Picker */}
        <div className="w-48">
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
          <FaSpinner className="w-8 h-8 text-blue-500 animate-spin mr-3" />
          <span className="text-gray-600">Loading results...</span>
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
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{results.totalMatches}</div>
                  <div className="text-sm text-gray-600">Total Matches</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{results.finishedMatches}</div>
                  <div className="text-sm text-gray-600">Finished</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{results.cycleId || 'N/A'}</div>
                  <div className="text-sm text-gray-600">Cycle ID</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {results.isResolved ? 'Resolved' : 'Pending'}
                  </div>
                  <div className="text-sm text-gray-600">Status</div>
                </div>
              </div>
            </div>

            {/* Matches List */}
            <div className="space-y-4">
              {results.matches.map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    {/* Match Info */}
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        {getStatusIcon(match.status)}
                        <span className="ml-2 text-sm font-medium text-gray-600">
                          {getStatusText(match.status)}
                        </span>
                        <span className="ml-2 text-xs text-gray-400">
                          {format(parseISO(match.match_date), 'HH:mm')}
                        </span>
                      </div>
                      
                      <div className="text-lg font-semibold text-gray-900 mb-1">
                        {match.home_team} vs {match.away_team}
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        {match.league_name}
                      </div>
                    </div>

                    {/* Results */}
                    <div className="text-right">
                      {match.result.is_finished ? (
                        <div className="space-y-1">
                          <div className="text-lg font-bold text-gray-900">
                            {match.result.home_score} - {match.result.away_score}
                          </div>
                          <div className="text-sm">
                            <span className={getOutcomeColor(match.result.outcome_1x2)}>
                              1X2: {getOutcomeText(match.result.outcome_1x2)}
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className={getOutcomeColor(match.result.outcome_ou25)}>
                              O/U: {getOutcomeText(match.result.outcome_ou25)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
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
                <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
                <p className="text-gray-600">
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
            <XCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Available</h3>
            <p className="text-gray-600">
              Try selecting a different date or check back later
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

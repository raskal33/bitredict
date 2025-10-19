"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  TrophyIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { OddysseyMatchWithResult } from '@/services/oddysseyService';

interface OddysseyMatchResultsProps {
  cycleId?: number;
  className?: string;
}

interface CycleWithDate {
  cycleId: number;
  startTime: string;
  endTime: string;
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
  
  // Time filtering states
  const [currentCycleId, setCurrentCycleId] = useState<number | null>(null);
  const [availableCycles, setAvailableCycles] = useState<CycleWithDate[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<number | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(new Date());

  // Fetch available cycles with dates - Use current date approach since /all endpoint times out
  const fetchAvailableCycles = useCallback(async () => {
    try {
      // Generate last 7 days of dates to check for cycles
      const dates = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
      }
      
      const cyclesFound: CycleWithDate[] = [];
      
      // Check each date for available cycles
      for (const date of dates) {
        try {
          const response = await fetch(`/api/oddyssey/results/${date}?t=${Date.now()}`, {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data?.cycleId) {
              cyclesFound.push({
                cycleId: Number(data.data.cycleId),
                startTime: data.data.cycleStartTime,
                endTime: data.data.cycleEndTime || new Date().toISOString()
              });
            }
          }
        } catch (error) {
          console.warn(`Error fetching cycle for date ${date}:`, error);
        }
      }
      
      if (cyclesFound.length > 0) {
        // Remove duplicates and sort by cycleId descending
        const uniqueCycles = cyclesFound.filter((cycle, index, self) => 
          index === self.findIndex(c => c.cycleId === cycle.cycleId)
        ).sort((a: CycleWithDate, b: CycleWithDate) => b.cycleId - a.cycleId);
        
        setAvailableCycles(uniqueCycles);
        if (!selectedCycle && uniqueCycles.length > 0) {
          setSelectedCycle(uniqueCycles[0].cycleId);
        }
      }
    } catch (error) {
      console.error('Error fetching available cycles:', error);
    }
  }, [selectedCycle]);

  const fetchResults = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const targetCycleId = selectedCycle || cycleId;
      console.log('🎯 Fetching results for cycle:', targetCycleId);
      
      if (targetCycleId) {
        // Use direct API call to get specific cycle results
        const response = await fetch(`/api/oddyssey/cycle/${targetCycleId}/results?t=${Date.now()}`, {
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Cycle results fetched:', data);
          
          if (data.success && data.data) {
            setResults(data.data.matches || []);
            setCurrentCycleId(targetCycleId);
            setCycleInfo({
              isResolved: data.data.isResolved || false,
              totalMatches: data.data.matchesCount || data.data.matches?.length || 0,
              finishedMatches: data.data.matches?.filter((m: OddysseyMatchWithResult) => m.result?.finished_at).length || 0
            });
          } else {
            throw new Error('No data in response');
          }
        } else {
          throw new Error(`API responded with status: ${response.status}`);
        }
      } else {
        // Fallback: Use /results/all to get latest cycle
        console.log('🔍 No cycle ID provided, fetching from /results/all...');
        
        const response = await fetch(`/api/oddyssey/results/all?t=${Date.now()}`, {
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ All results fetched:', data);
          
          if (data.success && data.data?.cycles?.length > 0) {
            // Get the latest cycle
            const latestCycle = data.data.cycles[0];
            setResults(latestCycle.matches || []);
            setCurrentCycleId(latestCycle.cycleId);
            setSelectedCycle(latestCycle.cycleId);
            setCycleInfo({
              isResolved: latestCycle.isResolved || false,
              totalMatches: latestCycle.matchesCount || latestCycle.matches?.length || 0,
              finishedMatches: latestCycle.matches?.filter((m: OddysseyMatchWithResult) => m.result?.finished_at).length || 0
            });
          } else {
            throw new Error('No cycles found');
          }
        } else {
          throw new Error(`API responded with status: ${response.status}`);
        }
      }
    } catch (err) {
      console.error('❌ Error fetching results:', err);
      setError('Failed to load match results');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [cycleId, selectedCycle]);

  useEffect(() => {
    fetchAvailableCycles();
  }, [fetchAvailableCycles]);

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
    // Check if match has results based on backend data structure
    if (match.result) {
      // Check if match has finished_at timestamp (indicates completion)
      if (match.result.finished_at) {
        // Show actual scores if available
        if (match.result.home_score !== null && match.result.away_score !== null) {
          return `${match.result.home_score} - ${match.result.away_score}`;
        }
        // If no scores but match is finished, show "Finished"
        return 'Finished';
      }
      // Check if match has result codes (moneyline: 1=home, 2=draw, 3=away)
      if (match.result.moneyline && match.result.moneyline !== 0) {
        return 'Finished'; // Match has a result
      }
      // Check overUnder codes (1=over, 2=under)
      if (match.result.overUnder && match.result.overUnder !== 0) {
        return 'Finished'; // Match has a result
      }
    }
    return 'Pending';
  };

  const getOutcomeText = (outcome: string | number | null, isOverUnder = false) => {
    if (!outcome || outcome === 0 || outcome === '0') return 'TBD';
    
    // Handle both string and numeric outcomes
    if (typeof outcome === 'string' || typeof outcome === 'number') {
      const outcomeStr = String(outcome);
      
      if (isOverUnder) {
        // OverUnder codes: 1=over, 2=under
        switch (outcomeStr) {
          case '1':
            return 'Over 2.5';
          case '2':
            return 'Under 2.5';
          case 'Over':
          case 'over':
            return 'Over 2.5';
          case 'Under':
          case 'under':
            return 'Under 2.5';
          default:
            return outcomeStr;
        }
      } else {
        // Moneyline codes: 1=home, 2=draw, 3=away
        switch (outcomeStr) {
          case '1':
            return 'Home Win';
          case '2':
            return 'Draw';
          case '3':
            return 'Away Win';
          case 'X':
            return 'Draw';
          default:
            return outcomeStr;
        }
      }
    }
    
    return 'TBD';
  };

  const getOutcomeColor = (outcome: string | number | null) => {
    if (!outcome || outcome === 0 || outcome === '0') return 'text-gray-400';
    
    const outcomeStr = String(outcome);
    switch (outcomeStr) {
      case '1':
        return 'text-green-400';
      case '2':
      case 'X':
        return 'text-yellow-400';
      case '3':
        return 'text-blue-400';
      case 'Over':
        return 'text-blue-400';
      case 'Under':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  // Date picker helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getCycleForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return availableCycles.find(cycle => {
      const cycleStart = new Date(cycle.startTime).toISOString().split('T')[0];
      const cycleEnd = new Date(cycle.endTime).toISOString().split('T')[0];
      return dateString >= cycleStart && dateString <= cycleEnd;
    });
  };

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(pickerMonth.getFullYear(), pickerMonth.getMonth(), day);
    const cycle = getCycleForDate(selectedDate);
    if (cycle) {
      setSelectedCycle(cycle.cycleId);
      setShowDatePicker(false);
    }
  };

  const isDateInCycle = (day: number) => {
    const date = new Date(pickerMonth.getFullYear(), pickerMonth.getMonth(), day);
    return getCycleForDate(date) !== undefined;
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(pickerMonth);
    const firstDay = getFirstDayOfMonth(pickerMonth);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-10"></div>
      );
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const hasData = isDateInCycle(day);
      const isSelected = selectedCycle !== null && 
        getCycleForDate(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth(), day))?.cycleId === selectedCycle;

      days.push(
        <button
          key={day}
          onClick={() => handleDateSelect(day)}
          disabled={!hasData}
          className={`h-10 rounded text-sm font-medium transition-all ${
            hasData
              ? isSelected
                ? 'bg-primary text-black'
                : 'bg-primary/20 text-primary hover:bg-primary/30'
              : 'text-gray-600 cursor-not-allowed'
          }`}
        >
          {day}
        </button>
      );
    }

    return days;
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
      {/* Date Picker Section - Always Visible */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4"
      >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarDaysIcon className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-white">Select Cycle</h3>
            </div>
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="px-4 py-2 bg-primary/20 text-primary rounded-button hover:bg-primary/30 transition-all flex items-center gap-2"
            >
              <CalendarDaysIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Pick Date</span>
              <span className="sm:hidden">📅</span>
            </button>
          </div>

          {/* Quick Select Cycle Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            {availableCycles.slice(0, 5).map((cycle) => {
              const startDate = new Date(cycle.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              return (
                <button
                  key={cycle.cycleId}
                  onClick={() => {
                    setSelectedCycle(cycle.cycleId);
                    setShowDatePicker(false);
                  }}
                  className={`px-4 py-2 rounded-button text-sm font-medium transition-all ${
                    selectedCycle === cycle.cycleId
                      ? 'bg-primary text-black'
                      : 'bg-primary/10 text-primary hover:bg-primary/20'
                  }`}
                >
                  Cycle #{cycle.cycleId}
                  <span className="hidden sm:inline text-xs ml-1 opacity-70">({startDate})</span>
                </button>
              );
            })}
          </div>

          {/* Calendar Picker */}
          <AnimatePresence>
            {showDatePicker && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-primary/20 pt-4"
              >
                <div className="bg-gray-900/30 rounded-lg p-4">
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() - 1))}
                      className="p-2 hover:bg-primary/20 rounded transition-colors"
                    >
                      <ChevronLeftIcon className="h-5 w-5 text-primary" />
                    </button>
                    <h4 className="text-white font-semibold">{formatMonthYear(pickerMonth)}</h4>
                    <button
                      onClick={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() + 1))}
                      className="p-2 hover:bg-primary/20 rounded transition-colors"
                    >
                      <ChevronRightIcon className="h-5 w-5 text-primary" />
                    </button>
                  </div>

                  {/* Day names */}
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="h-10 flex items-center justify-center text-xs font-semibold text-gray-400">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-2">
                    {renderCalendarDays()}
                  </div>

                  <button
                    onClick={() => setShowDatePicker(false)}
                    className="mt-4 w-full py-2 bg-primary/20 text-primary rounded-button hover:bg-primary/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <XMarkIcon className="h-4 w-4" />
                    Close
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

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
                <h3 className="text-lg font-bold text-white">
                  Cycle #{selectedCycle || currentCycleId || cycleId || 'N/A'}
                </h3>
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
            {/* Mobile-First Responsive Layout */}
            <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-12 md:gap-4 md:items-center">
              {/* Mobile: Match Header */}
              <div className="flex items-center justify-between md:hidden">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center">
                  {match.display_order}
                </div>
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(match.status)}`}>
                  {getStatusIcon(match.status)}
                  <span className="capitalize">{match.status}</span>
                </div>
              </div>

              {/* Desktop: Match Number */}
              <div className="hidden md:block md:col-span-1 text-center">
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

              {/* Desktop: Status */}
              <div className="hidden md:block md:col-span-2 text-center">
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
                  <span className={`font-medium ${getOutcomeColor((match.result.outcome_1x2 || match.result.moneyline) ?? null)}`}>
                    {getOutcomeText((match.result.outcome_1x2 || match.result.moneyline) ?? null, false)}
                  </span>
                </div>
                <div className="text-xs">
                  <span className="text-text-muted">O/U: </span>
                  <span className={`font-medium ${getOutcomeColor((match.result.outcome_ou25 || match.result.overUnder) ?? null)}`}>
                    {getOutcomeText((match.result.outcome_ou25 || match.result.overUnder) ?? null, true)}
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

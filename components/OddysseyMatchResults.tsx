"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  TrophyIcon,
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
  
  // Debug: Log received cycleId
  console.log('🔍 OddysseyMatchResults received cycleId:', cycleId);
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

  // Fetch available cycles with dates using the new API
  const fetchAvailableCycles = useCallback(async () => {
    try {
      console.log('📅 Fetching available cycle dates...');
      
      const response = await fetch(`/api/oddyssey/available-dates?t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.dates) {
          console.log(`✅ Found ${data.data.dates.length} available cycle dates:`, data.data.dates);
          
          // ✅ FIXED: Use actual cycle data from backend (includes cycleId)
          const cyclesFound: CycleWithDate[] = data.data.dates.map((dateItem: { date: string, cycleId: number, isResolved: boolean }) => ({
            cycleId: dateItem.cycleId, // Use actual cycleId from backend
            startTime: dateItem.date,
            endTime: dateItem.date
          }));
          
          setAvailableCycles(cyclesFound);
          return;
        }
      }
      
      // Fallback: Use /results/all to get actual cycles
      console.log('⚠️ Available dates API failed, using /results/all fallback');
      const fallbackResponse = await fetch(`/api/oddyssey/results/all?t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (fallbackResponse.ok) {
        const data = await fallbackResponse.json();
        if (data.success && data.data?.cycles) {
          const cyclesFound: CycleWithDate[] = data.data.cycles.map((cycle: { cycleId: number; startTime: string; endTime: string }) => ({
            cycleId: cycle.cycleId,
            startTime: cycle.startTime,
            endTime: cycle.endTime
          }));
          
          console.log(`✅ Found ${cyclesFound.length} cycles from /results/all`);
          setAvailableCycles(cyclesFound);
          
          // Only set selected cycle if not already set from prop
          if (!selectedCycle && cyclesFound.length > 0) {
            // Prioritize the cycleId prop (current contract cycle) if available
            if (cycleId && cyclesFound.some(c => c.cycleId === cycleId)) {
              console.log(`✅ Setting selected cycle to prop cycleId: ${cycleId}`);
              setSelectedCycle(cycleId);
            } else {
              // Fallback to the latest cycle
              console.log(`✅ Setting selected cycle to latest: ${cyclesFound[0].cycleId}`);
              setSelectedCycle(cyclesFound[0].cycleId);
            }
          }
          return;
        }
      }
      
      // Final fallback: empty array
      console.log('⚠️ No cycles found, using empty array');
      setAvailableCycles([]);
    } catch (error) {
      console.error('Error fetching available cycles:', error);
      setError('Failed to load available cycles');
    }
  }, [cycleId, selectedCycle]);

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
            console.log('🔍 Cycle data received:', {
              cycleId: data.data.cycleId,
              isResolved: data.data.isResolved,
              matchesCount: data.data.matchesCount,
              matches: data.data.matches?.length || 0,
              startTime: data.data.startTime,
              endTime: data.data.endTime
            });
            
            const matches = data.data.matches || [];
            console.log('🔍 Matches array:', matches);
            
            if (matches.length === 0) {
              console.log('⚠️ No matches found for cycle', targetCycleId);
              setError('No matches available for this cycle yet');
            } else {
              setError(null);
            }
            
            setResults(matches);
            setCurrentCycleId(targetCycleId);
            setCycleInfo({
              isResolved: data.data.isResolved || false,
              totalMatches: data.data.matchesCount || matches.length,
              finishedMatches: matches.filter((m: OddysseyMatchWithResult) => m.result?.finished_at).length
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
            // If no backend data available, show empty state with current cycle info
            console.log('⚠️ No backend cycles found, showing empty state for cycle:', targetCycleId);
            setResults([]);
            setCurrentCycleId(targetCycleId || null);
            setCycleInfo({
              isResolved: false,
              totalMatches: 0,
              finishedMatches: 0
            });
          }
        } else {
          throw new Error(`API responded with status: ${response.status}`);
        }
      }
    } catch (err) {
      console.error('❌ Error fetching results:', err);
      
      // Show more specific error messages
      if (err instanceof Error) {
        if (err.message.includes('No cycles found')) {
          setError('No match results available for this cycle yet');
        } else if (err.message.includes('No data in response')) {
          setError('Match results are not yet available');
        } else {
          setError('Failed to load match results');
        }
      } else {
        setError('Failed to load match results');
      }
      
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [cycleId, selectedCycle]);

  useEffect(() => {
    fetchAvailableCycles();
  }, [fetchAvailableCycles]);

  // Update selected cycle when cycleId prop changes
  useEffect(() => {
    if (cycleId) {
      console.log('🔄 Setting selected cycle from prop:', cycleId);
      setSelectedCycle(cycleId);
    }
  }, [cycleId]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'finished':
        return <CheckCircleIcon className="h-5 w-5 text-emerald-400" />;
      case 'live':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500 animate-pulse" />;
      case 'upcoming':
        return <ClockIcon className="h-5 w-5 text-blue-400" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'finished':
        return 'text-emerald-400 bg-emerald-400/15 border-emerald-400/30 shadow-emerald-400/20';
      case 'live':
        return 'text-red-500 bg-red-500/15 border-red-500/30 shadow-red-500/20 animate-pulse';
      case 'upcoming':
        return 'text-blue-400 bg-blue-400/15 border-blue-400/30 shadow-blue-400/20';
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
        // ✅ FIXED: Handle normalized format (Home/Draw/Away, Over/Under) AND legacy format
        switch (outcomeStr) {
          // New normalized format
          case 'Over':
          case 'over':
            return 'Over 2.5';
          case 'Under':
          case 'under':
            return 'Under 2.5';
          // Legacy numeric codes: 1=over, 2=under
          case '1':
            return 'Over 2.5';
          case '2':
            return 'Under 2.5';
          // Legacy single-letter format
          case 'O':
            return 'Over 2.5';
          case 'U':
            return 'Under 2.5';
          default:
            return outcomeStr;
        }
      } else {
        // ✅ FIXED: Handle normalized format (Home/Draw/Away) AND legacy format
        switch (outcomeStr) {
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
          // Legacy single-digit codes: 1=home, 2=draw, 3=away
          case '1':
            return 'Home Win';
          case '2':
          case 'X':
          case 'x':
            return 'Draw';
          case '3':
            return 'Away Win';
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
    // ✅ FIXED: Handle normalized format (Home/Draw/Away, Over/Under) AND legacy format
    switch (outcomeStr) {
      // New normalized format
      case 'Home':
      case 'home':
        return 'text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full text-xs font-semibold';
      case 'Draw':
      case 'draw':
        return 'text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full text-xs font-semibold';
      case 'Away':
      case 'away':
        return 'text-blue-400 bg-blue-400/10 px-2 py-1 rounded-full text-xs font-semibold';
      case 'Over':
      case 'over':
        return 'text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded-full text-xs font-semibold';
      case 'Under':
      case 'under':
        return 'text-purple-400 bg-purple-400/10 px-2 py-1 rounded-full text-xs font-semibold';
      // Legacy single-digit codes
      case '1':
        return 'text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full text-xs font-semibold';
      case '2':
      case 'X':
      case 'x':
        return 'text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full text-xs font-semibold';
      case '3':
        return 'text-blue-400 bg-blue-400/10 px-2 py-1 rounded-full text-xs font-semibold';
      // Legacy single-letter format
      case 'O':
        return 'text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded-full text-xs font-semibold';
      case 'U':
        return 'text-purple-400 bg-purple-400/10 px-2 py-1 rounded-full text-xs font-semibold';
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
      {/* Enhanced Date Picker Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20"
      >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                <CalendarDaysIcon className="h-5 w-5 text-black" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Select Cycle</h3>
                <p className="text-sm text-text-muted">Choose a cycle to view match results</p>
              </div>
            </div>
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="px-6 py-3 bg-gradient-to-r from-primary to-primary/80 text-black rounded-full hover:from-primary/90 hover:to-primary/70 transition-all flex items-center gap-2 shadow-lg font-semibold"
            >
              <CalendarDaysIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Pick Date</span>
              <span className="sm:hidden">📅</span>
            </button>
          </div>

          {/* Enhanced Quick Select Cycle Buttons */}
          <div className="flex flex-wrap gap-3 mb-6">
            {availableCycles.slice(0, 5).map((cycle) => {
              const startDate = new Date(cycle.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              return (
                <button
                  key={cycle.cycleId}
                  onClick={() => {
                    setSelectedCycle(cycle.cycleId);
                    setShowDatePicker(false);
                  }}
                  className={`px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 shadow-lg ${
                    selectedCycle === cycle.cycleId
                      ? 'bg-gradient-to-r from-primary to-primary/80 text-black shadow-primary/30'
                      : 'bg-gradient-to-r from-primary/20 to-primary/10 text-primary hover:from-primary/30 hover:to-primary/20 border border-primary/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-current"></div>
                    <span>Cycle #{cycle.cycleId}</span>
                    <span className="hidden sm:inline text-xs opacity-70">({startDate})</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Enhanced Calendar Picker */}
          <AnimatePresence>
            {showDatePicker && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-primary/20 pt-6"
              >
                <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-xl p-6 border border-primary/20 shadow-xl">
                  {/* Enhanced Calendar Header */}
                  <div className="flex items-center justify-between mb-6">
                    <button
                      onClick={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() - 1))}
                      className="p-3 hover:bg-primary/20 rounded-full transition-all duration-300 hover:scale-110"
                    >
                      <ChevronLeftIcon className="h-5 w-5 text-primary" />
                    </button>
                    <h4 className="text-xl font-bold text-white">{formatMonthYear(pickerMonth)}</h4>
                    <button
                      onClick={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() + 1))}
                      className="p-3 hover:bg-primary/20 rounded-full transition-all duration-300 hover:scale-110"
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
                    className="mt-6 w-full py-3 bg-gradient-to-r from-primary/20 to-primary/10 text-primary rounded-full hover:from-primary/30 hover:to-primary/20 transition-all duration-300 flex items-center justify-center gap-2 font-semibold shadow-lg border border-primary/30"
                  >
                    <XMarkIcon className="h-4 w-4" />
                    Close Calendar
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

      {/* Enhanced Cycle Info */}
      {cycleInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                <TrophyIcon className="h-6 w-6 text-black" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  Cycle #{selectedCycle || currentCycleId || cycleId || 'N/A'}
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                </h3>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-sm text-text-muted">
                    {cycleInfo.finishedMatches}/{cycleInfo.totalMatches} matches finished
                  </p>
                  <div className="w-full max-w-32 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-primary to-primary/70 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(cycleInfo.finishedMatches / cycleInfo.totalMatches) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-semibold shadow-lg ${
              cycleInfo.isResolved 
                ? 'text-emerald-400 bg-emerald-400/20 border border-emerald-400/30 shadow-emerald-400/20' 
                : 'text-amber-400 bg-amber-400/20 border border-amber-400/30 shadow-amber-400/20 animate-pulse'
            }`}>
              {cycleInfo.isResolved ? '✅ Resolved' : '⚡ Active'}
            </div>
          </div>
        </motion.div>
      )}

      {/* Match Results */}
      <div className="space-y-4">
        {results.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 text-center"
          >
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <CalendarDaysIcon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No Matches Available</h3>
              <p className="text-text-muted mb-4">
                {selectedCycle || currentCycleId 
                  ? `No matches found for Cycle #${selectedCycle || currentCycleId}. Matches may not be available yet.`
                  : 'No cycle selected. Please select a cycle to view matches.'
                }
              </p>
              <div className="text-sm text-text-secondary">
                <p>• Matches are typically added when the cycle starts</p>
                <p>• Check back later or try a different cycle</p>
              </div>
            </div>
          </motion.div>
        ) : (
          results.map((match, index) => (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`glass-card p-5 transition-all duration-300 hover:shadow-lg ${
              match.status === 'finished' 
                ? 'bg-gradient-to-r from-emerald-500/5 to-emerald-500/10 border border-emerald-500/20' 
                : match.status === 'live'
                ? 'bg-gradient-to-r from-red-500/5 to-red-500/10 border border-red-500/20 animate-pulse'
                : 'bg-gradient-to-r from-blue-500/5 to-blue-500/10 border border-blue-500/20'
            }`}
          >
            {/* Enhanced Mobile-First Responsive Layout */}
            <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-12 md:gap-6 md:items-center">
              {/* Mobile: Match Header */}
              <div className="flex items-center justify-between md:hidden">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 text-black font-bold text-sm flex items-center justify-center shadow-lg">
                  {match.display_order}
                </div>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg ${getStatusColor(match.status)}`}>
                  {getStatusIcon(match.status)}
                  <span className="capitalize">{match.status}</span>
                </div>
              </div>

              {/* Desktop: Match Number */}
              <div className="hidden md:block md:col-span-1 text-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 text-black font-bold text-lg flex items-center justify-center mx-auto shadow-lg">
                  {match.display_order}
                </div>
              </div>

              {/* Enhanced Teams Section */}
              <div className="md:col-span-4">
                <div className="text-center md:text-left">
                  <div className="text-lg font-bold text-white mb-1 truncate">{match.home_team}</div>
                  <div className="text-sm text-primary font-semibold mb-1">VS</div>
                  <div className="text-lg font-bold text-white mb-2 truncate">{match.away_team}</div>
                  <div className="text-xs text-text-muted bg-gray-800/50 px-2 py-1 rounded-full inline-block">
                    {match.league_name}
                  </div>
                </div>
              </div>

              {/* Desktop: Enhanced Status */}
              <div className="hidden md:block md:col-span-2 text-center">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg ${getStatusColor(match.status)}`}>
                  {getStatusIcon(match.status)}
                  <span className="capitalize">{match.status}</span>
                </div>
              </div>

              {/* Enhanced Score Section */}
              <div className="md:col-span-2 text-center">
                <div className={`text-2xl font-bold ${
                  match.status === 'finished' 
                    ? 'text-emerald-400' 
                    : match.status === 'live'
                    ? 'text-red-400 animate-pulse'
                    : 'text-gray-400'
                }`}>
                  {formatScore(match)}
                </div>
                {match.result.finished_at && (
                  <div className="text-xs text-text-muted mt-1 bg-gray-800/50 px-2 py-1 rounded-full">
                    {new Date(match.result.finished_at).toLocaleTimeString()}
                  </div>
                )}
              </div>

              {/* Enhanced Outcomes Section */}
              <div className="md:col-span-3 text-center space-y-2">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xs text-text-muted font-medium">1X2:</span>
                    <span className={`${getOutcomeColor((match.result.outcome_1x2 || match.result.moneyline) ?? null)}`}>
                      {getOutcomeText((match.result.outcome_1x2 || match.result.moneyline) ?? null, false)}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xs text-text-muted font-medium">O/U:</span>
                    <span className={`${getOutcomeColor((match.result.outcome_ou25 || match.result.overUnder) ?? null)}`}>
                      {getOutcomeText((match.result.outcome_ou25 || match.result.overUnder) ?? null, true)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))
        )}
      </div>

    </div>
  );
}

"use client";

import Button from "@/components/button";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount, useChainId } from "wagmi";
import { toast } from "react-hot-toast";

import { oddysseyService } from "@/services/oddysseyService";
import OddysseyResults from "@/components/OddysseyResults";
import { useOddysseyContract } from "@/services/oddysseyContractService";
import { useOddyssey } from "@/hooks/useOddyssey";
import { useTransactionFeedback, TransactionFeedback } from "@/components/TransactionFeedback";
import { 
  FireIcon, 
  TrophyIcon, 
  ChartBarIcon, 
  CurrencyDollarIcon,
  UsersIcon,
  BoltIcon,
  SparklesIcon,
  ClockIcon,
  EyeIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  UserIcon,
  CalendarIcon,
  TableCellsIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  GiftIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from "@heroicons/react/24/outline";
import { FaSpinner } from "react-icons/fa";

interface Pick {
  id: number;
  time: string;
  match: string;
  pick: "home" | "draw" | "away" | "over" | "under";
  odd: number;
  team1: string;
  team2: string;
  // Slip metadata
  slipId?: number;
  cycleId?: number;
  finalScore?: number;
  correctCount?: number;
  isEvaluated?: boolean;
  placedAt?: string;
  status?: string;
  totalOdds?: number;
  potentialPayout?: number;
  leaderboardRank?: number;
  prizeClaimed?: boolean;
  // Evaluation fields
  isCorrect?: boolean | null;
  actualResult?: string;
  matchResult?: {
    homeScore?: number;
    awayScore?: number;
    result?: string;
    status?: string;
  };
}

interface Match {
  id: number;
  fixture_id: number;
  home_team: string;
  away_team: string;
  match_date: string;
  league_name: string;
  home_odds: number | null;
  draw_odds: number | null;
  away_odds: number | null;
  over_odds?: number | null;
  under_odds?: number | null;
  market_type: string;
  display_order: number;
}

interface MatchesData {
  today: {
    date: string;
    matches: Match[];
  };
  yesterday?: {
    date: string;
    matches: Match[];
  };
}

interface Stats {
  totalPlayers: number;
  prizePool: string;
  completedSlips: string;
  averageOdds: string;
  totalCycles: number;
  activeCycles: number;
  avgPrizePool: number;
  winRate: number;
  avgCorrect: number;
}

interface CurrentPrizePool {
  cycleId: number | null;
  prizePool: string;
  formattedPrizePool: string;
  matchesCount: number;
  isActive: boolean;
}

interface DailyStats {
  date: string;
  dailyPlayers: number;
  dailySlips: number;
  avgCorrectToday: number;
  currentCycleId: number | null;
  currentPrizePool: string;
}

interface UserStats {
  totalSlips: number;
  totalWins: number;
  bestScore: number;
  averageScore: number;
  winRate: number;
  currentStreak: number;
  bestStreak: number;
  lastActiveCycle: number;
}

// Default entry fee - will be updated with contract value
const DEFAULT_ENTRY_FEE = "0.5";

export default function OddysseyPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
    const {
    placeSlip, 
    isPending, 
    isSuccess, 
    isConfirming, 
    error, 
    hash, 
    contractEntryFee, 
    currentCycleId, 
    currentMatches,
    isInitialized,
    isInitializing,
    refetchAll,
    resetTransactionState
  } = useOddysseyContract();
  
  // Add useOddyssey hook for prize claiming
  const {
    claimPrize,
    isPending: isClaimPending,
    isConfirming: isClaimConfirming
  } = useOddyssey();
  
  // Enhanced transaction feedback system
  const { transactionStatus, showSuccess, showError, showInfo, showPending, showConfirming, clearStatus } = useTransactionFeedback();
  
  // Custom clear function that also resets transaction state
  const handleModalClose = useCallback(() => {
    clearStatus();
    resetTransactionState();
  }, [clearStatus, resetTransactionState]);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [slips, setSlips] = useState<Pick[][]>([]);
  const [activeTab, setActiveTab] = useState<"today" | "slips" | "stats" | "results">("today");
  const [selectedDate, setSelectedDate] = useState<"yesterday" | "today">("today");
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchesData, setMatchesData] = useState<MatchesData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [currentPrizePool, setCurrentPrizePool] = useState<CurrentPrizePool | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [collapsedSlips, setCollapsedSlips] = useState<Set<number>>(new Set());
  const [teamNamesCache, setTeamNamesCache] = useState<Map<number, {home: string, away: string}>>(new Map());
  
  // Helper function to toggle slip collapse
  const toggleSlipCollapse = (slipIndex: number) => {
    setCollapsedSlips(prev => {
      const newSet = new Set(prev);
      if (newSet.has(slipIndex)) {
        newSet.delete(slipIndex);
      } else {
        newSet.add(slipIndex);
      }
      return newSet;
    });
  };

  // Function to fetch team names for match IDs
  const fetchTeamNames = useCallback(async (matchIds: number[]) => {
    try {
      // Filter out match IDs we already have
      const missingIds = matchIds.filter(id => !teamNamesCache.has(id));
      if (missingIds.length === 0) return;

      // Fetch fixtures data using batch endpoint
      const response = await fetch('https://bitredict-backend.fly.dev/api/oddyssey/batch-fixtures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matchIds: missingIds }),
      });

      let results: { matchId: number; home: string; away: string; }[] = [];
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          results = missingIds.map(matchId => ({
            matchId,
            home: data.data[matchId]?.home_team || `Home Team ${matchId}`,
            away: data.data[matchId]?.away_team || `Away Team ${matchId}`
          }));
        } else {
          // Fallback if batch endpoint fails
          results = missingIds.map(matchId => ({
            matchId,
            home: `Home Team ${matchId}`,
            away: `Away Team ${matchId}`
          }));
        }
      } else {
        // Fallback if request fails
        results = missingIds.map(matchId => ({
          matchId,
          home: `Home Team ${matchId}`,
          away: `Away Team ${matchId}`
        }));
      }
      
      // Update cache
      setTeamNamesCache(prev => {
        const newCache = new Map(prev);
        results.forEach(result => {
          newCache.set(result.matchId, { home: result.home, away: result.away });
        });
        return newCache;
      });

    } catch (error) {
      console.error('Error fetching team names:', error);
    }
  }, [teamNamesCache]);
  
  // Helper function to get enhanced slip status
  const getSlipStatusInfo = (firstPick: unknown) => {
    if (!firstPick || typeof firstPick !== 'object') {
      return { 
        text: 'Pending Evaluation', 
        color: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20', 
        icon: ClockIcon 
      };
    }
    
    const pick = firstPick as {
      isEvaluated?: boolean;
      leaderboardRank?: number;
      prizeClaimed?: boolean;
    };
    
    if (!pick.isEvaluated) {
      return { 
        text: 'Pending Evaluation', 
        color: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20', 
        icon: ClockIcon 
      };
    }
    
    const leaderboardRank = pick.leaderboardRank;
    if (leaderboardRank && leaderboardRank <= 5) {
      if (pick.prizeClaimed) {
        return { 
          text: 'Prize Claimed', 
          color: 'bg-green-500/10 text-green-400 border border-green-500/20', 
          icon: CheckCircleIcon 
        };
      } else {
        return { 
          text: `🏆 Winner! Rank #${leaderboardRank}`, 
          color: 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 text-yellow-400 border border-yellow-500/30 animate-pulse-glow', 
          icon: TrophyIcon 
        };
      }
    }
    
    return { 
      text: 'Evaluated', 
      color: 'bg-blue-500/10 text-blue-400 border border-blue-500/20', 
      icon: CheckCircleIcon 
    };
  };
  
  // Helper function to calculate prize amount
  const calculatePrizeAmount = (rank: number, prizePool: number = 50) => {
    if (rank < 1 || rank > 5) return '0';
    const percentages = [40, 30, 20, 5, 5]; // 1st, 2nd, 3rd, 4th, 5th
    const percentage = percentages[rank - 1];
    return ((prizePool * percentage) / 100).toFixed(2);
  };
  
  // Handle prize claiming
  const handleClaimPrize = async (cycleId: number, slipId: number) => {
    try {
      showPending('Claiming prize...', 'info');
      await claimPrize(cycleId);
      showSuccess(`Prize claim initiated for Slip #${slipId}!`, 'success');
      // Refresh slips data
      await fetchUserSlips();
    } catch (error) {
      console.error('Prize claim error:', error);
      showError('Failed to claim prize. Please try again.', 'error');
    }
  };
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);
  const [hasStartedMatches, setHasStartedMatches] = useState(false);
  const [backendSubmissionInProgress, setBackendSubmissionInProgress] = useState(false);
  const [apiCallInProgress, setApiCallInProgress] = useState(false);
  const [lastSubmissionTime, setLastSubmissionTime] = useState(0);
  const picksRef = useRef<Pick[]>([]);
  
  // Date filtering state for My Slips tab
  const [slipDateFilter, setSlipDateFilter] = useState({
    startDate: '',
    endDate: ''
  });

  // Debug chainId changes and clear network errors when correct
  useEffect(() => {
    console.log('🔗 Chain ID changed:', chainId);
    
    // Clear any network errors if we're on the correct network
    if (isConnected && chainId === 50312) {
      console.log('✅ On correct network, clearing any network errors');
      // The error will be cleared automatically by the transaction feedback system
    }
  }, [chainId, isConnected]);

  // Enhanced transaction state monitoring with better feedback
  useEffect(() => {
    if (isPending) {
      showPending("Wallet Confirmation Required", "Please open your wallet and confirm the transaction to place your slip");
    }
  }, [isPending, showPending]);

  useEffect(() => {
    if (isConfirming) {
      showConfirming("Processing Transaction", "Your slip is being processed on the blockchain. This may take a few moments...", hash || undefined);
    }
  }, [isConfirming, showConfirming, hash]);

  useEffect(() => {
    if (isSuccess && hash) {
      showSuccess(
        "Slip Placed Successfully!", 
        "Your predictions have been submitted to the blockchain and are now active in the competition",
        hash
      );
      // Don't reset picks here - let the backend submission handle it
      // Note: Auto-close is handled by the TransactionFeedback component
    }
  }, [isSuccess, hash, showSuccess]);

  useEffect(() => {
    if (error) {
      showError("Transaction Failed", error.message || "Failed to place slip. Please try again or check your wallet connection.");
    }
  }, [error, showError]);

  // Fetch matches data using the service
  const fetchMatches = useCallback(async () => {
    if (apiCallInProgress) return; // Prevent multiple simultaneous calls
    
    try {
      setApiCallInProgress(true);
      setIsLoading(true);
      console.log('🎯 Fetching Oddyssey matches...');
      
      const result = await oddysseyService.getMatches();
      
      if (result.data) {
        console.log('✅ Matches data received:', result.data);
        setMatchesData(result.data as MatchesData);
      } else {
        console.warn('⚠️ No matches data received');
        setMatchesData(null);
      }
    } catch (error) {
      console.error('❌ Error fetching matches:', error);
      toast.error('Failed to fetch matches');
      setMatchesData(null);
    } finally {
      setIsLoading(false);
      setApiCallInProgress(false);
    }
  }, [apiCallInProgress]);

  // Fetch current prize pool and daily stats
  const fetchCurrentData = useCallback(async () => {
    if (apiCallInProgress) return;
    
    try {
      setApiCallInProgress(true);
      console.log('💰 Fetching current prize pool and daily stats...');
      
      const [prizePoolResult, dailyStatsResult] = await Promise.all([
        oddysseyService.getCurrentPrizePool(),
        oddysseyService.getDailyStats()
      ]);
      
      if (prizePoolResult.data) {
        console.log('✅ Current prize pool received:', prizePoolResult.data);
        setCurrentPrizePool(prizePoolResult.data);
      }
      
      if (dailyStatsResult.data) {
        console.log('✅ Daily stats received:', dailyStatsResult.data);
        setDailyStats(dailyStatsResult.data);
      }
      
    } catch (error) {
      console.error('❌ Error fetching current data:', error);
    } finally {
      setApiCallInProgress(false);
    }
  }, [apiCallInProgress]);

  // Fetch stats using the service
  const fetchStats = useCallback(async () => {
    if (apiCallInProgress) return; // Prevent multiple simultaneous calls
    
    try {
      setApiCallInProgress(true);
      console.log('🎯 Fetching Oddyssey stats...');
      
      const [globalStatsResult, userStatsResult] = await Promise.all([
        oddysseyService.getStats('global'),
        address ? oddysseyService.getStats('user', address) : null
      ]);

      if (globalStatsResult.data) {
        console.log('✅ Global stats received:', globalStatsResult.data);
        setStats({
          totalPlayers: globalStatsResult.data.totalPlayers || 1234,
          prizePool: `${globalStatsResult.data.avgPrizePool || 5.2} STT`,
          completedSlips: globalStatsResult.data.totalSlips?.toLocaleString() || "2,847",
          averageOdds: `${globalStatsResult.data.avgCorrect || 8.7}x`,
          totalCycles: globalStatsResult.data.totalCycles || 127,
          activeCycles: globalStatsResult.data.activeCycles || 3,
          avgPrizePool: globalStatsResult.data.avgPrizePool || 5.2,
          winRate: globalStatsResult.data.winRate || 23.4,
          avgCorrect: globalStatsResult.data.avgCorrect || 8.7
        });
      } else {
        console.warn('⚠️ No global stats received, using defaults');
        setStats({
          totalPlayers: 1234,
          prizePool: "5.2 STT",
          completedSlips: "2,847",
          averageOdds: "8.7x",
          totalCycles: 127,
          activeCycles: 3,
          avgPrizePool: 5.2,
          winRate: 23.4,
          avgCorrect: 8.7
        });
      }

      if (userStatsResult?.data) {
        console.log('✅ User stats received:', userStatsResult.data);
        setUserStats(userStatsResult.data);
      } else {
        console.warn('⚠️ No user stats received, using defaults');
        setUserStats({
          totalSlips: 0,
          totalWins: 0,
          bestScore: 0,
          averageScore: 0,
          winRate: 0,
          currentStreak: 0,
          bestStreak: 0,
          lastActiveCycle: 0
        });
      }
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
      // Set default stats on error
      setStats({
        totalPlayers: 1234,
        prizePool: "5.2 STT",
        completedSlips: "2,847",
        averageOdds: "8.7x",
        totalCycles: 127,
        activeCycles: 3,
        avgPrizePool: 5.2,
        winRate: 23.4,
        avgCorrect: 8.7
      });
      setUserStats({
        totalSlips: 0,
        totalWins: 0,
        bestScore: 0,
        averageScore: 0,
        winRate: 0,
        currentStreak: 0,
        bestStreak: 0,
        lastActiveCycle: 0
      });
    } finally {
      setApiCallInProgress(false);
    }
  }, [address, apiCallInProgress]);

  // Fetch current cycle and match results
  const fetchCurrentCycle = useCallback(async () => {
    if (apiCallInProgress) return; // Prevent multiple simultaneous calls
    
    try {
      setApiCallInProgress(true);
      console.log('🎯 Fetching current cycle...');
      
      const result = await oddysseyService.getCurrentCycle();
      
      if (result.cycle) {
        console.log('✅ Current cycle received:', result.cycle);
        
        // If cycle is resolved, fetch match results
        if (result.cycle.is_resolved && result.cycle.matches) {
          const matchIds = result.cycle.matches.map((match: { id: number }) => match.id);
          const liveMatchesResult = await oddysseyService.getLiveMatches(matchIds);
          
          if (liveMatchesResult.matches) {
            console.log('✅ Match results received:', liveMatchesResult.matches);
            // TODO: Implement match results display when needed
          }
        }
      } else {
        console.warn('⚠️ No active cycle found');
      }
    } catch (error) {
      console.error('❌ Error fetching current cycle:', error);
    } finally {
      setApiCallInProgress(false);
    }
  }, [apiCallInProgress]);

  // Fetch user slips using the service
  const fetchUserSlips = useCallback(async () => {
    if (!address || apiCallInProgress) return;
    
    try {
      setApiCallInProgress(true);
      console.log('🎯 Fetching user slips for address:', address);
      
      const result = await oddysseyService.getUserSlips(address);
      
      if (result.success && result.data && result.data.length > 0) {
        console.log('✅ User slips received:', result.data);
        
        // Convert backend slip format to frontend format with enhanced data
        const convertedSlips = result.data.map((slip: unknown) => {
          // Type guard to ensure slip is an object with predictions
          if (!slip || typeof slip !== 'object' || !('predictions' in slip)) {
            return [];
          }
          
          const slipObj = slip as { 
            predictions?: unknown[];
            slip_id?: number;
            cycle_id?: number;
            final_score?: number;
            correct_count?: number;
            is_evaluated?: boolean;
            submitted_time?: string;
            placed_at?: string;
            status?: string;
            total_odds?: number;
          };
          
          // Handle different prediction formats from the API
          const predictions = Array.isArray(slipObj.predictions) ? slipObj.predictions : [];
          
          return predictions.map((pred: unknown) => {
            // Type guard for prediction object
            if (!pred || typeof pred !== 'object') {
              return null;
            }
            
            const predObj = pred as {
              match_id?: number | string;
              matchId?: number | string;
              id?: number | string;
              prediction?: string;
              selection?: string;
              betType?: string;
              odds?: number;
              selectedOdd?: number;
              odd?: number;
              home_team?: string;
              away_team?: string;
              match_time?: string;
              match_date?: string;
              league_name?: string;
              status?: string;
              isCorrect?: boolean;
              actualResult?: string;
              matchResult?: {
                homeScore?: number;
                awayScore?: number;
                result?: string;
                status?: string;
              };
            };
            
            // Handle different prediction object structures
            const matchId = Number(predObj.match_id || predObj.matchId || predObj.id || 0);
            const prediction = String(predObj.prediction || predObj.selection || predObj.betType || "1");
            const odds = Number(predObj.odds || predObj.selectedOdd || predObj.odd || 1);
            
            // Get team names - use cached data if available, otherwise use backend data
            let homeTeam = predObj.home_team || `Team ${matchId}`;
            let awayTeam = predObj.away_team || `Team ${matchId}`;
            
            // Check if we have cached team names
            const cachedTeams = teamNamesCache.get(matchId);
            if (cachedTeams) {
              homeTeam = cachedTeams.home;
              awayTeam = cachedTeams.away;
            } else if (homeTeam.startsWith('Home Team ') || homeTeam.startsWith('Team ')) {
              // Use generic names for now, will be updated when cache is populated
              homeTeam = `Home Team ${matchId}`;
              awayTeam = `Away Team ${matchId}`;
            }
            
            // Use enhanced match time from backend, fallback to calculated time
            let matchTime = predObj.match_time || '00:00';
            if (!predObj.match_time && predObj.match_date) {
              const matchDate = new Date(predObj.match_date);
              matchTime = matchDate.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              });
            }
            
            // Determine pick type based on prediction value
            let pick: "home" | "draw" | "away" | "over" | "under" = "home";
            if (prediction === "X" || prediction === "draw") pick = "draw";
            else if (prediction === "2" || prediction === "away") pick = "away";
            else if (prediction === "Over" || prediction === "over" || prediction === "O2.5") pick = "over";
            else if (prediction === "Under" || prediction === "under" || prediction === "U2.5") pick = "under";
            
            return {
              id: matchId,
              time: matchTime,
              match: `${homeTeam} vs ${awayTeam}`,
              pick: pick,
              odd: odds,
              team1: homeTeam,
              team2: awayTeam,
              // Add enhanced slip metadata
              slipId: slipObj.slip_id,
              cycleId: slipObj.cycle_id,
              finalScore: slipObj.final_score,
              correctCount: slipObj.correct_count,
              isEvaluated: slipObj.is_evaluated,
              placedAt: slipObj.submitted_time || slipObj.placed_at, // Use enhanced submission time
              status: slipObj.status || (slipObj.is_evaluated ? "Evaluated" : "Pending"),
              totalOdds: slipObj.total_odds,
              // Add evaluation data
              isCorrect: predObj.isCorrect,
              actualResult: predObj.actualResult,
              matchResult: predObj.matchResult
            };
          }).filter(Boolean); // Remove null entries
        });
        
        console.log('🔄 Converted slips:', convertedSlips);
        // Keep slips as separate arrays, filter out empty slips
        const validSlips = convertedSlips.filter(slip => slip.length > 0) as Pick[][];
        setSlips(validSlips);
        
        // Extract all match IDs and fetch team names
        const allMatchIds: number[] = [];
        validSlips.forEach(slip => {
          slip.forEach(pick => {
            if (pick && pick.id) {
              allMatchIds.push(pick.id);
            }
          });
        });
        
        if (allMatchIds.length > 0) {
          fetchTeamNames([...new Set(allMatchIds)]); // Remove duplicates
        }
      } else {
        console.warn('⚠️ No user slips received');
        setSlips([]);
      }
    } catch (error) {
      console.error('❌ Error fetching user slips:', error);
      setSlips([]);
    } finally {
      setApiCallInProgress(false);
    }
  }, [address, apiCallInProgress, fetchTeamNames, teamNamesCache]);

  // Date filter handlers for My Slips tab
  const handleApplyDateFilter = useCallback(async () => {
    if (!address || apiCallInProgress) return;
    
    try {
      setApiCallInProgress(true);
      console.log('🎯 Applying date filter:', slipDateFilter);
      
      const options: { startDate?: string; endDate?: string; limit?: number } = { limit: 50 };
      if (slipDateFilter.startDate) options.startDate = slipDateFilter.startDate;
      if (slipDateFilter.endDate) options.endDate = slipDateFilter.endDate;
      
      const result = await oddysseyService.getUserSlipsWithFilter(address, options);
      
      if (result.success && result.data) {
        console.log('✅ Filtered user slips received:', result.data);
        
        // Convert backend slip format to frontend format (same logic as fetchUserSlips)
        const convertedSlips = result.data.map((slip: unknown) => {
          if (!slip || typeof slip !== 'object' || !('predictions' in slip)) {
            return [];
          }
          
          const slipObj = slip as { 
            predictions?: unknown[];
            slip_id?: number;
            cycle_id?: number;
            final_score?: number;
            correct_count?: number;
            is_evaluated?: boolean;
            submitted_time?: string;
            placed_at?: string;
            status?: string;
            total_odds?: number;
          };
          
          const predictions = Array.isArray(slipObj.predictions) ? slipObj.predictions : [];
          
          return predictions.map((pred: unknown) => {
            if (!pred || typeof pred !== 'object') {
              return null;
            }
            
            const predObj = pred as {
              match_id?: number | string;
              matchId?: number | string;
              id?: number | string;
              prediction?: string;
              selection?: string;
              betType?: string;
              odds?: number;
              selectedOdd?: number;
              odd?: number;
              home_team?: string;
              away_team?: string;
              match_time?: string;
              match_date?: string;
              league_name?: string;
              status?: string;
              isCorrect?: boolean;
              actualResult?: string;
              matchResult?: {
                homeScore?: number;
                awayScore?: number;
                result?: string;
                status?: string;
              };
            };
            
            const matchId = Number(predObj.match_id || predObj.matchId || predObj.id || 0);
            const prediction = String(predObj.prediction || predObj.selection || predObj.betType || "1");
            const odds = Number(predObj.odds || predObj.selectedOdd || predObj.odd || 1);
            
            const homeTeam = predObj.home_team || `Team ${matchId}`;
            const awayTeam = predObj.away_team || `Team ${matchId}`;
            
            let matchTime = predObj.match_time || '00:00';
            if (!predObj.match_time && predObj.match_date) {
              const matchDate = new Date(predObj.match_date);
              matchTime = matchDate.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              });
            }
            
            let pick: "home" | "draw" | "away" | "over" | "under" = "home";
            if (prediction === "X" || prediction === "draw") pick = "draw";
            else if (prediction === "2" || prediction === "away") pick = "away";
            else if (prediction === "Over" || prediction === "over" || prediction === "O2.5") pick = "over";
            else if (prediction === "Under" || prediction === "under" || prediction === "U2.5") pick = "under";
            
            return {
              id: matchId,
              time: matchTime,
              match: `${homeTeam} vs ${awayTeam}`,
              pick: pick,
              odd: odds,
              team1: homeTeam,
              team2: awayTeam,
              slipId: slipObj.slip_id,
              cycleId: slipObj.cycle_id,
              finalScore: slipObj.final_score,
              correctCount: slipObj.correct_count,
              isEvaluated: slipObj.is_evaluated,
              placedAt: slipObj.placed_at || slipObj.submitted_time,
              status: slipObj.status,
              totalOdds: slipObj.total_odds,
              // Add evaluation data
              isCorrect: predObj.isCorrect,
              actualResult: predObj.actualResult,
              matchResult: predObj.matchResult
            };
          }).filter(pred => pred !== null);
        }).filter(slip => slip.length > 0);
        
        setSlips(convertedSlips);
        toast.success(`Found ${convertedSlips.length} slips for the selected date range`);
      } else {
        console.warn('⚠️ No filtered slips found');
        setSlips([]);
        toast('No slips found for the selected date range');
      }
    } catch (error) {
      console.error('❌ Error applying date filter:', error);
      toast.error('Failed to filter slips');
    } finally {
      setApiCallInProgress(false);
    }
  }, [address, slipDateFilter, apiCallInProgress]);

  const handleClearDateFilter = useCallback(async () => {
    setSlipDateFilter({ startDate: '', endDate: '' });
    // Refetch all slips without date filter
    await fetchUserSlips();
    toast.success('Date filter cleared');
  }, [fetchUserSlips]);

  useEffect(() => {
    fetchMatches();
    fetchCurrentCycle();
  }, [fetchMatches, fetchCurrentCycle]); // Include dependencies

  useEffect(() => {
    if (address) {
      fetchStats();
      fetchUserSlips();
      fetchCurrentData();
    }
  }, [address, fetchStats, fetchUserSlips, fetchCurrentData]); // Include dependencies
  
  // Update slips when team names are fetched
  useEffect(() => {
    if (teamNamesCache.size > 0 && slips.length > 0) {
      setSlips(prevSlips => 
        prevSlips.map(slip => 
          slip.map(pick => {
            const cachedTeams = teamNamesCache.get(pick.id);
            if (cachedTeams && (pick.team1.startsWith('Home Team ') || pick.team1.startsWith('Team '))) {
              return {
                ...pick,
                team1: cachedTeams.home,
                team2: cachedTeams.away,
                match: `${cachedTeams.home} vs ${cachedTeams.away}`
              };
            }
            return pick;
          })
        )
      );
    }
  }, [teamNamesCache, slips.length]);
  
  // Winner notification system
  useEffect(() => {
    if (slips?.length > 0) {
      const unclaimedWins = slips.filter(slip => {
        const firstPick = slip[0];
        return firstPick?.isEvaluated && 
               (firstPick?.leaderboardRank ?? 0) <= 5 && 
               (firstPick?.leaderboardRank ?? 0) > 0 && 
               !firstPick?.prizeClaimed;
      });
      
      if (unclaimedWins.length > 0) {
        const totalPrizes = unclaimedWins.length;
        const topRank = Math.min(...unclaimedWins.map(slip => slip[0]?.leaderboardRank ?? 6));
        
        toast.success(
          `🎉 Congratulations! You have ${totalPrizes} unclaimed prize${totalPrizes > 1 ? 's' : ''}! Highest rank: #${topRank}`,
          {
            duration: 8000,
            position: 'top-center',
            style: {
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              color: '#000',
              fontWeight: 'bold',
              borderRadius: '12px',
              padding: '16px 20px'
            },
            icon: '🏆'
          }
        );
      }
    }
  }, [slips]);

  // Enhanced transaction handling with backend synchronization
  useEffect(() => {
    if (isSuccess && hash && !backendSubmissionInProgress) {
      // Prevent rapid submissions - debounce mechanism
      const now = Date.now();
      if (now - lastSubmissionTime < 5000) { // 5 second cooldown
        console.log('🔄 Backend submission skipped due to rate limiting');
        return;
      }
      
      // Transaction confirmed - submit to backend for tracking
      const submitToBackend = async () => {
        try {
          setBackendSubmissionInProgress(true);
          setLastSubmissionTime(now);
          
          // Store predictions before they get reset
          const currentPicks = [...picksRef.current];
          
          // Validate that we have exactly 10 predictions before submitting
          if (currentPicks.length !== 10) {
            console.warn('Invalid number of predictions for backend submission:', currentPicks.length);
            // Reset picks and return without submitting to backend
            setPicks([]);
            return;
          }
          
          const predictions = currentPicks.map(pick => ({
            matchId: pick.id, // This is now fixture_id
            prediction: pick.pick === "home" ? "1" : 
                       pick.pick === "draw" ? "X" : 
                       pick.pick === "away" ? "2" : 
                       pick.pick === "over" ? "Over" : "Under",
            odds: pick.odd
          }));
          
          if (!address) {
            console.warn('No wallet address available for backend submission');
            return;
          }
          
          console.log('🎯 Submitting to backend:', { address, predictionsCount: predictions.length, predictions });
          console.log('🎯 Current picks before submission:', currentPicks);
          
          // Include cycleId in backend submission
          const backendResponse = await oddysseyService.placeSlip(address, predictions, currentCycleId);
          
          if (backendResponse.success) {
            // Add to local slips for immediate UI update
            setSlips(prevSlips => [...prevSlips, currentPicks]);
            
            // Reset picks after successful backend submission
            setPicks([]);
            
            // Delay the refresh calls to avoid rate limiting
            setTimeout(() => {
              fetchStats?.();
              fetchUserSlips?.();
            }, 2000); // 2 second delay
          } else {
            console.warn('Backend submission failed, but blockchain transaction succeeded');
            // Reset picks even if backend fails since blockchain transaction succeeded
            setPicks([]);
          }
        } catch (backendError) {
          console.warn('Backend submission failed:', backendError);
          // Don't show error to user since blockchain transaction succeeded
          // Reset picks even if backend fails since blockchain transaction succeeded
          setPicks([]);
        } finally {
          setBackendSubmissionInProgress(false);
        }
      };
      
      submitToBackend();
    }
  }, [isSuccess, hash, address, currentCycleId, backendSubmissionInProgress, lastSubmissionTime, fetchStats, fetchUserSlips]);

  // Check if any matches have started
  const checkStartedMatches = useCallback((matches: Match[]) => {
    const now = new Date();
    const hasStarted = matches.some(match => {
      const matchStartTime = new Date(match.match_date);
      return matchStartTime <= now;
    });
    setHasStartedMatches(hasStarted);
    return hasStarted;
  }, []);

  // Check if a specific match has started
  const isMatchStarted = useCallback((matchDate: string) => {
    const matchStartTime = new Date(matchDate);
    const now = new Date();
    return matchStartTime <= now;
  }, []);

  // Update matches when date changes
  useEffect(() => {
    if (matchesData) {
      let currentMatches: Match[] = [];
      
      if (selectedDate === "today") {
        currentMatches = matchesData.today.matches.slice(0, 10);
      } else if (selectedDate === "yesterday" && matchesData.yesterday) {
        currentMatches = matchesData.yesterday.matches.slice(0, 10);
      }
      
      setMatches(currentMatches);
      checkStartedMatches(currentMatches);
    }
  }, [selectedDate, matchesData, checkStartedMatches]);

  // Calculate time left based on first match
  const calculateTimeLeft = useCallback(() => {
    if (!matches || matches.length === 0) {
      setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      setIsExpired(true);
      return;
    }

    // Sort matches by time and get the first match
    const sortedMatches = [...matches].sort((a, b) => 
      new Date(a.match_date).getTime() - new Date(b.match_date).getTime()
    );
    const firstMatch = sortedMatches[0];
    
    if (!firstMatch) {
      setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      setIsExpired(true);
      return;
    }

    const now = new Date().getTime();
    const matchTime = new Date(firstMatch.match_date).getTime();
    const timeDifference = matchTime - now;

    if (timeDifference <= 0) {
      setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      setIsExpired(true);
      setHasStartedMatches(true);
    } else {
      const hours = Math.floor(timeDifference / (1000 * 60 * 60));
      const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

        setTimeLeft({ hours, minutes, seconds });
        setIsExpired(false);
      setHasStartedMatches(false);
      }
  }, [matches]);

  useEffect(() => {
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [matches, calculateTimeLeft]); // Include calculateTimeLeft in dependencies

  // Update picksRef whenever picks changes
  useEffect(() => {
    picksRef.current = picks;
  }, [picks]);

  const handlePickSelection = (matchId: number, pick: "home" | "draw" | "away" | "over" | "under") => {
    const match = matches.find(m => m.fixture_id === matchId);
    if (!match) {
      toast.error('Match not found. Please refresh the page and try again.');
      return;
    }

    // Enhanced validation with better error messages
    const matchStartTime = new Date(match.match_date);
    const now = new Date();
    
    if (matchStartTime <= now) {
      toast.error(`Cannot bet on ${match.home_team} vs ${match.away_team} - match has already started`);
      return;
    }

    // Check if we're trying to bet on yesterday's matches
    const matchDate = new Date(match.match_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (matchDate < today) {
      toast.error(`Cannot bet on ${match.home_team} vs ${match.away_team} - match is in the past`);
      return;
    }

    // Remove any existing pick for this match
    const filteredPicks = picks.filter(p => p.id !== matchId);
    
    // Validate odds availability
    let odd = 0;
    let oddsAvailable = true;
    
    switch (pick) {
      case "home":
        odd = match.home_odds || 0;
        if (!match.home_odds) {
          oddsAvailable = false;
          toast.error(`Home win odds not available for ${match.home_team} vs ${match.away_team}`);
        }
        break;
      case "draw":
        odd = match.draw_odds || 0;
        if (!match.draw_odds) {
          oddsAvailable = false;
          toast.error(`Draw odds not available for ${match.home_team} vs ${match.away_team}`);
        }
        break;
      case "away":
        odd = match.away_odds || 0;
        if (!match.away_odds) {
          oddsAvailable = false;
          toast.error(`Away win odds not available for ${match.home_team} vs ${match.away_team}`);
        }
        break;
      case "over":
        odd = match.over_odds || 0;
        if (!match.over_odds) {
          oddsAvailable = false;
          toast.error(`Over 2.5 odds not available for ${match.home_team} vs ${match.away_team}`);
        }
        break;
      case "under":
        odd = match.under_odds || 0;
        if (!match.under_odds) {
          oddsAvailable = false;
          toast.error(`Under 2.5 odds not available for ${match.home_team} vs ${match.away_team}`);
        }
        break;
    }

    if (!oddsAvailable) {
      return;
    }

    // Validate odds value
    if (odd <= 0) {
      toast.error(`Invalid odds (${odd}) for ${pick} on ${match.home_team} vs ${match.away_team}`);
      return;
    }

    if (filteredPicks.length < 10) {
      const newPick: Pick = {
        id: matchId, // matchId is now fixture_id
        time: new Date(match.match_date).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        match: `${match.home_team} vs ${match.away_team}`,
        pick,
        odd,
        team1: match.home_team,
        team2: match.away_team
      };

      setPicks([...filteredPicks, newPick]);
      
      // Enhanced feedback for selection
      const pickLabel = pick === "home" ? "1 (Home Win)" : 
                       pick === "draw" ? "X (Draw)" : 
                       pick === "away" ? "2 (Away Win)" : 
                       pick === "over" ? "Over 2.5" : "Under 2.5";
      
      const remaining = 9 - filteredPicks.length;
      if (remaining > 0) {
        toast.success(`${pickLabel} selected for ${match.home_team} vs ${match.away_team} @ ${odd}. ${remaining} more prediction${remaining !== 1 ? 's' : ''} needed.`);
      } else {
        toast.success(`${pickLabel} selected! Your slip is now complete with all 10 predictions and ready to submit.`);
      }
    } else {
      toast.error('You have already selected 10 predictions. Please remove one to add another.');
    }
  };
  
  const calculatePotentialPayout = (totalOdd: number) => {
    const entryFee = contractEntryFee || DEFAULT_ENTRY_FEE;
    return (parseFloat(entryFee) * (totalOdd || 1)).toFixed(2);
  };

  const handleSubmitSlip = async () => {
    try {
      // Check if contract service is initialized
      if (!isInitialized) {
        showError("Service Not Ready", "Contract service is still initializing. Please wait a moment and try again.");
        return;
      }

      // Validate wallet connection
      if (!isConnected || !address) {
        showError("Wallet Not Connected", "Please connect your wallet to place a slip.");
        return;
      }

      // Check network
      if (!checkNetwork()) {
        return;
      }

      // CRITICAL: Strict validation for exactly 10 predictions
      if (!picks || picks.length !== 10) {
        const missing = 10 - (picks?.length || 0);
        showError("Incomplete Slip", `You must make predictions for ALL 10 matches. Currently selected: ${picks?.length || 0}/10. Please select ${missing} more prediction${missing !== 1 ? 's' : ''}.`);
        return;
      }

      // Check if we have contract data
      if (!currentMatches || !Array.isArray(currentMatches) || currentMatches.length !== 10) {
        if (!isInitialized) {
          showError("Service Not Ready", "Contract service is still initializing. Please wait a moment and try again.");
        } else if (!isConnected) {
          showError("Wallet Not Connected", "Please connect your wallet to access contract data.");
        } else if (currentMatches.length === 0) {
          showError("Contract Connection Issue", "Unable to fetch matches from contract. Please check your network connection and ensure you're on the Somnia Network.");
        } else {
          showError("Contract Error", `Expected 10 matches but found ${currentMatches.length}. Please wait for the next cycle or refresh the page.`);
        }
        return;
      }

      // CRITICAL: Validate that we have predictions for ALL available matches
      if (!matches || matches.length < 10) {
        showError("Insufficient Matches", `Only ${matches?.length || 0} matches available. Need exactly 10 matches to place a slip. Please try refreshing the page.`);
        return;
      }

      // CRITICAL: Ensure each match has a prediction
      const matchIds = matches.slice(0, 10).map(m => m.fixture_id);
      const predictionMatchIds = picks.map(p => p.id);
      const missingPredictions = matchIds.filter(id => !predictionMatchIds.includes(id));
      
      if (missingPredictions.length > 0) {
        showError("Missing Predictions", `You must make predictions for ALL 10 matches. Missing predictions for ${missingPredictions.length} match${missingPredictions.length !== 1 ? 'es' : ''}.`);
        return;
      }

      // Check if any selected matches have started
      const now = new Date();
      const hasStartedMatch = picks.some(pick => {
        const match = matches.find(m => m.fixture_id === pick.id);
        if (!match) return false;
        const matchStartTime = new Date(match.match_date);
        return matchStartTime <= now;
      });

      if (hasStartedMatch) {
        showError("Invalid Selection", "Cannot submit slip with matches that have already started. Please refresh and select only upcoming matches.");
        return;
      }

      // Check if transaction is already pending
      if (isPending || isConfirming) {
        showInfo("Transaction in Progress", "Please wait for the current transaction to complete before submitting another slip.");
        return;
      }

      // Show initial feedback
      showInfo("Preparing Transaction", "Validating your slip and preparing the transaction...");

      console.log('🎯 Submitting slip with picks:', picks);
      console.log('📊 Contract cycle ID:', currentCycleId);
      console.log('🏆 Contract matches:', currentMatches);
      
      // Format predictions for contract with proper validation
      const predictions = picks.map((pick, index) => {
        // Validate pick data
        if (!pick.id || !pick.pick || !pick.odd) {
          throw new Error(`Invalid pick data at position ${index + 1}`);
        }

        // Convert pick to contract format
        let prediction: string;
        switch (pick.pick) {
          case "home":
            prediction = "1";
            break;
          case "draw":
            prediction = "X";
            break;
          case "away":
            prediction = "2";
            break;
          case "over":
            prediction = "Over";
            break;
          case "under":
            prediction = "Under";
            break;
          default:
            throw new Error(`Invalid pick type: ${pick.pick} at position ${index + 1}`);
        }

        return {
          matchId: pick.id, // This is now fixture_id
          prediction,
          odds: pick.odd
        };
      });

      console.log('📝 Formatted predictions:', predictions);
      const actualEntryFee = contractEntryFee || DEFAULT_ENTRY_FEE;
      console.log('💰 Entry fee from contract:', actualEntryFee);

      // Submit to contract with enhanced error handling
      await placeSlip(predictions, actualEntryFee);
      
      console.log('✅ Slip submission initiated');
      // Transaction feedback will be handled by useEffect watching transaction state
    } catch (error) {
      console.error('❌ Error submitting slip:', error);
      const errorMessage = (error as Error).message || "Failed to submit slip";
      
      // Provide more specific error messages based on the error type
      if (errorMessage.includes("insufficient funds")) {
        showError("Insufficient Funds", "You don't have enough STT tokens to place this slip. Please check your wallet balance.");
      } else if (errorMessage.includes("user rejected") || errorMessage.includes("cancelled")) {
        showError("Transaction Cancelled", "You cancelled the transaction in your wallet. No charges were made.");
      } else if (errorMessage.includes("gas")) {
        showError("Gas Error", "There was an issue with gas estimation. Please try again or check your wallet settings.");
      } else if (errorMessage.includes("execution reverted")) {
        showError("Contract Error", "The transaction failed on the blockchain. This might be due to invalid predictions or contract state. Please check your selections and try again.");
      } else if (errorMessage.includes("validation failed")) {
        showError("Validation Error", errorMessage);
      } else if (errorMessage.includes("No active matches")) {
        showError("No Active Cycle", "There are no active matches in the contract. Please wait for the next cycle to begin.");
      } else if (errorMessage.includes("Missing prediction")) {
        showError("Missing Predictions", errorMessage);
      } else if (errorMessage.includes("Duplicate prediction")) {
        showError("Duplicate Predictions", errorMessage);
      } else if (errorMessage.includes("Invalid prediction")) {
        showError("Invalid Prediction", errorMessage);
      } else {
        showError("Submission Failed", errorMessage);
      }
    }
  };



  // Manual refresh function for when rate limiting occurs
  const handleManualRefresh = useCallback(async () => {
    if (apiCallInProgress) {
      toast.error('Please wait, a refresh is already in progress');
      return;
    }
    
    try {
      toast.success('Refreshing data...');
      await Promise.all([
        fetchMatches(),
        fetchCurrentCycle(),
        fetchStats(),
        address ? fetchUserSlips() : Promise.resolve()
      ]);
      toast.success('Data refreshed successfully!');
    } catch (error) {
      console.error('❌ Error during manual refresh:', error);
      toast.error('Failed to refresh data. Please try again later.');
    }
  }, [fetchMatches, fetchCurrentCycle, fetchStats, fetchUserSlips, address, apiCallInProgress]);



  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getDateTabLabel = (tab: "yesterday" | "today") => {
    const today = new Date();
    const targetDate = new Date(today);
    
    if (tab === "yesterday") {
      targetDate.setDate(today.getDate() - 1);
    }
    
    return {
      label: tab.charAt(0).toUpperCase() + tab.slice(1),
      date: formatDate(targetDate.toISOString())
    };
  };

  // Add network check
  const checkNetwork = useCallback(() => {
    // Only check network if wallet is connected
    if (!isConnected) {
      console.log('⏳ Wallet not connected, skipping network check');
      return true; // Don't show error if wallet is not connected
    }
    
    // Handle case where chainId is undefined (wallet not connected or still loading)
    if (chainId === undefined) {
      console.log('⏳ Chain ID not yet available, skipping network check');
      return true; // Don't show error if chainId is not available yet
    }
    
    // Use Wagmi chainId instead of window.ethereum.chainId
    if (chainId !== 50312) { // Somnia Network chain ID in decimal
      console.log(`❌ Wrong network detected: ${chainId}, expected: 50312`);
      showError("Wrong Network", "Please switch to Somnia Network to use Oddyssey. Current network is not supported.");
      return false;
    }
    
    console.log('✅ Network check passed: Somnia Network detected');
    return true;
  }, [chainId, isConnected, showError]);

  // Add retry mechanism for contract data
  const retryContractData = useCallback(async () => {
    if (!isConnected || !address) {
      showError("Wallet Not Connected", "Please connect your wallet first.");
      return;
    }
    
    // Check network first
    if (!checkNetwork()) {
      return;
    }
    
    try {
      showInfo("Retrying Contract Connection", "Attempting to reconnect to the contract...");
      
      // Force re-initialization
      if (refetchAll) {
        await refetchAll();
        showSuccess("Connection Successful", "Contract data has been refreshed successfully.");
      }
    } catch (error) {
      console.error('❌ Error retrying contract data:', error);
      showError("Retry Failed", "Failed to reconnect to contract. Please check your network connection.");
    }
  }, [isConnected, address, refetchAll, checkNetwork, showError, showInfo, showSuccess]);

  // Helper function to format odds correctly (contract uses 1000x scaling)
  const formatOdds = (odds: number) => {
    // Backend already sends correct odds, no need to divide by 1000
    return odds.toFixed(2);
  };



  // Helper function to calculate total odds correctly
  const calculateTotalOdds = (picks: Pick[]) => {
    const total = picks.reduce((acc, pick) => acc * (pick.odd || 1), 1);
    return total.toFixed(2);
  };

  // Updated totalOdd calculation
  const totalOdd = calculateTotalOdds(picks);

  return (
    <div className="min-h-screen bg-gradient-main text-white">
      {/* Enhanced Transaction Feedback */}
      <TransactionFeedback
        status={transactionStatus}
        onClose={handleModalClose}
        autoClose={true}
        autoCloseDelay={5000}
        showProgress={true}
      />
      
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 relative"
        >
          {/* Floating background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div 
              className="absolute top-[20%] left-[15%] w-6 h-6 bg-primary/20 rounded-full blur-sm"
              animate={{ y: [-10, 10, -10], x: [-5, 5, -5], scale: [1, 1.2, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div 
              className="absolute top-[60%] right-[20%] w-4 h-4 bg-secondary/30 rounded-full blur-sm"
              animate={{ y: [10, -10, 10], x: [5, -5, 5], scale: [1, 1.3, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
            <motion.div 
              className="absolute bottom-[30%] left-[70%] w-5 h-5 bg-accent/25 rounded-full blur-sm"
              animate={{ y: [-8, 8, -8], x: [-3, 3, -3], scale: [1, 1.1, 1] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            />
          </div>

          <div className="relative z-10 mb-8">
            <div className="flex items-center justify-center gap-6 mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <FireIcon className="h-12 w-12 text-primary" />
              </motion.div>
              <h1 className="text-5xl md:text-6xl font-bold gradient-text">
                ODDYSSEY
              </h1>
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <SparklesIcon className="h-12 w-12 text-secondary" />
              </motion.div>
            </div>
            
            <div className="mx-auto mb-6 h-1 w-64 bg-gradient-somnia rounded-full opacity-60"></div>
            
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              The ultimate prediction challenge. Select outcomes for 10 matches, compete with the highest odds, and claim your share of the prize pool.
            </p>
          </div>
        </motion.div>

        {/* Contract Initialization Status */}
        {isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            {isInitializing && (
              <div className="glass-card p-4 text-center">
                <div className="flex items-center justify-center gap-3">
                  <FaSpinner className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-lg font-semibold text-text-secondary">
                    Initializing contract connection...
                  </span>
                </div>
                <p className="text-sm text-text-muted mt-2">
                  Please wait while we connect to the blockchain
                </p>
              </div>
            )}
            
            {!isInitialized && !isInitializing && (
              <div className="glass-card p-4 text-center border border-red-500/30">
                <div className="flex items-center justify-center gap-3">
                  <ShieldCheckIcon className="h-5 w-5 text-red-400" />
                  <span className="text-lg font-semibold text-red-400">
                    Contract connection failed
                  </span>
                </div>
                <p className="text-sm text-text-muted mt-2">
                  Please refresh the page or check your wallet connection
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Stats Cards */}
        {/* Current Prize Pool - Prominent Display */}
        {currentPrizePool && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8"
          >
            <div className="glass-card text-center p-8 border-2 border-primary/30">
              <div className="flex items-center justify-center mb-4">
                <GiftIcon className="h-16 w-16 text-primary mr-4" />
                <div>
                  <h2 className="text-4xl font-bold text-white mb-2">
                    {currentPrizePool.formattedPrizePool}
                  </h2>
                  <p className="text-xl font-semibold text-primary">Current Prize Pool</p>
                  <p className="text-sm text-text-muted">
                    Cycle {currentPrizePool.cycleId} • {currentPrizePool.matchesCount} Matches
                  </p>
                </div>
              </div>
              {currentPrizePool.isActive && (
                <div className="flex items-center justify-center text-green-400">
                  <BoltIcon className="h-5 w-5 mr-2" />
                  <span className="font-semibold">Active Cycle - Place Your Slips Now!</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Daily Stats */}
        {dailyStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <div className="glass-card text-center p-4">
              <UsersIcon className="h-10 w-10 mx-auto mb-3 text-secondary" />
              <h3 className="text-2xl font-bold text-white mb-1">{dailyStats.dailyPlayers}</h3>
              <p className="text-lg font-semibold text-text-secondary">Players Today</p>
            </div>
            
            <div className="glass-card text-center p-4">
              <DocumentTextIcon className="h-10 w-10 mx-auto mb-3 text-accent" />
              <h3 className="text-2xl font-bold text-white mb-1">{dailyStats.dailySlips}</h3>
              <p className="text-lg font-semibold text-text-secondary">Slips Today</p>
            </div>
            
            <div className="glass-card text-center p-4">
              <ChartBarIcon className="h-10 w-10 mx-auto mb-3 text-green-400" />
              <h3 className="text-2xl font-bold text-white mb-1">{dailyStats.avgCorrectToday.toFixed(1)}</h3>
              <p className="text-lg font-semibold text-text-secondary">Avg Correct Today</p>
            </div>
          </motion.div>
        )}

        {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8"
        >
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                className="glass-card text-center p-4"
              >
              <CurrencyDollarIcon className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-2xl font-bold text-white mb-1">{stats.prizePool}</h3>
              <p className="text-lg font-semibold text-text-secondary mb-1">Average Prize Pool</p>
              <p className="text-sm text-text-muted">Per cycle</p>
              </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="glass-card text-center p-4"
            >
              <UsersIcon className="h-12 w-12 mx-auto mb-4 text-secondary" />
              <h3 className="text-2xl font-bold text-white mb-1">{stats.totalPlayers.toLocaleString()}</h3>
              <p className="text-lg font-semibold text-text-secondary mb-1">Total Players</p>
              <p className="text-sm text-text-muted">All-time</p>
        </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="glass-card text-center p-4"
            >
              <TrophyIcon className="h-12 w-12 mx-auto mb-4 text-accent" />
                              <h3 className="text-2xl font-bold text-white mb-1">{(stats.winRate || 0).toFixed(1)}%</h3>
              <p className="text-lg font-semibold text-text-secondary mb-1">Win Rate</p>
              <p className="text-sm text-text-muted">Average</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="glass-card text-center p-4"
            >
              <EyeIcon className="h-12 w-12 mx-auto mb-4 text-green-400" />
              <h3 className="text-2xl font-bold text-white mb-1">{stats.avgCorrect}x</h3>
              <p className="text-lg font-semibold text-text-secondary mb-1">Average Odds</p>
              <p className="text-sm text-text-muted">Successful slips</p>
            </motion.div>
          </motion.div>
        )}

        {/* Countdown Timer */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-card text-center p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-primary flex items-center gap-2">
              <ClockIcon className="h-6 w-6" />
              {matches && matches.length > 0 ? (
                <>
              Betting Closes In
                  <span className="text-sm font-normal text-text-secondary ml-2">
                    (First match: {matches.sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())[0]?.home_team} vs {matches.sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())[0]?.away_team})
                  </span>
                </>
              ) : (
                "Betting Closes In"
              )}
            </h3>
            
            {/* Refresh Button */}
            <button
              onClick={handleManualRefresh}
              disabled={apiCallInProgress}
              className="flex items-center gap-2 px-3 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {apiCallInProgress ? (
                <FaSpinner className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowPathIcon className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">Refresh</span>
            </button>
          </div>
          {isExpired ? (
            <div className="text-red-400 font-bold text-2xl">
              Betting is closed - first match has started
            </div>
          ) : (
            <div className="flex justify-center gap-4 mb-4">
              <motion.div 
                className="glass-card p-4 min-w-[80px]"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="text-2xl font-bold text-primary">{timeLeft.hours.toString().padStart(2, '0')}</div>
                <div className="text-xs text-text-muted uppercase tracking-wider">Hours</div>
              </motion.div>
              <motion.div 
                className="glass-card p-4 min-w-[80px]"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              >
                <div className="text-2xl font-bold text-primary">{timeLeft.minutes.toString().padStart(2, '0')}</div>
                <div className="text-xs text-text-muted uppercase tracking-wider">Minutes</div>
              </motion.div>
              <motion.div 
                className="glass-card p-4 min-w-[80px]"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              >
                <div className="text-2xl font-bold text-primary">{timeLeft.seconds.toString().padStart(2, '0')}</div>
                <div className="text-xs text-text-muted uppercase tracking-wider">Seconds</div>
              </motion.div>
            </div>
          )}
        </motion.div>

        {/* Tab Navigation */}
        <div className="glass-card p-4 md:p-6 mb-8">
          <div className="flex items-center justify-center gap-2 md:gap-4 flex-wrap">
            <button
              onClick={() => setActiveTab("today")}
              className={`px-4 md:px-8 py-2 md:py-3 rounded-button font-semibold transition-all duration-300 flex items-center gap-1 md:gap-2 text-sm md:text-base ${
                activeTab === "today"
                  ? "bg-gradient-primary text-black shadow-lg scale-105"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-card/50"
              }`}
            >
              <TableCellsIcon className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">Matches & Betting</span>
              <span className="sm:hidden">Matches</span>
            </button>
            <button
              onClick={() => setActiveTab("slips")}
              className={`px-4 md:px-8 py-2 md:py-3 rounded-button font-semibold transition-all duration-300 flex items-center gap-1 md:gap-2 text-sm md:text-base relative overflow-hidden ${
                activeTab === "slips"
                  ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 shadow-lg shadow-cyan-500/25 scale-105 border border-cyan-500/30"
                  : "text-text-secondary hover:text-cyan-300 hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-blue-500/10 hover:border hover:border-cyan-500/20"
              }`}
            >
              <div className="relative">
                <TrophyIcon className="h-4 w-4 md:h-5 md:w-5" />
                {(() => {
                  const unclaimedPrizes = slips.filter(slip => {
                    const firstPick = slip[0];
                    return firstPick?.isEvaluated && (firstPick?.leaderboardRank ?? 0) <= 5 && !firstPick?.prizeClaimed;
                  }).length;
                  
                  return unclaimedPrizes > 0 ? (
                    <span className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse-glow">
                      {unclaimedPrizes}
                    </span>
                  ) : null;
                })()}
              </div>
              <span className="hidden sm:inline">My Slips ({slips.length})</span>
              <span className="sm:hidden">Slips ({slips.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("results")}
              className={`px-4 md:px-8 py-2 md:py-3 rounded-button font-semibold transition-all duration-300 flex items-center gap-1 md:gap-2 text-sm md:text-base relative overflow-hidden ${
                activeTab === "results"
                  ? "bg-gradient-to-r from-magenta-500/20 to-violet-500/20 text-magenta-300 shadow-lg shadow-magenta-500/25 scale-105 border border-magenta-500/30"
                  : "text-text-secondary hover:text-magenta-300 hover:bg-gradient-to-r hover:from-magenta-500/10 hover:to-violet-500/10 hover:border hover:border-magenta-500/20"
              }`}
            >
              <DocumentTextIcon className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">Match Results</span>
              <span className="sm:hidden">Results</span>
            </button>
            <button
              onClick={() => setActiveTab("stats")}
              className={`px-4 md:px-8 py-2 md:py-3 rounded-button font-semibold transition-all duration-300 flex items-center gap-1 md:gap-2 text-sm md:text-base ${
                activeTab === "stats"
                  ? "bg-gradient-secondary text-black shadow-lg scale-105"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-card/50"
              }`}
            >
              <ArrowTrendingUpIcon className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">Statistics</span>
              <span className="sm:hidden">Stats</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          <AnimatePresence mode="wait">
            {activeTab === "today" ? (
              <>
                {/* Matches Section */}
                <motion.div
                  key="matches"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="lg:col-span-2"
                >
                  <div className="glass-card p-4 md:p-6">
                    {/* Date Tabs */}
                    <div className="flex items-center justify-center gap-1 md:gap-2 mb-4 md:mb-6 flex-wrap">
                      {(["yesterday", "today"] as const).map((date) => {
                        const { label, date: dateStr } = getDateTabLabel(date);
                        return (
                          <button
                            key={date}
                            onClick={() => setSelectedDate(date)}
                            className={`px-2 md:px-4 py-2 md:py-3 rounded-button font-semibold transition-all duration-300 flex flex-col items-center gap-1 min-w-[80px] md:min-w-[100px] text-xs md:text-sm ${
                              selectedDate === date
                                ? "bg-gradient-primary text-black shadow-lg scale-105"
                                : "text-text-secondary hover:text-text-primary hover:bg-bg-card/50"
                            }`}
                          >
                            <CalendarIcon className="h-3 w-3 md:h-4 md:w-4" />
                            <span className="font-bold">{label}</span>
                            <span className="text-xs opacity-80 hidden sm:block">{dateStr}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mb-6">
                      {/* Header Section */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                        <div className="flex items-center gap-3">
                          <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                            <TableCellsIcon className="h-5 w-5 md:h-6 md:w-6" />
                            <span>Matches - {getDateTabLabel(selectedDate).label}</span>
                          </h2>
                          <div className="flex items-center gap-2 text-xs md:text-sm text-text-muted">
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                            <span>Live Odds</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Professional Warning Banner */}
                      {hasStartedMatches && (
                        <div className="mb-6 p-4 bg-gradient-to-r from-red-500/15 to-orange-500/15 border border-red-500/30 rounded-xl backdrop-blur-sm shadow-lg">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 mt-1">
                              <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse shadow-lg"></div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="font-bold text-red-300 text-lg">Betting Closed</div>
                                <div className="px-2 py-1 bg-red-500/20 text-red-300 text-xs font-medium rounded-full">
                                  LIVE
                                </div>
                              </div>
                              <div className="text-sm text-text-secondary leading-relaxed">
                                The first match has started. Betting is now closed for this cycle. 
                                You can still view your existing slips and track results.
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Responsive Matches Table */}
                    {isLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="text-text-muted mt-4">Loading matches...</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Mobile-First Table Header */}
                        <div className="hidden md:grid md:grid-cols-12 gap-2 px-4 py-2 text-xs font-bold text-text-muted uppercase tracking-wider bg-bg-card/30 rounded-button">
                          <div className="col-span-1 text-center">Time</div>
                          <div className="col-span-5">Match</div>
                          <div className="col-span-1 text-center">1</div>
                          <div className="col-span-1 text-center">X</div>
                          <div className="col-span-1 text-center">2</div>
                          <div className="col-span-2 text-center">O/U 2.5</div>
                          <div className="col-span-1 text-center">League</div>
                        </div>

                        {/* Matches Rows - Mobile First */}
                      {matches.map((match, i) => (
                        <motion.div
                            key={match.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: i * 0.02 }}
                            className="glass-card p-4 hover:bg-primary/5 transition-all duration-200 border-l-2 border-transparent hover:border-primary/50"
                          >
                            {/* Mobile Layout */}
                            <div className="md:hidden space-y-3">
                              {/* Match Header */}
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-semibold text-white truncate">
                                    {match.home_team} vs {match.away_team}
                                  </div>
                                  <div className="text-xs text-text-secondary truncate mt-1">
                                    {match.league_name}
                                  </div>
                                </div>
                                <div className="ml-3 flex-shrink-0">
                                  <div className={`text-xs font-mono px-2 py-1 rounded ${
                                    isMatchStarted(match.match_date)
                                      ? "text-red-400 bg-red-500/10 border border-red-500/20"
                                      : "text-text-secondary bg-primary/10"
                                  }`}>
                                    <div className="font-bold">
                                      {new Date(match.match_date).toLocaleTimeString('en-US', { 
                                        hour: '2-digit', 
                                        minute: '2-digit',
                                        hour12: false
                                      })}
                                    </div>
                                    {isMatchStarted(match.match_date) ? (
                                      <div className="text-[8px] text-red-400 font-bold">STARTED</div>
                                    ) : (
                                      <div className="text-[8px] text-text-muted">AM</div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Odds Row */}
                              <div className="grid grid-cols-5 gap-1">
                                {/* Home Win (1) */}
                                <button
                                  onClick={() => handlePickSelection(match.fixture_id, "home")}
                                  disabled={isMatchStarted(match.match_date) || isExpired}
                                  className={`px-3 py-2 text-center rounded transition-all duration-200 font-bold text-sm ${
                                    isMatchStarted(match.match_date) || isExpired
                                      ? "bg-slate-700/30 text-slate-400 cursor-not-allowed opacity-50"
                                      : picks.find(p => p.id === match.fixture_id && p.pick === "home")
                                      ? "bg-gradient-primary text-black shadow-md scale-105"
                                      : "bg-primary/10 text-white hover:bg-primary/20 hover:text-primary border border-transparent hover:border-primary/30"
                                  }`}
                                >
                                  <div className="text-xs opacity-75">1</div>
                                  <div>{typeof match.home_odds === 'number' ? formatOdds(match.home_odds) : '0.00'}</div>
                                </button>
                                
                                {/* Draw (X) */}
                                <button
                                  onClick={() => handlePickSelection(match.fixture_id, "draw")}
                                  disabled={isMatchStarted(match.match_date) || isExpired}
                                  className={`px-3 py-2 text-center rounded transition-all duration-200 font-bold text-sm ${
                                    isMatchStarted(match.match_date) || isExpired
                                      ? "bg-slate-700/30 text-slate-400 cursor-not-allowed opacity-50"
                                      : picks.find(p => p.id === match.fixture_id && p.pick === "draw")
                                      ? "bg-gradient-secondary text-black shadow-md scale-105"
                                      : "bg-secondary/10 text-white hover:bg-secondary/20 hover:text-secondary border border-transparent hover:border-secondary/30"
                                  }`}
                                >
                                  <div className="text-xs opacity-75">X</div>
                                  <div>{typeof match.draw_odds === 'number' ? formatOdds(match.draw_odds) : '0.00'}</div>
                                </button>
                                
                                {/* Away Win (2) */}
                                <button
                                  onClick={() => handlePickSelection(match.fixture_id, "away")}
                                  disabled={isMatchStarted(match.match_date) || isExpired}
                                  className={`px-3 py-2 text-center rounded transition-all duration-200 font-bold text-sm ${
                                    isMatchStarted(match.match_date) || isExpired
                                      ? "bg-slate-700/30 text-slate-400 cursor-not-allowed opacity-50"
                                      : picks.find(p => p.id === match.fixture_id && p.pick === "away")
                                      ? "bg-gradient-accent text-black shadow-md scale-105"
                                      : "bg-accent/10 text-white hover:bg-accent/20 hover:text-accent border border-transparent hover:border-accent/30"
                                  }`}
                                >
                                  <div className="text-xs opacity-75">2</div>
                                  <div>{typeof match.away_odds === 'number' ? formatOdds(match.away_odds) : '0.00'}</div>
                                </button>
                                
                                {/* Over 2.5 */}
                                <button
                                  onClick={() => handlePickSelection(match.fixture_id, "over")}
                                  disabled={isMatchStarted(match.match_date) || isExpired}
                                  className={`px-2 py-2 text-center rounded transition-all duration-200 font-bold text-sm ${
                                    isMatchStarted(match.match_date) || isExpired
                                      ? "bg-slate-700/30 text-slate-400 cursor-not-allowed opacity-50"
                                      : picks.find(p => p.id === match.fixture_id && p.pick === "over")
                                      ? "bg-gradient-to-r from-blue-500 to-primary text-black shadow-md scale-105"
                                      : "bg-blue-500/10 text-white hover:bg-blue-500/20 hover:text-blue-300 border border-transparent hover:border-blue-300/30"
                                  }`}
                                >
                                  <div className="text-xs opacity-75">O</div>
                                  <div>{typeof match.over_odds === 'number' ? formatOdds(match.over_odds) : '0.00'}</div>
                                </button>
                                
                                {/* Under 2.5 */}
                                <button
                                  onClick={() => handlePickSelection(match.fixture_id, "under")}
                                  disabled={isMatchStarted(match.match_date) || isExpired}
                                  className={`px-2 py-2 text-center rounded transition-all duration-200 font-bold text-sm ${
                                    isMatchStarted(match.match_date) || isExpired
                                      ? "bg-slate-700/30 text-slate-400 cursor-not-allowed opacity-50"
                                      : picks.find(p => p.id === match.fixture_id && p.pick === "under")
                                      ? "bg-gradient-to-r from-purple-500 to-blue-600 text-black shadow-md scale-105"
                                      : "bg-purple-500/10 text-white hover:bg-purple-500/20 hover:text-purple-300 border border-transparent hover:border-purple-300/30"
                                  }`}
                                >
                                  <div className="text-xs opacity-75">U</div>
                                  <div>{typeof match.under_odds === 'number' ? formatOdds(match.under_odds) : '0.00'}</div>
                                </button>
                              </div>
                            </div>

                            {/* Desktop Layout */}
                            <div className="hidden md:grid md:grid-cols-12 gap-2">
                            {/* Time */}
                            <div className="col-span-1 text-center">
                              <div className={`text-xs font-mono px-2 py-1 rounded ${
                                isMatchStarted(match.match_date)
                                  ? "text-red-400 bg-red-500/10 border border-red-500/20"
                                  : "text-text-secondary bg-primary/10"
                              }`}>
                                <div className="font-bold">
                                  {new Date(match.match_date).toLocaleTimeString('en-US', { 
                                    hour: '2-digit', 
                                    minute: '2-digit',
                                    hour12: false
                                  })}
                                </div>
                                {isMatchStarted(match.match_date) ? (
                                  <div className="text-[8px] text-red-400 font-bold">STARTED</div>
                                ) : (
                                  <div className="text-[8px] text-text-muted">AM</div>
                                )}
                              </div>
                            </div>

                            {/* Match */}
                              <div className="col-span-5 flex items-center justify-center">
                              <div className="text-sm font-semibold text-white text-center leading-tight">
                                <div className="truncate">{match.home_team}</div>
                                <div className="text-xs text-text-muted">vs</div>
                                <div className="truncate">{match.away_team}</div>
                            </div>
                          </div>

                            {/* Home Win (1) */}
                            <div className="col-span-1 text-center">
                            <button
                                onClick={() => handlePickSelection(match.fixture_id, "home")}
                                  disabled={isMatchStarted(match.match_date) || isExpired}
                                className={`w-full px-2 py-1 text-center rounded transition-all duration-200 font-bold text-xs ${
                                    isMatchStarted(match.match_date) || isExpired
                                    ? "bg-slate-700/30 text-slate-400 cursor-not-allowed opacity-50"
                                    : picks.find(p => p.id === match.fixture_id && p.pick === "home")
                                    ? "bg-gradient-primary text-black shadow-md scale-105"
                                    : "bg-primary/10 text-white hover:bg-primary/20 hover:text-primary border border-transparent hover:border-primary/30"
                              }`}
                            >
                                                                    {typeof match.home_odds === 'number' ? formatOdds(match.home_odds) : '0.00'}
                            </button>
                            </div>
                            
                            {/* Draw (X) */}
                            <div className="col-span-1 text-center">
                            <button
                                onClick={() => handlePickSelection(match.fixture_id, "draw")}
                                  disabled={isMatchStarted(match.match_date) || isExpired}
                                className={`w-full px-2 py-1 text-center rounded transition-all duration-200 font-bold text-xs ${
                                    isMatchStarted(match.match_date) || isExpired
                                    ? "bg-slate-700/30 text-slate-400 cursor-not-allowed opacity-50"
                                    : picks.find(p => p.id === match.fixture_id && p.pick === "draw")
                                    ? "bg-gradient-secondary text-black shadow-md scale-105"
                                    : "bg-secondary/10 text-white hover:bg-secondary/20 hover:text-secondary border border-transparent hover:border-secondary/30"
                              }`}
                            >
                                                                    {typeof match.draw_odds === 'number' ? formatOdds(match.draw_odds) : '0.00'}
                            </button>
                            </div>
                            
                            {/* Away Win (2) */}
                            <div className="col-span-1 text-center">
                            <button
                                onClick={() => handlePickSelection(match.fixture_id, "away")}
                                  disabled={isMatchStarted(match.match_date) || isExpired}
                                className={`w-full px-2 py-1 text-center rounded transition-all duration-200 font-bold text-xs ${
                                    isMatchStarted(match.match_date) || isExpired
                                    ? "bg-slate-700/30 text-slate-400 cursor-not-allowed opacity-50"
                                    : picks.find(p => p.id === match.fixture_id && p.pick === "away")
                                    ? "bg-gradient-accent text-black shadow-md scale-105"
                                    : "bg-accent/10 text-white hover:bg-accent/20 hover:text-accent border border-transparent hover:border-accent/30"
                              }`}
                            >
                                                                    {typeof match.away_odds === 'number' ? formatOdds(match.away_odds) : '0.00'}
                            </button>
                            </div>
                            
                            {/* Over/Under 2.5 */}
                            <div className="col-span-2 text-center">
                              <div className="flex gap-1">
                            <button
                              onClick={() => handlePickSelection(match.fixture_id, "over")}
                                    disabled={isMatchStarted(match.match_date) || isExpired}
                                  className={`flex-1 px-1 py-1 text-center rounded transition-all duration-200 font-bold text-xs ${
                                      isMatchStarted(match.match_date) || isExpired
                                      ? "bg-slate-700/30 text-slate-400 cursor-not-allowed opacity-50"
                                      : picks.find(p => p.id === match.fixture_id && p.pick === "over")
                                      ? "bg-gradient-to-r from-blue-500 to-primary text-black shadow-md scale-105"
                                      : "bg-blue-500/10 text-white hover:bg-blue-500/20 hover:text-blue-300 border border-transparent hover:border-blue-300/30"
                              }`}
                            >
                                  O{typeof match.over_odds === 'number' ? formatOdds(match.over_odds) : '0.00'}
                            </button>
                            <button
                              onClick={() => handlePickSelection(match.fixture_id, "under")}
                                    disabled={isMatchStarted(match.match_date) || isExpired}
                                  className={`flex-1 px-1 py-1 text-center rounded transition-all duration-200 font-bold text-xs ${
                                      isMatchStarted(match.match_date) || isExpired
                                      ? "bg-slate-700/30 text-slate-400 cursor-not-allowed opacity-50"
                                      : picks.find(p => p.id === match.fixture_id && p.pick === "under")
                                      ? "bg-gradient-to-r from-purple-500 to-blue-600 text-black shadow-md scale-105"
                                      : "bg-purple-500/10 text-white hover:bg-purple-500/20 hover:text-purple-300 border border-transparent hover:border-purple-300/30"
                              }`}
                            >
                                  U{typeof match.under_odds === 'number' ? formatOdds(match.under_odds) : '0.00'}
                            </button>
                              </div>
                            </div>

                            {/* League */}
                              <div className="col-span-1 text-center">
                              <div className="text-xs text-text-secondary truncate">
                                {match.league_name}
                                </div>
                              </div>
                          </div>
                        </motion.div>
                      ))}

                        {matches.length === 0 && (
                          <div className="text-center py-8 text-text-muted">
                            <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No matches available for {getDateTabLabel(selectedDate).label}</p>
                    </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Slip Builder Sidebar */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="lg:col-span-1"
                >
                  <div className="glass-card sticky top-8 p-4 md:p-6">
                    <h3 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6 text-center flex items-center justify-center gap-2">
                      <ShieldCheckIcon className="h-5 w-5 md:h-6 md:w-6" />
                      <span className="hidden sm:inline">Slip Builder</span>
                      <span className="sm:hidden">Slip</span>
                    </h3>

                    {/* CRITICAL: Progress indicator for 10 predictions requirement */}
                    <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-button">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-text-muted">Predictions Required:</span>
                        <span className={`font-bold ${picks.length === 10 ? 'text-green-400' : 'text-primary'}`}>
                          {picks.length}/10
                        </span>
                      </div>
                      <div className="w-full bg-bg-card/30 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            picks.length === 10 ? 'bg-green-400' : 'bg-primary'
                          }`}
                          style={{ width: `${(picks.length / 10) * 100}%` }}
                        />
                      </div>
                      {picks.length < 10 && (
                        <p className="text-xs text-text-muted mt-2">
                          ⚠️ You must select ALL 10 matches to place a slip
                        </p>
                      )}
                      {picks.length === 10 && (
                        <p className="text-xs text-green-400 mt-2">
                          ✅ Ready to place slip!
                        </p>
                      )}
                    </div>



                    <AnimatePresence mode="wait">
                      {picks.length > 0 ? (
                        <motion.div
                          key="with-picks"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="space-y-3 md:space-y-4"
                        >
                          {/* Picks List */}
                          <div className="space-y-2 max-h-48 md:max-h-64 overflow-y-auto">
                            {picks.map((pick, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="glass-card p-2 md:p-3 rounded-button border border-border-card/50 hover:border-primary/30 transition-all duration-200"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs text-text-muted mb-1">{pick.time}</div>
                                    <div className="text-xs text-white font-medium mb-2 leading-tight truncate">{pick.match}</div>
                                    <div className="flex items-center justify-between">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                        pick.pick === "home" ? "bg-primary/20 text-primary" :
                                        pick.pick === "draw" ? "bg-secondary/20 text-secondary" :
                                        pick.pick === "away" ? "bg-accent/20 text-accent" :
                                        pick.pick === "over" ? "bg-blue-500/20 text-blue-300" :
                                        "bg-purple-500/20 text-purple-300"
                                    }`}>
                                        {pick.pick === "home" ? "1" :
                                         pick.pick === "draw" ? "X" :
                                         pick.pick === "away" ? "2" :
                                         pick.pick === "over" ? "O2.5" : "U2.5"}
                                    </span>
                                      <span className="text-white font-bold text-sm">{typeof pick.odd === 'number' ? pick.odd.toFixed(2) : '0.00'}</span>
                                  </div>
                                </div>
                                  <button
                                    onClick={() => {
                                      const removedPick = picks[i];
                                      setPicks(picks.filter((_, index) => index !== i));
                                      toast.success(`Removed ${removedPick.pick === "home" ? "1" : 
                                                      removedPick.pick === "draw" ? "X" : 
                                                      removedPick.pick === "away" ? "2" : 
                                                      removedPick.pick === "over" ? "Over 2.5" : "Under 2.5"} from ${removedPick.team1} vs ${removedPick.team2}`);
                                    }}
                                    className="ml-2 text-red-400 hover:text-red-300 transition-colors flex-shrink-0 p-1 hover:bg-red-500/10 rounded"
                                  >
                                    ×
                                  </button>
                              </div>
                              </motion.div>
                            ))}
                          </div>

                          {/* Slip Summary */}
                          <div className="border-t border-border-card pt-3 md:pt-4 space-y-2 md:space-y-3">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-text-muted">Selections:</span>
                              <span className="text-white font-bold">{picks.length}/10</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-text-muted">Total Odds:</span>
                              <span className="text-primary font-bold">{totalOdd}x</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-text-muted">Entry Fee:</span>
                              <span className="text-white font-bold">
                                {contractEntryFee || DEFAULT_ENTRY_FEE} STT
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-text-muted">Potential Win:</span>
                              <span className="text-secondary font-bold">{calculatePotentialPayout(Number(totalOdd))} STT</span>
                            </div>
                          </div>

                          {/* Enhanced Submit Section */}
                          {picks.length === 10 && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mb-4 p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-button"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-green-400 font-semibold text-sm">Ready to Submit!</span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-text-muted">Total Odds:</span>
                                <span className="text-green-400 font-bold">{totalOdd}x</span>
                              </div>
                              <div className="flex justify-between items-center text-sm mt-1">
                                <span className="text-text-muted">Entry Fee:</span>
                                <span className="text-white font-bold">
                                  {contractEntryFee || DEFAULT_ENTRY_FEE} STT
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-sm mt-1">
                                <span className="text-text-muted">Potential Payout:</span>
                                <span className="text-primary font-bold">
                                  {(parseFloat(totalOdd) * parseFloat(contractEntryFee || DEFAULT_ENTRY_FEE)).toFixed(2)} STT
                                </span>
                              </div>
                            </motion.div>
                          )}

                          <div className="pt-3 md:pt-4">
                            <Button
                              fullWidth
                              variant="primary"
                              size="lg"
                              leftIcon={isPending || isConfirming ? <FaSpinner className="h-4 w-4 md:h-5 md:w-5 animate-spin" /> : <BoltIcon className="h-4 w-4 md:h-5 md:w-5" />}
                              onClick={handleSubmitSlip}
                              disabled={isExpired || picks.length !== 10 || hasStartedMatches || isPending || isConfirming || !isInitialized}
                              className={`text-sm md:text-base transition-all duration-300 ${
                                picks.length === 10 && !hasStartedMatches && !isExpired && !isPending && !isConfirming && isInitialized
                                  ? 'animate-pulse shadow-lg shadow-primary/25' 
                                  : ''
                              }`}
                            >
                              {isPending ? "Confirming in Wallet..." :
                               isConfirming ? "Processing Transaction..." :
                               !isInitialized ? "Initializing..." :
                               isExpired || hasStartedMatches ? "Betting Closed" : 
                               picks.length === 0 ? "Select 10 Matches" :
                               picks.length < 10 ? `Need ${10 - picks.length} More Predictions` : 
                               "Place Slip (10/10)"}
                            </Button>
                            
                            {/* Enhanced Status Indicators */}
                            {(isPending || isConfirming) && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-3 p-3 bg-primary/10 border border-primary/20 rounded-button"
                              >
                                <div className="flex items-center gap-2 text-sm">
                                  <FaSpinner className="h-4 w-4 animate-spin text-primary" />
                                  <span className="text-primary font-medium">
                                    {isPending ? "Waiting for wallet confirmation..." : "Processing transaction..."}
                                  </span>
                                </div>
                                <p className="text-xs text-text-muted mt-1">
                                  Please don&apos;t close this page or disconnect your wallet
                                </p>
                              </motion.div>
                            )}

                            {/* Contract Data Retry Button */}
                            {isInitialized && isConnected && (!currentMatches || currentMatches.length === 0) && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-button"
                              >
                                <div className="flex items-center gap-2 text-sm mb-2">
                                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                                  <span className="text-yellow-400 font-medium">Contract Data Unavailable</span>
                                </div>
                                <p className="text-xs text-text-muted mb-3">
                                  Unable to fetch matches from contract. This might be due to network issues.
                                </p>
                                <Button
                                  fullWidth
                                  variant="secondary"
                                  size="sm"
                                  leftIcon={<BoltIcon className="h-4 w-4" />}
                                  onClick={retryContractData}
                                  className="text-xs"
                                >
                                  Retry Contract Connection
                                </Button>
                              </motion.div>
                            )}
                          </div>

                          {picks.length > 0 && (
                            <button
                              onClick={() => {
                                setPicks([]);
                                toast.success('All selections cleared. You can start building a new slip.');
                              }}
                              className="w-full text-text-muted hover:text-red-400 transition-colors text-sm pt-2"
                              disabled={isPending || isConfirming}
                            >
                              Clear All Selections
                            </button>
                          )}


                        </motion.div>
                      ) : (
                        <motion.div
                          key="empty-builder"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-center py-8"
                        >
                          <div className="text-6xl mb-4 opacity-50">⚽</div>
                          <h4 className="font-semibold text-text-primary mb-2">Start Building Your Slip</h4>
                          <p className="text-text-muted text-sm mb-4">
                            Click on any odds to add selections to your slip
                          </p>
                          <div className="text-xs text-primary font-medium bg-primary/10 px-3 py-2 rounded-button">
                            You need to select exactly 10 matches
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </>
            ) : activeTab === "slips" ? (
              <motion.div
                key="slips"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="lg:col-span-3"
              >
                <div className="glass-card p-4 sm:p-6 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 border border-cyan-500/20 shadow-lg shadow-cyan-500/10">
                  <h2 className="text-xl sm:text-2xl font-bold text-cyan-300 mb-4 sm:mb-6 flex items-center gap-2">
                    <TrophyIcon className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-400" />
                    <span className="hidden sm:inline">My Submitted Slips</span>
                    <span className="sm:hidden">My Slips</span>
                  </h2>
                  
                  {/* Date Filtering Controls */}
                  <div className="mb-6 p-4 glass-card bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-primary" />
                        <span className="text-text-secondary font-medium">Filter by Date:</span>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 flex-1">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-text-muted">From</label>
                          <input
                            type="date"
                            value={slipDateFilter.startDate}
                            onChange={(e) => setSlipDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                            className="px-3 py-2 bg-bg-card border border-border-card rounded-button text-white text-sm focus:border-primary focus:outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-text-muted">To</label>
                          <input
                            type="date"
                            value={slipDateFilter.endDate}
                            onChange={(e) => setSlipDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                            className="px-3 py-2 bg-bg-card border border-border-card rounded-button text-white text-sm focus:border-primary focus:outline-none"
                          />
                        </div>
                        <div className="flex items-end gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleApplyDateFilter}
                            leftIcon={<ArrowPathIcon className="h-4 w-4" />}
                            disabled={apiCallInProgress}
                          >
                            Apply Filter
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleClearDateFilter}
                            disabled={apiCallInProgress}
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <AnimatePresence mode="wait">
                    {slips.length > 0 ? (
                      <motion.div
                        key="with-slips"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-6"
                      >
                        {slips.map((slip, slipIndex) => {
                          const firstPick = slip[0]; // Get metadata from first pick
                          const slipId = firstPick?.slipId || `Slip ${slipIndex + 1}`;
                          const cycleId = firstPick?.cycleId || 'Unknown';
                          const finalScore = firstPick?.finalScore || 0;
                          const correctCount = firstPick?.correctCount || 0;
                          const isEvaluated = firstPick?.isEvaluated || false;
                          const placedAt = firstPick?.placedAt ? new Date(firstPick.placedAt).toLocaleString() : 'Unknown';
                          const totalOdds = firstPick?.totalOdds && firstPick.totalOdds > 0 && firstPick.totalOdds < 1e10 
                            ? firstPick.totalOdds 
                            : slip.reduce((acc, pick) => acc * (pick.odd || 1), 1);
                          
                          return (
                            <motion.div
                              key={slipIndex}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: slipIndex * 0.1 }}
                              className="glass-card p-4 sm:p-6 border border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 hover:from-cyan-500/10 hover:to-blue-500/10"
                            >
                              {/* Enhanced Slip Header */}
                              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <CheckCircleIcon className="h-6 w-6 text-cyan-400" />
                                    <h3 className="text-xl font-bold text-cyan-300">
                                      {typeof slipId === 'number' ? `Slip #${slipId}` : slipId}
                                    </h3>
                                    <button
                                      onClick={() => toggleSlipCollapse(slipIndex)}
                                      className="ml-2 p-1 rounded-full hover:bg-cyan-500/20 transition-colors"
                                      title={collapsedSlips.has(slipIndex) ? "Expand slip" : "Collapse slip"}
                                    >
                                      {collapsedSlips.has(slipIndex) ? (
                                        <ChevronDownIcon className="h-5 w-5 text-cyan-400" />
                                      ) : (
                                        <ChevronUpIcon className="h-5 w-5 text-cyan-400" />
                                      )}
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 text-sm font-medium rounded-full border border-cyan-500/30">
                                      Cycle {cycleId}
                                    </span>
                                    {(() => {
                                      const statusInfo = getSlipStatusInfo(firstPick);
                                      const StatusIcon = statusInfo.icon;
                                      return (
                                        <span className={`px-3 py-1 text-sm font-medium rounded-full flex items-center gap-1 ${statusInfo.color}`}>
                                          <StatusIcon className="h-4 w-4" />
                                          {statusInfo.text}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                </div>
                                
                                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="text-text-muted">Total Odds:</span>
                                    <span className="text-cyan-300 font-bold">
                                      {totalOdds > 1e6 ? 'N/A' : totalOdds.toFixed(2)}x
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-text-muted">Entry Fee:</span>
                                    <span className="text-white font-bold">{contractEntryFee || DEFAULT_ENTRY_FEE} STT</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-text-muted">Submitted:</span>
                                    <span className="text-white">{placedAt}</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Collapsible Content */}
                              {!collapsedSlips.has(slipIndex) && (
                                <>
                                  {/* Enhanced Predictions Grid with Mobile Support */}
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4 mb-6">
                                {slip.map((pick, i) => (
                                  <div key={i} className="bg-slate-900/80 p-2 sm:p-3 md:p-4 rounded-button border border-slate-700/50 hover:border-primary/30 transition-all duration-200 backdrop-blur-sm relative">
                                    {/* Evaluation Result Indicator */}
                                    {isEvaluated && pick.isCorrect !== null && (
                                      <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                                        {pick.isCorrect ? (
                                          <CheckCircleIcon className="w-5 h-5 text-green-400 bg-green-500/20 rounded-full p-0.5" />
                                        ) : (
                                          <XCircleIcon className="w-5 h-5 text-red-400 bg-red-500/20 rounded-full p-0.5" />
                                        )}
                                      </div>
                                    )}
                                    
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="text-xs text-text-muted font-mono">
                                        {pick.time || '00:00'}
                                      </div>
                                      <span className={`px-1.5 sm:px-2 py-1 rounded text-xs font-bold ${
                                        pick.pick === "home" ? "bg-primary/20 text-primary" :
                                        pick.pick === "draw" ? "bg-secondary/20 text-secondary" :
                                        pick.pick === "away" ? "bg-accent/20 text-accent" :
                                        pick.pick === "over" ? "bg-blue-500/20 text-blue-300" :
                                        "bg-purple-500/20 text-purple-300"
                                      }`}>
                                        {pick.pick === "home" ? "1" :
                                         pick.pick === "draw" ? "X" :
                                         pick.pick === "away" ? "2" :
                                         pick.pick === "over" ? "O2.5" : "U2.5"}
                                      </span>
                                    </div>
                                    
                                    <div className="text-xs sm:text-sm text-white font-medium mb-2 sm:mb-3 line-clamp-2 leading-tight">
                                      {pick.team1 && pick.team2 ? `${pick.team1} vs ${pick.team2}` : `Match ${pick.id}`}
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-text-muted">
                                        {pick.team1 && pick.team2 ? 'Teams' : 'Match ID'}
                                      </span>
                                      <span className="text-white font-bold text-xs sm:text-sm">
                                        {typeof pick.odd === 'number' ? pick.odd.toFixed(2) : '0.00'}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              
                              {/* Enhanced Slip Footer */}
                              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-4 border-t border-border-card/30">
                                <div className="flex items-center gap-6">
                                  {isEvaluated && (
                                    <>
                                      <div className="flex items-center gap-2">
                                        <span className="text-text-muted text-sm">Final Score:</span>
                                        <span className="text-white font-bold">{finalScore}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-text-muted text-sm">Correct:</span>
                                        <span className="text-green-400 font-bold">{correctCount}/10</span>
                                      </div>
                                    </>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2 text-sm text-text-muted">
                                  <ClockIcon className="h-4 w-4" />
                                  <span>Submitted: {placedAt}</span>
                                </div>
                              </div>
                                </>
                              )}
                              
                              {/* Prize Claiming Section */}
                              {isEvaluated && firstPick?.leaderboardRank && firstPick.leaderboardRank <= 5 && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="mt-6 p-4 bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-yellow-500/10 border border-yellow-500/30 rounded-button relative overflow-hidden"
                                >
                                  {/* Animated background glow */}
                                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-orange-500/5 to-yellow-500/5 animate-gradient-flow"></div>
                                  
                                  <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                      <div className="flex-shrink-0 p-2 bg-yellow-500/20 rounded-full">
                                        <TrophyIcon className="h-6 w-6 text-yellow-400" />
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2 mb-1">
                                          <h4 className="text-yellow-400 font-bold text-lg">🏆 Winner!</h4>
                                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-sm font-bold rounded-full">
                                            Rank #{firstPick.leaderboardRank}
                                          </span>
                                        </div>
                                        <p className="text-sm text-text-muted mb-1">
                                          Prize Amount: <span className="text-yellow-400 font-bold">{calculatePrizeAmount(firstPick.leaderboardRank)} STT</span>
                                        </p>
                                        <p className="text-xs text-text-muted">
                                          Congratulations on your outstanding performance!
                                        </p>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                      {!firstPick.prizeClaimed ? (
                                        <Button
                                          variant="warning"
                                          size="md"
                                          onClick={() => handleClaimPrize(typeof cycleId === 'number' ? cycleId : parseInt(cycleId.toString()), typeof slipId === 'number' ? slipId : parseInt(slipId.toString()))}
                                          disabled={isClaimPending || isClaimConfirming}
                                          leftIcon={isClaimPending || isClaimConfirming ? 
                                            <FaSpinner className="animate-spin" /> : 
                                            <GiftIcon className="h-5 w-5" />
                                          }
                                          className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold hover:scale-105 transition-all duration-200 shadow-glow-cyan"
                                        >
                                          {isClaimPending || isClaimConfirming ? 'Claiming...' : 'Claim Prize'}
                                        </Button>
                                      ) : (
                                        <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 rounded-button border border-green-500/20">
                                          <CheckCircleIcon className="h-5 w-5" />
                                          <span className="font-medium">Prize Claimed</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </motion.div>
                          );
                        })}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="no-slips"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12"
                      >
                        <div className="text-6xl mb-4 opacity-50">🎟️</div>
                        <h4 className="font-semibold text-text-primary mb-2">No Slips Yet</h4>
                        <p className="text-text-muted text-sm mb-6">
                          Start building your first slip to compete for prizes
                        </p>
                        <Button
                          variant="primary"
                          onClick={() => setActiveTab("today")}
                          leftIcon={<BoltIcon className="h-5 w-5" />}
                        >
                          Start Building Slip
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : activeTab === "results" ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="lg:col-span-3"
              >
                <div className="glass-card p-6 bg-gradient-to-br from-magenta-500/5 to-violet-500/5 border border-magenta-500/20 shadow-lg shadow-magenta-500/10">
                  <h2 className="text-2xl font-bold text-magenta-300 mb-6 flex items-center gap-2">
                    <DocumentTextIcon className="h-6 w-6 text-magenta-400" />
                    Match Results & Leaderboards
                  </h2>
                  <OddysseyResults />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="stats"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="lg:col-span-3"
              >
                <div className="space-y-6">
                  {/* User Stats */}
                  {isConnected && userStats && (
                <div className="glass-card p-6">
                      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                        <UserIcon className="h-6 w-6" />
                        Your Statistics
                      </h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="glass-card p-4 text-center">
                          <TrophyIcon className="h-8 w-8 mx-auto mb-2 text-primary" />
                          <div className="text-2xl font-bold text-white">{userStats.totalSlips}</div>
                          <div className="text-sm text-text-muted">Total Slips</div>
                      </div>
                        
                      <div className="glass-card p-4 text-center">
                          <CheckCircleIcon className="h-8 w-8 mx-auto mb-2 text-secondary" />
                          <div className="text-2xl font-bold text-white">{userStats.totalWins}</div>
                          <div className="text-sm text-text-muted">Wins</div>
                      </div>
                        
                      <div className="glass-card p-4 text-center">
                          <ChartBarIcon className="h-8 w-8 mx-auto mb-2 text-accent" />
                          <div className="text-2xl font-bold text-white">{(userStats.bestScore || 0).toLocaleString()}</div>
                          <div className="text-sm text-text-muted">Best Score</div>
                      </div>
                        
                      <div className="glass-card p-4 text-center">
                          <ArrowTrendingUpIcon className="h-8 w-8 mx-auto mb-2 text-green-400" />
                          <div className="text-2xl font-bold text-white">{((userStats.winRate || 0) / 100).toFixed(1)}%</div>
                          <div className="text-sm text-text-muted">Win Rate</div>
                      </div>
                    </div>
                      
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="glass-card p-4 text-center">
                          <div className="text-lg font-bold text-white">{(userStats.averageScore || 0).toLocaleString()}</div>
                          <div className="text-sm text-text-muted">Average Score</div>
                          </div>
                        
                          <div className="glass-card p-4 text-center">
                          <div className="text-lg font-bold text-white">{userStats.currentStreak || 0}</div>
                          <div className="text-sm text-text-muted">Current Streak</div>
                          </div>
                        
                          <div className="glass-card p-4 text-center">
                          <div className="text-lg font-bold text-white">{userStats.bestStreak || 0}</div>
                          <div className="text-sm text-text-muted">Best Streak</div>
                          </div>
                          </div>
                        </div>
                  )}

                  {/* Global Stats */}
                  {stats && (
                    <div className="glass-card p-6">
                      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                        <UserGroupIcon className="h-6 w-6" />
                        Global Statistics
                      </h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary mb-2">{(stats.totalPlayers || 0).toLocaleString()}</div>
                          <div className="text-lg text-text-secondary">Total Players</div>
                          <div className="text-sm text-text-muted">All-time registered</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-3xl font-bold text-secondary mb-2">{stats.totalCycles || 0}</div>
                          <div className="text-lg text-text-secondary">Total Cycles</div>
                          <div className="text-sm text-text-muted">Completed competitions</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-3xl font-bold text-accent mb-2">{stats.activeCycles || 0}</div>
                          <div className="text-lg text-text-secondary">Active Cycles</div>
                          <div className="text-sm text-text-muted">Currently running</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-400 mb-2">{(stats.avgPrizePool || 0).toFixed(1)} STT</div>
                          <div className="text-lg text-text-secondary">Avg Prize Pool</div>
                          <div className="text-sm text-text-muted">Per cycle</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-3xl font-bold text-yellow-400 mb-2">{(stats.winRate || 0).toFixed(1)}%</div>
                          <div className="text-lg text-text-secondary">Global Win Rate</div>
                          <div className="text-sm text-text-muted">Average success</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-400 mb-2">{stats.avgCorrect || 0}x</div>
                          <div className="text-lg text-text-secondary">Avg Odds</div>
                          <div className="text-sm text-text-muted">Winning slips</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

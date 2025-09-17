"use client";

import Button from "@/components/button";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount, useChainId } from "wagmi";
import { toast } from "react-hot-toast";

import { oddysseyService } from "@/services/oddysseyService";
import OddysseyResults from "@/components/OddysseyResults";
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
  ArrowTrendingUpIcon,
  TableCellsIcon,
  DocumentTextIcon,
  GiftIcon
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


export default function OddysseyPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  
  // Local state management
  const [activeTab, setActiveTab] = useState<"today" | "slips" | "stats" | "results">("today");
  const [selectedDate, setSelectedDate] = useState<"yesterday" | "today">("today");
  const [picks, setPicks] = useState<Pick[]>([]);
  const [slips, setSlips] = useState<Pick[][]>([]);
  const [matches, setMatches] = useState<MatchesData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [isLoadingSlips, setIsLoadingSlips] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isClient, setIsClient] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Contract state
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  
  // Prize pool state
  const [currentPrizePool, setCurrentPrizePool] = useState<{
    cycleId: number | null;
    prizePool: string;
    formattedPrizePool: string;
    matchesCount: number;
    isActive: boolean;
  } | null>(null);
  
  const [dailyStats, setDailyStats] = useState<{
    date: string;
    dailyPlayers: number;
    dailySlips: number;
    avgCorrectToday: number;
    currentCycleId: number | null;
    currentPrizePool: string;
    dailyPrizePool: string;
  } | null>(null);

  // Transaction feedback
  const [transactionStatus, setTransactionStatus] = useState<{
    isVisible: boolean;
    status: 'pending' | 'confirming' | 'success' | 'error';
    title: string;
    message: string;
    txHash?: string;
  }>({
    isVisible: false,
    status: 'pending',
    title: '',
    message: ''
  });

  // Use the main Oddyssey hook for contract interactions
  const {
    entryFee,
    prizePool,
    isBettingOpen,
    timeRemaining,
    prizeDistribution,
    backendStats,
    
    // Actions
    placeSlip,
    claimPrize,
    
    // Transaction state
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    
    // Helpers
    calculatePotentialScore,
    calculatePrizeAmount,
    refetchAll
  } = useOddyssey();

  const { showSuccess, showError, showPending, showConfirming } = useTransactionFeedback();

  // Initialize client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize contract connection
  const initializeContract = useCallback(async () => {
    if (isInitializing || isInitialized) return;
    
    setIsInitializing(true);
    
    try {
      // Contract is already initialized via the hook
      setIsInitialized(true);
    } catch (error) {
      console.error("Contract initialization failed:", error);
    } finally {
      setIsInitializing(false);
    }
  }, [isInitializing, isInitialized]);

  // Fetch matches data
  const fetchMatches = useCallback(async () => {
    if (isLoadingMatches) return;
    
    setIsLoadingMatches(true);
    try {
      const response = await oddysseyService.getMatches();
      const data = response.data;
      setMatches(data);
    } catch (error) {
      console.error("Error fetching matches:", error);
      toast.error("Failed to load matches");
    } finally {
      setIsLoadingMatches(false);
    }
  }, [isLoadingMatches]);

  // Fetch user slips
  const fetchUserSlips = useCallback(async () => {
    if (!address || isLoadingSlips) return;
    
    setIsLoadingSlips(true);
    try {
      const response = await oddysseyService.getUserSlips(address);
      const data = response.data;
      
      // Transform backend data to Pick format
      const transformedSlips = data.map((slip: unknown) => {
        const typedSlip = slip as { predictions: unknown[]; slip_id: number; cycle_id: number; final_score: string; correct_count: number; is_evaluated: boolean; created_at: string; status: string; total_odds: number; potential_payout: number; leaderboard_rank?: number; prize_claimed: boolean };
        return typedSlip.predictions.map((pred: unknown) => {
          const typedPred = pred as { id?: number; match_id?: number; time?: string; match_time?: string; team1?: string; home_team?: string; team2?: string; away_team?: string; pick?: string; prediction?: string; odd?: number; odds?: number; selectedOdd?: number; isCorrect?: boolean | null; actualResult?: string; matchResult?: object };
          return {
          id: typedPred.id || typedPred.match_id || 0,
          time: typedPred.time || typedPred.match_time || '',
          match: `${typedPred.team1 || typedPred.home_team || 'Unknown'} vs ${typedPred.team2 || typedPred.away_team || 'Unknown'}`,
          pick: typedPred.pick || typedPred.prediction || 'home',
          odd: typedPred.odd || typedPred.odds || typedPred.selectedOdd || 0,
          team1: typedPred.team1 || typedPred.home_team || 'Unknown',
          team2: typedPred.team2 || typedPred.away_team || 'Unknown',
          // Slip metadata
          slipId: typedSlip.slip_id,
          cycleId: typedSlip.cycle_id,
          finalScore: parseFloat(typedSlip.final_score),
          correctCount: typedSlip.correct_count,
          isEvaluated: typedSlip.is_evaluated,
          placedAt: typedSlip.created_at,
          status: typedSlip.status,
          totalOdds: typedSlip.total_odds,
          potentialPayout: typedSlip.potential_payout,
          leaderboardRank: typedSlip.leaderboard_rank,
          prizeClaimed: typedSlip.prize_claimed,
          // Individual prediction evaluation
          isCorrect: typedPred.isCorrect,
          actualResult: typedPred.actualResult,
          matchResult: typedPred.matchResult
        } as Pick});
      });
      
      setSlips(transformedSlips);
    } catch (error) {
      console.error("Error fetching user slips:", error);
      // Don't show error toast for slips as it's not critical
    } finally {
      setIsLoadingSlips(false);
    }
  }, [address, isLoadingSlips]);

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    if (isLoadingStats) return;
    
    setIsLoadingStats(true);
    try {
      await oddysseyService.getStats('global');
      // Using backend stats from hook instead
    } catch (error) {
      console.error("Error fetching stats:", error);
      // Don't show error toast for stats as it's not critical
    } finally {
      setIsLoadingStats(false);
    }
  }, [isLoadingStats]);

  // Fetch current prize pool
  const fetchCurrentPrizePool = useCallback(async () => {
    try {
      const response = await oddysseyService.getCurrentPrizePool();
      const data = response.data;
      setCurrentPrizePool(data);
    } catch (error) {
      console.error("Error fetching current prize pool:", error);
    }
  }, []);

  // Fetch daily statistics
  const fetchDailyStats = useCallback(async () => {
    try {
      const response = await oddysseyService.getDailyStats();
      const data = response.data;
      setDailyStats({
        ...data,
        dailyPrizePool: data.currentPrizePool
      });
    } catch (error) {
      console.error("Error fetching daily stats:", error);
    }
  }, []);

  // Handle transaction feedback
  useEffect(() => {
    if (isPending) {
      showPending("Placing slip...", "Please confirm the transaction in your wallet");
    } else if (isConfirming) {
      showConfirming("Confirming slip...", "Waiting for blockchain confirmation", hash);
    } else if (isConfirmed && hash) {
      showSuccess("Slip placed successfully!", "Your predictions have been recorded on the blockchain", hash);
      refetchAll();
      fetchUserSlips();
    }
  }, [isPending, isConfirming, isConfirmed, hash, showPending, showConfirming, showSuccess, refetchAll, fetchUserSlips]);

  // Load data on mount and when connected
  useEffect(() => {
    if (isConnected) {
      initializeContract();
      fetchMatches();
      fetchUserSlips();
      fetchStats();
      fetchCurrentPrizePool();
      fetchDailyStats();
    }
  }, [isConnected, address, chainId, initializeContract, fetchMatches, fetchUserSlips, fetchStats, fetchCurrentPrizePool, fetchDailyStats]);

  // Timer effect
  useEffect(() => {
    if (!isClient || !timeRemaining) return;

    const timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = Math.max(0, Number(timeRemaining) - now);
      
      const hours = Math.floor(remaining / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);
      const seconds = remaining % 60;
      
      setTimeLeft({ hours, minutes, seconds });
    }, 1000);

    intervalRef.current = timer;
    return () => clearInterval(timer);
  }, [timeRemaining, isClient]);

  // Handle prediction selection
  const handlePredictionSelect = (matchId: number, prediction: string, odds: number) => {
    const existingPickIndex = picks.findIndex(p => p.id === matchId);
    
    if (existingPickIndex >= 0) {
      // Update existing pick
      const updatedPicks = [...picks];
      updatedPicks[existingPickIndex] = {
        ...updatedPicks[existingPickIndex],
        pick: prediction as Pick['pick'],
        odd: odds
      };
      setPicks(updatedPicks);
    } else if (picks.length < 10) {
      // Add new pick
      const match = matches?.[selectedDate]?.matches?.find(m => m.id === matchId);
      if (!match) return;
      
      const newPick: Pick = {
        id: matchId,
        time: match.match_date,
        match: `${match.home_team} vs ${match.away_team}`,
        pick: prediction as Pick['pick'],
        odd: odds,
        team1: match.home_team,
        team2: match.away_team
      };
      setPicks([...picks, newPick]);
    } else {
      toast.error("You can only select 10 matches");
    }
  };

  // Submit slip
  const handleSubmitSlip = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    if (picks.length !== 10) {
      toast.error("Please select exactly 10 matches");
      return;
    }

    if (!isBettingOpen) {
      toast.error("Betting is currently closed");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Convert picks to the format expected by the contract
      const contractPredictions = picks.map(pick => ({
        matchId: BigInt(pick.id),
        betType: ['home', 'draw', 'away'].includes(pick.pick) ? 0 : 1, // 0 = MONEYLINE, 1 = OVER_UNDER
        selection: pick.pick,
        selectedOdd: Math.round(pick.odd * 1000) // Contract uses 1000 scaling factor
      }));

      await placeSlip(contractPredictions);
      
      // Clear picks after successful submission
      setPicks([]);
      
    } catch (error) {
      console.error("Error submitting slip:", error);
      showError("Failed to place slip", error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle prize claim
  const handleClaimPrize = async (slipId: number) => {
    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      await claimPrize(slipId);
      toast.success("Prize claimed successfully!");
      fetchUserSlips(); // Refresh user slips
    } catch (error) {
      console.error("Error claiming prize:", error);
      toast.error("Failed to claim prize");
    }
  };

  // Remove pick
  const removePick = (pickId: number) => {
    setPicks(picks.filter(p => p.id !== pickId));
  };


  // Handle modal close
  const handleModalClose = () => {
    setTransactionStatus(prev => ({ ...prev, isVisible: false }));
  };

  // Format date for display
  const getDateTabLabel = (tab: "yesterday" | "today") => {
    const date = new Date();
    if (tab === "yesterday") {
      date.setDate(date.getDate() - 1);
    }
    
    return {
      label: tab === "today" ? "Today" : "Yesterday",
      date: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        weekday: 'short'
      })
    };
  };

  // Format odds display
  const formatOdds = (odds: number | null | undefined) => {
    if (!odds) return "N/A";
    return odds.toFixed(2);
  };

  const formatTotalOdds = (total: number) => {
    return total.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gradient-main text-white">
      {/* Enhanced Transaction Feedback */}
      <TransactionFeedback
        status={transactionStatus.isVisible ? {
          type: transactionStatus.status as 'success' | 'error' | 'warning' | 'info' | 'pending' | 'confirming',
          title: transactionStatus.title,
          message: transactionStatus.message,
          hash: transactionStatus.txHash
        } : null}
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
                    Cycle {currentPrizePool.cycleId || 'N/A'} • {currentPrizePool.matchesCount} Matches
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
              <p className="text-lg font-semibold text-text-secondary">Slips Placed</p>
            </div>
            
            <div className="glass-card text-center p-4">
              <CurrencyDollarIcon className="h-10 w-10 mx-auto mb-3 text-primary" />
              <h3 className="text-2xl font-bold text-white mb-1">{dailyStats.dailyPrizePool}</h3>
              <p className="text-lg font-semibold text-text-secondary">Daily Pool</p>
            </div>
          </motion.div>
        )}

        {/* Betting Countdown */}
        {isBettingOpen && isClient && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass-card text-center p-6 mb-8 border border-green-500/30"
          >
            <div className="flex items-center justify-center mb-4">
              <ClockIcon className="h-8 w-8 text-green-400 mr-3" />
              <h2 className="text-2xl font-bold text-white">Betting Open</h2>
            </div>
            <div className="text-red-400 font-bold text-2xl">
              Time Remaining: {timeLeft.hours.toString().padStart(2, '0')}:
              {timeLeft.minutes.toString().padStart(2, '0')}:{timeLeft.seconds.toString().padStart(2, '0')}
            </div>
            <div className="flex justify-center gap-4 mb-4">
              <motion.div 
                className="text-center"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <div className="text-2xl font-bold text-primary">{timeLeft.hours.toString().padStart(2, '0')}</div>
                <div className="text-xs text-text-muted uppercase tracking-wider">Hours</div>
              </motion.div>
              <motion.div 
                className="text-center"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
              >
                <div className="text-2xl font-bold text-primary">{timeLeft.minutes.toString().padStart(2, '0')}</div>
                <div className="text-xs text-text-muted uppercase tracking-wider">Minutes</div>
              </motion.div>
              <motion.div 
                className="text-center"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
              >
                <div className="text-2xl font-bold text-primary">{timeLeft.seconds.toString().padStart(2, '0')}</div>
                <div className="text-xs text-text-muted uppercase tracking-wider">Seconds</div>
              </motion.div>
            </div>
            <p className="text-sm text-text-muted">
              Submit your predictions before the countdown ends
            </p>
          </motion.div>
        )}

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
                    <div className="flex justify-center gap-2 mb-6">
                      {(["yesterday", "today"] as const).map((date) => {
                        const { label, date: dateStr } = getDateTabLabel(date);
                        return (
                          <button
                            key={date}
                            onClick={() => setSelectedDate(date)}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                              selectedDate === date
                                ? "bg-primary text-black"
                                : "text-text-secondary hover:text-text-primary hover:bg-bg-card/50"
                            }`}
                          >
                            {label}
                            <span className="block text-xs opacity-75">{dateStr}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <TableCellsIcon className="h-5 w-5 md:h-6 md:w-6" />
                        <span>Matches - {getDateTabLabel(selectedDate).label}</span>
                      </div>
                      {isLoadingMatches && (
                        <FaSpinner className="h-5 w-5 animate-spin text-primary" />
                      )}
                    </div>

                    {/* Loading State */}
                    {isLoadingMatches ? (
                      <div className="text-center py-8">
                        <FaSpinner className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-text-secondary">Loading matches...</p>
                      </div>
                    ) : matches?.[selectedDate]?.matches?.length ? (
                      <>
                        {/* Responsive Matches Table */}
                        <div className="overflow-hidden rounded-lg border border-border-card">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              {/* Mobile-First Table Header */}
                              <thead className="bg-bg-card border-b border-border-card">
                                <tr>
                                  <th className="text-left p-3 text-text-secondary font-medium text-sm">
                                    Match
                                  </th>
                                  <th className="text-center p-3 text-text-secondary font-medium text-sm hidden md:table-cell">
                                    Time
                                  </th>
                                  <th className="text-center p-3 text-text-secondary font-medium text-sm">
                                    Predictions
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {matches[selectedDate].matches.map((match) => (
                                  <tr
                                    key={match.id}
                                    className="border-b border-border-card/50 hover:bg-bg-card/30 transition-colors"
                                  >
                                    {/* Match Info */}
                                    <td className="p-3">
                                      <div className="space-y-1">
                                        <div className="font-semibold text-white text-sm md:text-base">
                                          {match.home_team} vs {match.away_team}
                                        </div>
                                        <div className="text-xs text-text-muted">
                                          {match.league_name}
                                        </div>
                                        <div className="text-xs text-text-muted md:hidden">
                                          {new Date(match.match_date).toLocaleString()}
                                        </div>
                                      </div>
                                    </td>

                                    {/* Time (Desktop Only) */}
                                    <td className="p-3 text-center text-sm text-text-muted hidden md:table-cell">
                                      {new Date(match.match_date).toLocaleString()}
                                    </td>

                                    {/* Predictions */}
                                    <td className="p-3">
                                      <div className="space-y-2">
                                        {/* Moneyline Markets */}
                                        {match.market_type === 'moneyline' && (
                                          <div className="grid grid-cols-3 gap-1 md:gap-2">
                                            {[
                                              { label: '1', odds: match.home_odds, selection: '1' },
                                              { label: 'X', odds: match.draw_odds, selection: 'X' },
                                              { label: '2', odds: match.away_odds, selection: '2' }
                                            ].map((option) => {
                                              const isSelected = picks.some(p => p.id === match.id && p.pick === option.selection);
                                              return (
                                                <button
                                                  key={option.selection}
                                                  onClick={() => handlePredictionSelect(match.id, option.selection, option.odds || 0)}
                                                  disabled={!isBettingOpen}
                                                  className={`p-2 rounded-lg text-sm font-medium transition-all ${
                                                    isSelected
                                                      ? "bg-primary text-black shadow-lg"
                                                      : !isBettingOpen
                                                      ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                                                      : "bg-bg-hover text-white hover:bg-primary/20 hover:border-primary border border-transparent"
                                                  }`}
                                                >
                                                  <div className="text-xs opacity-75">{option.label}</div>
                                                  <div className="font-bold">{formatOdds(option.odds)}</div>
                                                </button>
                                              );
                                            })}
                                          </div>
                                        )}

                                        {/* Over/Under Markets */}
                                        {match.market_type === 'over_under' && (
                                          <div className="grid grid-cols-2 gap-1 md:gap-2">
                                            {[
                                              { label: 'Over', odds: match.over_odds, selection: 'Over' },
                                              { label: 'Under', odds: match.under_odds, selection: 'Under' }
                                            ].map((option) => {
                                              const isSelected = picks.some(p => p.id === match.id && p.pick === option.selection);
                                              return (
                                                <button
                                                  key={option.selection}
                                                  onClick={() => handlePredictionSelect(match.id, option.selection, option.odds || 0)}
                                                  disabled={!isBettingOpen}
                                                  className={`p-2 rounded-lg text-sm font-medium transition-all ${
                                                    isSelected
                                                      ? "bg-primary text-black shadow-lg"
                                                      : !isBettingOpen
                                                      ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                                                      : "bg-bg-hover text-white hover:bg-primary/20 hover:border-primary border border-transparent"
                                                  }`}
                                                >
                                                  <div className="text-xs opacity-75">{option.label}</div>
                                                  <div className="font-bold">{formatOdds(option.odds)}</div>
                                                </button>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <TableCellsIcon className="h-12 w-12 text-text-muted mx-auto mb-4" />
                        <p className="text-text-secondary">No matches available for {getDateTabLabel(selectedDate).label}</p>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Betting Panel */}
                <motion.div
                  key="betting-panel"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="lg:col-span-1"
                >
                  <div className="glass-card p-4 md:p-6 sticky top-4">
                    <div className="flex items-center gap-3 mb-6">
                      <TrophyIcon className="h-6 w-6 text-primary" />
                      <h3 className="text-xl font-bold text-white">My Slip</h3>
                    </div>

                    {/* Current Picks */}
                    <div className="space-y-3 mb-6">
                      {picks.length === 0 ? (
                        <div className="text-center py-6">
                          <EyeIcon className="h-12 w-12 text-text-muted mx-auto mb-3" />
                          <p className="text-text-secondary text-sm">
                            Select 10 matches to create your slip
                          </p>
                        </div>
                      ) : (
                        picks.map((pick) => (
                          <div
                            key={pick.id}
                            className="bg-bg-card p-3 rounded-lg border border-border-card"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-sm font-medium text-white truncate">
                                {pick.team1} vs {pick.team2}
                              </div>
                              <button
                                onClick={() => removePick(pick.id)}
                                className="text-red-400 hover:text-red-300 ml-2"
                              >
                                <XCircleIcon className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-text-secondary bg-bg-hover px-2 py-1 rounded">
                                {pick.pick}
                              </span>
                              <span className="text-sm font-bold text-primary">
                                {formatOdds(pick.odd)}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Progress */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-text-secondary">Progress</span>
                        <span className="text-sm font-medium text-white">
                          {picks.length}/10
                        </span>
                      </div>
                      <div className="w-full bg-bg-card rounded-full h-2">
                        <div
                          className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(picks.length / 10) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Slip Summary */}
                    {picks.length > 0 && (
                      <div className="bg-bg-card/50 rounded-lg p-4 mb-6">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Total Odds</span>
                            <span className="font-bold text-primary">
                              {picks.length > 0 ? calculatePotentialScore(picks.map(pick => ({
                                matchId: BigInt(pick.id),
                                betType: ['home', 'draw', 'away'].includes(pick.pick) ? 0 : 1,
                                selection: pick.pick,
                                selectedOdd: Math.round(pick.odd * 1000)
                              }))).toFixed(0) : '0'}x
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Entry Fee</span>
                            <span className="text-white">{entryFee} STT</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-border-card">
                            <span className="font-medium text-white">Potential Score</span>
                            <span className="font-bold text-green-400">
                              {picks.length > 0 ? calculatePotentialScore(picks.map(pick => ({
                                matchId: BigInt(pick.id),
                                betType: ['home', 'draw', 'away'].includes(pick.pick) ? 0 : 1,
                                selection: pick.pick,
                                selectedOdd: Math.round(pick.odd * 1000)
                              }))).toFixed(0) : '0'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <Button
                      onClick={handleSubmitSlip}
                      disabled={picks.length !== 10 || !isBettingOpen || !isConnected || isSubmitting}
                      className="w-full"
                    >
                      {!isConnected
                        ? 'Connect Wallet'
                        : !isBettingOpen
                        ? 'Betting Closed'
                        : picks.length !== 10
                        ? `Select ${10 - picks.length} More Matches`
                        : isSubmitting
                        ? 'Placing Slip...'
                        : 'Place Slip'}
                    </Button>

                    {!isBettingOpen && (
                      <p className="text-xs text-red-400 text-center mt-2">
                        Betting is currently closed. Check back later!
                      </p>
                    )}
                  </div>
                </motion.div>
              </>
            ) : activeTab === "slips" ? (
              <motion.div
                key="slips"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="lg:col-span-3"
              >
                <div className="glass-card p-4 md:p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <TrophyIcon className="h-6 w-6 text-cyan-300" />
                      <h3 className="text-xl font-bold text-white">My Slips ({slips.length})</h3>
                    </div>
                    {isLoadingSlips && (
                      <FaSpinner className="h-5 w-5 animate-spin text-primary" />
                    )}
                  </div>

                  {isLoadingSlips ? (
                    <div className="text-center py-8">
                      <FaSpinner className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                      <p className="text-text-secondary">Loading your slips...</p>
                    </div>
                  ) : slips.length === 0 ? (
                    <div className="text-center py-12">
                      <TrophyIcon className="h-16 w-16 text-text-muted mx-auto mb-4" />
                      <h4 className="text-xl font-semibold text-white mb-2">No Slips Yet</h4>
                      <p className="text-text-secondary mb-6">
                        You haven&apos;t placed any slips yet. Start by selecting matches in the betting section.
                      </p>
                      <Button
                        onClick={() => setActiveTab("today")}
                        className="bg-gradient-primary text-black font-semibold"
                      >
                        Start Betting
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {slips.map((slip, slipIndex) => {
                        const firstPick = slip[0];
                        const canClaimPrize = firstPick?.isEvaluated && 
                                             (firstPick?.leaderboardRank ?? 0) <= 5 && 
                                             !firstPick?.prizeClaimed;
                        
                        return (
                          <div
                            key={firstPick?.slipId || slipIndex}
                            className={`border rounded-lg p-4 ${
                              canClaimPrize
                                ? "border-yellow-500/50 bg-gradient-to-r from-yellow-500/10 to-orange-500/10"
                                : firstPick?.isEvaluated
                                ? "border-border-card bg-bg-card/50"
                                : "border-blue-500/50 bg-blue-500/10"
                            }`}
                          >
                            {/* Slip Header */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${
                                  canClaimPrize
                                    ? "bg-yellow-500/20 text-yellow-300"
                                    : firstPick?.isEvaluated
                                    ? "bg-blue-500/20 text-blue-300"
                                    : "bg-gray-500/20 text-gray-300"
                                }`}>
                                  {canClaimPrize ? (
                                    <GiftIcon className="h-5 w-5" />
                                  ) : firstPick?.isEvaluated ? (
                                    <CheckCircleIcon className="h-5 w-5" />
                                  ) : (
                                    <ClockIcon className="h-5 w-5" />
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-white">
                                    Slip #{firstPick?.slipId || 'Unknown'}
                                  </h4>
                                  <p className="text-sm text-text-muted">
                                    {firstPick?.placedAt ? new Date(firstPick.placedAt).toLocaleDateString() : 'Unknown date'}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="text-right">
                                {firstPick?.isEvaluated ? (
                                  <>
                                    <div className="text-lg font-bold text-primary">
                                      Score: {firstPick.finalScore || 0}
                                    </div>
                                    <div className="text-sm text-text-muted">
                                      {firstPick.correctCount || 0}/10 correct
                                    </div>
                                    {canClaimPrize && firstPick.leaderboardRank && (
                                      <div className="text-sm font-semibold text-yellow-300">
                                        Rank #{firstPick.leaderboardRank}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="text-sm text-blue-300">
                                    Pending Evaluation
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Prize Claim Button */}
                            {canClaimPrize && firstPick && (
                              <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-semibold text-yellow-300">
                                      🎉 Congratulations! You won a prize!
                                    </div>
                                    <div className="text-sm text-yellow-200">
                                      Rank #{firstPick.leaderboardRank} - Prize: {calculatePrizeAmount(firstPick.leaderboardRank || 0)} STT
                                    </div>
                                  </div>
                                  <Button
                                    onClick={() => handleClaimPrize(firstPick.slipId!)}
                                    className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-semibold"
                                  >
                                    Claim Prize
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Picks Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {slip.map((pick, pickIndex) => (
                                <div
                                  key={pickIndex}
                                  className={`p-3 rounded-lg border ${
                                    pick.isCorrect === true
                                      ? "border-green-500/50 bg-green-500/10"
                                      : pick.isCorrect === false
                                      ? "border-red-500/50 bg-red-500/10"
                                      : "border-border-card bg-bg-card/30"
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="text-sm font-medium text-white truncate">
                                      {pick.team1} vs {pick.team2}
                                    </div>
                                    {pick.isEvaluated && (
                                      <div className="flex items-center">
                                        {pick.isCorrect ? (
                                          <CheckCircleIcon className="h-4 w-4 text-green-400" />
                                        ) : (
                                          <XCircleIcon className="h-4 w-4 text-red-400" />
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-text-secondary bg-bg-hover px-2 py-1 rounded">
                                      {pick.pick}
                                    </span>
                                    <span className="text-sm font-bold text-primary">
                                      {formatOdds(pick.odd)}
                                    </span>
                                  </div>
                                  {pick.actualResult && (
                                    <div className="mt-2 pt-2 border-t border-border-card">
                                      <div className="text-xs text-text-muted">
                                        Result: {pick.actualResult}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* Slip Summary */}
                            <div className="mt-4 pt-4 border-t border-border-card">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-text-secondary">Total Odds:</span>
                                <span className="font-semibold text-white">
                                  {formatTotalOdds(firstPick?.totalOdds || 0)}x
                                </span>
                              </div>
                              {firstPick?.potentialPayout && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-text-secondary">Potential Payout:</span>
                                  <span className="font-semibold text-primary">
                                    {firstPick.potentialPayout} STT
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : activeTab === "results" ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="lg:col-span-3"
              >
                <OddysseyResults />
              </motion.div>
            ) : (
              <motion.div
                key="stats"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="lg:col-span-3"
              >
                <div className="glass-card p-4 md:p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <ArrowTrendingUpIcon className="h-6 w-6 text-secondary" />
                    <h3 className="text-xl font-bold text-white">Platform Statistics</h3>
                  </div>

                  {isLoadingStats ? (
                    <div className="text-center py-8">
                      <FaSpinner className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                      <p className="text-text-secondary">Loading statistics...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Total Players */}
                      <div className="glass-card p-4 text-center">
                        <UsersIcon className="h-10 w-10 mx-auto mb-3 text-secondary" />
                        <h4 className="text-2xl font-bold text-white mb-1">
                          {backendStats?.leaderboard_participants?.toLocaleString() || 'N/A'}
                        </h4>
                        <p className="text-text-secondary">Total Players</p>
                      </div>

                      {/* Total Slips */}
                      <div className="glass-card p-4 text-center">
                        <DocumentTextIcon className="h-10 w-10 mx-auto mb-3 text-accent" />
                        <h4 className="text-2xl font-bold text-white mb-1">
                          {backendStats?.total_slips?.toLocaleString() || 'N/A'}
                        </h4>
                        <p className="text-text-secondary">Total Slips</p>
                      </div>

                      {/* Average Score */}
                      <div className="glass-card p-4 text-center">
                        <ChartBarIcon className="h-10 w-10 mx-auto mb-3 text-primary" />
                        <h4 className="text-2xl font-bold text-white mb-1">
                          {backendStats?.avg_correct_predictions?.toFixed(1) || 'N/A'}x
                        </h4>
                        <p className="text-text-secondary">Average Score</p>
                      </div>

                      {/* Prize Pool */}
                      <div className="glass-card p-4 text-center">
                        <GiftIcon className="h-10 w-10 mx-auto mb-3 text-yellow-400" />
                        <h4 className="text-2xl font-bold text-white mb-1">
                          {prizePool || 'N/A'} STT
                        </h4>
                        <p className="text-text-secondary">Current Prize Pool</p>
                      </div>

                      {/* Prize Distribution */}
                      <div className="glass-card p-4 text-center">
                        <TrophyIcon className="h-10 w-10 mx-auto mb-3 text-yellow-500" />
                        <div className="text-sm space-y-1">
                          {prizeDistribution?.map((_, index) => (
                            <div key={index} className="text-white">
                              #{index + 1}: {calculatePrizeAmount(index + 1)} STT
                            </div>
                          ))}
                        </div>
                        <p className="text-text-secondary mt-2">Prize Distribution</p>
                      </div>

                      {/* Entry Fee */}
                      <div className="glass-card p-4 text-center">
                        <CurrencyDollarIcon className="h-10 w-10 mx-auto mb-3 text-green-400" />
                        <h4 className="text-2xl font-bold text-white mb-1">
                          {entryFee || 'N/A'} STT
                        </h4>
                        <p className="text-text-secondary">Entry Fee</p>
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
"use client";

import React from "react";
import Button from "@/components/button";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount, useChainId, useWalletClient } from "wagmi";
import { toast } from "react-hot-toast";
import { formatEther } from "viem";

import { oddysseyService, type OddysseyMatch, type CycleInfo, type UserStats } from "@/services/oddysseyService";
import { useTransactionFeedback, TransactionFeedback } from "@/components/TransactionFeedback";
import { safeStartTimeToISOString, safeStartTimeToDate } from "@/utils/time-helpers";
import oddysseyWebSocketService from "@/services/oddysseyWebSocketService";
import OddysseyMatchResults from "@/components/OddysseyMatchResults";
import OddysseyLeaderboard from "@/components/OddysseyLeaderboard";
import EnhancedSlipDisplay from "@/components/EnhancedSlipDisplay";
import UserStatsCard from "@/components/UserStatsCard";
import CycleProgress from "@/components/CycleProgress";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import PrizeClaimModal from "@/components/PrizeClaimModal";
import { 
  FireIcon, 
  TrophyIcon, 
  CurrencyDollarIcon,
  UsersIcon,
  BoltIcon,
  SparklesIcon,
  ClockIcon,
  EyeIcon,
  ShieldCheckIcon,
  ArrowTrendingUpIcon,
  TableCellsIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  GiftIcon,
  CalendarDaysIcon,
  CheckCircleIcon
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
    isCorrect?: boolean;
  }[];
  finalScore: number;
  correctCount: number;
  isEvaluated: boolean;
  status: 'pending' | 'evaluated' | 'won' | 'lost';
  cycleResolved?: boolean; // Added for proper status logic
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
  totalVolume: number; // Total volume in STT
  highestOdd: number; // Highest odd achieved
  totalSlips: number; // Added missing field
  correctPredictions: number; // Added missing field
  evaluationProgress: number; // Added missing field
  totalWinners: number; // Added missing field
}

interface CurrentPrizePool {
  cycleId: number | null;
  prizePool: string;
  formattedPrizePool: string;
  matchesCount: number;
  isActive: boolean;
}

// interface DailyStats {
//   date: string;
//   dailyPlayers: number;
//   dailySlips: number;
//   avgCorrectToday: number;
//   currentCycleId: number | null;
//   currentPrizePool: string;
// }


// Default entry fee - will be updated with contract value
const DEFAULT_ENTRY_FEE = "0.5";

export default function OddysseyPage() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  
  // Contract state
  const [currentMatches, setCurrentMatches] = useState<OddysseyMatch[]>([]);
  const [entryFee, setEntryFee] = useState<string>(DEFAULT_ENTRY_FEE);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  
  // Transaction state
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  
  
  // Contract state management
  // const [claimPrize] = useState<(() => Promise<void>) | null>(null);
  
  // Enhanced transaction feedback system
  const { transactionStatus, showSuccess, showError, showInfo, showPending, showConfirming, clearStatus } = useTransactionFeedback();
  
  const resetTransactionState = useCallback(() => {
    setIsPending(false);
    setIsSuccess(false);
    setIsConfirming(false);
    setError(null);
    setHash(null);
  }, []);

  // Custom clear function that also resets transaction state
  const handleModalClose = useCallback(() => {
    clearStatus();
    resetTransactionState();
  }, [clearStatus, resetTransactionState]);

  // Event listener for opening prize claim modal
  useEffect(() => {
    const handleOpenPrizeModal = () => {
      setShowPrizeModal(true);
    };

    window.addEventListener('openPrizeClaimModal', handleOpenPrizeModal);
    return () => {
      window.removeEventListener('openPrizeClaimModal', handleOpenPrizeModal);
    };
  }, []);

  // Initialize public contract data (no wallet required)
  const initializePublicData = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('🎯 Fetching public Oddyssey data...');
      
      // Get current cycle
      const cycleId = await oddysseyService.getCurrentCycle();
      console.log('Current cycle ID:', cycleId);
      
      // Get enhanced cycle info with full data structure
      const cycleInfoData = await oddysseyService.getCurrentCycleInfo();
      setCycleInfo(cycleInfoData); // Store enhanced cycle info
      console.log('Prize pool:', formatEther(cycleInfoData.prizePool));
      
      // Get entry fee
      const fee = await oddysseyService.getEntryFee();
      setEntryFee(fee);
      
      // Get current matches (public data)
      const matches = await oddysseyService.getCurrentCycleMatches();
      setCurrentMatches(matches);
      console.log('✅ Public data loaded successfully');
      
    } catch (error) {
      console.error('❌ Error fetching public data:', error);
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize user-specific data (wallet required)
  const initializeUserData = useCallback(async () => {
    if (!isConnected || !address || !walletClient) return;
    
    try {
      console.log('🎯 Fetching user-specific data...');
      
      // Fetch user stats from contract
      const userStatsResult = await oddysseyService.getStats('user', address);
      if (userStatsResult.success) {
        setUserStats(userStatsResult.data);
        console.log('✅ User stats loaded:', userStatsResult.data);
      }
      
      // Fetch user slips with evaluation data from ALL cycles
      console.log('🎯 Fetching all user slips with evaluation data from ALL cycles...');
      const allSlipsData = await oddysseyService.getAllUserSlipsWithDataFromContract(address);
      console.log('🔍 All slips data from all cycles:', allSlipsData);
      
      // Convert to enhanced slip format
      console.log('🔍 Converting slips to enhanced format...');
      console.log('🔍 Slip IDs:', allSlipsData.slipIds);
      console.log('🔍 Slips data:', allSlipsData.slipsData);
      
      const enhancedSlips = allSlipsData.slipsData.map((slip, index) => {
        console.log(`🔍 Processing slip ${index}:`, slip);
        console.log(`🔍 Slip predictions:`, slip.predictions);
        
        const enhanced = {
          id: Number(allSlipsData.slipIds[index].toString()),
          cycleId: slip.cycleId,
          placedAt: slip.placedAt,
          predictions: slip.predictions.map(pred => {
            console.log(`🔍 Processing prediction:`, pred);
            return {
              matchId: Number(pred.matchId.toString()),
              betType: pred.betType,
              selection: pred.selection,
              selectedOdd: pred.selectedOdd,
              homeTeam: pred.homeTeam,
              awayTeam: pred.awayTeam,
              leagueName: pred.leagueName,
              isCorrect: pred.isCorrect
            };
          }),
          finalScore: slip.finalScore,
          // ✅ FIX: Divide by 1000 to convert from integer format to decimal for display
          finalScoreDisplay: typeof slip.finalScore === 'number' ? (slip.finalScore / 1000).toFixed(2) : '0.00',
          correctCount: slip.correctCount,
          isEvaluated: slip.isEvaluated,
          status: slip.isEvaluated ? (slip.correctCount >= 7 ? 'won' : 'lost') : 'pending' as 'pending' | 'evaluated' | 'won' | 'lost',
          cycleResolved: slip.cycleResolved || false // Added for proper status logic
        };
        console.log(`🔍 Enhanced slip ${index}:`, enhanced);
        return enhanced;
      });
      
      console.log('🔍 All enhanced slips:', enhancedSlips);
      console.log('🔍 Enhanced slips count:', enhancedSlips.length);
      setAllSlips(enhancedSlips);
      console.log('✅ Enhanced slips set:', enhancedSlips);
      console.log('✅ User data loaded successfully');
      
    } catch (error) {
      console.error('❌ Error fetching user data:', error);
      setAllSlips([]);
    }
  }, [isConnected, address, walletClient]);

  // Initialize contract data (legacy - now only for wallet-specific setup)
  const initializeContract = useCallback(async () => {
    if (!isConnected || !address || !walletClient || isInitializing || isInitialized) return;
    
    try {
      setIsInitializing(true);
      console.log('🎯 Initializing Oddyssey contract...');
      
      // Initialize Oddyssey service with wallet client
      oddysseyService.setWalletClient(walletClient);
      
      setIsInitialized(true);
      console.log('✅ Contract initialized successfully');
      
    } catch (error) {
      console.error('❌ Error initializing contract:', error);
      setError(error as Error);
    } finally {
      setIsInitializing(false);
    }
  }, [isConnected, address, walletClient, isInitializing, isInitialized]);

  // Initialize public data on component mount (no wallet required)
  useEffect(() => {
    initializePublicData();
  }, [initializePublicData]); // Include the dependency

  // Initialize user data when wallet connects
  useEffect(() => {
    if (isConnected && address && walletClient) {
      initializeUserData();
    } else {
      // Clear user data when wallet disconnects
      setAllSlips([]);
    }
  }, [isConnected, address, walletClient, initializeUserData]);

  // Setup WebSocket subscriptions for real-time updates
  useEffect(() => {
    if (!isConnected || !address) {
      oddysseyWebSocketService.cleanup();
      return;
    }

    console.log('📡 Setting up WebSocket subscriptions for:', address);
    
    // Initialize WebSocket subscriptions
    oddysseyWebSocketService.initializeUserSubscriptions(address);

    // Subscribe to slip placed events
    const unsubPlaced = oddysseyWebSocketService.onSlipPlaced(address, async (event) => {
      console.log('📡 ✅ Slip placed via WebSocket:', event);
      
      // Add null check for event
      if (!event || !event.slipId) {
        console.warn('Received invalid slip placed event:', event);
        return;
      }
      
      // Create new slip object with raw WebSocket data
      const newSlip: EnhancedSlip = {
        id: event.slipId,
        cycleId: event.cycleId,
        placedAt: new Date(event.placedAt).getTime() / 1000, // Convert ISO to timestamp
        predictions: event.processedPredictions || [],
        finalScore: 0,
        correctCount: 0,
        isEvaluated: false,
        status: 'pending',
        cycleResolved: false // Added for proper status logic
      };

      // Add to top of list immediately (Phase 1: Raw data)
      setAllSlips(prev => [newSlip, ...prev]);
      
      // Show notification with raw data
      toast.success(`🎉 ${event.displayText || 'New slip placed!'}`, {
        position: 'top-right',
        duration: 4000,
        style: {
          background: '#1a1a1a',
          color: '#00ff88',
          border: '1px solid #00ff88'
        }
      });
      
      console.log('📡 Slip added to list (raw data)');

      // Phase 2: Enrich with REST API data IMMEDIATELY (no delay)
      // Using async IIFE to avoid blocking
      (async () => {
        try {
          console.log(`🔍 Enriching slip ${event.slipId} with REST API data immediately...`);
          const enrichedData = await oddysseyWebSocketService.enrichSlipData(event.slipId, address, {
            skipCache: true  // Bypass backend cache for immediate display
          });
          
          if (enrichedData && enrichedData.length > 0) {
            // Update slip with enriched data
            setAllSlips(prev => 
              prev.map(slip => 
                slip.id === event.slipId 
                  ? {
                      ...slip,
                      predictions: enrichedData.map(pred => ({
                        matchId: Number(pred.matchId),
                        betType: pred.prediction === 'home' || pred.prediction === 'draw' || pred.prediction === 'away' ? 0 : 1,
                        selection: pred.prediction,
                        selectedOdd: pred.odds,
                        homeTeam: pred.home_team,
                        awayTeam: pred.away_team,
                        leagueName: pred.league_name,
                        isCorrect: pred.isCorrect
                      }))
                    }
                  : slip
              )
            );
            
            console.log(`✅ Slip ${event.slipId} enriched immediately with team names and details`);
            
            // Show enrichment notification
            toast.success(`📊 Slip #${event.slipId} details loaded!`, {
              position: 'top-right',
              duration: 3000,
              style: {
                background: '#1a1a1a',
                color: '#00bcd4',
                border: '1px solid #00bcd4'
              }
            });
          } else {
            console.warn(`⚠️ Could not enrich slip ${event.slipId} - REST API data not available yet`);
          }
        } catch (error) {
          console.error(`❌ Error enriching slip ${event.slipId}:`, error);
        }
      })();  // Execute immediately, not after 5 seconds
    });

    // Subscribe to slip evaluated events
    const unsubEvaluated = oddysseyWebSocketService.onSlipEvaluated(address, (event) => {
      console.log('📡 📊 Slip evaluated via WebSocket:', event);
      
      // Add null check for event
      if (!event || !event.slipId) {
        console.warn('Received invalid slip evaluated event:', event);
        return;
      }
      
      // Update slip in list
      setAllSlips(prev => 
        prev.map(slip => 
          slip.id === event.slipId 
            ? {
                ...slip,
                correctCount: event.correctCount,
                finalScore: event.finalScore,
                isEvaluated: true,
                status: event.correctCount >= 7 ? 'won' : 'lost'
              }
            : slip
        )
      );
      
      // Show notification
      const statusMsg = event.correctCount >= 7 ? '🏆 Won!' : '❌ Lost';
      toast.success(`📊 Slip Evaluated: ${event.correctCount}/10 correct - ${statusMsg}`, {
        position: 'top-right',
        duration: 4000,
        style: {
          background: '#1a1a1a',
          color: event.correctCount >= 7 ? '#00ff88' : '#ff6b6b',
          border: `1px solid ${event.correctCount >= 7 ? '#00ff88' : '#ff6b6b'}`
        }
      });
      
      console.log('📡 Slip evaluated, status:', event.correctCount >= 7 ? 'WON' : 'LOST');
    });

    // Subscribe to prize claimed events
    const unsubPrizeClaimed = oddysseyWebSocketService.onSlipPrizeClaimed(address, (event) => {
      console.log('📡 🏆 Prize claimed via WebSocket:', event);
      
      // Add null check for event
      if (!event || !event.slipId) {
        console.warn('Received invalid prize claimed event:', event);
        return;
      }
      
      // Update slip to show prize claimed
      setAllSlips(prev => 
        prev.map(slip => 
          slip.id === event.slipId 
            ? { ...slip, status: 'won' }
            : slip
        )
      );
      
      // Show notification
      toast.success(`🏆 Prize Claimed! ${event.prizeAmount} STT won!`, {
        position: 'top-right',
        duration: 5000,
        style: {
          background: '#1a1a1a',
          color: '#ffd700',
          border: '1px solid #ffd700'
        }
      });
      
      console.log('📡 Prize claimed:', event.prizeAmount, 'STT');
    });

    // Listen to custom events dispatched by the service
    const handleSlipPlacedEvent = (e: Event) => {
      console.log('📡 Custom slip:placed event:', (e as CustomEvent).detail);
    };

    const handleSlipEvaluatedEvent = (e: Event) => {
      console.log('📡 Custom slip:evaluated event:', (e as CustomEvent).detail);
    };

    const handlePrizeClaimedEvent = (e: Event) => {
      console.log('📡 Custom prize:claimed event:', (e as CustomEvent).detail);
    };

    window.addEventListener('oddyssey:slip:placed', handleSlipPlacedEvent);
    window.addEventListener('oddyssey:slip:evaluated', handleSlipEvaluatedEvent);
    window.addEventListener('oddyssey:prize:claimed', handlePrizeClaimedEvent);

    console.log('📡 WebSocket subscriptions initialized');

    // Cleanup on unmount or disconnect
    return () => {
      console.log('📡 Cleaning up WebSocket subscriptions');
      unsubPlaced();
      unsubEvaluated();
      unsubPrizeClaimed();
      window.removeEventListener('oddyssey:slip:placed', handleSlipPlacedEvent);
      window.removeEventListener('oddyssey:slip:evaluated', handleSlipEvaluatedEvent);
      window.removeEventListener('oddyssey:prize:claimed', handlePrizeClaimedEvent);
      oddysseyWebSocketService.cleanup();
    };
  }, [isConnected, address]);

  // Enhanced wallet initialization with mobile support
  useEffect(() => {
    if (isConnected && address && walletClient && !isInitialized && !isInitializing) {
      console.log('✅ Initializing wallet and contract...');
      
      // Enhanced wallet client validation for mobile devices
      const validateWalletClient = async () => {
        try {
          // Check if wallet client is properly initialized
          if (!walletClient || !walletClient.account) {
            throw new Error('Wallet client not properly initialized');
          }
          
          // Additional mobile-specific validation
          if (typeof window !== 'undefined' && window.ethereum) {
            try {
              // Check if wallet is still connected
              const accounts = await window.ethereum.request({ method: 'eth_accounts' });
              if (!accounts || accounts.length === 0) {
                throw new Error('Wallet connection lost');
              }
              
              // Verify the connected account matches
              if (accounts[0]?.toLowerCase() !== address?.toLowerCase()) {
                throw new Error('Account mismatch detected');
              }
            } catch (error) {
              console.warn('Wallet connection validation failed:', error);
              // Continue with initialization but log the warning
            }
          }
          
          return true;
        } catch (error) {
          console.error('❌ Wallet client validation failed:', error);
          throw error;
        }
      };
      
      // Initialize contract directly here to avoid dependency issues
      const initContract = async () => {
        try {
          setIsInitializing(true);
          console.log('🎯 Validating wallet client...');
          
          // Validate wallet client first
          await validateWalletClient();
          
          console.log('✅ Wallet client validated, setting up service...');
      oddysseyService.setWalletClient(walletClient);
          
          console.log('🎯 Initializing Oddyssey contract...');
          
          setIsInitialized(true);
          console.log('✅ Contract initialized successfully');
          
        } catch (error) {
          console.error('❌ Error initializing contract:', error);
          setError(error as Error);
          
          // Show user-friendly error message
          if (error instanceof Error) {
            if (error.message.includes('Wallet connection lost')) {
              showError("Wallet Connection Lost", "Please reconnect your wallet and try again.");
            } else if (error.message.includes('Account mismatch')) {
              showError("Account Mismatch", "Please ensure you're using the correct wallet account.");
            } else if (error.message.includes('Wallet client not properly initialized')) {
              showError("Wallet Not Ready", "Please ensure your wallet is properly connected and try again.");
            } else {
              showError("Initialization Failed", "Failed to initialize the contract. Please try refreshing the page.");
            }
          }
        } finally {
          setIsInitializing(false);
        }
      };
      
      initContract();
    }
  }, [isConnected, address, walletClient, isInitialized, isInitializing, showError]);

  // Reset state when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      setIsInitialized(false);
      setIsInitializing(false);
      setCurrentMatches([]);
      setAllSlips([]);
    }
  }, [isConnected]);

  const [picks, setPicks] = useState<Pick[]>([]);
  const [allSlips, setAllSlips] = useState<EnhancedSlip[]>([]); // Enhanced slips with evaluation data
  const [activeTab, setActiveTab] = useState<"today" | "slips" | "stats" | "results" | "leaderboard" | "analytics" | "claim">("today");
  const [matches, setMatches] = useState<Match[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [cycleStats, setCycleStats] = useState<{ participants: number; totalSlips: number; prizePool: string } | null>(null); // Cycle-specific stats for header
  const [currentPrizePool, setCurrentPrizePool] = useState<CurrentPrizePool | null>(null);
  const [cycleInfo, setCycleInfo] = useState<CycleInfo | null>(null); // Enhanced cycle info
  const [userStats, setUserStats] = useState<UserStats | null>(null); // User stats from contract
  const [showPrizeModal, setShowPrizeModal] = useState(false);

  // Debug: Log cycleInfo changes
  useEffect(() => {
    if (cycleInfo) {
      console.log('🔍 OddysseyMatchResults cycleId:', Number(cycleInfo.cycleId));
    }
  }, [cycleInfo]);
  // const [dailyStats, setDailyStats] = useState<DailyStats>({
  //   date: new Date().toISOString().split('T')[0],
  //   dailyPlayers: 0,
  //   dailySlips: 0,
  //   avgCorrectToday: 0,
  //   currentCycleId: null,
  //   currentPrizePool: '0'
  // });
  

  
  // Helper function to get enhanced slip status - commented out as unused
  /*
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
  */
  
  // Helper function to calculate prize amount - commented out as unused
  /*
  const calculatePrizeAmount = (rank: number, prizePool: number = 50) => {
    if (rank < 1 || rank > 5) return '0';
    const percentages = [40, 30, 20, 5, 5]; // 1st, 2nd, 3rd, 4th, 5th
    const percentage = percentages[rank - 1];
    return ((prizePool * percentage) / 100).toFixed(2);
  };
  */
  
  // Handle prize claiming - commented out as unused
  /*
  const handleClaimPrize = async (cycleId: number, slipId: number) => {
    try {
      showPending('Claiming prize...', 'info');
      if (claimPrize) {
        await claimPrize();
      }
      showSuccess(`Prize claim initiated for Slip #${slipId}!`, 'success');
      // Refresh slips data
      // Note: Slips are now fetched in the new initialization method
    } catch (error) {
      console.error('Prize claim error:', error);
      showError('Failed to claim prize. Please try again.', 'error');
    }
  };
  */
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);
  const [hasStartedMatches, setHasStartedMatches] = useState(false);
  const [apiCallInProgress, setApiCallInProgress] = useState(false);
  const picksRef = useRef<Pick[]>([]);
  

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
      showError("Transaction Failed", (error as Error).message || "Failed to place slip. Please try again or check your wallet connection.");
    }
  }, [error, showError]);


  // Fetch current prize pool and daily stats (contract-only)
  const fetchCurrentData = useCallback(async () => {
    if (apiCallInProgress) return;
    
    try {
      setApiCallInProgress(true);
      console.log('💰 Fetching current cycle info...');
      
      // Use getCurrentCycleInfo which provides prize pool data
      const cycleInfo = await oddysseyService.getCurrentCycleInfo();
      
      if (cycleInfo) {
        console.log('✅ Current cycle info received:', cycleInfo);
        setCurrentPrizePool({
          cycleId: Number(cycleInfo.cycleId),
          prizePool: formatEther(cycleInfo.prizePool),
          formattedPrizePool: `${parseFloat(formatEther(cycleInfo.prizePool)).toFixed(2)} STT`,
          matchesCount: 10,
          isActive: cycleInfo.state === 1
        });
      }
      
    } catch (error) {
      console.error('❌ Error fetching current data:', error);
    } finally {
      setApiCallInProgress(false);
    }
  }, [apiCallInProgress]);

  // Fetch stats using the service (contract-only - direct contract calls, NOT API)
  const fetchStats = useCallback(async () => {
    if (apiCallInProgress) return; // Prevent multiple simultaneous calls
    
    try {
      setApiCallInProgress(true);
      console.log('🎯 Fetching Oddyssey stats from contract...');
      
      // Use DIRECT CONTRACT CALLS for page stats and statistics tab
      // Also fetch cycle-specific stats for header display
      const [globalStatsResult, userStatsResult, cycleStatsResult] = await Promise.all([
        oddysseyService.getGlobalStatsFromContract(),
        address ? oddysseyService.getUserStatsFromContract(address) : null,
        oddysseyService.getCycleStatsForCurrentCycle() // Fetch cycle-specific stats for header
      ]);

      if (globalStatsResult.success && globalStatsResult.data) {
        console.log('✅ Global stats from contract:', globalStatsResult.data);
        // Format avgPrizePool properly - ensure it's not a huge wei value
        const avgPrizePoolValue = globalStatsResult.data.avgPrizePool || 0;
        const formattedAvgPrizePool = avgPrizePoolValue > 1e15 
          ? (avgPrizePoolValue / 1e18).toFixed(2) 
          : avgPrizePoolValue.toFixed(2);
        
        console.log('🔍 avgPrizePool formatting:', { 
          raw: avgPrizePoolValue, 
          formatted: formattedAvgPrizePool 
        });
        
        setStats({
          totalPlayers: globalStatsResult.data.totalPlayers || 0,
          prizePool: `${formattedAvgPrizePool} STT`,
          completedSlips: globalStatsResult.data.totalSlips?.toLocaleString() || "0",
          averageOdds: `${(globalStatsResult.data.avgCorrect || 0).toFixed(2)}x`,
          totalCycles: globalStatsResult.data.totalCycles || 0,
          activeCycles: globalStatsResult.data.activeCycles || 0,
          avgPrizePool: parseFloat(formattedAvgPrizePool),
          winRate: globalStatsResult.data.winRate || 0,
          avgCorrect: globalStatsResult.data.avgCorrect || 0,
          totalVolume: globalStatsResult.data.totalVolume || 0,
          highestOdd: globalStatsResult.data.highestOdd || 0,
          totalSlips: globalStatsResult.data.totalSlips || 0,
          correctPredictions: globalStatsResult.data.correctPredictions || 0,
          evaluationProgress: globalStatsResult.data.evaluationProgress || 0,
          totalWinners: globalStatsResult.data.totalWinners || 0
        });
      } else {
        console.warn('⚠️ No global stats received from contract, using defaults');
        setStats({
          totalPlayers: 0,
          prizePool: "0 STT",
          completedSlips: "0",
          averageOdds: "0x",
          totalCycles: 0,
          activeCycles: 0,
          avgPrizePool: 0,
          winRate: 0,
          avgCorrect: 0,
          totalVolume: 0,
          highestOdd: 0,
          totalSlips: 0,
          correctPredictions: 0,
          evaluationProgress: 0,
          totalWinners: 0
        });
      }

      if (userStatsResult?.success && userStatsResult.data) {
        console.log('✅ User stats from contract:', userStatsResult.data);
        // User stats integrated into main stats display
      } else {
        console.warn('⚠️ No user stats received from contract');
      }

      // Set cycle-specific stats for header display
      if (cycleStatsResult?.success && cycleStatsResult.data) {
        console.log('✅ Cycle stats from backend:', cycleStatsResult.data);
        setCycleStats({
          participants: cycleStatsResult.data.participants || 0,
          totalSlips: cycleStatsResult.data.totalSlips || 0,
          prizePool: formatEther(cycleStatsResult.data.prizePool)
        });
      } else {
        console.warn('⚠️ No cycle stats received, using global stats as fallback');
        setCycleStats(null);
      }
    } catch (error) {
      console.error('❌ Error fetching stats from contract:', error);
      // Set default stats on error
      setStats({
        totalPlayers: 0,
        prizePool: "0 STT",
        completedSlips: "0",
        averageOdds: "0x",
        totalCycles: 0,
        activeCycles: 0,
        avgPrizePool: 0,
        winRate: 0,
        avgCorrect: 0,
        totalVolume: 0,
        highestOdd: 0,
        totalSlips: 0,
        correctPredictions: 0,
        evaluationProgress: 0,
        totalWinners: 0
      });
    } finally {
      setApiCallInProgress(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]); // Remove apiCallInProgress to prevent infinite loops

  // Fetch current cycle and match results from backend
  const fetchCurrentCycle = useCallback(async () => {
    try {
      console.log('🎯 Fetching current cycle from backend...');
      
      // Get current cycle from backend API
      const currentCycleResult = await oddysseyService.getMatches();
      
      if (currentCycleResult.success && currentCycleResult.data) {
        console.log('✅ Current cycle matches received:', currentCycleResult.data.length);
        
        // Update the matches state for display
        setMatches(currentCycleResult.data);
        
        // Calculate cycle info
        const totalMatches = currentCycleResult.data.length;
        const finishedMatches = currentCycleResult.data.filter((match: { result?: { outcome_1x2?: string; outcome_ou25?: string } }) => 
          match.result?.outcome_1x2 && match.result?.outcome_ou25
        ).length;
        
        // Match results info calculated but not stored in state for now
        console.log(`📊 Match results: ${finishedMatches}/${totalMatches} finished`);
      } else {
        console.log('⚠️ No current cycle data available');
      }
    } catch (error) {
      console.error('❌ Error fetching current cycle:', error);
    }
  }, []); // No dependencies to prevent infinite loops

  // Note: fetchUserSlips function removed - using new initialization method instead

  // Update refetchAll function now that other functions are defined - commented out as unused
  /*
  const refetchAll = useCallback(async () => {
    await Promise.all([
      fetchCurrentData(),
      fetchStats(),
      // Note: Slips are now fetched in the new initialization method
    ]);
  }, [fetchCurrentData, fetchStats]);
  */

  // Contract-only: No date filtering needed since all data comes from contract

  useEffect(() => {
    fetchCurrentCycle();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount to prevent infinite loops

  // Fetch public data (stats, matches) regardless of wallet connection
  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        await Promise.all([
          fetchStats(),
          fetchCurrentData()
        ]);
        setIsLoading(false); // Set loading to false after public data is fetched
      } catch (error) {
        console.error('Error fetching public data:', error);
        setIsLoading(false); // Set loading to false even if there's an error
      }
    };
    
    fetchPublicData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount for public data

  // Fetch user-specific data only when wallet is connected
  useEffect(() => {
    if (address) {
      // Note: Slips are now fetched in the new initialization method;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]); // Only depend on address for user-specific data
  
  
  // Winner notification system
  useEffect(() => {
    if (allSlips?.length > 0) {
      const unclaimedWins = allSlips.filter(slip => {
        return slip.isEvaluated && 
               slip.correctCount >= 8 && 
               slip.status === 'won';
      });
      
      if (unclaimedWins.length > 0) {
        const totalPrizes = unclaimedWins.length;
        const topRank = Math.min(...unclaimedWins.map(slip => slip.correctCount));
        
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
  }, [allSlips]);

  // Contract-only transaction handling
  useEffect(() => {
    if (isSuccess && hash) {
      // Transaction confirmed - refresh data and reset picks
      console.log('✅ Transaction confirmed, refreshing data...');
      
      // Reset picks after successful transaction
            setPicks([]);
      
      // Refresh data after a short delay
            setTimeout(() => {
              fetchStats?.();
              // Note: Slips are now fetched in the new initialization method
        fetchCurrentData?.();
            }, 2000); // 2 second delay
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, hash]); // Remove function dependencies to prevent infinite loops

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
  // const isMatchStarted = useCallback((matchDate: string) => {
  //   const matchStartTime = new Date(matchDate);
  //   const now = new Date();
  //   return matchStartTime <= now;
  // }, []);

  // Contract-only: Update matches based on contract data
  useEffect(() => {
    if (currentMatches.length > 0) {
      // Convert contract matches to frontend format
      const convertedMatches = currentMatches.map((match, index) => {
        // Ensure we have a valid ID
        const matchId = match.id ? Number(match.id) : index + 1;
        
        return {
          id: matchId,
          fixture_id: matchId,
          match_date: safeStartTimeToISOString(match.startTime),
          home_team: match.homeTeam || `Team ${matchId}A`,
          away_team: match.awayTeam || `Team ${matchId}B`,
          home_odds: match.oddsHome, // Already converted in service
          draw_odds: match.oddsDraw, // Already converted in service
          away_odds: match.oddsAway, // Already converted in service
          over_odds: match.oddsOver, // Already converted in service
          under_odds: match.oddsUnder, // Already converted in service
          league_name: match.leagueName || 'Oddyssey League',
          market_type: 'match_result',
          display_order: index + 1
        };
      });
      
      setMatches(convertedMatches);
      checkStartedMatches(convertedMatches);
    }
  }, [currentMatches, checkStartedMatches]);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches]); // Only depend on matches to prevent circular dependency

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
  

  const handleSubmitSlip = async () => {
    try {
      // Validate wallet connection
      if (!isConnected || !address) {
        showError("Wallet Not Connected", "Please connect your wallet to place a slip.");
        return;
      }

      // Check network
      if (chainId !== 50312) {
        showError("Wrong Network", "Please switch to Somnia Network to use Oddyssey.");
        return;
      }

      // Validate picks
      if (!picks || picks.length !== 10) {
        const missing = 10 - (picks?.length || 0);
        showError("Incomplete Slip", `You must make predictions for ALL 10 matches. Currently selected: ${picks?.length || 0}/10. Please select ${missing} more prediction${missing !== 1 ? 's' : ''}.`);
        return;
      }

      // Check if any selected matches have started
      const now = new Date();
      const hasStartedMatch = picks.some(pick => {
        const match = currentMatches.find(m => Number(m.id) === pick.id);
        if (!match) return false;
        
        // Safely convert startTime to Date with validation
        const matchStartTime = safeStartTimeToDate(match.startTime, false);
        if (!matchStartTime) return false; // Skip invalid times
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
      
      // ✅ CRITICAL FIX: Match predictions to contract match order
      // Contract expects predictions in the EXACT order matches appear on-chain
      // Do NOT sort by matchId - maintain contract order
      
      // First, validate all picks have corresponding matches
      const matchMap = new Map(currentMatches.map(m => [Number(m.id), m]));
      const invalidPicks = picks.filter(pick => !matchMap.has(pick.id));
      
      if (invalidPicks.length > 0) {
        showError("Invalid Matches", "Some selected matches are no longer available. Please refresh and reselect.");
        return;
      }
      
      // Create predictions array in contract match order
      const predictions = currentMatches.map(match => {
        const pick = picks.find(p => p.id === Number(match.id));
        if (!pick) {
          throw new Error(`Missing prediction for match ${match.id}`);
        }
        
        return {
          matchId: pick.id,
          prediction: pick.pick === "home" ? "1" : 
                     pick.pick === "draw" ? "X" : 
                     pick.pick === "away" ? "2" : 
                     pick.pick === "over" ? "Over" : "Under",
          odds: pick.odd // Odds are already in contract format (scaled by 1000)
        };
      });

      console.log('📝 Formatted predictions (contract order):', predictions);

      // Enhanced mobile transaction handling
      setIsPending(true);
      
      try {
        console.log('🎯 Submitting slip to contract...');
      const txHash = await oddysseyService.placeSlip(predictions);
        console.log('✅ Transaction hash received:', txHash);
        
      setHash(txHash);
      setIsPending(false);
      setIsConfirming(true);
      
      // Wait for confirmation (simplified - in real app you'd wait for transaction receipt)
      setTimeout(() => {
        setIsConfirming(false);
        setIsSuccess(true);
          showSuccess("Slip Placed Successfully!", "Your predictions have been submitted to the blockchain and are now active in the competition", txHash);
        setPicks([]);
        // Refresh data
        initializeContract();
      }, 3000);
        
      } catch (transactionError) {
        console.error('❌ Transaction submission failed:', transactionError);
        setIsPending(false);
        setIsConfirming(false);
        
        // Enhanced error handling for mobile devices
        if (transactionError instanceof Error) {
          if (transactionError.message.includes('cancelled by user') || transactionError.message.includes('rejected')) {
            showError("Transaction Cancelled", "You cancelled the transaction. Please try again if you want to place the slip.");
          } else if (transactionError.message.includes('Insufficient funds')) {
            showError("Insufficient Funds", "You don't have enough STT tokens to pay the entry fee. Please get more STT tokens and try again.");
          } else if (transactionError.message.includes('Gas estimation failed')) {
            showError("Gas Estimation Failed", "Failed to estimate gas. Please check your network connection and try again.");
          } else if (transactionError.message.includes('Network error')) {
            showError("Network Error", "Please check your internet connection and try again.");
          } else if (transactionError.message.includes('Wallet error')) {
            showError("Wallet Error", "Please ensure your wallet is properly connected and try again.");
          } else if (transactionError.message.includes('Wallet connection lost')) {
            showError("Wallet Disconnected", "Your wallet connection was lost. Please reconnect your wallet and try again.");
          } else {
            showError("Transaction Failed", transactionError.message || "Failed to place slip. Please try again.");
          }
        } else {
          showError("Transaction Failed", "An unexpected error occurred. Please try again.");
        }
        
        setError(transactionError as Error);
      }
      
    } catch (error) {
      console.error('❌ Error submitting slip:', error);
      setIsPending(false);
      setIsConfirming(false);
      setError(error as Error);
      showError("Submission Failed", (error as Error).message || "Failed to submit slip");
    }
  };



  // Manual refresh function (contract-only)
  const handleManualRefresh = useCallback(async () => {
    if (apiCallInProgress) {
      toast.error('Please wait, a refresh is already in progress');
      return;
    }
    
    try {
      toast.success('Refreshing data...');
      await Promise.all([
        fetchCurrentCycle(),
        fetchStats(),
        // Note: Slips are now fetched in the new initialization method
        fetchCurrentData()
      ]);
      toast.success('Data refreshed successfully!');
    } catch (error) {
      console.error('❌ Error during manual refresh:', error);
      toast.error('Failed to refresh data. Please try again later.');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]); // Only depend on address to prevent infinite loops



  // const formatDate = (dateStr: string) => {
  //   const date = new Date(dateStr);
  //   return date.toLocaleDateString('en-US', { 
  //     weekday: 'short', 
  //     month: 'short', 
  //     day: 'numeric' 
  //   });
  // };

  // const getDateTabLabel = (tab: "yesterday" | "today") => {
  //   const today = new Date();
  //   const targetDate = new Date(today);
  //   
  //   if (tab === "yesterday") {
  //     targetDate.setDate(today.getDate() - 1);
  //   }
  //   
  //   return {
  //     label: tab.charAt(0).toUpperCase() + tab.slice(1),
  //     date: formatDate(targetDate.toISOString())
  //   };
  // };

  // Add network check - commented out as unused
  /*
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
  */

  // Add retry mechanism for contract data - commented out as unused
  /*
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
  */

  // Helper function to format odds correctly (contract uses 1000x scaling) - commented out as unused
  /*
  const formatOdds = (odds: number) => {
    // Backend already sends correct odds, no need to divide by 1000
    return odds.toFixed(2);
  };
  */



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
      
      {/* Prize Claim Modal */}
      <PrizeClaimModal
        isOpen={showPrizeModal}
        onClose={() => setShowPrizeModal(false)}
        userAddress={address}
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
              <h1 className="text-4xl md:text-5xl font-bold gradient-text">
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

        {/* Daily Stats - Removed mock data, using real contract data */}

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
              <h3 className="text-2xl font-bold text-white mb-1">{parseFloat(stats.prizePool || '0').toFixed(2)} STT</h3>
              <p className="text-lg font-semibold text-text-secondary mb-1">Average Prize Pool</p>
              <p className="text-sm text-text-muted">Current cycle</p>
              </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="glass-card text-center p-4"
            >
              <UsersIcon className="h-12 w-12 mx-auto mb-4 text-secondary" />
              <h3 className="text-2xl font-bold text-white mb-1">{(cycleStats?.participants || stats?.totalPlayers || 0).toLocaleString()}</h3>
              <p className="text-lg font-semibold text-text-secondary mb-1">Total Players</p>
              <p className="text-sm text-text-muted">Current cycle</p>
        </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="glass-card text-center p-4"
            >
              <TrophyIcon className="h-12 w-12 mx-auto mb-4 text-accent" />
                              <h3 className="text-2xl font-bold text-white mb-1">{(stats.winRate || 0).toFixed(2)}%</h3>
              <p className="text-lg font-semibold text-text-secondary mb-1">Win Rate</p>
              <p className="text-sm text-text-muted">Current cycle</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="glass-card text-center p-4"
            >
              <EyeIcon className="h-12 w-12 mx-auto mb-4 text-green-400" />
              <h3 className="text-2xl font-bold text-white mb-1">{(typeof stats.avgCorrect === 'number' ? stats.avgCorrect : parseFloat(stats.avgCorrect || '0')).toFixed(2)}x</h3>
              <p className="text-lg font-semibold text-text-secondary mb-1">Average Odds</p>
              <p className="text-sm text-text-muted">Current cycle</p>
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
              {currentMatches && currentMatches.length > 0 ? (
                <>
              Betting Closes In
                  <span className="text-sm font-normal text-text-secondary ml-2">
                    (First match: {currentMatches[0]?.homeTeam} vs {currentMatches[0]?.awayTeam})
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
                  ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 shadow-lg shadow-cyan-500/25 scale-105 border border border-cyan-500/30"
                  : "text-text-secondary hover:text-cyan-300 hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-blue-500/10 hover:border hover:border-cyan-500/20"
              }`}
            >
              <div className="relative">
                <TrophyIcon className="h-4 w-4 md:h-5 md:w-5" />
                {(() => {
                  const unclaimedPrizes = allSlips.filter(slip => {
                    return slip.isEvaluated && slip.correctCount >= 8 && slip.status === 'won';
                  }).length;
                  
                  return unclaimedPrizes > 0 ? (
                    <span className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse-glow">
                      {unclaimedPrizes}
                    </span>
                  ) : null;
                })()}
              </div>
              <span className="hidden sm:inline">My Slips ({allSlips.length})</span>
              <span className="sm:hidden">Slips ({allSlips.length})</span>
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
              onClick={() => setActiveTab("leaderboard")}
              className={`px-4 md:px-8 py-2 md:py-3 rounded-button font-semibold transition-all duration-300 flex items-center gap-1 md:gap-2 text-sm md:text-base ${
                activeTab === "leaderboard"
                  ? "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 shadow-lg shadow-yellow-500/25 scale-105 border border-yellow-500/30"
                  : "text-text-secondary hover:text-yellow-300 hover:bg-gradient-to-r hover:from-yellow-500/10 hover:to-orange-500/10 hover:border hover:border-yellow-500/20"
              }`}
            >
              <TrophyIcon className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">Leaderboard</span>
              <span className="sm:hidden">Leaders</span>
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-4 md:px-8 py-2 md:py-3 rounded-button font-semibold transition-all duration-300 flex items-center gap-1 md:gap-2 text-sm md:text-base ${
                activeTab === "analytics"
                  ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 shadow-lg shadow-purple-500/25 scale-105 border border-purple-500/30"
                  : "text-text-secondary hover:text-purple-300 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-pink-500/10 hover:border hover:border-purple-500/20"
              }`}
            >
              <SparklesIcon className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Analytics</span>
            </button>
            <button
              onClick={() => setActiveTab("claim")}
              className={`px-4 md:px-8 py-2 md:py-3 rounded-button font-semibold transition-all duration-300 flex items-center gap-1 md:gap-2 text-sm md:text-base ${
                activeTab === "claim"
                  ? "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 shadow-lg shadow-yellow-500/25 scale-105 border border-yellow-500/30"
                  : "text-text-secondary hover:text-yellow-300 hover:bg-gradient-to-r hover:from-yellow-500/10 hover:to-orange-500/10 hover:border hover:border-yellow-500/20"
              }`}
            >
              <GiftIcon className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">Claim Prizes</span>
              <span className="sm:hidden">Claim</span>
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
            {/* Matches Tab */}
            {activeTab === "today" && (
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
                      <button
                        className="px-2 md:px-4 py-2 md:py-3 rounded-button font-semibold transition-all duration-300 flex flex-col items-center gap-1 min-w-[80px] md:min-w-[100px] text-xs md:text-sm bg-gradient-primary text-black shadow-lg scale-105"
                      >
                        <CalendarDaysIcon className="h-3 w-3 md:h-4 md:w-4" />
                        <span className="font-bold">Today</span>
                        <span className="text-xs opacity-80 hidden sm:block">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </button>
                    </div>

                    <div className="mb-6">
                      {/* Header Section */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                        <div className="flex items-center gap-3">
                          <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                            <TableCellsIcon className="h-5 w-5 md:h-6 md:w-6" />
                            <span>Matches - Today Live Odds</span>
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
                        <FaSpinner className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-text-secondary">Loading matches...</p>
                      </div>
                    ) : currentMatches.length === 0 ? (
                      <div className="text-center py-12">
                        <ClockIcon className="h-16 w-16 text-text-muted mx-auto mb-4" />
                        <h4 className="text-xl font-semibold text-white mb-2">No Matches Available</h4>
                        <p className="text-text-secondary">
                          New matches will be available soon. Check back later!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {currentMatches.map((match, index) => {
                          const matchId = match.id ? Number(match.id) : index + 1;
                          const isMatchStarted = (matchStartTime: string) => {
                            const now = new Date();
                            const startTime = new Date(matchStartTime);
                            return startTime <= now;
                          };
                          
                          return (
                            <motion.div
                              key={`${matchId}-${index}`}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="glass-card p-4 md:p-6 border border-border-card/50 hover:border-primary/30 transition-all duration-300"
                            >
                              {/* Mobile Layout */}
                              <div className="md:hidden space-y-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="text-sm text-text-muted">Match {index + 1}</div>
                                  <div className={`text-xs font-mono px-2 py-1 rounded ${
                                    isMatchStarted(safeStartTimeToISOString(match.startTime))
                                      ? "text-red-400 bg-red-500/10 border border-red-500/20"
                                      : "text-text-secondary bg-primary/10"
                                  }`}>
                                    <div className="font-bold">
                                      {new Date(safeStartTimeToISOString(match.startTime)).toLocaleTimeString('en-US', { 
                                        hour: '2-digit', 
                                        minute: '2-digit',
                                        hour12: false
                                      })}
                                    </div>
                                    {isMatchStarted(safeStartTimeToISOString(match.startTime)) ? (
                                      <div className="text-[8px] text-red-400 font-bold">STARTED</div>
                                    ) : (
                                      <div className="text-[8px] text-text-muted">AM</div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="text-center mb-4">
                                  <div className="text-lg font-semibold text-white">
                                    {match.homeTeam} vs {match.awayTeam}
                                  </div>
                                  <div className="text-sm text-text-muted">{match.leagueName}</div>
                                </div>

                                {/* 1X2 Market */}
                                <div>
                                  <div className="text-sm text-text-muted mb-2">Match Result</div>
                                  <div className="grid grid-cols-3 gap-2">
                                    <button
                                      onClick={() => handlePickSelection(matchId, "home")}
                                      disabled={isMatchStarted(safeStartTimeToISOString(match.startTime)) || isExpired}
                                      className={`px-3 py-2 text-center rounded transition-all duration-200 font-bold text-sm ${
                                        isMatchStarted(safeStartTimeToISOString(match.startTime)) || isExpired
                                          ? "bg-slate-700/30 text-slate-400 cursor-not-allowed opacity-50"
                                          : picks.find(p => p.id === matchId && p.pick === "home")
                                          ? "bg-gradient-primary text-black shadow-md scale-105"
                                          : "bg-primary/10 text-white hover:bg-primary/20 hover:text-primary border border-transparent hover:border-primary/30"
                                      }`}
                                    >
                                      <div className="text-xs opacity-75">1</div>
                                      <div>{match.oddsHome.toFixed(2)}</div>
                                    </button>
                                    
                                    <button
                                      onClick={() => handlePickSelection(matchId, "draw")}
                                      disabled={isMatchStarted(safeStartTimeToISOString(match.startTime)) || isExpired}
                                      className={`px-3 py-2 text-center rounded transition-all duration-200 font-bold text-sm ${
                                        isMatchStarted(safeStartTimeToISOString(match.startTime)) || isExpired
                                          ? "bg-slate-700/30 text-slate-400 cursor-not-allowed opacity-50"
                                          : picks.find(p => p.id === matchId && p.pick === "draw")
                                          ? "bg-gradient-secondary text-black shadow-md scale-105"
                                          : "bg-secondary/10 text-white hover:bg-secondary/20 hover:text-secondary border border-transparent hover:border-secondary/30"
                                      }`}
                                    >
                                      <div className="text-xs opacity-75">X</div>
                                      <div>{match.oddsDraw.toFixed(2)}</div>
                                    </button>
                                    
                                    <button
                                      onClick={() => handlePickSelection(matchId, "away")}
                                      disabled={isMatchStarted(safeStartTimeToISOString(match.startTime)) || isExpired}
                                      className={`px-3 py-2 text-center rounded transition-all duration-200 font-bold text-sm ${
                                        isMatchStarted(safeStartTimeToISOString(match.startTime)) || isExpired
                                          ? "bg-slate-700/30 text-slate-400 cursor-not-allowed opacity-50"
                                          : picks.find(p => p.id === matchId && p.pick === "away")
                                          ? "bg-gradient-accent text-black shadow-md scale-105"
                                          : "bg-accent/10 text-white hover:bg-accent/20 hover:text-accent border border-transparent hover:border-accent/30"
                                      }`}
                                    >
                                      <div className="text-xs opacity-75">2</div>
                                      <div>{match.oddsAway.toFixed(2)}</div>
                                    </button>
                                  </div>
                                </div>

                                {/* Over/Under Market */}
                                <div>
                                  <div className="text-sm text-text-muted mb-2">Total Goals O/U 2.5</div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <button
                                      onClick={() => handlePickSelection(matchId, "over")}
                                      disabled={isMatchStarted(safeStartTimeToISOString(match.startTime)) || isExpired}
                                      className={`px-2 py-2 text-center rounded transition-all duration-200 font-bold text-sm ${
                                        isMatchStarted(safeStartTimeToISOString(match.startTime)) || isExpired
                                          ? "bg-slate-700/30 text-slate-400 cursor-not-allowed opacity-50"
                                          : picks.find(p => p.id === matchId && p.pick === "over")
                                          ? "bg-gradient-to-r from-blue-500 to-primary text-black shadow-md scale-105"
                                          : "bg-blue-500/10 text-white hover:bg-blue-500/20 hover:text-blue-300 border border-transparent hover:border-blue-300/30"
                                      }`}
                                    >
                                      <div className="text-xs opacity-75">O</div>
                                      <div>{match.oddsOver.toFixed(2)}</div>
                                    </button>
                                    
                                    <button
                                      onClick={() => handlePickSelection(matchId, "under")}
                                      disabled={isMatchStarted(safeStartTimeToISOString(match.startTime)) || isExpired}
                                      className={`px-2 py-2 text-center rounded transition-all duration-200 font-bold text-sm ${
                                        isMatchStarted(safeStartTimeToISOString(match.startTime)) || isExpired
                                          ? "bg-slate-700/30 text-slate-400 cursor-not-allowed opacity-50"
                                          : picks.find(p => p.id === matchId && p.pick === "under")
                                          ? "bg-gradient-to-r from-purple-500 to-blue-600 text-black shadow-md scale-105"
                                          : "bg-purple-500/10 text-white hover:bg-purple-500/20 hover:text-purple-300 border border-transparent hover:border-purple-300/30"
                                      }`}
                                    >
                                      <div className="text-xs opacity-75">U</div>
                                      <div>{match.oddsUnder.toFixed(2)}</div>
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Desktop Layout */}
                              <div className="hidden md:grid md:grid-cols-12 gap-2">
                                {/* Time */}
                                <div className="col-span-1 text-center">
                                  <div className={`text-xs font-mono px-2 py-1 rounded ${
                                    isMatchStarted(safeStartTimeToISOString(match.startTime))
                                      ? "text-red-400 bg-red-500/10 border border-red-500/20"
                                      : "text-text-secondary bg-primary/10"
                                  }`}>
                                    <div className="font-bold">
                                      {new Date(safeStartTimeToISOString(match.startTime)).toLocaleTimeString('en-US', { 
                                        hour: '2-digit', 
                                        minute: '2-digit',
                                        hour12: false
                                      })}
                                    </div>
                                    {isMatchStarted(safeStartTimeToISOString(match.startTime)) ? (
                                      <div className="text-[8px] text-red-400 font-bold">STARTED</div>
                                    ) : (
                                      <div className="text-[8px] text-text-muted">AM</div>
                                    )}
                                  </div>
                                </div>

                                {/* Match */}
                                <div className="col-span-5 flex items-center justify-center">
                                  <div className="text-sm font-semibold text-white text-center leading-tight">
                                    <div className="truncate">{match.homeTeam}</div>
                                    <div className="text-xs text-text-muted">vs</div>
                                    <div className="truncate">{match.awayTeam}</div>
                                  </div>
                                </div>

                                {/* Home Win (1) */}
                                <div className="col-span-1 text-center">
                                  <button
                                    onClick={() => handlePickSelection(matchId, "home")}
                                    disabled={isMatchStarted(safeStartTimeToISOString(match.startTime)) || isExpired}
                                    className={`w-full px-2 py-1 text-center rounded transition-all duration-200 font-bold text-xs ${
                                      isMatchStarted(safeStartTimeToISOString(match.startTime)) || isExpired
                                        ? "bg-slate-700/30 text-slate-400 cursor-not-allowed opacity-50"
                                        : picks.find(p => p.id === matchId && p.pick === "home")
                                        ? "bg-gradient-primary text-black shadow-md scale-105"
                                        : "bg-primary/10 text-white hover:bg-primary/20 hover:text-primary border border-transparent hover:border-primary/30"
                                    }`}
                                  >
                                    {match.oddsHome.toFixed(2)}
                                  </button>
                                </div>
                                
                                {/* Draw (X) */}
                                <div className="col-span-1 text-center">
                                  <button
                                    onClick={() => handlePickSelection(matchId, "draw")}
                                    disabled={isMatchStarted(safeStartTimeToISOString(match.startTime)) || isExpired}
                                    className={`w-full px-2 py-1 text-center rounded transition-all duration-200 font-bold text-xs ${
                                      isMatchStarted(safeStartTimeToISOString(match.startTime)) || isExpired
                                        ? "bg-slate-700/30 text-slate-400 cursor-not-allowed opacity-50"
                                        : picks.find(p => p.id === matchId && p.pick === "draw")
                                        ? "bg-gradient-secondary text-black shadow-md scale-105"
                                        : "bg-secondary/10 text-white hover:bg-secondary/20 hover:text-secondary border border-transparent hover:border-secondary/30"
                                    }`}
                                  >
                                    {match.oddsDraw.toFixed(2)}
                                  </button>
                                </div>
                                
                                {/* Away Win (2) */}
                                <div className="col-span-1 text-center">
                                  <button
                                    onClick={() => handlePickSelection(matchId, "away")}
                                    disabled={isMatchStarted(safeStartTimeToISOString(match.startTime)) || isExpired}
                                    className={`w-full px-2 py-1 text-center rounded transition-all duration-200 font-bold text-xs ${
                                      isMatchStarted(safeStartTimeToISOString(match.startTime)) || isExpired
                                        ? "bg-slate-700/30 text-slate-400 cursor-not-allowed opacity-50"
                                        : picks.find(p => p.id === matchId && p.pick === "away")
                                        ? "bg-gradient-accent text-black shadow-md scale-105"
                                        : "bg-accent/10 text-white hover:bg-accent/20 hover:text-accent border border-transparent hover:border-accent/30"
                                    }`}
                                  >
                                    {match.oddsAway.toFixed(2)}
                                  </button>
                                </div>
                                
                                {/* Over/Under 2.5 */}
                                <div className="col-span-2 text-center">
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => handlePickSelection(matchId, "over")}
                                      disabled={isMatchStarted(safeStartTimeToISOString(match.startTime)) || isExpired}
                                      className={`flex-1 px-1 py-1 text-center rounded transition-all duration-200 font-bold text-xs ${
                                        isMatchStarted(safeStartTimeToISOString(match.startTime)) || isExpired
                                          ? "bg-slate-700/30 text-slate-400 cursor-not-allowed opacity-50"
                                          : picks.find(p => p.id === matchId && p.pick === "over")
                                          ? "bg-gradient-to-r from-blue-500 to-primary text-black shadow-md scale-105"
                                          : "bg-blue-500/10 text-white hover:bg-blue-500/20 hover:text-blue-300 border border-transparent hover:border-blue-300/30"
                                      }`}
                                    >
                                      O{match.oddsOver.toFixed(2)}
                                    </button>
                                    <button
                                      onClick={() => handlePickSelection(matchId, "under")}
                                      disabled={isMatchStarted(safeStartTimeToISOString(match.startTime)) || isExpired}
                                      className={`flex-1 px-1 py-1 text-center rounded transition-all duration-200 font-bold text-xs ${
                                        isMatchStarted(safeStartTimeToISOString(match.startTime)) || isExpired
                                          ? "bg-slate-700/30 text-slate-400 cursor-not-allowed opacity-50"
                                          : picks.find(p => p.id === matchId && p.pick === "under")
                                          ? "bg-gradient-to-r from-purple-500 to-blue-600 text-black shadow-md scale-105"
                                          : "bg-purple-500/10 text-white hover:bg-purple-500/20 hover:text-purple-300 border border-transparent hover:border-purple-300/30"
                                      }`}
                                    >
                                      U{match.oddsUnder.toFixed(2)}
                                    </button>
                                  </div>
                                </div>

                                {/* League */}
                                <div className="col-span-1 text-center">
                                  <div className="text-xs text-text-secondary truncate">
                                    {match.leagueName}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Slip Builder */}
                <motion.div
                  key="slip"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="lg:col-span-1"
                >
                  <div className="glass-card sticky top-8 p-4 md:p-6">
                    <h3 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6 text-center flex items-center justify-center gap-2">
                      <ShieldCheckIcon className="h-5 w-5 md:h-6 md:w-6" />
                      <span className="hidden sm:inline">Slip Builder</span>
                      <span className="sm:hidden">Slip</span>
                    </h3>

                    {/* Wallet Connection Prompt */}
                    {!isConnected && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-4 bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 rounded-button"
                      >
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <BoltIcon className="h-5 w-5 text-primary" />
                            <span className="font-semibold text-primary">Connect Wallet to Place Slips</span>
                          </div>
                          <p className="text-sm text-text-secondary mb-3">
                            Connect your wallet to start building prediction slips and compete for prizes!
                          </p>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              // Trigger wallet connection
                              if (typeof window !== 'undefined' && window.ethereum) {
                                window.ethereum.request({ method: 'eth_requestAccounts' });
                              }
                            }}
                            className="w-full"
                          >
                            Connect Wallet
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {/* CRITICAL: Progress indicator for 10 predictions requirement */}
                    <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-button">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-text-muted">Predictions Required:</span>
                        <span className={`font-bold ${picks.length === 10 ? 'text-green-400' : 'text-primary'}`}>
                          {picks.length}/10
                        </span>
                      </div>
                      <div className="w-full bg-bg-card/30 rounded-full h-0.5">
                        <div 
                          className={`h-0.5 rounded-full transition-all duration-300 ${
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
                                {entryFee} STT
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-text-muted">Potential Win:</span>
                              <span className="text-secondary font-bold">{(parseFloat(totalOdd) * parseFloat(entryFee)).toFixed(2)} STT</span>
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
                                  {entryFee} STT
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-sm mt-1">
                                <span className="text-text-muted">Potential Payout:</span>
                                <span className="text-primary font-bold">
                                  {(parseFloat(totalOdd) * parseFloat(entryFee)).toFixed(2)} STT
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
            )}

            {/* My Slips Tab */}
            {activeTab === "slips" ? (
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
                  
                  <EnhancedSlipDisplay 
                    slips={allSlips} 
                  />
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
                    Match Results
                  </h2>
                  <OddysseyMatchResults cycleId={cycleInfo ? Number(cycleInfo.cycleId) : undefined} />
                </div>
              </motion.div>
            ) : activeTab === "stats" ? (
              <motion.div
                key="stats"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="lg:col-span-3"
              >
                <div className="space-y-6">
                  {/* Cycle Progress - Enhanced with full data */}
                  {cycleInfo && (
                    <CycleProgress cycleInfo={cycleInfo} />
                  )}

                  {/* User Stats Card - New Component */}
                  {userStats && (
                    <UserStatsCard 
                      userStats={userStats} 
                      currentCycle={cycleInfo ? Number(cycleInfo.cycleId) : undefined}
                    />
                  )}

                  {/* Enhanced Global Stats */}
                  {stats && (
                    <div className="glass-card p-6">
                      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                        <ArrowTrendingUpIcon className="h-6 w-6 text-primary" />
                        Global Statistics
                      </h2>
                      
                      {/* Primary Stats Grid - 4 Main Metrics */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {/* Total Players */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0 }}
                          className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl hover:border-primary/40 transition-all duration-300"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <UsersIcon className="w-5 h-5 text-primary" />
                            <span className="text-sm font-medium text-gray-400">Total Players</span>
                          </div>
                          <div className="text-3xl font-bold text-primary mb-1">{(stats.totalPlayers || 0).toLocaleString()}</div>
                          <div className="text-xs text-gray-500">across all cycles</div>
                        </motion.div>

                        {/* Total Slips */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="p-4 bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20 rounded-xl hover:border-secondary/40 transition-all duration-300"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <DocumentTextIcon className="w-5 h-5 text-secondary" />
                            <span className="text-sm font-medium text-gray-400">Total Slips</span>
                          </div>
                          <div className="text-3xl font-bold text-secondary mb-1">{(stats.totalSlips || 0).toLocaleString()}</div>
                          <div className="text-xs text-gray-500">submitted & tracked</div>
                        </motion.div>

                        {/* Total Volume */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 rounded-xl hover:border-accent/40 transition-all duration-300"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <CurrencyDollarIcon className="w-5 h-5 text-accent" />
                            <span className="text-sm font-medium text-gray-400">Total Volume</span>
                          </div>
                          <div className="text-3xl font-bold text-accent mb-1">{(stats.totalVolume / 1e18).toFixed(2)} STT</div>
                          <div className="text-xs text-gray-500">prize pool value</div>
                        </motion.div>

                        {/* Total Winners */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20 rounded-xl hover:border-yellow-500/40 transition-all duration-300"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <TrophyIcon className="w-5 h-5 text-yellow-400" />
                            <span className="text-sm font-medium text-gray-400">Winners</span>
                          </div>
                          <div className="text-3xl font-bold text-yellow-400 mb-1">{(stats.totalWinners || 0).toLocaleString()}</div>
                          <div className="text-xs text-gray-500">qualified players</div>
                        </motion.div>
                      </div>

                      {/* Secondary Stats - Performance Metrics */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {/* Win Rate */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                          className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-xl"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <FireIcon className="w-5 h-5 text-orange-400" />
                              <span className="text-sm font-medium text-gray-300">Win Rate</span>
                            </div>
                            <span className="text-2xl font-bold text-orange-400">{(stats.winRate || 0).toFixed(2)}%</span>
                          </div>
                          <div className="w-full bg-gray-700/50 rounded-full h-2">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(stats.winRate || 0, 100)}%` }}
                              transition={{ duration: 1, delay: 0.5 }}
                              className="h-2 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500"
                            />
                          </div>
                        </motion.div>

                        {/* Evaluation Progress */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                          className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-xl"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <CheckCircleIcon className="w-5 h-5 text-blue-400" />
                              <span className="text-sm font-medium text-gray-300">Evaluation Progress</span>
                            </div>
                            <span className="text-2xl font-bold text-blue-400">{(stats.evaluationProgress || 0).toFixed(2)}%</span>
                          </div>
                          <div className="w-full bg-gray-700/50 rounded-full h-2">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(stats.evaluationProgress || 0, 100)}%` }}
                              transition={{ duration: 1, delay: 0.5 }}
                              className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 relative overflow-hidden"
                            >
                              {(stats.evaluationProgress || 0) > 0 && (
                                <motion.div
                                  initial={{ x: '-100%' }}
                                  animate={{ x: '100%' }}
                                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                />
                              )}
                            </motion.div>
                          </div>
                        </motion.div>
                      </div>

                      {/* Additional Stats - Bottom Section */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Avg Prize Pool */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6 }}
                          className="text-center p-3 bg-gray-800/30 rounded-lg border border-gray-700/50 hover:border-gray-600 transition-all"
                        >
                          <div className="text-sm text-gray-400 mb-2">Avg Prize Pool</div>
                          <div className="text-xl font-bold text-green-400">{(stats.avgPrizePool / 1e18).toFixed(2)} STT</div>
                        </motion.div>

                        {/* Total Cycles */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.7 }}
                          className="text-center p-3 bg-gray-800/30 rounded-lg border border-gray-700/50 hover:border-gray-600 transition-all"
                        >
                          <div className="text-sm text-gray-400 mb-2">Total Cycles</div>
                          <div className="text-xl font-bold text-purple-400">{(stats.totalCycles || 0).toLocaleString()}</div>
                        </motion.div>

                        {/* Avg Correct Predictions */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.8 }}
                          className="text-center p-3 bg-gray-800/30 rounded-lg border border-gray-700/50 hover:border-gray-600 transition-all"
                        >
                          <div className="text-sm text-gray-400 mb-2">Avg Accuracy</div>
                          <div className="text-xl font-bold text-cyan-400">{(stats.avgCorrect || 0).toFixed(2)}</div>
                        </motion.div>

                        {/* Correct Predictions */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.9 }}
                          className="text-center p-3 bg-gray-800/30 rounded-lg border border-gray-700/50 hover:border-gray-600 transition-all"
                        >
                          <div className="text-sm text-gray-400 mb-2">Winning Slips</div>
                          <div className="text-xl font-bold text-green-400">{(stats.correctPredictions || 0).toLocaleString()}</div>
                        </motion.div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : activeTab === "leaderboard" ? (
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="lg:col-span-3"
              >
                <div className="glass-card p-6 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 border border-yellow-500/20 shadow-lg shadow-yellow-500/10">
                  <h2 className="text-2xl font-bold text-yellow-300 mb-6 flex items-center gap-2">
                    <TrophyIcon className="h-6 w-6 text-yellow-400" />
                    Daily Leaderboard
                  </h2>
                  
                  <OddysseyLeaderboard />
                </div>
              </motion.div>
            ) : activeTab === "analytics" ? (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="lg:col-span-3"
              >
                <AnalyticsDashboard 
                  cycleId={cycleInfo ? Number(cycleInfo.cycleId) : 1}
                />
              </motion.div>
            ) : activeTab === "claim" ? (
              <motion.div
                key="claim"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="lg:col-span-3"
              >
                <div className="bg-gray-800/50 rounded-2xl border border-gray-600 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <GiftIcon className="h-6 w-6 text-yellow-400" />
                    <h2 className="text-xl font-bold text-white">Claim Odyssey Prizes</h2>
                  </div>
                  
                  <div className="text-center py-12">
                    <GiftIcon className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Claim Your Winnings</h3>
                    <p className="text-gray-400 mb-6">
                      Use the Prize Claiming modal to view and claim your Odyssey prizes from winning slips.
                    </p>
                    
                    <Button
                      onClick={() => {
                        // Open the prize claim modal
                        const event = new CustomEvent('openPrizeClaimModal');
                        window.dispatchEvent(event);
                      }}
                      variant="primary"
                      className="flex items-center gap-2 mx-auto"
                    >
                      <GiftIcon className="h-5 w-5" />
                      Open Prize Claiming
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

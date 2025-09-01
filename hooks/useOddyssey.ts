import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS } from '@/contracts';
import { formatUnits, parseUnits } from 'viem';
import { useQuery } from '@tanstack/react-query';
import { API_CONFIG } from '@/config/api';
import { oddysseyService, type OddysseyCycle, type OddysseyMatch } from '@/services/oddysseyService';
import { transformContractData } from '@/utils/bigint-serializer';

export enum BetType {
  MONEYLINE = 0,
  OVER_UNDER = 1
}

export enum MoneylineResult {
  NotSet = 0,
  HomeWin = 1,
  Draw = 2,
  AwayWin = 3
}

export enum OverUnderResult {
  NotSet = 0,
  Over = 1,
  Under = 2
}

export interface Result {
  moneyline: MoneylineResult;
  overUnder: OverUnderResult;
}

export interface Match {
  id: bigint;
  startTime: bigint;
  oddsHome: number;
  oddsDraw: number;
  oddsAway: number;
  oddsOver: number;
  oddsUnder: number;
  result: Result;
}

export interface UserPrediction {
  matchId: bigint;
  betType: BetType;
  selection: string;
  selectedOdd: number;
}

export interface Slip {
  player: string;
  cycleId: bigint;
  placedAt: bigint;
  predictions: UserPrediction[];
  finalScore: bigint;
  correctCount: number;
  isEvaluated: boolean;
}

export interface LeaderboardEntry {
  player: string;
  slipId: bigint;
  finalScore: bigint;
  correctCount: number;
}

export interface CycleStats {
  volume: bigint;
  slips: number;
  evaluatedSlips: number;
}

export interface GlobalStats {
  totalVolume: bigint;
  totalSlips: number;
  highestOdd: bigint;
}

export function useOddyssey() {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Read contract functions
  const { data: entryFee } = useReadContract({
    ...CONTRACTS.ODDYSSEY,
    functionName: 'entryFee',
    query: {
      select: (data) => transformContractData(data),
    },
  });

  const { data: dailyCycleId, refetch: refetchCycleId } = useReadContract({
    ...CONTRACTS.ODDYSSEY,
    functionName: 'dailyCycleId',
    query: {
      select: (data) => transformContractData(data),
    },
  });

  const { data: slipCount } = useReadContract({
    ...CONTRACTS.ODDYSSEY,
    functionName: 'slipCount',
    query: {
      select: (data) => transformContractData(data),
    },
  });

  const { data: globalStats, refetch: refetchGlobalStats } = useReadContract({
    ...CONTRACTS.ODDYSSEY,
    functionName: 'stats',
    query: {
      select: (data) => transformContractData(data),
    },
  });

  // Get current cycle matches
  const { data: dailyMatches, refetch: refetchMatches } = useReadContract({
    ...CONTRACTS.ODDYSSEY,
    functionName: 'getDailyMatches',
    args: dailyCycleId ? [Number(dailyCycleId)] : undefined,
    query: { 
      enabled: !!dailyCycleId,
      select: (data) => transformContractData(data),
    }
  });

  // Get current cycle leaderboard
  const { data: dailyLeaderboard, refetch: refetchLeaderboard } = useReadContract({
    ...CONTRACTS.ODDYSSEY,
    functionName: 'getDailyLeaderboard',
    args: dailyCycleId ? [Number(dailyCycleId)] : undefined,
    query: { 
      enabled: !!dailyCycleId,
      select: (data) => transformContractData(data),
    }
  });

  // Get current cycle stats
  const { data: cycleStats, refetch: refetchCycleStats } = useReadContract({
    ...CONTRACTS.ODDYSSEY,
    functionName: 'cycleStats',
    args: dailyCycleId ? [Number(dailyCycleId)] : undefined,
    query: { 
      enabled: !!dailyCycleId,
      select: (data) => transformContractData(data),
    }
  });

  // Get current cycle prize pool
  const { data: prizePool, refetch: refetchPrizePool } = useReadContract({
    ...CONTRACTS.ODDYSSEY,
    functionName: 'dailyPrizePools',
    args: dailyCycleId ? [Number(dailyCycleId)] : undefined,
    query: { 
      enabled: !!dailyCycleId,
      select: (data) => transformContractData(data),
    }
  });

  // Backend API queries for additional data - optimized intervals
  const { data: backendCycleData, isLoading: backendLoading, refetch: refetchBackendData } = useQuery({
    queryKey: ['oddyssey', 'backend', 'currentCycle'],
    queryFn: () => oddysseyService.getCurrentCycle(),
    refetchInterval: 120000, // Reduced to every 2 minutes
    staleTime: 60000, // Consider data fresh for 1 minute
  });

  // Fetch Oddyssey matches from backend API using the working contract-matches endpoint
  const { data: backendOddysseyMatches, refetch: refetchBackendOddysseyMatches } = useQuery({
    queryKey: ['oddyssey', 'backend', 'matches'],
    queryFn: () => oddysseyService.getMatches(),
    refetchInterval: 120000, // Reduced to every 2 minutes
    staleTime: 60000, // Consider data fresh for 1 minute
  });

  const { data: leaderboardData, refetch: refetchBackendLeaderboard } = useQuery({
    queryKey: ['oddyssey', 'leaderboard', dailyCycleId?.toString()],
    queryFn: () => oddysseyService.getLeaderboard(),
    enabled: !!dailyCycleId,
    refetchInterval: 180000, // Reduced to every 3 minutes
    staleTime: 120000, // Consider data fresh for 2 minutes
  });

  // NEW: Get user slips with real evaluation data
  const { data: backendUserSlips, refetch: refetchBackendSlips } = useQuery({
    queryKey: ['oddyssey', 'user-slips', address],
    queryFn: () => address ? oddysseyService.getUserSlipsWithEvaluation(address) : null,
    enabled: !!address,
    refetchInterval: 60000, // Every minute for real-time updates
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // NEW: Check cycle synchronization status
  const { data: cycleSyncStatus, refetch: refetchCycleSync } = useQuery({
    queryKey: ['oddyssey', 'cycle-sync'],
    queryFn: () => oddysseyService.checkCycleSync(),
    refetchInterval: 300000, // Every 5 minutes
    staleTime: 120000, // Consider data fresh for 2 minutes
  });

  const { data: backendStats, refetch: refetchBackendStats } = useQuery({
    queryKey: ['oddyssey', 'backend', 'stats', dailyCycleId?.toString()],
    queryFn: () => oddysseyService.getCycleStats(),
    enabled: !!dailyCycleId,
    refetchInterval: 180000, // Reduced to every 3 minutes
    staleTime: 120000, // Consider data fresh for 2 minutes
  });

  // Get current cycle end time
  const { data: cycleEndTime } = useReadContract({
    ...CONTRACTS.ODDYSSEY,
    functionName: 'dailyCycleEndTimes',
    args: dailyCycleId ? [Number(dailyCycleId)] : undefined,
    query: { 
      enabled: !!dailyCycleId,
      select: (data) => transformContractData(data),
    }
  });

  // Get user slips for current cycle
  const { data: userSlips, refetch: refetchUserSlips } = useReadContract({
    ...CONTRACTS.ODDYSSEY,
    functionName: 'getUserSlipsForCycle',
    args: address && dailyCycleId ? [address, Number(dailyCycleId)] : undefined,
    query: { 
      enabled: !!(address && dailyCycleId),
      select: (data) => transformContractData(data),
    }
  });

  // Get if cycle is resolved
  const { data: isCycleResolved } = useReadContract({
    ...CONTRACTS.ODDYSSEY,
    functionName: 'isCycleResolved',
    args: dailyCycleId ? [Number(dailyCycleId)] : undefined,
    query: { 
      enabled: !!dailyCycleId,
      select: (data) => transformContractData(data),
    }
  });

  // Write contract functions
  const placeSlip = async (predictions: UserPrediction[]) => {
    if (!entryFee || !address) return;
    
    try {
      // Convert predictions to backend format
      const backendPredictions = predictions.map(pred => ({
        matchId: Number(pred.matchId),
        betType: pred.betType === BetType.MONEYLINE ? 'MONEYLINE' : 'OVER_UNDER',
        selection: pred.selection,
        selectedOdd: pred.selectedOdd
      }));
      
      // Call backend API (this will handle both contract call and database tracking)
      const result = await oddysseyService.placeSlip(address, backendPredictions, dailyCycleId as number);
      
      console.log('✅ Slip placed successfully:', result);
      
      // Refresh data after successful placement
      refetchAll();
      
      return result;
      
    } catch (error) {
      console.error('Error placing slip:', error);
      throw error;
    }
  };

  const evaluateSlip = async (slipId: number) => {
    writeContract({
      ...CONTRACTS.ODDYSSEY,
      functionName: 'evaluateSlip',
      args: [BigInt(slipId)],
    });
  };

  const claimPrize = async (cycleId: number) => {
    writeContract({
      ...CONTRACTS.ODDYSSEY,
      functionName: 'claimPrize',
      args: [BigInt(cycleId)],
    });
  };

  // Add new function to fetch live match data
  const fetchLiveMatchData = useCallback(async (matches: Match[]) => {
    try {
      if (!matches || matches.length === 0) return {};

      const response = await fetch(`${API_CONFIG.baseURL}/api/oddyssey/live-matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          matchIds: matches.map(m => Number(m.id))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch live match data');
      }

      const liveData = await response.json();
      return liveData.matches || {};
    } catch (error) {
      console.error('Error fetching live match data:', error);
      return {};
    }
  }, []);

  // Enhanced daily matches with live data - optimized for performance
  const { data: dailyMatchesWithLive, refetch: refetchDailyMatches } = useQuery({
    queryKey: ['oddyssey-daily-matches-live', dailyCycleId],
    queryFn: async () => {
      const matches = Array.isArray(dailyMatches) ? dailyMatches : [];
      if (matches.length === 0) return [];
      
      const liveData = await fetchLiveMatchData(matches);
      
      return matches.map((match: any) => ({
        ...match,
        liveData: liveData[Number(match.id)] || null,
        isLive: liveData[Number(match.id)]?.status === 'LIVE' || false,
        currentScore: liveData[Number(match.id)]?.score || null
      }));
    },
    enabled: !!dailyMatches && Array.isArray(dailyMatches) && dailyMatches.length > 0,
    refetchInterval: 60000, // Reduced to every 1 minute for live data
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Helper functions
  const formatAmount = (amount?: bigint | string): string => {
    if (!amount) return '0';
    // Handle both BigInt and string (from our serialization)
    if (typeof amount === 'string') {
      try {
        return formatUnits(BigInt(amount), 18);
      } catch {
        return '0';
      }
    }
    return formatUnits(amount, 18);
  };

  const formatOdds = (odds: number): string => {
    return (odds / 1000).toFixed(2);
  };

  const getSelectionHash = (selection: string): string => {
    // These should match the contract's hash values
    switch (selection) {
      case '1': case 'home': return '0x' + Buffer.from('1').toString('hex');
      case 'X': case 'draw': return '0x' + Buffer.from('X').toString('hex');
      case '2': case 'away': return '0x' + Buffer.from('2').toString('hex');
      case 'Over': case 'over': return '0x' + Buffer.from('Over').toString('hex');
      case 'Under': case 'under': return '0x' + Buffer.from('Under').toString('hex');
      default: return '0x';
    }
  };

  const getSelectionName = (selection: string, betType: BetType): string => {
    if (betType === BetType.MONEYLINE) {
      switch (selection) {
        case '1': return 'Home Win';
        case 'X': return 'Draw';
        case '2': return 'Away Win';
        default: return 'Unknown';
      }
    } else {
      switch (selection) {
        case 'Over': return 'Over';
        case 'Under': return 'Under';
        default: return 'Unknown';
      }
    }
  };

  const getOddsForSelection = (match: Match, selection: string, betType: BetType): number => {
    if (betType === BetType.MONEYLINE) {
      switch (selection) {
        case '1': return match.oddsHome;
        case 'X': return match.oddsDraw;
        case '2': return match.oddsAway;
        default: return 0;
      }
    } else {
      switch (selection) {
        case 'Over': return match.oddsOver;
        case 'Under': return match.oddsUnder;
        default: return 0;
      }
    }
  };

  const isBettingOpen = (): boolean => {
    if (!cycleEndTime) return false;
    return Date.now() / 1000 < Number(cycleEndTime);
  };

  const getTimeRemaining = (): number => {
    if (!cycleEndTime) return 0;
    const remaining = Number(cycleEndTime) - Math.floor(Date.now() / 1000);
    return Math.max(0, remaining * 1000); // Return in milliseconds
  };

  const calculatePotentialScore = (predictions: UserPrediction[]): number => {
    let score = 1000; // ODDS_SCALING_FACTOR
    for (const prediction of predictions) {
      score = (score * prediction.selectedOdd) / 1000;
    }
    return score;
  };

  const getUserRank = (): number => {
    if (!dailyLeaderboard || !address) return -1;
    const leaderboard = dailyLeaderboard as LeaderboardEntry[];
    
    for (let i = 0; i < leaderboard.length; i++) {
      if (leaderboard[i].player.toLowerCase() === address.toLowerCase()) {
        return i;
      }
    }
    return -1;
  };

  const getPrizeDistribution = (): { rank: number; percentage: number }[] => {
    return [
      { rank: 1, percentage: 40 },
      { rank: 2, percentage: 30 },
      { rank: 3, percentage: 20 },
      { rank: 4, percentage: 5 },
      { rank: 5, percentage: 5 }
    ];
  };

  const calculatePrizeAmount = (rank: number): string => {
    if (!prizePool || rank < 0 || rank >= 5) return '0';
    
    const percentages = [40, 30, 20, 5, 5];
    const percentage = percentages[rank];
    const amount = (Number(prizePool) * percentage) / 100;
    
    return formatUnits(BigInt(Math.floor(amount)), 18);
  };

  const refetchAll = () => {
    refetchCycleId();
    refetchMatches();
    refetchLeaderboard();
    refetchCycleStats();
    refetchPrizePool();
    refetchUserSlips();
    refetchGlobalStats();
    refetchDailyMatches(); // Refetch live matches
    // Backend data
    refetchBackendData();
    refetchBackendOddysseyMatches(); // Refetch backend Oddyssey matches
    refetchBackendLeaderboard();
    refetchBackendSlips();
    refetchBackendStats();
  };

  return {
    // Contract data
    entryFee: formatAmount(entryFee as string | bigint | undefined),
    dailyCycleId: Number(dailyCycleId || 0),
    slipCount: Number(slipCount || 0),
    globalStats: globalStats as GlobalStats,
    dailyMatches: backendOddysseyMatches?.data?.today?.matches || dailyMatchesWithLive || dailyMatches || [],
    dailyLeaderboard: dailyLeaderboard as LeaderboardEntry[],
    cycleStats: cycleStats as CycleStats,
    prizePool: formatAmount(prizePool as string | bigint | undefined),
    isCycleResolved: isCycleResolved as boolean,
    userSlips: userSlips || [],
    
    // Backend data
    backendCycleData: backendCycleData?.cycle,
    backendLoading,
    leaderboard: leaderboardData?.leaderboard || [],
    backendUserSlips: backendUserSlips?.data || [],
    backendStats: backendStats?.stats,
    
    // Calculated data
    isBettingOpen: isBettingOpen(),
    timeRemaining: getTimeRemaining(),
    userRank: getUserRank(),
    prizeDistribution: getPrizeDistribution(),
    userPrizeAmount: calculatePrizeAmount(getUserRank()),
    
    // Actions
    placeSlip,
    evaluateSlip,
    claimPrize,
    
    // Transaction state
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    
    // Helpers
    formatAmount,
    formatOdds,
    getSelectionHash,
    getSelectionName,
    getOddsForSelection,
    calculatePotentialScore,
    calculatePrizeAmount,
    refetchAll,
    fetchLiveMatchData,
    refetchDailyMatches,
  };
}

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS } from '@/contracts';
import { formatUnits, parseUnits } from 'viem';
import { useQuery } from '@tanstack/react-query';
import { oddysseyService, type OddysseyMatch } from '@/services/oddysseyService';
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
      select: (data: unknown) => transformContractData(data),
    },
  });

  const { data: dailyCycleId, refetch: refetchCycleId } = useReadContract({
    ...CONTRACTS.ODDYSSEY,
    functionName: 'dailyCycleId',
    query: {
      select: (data: unknown) => transformContractData(data),
    },
  });

  const { data: slipCount } = useReadContract({
    ...CONTRACTS.ODDYSSEY,
    functionName: 'slipCount',
    query: {
      select: (data: unknown) => transformContractData(data),
    },
  });

  const { data: globalStats, refetch: refetchGlobalStats } = useReadContract({
    ...CONTRACTS.ODDYSSEY,
    functionName: 'stats',
    query: {
      select: (data: unknown) => transformContractData(data),
    },
  });

  // Get current cycle matches
  const { data: dailyMatches, refetch: refetchMatches } = useReadContract({
    ...CONTRACTS.ODDYSSEY,
    functionName: 'getDailyMatches',
    args: dailyCycleId ? [Number(dailyCycleId)] : undefined,
    query: { 
      enabled: !!dailyCycleId,
      select: (data: unknown) => transformContractData(data),
    }
  });

  // Get current cycle leaderboard
  const { data: dailyLeaderboard, refetch: refetchLeaderboard } = useReadContract({
    ...CONTRACTS.ODDYSSEY,
    functionName: 'getDailyLeaderboard',
    args: dailyCycleId ? [Number(dailyCycleId)] : undefined,
    query: { 
      enabled: !!dailyCycleId,
      select: (data: unknown) => transformContractData(data),
    }
  });

  // Get current cycle stats
  const { data: cycleStats, refetch: refetchCycleStats } = useReadContract({
    ...CONTRACTS.ODDYSSEY,
    functionName: 'cycleStats',
    args: dailyCycleId ? [Number(dailyCycleId)] : undefined,
    query: { 
      enabled: !!dailyCycleId,
      select: (data: unknown) => transformContractData(data),
    }
  });

  // Get current cycle prize pool
  const { data: prizePool, refetch: refetchPrizePool } = useReadContract({
    ...CONTRACTS.ODDYSSEY,
    functionName: 'dailyPrizePools',
    args: dailyCycleId ? [Number(dailyCycleId)] : undefined,
    query: { 
      enabled: !!dailyCycleId,
      select: (data: unknown) => transformContractData(data),
    }
  });

  // Contract-based data queries using the new contract-only service
  const { data: contractCycleData, isLoading: contractLoading, refetch: refetchContractData } = useQuery({
    queryKey: ['oddyssey', 'contract', 'currentCycle'],
    queryFn: () => oddysseyService.getCurrentCycle(),
    refetchInterval: 60000, // Every minute for contract data
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Fetch Oddyssey matches directly from contract
  const { data: contractOddysseyMatches, refetch: refetchContractOddysseyMatches } = useQuery({
    queryKey: ['oddyssey', 'contract', 'matches'],
    queryFn: () => oddysseyService.getMatches(),
    refetchInterval: 60000, // Every minute for contract data
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  const { data: contractLeaderboardData, refetch: refetchContractLeaderboard } = useQuery({
    queryKey: ['oddyssey', 'contract', 'leaderboard', dailyCycleId?.toString()],
    queryFn: () => oddysseyService.getLeaderboard(),
    enabled: !!dailyCycleId,
    refetchInterval: 120000, // Every 2 minutes
    staleTime: 60000, // Consider data fresh for 1 minute
  });

  // Get user slips from contract
  const { data: contractUserSlips, refetch: refetchContractSlips } = useQuery({
    queryKey: ['oddyssey', 'contract', 'user-slips', address, dailyCycleId],
    queryFn: () => address && dailyCycleId ? oddysseyService.getUserSlipsForCycleFromBackend(Number(dailyCycleId), address as string) : null,
    enabled: !!(address && dailyCycleId),
    refetchInterval: 60000, // Every minute for real-time updates
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Contract synchronization status (always synced in contract-only mode)
  const { data: contractSyncStatus, refetch: refetchContractSync } = useQuery({
    queryKey: ['oddyssey', 'contract', 'sync'],
    queryFn: () => oddysseyService.checkCycleSync(),
    refetchInterval: 300000, // Every 5 minutes
    staleTime: 120000, // Consider data fresh for 2 minutes
  });

  const { data: contractStats, refetch: refetchContractStats } = useQuery({
    queryKey: ['oddyssey', 'contract', 'stats', dailyCycleId?.toString()],
    queryFn: () => oddysseyService.getCycleStats(),
    enabled: !!dailyCycleId,
    refetchInterval: 120000, // Every 2 minutes
    staleTime: 60000, // Consider data fresh for 1 minute
  });

  // Get current cycle end time
  const { data: cycleEndTime } = useReadContract({
    ...CONTRACTS.ODDYSSEY,
    functionName: 'dailyCycleEndTimes',
    args: dailyCycleId ? [Number(dailyCycleId)] : undefined,
    query: { 
      enabled: !!dailyCycleId,
      select: (data: unknown) => transformContractData(data),
    }
  });

  // Get user slips for current cycle
  const { data: userSlips, refetch: refetchUserSlips } = useReadContract({
    ...CONTRACTS.ODDYSSEY,
    functionName: 'getUserSlipsForCycle',
    args: address && dailyCycleId ? [address, Number(dailyCycleId)] : undefined,
    query: { 
      enabled: !!(address && dailyCycleId),
      select: (data: unknown) => transformContractData(data),
    }
  });

  // Get if cycle is resolved
  const { data: isCycleResolved } = useReadContract({
    ...CONTRACTS.ODDYSSEY,
    functionName: 'isCycleResolved',
    args: dailyCycleId ? [Number(dailyCycleId)] : undefined,
    query: { 
      enabled: !!dailyCycleId,
      select: (data: unknown) => transformContractData(data),
    }
  });

  // Write contract functions
  const placeSlip = async (predictions: UserPrediction[]) => {
    if (!entryFee || !address) return;
    
    try {
      console.log('⚠️ placeSlip via useOddyssey is deprecated. Use OddysseyContractService.placeSlip directly.');
      
      // For now, just return a warning
      throw new Error('Please use the OddysseyContractService.placeSlip method for placing slips');
      
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

  // Contract-based live match data (stub for now)
  const fetchLiveMatchData = useCallback(async (matches: Match[]) => {
    try {
      if (!matches || matches.length === 0) return {};

      // In contract-only mode, we don't have live match data
      // Return empty object for now
      console.log('📊 Contract-only mode: Live match data not available');
      return {};
    } catch (error) {
      console.error('Error in fetchLiveMatchData:', error);
      return {};
    }
  }, []);

  // Contract-based daily matches (no live data integration)
  const { data: dailyMatchesWithLive, refetch: refetchDailyMatches } = useQuery({
    queryKey: ['oddyssey-daily-matches-contract', dailyCycleId],
    queryFn: async () => {
      const matches = Array.isArray(dailyMatches) ? dailyMatches : [];
      if (matches.length === 0) return [];
      
      // In contract-only mode, just return the matches without live data
      return matches.map((match: any) => ({
        ...match,
        liveData: null,
        isLive: false,
        currentScore: null
      }));
    },
    enabled: !!dailyMatches && Array.isArray(dailyMatches) && dailyMatches.length > 0,
    refetchInterval: 60000, // Every minute
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
    refetchDailyMatches();
    // Contract data
    refetchContractData();
    refetchContractOddysseyMatches();
    refetchContractLeaderboard();
    refetchContractSlips();
    refetchContractStats();
  };

  return {
    // Contract data (primary source)
    entryFee: formatAmount(entryFee as string | bigint | undefined),
    dailyCycleId: Number(dailyCycleId || 0),
    slipCount: Number(slipCount || 0),
    globalStats: globalStats as GlobalStats,
    // PRIORITIZE CONTRACT DATA: Use contract matches as primary source
    dailyMatches: contractOddysseyMatches?.data?.today?.matches || [],
    dailyLeaderboard: dailyLeaderboard as LeaderboardEntry[],
    cycleStats: cycleStats as CycleStats,
    prizePool: formatAmount(prizePool as string | bigint | undefined),
    isCycleResolved: isCycleResolved as boolean,
    userSlips: userSlips || [],
    
    // Contract data
    contractCycleData: contractCycleData,
    contractLoading,
    leaderboard: contractLeaderboardData?.data || [],
    contractUserSlips: contractUserSlips || [],
    contractStats: contractStats?.data,
    
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

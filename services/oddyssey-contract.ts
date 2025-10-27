import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/wagmi';
import { parseUnits, formatUnits } from 'viem';
import OddysseyArtifact from '@/contracts/abis/Oddyssey.json';

// Extract ABI array from artifact
const ODDYSSEY_ABI = OddysseyArtifact.abi;

export interface UserStats {
  totalSlips: bigint;
  totalWins: bigint;
  bestScore: bigint;
  averageScore: bigint;
  winRate: bigint;
  currentStreak: bigint;
  bestStreak: bigint;
  lastActiveCycle: bigint;
}



export interface UserPrediction {
  matchId: bigint;
  betType: 0 | 1; // 0 = MONEYLINE, 1 = OVER_UNDER
  selection: `0x${string}`; // keccak256 hash of selection
  selectedOdd: number;
}

export interface Slip {
  predictions: UserPrediction[];
}

export function useOddysseyContract() {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Contract reads
  const { data: entryFee, refetch: refetchEntryFee } = useReadContract({
    address: CONTRACT_ADDRESSES.ODDYSSEY,
    abi: ODDYSSEY_ABI,
    functionName: 'entryFee',
  });

  const { data: currentCycle, refetch: refetchCurrentCycle } = useReadContract({
    address: CONTRACT_ADDRESSES.ODDYSSEY,
    abi: ODDYSSEY_ABI,
    functionName: 'getCurrentCycle',
  });

  const { data: userStats, refetch: refetchUserStats } = useReadContract({
    address: CONTRACT_ADDRESSES.ODDYSSEY,
    abi: ODDYSSEY_ABI,
    functionName: 'getUserStats',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });



  // Helper functions
  const formatEntryFee = (): string => {
    if (!entryFee) return '0';
    return formatUnits(entryFee as bigint, 18);
  };

  const formatUserStats = (): UserStats | null => {
    if (!userStats || !Array.isArray(userStats)) return null;
    return {
      totalSlips: userStats[0] as bigint,
      totalWins: userStats[1] as bigint,
      bestScore: userStats[2] as bigint,
      averageScore: userStats[3] as bigint,
      winRate: userStats[4] as bigint,
      currentStreak: userStats[5] as bigint,
      bestStreak: userStats[6] as bigint,
      lastActiveCycle: userStats[7] as bigint,
    };
  };



  // Contract writes
  const placeSlip = async (slip: Slip) => {
    if (!address) throw new Error('Wallet not connected');
    if (!entryFee) throw new Error('Entry fee not loaded');

    writeContract({
      address: CONTRACT_ADDRESSES.ODDYSSEY,
      abi: ODDYSSEY_ABI,
      functionName: 'placeSlip',
      args: [slip.predictions],
      value: entryFee as bigint,
    });
  };



  const refetchAll = () => {
    refetchEntryFee();
    refetchCurrentCycle();
    refetchUserStats();
  };

  return {
    // Contract data
    entryFee: formatEntryFee(),
    currentCycle: currentCycle ? Number(currentCycle) : 0,
    userStats: formatUserStats(),
    
    // Contract actions
    placeSlip,
    
    // Transaction state
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    
    // Utils
    refetchAll,
  };
} 
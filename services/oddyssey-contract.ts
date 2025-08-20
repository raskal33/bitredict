import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/wagmi';
import { parseUnits, formatUnits } from 'viem';
import { usePublicClient } from 'wagmi';
import OddysseyABI from '@/contracts/abis/Oddyssey.json';

// Use the full ABI from the compiled contract
const ODDYSSEY_ABI = OddysseyABI;

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
  const publicClient = usePublicClient();
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed, 
    isError: isTransactionError,
    error: transactionError,
    data: receipt
  } = useWaitForTransactionReceipt({ 
    hash,
    query: {
      enabled: !!hash,
    }
  });

  // Contract reads
  const { data: entryFee, refetch: refetchEntryFee } = useReadContract({
    address: CONTRACT_ADDRESSES.ODDYSSEY,
    abi: ODDYSSEY_ABI.abi,
    functionName: 'entryFee',
  });

  const { data: currentCycle, refetch: refetchCurrentCycle } = useReadContract({
    address: CONTRACT_ADDRESSES.ODDYSSEY,
    abi: ODDYSSEY_ABI.abi,
    functionName: 'getCurrentCycle',
  });

  const { data: userStats, refetch: refetchUserStats } = useReadContract({
    address: CONTRACT_ADDRESSES.ODDYSSEY,
    abi: ODDYSSEY_ABI.abi,
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

    try {
      // Estimate gas first
      let gasEstimate: bigint;
      if (publicClient) {
        try {
          gasEstimate = await publicClient.estimateContractGas({
            address: CONTRACT_ADDRESSES.ODDYSSEY,
            abi: ODDYSSEY_ABI.abi,
            functionName: 'placeSlip',
            args: [slip.predictions],
            value: entryFee as bigint,
            account: address,
          });
          
          // Add 30% buffer to gas estimate
          gasEstimate = (gasEstimate * BigInt(130)) / BigInt(100);
          console.log('🔥 Gas estimated:', gasEstimate.toString());
        } catch (gasError) {
          console.warn('⚠️ Gas estimation failed, using default:', gasError);
          gasEstimate = BigInt(2000000); // 2M gas fallback
        }
      } else {
        gasEstimate = BigInt(2000000); // 2M gas fallback
      }

      writeContract({
        address: CONTRACT_ADDRESSES.ODDYSSEY,
        abi: ODDYSSEY_ABI.abi,
        functionName: 'placeSlip',
        args: [slip.predictions],
        value: entryFee as bigint,
        gas: gasEstimate,
      });
    } catch (error) {
      console.error('❌ Error in placeSlip:', error);
      throw error;
    }
  };



  const refetchAll = () => {
    refetchEntryFee();
    refetchCurrentCycle();
    refetchUserStats();
  };

  // Check if transaction actually succeeded on blockchain
  const isSuccess = isConfirmed && receipt?.status === 'success';
  const isFailed = isTransactionError || (isConfirmed && receipt?.status === 'reverted');
  
  // Combine all possible errors
  const error = writeError || transactionError;

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
    isSuccess, // This now properly checks blockchain status
    isFailed,
    hash,
    error,
    receipt,
    
    // Utils
    refetchAll,
  };
} 
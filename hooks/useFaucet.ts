import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS } from '@/contracts';
import { formatUnits } from 'viem';

export interface FaucetStats {
  balance: bigint;
  totalDistributed: bigint;
  userCount: bigint;
  active: boolean;
}

export interface UserInfo {
  claimed: boolean;
  claimTime: bigint;
}

// Wagmi returns tuple functions as arrays: [bool, string, uint256]
export type EligibilityTuple = [boolean, string, bigint] | undefined;

export interface EligibilityInfo {
  eligible: boolean;
  reason: string;
  oddysseySlips: bigint;
}

export function useFaucet() {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Read contract functions
  const { data: faucetAmount } = useReadContract({
    ...CONTRACTS.FAUCET,
    functionName: 'FAUCET_AMOUNT',
  });

  const { data: minOddysseySlips } = useReadContract({
    ...CONTRACTS.FAUCET,
    functionName: 'MIN_ODDYSSEY_SLIPS',
  });

  const { data: faucetStats, refetch: refetchStats } = useReadContract({
    ...CONTRACTS.FAUCET,
    functionName: 'getFaucetStats',
  });

  const { data: userInfo, refetch: refetchUserInfo } = useReadContract({
    ...CONTRACTS.FAUCET,
    functionName: 'getUserInfo',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  // ✅ CRITICAL: Check eligibility (includes Oddyssey slips check)
  // Returns tuple: [eligible: bool, reason: string, oddysseySlips: uint256]
  const { data: eligibilityTuple, refetch: refetchEligibility } = useReadContract({
    ...CONTRACTS.FAUCET,
    functionName: 'checkEligibility',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  }) as { data: EligibilityTuple; refetch: () => void };

  // ✅ Get user's Oddyssey slip count directly from Oddyssey contract
  const { data: oddysseySlipCount, refetch: refetchOddysseySlips } = useReadContract({
    ...CONTRACTS.ODDYSSEY,
    functionName: 'getUserSlipCount',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const { data: hasSufficientBalance } = useReadContract({
    ...CONTRACTS.FAUCET,
    functionName: 'hasSufficientBalance',
  });

  const { data: maxPossibleClaims } = useReadContract({
    ...CONTRACTS.FAUCET,
    functionName: 'maxPossibleClaims',
  });

  // Write contract functions
  const claimBitr = async () => {
    writeContract({
      ...CONTRACTS.FAUCET,
      functionName: 'claimBitr',
    });
  };

  // Helper functions
  const formatAmount = (amount?: bigint): string => {
    if (!amount) return '0';
    return formatUnits(amount, 18);
  };

  const formatDate = (timestamp: bigint): string => {
    if (!timestamp || timestamp === BigInt(0)) return 'Never';
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  // Parse eligibility tuple into object
  const eligibilityInfo: EligibilityInfo | undefined = eligibilityTuple && Array.isArray(eligibilityTuple)
    ? {
        eligible: eligibilityTuple[0] as boolean,
        reason: eligibilityTuple[1] as string,
        oddysseySlips: eligibilityTuple[2] as bigint,
      }
    : undefined;

  const canClaim = (): boolean => {
    const stats = faucetStats as FaucetStats;
    const info = userInfo as UserInfo;
    
    // Use contract's checkEligibility result as source of truth
    if (eligibilityInfo) {
      return eligibilityInfo.eligible;
    }
    
    // Fallback to manual checks if eligibility not available
    return !!(
      stats?.active &&
      !info?.claimed &&
      hasSufficientBalance
    );
  };

  const getClaimStatus = (): string => {
    // Use contract's eligibility check result if available
    if (eligibilityInfo && !eligibilityInfo.eligible) {
      return eligibilityInfo.reason;
    }
    
    const stats = faucetStats as FaucetStats;
    const info = userInfo as UserInfo;
    
    if (!stats?.active) return 'Faucet is inactive';
    if (info?.claimed) return 'Already claimed';
    if (!hasSufficientBalance) return 'Insufficient faucet balance';
    return 'Ready to claim';
  };

  const refetchAll = () => {
    refetchStats();
    refetchUserInfo();
    refetchEligibility();
    refetchOddysseySlips();
  };

  // Extract eligibility data
  // ✅ CRITICAL FIX: Always use direct getUserSlipCount (not eligibilityInfo.oddysseySlips)
  // because checkEligibility returns 0 for oddysseySlips when user has already claimed
  // This ensures we always show the actual slip count, even after claiming
  const currentSlipCount = Number(oddysseySlipCount || 0);
  const requiredSlips = Number(minOddysseySlips || 2);
  const hasEnoughSlips = currentSlipCount >= requiredSlips;

  return {
    // Contract data
    faucetAmount: formatAmount(faucetAmount as bigint),
    minOddysseySlips: requiredSlips,
    faucetStats: faucetStats as FaucetStats,
    userInfo: userInfo as UserInfo,
    eligibilityInfo: eligibilityInfo,
    oddysseySlipCount: currentSlipCount,
    hasSufficientBalance: hasSufficientBalance as boolean,
    maxPossibleClaims: Number(maxPossibleClaims || 0),
    
    // Calculated data
    faucetBalance: formatAmount((faucetStats as FaucetStats)?.balance),
    totalDistributed: formatAmount((faucetStats as FaucetStats)?.totalDistributed),
    userCount: Number((faucetStats as FaucetStats)?.userCount || 0),
    isActive: (faucetStats as FaucetStats)?.active || false,
    hasClaimed: (userInfo as UserInfo)?.claimed || false,
    claimDate: formatDate((userInfo as UserInfo)?.claimTime || BigInt(0)),
    canClaim: canClaim(),
    claimStatus: getClaimStatus(),
    
    // Eligibility details
    isEligible: eligibilityInfo?.eligible || false,
    eligibilityReason: eligibilityInfo?.reason || '',
    hasEnoughSlips,
    
    // Actions
    claimBitr,
    refetchAll,
    
    // Transaction state
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    
    // Helpers
    formatAmount,
    formatDate,
  };
}

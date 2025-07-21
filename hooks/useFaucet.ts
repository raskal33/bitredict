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

export function useFaucet() {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Read contract functions
  const { data: faucetAmount } = useReadContract({
    ...CONTRACTS.FAUCET,
    functionName: 'FAUCET_AMOUNT',
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

  const canClaim = (): boolean => {
    const stats = faucetStats as FaucetStats;
    const info = userInfo as UserInfo;
    
    return !!(
      stats?.active &&
      !info?.claimed &&
      hasSufficientBalance
    );
  };

  const getClaimStatus = (): string => {
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
  };

  return {
    // Contract data
    faucetAmount: formatAmount(faucetAmount as bigint),
    faucetStats: faucetStats as FaucetStats,
    userInfo: userInfo as UserInfo,
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

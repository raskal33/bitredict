import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS } from '@/contracts';
import { formatUnits, parseUnits } from 'viem';
import { safeAdd, bigIntGreaterThan, bigIntLessThan, bigIntToNumber } from '@/utils/bigint-helpers';

export interface Tier {
  baseAPY: number;
  minStake: bigint;
  revenueShareRate: number;
}

export interface Stake {
  amount: bigint;
  startTime: bigint;
  tierId: number;
  durationOption: number;
  claimedRewardBITR: bigint;
  rewardDebtBITR: bigint;
  rewardDebtSTT: bigint;
}

export interface StakeWithRewards extends Stake {
  index: number;
  pendingRewards: bigint;
  canUnstake: boolean;
  unlockTime: number;
  currentAPY: number;
}

export enum DurationOption {
  THIRTY_DAYS = 0,
  SIXTY_DAYS = 1,
  NINETY_DAYS = 2
}

export function useStaking() {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Read contract data
  const { data: totalStaked, refetch: refetchTotalStaked } = useReadContract({
    ...CONTRACTS.BITREDICT_STAKING,
    functionName: 'totalStaked',
  });

  const { data: totalRewardsPaid } = useReadContract({
    ...CONTRACTS.BITREDICT_STAKING,
    functionName: 'totalRewardsPaid',
  });

  const { data: totalRevenuePaid } = useReadContract({
    ...CONTRACTS.BITREDICT_STAKING,
    functionName: 'totalRevenuePaid',
  });

  const { data: tiers, refetch: refetchTiers } = useReadContract({
    ...CONTRACTS.BITREDICT_STAKING,
    functionName: 'getTiers',
  });

  const { data: durationOptions } = useReadContract({
    ...CONTRACTS.BITREDICT_STAKING,
    functionName: 'getDurationOptions',
  });

  const { data: userStakes, refetch: refetchUserStakes } = useReadContract({
    ...CONTRACTS.BITREDICT_STAKING,
    functionName: 'getUserStakes',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const { data: pendingRevenueBITR, refetch: refetchRevenueBITR } = useReadContract({
    ...CONTRACTS.BITREDICT_STAKING,
    functionName: 'pendingRevenueBITR',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const { data: pendingRevenueSTT, refetch: refetchRevenueSTT } = useReadContract({
    ...CONTRACTS.BITREDICT_STAKING,
    functionName: 'pendingRevenueSTT',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  // Calculate pending rewards for a specific stake
  const calculateRewards = (stakeIndex: number) => {
    const { data: rewards } = useReadContract({
      ...CONTRACTS.BITREDICT_STAKING,
      functionName: 'calculateRewards',
      args: address && stakeIndex >= 0 ? [address, BigInt(stakeIndex)] : undefined,
      query: { enabled: !!(address && stakeIndex >= 0) }
    });
    return rewards as bigint;
  };

  // Write contract functions
  const stake = async (amount: string, tierId: number, durationOption: DurationOption) => {
    const stakeAmount = parseUnits(amount, 18);
    writeContract({
      ...CONTRACTS.BITREDICT_STAKING,
      functionName: 'stake',
      args: [stakeAmount, BigInt(tierId), BigInt(durationOption)],
    });
  };

  const claimStakeRewards = async (stakeIndex: number) => {
    writeContract({
      ...CONTRACTS.BITREDICT_STAKING,
      functionName: 'claim',
      args: [BigInt(stakeIndex)],
    });
  };

  const unstakeSpecific = async (stakeIndex: number) => {
    writeContract({
      ...CONTRACTS.BITREDICT_STAKING,
      functionName: 'unstake',
      args: [BigInt(stakeIndex)],
    });
  };

  const claimRevenueShare = async () => {
    writeContract({
      ...CONTRACTS.BITREDICT_STAKING,
      functionName: 'claimRevenueShare',
      args: [],
    });
  };

  // Helper functions
  const formatAmount = (amount?: bigint): string => {
    if (!amount) return '0';
    return parseFloat(formatUnits(amount, 18)).toFixed(6);
  };

  const getDurationName = (option: DurationOption): string => {
    switch (option) {
      case DurationOption.THIRTY_DAYS: return '30 Days';
      case DurationOption.SIXTY_DAYS: return '60 Days';
      case DurationOption.NINETY_DAYS: return '90 Days';
      default: return 'Unknown';
    }
  };

  const getDurationBonus = (option: DurationOption): number => {
    switch (option) {
      case DurationOption.THIRTY_DAYS: return 0;
      case DurationOption.SIXTY_DAYS: return 2;
      case DurationOption.NINETY_DAYS: return 4;
      default: return 0;
    }
  };

  const getTierName = (tierId: number): string => {
    const tierNames = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
    return tierNames[tierId] || 'Unknown';
  };

  const getUserStakesWithRewards = (): StakeWithRewards[] => {
    if (!userStakes || !tiers) return [];
    
    return (userStakes as Stake[]).map((stake, index) => {
      const tier = (tiers as Tier[])[stake.tierId];
      const durationBonus = getDurationBonus(stake.durationOption);
      const currentAPY = (tier.baseAPY + durationBonus * 100) / 100; // Convert from basis points
      
      // Calculate if can unstake
      const durationInSeconds = durationOptions ? bigIntToNumber((durationOptions as bigint[])[stake.durationOption]) : 0;
      const unlockTime = bigIntToNumber(stake.startTime) + durationInSeconds;
      const canUnstake = Date.now() / 1000 >= unlockTime;
      
      // Get pending rewards for this stake
      const pendingRewards = calculateRewards(index) || BigInt(0);
      
      return {
        ...stake,
        index,
        pendingRewards,
        canUnstake,
        unlockTime: unlockTime * 1000, // Convert to milliseconds for JS Date
        currentAPY
      };
    });
  };

  const getTotalStakedAmount = (): bigint => {
    if (!userStakes) return BigInt(0);
    return (userStakes as Stake[]).reduce((total, stake) => safeAdd(total, stake.amount), BigInt(0));
  };

  const getTotalPendingRewards = (): bigint => {
    const stakesWithRewards = getUserStakesWithRewards();
    return stakesWithRewards.reduce((total, stake) => {
      // Use safe arithmetic to avoid BigInt mixing
      return safeAdd(total, stake.pendingRewards);
    }, BigInt(0));
  };

  const getUserTier = (): number => {
    const totalStaked = getTotalStakedAmount();
    if (!tiers) return 0;
    
    for (let i = (tiers as Tier[]).length - 1; i >= 0; i--) {
      if (bigIntGreaterThan(totalStaked, (tiers as Tier[])[i].minStake) || totalStaked === (tiers as Tier[])[i].minStake) {
        return i;
      }
    }
    return 0;
  };

  const getNextTierThreshold = (): bigint => {
    const currentTier = getUserTier();
    if (!tiers || currentTier >= (tiers as Tier[]).length - 1) return BigInt(0);
    return (tiers as Tier[])[currentTier + 1].minStake;
  };

  const canStakeInTier = (tierId: number, amount: string): boolean => {
    if (!tiers || tierId >= (tiers as Tier[]).length) return false;
    try {
      const amountWei = parseUnits(amount, 18);
      return bigIntGreaterThan(amountWei, (tiers as Tier[])[tierId].minStake) || amountWei === (tiers as Tier[])[tierId].minStake;
    } catch {
      return false;
    }
  };

  const refetchAll = () => {
    refetchTotalStaked();
    refetchTiers();
    refetchUserStakes();
    refetchRevenueBITR();
    refetchRevenueSTT();
  };

  return {
    // Contract data
    totalStaked: formatAmount(totalStaked as bigint),
    totalRewardsPaid: formatAmount(totalRewardsPaid as bigint),
    totalRevenuePaid: formatAmount(totalRevenuePaid as bigint),
    tiers: tiers as Tier[],
    durationOptions: durationOptions as bigint[],
    userStakes: userStakes as Stake[],
    
    // Calculated data
    userStakesWithRewards: getUserStakesWithRewards(),
    totalUserStaked: formatAmount(getTotalStakedAmount()),
    totalPendingRewards: formatAmount(getTotalPendingRewards()),
    userTier: getUserTier(),
    userTierName: getTierName(getUserTier()),
    nextTierThreshold: formatAmount(getNextTierThreshold()),
    
    // Revenue sharing
    pendingRevenueBITR: formatAmount(pendingRevenueBITR as bigint),
    pendingRevenueSTT: formatAmount(pendingRevenueSTT as bigint),
    
    // Actions
    stake,
    claimStakeRewards,
    unstakeSpecific,
    claimRevenueShare,
    
    // Transaction state
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    
    // Helpers
    formatAmount,
    getDurationName,
    getDurationBonus,
    getTierName,
    canStakeInTier,
    calculateRewards,
    refetchAll,
  };
}

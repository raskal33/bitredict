import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS } from '@/contracts';
import { formatUnits, parseUnits } from 'viem';
import { toBigInt } from '@/utils/bigint-helpers';
import { formatTokenAmount, formatRewardAmount } from '@/utils/number-helpers';

export interface Tier {
  baseAPY: number | bigint;
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
  
  // Individual transaction states for better UX - each button has its own state
  const [claimingStakeIndex, setClaimingStakeIndex] = useState<number | null>(null);
  const [unstakingStakeIndex, setUnstakingStakeIndex] = useState<number | null>(null);
  const [isClaimingRevenue, setIsClaimingRevenue] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

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

  // Duration options loaded

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
    query: { enabled: !!address, refetchInterval: 30000 } // ✅ FIX: Add polling for revenue share
  });

  const { data: pendingRevenueSTT, refetch: refetchRevenueSTT } = useReadContract({
    ...CONTRACTS.BITREDICT_STAKING,
    functionName: 'pendingRevenueSTT',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 30000 } // ✅ FIX: Add polling for revenue share
  });

  // Calculate pending rewards for a specific stake
  const calculateRewards = (stakeIndex: number): bigint => {
    try {
      // Comprehensive safety checks
      if (!userStakes || !Array.isArray(userStakes) || userStakes.length === 0) return BigInt(0);
      if (!tiers || !Array.isArray(tiers) || tiers.length === 0) return BigInt(0);
      if (typeof stakeIndex !== 'number' || stakeIndex < 0) return BigInt(0);
      
      const stakes = userStakes as Stake[];
      const tiersArray = tiers as Tier[];
      
      if (stakeIndex >= stakes.length) return BigInt(0);
      
      const stake = stakes[stakeIndex];
      if (!stake || typeof stake !== 'object') return BigInt(0);
      if (stake.tierId >= tiersArray.length) return BigInt(0);
      
      const tier = tiersArray[stake.tierId];
      if (!tier || typeof tier !== 'object') return BigInt(0);
      
      // Safety check for required stake properties
      if (!stake.amount || !stake.startTime || typeof stake.claimedRewardBITR === 'undefined') return BigInt(0);
      
      // Calculate rewards based on time staked
      const currentTime = Math.floor(Date.now() / 1000);
      const startTime = Number(stake.startTime);
      if (isNaN(startTime) || startTime <= 0) return BigInt(0);
      
      const timeStaked = Math.max(0, currentTime - startTime);
      if (timeStaked <= 0) return BigInt(0);
      
      // Get duration bonus safely
      const durationBonus = getDurationBonus(stake.durationOption) || 0;
      const baseAPY = typeof tier.baseAPY === 'bigint' ? Number(tier.baseAPY) : Number(tier.baseAPY);
      if (isNaN(baseAPY) || baseAPY < 0) return BigInt(0);
      
      const totalAPY = baseAPY + (durationBonus * 100); // Convert percentage to basis points
      
      // Calculate yearly reward in basis points with safety checks
      let stakeAmount: bigint;
      try {
        stakeAmount = typeof stake.amount === 'bigint' ? stake.amount : BigInt(stake.amount);
      } catch (e) {
        return BigInt(0);
      }
      
      const yearlyReward = (stakeAmount * BigInt(Math.floor(totalAPY))) / BigInt(10000);
      
      // Calculate earned rewards based on time
      const secondsPerYear = BigInt(365 * 24 * 60 * 60);
      const earned = (yearlyReward * BigInt(timeStaked)) / secondsPerYear;
      
      // Subtract already claimed rewards safely
      let claimedRewards: bigint;
      try {
        claimedRewards = typeof stake.claimedRewardBITR === 'bigint' ? stake.claimedRewardBITR : BigInt(stake.claimedRewardBITR || 0);
      } catch (e) {
        claimedRewards = BigInt(0);
      }
      
      const pendingRewards = earned > claimedRewards ? earned - claimedRewards : BigInt(0);
      
      return pendingRewards;
    } catch (error) {
      console.error('Error calculating rewards:', error);
      return BigInt(0);
    }
  };

  // Write contract functions
  const stake = async (amount: string, tierId: number, durationOption: DurationOption) => {
    // ✅ FIX: Validate inputs before proceeding
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error('Invalid stake amount');
    }
    if (typeof tierId !== 'number' || tierId < 0) {
      throw new Error('Invalid tier ID');
    }
    
    setIsStaking(true);
    try {
      const stakeAmount = parseUnits(amount, 18);
      writeContract({
        ...CONTRACTS.BITREDICT_STAKING,
        functionName: 'stake',
        args: [stakeAmount, BigInt(tierId), BigInt(durationOption)],
      });
    } catch (error) {
      console.error('Error in stake:', error);
      setIsStaking(false);
      throw error;
    }
  };

  const claimStakeRewards = async (stakeIndex: number) => {
    // ✅ FIX: Validate stake index before proceeding
    if (typeof stakeIndex !== 'number' || stakeIndex < 0) {
      throw new Error('Invalid stake index');
    }
    
    setClaimingStakeIndex(stakeIndex);
    
    try {
      const result = writeContract({
        ...CONTRACTS.BITREDICT_STAKING,
        functionName: 'claim',
        args: [BigInt(stakeIndex)],
      });

      return result;
    } catch (error) {
      console.error('Error in claimStakeRewards:', error);
      setClaimingStakeIndex(null);
      throw error;
    }
  };

  const unstakeSpecific = async (stakeIndex: number) => {
    // ✅ FIX: Validate stake index before proceeding
    if (typeof stakeIndex !== 'number' || stakeIndex < 0) {
      throw new Error('Invalid stake index');
    }
    
    setUnstakingStakeIndex(stakeIndex);
    try {
      writeContract({
        ...CONTRACTS.BITREDICT_STAKING,
        functionName: 'unstake',
        args: [BigInt(stakeIndex)],
      });
    } catch (error) {
      console.error('Error in unstakeSpecific:', error);
      setUnstakingStakeIndex(null);
      throw error;
    }
  };

  const claimRevenueShare = async () => {
    setIsClaimingRevenue(true);
    try {
      writeContract({
        ...CONTRACTS.BITREDICT_STAKING,
        functionName: 'claimRevenue', // ✅ FIX: Contract function is 'claimRevenue', not 'claimRevenueShare'
        args: [],
      });
    } catch (error) {
      console.error('Error in claimRevenueShare:', error);
      setIsClaimingRevenue(false);
      throw error;
    }
  };

  // Helper functions
  const formatAmount = (amount?: bigint): string => {
    try {
      return formatTokenAmount(amount, 18);
    } catch (error) {
      console.error('Error formatting amount:', error);
      return '0';
    }
  };

  const formatReward = (amount?: bigint): string => {
    try {
      return formatRewardAmount(amount, 18);
    } catch (error) {
      console.error('Error formatting reward:', error);
      return '0';
    }
  };

  const getDurationName = (option: DurationOption): string => {
    switch (option) {
      case DurationOption.THIRTY_DAYS: return '3 Days';
      case DurationOption.SIXTY_DAYS: return '5 Days';
      case DurationOption.NINETY_DAYS: return '7 Days';
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

  const getUserStakesWithRewards = useMemo((): StakeWithRewards[] => {
    try {
      // Comprehensive safety checks
      if (!userStakes || !tiers || !Array.isArray(userStakes) || !Array.isArray(tiers)) return [];
      if (userStakes.length === 0 || tiers.length === 0) return [];
      
      return (userStakes as Stake[]).map((stake, index) => {
        try {
          // Safety check for stake object
          if (!stake || typeof stake !== 'object') {
            console.warn(`Invalid stake at index ${index}`);
            return {
              amount: BigInt(0),
              startTime: BigInt(0),
              tierId: 0,
              durationOption: 0,
              claimedRewardBITR: BigInt(0),
              rewardDebtBITR: BigInt(0),
              rewardDebtSTT: BigInt(0),
              index,
              pendingRewards: BigInt(0),
              canUnstake: false,
              unlockTime: 0,
              currentAPY: 0
            };
          }

          const tiersArray = tiers as Tier[];
          
          // Safety check for tier ID bounds
          if (typeof stake.tierId !== 'number' || stake.tierId < 0 || stake.tierId >= tiersArray.length) {
            console.warn(`Invalid tier ID ${stake.tierId} for stake ${index}`);
            return {
              ...stake,
              index,
              pendingRewards: BigInt(0),
              canUnstake: false,
              unlockTime: 0,
              currentAPY: 0
            };
          }

          const tier = tiersArray[stake.tierId];
          
          // Safety check for tier existence
          if (!tier || typeof tier !== 'object') {
            console.warn(`Tier ${stake.tierId} not found, using default values`);
            return {
              ...stake,
              index,
              pendingRewards: BigInt(0),
              canUnstake: false,
              unlockTime: 0,
              currentAPY: 0
            };
          }
          
          // Safe duration bonus calculation
          const durationBonus = getDurationBonus(stake.durationOption) || 0;
          
          // Convert baseAPY from BigInt to number if needed with safety checks
          let baseAPY: number;
          try {
            baseAPY = typeof tier.baseAPY === 'bigint' ? Number(tier.baseAPY) : Number(tier.baseAPY);
            if (isNaN(baseAPY) || baseAPY < 0) baseAPY = 0;
          } catch (e) {
            baseAPY = 0;
          }
          
          const currentAPY = (baseAPY + durationBonus * 100) / 100; // Convert from basis points
          
          // Calculate if can unstake with safety checks
          const durationOptionsArray = durationOptions as bigint[];
          let durationInSeconds = 0;
          
          if (durationOptionsArray && Array.isArray(durationOptionsArray) && 
              typeof stake.durationOption === 'number' && 
              stake.durationOption >= 0 && 
              stake.durationOption < durationOptionsArray.length) {
            try {
              // Contract durations: [3 days, 5 days, 7 days] in seconds
              durationInSeconds = Number(durationOptionsArray[stake.durationOption]);
              if (isNaN(durationInSeconds) || durationInSeconds < 0) durationInSeconds = 0;
              
              // Duration calculation completed
            } catch (e) {
              durationInSeconds = 0;
            }
          }
          
          let startTime: number;
          try {
            startTime = Number(stake.startTime);
            if (isNaN(startTime) || startTime <= 0) startTime = 0;
          } catch (e) {
            startTime = 0;
          }
          
          // Calculate unlock time: startTime + durationInSeconds
          const unlockTime = startTime + durationInSeconds;
          const canUnstake = startTime > 0 && Date.now() / 1000 >= unlockTime;
          
          // Get pending rewards for this stake (with safety in calculateRewards)
          const pendingRewards = calculateRewards(index);
          
          return {
            ...stake,
            index,
            pendingRewards,
            canUnstake,
            unlockTime: unlockTime * 1000, // Convert to milliseconds for JS Date
            currentAPY: isNaN(currentAPY) ? 0 : currentAPY
          };
        } catch (error) {
          console.error(`Error processing stake ${index}:`, error);
          return {
            amount: BigInt(0),
            startTime: BigInt(0),
            tierId: 0,
            durationOption: 0,
            claimedRewardBITR: BigInt(0),
            rewardDebtBITR: BigInt(0),
            rewardDebtSTT: BigInt(0),
            index,
            pendingRewards: BigInt(0),
            canUnstake: false,
            unlockTime: 0,
            currentAPY: 0
          };
        }
      });
    } catch (error) {
      console.error('Error in getUserStakesWithRewards:', error);
      return [];
    }
  }, [userStakes, tiers, durationOptions]);

  const getTotalStakedAmount = useMemo((): bigint => {
    try {
      if (!userStakes || !Array.isArray(userStakes) || userStakes.length === 0) return BigInt(0);
      
      return (userStakes as Stake[]).reduce((total, stake) => {
        try {
          if (!stake || typeof stake !== 'object' || !stake.amount) return total;
          
          const stakeAmount = typeof stake.amount === 'bigint' ? stake.amount : BigInt(stake.amount || 0);
          return total + stakeAmount;
        } catch (error) {
          console.error('Error processing stake amount:', error);
          return total;
        }
      }, BigInt(0));
    } catch (error) {
      console.error('Error calculating total staked amount:', error);
      return BigInt(0);
    }
  }, [userStakes]);

  const getTotalPendingRewards = useMemo((): bigint => {
    try {
      const stakesWithRewards = getUserStakesWithRewards;
      if (!stakesWithRewards || !Array.isArray(stakesWithRewards) || stakesWithRewards.length === 0) return BigInt(0);
      
      return stakesWithRewards.reduce((total: bigint, stake: any) => {
        try {
          if (!stake || typeof stake !== 'object') return total;
          
          // Use utility function to safely convert to BigInt
          const totalBig = toBigInt(total);
          const rewardsBig = toBigInt(stake.pendingRewards);
          return totalBig + rewardsBig;
        } catch (error) {
          console.error('Error processing pending rewards:', error);
          return total;
        }
      }, BigInt(0));
    } catch (error) {
      console.error('Error calculating total pending rewards:', error);
      return BigInt(0);
    }
  }, [getUserStakesWithRewards]);

  const getUserTier = (): number => {
    const totalStaked = getTotalStakedAmount;
    if (!tiers || !Array.isArray(tiers) || tiers.length === 0) return 0;
    
    const tiersArray = tiers as Tier[];
    for (let i = tiersArray.length - 1; i >= 0; i--) {
      if (totalStaked >= tiersArray[i].minStake) {
        return i;
      }
    }
    return 0;
  };

  const getNextTierThreshold = (): bigint => {
    const currentTier = getUserTier();
    if (!tiers || !Array.isArray(tiers) || tiers.length === 0) return BigInt(0);
    
    const tiersArray = tiers as Tier[];
    if (currentTier >= tiersArray.length - 1) return BigInt(0);
    
    const nextTier = tiersArray[currentTier + 1];
    return nextTier ? nextTier.minStake : BigInt(0);
  };

  const canStakeInTier = (tierId: number, amount: string): boolean => {
    if (!tiers || !Array.isArray(tiers) || tiers.length === 0) return false;
    
    const tiersArray = tiers as Tier[];
    if (tierId >= tiersArray.length) return false;
    
    const tier = tiersArray[tierId];
    if (!tier) return false;
    
    const amountWei = parseUnits(amount, 18);
    return amountWei >= tier.minStake;
  };

  // ✅ FIX: Use useCallback to make refetchAll stable and prevent infinite loops
  const refetchAll = useCallback(() => {
    try {
      refetchTotalStaked();
      refetchTiers();
      refetchUserStakes();
      refetchRevenueBITR();
      refetchRevenueSTT();
    } catch (error) {
      console.error('Error in refetchAll:', error);
    }
  }, [refetchTotalStaked, refetchTiers, refetchUserStakes, refetchRevenueBITR, refetchRevenueSTT]);

  // ✅ FIX: Reset transaction states when transaction completes with proper cleanup
  useEffect(() => {
    if (isConfirmed) {
      // Reset state flags first
      setClaimingStakeIndex(null);
      setUnstakingStakeIndex(null);
      setIsClaimingRevenue(false);
      setIsStaking(false);
      
      // ✅ FIX: Delay refetch to avoid React error #185 (hydration mismatch)
      // This prevents state updates during render cycle
      const timeoutId = setTimeout(() => {
        try {
          refetchAll();
        } catch (error) {
          console.error('Error refetching staking data:', error);
        }
      }, 100); // Small delay to allow React to finish current render cycle
      
      return () => clearTimeout(timeoutId);
    }
  }, [isConfirmed, refetchAll]);

  return {
    // Contract data
    totalStaked: formatAmount(totalStaked as bigint),
    totalRewardsPaid: formatReward(totalRewardsPaid as bigint),
    totalRevenuePaid: formatReward(totalRevenuePaid as bigint),
    tiers: tiers as Tier[],
    durationOptions: durationOptions as bigint[],
    userStakes: userStakes as Stake[],
    
    // Calculated data
    userStakesWithRewards: getUserStakesWithRewards,
    totalUserStaked: formatAmount(getTotalStakedAmount),
    totalPendingRewards: formatReward(getTotalPendingRewards),
    userTier: getUserTier(),
    userTierName: getTierName(getUserTier()),
    nextTierThreshold: formatAmount(getNextTierThreshold()),
    
    // Revenue sharing
    pendingRevenueBITR: formatReward(pendingRevenueBITR as bigint),
    pendingRevenueSTT: formatReward(pendingRevenueSTT as bigint),
    
    // ✅ FIX: Add raw values for debugging
    pendingRevenueBITR_raw: pendingRevenueBITR as bigint | undefined,
    pendingRevenueSTT_raw: pendingRevenueSTT as bigint | undefined,
    
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
    
    // Individual transaction states
    claimingStakeIndex,
    unstakingStakeIndex,
    isClaimingRevenue,
    isStaking,
    
    // Helpers
    formatAmount,
    formatReward,
    getDurationName,
    getDurationBonus,
    getTierName,
    canStakeInTier,
    calculateRewards,
    refetchAll,
  };
}

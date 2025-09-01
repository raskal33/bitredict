import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS } from '@/contracts';
import { formatUnits, parseUnits } from 'viem';
import { encodeBytes32String } from 'ethers';

export interface Pool {
  id: bigint;
  creator: string;
  predictedOutcome: string;
  odds: number;
  creatorStake: bigint;
  totalCreatorSideStake: bigint;
  maxBettorStake: bigint;
  totalBettorStake: bigint;
  result: string;
  marketId: string;
  settled: boolean;
  creatorSideWon: boolean;
  eventStartTime: bigint;
  eventEndTime: bigint;
  bettingEndTime: bigint;
  resultTimestamp: bigint;
  arbitrationDeadline: bigint;
  league: string;
  category: string;
  region: string;
  isPrivate: boolean;
  maxBetPerUser: bigint;
  usesBitr: boolean;
  filledAbove60: boolean;
  oracleType: number;
}

export interface OutcomeCondition {
  marketId: string;
  expectedOutcome: string;
  resolved: boolean;
  actualOutcome: string;
}

export interface ComboPool {
  id: bigint;
  creator: string;
  creatorStake: bigint;
  totalCreatorSideStake: bigint;
  maxBettorStake: bigint;
  totalBettorStake: bigint;
  totalOdds: number;
  combinedOdds: number;
  settled: boolean;
  creatorSideWon: boolean;
  usesBitr: boolean;
  eventStartTime: bigint;
  eventEndTime: bigint;
  latestEventEnd: bigint;
  bettingEndTime: bigint;
  resultTimestamp: bigint;
  category: string;
  maxBetPerUser: bigint;
  conditions: OutcomeCondition[];
}

export interface UserBet {
  poolId: bigint;
  user: string;
  amount: bigint;
  prediction: boolean;
  timestamp: bigint;
  claimed: boolean;
}

export enum BoostTier {
  NONE = 0,
  BRONZE = 1,
  SILVER = 2,
  GOLD = 3
}

export function usePools() {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Read contract functions
  const { data: poolCount, refetch: refetchPoolCount } = useReadContract({
    ...CONTRACTS.BITREDICT_POOL,
    functionName: 'poolCount',
  });

  const { data: comboPoolCount, refetch: refetchComboPoolCount } = useReadContract({
    ...CONTRACTS.BITREDICT_POOL,
    functionName: 'comboPoolCount',
  });

  const { data: minBetAmount } = useReadContract({
    ...CONTRACTS.BITREDICT_POOL,
    functionName: 'minBetAmount',
  });

  const { data: minPoolStake } = useReadContract({
    ...CONTRACTS.BITREDICT_POOL,
    functionName: 'minPoolStake',
  });

  const { data: creationFee } = useReadContract({
    ...CONTRACTS.BITREDICT_POOL,
    functionName: 'creationFee',
  });

  // Get pool data
  const getPool = (poolId: number) => {
    const { data: pool, refetch } = useReadContract({
      ...CONTRACTS.BITREDICT_POOL,
      functionName: 'pools',
      args: [BigInt(poolId)],
      query: { enabled: poolId >= 0 }
    });
    return { pool: pool as Pool, refetch };
  };

  // Get combo pool data
  const getComboPool = (comboPoolId: number) => {
    const { data: comboPool, refetch } = useReadContract({
      ...CONTRACTS.BITREDICT_POOL,
      functionName: 'comboPools',
      args: [BigInt(comboPoolId)],
      query: { enabled: comboPoolId >= 0 }
    });
    return { comboPool: comboPool as ComboPool, refetch };
  };

  // Check if user is whitelisted for private pool
  const isWhitelisted = (poolId: number) => {
    const { data: whitelisted, refetch } = useReadContract({
      ...CONTRACTS.BITREDICT_POOL,
      functionName: 'poolWhitelist',
      args: address && poolId >= 0 ? [BigInt(poolId), address] : undefined,
      query: { enabled: !!(address && poolId >= 0) }
    });
    return { whitelisted: whitelisted as boolean, refetch };
  };

  // Get user's stake in a pool
  const getUserStake = (poolId: number) => {
    const { data: stake, refetch } = useReadContract({
      ...CONTRACTS.BITREDICT_POOL,
      functionName: 'bettorStakes',
      args: address && poolId >= 0 ? [BigInt(poolId), address] : undefined,
      query: { enabled: !!(address && poolId >= 0) }
    });
    return { stake: stake as bigint, refetch };
  };

  // Get user's combo pool stake
  const getComboStake = (comboPoolId: number) => {
    const { data: stake, refetch } = useReadContract({
      ...CONTRACTS.BITREDICT_POOL,
      functionName: 'comboBettorStakes',
      args: address && comboPoolId >= 0 ? [BigInt(comboPoolId), address] : undefined,
      query: { enabled: !!(address && comboPoolId >= 0) }
    });
    return { stake: stake as bigint, refetch };
  };

  // Get pool boost tier
  const getPoolBoost = (poolId: number) => {
    const { data: boostTier, refetch } = useReadContract({
      ...CONTRACTS.BITREDICT_POOL,
      functionName: 'poolBoostTier',
      args: [BigInt(poolId)],
      query: { enabled: poolId >= 0 }
    });
    return { boostTier: boostTier as number, refetch };
  };

  // Write contract functions - Regular Pools
  const createPool = async (
    predictedOutcome: string,
    odds: number,
    creatorStake: string,
    eventStartTime: Date,
    eventEndTime: Date,
    league: string,
    category: string,
    region: string,
    isPrivate: boolean = false,
    maxBetPerUser: string = "0",
    useBitr: boolean = true,
    oracleType: number = 0,
    marketId: string = ""
  ) => {
    const startTimestamp = BigInt(Math.floor(eventStartTime.getTime() / 1000));
    const endTimestamp = BigInt(Math.floor(eventEndTime.getTime() / 1000));
    const stakeWei = parseUnits(creatorStake, 18);
    const maxBetWei = maxBetPerUser === "0" ? BigInt(0) : parseUnits(maxBetPerUser, 18);
    
    const args = [
      encodeBytes32String(predictedOutcome), // Properly encode bytes32
      odds, // Remove BigInt wrapper - should be number
      stakeWei,
      Math.floor(eventStartTime.getTime() / 1000), // Convert to number timestamp
      Math.floor(eventEndTime.getTime() / 1000), // Convert to number timestamp
      league,
      category,
      region,
      isPrivate,
      maxBetWei,
      useBitr,
      oracleType, // Remove BigInt wrapper - should be number
      encodeBytes32String(marketId || '') // Properly encode bytes32
    ] as const;

    if (useBitr) {
      writeContract({
        ...CONTRACTS.BITREDICT_POOL,
        functionName: 'createPool',
        args,
      });
    } else {
      // Calculate total required (creation fee + stake)
      const totalRequired = (creationFee as bigint) + stakeWei;
      writeContract({
        ...CONTRACTS.BITREDICT_POOL,
        functionName: 'createPool',
        args,
        value: totalRequired,
      });
    }
  };

  const placeBet = async (poolId: number, amount: string, useBitr: boolean = false) => {
    try {
      const betAmount = parseUnits(amount, 18);

      if (useBitr) {
        // For BITR pools, we need to handle token approval first
        // The contract will handle the transferFrom internally
        writeContract({
          ...CONTRACTS.BITREDICT_POOL,
          functionName: 'placeBet',
          args: [BigInt(poolId), betAmount],
        });
      } else {
        // For STT pools, send native token as value
        writeContract({
          ...CONTRACTS.BITREDICT_POOL,
          functionName: 'placeBet',
          args: [BigInt(poolId), betAmount],
          value: betAmount,
        });
      }
    } catch (error) {
      console.error('Error in placeBet:', error);
      throw error;
    }
  };

  // Private pool management
  const addToWhitelist = async (poolId: number, userAddress: string) => {
    writeContract({
      ...CONTRACTS.BITREDICT_POOL,
      functionName: 'addToWhitelist',
      args: [BigInt(poolId), userAddress as `0x${string}`],
    });
  };

  const removeFromWhitelist = async (poolId: number, userAddress: string) => {
    writeContract({
      ...CONTRACTS.BITREDICT_POOL,
      functionName: 'removeFromWhitelist',
      args: [BigInt(poolId), userAddress as `0x${string}`],
    });
  };

  // Pool boosting
  const boostPool = async (poolId: number, tier: number) => {
    // Get boost fees - these would need to be read from contract
    const boostFees: { [key: number]: bigint } = {
      1: parseUnits("10", 18), // Bronze - 10 STT
      2: parseUnits("25", 18), // Silver - 25 STT  
      3: parseUnits("50", 18), // Gold - 50 STT
    };

    writeContract({
      ...CONTRACTS.BITREDICT_POOL,
      functionName: 'boostPool',
      args: [BigInt(poolId), BigInt(tier)],
      value: boostFees[tier] || BigInt(0),
    });
  };

  // Combo pool functions
  const createComboPool = async (
    conditions: OutcomeCondition[],
    combinedOdds: number,
    creatorStake: string,
    earliestEventStart: Date,
    latestEventEnd: Date,
    category: string,
    maxBetPerUser: string = "0",
    useBitr: boolean = true
  ) => {
    const startTimestamp = BigInt(Math.floor(earliestEventStart.getTime() / 1000));
    const endTimestamp = BigInt(Math.floor(latestEventEnd.getTime() / 1000));
    const stakeWei = parseUnits(creatorStake, 18);
    const maxBetWei = maxBetPerUser === "0" ? BigInt(0) : parseUnits(maxBetPerUser, 18);
    
    const args = [
      conditions.map(c => ({
        marketId: c.marketId,
        expectedOutcome: c.expectedOutcome,
        resolved: false,
        actualOutcome: ""
      })),
      BigInt(combinedOdds),
      stakeWei,
      startTimestamp,
      endTimestamp,
      category,
      maxBetWei,
      useBitr
    ] as const;

    if (useBitr) {
      writeContract({
        ...CONTRACTS.BITREDICT_POOL,
        functionName: 'createComboPool',
        args,
      });
    } else {
      const totalRequired = (creationFee as bigint) + stakeWei;
      writeContract({
        ...CONTRACTS.BITREDICT_POOL,
        functionName: 'createComboPool',
        args,
        value: totalRequired,
      });
    }
  };

  const placeComboBet = async (comboPoolId: number, amount: string) => {
    const betAmount = parseUnits(amount, 18);
    
    // Get combo pool data to check if it uses BITR
    const { comboPool } = getComboPool(comboPoolId);
    const useBitr = comboPool?.usesBitr ?? true;

    if (useBitr) {
      writeContract({
        ...CONTRACTS.BITREDICT_POOL,
        functionName: 'placeComboBet',
        args: [BigInt(comboPoolId), betAmount],
      });
    } else {
      writeContract({
        ...CONTRACTS.BITREDICT_POOL,
        functionName: 'placeComboBet',
        args: [BigInt(comboPoolId), betAmount],
        value: betAmount,
      });
    }
  };

  const claimWinnings = async (poolId: number) => {
    writeContract({
      ...CONTRACTS.BITREDICT_POOL,
      functionName: 'claimWinnings',
      args: [BigInt(poolId)],
    });
  };

  const claimComboWinnings = async (comboPoolId: number) => {
    writeContract({
      ...CONTRACTS.BITREDICT_POOL,
      functionName: 'claimCombo',
      args: [BigInt(comboPoolId)],
    });
  };

  // Helper functions
  const formatAmount = (amount?: bigint): string => {
    if (!amount) return '0';
    return formatUnits(amount, 18);
  };

  const calculateOdds = (pool: Pool): { creator: number; bettor: number } => {
    if (!pool || pool.totalCreatorSideStake === BigInt(0)) {
      return { creator: 1, bettor: Number(pool?.odds || 100) / 100 };
    }

    const creatorOdds = Number(pool.odds) / 100;
    const bettorOdds = creatorOdds;

    return { creator: 1, bettor: bettorOdds };
  };

  const calculatePotentialWinnings = (
    pool: Pool,
    betAmount: string,
    prediction: boolean
  ): string => {
    const amount = parseFloat(betAmount);
    const odds = calculateOdds(pool);
    const potentialWinnings = amount * odds.bettor;
    return potentialWinnings.toFixed(6);
  };

  const isPoolActive = (pool: Pool): boolean => {
    if (!pool) return false;
    const now = Math.floor(Date.now() / 1000);
    return Number(pool.bettingEndTime) > now && !pool.settled;
  };

  const isPoolEnded = (pool: Pool): boolean => {
    if (!pool) return false;
    const now = Math.floor(Date.now() / 1000);
    return Number(pool.bettingEndTime) <= now;
  };

  const getTimeRemaining = (pool: Pool): number => {
    if (!pool) return 0;
    const now = Math.floor(Date.now() / 1000);
    const remaining = Number(pool.bettingEndTime) - now;
    return Math.max(0, remaining * 1000); // Return in milliseconds
  };

  const isComboPoolActive = (comboPool: ComboPool): boolean => {
    if (!comboPool) return false;
    const now = Math.floor(Date.now() / 1000);
    return Number(comboPool.bettingEndTime) > now && !comboPool.settled;
  };

  return {
    // Contract data
    poolCount: Number(poolCount || 0),
    comboPoolCount: Number(comboPoolCount || 0),
    minBetAmount: formatAmount(minBetAmount as bigint),
    minPoolStake: formatAmount(minPoolStake as bigint),
    creationFee: formatAmount(creationFee as bigint),
    
    // Pool functions
    getPool,
    getComboPool,
    isWhitelisted,
    getUserStake,
    getComboStake,
    getPoolBoost,
    
    // Actions - Regular pools
    createPool,
    placeBet,
    claimWinnings,
    
    // Actions - Private pools
    addToWhitelist,
    removeFromWhitelist,
    
    // Actions - Boosting
    boostPool,
    
    // Actions - Combo pools
    createComboPool,
    placeComboBet,
    claimComboWinnings,
    
    // Refresh functions
    refetchPoolCount,
    refetchComboPoolCount,
    
    // Transaction state
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    
    // Helpers
    formatAmount,
    calculateOdds,
    calculatePotentialWinnings,
    isPoolActive,
    isPoolEnded,
    isComboPoolActive,
    getTimeRemaining,
  };
}

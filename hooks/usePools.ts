import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS } from '@/contracts';
import { formatUnits, parseUnits } from 'viem';
import { encodeBytes32String } from 'ethers';
import { toast } from 'react-hot-toast';
import { convertPoolToReadableEnhanced } from '@/lib/bytes32-utils';

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
  const { writeContract, writeContractAsync, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Read contract functions
  const { data: poolCount, refetch: refetchPoolCount } = useReadContract({
    ...CONTRACTS.POOL_CORE,
    functionName: 'poolCount',
  });

  const { data: comboPoolCount, refetch: refetchComboPoolCount } = useReadContract({
    ...CONTRACTS.POOL_CORE,
    functionName: 'comboPoolCount',
  });

  const { data: minBetAmount } = useReadContract({
    ...CONTRACTS.POOL_CORE,
    functionName: 'minBetAmount',
  });

  const { data: minPoolStake } = useReadContract({
    ...CONTRACTS.POOL_CORE,
    functionName: 'minPoolStakeSTT',
  });

  const { data: creationFeeSTT } = useReadContract({
    ...CONTRACTS.POOL_CORE,
    functionName: 'creationFeeSTT',
  });

  const { data: creationFeeBITR } = useReadContract({
    ...CONTRACTS.POOL_CORE,
    functionName: 'creationFeeBITR',
  });

  // Get pool data
  const getPool = (poolId: number) => {
    const { data: rawPool, refetch } = useReadContract({
      ...CONTRACTS.POOL_CORE,
      functionName: 'getPool',
      args: [BigInt(poolId)],
      query: { enabled: poolId >= 0 }
    });
    
    // Convert bytes32 fields to human-readable strings
    const pool = rawPool && typeof rawPool === 'object' && rawPool !== null 
      ? convertPoolToReadableEnhanced(rawPool as Record<string, unknown>) 
      : null;
    return { pool: pool as unknown as Pool, refetch };
  };

  // Get combo pool data
  const getComboPool = (comboPoolId: number) => {
    const { data: rawComboPool, refetch } = useReadContract({
      ...CONTRACTS.POOL_CORE,
      functionName: 'comboPools',
      args: [BigInt(comboPoolId)],
      query: { enabled: comboPoolId >= 0 }
    });
    
    // Convert bytes32 fields to human-readable strings
    const comboPool = rawComboPool && typeof rawComboPool === 'object' && rawComboPool !== null 
      ? convertPoolToReadableEnhanced(rawComboPool as Record<string, unknown>) 
      : null;
    return { comboPool: comboPool as unknown as ComboPool, refetch };
  };

  // Check if user is whitelisted for private pool
  const isWhitelisted = (poolId: number) => {
    const { data: whitelisted, refetch } = useReadContract({
      ...CONTRACTS.POOL_CORE,
      functionName: 'poolWhitelist',
      args: address && poolId >= 0 ? [BigInt(poolId), address] : undefined,
      query: { enabled: !!(address && poolId >= 0) }
    });
    return { whitelisted: whitelisted as boolean, refetch };
  };

  // Get user's stake in a pool
  const getUserStake = (poolId: number) => {
    const { data: stake, refetch } = useReadContract({
      ...CONTRACTS.POOL_CORE,
      functionName: 'bettorStakes',
      args: address && poolId >= 0 ? [BigInt(poolId), address] : undefined,
      query: { enabled: !!(address && poolId >= 0) }
    });
    return { stake: stake as bigint, refetch };
  };

  // Get user's combo pool stake
  const getComboStake = (comboPoolId: number) => {
    const { data: stake, refetch } = useReadContract({
      ...CONTRACTS.POOL_CORE,
      functionName: 'comboBettorStakes',
      args: address && comboPoolId >= 0 ? [BigInt(comboPoolId), address] : undefined,
      query: { enabled: !!(address && comboPoolId >= 0) }
    });
    return { stake: stake as bigint, refetch };
  };

  // Get pool boost tier
  const getPoolBoost = (poolId: number) => {
    const { data: boostTier, refetch } = useReadContract({
      ...CONTRACTS.POOL_CORE,
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
    marketId: string = "",
    marketType: number = 0
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
      encodeBytes32String(marketId || ''), // Properly encode bytes32
      marketType // MarketType enum value
    ] as const;

    if (useBitr) {
      // For BITR pools, the contract will handle the token transfer internally
      // The user needs to approve the total amount (creation fee + stake) beforehand
      writeContract({
        ...CONTRACTS.POOL_CORE,
        functionName: 'createPool',
        args,
        value: 0n, // No ETH/STT value for BITR pools
      });
    } else {
      // Calculate total required (creation fee + stake) for STT pools
      const totalRequired = (creationFeeSTT as bigint) + stakeWei;
      writeContract({
        ...CONTRACTS.POOL_CORE,
        functionName: 'createPool',
        args,
        value: totalRequired,
      });
    }
  };

  const placeBet = async (poolId: number, amount: string, useBitr: boolean = false) => {
    try {
      console.log('🎯 Placing bet:', { poolId, amount, useBitr });
      const betAmount = parseUnits(amount, 18);
      console.log('💰 Bet amount in wei:', betAmount.toString());

      // Check minimum bet amount
      if (minBetAmount && typeof minBetAmount === 'bigint' && betAmount < minBetAmount) {
        throw new Error(`Bet amount ${amount} STT is below minimum bet amount ${formatUnits(minBetAmount, 18)} STT`);
      }

      // Show loading toast
      toast.loading('Preparing transaction...', { id: 'bet-tx' });

      if (useBitr) {
        // For BITR pools, we need to handle token approval first
        // The contract will handle the transferFrom internally
        console.log('🪙 Placing BITR bet...');
        
        // Use writeContractAsync for proper wallet interaction
        const hash = await writeContractAsync({
          ...CONTRACTS.POOL_CORE,
          functionName: 'placeBet',
          args: [BigInt(poolId), betAmount],
          gas: 300000n, // Set explicit gas limit
        });
        
        console.log('✅ BITR bet transaction hash:', hash);
        toast.success('BITR bet transaction submitted! Please confirm in your wallet.', { id: 'bet-tx' });
        return hash;
      } else {
        // For STT pools, send native token as value
        console.log('💎 Placing STT bet...');
        
        // Use writeContractAsync for proper wallet interaction
        const hash = await writeContractAsync({
          ...CONTRACTS.POOL_CORE,
          functionName: 'placeBet',
          args: [BigInt(poolId), betAmount],
          value: betAmount,
          gas: 300000n, // Set explicit gas limit
        });
        
        console.log('✅ STT bet transaction hash:', hash);
        toast.success('STT bet transaction submitted! Please confirm in your wallet.', { id: 'bet-tx' });
        return hash;
      }
    } catch (error) {
      console.error('❌ Error in placeBet:', error);
      
      // Dismiss loading toast
      toast.dismiss('bet-tx');
      
      // Enhanced error handling for common contract errors
      if (error instanceof Error) {
        if (error.message.includes('Bet below minimum')) {
          toast.error('Bet amount is below the minimum required. Please increase your bet amount.');
          throw new Error(`Bet amount is below the minimum required. Please increase your bet amount.`);
        } else if (error.message.includes('Pool settled')) {
          toast.error('This pool has already been settled. You cannot place bets on settled pools.');
          throw new Error(`This pool has already been settled. You cannot place bets on settled pools.`);
        } else if (error.message.includes('Betting period ended')) {
          toast.error('The betting period for this pool has ended. You cannot place bets anymore.');
          throw new Error(`The betting period for this pool has ended. You cannot place bets anymore.`);
        } else if (error.message.includes('Pool full')) {
          toast.error('This pool is full. The maximum bet capacity has been reached.');
          throw new Error(`This pool is full. The maximum bet capacity has been reached.`);
        } else if (error.message.includes('Too many participants')) {
          toast.error('This pool has reached the maximum number of participants.');
          throw new Error(`This pool has reached the maximum number of participants.`);
        } else if (error.message.includes('Exceeds max bet per user')) {
          toast.error('Your bet exceeds the maximum bet per user for this pool.');
          throw new Error(`Your bet exceeds the maximum bet per user for this pool.`);
        } else if (error.message.includes('Not whitelisted')) {
          toast.error('You are not whitelisted for this private pool.');
          throw new Error(`You are not whitelisted for this private pool.`);
        } else if (error.message.includes('user rejected') || error.message.includes('User denied')) {
          toast.error('Transaction was cancelled by user. Please try again if you want to place the bet.');
          throw new Error(`Transaction was cancelled by user. Please try again if you want to place the bet.`);
        } else if (error.message.includes('insufficient funds')) {
          toast.error('Insufficient funds. Please ensure you have enough tokens to place this bet.');
          throw new Error(`Insufficient funds. Please ensure you have enough tokens to place this bet.`);
        } else if (error.message.includes('gas')) {
          toast.error('Gas estimation failed. Please try again or check your network connection.');
          throw new Error(`Gas estimation failed. Please try again or check your network connection.`);
        } else if (error.message.includes('Internal JSON-RPC error')) {
          toast.error('Network error. Please check your connection and try again.');
          throw new Error(`Network error. Please check your connection and try again.`);
        } else {
          toast.error('Failed to place bet. Please try again.');
        }
      }
      
      throw error;
    }
  };

  // Private pool management
  const addToWhitelist = async (poolId: number, userAddress: string) => {
    writeContract({
      ...CONTRACTS.POOL_CORE,
      functionName: 'addToWhitelist',
      args: [BigInt(poolId), userAddress as `0x${string}`],
    });
  };

  const removeFromWhitelist = async (poolId: number, userAddress: string) => {
    writeContract({
      ...CONTRACTS.POOL_CORE,
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
      ...CONTRACTS.POOL_CORE,
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
        ...CONTRACTS.POOL_CORE,
        functionName: 'createComboPool',
        args,
      });
    } else {
      const totalRequired = (creationFeeSTT as bigint) + stakeWei;
      writeContract({
        ...CONTRACTS.POOL_CORE,
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
        ...CONTRACTS.POOL_CORE,
        functionName: 'placeComboBet',
        args: [BigInt(comboPoolId), betAmount],
      });
    } else {
      writeContract({
        ...CONTRACTS.POOL_CORE,
        functionName: 'placeComboBet',
        args: [BigInt(comboPoolId), betAmount],
        value: betAmount,
      });
    }
  };

  const claimWinnings = async (poolId: number) => {
    writeContract({
      ...CONTRACTS.POOL_CORE,
      functionName: 'claim',
      args: [BigInt(poolId)],
    });
  };

  const claimComboWinnings = async (comboPoolId: number) => {
    writeContract({
      ...CONTRACTS.POOL_CORE,
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
    creationFeeSTT: formatAmount(creationFeeSTT as bigint),
    creationFeeBITR: formatAmount(creationFeeBITR as bigint),
    
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

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { CONTRACTS, CONTRACT_ADDRESSES } from '@/contracts';
import { formatUnits, parseUnits } from 'viem';
import { encodeBytes32String } from 'ethers';
import { toast } from 'react-hot-toast';
import { convertPoolToReadableEnhanced } from '@/lib/bytes32-utils';
import { useTransactionFeedback, TransactionStatus } from '@/components/TransactionFeedback';

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
  const publicClient = usePublicClient();
  const { showSuccess, showError, showPending, showConfirming, clearStatus } = useTransactionFeedback();

  // BITR token approval function
  const approveBITR = async (spender: `0x${string}`, amount: bigint) => {
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.BITR_TOKEN,
        abi: CONTRACTS.BITR_TOKEN.abi,
        functionName: 'approve',
        args: [spender, amount],
        gas: 500000n, // Increased gas limit for approval
      });
      return hash;
    } catch (error) {
      console.error('❌ Error approving BITR:', error);
      throw error;
    }
  };

  // Check BITR allowance
  const getBITRAllowance = async (owner: `0x${string}`, spender: `0x${string}`) => {
    try {
      if (!publicClient) {
        console.error('❌ Public client not available');
        return 0n;
      }
      const result = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.BITR_TOKEN,
        abi: CONTRACTS.BITR_TOKEN.abi,
        functionName: 'allowance',
        args: [owner, spender],
      });
      return result as bigint;
    } catch (error) {
      console.error('❌ Error getting BITR allowance:', error);
      return 0n;
    }
  };

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
      const betAmount = parseUnits(amount, 18);

      // Check minimum bet amount
      if (minBetAmount && typeof minBetAmount === 'bigint' && betAmount < minBetAmount) {
        throw new Error(`Bet amount ${amount} STT is below minimum bet amount ${formatUnits(minBetAmount, 18)} STT`);
      }

      if (useBitr) {
        // For BITR pools, check and handle approval first
        if (!address) {
          throw new Error('Wallet not connected');
        }

        // Check current allowance
        const currentAllowance = await getBITRAllowance(address, CONTRACT_ADDRESSES.POOL_CORE);
        
        if (currentAllowance < betAmount) {
          // Need to approve more tokens
          showPending('Approving BITR Tokens', 'Please approve BITR token spending in your wallet...');
          
          try {
            const approvalHash = await approveBITR(CONTRACT_ADDRESSES.POOL_CORE, betAmount);
            
            showConfirming('Approving BITR Tokens', 'Waiting for approval confirmation...', approvalHash);
            
            // Wait for approval confirmation
            const approvalReceipt = await publicClient?.waitForTransactionReceipt({
              hash: approvalHash,
              timeout: 60000,
            });
            
            if (!approvalReceipt || approvalReceipt.status !== 'success') {
              showError('Approval Failed', 'BITR token approval transaction failed. Please try again.');
              throw new Error('BITR approval failed - transaction reverted');
            }
            
            showSuccess('BITR Tokens Approved', 'Your BITR tokens have been approved for betting!');
          } catch (approvalError) {
            if (approvalError instanceof Error) {
              if (approvalError.message.includes('User rejected')) {
                showError('Approval Rejected', 'BITR token approval was rejected. Please try again.');
                throw new Error('Approval was rejected by user');
              } else if (approvalError.message.includes('Gas estimation failed')) {
                showError('Gas Estimation Failed', 'Approval gas estimation failed. Please try again with higher gas limit.');
                throw new Error('Approval gas estimation failed - insufficient gas limit');
              } else if (approvalError.message.includes('Insufficient funds')) {
                showError('Insufficient Funds', 'You do not have enough funds for the approval transaction.');
                throw new Error('Insufficient funds for approval');
              } else {
                showError('Approval Failed', `BITR token approval failed: ${approvalError.message}`);
                throw new Error(`Approval failed: ${approvalError.message}`);
              }
            }
            throw approvalError;
          }
        }

        // Verify approval was successful before proceeding
        const finalAllowance = await getBITRAllowance(address, CONTRACT_ADDRESSES.POOL_CORE);
        if (finalAllowance < betAmount) {
          showError('Insufficient Allowance', 'BITR token allowance is insufficient. Please approve more tokens.');
          throw new Error('Insufficient BITR allowance after approval');
        }

        // Place the bet
        showPending('Placing BITR Bet', 'Please confirm the bet transaction in your wallet...');
        
        const hash = await writeContractAsync({
          ...CONTRACTS.POOL_CORE,
          functionName: 'placeBet',
          args: [BigInt(poolId), betAmount],
          gas: 300000n,
        });
        
        showConfirming('Placing BITR Bet', 'Waiting for bet confirmation...', hash);
        
        // Wait for bet confirmation
        const betReceipt = await publicClient?.waitForTransactionReceipt({
          hash,
          timeout: 60000,
        });
        
        if (!betReceipt || betReceipt.status !== 'success') {
          showError('Bet Failed', 'Your BITR bet transaction failed. Please try again.');
          throw new Error('BITR bet failed - transaction reverted');
        }
        
        showSuccess('BITR Bet Placed!', `Your bet of ${amount} BITR has been placed successfully!`, hash);
        return hash;
      } else {
        // For STT pools, send native token as value
        showPending('Placing STT Bet', 'Please confirm the bet transaction in your wallet...');
        
        const hash = await writeContractAsync({
          ...CONTRACTS.POOL_CORE,
          functionName: 'placeBet',
          args: [BigInt(poolId), betAmount],
          value: betAmount,
          gas: 300000n,
        });
        
        showConfirming('Placing STT Bet', 'Waiting for bet confirmation...', hash);
        
        // Wait for bet confirmation
        const betReceipt = await publicClient?.waitForTransactionReceipt({
          hash,
          timeout: 60000,
        });
        
        if (!betReceipt || betReceipt.status !== 'success') {
          showError('Bet Failed', 'Your STT bet transaction failed. Please try again.');
          throw new Error('STT bet failed - transaction reverted');
        }
        
        showSuccess('STT Bet Placed!', `Your bet of ${amount} STT has been placed successfully!`, hash);
        return hash;
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Bet below minimum')) {
          showError('Bet Too Small', 'Your bet amount is below the minimum required for this pool.');
        } else if (error.message.includes('Pool settled')) {
          showError('Pool Settled', 'This pool has already been settled and no longer accepts bets.');
        } else if (error.message.includes('Betting period ended')) {
          showError('Betting Closed', 'The betting period for this pool has ended.');
        } else if (error.message.includes('Pool full')) {
          showError('Pool Full', 'This pool has reached its maximum capacity.');
        } else if (error.message.includes('Too many participants')) {
          showError('Pool Full', 'This pool has reached the maximum number of participants.');
        } else if (error.message.includes('Exceeds max bet per user')) {
          showError('Bet Too Large', 'Your bet exceeds the maximum bet per user for this pool.');
        } else if (error.message.includes('Not whitelisted')) {
          showError('Not Whitelisted', 'You are not whitelisted for this private pool.');
        } else if (error.message.includes('user rejected') || error.message.includes('User denied')) {
          showError('Transaction Cancelled', 'The transaction was cancelled by user.');
        } else if (error.message.includes('insufficient funds')) {
          showError('Insufficient Funds', 'You do not have enough tokens for this bet.');
        } else if (error.message.includes('BITR transfer failed')) {
          showError('Transfer Failed', 'BITR token transfer failed. Please check your balance and try again.');
        } else if (error.message.includes('gas')) {
          showError('Gas Estimation Failed', 'Gas estimation failed. Please try again.');
        } else if (error.message.includes('Internal JSON-RPC error')) {
          showError('Network Error', 'Network error occurred. Please check your connection.');
        } else if (error.message.includes('Approval failed')) {
          showError('Approval Failed', 'BITR token approval failed. Please try again.');
        } else if (error.message.includes('Insufficient BITR allowance')) {
          showError('Insufficient Allowance', 'BITR token allowance is insufficient. Please approve more tokens.');
        } else if (error.message.includes('Approval was rejected')) {
          showError('Approval Rejected', 'BITR token approval was rejected. Please try again.');
        } else if (error.message.includes('Approval gas estimation failed')) {
          showError('Gas Estimation Failed', 'Approval gas estimation failed. Please try again.');
        } else {
          showError('Bet Failed', `Failed to place bet: ${error.message}`);
        }
      } else {
        showError('Unexpected Error', 'An unexpected error occurred while placing your bet.');
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

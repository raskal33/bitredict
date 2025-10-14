import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { CONTRACTS, CONTRACT_ADDRESSES } from '@/contracts';
import { formatUnits, parseUnits } from 'viem';
import { encodeBytes32String } from 'ethers';
import { toast } from 'react-hot-toast';
import { convertPoolToReadableEnhanced } from '@/lib/bytes32-utils';
import { useTransactionFeedback, TransactionStatus } from '@/components/TransactionFeedback';
import { getTransactionOptions } from '@/lib/network-connection';

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
  const publicClient = usePublicClient();
  const { showSuccess, showError, showPending, showConfirming, clearStatus } = useTransactionFeedback();

  // State for tracking approval and bet transactions
  const [approvalConfirmed, setApprovalConfirmed] = useState(false);
  const [pendingBetData, setPendingBetData] = useState<{
    poolId: number;
    amount: string;
    useBitr: boolean;
    betType?: 'yes' | 'no';
  } | null>(null);

  // Track approval transaction confirmation
  const { isSuccess: isApprovalSuccess } = useWaitForTransactionReceipt({ 
    hash: hash 
  });

  // Track approval transaction states for transaction feedback
  useEffect(() => {
    if (isPending) {
      console.log('🔄 Token approval pending - showing feedback');
      showPending('Approval Pending', 'Please confirm the BITR token approval in your wallet...');
    }
  }, [isPending, showPending]);

  useEffect(() => {
    if (isConfirming) {
      console.log('⏳ Token approval confirming - showing feedback');
      showConfirming('Approval Confirming', 'Your BITR token approval is being processed on the blockchain...', hash);
    }
  }, [isConfirming, showConfirming, hash]);

  // Track approval confirmation
  useEffect(() => {
    if (isApprovalSuccess && !approvalConfirmed) {
      console.log('✅ Token approval successful - showing feedback with hash:', hash);
      setApprovalConfirmed(true);
      showSuccess('Approval Confirmed!', 'BITR token approval confirmed! You can now place your bet.', hash);
    }
  }, [isApprovalSuccess, approvalConfirmed, showSuccess, hash]);

  // BITR token approval function
  const approveBITR = (spender: `0x${string}`, amount: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESSES.BITR_TOKEN,
      abi: CONTRACTS.BITR_TOKEN.abi,
      functionName: 'approve',
      args: [spender, amount],
      ...getTransactionOptions(), // Use same gas settings as create pool
    });
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

  // Direct bet placement function
  const placeBetDirect = async (poolId: number, betAmount: bigint, useBitr: boolean) => {
    showPending('Placing Bet', 'Please confirm the bet transaction in your wallet...');
    
    writeContract({
      ...CONTRACTS.POOL_CORE,
      functionName: 'placeBet',
      args: [BigInt(poolId), betAmount],
      value: useBitr ? 0n : betAmount,
      ...getTransactionOptions(), // Use same gas settings as create pool
    });
  };

  // Track approval errors
  useEffect(() => {
    if (hash && !isPending && !isConfirming && !isApprovalSuccess) {
      console.log('❌ Token approval failed - showing error feedback');
      showError('Approval Failed', 'BITR token approval failed. Please try again.');
    }
  }, [hash, isPending, isConfirming, isApprovalSuccess, showError]);

  // Direct liquidity addition function
  const addLiquidityDirect = async (poolId: number, liquidityAmount: bigint, useBitr: boolean) => {
    showPending('Adding Liquidity', 'Please confirm the liquidity transaction in your wallet...');
    
    writeContract({
      ...CONTRACTS.POOL_CORE,
      functionName: 'addLiquidity',
      args: [BigInt(poolId), liquidityAmount],
      value: useBitr ? 0n : liquidityAmount,
      ...getTransactionOptions(), // Use same gas settings as placeBet
    });
  };

  // Handle approval confirmation and proceed with bet
  useEffect(() => {
    if (isApprovalSuccess && approvalConfirmed && pendingBetData && address) {
      const proceedWithBet = async () => {
        try {
          console.log('✅ Approval confirmed, proceeding with bet:', pendingBetData);
          
          // Verify allowance before proceeding
          const finalAllowance = await getBITRAllowance(address, CONTRACT_ADDRESSES.POOL_CORE);
          const betAmount = parseUnits(pendingBetData.amount, 18);
          
          if (finalAllowance < betAmount) {
            showError('Insufficient Allowance', 'BITR token allowance is still insufficient after approval.');
            return;
          }

          // Place the bet or add liquidity based on bet type
          if (pendingBetData.betType === 'no') {
            await addLiquidityDirect(pendingBetData.poolId, betAmount, pendingBetData.useBitr);
          } else {
            await placeBetDirect(pendingBetData.poolId, betAmount, pendingBetData.useBitr);
          }
          
          // Clear pending state immediately to prevent double execution
          setPendingBetData(null);
          setApprovalConfirmed(false);
          
        } catch (error) {
          console.error('Error proceeding with bet after approval:', error);
          showError('Bet Failed', 'Failed to place bet after approval confirmation.');
          setPendingBetData(null);
          setApprovalConfirmed(false);
        }
      };
      
      proceedWithBet();
    }
  }, [isApprovalSuccess, approvalConfirmed, pendingBetData, address, getBITRAllowance, addLiquidityDirect, placeBetDirect, showError]);

  // Track bet transaction confirmation
  const { isSuccess: isBetSuccess } = useWaitForTransactionReceipt({ 
    hash: hash 
  });

  // Track bet transaction states for transaction feedback
  useEffect(() => {
    if (isPending && !approvalConfirmed) {
      console.log('🔄 Bet transaction pending - showing feedback');
      showPending('Bet Pending', 'Please confirm the bet transaction in your wallet...');
    }
  }, [isPending, approvalConfirmed, showPending]);

  useEffect(() => {
    if (isConfirming && !approvalConfirmed) {
      console.log('⏳ Bet transaction confirming - showing feedback');
      showConfirming('Bet Confirming', 'Your bet is being processed on the blockchain...', hash);
    }
  }, [isConfirming, approvalConfirmed, showConfirming, hash]);

  // Track bet confirmation
  useEffect(() => {
    if (isBetSuccess && !approvalConfirmed) {
      console.log('✅ Bet transaction successful - showing feedback with hash:', hash);
      showSuccess('Bet Placed!', 'Your bet has been placed successfully!', hash);
    }
  }, [isBetSuccess, approvalConfirmed, showSuccess, hash]);

  // Track bet errors
  useEffect(() => {
    if (hash && !isPending && !isConfirming && !isBetSuccess && !approvalConfirmed) {
      console.log('❌ Bet transaction failed - showing error feedback');
      showError('Bet Failed', 'Your bet transaction failed. Please try again.');
    }
  }, [hash, isPending, isConfirming, isBetSuccess, approvalConfirmed, showError]);

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
        ...getTransactionOptions(), // Use same gas settings as other functions
      });
    } else {
      // Calculate total required (creation fee + stake) for STT pools
      const totalRequired = (creationFeeSTT as bigint) + stakeWei;
      writeContract({
        ...CONTRACTS.POOL_CORE,
        functionName: 'createPool',
        args,
        value: totalRequired,
        ...getTransactionOptions(), // Use same gas settings as other functions
      });
    }
  };

  // Add liquidity function (for NO bets - supporting creator)
  const addLiquidity = async (poolId: number, amount: string, useBitr: boolean = false) => {
    try {
      const liquidityAmount = parseUnits(amount, 18);

      // Check minimum liquidity amount
      if (minBetAmount && typeof minBetAmount === 'bigint' && liquidityAmount < minBetAmount) {
        throw new Error(`Liquidity amount ${amount} STT is below minimum amount ${formatUnits(minBetAmount, 18)} STT`);
      }

      if (useBitr) {
        // For BITR pools, check and handle approval first
        if (!address) {
          throw new Error('Wallet not connected');
        }

        // Check current allowance
        const currentAllowance = await getBITRAllowance(address, CONTRACT_ADDRESSES.POOL_CORE);
        
        if (currentAllowance < liquidityAmount) {
          // Need to approve more tokens - store pending liquidity data and trigger approval
          setPendingBetData({ poolId, amount, useBitr, betType: 'no' });
          setApprovalConfirmed(false);
          
          // Trigger approval transaction
          approveBITR(CONTRACT_ADDRESSES.POOL_CORE, liquidityAmount);
          
          // Return early - the approval confirmation will trigger the liquidity addition
          return;
        }

        // Sufficient allowance - add liquidity directly
        await addLiquidityDirect(poolId, liquidityAmount, useBitr);
      } else {
        // For STT pools, send native token as value
        await addLiquidityDirect(poolId, liquidityAmount, useBitr);
      }
    } catch (error) {
      console.error('Error in addLiquidity:', error);
      if (error instanceof Error) {
        if (error.message.includes('Liquidity below minimum')) {
          showError('Liquidity Too Small', 'Your liquidity amount is below the minimum required for this pool.');
        } else if (error.message.includes('Pool settled')) {
          showError('Pool Settled', 'This pool has already been settled and no longer accepts liquidity.');
        } else if (error.message.includes('Betting period ended')) {
          showError('Betting Closed', 'The betting period for this pool has ended.');
        } else if (error.message.includes('Liquidity too large')) {
          showError('Liquidity Too Large', 'Your liquidity amount exceeds the maximum allowed.');
        } else if (error.message.includes('Too many LP providers')) {
          showError('Pool Full', 'This pool has reached the maximum number of liquidity providers.');
        } else if (error.message.includes('Not whitelisted')) {
          showError('Not Whitelisted', 'You are not whitelisted for this private pool.');
        } else if (error.message.includes('user rejected') || error.message.includes('User denied')) {
          showError('Transaction Cancelled', 'The transaction was cancelled by user.');
        } else if (error.message.includes('insufficient funds')) {
          showError('Insufficient Funds', 'You do not have enough tokens for this liquidity addition.');
        } else if (error.message.includes('BITR transfer failed')) {
          showError('Transfer Failed', 'BITR token transfer failed. Please check your balance and try again.');
        } else if (error.message.includes('gas')) {
          showError('Gas Error', 'Transaction failed due to gas issues. Please try again.');
        } else {
          showError('Liquidity Addition Failed', error.message);
        }
      } else {
        showError('Liquidity Addition Failed', 'An unexpected error occurred while adding liquidity.');
      }
      throw error;
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
          // Need to approve more tokens - store pending bet data and trigger approval
          setPendingBetData({ poolId, amount, useBitr, betType: 'yes' });
          setApprovalConfirmed(false);
          
          // Trigger approval transaction
          approveBITR(CONTRACT_ADDRESSES.POOL_CORE, betAmount);
          
          // Return early - the approval confirmation will trigger the bet
          return;
        }

        // Sufficient allowance - place bet directly
        await placeBetDirect(poolId, betAmount, useBitr);
      } else {
        // For STT pools, send native token as value
        await placeBetDirect(poolId, betAmount, useBitr);
      }
    } catch (error) {
      console.error('Error in placeBet:', error);
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
      ...getTransactionOptions(),
    });
  };

  const removeFromWhitelist = async (poolId: number, userAddress: string) => {
    writeContract({
      ...CONTRACTS.POOL_CORE,
      functionName: 'removeFromWhitelist',
      args: [BigInt(poolId), userAddress as `0x${string}`],
      ...getTransactionOptions(),
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
      ...getTransactionOptions(),
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
        ...getTransactionOptions(),
      });
    } else {
      const totalRequired = (creationFeeSTT as bigint) + stakeWei;
      writeContract({
        ...CONTRACTS.POOL_CORE,
        functionName: 'createComboPool',
        args,
        value: totalRequired,
        ...getTransactionOptions(),
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
        ...getTransactionOptions(),
      });
    } else {
      writeContract({
        ...CONTRACTS.POOL_CORE,
        functionName: 'placeComboBet',
        args: [BigInt(comboPoolId), betAmount],
        value: betAmount,
        ...getTransactionOptions(),
      });
    }
  };

  const claimWinnings = async (poolId: number) => {
    writeContract({
      ...CONTRACTS.POOL_CORE,
      functionName: 'claim',
      args: [BigInt(poolId)],
      ...getTransactionOptions(),
    });
  };

  const claimComboWinnings = async (comboPoolId: number) => {
    writeContract({
      ...CONTRACTS.POOL_CORE,
      functionName: 'claimCombo',
      args: [BigInt(comboPoolId)],
      ...getTransactionOptions(),
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
    addLiquidity,
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

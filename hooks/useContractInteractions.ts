import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { CONTRACTS, CONTRACT_ADDRESSES } from '@/contracts';
import { executeContractCall, getTransactionOptions } from '@/lib/network-connection';
import { useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { keccak256, toBytes } from 'viem';
import { ethers } from 'ethers';
import { formatTeamNamesForPool } from '@/utils/teamNameFormatter';

// Enhanced contract interaction hooks for modular architecture

// BITR Token Contract Hooks
export function useBitrToken() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const approve = useCallback(async (spender: `0x${string}`, amount: bigint) => {
    try {
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.BITR_TOKEN,
        abi: CONTRACTS.BITR_TOKEN.abi,
        functionName: 'approve',
        args: [spender, amount],
        ...getTransactionOptions(),
      });
      
      toast.success('BITR approval transaction submitted!');
      return txHash;
    } catch (error) {
      console.error('Error approving BITR:', error);
      toast.error('Failed to approve BITR');
      throw error;
    }
  }, [writeContractAsync]);

  const getAllowance = useCallback(async (owner: `0x${string}`, spender: `0x${string}`) => {
    try {
      const result = await executeContractCall(async (client) => {
        return await client.readContract({
          address: CONTRACT_ADDRESSES.BITR_TOKEN,
          abi: CONTRACTS.BITR_TOKEN.abi,
          functionName: 'allowance',
          args: [owner, spender],
        });
      });
      return result as bigint;
    } catch (error) {
      console.error('Error getting BITR allowance:', error);
      return 0n;
    }
  }, []);

  const getBalance = useCallback(async (account?: `0x${string}`) => {
    try {
      const result = await executeContractCall(async (client) => {
        return await client.readContract({
          address: CONTRACT_ADDRESSES.BITR_TOKEN,
          abi: CONTRACTS.BITR_TOKEN.abi,
          functionName: 'balanceOf',
          args: [account || address || '0x0'],
        });
      });
      return result as bigint;
    } catch (error) {
      console.error('Error getting BITR balance:', error);
      return 0n;
    }
  }, [address]);

  return {
    approve,
    getAllowance,
    getBalance,
  };
}

// Pool Core Contract Hooks
export function usePoolCore() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { approve, getAllowance, getBalance } = useBitrToken();
  const publicClient = usePublicClient();

  const createPool = useCallback(async (poolData: {
    predictedOutcome: string;
    odds: bigint;
    creatorStake: bigint;
    eventStartTime: bigint;
    eventEndTime: bigint;
    league: string;
    category: string;
    isPrivate: boolean;
    maxBetPerUser: bigint;
    useBitr: boolean;
    oracleType: number;
    marketId: string;
    marketType: number;
    homeTeam?: string;
    awayTeam?: string;
    title?: string;
  }) => {
    try {
      // Convert predictedOutcome to bytes32 string (not hash) for proper storage and retrieval
      const predictedOutcomeBytes32 = poolData.predictedOutcome.startsWith('0x') 
        ? poolData.predictedOutcome 
        : ethers.encodeBytes32String(poolData.predictedOutcome.slice(0, 31)); // Truncate to fit bytes32
      
      // Market ID should be sent as string (fixture ID), not bytes32
      const marketIdString = poolData.marketId;

      // Calculate total required amount (creation fee + creator stake)
      const creationFeeBITR = 50n * 10n**18n; // 50 BITR in wei
      const creationFeeSTT = 1n * 10n**18n; // 1 STT in wei
      const totalRequired = poolData.useBitr 
        ? poolData.creatorStake + creationFeeBITR  // 3000 + 50 = 3050 BITR
        : poolData.creatorStake + creationFeeSTT;   // stake + 1 STT

      // For BITR pools, we need to ensure the contract has sufficient allowance
      // The contract will handle the token transfer internally
      if (poolData.useBitr) {
        // Check BITR balance first
        const balance = await getBalance();
        console.log(`🔍 BITR Balance Check: ${balance}, Required: ${totalRequired}`);
        
        if (balance < totalRequired) {
          const shortfall = totalRequired - balance;
          throw new Error(`Insufficient BITR balance. You have ${balance / BigInt(10**18)} BITR but need ${totalRequired / BigInt(10**18)} BITR (shortfall: ${shortfall / BigInt(10**18)} BITR)`);
        }
        
        // Check if we need to approve more tokens
        const currentAllowance = await getAllowance(address as `0x${string}`, CONTRACT_ADDRESSES.POOL_CORE);
        console.log(`BITR Pool Creation - Current allowance: ${currentAllowance}, Required: ${totalRequired}`);
        
        if (currentAllowance < totalRequired) {
          console.log(`Insufficient allowance. Approving ${totalRequired} BITR tokens to POOL_CORE contract...`);
          toast.loading('Approving BITR tokens for pool creation...');
          try {
            await approve(CONTRACT_ADDRESSES.POOL_CORE, totalRequired);
            toast.dismiss();
            toast.success('BITR tokens approved for pool creation!');
          } catch (approveError) {
            toast.dismiss();
            console.error('Error approving BITR tokens:', approveError);
            toast.error('Failed to approve BITR tokens for pool creation');
            throw approveError;
          }
        } else {
          console.log('Sufficient allowance already exists for BITR pool creation');
        }
      }

      console.log('Creating pool with parameters:', {
        predictedOutcomeBytes32,
        odds: poolData.odds,
        creatorStake: poolData.creatorStake,
        useBitr: poolData.useBitr,
        totalRequired,
        value: poolData.useBitr ? 0n : totalRequired
      });

      // Format team names to ensure they fit within bytes32 constraints
      console.log('🔍 Original team data:', {
        homeTeam: poolData.homeTeam,
        awayTeam: poolData.awayTeam,
        predictedOutcome: poolData.predictedOutcome
      });
      
      const teamNames = formatTeamNamesForPool(poolData.homeTeam || '', poolData.awayTeam || '');
      
      console.log('🔍 Formatted team data:', {
        homeTeam: teamNames.homeTeam,
        awayTeam: teamNames.awayTeam,
        warnings: teamNames.warnings
      });
      
      // Show warnings if team names were modified
      if (teamNames.warnings.length > 0) {
        console.warn('Team name formatting warnings:', teamNames.warnings);
        // Show user-friendly warnings
        teamNames.warnings.forEach(warning => {
          toast(warning, { 
            icon: '⚠️',
            duration: 5000,
            style: { background: '#fbbf24', color: '#1f2937' }
          });
        });
      }

      // Encode strings as bytes32 (not hashed) for the updated contract
      // Ensure all strings are 32 bytes or less for bytes32 encoding
      const leagueBytes32 = ethers.encodeBytes32String(poolData.league.slice(0, 31));
      const categoryBytes32 = ethers.encodeBytes32String(poolData.category.slice(0, 31));
      const homeTeamBytes32 = ethers.encodeBytes32String(teamNames.homeTeam.slice(0, 31));
      const awayTeamBytes32 = ethers.encodeBytes32String(teamNames.awayTeam.slice(0, 31));
      // Ensure title is 32 bytes or less for bytes32 encoding
      const truncatedTitle = (poolData.title || '').slice(0, 31); // Leave 1 byte for null terminator
      const titleBytes32 = ethers.encodeBytes32String(truncatedTitle);
      
      console.log('🔍 Encoded data for contract:', {
        predictedOutcomeBytes32,
        leagueBytes32,
        categoryBytes32,
        homeTeamBytes32,
        awayTeamBytes32,
        titleBytes32,
        marketIdString: poolData.marketId
      });

      // 🚀 GAS OPTIMIZATION: Use createPool for gas efficiency
      console.log(`⛽ Using createPool function`);

      // Log critical validation info before sending transaction
      console.log('🔍 Pre-transaction validation:', {
        address: address,
        useBitr: poolData.useBitr,
        creatorStake: poolData.creatorStake.toString(),
        totalRequired: totalRequired.toString(),
        oracleType: poolData.oracleType,
        marketType: poolData.marketType,
        eventStartTime: new Date(Number(poolData.eventStartTime) * 1000).toISOString(),
        gracePeriodBuffer: Number(poolData.eventStartTime) - Math.floor(Date.now() / 1000),
      });

      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.POOL_CORE,
        abi: CONTRACTS.POOL_CORE.abi,
        functionName: 'createPool', // ✅ Use main createPool function
        args: [
          predictedOutcomeBytes32,
          poolData.odds,
          poolData.creatorStake,
          poolData.eventStartTime,
          poolData.eventEndTime,
          leagueBytes32, // 🎯 bytes32 encoded league
          categoryBytes32, // 🎯 bytes32 encoded category
          homeTeamBytes32, // 🎯 bytes32 encoded home team
          awayTeamBytes32, // 🎯 bytes32 encoded away team
          titleBytes32, // 🎯 bytes32 encoded title
          poolData.isPrivate,
          poolData.maxBetPerUser,
          poolData.useBitr,
          poolData.oracleType,
          poolData.marketType,
          marketIdString, // 🎯 Market ID as string (fixture ID)
        ],
        value: poolData.useBitr ? 0n : totalRequired, // For BITR pools, value is 0 (token transfer handles it)
        gas: BigInt(10000000), // ✅ Reduced gas limit for lightweight function (10M instead of 14M)
      });
      
      console.log('Pool creation transaction submitted:', txHash);
      toast.loading('Waiting for transaction confirmation...', { id: 'pool-creation' });
      
      // Wait for transaction confirmation
      console.log('⏳ Waiting for transaction confirmation...');
      if (!publicClient) {
        throw new Error('Public client not available');
      }
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      
      if (receipt.status !== 'success') {
        console.error('❌ Transaction failed. Receipt:', {
          status: receipt.status,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed?.toString(),
          effectiveGasPrice: receipt.effectiveGasPrice?.toString(),
        });
        throw new Error(`Transaction reverted on-chain. Possible causes: insufficient reputation, timing validation failed, or token transfer rejected. Check contract requirements.`);
      }
      
      console.log('✅ Pool creation transaction confirmed:', txHash);
      toast.success('Pool created successfully!', { id: 'pool-creation' });
      return txHash;
    } catch (error) {
      console.error('Error creating pool:', error);
      
      // Dismiss loading toast
      toast.dismiss('pool-creation');
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('insufficient funds')) {
          toast.error('Insufficient BITR balance for pool creation');
        } else if (error.message.includes('allowance')) {
          toast.error('Insufficient BITR allowance. Please approve more tokens.');
        } else if (error.message.includes('revert')) {
          toast.error('Transaction reverted. Check your parameters and try again.');
        } else if (error.message.includes('Transaction failed with status')) {
          toast.error('Transaction failed on-chain. Please check your parameters and try again.');
        } else {
          toast.error(`Failed to create pool: ${error.message}`);
        }
      } else {
        toast.error('Failed to create pool');
      }
      
      throw error;
    }
  }, [writeContractAsync, address, getAllowance, approve, publicClient]);

  const placeBet = useCallback(async (poolId: bigint, betAmount: bigint) => {
    try {
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.POOL_CORE,
        abi: CONTRACTS.POOL_CORE.abi,
        functionName: 'placeBet',
        args: [poolId, betAmount],
        value: betAmount,
        ...getTransactionOptions(),
      });
      
      console.log('Bet transaction submitted:', txHash);
      toast.loading('Waiting for bet confirmation...', { id: 'bet-placement' });
      
      // Wait for transaction confirmation
      if (!publicClient) {
        throw new Error('Public client not available');
      }
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      
      if (receipt.status !== 'success') {
        throw new Error(`Bet transaction failed with status: ${receipt.status}`);
      }
      
      console.log('✅ Bet transaction confirmed:', txHash);
      toast.success('Bet placed successfully!', { id: 'bet-placement' });
      return txHash;
    } catch (error) {
      console.error('Error placing bet:', error);
      toast.dismiss('bet-placement');
      
      if (error instanceof Error && error.message.includes('Transaction failed with status')) {
        toast.error('Bet transaction failed on-chain. Please try again.');
      } else {
        toast.error('Failed to place bet');
      }
      throw error;
    }
  }, [writeContractAsync, publicClient]);

  const settlePool = useCallback(async (poolId: bigint, outcome: string) => {
    try {
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.POOL_CORE,
        abi: CONTRACTS.POOL_CORE.abi,
        functionName: 'settlePool',
        args: [poolId, outcome],
        ...getTransactionOptions(),
      });
      
      toast.success('Pool settled successfully!');
      return txHash;
    } catch (error) {
      console.error('Error settling pool:', error);
      toast.error('Failed to settle pool');
      throw error;
    }
  }, [writeContractAsync]);

  return {
    createPool,
    placeBet,
    settlePool,
  };
}

// Boost System Contract Hooks
export function useBoostSystem() {
  const { writeContractAsync } = useWriteContract();

  const boostPool = useCallback(async (poolId: bigint, boostTier: number) => {
    try {
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.BOOST_SYSTEM,
        abi: CONTRACTS.BOOST_SYSTEM.abi,
        functionName: 'boostPool',
        args: [poolId, boostTier],
        ...getTransactionOptions(),
      });
      
      toast.success('Pool boosted successfully!');
      return txHash;
    } catch (error) {
      console.error('Error boosting pool:', error);
      toast.error('Failed to boost pool');
      throw error;
    }
  }, [writeContractAsync]);

  const canBoostPool = useCallback(async (poolId: bigint) => {
    try {
      const result = await executeContractCall(async (client) => {
        return await client.readContract({
          address: CONTRACT_ADDRESSES.BOOST_SYSTEM,
          abi: CONTRACTS.BOOST_SYSTEM.abi,
          functionName: 'canBoostPool',
          args: [poolId],
        });
      });
      return result as boolean;
    } catch (error) {
      console.error('Error checking boost eligibility:', error);
      return false;
    }
  }, []);

  return {
    boostPool,
    canBoostPool,
  };
}

// Factory Contract Hooks
export function usePoolFactory() {
  const { writeContractAsync } = useWriteContract();

  const createPoolWithBoost = useCallback(async (poolData: {
    predictedOutcome: string;
    odds: bigint;
    eventStartTime: bigint;
    eventEndTime: bigint;
    league: string;
    category: string;
    useBitr: boolean;
    maxBetPerUser?: bigint;
    isPrivate?: boolean;
    boostTier?: number;
  }) => {
    try {
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.FACTORY,
        abi: CONTRACTS.FACTORY.abi,
        functionName: 'createPoolWithBoost',
        args: [
          poolData.predictedOutcome,
          poolData.odds,
          poolData.eventStartTime,
          poolData.eventEndTime,
          poolData.league,
          poolData.category,
          poolData.useBitr,
          poolData.maxBetPerUser || BigInt(0),
          poolData.isPrivate || false,
          poolData.boostTier || 0,
        ],
        ...getTransactionOptions(),
      });
      
      toast.success('Pool with boost created successfully!');
      return txHash;
    } catch (error) {
      console.error('Error creating pool with boost:', error);
      toast.error('Failed to create pool with boost');
      throw error;
    }
  }, [writeContractAsync]);

  return {
    createPoolWithBoost,
  };
}

// Reputation System Hooks
export function useReputationSystem() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const getUserReputation = useCallback(async (userAddress?: string) => {
    try {
      const result = await executeContractCall(async (client) => {
        return await client.readContract({
          address: CONTRACT_ADDRESSES.REPUTATION_SYSTEM,
          abi: CONTRACTS.REPUTATION_SYSTEM.abi,
          functionName: 'getUserReputation',
          args: [userAddress || address || '0x0'],
        });
      });
      return result as {
        reputation: bigint;
        tier: number;
        influenceScore: bigint;
        streak: bigint;
        isVerified: boolean;
      };
    } catch (error) {
      console.error('Error getting user reputation:', error);
      return null;
    }
  }, [address]);

  const getUserStats = useCallback(async (userAddress?: string) => {
    try {
      const result = await executeContractCall(async (client) => {
        return await client.readContract({
          address: CONTRACT_ADDRESSES.REPUTATION_SYSTEM,
          abi: CONTRACTS.REPUTATION_SYSTEM.abi,
          functionName: 'getUserStats',
          args: [userAddress || address || '0x0'],
        });
      });
      return result as {
        totalPools: bigint;
        totalBets: bigint;
        totalWinnings: bigint;
        winRate: bigint;
        averageOdds: bigint;
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return null;
    }
  }, [address]);

  return {
    getUserReputation,
    getUserStats,
  };
}

// Faucet Hooks
export function useFaucet() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const claimFaucet = useCallback(async () => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.FAUCET,
        abi: CONTRACTS.FAUCET.abi,
        functionName: 'claimFaucet',
        args: [],
        ...getTransactionOptions(),
      });
      
      toast.success('Faucet claimed successfully!');
      return txHash;
    } catch (error) {
      console.error('Error claiming faucet:', error);
      toast.error('Failed to claim from faucet');
      throw error;
    }
  }, [address, writeContractAsync]);

  const checkEligibility = useCallback(async () => {
    if (!address) return false;

    try {
      const result = await executeContractCall(async (client) => {
        return await client.readContract({
          address: CONTRACT_ADDRESSES.FAUCET,
          abi: CONTRACTS.FAUCET.abi,
          functionName: 'checkEligibility',
          args: [address],
        });
      });
      return result as boolean;
    } catch (error) {
      console.error('Error checking faucet eligibility:', error);
      return false;
    }
  }, [address]);

  return {
    claimFaucet,
    checkEligibility,
  };
}

// Transaction status hook
export function useTransactionStatus(txHash?: `0x${string}`) {
  const { data: receipt, isLoading, isSuccess, isError } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  return {
    receipt,
    isLoading,
    isSuccess,
    isError,
  };
}

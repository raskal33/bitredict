import { useCallback, useState } from 'react';
import { useWriteContract, useAccount, usePublicClient } from 'wagmi';
import { ethers } from 'ethers';
import { CONTRACTS } from '@/contracts';
import { CONTRACT_ADDRESSES } from '@/config/wagmi';
import { getTransactionOptions, executeContractCall } from '@/lib/network-connection';
import { toast } from '@/utils/toast';
import { formatEther, parseEther } from 'viem';

// ============================================
// TYPES
// ============================================

export interface ComboCondition {
  marketId: string;           // SportMonks match ID or market identifier
  expectedOutcome: string;    // Expected result (e.g., "HOME_WIN", "OVER_2.5")
  description: string;        // Human readable description
  odds: number;               // Individual odds (e.g., 1.85 = 185 basis points)
  resolved?: boolean;         // Whether condition is resolved
  actualOutcome?: string;     // Actual outcome after resolution
}

export interface ComboPoolData {
  conditions: ComboCondition[];
  combinedOdds: number;        // Combined odds (product of individual odds)
  creatorStake: bigint;        // Creator's stake in wei
  earliestEventStart: bigint;  // Earliest event start timestamp
  latestEventEnd: bigint;      // Latest event end timestamp
  category: string;            // Category string (will be hashed to bytes32)
  maxBetPerUser: bigint;       // Max bet per user (0 = unlimited)
  useBitr: boolean;            // Use BITR token (true) or STT (false)
}

export interface ComboPool {
  id: number;
  creator: string;
  creatorStake: bigint;
  totalCreatorSideStake: bigint;
  maxBettorStake: bigint;
  totalBettorStake: bigint;
  combinedOdds: number;
  earliestEventStart: number;
  latestEventEnd: number;
  category: string;
  maxBetPerUser: bigint;
  useBitr: boolean;
  settled: boolean;
  creatorSideWon: boolean;
  conditionCount: number;
  successfulConditions: number;
  conditions?: ComboCondition[];
}

export interface ComboPoolAnalytics {
  totalVolume: bigint;
  participantCount: number;
  averageBetSize: bigint;
  successRate: number;
  averageOdds: number;
  lastActivityTime: number;
}

// ============================================
// HOOK
// ============================================

export function useComboPools() {
  const { writeContractAsync } = useWriteContract();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  
  const [isLoading, setIsLoading] = useState(false);

  // ============================================
  // READ FUNCTIONS
  // ============================================

  /**
   * Get creation fees from contract
   */
  const getCreationFees = useCallback(async (): Promise<{ bitr: bigint; stt: bigint }> => {
    try {
      const [bitrFee, sttFee] = await Promise.all([
        executeContractCall(async (client) => {
          return await client.readContract({
            address: CONTRACT_ADDRESSES.COMBO_POOLS,
            abi: CONTRACTS.COMBO_POOLS.abi,
            functionName: 'creationFeeBITR',
            args: [],
          });
        }),
        executeContractCall(async (client) => {
          return await client.readContract({
            address: CONTRACT_ADDRESSES.COMBO_POOLS,
            abi: CONTRACTS.COMBO_POOLS.abi,
            functionName: 'creationFeeSTT',
            args: [],
          });
        }),
      ]);
      return { bitr: bitrFee as bigint, stt: sttFee as bigint };
    } catch (error) {
      console.error('Error getting creation fees:', error);
      // Fallback values
      return { bitr: 50n * 10n**18n, stt: 1n * 10n**18n };
    }
  }, []);

  /**
   * Get combo pool details by ID
   */
  const getComboPool = useCallback(async (poolId: number): Promise<ComboPool | null> => {
    try {
      const result = await executeContractCall(async (client) => {
        return await client.readContract({
          address: CONTRACT_ADDRESSES.COMBO_POOLS,
          abi: CONTRACTS.COMBO_POOLS.abi,
          functionName: 'getComboPool',
          args: [BigInt(poolId)],
        });
      });
      
      // Parse the result based on contract return type
      const pool = result as {
        creator: string;
        creatorStake: bigint;
        totalCreatorSideStake: bigint;
        maxBettorStake: bigint;
        totalBettorStake: bigint;
        combinedOdds: number;
        earliestEventStart: bigint;
        latestEventEnd: bigint;
        category: string;
        maxBetPerUser: bigint;
        useBitr: boolean;
        settled: boolean;
        creatorSideWon: boolean;
        conditionCount: number;
        successfulConditions: number;
      };

      return {
        id: poolId,
        creator: pool.creator,
        creatorStake: pool.creatorStake,
        totalCreatorSideStake: pool.totalCreatorSideStake,
        maxBettorStake: pool.maxBettorStake,
        totalBettorStake: pool.totalBettorStake,
        combinedOdds: Number(pool.combinedOdds),
        earliestEventStart: Number(pool.earliestEventStart),
        latestEventEnd: Number(pool.latestEventEnd),
        category: pool.category,
        maxBetPerUser: pool.maxBetPerUser,
        useBitr: pool.useBitr,
        settled: pool.settled,
        creatorSideWon: pool.creatorSideWon,
        conditionCount: Number(pool.conditionCount),
        successfulConditions: Number(pool.successfulConditions),
      };
    } catch (error) {
      console.error('Error getting combo pool:', error);
      return null;
    }
  }, []);

  /**
   * Get combo pool conditions
   */
  const getComboPoolConditions = useCallback(async (poolId: number): Promise<ComboCondition[]> => {
    try {
      const result = await executeContractCall(async (client) => {
        return await client.readContract({
          address: CONTRACT_ADDRESSES.COMBO_POOLS,
          abi: CONTRACTS.COMBO_POOLS.abi,
          functionName: 'getComboPoolConditions',
          args: [BigInt(poolId)],
        });
      });
      
      // Parse conditions from contract response
      const conditions = result as Array<{
        marketId: string;
        expectedOutcome: string;
        resolved: boolean;
        actualOutcome: string;
        description: string;
        odds: number;
      }>;

      return conditions.map(c => ({
        marketId: ethers.decodeBytes32String(c.marketId).replace(/\0/g, ''),
        expectedOutcome: ethers.decodeBytes32String(c.expectedOutcome).replace(/\0/g, ''),
        description: c.description,
        odds: Number(c.odds) / 100, // Convert from basis points
        resolved: c.resolved,
        actualOutcome: c.actualOutcome ? ethers.decodeBytes32String(c.actualOutcome).replace(/\0/g, '') : undefined,
      }));
    } catch (error) {
      console.error('Error getting combo pool conditions:', error);
      return [];
    }
  }, []);

  /**
   * Get combo pool analytics
   */
  const getComboPoolAnalytics = useCallback(async (poolId: number): Promise<ComboPoolAnalytics | null> => {
    try {
      const result = await executeContractCall(async (client) => {
        return await client.readContract({
          address: CONTRACT_ADDRESSES.COMBO_POOLS,
          abi: CONTRACTS.COMBO_POOLS.abi,
          functionName: 'comboAnalytics',
          args: [BigInt(poolId)],
        });
      });
      
      const analytics = result as {
        totalVolume: bigint;
        participantCount: bigint;
        averageBetSize: bigint;
        successRate: bigint;
        averageOdds: bigint;
        conditionSuccessRates: bigint;
        lastActivityTime: bigint;
      };

      return {
        totalVolume: analytics.totalVolume,
        participantCount: Number(analytics.participantCount),
        averageBetSize: analytics.averageBetSize,
        successRate: Number(analytics.successRate),
        averageOdds: Number(analytics.averageOdds),
        lastActivityTime: Number(analytics.lastActivityTime),
      };
    } catch (error) {
      console.error('Error getting combo pool analytics:', error);
      return null;
    }
  }, []);

  /**
   * Get user's stake in a combo pool
   */
  const getUserComboBetStake = useCallback(async (poolId: number, userAddress: string): Promise<bigint> => {
    try {
      const result = await executeContractCall(async (client) => {
        return await client.readContract({
          address: CONTRACT_ADDRESSES.COMBO_POOLS,
          abi: CONTRACTS.COMBO_POOLS.abi,
          functionName: 'comboBettorStakes',
          args: [BigInt(poolId), userAddress as `0x${string}`],
        });
      });
      return result as bigint;
    } catch (error) {
      console.error('Error getting user combo bet stake:', error);
      return 0n;
    }
  }, []);

  /**
   * Check if user has claimed rewards from a combo pool
   */
  const hasUserClaimed = useCallback(async (poolId: number, userAddress: string): Promise<boolean> => {
    try {
      const result = await executeContractCall(async (client) => {
        return await client.readContract({
          address: CONTRACT_ADDRESSES.COMBO_POOLS,
          abi: CONTRACTS.COMBO_POOLS.abi,
          functionName: 'comboClaimed',
          args: [BigInt(poolId), userAddress as `0x${string}`],
        });
      });
      return result as boolean;
    } catch (error) {
      console.error('Error checking user claimed status:', error);
      return false;
    }
  }, []);

  /**
   * Get combo pool count
   */
  const getComboPoolCount = useCallback(async (): Promise<number> => {
    try {
      const result = await executeContractCall(async (client) => {
        return await client.readContract({
          address: CONTRACT_ADDRESSES.COMBO_POOLS,
          abi: CONTRACTS.COMBO_POOLS.abi,
          functionName: 'comboPoolCount',
          args: [],
        });
      });
      return Number(result);
    } catch (error) {
      console.error('Error getting combo pool count:', error);
      return 0;
    }
  }, []);

  // ============================================
  // WRITE FUNCTIONS
  // ============================================

  /**
   * Create a new combo pool
   */
  const createComboPool = useCallback(async (poolData: ComboPoolData) => {
    if (!address) {
      toast.error('Please connect your wallet');
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    
    try {
      // Validate conditions
      if (poolData.conditions.length < 2) {
        throw new Error('Combo pools require at least 2 conditions');
      }
      if (poolData.conditions.length > 10) {
        throw new Error('Combo pools can have at most 10 conditions');
      }

      // Hash category string before calling the contract
      const categoryHash = ethers.keccak256(ethers.toUtf8Bytes(poolData.category));
      
      // Transform conditions to match contract struct
      const contractConditions = poolData.conditions.map(condition => ({
        marketId: ethers.encodeBytes32String(condition.marketId.slice(0, 31)),
        expectedOutcome: ethers.encodeBytes32String(condition.expectedOutcome.slice(0, 31)),
        resolved: false, // Always false for new pools
        actualOutcome: "0x0000000000000000000000000000000000000000000000000000000000000000", // Empty bytes32
        description: condition.description,
        odds: Math.floor(condition.odds * 100) // Convert to basis points (1.85 -> 185)
      }));

      console.log('🎰 Creating combo pool with conditions:', contractConditions);
      
      // Get creation fees from contract
      const fees = await getCreationFees();
      const creationFee = poolData.useBitr ? fees.bitr : fees.stt;
      const totalRequired = creationFee + poolData.creatorStake;

      console.log(`💰 Combo pool creation:`, {
        creationFee: formatEther(creationFee),
        creatorStake: formatEther(poolData.creatorStake),
        totalRequired: formatEther(totalRequired),
        useBitr: poolData.useBitr
      });

      // For BITR pools, approve tokens first
      if (poolData.useBitr) {
        // Check BITR balance
        const bitrBalance = await executeContractCall(async (client) => {
          return await client.readContract({
            address: CONTRACT_ADDRESSES.BITR_TOKEN,
            abi: CONTRACTS.BITR_TOKEN.abi,
            functionName: 'balanceOf',
            args: [address],
          });
        }) as bigint;

        if (bitrBalance < totalRequired) {
          const errorMsg = `Insufficient BITR balance. You need ${formatEther(totalRequired)} BITR but have ${formatEther(bitrBalance)} BITR`;
          toast.error(errorMsg);
          throw new Error(errorMsg);
        }

        // Check current allowance
        const currentAllowance = await executeContractCall(async (client) => {
          return await client.readContract({
            address: CONTRACT_ADDRESSES.BITR_TOKEN,
            abi: CONTRACTS.BITR_TOKEN.abi,
            functionName: 'allowance',
            args: [address, CONTRACT_ADDRESSES.COMBO_POOLS],
          });
        }) as bigint;

        if (currentAllowance < totalRequired) {
          toast.loading('Approving BITR tokens...', { id: 'bitr-approval' });
          
          const approveTx = await writeContractAsync({
            address: CONTRACT_ADDRESSES.BITR_TOKEN,
            abi: CONTRACTS.BITR_TOKEN.abi,
            functionName: 'approve',
            args: [CONTRACT_ADDRESSES.COMBO_POOLS, totalRequired * 10n], // 10x for future use
            ...getTransactionOptions(),
          });

          // Wait for approval confirmation
          if (publicClient) {
            const receipt = await publicClient.waitForTransactionReceipt({ hash: approveTx });
            if (receipt.status !== 'success') {
              toast.dismiss('bitr-approval');
              throw new Error('BITR approval failed');
            }
          }
          
          toast.dismiss('bitr-approval');
          toast.success('BITR tokens approved!');
        }
      } else {
        // For STT pools, check native balance
        if (publicClient) {
          const sttBalance = await publicClient.getBalance({ address });
          if (sttBalance < totalRequired) {
            const errorMsg = `Insufficient STT balance. You need ${formatEther(totalRequired)} STT but have ${formatEther(sttBalance)} STT`;
            toast.error(errorMsg);
            throw new Error(errorMsg);
          }
        }
      }

      toast.loading('Creating combo pool...', { id: 'combo-creation' });

      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.COMBO_POOLS,
        abi: CONTRACTS.COMBO_POOLS.abi,
        functionName: 'createComboPool',
        args: [
          contractConditions,
          Math.floor(poolData.combinedOdds * 100), // Convert to basis points
          poolData.creatorStake,
          poolData.earliestEventStart,
          poolData.latestEventEnd,
          categoryHash,
          poolData.maxBetPerUser,
          poolData.useBitr
        ],
        value: poolData.useBitr ? 0n : totalRequired, // Only send STT for STT pools
        ...getTransactionOptions(),
      });

      console.log('✅ Combo pool creation tx submitted:', txHash);

      // Wait for confirmation
      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
        if (receipt.status !== 'success') {
          toast.dismiss('combo-creation');
          toast.error('Combo pool creation failed on-chain');
          throw new Error('Combo pool creation failed');
        }
      }
      
      toast.dismiss('combo-creation');
      toast.success('Combo pool created successfully!');
      return txHash;
    } catch (error) {
      console.error('Error creating combo pool:', error);
      toast.dismiss('combo-creation');
      toast.dismiss('bitr-approval');
      
      if (error instanceof Error) {
        if (error.message.includes('user rejected') || error.message.includes('User rejected')) {
          toast.error('Transaction cancelled');
        } else if (!error.message.includes('Insufficient')) {
          toast.error(`Failed to create combo pool: ${error.message.slice(0, 100)}`);
        }
      } else {
        toast.error('Failed to create combo pool');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [writeContractAsync, address, publicClient, getCreationFees]);

  /**
   * Place a bet on a combo pool
   */
  const placeComboBet = useCallback(async (poolId: number, betAmount: bigint, useBitr: boolean = false) => {
    if (!address) {
      toast.error('Please connect your wallet');
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);

    try {
      console.log(`🎲 Placing combo bet on pool ${poolId}:`, {
        amount: formatEther(betAmount),
        useBitr
      });

      // For BITR pools, approve tokens first
      if (useBitr) {
        const currentAllowance = await executeContractCall(async (client) => {
          return await client.readContract({
            address: CONTRACT_ADDRESSES.BITR_TOKEN,
            abi: CONTRACTS.BITR_TOKEN.abi,
            functionName: 'allowance',
            args: [address, CONTRACT_ADDRESSES.COMBO_POOLS],
          });
        }) as bigint;

        if (currentAllowance < betAmount) {
          toast.loading('Approving BITR tokens...', { id: 'bitr-approval' });
          
          const approveTx = await writeContractAsync({
            address: CONTRACT_ADDRESSES.BITR_TOKEN,
            abi: CONTRACTS.BITR_TOKEN.abi,
            functionName: 'approve',
            args: [CONTRACT_ADDRESSES.COMBO_POOLS, betAmount * 10n],
            ...getTransactionOptions(),
          });

          if (publicClient) {
            await publicClient.waitForTransactionReceipt({ hash: approveTx });
          }
          
          toast.dismiss('bitr-approval');
          toast.success('BITR approved!');
        }
      }

      toast.loading('Placing combo bet...', { id: 'combo-bet' });

      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.COMBO_POOLS,
        abi: CONTRACTS.COMBO_POOLS.abi,
        functionName: 'placeComboBet',
        args: [BigInt(poolId), betAmount],
        value: useBitr ? 0n : betAmount,
        ...getTransactionOptions(),
      });

      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
        if (receipt.status !== 'success') {
          toast.dismiss('combo-bet');
          toast.error('Combo bet failed on-chain');
          throw new Error('Combo bet failed');
        }
      }
      
      toast.dismiss('combo-bet');
      toast.success('Combo bet placed successfully!');
      return txHash;
    } catch (error) {
      console.error('Error placing combo bet:', error);
      toast.dismiss('combo-bet');
      toast.dismiss('bitr-approval');
      
      if (error instanceof Error && !error.message.includes('user rejected')) {
        toast.error('Failed to place combo bet');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [writeContractAsync, address, publicClient]);

  /**
   * Add liquidity to a combo pool
   */
  const addComboLiquidity = useCallback(async (poolId: number, amount: bigint, useBitr: boolean = false) => {
    if (!address) {
      toast.error('Please connect your wallet');
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);

    try {
      console.log(`💧 Adding liquidity to combo pool ${poolId}:`, {
        amount: formatEther(amount),
        useBitr
      });

      // For BITR pools, approve tokens first
      if (useBitr) {
        const currentAllowance = await executeContractCall(async (client) => {
          return await client.readContract({
            address: CONTRACT_ADDRESSES.BITR_TOKEN,
            abi: CONTRACTS.BITR_TOKEN.abi,
            functionName: 'allowance',
            args: [address, CONTRACT_ADDRESSES.COMBO_POOLS],
          });
        }) as bigint;

        if (currentAllowance < amount) {
          toast.loading('Approving BITR tokens...', { id: 'bitr-approval' });
          
          await writeContractAsync({
            address: CONTRACT_ADDRESSES.BITR_TOKEN,
            abi: CONTRACTS.BITR_TOKEN.abi,
            functionName: 'approve',
            args: [CONTRACT_ADDRESSES.COMBO_POOLS, amount * 10n],
            ...getTransactionOptions(),
          });
          
          toast.dismiss('bitr-approval');
          toast.success('BITR approved!');
        }
      }

      toast.loading('Adding liquidity...', { id: 'combo-lp' });

      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.COMBO_POOLS,
        abi: CONTRACTS.COMBO_POOLS.abi,
        functionName: 'addComboLiquidity',
        args: [BigInt(poolId), amount],
        value: useBitr ? 0n : amount,
        ...getTransactionOptions(),
      });

      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
        if (receipt.status !== 'success') {
          toast.dismiss('combo-lp');
          toast.error('Add liquidity failed on-chain');
          throw new Error('Add liquidity failed');
        }
      }
      
      toast.dismiss('combo-lp');
      toast.success('Liquidity added successfully!');
      return txHash;
    } catch (error) {
      console.error('Error adding combo liquidity:', error);
      toast.dismiss('combo-lp');
      toast.dismiss('bitr-approval');
      
      if (error instanceof Error && !error.message.includes('user rejected')) {
        toast.error('Failed to add liquidity');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [writeContractAsync, address, publicClient]);

  /**
   * Claim rewards from a settled combo pool
   */
  const claimComboRewards = useCallback(async (poolId: number) => {
    if (!address) {
      toast.error('Please connect your wallet');
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);

    try {
      console.log(`🏆 Claiming rewards from combo pool ${poolId}`);

      toast.loading('Claiming rewards...', { id: 'combo-claim' });

      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.COMBO_POOLS,
        abi: CONTRACTS.COMBO_POOLS.abi,
        functionName: 'claimCombo',
        args: [BigInt(poolId)],
        ...getTransactionOptions(),
      });

      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
        if (receipt.status !== 'success') {
          toast.dismiss('combo-claim');
          toast.error('Claim failed on-chain');
          throw new Error('Claim failed');
        }
      }
      
      toast.dismiss('combo-claim');
      toast.success('Rewards claimed successfully!');
      return txHash;
    } catch (error) {
      console.error('Error claiming combo rewards:', error);
      toast.dismiss('combo-claim');
      
      if (error instanceof Error) {
        if (error.message.includes('already claimed')) {
          toast.error('Rewards already claimed');
        } else if (error.message.includes('not settled')) {
          toast.error('Pool not yet settled');
        } else if (!error.message.includes('user rejected')) {
          toast.error('Failed to claim rewards');
        }
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [writeContractAsync, address, publicClient]);

  /**
   * Settle a combo pool (admin/oracle only)
   */
  const settleComboPool = useCallback(async (poolId: number, outcomes: string[]) => {
    if (!address) {
      toast.error('Please connect your wallet');
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);

    try {
      console.log(`⚖️ Settling combo pool ${poolId} with outcomes:`, outcomes);

      // Convert outcomes to bytes32
      const outcomesBytes32 = outcomes.map(o => ethers.encodeBytes32String(o.slice(0, 31)));

      toast.loading('Settling combo pool...', { id: 'combo-settle' });

      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.COMBO_POOLS,
        abi: CONTRACTS.COMBO_POOLS.abi,
        functionName: 'settleComboPool',
        args: [BigInt(poolId), outcomesBytes32],
        ...getTransactionOptions(),
      });

      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
        if (receipt.status !== 'success') {
          toast.dismiss('combo-settle');
          toast.error('Settlement failed on-chain');
          throw new Error('Settlement failed');
        }
      }
      
      toast.dismiss('combo-settle');
      toast.success('Combo pool settled successfully!');
      return txHash;
    } catch (error) {
      console.error('Error settling combo pool:', error);
      toast.dismiss('combo-settle');
      
      if (error instanceof Error && !error.message.includes('user rejected')) {
        toast.error('Failed to settle combo pool');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [writeContractAsync, address, publicClient]);

  return {
    // State
    isLoading,
    
    // Read functions
    getCreationFees,
    getComboPool,
    getComboPoolConditions,
    getComboPoolAnalytics,
    getUserComboBetStake,
    hasUserClaimed,
    getComboPoolCount,
    
    // Write functions
    createComboPool,
    placeComboBet,
    addComboLiquidity,
    claimComboRewards,
    settleComboPool,
  };
}

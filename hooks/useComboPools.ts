import { useCallback } from 'react';
import { useWriteContract, useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { CONTRACTS } from '@/contracts';
import { CONTRACT_ADDRESSES } from '@/config/wagmi';
import { getTransactionOptions } from '@/lib/network-connection';
import { toast } from 'react-hot-toast';

export interface ComboCondition {
  marketId: string;           // SportMonks match ID (bytes32)
  expectedOutcome: string;   // Expected result (bytes32)
  description: string;        // Human readable description
  odds: number;              // Individual odds (1.01x - 100x) as uint16
}

export interface ComboPoolData {
  conditions: ComboCondition[];
  combinedOdds: number;        // Combined odds (1.01x - 500x) as uint16
  creatorStake: bigint;        // Creator's stake in wei
  earliestEventStart: bigint;  // Earliest event start timestamp
  latestEventEnd: bigint;      // Latest event end timestamp
  category: string;            // Category string (will be hashed)
  maxBetPerUser: bigint;       // Max bet per user (0 = unlimited)
  useBitr: boolean;           // Use BITR token (true) or STT (false)
}

export function useComboPools() {
  const { writeContractAsync } = useWriteContract();
  const { address } = useAccount();

  const createComboPool = useCallback(async (poolData: ComboPoolData) => {
    try {
      // Hash category string before calling the contract
      const categoryHash = ethers.keccak256(ethers.toUtf8Bytes(poolData.category));
      
      // Transform conditions to match contract struct
      const contractConditions = poolData.conditions.map(condition => ({
        marketId: ethers.encodeBytes32String(condition.marketId),
        expectedOutcome: ethers.encodeBytes32String(condition.expectedOutcome),
        resolved: false, // Always false for new pools
        actualOutcome: "0x0000000000000000000000000000000000000000000000000000000000000000", // Empty bytes32
        description: condition.description,
        odds: Math.floor(condition.odds * 100) // Convert to basis points (1.85 -> 185)
      }));
      
      // Calculate total required payment
      const creationFeeBITR = 70n * 10n**18n; // 70 BITR
      const creationFeeSTT = 1n * 10n**18n;   // 1 STT
      const totalRequired = poolData.useBitr 
        ? creationFeeBITR + poolData.creatorStake
        : creationFeeSTT + poolData.creatorStake;
      
      // For BITR pools, we need to approve tokens first
      if (poolData.useBitr && address) {
        // First approve BITR tokens for the combo pools contract
        await writeContractAsync({
          address: CONTRACT_ADDRESSES.BITR_TOKEN,
          abi: CONTRACTS.BITR_TOKEN.abi,
          functionName: 'approve',
          args: [CONTRACT_ADDRESSES.COMBO_POOLS, totalRequired],
          ...getTransactionOptions(),
        });
        
        toast.success('BITR tokens approved for combo pool creation!');
      }
      
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
        value: poolData.useBitr ? 0n : totalRequired, // Only send ETH for STT pools
        ...getTransactionOptions(),
      });
      
      toast.success('Combo pool creation transaction submitted!');
      return txHash;
    } catch (error) {
      console.error('Error creating combo pool:', error);
      toast.error('Failed to create combo pool');
      throw error;
    }
  }, [writeContractAsync]);

  const placeComboBet = useCallback(async (poolId: bigint, betAmount: bigint) => {
    try {
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.COMBO_POOLS,
        abi: CONTRACTS.COMBO_POOLS.abi,
        functionName: 'placeComboBet',
        args: [poolId, betAmount],
        value: betAmount,
        ...getTransactionOptions(),
      });
      
      toast.success('Combo bet placed successfully!');
      return txHash;
    } catch (error) {
      console.error('Error placing combo bet:', error);
      toast.error('Failed to place combo bet');
      throw error;
    }
  }, [writeContractAsync]);

  const settleComboPool = useCallback(async (poolId: bigint, outcomes: string[]) => {
    try {
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.COMBO_POOLS,
        abi: CONTRACTS.COMBO_POOLS.abi,
        functionName: 'settleComboPool',
        args: [poolId, outcomes],
        ...getTransactionOptions(),
      });
      
      toast.success('Combo pool settled successfully!');
      return txHash;
    } catch (error) {
      console.error('Error settling combo pool:', error);
      toast.error('Failed to settle combo pool');
      throw error;
    }
  }, [writeContractAsync]);

  return {
    createComboPool,
    placeComboBet,
    settleComboPool,
  };
}

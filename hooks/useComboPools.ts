import { useCallback } from 'react';
import { useWriteContract } from 'wagmi';
import { ethers } from 'ethers';
import { CONTRACTS } from '@/contracts';
import { CONTRACT_ADDRESSES } from '@/config/wagmi';
import { getTransactionOptions } from '@/lib/network-connection';
import { toast } from 'react-hot-toast';

export interface ComboCondition {
  marketId: string;
  expectedOutcome: string;
  odds: bigint;
  eventStartTime: bigint;
  eventEndTime: bigint;
}

export interface ComboPoolData {
  conditions: ComboCondition[];
  combinedOdds: number;
  creatorStake: bigint;
  earliestEventStart: bigint;
  latestEventEnd: bigint;
  category: string;
  maxBetPerUser: bigint;
  useBitr: boolean;
}

export function useComboPools() {
  const { writeContractAsync } = useWriteContract();

  const createComboPool = useCallback(async (poolData: ComboPoolData) => {
    try {
      // Hash category string before calling the optimized contract
      const categoryHash = ethers.keccak256(ethers.toUtf8Bytes(poolData.category));
      
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.COMBO_POOLS,
        abi: CONTRACTS.COMBO_POOLS.abi,
        functionName: 'createComboPool',
        args: [
          poolData.conditions,
          poolData.combinedOdds,
          poolData.creatorStake,
          poolData.earliestEventStart,
          poolData.latestEventEnd,
          categoryHash, // 🎯 Hashed category
          poolData.maxBetPerUser,
          poolData.useBitr
        ],
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

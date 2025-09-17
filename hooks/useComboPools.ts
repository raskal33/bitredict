import { useCallback } from 'react';
import { useWriteContract } from 'wagmi';
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
  title: string;
  description: string;
  creatorStake: bigint;
  maxBetPerUser: bigint;
  useBitr: boolean;
  isPrivate: boolean;
  conditions: ComboCondition[];
  eventStartTime: bigint;
  eventEndTime: bigint;
  bettingEndTime: bigint;
}

export function useComboPools() {
  const { writeContractAsync } = useWriteContract();

  const createComboPool = useCallback(async (poolData: ComboPoolData) => {
    try {
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.COMBO_POOLS,
        abi: CONTRACTS.COMBO_POOLS.abi,
        functionName: 'createComboPool',
        args: [
          poolData.title,
          poolData.description,
          poolData.creatorStake,
          poolData.maxBetPerUser,
          poolData.useBitr,
          poolData.isPrivate,
          poolData.conditions,
          poolData.eventStartTime,
          poolData.eventEndTime,
          poolData.bettingEndTime
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

  const placeComboBet = useCallback(async (poolId: bigint, betAmount: bigint, isCreatorSide: boolean) => {
    try {
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.COMBO_POOLS,
        abi: CONTRACTS.COMBO_POOLS.abi,
        functionName: 'placeComboBet',
        args: [poolId, betAmount, isCreatorSide],
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

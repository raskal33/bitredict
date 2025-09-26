import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS } from '@/contracts';
import { formatUnits, parseUnits } from 'viem';

export function useBITRToken() {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Read contract functions
  const { data: balance, refetch: refetchBalance } = useReadContract({
    ...CONTRACTS.BITR_TOKEN,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const { data: totalSupply } = useReadContract({
    ...CONTRACTS.BITR_TOKEN,
    functionName: 'totalSupply',
  });

  const { data: decimals } = useReadContract({
    ...CONTRACTS.BITR_TOKEN,
    functionName: 'decimals',
  });

  const { data: name } = useReadContract({
    ...CONTRACTS.BITR_TOKEN,
    functionName: 'name',
  });

  const { data: symbol } = useReadContract({
    ...CONTRACTS.BITR_TOKEN,
    functionName: 'symbol',
  });

  // Track allowances for different spenders
  const [allowances, setAllowances] = useState<Record<string, bigint>>({});

  // Get allowance for staking contract (most common use case)
  const { data: stakingAllowance, refetch: refetchStakingAllowance } = useReadContract({
    ...CONTRACTS.BITR_TOKEN,
    functionName: 'allowance',
    args: address && CONTRACTS.BITREDICT_STAKING?.address ? [address, CONTRACTS.BITREDICT_STAKING.address] : undefined,
    query: { enabled: !!(address && CONTRACTS.BITREDICT_STAKING?.address) }
  });

  // Get allowance for faucet contract
  const { data: faucetAllowance, refetch: refetchFaucetAllowance } = useReadContract({
    ...CONTRACTS.BITR_TOKEN,
    functionName: 'allowance',
    args: address && CONTRACTS.FAUCET?.address ? [address, CONTRACTS.FAUCET.address] : undefined,
    query: { enabled: !!(address && CONTRACTS.FAUCET?.address) }
  });

  // Update allowances when data changes
  useEffect(() => {
    if (stakingAllowance !== undefined && stakingAllowance !== null && CONTRACTS.BITREDICT_STAKING?.address) {
      setAllowances(prev => ({
        ...prev,
        [CONTRACTS.BITREDICT_STAKING.address]: stakingAllowance as bigint
      }));
    }
  }, [stakingAllowance]);

  useEffect(() => {
    if (faucetAllowance !== undefined && faucetAllowance !== null && CONTRACTS.FAUCET?.address) {
      setAllowances(prev => ({
        ...prev,
        [CONTRACTS.FAUCET.address]: faucetAllowance as bigint
      }));
    }
  }, [faucetAllowance]);

  // Get allowance for a specific spender
  const getAllowance = (spender: `0x${string}`): bigint | undefined => {
    return allowances[spender];
  };

  // Write contract functions
  const transfer = async (to: `0x${string}`, amount: string) => {
    if (!decimals) return;
    const parsedAmount = parseUnits(amount, Number(decimals));
    writeContract({
      ...CONTRACTS.BITR_TOKEN,
      functionName: 'transfer',
      args: [to, parsedAmount],
    });
  };

  const approve = async (spender: `0x${string}`, amount: string) => {
    if (!decimals) return;
    const parsedAmount = parseUnits(amount, Number(decimals));
    writeContract({
      ...CONTRACTS.BITR_TOKEN,
      functionName: 'approve',
      args: [spender, parsedAmount],
    });
  };

  const approveMax = async (spender: `0x${string}`) => {
    writeContract({
      ...CONTRACTS.BITR_TOKEN,
      functionName: 'approve',
      args: [spender, BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')],
    });
  };

  // Helper functions
  const formatBalance = (rawBalance?: bigint): string => {
    if (!rawBalance || !decimals) return '0';
    return formatUnits(rawBalance, Number(decimals));
  };

  const formatTotalSupply = (): string => {
    if (!totalSupply || !decimals) return '0';
    return formatUnits(totalSupply as bigint, Number(decimals));
  };

  const refetchAll = () => {
    refetchBalance();
    refetchStakingAllowance();
    refetchFaucetAllowance();
  };

  return {
    // Contract info
    name,
    symbol,
    decimals,
    totalSupply: formatTotalSupply(),
    
    // User balance
    balance: formatBalance(balance as bigint),
    rawBalance: balance as bigint,
    refetchBalance,
    
    // Allowances
    getAllowance,
    stakingAllowance: stakingAllowance as bigint,
    faucetAllowance: faucetAllowance as bigint,
    
    // Actions
    transfer,
    approve,
    approveMax,
    refetchAll,
    
    // Transaction state
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    error: writeError,
  };
}

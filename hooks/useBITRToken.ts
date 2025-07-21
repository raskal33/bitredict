import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS } from '@/contracts';
import { formatUnits, parseUnits } from 'viem';

export function useBITRToken() {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
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

  // Get allowance for a specific spender
  const getAllowance = (spender: `0x${string}`) => {
    const { data: allowance } = useReadContract({
      ...CONTRACTS.BITR_TOKEN,
      functionName: 'allowance',
      args: address && spender ? [address, spender] : undefined,
      query: { enabled: !!(address && spender) }
    });
    return allowance;
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
    
    // Contract functions
    transfer,
    approve,
    approveMax,
    getAllowance,
    
    // Transaction state
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    
    // Helpers
    formatBalance,
  };
}

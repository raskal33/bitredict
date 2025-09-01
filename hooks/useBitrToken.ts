import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS } from '@/contracts';
import { parseUnits, formatUnits } from 'viem';

export function useBitrToken() {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Get BITR balance
  const { data: balance, refetch: refetchBalance } = useReadContract({
    ...CONTRACTS.BITR_TOKEN,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  // Get allowance for BitredictPool contract
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    ...CONTRACTS.BITR_TOKEN,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.BITREDICT_POOL.address] : undefined,
    query: { enabled: !!address }
  });

  // Approve BITR tokens for spending
  const approve = async (amount: string) => {
    const approvalAmount = parseUnits(amount, 18);
    
    writeContract({
      ...CONTRACTS.BITR_TOKEN,
      functionName: 'approve',
      args: [CONTRACTS.BITREDICT_POOL.address, approvalAmount],
    });
  };

  // Check if approval is needed
  const needsApproval = (amount: string): boolean => {
    if (!allowance) return true;
    const requiredAmount = parseUnits(amount, 18);
    return (allowance as bigint) < requiredAmount;
  };

  // Helper functions
  const formatBalance = (balance?: bigint): string => {
    if (!balance) return '0';
    return formatUnits(balance, 18);
  };

  const formatAllowance = (allowance?: bigint): string => {
    if (!allowance) return '0';
    return formatUnits(allowance, 18);
  };

  return {
    // Data
    balance: balance as bigint,
    allowance: allowance as bigint,
    formattedBalance: formatBalance(balance as bigint),
    formattedAllowance: formatAllowance(allowance as bigint),
    
    // Actions
    approve,
    needsApproval,
    
    // Refresh functions
    refetchBalance,
    refetchAllowance,
    
    // Transaction state
    isPending,
    isConfirming,
    isConfirmed,
    hash,
  };
}

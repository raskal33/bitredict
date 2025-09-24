'use client';

import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import Button from '@/components/button';
import { toast } from 'react-hot-toast';
import { CONTRACTS } from '@/contracts';

interface Pool {
  poolId: string;
  status: string;
  settled: boolean;
  creatorAddress: string;
  totalBettorStake: string;
  eventEndTime: number;
  arbitrationDeadline?: number;
  creatorSideWon?: boolean;
  oracleType: number;
}

interface PoolActionsProps {
  pool: Pool;
  userAddress?: string;
  contractAddress: string;
  onSuccess?: () => void;
}

export function PoolActions({ pool, userAddress, contractAddress, onSuccess }: PoolActionsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { data: hash, writeContract, error: writeError, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Check if pool can be refunded
  const canRefund = () => {
    const now = Math.floor(Date.now() / 1000);
    const arbitrationDeadline = pool.arbitrationDeadline || (pool.eventEndTime + 24 * 60 * 60);
    
    return (
      !pool.settled &&
      Number(pool.totalBettorStake) === 0 &&
      now > arbitrationDeadline &&
      pool.status !== 'refunded'
    );
  };

  // Check if user can claim rewards
  const canClaim = () => {
    return (
      pool.settled &&
      pool.status !== 'claimed' &&
      userAddress &&
      (userAddress === pool.creatorAddress || hasUserBet())
    );
  };

  // Check if user has bet on this pool (simplified - would need actual bet data)
  const hasUserBet = () => {
    // This would need to be implemented with actual bet data
    // For now, return false as placeholder
    return false;
  };

  const handleRefund = async () => {
    if (!canRefund()) {
      toast.error('Pool is not eligible for refund');
      return;
    }

    try {
      setIsProcessing(true);
      toast.loading('Submitting refund transaction...');

      writeContract({
        address: contractAddress as `0x${string}`,
        abi: CONTRACTS.POOL_CORE.abi,
        functionName: 'refundPool',
        args: [BigInt(pool.poolId)],
      });

    } catch (error) {
      console.error('Refund error:', error);
      toast.error((error as Error).message || 'Failed to process refund');
      setIsProcessing(false);
    }
  };

  const handleClaim = async () => {
    if (!canClaim()) {
      toast.error('No rewards available to claim');
      return;
    }

    try {
      setIsProcessing(true);
      toast.loading('Submitting claim transaction...');

      writeContract({
        address: contractAddress as `0x${string}`,
        abi: CONTRACTS.POOL_CORE.abi,
        functionName: 'claim',
        args: [BigInt(pool.poolId)],
      });

    } catch (error) {
      console.error('Claim error:', error);
      toast.error((error as Error).message || 'Failed to process claim');
      setIsProcessing(false);
    }
  };

  // Handle transaction success
  if (isSuccess && isProcessing) {
    setIsProcessing(false);
    toast.success('Your transaction has been confirmed!');
    onSuccess?.();
  }

  // Handle transaction error
  if (writeError && isProcessing) {
    setIsProcessing(false);
    toast.error(writeError.message || 'Transaction failed');
  }

  const getPoolStatusInfo = () => {
    if (pool.status === 'refunded') {
      return {
        text: 'Pool Refunded',
        color: 'text-blue-400',
        icon: '💰'
      };
    }
    
    if (pool.settled) {
      if (pool.creatorSideWon) {
        return {
          text: 'Creator Side Won',
          color: 'text-green-400',
          icon: '🎉'
        };
      } else {
        return {
          text: 'Bettor Side Won',
          color: 'text-red-400',
          icon: '🎯'
        };
      }
    }

    if (canRefund()) {
      return {
        text: 'Ready for Refund',
        color: 'text-yellow-400',
        icon: '⏰'
      };
    }

    const now = Math.floor(Date.now() / 1000);
    if (now > pool.eventEndTime) {
      return {
        text: 'Awaiting Settlement',
        color: 'text-orange-400',
        icon: '⏳'
      };
    }

    return {
      text: 'Active',
      color: 'text-cyan-400',
      icon: '🔥'
    };
  };

  const statusInfo = getPoolStatusInfo();

  return (
    <div className="space-y-4">
      {/* Pool Status */}
      <div className="flex items-center gap-2 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
        <span className="text-lg">{statusInfo.icon}</span>
        <span className={`font-medium ${statusInfo.color}`}>
          {statusInfo.text}
        </span>
        {pool.oracleType === 1 && (
          <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
            OPEN ORACLE
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        {canRefund() && (
          <Button
            onClick={handleRefund}
            disabled={isPending || isConfirming || isProcessing}
            variant="primary"
            className="w-full"
          >
            {isPending || isConfirming || isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing Refund...
              </div>
            ) : (
              <>💰 Refund Pool</>
            )}
          </Button>
        )}

        {canClaim() && (
          <Button
            onClick={handleClaim}
            disabled={isPending || isConfirming || isProcessing}
            variant="success"
            className="w-full"
          >
            {isPending || isConfirming || isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing Claim...
              </div>
            ) : (
              <>🎉 Claim Rewards</>
            )}
          </Button>
        )}

        {!canRefund() && !canClaim() && pool.settled && (
          <div className="text-center py-4 text-gray-400">
            <p>No actions available for this pool</p>
          </div>
        )}

        {!canRefund() && !canClaim() && !pool.settled && (
          <div className="text-center py-4 text-gray-400">
            <p>Pool is still active - no actions available yet</p>
          </div>
        )}
      </div>

      {/* Pool Info */}
      <div className="text-xs text-gray-400 space-y-1">
        <div>Pool ID: {pool.poolId}</div>
        <div>Total Bettor Stake: {pool.totalBettorStake} tokens</div>
        <div>Event End: {new Date(pool.eventEndTime * 1000).toLocaleString()}</div>
        {pool.arbitrationDeadline && (
          <div>Arbitration Deadline: {new Date(pool.arbitrationDeadline * 1000).toLocaleString()}</div>
        )}
      </div>
    </div>
  );
}

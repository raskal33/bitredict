"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { toast } from "react-hot-toast";
import { CONTRACT_ADDRESSES } from "@/config/wagmi";
import BitredictPoolCoreArtifact from "@/contracts/abis/BitredictPoolCore.json";

// Extract ABI array from artifact
const BitredictPoolCoreABI = BitredictPoolCoreArtifact.abi;
import { formatEther } from "viem";

interface ClaimRewardsProps {
  pool: {
    id: string | number;
    currency: string;
    settled?: boolean;
    eventEndTime?: number;
    status?: string;
    [key: string]: unknown;
  };
  userAddress?: string;
}

interface ClaimInfo {
  canClaim: boolean;
  claimableAmount: bigint;
  isWinner: boolean;
  userStake: bigint;
  alreadyClaimed: boolean;
  reason: string;
}

export default function ClaimRewards({ pool }: ClaimRewardsProps) {
  const { address } = useAccount();
  const [claimInfo, setClaimInfo] = useState<ClaimInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Use the new getClaimInfo function from the contract
  const { data: contractClaimInfo, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.POOL_CORE,
    abi: BitredictPoolCoreABI,
    functionName: 'getClaimInfo',
    args: [BigInt(pool.id), address || '0x0'],
    query: { enabled: !!address && !!pool }
  });

  // Process claim info from contract
  useEffect(() => {
    if (contractClaimInfo) {
      const [canClaim, claimableAmount, isWinner, userStake, alreadyClaimed, reason] = contractClaimInfo as [boolean, bigint, boolean, bigint, boolean, string];
      
      setClaimInfo({
        canClaim,
        claimableAmount,
        isWinner,
        userStake,
        alreadyClaimed,
        reason
      });
      setLoading(false);
    } else if (address && pool) {
      // If no data yet, keep loading
      setLoading(true);
    }
  }, [contractClaimInfo, address, pool]);

  // Handle successful claim
  useEffect(() => {
    if (isConfirmed) {
      toast.success('Reward claimed successfully!');
      refetch(); // Refresh claim info
    }
  }, [isConfirmed, refetch]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(`Claim failed: ${error.message}`);
    }
  }, [error]);

  const handleClaim = async () => {
    if (!address || !pool || !claimInfo?.canClaim) return;

    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.POOL_CORE,
        abi: BitredictPoolCoreABI,
        functionName: 'claim',
        args: [BigInt(pool.id)],
      });
      
      toast.loading('Claim transaction submitted...', { id: 'claim-tx' });
    } catch (err) {
      console.error('Claim error:', err);
      toast.error('Failed to submit claim transaction');
    }
  };

  if (!address) {
    return null; // Don't show if no wallet connected
  }

  if (loading) {
    return (
      <div className="glass-card p-6 border border-border-card">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4"></div>
          <div className="h-4 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!claimInfo) {
    return null;
  }

  // Don't show if user has no stake
  if (claimInfo.userStake === BigInt(0)) {
    return null;
  }

  return (
    <div className="glass-card p-6 border border-border-card">
      <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
        Claim Rewards
      </h2>

      <div className="space-y-4">
        <div className="bg-bg-dark p-4 rounded-lg border border-border-card">
          <div className="flex justify-between items-center mb-2">
            <span className="text-text-secondary">Your Stake:</span>
            <span className="font-semibold text-text-primary">
              {formatEther(claimInfo.userStake)} {pool.currency}
            </span>
          </div>
          
          {claimInfo.alreadyClaimed ? (
            <div className="text-center py-4">
              <div className="text-green-400 text-lg font-semibold mb-2">✓ Already Claimed</div>
              <div className="text-text-secondary">
                You have already claimed {formatEther(claimInfo.claimableAmount)} {pool.currency}
              </div>
            </div>
          ) : claimInfo.canClaim ? (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className={`text-lg font-semibold mb-2 ${claimInfo.isWinner ? 'text-green-400' : 'text-yellow-400'}`}>
                  {claimInfo.isWinner ? '🎉 You Won!' : '💰 Claimable'}
                </div>
                <div className="text-2xl font-bold text-text-primary">
                  {formatEther(claimInfo.claimableAmount)} {pool.currency}
                </div>
              </div>
              
              <button
                onClick={handleClaim}
                disabled={isPending || isConfirming}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
              >
                {isPending || isConfirming ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {isPending ? 'Submitting...' : 'Confirming...'}
                  </div>
                ) : (
                  `Claim ${formatEther(claimInfo.claimableAmount)} ${pool.currency}`
                )}
              </button>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-text-secondary text-lg mb-2">Not Ready to Claim</div>
              <div className="text-text-muted">{claimInfo.reason}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { toast } from "react-hot-toast";
import { formatEther } from "viem";
import { PoolContractService } from "@/services/poolContractService";
import { CONTRACTS } from "@/contracts";

interface ClaimRewardsProps {
  poolId: string;
  poolStatus: 'creator_won' | 'bettor_won' | 'settled';
}

export default function ClaimRewards({ poolId, poolStatus }: ClaimRewardsProps) {
  const { address } = useAccount();
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [payoutInfo, setPayoutInfo] = useState<{
    payout: string;
    stake: string;
    profit: string;
    isWinner: boolean;
    hasClaimed: boolean;
  } | null>(null);

  const { writeContract, data: hash, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Fetch payout information
  useEffect(() => {
    const fetchPayoutInfo = async () => {
      if (!address) return;
      
      setLoading(true);
      try {
        const [payout, stakes] = await Promise.all([
          PoolContractService.calculatePayout(parseInt(poolId), address),
          PoolContractService.getUserStakes(parseInt(poolId), address)
        ]);

        if (payout && stakes) {
          setPayoutInfo({
            ...payout,
            hasClaimed: stakes.hasClaimed
          });
        }
      } catch (error) {
        console.error('Error fetching payout info:', error);
        toast.error('Failed to load payout information');
      } finally {
        setLoading(false);
      }
    };

    fetchPayoutInfo();
  }, [poolId, address]);

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed) {
      toast.success('Rewards claimed successfully! 🎉');
      setClaiming(false);
      // Refresh payout info
      if (address) {
        PoolContractService.getUserStakes(parseInt(poolId), address).then((stakes) => {
          if (stakes && payoutInfo) {
            setPayoutInfo({
              ...payoutInfo,
              hasClaimed: stakes.hasClaimed
            });
          }
        });
      }
    }
  }, [isConfirmed, address, poolId, payoutInfo]);

  useEffect(() => {
    if (writeError) {
      toast.error(writeError.message || 'Failed to claim rewards');
      setClaiming(false);
    }
  }, [writeError]);

  const handleClaim = async () => {
    if (!address || !payoutInfo || payoutInfo.hasClaimed) return;

    setClaiming(true);
    try {
      await writeContract({
        address: CONTRACTS.POOL_CORE.address as `0x${string}`,
        abi: CONTRACTS.POOL_CORE.abi,
        functionName: 'claim',
        args: [BigInt(poolId)],
      });
    } catch (error: unknown) {
      console.error('Error claiming rewards:', error);
      toast.error('Failed to initiate claim transaction');
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-900/30 via-blue-900/30 to-indigo-900/30 rounded-2xl p-8 border border-purple-500/20">
        <div className="animate-pulse">
          <div className="h-8 bg-purple-500/20 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-purple-500/20 rounded w-2/3 mb-6"></div>
          <div className="h-12 bg-purple-500/20 rounded"></div>
        </div>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="bg-gradient-to-br from-purple-900/30 via-blue-900/30 to-indigo-900/30 rounded-2xl p-8 border border-purple-500/20">
        <div className="text-center">
          <div className="text-5xl mb-4">🔌</div>
          <h3 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h3>
          <p className="text-gray-400">Connect your wallet to claim rewards</p>
        </div>
      </div>
    );
  }

  if (!payoutInfo || !payoutInfo.isWinner) {
    return (
      <div className="bg-gradient-to-br from-slate-900/30 via-gray-900/30 to-slate-900/30 rounded-2xl p-8 border border-slate-500/20">
        <div className="text-center">
          <div className="text-5xl mb-4">😢</div>
          <h3 className="text-xl font-bold text-white mb-2">No Rewards Available</h3>
          <p className="text-gray-400">You don&apos;t have any rewards to claim in this pool</p>
        </div>
      </div>
    );
  }

  if (payoutInfo.hasClaimed) {
    return (
      <div className="bg-gradient-to-br from-green-900/30 via-emerald-900/30 to-teal-900/30 rounded-2xl p-8 border border-green-500/20">
        <div className="text-center">
          <div className="text-5xl mb-4">✅</div>
          <h3 className="text-xl font-bold text-green-400 mb-2">Already Claimed</h3>
          <p className="text-gray-400 mb-4">You have already claimed your rewards</p>
          <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
            <div className="text-sm text-gray-400 mb-1">Total Claimed</div>
            <div className="text-2xl font-bold text-green-400">
              {(parseFloat(formatEther(BigInt(payoutInfo.payout)))).toFixed(4)} BITR
            </div>
            <div className="text-sm text-green-400 mt-2">
              Profit: +{(parseFloat(formatEther(BigInt(payoutInfo.profit)))).toFixed(4)} BITR
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = {
    creator_won: {
      icon: '🏆',
      title: 'Creator Side Won!',
      subtitle: 'Congratulations! Your LP stake won',
      color: 'emerald'
    },
    bettor_won: {
      icon: '🎯',
      title: 'Bettor Side Won!',
      subtitle: 'Congratulations! Your bet won',
      color: 'cyan'
    },
    settled: {
      icon: '✅',
      title: 'Pool Settled',
      subtitle: 'Claim your rewards now',
      color: 'blue'
    }
  };

  const config = statusConfig[poolStatus] || statusConfig.settled;

  return (
    <div className={`bg-gradient-to-br from-${config.color}-900/30 via-${config.color}-800/30 to-${config.color}-900/30 rounded-2xl p-8 border border-${config.color}-500/20`}>
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">{config.icon}</div>
        <h3 className={`text-2xl font-bold text-${config.color}-400 mb-2`}>{config.title}</h3>
        <p className="text-gray-400">{config.subtitle}</p>
      </div>

      {/* Payout Details */}
      <div className="space-y-4 mb-6">
        <div className="bg-black/30 rounded-xl p-4 border border-purple-500/20">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm">Your Stake</span>
            <span className="text-white font-semibold">
              {(parseFloat(formatEther(BigInt(payoutInfo.stake)))).toFixed(4)} BITR
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm">Profit</span>
            <span className={`text-${config.color}-400 font-semibold`}>
              +{(parseFloat(formatEther(BigInt(payoutInfo.profit)))).toFixed(4)} BITR
            </span>
          </div>
          <div className="border-t border-purple-500/20 my-3"></div>
          <div className="flex justify-between items-center">
            <span className="text-white font-bold">Total Payout</span>
            <span className={`text-${config.color}-400 font-bold text-xl`}>
              {(parseFloat(formatEther(BigInt(payoutInfo.payout)))).toFixed(4)} BITR
            </span>
          </div>
        </div>

        {/* ROI Badge */}
        <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-xl p-3 border border-yellow-500/30">
          <div className="flex items-center justify-center gap-2">
            <span className="text-yellow-400 font-semibold">Return on Investment:</span>
            <span className="text-yellow-300 font-bold text-lg">
              {((parseFloat(payoutInfo.profit) / parseFloat(payoutInfo.stake)) * 100).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Claim Button */}
      <button
        onClick={handleClaim}
        disabled={claiming || isConfirming || payoutInfo.hasClaimed}
        className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300
          ${claiming || isConfirming
            ? 'bg-gray-600 cursor-not-allowed'
            : `bg-gradient-to-r from-${config.color}-600 to-${config.color}-500 hover:from-${config.color}-500 hover:to-${config.color}-400 shadow-lg hover:shadow-${config.color}-500/50`
          }`}
      >
        {isConfirming ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">⏳</span>
            Confirming Transaction...
          </span>
        ) : claiming ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">⏳</span>
            Processing...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <span>💰</span>
            Claim {(parseFloat(formatEther(BigInt(payoutInfo.payout)))).toFixed(4)} BITR
          </span>
        )}
      </button>

      {/* Transaction Status */}
      {(claiming || isConfirming) && (
        <div className="mt-4 text-center text-sm text-gray-400">
          {isConfirming ? 'Waiting for confirmation...' : 'Please confirm the transaction in your wallet'}
        </div>
      )}
    </div>
  );
}


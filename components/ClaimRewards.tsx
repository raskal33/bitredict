"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { toast } from "react-hot-toast";

interface ClaimRewardsProps {
  poolId: string;
  poolStatus: 'creator_won' | 'bettor_won' | 'settled';
}

export default function ClaimRewards({ poolId, poolStatus }: ClaimRewardsProps) {
  const { address } = useAccount();
  const [claiming, setClaiming] = useState(false);

  const handleClaim = async () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    setClaiming(true);
    try {
      // TODO: Implement actual claim logic
      toast.success("Rewards claimed successfully!");
    } catch (error) {
      console.error("Error claiming rewards:", error);
      toast.error("Failed to claim rewards");
    } finally {
      setClaiming(false);
    }
  };

  const getStatusMessage = () => {
    switch (poolStatus) {
      case 'creator_won':
        return "Creator's prediction was correct!";
      case 'bettor_won':
        return "Bettors' prediction was correct!";
      case 'settled':
        return "Pool has been settled";
      default:
        return "Pool is settled";
    }
  };

  const getStatusIcon = () => {
    switch (poolStatus) {
      case 'creator_won':
        return "🏆";
      case 'bettor_won':
        return "🎯";
      case 'settled':
        return "✅";
      default:
        return "✅";
    }
  };

  return (
    <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-6">
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">{getStatusIcon()}</div>
        <h3 className="text-xl font-bold text-green-400 mb-2">Pool Settled</h3>
        <p className="text-gray-300">{getStatusMessage()}</p>
      </div>

      <div className="space-y-4">
        <div className="bg-black/20 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Pool ID</div>
          <div className="font-mono text-lg">{poolId}</div>
        </div>

        <button
          onClick={handleClaim}
          disabled={claiming || !address}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-3 px-6 rounded-lg hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {claiming ? "Claiming..." : "Claim Rewards"}
        </button>

        {!address && (
          <p className="text-sm text-amber-400 text-center">
            Please connect your wallet to claim rewards
          </p>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { toast } from "react-hot-toast";
import { parseAbi } from "viem";
import { CONTRACT_ADDRESSES } from "@/config/wagmi";

interface ClaimRewardsProps {
  poolId: string;
  poolStatus: 'creator_won' | 'bettor_won' | 'settled';
}

interface UserStakeInfo {
  isCreator: boolean;
  hasLPStake: boolean;
  hasBettorStake: boolean;
  lpStake: bigint;
  bettorStake: bigint;
  userWon: boolean;
  alreadyClaimed: boolean;
  estimatedPayout: bigint;
}

const POOL_ABI = parseAbi([
  "function claim(uint256 poolId) external",
  "function lpStakes(uint256, address) view returns (uint256)",
  "function bettorStakes(uint256, address) view returns (uint256)",
  "function claimed(uint256, address) view returns (bool)",
  "function pools(uint256) view returns (address creator, uint16 odds, uint8 flags, uint8 oracleType, uint8 marketType, uint256 creatorStake, uint256 totalCreatorSideStake, uint256 maxBettorStake, uint256 totalBettorStake, string predictedOutcome, string result, uint256 eventStartTime, uint256 eventEndTime, uint256 bettingEndTime, uint256 resultTimestamp, uint256 arbitrationDeadline, uint256 maxBetPerUser, bytes32 marketId, string league, string category, string region, string homeTeam, string awayTeam, string title, uint256 reserved)"
]);

export default function ClaimRewards({ poolId, poolStatus }: ClaimRewardsProps) {
  const { address } = useAccount();
  const [userStakeInfo, setUserStakeInfo] = useState<UserStakeInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Fetch user stake information
  useEffect(() => {
    const fetchUserStakeInfo = async () => {
      if (!address) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // This would be replaced with actual contract calls
        // For now, using mock data based on poolStatus
        const mockStakeInfo: UserStakeInfo = {
          isCreator: false,
          hasLPStake: poolStatus === 'creator_won',
          hasBettorStake: poolStatus === 'bettor_won',
          lpStake: poolStatus === 'creator_won' ? BigInt("1000000000000000000") : BigInt("0"), // 1 token
          bettorStake: poolStatus === 'bettor_won' ? BigInt("500000000000000000") : BigInt("0"), // 0.5 token
          userWon: poolStatus === 'creator_won' || poolStatus === 'bettor_won',
          alreadyClaimed: false,
          estimatedPayout: poolStatus === 'creator_won' ? BigInt("1500000000000000000") : 
                          poolStatus === 'bettor_won' ? BigInt("800000000000000000") : BigInt("0")
        };

        setUserStakeInfo(mockStakeInfo);
      } catch (error) {
        console.error("Error fetching user stake info:", error);
        toast.error("Failed to load your stake information");
      } finally {
        setLoading(false);
      }
    };

    fetchUserStakeInfo();
  }, [address, poolId, poolStatus]);

  const handleClaim = async () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!userStakeInfo?.userWon) {
      toast.error("You are not eligible to claim rewards");
      return;
    }

    if (userStakeInfo.alreadyClaimed) {
      toast.error("You have already claimed your rewards");
      return;
    }

    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.POOL_CORE,
        abi: POOL_ABI,
        functionName: "claim",
        args: [BigInt(poolId)],
      });
    } catch (error) {
      console.error("Error claiming rewards:", error);
      toast.error("Failed to claim rewards");
    }
  };

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed) {
      toast.success("Rewards claimed successfully!");
      setUserStakeInfo(prev => prev ? { ...prev, alreadyClaimed: true } : null);
    }
  }, [isConfirmed]);

  // Handle transaction error
  useEffect(() => {
    if (error) {
      toast.error("Transaction failed. Please try again.");
    }
  }, [error]);

  const getStatusMessage = () => {
    if (!userStakeInfo) return "Loading your position...";
    
    if (!address) return "Connect your wallet to check your position";
    
    if (!userStakeInfo.hasLPStake && !userStakeInfo.hasBettorStake) {
      return "You didn't participate in this pool";
    }

    if (userStakeInfo.alreadyClaimed) {
      return "You have already claimed your rewards";
    }

    if (userStakeInfo.userWon) {
      if (userStakeInfo.hasLPStake) {
        return "🎉 You won! (Creator/LP side)";
      } else {
        return "🎉 You won! (Bettor side)";
      }
    } else {
      return "😔 You lost this prediction";
    }
  };

  const getStatusIcon = () => {
    if (!userStakeInfo || !address) return "❓";
    
    if (!userStakeInfo.hasLPStake && !userStakeInfo.hasBettorStake) {
      return "🚫";
    }

    if (userStakeInfo.alreadyClaimed) {
      return "✅";
    }

    if (userStakeInfo.userWon) {
      return "🏆";
    } else {
      return "😔";
    }
  };

  const formatAmount = (amount: bigint) => {
    const formatted = Number(amount) / 1e18;
    return formatted.toFixed(4);
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-gray-500/10 to-slate-500/10 border border-gray-500/20 rounded-xl p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading your position...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-xl p-6 ${
      userStakeInfo?.userWon 
        ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20"
        : "bg-gradient-to-r from-red-500/10 to-rose-500/10 border-red-500/20"
    }`}>
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">{getStatusIcon()}</div>
        <h3 className={`text-xl font-bold mb-2 ${
          userStakeInfo?.userWon ? "text-green-400" : "text-red-400"
        }`}>
          Pool Settled
        </h3>
        <p className="text-gray-300">{getStatusMessage()}</p>
      </div>

      {userStakeInfo && address && (userStakeInfo.hasLPStake || userStakeInfo.hasBettorStake) && (
        <div className="space-y-4 mb-6">
          <div className="bg-black/20 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Pool ID</div>
            <div className="font-mono text-lg">{poolId}</div>
          </div>

          {userStakeInfo.hasLPStake && (
            <div className="bg-black/20 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Your LP Stake</div>
              <div className="font-mono text-lg">{formatAmount(userStakeInfo.lpStake)} BITR</div>
            </div>
          )}

          {userStakeInfo.hasBettorStake && (
            <div className="bg-black/20 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Your Bet</div>
              <div className="font-mono text-lg">{formatAmount(userStakeInfo.bettorStake)} BITR</div>
            </div>
          )}

          {userStakeInfo.userWon && userStakeInfo.estimatedPayout > 0 && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="text-sm text-green-400 mb-1">Estimated Payout</div>
              <div className="font-mono text-lg text-green-300">{formatAmount(userStakeInfo.estimatedPayout)} BITR</div>
            </div>
          )}
        </div>
      )}

      {userStakeInfo && address && (userStakeInfo.hasLPStake || userStakeInfo.hasBettorStake) && (
        <>
          {userStakeInfo.userWon && !userStakeInfo.alreadyClaimed && (
            <button
              onClick={handleClaim}
              disabled={isPending || isConfirming}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-3 px-6 rounded-lg hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? "Confirming..." : isConfirming ? "Processing..." : "Claim Rewards"}
            </button>
          )}

          {userStakeInfo.alreadyClaimed && (
            <div className="w-full bg-gray-500 text-white font-bold py-3 px-6 rounded-lg text-center">
              Already Claimed
            </div>
          )}

          {!userStakeInfo.userWon && (
            <div className="w-full bg-red-500/20 border border-red-500/30 text-red-300 font-bold py-3 px-6 rounded-lg text-center">
              No Rewards to Claim
            </div>
          )}
        </>
      )}

      {!address && (
        <p className="text-sm text-amber-400 text-center">
          Please connect your wallet to check your position
        </p>
      )}

      {address && userStakeInfo && !userStakeInfo.hasLPStake && !userStakeInfo.hasBettorStake && (
        <p className="text-sm text-gray-400 text-center">
          You didn&apos;t participate in this pool
        </p>
      )}
    </div>
  );
}

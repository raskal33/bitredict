"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { toast } from "react-hot-toast";
import { CONTRACT_ADDRESSES } from "@/config/wagmi";
import BitredictPoolCoreABI from "@/contracts/abis/BitredictPoolCore.json";

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
  poolData: {
    creator: string;
    odds: number;
    totalCreatorSideStake: bigint;
    totalBettorStake: bigint;
    settled: boolean;
    creatorSideWon: boolean;
  };
}

export default function ClaimRewards({ poolId }: ClaimRewardsProps) {
  const { address } = useAccount();
  const [userStakeInfo, setUserStakeInfo] = useState<UserStakeInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Read user's LP stake
  const { data: lpStakeData } = useReadContract({
    address: CONTRACT_ADDRESSES.POOL_CORE,
    abi: BitredictPoolCoreABI.abi,
    functionName: 'lpStakes',
    args: [BigInt(poolId), address || '0x0'],
    query: { enabled: !!address }
  });

  // Read user's bettor stake
  const { data: bettorStakeData } = useReadContract({
    address: CONTRACT_ADDRESSES.POOL_CORE,
    abi: BitredictPoolCoreABI.abi,
    functionName: 'bettorStakes',
    args: [BigInt(poolId), address || '0x0'],
    query: { enabled: !!address }
  });

  // Read if user already claimed
  const { data: claimedData } = useReadContract({
    address: CONTRACT_ADDRESSES.POOL_CORE,
    abi: BitredictPoolCoreABI.abi,
    functionName: 'claimed',
    args: [BigInt(poolId), address || '0x0'],
    query: { enabled: !!address }
  });

  // Read pool data for calculations
  const { data: poolData } = useReadContract({
    address: CONTRACT_ADDRESSES.POOL_CORE,
    abi: BitredictPoolCoreABI.abi,
    functionName: 'pools',
    args: [BigInt(poolId)]
  });

  // Process contract data when it's available
  useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }

    if (lpStakeData !== undefined && bettorStakeData !== undefined && claimedData !== undefined && poolData) {
      try {
        const lpStake = lpStakeData as bigint;
        const bettorStake = bettorStakeData as bigint;
        const alreadyClaimed = claimedData as boolean;
        
        // Parse pool data - it's returned as an array
        const [
          creator,
          odds,
          flags,
          , // oracleType - unused
          , // marketType - unused  
          , // creatorStake - unused
          totalCreatorSideStake,
          , // maxBettorStake - unused
          totalBettorStake,
          , // predictedOutcome - unused
          , // result - unused
          , // eventStartTime - unused
          , // eventEndTime - unused
          , // bettingEndTime - unused
          , // resultTimestamp - unused
          , // arbitrationDeadline - unused
          , // maxBetPerUser - unused
          , // marketId - unused
          , // league - unused
          , // category - unused
          , // region - unused
          , // homeTeam - unused
          , // awayTeam - unused
          , // title - unused
          , // reserved - unused
        ] = poolData as [
          string, // creator
          number, // odds
          number, // flags
          number, // oracleType
          number, // marketType
          bigint, // creatorStake
          bigint, // totalCreatorSideStake
          bigint, // maxBettorStake
          bigint, // totalBettorStake
          string, // predictedOutcome
          string, // result
          bigint, // eventStartTime
          bigint, // eventEndTime
          bigint, // bettingEndTime
          bigint, // resultTimestamp
          bigint, // arbitrationDeadline
          bigint, // maxBetPerUser
          string, // marketId
          string, // league
          string, // category
          string, // region
          string, // homeTeam
          string, // awayTeam
          string, // title
          bigint  // reserved
        ];

        const isCreator = address.toLowerCase() === creator.toLowerCase();
        const hasLPStake = lpStake > 0n;
        const hasBettorStake = bettorStake > 0n;
        
        // Determine if user won based on pool status
        const poolSettled = (Number(flags) & 1) !== 0; // Bit 0: settled
        const creatorSideWon = (Number(flags) & 2) !== 0; // Bit 1: creatorSideWon
        
        let userWon = false;
        let estimatedPayout = 0n;

        if (poolSettled) {
          if (creatorSideWon && hasLPStake) {
            // LP side won
            userWon = true;
            // Calculate LP payout: stake + share of bettor stakes
            const sharePercentage = (lpStake * 10000n) / BigInt(totalCreatorSideStake);
            estimatedPayout = lpStake + ((BigInt(totalBettorStake) * sharePercentage) / 10000n);
          } else if (!creatorSideWon && hasBettorStake) {
            // Bettor side won
            userWon = true;
            // Calculate bettor payout: stake * odds (with fees deducted)
            const poolOdds = BigInt(odds);
            const grossPayout = (bettorStake * poolOdds) / 100n;
            // Simplified fee calculation (actual contract has more complex logic)
            const profit = grossPayout - bettorStake;
            const fee = (profit * 300n) / 10000n; // Assume 3% fee
            estimatedPayout = grossPayout - fee;
          }
        }

        const stakeInfo: UserStakeInfo = {
          isCreator,
          hasLPStake,
          hasBettorStake,
          lpStake,
          bettorStake,
          userWon,
          alreadyClaimed,
          estimatedPayout,
          poolData: {
            creator,
            odds: Number(odds),
            totalCreatorSideStake: BigInt(totalCreatorSideStake),
            totalBettorStake: BigInt(totalBettorStake),
            settled: poolSettled,
            creatorSideWon
          }
        };

        console.log('🔍 Real stake info:', {
          poolId,
          address,
          lpStake: lpStake.toString(),
          bettorStake: bettorStake.toString(),
          alreadyClaimed,
          userWon,
          estimatedPayout: estimatedPayout.toString(),
          poolSettled,
          creatorSideWon
        });

        setUserStakeInfo(stakeInfo);
      } catch (error) {
        console.error("Error processing stake info:", error);
        toast.error("Failed to process your stake information");
      } finally {
        setLoading(false);
      }
    }
  }, [address, poolId, lpStakeData, bettorStakeData, claimedData, poolData]);

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
      console.log('🎯 Claiming rewards for pool:', poolId, 'address:', address);
      
      await writeContract({
        address: CONTRACT_ADDRESSES.POOL_CORE,
        abi: BitredictPoolCoreABI.abi,
        functionName: "claim",
        args: [BigInt(poolId)],
      });
      
      toast.loading("Transaction submitted, waiting for confirmation...");
    } catch (error) {
      console.error("Error claiming rewards:", error);
      toast.error("Failed to claim rewards");
    }
  };

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed) {
      toast.dismiss();
      toast.success("Rewards claimed successfully!");
      // Refresh the data by setting alreadyClaimed to true
      setUserStakeInfo(prev => prev ? { ...prev, alreadyClaimed: true } : null);
    }
  }, [isConfirmed]);

  // Handle transaction error
  useEffect(() => {
    if (error) {
      toast.dismiss();
      toast.error("Transaction failed. Please try again.");
      console.error("Claim transaction error:", error);
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

          {/* Debug info for development */}
          {process.env.NODE_ENV === 'development' && userStakeInfo.poolData && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-xs">
              <div className="text-blue-400 mb-1">Debug Info</div>
              <div className="text-gray-300 space-y-1">
                <div>Settled: {userStakeInfo.poolData.settled ? 'Yes' : 'No'}</div>
                <div>Creator Side Won: {userStakeInfo.poolData.creatorSideWon ? 'Yes' : 'No'}</div>
                <div>Total Creator Side: {formatAmount(userStakeInfo.poolData.totalCreatorSideStake)} BITR</div>
                <div>Total Bettor Side: {formatAmount(userStakeInfo.poolData.totalBettorStake)} BITR</div>
                <div>Pool Odds: {userStakeInfo.poolData.odds / 100}x</div>
              </div>
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

"use client";

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS } from '@/contracts';
import { toast } from 'react-hot-toast';
import { 
  TrophyIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { 
  TrophyIcon as TrophySolid
} from '@heroicons/react/24/solid';

interface ClaimRewardsProps {
  poolId: number;
  poolStatus: 'creator_won' | 'bettor_won' | 'settled';
  userStake: number;
  potentialPayout: number;
  currency: 'BITR' | 'STT';
  className?: string;
}

export default function ClaimRewards({
  poolId,
  poolStatus,
  userStake,
  potentialPayout,
  currency,
  className = ''
}: ClaimRewardsProps) {
  const { address } = useAccount();
  const [hasClaimed, setHasClaimed] = useState(false);
  const [isCheckingClaim, setIsCheckingClaim] = useState(false);
  
  const { 
    writeContract, 
    data: hash, 
    isPending: isClaimPending,
    error: claimError 
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Check if user has already claimed
  useEffect(() => {
    const checkClaimStatus = async () => {
      if (!address) return;
      
      setIsCheckingClaim(true);
      try {
        // This would need to be implemented in the contract service
        // For now, we'll assume they haven't claimed
        setHasClaimed(false);
      } catch (error) {
        console.error('Error checking claim status:', error);
      } finally {
        setIsCheckingClaim(false);
      }
    };

    checkClaimStatus();
  }, [address, poolId]);

  const handleClaim = async () => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (hasClaimed) {
      toast.error('You have already claimed your rewards');
      return;
    }

    if (userStake === 0) {
      toast.error('You have no stake in this pool');
      return;
    }

    try {
      toast.loading('Claiming rewards...', { id: 'claim-tx' });
      
      await writeContract({
        address: CONTRACTS.POOL_CORE.address,
        abi: CONTRACTS.POOL_CORE.abi,
        functionName: 'claim',
        args: [BigInt(poolId)],
      });
    } catch (error) {
      console.error('Error claiming rewards:', error);
      toast.error('Failed to claim rewards. Please try again.', { id: 'claim-tx' });
    }
  };

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed) {
      toast.success('Rewards claimed successfully!', { id: 'claim-tx' });
      setHasClaimed(true);
    }
  }, [isConfirmed]);

  // Handle claim error
  useEffect(() => {
    if (claimError) {
      toast.error(`Claim failed: ${claimError.message}`, { id: 'claim-tx' });
    }
  }, [claimError]);

  const getStatusInfo = () => {
    switch (poolStatus) {
      case 'creator_won':
        return {
          icon: TrophySolid,
          title: 'Creator Won',
          description: 'The creator&apos;s prediction was correct',
          bgColor: 'bg-gradient-to-r from-emerald-500/20 to-green-500/20',
          borderColor: 'border-emerald-500/30',
          textColor: 'text-emerald-400'
        };
      case 'bettor_won':
        return {
          icon: TrophySolid,
          title: 'Bettors Won',
          description: 'The bettors&apos; prediction was correct',
          bgColor: 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20',
          borderColor: 'border-cyan-500/30',
          textColor: 'text-cyan-400'
        };
      default:
        return {
          icon: TrophyIcon,
          title: 'Pool Settled',
          description: 'Pool has been settled',
          bgColor: 'bg-gradient-to-r from-slate-500/20 to-gray-500/20',
          borderColor: 'border-slate-500/30',
          textColor: 'text-slate-400'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  if (hasClaimed) {
    return (
      <div className={`p-6 rounded-xl border ${statusInfo.bgColor} ${statusInfo.borderColor} ${className}`}>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-green-500/20">
            <CheckCircleIcon className="h-8 w-8 text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white">Rewards Claimed</h3>
            <p className="text-sm text-gray-400">You have successfully claimed your rewards</p>
          </div>
        </div>
      </div>
    );
  }

  if (userStake === 0) {
    return (
      <div className={`p-6 rounded-xl border ${statusInfo.bgColor} ${statusInfo.borderColor} ${className}`}>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-gray-500/20">
            <ExclamationTriangleIcon className="h-8 w-8 text-gray-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white">No Rewards to Claim</h3>
            <p className="text-sm text-gray-400">You did not participate in this pool</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-xl border ${statusInfo.bgColor} ${statusInfo.borderColor} ${className}`}>
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 rounded-full bg-white/10">
          <StatusIcon className={`h-8 w-8 ${statusInfo.textColor}`} />
        </div>
        <div className="flex-1">
          <h3 className={`text-lg font-bold ${statusInfo.textColor}`}>
            {statusInfo.title}
          </h3>
          <p className="text-sm text-gray-400">{statusInfo.description}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-400">Your Stake</span>
            </div>
            <div className="text-lg font-bold text-white">
              {userStake.toLocaleString()} {currency}
            </div>
          </div>
          
          <div className="bg-black/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrophyIcon className="h-5 w-5 text-yellow-400" />
              <span className="text-sm text-gray-400">Potential Payout</span>
            </div>
            <div className="text-lg font-bold text-yellow-400">
              {potentialPayout.toLocaleString()} {currency}
            </div>
          </div>
        </div>

        <button
          onClick={handleClaim}
          disabled={isClaimPending || isConfirming || isCheckingClaim}
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isClaimPending || isConfirming ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {isClaimPending ? 'Confirming...' : 'Processing...'}
            </>
          ) : (
            <>
              <TrophySolid className="h-5 w-5" />
              Claim Rewards
            </>
          )}
        </button>

        {potentialPayout > userStake && (
          <div className="text-center">
            <p className="text-sm text-green-400">
              🎉 You&apos;ll receive {((potentialPayout - userStake) / userStake * 100).toFixed(1)}% profit!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

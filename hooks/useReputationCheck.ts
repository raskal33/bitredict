import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/wagmi';
import ReputationSystemABI from '@/contracts/abis/ReputationSystem.json';

/**
 * Hook to check user's reputation permissions before creating pools
 */
export function useReputationCheck(address?: `0x${string}`) {
  // Check if reputation system exists by reading from PoolCore
  const { data: reputationData, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.REPUTATION_SYSTEM,
    abi: ReputationSystemABI.abi,
    functionName: 'getReputationBundle',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    }
  });

  const parseReputationData = () => {
    if (!reputationData || !Array.isArray(reputationData)) {
      return {
        score: 0,
        canCreateGuided: false,
        canCreateOpen: false,
        isVerified: false,
      };
    }

    // getReputationBundle returns (uint256 score, bool canCreateGuided, bool canCreateOpen, bool isVerified)
    const [score, canCreateGuided, canCreateOpen, isVerified] = reputationData;

    return {
      score: Number(score || 0),
      canCreateGuided: Boolean(canCreateGuided),
      canCreateOpen: Boolean(canCreateOpen),
      isVerified: Boolean(isVerified),
    };
  };

  const reputation = parseReputationData();

  return {
    ...reputation,
    isLoading,
    refetch,
  };
}


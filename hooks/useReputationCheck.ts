import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/wagmi';
import ReputationSystemArtifact from '@/contracts/abis/ReputationSystem.json';

// Extract ABI array from artifact
const ReputationSystemABI = ReputationSystemArtifact.abi;

/**
 * Hook to check user's reputation permissions before creating pools
 */
export function useReputationCheck(address?: `0x${string}`) {
  // Check if reputation system exists by reading from PoolCore
  const { data: reputationData, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.REPUTATION_SYSTEM,
    abi: ReputationSystemABI,
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
        canPropose: false,  // ← FIXED: Was "isVerified", but contract returns "canPropose"
      };
    }

    // ✅ FIXED: getReputationBundle returns (uint256 score, bool canCreateGuided, bool canCreateOpen, bool canPropose)
    // NOT (score, canCreateGuided, canCreateOpen, isVerified) as previously assumed
    const [score, canCreateGuided, canCreateOpen, canPropose] = reputationData;

    return {
      score: Number(score || 0),
      canCreateGuided: Boolean(canCreateGuided),
      canCreateOpen: Boolean(canCreateOpen),
      canPropose: Boolean(canPropose),  // ← FIXED: This is "can propose outcomes", not "is verified"
    };
  };

  const reputation = parseReputationData();

  return {
    ...reputation,
    isLoading,
    refetch,
  };
}


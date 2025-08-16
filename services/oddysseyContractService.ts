import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContract } from 'wagmi';
import { parseEther, formatEther, keccak256, toBytes } from 'viem';
import { CONTRACTS } from '@/contracts';
import { GAS_SETTINGS } from '@/config/wagmi';
import { apiRequest } from '@/config/api';

// Use the actual Oddyssey ABI from the contract
const ODDYSSEY_ABI = CONTRACTS.ODDYSSEY.abi;

export interface UserPrediction {
  matchId: bigint;
  betType: 0 | 1; // 0 = MONEYLINE, 1 = OVER_UNDER
  selection: `0x${string}`; // keccak256 hash of selection
  selectedOdd: number;
}

export class OddysseyContractService {
  private contractAddress = CONTRACTS.ODDYSSEY?.address;

  /**
   * Convert frontend prediction to contract format
   */
  static formatPredictionForContract(prediction: {
    matchId: number;
    prediction: string;
    odds: number;
  }): UserPrediction {
    let betType: 0 | 1;
    let selection: `0x${string}`;

    // Determine bet type and selection
    if (['1', 'X', '2'].includes(prediction.prediction)) {
      betType = 0; // MONEYLINE
      selection = this.hashSelection(prediction.prediction);
    } else {
      betType = 1; // OVER_UNDER
      selection = this.hashSelection(prediction.prediction);
    }

    return {
      matchId: BigInt(prediction.matchId),
      betType,
      selection,
      selectedOdd: Math.round(prediction.odds * 1000) // Contract uses 1000 scaling factor
    };
  }

  /**
   * Hash the selection string for contract compatibility using keccak256
   */
  private static hashSelection(selection: string): `0x${string}` {
    // Use proper keccak256 hashing as expected by the contract
    return keccak256(toBytes(selection));
  }

  /**
   * Get entry fee from contract
   */
  static async getEntryFee(): Promise<string> {
    // For now, return fixed entry fee
    return "0.5";
  }

  /**
   * Get current cycle ID
   */
  static async getCurrentCycleId(): Promise<number> {
    // This would need to be implemented with proper contract reading
    return 1;
  }

  /**
   * Get Oddyssey reputation for a user
   */
  static async getOddysseyReputation(userAddress: string): Promise<{
    totalReputation: bigint;
    totalCorrectPredictions: bigint;
  }> {
    // This would need to be implemented with proper contract reading
    return {
      totalReputation: BigInt(0),
      totalCorrectPredictions: BigInt(0)
    };
  }

  /**
   * Get user stats
   */
  static async getUserStats(userAddress: string): Promise<{
    totalSlips: bigint;
    totalWins: bigint;
    bestScore: bigint;
    averageScore: bigint;
    winRate: bigint;
    currentStreak: bigint;
    bestStreak: bigint;
    lastActiveCycle: bigint;
  }> {
    // This would need to be implemented with proper contract reading
    return {
      totalSlips: BigInt(0),
      totalWins: BigInt(0),
      bestScore: BigInt(0),
      averageScore: BigInt(0),
      winRate: BigInt(0),
      currentStreak: BigInt(0),
      bestStreak: BigInt(0),
      lastActiveCycle: BigInt(0)
    };
  }

  /**
   * Evaluate a slip
   */
  static async evaluateSlip(slipId: bigint): Promise<void> {
    // This would need to be implemented with proper contract interaction
    console.log(`Evaluating slip ${slipId}`);
  }

  /**
   * Place slip on contract
   */
  static async placeSlip(predictions: UserPrediction[], entryFee: string) {
    // This would need to be implemented with proper contract writing
    // For now, return a mock transaction hash
    return {
      hash: `0x${Math.random().toString(16).substr(2, 64)}`,
      success: true
    };
  }
}

// React hook for contract interactions
export function useOddysseyContract() {
  const { address, isConnected } = useAccount();
  
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Read entry fee from contract
  const { data: contractEntryFee } = useReadContract({
    address: CONTRACTS.ODDYSSEY?.address as `0x${string}`,
    abi: ODDYSSEY_ABI,
    functionName: 'entryFee',
  });

  // Read current cycle ID
  const { data: currentCycleId } = useReadContract({
    address: CONTRACTS.ODDYSSEY?.address as `0x${string}`,
    abi: ODDYSSEY_ABI,
    functionName: 'dailyCycleId',
  });

  // Read current matches from contract (for validation only)
  const { data: currentMatches } = useReadContract({
    address: CONTRACTS.ODDYSSEY?.address as `0x${string}`,
    abi: ODDYSSEY_ABI,
    functionName: 'dailyMatches',
    args: currentCycleId ? [currentCycleId] : undefined,
    query: { enabled: !!currentCycleId }
  });

  const placeSlip = async (predictions: any[], entryFee: string) => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }

    if (!CONTRACTS.ODDYSSEY?.address) {
      throw new Error('Oddyssey contract address not configured');
    }

    // Validate that we have current matches from contract (optional validation)
    if (!currentMatches || !Array.isArray(currentMatches) || currentMatches.length !== 10) {
      console.warn('⚠️ Contract matches not available, proceeding with backend data validation');
    }

    // Validate matches using backend API as fallback
    try {
      const response = await apiRequest<{
        success: boolean;
        data: {
          today: {
            matches: any[];
          };
        };
      }>('/api/oddyssey/matches');

      if (!response.success || !response.data?.today?.matches || response.data.today.matches.length !== 10) {
        throw new Error('No active matches found. Please wait for the next cycle.');
      }

      console.log('✅ Backend validation successful - matches available');
    } catch (error) {
      console.error('❌ Backend validation failed:', error);
      throw new Error('No active matches found. Please wait for the next cycle.');
    }

    // Convert predictions to contract format
    const contractPredictions = predictions.map((pred, index) => {
      // Optional validation against contract data if available
      if (currentMatches && Array.isArray(currentMatches) && currentMatches[index]) {
        const contractMatch = currentMatches[index];
        if (contractMatch && typeof contractMatch === 'object' && 'id' in contractMatch) {
          if (contractMatch.id !== BigInt(pred.id)) {
            console.warn(`⚠️ Match ID mismatch for index ${index}: contract=${contractMatch.id}, prediction=${pred.id}`);
          }
        }
      }
      
      return OddysseyContractService.formatPredictionForContract(pred);
    });

    // Ensure we have exactly 10 predictions
    if (contractPredictions.length !== 10) {
      throw new Error('Exactly 10 predictions are required');
    }

    // Use contract entry fee if available, otherwise use provided fee
    const actualEntryFee = contractEntryFee ? formatEther(contractEntryFee as bigint) : entryFee;
    
    try {
      console.log('Placing slip with predictions:', contractPredictions);
      console.log('Entry fee from contract:', actualEntryFee);
      console.log('Gas settings:', { gas: GAS_SETTINGS.gas.toString(), gasPrice: GAS_SETTINGS.gasPrice.toString() });
      
      await writeContract({
        address: CONTRACTS.ODDYSSEY.address as `0x${string}`,
        abi: ODDYSSEY_ABI,
        functionName: 'placeSlip',
        args: [contractPredictions],
        value: parseEther(actualEntryFee),
        gas: GAS_SETTINGS.gas,
        gasPrice: GAS_SETTINGS.gasPrice
      });
    } catch (error) {
      console.error('Error placing slip:', error);
      throw error;
    }
  };

  const evaluateSlip = async (slipId: bigint) => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }

    if (!CONTRACTS.ODDYSSEY?.address) {
      throw new Error('Oddyssey contract address not configured');
    }

    try {
      await writeContract({
        address: CONTRACTS.ODDYSSEY.address as `0x${string}`,
        abi: ODDYSSEY_ABI,
        functionName: 'evaluateSlip',
        args: [slipId]
      });
    } catch (error) {
      console.error('Error evaluating slip:', error);
      throw error;
    }
  };

  return {
    placeSlip,
    evaluateSlip,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
    contractEntryFee,
    currentCycleId,
    currentMatches
  };
} 
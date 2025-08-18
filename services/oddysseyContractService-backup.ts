import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContract } from 'wagmi';
import { parseEther, formatEther, keccak256, stringToHex } from 'viem';
import { CONTRACTS } from '@/contracts';
import { GAS_SETTINGS } from '@/config/wagmi';

// Use the actual Oddyssey ABI from the contract
const ODDYSSEY_ABI = CONTRACTS.ODDYSSEY.abi;

// Enums from contract (matching backend script)
const BetType = {
  MONEYLINE: 0,
  OVER_UNDER: 1
} as const;

const CycleState = {
  NotStarted: 0,
  Active: 1,
  Ended: 2,
  Resolved: 3
} as const;

// Selection constants (matching contract exactly - same as backend script)
const SELECTIONS = {
  MONEYLINE: {
    HOME_WIN: keccak256(stringToHex('1')),
    DRAW: keccak256(stringToHex('X')),
    AWAY_WIN: keccak256(stringToHex('2'))
  },
  OVER_UNDER: {
    OVER: keccak256(stringToHex('Over')),
    UNDER: keccak256(stringToHex('Under'))
  }
};

export interface UserPrediction {
  matchId: bigint;
  betType: 0 | 1; // 0 = MONEYLINE, 1 = OVER_UNDER
  selection: `0x${string}`; // keccak256 hash of selection
  selectedOdd: number;
}

export class OddysseyContractService {
  private contractAddress = CONTRACTS.ODDYSSEY?.address;

  /**
   * Convert frontend prediction to contract format with proper validation
   * This matches the exact logic from the working backend script
   */
  static formatPredictionForContract(prediction: {
    matchId: number;
    prediction: string;
    odds: number;
  }): UserPrediction {
    let betType: 0 | 1;
    let selection: `0x${string}`;

    // Determine bet type and selection with proper validation (matching backend script)
    if (['1', 'X', '2'].includes(prediction.prediction)) {
      betType = BetType.MONEYLINE;
      switch (prediction.prediction) {
        case '1':
          selection = SELECTIONS.MONEYLINE.HOME_WIN;
          break;
        case 'X':
          selection = SELECTIONS.MONEYLINE.DRAW;
          break;
        case '2':
          selection = SELECTIONS.MONEYLINE.AWAY_WIN;
          break;
        default:
          throw new Error(`Invalid moneyline prediction: ${prediction.prediction}`);
      }
    } else if (['Over', 'Under'].includes(prediction.prediction)) {
      betType = BetType.OVER_UNDER;
      switch (prediction.prediction) {
        case 'Over':
          selection = SELECTIONS.OVER_UNDER.OVER;
          break;
        case 'Under':
          selection = SELECTIONS.OVER_UNDER.UNDER;
          break;
        default:
          throw new Error(`Invalid over/under prediction: ${prediction.prediction}`);
      }
    } else {
      throw new Error(`Invalid prediction type: ${prediction.prediction}`);
    }

    // Validate odds (matching backend script validation)
    if (!prediction.odds || prediction.odds <= 0) {
      throw new Error(`Invalid odds: ${prediction.odds}`);
    }

    return {
      matchId: BigInt(prediction.matchId),
      betType,
      selection,
      selectedOdd: Math.round(prediction.odds * 1000) // Contract uses 1000 scaling factor (matching backend)
    };
  }

  /**
   * Validate predictions against contract data
   * This matches the validation logic from the working backend script
   */
  static validatePredictions(predictions: any[], contractMatches: any[]): {
    isValid: boolean;
    errors: string[];
    orderedPredictions: any[];
  } {
    const errors: string[] = [];
    
    // Check if we have exactly 10 predictions (matching backend validation)
    if (!predictions || predictions.length !== 10) {
      errors.push(`Exactly 10 predictions required. You have ${predictions?.length || 0} predictions.`);
      return { isValid: false, errors, orderedPredictions: [] };
    }

    // Check if we have exactly 10 contract matches (matching backend validation)
    if (!contractMatches || contractMatches.length !== 10) {
      errors.push(`Contract validation failed: expected 10 matches, got ${contractMatches?.length || 0}`);
      return { isValid: false, errors, orderedPredictions: [] };
    }

    // Create ordered predictions matching contract order (matching backend logic)
    const orderedPredictions: any[] = [];
    const usedMatchIds = new Set<number>();

    for (let i = 0; i < contractMatches.length; i++) {
      const contractMatch = contractMatches[i];
      const userPrediction = predictions.find(pred => 
        pred.matchId.toString() === contractMatch.id.toString()
      );

      if (!userPrediction) {
        errors.push(`Missing prediction for match ${contractMatch.id} at position ${i + 1}`);
        continue;
      }

      if (usedMatchIds.has(userPrediction.matchId)) {
        errors.push(`Duplicate prediction for match ${userPrediction.matchId}`);
        continue;
      }

      usedMatchIds.add(userPrediction.matchId);
      orderedPredictions.push(userPrediction);
    }

    // Check for unused predictions (matching backend validation)
    const unusedPredictions = predictions.filter(pred => !usedMatchIds.has(pred.matchId));
    if (unusedPredictions.length > 0) {
      errors.push(`Unused predictions found for matches: ${unusedPredictions.map(p => p.matchId).join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      orderedPredictions
    };
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
    functionName: 'getDailyMatches',
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

    // CRITICAL: Ensure exactly 10 predictions before any processing (matching backend validation)
    if (!predictions || predictions.length !== 10) {
      throw new Error(`Exactly 10 predictions are required. You have ${predictions?.length || 0} predictions.`);
    }

    // Get contract validation data from contract directly (matching backend approach)
    let contractMatchesData;
    try {
      // Use contract data directly instead of backend API (matching backend script)
      if (!currentMatches || !Array.isArray(currentMatches) || currentMatches.length !== 10) {
        throw new Error('No active matches found in contract. Please wait for the next cycle.');
      }

      contractMatchesData = currentMatches;
      console.log('✅ Contract validation successful - 10 matches available');
    } catch (error) {
      console.error('❌ Contract validation failed:', error);
      throw new Error('No active matches found in contract. Please wait for the next cycle.');
    }

    // Validate and order predictions (matching backend validation logic)
    const validation = OddysseyContractService.validatePredictions(predictions, contractMatchesData);
    
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Convert predictions to contract format in the correct order (matching backend format)
    const contractPredictions = validation.orderedPredictions.map((pred, index) => {
      try {
        return OddysseyContractService.formatPredictionForContract(pred);
      } catch (error) {
        throw new Error(`Error formatting prediction ${index + 1}: ${(error as Error).message}`);
      }
    });

    // FINAL CRITICAL CHECK: Ensure we have exactly 10 predictions (matching backend validation)
    if (contractPredictions.length !== 10) {
      throw new Error(`Final validation failed: exactly 10 predictions required, got ${contractPredictions.length}`);
    }

    // Use contract entry fee if available, otherwise use provided fee (matching backend logic)
    const actualEntryFee = contractEntryFee ? formatEther(contractEntryFee as bigint) : entryFee;
    
    try {
      console.log('🎯 Placing slip with predictions:', contractPredictions);
      console.log('💰 Entry fee from contract:', actualEntryFee);
      console.log('⛽ Gas settings:', { gas: GAS_SETTINGS.gas.toString(), gasPrice: GAS_SETTINGS.gasPrice.toString() });
      
      // Call contract directly (matching backend script approach)
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
      console.error('❌ Error placing slip:', error);
      
      // Provide more specific error messages (matching backend error handling)
      const errorMessage = (error as Error).message || 'Unknown error';
      
      if (errorMessage.includes('insufficient funds')) {
        throw new Error('Insufficient funds in wallet. Please check your STT balance.');
      } else if (errorMessage.includes('user rejected')) {
        throw new Error('Transaction was cancelled by user.');
      } else if (errorMessage.includes('gas')) {
        throw new Error('Gas estimation failed. Please try again.');
      } else if (errorMessage.includes('execution reverted')) {
        throw new Error('Transaction failed. Please check your predictions and try again.');
      } else {
        throw new Error(`Transaction failed: ${errorMessage}`);
      }
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
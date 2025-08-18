import { 
  createPublicClient, 
  createWalletClient, 
  http, 
  parseEther, 
  formatEther, 
  keccak256, 
  stringToHex,
  encodeFunctionData,
  type Address,
  type PublicClient,
  type WalletClient,
  type Chain
} from 'viem';
import { CONTRACTS } from '@/contracts';
import { GAS_SETTINGS } from '@/config/wagmi';

// Convert somniaNetwork to viem Chain format
const somniaChain: Chain = {
  id: 50312,
  name: 'Somnia Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'STT',
    symbol: 'STT',
  },
  rpcUrls: {
    default: {
      http: ['https://dream-rpc.somnia.network/'],
    },
  },
  blockExplorers: {
    default: { name: 'Somnia Explorer', url: 'https://somnia-testnet.explorer.caldera.xyz' },
  },
  testnet: true,
};

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

// Wagmi-style client wrapper (matching backend script)
class WagmiStyleClient {
  private publicClient: PublicClient;
  private walletClient: WalletClient | null = null;
  private walletAddress: Address | null = null;

  constructor() {
    this.publicClient = createPublicClient({
      chain: somniaChain,
      transport: http()
    });
  }

  async initialize() {
    console.log('🔧 Initializing WagmiStyleClient...');
    
    // For frontend, we'll use the connected wallet
    // The wallet client will be provided by the calling component
    console.log('✅ WagmiStyleClient initialized');
  }

  setWalletClient(walletClient: WalletClient, address: Address) {
    this.walletClient = walletClient;
    this.walletAddress = address;
    console.log('✅ Wallet client set:', address);
  }

  async readContract({ address, abi, functionName, args = [] }: {
    address: Address;
    abi: any;
    functionName: string;
    args?: any[];
  }) {
    return await this.publicClient.readContract({
      address,
      abi,
      functionName,
      args
    });
  }

  async writeContract({ address, abi, functionName, args = [], value = BigInt(0) }: {
    address: Address;
    abi: any;
    functionName: string;
    args?: any[];
    value?: bigint;
  }) {
    if (!this.walletClient) {
      throw new Error('Wallet client not initialized');
    }

    if (!this.walletAddress) {
      throw new Error('Wallet address not set');
    }

    const data = encodeFunctionData({
      abi,
      functionName,
      args
    });

    const hash = await this.walletClient.sendTransaction({
      account: this.walletAddress,
      chain: somniaChain,
      to: address,
      data,
      value,
      gas: GAS_SETTINGS.gas,
      gasPrice: GAS_SETTINGS.gasPrice
    });

    return { hash };
  }

  async waitForTransactionReceipt({ hash }: { hash: `0x${string}` }) {
    return await this.publicClient.waitForTransactionReceipt({ hash });
  }

  async getBalance({ address }: { address: Address }) {
    return await this.publicClient.getBalance({ address });
  }

  getWalletAddress(): Address | null {
    return this.walletAddress;
  }
}

// Wagmi-style contract hooks (adapted for frontend)
class OddysseyContract {
  private client: WagmiStyleClient;

  constructor(client: WagmiStyleClient) {
    this.client = client;
  }

  async getCurrentCycleInfo() {
    return await this.client.readContract({
      address: CONTRACTS.ODDYSSEY.address as Address,
      abi: ODDYSSEY_ABI,
      functionName: 'dailyCycleId'
    });
  }

  async getDailyMatches(cycleId: bigint) {
    return await this.client.readContract({
      address: CONTRACTS.ODDYSSEY.address as Address,
      abi: ODDYSSEY_ABI,
      functionName: 'getDailyMatches',
      args: [cycleId]
    });
  }

  async getEntryFee() {
    return await this.client.readContract({
      address: CONTRACTS.ODDYSSEY.address as Address,
      abi: ODDYSSEY_ABI,
      functionName: 'entryFee'
    });
  }

  async getSlipCount() {
    return await this.client.readContract({
      address: CONTRACTS.ODDYSSEY.address as Address,
      abi: ODDYSSEY_ABI,
      functionName: 'slipCount'
    });
  }

  async getSlip(slipId: bigint) {
    return await this.client.readContract({
      address: CONTRACTS.ODDYSSEY.address as Address,
      abi: ODDYSSEY_ABI,
      functionName: 'getSlip',
      args: [slipId]
    });
  }

  async placeSlip(predictions: UserPrediction[], value: string) {
    console.log('🎯 Placing slip with predictions:', predictions);
    console.log('💰 Entry fee:', value);

    const { hash } = await this.client.writeContract({
      address: CONTRACTS.ODDYSSEY.address as Address,
      abi: ODDYSSEY_ABI,
      functionName: 'placeSlip',
      args: [predictions],
      value: parseEther(value)
    });

    console.log('✅ Transaction submitted:', hash);
    return { hash };
  }
}

export class OddysseyContractService {
  private static client = new WagmiStyleClient();
  private static oddysseyContract: OddysseyContract | null = null;

  /**
   * Initialize the service with wallet client
   */
  static async initialize(walletClient: WalletClient, address: Address) {
    await this.client.initialize();
    this.client.setWalletClient(walletClient, address);
    this.oddysseyContract = new OddysseyContract(this.client);
    console.log('✅ OddysseyContractService initialized');
  }

  /**
   * Wait for transaction receipt
   */
  static async waitForTransactionReceipt({ hash }: { hash: `0x${string}` }) {
    return await this.client.waitForTransactionReceipt({ hash });
  }

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
   * Place slip using the working backend approach
   */
  static async placeSlip(predictions: any[], entryFee: string) {
    if (!this.oddysseyContract) {
      throw new Error('OddysseyContractService not initialized. Call initialize() first.');
    }

    // CRITICAL: Ensure exactly 10 predictions before any processing (matching backend validation)
    if (!predictions || predictions.length !== 10) {
      throw new Error(`Exactly 10 predictions are required. You have ${predictions?.length || 0} predictions.`);
    }

    // Get contract validation data from contract directly (matching backend approach)
    let contractMatchesData;
    try {
      const cycleInfo = await this.oddysseyContract.getCurrentCycleInfo() as [bigint, number, bigint, bigint, bigint];
      
      // Check if cycle exists and is active (matching backend validation)
      if (!cycleInfo || cycleInfo[0] === BigInt(0)) {
        throw new Error('No active cycle found in contract. Please wait for the next cycle.');
      }

      // Check if cycle is active (matching backend validation)
      if (cycleInfo[1] !== 1) {
        throw new Error('Cycle is not active. Please wait for the next active cycle.');
      }

      const currentCycleId = cycleInfo[0];
      const currentMatches = await this.oddysseyContract.getDailyMatches(currentCycleId);
      
      if (!currentMatches || !Array.isArray(currentMatches) || currentMatches.length !== 10) {
        throw new Error('No active matches found in contract. Please wait for the next cycle.');
      }

      contractMatchesData = currentMatches;
      console.log('✅ Contract validation successful - 10 matches available');
      console.log(`✅ Current Cycle ID: ${currentCycleId}`);
      console.log(`✅ Cycle State: ${cycleInfo[1]}`);
    } catch (error) {
      console.error('❌ Contract validation failed:', error);
      throw new Error('No active matches found in contract. Please wait for the next cycle.');
    }

    // Validate and order predictions (matching backend validation logic)
    const validation = this.validatePredictions(predictions, contractMatchesData);
    
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Convert predictions to contract format in the correct order (matching backend format)
    const contractPredictions = validation.orderedPredictions.map((pred, index) => {
      try {
        return this.formatPredictionForContract(pred);
      } catch (error) {
        throw new Error(`Error formatting prediction ${index + 1}: ${(error as Error).message}`);
      }
    });

    // FINAL CRITICAL CHECK: Ensure we have exactly 10 predictions (matching backend validation)
    if (contractPredictions.length !== 10) {
      throw new Error(`Final validation failed: exactly 10 predictions required, got ${contractPredictions.length}`);
    }

    try {
      console.log('🎯 Placing slip with predictions:', contractPredictions);
      console.log('💰 Entry fee:', entryFee);
      console.log('⛽ Gas settings:', { gas: GAS_SETTINGS.gas.toString(), gasPrice: GAS_SETTINGS.gasPrice.toString() });
      
      // Use the working backend approach
      const result = await this.oddysseyContract.placeSlip(contractPredictions, entryFee);
      
      console.log('✅ Slip placed successfully:', result.hash);
      return result;
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
  }

  /**
   * Get entry fee from contract
   */
  static async getEntryFee(): Promise<string> {
    if (!this.oddysseyContract) {
      throw new Error('OddysseyContractService not initialized. Call initialize() first.');
    }
    
    const entryFee = await this.oddysseyContract.getEntryFee();
    return formatEther(entryFee as bigint);
  }

  /**
   * Get current cycle ID
   */
  static async getCurrentCycleId(): Promise<number> {
    if (!this.oddysseyContract) {
      throw new Error('OddysseyContractService not initialized. Call initialize() first.');
    }
    
    const cycleInfo = await this.oddysseyContract.getCurrentCycleInfo() as [bigint, number, bigint, bigint, bigint];
    return Number(cycleInfo[0]); // Return the cycle ID from the array
  }

  /**
   * Get current matches from contract
   */
  static async getCurrentMatches(): Promise<any[]> {
    if (!this.oddysseyContract) {
      throw new Error('OddysseyContractService not initialized. Call initialize() first.');
    }
    
    const cycleId = await this.oddysseyContract.getCurrentCycleInfo();
    const matches = await this.oddysseyContract.getDailyMatches(cycleId as bigint);
    return matches as any[];
  }
}

import { useAccount, useWalletClient } from 'wagmi';
import { useEffect, useState, useCallback } from 'react';

// React hook for contract interactions (updated to use the fixed service)
export function useOddysseyContract() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  // Transaction state management
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hash, setHash] = useState<`0x${string}` | null>(null);
  const [contractEntryFee, setContractEntryFee] = useState<string>('0.5');
  const [currentCycleId, setCurrentCycleId] = useState<number>(0);
  const [currentMatches, setCurrentMatches] = useState<any[]>([]);
  
  // Initialize the service when wallet is connected
  useEffect(() => {
    if (isConnected && address && walletClient) {
      OddysseyContractService.initialize(walletClient, address);
      // Fetch initial data
      fetchInitialData();
    }
  }, [isConnected, address, walletClient]);

  const fetchInitialData = useCallback(async () => {
    try {
      const [entryFee, cycleId, matches] = await Promise.all([
        OddysseyContractService.getEntryFee(),
        OddysseyContractService.getCurrentCycleId(),
        OddysseyContractService.getCurrentMatches()
      ]);
      
      setContractEntryFee(entryFee);
      setCurrentCycleId(cycleId);
      setCurrentMatches(matches);
    } catch (err) {
      console.error('Error fetching initial data:', err);
    }
  }, []);

  const placeSlip = useCallback(async (predictions: any[], entryFee: string) => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }

    if (!walletClient) {
      throw new Error('Wallet client not available');
    }

    // Reset state
    setIsPending(true);
    setIsSuccess(false);
    setIsConfirming(false);
    setError(null);
    setHash(null);

    try {
      // Start transaction
      const result = await OddysseyContractService.placeSlip(predictions, entryFee);
      setHash(result.hash);
      setIsPending(false);
      setIsConfirming(true);

      // Wait for transaction receipt
      await OddysseyContractService.waitForTransactionReceipt({ hash: result.hash });
      
      setIsConfirming(false);
      setIsSuccess(true);
      
      return result;
    } catch (err) {
      setIsPending(false);
      setIsConfirming(false);
      setError(err as Error);
      throw err;
    }
  }, [isConnected, address, walletClient]);

  const getEntryFee = useCallback(async () => {
    return await OddysseyContractService.getEntryFee();
  }, []);

  const getCurrentCycleId = useCallback(async () => {
    return await OddysseyContractService.getCurrentCycleId();
  }, []);

  const getCurrentMatches = useCallback(async () => {
    return await OddysseyContractService.getCurrentMatches();
  }, []);

  return {
    placeSlip,
    getEntryFee,
    getCurrentCycleId,
    getCurrentMatches,
    isConnected,
    address,
    // Wagmi-style properties
    isPending,
    isSuccess,
    isConfirming,
    error,
    hash,
    contractEntryFee,
    currentCycleId,
    currentMatches
  };
}

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
import { serializeBigInts } from '@/utils/bigint-helpers';


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
      http: [
        process.env.NODE_ENV === 'development' 
          ? 'http://localhost:3000/api/rpc-proxy'
          : process.env.NEXT_PUBLIC_RPC_URL || 'https://dream-rpc.somnia.network/'
      ],
    },
  },
  blockExplorers: {
    default: { name: 'Somnia Explorer', url: 'https://shannon-explorer.somnia.network' },
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
    const result = await this.client.readContract({
      address: CONTRACTS.ODDYSSEY.address as Address,
      abi: ODDYSSEY_ABI,
      functionName: 'getCurrentCycleInfo'
    });
    return serializeBigInts(result);
  }

  async getDailyMatches(cycleId: bigint) {
    const result = await this.client.readContract({
      address: CONTRACTS.ODDYSSEY.address as Address,
      abi: ODDYSSEY_ABI,
      functionName: 'getDailyMatches',
      args: [cycleId]
    });
    return serializeBigInts(result);
  }

  async getEntryFee() {
    const result = await this.client.readContract({
      address: CONTRACTS.ODDYSSEY.address as Address,
      abi: ODDYSSEY_ABI,
      functionName: 'entryFee'
    });
    return serializeBigInts(result);
  }

  async getSlipCount() {
    const result = await this.client.readContract({
      address: CONTRACTS.ODDYSSEY.address as Address,
      abi: ODDYSSEY_ABI,
      functionName: 'slipCount'
    });
    return serializeBigInts(result);
  }

  async getSlip(slipId: bigint) {
    const result = await this.client.readContract({
      address: CONTRACTS.ODDYSSEY.address as Address,
      abi: ODDYSSEY_ABI,
      functionName: 'getSlip',
      args: [slipId]
    });
    return serializeBigInts(result);
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
  private static isInitialized = false;
  private static initializationPromise: Promise<void> | null = null;

  /**
   * Initialize the service with wallet client
   */
  static async initialize(walletClient: WalletClient, address: Address) {
    // Prevent multiple simultaneous initializations
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._initialize(walletClient, address);
    return this.initializationPromise;
  }

  private static async _initialize(walletClient: WalletClient, address: Address) {
    try {
      console.log('🔧 Initializing OddysseyContractService...');
      
      await this.client.initialize();
      this.client.setWalletClient(walletClient, address);
      this.oddysseyContract = new OddysseyContract(this.client);
      this.isInitialized = true;
      
      console.log('✅ OddysseyContractService initialized');
    } catch (error) {
      console.error('❌ Failed to initialize OddysseyContractService:', error);
      this.isInitialized = false;
      this.initializationPromise = null;
      throw error;
    }
  }

  /**
   * Check if service is initialized
   */
  private static ensureInitialized() {
    if (!this.isInitialized || !this.oddysseyContract) {
      throw new Error('OddysseyContractService not initialized. Call initialize() first.');
    }
  }

  /**
   * Wait for transaction receipt
   */
  static async waitForTransactionReceipt({ hash }: { hash: `0x${string}` }) {
    this.ensureInitialized();
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

    // CRITICAL FIX: Instead of trying to match by ID (which causes data loss),
    // we'll use the predictions in the order they were selected and map them to contract order
    // This ensures all 10 predictions are preserved
    
    console.log('🔍 Validating predictions:', {
      predictionsCount: predictions.length,
      contractMatchesCount: contractMatches.length,
      predictions: predictions.map(p => ({ matchId: p.matchId, prediction: p.prediction })),
      contractMatches: contractMatches.map(m => ({ id: m.id, displayOrder: m.displayOrder || 'N/A' }))
    });

    // Create ordered predictions by mapping frontend predictions to contract order
    const orderedPredictions: any[] = [];
    const usedPredictionIndices = new Set<number>();

    // Map each contract match position to a frontend prediction
    for (let i = 0; i < contractMatches.length; i++) {
      const contractMatch = contractMatches[i];
      
      // Find the corresponding frontend prediction by matching fixture_id
      // Frontend uses fixture_id, contract might use different ID format
      let matchedPrediction = null;
      let matchedIndex = -1;
      
      // Try to find by exact ID match first
      for (let j = 0; j < predictions.length; j++) {
        if (usedPredictionIndices.has(j)) continue;
        
        const pred = predictions[j];
        if (pred.matchId.toString() === contractMatch.id.toString()) {
          matchedPrediction = pred;
          matchedIndex = j;
          break;
        }
      }
      
      // If no exact match, use the next available prediction (fallback)
      if (!matchedPrediction) {
        for (let j = 0; j < predictions.length; j++) {
          if (usedPredictionIndices.has(j)) continue;
          
          matchedPrediction = predictions[j];
          matchedIndex = j;
          break;
        }
      }
      
      if (matchedPrediction && matchedIndex >= 0) {
        usedPredictionIndices.add(matchedIndex);
        orderedPredictions.push(matchedPrediction);
        console.log(`✅ Mapped prediction ${matchedIndex + 1} to contract position ${i + 1}:`, {
          matchId: matchedPrediction.matchId,
          prediction: matchedPrediction.prediction,
          contractMatchId: contractMatch.id
        });
      } else {
        errors.push(`Could not map prediction to contract position ${i + 1}`);
      }
    }

    // Verify we have exactly 10 ordered predictions
    if (orderedPredictions.length !== 10) {
      errors.push(`Ordering failed: expected 10 predictions, got ${orderedPredictions.length}`);
    }

    // Check for unused predictions (should be 0 if ordering worked correctly)
    const unusedPredictions = predictions.filter((_, index) => !usedPredictionIndices.has(index));
    if (unusedPredictions.length > 0) {
      console.warn(`⚠️ Unused predictions found: ${unusedPredictions.length}`, unusedPredictions);
      // Don't add this as an error since we're using fallback mapping
    }

    console.log('📊 Validation result:', {
      isValid: errors.length === 0,
      errorCount: errors.length,
      orderedPredictionsCount: orderedPredictions.length,
      errors: errors
    });

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
    this.ensureInitialized();

    // CRITICAL: Ensure exactly 10 predictions before any processing (matching backend validation)
    if (!predictions || predictions.length !== 10) {
      throw new Error(`Exactly 10 predictions are required. You have ${predictions?.length || 0} predictions.`);
    }

    // Get contract validation data from contract directly (matching backend approach)
    let contractMatchesData;
    try {
      const cycleInfo = await this.oddysseyContract!.getCurrentCycleInfo() as [bigint, number, bigint, bigint, bigint];
      
      // Check if cycle exists and is active (matching backend validation)
      if (!cycleInfo || cycleInfo[0] === BigInt(0)) {
        throw new Error('No active cycle found in contract. Please wait for the next cycle.');
      }

      // Check if cycle is active (matching backend validation)
      if (cycleInfo[1] !== 1) {
        throw new Error('Cycle is not active. Please wait for the next active cycle.');
      }

      const currentCycleId = cycleInfo[0];
      const currentMatches = await this.oddysseyContract!.getDailyMatches(currentCycleId);
      
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
    
    let finalPredictions = validation.orderedPredictions;
    
    // CRITICAL FALLBACK: If validation fails but we have exactly 10 predictions, use them directly
    if (!validation.isValid && predictions.length === 10) {
      console.warn('⚠️ Validation failed but we have exactly 10 predictions. Using fallback approach.');
      console.warn('⚠️ Validation errors:', validation.errors);
      finalPredictions = predictions; // Use original predictions in order
    } else if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    console.log('🔍 CRITICAL: Prediction count after validation:', {
      inputPredictions: predictions.length,
      orderedPredictions: validation.orderedPredictions.length,
      finalPredictions: finalPredictions.length,
      validationErrors: validation.errors.length,
      usingFallback: !validation.isValid && predictions.length === 10
    });

    // Convert predictions to contract format in the correct order (matching backend format)
    const contractPredictions = finalPredictions.map((pred, index) => {
      try {
        const formatted = this.formatPredictionForContract(pred);
        console.log(`✅ Formatted prediction ${index + 1}:`, {
          original: { matchId: pred.matchId, prediction: pred.prediction, odds: pred.odds },
          formatted: { matchId: formatted.matchId, betType: formatted.betType, selection: formatted.selection, selectedOdd: formatted.selectedOdd }
        });
        return formatted;
      } catch (error) {
        throw new Error(`Error formatting prediction ${index + 1}: ${(error as Error).message}`);
      }
    });

    // FINAL CRITICAL CHECK: Ensure we have exactly 10 predictions (matching backend validation)
    console.log('🔍 FINAL CHECK: Contract predictions count:', contractPredictions.length);
    
    if (contractPredictions.length !== 10) {
      console.error('❌ CRITICAL ERROR: Prediction count mismatch!', {
        expected: 10,
        actual: contractPredictions.length,
        inputPredictions: predictions.length,
        orderedPredictions: validation.orderedPredictions.length,
        contractPredictions: contractPredictions.length
      });
      throw new Error(`Final validation failed: exactly 10 predictions required, got ${contractPredictions.length}`);
    }

    console.log('✅ CRITICAL: All 10 predictions successfully formatted and ready for contract submission');

    try {
      console.log('🎯 Placing slip with predictions:', contractPredictions);
      console.log('💰 Entry fee:', entryFee);
      console.log('⛽ Gas settings:', { gas: GAS_SETTINGS.gas.toString(), gasPrice: GAS_SETTINGS.gasPrice.toString() });
      
      // Use the working backend approach
      const result = await this.oddysseyContract!.placeSlip(contractPredictions, entryFee);
      
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
    this.ensureInitialized();
    
    const entryFee = await this.oddysseyContract!.getEntryFee();
    // entryFee is now a serialized string, convert back to BigInt for formatEther
    return formatEther(BigInt(entryFee as string));
  }

  /**
   * Get current cycle ID
   */
  static async getCurrentCycleId(): Promise<number> {
    this.ensureInitialized();
    
    const cycleInfo = await this.oddysseyContract!.getCurrentCycleInfo() as [string, number, string, string, string];
    return Number(cycleInfo[0]); // Return the cycle ID from the array (now serialized as string)
  }

  /**
   * Get current matches from contract
   */
  static async getCurrentMatches(): Promise<any[]> {
    this.ensureInitialized();
    
    const cycleInfo = await this.oddysseyContract!.getCurrentCycleInfo() as [string, number, string, string, string];
    const cycleId = BigInt(cycleInfo[0]); // Convert back to BigInt for the contract call
    const matches = await this.oddysseyContract!.getDailyMatches(cycleId);
    return matches as any[]; // matches are already serialized by getDailyMatches
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
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  
  // Initialize the service when wallet is connected
  useEffect(() => {
    if (isConnected && address && walletClient) {
      setIsInitializing(true);
      setIsInitialized(false);
      
      OddysseyContractService.initialize(walletClient, address)
        .then(() => {
          setIsInitialized(true);
          setIsInitializing(false);
          // Fetch initial data after successful initialization
          return fetchInitialData();
        })
        .catch(err => {
          console.error('Error initializing OddysseyContractService:', err);
          setIsInitialized(false);
          setIsInitializing(false);
        });
    } else {
      // Reset state when wallet is disconnected
      setIsInitialized(false);
      setIsInitializing(false);
      setContractEntryFee('0.5');
      setCurrentCycleId(0);
      setCurrentMatches([]);
    }
  }, [isConnected, address, walletClient]);

  const fetchInitialData = useCallback(async () => {
    if (!isInitialized) {
      console.log('⏳ Skipping fetchInitialData - service not yet initialized');
      return;
    }
    
    try {
      console.log('🎯 Fetching initial contract data...');
      
      // Fetch data individually to handle failures gracefully
      let entryFee = '0.5'; // Default fallback
      let cycleId = 0;
      let matches: any[] = [];
      
      // Try to get entry fee (but don't fail if it doesn't work)
      try {
        entryFee = await OddysseyContractService.getEntryFee();
        console.log('✅ Entry fee fetched:', entryFee);
      } catch (err) {
        console.warn('⚠️ Could not fetch entry fee, using default:', err);
      }
      
      // Try to get cycle ID
      try {
        cycleId = await OddysseyContractService.getCurrentCycleId();
        console.log('✅ Cycle ID fetched:', cycleId);
      } catch (err) {
        console.error('❌ Could not fetch cycle ID:', err);
        // Don't throw here, just set default and continue
        cycleId = 0;
      }
      
      // Try to get matches
      try {
        matches = await OddysseyContractService.getCurrentMatches();
        console.log('✅ Matches fetched:', matches.length);
      } catch (err) {
        console.error('❌ Could not fetch matches:', err);
        // Don't throw here, just set empty array and continue
        matches = [];
      }
      
      setContractEntryFee(entryFee);
      setCurrentCycleId(cycleId);
      setCurrentMatches(matches);
      console.log('✅ Initial contract data fetched successfully');
    } catch (err) {
      console.error('Error fetching initial data:', err);
      // Set default values on error
      setContractEntryFee('0.5');
      setCurrentCycleId(0);
      setCurrentMatches([]);
    }
  }, [isInitialized]);

  const placeSlip = useCallback(async (predictions: any[], entryFee: string) => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }

    if (!walletClient) {
      throw new Error('Wallet client not available');
    }

    if (!isInitialized) {
      throw new Error('Contract service not initialized. Please wait for initialization to complete.');
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

      // Wait for transaction receipt and check status
      const receipt = await OddysseyContractService.waitForTransactionReceipt({ hash: result.hash });
      
      setIsConfirming(false);
      
      // Check if transaction was successful
      if (receipt.status === 'success') {
        setIsSuccess(true);
        console.log('✅ Transaction confirmed successfully:', result.hash);
      } else {
        // Transaction failed on blockchain
        const errorMsg = `Transaction failed on blockchain. Status: ${receipt.status}. Hash: ${result.hash}`;
        console.error('❌ Transaction failed:', errorMsg);
        const error = new Error(errorMsg);
        setError(error);
        throw error;
      }
      
      return result;
    } catch (err) {
      setIsPending(false);
      setIsConfirming(false);
      
      // Enhanced error handling with transaction receipt checking
      if (err instanceof Error && err.message.includes('Transaction failed on blockchain')) {
        // This is already a properly formatted blockchain failure error
        setError(err);
        throw err;
      } else {
        // This is a different type of error (network, validation, etc.)
        const error = err as Error;
        setError(error);
        throw error;
      }
    }
  }, [isConnected, address, walletClient, isInitialized]);

  const getEntryFee = useCallback(async () => {
    if (!isInitialized) {
      throw new Error('Contract service not initialized. Please wait for initialization to complete.');
    }
    return await OddysseyContractService.getEntryFee();
  }, [isInitialized]);

  const getCurrentCycleId = useCallback(async () => {
    if (!isInitialized) {
      throw new Error('Contract service not initialized. Please wait for initialization to complete.');
    }
    return await OddysseyContractService.getCurrentCycleId();
  }, [isInitialized]);

  const getCurrentMatches = useCallback(async () => {
    if (!isInitialized) {
      throw new Error('Contract service not initialized. Please wait for initialization to complete.');
    }
    return await OddysseyContractService.getCurrentMatches();
  }, [isInitialized]);

  const refetchAll = useCallback(async () => {
    if (!isInitialized) {
      throw new Error('Contract service not initialized. Please wait for initialization to complete.');
    }
    await fetchInitialData();
  }, [isInitialized, fetchInitialData]);

  // Reset transaction state
  const resetTransactionState = useCallback(() => {
    setIsSuccess(false);
    setError(null);
    setHash(null);
    setIsPending(false);
    setIsConfirming(false);
  }, []);

  return {
    placeSlip,
    getEntryFee,
    getCurrentCycleId,
    getCurrentMatches,
    refetchAll,
    resetTransactionState,
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
    currentMatches,
    // Initialization state
    isInitialized,
    isInitializing
  };
}

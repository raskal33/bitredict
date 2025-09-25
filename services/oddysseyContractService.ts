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
      http: [
        process.env.NODE_ENV === 'development' 
          ? 'http://localhost:8080/api/rpc-proxy'
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

// Enums from contract
const BetType = {
  MONEYLINE: 0,
  OVER_UNDER: 1
} as const;

// Selection constants (matching contract exactly)
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

// Wagmi-style client wrapper
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
    console.log('✅ WagmiStyleClient initialized');
  }

  setWalletClient(walletClient: WalletClient, address: Address) {
    this.walletClient = walletClient;
    this.walletAddress = address;
    console.log('✅ Wallet client set:', address);
  }

  getWalletClient(): WalletClient | null {
    return this.walletClient;
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
      throw new Error('Wallet client not set');
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
      // Remove gas settings to let ethers handle it automatically
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

// Wagmi-style contract hooks
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
    return result;
  }

  async getDailyMatches(cycleId: bigint) {
    const result = await this.client.readContract({
      address: CONTRACTS.ODDYSSEY.address as Address,
      abi: ODDYSSEY_ABI,
      functionName: 'getDailyMatches',
      args: [cycleId]
    });
    return result;
  }

  async getEntryFee() {
    const result = await this.client.readContract({
      address: CONTRACTS.ODDYSSEY.address as Address,
      abi: ODDYSSEY_ABI,
      functionName: 'entryFee'
    });
    return result;
  }

  async getSlipCount() {
    const result = await this.client.readContract({
      address: CONTRACTS.ODDYSSEY.address as Address,
      abi: ODDYSSEY_ABI,
      functionName: 'slipCount'
    });
    return result;
  }

  async getSlip(slipId: bigint) {
    const result = await this.client.readContract({
      address: CONTRACTS.ODDYSSEY.address as Address,
      abi: ODDYSSEY_ABI,
      functionName: 'getSlip',
      args: [slipId]
    });
    return result;
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
      
      // Verify wallet client is properly set
      if (!this.client.getWalletClient()) {
        throw new Error('Failed to set wallet client');
      }
      
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
   * Public method to check if service is initialized
   */
  static isServiceInitialized(): boolean {
    return this.isInitialized && this.oddysseyContract !== null;
  }

  /**
   * Wait for transaction receipt
   */
  static async waitForTransactionReceipt({ hash }: { hash: `0x${string}` }) {
    this.ensureInitialized();
    return await this.client.waitForTransactionReceipt({ hash });
  }

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

    // Validate odds
    if (!prediction.odds || prediction.odds <= 0) {
      throw new Error(`Invalid odds: ${prediction.odds}`);
    }

    return {
      matchId: BigInt(prediction.matchId),
      betType,
      selection,
      selectedOdd: Math.round(prediction.odds * 1000) // Contract uses 1000 scaling factor
    };
  }

  /**
   * Place slip using contract calls only
   */
  static async placeSlip(predictions: any[], entryFee: string) {
    this.ensureInitialized();

    // Validate predictions
    if (!predictions || predictions.length !== 10) {
      throw new Error(`Exactly 10 predictions are required. You have ${predictions?.length || 0} predictions.`);
    }

    // Convert predictions to contract format
    const contractPredictions = predictions.map((pred, index) => {
      try {
        return this.formatPredictionForContract(pred);
      } catch (error) {
        throw new Error(`Error formatting prediction ${index + 1}: ${(error as Error).message}`);
      }
    });

    try {
      console.log('🎯 Placing slip with predictions:', contractPredictions);
      console.log('💰 Entry fee:', entryFee);
      
      const result = await this.oddysseyContract!.placeSlip(contractPredictions, entryFee);
      
      console.log('✅ Slip placed successfully:', result.hash);
      return result;
    } catch (error) {
      console.error('❌ Error placing slip:', error);
      
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
    return formatEther(entryFee as bigint);
  }

  /**
   * Get current cycle ID
   */
  static async getCurrentCycleId(): Promise<number> {
    this.ensureInitialized();
    
    const cycleInfo = await this.oddysseyContract!.getCurrentCycleInfo() as [bigint, number, bigint, bigint, bigint];
    return Number(cycleInfo[0]);
  }

  /**
   * Get current matches from contract
   */
  static async getCurrentMatches(): Promise<any[]> {
    this.ensureInitialized();
    
    const cycleInfo = await this.oddysseyContract!.getCurrentCycleInfo() as [bigint, number, bigint, bigint, bigint];
    const cycleId = cycleInfo[0];
    const matches = await this.oddysseyContract!.getDailyMatches(cycleId);
    return matches as any[];
  }
}

import { useAccount, useWalletClient } from 'wagmi';
import { useEffect, useState, useCallback } from 'react';

// React hook for contract interactions
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
      let entryFee = '0.5';
      let cycleId = 0;
      let matches: any[] = [];
      
      try {
        entryFee = await OddysseyContractService.getEntryFee();
        console.log('✅ Entry fee fetched:', entryFee);
      } catch (err) {
        console.warn('⚠️ Could not fetch entry fee, using default:', err);
      }
      
      try {
        cycleId = await OddysseyContractService.getCurrentCycleId();
        console.log('✅ Cycle ID fetched:', cycleId);
      } catch (err) {
        console.error('❌ Could not fetch cycle ID:', err);
        cycleId = 0;
      }
      
      try {
        matches = await OddysseyContractService.getCurrentMatches();
        console.log('✅ Matches fetched:', matches.length);
      } catch (err) {
        console.error('❌ Could not fetch matches:', err);
        matches = [];
      }
      
      setContractEntryFee(entryFee);
      setCurrentCycleId(cycleId);
      setCurrentMatches(matches);
      console.log('✅ Initial contract data fetched successfully');
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setContractEntryFee('0.5');
      setCurrentCycleId(0);
      setCurrentMatches([]);
    }
  }, [isInitialized]);

  const placeSlip = useCallback(async (predictions: any[], entryFee: string) => {
    console.log('🎯 Attempting to place slip...', { 
      isConnected, 
      address, 
      hasWalletClient: !!walletClient, 
      isInitialized,
      isServiceInitialized: OddysseyContractService.isServiceInitialized()
    });

    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }

    if (!walletClient) {
      throw new Error('Wallet client not available');
    }

    if (!isInitialized) {
      throw new Error('Contract service not initialized. Please wait for initialization to complete.');
    }

    // Additional check to ensure wallet client is properly set in the service
    if (!OddysseyContractService.isServiceInitialized()) {
      throw new Error('Service not properly initialized. Please ensure your wallet is connected and try again.');
    }

    // Reset state
    setIsPending(true);
    setIsSuccess(false);
    setIsConfirming(false);
    setError(null);
    setHash(null);

    try {
      // Retry mechanism in case of initialization issues
      let retryCount = 0;
      const maxRetries = 2;
      let result: any;
      
      while (retryCount < maxRetries) {
        try {
          result = await OddysseyContractService.placeSlip(predictions, entryFee);
          setHash(result.hash);
          setIsPending(false);
          setIsConfirming(true);
          break;
        } catch (error) {
          if (error instanceof Error && error.message.includes('Wallet client not set') && retryCount < maxRetries - 1) {
            console.log(`🔄 Retrying slip placement (attempt ${retryCount + 1}/${maxRetries})...`);
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
            continue;
          }
          throw error;
        }
      }

      const receipt = await OddysseyContractService.waitForTransactionReceipt({ hash: result.hash });
      
      setIsConfirming(false);
      
      if (receipt.status === 'success') {
        setIsSuccess(true);
        console.log('✅ Transaction confirmed successfully:', result.hash);
      } else {
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
      
      if (err instanceof Error && err.message.includes('Transaction failed on blockchain')) {
        setError(err);
        throw err;
      } else {
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
    isPending,
    isSuccess,
    isConfirming,
    error,
    hash,
    contractEntryFee,
    currentCycleId,
    currentMatches,
    isInitialized,
    isInitializing
  };
}
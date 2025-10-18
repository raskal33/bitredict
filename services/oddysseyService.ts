import { CONTRACTS } from '@/contracts';
import { 
  createPublicClient, 
  createWalletClient, 
  http, 
  parseEther, 
  formatEther, 
  keccak256, 
  stringToHex,
  defineChain,
  type Address,
  type PublicClient,
  type WalletClient
} from 'viem';

// Define Somnia Testnet chain
const somniaTestnet = defineChain({
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
    default: { name: 'Somnia Explorer', url: 'https://shannon-explorer.somnia.network' },
  },
  testnet: true,
});

// Contract-based interfaces (matching the updated Solidity contract)
export interface OddysseyMatch {
  id: bigint;
  startTime: bigint;
  oddsHome: number;
  oddsDraw: number;
  oddsAway: number;
  oddsOver: number;
  oddsUnder: number;
  homeTeam: string;
  awayTeam: string;
  leagueName: string;
  result: {
    moneyline: number; // 0=NotSet, 1=HomeWin, 2=Draw, 3=AwayWin
    overUnder: number; // 0=NotSet, 1=Over, 2=Under
  };
}

export interface UserPrediction {
  matchId: bigint;
  betType: number; // 0=MONEYLINE, 1=OVER_UNDER
  selection: string;
  selectedOdd: number;
  homeTeam: string;
  awayTeam: string;
  leagueName: string;
  isCorrect?: boolean; // Will be determined by evaluation
}

export interface OddysseySlip {
  id?: number;
  player: Address;
  cycleId: number;
  placedAt: number;
  predictions: UserPrediction[];
  finalScore: number;
  correctCount: number;
  isEvaluated: boolean;
}

export interface CycleInfo {
  cycleId: bigint;
  state: number; // 0=NotStarted, 1=Active, 2=Ended, 3=Resolved
  startTime: bigint; // Added missing field
  endTime: bigint;
  prizePool: bigint;
  slipCount: bigint;
  evaluatedSlips: bigint; // Added missing field
  hasWinner: boolean; // Added missing field
  rolloverAmount?: bigint; // Added rollover amount for display
}

export interface UserStats {
  totalSlips: number;
  totalWins: number;
  bestScore: number;
  averageScore: number;
  winRate: number;
  currentStreak: number;
  bestStreak: number;
  lastActiveCycle: number;
}

export interface LeaderboardEntry {
  player: Address;
  slipId: bigint;
  finalScore: bigint;
  correctCount: bigint;
}

export interface OddysseyMatchWithResult {
  id: string;
  fixture_id: string;
  home_team: string;
  away_team: string;
  league_name: string;
  match_date: string;
  status: string;
  display_order: number;
  result: {
    home_score: number | null;
    away_score: number | null;
    outcome_1x2: string | null;
    outcome_ou25: string | null;
    finished_at: string | null;
    is_finished: boolean;
    moneyline?: number;
    overUnder?: number;
  };
}

export interface OddysseyCycle {
  cycleId: number;
  state: number;
  endTime: string;
  prizePool: string;
  slipCount: number;
  entryFee: string;
}

export interface ResultsByDate {
  date: string;
  cycleId: number;
  isResolved: boolean;
  matches: OddysseyMatchWithResult[];
  totalMatches: number;
  finishedMatches: number;
}

class OddysseyService {
  private publicClient: PublicClient;
  private walletClient: WalletClient | null = null;

  constructor() {
    this.publicClient = createPublicClient({
      chain: somniaTestnet,
      transport: http(),
    });
  }

  setWalletClient(walletClient: WalletClient | null) {
    this.walletClient = walletClient;
  }

  // Get current cycle ID
  async getCurrentCycle(): Promise<bigint> {
    try {
      const result = await this.publicClient.readContract({
        address: CONTRACTS.ODDYSSEY.address,
        abi: CONTRACTS.ODDYSSEY.abi,
        functionName: 'dailyCycleId',
      });
      const cycleId = result as bigint;
      console.log('📅 Current cycle ID:', cycleId.toString());
      return cycleId;
    } catch (error) {
      console.error('❌ Error getting current cycle:', error);
      // Return 0 as fallback if contract is not accessible
      console.warn('⚠️ Using fallback cycle ID: 0');
      return BigInt(0);
    }
  }

  // Get current cycle info with full data structure
  async getCurrentCycleInfo(): Promise<CycleInfo> {
    try {
      const currentCycle = await this.getCurrentCycle();
      
      // Check if cycle is valid (not 0)
      if (currentCycle === BigInt(0)) {
        throw new Error('Cycle 0 does not exist');
      }
      
      // Use getCycleStatus to get the full CycleInfo structure
      const result = await this.publicClient.readContract({
        address: CONTRACTS.ODDYSSEY.address,
        abi: CONTRACTS.ODDYSSEY.abi,
        functionName: 'getCycleStatus',
        args: [currentCycle],
      });
      
      const [exists, state, endTime, _, cycleSlipCount, hasWinner] = result as [boolean, number, bigint, bigint, bigint, boolean];
      
      if (!exists) {
        throw new Error(`Cycle ${currentCycle} does not exist`);
      }
      
      // Get actual prize pool (includes rollover) using dailyPrizePools
      const actualPrizePool = await this.publicClient.readContract({
        address: CONTRACTS.ODDYSSEY.address,
        abi: CONTRACTS.ODDYSSEY.abi,
        functionName: 'dailyPrizePools',
        args: [currentCycle],
      });
      
      // Get additional cycle info from cycleInfo mapping
      const cycleInfoResult = await this.publicClient.readContract({
        address: CONTRACTS.ODDYSSEY.address,
        abi: CONTRACTS.ODDYSSEY.abi,
        functionName: 'cycleInfo',
        args: [currentCycle],
      });
      
      const cycleInfoData = cycleInfoResult as any;
      
      // Calculate rollover amount
      const rolloverAmount = await this.calculateRolloverAmount(currentCycle);
      
      return {
        cycleId: currentCycle,
        state,
        startTime: cycleInfoData.startTime || BigInt(0),
        endTime,
        prizePool: actualPrizePool as bigint, // Use correct prize pool with rollover
        slipCount: cycleSlipCount,
        evaluatedSlips: cycleInfoData.evaluatedSlips || BigInt(0),
        hasWinner,
        rolloverAmount // Add rollover amount for display
      };
    } catch (error) {
      console.error('Error getting current cycle info:', error);
      
      // If cycle 0 error, return a default inactive cycle
      if (error instanceof Error && error.message.includes('Cycle 0 does not exist')) {
        console.log('🔄 No active cycle, returning default inactive cycle');
        return {
          cycleId: BigInt(0),
          state: 0, // Inactive
          endTime: BigInt(0),
          prizePool: BigInt(0),
          slipCount: BigInt(0),
          startTime: BigInt(0),
          evaluatedSlips: BigInt(0),
          hasWinner: false,
          rolloverAmount: BigInt(0)
        };
      }
      
      // Fallback to basic getCurrentCycleInfo if getCycleStatus fails
      try {
        const result = await this.publicClient.readContract({
          address: CONTRACTS.ODDYSSEY.address,
          abi: CONTRACTS.ODDYSSEY.abi,
          functionName: 'getCurrentCycleInfo',
        });
        
        const [cycleId, state, endTime, prizePool, slipCount] = result as [bigint, number, bigint, bigint, bigint];
        
        return {
          cycleId,
          state,
          startTime: BigInt(0), // Not available in basic function
          endTime,
          prizePool,
          slipCount,
          evaluatedSlips: BigInt(0), // Not available in basic function
          hasWinner: false, // Not available in basic function
          rolloverAmount: BigInt(0) // Not available in basic function
        };
      } catch (fallbackError) {
        console.error('Error with fallback getCurrentCycleInfo:', fallbackError);
        throw error;
      }
    }
  }

  // Calculate rollover amount from previous cycle
  async calculateRolloverAmount(cycleId: bigint): Promise<bigint> {
    try {
      if (cycleId <= 1n) return BigInt(0);
      
      const previousCycle = cycleId - 1n;
      
      // Get previous cycle's leaderboard
      const leaderboard = await this.publicClient.readContract({
        address: CONTRACTS.ODDYSSEY.address,
        abi: CONTRACTS.ODDYSSEY.abi,
        functionName: 'getDailyLeaderboard',
        args: [previousCycle],
      });
      
      // Check if previous cycle had a winner (top player with 7+ correct predictions)
      const topPlayer = (leaderboard as any[])[0];
      const hasWinner = topPlayer && 
                      topPlayer.player !== '0x0000000000000000000000000000000000000000' && 
                      Number(topPlayer.correctCount) >= 7;
      
      if (!hasWinner) {
        // Get previous cycle's prize pool
        const previousPrizePool = await this.publicClient.readContract({
          address: CONTRACTS.ODDYSSEY.address,
          abi: CONTRACTS.ODDYSSEY.abi,
          functionName: 'dailyPrizePools',
          args: [previousCycle],
        });
        
        // Calculate rollover: 95% of previous prize pool (5% fee deducted)
        const PRIZE_ROLLOVER_FEE_PERCENTAGE = 500; // 5% = 500 basis points
        const fee = (previousPrizePool as bigint * BigInt(PRIZE_ROLLOVER_FEE_PERCENTAGE)) / BigInt(10000);
        const rolloverAmount = (previousPrizePool as bigint) - fee;
        
        return rolloverAmount;
      }
      
      return BigInt(0);
    } catch (error) {
      console.error('Error calculating rollover amount:', error);
      return BigInt(0);
    }
  }

  // Check if contract is properly initialized
  async isContractInitialized(): Promise<boolean> {
    try {
      const cycleId = await this.getCurrentCycle();
      if (cycleId === BigInt(0)) {
        return false;
      }
      
      // Try to get matches for the current cycle
      await this.publicClient.readContract({
        address: CONTRACTS.ODDYSSEY.address,
        abi: CONTRACTS.ODDYSSEY.abi,
        functionName: 'getDailyMatches',
        args: [cycleId],
      });
      return true;
    } catch (error) {
      console.warn('⚠️ Contract not properly initialized:', error);
      return false;
    }
  }

  // Get current cycle matches
  async getCurrentCycleMatches(): Promise<OddysseyMatch[]> {
    try {
      const cycleId = await this.getCurrentCycle();
      console.log('🔍 Getting matches for cycle ID:', cycleId.toString());
      
      // Check if contract is initialized
      const isInitialized = await this.isContractInitialized();
      if (!isInitialized) {
        console.warn('⚠️ Contract not initialized, returning empty matches');
        return [];
      }
      
      const result = await this.publicClient.readContract({
        address: CONTRACTS.ODDYSSEY.address,
        abi: CONTRACTS.ODDYSSEY.abi,
        functionName: 'getDailyMatches',
        args: [cycleId],
      });

      const matches = (result as any[]).map((match) => ({
        id: match.id,
        startTime: match.startTime,
        oddsHome: Number(match.oddsHome) / 1000, // Convert from contract format (scaled by 1000)
        oddsDraw: Number(match.oddsDraw) / 1000,
        oddsAway: Number(match.oddsAway) / 1000,
        oddsOver: Number(match.oddsOver) / 1000,
        oddsUnder: Number(match.oddsUnder) / 1000,
        homeTeam: match.homeTeam || 'Home Team', // Team names from contract
        awayTeam: match.awayTeam || 'Away Team', // Team names from contract
        leagueName: match.leagueName || 'Daily Challenge', // League name from contract
        result: {
          moneyline: Number(match.result?.moneyline || 0), // MoneylineResult enum (0=NotSet, 1=HomeWin, 2=Draw, 3=AwayWin)
          overUnder: Number(match.result?.overUnder || 0), // OverUnderResult enum (0=NotSet, 1=Over, 2=Under)
        },
      }));

      console.log('✅ Retrieved matches:', matches.length);
      return matches;
    } catch (error) {
      console.error('❌ Error getting current cycle matches:', error);
      
      // If the cycle doesn't exist or has no matches, return empty array
      if (error instanceof Error && error.message.includes('out of bounds')) {
        console.warn('⚠️ Cycle has no matches, returning empty array');
        return [];
      }
      
      throw error;
    }
  }

  // Get entry fee
  async getEntryFee(): Promise<string> {
    try {
      const result = await this.publicClient.readContract({
        address: CONTRACTS.ODDYSSEY.address,
        abi: CONTRACTS.ODDYSSEY.abi,
        functionName: 'entryFee',
      });
      return formatEther(result as bigint);
    } catch (error) {
      console.error('Error getting entry fee:', error);
      throw error;
    }
  }

  // Place a slip
  async placeSlip(predictions: Array<{
    matchId: number;
    prediction: string;
    odds: number;
  }>): Promise<`0x${string}`> {
    // Enhanced wallet client validation for mobile devices
    if (!this.walletClient) {
      throw new Error('Wallet client not initialized. Please ensure your wallet is connected and try again.');
    }

    if (!this.walletClient.account) {
      throw new Error('Wallet account not available. Please reconnect your wallet.');
    }

    // Additional mobile-specific validation
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        // Check if wallet is still connected
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (!accounts || accounts.length === 0) {
          throw new Error('Wallet connection lost. Please reconnect your wallet.');
        }
      } catch (error) {
        console.warn('Wallet connection check failed:', error);
        // Continue with transaction attempt
      }
    }

    try {
      console.log('🎯 Placing slip with predictions:', predictions);
      
      // Fetch the actual entry fee from the contract
      const entryFeeResult = await this.publicClient.readContract({
        address: CONTRACTS.ODDYSSEY.address,
        abi: CONTRACTS.ODDYSSEY.abi,
        functionName: 'entryFee',
      });
      
      const entryFeeBigInt = entryFeeResult as bigint;
      console.log(`💰 Entry fee from contract: ${formatEther(entryFeeBigInt)} STT (${entryFeeBigInt.toString()} wei)`);
      
      // Convert predictions to contract format
      const contractPredictions = predictions.map(pred => {
        // Convert odds: if pred.odds is already scaled (e.g., 1500 for 1.5x), keep it
        // If it's decimal format (e.g., 1.5), scale it by 1000
        let scaledOdds = pred.odds;
        if (scaledOdds < 100) {
          // Likely decimal format (e.g., 1.5, 2.3), scale by 1000
          scaledOdds = Math.floor(scaledOdds * 1000);
        }
        
        console.log(`🔢 Odds conversion: ${pred.odds} -> ${scaledOdds}`);
        
        return {
          matchId: BigInt(pred.matchId),
          betType: ['1', 'X', '2'].includes(pred.prediction) ? 0 : 1, // 0=MONEYLINE, 1=OVER_UNDER
          selection: pred.prediction,
          selectedOdd: scaledOdds, // Contract format: odds * 1000
          homeTeam: '', // Will be filled by contract
          awayTeam: '', // Will be filled by contract
          leagueName: '', // Will be filled by contract
        };
      });

      console.log('📝 Contract predictions:', contractPredictions);

      const hash = await this.walletClient.writeContract({
        address: CONTRACTS.ODDYSSEY.address,
        abi: CONTRACTS.ODDYSSEY.abi,
        functionName: 'placeSlip',
        args: [contractPredictions],
        value: entryFeeBigInt, // ✅ Use actual entry fee from contract
        chain: somniaTestnet,
        account: this.walletClient.account,
      });

      console.log('✅ Transaction hash received:', hash);
      return hash;
    } catch (error) {
      console.error('❌ Error placing slip:', error);
      
      // Enhanced error handling for mobile devices
      if (error instanceof Error) {
        if (error.message.includes('user rejected') || error.message.includes('User denied')) {
          throw new Error('Transaction was cancelled by user. Please try again if you want to place the slip.');
        } else if (error.message.includes('insufficient funds')) {
          throw new Error('Insufficient funds. Please ensure you have enough STT tokens to pay the entry fee.');
        } else if (error.message.includes('gas')) {
          throw new Error('Gas estimation failed. Please try again or check your network connection.');
        } else if (error.message.includes('network')) {
          throw new Error('Network error. Please check your internet connection and try again.');
        } else if (error.message.includes('wallet')) {
          throw new Error('Wallet error. Please ensure your wallet is properly connected and try again.');
        }
      }
      
      throw error;
    }
  }

  // Get user slips for current cycle from contract
  async getUserSlipsForCycleFromContract(userAddress: Address, cycleId: bigint): Promise<OddysseySlip[]> {
    try {
      // First, get the slip IDs for this user and cycle
      const slipIdsResult = await this.publicClient.readContract({
        address: CONTRACTS.ODDYSSEY.address,
        abi: CONTRACTS.ODDYSSEY.abi,
        functionName: 'getUserSlipsForCycle',
        args: [userAddress, cycleId],
      });

      const slipIds = slipIdsResult as bigint[];
      console.log('🔍 Contract returned slip IDs:', slipIds);
      
      if (!slipIds || slipIds.length === 0) {
        console.log('⚠️ No slip IDs found for user');
        return [];
      }

      // Then, get the full slip data for each slip ID
      const slips: OddysseySlip[] = [];
      for (const slipId of slipIds) {
        try {
          const slipResult = await this.getSlip(slipId);
          if (slipResult.success && slipResult.data) {
            console.log('🔍 Retrieved slip data for ID', slipId.toString(), ':', slipResult.data);
            slips.push(slipResult.data);
          }
        } catch (error) {
          console.error('❌ Error getting slip', slipId.toString(), ':', error);
          continue;
        }
      }

      console.log('🔍 Final processed slips:', slips);
      return slips;
    } catch (error) {
      console.error('Error getting user slips:', error);
      throw error;
    }
  }

  // Get all user slips with evaluation data for a specific cycle
  async getUserSlipsWithDataFromContract(userAddress: Address, cycleId: bigint): Promise<{
    slipIds: bigint[];
    slipsData: OddysseySlip[];
  }> {
    try {
      console.log('🔍 Getting user slips with data for cycle:', cycleId.toString(), 'user:', userAddress);
      
      const result = await this.publicClient.readContract({
        address: CONTRACTS.ODDYSSEY.address,
        abi: CONTRACTS.ODDYSSEY.abi,
        functionName: 'getUserSlipsWithData',
        args: [userAddress, cycleId],
      });

      console.log('🔍 Raw getUserSlipsWithData result:', result);
      console.log('🔍 Result type:', typeof result);
      console.log('🔍 Result is array:', Array.isArray(result));
      
      const [slipIds, slipsData] = result as [bigint[], any[]];
      
      console.log('🔍 Processed slip IDs:', slipIds);
      console.log('🔍 Processed slips data:', slipsData);
      console.log('🔍 Slip IDs length:', slipIds?.length);
      console.log('🔍 Slips data length:', slipsData?.length);
      
      if (!slipIds || slipIds.length === 0) {
        console.log('⚠️ No slip IDs found for user in cycle', cycleId.toString());
        return { slipIds: [], slipsData: [] };
      }
      
      const processedSlips = slipsData.map((slip, index) => {
        console.log(`🔍 Processing slip ${index}:`, slip);
        const processed = this.processSlipData(slip);
        console.log(`🔍 Processed slip ${index}:`, processed);
        return processed;
      });
      
      return {
        slipIds,
        slipsData: processedSlips
      };
    } catch (error) {
      console.error('Error getting user slips with data:', error);
      throw error;
    }
  }

  // Get all user slips with evaluation data from backend API
  async getAllUserSlipsWithDataFromContract(userAddress: Address): Promise<{
    slipIds: bigint[];
    slipsData: OddysseySlip[];
  }> {
    try {
      console.log('🔍 Getting ALL user slips with data from backend for:', userAddress);
      
      const response = await fetch(`/api/oddyssey/user-slips/${userAddress}?limit=50&offset=0&t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch user slips from backend');
      }
      
      const data = await response.json();
      console.log('🔍 Backend slips data:', data);
      
      // Transform backend data to match expected OddysseySlip format
      const backendSlips = data.data || [];
      console.log('🔍 Backend slips raw:', JSON.stringify(backendSlips[0], null, 2));
      console.log('🔍 First slip predictions:', JSON.stringify(backendSlips[0]?.predictions, null, 2));
      
      const slipsData: OddysseySlip[] = backendSlips.map((slip: any, index: number) => ({
        id: slip.slipId || slip.slip_id || slip.id || index,
        player: (slip.playerAddress || slip.player_address || userAddress) as Address,
        cycleId: Number(slip.cycleId || slip.cycle_id || 0),
        placedAt: slip.created_at ? Math.floor(new Date(slip.created_at).getTime() / 1000) : 0,
        predictions: slip.predictions?.map((pred: any, predIndex: number) => {
          console.log(`🔍 Processing prediction ${predIndex}:`, pred);
          
          // Determine bet type based on prediction value
          const prediction = pred.prediction || pred.pick || '';
          let betType = 0; // Default to MONEYLINE
          if (['over', 'under'].includes(prediction.toLowerCase())) {
            betType = 1; // OVER_UNDER
          } else if (['yes', 'no'].includes(prediction.toLowerCase())) {
            betType = 2; // BTTS
          }
          
          const transformed = {
            matchId: BigInt(pred.matchId || pred.match_id || pred.id || 0),
            betType: betType,
            selection: prediction,
            // ✅ FIX: Backend returns scaled odds (e.g., 1570 = 1.57x)
            selectedOdd: (() => {
              const oddsValue = Number(pred.odds || pred.odd || pred.selectedOdd || 0);
              console.log(`🔍 Odds transformation: ${pred.odds || pred.odd || pred.selectedOdd} -> ${oddsValue / 1000}`);
              // Backend returns scaled odds, divide by 1000 to get decimal
              return oddsValue / 1000;
            })(),
            // ✅ FIX: Use actual team names from backend
            homeTeam: pred.home_team || pred.team1 || '',
            awayTeam: pred.away_team || pred.team2 || '',
            leagueName: pred.league_name || '',
            isCorrect: pred.isCorrect !== undefined ? Boolean(pred.isCorrect) : 
                      (pred.is_correct !== undefined ? Boolean(pred.is_correct) : undefined)
          };
          console.log(`🔍 Transformed prediction ${predIndex}:`, transformed);
          return transformed;
        }) || [],
        finalScore: Number(slip.finalScore || slip.final_score || 0),
        correctCount: Number(slip.correctCount || slip.correct_count || 0),
        isEvaluated: Boolean(slip.isEvaluated || slip.is_evaluated || false)
      }));
      
      console.log('🔍 Transformed first slip:', JSON.stringify(slipsData[0], null, 2));
      
      const slipIds = slipsData.map((slip, index) => BigInt(slip.id || index));
      
      console.log('🔍 Transformed slips data:', slipsData);
      
      return {
        slipIds,
        slipsData
      };
    } catch (error) {
      console.error('❌ Error getting user slips from backend:', error);
      return { slipIds: [], slipsData: [] };
    }
  }

  // Get evaluated slip data from backend
  async getEvaluatedSlipData(slipId: number): Promise<OddysseySlip | null> {
    try {
      console.log('🔍 Getting evaluated slip data for slip ID:', slipId);
      
      const response = await fetch(`/api/oddyssey/evaluated-slip/${slipId}?t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch evaluated slip data');
      }
      
      const data = await response.json();
      console.log('🔍 Evaluated slip data:', data);
      
      if (data.success && data.data) {
        const slip = data.data;
        
        return {
          id: slip.slipId || slipId,
          player: '0x0000000000000000000000000000000000000000' as Address, // Will be filled by caller
          cycleId: Number(slip.cycleId || 0),
          placedAt: 0, // Not provided in evaluated slip
          predictions: slip.predictions?.map((pred: any) => ({
            matchId: BigInt(pred.matchId || 0),
            betType: Number(pred.betType || 0),
            selection: pred.prediction || pred.selection || '',
            selectedOdd: Number(pred.odds || 0) / 100,
            homeTeam: pred.homeTeam || 'Team A',
            awayTeam: pred.awayTeam || 'Team B',
            leagueName: pred.league || 'Unknown League',
            isCorrect: pred.isCorrect !== undefined ? Boolean(pred.isCorrect) : undefined
          })) || [],
          finalScore: Number(slip.finalScore || 0),
          correctCount: Number(slip.correctCount || slip.summary?.correctPredictions || 0),
          isEvaluated: Boolean(slip.isEvaluated || true)
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting evaluated slip data:', error);
      return null;
    }
  }



  // Process slip data from contract response
  private processSlipData(rawSlip: any): OddysseySlip {
    console.log('🔍 Processing raw slip data:', rawSlip);
    console.log('🔍 Raw slip player:', rawSlip.player);
    console.log('🔍 Raw slip cycleId:', rawSlip.cycleId);
    console.log('🔍 Raw slip placedAt:', rawSlip.placedAt);
    console.log('🔍 Raw slip predictions:', rawSlip.predictions);
    console.log('🔍 Raw slip finalScore:', rawSlip.finalScore);
    console.log('🔍 Raw slip correctCount:', rawSlip.correctCount);
    console.log('🔍 Raw slip isEvaluated:', rawSlip.isEvaluated);
    
    const processed = {
      player: rawSlip.player,
      cycleId: Number(rawSlip.cycleId),
      placedAt: Number(rawSlip.placedAt),
      predictions: rawSlip.predictions.map((pred: any) => ({
        matchId: Number(pred.matchId),
        betType: Number(pred.betType),
        selection: pred.selection,
        selectedOdd: Number(pred.selectedOdd) / 1000, // Convert from contract format (stored as odds * 1000)
        homeTeam: pred.homeTeam,
        awayTeam: pred.awayTeam,
        leagueName: pred.leagueName,
        isCorrect: undefined // Will be calculated separately
      })),
      finalScore: Number(rawSlip.finalScore),
      correctCount: Number(rawSlip.correctCount),
      isEvaluated: rawSlip.isEvaluated
    };
    
    console.log('🔍 Processed slip:', processed);
    return processed;
  }

  // Calculate prediction correctness based on match results
  private calculatePredictionCorrectness(prediction: any, matchResult: any): boolean {
    if (!matchResult || !matchResult.result) {
      return false; // No result available
    }

    const { betType, selection } = prediction;
    const { moneyline, overUnder } = matchResult.result;

    if (betType === 0) { // MONEYLINE
      if (selection === "1" && moneyline === 1) return true; // HomeWin
      if (selection === "X" && moneyline === 2) return true; // Draw
      if (selection === "2" && moneyline === 3) return true; // AwayWin
    } else if (betType === 1) { // OVER_UNDER
      if (selection === "Over" && overUnder === 1) return true; // Over
      if (selection === "Under" && overUnder === 2) return true; // Under
    }

    return false;
  }

  // Get match results for a specific cycle
  async getCycleMatchResults(cycleId: bigint): Promise<any[]> {
    try {
      const result = await this.publicClient.readContract({
        address: CONTRACTS.ODDYSSEY.address,
        abi: CONTRACTS.ODDYSSEY.abi,
        functionName: 'getDailyMatches',
        args: [cycleId],
      });

      return (result as any[]).map((match) => ({
        id: match.id,
        startTime: match.startTime,
        oddsHome: Number(match.oddsHome) / 1000,
        oddsDraw: Number(match.oddsDraw) / 1000,
        oddsAway: Number(match.oddsAway) / 1000,
        oddsOver: Number(match.oddsOver) / 1000,
        oddsUnder: Number(match.oddsUnder) / 1000,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        leagueName: match.leagueName,
        result: {
          moneyline: Number(match.result?.moneyline || 0),
          overUnder: Number(match.result?.overUnder || 0),
        },
      }));
    } catch (error) {
      console.error('Error getting cycle match results:', error);
      return [];
    }
  }


  // Get daily leaderboard
  async getDailyLeaderboard(cycleId: bigint): Promise<LeaderboardEntry[]> {
    try {
      const result = await this.publicClient.readContract({
        address: CONTRACTS.ODDYSSEY.address,
        abi: CONTRACTS.ODDYSSEY.abi,
        functionName: 'getDailyLeaderboard',
        args: [cycleId],
      });

      const entries = result as any[];
      return entries.map(entry => ({
        player: entry[0],
        slipId: entry[1],
        finalScore: entry[2],
        correctCount: entry[3],
      }));
    } catch (error) {
      console.error('Error getting daily leaderboard:', error);
      throw error;
    }
  }

  // Get global stats using getDailyStats from current cycle
  async getGlobalStats(): Promise<{
    totalVolume: bigint;
    totalSlips: number;
    totalUsers: number;
    totalWinners: number;
    averageScore: number;
    maxScore: number;
    minScore: number;
    correctPredictions: number; // Added missing field
    evaluatedSlips: number; // Added missing field
  }> {
    try {
      // Get current cycle to fetch its stats
      const currentCycle = await this.getCurrentCycle();
      
      const result = await this.publicClient.readContract({
        address: CONTRACTS.ODDYSSEY.address,
        abi: CONTRACTS.ODDYSSEY.abi,
        functionName: 'getDailyStats',
        args: [currentCycle],
      });

      const stats = result as any;
      return {
        totalVolume: stats.volume,
        totalSlips: Number(stats.slipCount),
        totalUsers: Number(stats.userCount),
        totalWinners: Number(stats.winnersCount),
        averageScore: Number(stats.averageScore),
        maxScore: Number(stats.maxScore),
        minScore: Number(stats.minScore),
        correctPredictions: Number(stats.correctPredictions), // Added
        evaluatedSlips: Number(stats.evaluatedSlips), // Added
      };
    } catch (error) {
      console.error('Error getting global stats:', error);
      throw error;
    }
  }

  // Get user stats
  async getUserStats(userAddress: Address): Promise<{
    totalSlips: bigint;
    totalWins: bigint;
    bestScore: bigint;
    averageScore: bigint;
    winRate: bigint;
    currentStreak: bigint;
    bestStreak: bigint;
    lastActiveCycle: bigint;
  }> {
    try {
      const result = await this.publicClient.readContract({
        address: CONTRACTS.ODDYSSEY.address,
        abi: CONTRACTS.ODDYSSEY.abi,
        functionName: 'getUserData',
        args: [userAddress],
      });

      const [userStats, reputation, correctPredictions] = result as [any, bigint, bigint];
      console.log('🔍 Raw user stats from contract:', userStats);
      console.log('🔍 User reputation:', reputation);
      console.log('🔍 User correct predictions:', correctPredictions);

      return {
        totalSlips: userStats?.[0] || BigInt(0),
        totalWins: userStats?.[1] || BigInt(0),
        bestScore: userStats?.[2] || BigInt(0),
        averageScore: userStats?.[3] || BigInt(0),
        winRate: userStats?.[4] || BigInt(0),
        currentStreak: userStats?.[5] || BigInt(0),
        bestStreak: userStats?.[6] || BigInt(0),
        lastActiveCycle: userStats?.[7] || BigInt(0),
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  // Check if cycle is active
  async isCycleActive(cycleId: bigint): Promise<boolean> {
    try {
      const cycleInfo = await this.getCurrentCycleInfo();
      return cycleInfo.state === 1; // 1 = Active
    } catch (error) {
      console.error('Error checking cycle status:', error);
      return false;
    }
  }

  // Get total slip count
  async getTotalSlipCount(): Promise<bigint> {
    try {
      const result = await this.publicClient.readContract({
        address: CONTRACTS.ODDYSSEY.address,
        abi: CONTRACTS.ODDYSSEY.abi,
        functionName: 'slipCount',
      });
      return result as bigint;
    } catch (error) {
      console.error('Error getting total slip count:', error);
      throw error;
    }
  }

  // Get all user slips (for all cycles)
  async getUserSlips(userAddress: Address): Promise<{ success: boolean; data: OddysseySlip[] }> {
    try {
      const totalSlips = await this.getTotalSlipCount();
      const allSlips: OddysseySlip[] = [];

      // Get all slips and filter by user
      for (let i = 0; i < Number(totalSlips); i++) {
        try {
          const slipResult = await this.getSlip(BigInt(i));
          if (slipResult.success && slipResult.data && slipResult.data.player.toLowerCase() === userAddress.toLowerCase()) {
            allSlips.push(slipResult.data);
          }
        } catch (error) {
          // Skip invalid slip IDs
          continue;
        }
      }

      return {
        success: true,
        data: allSlips
      };
    } catch (error) {
      console.error('Error getting user slips:', error);
      return {
        success: false,
        data: []
      };
    }
  }

  // Get current prize pool (contract-only)
  async getCurrentPrizePool(): Promise<{ success: boolean; data: any }> {
    try {
      const cycleInfo = await this.getCurrentCycleInfo();
      
      return {
        success: true,
        data: {
          cycleId: Number(cycleInfo.cycleId),
          prizePool: formatEther(cycleInfo.prizePool),
          formattedPrizePool: `${formatEther(cycleInfo.prizePool)} STT`,
          matchesCount: 10, // Fixed for Oddyssey
          isActive: cycleInfo.state === 1
        }
      };
    } catch (error) {
      console.error('Error getting current prize pool:', error);
      return {
        success: false,
        data: null
      };
    }
  }

  // Get stats (contract-only)
  async getStats(type: 'global' | 'user', userAddress?: Address): Promise<{ success: boolean; data: any }> {
    try {
      if (type === 'global') {
        const globalStats = await this.getGlobalStats();
        // Get current cycle info for additional stats
        const cycleInfo = await this.getCurrentCycleInfo();
        const currentCycleId = Number(cycleInfo.cycleId);
        
        return {
          success: true,
          data: {
            totalPlayers: globalStats.totalUsers || 0, // Use actual user count from contract
            totalSlips: globalStats.totalSlips || 0,
            avgPrizePool: Number(globalStats.totalVolume) / 1e18 || 0, // Current cycle volume
            totalCycles: currentCycleId || 0, // Use current cycle ID as total cycles
            activeCycles: cycleInfo.state === 1 ? 1 : 0, // Active if state is 1 (Active)
            avgCorrect: globalStats.averageScore / 100 || 0, // Convert from contract format
            winRate: globalStats.totalSlips > 0 ? (globalStats.totalWinners / globalStats.totalSlips) * 100 : 0,
            totalVolume: Number(globalStats.totalVolume) / 1e18 || 0, // Add total volume in STT
            maxScore: globalStats.maxScore / 100 || 0, // Convert from contract format
            minScore: globalStats.minScore / 100 || 0, // Convert from contract format
            totalWinners: globalStats.totalWinners || 0,
            correctPredictions: globalStats.correctPredictions || 0, // Added
            evaluatedSlips: globalStats.evaluatedSlips || 0, // Added
            evaluationProgress: globalStats.totalSlips > 0 ? (globalStats.evaluatedSlips / globalStats.totalSlips) * 100 : 0 // Added calculated field
          }
        };
      } else if (type === 'user' && userAddress) {
        const userStats = await this.getUserStats(userAddress);
        return {
          success: true,
          data: {
            totalSlips: Number(userStats.totalSlips),
            totalWins: Number(userStats.totalWins),
            bestScore: Number(userStats.bestScore),
            averageScore: Number(userStats.averageScore),
            winRate: Number(userStats.winRate),
            currentStreak: Number(userStats.currentStreak),
            bestStreak: Number(userStats.bestStreak),
            lastActiveCycle: Number(userStats.lastActiveCycle)
          }
        };
      }
      
      return {
        success: false,
        data: null
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        success: false,
        data: null
      };
    }
  }

  // Get matches with results from backend
  async getMatches(): Promise<{ success: boolean; data: any }> {
    try {
      // Use the new /api/oddyssey/results/all endpoint
      const resultsResponse = await fetch(`/api/oddyssey/results/all?t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!resultsResponse.ok) {
        throw new Error(`Results API responded with status: ${resultsResponse.status}`);
      }
      
      const resultsData = await resultsResponse.json();
      console.log('🔍 Results from /api/oddyssey/results/all:', resultsData);
      
      if (resultsData.success && resultsData.data?.cycles?.length > 0) {
        // Get the latest cycle's matches
        const latestCycle = resultsData.data.cycles[resultsData.data.cycles.length - 1];
        const matches = latestCycle.matches || [];
        
        console.log('✅ Retrieved matches from results/all:', matches.length);
        
        return {
          success: true,
          data: matches
        };
      } else {
        // Fallback to contract matches if no results available
        const matches = await this.getCurrentCycleMatches();
        return {
          success: true,
          data: matches
        };
      }
    } catch (error) {
      console.error('❌ Error getting matches from results/all, falling back to contract:', error);
      
      try {
        // Fallback to contract matches
        const matches = await this.getCurrentCycleMatches();
        return {
          success: true,
          data: matches
        };
      } catch (fallbackError) {
        console.error('❌ Error getting matches from contract:', fallbackError);
        return {
          success: false,
          data: []
        };
      }
    }
  }

  // Get cycle results from backend
  async getCycleResults(cycleId: number): Promise<{ success: boolean; data: any }> {
    try {
      console.log(`🔍 Fetching results for cycle ${cycleId}...`);
      
      // Try to get results for the specific cycle
      // First, try the /api/oddyssey/results/all endpoint to get all cycles
      const allResultsResponse = await fetch(`/api/oddyssey/results/all?t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (allResultsResponse.ok) {
        const allResultsData = await allResultsResponse.json();
        console.log('🔍 All results data:', allResultsData);
        
        if (allResultsData.success && allResultsData.data?.cycles?.length > 0) {
          // Find the specific cycle
          const targetCycle = allResultsData.data.cycles.find((cycle: any) => 
            Number(cycle.cycleId) === Number(cycleId)
          );
          
          if (targetCycle) {
            console.log(`✅ Found cycle ${cycleId} results:`, targetCycle);
            return {
              success: true,
              data: {
                matches: (targetCycle.matches || []).map((match: any, index: number) => ({
                  id: match.id,
                  display_order: index + 1,
                  home_team: match.homeTeam || '',
                  away_team: match.awayTeam || '',
                  league_name: match.league || '',
                  status: match.result?.moneyline !== undefined ? 'finished' : 'upcoming',
                  result: {
                    home_score: match.result?.home_score || null,
                    away_score: match.result?.away_score || null,
                    outcome_1x2: match.result?.moneyline === 1 ? '1' : match.result?.moneyline === 2 ? 'X' : match.result?.moneyline === 3 ? '2' : null,
                    outcome_ou25: match.result?.overUnder === 1 ? 'Over' : match.result?.overUnder === 2 ? 'Under' : null,
                    finished_at: match.result?.finished_at || null
                  }
                })),
                cycleId: targetCycle.cycleId,
                isResolved: targetCycle.isResolved || false,
                totalMatches: targetCycle.matchesCount || targetCycle.totalMatches || 0,
                finishedMatches: (targetCycle.matches || []).filter((match: any) => match.result?.moneyline !== undefined).length
              }
            };
          } else {
            console.log(`❌ Cycle ${cycleId} not found in results`);
            // Fallback to latest cycle
            const latestCycle = allResultsData.data.cycles[allResultsData.data.cycles.length - 1];
            if (latestCycle) {
              console.log(`🔄 Using latest cycle ${latestCycle.cycleId} as fallback`);
              return {
                success: true,
                data: {
                  matches: (latestCycle.matches || []).map((match: any, index: number) => ({
                    id: match.id,
                    display_order: index + 1,
                    home_team: match.homeTeam || '',
                    away_team: match.awayTeam || '',
                    league_name: match.league || '',
                    status: match.result?.moneyline !== undefined ? 'finished' : 'upcoming',
                    result: {
                      home_score: match.result?.home_score || null,
                      away_score: match.result?.away_score || null,
                      outcome_1x2: match.result?.moneyline === 1 ? '1' : match.result?.moneyline === 2 ? 'X' : match.result?.moneyline === 3 ? '2' : null,
                      outcome_ou25: match.result?.overUnder === 1 ? 'Over' : match.result?.overUnder === 2 ? 'Under' : null,
                      finished_at: match.result?.finished_at || null
                    }
                  })),
                  cycleId: latestCycle.cycleId,
                  isResolved: latestCycle.isResolved || false,
                  totalMatches: latestCycle.matchesCount || latestCycle.totalMatches || 0,
                  finishedMatches: (latestCycle.matches || []).filter((match: any) => match.result?.moneyline !== undefined).length
                }
              };
            }
          }
        }
      }
      
      // Fallback to date-based lookup
      console.log(`🔄 Falling back to date-based lookup for cycle ${cycleId}`);
      const response = await fetch(`/api/oddyssey/results/${new Date().toISOString().split('T')[0]}?t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          data: {
            matches: data.data?.matches || [],
            cycleId: data.data?.cycleId || cycleId,
            isResolved: data.data?.isResolved || false,
            totalMatches: data.data?.totalMatches || 0,
            finishedMatches: data.data?.finishedMatches || 0
          }
        };
      } else {
        throw new Error(`API responded with status: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error getting cycle results:', error);
      return {
        success: false,
        data: {
          matches: [],
          cycleId: cycleId,
          isResolved: false,
          totalMatches: 0,
          finishedMatches: 0
        }
      };
    }
  }

  // Get live slip evaluation
  async getLiveSlipEvaluation(slipId: number): Promise<{ success: boolean; data: any }> {
    try {
      const response = await fetch(`/api/live-slip-evaluation/${slipId}?t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      const data = await response.json();
      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Error getting live slip evaluation:', error);
      return {
        success: false,
        data: null
      };
    }
  }

  // Get user slips for cycle with live evaluation
  async getUserSlipsForCycleWithLiveEvaluation(userAddress: Address, cycleId: number): Promise<{ success: boolean; data: any }> {
    try {
      const response = await fetch(`/api/live-slip-evaluation/user/${userAddress}/cycle/${cycleId}?t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      const data = await response.json();
      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Error getting user cycle evaluation:', error);
      return {
        success: false,
        data: null
      };
    }
  }

  // Get specific slip details
  async getSlip(slipId: bigint): Promise<{ success: boolean; data: any }> {
    try {
      const response = await fetch(`/api/slips/${slipId}?t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      const data = await response.json();
      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Error getting slip details:', error);
      return {
        success: false,
        data: null
      };
    }
  }

  // Get available dates from backend
  async getAvailableDates(): Promise<{ success: boolean; data: string[] }> {
    try {
      // For now, return current date and yesterday
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return {
        success: true,
        data: [today, yesterday]
      };
    } catch (error) {
      console.error('Error getting available dates:', error);
      return {
        success: false,
        data: []
      };
    }
  }

  // Get results by date from backend
  async getResultsByDate(date: string): Promise<{ success: boolean; data: any }> {
    try {
      const response = await fetch(`https://bitredict-backend.fly.dev/api/oddyssey/results/${date}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        return {
          success: true,
          data: {
            matches: (data.data.matches || []).map((match: any, index: number) => ({
              id: match.id,
              display_order: index + 1,
              home_team: match.homeTeam || '',
              away_team: match.awayTeam || '',
              league_name: match.league || '',
              status: match.result?.moneyline !== undefined ? 'finished' : 'upcoming',
              result: {
                home_score: match.result?.home_score || null,
                away_score: match.result?.away_score || null,
                outcome_1x2: match.result?.moneyline === 1 ? '1' : match.result?.moneyline === 2 ? 'X' : match.result?.moneyline === 3 ? '2' : null,
                outcome_ou25: match.result?.overUnder === 1 ? 'Over' : match.result?.overUnder === 2 ? 'Under' : null,
                finished_at: match.result?.finished_at || null
              }
            })),
            cycleId: data.data.cycleId,
            isResolved: data.data.isResolved || false,
            totalMatches: data.data.matchesCount || data.data.totalMatches || 0,
            finishedMatches: (data.data.matches || []).filter((match: any) => match.result?.moneyline !== undefined).length
          }
        };
      }
      
      return {
        success: false,
        data: null
      };
    } catch (error) {
      console.error('Error getting results by date:', error);
      return {
        success: false,
        data: null
      };
    }
  }

  // Get leaderboard from backend
  async getLeaderboard(cycleId?: number): Promise<{ success: boolean; data: any }> {
    try {
      const url = cycleId 
        ? `https://bitredict-backend.fly.dev/api/oddyssey/leaderboard/${cycleId}`
        : 'https://bitredict-backend.fly.dev/api/oddyssey/leaderboard';
      const response = await fetch(url);
      const data = await response.json();
      return {
        success: true,
        data: data.data || { leaderboard: [], totalPlayers: 0, cycleId: null }
      };
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return {
        success: false,
        data: { leaderboard: [], totalPlayers: 0, cycleId: null }
      };
    }
  }

  // Check cycle sync status
  async checkCycleSync(): Promise<{ success: boolean; data: any }> {
    try {
      const response = await fetch('https://bitredict-backend.fly.dev/api/oddyssey/cycle-sync');
      const data = await response.json();
      return {
        success: true,
        data: data.data || null
      };
    } catch (error) {
      console.error('Error checking cycle sync:', error);
      return {
        success: false,
        data: null
      };
    }
  }

  // Get cycle stats
  async getCycleStats(): Promise<{ success: boolean; data: any }> {
    try {
      const response = await fetch('https://bitredict-backend.fly.dev/api/oddyssey/stats');
      const data = await response.json();
      return {
        success: true,
        data: data.data || null
      };
    } catch (error) {
      console.error('Error getting cycle stats:', error);
      return {
        success: false,
        data: null
      };
    }
  }

  // Get user slips for cycle from backend
  async getUserSlipsForCycleFromBackend(cycleId: number, address: string): Promise<{ success: boolean; data: any }> {
    try {
      const response = await fetch(`https://bitredict-backend.fly.dev/api/oddyssey/user-slips/${address}/${cycleId}`);
      const data = await response.json();
      return {
        success: true,
        data: data.data || []
      };
    } catch (error) {
      console.error('Error getting user slips for cycle:', error);
      return {
        success: false,
        data: []
      };
    }
  }
}

// Export singleton instance
export const oddysseyService = new OddysseyService();
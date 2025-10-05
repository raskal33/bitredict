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
  endTime: bigint;
  prizePool: bigint;
  slipCount: bigint;
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

  // Get current cycle info
  async getCurrentCycleInfo(): Promise<CycleInfo> {
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
        endTime,
        prizePool,
        slipCount
      };
    } catch (error) {
      console.error('Error getting current cycle info:', error);
      throw error;
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
      
      // Convert predictions to contract format
      const contractPredictions = predictions.map(pred => ({
        matchId: BigInt(pred.matchId),
        betType: ['1', 'X', '2'].includes(pred.prediction) ? 0 : 1, // 0=MONEYLINE, 1=OVER_UNDER
        selection: pred.prediction,
        selectedOdd: Math.floor(pred.odds * 1000), // Convert to contract format
        homeTeam: '', // Will be filled by contract
        awayTeam: '', // Will be filled by contract
        leagueName: '', // Will be filled by contract
      }));

      console.log('📝 Contract predictions:', contractPredictions);

      const hash = await this.walletClient.writeContract({
        address: CONTRACTS.ODDYSSEY.address,
        abi: CONTRACTS.ODDYSSEY.abi,
        functionName: 'placeSlip',
        args: [contractPredictions],
        value: parseEther('0.5'), // Entry fee
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
          const slip = await this.getSlip(slipId);
          console.log('🔍 Retrieved slip data for ID', slipId.toString(), ':', slip);
          slips.push(slip);
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
      console.log('🔍 Getting user slips with data for cycle:', cycleId.toString());
      
      const result = await this.publicClient.readContract({
        address: CONTRACTS.ODDYSSEY.address,
        abi: CONTRACTS.ODDYSSEY.abi,
        functionName: 'getUserSlipsWithData',
        args: [userAddress, cycleId],
      });

      console.log('🔍 Raw getUserSlipsWithData result:', result);
      console.log('🔍 Result type:', typeof result);
      console.log('🔍 Result length:', Array.isArray(result) ? result.length : 'not array');
      
      const [slipIds, slipsData] = result as [bigint[], any[]];
      
      console.log('🔍 Processed slip IDs:', slipIds);
      console.log('🔍 Processed slip IDs length:', slipIds.length);
      console.log('🔍 Processed slips data:', slipsData);
      console.log('🔍 Processed slips data length:', slipsData.length);
      
      return {
        slipIds,
        slipsData: slipsData.map(slip => this.processSlipData(slip))
      };
    } catch (error) {
      console.error('Error getting user slips with data:', error);
      throw error;
    }
  }

  // Get all user slips with evaluation data across ALL cycles
  async getAllUserSlipsWithDataFromContract(userAddress: Address): Promise<{
    slipIds: bigint[];
    slipsData: OddysseySlip[];
  }> {
    try {
      console.log('🔍 Getting ALL user slips with data across all cycles for:', userAddress);
      console.log('🔍 Contract address:', CONTRACTS.ODDYSSEY.address);
      
      // First, let's try to get the user's total slip count
      try {
        const slipCount = await this.publicClient.readContract({
          ...CONTRACTS.ODDYSSEY,
          functionName: 'getUserSlipCount',
          args: [userAddress],
        });
        console.log('🔍 User slip count from contract:', slipCount);
      } catch (countError) {
        console.log('⚠️ Could not get slip count:', countError);
      }
      
      // Also try to get all user slips directly
      try {
        const allUserSlips = await this.publicClient.readContract({
          ...CONTRACTS.ODDYSSEY,
          functionName: 'getUserSlips',
          args: [userAddress],
        });
        console.log('🔍 All user slips from contract:', allUserSlips);
      } catch (allSlipsError) {
        console.log('⚠️ Could not get all user slips:', allSlipsError);
      }
      
      // Try the getUserSlipsByStatus function
      try {
        const result = await this.publicClient.readContract({
          ...CONTRACTS.ODDYSSEY,
          functionName: 'getUserSlipsByStatus',
          args: [userAddress, false], // false = get both evaluated and non-evaluated slips
        });

        console.log('🔍 Raw getUserSlipsByStatus result:', result);
        
        const [slipIds, rawSlipsData] = result as [bigint[], any[]];
        
        console.log(`🔍 Found ${slipIds.length} total slips across all cycles`);
        console.log('🔍 Slip IDs:', slipIds);
        console.log('🔍 Raw slips data:', rawSlipsData);
        
        // Process the slip data
        const slipsData: OddysseySlip[] = rawSlipsData.map(rawSlip => this.processSlipData(rawSlip));
        
        return {
          slipIds: slipIds,
          slipsData: slipsData
        };
      } catch (statusError) {
        console.log('⚠️ getUserSlipsByStatus failed, trying alternative approach:', statusError);
        
        // Fallback: try to get slips from individual cycles
        const currentCycle = await this.getCurrentCycle();
        console.log('🔍 Current cycle:', currentCycle.toString());
        
        const allSlipIds: bigint[] = [];
        const allSlipsData: OddysseySlip[] = [];
        
        // Check cycles from 0 to current cycle (inclusive)
        for (let cycleId = 0; cycleId <= Number(currentCycle); cycleId++) {
          try {
            console.log(`🔍 Checking cycle ${cycleId} for user slips...`);
            const cycleSlipsData = await this.getUserSlipsWithDataFromContract(userAddress, BigInt(cycleId));
            
            if (cycleSlipsData.slipIds.length > 0) {
              console.log(`✅ Found ${cycleSlipsData.slipIds.length} slips in cycle ${cycleId}`);
              allSlipIds.push(...cycleSlipsData.slipIds);
              allSlipsData.push(...cycleSlipsData.slipsData);
            } else {
              console.log(`⚠️ No slips found in cycle ${cycleId}`);
            }
          } catch (error) {
            console.log(`⚠️ Error checking cycle ${cycleId}:`, error);
            continue;
          }
        }
        
        console.log(`🔍 Total slips found across all cycles: ${allSlipIds.length}`);
        
        return {
          slipIds: allSlipIds,
          slipsData: allSlipsData
        };
      }
    } catch (error) {
      console.error('Error getting all user slips with data:', error);
      throw error;
    }
  }

  // Get only evaluated (past/resolved) user slips
  async getEvaluatedUserSlipsFromContract(userAddress: Address): Promise<{
    slipIds: bigint[];
    slipsData: OddysseySlip[];
  }> {
    try {
      console.log('🔍 Getting evaluated (past) user slips for:', userAddress);
      
      const result = await this.publicClient.readContract({
        ...CONTRACTS.ODDYSSEY,
        functionName: 'getUserSlipsByStatus',
        args: [userAddress, true], // true = get only evaluated slips
      });

      console.log('🔍 Raw evaluated slips result:', result);
      
      const [slipIds, rawSlipsData] = result as [bigint[], any[]];
      
      console.log(`🔍 Found ${slipIds.length} evaluated slips`);
      
      // Process the slip data
      const slipsData: OddysseySlip[] = rawSlipsData.map(rawSlip => this.processSlipData(rawSlip));
      
      return {
        slipIds: slipIds,
        slipsData: slipsData
      };
    } catch (error) {
      console.error('Error getting evaluated user slips:', error);
      throw error;
    }
  }

  // Process slip data from contract response
  private processSlipData(rawSlip: any): OddysseySlip {
    return {
      player: rawSlip.player,
      cycleId: Number(rawSlip.cycleId),
      placedAt: Number(rawSlip.placedAt),
      predictions: rawSlip.predictions.map((pred: any) => ({
        matchId: Number(pred.matchId),
        betType: Number(pred.betType),
        selection: pred.selection,
        selectedOdd: Number(pred.selectedOdd),
        homeTeam: pred.homeTeam,
        awayTeam: pred.awayTeam,
        leagueName: pred.leagueName
      })),
      finalScore: Number(rawSlip.finalScore),
      correctCount: Number(rawSlip.correctCount),
      isEvaluated: rawSlip.isEvaluated
    };
  }

  // Get slip by ID
  async getSlip(slipId: bigint): Promise<OddysseySlip> {
    try {
      const result = await this.publicClient.readContract({
        address: CONTRACTS.ODDYSSEY.address,
        abi: CONTRACTS.ODDYSSEY.abi,
        functionName: 'getSlip',
        args: [slipId],
      });

      console.log('🔍 Raw slip result from getSlip:', result);
      console.log('🔍 Result type:', typeof result);
      console.log('🔍 Result is array:', Array.isArray(result));
      
      // Contract returns a Slip struct, not an array
      const slip = result as any;
      console.log('🔍 Slip.player:', slip.player);
      console.log('🔍 Slip.cycleId:', slip.cycleId);
      console.log('🔍 Slip.placedAt:', slip.placedAt);
      console.log('🔍 Slip.predictions:', slip.predictions);
      console.log('🔍 Slip.finalScore:', slip.finalScore);
      console.log('🔍 Slip.correctCount:', slip.correctCount);
      console.log('🔍 Slip.isEvaluated:', slip.isEvaluated);
      
      return {
        player: slip.player,
        cycleId: slip.cycleId,
        placedAt: slip.placedAt,
        predictions: Array.isArray(slip.predictions) ? slip.predictions.map((pred: any) => ({
          matchId: pred.matchId,
          betType: pred.betType,
          selection: pred.selection,
          selectedOdd: Number(pred.selectedOdd) / 1000, // Convert from contract format
          homeTeam: pred.homeTeam,
          awayTeam: pred.awayTeam,
          leagueName: pred.leagueName,
        })) : [],
        finalScore: slip.finalScore,
        correctCount: slip.correctCount,
        isEvaluated: slip.isEvaluated,
      };
    } catch (error) {
      console.error('Error getting slip:', error);
      throw error;
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

  // Get global stats
  async getGlobalStats(): Promise<{
    totalVolume: bigint;
    totalSlips: number;
    highestOdd: bigint;
  }> {
    try {
      const result = await this.publicClient.readContract({
        address: CONTRACTS.ODDYSSEY.address,
        abi: CONTRACTS.ODDYSSEY.abi,
        functionName: 'stats',
      });

      const stats = result as any[];
      return {
        totalVolume: stats[0],
        totalSlips: stats[1],
        highestOdd: stats[2],
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
          const slip = await this.getSlip(BigInt(i));
          if (slip.player.toLowerCase() === userAddress.toLowerCase()) {
            allSlips.push(slip);
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
            totalPlayers: Number(globalStats.totalSlips) || 0, // Use total slips as proxy for players (each slip = 1 player)
            totalSlips: Number(globalStats.totalSlips) || 0,
            avgPrizePool: Number(globalStats.totalVolume) / 1e18 / Math.max(currentCycleId, 1) || 0, // Estimate from total volume
            totalCycles: currentCycleId || 0, // Use current cycle ID as total cycles
            activeCycles: cycleInfo.state === 1 ? 1 : 0, // Active if state is 1 (Active)
            avgCorrect: 0, // Not available in current contract
            winRate: 0, // Not available in current contract
            totalVolume: Number(globalStats.totalVolume) / 1e18 || 0, // Add total volume in STT
            highestOdd: Number(globalStats.highestOdd) / 1000 || 0 // Add highest odd achieved
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

  // Get matches (contract-only)
  async getMatches(): Promise<{ success: boolean; data: any }> {
    try {
      const matches = await this.getCurrentCycleMatches();
      return {
        success: true,
        data: matches
      };
    } catch (error) {
      console.error('Error getting matches:', error);
      return {
        success: false,
        data: []
      };
    }
  }

  // Get cycle results from backend
  async getCycleResults(cycleId: number): Promise<{ success: boolean; data: any }> {
    try {
      // For now, use date-based lookup since backend expects date
      // TODO: Update backend to support cycle ID lookup
      const response = await fetch(`https://bitredict-backend.fly.dev/api/oddyssey/results/${new Date().toISOString().split('T')[0]}`);
      const data = await response.json();
      return {
        success: true,
        data: data.data || []
      };
    } catch (error) {
      console.error('Error getting cycle results:', error);
      return {
        success: false,
        data: []
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
      return {
        success: true,
        data: data.data || null
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
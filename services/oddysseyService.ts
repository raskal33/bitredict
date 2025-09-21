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
}

export interface OddysseySlip {
  player: Address;
  cycleId: bigint;
  placedAt: bigint;
  predictions: UserPrediction[];
  finalScore: bigint;
  correctCount: bigint;
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

class OddysseyService {
  private publicClient: PublicClient;
  private walletClient: WalletClient | null = null;

  constructor() {
    this.publicClient = createPublicClient({
      chain: somniaTestnet,
      transport: http(),
    });
  }

  setWalletClient(walletClient: WalletClient) {
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
      return result as bigint;
    } catch (error) {
      console.error('Error getting current cycle:', error);
      throw error;
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

  // Get current cycle matches
  async getCurrentCycleMatches(): Promise<OddysseyMatch[]> {
    try {
      const cycleId = await this.getCurrentCycle();
      const result = await this.publicClient.readContract({
        address: CONTRACTS.ODDYSSEY.address,
        abi: CONTRACTS.ODDYSSEY.abi,
        functionName: 'getDailyMatches',
        args: [cycleId],
      });

      return (result as any[]).map((match) => ({
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
    } catch (error) {
      console.error('Error getting current cycle matches:', error);
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
    if (!this.walletClient) {
      throw new Error('Wallet client not set');
    }

    try {
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

      const hash = await this.walletClient.writeContract({
        address: CONTRACTS.ODDYSSEY.address,
        abi: CONTRACTS.ODDYSSEY.abi,
        functionName: 'placeSlip',
        args: [contractPredictions],
        value: parseEther('0.5'), // Entry fee
        chain: somniaTestnet,
        account: this.walletClient.account!,
      });

      return hash;
    } catch (error) {
      console.error('Error placing slip:', error);
      throw error;
    }
  }

  // Get user slips for current cycle
  async getUserSlipsForCycle(userAddress: Address, cycleId: bigint): Promise<OddysseySlip[]> {
    try {
      const result = await this.publicClient.readContract({
        address: CONTRACTS.ODDYSSEY.address,
        abi: CONTRACTS.ODDYSSEY.abi,
        functionName: 'getUserSlipsForCycle',
        args: [userAddress, cycleId],
      });

      const slips = result as any[];
      return slips.map(slip => ({
        player: slip[0],
        cycleId: slip[1],
        placedAt: slip[2],
        predictions: slip[3].map((pred: any) => ({
          matchId: pred[0],
          betType: pred[1],
          selection: pred[2],
          selectedOdd: Number(pred[3]) / 1000, // Convert from contract format
          homeTeam: pred[4],
          awayTeam: pred[5],
          leagueName: pred[6],
        })),
        finalScore: slip[4],
        correctCount: slip[5],
        isEvaluated: slip[6],
      }));
    } catch (error) {
      console.error('Error getting user slips:', error);
      throw error;
    }
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

      const slip = result as any[];
      return {
        player: slip[0],
        cycleId: slip[1],
        placedAt: slip[2],
        predictions: slip[3].map((pred: any) => ({
          matchId: pred[0],
          betType: pred[1],
          selection: pred[2],
          selectedOdd: Number(pred[3]) / 1000, // Convert from contract format
          homeTeam: pred[4],
          awayTeam: pred[5],
          leagueName: pred[6],
        })),
        finalScore: slip[4],
        correctCount: slip[5],
        isEvaluated: slip[6],
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

      return {
        totalSlips: userStats[0],
        totalWins: userStats[1],
        bestScore: userStats[2],
        averageScore: userStats[3],
        winRate: userStats[4],
        currentStreak: userStats[5],
        bestStreak: userStats[6],
        lastActiveCycle: userStats[7],
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
            totalPlayers: 0, // Not available in current contract - would need separate tracking
            totalSlips: Number(globalStats.totalSlips) || 0,
            avgPrizePool: Number(globalStats.totalVolume) / 1e18 / Math.max(currentCycleId, 1) || 0, // Estimate from total volume
            totalCycles: currentCycleId || 0, // Use current cycle ID as total cycles
            activeCycles: cycleInfo.state === 1 ? 1 : 0, // Active if state is 1 (Active)
            avgCorrect: 0, // Not available in current contract
            winRate: 0 // Not available in current contract
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
}

// Export singleton instance
export const oddysseyService = new OddysseyService();
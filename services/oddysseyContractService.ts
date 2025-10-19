import { ethers } from 'ethers';
// Contract addresses - using deployed contract address
const CONTRACT_ADDRESSES = {
  ODDYSSEY: '0x70D7D101641c72b8254Ab45Ff2a5CED9b0ad0E75' // Deployed Oddyssey contract
};

// Contract ABI for Oddyssey contract
const ODDYSSEY_ABI = [
  "function getAllUserSlips(address _user) external view returns (uint256[] memory)",
  "function getAllUserSlipsWithData(address _user) external view returns (uint256[] memory slipIds, tuple(address player, uint256 cycleId, uint256 placedAt, tuple(uint64 matchId, uint8 betType, string selection, uint32 selectedOdd, string homeTeam, string awayTeam, string leagueName)[10] predictions, uint256 finalScore, uint8 correctCount, bool isEvaluated)[] slipsData)",
  "function getUserData(address _user) external view returns (tuple(uint256 totalSlips, uint256 totalWins, uint256 bestScore, uint256 averageScore, uint256 winRate, uint256 currentStreak, uint256 bestStreak, uint256 lastActiveCycle) userStatsData, uint256 reputation, uint256 correctPredictions)",
  "function getCurrentCycleInfo() external view returns (uint256 cycleId, uint8 state, uint256 endTime, uint256 prizePool, uint32 cycleSlipCount)",
  "function getDailyStats(uint256 _cycleId) external view returns (tuple(uint256 slipCount, uint256 userCount, uint256 volume, uint256 correctPredictions, uint256 evaluatedSlips, uint256 averageScore, uint256 maxScore, uint256 minScore, uint256 winnersCount))",
  "function getPlatformDailyStats() external view returns (uint256 totalCycles, uint256 totalSlips, uint256 totalUsers, uint256 totalVolume, uint256 totalCorrectPredictions, uint256 totalEvaluatedSlips, uint256 totalWinners, uint256 averageScore, uint256 maxScore, uint256 minScore)",
  "function getCurrentCycle() external view returns (uint256)",
  "function getSlip(uint256 _slipId) external view returns (tuple(address player, uint256 cycleId, uint256 placedAt, tuple(uint64 matchId, uint8 betType, string selection, uint32 selectedOdd, string homeTeam, string awayTeam, string leagueName)[10] predictions, uint256 finalScore, uint8 correctCount, bool isEvaluated))",
  "function getDailyMatches(uint256 _cycleId) external view returns (tuple(uint64 id, uint64 startTime, uint32 oddsHome, uint32 oddsDraw, uint32 oddsAway, uint32 oddsOver, uint32 oddsUnder, string homeTeam, string awayTeam, string leagueName, tuple(uint8 moneyline, uint8 overUnder) result)[10])",
  "function getDailyLeaderboard(uint256 _cycleId) external view returns (tuple(address player, uint256 slipId, uint256 finalScore, uint8 correctCount)[5])"
];

// Type definitions
export interface UserPrediction {
  matchId: number;
  betType: number;
  selection: string;
  selectedOdd: number;
  homeTeam: string;
  awayTeam: string;
  leagueName: string;
}

export interface Slip {
  player: string;
  cycleId: number;
  placedAt: number;
  predictions: UserPrediction[];
  finalScore: number;
  correctCount: number;
  isEvaluated: boolean;
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

export interface UserData {
  userStats: UserStats;
  reputation: number;
  correctPredictions: number;
}

export interface DailyStats {
  slipCount: number;
  userCount: number;
  volume: number;
  correctPredictions: number;
  evaluatedSlips: number;
  averageScore: number;
  maxScore: number;
  minScore: number;
  winnersCount: number;
}

export interface CycleInfo {
  cycleId: number;
  state: number;
  endTime: number;
  prizePool: number;
  cycleSlipCount: number;
}

export interface Match {
  id: number;
  startTime: number;
  oddsHome: number;
  oddsDraw: number;
  oddsAway: number;
  oddsOver: number;
  oddsUnder: number;
  homeTeam: string;
  awayTeam: string;
  leagueName: string;
  result: {
    moneyline: number;
    overUnder: number;
  };
}

export interface LeaderboardEntry {
  player: string;
  slipId: number;
  finalScore: number;
  correctCount: number;
}

export interface PlatformStats {
  totalCycles: number;
  totalSlips: number;
  totalUsers: number;
  totalVolume: number;
  totalCorrectPredictions: number;
  totalEvaluatedSlips: number;
  totalWinners: number;
  averageScore: number;
  maxScore: number;
  minScore: number;
}

export class OddysseyContractService {
  private static contract: ethers.Contract | null = null;
  private static provider: ethers.Provider | null = null;

  private static async getContract(): Promise<ethers.Contract> {
    if (!this.contract) {
      if (typeof window !== 'undefined' && window.ethereum) {
        this.provider = new ethers.BrowserProvider(window.ethereum);
      } else {
        this.provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
      }
      
      this.contract = new ethers.Contract(
        CONTRACT_ADDRESSES.ODDYSSEY,
        ODDYSSEY_ABI,
        this.provider
      );
    }
    return this.contract;
  }

  // ===== USER SLIP FUNCTIONS =====

  public static async getAllUserSlips(userAddress: string): Promise<number[]> {
    try {
      const contract = await this.getContract();
      const slipIds = await contract.getAllUserSlips(userAddress);
      return slipIds.map((id: any) => Number(id));
    } catch (error) {
      console.error('Error fetching all user slips:', error);
      return [];
    }
  }

  public static async getAllUserSlipsWithData(userAddress: string): Promise<{
    slipIds: number[];
    slipsData: Slip[];
  }> {
    try {
      const contract = await this.getContract();
      const result = await contract.getAllUserSlipsWithData(userAddress);
      
      return {
        slipIds: result.slipIds.map((id: any) => Number(id)),
        slipsData: result.slipsData.map((slip: any) => this.parseSlip(slip))
      };
    } catch (error) {
      console.error('Error fetching all user slips with data:', error);
      return { slipIds: [], slipsData: [] };
    }
  }

  // ===== USER DATA FUNCTIONS =====

  public static async getUserData(userAddress: string): Promise<UserData> {
    try {
      const contract = await this.getContract();
      const result = await contract.getUserData(userAddress);

    return {
        userStats: {
          totalSlips: Number(result.userStatsData.totalSlips),
          totalWins: Number(result.userStatsData.totalWins),
          bestScore: Number(result.userStatsData.bestScore),
          averageScore: Number(result.userStatsData.averageScore),
          winRate: Number(result.userStatsData.winRate),
          currentStreak: Number(result.userStatsData.currentStreak),
          bestStreak: Number(result.userStatsData.bestStreak),
          lastActiveCycle: Number(result.userStatsData.lastActiveCycle)
        },
        reputation: Number(result.reputation),
        correctPredictions: Number(result.correctPredictions)
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
      return {
        userStats: {
          totalSlips: 0,
          totalWins: 0,
          bestScore: 0,
          averageScore: 0,
          winRate: 0,
          currentStreak: 0,
          bestStreak: 0,
          lastActiveCycle: 0
        },
        reputation: 0,
        correctPredictions: 0
      };
    }
  }

  // ===== CYCLE FUNCTIONS =====

  public static async getCurrentCycleInfo(): Promise<CycleInfo> {
    try {
      const contract = await this.getContract();
      const result = await contract.getCurrentCycleInfo();
      
      return {
        cycleId: Number(result.cycleId),
        state: Number(result.state),
        endTime: Number(result.endTime),
        prizePool: Number(result.prizePool),
        cycleSlipCount: Number(result.cycleSlipCount)
      };
    } catch (error) {
      console.error('Error fetching current cycle info:', error);
      return {
        cycleId: 0,
        state: 0,
        endTime: 0,
        prizePool: 0,
        cycleSlipCount: 0
      };
    }
  }

  public static async getCurrentCycle(): Promise<number> {
    try {
      const contract = await this.getContract();
      const cycleId = await contract.getCurrentCycle();
      return Number(cycleId);
    } catch (error) {
      console.error('Error fetching current cycle:', error);
      return 0;
    }
  }

  // ===== STATISTICS FUNCTIONS =====

  public static async getDailyStats(cycleId: number): Promise<DailyStats> {
    try {
      const contract = await this.getContract();
      const stats = await contract.getDailyStats(cycleId);
      
      return {
        slipCount: Number(stats.slipCount),
        userCount: Number(stats.userCount),
        volume: Number(stats.volume),
        correctPredictions: Number(stats.correctPredictions),
        evaluatedSlips: Number(stats.evaluatedSlips),
        averageScore: Number(stats.averageScore),
        maxScore: Number(stats.maxScore),
        minScore: Number(stats.minScore),
        winnersCount: Number(stats.winnersCount)
      };
    } catch (error) {
      console.error('Error fetching daily stats:', error);
      return {
        slipCount: 0,
        userCount: 0,
        volume: 0,
        correctPredictions: 0,
        evaluatedSlips: 0,
        averageScore: 0,
        maxScore: 0,
        minScore: 0,
        winnersCount: 0
      };
    }
  }

  public static async getPlatformDailyStats(): Promise<PlatformStats> {
    try {
      const contract = await this.getContract();
      const stats = await contract.getPlatformDailyStats();
      
      return {
        totalCycles: Number(stats.totalCycles),
        totalSlips: Number(stats.totalSlips),
        totalUsers: Number(stats.totalUsers),
        totalVolume: Number(stats.totalVolume),
        totalCorrectPredictions: Number(stats.totalCorrectPredictions),
        totalEvaluatedSlips: Number(stats.totalEvaluatedSlips),
        totalWinners: Number(stats.totalWinners),
        averageScore: Number(stats.averageScore),
        maxScore: Number(stats.maxScore),
        minScore: Number(stats.minScore)
      };
    } catch (error) {
      console.error('Error fetching platform daily stats:', error);
      return {
        totalCycles: 0,
        totalSlips: 0,
        totalUsers: 0,
        totalVolume: 0,
        totalCorrectPredictions: 0,
        totalEvaluatedSlips: 0,
        totalWinners: 0,
        averageScore: 0,
        maxScore: 0,
        minScore: 0
      };
    }
  }


  // ===== MATCH FUNCTIONS =====

  public static async getDailyMatches(cycleId: number): Promise<Match[]> {
    try {
      const contract = await this.getContract();
      const matches = await contract.getDailyMatches(cycleId);
      return matches.map((match: any) => this.parseMatch(match));
    } catch (error) {
      console.error('Error fetching daily matches:', error);
      return [];
    }
  }

  public static async getDailyLeaderboard(cycleId: number): Promise<LeaderboardEntry[]> {
    try {
      const contract = await this.getContract();
      const leaderboard = await contract.getDailyLeaderboard(cycleId);
      return leaderboard.map((entry: any) => ({
        player: entry.player,
        slipId: Number(entry.slipId),
        finalScore: Number(entry.finalScore),
        correctCount: Number(entry.correctCount)
      }));
        } catch (error) {
      console.error('Error fetching daily leaderboard:', error);
      return [];
    }
  }

  // ===== HELPER FUNCTIONS =====

  private static parseSlip(slip: any): Slip {
    return {
      player: slip.player,
      cycleId: Number(slip.cycleId),
      placedAt: Number(slip.placedAt),
      predictions: slip.predictions.map((pred: any) => ({
        matchId: Number(pred.matchId),
        betType: Number(pred.betType),
        selection: pred.selection,
        selectedOdd: Number(pred.selectedOdd),
        homeTeam: pred.homeTeam,
        awayTeam: pred.awayTeam,
        leagueName: pred.leagueName
      })),
      finalScore: Number(slip.finalScore),
      correctCount: Number(slip.correctCount),
      isEvaluated: slip.isEvaluated
    };
  }

  private static parseMatch(match: any): Match {
    return {
      id: Number(match.id),
      startTime: Number(match.startTime),
      oddsHome: Number(match.oddsHome),
      oddsDraw: Number(match.oddsDraw),
      oddsAway: Number(match.oddsAway),
      oddsOver: Number(match.oddsOver),
      oddsUnder: Number(match.oddsUnder),
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      leagueName: match.leagueName,
      result: {
        moneyline: Number(match.result.moneyline),
        overUnder: Number(match.result.overUnder)
      }
    };
  }

  // ===== SLIP FUNCTIONS =====

  public static async getSlip(slipId: number): Promise<Slip | null> {
    try {
      const contract = await this.getContract();
      const slip = await contract.getSlip(slipId);
      
      return {
        player: slip.player,
        cycleId: Number(slip.cycleId),
        placedAt: Number(slip.placedAt),
        predictions: slip.predictions.map((pred: any) => ({
          matchId: Number(pred.matchId),
          betType: Number(pred.betType),
          selection: pred.selection,
          selectedOdd: Number(pred.selectedOdd),
          homeTeam: pred.homeTeam,
          awayTeam: pred.awayTeam,
          leagueName: pred.leagueName
        })),
        finalScore: Number(slip.finalScore),
        correctCount: Number(slip.correctCount),
        isEvaluated: slip.isEvaluated
      };
    } catch (error) {
      console.error('Error fetching slip:', error);
      return null;
    }
  }

  // ===== PRIZE CLAIMING FUNCTIONS =====

  public static async claimPrize(cycleId: number, slipId: number): Promise<{ success: boolean; prizeAmount?: number; transactionHash?: string; error?: string }> {
    try {
      console.log('🏆 Claiming Oddyssey prize:', { cycleId, slipId });
      
      const contract = await this.getContract();
      
      // Call the contract's claimPrize function
      const tx = await contract.claimPrize(cycleId, slipId);
      console.log('📝 Transaction submitted:', tx.hash);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed:', receipt.transactionHash);
      
      // Extract prize amount from events
      let prizeAmount = 0;
      if (receipt.logs) {
        for (const log of receipt.logs) {
          try {
            const parsedLog = contract.interface.parseLog(log);
            if (parsedLog && parsedLog.name === 'PrizeClaimed') {
              prizeAmount = Number(parsedLog.args.userShare || 0);
              break;
            }
          } catch (e) {
            // Continue searching for the event
          }
        }
      }
      
      return {
        success: true,
        transactionHash: receipt.transactionHash,
        prizeAmount: prizeAmount
      };
    } catch (error: any) {
      console.error('❌ Error claiming prize:', error);
      
      // Handle specific error cases
      let errorMessage = 'Failed to claim prize';
      
      if (error.message) {
        if (error.message.includes('Slip does not belong to you')) {
          errorMessage = 'This slip does not belong to you';
        } else if (error.message.includes('Slip has not been evaluated yet')) {
          errorMessage = 'Slip has not been evaluated yet';
        } else if (error.message.includes('Player not found on leaderboard')) {
          errorMessage = 'You are not on the leaderboard for this cycle';
        } else if (error.message.includes('Prize already claimed')) {
          errorMessage = 'Prize already claimed';
        } else if (error.message.includes('Invalid cycle ID')) {
          errorMessage = 'Invalid cycle ID';
        } else if (error.message.includes('InvalidTiming')) {
          errorMessage = 'Prize claiming is not yet available';
        } else if (error.message.includes('InvalidState')) {
          errorMessage = 'Cycle is not in the correct state for claiming';
        } else if (error.message.includes('user rejected')) {
          errorMessage = 'Transaction was rejected by user';
        } else {
          errorMessage = error.message;
        }
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }
}
import { ethers } from 'ethers';

// Contract addresses - using deployed contract address
const CONTRACT_ADDRESSES = {
  ODDYSSEY: '0x70D7D101641c72b8254Ab45Ff2a5CED9b0ad0E75' // Deployed Oddyssey contract
};

// Contract ABI for Oddyssey contract daily stats functions
const ODDYSSEY_ABI = [
  "function getDailyStats(uint256 _cycleId) external view returns (tuple(uint256 slipCount, uint256 userCount, uint256 volume, uint256 correctPredictions, uint256 evaluatedSlips, uint256 averageScore, uint256 maxScore, uint256 minScore, uint256 winnersCount))",
  "function getCurrentCycleInfo() external view returns (tuple(uint256 cycleId, uint256 startTime, uint256 endTime, bool isActive, uint256 prizePool, uint256 participantCount))",
  "function getPlatformDailyStats() external view returns (uint256 totalCycles, uint256 totalSlips, uint256 totalUsers, uint256 totalVolume, uint256 totalCorrectPredictions, uint256 totalEvaluatedSlips, uint256 totalWinners, uint256 averageScore, uint256 maxScore, uint256 minScore)"
];

export interface DailyStats {
  slipCount: bigint;
  userCount: bigint;
  volume: bigint;
  correctPredictions: bigint;
  evaluatedSlips: bigint;
  averageScore: bigint;
  maxScore: bigint;
  minScore: bigint;
  winnersCount: bigint;
}

export interface CycleInfo {
  cycleId: bigint;
  startTime: bigint;
  endTime: bigint;
  isActive: boolean;
  prizePool: bigint;
  participantCount: bigint;
}

export interface PlatformDailyStats {
  totalCycles: bigint;
  totalSlips: bigint;
  totalUsers: bigint;
  totalVolume: bigint;
  totalCorrectPredictions: bigint;
  totalEvaluatedSlips: bigint;
  totalWinners: bigint;
  averageScore: bigint;
  maxScore: bigint;
  minScore: bigint;
}

export class DailyStatsService {
  private static provider: ethers.BrowserProvider | ethers.JsonRpcProvider;
  private static oddysseyContract: ethers.Contract;

  public static initialize(provider: ethers.BrowserProvider | ethers.JsonRpcProvider) {
    this.provider = provider;
    this.oddysseyContract = new ethers.Contract(CONTRACT_ADDRESSES.ODDYSSEY, ODDYSSEY_ABI, provider);
  }

  public static async getDailyStats(cycleId: number): Promise<DailyStats> {
    try {
      const result = await this.oddysseyContract.getDailyStats(cycleId);
      return {
        slipCount: result.slipCount,
        userCount: result.userCount,
        volume: result.volume,
        correctPredictions: result.correctPredictions,
        evaluatedSlips: result.evaluatedSlips,
        averageScore: result.averageScore,
        maxScore: result.maxScore,
        minScore: result.minScore,
        winnersCount: result.winnersCount
      };
    } catch (error) {
      console.error('Error fetching daily stats:', error);
      throw error;
    }
  }

  public static async getCurrentCycleInfo(): Promise<CycleInfo> {
    try {
      const result = await this.oddysseyContract.getCurrentCycleInfo();
      return {
        cycleId: result.cycleId,
        startTime: result.startTime,
        endTime: result.endTime,
        isActive: result.isActive,
        prizePool: result.prizePool,
        participantCount: result.participantCount
      };
    } catch (error) {
      console.error('Error fetching current cycle info:', error);
      throw error;
    }
  }

  public static async getPlatformDailyStats(): Promise<PlatformDailyStats> {
    try {
      const result = await this.oddysseyContract.getPlatformDailyStats();
      return {
        totalCycles: result.totalCycles,
        totalSlips: result.totalSlips,
        totalUsers: result.totalUsers,
        totalVolume: result.totalVolume,
        totalCorrectPredictions: result.totalCorrectPredictions,
        totalEvaluatedSlips: result.totalEvaluatedSlips,
        totalWinners: result.totalWinners,
        averageScore: result.averageScore,
        maxScore: result.maxScore,
        minScore: result.minScore
      };
    } catch (error) {
      console.error('Error fetching platform daily stats:', error);
      throw error;
    }
  }

  // Helper method to format daily stats for display
  public static formatDailyStatsForDisplay(dailyStats: DailyStats, cycleInfo: CycleInfo): {
    averagePrizePool: string;
    totalPlayers: string;
    winRate: string;
    averageOdds: string;
  } {
    // Calculate average prize pool per cycle
    const averagePrizePool = cycleInfo.prizePool > 0n 
      ? Number(cycleInfo.prizePool) / 1e18 
      : 0;

    // Get total players for current cycle
    const totalPlayers = Number(dailyStats.userCount);

    // Calculate win rate (winners / total evaluated slips)
    const winRate = dailyStats.evaluatedSlips > 0n 
      ? (Number(dailyStats.winnersCount) / Number(dailyStats.evaluatedSlips)) * 100 
      : 0;

    // Calculate average odds (average score / 100 for display)
    const averageOdds = dailyStats.evaluatedSlips > 0n 
      ? Number(dailyStats.averageScore) / 100 
      : 0;

    return {
      averagePrizePool: `${averagePrizePool.toFixed(2)} STT`,
      totalPlayers: totalPlayers.toLocaleString(),
      winRate: `${winRate.toFixed(1)}%`,
      averageOdds: `${averageOdds.toFixed(1)}x`
    };
  }
}

import { CONTRACTS } from '@/contracts';
import {
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  formatEther,
  type Address,
  type PublicClient,
  type WalletClient
} from 'viem';
import { bscTestnetNetwork } from '@/config/wagmi';

// Gaunlet contract interfaces
export interface GaunletMatch {
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

export interface GaunletPool {
  creator: Address;
  creatorStake: bigint;
  entryFee: bigint;
  hardCap: bigint;
  maxEntries: bigint;
  matchCount: number;
  firstMatchStartTime: bigint;
  startTime: bigint;
  totalEntryRevenue: bigint;
  slipCount: number;
  state: number; // 0=NotStarted, 1=Active, 2=Ended, 3=Resolved, 4=Settled
  isSettled: boolean;
  winner: Address;
  winnerSlipId: bigint;
}

export interface UserPrediction {
  matchId: bigint;
  betType: number; // 0=MONEYLINE, 1=OVER_UNDER
  selection: string;
  selectedOdd: number;
}

class GaunletService {
  private publicClient: any = null;
  private walletClient: any = null;

  constructor() {
    this.initializePublicClient();
  }

  private initializePublicClient() {
    try {
      const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://data-seed-prebsc-1-s1.bnbchain.org:8545';
      this.publicClient = createPublicClient({
        chain: bscTestnetNetwork as any,
        transport: http(rpcUrl),
      });
    } catch (error) {
      console.error('Error initializing public client:', error);
    }
  }

  setWalletClient(walletClient: WalletClient | null) {
    this.walletClient = walletClient;
  }

  // Get pool data
  async getPool(poolId: number): Promise<GaunletPool | null> {
    try {
      if (!this.publicClient) {
        throw new Error('Public client not initialized');
      }

      const result = await this.publicClient.readContract({
        address: CONTRACTS.GAUNLET.address,
        abi: CONTRACTS.GAUNLET.abi,
        functionName: 'getPool',
        args: [BigInt(poolId)],
      });

      return result as GaunletPool;
    } catch (error) {
      console.error(`Error getting pool ${poolId}:`, error);
      return null;
    }
  }

  // Get matches for a pool
  async getPoolMatches(poolId: number): Promise<GaunletMatch[]> {
    try {
      if (!this.publicClient) {
        throw new Error('Public client not initialized');
      }

      const result = await this.publicClient.readContract({
        address: CONTRACTS.GAUNLET.address,
        abi: CONTRACTS.GAUNLET.abi,
        functionName: 'getPoolMatches',
        args: [BigInt(poolId)],
      });

      const matches = (result as any[]).map((match) => ({
        id: match.id,
        startTime: match.startTime,
        oddsHome: Number(match.oddsHome) / 1000, // Convert from contract format (scaled by 1000)
        oddsDraw: Number(match.oddsDraw) / 1000,
        oddsAway: Number(match.oddsAway) / 1000,
        oddsOver: Number(match.oddsOver) / 1000,
        oddsUnder: Number(match.oddsUnder) / 1000,
        homeTeam: match.homeTeam || 'Home Team',
        awayTeam: match.awayTeam || 'Away Team',
        leagueName: match.leagueName || 'League',
        result: {
          moneyline: Number(match.result?.moneyline || 0),
          overUnder: Number(match.result?.overUnder || 0),
        },
      }));

      return matches;
    } catch (error) {
      console.error(`Error getting pool matches for pool ${poolId}:`, error);
      return [];
    }
  }

  // Place a slip
  async placeSlip(
    poolId: number,
    predictions: Array<{
      matchId: number;
      prediction: string; // "1", "X", "2", "Over", "Under"
      odds: number; // Already in contract format (scaled by 1000)
    }>
  ): Promise<`0x${string}`> {
    if (!this.walletClient) {
      throw new Error('Wallet client not initialized. Please connect your wallet.');
    }

    if (!this.walletClient.account) {
      throw new Error('Wallet account not available. Please reconnect your wallet.');
    }

    try {
      // Get pool to get entry fee
      const pool = await this.getPool(poolId);
      if (!pool) {
        throw new Error('Pool not found');
      }

      // Convert predictions to contract format
      const contractPredictions = predictions.map((pred) => {
        let scaledOdds = pred.odds;

        // Validation: odds should be >= 1000 (representing 1.0x minimum)
        if (scaledOdds < 1000) {
          scaledOdds = Math.floor(scaledOdds * 1000);
        }

        return {
          matchId: BigInt(pred.matchId),
          betType: ['1', 'X', '2'].includes(pred.prediction) ? 0 : 1, // 0=MONEYLINE, 1=OVER_UNDER
          selection: pred.prediction,
          selectedOdd: scaledOdds,
        };
      });

      const hash = await this.walletClient.writeContract({
        address: CONTRACTS.GAUNLET.address,
        abi: CONTRACTS.GAUNLET.abi,
        functionName: 'placeSlip',
        args: [BigInt(poolId), contractPredictions],
        value: pool.entryFee,
        chain: bscTestnetNetwork as any,
        account: this.walletClient.account,
      });

      return hash;
    } catch (error) {
      console.error('Error placing slip:', error);

      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        if (errorMessage.includes('user rejected') ||
          errorMessage.includes('user denied') ||
          errorMessage.includes('user cancelled')) {
          throw new Error('Transaction was cancelled by user.');
        } else if (errorMessage.includes('insufficient funds')) {
          throw new Error('Insufficient funds. Please ensure you have enough BNB to pay the entry fee.');
        }
      }

      throw error;
    }
  }
}

export const gaunletService = new GaunletService();


import { useAccount, useWalletClient, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, type Address } from 'viem';
import { CONTRACT_ADDRESSES } from '@/config/wagmi';
import { CONTRACTS } from '@/contracts';
import { getTransactionOptions } from '@/lib/network-connection';
import BitredictPoolCoreArtifact from '@/contracts/abis/BitredictPoolCore.json';
import OddysseyArtifact from '@/contracts/abis/Oddyssey.json';

const BitredictPoolCoreABI = BitredictPoolCoreArtifact.abi;
const OddysseyABI = OddysseyArtifact.abi;

/**
 * New Claim Service for Pool and Odyssey Claims
 * 
 * This service handles prize claiming using the new backend APIs:
 * - Pool claims: /api/claim-pools/:poolId
 * - Odyssey claims: /api/claim-oddyssey/:cycleId/:slipId
 */

export interface PoolClaimablePosition {
  poolId: number;
  userStake: string;
  potentialPayout: string;
  isWinner: boolean;
  claimed: boolean;
  usesBitr: boolean;
  marketTitle: string;
  category: string;
  league: string;
  settledAt: Date;
  claimStatus: 'eligible' | 'not_eligible' | 'already_claimed';
  reason?: string;
}

export interface OdysseyClaimablePosition {
  cycleId: number;
  slipId: number;
  userAddress: string;
  correctCount: number;
  prizeAmount: string;
  claimed: boolean;
  claimStatus: 'eligible' | 'not_eligible' | 'already_claimed';
  reason?: string;
  placedAt: Date;
  evaluatedAt?: Date;
}

export interface ClaimResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  claimedAmount?: string;
}

export class NewClaimService {
  /**
   * Get claim status for a specific pool
   */
  static async getPoolClaimStatus(
    poolId: number,
    userAddress: Address
  ): Promise<PoolClaimablePosition | null> {
    try {
      console.log('🔍 Fetching pool claim status for:', { poolId, userAddress });
      
      const response = await fetch(`/api/claim-pools/${poolId}/${userAddress}/status`);
      if (!response.ok) {
        throw new Error('Failed to fetch pool claim status');
      }
      
      const data = await response.json();
      return data;
      
    } catch (error) {
      console.error('❌ Error fetching pool claim status:', error);
      return null;
    }
  }

  /**
   * Claim pool prize using direct contract interaction (user's wallet)
   * ✅ FIX: Use writeContract directly instead of backend API
   */
  static async claimPoolPrize(
    poolId: number,
    walletClient: any,
    address: Address,
    writeContract?: any
  ): Promise<ClaimResult> {
    try {
      console.log('🏆 Claiming pool prize for:', poolId);
      
      if (!writeContract) {
        throw new Error('writeContract function is required');
      }

      // ✅ FIX: Use writeContract directly with user's wallet (like ClaimRewards component)
      const hash = await writeContract({
        address: CONTRACT_ADDRESSES.POOL_CORE,
        abi: BitredictPoolCoreABI,
        functionName: 'claim',
        args: [BigInt(poolId)],
      });

      console.log('✅ Pool prize claim transaction submitted:', hash);
      return { 
        success: true, 
        transactionHash: hash,
      };
      
    } catch (error) {
      console.error('❌ Pool prize claim error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('user rejected') || error.message.includes('User rejected')) {
          return { success: false, error: 'User rejected transaction' };
        } else if (error.message.includes('Already claimed') || error.message.includes('already claimed')) {
          return { success: false, error: 'Prize already claimed' };
        } else if (error.message.includes('Not eligible') || error.message.includes('not eligible')) {
          return { success: false, error: 'Not eligible to claim this prize' };
        } else if (error.message.includes('insufficient funds')) {
          return { success: false, error: 'Insufficient gas funds' };
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Pool prize claim failed'
      };
    }
  }

  /**
   * Get claim status for a specific Odyssey slip
   */
  static async getOdysseyClaimStatus(
    cycleId: number,
    slipId: number,
    userAddress: Address
  ): Promise<OdysseyClaimablePosition | null> {
    try {
      console.log('🔍 Fetching Odyssey claim status for:', { cycleId, slipId, userAddress });
      
      const response = await fetch(`/api/claim-oddyssey/${cycleId}/${slipId}/${userAddress}/status`);
      if (!response.ok) {
        throw new Error('Failed to fetch Odyssey claim status');
      }
      
      const data = await response.json();
      return data;
      
    } catch (error) {
      console.error('❌ Error fetching Odyssey claim status:', error);
      return null;
    }
  }

  /**
   * Get all claimable Odyssey prizes for a user
   */
  static async getAllClaimableOdysseyPrizes(
    userAddress: Address
  ): Promise<OdysseyClaimablePosition[]> {
    try {
      console.log('🔍 Fetching all claimable Odyssey prizes for:', userAddress);
      
      const response = await fetch(`/api/claim-oddyssey/user/${userAddress}/claimable`);
      if (!response.ok) {
        throw new Error('Failed to fetch claimable Odyssey prizes');
      }
      
      const data = await response.json();
      return data.claimablePrizes || [];
      
    } catch (error) {
      console.error('❌ Error fetching claimable Odyssey prizes:', error);
      return [];
    }
  }

  /**
   * Claim Odyssey prize using direct contract interaction (user's wallet)
   * ✅ FIX: Use writeContract directly instead of backend API
   */
  static async claimOdysseyPrize(
    cycleId: number,
    slipId: number,
    walletClient: any,
    address: Address,
    writeContract?: any
  ): Promise<ClaimResult> {
    try {
      console.log('🏆 Claiming Odyssey prize for:', { cycleId, slipId });
      
      if (!writeContract) {
        throw new Error('writeContract function is required');
      }

      // ✅ FIX: Use writeContract directly with user's wallet
      const hash = await writeContract({
        address: CONTRACT_ADDRESSES.ODDYSSEY,
        abi: OddysseyABI,
        functionName: 'claimPrize',
        args: [BigInt(cycleId), BigInt(slipId)],
      });

      console.log('✅ Odyssey prize claim transaction submitted:', hash);
      return { 
        success: true, 
        transactionHash: hash,
      };
      
    } catch (error) {
      console.error('❌ Odyssey prize claim error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('user rejected') || error.message.includes('User rejected')) {
          return { success: false, error: 'User rejected transaction' };
        } else if (error.message.includes('Already claimed') || error.message.includes('already claimed')) {
          return { success: false, error: 'Prize already claimed' };
        } else if (error.message.includes('Not eligible') || error.message.includes('not eligible')) {
          return { success: false, error: 'Not eligible to claim this prize' };
        } else if (error.message.includes('insufficient funds')) {
          return { success: false, error: 'Insufficient gas funds' };
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Odyssey prize claim failed'
      };
    }
  }

  /**
   * Batch claim multiple Odyssey prizes
   */
  static async batchClaimOdysseyPrizes(
    positions: OdysseyClaimablePosition[],
    walletClient: any,
    address: Address,
    writeContract: any,
    onProgress?: (completed: number, total: number) => void
  ): Promise<{ successful: number; failed: number; results: ClaimResult[] }> {
    const results: ClaimResult[] = [];
    let successful = 0;
    let failed = 0;
    
    for (let i = 0; i < positions.length; i++) {
      const position = positions[i];
      
      try {
        // ✅ FIX: Pass writeContract to claimOdysseyPrize
        const result = await this.claimOdysseyPrize(
          position.cycleId, 
          position.slipId, 
          walletClient, 
          address,
          writeContract
        );
        
        results.push(result);
        
        if (result.success) {
          successful++;
        } else {
          failed++;
        }
        
        // Call progress callback
        if (onProgress) {
          onProgress(i + 1, positions.length);
        }
        
        // Small delay between claims to avoid rate limiting
        if (i < positions.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        console.error(`❌ Error claiming Odyssey position ${i + 1}:`, error);
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        failed++;
        
        if (onProgress) {
          onProgress(i + 1, positions.length);
        }
      }
    }
    
    return { successful, failed, results };
  }
}

/**
 * React hook for new claim functionality
 */
export function useNewClaimService() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { writeContract } = useWriteContract();
  
  const claimPoolPrize = async (poolId: number) => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }
    
    if (!walletClient) {
      throw new Error('Wallet client not available');
    }
    
    if (!writeContract) {
      throw new Error('writeContract not available');
    }
    
    // ✅ FIX: Pass writeContract to use direct contract interaction
    return await NewClaimService.claimPoolPrize(poolId, walletClient, address, writeContract);
  };
  
  const claimOdysseyPrize = async (cycleId: number, slipId: number) => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }
    
    if (!walletClient) {
      throw new Error('Wallet client not available');
    }
    
    if (!writeContract) {
      throw new Error('writeContract not available');
    }
    
    // ✅ FIX: Pass writeContract to use direct contract interaction
    return await NewClaimService.claimOdysseyPrize(cycleId, slipId, walletClient, address, writeContract);
  };
  
  const batchClaimOdysseyPrizes = async (
    positions: OdysseyClaimablePosition[],
    onProgress?: (completed: number, total: number) => void
  ) => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }
    
    if (!walletClient) {
      throw new Error('Wallet client not available');
    }
    
    if (!writeContract) {
      throw new Error('writeContract not available');
    }
    
    // ✅ FIX: Pass writeContract to each claim
    return await NewClaimService.batchClaimOdysseyPrizes(positions, walletClient, address, writeContract, onProgress);
  };
  
  const getPoolClaimStatus = async (poolId: number) => {
    if (!address) {
      return null;
    }
    
    return await NewClaimService.getPoolClaimStatus(poolId, address);
  };

  const getOdysseyClaimStatus = async (cycleId: number, slipId: number) => {
    if (!address) {
      return null;
    }
    
    return await NewClaimService.getOdysseyClaimStatus(cycleId, slipId, address);
  };

  const getAllClaimableOdysseyPrizes = async () => {
    if (!address) {
      return [];
    }
    
    return await NewClaimService.getAllClaimableOdysseyPrizes(address);
  };
  
  return {
    claimPoolPrize,
    claimOdysseyPrize,
    batchClaimOdysseyPrizes,
    getPoolClaimStatus,
    getOdysseyClaimStatus,
    getAllClaimableOdysseyPrizes,
    isConnected,
    address,
    walletClient: !!walletClient
  };
}

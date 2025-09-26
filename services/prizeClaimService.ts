import { useAccount, useWalletClient, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, type Address } from 'viem';
import { CONTRACT_ADDRESSES } from '@/config/wagmi';
import { CONTRACTS } from '@/contracts';

/**
 * Prize Claim Service for Guided and Open Prediction Markets
 * 
 * This service handles prize claiming for both guided and open markets:
 * - Guided markets: BitredictPool contract claim() function
 * - Open markets: BitredictPool contract claim() function  
 * - Combo markets: BitredictPool contract claimCombo() function
 */

export interface ClaimablePosition {
  poolId: number;
  poolType: 'single' | 'combo';
  userStake: string;
  potentialPayout: string;
  isWinner: boolean;
  claimed: boolean;
  usesBitr: boolean;
  marketTitle: string;
  category: string;
  league: string;
  settledAt: Date;
}

export interface ClaimResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  claimedAmount?: string;
}

export class PrizeClaimService {
  /**
   * Get all claimable positions for a user
   */
  static async getClaimablePositions(userAddress: Address): Promise<ClaimablePosition[]> {
    try {
      console.log('🔍 Fetching claimable positions for:', userAddress);
      
      const response = await fetch(`/api/pools/claimable/${userAddress}`);
      if (!response.ok) {
        throw new Error('Failed to fetch claimable positions');
      }
      
      const data = await response.json();
      return data.positions || [];
      
    } catch (error) {
      console.error('❌ Error fetching claimable positions:', error);
      return [];
    }
  }

  /**
   * Claim prize for a single pool
   */
  static async claimSinglePool(
    poolId: number,
    walletClient: any,
    address: Address
  ): Promise<ClaimResult> {
    try {
      console.log('🏆 Claiming prize for pool:', poolId);
      
      // Execute claim transaction
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESSES.POOL_CORE,
        abi: CONTRACTS.POOL_CORE.abi,
        functionName: 'claim',
        args: [BigInt(poolId)],
        account: address
      });
      
      console.log('⏳ Waiting for claim confirmation...');
      
      // Wait for transaction confirmation
      const receipt = await walletClient.waitForTransactionReceipt({ hash });
      
      if (receipt.status !== 'success') {
        throw new Error(`Claim transaction failed with status: ${receipt.status}`);
      }
      
      // Parse the RewardClaimed event to get claimed amount
      let claimedAmount = '0';
      if (receipt.logs) {
        for (const log of receipt.logs) {
          try {
            // Look for RewardClaimed event
            if (log.topics[0] === '0x...') { // RewardClaimed event signature
              // Parse the amount from the event data
              // This would need the actual event signature
            }
          } catch (e) {
            // Continue if log parsing fails
          }
        }
      }
      
      console.log('✅ Prize claimed successfully:', hash);
      return { 
        success: true, 
        transactionHash: hash,
        claimedAmount 
      };
      
    } catch (error) {
      console.error('❌ Prize claim error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('user rejected')) {
          return { success: false, error: 'User rejected transaction' };
        } else if (error.message.includes('Already claimed')) {
          return { success: false, error: 'Prize already claimed' };
        } else if (error.message.includes('Not settled')) {
          return { success: false, error: 'Market not yet settled' };
        } else if (error.message.includes('insufficient funds')) {
          return { success: false, error: 'Insufficient gas funds' };
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Prize claim failed'
      };
    }
  }

  /**
   * Claim prize for a combo pool
   */
  static async claimComboPool(
    comboPoolId: number,
    walletClient: any,
    address: Address
  ): Promise<ClaimResult> {
    try {
      console.log('🏆 Claiming combo prize for pool:', comboPoolId);
      
      // Execute combo claim transaction
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESSES.POOL_CORE,
        abi: CONTRACTS.POOL_CORE.abi,
        functionName: 'claimCombo',
        args: [BigInt(comboPoolId)],
        account: address
      });
      
      console.log('⏳ Waiting for combo claim confirmation...');
      
      // Wait for transaction confirmation
      const receipt = await walletClient.waitForTransactionReceipt({ hash });
      
      if (receipt.status !== 'success') {
        throw new Error(`Combo claim transaction failed with status: ${receipt.status}`);
      }
      
      console.log('✅ Combo prize claimed successfully:', hash);
      return { 
        success: true, 
        transactionHash: hash 
      };
      
    } catch (error) {
      console.error('❌ Combo prize claim error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('user rejected')) {
          return { success: false, error: 'User rejected transaction' };
        } else if (error.message.includes('Already claimed')) {
          return { success: false, error: 'Combo prize already claimed' };
        } else if (error.message.includes('Not settled')) {
          return { success: false, error: 'Combo market not yet settled' };
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Combo prize claim failed'
      };
    }
  }

  /**
   * Batch claim multiple prizes
   */
  static async batchClaim(
    positions: ClaimablePosition[],
    walletClient: any,
    address: Address,
    onProgress?: (completed: number, total: number) => void
  ): Promise<{ successful: number; failed: number; results: ClaimResult[] }> {
    const results: ClaimResult[] = [];
    let successful = 0;
    let failed = 0;
    
    for (let i = 0; i < positions.length; i++) {
      const position = positions[i];
      
      try {
        let result: ClaimResult;
        
        if (position.poolType === 'combo') {
          result = await this.claimComboPool(position.poolId, walletClient, address);
        } else {
          result = await this.claimSinglePool(position.poolId, walletClient, address);
        }
        
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
        console.error(`❌ Error claiming position ${i + 1}:`, error);
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
 * React hook for prize claiming functionality
 */
export function usePrizeClaiming() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  const claimSingle = async (poolId: number) => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }
    
    if (!walletClient) {
      throw new Error('Wallet client not available');
    }
    
    return await PrizeClaimService.claimSinglePool(poolId, walletClient, address);
  };
  
  const claimCombo = async (comboPoolId: number) => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }
    
    if (!walletClient) {
      throw new Error('Wallet client not available');
    }
    
    return await PrizeClaimService.claimComboPool(comboPoolId, walletClient, address);
  };
  
  const batchClaim = async (
    positions: ClaimablePosition[],
    onProgress?: (completed: number, total: number) => void
  ) => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }
    
    if (!walletClient) {
      throw new Error('Wallet client not available');
    }
    
    return await PrizeClaimService.batchClaim(positions, walletClient, address, onProgress);
  };
  
  const getClaimablePositions = async () => {
    if (!address) {
      return [];
    }
    
    return await PrizeClaimService.getClaimablePositions(address);
  };
  
  return {
    claimSingle,
    claimCombo,
    batchClaim,
    getClaimablePositions,
    isConnected,
    address,
    walletClient: !!walletClient
  };
}

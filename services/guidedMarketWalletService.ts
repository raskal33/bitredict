import { useAccount, useWalletClient, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { parseEther, parseUnits, type Address } from 'viem';
import { CONTRACT_ADDRESSES } from '@/config/wagmi';
import { CONTRACTS } from '@/contracts';
import { GuidedMarketService } from './guidedMarketService';
import { ethers } from 'ethers';

/**
 * Enhanced Guided Market Service with Wallet Integration
 * 
 * This service handles the complete flow for creating guided markets:
 * 1. Prepare transaction data via backend
 * 2. Execute transaction via MetaMask/wallet
 * 3. Confirm transaction via backend for indexing
 */

export interface GuidedMarketTransactionData {
  contractAddress: string;
  functionName: string;
  parameters: any[];
  value: string;
  gasEstimate: string;
  totalRequiredWei?: string; // Total amount needed for approval/transfer (includes fee)
  creationFeeWei?: string;   // Fee amount
  marketDetails: any;
}

export interface CreateFootballMarketParams {
  fixtureId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchDate: string;
  outcome: string;
  predictedOutcome: string;
  odds: number;
  creatorStake: number;
  useBitr?: boolean;
  description?: string;
  isPrivate?: boolean;
  maxBetPerUser?: number;
}

export class GuidedMarketWalletService {
  /**
   * Create a football market using the new prepare/confirm flow
   */
  static async createFootballMarketWithWallet(
    marketData: CreateFootballMarketParams,
    walletClient: any,
    publicClient: any,
    address: Address
  ): Promise<{
    success: boolean;
    transactionHash?: string;
    marketId?: string;
    error?: string;
  }> {
    try {
      console.log('🚀 Starting guided football market creation...');
      console.log('📋 Market data:', marketData);
      
      // Step 1: Prepare transaction data via backend
      console.log('📡 Step 1: Preparing transaction data...');
      const prepareResult = await GuidedMarketService.prepareFootballMarket(marketData);
      
      if (!prepareResult.success) {
        return {
          success: false,
          error: `Failed to prepare transaction: ${prepareResult.error}`
        };
      }
      
      const transactionData = prepareResult.data as GuidedMarketTransactionData;
      
      // 🚨 CRITICAL FIX: Override with new optimized contract address
      transactionData.contractAddress = CONTRACT_ADDRESSES.POOL_CORE;
      
      // 🔧 CRITICAL FIX: Override marketId with actual SportMonks fixture ID (not hex hash)
      if (transactionData.parameters && transactionData.parameters.length > 16) {
        // Replace the hex marketId with the actual SportMonks fixture ID
        const originalMarketId = transactionData.parameters[16];
        transactionData.parameters[16] = marketData.fixtureId;
        console.log(`🔧 Overriding marketId with SportMonks fixture ID:`);
        console.log(`   Original (hex): ${originalMarketId}`);
        console.log(`   New (fixture ID): ${marketData.fixtureId}`);
      }
      
      console.log('✅ Transaction data prepared:', {
        contractAddress: transactionData.contractAddress,
        functionName: transactionData.functionName,
        marketId: transactionData.marketDetails.marketId
      });
      console.log('🔧 Using optimized contract address:', CONTRACT_ADDRESSES.POOL_CORE);
      
      // Step 2: Handle BITR approval if needed
      if (marketData.useBitr) {
        console.log('🪙 Step 2: Handling BITR token approval...');
        
        // Use totalRequiredWei which includes the 50 BITR creation fee
        const totalRequiredWei = transactionData.totalRequiredWei || transactionData.parameters[2];
        
        const approvalResult = await this.handleBitrApproval(
          totalRequiredWei, // totalRequiredWei (creatorStake + 50 BITR fee)
          walletClient,
          publicClient,
          address
        );
        
        if (!approvalResult.success) {
          return {
            success: false,
            error: `BITR approval failed: ${approvalResult.error}`
          };
        }
        
        console.log('✅ BITR approval completed');
      }
      
      // Step 3: Execute the main transaction via wallet
      console.log('💳 Step 3: Executing transaction via wallet...');
      
      const txResult = await this.executeTransaction(
        transactionData,
        walletClient,
        publicClient,
        address,
        marketData
      );
      
      if (!txResult.success) {
        return {
          success: false,
          error: `Transaction execution failed: ${txResult.error}`
        };
      }
      
      console.log('✅ Transaction executed:', txResult.hash);
      
      // Step 4: Confirm transaction via backend for indexing
      console.log('📡 Step 4: Confirming transaction with backend...');
      
      const confirmResult = await GuidedMarketService.confirmFootballMarket(
        txResult.hash!,
        transactionData.marketDetails
      );
      
      if (!confirmResult.success) {
        console.warn('⚠️ Backend confirmation failed, but transaction was successful:', confirmResult.error);
        // Don't fail the entire process if backend confirmation fails
      } else {
        console.log('✅ Backend confirmation completed');
      }
      
      return {
        success: true,
        transactionHash: txResult.hash,
        marketId: transactionData.marketDetails.marketId
      };
      
    } catch (error) {
      console.error('❌ Error creating football market:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
  
  /**
   * Handle BITR token approval for guided markets
   */
  private static async handleBitrApproval(
    stakeAmount: string,
    walletClient: any,
    publicClient: any,
    address: Address
  ): Promise<{ success: boolean; error?: string; hash?: string }> {
    try {
      console.log('🔍 Checking BITR allowance...');
      
      // Check current allowance using publicClient (correct wagmi v2 API)
      const currentAllowance = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.BITR_TOKEN,
        abi: CONTRACTS.BITR_TOKEN.abi,
        functionName: 'allowance',
        args: [address, CONTRACT_ADDRESSES.POOL_CORE]
      });
      
      const requiredAmount = BigInt(stakeAmount);
      
      if (currentAllowance >= requiredAmount) {
        console.log('✅ Sufficient BITR allowance already exists');
        return { success: true };
      }
      
      console.log('📝 Requesting BITR approval...');
      console.log(`   Required: ${requiredAmount.toString()}`);
      console.log(`   Current: ${currentAllowance.toString()}`);
      
      // Request approval using walletClient (correct wagmi v2 API)
      const approvalHash = await walletClient.writeContract({
        address: CONTRACT_ADDRESSES.BITR_TOKEN,
        abi: CONTRACTS.BITR_TOKEN.abi,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.POOL_CORE, requiredAmount],
        account: address
      });
      
      console.log('⏳ Waiting for approval confirmation...');
      
      // Wait for approval transaction using publicClient
      const approvalReceipt = await publicClient.waitForTransactionReceipt({
        hash: approvalHash
      });
      
      if (approvalReceipt.status !== 'success') {
        throw new Error('BITR approval transaction failed');
      }
      
      console.log('✅ BITR approval confirmed:', approvalHash);
      return { success: true, hash: approvalHash };
      
    } catch (error) {
      console.error('❌ BITR approval error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('user rejected')) {
          return { success: false, error: 'User rejected BITR approval' };
        } else if (error.message.includes('insufficient funds')) {
          return { success: false, error: 'Insufficient BITR balance for approval' };
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'BITR approval failed'
      };
    }
  }
  
  /**
   * Hash string parameters to bytes32 for the optimized contract
   */
  private static hashStringParameters(parameters: any[]): any[] {
    // The createPool function expects these parameters in order:
    // [predictedOutcome, odds, creatorStake, eventStartTime, eventEndTime, 
    //  leagueHash, categoryHash, homeTeamHash, awayTeamHash, titleHash,
    //  isPrivate, maxBetPerUser, useBitr, oracleType, marketType, marketId]
    // Note: Contract signature is: createPool(..., bytes32 _league, bytes32 _category, bytes32 _homeTeam, bytes32 _awayTeam, bytes32 _title, bool _isPrivate, uint256 _maxBetPerUser, bool _useBitr, OracleType _oracleType, MarketType _marketType, string memory _marketId)
    
    if (parameters.length < 17) {
      console.warn('⚠️ Expected 17 parameters for createPool, got:', parameters.length);
      return parameters;
    }
    
    const hashedParameters = [...parameters];
    
    // Hash string parameters (indices 5-10 are the string fields that need hashing)
    const stringFields = [5, 6, 7, 8, 9, 10]; // league, category, region, homeTeam, awayTeam, title
    const fieldNames = ['league', 'category', 'region', 'homeTeam', 'awayTeam', 'title'];
    
    for (let i = 0; i < stringFields.length; i++) {
      const paramIndex = stringFields[i];
      const fieldName = fieldNames[i];
      const paramValue = parameters[paramIndex];
      
      if (typeof paramValue === 'string' && paramValue.length > 0) {
        console.log(`🔤 Hashing ${fieldName}: "${paramValue}" -> bytes32`);
        hashedParameters[paramIndex] = ethers.keccak256(ethers.toUtf8Bytes(paramValue));
      } else {
        console.log(`⚠️ ${fieldName} is not a valid string:`, paramValue);
        // Use empty string hash as fallback
        hashedParameters[paramIndex] = ethers.keccak256(ethers.toUtf8Bytes(''));
      }
    }
    
    // 🔧 CRITICAL FIX: Ensure marketId (index 15) is always a string, not hex
    // Parameter order: ...oracleType (13), marketType (14), marketId (15)
    const marketIdIndex = 15;
    if (hashedParameters.length > marketIdIndex) {
      const marketId = hashedParameters[marketIdIndex];
      console.log(`🔍 MarketId before final check: ${marketId} (type: ${typeof marketId})`);
      
      // If it's still a hex string, convert it to a regular string
      if (typeof marketId === 'string' && marketId.startsWith('0x')) {
        console.log(`🔧 Converting hex marketId to string: ${marketId}`);
        // Try to parse as hex number first
        try {
          const numericValue = parseInt(marketId, 16);
          hashedParameters[marketIdIndex] = numericValue.toString();
        } catch (error) {
          // If conversion fails, remove the 0x prefix
          hashedParameters[marketIdIndex] = marketId.replace('0x', '');
        }
      } else if (typeof marketId === 'number') {
        // If it's a number, convert to string
        hashedParameters[marketIdIndex] = marketId.toString();
      }
      
      console.log(`📝 Final marketId: ${hashedParameters[marketIdIndex]} (type: ${typeof hashedParameters[marketIdIndex]})`);
    }
    
    // Note: marketType (index 15) is an enum, so we don't hash it either
    
    return hashedParameters;
  }

  /**
   * Execute the main transaction via wallet
   */
  private static async executeTransaction(
    transactionData: GuidedMarketTransactionData,
    walletClient: any,
    publicClient: any,
    address: Address,
    marketData?: CreateFootballMarketParams
  ): Promise<{ success: boolean; hash?: string; error?: string }> {
    try {
      console.log('🎯 Executing main transaction...');
      console.log('📋 Transaction details:', {
        contract: transactionData.contractAddress,
        function: transactionData.functionName,
        value: transactionData.value,
        gasEstimate: transactionData.gasEstimate
      });
      
      // Hash string parameters for the optimized contract
      console.log('🔍 Raw parameters before hashing:', transactionData.parameters);
      const hashedParameters = this.hashStringParameters(transactionData.parameters);
      console.log('🔤 Hashed parameters:', hashedParameters);
      
      // 🔧 DEBUG: Check the marketId parameter specifically
      if (hashedParameters.length > 16) {
        console.log('🔍 MarketId parameter (index 16):', hashedParameters[16]);
        console.log('🔍 MarketId type:', typeof hashedParameters[16]);
        
        // 🔧 FINAL OVERRIDE: Force the marketId to be the fixture ID string
        if (marketData && hashedParameters[16] && hashedParameters[16] !== marketData.fixtureId) {
          console.log(`🔧 FINAL OVERRIDE: Replacing ${hashedParameters[16]} with ${marketData.fixtureId}`);
          hashedParameters[16] = marketData.fixtureId;
        }
      }
      
      // Execute the transaction with our gas limit override
      const gasLimit = BigInt(10000000); // Reduced gas limit for lightweight functions
      console.log('🔧 Overriding gas limit:', gasLimit.toString());
      
      const hash = await walletClient.writeContract({
        address: transactionData.contractAddress as Address,
        abi: CONTRACTS.POOL_CORE.abi,
        functionName: transactionData.functionName,
        args: hashedParameters,
        value: transactionData.value === '0' ? BigInt(0) : parseEther(transactionData.value),
        account: address,
        gas: gasLimit
      });
      
      console.log('⏳ Waiting for transaction confirmation...');
      
      // Wait for transaction confirmation using publicClient (correct wagmi v2 API)
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      if (receipt.status !== 'success') {
        throw new Error(`Transaction failed with status: ${receipt.status}`);
      }
      
      console.log('✅ Transaction confirmed:', hash);
      return { success: true, hash };
      
    } catch (error) {
      console.error('❌ Transaction execution error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('user rejected')) {
          return { success: false, error: 'User rejected transaction' };
        } else if (error.message.includes('insufficient funds')) {
          return { success: false, error: 'Insufficient funds for transaction' };
        } else if (error.message.includes('gas')) {
          return { success: false, error: 'Gas estimation failed. Please try again.' };
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transaction execution failed'
      };
    }
  }
}

/**
 * React hook for guided market creation with wallet integration
 */
export function useGuidedMarketCreation() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  
  const createFootballMarket = async (marketData: CreateFootballMarketParams) => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }
    
    if (!walletClient) {
      throw new Error('Wallet client not available');
    }
    
    if (!publicClient) {
      throw new Error('Public client not available');
    }
    
    return await GuidedMarketWalletService.createFootballMarketWithWallet(
      marketData,
      walletClient,
      publicClient,
      address
    );
  };
  
  return {
    createFootballMarket,
    isConnected,
    address,
    walletClient: !!walletClient,
    publicClient: !!publicClient
  };
}



import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { CONTRACTS, CONTRACT_ADDRESSES } from '@/contracts';
import { executeContractCall, getTransactionOptions } from '@/lib/network-connection';
import { useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { keccak256, toBytes } from 'viem';
import { ethers } from 'ethers';
import { formatTeamNamesForPool } from '@/utils/teamNameFormatter';

// Enhanced contract interaction hooks for modular architecture

// BITR Token Contract Hooks
export function useBitrToken() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const approve = useCallback(async (spender: `0x${string}`, amount: bigint) => {
    try {
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.BITR_TOKEN,
        abi: CONTRACTS.BITR_TOKEN.abi,
        functionName: 'approve',
        args: [spender, amount],
        ...getTransactionOptions(),
      });
      
      console.log('✅ BITR approval transaction submitted:', txHash);
      toast.loading('Waiting for approval confirmation...', { id: 'bitr-approval-wait' });
      
      // Wait for the approval transaction to be confirmed before proceeding
      if (!publicClient) {
        throw new Error('Public client not available');
      }
      
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      
      if (receipt.status !== 'success') {
        console.error('❌ Approval transaction failed');
        toast.dismiss('bitr-approval-wait');
        throw new Error('Approval transaction failed');
      }
      
      console.log('✅ BITR approval confirmed on-chain');
      toast.success('BITR tokens approved!', { id: 'bitr-approval-wait' });
      return txHash;
    } catch (error) {
      console.error('Error approving BITR:', error);
      toast.dismiss('bitr-approval-wait');
      toast.error('Failed to approve BITR');
      throw error;
    }
  }, [writeContractAsync, publicClient]);

  const getAllowance = useCallback(async (owner: `0x${string}`, spender: `0x${string}`) => {
    try {
      const result = await executeContractCall(async (client) => {
        return await client.readContract({
          address: CONTRACT_ADDRESSES.BITR_TOKEN,
          abi: CONTRACTS.BITR_TOKEN.abi,
          functionName: 'allowance',
          args: [owner, spender],
        });
      });
      return result as bigint;
    } catch (error) {
      console.error('Error getting BITR allowance:', error);
      return 0n;
    }
  }, []);

  const getBalance = useCallback(async (account?: `0x${string}`) => {
    try {
      const result = await executeContractCall(async (client) => {
        return await client.readContract({
          address: CONTRACT_ADDRESSES.BITR_TOKEN,
          abi: CONTRACTS.BITR_TOKEN.abi,
          functionName: 'balanceOf',
          args: [account || address || '0x0'],
        });
      });
      return result as bigint;
    } catch (error) {
      console.error('Error getting BITR balance:', error);
      return 0n;
    }
  }, [address]);

  return {
    approve,
    getAllowance,
    getBalance,
  };
}

// Pool Core Contract Hooks
export function usePoolCore() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { approve, getAllowance, getBalance } = useBitrToken();
  const publicClient = usePublicClient();

  const createPool = useCallback(async (poolData: {
    predictedOutcome: string;
    odds: bigint;
    creatorStake: bigint;
    eventStartTime: bigint;
    eventEndTime: bigint;
    league: string;
    category: string;
    isPrivate: boolean;
    maxBetPerUser: bigint;
    useBitr: boolean;
    oracleType: number;
    marketId: string;
    marketType: number;
    homeTeam?: string;
    awayTeam?: string;
    title?: string;
    boostTier?: 'NONE' | 'BRONZE' | 'SILVER' | 'GOLD'; // ✅ FIX: Add boost tier support
  }) => {
    try {
      // Convert predictedOutcome to bytes32 string (not hash) for proper storage and retrieval
      const predictedOutcomeBytes32 = poolData.predictedOutcome.startsWith('0x') 
        ? poolData.predictedOutcome 
        : ethers.encodeBytes32String(poolData.predictedOutcome.slice(0, 31)); // Truncate to fit bytes32
      
      // Market ID should be the original SportMonks fixture ID for guided markets
      // This ensures proper fixture mapping for settlement and easier backend processing
      const marketIdString = poolData.oracleType === 0 // GUIDED oracle
        ? poolData.marketId // Use original SportMonks fixture ID directly
        : poolData.marketId; // For custom markets, use as-is

      // Calculate total required amount (creation fee + creator stake + boost cost)
      // ✅ FIX: Match contract values - BITR = 70e18, STT = 1e18
      const creationFeeBITR = 70n * 10n**18n; // 70 BITR in wei (contract uses 70e18, not 50e18!)
      const creationFeeSTT = 1n * 10n**18n; // 1 STT in wei
      
      // ✅ FIX: Calculate boost cost (always in STT, even for BITR pools)
      // Boost costs: BRONZE = 2 STT, SILVER = 3 STT, GOLD = 5 STT
      let boostCost = 0n;
      const hasBoost = poolData.boostTier && poolData.boostTier !== 'NONE';
      if (hasBoost) {
        if (poolData.boostTier === 'BRONZE') {
          boostCost = 2n * 10n**18n; // 2 STT
        } else if (poolData.boostTier === 'SILVER') {
          boostCost = 3n * 10n**18n; // 3 STT
        } else if (poolData.boostTier === 'GOLD') {
          boostCost = 5n * 10n**18n; // 5 STT
        }
      }
      
      // ✅ FIX: For BITR pools, totalRequired does NOT include boostCost (boost is paid in STT separately)
      // For STT pools, totalRequired includes everything (creation fee + stake + boost cost)
      const totalRequired = poolData.useBitr 
        ? poolData.creatorStake + creationFeeBITR  // Only creation fee + stake in BITR (boost is in STT)
        : poolData.creatorStake + creationFeeSTT + boostCost;   // Everything in STT: stake + creation fee + boost cost
      
      // ✅ FIX: Transaction value for msg.value
      // BITR pools: only send boost cost (in STT) as msg.value (creation fee + stake are transferred as BITR tokens)
      // STT pools: send everything (creation fee + stake + boost cost) as msg.value
      const transactionValue = poolData.useBitr 
        ? boostCost  // BITR pools: only boost cost in STT via msg.value
        : totalRequired; // STT pools: everything in STT via msg.value

      // For BITR pools, we need to ensure the contract has sufficient allowance
      // The contract will handle the token transfer internally
      if (poolData.useBitr) {
        console.log(`💰 BITR Pool Creation Flow Started`);
        console.log(`   Creation Fee: ${creationFeeBITR / BigInt(10**18)} BITR`);
        console.log(`   Creator Stake: ${poolData.creatorStake / BigInt(10**18)} BITR`);
        console.log(`   Total Required: ${totalRequired / BigInt(10**18)} BITR`);
        if (boostCost > 0n) {
          console.log(`   Boost Cost: ${boostCost / BigInt(10**18)} STT (paid in native STT)`);
        }
        
        // Check BITR balance first (for creation fee + creator stake only, NOT boost cost)
        const balance = await getBalance();
        console.log(`🔍 BITR Balance Check: ${balance / BigInt(10**18)} BITR (required: ${totalRequired / BigInt(10**18)} BITR)`);
        console.log(`   Note: Boost cost (${boostCost / BigInt(10**18)} STT) is paid separately in native STT`);
        
        if (balance < totalRequired) {
          const shortfall = totalRequired - balance;
          const errorMsg = `Insufficient BITR balance. You have ${balance / BigInt(10**18)} BITR but need ${totalRequired / BigInt(10**18)} BITR (shortfall: ${shortfall / BigInt(10**18)} BITR)`;
          console.error(`❌ ${errorMsg}`);
          toast.error(errorMsg);
          throw new Error(errorMsg);
        }
        
        // ✅ FIX: For BITR pools with boost, check STT balance for boost payment
        if (boostCost > 0n && address) {
          const sttBalance = await publicClient?.getBalance({ address });
          if (!sttBalance || sttBalance < boostCost) {
            const errorMsg = `Insufficient STT balance for boost. You need ${boostCost / BigInt(10**18)} STT but have ${sttBalance ? sttBalance / BigInt(10**18) : 0} STT`;
            console.error(`❌ ${errorMsg}`);
            toast.error(errorMsg);
            throw new Error(errorMsg);
          }
          console.log(`✅ STT balance check passed for boost: ${sttBalance / BigInt(10**18)} STT >= ${boostCost / BigInt(10**18)} STT`);
        }
        
        console.log(`✅ Balance check passed`);
        
        // Check if we need to approve more tokens
        // ✅ FIX: For boosted pools, approve FACTORY (not POOL_CORE) since we're calling createPoolWithBoost
        const approvalTarget = hasBoost ? CONTRACT_ADDRESSES.FACTORY : CONTRACT_ADDRESSES.POOL_CORE;
        const currentAllowance = await getAllowance(address as `0x${string}`, approvalTarget);
        console.log(`🔍 BITR Allowance Check:`, {
          currentAllowance: currentAllowance.toString(),
          currentAllowanceFormatted: `${currentAllowance / BigInt(10**18)} BITR`,
          totalRequired: totalRequired.toString(),
          totalRequiredFormatted: `${totalRequired / BigInt(10**18)} BITR`,
          needsApproval: currentAllowance < totalRequired,
          shortfall: currentAllowance < totalRequired ? (totalRequired - currentAllowance).toString() : '0'
        });
        
        if (currentAllowance < totalRequired) {
          const shortfall = totalRequired - currentAllowance;
          console.log(`⚠️ Insufficient allowance detected!`);
          console.log(`   Current: ${currentAllowance / BigInt(10**18)} BITR`);
          console.log(`   Required: ${totalRequired / BigInt(10**18)} BITR`);
          console.log(`   Shortfall: ${shortfall / BigInt(10**18)} BITR`);
          console.log(`🔄 Requesting approval for ${totalRequired / BigInt(10**18)} BITR tokens...`);
          
          toast.loading('Approving BITR tokens for pool creation...', { id: 'bitr-approval' });
          try {
            const approvalTx = await approve(approvalTarget, totalRequired);
            console.log(`✅ Approval transaction confirmed: ${approvalTx}`);
            toast.dismiss('bitr-approval');
            toast.success('BITR tokens approved for pool creation!');
            
            // 🚨 CRITICAL: Verify the approval was successful by checking allowance again
            const newAllowance = await getAllowance(address as `0x${string}`, CONTRACT_ADDRESSES.POOL_CORE);
            console.log(`✅ New allowance after approval: ${newAllowance.toString()}`);
            
            if (newAllowance < totalRequired) {
              throw new Error(`Approval failed: Allowance is still insufficient (${newAllowance} < ${totalRequired})`);
            }
          } catch (approveError) {
            toast.dismiss('bitr-approval');
            console.error('❌ Error approving BITR tokens:', approveError);
            toast.error('Failed to approve BITR tokens for pool creation');
            throw approveError;
          }
        } else {
          console.log(`✅ Sufficient allowance already exists (${currentAllowance / BigInt(10**18)} BITR >= ${totalRequired / BigInt(10**18)} BITR)`);
          
          // 🚨 CRITICAL FIX: Even if allowance is "sufficient", it might be EXACTLY equal
          // If it's exactly equal or close, we should refresh it to avoid edge cases
          // This happens when a previous pool creation approved exactly this amount
          if (currentAllowance === totalRequired || currentAllowance < totalRequired + BigInt(10**18)) {
            console.log(`⚠️ Allowance is exactly equal or very close to required amount`);
            console.log(`   This might cause issues if there's any rounding or previous consumption`);
            console.log(`   Refreshing approval to ensure sufficient buffer...`);
            
            toast.loading('Refreshing BITR token approval...', { id: 'bitr-approval-refresh' });
            try {
              // Approve a larger amount to avoid this issue in future
              const bufferAmount = totalRequired * 2n; // Approve 2x to cover multiple pools
              const approvalTx = await approve(CONTRACT_ADDRESSES.POOL_CORE, bufferAmount);
              console.log(`✅ Approval refreshed with buffer: ${bufferAmount / BigInt(10**18)} BITR`);
              toast.dismiss('bitr-approval-refresh');
              toast.success('BITR tokens approved!');
              
              // Verify the new approval
              const newAllowance = await getAllowance(address as `0x${string}`, CONTRACT_ADDRESSES.POOL_CORE);
              console.log(`✅ New allowance after refresh: ${newAllowance / BigInt(10**18)} BITR`);
              
              if (newAllowance < totalRequired) {
                throw new Error(`Approval refresh failed: Allowance is still insufficient`);
              }
            } catch (refreshError) {
              toast.dismiss('bitr-approval-refresh');
              console.error('❌ Error refreshing approval:', refreshError);
              toast.error('Failed to refresh BITR token approval');
              throw refreshError;
            }
          }
        }
      }

      console.log('Creating pool with parameters:', {
        predictedOutcomeBytes32,
        odds: poolData.odds,
        creatorStake: poolData.creatorStake,
        useBitr: poolData.useBitr,
        totalRequired,
        value: poolData.useBitr ? 0n : totalRequired
      });

      // Format team names to ensure they fit within bytes32 constraints
      console.log('🔍 Original team data:', {
        homeTeam: poolData.homeTeam,
        awayTeam: poolData.awayTeam,
        predictedOutcome: poolData.predictedOutcome
      });
      
      const teamNames = formatTeamNamesForPool(poolData.homeTeam || '', poolData.awayTeam || '');
      
      console.log('🔍 Formatted team data:', {
        homeTeam: teamNames.homeTeam,
        awayTeam: teamNames.awayTeam,
        warnings: teamNames.warnings
      });
      
      // Show warnings if team names were modified
      if (teamNames.warnings.length > 0) {
        console.warn('Team name formatting warnings:', teamNames.warnings);
        // Show user-friendly warnings
        teamNames.warnings.forEach(warning => {
          toast(warning, { 
            icon: '⚠️',
            duration: 5000,
            style: { background: '#fbbf24', color: '#1f2937' }
          });
        });
      }

      // Helper function to safely encode strings as bytes32
      const safeEncodeBytes32 = (str: string, fieldName: string): string => {
        if (!str) return ethers.encodeBytes32String('');
        
        // Ensure string is exactly 31 characters or less
        const truncated = str.slice(0, 31);
        console.log(`🔍 Encoding ${fieldName}: "${truncated}" (${truncated.length} chars)`);
        
        try {
          return ethers.encodeBytes32String(truncated);
        } catch (error) {
          console.error(`❌ Failed to encode ${fieldName}:`, error);
          // Fallback to empty string
          return ethers.encodeBytes32String('');
        }
      };
      
      // Encode strings as bytes32 (not hashed) for the updated contract
      console.log('🔍 String length validation before encoding:', {
        league: poolData.league.length,
        category: poolData.category.length,
        homeTeam: teamNames.homeTeam.length,
        awayTeam: teamNames.awayTeam.length,
        title: (poolData.title || '').length
      });
      
      const leagueBytes32 = safeEncodeBytes32(poolData.league, 'league');
      const categoryBytes32 = safeEncodeBytes32(poolData.category, 'category');
      const homeTeamBytes32 = safeEncodeBytes32(teamNames.homeTeam, 'homeTeam');
      const awayTeamBytes32 = safeEncodeBytes32(teamNames.awayTeam, 'awayTeam');
      const titleBytes32 = safeEncodeBytes32(poolData.title || '', 'title');
      
      console.log('🔍 Encoded data for contract:', {
        predictedOutcomeBytes32,
        leagueBytes32,
        categoryBytes32,
        homeTeamBytes32,
        awayTeamBytes32,
        titleBytes32,
        originalMarketId: poolData.marketId,
        marketIdString: marketIdString,
        isGuidedMarket: poolData.oracleType === 0
      });

      // ✅ FIX: Convert boost tier string to enum number (0=NONE, 1=BRONZE, 2=SILVER, 3=GOLD)
      let boostTierEnum = 0; // NONE
      if (hasBoost) {
        if (poolData.boostTier === 'BRONZE') {
          boostTierEnum = 1;
        } else if (poolData.boostTier === 'SILVER') {
          boostTierEnum = 2;
        } else if (poolData.boostTier === 'GOLD') {
          boostTierEnum = 3;
        }
      }

      // Log critical validation info before sending transaction
      console.log('🔍 Pre-transaction validation:', {
        address: address,
        useBitr: poolData.useBitr,
        creatorStake: poolData.creatorStake.toString(),
        totalRequired: totalRequired.toString(),
        boostCost: boostCost.toString(),
        transactionValue: transactionValue.toString(),
        boostTier: poolData.boostTier,
        boostTierEnum,
        hasBoost,
        usingFactory: hasBoost,
        oracleType: poolData.oracleType,
        marketType: poolData.marketType,
        eventStartTime: new Date(Number(poolData.eventStartTime) * 1000).toISOString(),
        gracePeriodBuffer: Number(poolData.eventStartTime) - Math.floor(Date.now() / 1000),
      });

      // ✅ FIX: Use FACTORY.createPoolWithBoost if boost is selected, otherwise use POOL_CORE.createPool
      const txHash = hasBoost
        ? await writeContractAsync({
            address: CONTRACT_ADDRESSES.FACTORY,
            abi: CONTRACTS.FACTORY.abi,
            functionName: 'createPoolWithBoost', // ✅ Use factory's createPoolWithBoost
            args: [
              predictedOutcomeBytes32,
              poolData.odds,
              poolData.creatorStake,
              poolData.eventStartTime,
              poolData.eventEndTime,
              leagueBytes32,
              categoryBytes32,
              ethers.encodeBytes32String(''), // region (empty for now)
              homeTeamBytes32,
              awayTeamBytes32,
              titleBytes32,
              poolData.isPrivate,
              poolData.maxBetPerUser,
              poolData.useBitr,
              poolData.oracleType,
              marketIdString,
              poolData.marketType,
              boostTierEnum, // ✅ Boost tier enum (0=NONE, 1=BRONZE, 2=SILVER, 3=GOLD)
            ],
            value: transactionValue, // ✅ Includes boost cost for both BITR and STT pools
            // For BITR pools: value = boostCost (in STT)
            // For STT pools: value = totalRequired + boostCost
            gas: BigInt(12000000), // Slightly higher gas for factory function
          })
        : await writeContractAsync({
            address: CONTRACT_ADDRESSES.POOL_CORE,
            abi: CONTRACTS.POOL_CORE.abi,
            functionName: 'createPool', // ✅ Use main createPool function when no boost
            args: [
              predictedOutcomeBytes32,
              poolData.odds,
              poolData.creatorStake,
              poolData.eventStartTime,
              poolData.eventEndTime,
              leagueBytes32, // 🎯 bytes32 encoded league
              categoryBytes32, // 🎯 bytes32 encoded category
              homeTeamBytes32, // 🎯 bytes32 encoded home team
              awayTeamBytes32, // 🎯 bytes32 encoded away team
              titleBytes32, // 🎯 bytes32 encoded title
              poolData.isPrivate,
              poolData.maxBetPerUser,
              poolData.useBitr,
              poolData.oracleType,
              poolData.marketType,
              marketIdString, // 🎯 Market ID: keccak256(fixtureId) for guided, raw string for custom
            ],
            value: poolData.useBitr ? 0n : totalRequired, // For BITR pools, value is 0 (token transfer handles it)
            gas: BigInt(10000000), // ✅ Reduced gas limit for lightweight function (10M instead of 14M)
          });
      
      console.log('Pool creation transaction submitted:', txHash);
      toast.loading('Waiting for transaction confirmation...', { id: 'pool-creation' });
      
      // Wait for transaction confirmation
      console.log('⏳ Waiting for transaction confirmation...');
      if (!publicClient) {
        throw new Error('Public client not available');
      }
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      
      if (receipt.status !== 'success') {
        console.error('❌ Transaction failed. Receipt:', {
          status: receipt.status,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed?.toString(),
          effectiveGasPrice: receipt.effectiveGasPrice?.toString(),
        });
        throw new Error(`Transaction reverted on-chain. Possible causes: insufficient reputation, timing validation failed, or token transfer rejected. Check contract requirements.`);
      }
      
      console.log('✅ Pool creation transaction confirmed:', txHash);
      toast.success('Pool created successfully!', { id: 'pool-creation' });
      return txHash;
    } catch (error) {
      console.error('Error creating pool:', error);
      
      // Dismiss loading toast
      toast.dismiss('pool-creation');
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('insufficient funds')) {
          toast.error('Insufficient BITR balance for pool creation');
        } else if (error.message.includes('allowance')) {
          toast.error('Insufficient BITR allowance. Please approve more tokens.');
        } else if (error.message.includes('revert')) {
          toast.error('Transaction reverted. Check your parameters and try again.');
        } else if (error.message.includes('Transaction failed with status')) {
          toast.error('Transaction failed on-chain. Please check your parameters and try again.');
        } else {
          toast.error(`Failed to create pool: ${error.message}`);
        }
      } else {
        toast.error('Failed to create pool');
      }
      
      throw error;
    }
  }, [writeContractAsync, address, getAllowance, approve, publicClient]);

  const placeBet = useCallback(async (poolId: bigint, betAmount: bigint, useBitr: boolean = false) => {
    try {
      // For BITR pools, check and handle approval first
      if (useBitr && address) {
        const currentAllowance = await getAllowance(address, CONTRACT_ADDRESSES.POOL_CORE);
        
        if (currentAllowance < betAmount) {
          console.log('BITR approval needed for bet placement');
          toast.loading('Approving BITR tokens...', { id: 'bitr-approval' });
          
          await approve(CONTRACT_ADDRESSES.POOL_CORE, betAmount);
          toast.success('BITR tokens approved!', { id: 'bitr-approval' });
        }
      }
      
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.POOL_CORE,
        abi: CONTRACTS.POOL_CORE.abi,
        functionName: 'placeBet',
        args: [poolId, betAmount],
        value: useBitr ? 0n : betAmount, // Only send ETH if not using BITR
        ...getTransactionOptions(),
      });
      
      console.log('Bet transaction submitted:', txHash);
      toast.loading('Waiting for bet confirmation...', { id: 'bet-placement' });
      
      // Wait for transaction confirmation
      if (!publicClient) {
        throw new Error('Public client not available');
      }
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      
      if (receipt.status !== 'success') {
        throw new Error(`Bet transaction failed with status: ${receipt.status}`);
      }
      
      console.log('✅ Bet transaction confirmed:', txHash);
      toast.success('Bet placed successfully!', { id: 'bet-placement' });
      return txHash;
    } catch (error) {
      console.error('Error placing bet:', error);
      toast.dismiss('bet-placement');
      toast.dismiss('bitr-approval');
      
      if (error instanceof Error && error.message.includes('Transaction failed with status')) {
        toast.error('Bet transaction failed on-chain. Please try again.');
      } else if (error instanceof Error && error.message.includes('insufficient allowance')) {
        toast.error('Insufficient BITR allowance. Please approve more tokens.');
      } else {
        toast.error('Failed to place bet');
      }
      throw error;
    }
  }, [writeContractAsync, publicClient, address, getAllowance, approve]);

  const settlePool = useCallback(async (poolId: bigint, outcome: string) => {
    try {
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.POOL_CORE,
        abi: CONTRACTS.POOL_CORE.abi,
        functionName: 'settlePool',
        args: [poolId, outcome],
        ...getTransactionOptions(),
      });
      
      toast.success('Pool settled successfully!');
      return txHash;
    } catch (error) {
      console.error('Error settling pool:', error);
      toast.error('Failed to settle pool');
      throw error;
    }
  }, [writeContractAsync]);

  return {
    createPool,
    placeBet,
    settlePool,
  };
}

// Boost System Contract Hooks
export function useBoostSystem() {
  const { writeContractAsync } = useWriteContract();

  const boostPool = useCallback(async (poolId: bigint, boostTier: number) => {
    try {
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.BOOST_SYSTEM,
        abi: CONTRACTS.BOOST_SYSTEM.abi,
        functionName: 'boostPool',
        args: [poolId, boostTier],
        ...getTransactionOptions(),
      });
      
      toast.success('Pool boosted successfully!');
      return txHash;
    } catch (error) {
      console.error('Error boosting pool:', error);
      toast.error('Failed to boost pool');
      throw error;
    }
  }, [writeContractAsync]);

  const canBoostPool = useCallback(async (poolId: bigint) => {
    try {
      const result = await executeContractCall(async (client) => {
        return await client.readContract({
          address: CONTRACT_ADDRESSES.BOOST_SYSTEM,
          abi: CONTRACTS.BOOST_SYSTEM.abi,
          functionName: 'canBoostPool',
          args: [poolId],
        });
      });
      return result as boolean;
    } catch (error) {
      console.error('Error checking boost eligibility:', error);
      return false;
    }
  }, []);

  return {
    boostPool,
    canBoostPool,
  };
}

// Factory Contract Hooks
export function usePoolFactory() {
  const { writeContractAsync } = useWriteContract();

  const createPoolWithBoost = useCallback(async (poolData: {
    predictedOutcome: string;
    odds: bigint;
    eventStartTime: bigint;
    eventEndTime: bigint;
    league: string;
    category: string;
    useBitr: boolean;
    maxBetPerUser?: bigint;
    isPrivate?: boolean;
    boostTier?: number;
  }) => {
    try {
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.FACTORY,
        abi: CONTRACTS.FACTORY.abi,
        functionName: 'createPoolWithBoost',
        args: [
          poolData.predictedOutcome,
          poolData.odds,
          poolData.eventStartTime,
          poolData.eventEndTime,
          poolData.league,
          poolData.category,
          poolData.useBitr,
          poolData.maxBetPerUser || BigInt(0),
          poolData.isPrivate || false,
          poolData.boostTier || 0,
        ],
        ...getTransactionOptions(),
      });
      
      toast.success('Pool with boost created successfully!');
      return txHash;
    } catch (error) {
      console.error('Error creating pool with boost:', error);
      toast.error('Failed to create pool with boost');
      throw error;
    }
  }, [writeContractAsync]);

  return {
    createPoolWithBoost,
  };
}

// Reputation System Hooks
export function useReputationSystem() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const getUserReputation = useCallback(async (userAddress?: string) => {
    try {
      const result = await executeContractCall(async (client) => {
        return await client.readContract({
          address: CONTRACT_ADDRESSES.REPUTATION_SYSTEM,
          abi: CONTRACTS.REPUTATION_SYSTEM.abi,
          functionName: 'getUserReputation',
          args: [userAddress || address || '0x0'],
        });
      });
      return result as {
        reputation: bigint;
        tier: number;
        influenceScore: bigint;
        streak: bigint;
        isVerified: boolean;
      };
    } catch (error) {
      console.error('Error getting user reputation:', error);
      return null;
    }
  }, [address]);

  const getUserStats = useCallback(async (userAddress?: string) => {
    try {
      const result = await executeContractCall(async (client) => {
        return await client.readContract({
          address: CONTRACT_ADDRESSES.REPUTATION_SYSTEM,
          abi: CONTRACTS.REPUTATION_SYSTEM.abi,
          functionName: 'getUserStats',
          args: [userAddress || address || '0x0'],
        });
      });
      return result as {
        totalPools: bigint;
        totalBets: bigint;
        totalWinnings: bigint;
        winRate: bigint;
        averageOdds: bigint;
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return null;
    }
  }, [address]);

  return {
    getUserReputation,
    getUserStats,
  };
}

// Faucet Hooks
export function useFaucet() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const claimFaucet = useCallback(async () => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.FAUCET,
        abi: CONTRACTS.FAUCET.abi,
        functionName: 'claimFaucet',
        args: [],
        ...getTransactionOptions(),
      });
      
      toast.success('Faucet claimed successfully!');
      return txHash;
    } catch (error) {
      console.error('Error claiming faucet:', error);
      toast.error('Failed to claim from faucet');
      throw error;
    }
  }, [address, writeContractAsync]);

  const checkEligibility = useCallback(async () => {
    if (!address) return false;

    try {
      const result = await executeContractCall(async (client) => {
        return await client.readContract({
          address: CONTRACT_ADDRESSES.FAUCET,
          abi: CONTRACTS.FAUCET.abi,
          functionName: 'checkEligibility',
          args: [address],
        });
      });
      return result as boolean;
    } catch (error) {
      console.error('Error checking faucet eligibility:', error);
      return false;
    }
  }, [address]);

  return {
    claimFaucet,
    checkEligibility,
  };
}

// Transaction status hook
export function useTransactionStatus(txHash?: `0x${string}`) {
  const { data: receipt, isLoading, isSuccess, isError } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  return {
    receipt,
    isLoading,
    isSuccess,
    isError,
  };
}

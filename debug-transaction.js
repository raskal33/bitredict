#!/usr/bin/env node

const { ethers } = require('ethers');

// Contract configuration
const CONTRACT_ADDRESS = '0xc4715403c3c8e5C282009e5690ef3032e1f87b60';
const RPC_URL = 'https://dream-rpc.somnia.network/';

// Minimal ABI for the functions we need
const ODDYSSEY_ABI = [
  'function entryFee() view returns (uint256)',
  'function dailyCycleId() view returns (uint256)',
  'function placeSlip(tuple(uint64 matchId, uint8 betType, bytes32 selection, uint32 selectedOdd)[] predictions) payable',
  'function getDailyMatches(uint256 cycleId) view returns (tuple(uint64 id, uint64 startTime, uint32 oddsHome, uint32 oddsDraw, uint32 oddsAway, uint32 oddsOver, uint32 oddsUnder, tuple(uint8 moneyline, uint8 overUnder) result)[])'
];

async function debugTransaction() {
  console.log('🔍 Debugging Oddyssey Transaction');
  console.log('==================================');
  
  try {
    // Create provider and contract instance
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ODDYSSEY_ABI, provider);
    
    console.log('📍 Contract Address:', CONTRACT_ADDRESS);
    console.log('');
    
    // Get current contract state
    const entryFee = await contract.entryFee();
    const dailyCycleId = await contract.dailyCycleId();
    
    console.log('📊 Contract State:');
    console.log('  💰 Entry Fee:', ethers.formatEther(entryFee), 'STT');
    console.log('  🔄 Current Cycle ID:', dailyCycleId.toString());
    console.log('');
    
    // Create sample predictions (10 predictions as required)
    const samplePredictions = [];
    for (let i = 0; i < 10; i++) {
      samplePredictions.push({
        matchId: BigInt(1000 + i), // Sample match IDs
        betType: 0, // MONEYLINE
        selection: ethers.keccak256(ethers.toUtf8Bytes('1')), // Home win
        selectedOdd: 2000 // 2.0 odds (scaled by 1000)
      });
    }
    
    console.log('🎯 Sample Transaction Data:');
    console.log('  📝 Predictions Count:', samplePredictions.length);
    console.log('  💰 Entry Fee to Send:', ethers.formatEther(entryFee), 'STT');
    console.log('  🔢 Entry Fee Wei:', entryFee.toString());
    console.log('');
    
    // Test transaction encoding (without sending)
    try {
      const txData = contract.interface.encodeFunctionData('placeSlip', [samplePredictions]);
      console.log('✅ Transaction encoding successful');
      console.log('  📦 Data length:', txData.length, 'characters');
      console.log('  🔗 Function selector:', txData.slice(0, 10));
    } catch (encodeError) {
      console.log('❌ Transaction encoding failed:', encodeError.message);
    }
    
    // Check gas estimation
    try {
      // Create a temporary wallet for gas estimation (won't actually send)
      const tempWallet = ethers.Wallet.createRandom().connect(provider);
      
      const gasEstimate = await contract.placeSlip.estimateGas(
        samplePredictions,
        { 
          value: entryFee,
          from: tempWallet.address 
        }
      );
      
      console.log('⛽ Gas Estimation:');
      console.log('  🔥 Estimated Gas:', gasEstimate.toString());
      console.log('  💸 Gas Price (10 gwei):', ethers.formatUnits('10000000000', 'gwei'), 'gwei');
      console.log('  💰 Estimated Cost:', ethers.formatEther(gasEstimate * BigInt('10000000000')), 'STT');
      
    } catch (gasError) {
      console.log('❌ Gas estimation failed:', gasError.message);
      
      // Check specific error reasons
      if (gasError.message.includes('InsufficientPayment')) {
        console.log('  🚨 ISSUE: Entry fee mismatch!');
        console.log('  💡 Contract expects exactly:', ethers.formatEther(entryFee), 'STT');
      } else if (gasError.message.includes('BettingClosed')) {
        console.log('  🚨 ISSUE: Betting is closed for current cycle!');
      } else if (gasError.message.includes('InvalidPredictionCount')) {
        console.log('  🚨 ISSUE: Invalid prediction count or match IDs!');
      } else if (gasError.message.includes('GameNotActive')) {
        console.log('  🚨 ISSUE: No active game cycle!');
      }
    }
    
    console.log('');
    console.log('🔧 Debugging Summary:');
    console.log('=====================================');
    console.log('1. Contract is deployed and accessible ✅');
    console.log('2. Entry fee is set to', ethers.formatEther(entryFee), 'STT ✅');
    console.log('3. Current cycle ID is', dailyCycleId.toString());
    
    // Check if the issue is with match data
    console.log('');
    console.log('🔍 Potential Issues to Check:');
    console.log('- Are you sending exactly', ethers.formatEther(entryFee), 'STT as the entry fee?');
    console.log('- Are the match IDs in your predictions matching the contract matches?');
    console.log('- Is the current cycle active and accepting bets?');
    console.log('- Are you sending exactly 10 predictions?');
    console.log('- Are the odds values correctly scaled by 1000?');
    
  } catch (error) {
    console.error('❌ Error debugging transaction:', error);
    process.exit(1);
  }
}

// Run the debug script
debugTransaction();

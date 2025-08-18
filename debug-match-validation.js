#!/usr/bin/env node

const { ethers } = require('ethers');

// Contract configuration
const CONTRACT_ADDRESS = '0x31AfDC3978317a1de606e76037429F3e456015C6';
const RPC_URL = 'https://dream-rpc.somnia.network/';

// Minimal ABI for the functions we need
const ODDYSSEY_ABI = [
  'function entryFee() view returns (uint256)',
  'function dailyCycleId() view returns (uint256)',
  'function dailyCycleEndTimes(uint256 cycleId) view returns (uint256)',
  'function isCycleInitialized(uint256 cycleId) view returns (bool)',
  // We'll try to get match data using a simpler approach
  'function dailyMatches(uint256 cycleId, uint256 index) view returns (uint64 id, uint64 startTime, uint32 oddsHome, uint32 oddsDraw, uint32 oddsAway, uint32 oddsOver, uint32 oddsUnder)'
];

async function debugMatchValidation() {
  console.log('🔍 Debugging Match Validation Issues');
  console.log('====================================');
  
  try {
    // Create provider and contract instance
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ODDYSSEY_ABI, provider);
    
    // Get current contract state
    const entryFee = await contract.entryFee();
    const dailyCycleId = await contract.dailyCycleId();
    const cycleEndTime = await contract.dailyCycleEndTimes(dailyCycleId);
    const isInitialized = await contract.isCycleInitialized(dailyCycleId);
    
    console.log('📊 Current Cycle Status:');
    console.log('  🔄 Cycle ID:', dailyCycleId.toString());
    console.log('  ✅ Initialized:', isInitialized);
    console.log('  ⏰ End Time:', new Date(Number(cycleEndTime) * 1000).toISOString());
    console.log('  🕐 Current Time:', new Date().toISOString());
    console.log('  🚪 Betting Open:', Number(cycleEndTime) > Math.floor(Date.now() / 1000));
    console.log('');
    
    // Check if betting is closed
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (Number(cycleEndTime) <= currentTimestamp) {
      console.log('🚨 ISSUE FOUND: Betting is CLOSED!');
      console.log('  ⏰ Cycle ended:', new Date(Number(cycleEndTime) * 1000).toISOString());
      console.log('  🕐 Current time:', new Date().toISOString());
      console.log('  💡 This would trigger "BettingClosed" error');
      console.log('');
    }
    
    // Try to get individual match data
    console.log('🎯 Checking Match Data:');
    const matches = [];
    
    for (let i = 0; i < 10; i++) {
      try {
        const match = await contract.dailyMatches(dailyCycleId, i);
        matches.push({
          index: i,
          id: match.id.toString(),
          startTime: Number(match.startTime),
          oddsHome: Number(match.oddsHome),
          oddsDraw: Number(match.oddsDraw),
          oddsAway: Number(match.oddsAway),
          oddsOver: Number(match.oddsOver),
          oddsUnder: Number(match.oddsUnder)
        });
        
        console.log(`  Match ${i + 1}: ID=${match.id.toString()}, Start=${new Date(Number(match.startTime) * 1000).toISOString()}`);
        
        // Check if match has started
        if (Number(match.startTime) <= currentTimestamp) {
          console.log(`    ⚠️  Match ${i + 1} has already started!`);
        }
        
        // Check if odds are set
        if (Number(match.oddsHome) === 0 || Number(match.oddsDraw) === 0 || Number(match.oddsAway) === 0) {
          console.log(`    ⚠️  Match ${i + 1} has missing moneyline odds!`);
        }
        
        if (Number(match.oddsOver) === 0 || Number(match.oddsUnder) === 0) {
          console.log(`    ⚠️  Match ${i + 1} has missing over/under odds!`);
        }
        
      } catch (matchError) {
        console.log(`  ❌ Match ${i + 1}: Error - ${matchError.message}`);
        break;
      }
    }
    
    console.log('');
    console.log('📋 Validation Summary:');
    console.log('======================');
    
    if (matches.length === 0) {
      console.log('🚨 CRITICAL: No matches found in contract!');
      console.log('  💡 This would trigger "GameNotActive" or similar error');
    } else if (matches.length < 10) {
      console.log('🚨 ISSUE: Only', matches.length, 'matches found, need 10!');
      console.log('  💡 This would trigger "InvalidPredictionCount" error');
    } else {
      console.log('✅ Found all 10 matches');
    }
    
    // Check for common validation issues
    const issues = [];
    
    if (Number(cycleEndTime) <= currentTimestamp) {
      issues.push('Betting is closed for current cycle');
    }
    
    if (!isInitialized) {
      issues.push('Current cycle is not initialized');
    }
    
    if (matches.length < 10) {
      issues.push(`Only ${matches.length} matches available, need 10`);
    }
    
    const matchesStarted = matches.filter(m => m.startTime <= currentTimestamp).length;
    if (matchesStarted > 0) {
      issues.push(`${matchesStarted} matches have already started`);
    }
    
    const matchesWithoutOdds = matches.filter(m => 
      m.oddsHome === 0 || m.oddsDraw === 0 || m.oddsAway === 0 || 
      m.oddsOver === 0 || m.oddsUnder === 0
    ).length;
    
    if (matchesWithoutOdds > 0) {
      issues.push(`${matchesWithoutOdds} matches have missing odds`);
    }
    
    console.log('');
    if (issues.length > 0) {
      console.log('🚨 ISSUES FOUND:');
      issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
    } else {
      console.log('✅ No obvious validation issues found');
      console.log('💡 The issue might be with:');
      console.log('  - Match ID ordering in frontend predictions');
      console.log('  - Odds scaling (should be multiplied by 1000)');
      console.log('  - Selection hash generation');
    }
    
    // Show actual match IDs for frontend reference
    if (matches.length > 0) {
      console.log('');
      console.log('📝 Contract Match IDs (for frontend reference):');
      matches.forEach((match, index) => {
        console.log(`  Position ${index}: Match ID ${match.id}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error debugging match validation:', error);
    process.exit(1);
  }
}

// Run the debug script
debugMatchValidation();

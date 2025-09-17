#!/usr/bin/env node

const { ethers } = require('ethers');

// Contract configuration
const CONTRACT_ADDRESS = '0xc4715403c3c8e5C282009e5690ef3032e1f87b60';
const RPC_URL = 'https://dream-rpc.somnia.network/';

// Minimal ABI for the functions we need
const ODDYSSEY_ABI = [
  'function dailyCycleId() view returns (uint256)',
  'function dailyCycleEndTimes(uint256 cycleId) view returns (uint256)',
  'function dailyMatches(uint256 cycleId, uint256 index) view returns (uint64 id, uint64 startTime, uint32 oddsHome, uint32 oddsDraw, uint32 oddsAway, uint32 oddsOver, uint32 oddsUnder)'
];

async function debugTimingIssue() {
  console.log('🕐 Debugging Timing Issues');
  console.log('==========================');
  
  try {
    // Create provider and contract instance
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ODDYSSEY_ABI, provider);
    
    // Get current cycle and timing
    const dailyCycleId = await contract.dailyCycleId();
    const cycleEndTime = await contract.dailyCycleEndTimes(dailyCycleId);
    
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const cycleEndTimestamp = Number(cycleEndTime);
    
    console.log('⏰ Timing Analysis:');
    console.log('  🔄 Current Cycle ID:', dailyCycleId.toString());
    console.log('  🕐 Current Time:', new Date().toISOString());
    console.log('  🚪 Cycle End Time:', new Date(cycleEndTimestamp * 1000).toISOString());
    console.log('  ⏳ Time Until End:', Math.max(0, cycleEndTimestamp - currentTimestamp), 'seconds');
    console.log('  🚦 Betting Status:', cycleEndTimestamp > currentTimestamp ? '✅ OPEN' : '❌ CLOSED');
    console.log('');
    
    if (cycleEndTimestamp <= currentTimestamp) {
      console.log('🚨 ISSUE FOUND: BETTING IS CLOSED!');
      console.log('  💡 This explains the transaction failures');
      console.log('  🔄 Wait for the next cycle to be started');
      console.log('');
      return;
    }
    
    // Check individual match start times
    console.log('🏆 Match Start Times:');
    let hasStartedMatches = false;
    
    for (let i = 0; i < 10; i++) {
      const match = await contract.dailyMatches(dailyCycleId, i);
      const matchStartTime = Number(match.startTime);
      const hasStarted = matchStartTime <= currentTimestamp;
      
      if (hasStarted) hasStartedMatches = true;
      
      console.log(`  Match ${i + 1} (${match.id.toString()}): ${new Date(matchStartTime * 1000).toISOString()} ${hasStarted ? '❌ STARTED' : '✅ PENDING'}`);
    }
    
    console.log('');
    
    if (hasStartedMatches) {
      console.log('🚨 POTENTIAL ISSUE: Some matches have already started!');
      console.log('  💡 The contract might reject bets on matches that have begun');
      console.log('  🔍 Check if the contract validates individual match start times');
    } else {
      console.log('✅ All matches are still pending - timing looks good');
    }
    
    // Check if there are any other potential issues
    console.log('');
    console.log('🔍 Other Potential Issues:');
    console.log('==========================');
    console.log('1. 🔄 Cycle might not be properly initialized');
    console.log('2. 🎯 Oracle might not have set up the cycle correctly');
    console.log('3. 📊 Match data might be corrupted or incomplete');
    console.log('4. ⛽ Gas limit might be too low (try increasing)');
    console.log('5. 🔐 Contract might be paused or have other restrictions');
    console.log('');
    
    console.log('💡 NEXT STEPS:');
    console.log('===============');
    console.log('1. Wait for a fresh cycle to start');
    console.log('2. Test immediately when betting opens');
    console.log('3. Ensure all 10 predictions are for pending matches');
    console.log('4. Use higher gas limits in the frontend');
    
  } catch (error) {
    console.error('❌ Error debugging timing:', error);
    process.exit(1);
  }
}

// Run the debug script
debugTimingIssue();

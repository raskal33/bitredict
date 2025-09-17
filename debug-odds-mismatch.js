#!/usr/bin/env node

const { ethers } = require('ethers');

// Contract configuration
const CONTRACT_ADDRESS = '0xc4715403c3c8e5C282009e5690ef3032e1f87b60';
const RPC_URL = 'https://dream-rpc.somnia.network/';

// Minimal ABI for the functions we need
const ODDYSSEY_ABI = [
  'function dailyCycleId() view returns (uint256)',
  'function dailyMatches(uint256 cycleId, uint256 index) view returns (uint64 id, uint64 startTime, uint32 oddsHome, uint32 oddsDraw, uint32 oddsAway, uint32 oddsOver, uint32 oddsUnder)',
];

async function debugOddsMismatch() {
  console.log('🔍 Debugging Odds Mismatch Issue');
  console.log('=================================');
  
  try {
    // Create provider and contract instance
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ODDYSSEY_ABI, provider);
    
    // Get current cycle and matches
    const dailyCycleId = await contract.dailyCycleId();
    console.log('🔄 Current Cycle ID:', dailyCycleId.toString());
    console.log('');
    
    // Get all contract matches with exact odds
    const contractMatches = [];
    for (let i = 0; i < 10; i++) {
      const match = await contract.dailyMatches(dailyCycleId, i);
      contractMatches.push({
        position: i,
        id: match.id.toString(),
        oddsHome: Number(match.oddsHome),
        oddsDraw: Number(match.oddsDraw),
        oddsAway: Number(match.oddsAway),
        oddsOver: Number(match.oddsOver),
        oddsUnder: Number(match.oddsUnder)
      });
    }
    
    console.log('📊 Contract Odds (scaled by 1000):');
    contractMatches.forEach((match, index) => {
      console.log(`Match ${index + 1} (ID: ${match.id}):`);
      console.log(`  Home: ${match.oddsHome} (${(match.oddsHome/1000).toFixed(3)})`);
      console.log(`  Draw: ${match.oddsDraw} (${(match.oddsDraw/1000).toFixed(3)})`);
      console.log(`  Away: ${match.oddsAway} (${(match.oddsAway/1000).toFixed(3)})`);
      console.log(`  Over: ${match.oddsOver} (${(match.oddsOver/1000).toFixed(3)})`);
      console.log(`  Under: ${match.oddsUnder} (${(match.oddsUnder/1000).toFixed(3)})`);
      console.log('');
    });
    
    // Simulate the frontend predictions from the previous test
    const frontendPredictions = [
      { matchId: '19433439', prediction: 'X', odds: 3.20 },  // Should be oddsDraw
      { matchId: '19441080', prediction: '1', odds: 3.20 },  // Should be oddsHome
      { matchId: '19434262', prediction: 'Over', odds: 1.72 }, // Should be oddsOver
      { matchId: '19439250', prediction: '2', odds: 5.75 },  // Should be oddsAway
      { matchId: '19387097', prediction: 'Under', odds: 1.66 }, // Should be oddsUnder
      { matchId: '19441076', prediction: '1', odds: 3.00 },  // Should be oddsHome
      { matchId: '19387099', prediction: 'Over', odds: 2.10 }, // Should be oddsOver
      { matchId: '19441074', prediction: 'Under', odds: 1.80 }, // Should be oddsUnder
      { matchId: '19387100', prediction: 'X', odds: 3.20 },  // Should be oddsDraw
      { matchId: '19427458', prediction: '2', odds: 3.70 }   // Should be oddsAway
    ];
    
    console.log('🚨 ODDS VALIDATION ERRORS:');
    console.log('==========================');
    
    let hasErrors = false;
    
    frontendPredictions.forEach((pred, index) => {
      const contractMatch = contractMatches.find(m => m.id === pred.matchId);
      if (!contractMatch) {
        console.log(`❌ Match ${pred.matchId} not found in contract!`);
        hasErrors = true;
        return;
      }
      
      let expectedOdd;
      let actualOdd = Math.round(pred.odds * 1000);
      
      switch (pred.prediction) {
        case '1':
          expectedOdd = contractMatch.oddsHome;
          break;
        case 'X':
          expectedOdd = contractMatch.oddsDraw;
          break;
        case '2':
          expectedOdd = contractMatch.oddsAway;
          break;
        case 'Over':
          expectedOdd = contractMatch.oddsOver;
          break;
        case 'Under':
          expectedOdd = contractMatch.oddsUnder;
          break;
        default:
          console.log(`❌ Invalid prediction: ${pred.prediction}`);
          hasErrors = true;
          return;
      }
      
      if (actualOdd !== expectedOdd) {
        console.log(`❌ Match ${pred.matchId} (${pred.prediction}):`);
        console.log(`   Frontend odds: ${pred.odds} (scaled: ${actualOdd})`);
        console.log(`   Contract odds: ${(expectedOdd/1000).toFixed(3)} (scaled: ${expectedOdd})`);
        console.log(`   Difference: ${actualOdd - expectedOdd}`);
        hasErrors = true;
      } else {
        console.log(`✅ Match ${pred.matchId} (${pred.prediction}): Odds match!`);
      }
    });
    
    if (!hasErrors) {
      console.log('✅ All odds match perfectly!');
    } else {
      console.log('');
      console.log('💡 SOLUTION:');
      console.log('The frontend must use the EXACT odds from the contract.');
      console.log('When a user selects a prediction, fetch the current odds from the contract');
      console.log('and use those exact values, not the odds from the API or frontend cache.');
      console.log('');
      console.log('🔧 Fix in oddysseyContractService.ts:');
      console.log('1. When formatting predictions, get odds from contract matches');
      console.log('2. Validate that user selection matches available contract odds');
      console.log('3. Use contract odds in the selectedOdd field');
    }
    
  } catch (error) {
    console.error('❌ Error debugging odds mismatch:', error);
    process.exit(1);
  }
}

// Run the debug script
debugOddsMismatch();

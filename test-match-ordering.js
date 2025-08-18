#!/usr/bin/env node

const { ethers } = require('ethers');

// Contract configuration
const CONTRACT_ADDRESS = '0x31AfDC3978317a1de606e76037429F3e456015C6';
const RPC_URL = 'https://dream-rpc.somnia.network/';

// Minimal ABI for the functions we need
const ODDYSSEY_ABI = [
  'function dailyCycleId() view returns (uint256)',
  'function dailyMatches(uint256 cycleId, uint256 index) view returns (uint64 id, uint64 startTime, uint32 oddsHome, uint32 oddsDraw, uint32 oddsAway, uint32 oddsOver, uint32 oddsUnder)',
  'function placeSlip(tuple(uint64 matchId, uint8 betType, bytes32 selection, uint32 selectedOdd)[] predictions) payable'
];

async function testMatchOrdering() {
  console.log('🔍 Testing Match Ordering Logic');
  console.log('===============================');
  
  try {
    // Create provider and contract instance
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ODDYSSEY_ABI, provider);
    
    // Get current cycle and matches
    const dailyCycleId = await contract.dailyCycleId();
    console.log('🔄 Current Cycle ID:', dailyCycleId.toString());
    console.log('');
    
    // Get all contract matches in order
    const contractMatches = [];
    for (let i = 0; i < 10; i++) {
      const match = await contract.dailyMatches(dailyCycleId, i);
      contractMatches.push({
        position: i,
        id: match.id.toString(),
        startTime: Number(match.startTime),
        oddsHome: Number(match.oddsHome),
        oddsDraw: Number(match.oddsDraw),
        oddsAway: Number(match.oddsAway),
        oddsOver: Number(match.oddsOver),
        oddsUnder: Number(match.oddsUnder)
      });
    }
    
    console.log('📋 Contract Matches (in contract order):');
    contractMatches.forEach((match, index) => {
      console.log(`  ${index}: Match ID ${match.id} (Home: ${(match.oddsHome/1000).toFixed(2)}, Draw: ${(match.oddsDraw/1000).toFixed(2)}, Away: ${(match.oddsAway/1000).toFixed(2)})`);
    });
    console.log('');
    
    // Simulate frontend predictions (random order to test sorting)
    const frontendPredictions = [
      { matchId: contractMatches[5].id, prediction: '1', odds: contractMatches[5].oddsHome / 1000 },
      { matchId: contractMatches[0].id, prediction: 'X', odds: contractMatches[0].oddsDraw / 1000 },
      { matchId: contractMatches[9].id, prediction: '2', odds: contractMatches[9].oddsAway / 1000 },
      { matchId: contractMatches[2].id, prediction: 'Over', odds: contractMatches[2].oddsOver / 1000 },
      { matchId: contractMatches[7].id, prediction: 'Under', odds: contractMatches[7].oddsUnder / 1000 },
      { matchId: contractMatches[1].id, prediction: '1', odds: contractMatches[1].oddsHome / 1000 },
      { matchId: contractMatches[8].id, prediction: 'X', odds: contractMatches[8].oddsDraw / 1000 },
      { matchId: contractMatches[3].id, prediction: '2', odds: contractMatches[3].oddsAway / 1000 },
      { matchId: contractMatches[6].id, prediction: 'Over', odds: contractMatches[6].oddsOver / 1000 },
      { matchId: contractMatches[4].id, prediction: 'Under', odds: contractMatches[4].oddsUnder / 1000 }
    ];
    
    console.log('🎯 Frontend Predictions (random order):');
    frontendPredictions.forEach((pred, index) => {
      console.log(`  ${index}: Match ID ${pred.matchId} -> ${pred.prediction} @ ${pred.odds.toFixed(2)}`);
    });
    console.log('');
    
    // Apply the frontend ordering logic (same as in oddysseyContractService.ts)
    const orderedPredictions = contractMatches.map((contractMatch, index) => {
      // Find the user's prediction for this contract match
      const userPrediction = frontendPredictions.find(pred => 
        pred.matchId.toString() === contractMatch.id.toString()
      );
      
      if (!userPrediction) {
        throw new Error(`Missing prediction for match ${contractMatch.id} at position ${index + 1}`);
      }
      
      console.log(`✅ Match ${index + 1}: Contract ID ${contractMatch.id} -> User prediction for ${userPrediction.matchId}`);
      return userPrediction;
    });
    
    console.log('');
    console.log('📝 Ordered Predictions (contract order):');
    orderedPredictions.forEach((pred, index) => {
      console.log(`  ${index}: Match ID ${pred.matchId} -> ${pred.prediction} @ ${pred.odds.toFixed(2)}`);
    });
    console.log('');
    
    // Convert to contract format
    function hashSelection(selection) {
      return ethers.keccak256(ethers.toUtf8Bytes(selection));
    }
    
    function formatPredictionForContract(prediction) {
      let betType;
      let selection;
    
      // Determine bet type and selection
      if (['1', 'X', '2'].includes(prediction.prediction)) {
        betType = 0; // MONEYLINE
        selection = hashSelection(prediction.prediction);
      } else {
        betType = 1; // OVER_UNDER
        selection = hashSelection(prediction.prediction);
      }
    
      return {
        matchId: BigInt(prediction.matchId),
        betType,
        selection,
        selectedOdd: Math.round(prediction.odds * 1000) // Contract uses 1000 scaling factor
      };
    }
    
    const contractPredictions = orderedPredictions.map((pred, index) => {
      // Validate against contract data
      const contractMatch = contractMatches[index];
      if (contractMatch && pred.matchId.toString() !== contractMatch.id.toString()) {
        throw new Error(`Match order mismatch at position ${index + 1}: expected ${contractMatch.id}, got ${pred.matchId}`);
      }
      
      return formatPredictionForContract(pred);
    });
    
    console.log('🔧 Contract Format Predictions:');
    contractPredictions.forEach((pred, index) => {
      console.log(`  ${index}: Match ID ${pred.matchId.toString()}, BetType: ${pred.betType}, Odd: ${pred.selectedOdd}`);
    });
    console.log('');
    
    // Test the actual transaction
    console.log('🧪 Testing Transaction...');
    try {
      const entryFee = ethers.parseEther('0.5');
      
      // Create a temporary wallet for testing (won't actually send)
      const tempWallet = ethers.Wallet.createRandom().connect(provider);
      
      const gasEstimate = await contract.placeSlip.estimateGas(
        contractPredictions,
        { 
          value: entryFee,
          from: tempWallet.address 
        }
      );
      
      console.log('✅ Transaction validation PASSED!');
      console.log('  ⛽ Estimated Gas:', gasEstimate.toString());
      
    } catch (txError) {
      console.log('❌ Transaction validation FAILED:', txError.message);
      
      // Detailed error analysis
      if (txError.message.includes('InvalidPredictionCount')) {
        console.log('  🚨 Issue: Match ID mismatch - predictions not in correct order');
      } else if (txError.message.includes('OddsMismatch')) {
        console.log('  🚨 Issue: Odds values don\'t match contract odds');
      } else if (txError.message.includes('InvalidSelection')) {
        console.log('  🚨 Issue: Selection hash generation problem');
      } else if (txError.message.includes('InsufficientPayment')) {
        console.log('  🚨 Issue: Entry fee amount incorrect');
      } else {
        console.log('  🚨 Unknown issue - check contract state and match data');
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing match ordering:', error);
    process.exit(1);
  }
}

// Run the test
testMatchOrdering();

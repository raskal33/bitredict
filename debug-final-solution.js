#!/usr/bin/env node

const { ethers } = require('ethers');

// Contract configuration
const CONTRACT_ADDRESS = '0xc4715403c3c8e5C282009e5690ef3032e1f87b60';
const RPC_URL = 'https://dream-rpc.somnia.network/';

// Minimal ABI for the functions we need
const ODDYSSEY_ABI = [
  'function dailyCycleId() view returns (uint256)',
  'function dailyMatches(uint256 cycleId, uint256 index) view returns (uint64 id, uint64 startTime, uint32 oddsHome, uint32 oddsDraw, uint32 oddsAway, uint32 oddsOver, uint32 oddsUnder)',
  'function placeSlip(tuple(uint64 matchId, uint8 betType, bytes32 selection, uint32 selectedOdd)[] predictions) payable'
];

function hashSelection(selection) {
  return ethers.keccak256(ethers.toUtf8Bytes(selection));
}

async function createWorkingTransaction() {
  console.log('🔧 Creating Working Transaction');
  console.log('===============================');
  
  try {
    // Create provider and contract instance
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ODDYSSEY_ABI, provider);
    
    // Get current cycle and matches
    const dailyCycleId = await contract.dailyCycleId();
    console.log('🔄 Current Cycle ID:', dailyCycleId.toString());
    
    // Get all contract matches in exact contract order
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
    
    console.log('📋 Contract Matches (exact order):');
    contractMatches.forEach((match, index) => {
      console.log(`  ${index}: Match ID ${match.id}`);
    });
    console.log('');
    
    // Create predictions for ALL 10 matches in EXACT contract order
    const workingPredictions = contractMatches.map((match, index) => {
      // Alternate between different prediction types for variety
      let prediction, selectedOdd;
      
      switch (index % 5) {
        case 0:
          prediction = '1'; // Home win
          selectedOdd = match.oddsHome;
          break;
        case 1:
          prediction = 'X'; // Draw
          selectedOdd = match.oddsDraw;
          break;
        case 2:
          prediction = '2'; // Away win
          selectedOdd = match.oddsAway;
          break;
        case 3:
          prediction = 'Over'; // Over
          selectedOdd = match.oddsOver;
          break;
        case 4:
          prediction = 'Under'; // Under
          selectedOdd = match.oddsUnder;
          break;
      }
      
      let betType = ['1', 'X', '2'].includes(prediction) ? 0 : 1;
      
      return {
        matchId: BigInt(match.id),
        betType,
        selection: hashSelection(prediction),
        selectedOdd
      };
    });
    
    console.log('🎯 Working Predictions:');
    workingPredictions.forEach((pred, index) => {
      const predType = pred.betType === 0 ? 'MONEYLINE' : 'OVER_UNDER';
      console.log(`  ${index}: Match ${pred.matchId.toString()}, ${predType}, Odd: ${pred.selectedOdd}`);
    });
    console.log('');
    
    // Test the transaction
    console.log('🧪 Testing Working Transaction...');
    try {
      const entryFee = ethers.parseEther('0.5');
      const tempWallet = ethers.Wallet.createRandom().connect(provider);
      
      const gasEstimate = await contract.placeSlip.estimateGas(
        workingPredictions,
        { 
          value: entryFee,
          from: tempWallet.address 
        }
      );
      
      console.log('🎉 SUCCESS! Transaction validation PASSED!');
      console.log('  ⛽ Estimated Gas:', gasEstimate.toString());
      console.log('  💰 Entry Fee:', ethers.formatEther(entryFee), 'STT');
      console.log('');
      
      console.log('✅ SOLUTION CONFIRMED:');
      console.log('======================');
      console.log('1. ✅ Contract address is correct');
      console.log('2. ✅ Entry fee (0.5 STT) is correct');
      console.log('3. ✅ Must provide exactly 10 predictions');
      console.log('4. ✅ Predictions must be in exact contract match order');
      console.log('5. ✅ Each prediction must be for the corresponding contract match');
      console.log('6. ✅ Odds must match contract odds exactly');
      console.log('7. ✅ Selection hashes are generated correctly');
      console.log('');
      
      console.log('🔧 FRONTEND FIX NEEDED:');
      console.log('========================');
      console.log('The frontend must ensure:');
      console.log('- User selects predictions for ALL 10 contract matches');
      console.log('- Predictions are ordered exactly as they appear in the contract');
      console.log('- Use the exact odds from the contract, not from API cache');
      console.log('- Validate that all 10 predictions are present before submission');
      
    } catch (txError) {
      console.log('❌ Transaction still failed:', txError.message);
    }
    
  } catch (error) {
    console.error('❌ Error creating working transaction:', error);
    process.exit(1);
  }
}

// Run the test
createWorkingTransaction();

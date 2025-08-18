#!/usr/bin/env node

const { ethers } = require('ethers');

// Contract configuration
const CONTRACT_ADDRESS = '0x31AfDC3978317a1de606e76037429F3e456015C6';
const RPC_URL = 'https://dream-rpc.somnia.network/';

// Test the exact same logic as the frontend
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

async function debugSelectionHash() {
  console.log('🔍 Debugging Selection Hash Generation');
  console.log('======================================');
  
  // Test all possible selections
  const selections = ['1', 'X', '2', 'Over', 'Under'];
  
  console.log('🔐 Selection Hashes:');
  selections.forEach(sel => {
    const hash = hashSelection(sel);
    console.log(`  "${sel}" -> ${hash}`);
  });
  console.log('');
  
  // Test the exact predictions from our previous test
  const testPredictions = [
    { matchId: '19433439', prediction: 'X', odds: 3.20 },
    { matchId: '19441080', prediction: '1', odds: 3.20 },
    { matchId: '19434262', prediction: 'Over', odds: 1.72 },
    { matchId: '19439250', prediction: '2', odds: 5.75 },
    { matchId: '19387097', prediction: 'Under', odds: 1.66 }
  ];
  
  console.log('🎯 Contract Format Test:');
  testPredictions.forEach((pred, index) => {
    const formatted = formatPredictionForContract(pred);
    console.log(`${index + 1}. Match ${pred.matchId} (${pred.prediction}):`);
    console.log(`   matchId: ${formatted.matchId.toString()}`);
    console.log(`   betType: ${formatted.betType} (${formatted.betType === 0 ? 'MONEYLINE' : 'OVER_UNDER'})`);
    console.log(`   selection: ${formatted.selection}`);
    console.log(`   selectedOdd: ${formatted.selectedOdd}`);
    console.log('');
  });
  
  // Test with the actual contract
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    
    // Create a simple test with just one prediction to isolate the issue
    const singlePrediction = [{
      matchId: BigInt('19433439'),
      betType: 0, // MONEYLINE
      selection: hashSelection('X'), // Draw
      selectedOdd: 3200 // Exact contract odd
    }];
    
    console.log('🧪 Testing Single Prediction:');
    console.log('  Match ID:', singlePrediction[0].matchId.toString());
    console.log('  Bet Type:', singlePrediction[0].betType);
    console.log('  Selection Hash:', singlePrediction[0].selection);
    console.log('  Selected Odd:', singlePrediction[0].selectedOdd);
    console.log('');
    
    // Test transaction encoding
    const contractABI = [
      'function placeSlip(tuple(uint64 matchId, uint8 betType, bytes32 selection, uint32 selectedOdd)[] predictions) payable'
    ];
    
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);
    
    try {
      const txData = contract.interface.encodeFunctionData('placeSlip', [singlePrediction]);
      console.log('✅ Single prediction encoding successful');
      console.log('  Data length:', txData.length, 'characters');
      
      // Try gas estimation with single prediction
      const tempWallet = ethers.Wallet.createRandom().connect(provider);
      const entryFee = ethers.parseEther('0.5');
      
      const gasEstimate = await contract.placeSlip.estimateGas(
        singlePrediction,
        { 
          value: entryFee,
          from: tempWallet.address 
        }
      );
      
      console.log('✅ Single prediction gas estimation successful!');
      console.log('  Gas:', gasEstimate.toString());
      
    } catch (singleError) {
      console.log('❌ Single prediction failed:', singleError.message);
      
      if (singleError.message.includes('InvalidPredictionCount')) {
        console.log('  🚨 Issue: Contract expects exactly 10 predictions, not 1');
        console.log('  💡 The contract validates that exactly 10 predictions are provided');
      }
    }
    
    // Now test with exactly 10 predictions using the same match ID
    console.log('');
    console.log('🧪 Testing with 10 Identical Predictions (same match):');
    
    const tenPredictions = Array(10).fill(null).map(() => ({
      matchId: BigInt('19433439'),
      betType: 0,
      selection: hashSelection('X'),
      selectedOdd: 3200
    }));
    
    try {
      const gasEstimate = await contract.placeSlip.estimateGas(
        tenPredictions,
        { 
          value: entryFee,
          from: tempWallet.address 
        }
      );
      
      console.log('✅ Ten identical predictions successful!');
      console.log('  Gas:', gasEstimate.toString());
      
    } catch (tenError) {
      console.log('❌ Ten identical predictions failed:', tenError.message);
      
      if (tenError.message.includes('InvalidPredictionCount')) {
        console.log('  🚨 Issue: Match ID validation - predictions must be for different matches');
        console.log('  💡 Each prediction must be for a different match in the correct order');
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing with contract:', error);
  }
}

// Run the debug script
debugSelectionHash();

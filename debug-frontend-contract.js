#!/usr/bin/env node

/**
 * Debug Frontend Contract Issue
 * 
 * This script replicates the exact frontend contract calls to identify the issue
 */

const { createPublicClient, http } = require('viem');

// Frontend chain configuration (exact copy)
const somniaChain = {
  id: 50312,
  name: 'Somnia Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'STT',
    symbol: 'STT',
  },
  rpcUrls: {
    default: {
      http: ['https://dream-rpc.somnia.network/'],
    },
  },
  blockExplorers: {
    default: { name: 'Somnia Explorer', url: 'https://somnia-testnet.explorer.caldera.xyz' },
  },
  testnet: true,
};

// Contract address from working backend
const ODDYSSEY_ADDRESS = '0x31AfDC3978317a1de606e76037429F3e456015C6';

// Load ABI from the correct path
const OddysseyArtifact = require('./contracts/abis/Oddyssey.json');
const ODDYSSEY_ABI = OddysseyArtifact.abi;

async function debugFrontendContract() {
  console.log('🔍 Debugging Frontend Contract Issue...');
  console.log(`📍 Contract Address: ${ODDYSSEY_ADDRESS}`);
  console.log(`🌐 Network: ${somniaChain.name} (${somniaChain.id})`);
  
  try {
    // Create public client (same as frontend)
    const publicClient = createPublicClient({
      chain: somniaChain,
      transport: http()
    });

    console.log('\n🎯 Test 1: Frontend-style getCurrentCycleInfo()');
    
    // Test the exact frontend call
    const cycleInfo = await publicClient.readContract({
      address: ODDYSSEY_ADDRESS,
      abi: ODDYSSEY_ABI,
      functionName: 'getCurrentCycleInfo'
    });

    console.log('✅ getCurrentCycleInfo() Result:', cycleInfo);
    console.log(`   Cycle ID: ${cycleInfo[0]}`);
    console.log(`   State: ${cycleInfo[1]}`);
    console.log(`   End Time: ${new Date(Number(cycleInfo[2]) * 1000).toLocaleString()}`);

    if (cycleInfo[0] === 0n) {
      console.log('❌ No active cycle found');
      return;
    }

    console.log('\n🎯 Test 2: Frontend-style getDailyMatches()');
    
    const cycleId = cycleInfo[0];
    const matches = await publicClient.readContract({
      address: ODDYSSEY_ADDRESS,
      abi: ODDYSSEY_ABI,
      functionName: 'getDailyMatches',
      args: [cycleId]
    });

    console.log('✅ getDailyMatches() Result:', matches);
    console.log(`   Match Count: ${matches.length}`);
    
    if (matches.length > 0) {
      console.log('✅ SUCCESS: Frontend-style calls work perfectly!');
      console.log('🎯 The issue is likely the contract address in the frontend environment');
    } else {
      console.log('❌ No matches returned');
    }

  } catch (error) {
    console.error('❌ Frontend contract call failed:', error.message);
    console.log('🔍 This confirms the frontend contract issue');
  }
}

debugFrontendContract();

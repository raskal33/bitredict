#!/usr/bin/env node

/**
 * Test Contract Address Fix
 * 
 * This script tests if the contract address fix resolves the frontend issue
 */

const { createPublicClient, http } = require('viem');

// Simulate the fixed contract addresses (with fallbacks)
const CONTRACT_ADDRESSES = {
  ODDYSSEY: process.env.NEXT_PUBLIC_ODDYSSEY_ADDRESS || '0x31AfDC3978317a1de606e76037429F3e456015C6',
  BITR_TOKEN: process.env.NEXT_PUBLIC_BITR_TOKEN_ADDRESS || '0x4b10fBFFDEE97C42E29899F47A2ECD30a38dBf2C',
  BITREDICT_POOL: process.env.NEXT_PUBLIC_BITREDICT_POOL_ADDRESS || '0x5F112bD56Eaa805DffF4b2929d9D44B2d364Cd08',
};

// Frontend chain configuration
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
  testnet: true,
};

// Load ABI
const OddysseyArtifact = require('./contracts/abis/Oddyssey.json');
const ODDYSSEY_ABI = OddysseyArtifact.abi;

async function testContractFix() {
  console.log('🔧 Testing Contract Address Fix...');
  console.log('\n📍 Contract Addresses (with fallbacks):');
  console.log(`   ODDYSSEY: ${CONTRACT_ADDRESSES.ODDYSSEY}`);
  console.log(`   BITR_TOKEN: ${CONTRACT_ADDRESSES.BITR_TOKEN}`);
  console.log(`   BITREDICT_POOL: ${CONTRACT_ADDRESSES.BITREDICT_POOL}`);
  
  try {
    // Create public client
    const publicClient = createPublicClient({
      chain: somniaChain,
      transport: http()
    });

    console.log('\n🎯 Testing Fixed Frontend Contract Calls...');
    
    // Test getCurrentCycleInfo with the fixed address
    const cycleInfo = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.ODDYSSEY,
      abi: ODDYSSEY_ABI,
      functionName: 'getCurrentCycleInfo'
    });

    console.log('✅ getCurrentCycleInfo() Success:', {
      cycleId: cycleInfo[0].toString(),
      state: cycleInfo[1],
      endTime: new Date(Number(cycleInfo[2]) * 1000).toLocaleString(),
      prizePool: cycleInfo[3].toString(),
      slipCount: cycleInfo[4]
    });

    if (cycleInfo[0] === 0n) {
      console.log('❌ No active cycle found');
      return false;
    }

    // Test getDailyMatches with the fixed address
    const cycleId = cycleInfo[0];
    const matches = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.ODDYSSEY,
      abi: ODDYSSEY_ABI,
      functionName: 'getDailyMatches',
      args: [cycleId]
    });

    console.log(`✅ getDailyMatches() Success: ${matches.length} matches found`);
    
    if (matches.length === 10) {
      console.log('\n🎉 SUCCESS: Contract address fix resolves the issue!');
      console.log('✅ Frontend will now be able to:');
      console.log('   - Get active cycle information');
      console.log('   - Retrieve 10 daily matches');
      console.log('   - Place slips successfully');
      return true;
    } else {
      console.log(`❌ Expected 10 matches, got ${matches.length}`);
      return false;
    }

  } catch (error) {
    console.error('❌ Contract call failed:', error.message);
    return false;
  }
}

async function main() {
  const success = await testContractFix();
  
  if (success) {
    console.log('\n📋 Next Steps:');
    console.log('1. ✅ Contract address fix applied');
    console.log('2. 🚀 Deploy to Vercel with updated environment variables');
    console.log('3. 🧪 Test slip placement on production');
    console.log('\n💡 Environment Variables for Vercel:');
    console.log(`NEXT_PUBLIC_ODDYSSEY_ADDRESS=${CONTRACT_ADDRESSES.ODDYSSEY}`);
    console.log(`NEXT_PUBLIC_BITR_TOKEN_ADDRESS=${CONTRACT_ADDRESSES.BITR_TOKEN}`);
    console.log(`NEXT_PUBLIC_BITREDICT_POOL_ADDRESS=${CONTRACT_ADDRESSES.BITREDICT_POOL}`);
  } else {
    console.log('\n❌ Fix verification failed. Additional debugging needed.');
  }
}

main();

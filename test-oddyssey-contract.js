#!/usr/bin/env node

/**
 * Test script to verify Oddyssey contract connection
 */

const { createPublicClient, http, defineChain } = require('viem');

// Define Somnia Testnet chain
const somniaTestnet = defineChain({
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
    default: { name: 'Somnia Explorer', url: 'https://shannon-explorer.somnia.network' },
  },
  testnet: true,
});

// Contract address
const ODDYSSEY_ADDRESS = '0xfe20e7dAcff3Ca602ba27fCE3052a505278E489b';

// Basic ABI for testing
const ODDYSSEY_ABI = [
  {
    "inputs": [],
    "name": "dailyCycleId",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "entryFee",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCurrentCycleInfo",
    "outputs": [
      {"internalType": "uint256", "name": "cycleId", "type": "uint256"},
      {"internalType": "uint8", "name": "state", "type": "uint8"},
      {"internalType": "uint256", "name": "endTime", "type": "uint256"},
      {"internalType": "uint256", "name": "prizePool", "type": "uint256"},
      {"internalType": "uint32", "name": "cycleSlipCount", "type": "uint32"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

async function testContractConnection() {
  console.log('🔍 Testing Oddyssey contract connection...');
  console.log('📊 Contract address:', ODDYSSEY_ADDRESS);
  console.log('🌐 RPC URL: https://dream-rpc.somnia.network/');
  
  const publicClient = createPublicClient({
    chain: somniaTestnet,
    transport: http(),
  });

  try {
    // Test 1: Get current cycle ID
    console.log('\n📈 Testing getCurrentCycle...');
    const cycleId = await publicClient.readContract({
      address: ODDYSSEY_ADDRESS,
      abi: ODDYSSEY_ABI,
      functionName: 'dailyCycleId',
    });
    console.log('✅ Current cycle ID:', cycleId.toString());

    // Test 2: Get entry fee
    console.log('\n💰 Testing getEntryFee...');
    const entryFee = await publicClient.readContract({
      address: ODDYSSEY_ADDRESS,
      abi: ODDYSSEY_ABI,
      functionName: 'entryFee',
    });
    console.log('✅ Entry fee:', entryFee.toString(), 'wei');

    // Test 3: Get current cycle info
    console.log('\n📋 Testing getCurrentCycleInfo...');
    const cycleInfo = await publicClient.readContract({
      address: ODDYSSEY_ADDRESS,
      abi: ODDYSSEY_ABI,
      functionName: 'getCurrentCycleInfo',
    });
    
    const [cycleIdInfo, state, endTime, prizePool, slipCount] = cycleInfo;
    console.log('✅ Cycle info:', {
      cycleId: cycleIdInfo.toString(),
      state: Number(state),
      endTime: new Date(Number(endTime) * 1000).toISOString(),
      prizePool: (Number(prizePool) / 1e18).toFixed(4) + ' STT',
      slipCount: Number(slipCount)
    });

    console.log('\n🎉 All contract tests passed successfully!');
    console.log('✅ Contract is properly deployed and accessible');
    
  } catch (error) {
    console.error('❌ Contract connection failed:', error.message);
    console.error('Full error:', error);
  }
}

testContractConnection();

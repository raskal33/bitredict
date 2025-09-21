#!/usr/bin/env node

const { createPublicClient, http } = require('viem');

// Somnia network configuration
const publicClient = createPublicClient({
  chain: {
    id: 50312,
    name: 'Somnia',
    nativeCurrency: {
      decimals: 18,
      name: 'ETH',
      symbol: 'ETH',
    },
    rpcUrls: {
      default: {
        http: ['https://dream-rpc.somnia.network/']
      }
    }
  },
  transport: http('https://dream-rpc.somnia.network/')
});

const FRONTEND_CONTRACT = '0xc4715403c3c8e5C282009e5690ef3032e1f87b60'; // Frontend
const BACKEND_CONTRACT = '0x31AfDC3978317a1de606e76037429F3e456015C6';  // Backend

// Basic ABI for the functions we need to test
const ODDYSSEY_ABI = [
  {
    "inputs": [],
    "name": "getCurrentCycleInfo",
    "outputs": [
      {"internalType": "uint256", "name": "cycleId", "type": "uint256"},
      {"internalType": "uint8", "name": "status", "type": "uint8"},
      {"internalType": "uint256", "name": "startTime", "type": "uint256"},
      {"internalType": "uint256", "name": "endTime", "type": "uint256"},
      {"internalType": "uint256", "name": "prizePool", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "cycleId", "type": "uint256"}],
    "name": "getDailyMatches",
    "outputs": [
      {
        "components": [
          {"internalType": "uint256", "name": "id", "type": "uint256"},
          {"internalType": "uint256", "name": "startTime", "type": "uint256"},
          {"internalType": "uint256", "name": "oddsHome", "type": "uint256"},
          {"internalType": "uint256", "name": "oddsDraw", "type": "uint256"},
          {"internalType": "uint256", "name": "oddsAway", "type": "uint256"},
          {"internalType": "uint256", "name": "oddsOver", "type": "uint256"},
          {"internalType": "uint256", "name": "oddsUnder", "type": "uint256"},
          {"internalType": "string", "name": "homeTeam", "type": "string"},
          {"internalType": "string", "name": "awayTeam", "type": "string"},
          {"internalType": "string", "name": "league", "type": "string"}
        ],
        "internalType": "struct IOddyssey.Match[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCurrentCycle",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

async function checkContract(address, name) {
  console.log(`\n🔍 Checking ${name} Contract: ${address}`);
  console.log('=' .repeat(60));

  try {
    // Check current cycle
    const currentCycle = await publicClient.readContract({
      address: address,
      abi: ODDYSSEY_ABI,
      functionName: 'getCurrentCycle'
    });
    console.log('   Current Cycle ID:', currentCycle.toString());

    const cycleInfo = await publicClient.readContract({
      address: address,
      abi: ODDYSSEY_ABI,
      functionName: 'getCurrentCycleInfo'
    });
    
    console.log('   Cycle Info:');
    console.log('     - Cycle ID:', cycleInfo[0].toString());
    console.log('     - Status:', cycleInfo[1].toString());
    console.log('     - Start Time:', new Date(Number(cycleInfo[2]) * 1000).toISOString());
    console.log('     - End Time:', new Date(Number(cycleInfo[3]) * 1000).toISOString());
    console.log('     - Prize Pool:', cycleInfo[4].toString());

    // Get matches for current cycle
    try {
      const matches = await publicClient.readContract({
        address: address,
        abi: ODDYSSEY_ABI,
        functionName: 'getDailyMatches',
        args: [currentCycle]
      });

      console.log(`   Matches: ${matches.length} found`);
      if (matches.length > 0) {
        console.log('   First match:');
        const match = matches[0];
        console.log(`     - ID: ${match.id.toString()}`);
        console.log(`     - Home: "${match.homeTeam}"`);
        console.log(`     - Away: "${match.awayTeam}"`);
        console.log(`     - League: "${match.league}"`);
        console.log(`     - Odds: H:${match.oddsHome} D:${match.oddsDraw} A:${match.oddsAway}`);
      }
    } catch (error) {
      console.log('   ❌ Error fetching matches:', error.message);
    }

    return {
      address,
      currentCycle: currentCycle.toString(),
      isActive: currentCycle > 0n || cycleInfo[4] > 0n
    };

  } catch (error) {
    console.log(`   ❌ Error checking ${name} contract:`, error.message);
    return {
      address,
      currentCycle: '0',
      isActive: false,
      error: error.message
    };
  }
}

async function main() {
  console.log('🔍 Comparing Oddyssey Contracts...');
  console.log('🌐 Network: Somnia (Chain ID: 50312)');
  
  const frontendResult = await checkContract(FRONTEND_CONTRACT, 'FRONTEND');
  const backendResult = await checkContract(BACKEND_CONTRACT, 'BACKEND');

  console.log('\n' + '=' .repeat(80));
  console.log('📊 COMPARISON SUMMARY');
  console.log('=' .repeat(80));
  
  console.log('Frontend Contract:', frontendResult.address);
  console.log('  - Current Cycle:', frontendResult.currentCycle);
  console.log('  - Is Active:', frontendResult.isActive);
  if (frontendResult.error) console.log('  - Error:', frontendResult.error);
  
  console.log('\nBackend Contract:', backendResult.address);
  console.log('  - Current Cycle:', backendResult.currentCycle);
  console.log('  - Is Active:', backendResult.isActive);
  if (backendResult.error) console.log('  - Error:', backendResult.error);

  console.log('\n💡 RECOMMENDATION:');
  if (backendResult.isActive && !frontendResult.isActive) {
    console.log('✅ Backend contract has active cycles, frontend contract is empty');
    console.log('🔧 SOLUTION: Update frontend to use backend contract address');
    console.log(`   Set NEXT_PUBLIC_ODDYSSEY_ADDRESS=${backendResult.address}`);
  } else if (frontendResult.isActive && !backendResult.isActive) {
    console.log('✅ Frontend contract has active cycles, backend contract is empty'); 
    console.log('🔧 SOLUTION: Update backend to use frontend contract address');
    console.log(`   Set ODDYSSEY_ADDRESS=${frontendResult.address} in fly secrets`);
  } else if (backendResult.isActive && frontendResult.isActive) {
    console.log('⚠️ Both contracts have active cycles - need to choose one');
  } else {
    console.log('❌ Neither contract has active cycles - both need initialization');
  }
}

main().catch(console.error);

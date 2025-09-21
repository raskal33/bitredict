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

const ODDYSSEY_ADDRESS = '0xc4715403c3c8e5C282009e5690ef3032e1f87b60';

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
    "inputs": [{"internalType": "uint256", "name": "cycleId", "type": "uint256"}],
    "name": "isCycleInitialized",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
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

async function checkContractState() {
  try {
    console.log('🔍 Checking Oddyssey Contract State...');
    console.log('📍 Contract Address:', ODDYSSEY_ADDRESS);
    console.log('🌐 Network: Somnia (Chain ID: 50312)');
    console.log('=' .repeat(80));

    // Check current cycle
    console.log('\n1️⃣ Current Cycle Information:');
    try {
      const currentCycle = await publicClient.readContract({
        address: ODDYSSEY_ADDRESS,
        abi: ODDYSSEY_ABI,
        functionName: 'getCurrentCycle'
      });
      console.log('   Current Cycle ID:', currentCycle.toString());

      const cycleInfo = await publicClient.readContract({
        address: ODDYSSEY_ADDRESS,
        abi: ODDYSSEY_ABI,
        functionName: 'getCurrentCycleInfo'
      });
      
      console.log('   Cycle Info:');
      console.log('     - Cycle ID:', cycleInfo[0].toString());
      console.log('     - Status:', cycleInfo[1].toString());
      console.log('     - Start Time:', new Date(Number(cycleInfo[2]) * 1000).toISOString());
      console.log('     - End Time:', new Date(Number(cycleInfo[3]) * 1000).toISOString());
      console.log('     - Prize Pool:', cycleInfo[4].toString());

      // Check if cycle is initialized
      const isInitialized = await publicClient.readContract({
        address: ODDYSSEY_ADDRESS,
        abi: ODDYSSEY_ABI,
        functionName: 'isCycleInitialized',
        args: [currentCycle]
      });
      console.log('     - Is Initialized:', isInitialized);

      // Get matches for current cycle
      console.log('\n2️⃣ Current Cycle Matches:');
      try {
        const matches = await publicClient.readContract({
          address: ODDYSSEY_ADDRESS,
          abi: ODDYSSEY_ABI,
          functionName: 'getDailyMatches',
          args: [currentCycle]
        });

        console.log(`   Found ${matches.length} matches:`);
        matches.forEach((match, index) => {
          console.log(`   
   Match ${index + 1}:
     - ID: ${match.id.toString()}
     - Home Team: "${match.homeTeam}"
     - Away Team: "${match.awayTeam}"
     - League: "${match.league}"
     - Start Time: ${new Date(Number(match.startTime) * 1000).toISOString()}
     - Odds Home: ${match.oddsHome.toString()}
     - Odds Draw: ${match.oddsDraw.toString()}  
     - Odds Away: ${match.oddsAway.toString()}
     - Odds Over 2.5: ${match.oddsOver.toString()}
     - Odds Under 2.5: ${match.oddsUnder.toString()}`);
        });
      } catch (error) {
        console.log('   ❌ Error fetching matches:', error.message);
      }

      // Check previous cycles if current is 0
      if (currentCycle.toString() === '0') {
        console.log('\n3️⃣ Checking for cycle 1 and 2 mentioned in logs:');
        for (let i = 1; i <= 2; i++) {
          try {
            const isInit = await publicClient.readContract({
              address: ODDYSSEY_ADDRESS,
              abi: ODDYSSEY_ABI,
              functionName: 'isCycleInitialized',
              args: [i]
            });
            console.log(`   Cycle ${i} initialized: ${isInit}`);
            
            if (isInit) {
              const cycleMatches = await publicClient.readContract({
                address: ODDYSSEY_ADDRESS,
                abi: ODDYSSEY_ABI,
                functionName: 'getDailyMatches',
                args: [i]
              });
              console.log(`   Cycle ${i} matches: ${cycleMatches.length}`);
            }
          } catch (error) {
            console.log(`   Cycle ${i}: Error - ${error.message}`);
          }
        }
      }

    } catch (error) {
      console.log('❌ Error getting cycle info:', error.message);
    }

    console.log('\n' + '=' .repeat(80));
    console.log('✅ Contract state check completed');
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run the check
checkContractState().catch(console.error);
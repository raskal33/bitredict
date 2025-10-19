#!/usr/bin/env node

const { createPublicClient, createWalletClient, http, privateKeyToAccount } = require('viem');

// Somnia network configuration
const chain = {
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
};

const CORRECT_CONTRACT = '0x70D7D101641c72b8254Ab45Ff2a5CED9b0ad0E75';

// Get private key from environment
const PRIVATE_KEY = process.env.PRIVATE_KEY || process.env.BOT_PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error('❌ Private key not found. Set PRIVATE_KEY or BOT_PRIVATE_KEY environment variable.');
  process.exit(1);
}

const account = privateKeyToAccount(PRIVATE_KEY);

const publicClient = createPublicClient({
  chain,
  transport: http('https://dream-rpc.somnia.network/')
});

const walletClient = createWalletClient({
  account,
  chain,
  transport: http('https://dream-rpc.somnia.network/')
});

// Contract ABI
const ODDYSSEY_ABI = [
  {
    "inputs": [],
    "name": "getCurrentCycle",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {"internalType": "uint256", "name": "id", "type": "uint256"},
          {"internalType": "uint256", "name": "startTime", "type": "uint256"},
          {"internalType": "uint256", "name": "oddsHome", "type": "uint256"},
          {"internalType": "uint256", "name": "oddsDraw", "type": "uint256"},
          {"internalType": "uint256", "name": "oddsAway", "type": "uint256"},
          {"internalType": "uint256", "name": "oddsOver", "type": "uint256"},
          {"internalType": "uint256", "name": "oddsUnder", "type": "uint256"},
          {
            "components": [
              {"internalType": "uint8", "name": "moneyline", "type": "uint8"},
              {"internalType": "uint8", "name": "overUnder", "type": "uint8"}
            ],
            "internalType": "struct IOddyssey.Result",
            "name": "result",
            "type": "tuple"
          }
        ],
        "internalType": "struct IOddyssey.Match[10]",
        "name": "_matches",
        "type": "tuple[10]"
      }
    ],
    "name": "startDailyCycle",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Database matches from the current cycle (from the earlier check)
const databaseMatches = [
  {
    id: BigInt('19568530'),
    startTime: BigInt(1758049200),
    oddsHome: BigInt(1950),
    oddsDraw: BigInt(3500),
    oddsAway: BigInt(3900),
    oddsOver: BigInt(1800),
    oddsUnder: BigInt(2000),
    result: { moneyline: 0, overUnder: 0 }
  },
  {
    id: BigInt('19556654'),
    startTime: BigInt(1758046500),
    oddsHome: BigInt(3100),
    oddsDraw: BigInt(3250),
    oddsAway: BigInt(2100),
    oddsOver: BigInt(2300),
    oddsUnder: BigInt(1600),
    result: { moneyline: 0, overUnder: 0 }
  },
  {
    id: BigInt('19568595'),
    startTime: BigInt(1758049200),
    oddsHome: BigInt(1850),
    oddsDraw: BigInt(3750),
    oddsAway: BigInt(4000),
    oddsOver: BigInt(1800),
    oddsUnder: BigInt(2000),
    result: { moneyline: 0, overUnder: 0 }
  },
  {
    id: BigInt('19556609'),
    startTime: BigInt(1758038400),
    oddsHome: BigInt(1750),
    oddsDraw: BigInt(3300),
    oddsAway: BigInt(4100),
    oddsOver: BigInt(2050),
    oddsUnder: BigInt(1750),
    result: { moneyline: 0, overUnder: 0 }
  },
  {
    id: BigInt('19568573'),
    startTime: BigInt(1758041100),
    oddsHome: BigInt(1800),
    oddsDraw: BigInt(3700),
    oddsAway: BigInt(4330),
    oddsOver: BigInt(1610),
    oddsUnder: BigInt(2300),
    result: { moneyline: 0, overUnder: 0 }
  },
  {
    id: BigInt('19568475'),
    startTime: BigInt(1758041100),
    oddsHome: BigInt(4500),
    oddsDraw: BigInt(3500),
    oddsAway: BigInt(1830),
    oddsOver: BigInt(2100),
    oddsUnder: BigInt(1720),
    result: { moneyline: 0, overUnder: 0 }
  },
  {
    id: BigInt('19510860'),
    startTime: BigInt(1758043800),
    oddsHome: BigInt(2500),
    oddsDraw: BigInt(2870),
    oddsAway: BigInt(3300),
    oddsOver: BigInt(3250),
    oddsUnder: BigInt(1330),
    result: { moneyline: 0, overUnder: 0 }
  },
  {
    id: BigInt('19556564'),
    startTime: BigInt(1758024900),
    oddsHome: BigInt(2300),
    oddsDraw: BigInt(3700),
    oddsAway: BigInt(3150),
    oddsOver: BigInt(1750),
    oddsUnder: BigInt(2050),
    result: { moneyline: 0, overUnder: 0 }
  },
  {
    id: BigInt('19510859'),
    startTime: BigInt(1758043800),
    oddsHome: BigInt(2200),
    oddsDraw: BigInt(2800),
    oddsAway: BigInt(4000),
    oddsOver: BigInt(3400),
    oddsUnder: BigInt(1300),
    result: { moneyline: 0, overUnder: 0 }
  },
  {
    id: BigInt('19568580'),
    startTime: BigInt(1758049200),
    oddsHome: BigInt(1400),
    oddsDraw: BigInt(5000),
    oddsAway: BigInt(7000),
    oddsOver: BigInt(1440),
    oddsUnder: BigInt(2750),
    result: { moneyline: 0, overUnder: 0 }
  }
];

async function syncDatabaseToContract() {
  try {
    console.log('🔄 Synchronizing Database to Contract...');
    console.log('📍 Contract Address:', CORRECT_CONTRACT);
    console.log('👤 Account:', account.address);
    console.log('=' .repeat(80));

    // Check current contract state
    console.log('\n1️⃣ Checking current contract state...');
    const currentCycle = await publicClient.readContract({
      address: CORRECT_CONTRACT,
      abi: ODDYSSEY_ABI,
      functionName: 'getCurrentCycle'
    });
    
    console.log('   Current contract cycle:', currentCycle.toString());

    // Check balance
    const balance = await publicClient.getBalance({ address: account.address });
    console.log('   Account balance:', (Number(balance) / 1e18).toFixed(4), 'ETH');

    if (balance === 0n) {
      console.error('❌ Account has no balance for gas fees');
      return;
    }

    if (currentCycle > 0n) {
      console.log('⚠️  Contract already has cycles. This might overwrite existing data.');
      console.log('   Are you sure you want to proceed? (This script will continue in 5 seconds)');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Prepare matches for contract
    console.log('\n2️⃣ Preparing database matches for contract...');
    console.log('   Database matches:', databaseMatches.length);
    console.log('   Sample match IDs:', databaseMatches.slice(0, 3).map(m => m.id.toString()).join(', '));

    // Estimate gas
    try {
      console.log('\n3️⃣ Estimating gas for startDailyCycle...');
      const gasEstimate = await publicClient.estimateContractGas({
        account,
        address: CORRECT_CONTRACT,
        abi: ODDYSSEY_ABI,
        functionName: 'startDailyCycle',
        args: [databaseMatches]
      });
      
      console.log('   Estimated gas:', gasEstimate.toString());

      // Execute the transaction
      console.log('\n4️⃣ Executing startDailyCycle with database matches...');
      const hash = await walletClient.writeContract({
        address: CORRECT_CONTRACT,
        abi: ODDYSSEY_ABI,
        functionName: 'startDailyCycle',
        args: [databaseMatches],
        gas: gasEstimate * 120n / 100n // Add 20% buffer
      });

      console.log('🚀 Transaction sent:', hash);
      console.log('⏳ Waiting for confirmation...');

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log('✅ Transaction confirmed in block:', receipt.blockNumber);

      // Verify the cycle was created
      console.log('\n5️⃣ Verifying synchronization...');
      const newCycle = await publicClient.readContract({
        address: CORRECT_CONTRACT,
        abi: ODDYSSEY_ABI,
        functionName: 'getCurrentCycle'
      });

      console.log('   New contract cycle:', newCycle.toString());
      
      if (newCycle > 0n) {
        console.log('🎉 SUCCESS! Contract synchronized with database matches');
        console.log('✅ Frontend should now show team names and odds');
        
        console.log('\n📋 NEXT STEPS:');
        console.log('1. Wait a few minutes for backend to restart with new contract address');
        console.log('2. Check frontend - it should now show matches with team names and odds');
        console.log('3. Verify backend can fetch matches from the correct contract');
        
      } else {
        console.log('⚠️  Contract cycle still 0. Check if transaction reverted.');
      }

    } catch (gasError) {
      console.error('❌ Transaction execution failed:', gasError.message);
      
      if (gasError.message.includes('execution reverted')) {
        console.log('\n🔍 Transaction would revert. Possible reasons:');
        console.log('   - Not authorized to call startDailyCycle');
        console.log('   - Contract conditions not met');
        console.log('   - Invalid match data format');
        console.log('   - Contract paused or has other restrictions');
        
        // Check if we're the owner
        console.log('\n🔐 Checking authorization...');
        console.log('   Calling account:', account.address);
        console.log('   You may not be authorized to call startDailyCycle on this contract.');
      }
    }

  } catch (error) {
    console.error('💥 Error synchronizing:', error);
  }
}

// Run the sync
console.log('⚠️  This script will sync database matches to the contract');
console.log('⚠️  Make sure the PRIVATE_KEY environment variable is set to an authorized account');
console.log('⚠️  Starting in 3 seconds...');

setTimeout(() => {
  syncDatabaseToContract().catch(console.error);
}, 3000);

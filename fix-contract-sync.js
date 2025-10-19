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

const ODDYSSEY_ADDRESS = '0x70D7D101641c72b8254Ab45Ff2a5CED9b0ad0E75';

// Get private key from environment or prompt
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

// Sample matches for testing
const sampleMatches = [
  {
    id: 1n,
    startTime: BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour from now
    oddsHome: 2000n, // 2.0 odds
    oddsDraw: 3500n, // 3.5 odds  
    oddsAway: 4000n, // 4.0 odds
    oddsOver: 1800n, // 1.8 odds
    oddsUnder: 2200n, // 2.2 odds
    result: {
      moneyline: 0, // NotSet
      overUnder: 0  // NotSet
    }
  },
  {
    id: 2n,
    startTime: BigInt(Math.floor(Date.now() / 1000) + 3600),
    oddsHome: 1500n,
    oddsDraw: 4000n,
    oddsAway: 6000n,
    oddsOver: 1900n,
    oddsUnder: 2100n,
    result: {
      moneyline: 0,
      overUnder: 0
    }
  },
  {
    id: 3n,
    startTime: BigInt(Math.floor(Date.now() / 1000) + 3600),
    oddsHome: 3000n,
    oddsDraw: 3200n,
    oddsAway: 2500n,
    oddsOver: 2000n,
    oddsUnder: 1900n,
    result: {
      moneyline: 0,
      overUnder: 0
    }
  }
];

// Pad to 10 matches
while (sampleMatches.length < 10) {
  const baseMatch = sampleMatches[sampleMatches.length % 3];
  sampleMatches.push({
    ...baseMatch,
    id: BigInt(sampleMatches.length + 1)
  });
}

// Basic ABI for startDailyCycle
const ODDYSSEY_ABI = [
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

async function fixContractSync() {
  try {
    console.log('🔄 Fixing Oddyssey Contract Synchronization...');
    console.log('📍 Contract Address:', ODDYSSEY_ADDRESS);
    console.log('👤 Account:', account.address);
    console.log('=' .repeat(80));

    // Check current state
    console.log('\n1️⃣ Checking current contract state...');
    const currentCycle = await publicClient.readContract({
      address: ODDYSSEY_ADDRESS,
      abi: [{
        "inputs": [],
        "name": "getCurrentCycle", 
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      }],
      functionName: 'getCurrentCycle'
    });
    
    console.log('   Current contract cycle:', currentCycle.toString());

    if (currentCycle > 0n) {
      console.log('✅ Contract already has cycles. Sync may not be needed.');
      return;
    }

    // Check balance
    const balance = await publicClient.getBalance({ address: account.address });
    console.log('   Account balance:', (Number(balance) / 1e18).toFixed(4), 'ETH');

    if (balance === 0n) {
      console.error('❌ Account has no balance for gas fees');
      return;
    }

    // Estimate gas for startDailyCycle
    console.log('\n2️⃣ Preparing to start daily cycle...');
    console.log('   Sample matches prepared:', sampleMatches.length);

    try {
      const gasEstimate = await publicClient.estimateContractGas({
        account,
        address: ODDYSSEY_ADDRESS,
        abi: ODDYSSEY_ABI,
        functionName: 'startDailyCycle',
        args: [sampleMatches]
      });
      
      console.log('   Estimated gas:', gasEstimate.toString());

      // Execute the transaction
      console.log('\n3️⃣ Executing startDailyCycle...');
      const hash = await walletClient.writeContract({
        address: ODDYSSEY_ADDRESS,
        abi: ODDYSSEY_ABI,
        functionName: 'startDailyCycle',
        args: [sampleMatches],
        gas: gasEstimate * 120n / 100n // Add 20% buffer
      });

      console.log('🚀 Transaction sent:', hash);
      console.log('⏳ Waiting for confirmation...');

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log('✅ Transaction confirmed in block:', receipt.blockNumber);

      // Verify the cycle was created
      console.log('\n4️⃣ Verifying cycle creation...');
      const newCycle = await publicClient.readContract({
        address: ODDYSSEY_ADDRESS,
        abi: [{
          "inputs": [],
          "name": "getCurrentCycle",
          "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
          "stateMutability": "view",
          "type": "function"
        }],
        functionName: 'getCurrentCycle'
      });

      console.log('   New contract cycle:', newCycle.toString());
      
      if (newCycle > 0n) {
        console.log('🎉 SUCCESS! Contract is now synchronized with cycle', newCycle.toString());
      } else {
        console.log('⚠️  Contract cycle still 0. Check if transaction reverted.');
      }

    } catch (gasError) {
      console.error('❌ Gas estimation failed:', gasError.message);
      
      if (gasError.message.includes('execution reverted')) {
        console.log('\n🔍 Transaction would revert. Possible reasons:');
        console.log('   - Not authorized to call startDailyCycle');
        console.log('   - Contract conditions not met');
        console.log('   - Invalid match data format');
        console.log('   - Contract paused or has other restrictions');
      }
    }

  } catch (error) {
    console.error('💥 Error fixing contract sync:', error);
  }
}

// Run the fix
fixContractSync().catch(console.error);

#!/usr/bin/env node

/**
 * Reset Oddyssey database to sync with contract state
 * This clears the current cycle data and lets the backend start fresh
 */

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

const CORRECT_CONTRACT = '0xc4715403c3c8e5C282009e5690ef3032e1f87b60';

async function resetDatabase() {
  try {
    console.log('🔄 Resetting Oddyssey Database to match Contract State...');
    console.log('📍 Contract Address:', CORRECT_CONTRACT);
    console.log('=' .repeat(80));

    // Check current contract state
    console.log('\n1️⃣ Checking contract state...');
    const currentCycle = await publicClient.readContract({
      address: CORRECT_CONTRACT,
      abi: [{
        "inputs": [],
        "name": "getCurrentCycle",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      }],
      functionName: 'getCurrentCycle'
    });
    
    console.log('   Contract current cycle:', currentCycle.toString());

    // Connect to database
    console.log('\n2️⃣ Connecting to database...');
    
    // Mock database operations - this would need actual database connection
    console.log('   Database connection: [MOCK - would connect to real DB]');
    
    console.log('\n3️⃣ Database operations needed:');
    console.log('   📋 Clear current_oddyssey_cycle table');
    console.log('   📋 Reset cycle counter to match contract');
    console.log('   📋 Clear any pending cycles that don\'t exist on contract');
    
    console.log('\n🔧 SQL Commands that should be run:');
    console.log(`
-- Clear current cycle data
DELETE FROM oracle.current_oddyssey_cycle;

-- Reset to match contract state (cycle ${currentCycle})
-- If contract cycle is 0, this ensures clean start
-- If contract cycle > 0, this syncs to that state

-- Option A: If contract cycle is 0 (clean start)
${currentCycle.toString() === '0' ? `
-- No insertion needed - let backend create first cycle
` : `
-- Option B: If contract cycle > 0 (sync to existing)
-- This would require fetching match data from contract
-- INSERT INTO oracle.current_oddyssey_cycle (...);
`}

-- Clean up any mismatched historical data
DELETE FROM oracle.oddyssey_cycles WHERE cycle_id > ${currentCycle};
    `);

    console.log('\n⚠️  MANUAL STEPS REQUIRED:');
    console.log('1. Connect to your database');
    console.log('2. Run the SQL commands above');
    console.log('3. Restart the backend services');
    console.log('4. Wait for the next cycle creation cron job (runs at 00:04 UTC daily)');
    console.log('   OR trigger a manual cycle creation');

    console.log('\n📝 Alternative - Quick Manual Cycle Creation:');
    console.log('After database reset, you can trigger cycle creation via API:');
    console.log('POST https://bitredict-backend.fly.dev/api/oddyssey/trigger-cycle');
    
    return {
      contractCycle: currentCycle.toString(),
      needsReset: true,
      isCleanStart: currentCycle.toString() === '0'
    };

  } catch (error) {
    console.error('💥 Error checking reset requirements:', error);
    return null;
  }
}

// Run the check
resetDatabase().then(result => {
  if (result) {
    console.log('\n🎯 SUMMARY:');
    console.log(`   Contract Cycle: ${result.contractCycle}`);
    console.log(`   Needs Reset: ${result.needsReset}`);
    console.log(`   Clean Start: ${result.isCleanStart}`);
    
    if (result.isCleanStart) {
      console.log('\n✅ RECOMMENDED ACTION:');
      console.log('   Since contract cycle is 0, simply clear the database');
      console.log('   and let the backend start fresh cycles.');
    }
  }
}).catch(console.error);

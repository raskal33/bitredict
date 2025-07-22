const { ethers } = require('ethers');

// Configuration
const RPC_URL = 'https://dream-rpc.somnia.network/';
const FAUCET_ADDRESS = '0x1656712131BB07dDE6EeC7D88757Db24782cab71';
const BITR_TOKEN_ADDRESS = '0x4b10fBFFDEE97C42E29899F47A2ECD30a38dBf2C';

// Faucet ABI (minimal for status checking)
const FAUCET_ABI = [
  {
    "inputs": [],
    "name": "getFaucetStats",
    "outputs": [
      { "internalType": "uint256", "name": "balance", "type": "uint256" },
      { "internalType": "uint256", "name": "totalDistributed", "type": "uint256" },
      { "internalType": "uint256", "name": "userCount", "type": "uint256" },
      { "internalType": "bool", "name": "active", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "faucetActive",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "hasSufficientBalance",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "maxPossibleClaims",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
    "name": "getUserInfo",
    "outputs": [
      { "internalType": "bool", "name": "claimed", "type": "bool" },
      { "internalType": "uint256", "name": "claimTime", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// BITR Token ABI (minimal)
const BITR_TOKEN_ABI = [
  {
    "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
];

async function checkFaucetStatus() {
  console.log('🔍 Checking Faucet Status on Somnia Network...\n');
  
  try {
    // Connect to network
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    console.log('✅ Connected to Somnia Network');
    
    // Get current block
    const blockNumber = await provider.getBlockNumber();
    console.log(`📦 Current Block: ${blockNumber}\n`);
    
    // Initialize contracts
    const faucet = new ethers.Contract(FAUCET_ADDRESS, FAUCET_ABI, provider);
    const bitrToken = new ethers.Contract(BITR_TOKEN_ADDRESS, BITR_TOKEN_ABI, provider);
    
    console.log('📋 Faucet Contract Details:');
    console.log(`   Address: ${FAUCET_ADDRESS}`);
    console.log(`   BITR Token: ${BITR_TOKEN_ADDRESS}\n`);
    
    // Check faucet stats
    console.log('📊 Faucet Statistics:');
    try {
      const stats = await faucet.getFaucetStats();
      console.log(`   Balance: ${ethers.formatEther(stats[0])} BITR`);
      console.log(`   Total Distributed: ${ethers.formatEther(stats[1])} BITR`);
      console.log(`   User Count: ${stats[2].toString()}`);
      console.log(`   Active: ${stats[3] ? '✅ YES' : '❌ NO'}`);
    } catch (error) {
      console.log(`   ❌ Error getting stats: ${error.message}`);
    }
    
    // Check individual faucet state
    console.log('\n🔧 Faucet State:');
    try {
      const isActive = await faucet.faucetActive();
      console.log(`   Active: ${isActive ? '✅ YES' : '❌ NO'}`);
    } catch (error) {
      console.log(`   ❌ Error checking active state: ${error.message}`);
    }
    
    try {
      const hasBalance = await faucet.hasSufficientBalance();
      console.log(`   Has Sufficient Balance: ${hasBalance ? '✅ YES' : '❌ NO'}`);
    } catch (error) {
      console.log(`   ❌ Error checking balance: ${error.message}`);
    }
    
    try {
      const maxClaims = await faucet.maxPossibleClaims();
      console.log(`   Max Possible Claims: ${maxClaims.toString()}`);
    } catch (error) {
      console.log(`   ❌ Error checking max claims: ${error.message}`);
    }
    
    // Check BITR token balance directly
    console.log('\n💰 Token Balance Check:');
    try {
      const faucetBalance = await bitrToken.balanceOf(FAUCET_ADDRESS);
      console.log(`   Faucet BITR Balance: ${ethers.formatEther(faucetBalance)} BITR`);
      
      const requiredAmount = ethers.parseEther('20000'); // 20,000 BITR per claim
      const possibleClaims = faucetBalance / requiredAmount;
      console.log(`   Possible Claims: ${possibleClaims.toString()}`);
    } catch (error) {
      console.log(`   ❌ Error checking token balance: ${error.message}`);
    }
    
    // Test with a sample address
    console.log('\n👤 Sample User Check:');
    const testAddress = '0x483fc7FD690dCf2a01318282559C389F385d4428'; // Deployer address
    try {
      const userInfo = await faucet.getUserInfo(testAddress);
      console.log(`   Test Address: ${testAddress}`);
      console.log(`   Has Claimed: ${userInfo[0] ? '✅ YES' : '❌ NO'}`);
      if (userInfo[1] > 0) {
        const claimDate = new Date(Number(userInfo[1]) * 1000);
        console.log(`   Claim Time: ${claimDate.toISOString()}`);
      } else {
        console.log(`   Claim Time: Never`);
      }
    } catch (error) {
      console.log(`   ❌ Error checking user info: ${error.message}`);
    }
    
    // Network health check
    console.log('\n🌐 Network Health:');
    try {
      const gasPrice = await provider.getFeeData();
      console.log(`   Gas Price: ${ethers.formatUnits(gasPrice.gasPrice, 'gwei')} gwei`);
    } catch (error) {
      console.log(`   ❌ Error getting gas price: ${error.message}`);
    }
    
    console.log('\n🎯 Summary:');
    try {
      const stats = await faucet.getFaucetStats();
      const isActive = await faucet.faucetActive();
      const hasBalance = await faucet.hasSufficientBalance();
      
      if (!isActive) {
        console.log('   ❌ FAUCET IS INACTIVE - This is why frontend shows "faucet inactive"');
      } else if (!hasBalance) {
        console.log('   ❌ FAUCET HAS INSUFFICIENT BALANCE - No tokens available');
      } else {
        console.log('   ✅ FAUCET IS ACTIVE AND HAS SUFFICIENT BALANCE');
      }
      
      if (stats[2] > 0) {
        console.log(`   📈 ${stats[2]} users have claimed tokens`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error in summary: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check if Somnia RPC is accessible');
    console.log('   2. Verify contract addresses are correct');
    console.log('   3. Ensure network connectivity');
  }
}

// Run the check
checkFaucetStatus()
  .then(() => {
    console.log('\n✅ Faucet status check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }); 
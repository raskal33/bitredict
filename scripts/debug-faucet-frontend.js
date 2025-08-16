const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Configuration
const RPC_URL = 'https://dream-rpc.somnia.network/';
const FAUCET_ADDRESS = '0x1656712131BB07dDE6EeC7D88757Db24782cab71';
const BITR_TOKEN_ADDRESS = '0x4b10fBFFDEE97C42E29899F47A2ECD30a38dBf2C';

// Load environment variables
function loadEnvVars() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const env = {};
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        env[key.trim()] = value.trim();
      }
    });
  }
  
  return env;
}

// Check frontend configuration
function checkFrontendConfig() {
  console.log('🔧 Frontend Configuration Check:\n');
  
  const env = loadEnvVars();
  
  console.log('📋 Environment Variables:');
  console.log(`   NEXT_PUBLIC_FAUCET_ADDRESS: ${env.NEXT_PUBLIC_FAUCET_ADDRESS || '❌ NOT SET'}`);
  console.log(`   NEXT_PUBLIC_BITR_TOKEN_ADDRESS: ${env.NEXT_PUBLIC_BITR_TOKEN_ADDRESS || '❌ NOT SET'}`);
  console.log(`   NEXT_PUBLIC_GUIDED_ORACLE_ADDRESS: ${env.NEXT_PUBLIC_GUIDED_ORACLE_ADDRESS || '❌ NOT SET'}`);
  console.log(`   NEXT_PUBLIC_BITREDICT_POOL_ADDRESS: ${env.NEXT_PUBLIC_BITREDICT_POOL_ADDRESS || '❌ NOT SET'}`);
  console.log(`   NEXT_PUBLIC_BITREDICT_STAKING_ADDRESS: ${env.NEXT_PUBLIC_BITREDICT_STAKING_ADDRESS || '❌ NOT SET'}`);
  console.log(`   NEXT_PUBLIC_ODDYSSEY_ADDRESS: ${env.NEXT_PUBLIC_ODDYSSEY_ADDRESS || '❌ NOT SET'}`);
  
  // Check if addresses match deployment
  const addressIssues = [];
  if (env.NEXT_PUBLIC_FAUCET_ADDRESS !== FAUCET_ADDRESS) {
    addressIssues.push(`   ❌ Faucet address mismatch: ${env.NEXT_PUBLIC_FAUCET_ADDRESS} vs ${FAUCET_ADDRESS}`);
  }
  if (env.NEXT_PUBLIC_BITR_TOKEN_ADDRESS !== BITR_TOKEN_ADDRESS) {
    addressIssues.push(`   ❌ BITR token address mismatch: ${env.NEXT_PUBLIC_BITR_TOKEN_ADDRESS} vs ${BITR_TOKEN_ADDRESS}`);
  }
  
  if (addressIssues.length > 0) {
    console.log('\n⚠️  Address Mismatches:');
    addressIssues.forEach(issue => console.log(issue));
  } else {
    console.log('\n✅ All contract addresses match deployment');
  }
  
  return env;
}

// Check contract files
function checkContractFiles() {
  console.log('\n📁 Contract Files Check:\n');
  
  const filesToCheck = [
    'contracts/abis/BitrFaucet.json',
    'contracts/abis/BitredictToken.json',
    'contracts/index.ts',
    'config/wagmi.ts',
    'hooks/useFaucet.ts'
  ];
  
  filesToCheck.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      console.log(`   ✅ ${file}`);
    } else {
      console.log(`   ❌ ${file} - MISSING`);
    }
  });
  
  // Check ABI structure
  try {
    const faucetABI = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'contracts/abis/BitrFaucet.json'), 'utf8'));
    const hasGetFaucetStats = faucetABI.abi.some(func => func.name === 'getFaucetStats');
    const hasFaucetActive = faucetABI.abi.some(func => func.name === 'faucetActive');
    
    console.log('\n📋 ABI Function Check:');
    console.log(`   getFaucetStats: ${hasGetFaucetStats ? '✅' : '❌'}`);
    console.log(`   faucetActive: ${hasFaucetActive ? '✅' : '❌'}`);
  } catch (error) {
    console.log(`   ❌ Error reading ABI: ${error.message}`);
  }
}

// Test RPC connection
async function testRPCConnection() {
  console.log('\n🌐 RPC Connection Test:\n');
  
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    
    // Test basic connection
    const blockNumber = await provider.getBlockNumber();
    console.log(`   ✅ Connected to Somnia Network`);
    console.log(`   📦 Current Block: ${blockNumber}`);
    
    // Test gas price
    const gasPrice = await provider.getFeeData();
    console.log(`   ⛽ Gas Price: ${ethers.formatUnits(gasPrice.gasPrice, 'gwei')} gwei`);
    
    // Test network ID
    const network = await provider.getNetwork();
    console.log(`   🔗 Network ID: ${network.chainId}`);
    
    return provider;
  } catch (error) {
    console.log(`   ❌ RPC Connection Failed: ${error.message}`);
    return null;
  }
}

// Test contract calls
async function testContractCalls(provider) {
  if (!provider) {
    console.log('\n❌ Skipping contract tests due to RPC failure');
    return;
  }
  
  console.log('\n📞 Contract Call Tests:\n');
  
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
    }
  ];
  
  try {
    const faucet = new ethers.Contract(FAUCET_ADDRESS, FAUCET_ABI, provider);
    
    // Test getFaucetStats
    console.log('🔍 Testing getFaucetStats...');
    const stats = await faucet.getFaucetStats();
    console.log(`   ✅ getFaucetStats successful`);
    console.log(`   📊 Balance: ${ethers.formatEther(stats[0])} BITR`);
    console.log(`   📊 Total Distributed: ${ethers.formatEther(stats[1])} BITR`);
    console.log(`   📊 User Count: ${stats[2].toString()}`);
    console.log(`   📊 Active: ${stats[3] ? '✅ YES' : '❌ NO'}`);
    
    // Test faucetActive
    console.log('\n🔍 Testing faucetActive...');
    const isActive = await faucet.faucetActive();
    console.log(`   ✅ faucetActive successful`);
    console.log(`   📊 Active: ${isActive ? '✅ YES' : '❌ NO'}`);
    
    return { stats, isActive };
  } catch (error) {
    console.log(`   ❌ Contract call failed: ${error.message}`);
    return null;
  }
}

// Simulate frontend hook behavior
function simulateFrontendHook(stats, isActive) {
  console.log('\n🎭 Frontend Hook Simulation:\n');
  
  if (!stats || isActive === undefined) {
    console.log('   ❌ Cannot simulate frontend behavior - contract calls failed');
    return;
  }
  
  // Simulate the logic from useFaucet.ts
  const faucetStats = {
    balance: stats[0],
    totalDistributed: stats[1],
    userCount: stats[2],
    active: stats[3]
  };
  
  console.log('📊 Simulated FaucetStats:');
  console.log(`   Balance: ${ethers.formatEther(faucetStats.balance)} BITR`);
  console.log(`   Total Distributed: ${ethers.formatEther(faucetStats.totalDistributed)} BITR`);
  console.log(`   User Count: ${faucetStats.userCount.toString()}`);
  console.log(`   Active: ${faucetStats.active ? '✅ YES' : '❌ NO'}`);
  
  // Simulate the claim status logic
  const hasSufficientBalance = faucetStats.balance >= ethers.parseEther('20000');
  
  console.log('\n🎯 Claim Status Logic:');
  console.log(`   Faucet Active: ${faucetStats.active ? '✅' : '❌'}`);
  console.log(`   Has Sufficient Balance: ${hasSufficientBalance ? '✅' : '❌'}`);
  
  let claimStatus = 'Ready to claim';
  if (!faucetStats.active) {
    claimStatus = 'Faucet is inactive';
  } else if (!hasSufficientBalance) {
    claimStatus = 'Insufficient faucet balance';
  }
  
  console.log(`   📝 Claim Status: "${claimStatus}"`);
  
  // Determine the issue
  console.log('\n🔍 Issue Analysis:');
  if (!faucetStats.active) {
    console.log('   ❌ ROOT CAUSE: Faucet is deactivated on-chain');
    console.log('   💡 SOLUTION: Call setFaucetActive(true) from owner account');
  } else if (!hasSufficientBalance) {
    console.log('   ❌ ROOT CAUSE: Faucet has insufficient balance');
    console.log('   💡 SOLUTION: Transfer more BITR tokens to faucet');
  } else {
    console.log('   ✅ Faucet should work correctly');
    console.log('   💡 Frontend issue might be RPC connectivity or data loading');
  }
}

// Main function
async function debugFaucetFrontend() {
  console.log('🔍 Faucet Frontend Debug Script\n');
  console.log('=' .repeat(50));
  
  // Check frontend configuration
  const env = checkFrontendConfig();
  
  // Check contract files
  checkContractFiles();
  
  // Test RPC connection
  const provider = await testRPCConnection();
  
  // Test contract calls
  const contractData = await testContractCalls(provider);
  
  // Simulate frontend behavior
  if (contractData) {
    simulateFrontendHook(contractData.stats, contractData.isActive);
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ Debug script completed');
}

// Run the debug script
debugFaucetFrontend()
  .then(() => {
    console.log('\n📋 Next Steps:');
    console.log('   1. If faucet is inactive: Call setFaucetActive(true)');
    console.log('   2. If insufficient balance: Transfer more BITR tokens');
    console.log('   3. If RPC issues: Check network connectivity');
    console.log('   4. If frontend issues: Check browser console for errors');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Debug script failed:', error);
    process.exit(1);
  }); 
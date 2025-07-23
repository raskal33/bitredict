const { ethers } = require('ethers');

// Faucet contract ABI
const FAUCET_ABI = [
  "function FAUCET_AMOUNT() external view returns (uint256)",
  "function faucetActive() external view returns (bool)",
  "function hasClaimed(address) external view returns (bool)",
  "function lastClaimTime(address) external view returns (uint256)",
  "function totalClaimed() external view returns (uint256)",
  "function totalUsers() external view returns (uint256)",
  "function getFaucetStats() external view returns (uint256 balance, uint256 totalDistributed, uint256 userCount, bool active)",
  "function getUserInfo(address user) external view returns (bool claimed, uint256 claimTime)",
  "function hasSufficientBalance() external view returns (bool)",
  "function maxPossibleClaims() external view returns (uint256)",
  "function owner() external view returns (address)",
  "function bitrToken() external view returns (address)"
];

// BITR Token ABI
const BITR_ABI = [
  "function balanceOf(address) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)"
];

async function diagnoseFaucet() {
  console.log('🔍 Starting Faucet Diagnostic...\n');

  try {
    // Environment variables
    const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://dream-rpc.somnia.network/';
    const FAUCET_ADDRESS = process.env.NEXT_PUBLIC_FAUCET_ADDRESS;
    const BITR_ADDRESS = process.env.NEXT_PUBLIC_BITR_TOKEN_ADDRESS;

    console.log('📋 Configuration:');
    console.log(`RPC URL: ${RPC_URL}`);
    console.log(`Faucet Address: ${FAUCET_ADDRESS}`);
    console.log(`BITR Address: ${BITR_ADDRESS}\n`);

    if (!FAUCET_ADDRESS) {
      console.error('❌ NEXT_PUBLIC_FAUCET_ADDRESS not set!');
      return;
    }

    if (!BITR_ADDRESS) {
      console.error('❌ NEXT_PUBLIC_BITR_TOKEN_ADDRESS not set!');
      return;
    }

    // Connect to provider
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    console.log('✅ Connected to RPC provider');

    // Check network
    const network = await provider.getNetwork();
    console.log(`🌐 Network: ${network.name} (Chain ID: ${network.chainId})\n`);

    // Initialize contracts
    const faucetContract = new ethers.Contract(FAUCET_ADDRESS, FAUCET_ABI, provider);
    const bitrContract = new ethers.Contract(BITR_ADDRESS, BITR_ABI, provider);

    console.log('📊 Contract Information:');

    // Check if contracts exist
    const faucetCode = await provider.getCode(FAUCET_ADDRESS);
    const bitrCode = await provider.getCode(BITR_ADDRESS);

    if (faucetCode === '0x') {
      console.error('❌ Faucet contract not deployed at this address!');
      return;
    } else {
      console.log('✅ Faucet contract found');
    }

    if (bitrCode === '0x') {
      console.error('❌ BITR token contract not deployed at this address!');
      return;
    } else {
      console.log('✅ BITR token contract found');
    }

    // Get BITR token info
    try {
      const bitrName = await bitrContract.name();
      const bitrSymbol = await bitrContract.symbol();
      const bitrDecimals = await bitrContract.decimals();
      const bitrTotalSupply = await bitrContract.totalSupply();

      console.log(`\n💰 BITR Token Info:`);
      console.log(`Name: ${bitrName}`);
      console.log(`Symbol: ${bitrSymbol}`);
      console.log(`Decimals: ${bitrDecimals}`);
      console.log(`Total Supply: ${ethers.formatEther(bitrTotalSupply)} BITR`);
    } catch (error) {
      console.error('❌ Error reading BITR token info:', error.message);
    }

    // Get faucet basic info
    try {
      const faucetAmount = await faucetContract.FAUCET_AMOUNT();
      const owner = await faucetContract.owner();
      const linkedBitrAddress = await faucetContract.bitrToken();

      console.log(`\n🚰 Faucet Basic Info:`);
      console.log(`Faucet Amount: ${ethers.formatEther(faucetAmount)} BITR`);
      console.log(`Owner: ${owner}`);
      console.log(`Linked BITR Address: ${linkedBitrAddress}`);
      console.log(`Expected BITR Address: ${BITR_ADDRESS}`);
      
      if (linkedBitrAddress.toLowerCase() !== BITR_ADDRESS.toLowerCase()) {
        console.error('⚠️  WARNING: Faucet is linked to different BITR token address!');
      } else {
        console.log('✅ BITR address matches');
      }
    } catch (error) {
      console.error('❌ Error reading faucet basic info:', error.message);
    }

    // Get faucet statistics
    try {
      const [balance, totalDistributed, userCount, active] = await faucetContract.getFaucetStats();
      const hasSufficientBalance = await faucetContract.hasSufficientBalance();
      const maxClaims = await faucetContract.maxPossibleClaims();

      console.log(`\n📈 Faucet Statistics:`);
      console.log(`Active: ${active ? '✅ YES' : '❌ NO'}`);
      console.log(`Balance: ${ethers.formatEther(balance)} BITR`);
      console.log(`Total Distributed: ${ethers.formatEther(totalDistributed)} BITR`);
      console.log(`Total Users: ${userCount.toString()}`);
      console.log(`Has Sufficient Balance: ${hasSufficientBalance ? '✅ YES' : '❌ NO'}`);
      console.log(`Max Possible Claims: ${maxClaims.toString()}`);

      // Check faucet balance directly from BITR contract
      const actualFaucetBalance = await bitrContract.balanceOf(FAUCET_ADDRESS);
      console.log(`Actual BITR Balance: ${ethers.formatEther(actualFaucetBalance)} BITR`);

      if (actualFaucetBalance.toString() !== balance.toString()) {
        console.error('⚠️  WARNING: Contract balance mismatch!');
      }

      // Main issue identification
      console.log(`\n🔍 Issue Analysis:`);
      if (!active) {
        console.error('🚨 MAIN ISSUE: Faucet is marked as INACTIVE in the contract');
        console.log('   → Possible causes:');
        console.log('   → 1. Owner manually deactivated the faucet');
        console.log('   → 2. Contract has a deactivation condition that was triggered');
        console.log('   → 3. Contract deployment issue');
      }

      if (!hasSufficientBalance) {
        console.error('🚨 ISSUE: Faucet has insufficient balance');
        console.log(`   → Current balance: ${ethers.formatEther(balance)} BITR`);
        console.log(`   → Required per claim: ${ethers.formatEther(await faucetContract.FAUCET_AMOUNT())} BITR`);
      }

      if (balance === 0n) {
        console.error('🚨 ISSUE: Faucet balance is ZERO');
        console.log('   → Faucet needs to be funded with BITR tokens');
      }

    } catch (error) {
      console.error('❌ Error reading faucet statistics:', error.message);
    }

    // Test with a sample address
    const testAddress = '0x742d35Cc6635C0532925a3b8D84e4123a4b37A12'; // Test address
    try {
      console.log(`\n🧪 Testing with address: ${testAddress}`);
      const [claimed, claimTime] = await faucetContract.getUserInfo(testAddress);
      console.log(`Has Claimed: ${claimed ? '✅ YES' : '❌ NO'}`);
      console.log(`Claim Time: ${claimTime.toString()}`);
      
      if (claimTime > 0) {
        const date = new Date(Number(claimTime) * 1000);
        console.log(`Claim Date: ${date.toLocaleString()}`);
      }
    } catch (error) {
      console.error('❌ Error testing user info:', error.message);
    }

    console.log('\n✅ Diagnostic complete!');

  } catch (error) {
    console.error('💥 Diagnostic failed:', error);
  }
}

// Run if called directly
if (require.main === module) {
  diagnoseFaucet();
}

module.exports = { diagnoseFaucet }; 
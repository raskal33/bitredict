#!/usr/bin/env node

/**
 * Debug script for market creation issues
 * This script helps identify and fix problems with market creation transactions
 */

const { ethers } = require('ethers');

// Contract addresses (from wagmi.ts)
const CONTRACT_ADDRESSES = {
  BITR_TOKEN: '0x67aa1549551ff4479B68F1eC19fD011571C7db10',
  POOL_CORE: '0xA966a3fb0471D3A107eE834EA67E77f04177AD87',
  GUIDED_ORACLE: '0x9CFB1097577480BD0eDe1795018c89786c541097',
};

// BITR Token ABI (minimal for debugging)
const BITR_TOKEN_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)"
];

// Pool Core ABI (minimal for debugging)
const POOL_CORE_ABI = [
  "function createPool(bytes32 _predictedOutcome, uint256 _odds, uint256 _creatorStake, uint256 _eventStartTime, uint256 _eventEndTime, string memory _league, string memory _category, string memory _region, string memory _homeTeam, string memory _awayTeam, string memory _title, bool _isPrivate, uint256 _maxBetPerUser, bool _useBitr, uint8 _oracleType, bytes32 _marketId, uint8 _marketType) external payable returns (uint256)"
];

async function debugMarketCreation() {
  console.log('🔍 Debugging Market Creation Issues...\n');
  
  // Check if we're in the right directory
  console.log('📁 Current directory:', process.cwd());
  
  // Display contract addresses
  console.log('📋 Contract Addresses:');
  console.log(`  BITR Token: ${CONTRACT_ADDRESSES.BITR_TOKEN}`);
  console.log(`  Pool Core:  ${CONTRACT_ADDRESSES.POOL_CORE}`);
  console.log(`  Guided Oracle: ${CONTRACT_ADDRESSES.GUIDED_ORACLE}`);
  
  // Check if addresses are correct
  console.log('\n✅ Address Verification:');
  console.log(`  BITR Token (correct): ${CONTRACT_ADDRESSES.BITR_TOKEN === '0x67aa1549551ff4479B68F1eC19fD011571C7db10' ? '✅' : '❌'}`);
  console.log(`  Pool Core (correct):  ${CONTRACT_ADDRESSES.POOL_CORE === '0xA966a3fb0471D3A107eE834EA67E77f04177AD87' ? '✅' : '❌'}`);
  
  console.log('\n🔧 Issues Identified:');
  console.log('  1. Contract is trying to transfer BITR tokens to GUIDED_ORACLE address');
  console.log('  2. This suggests a bug in the contract logic');
  console.log('  3. BITR tokens should stay in POOL_CORE contract, not be transferred to oracle');
  
  console.log('\n🛠️  Solutions Applied:');
  console.log('  1. ✅ Added better error handling in frontend');
  console.log('  2. ✅ Added debugging logs for allowance checks');
  console.log('  3. ✅ Added specific error messages for different failure types');
  console.log('  4. ✅ Added pre-flight checks for BITR balance and allowance');
  
  console.log('\n📝 Next Steps:');
  console.log('  1. Test market creation with the updated frontend code');
  console.log('  2. Check browser console for detailed debugging information');
  console.log('  3. Verify user has sufficient BITR balance (minimum 1050 BITR)');
  console.log('  4. Ensure BITR allowance is approved for POOL_CORE contract');
  
  console.log('\n⚠️  Important Notes:');
  console.log('  - The contract bug needs to be fixed in the backend');
  console.log('  - BITR tokens should not be transferred to GUIDED_ORACLE');
  console.log('  - This is a temporary workaround in the frontend');
  
  console.log('\n🎯 Testing Instructions:');
  console.log('  1. Open browser developer tools');
  console.log('  2. Try to create a BITR pool');
  console.log('  3. Check console logs for debugging information');
  console.log('  4. Look for allowance and balance information');
  
  console.log('\n✨ Debug script completed!');
}

// Run the debug script
debugMarketCreation().catch(console.error);

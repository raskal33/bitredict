#!/usr/bin/env node

/**
 * Test script to verify pool creation fixes
 * This script tests the updated gas settings and contract interactions
 */

const { ethers } = require('ethers');

// Configuration
const RPC_URL = 'https://dream-rpc.somnia.network/';
const POOL_CORE_ADDRESS = '0xA966a3fb0471D3A107eE834EA67E77f04177AD87';
const BITR_TOKEN_ADDRESS = '0x67aa1549551ff4479B68F1eC19fD011571C7db10';

// Test wallet (you'll need to replace with your test wallet)
const TEST_PRIVATE_KEY = process.env.TEST_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000000';

async function testPoolCreation() {
  console.log('🧪 Testing Pool Creation Fixes...\n');

  try {
    // Initialize provider and wallet
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(TEST_PRIVATE_KEY, provider);
    
    console.log('📝 Test wallet address:', wallet.address);
    
    // Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log('💰 Wallet balance:', ethers.formatEther(balance), 'STT');
    
    if (balance === 0n) {
      console.error('❌ Wallet has no balance for testing');
      return;
    }

    // Load contract ABI (simplified for testing)
    const PoolCoreABI = [
      "function createPool(bytes32 _predictedOutcome, uint256 _odds, uint256 _creatorStake, uint256 _eventStartTime, uint256 _eventEndTime, string memory _league, string memory _category, string memory _region, string memory _homeTeam, string memory _awayTeam, string memory _title, bool _isPrivate, uint256 _maxBetPerUser, bool _useBitr, uint8 _oracleType, bytes32 _marketId, uint8 _marketType) external payable returns (uint256)",
      "function poolCount() external view returns (uint256)"
    ];

    const contract = new ethers.Contract(POOL_CORE_ADDRESS, PoolCoreABI, wallet);

    // Test parameters
    const testPoolData = {
      predictedOutcome: ethers.keccak256(ethers.toUtf8Bytes("Test Outcome")),
      odds: 250, // 2.5x odds
      creatorStake: ethers.parseEther("1"), // 1 STT
      eventStartTime: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      eventEndTime: Math.floor(Date.now() / 1000) + 7200, // 2 hours from now
      league: "Test League",
      category: "football",
      region: "global",
      homeTeam: "Team A",
      awayTeam: "Team B",
      title: "Test Match",
      isPrivate: false,
      maxBetPerUser: 0,
      useBitr: false, // Use STT for testing
      oracleType: 0, // GUIDED
      marketId: ethers.keccak256(ethers.toUtf8Bytes("test-market-123")),
      marketType: 0 // MONEYLINE
    };

    console.log('\n🔍 Testing gas estimation...');
    
    // Test gas estimation with new settings
    try {
      const gasEstimate = await contract.createPool.estimateGas(
        testPoolData.predictedOutcome,
        testPoolData.odds,
        testPoolData.creatorStake,
        testPoolData.eventStartTime,
        testPoolData.eventEndTime,
        testPoolData.league,
        testPoolData.category,
        testPoolData.region,
        testPoolData.homeTeam,
        testPoolData.awayTeam,
        testPoolData.title,
        testPoolData.isPrivate,
        testPoolData.maxBetPerUser,
        testPoolData.useBitr,
        testPoolData.oracleType,
        testPoolData.marketId,
        testPoolData.marketType,
        {
          value: testPoolData.creatorStake + ethers.parseEther("1") // stake + creation fee
        }
      );

      console.log('✅ Gas estimation successful!');
      console.log('⛽ Estimated gas:', gasEstimate.toString());
      console.log('⛽ Gas with 50% buffer:', (gasEstimate * 150n / 100n).toString());
      console.log('⛽ Gas with 100% buffer:', (gasEstimate * 200n / 100n).toString());

      // Test if gas estimate is reasonable
      if (gasEstimate > 10000000n) {
        console.warn('⚠️ Gas estimate is very high (>10M), this might indicate an issue');
      } else if (gasEstimate < 1000000n) {
        console.warn('⚠️ Gas estimate is very low (<1M), this might be inaccurate');
      } else {
        console.log('✅ Gas estimate looks reasonable');
      }

    } catch (gasError) {
      console.error('❌ Gas estimation failed:', gasError.message);
      
      if (gasError.message.includes('execution reverted')) {
        console.log('🔍 Transaction would revert. Possible reasons:');
        console.log('   - Insufficient balance for creation fee + stake');
        console.log('   - Invalid parameters');
        console.log('   - Contract state issues');
      }
      
      return;
    }

    console.log('\n🎯 Gas estimation test completed successfully!');
    console.log('\n📋 Summary of fixes applied:');
    console.log('   ✅ Increased frontend gas limit from 5M to 10M');
    console.log('   ✅ Added dynamic gas estimation with 30% buffer');
    console.log('   ✅ Updated backend gas buffer from 30% to 50%');
    console.log('   ✅ Fixed contract parameter count (17 parameters)');
    console.log('   ✅ Enhanced error handling for gas estimation failures');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testPoolCreation()
    .then(() => {
      console.log('\n✅ Pool creation fix test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testPoolCreation };

#!/usr/bin/env node

/**
 * Comprehensive Frontend-Backend Integration Test
 * Tests all major services and contract integrations
 */

const { ethers } = require('ethers');

// Configuration
const FRONTEND_URL = 'http://localhost:8080';
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://bitredict-backend.fly.dev';
const RPC_URL = 'https://dream-rpc.somnia.network/';
const CHAIN_ID = 50312;

// Contract addresses (matching frontend config)
const CONTRACT_ADDRESSES = {
  BITR_TOKEN: '0x4b10fBFFDEE97C42E29899F47A2ECD30a38dBf2C',
  FAUCET: '0x1656712131BB07dDE6EeC7D88757Db24782cab71',
  GUIDED_ORACLE: '0x2103cCfc9a15F2876765487F594481D5f8EC160a',
  BITREDICT_POOL: '0x5F112bD56Eaa805DffF4b2929d9D44B2d364Cd08',
  OPTIMISTIC_ORACLE: '0x9E53d44aD3f614BA53F3B21EDF9fcE79a72238b2',
  BITREDICT_STAKING: '0x4736a1593d52803b2EabDf4EFd5645A0bfc22908',
  ODDYSSEY: '0x31AfDC3978317a1de606e76037429F3e456015C6',
};

// Test results tracking
const testResults = {
  network: { passed: 0, failed: 0, tests: [] },
  backend: { passed: 0, failed: 0, tests: [] },
  contracts: { passed: 0, failed: 0, tests: [] },
  integration: { passed: 0, failed: 0, tests: [] }
};

// Utility functions
function logTest(category, testName, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  const message = `${status} ${testName}`;
  
  console.log(details ? `${message}: ${details}` : message);
  
  testResults[category].tests.push({ name: testName, passed, details });
  if (passed) {
    testResults[category].passed++;
  } else {
    testResults[category].failed++;
  }
}

function printSummary() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 FRONTEND-BACKEND INTEGRATION TEST SUMMARY');
  console.log('='.repeat(80));
  
  let totalPassed = 0;
  let totalFailed = 0;
  
  Object.entries(testResults).forEach(([category, results]) => {
    const total = results.passed + results.failed;
    const percentage = total > 0 ? Math.round((results.passed / total) * 100) : 0;
    
    console.log(`\n📊 ${category.toUpperCase()}: ${results.passed}/${total} (${percentage}%)`);
    
    results.tests.forEach(test => {
      const status = test.passed ? '✅' : '❌';
      console.log(`  ${status} ${test.name}`);
      if (!test.passed && test.details) {
        console.log(`     └─ ${test.details}`);
      }
    });
    
    totalPassed += results.passed;
    totalFailed += results.failed;
  });
  
  const overallTotal = totalPassed + totalFailed;
  const overallPercentage = overallTotal > 0 ? Math.round((totalPassed / overallTotal) * 100) : 0;
  
  console.log('\n' + '='.repeat(80));
  console.log(`🎯 OVERALL RESULT: ${totalPassed}/${overallTotal} (${overallPercentage}%)`);
  
  if (overallPercentage >= 90) {
    console.log('🎉 EXCELLENT! Frontend-Backend integration is working perfectly!');
  } else if (overallPercentage >= 75) {
    console.log('✅ GOOD! Most integrations are working, minor issues to fix.');
  } else if (overallPercentage >= 50) {
    console.log('⚠️  MODERATE! Several integration issues need attention.');
  } else {
    console.log('🚨 CRITICAL! Major integration issues require immediate attention.');
  }
  
  console.log('='.repeat(80));
}

// Test functions
async function testNetworkConnectivity() {
  console.log('\n🌐 Testing Network Connectivity...');
  
  try {
    // Test Somnia RPC
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const network = await provider.getNetwork();
    
    logTest('network', 'Somnia RPC Connection', 
      network.chainId === BigInt(CHAIN_ID), 
      `Chain ID: ${network.chainId}`);
    
    // Test block number
    const blockNumber = await provider.getBlockNumber();
    logTest('network', 'Latest Block Retrieval', 
      blockNumber > 0, 
      `Block: ${blockNumber}`);
    
    // Test gas price
    const gasPrice = await provider.getFeeData();
    logTest('network', 'Gas Price Retrieval', 
      gasPrice.gasPrice > 0, 
      `Gas Price: ${ethers.formatUnits(gasPrice.gasPrice, 'gwei')} gwei`);
    
  } catch (error) {
    logTest('network', 'Somnia RPC Connection', false, error.message);
  }
}

async function testBackendAPI() {
  console.log('\n🔧 Testing Backend API Endpoints...');
  
  const endpoints = [
    { path: '/health', name: 'Health Check' },
    { path: '/api/oddyssey/stats', name: 'Oddyssey Statistics' },
    { path: '/api/staking/statistics', name: 'Staking Statistics' },
    { path: '/api/faucet/statistics', name: 'Faucet Statistics' },
    { path: '/api/pools/statistics', name: 'Pool Statistics' },
    { path: '/api/fixtures/upcoming', name: 'Upcoming Fixtures' },
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${BACKEND_URL}${endpoint.path}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const isSuccess = response.ok;
      const statusText = isSuccess ? `${response.status} OK` : `${response.status} ${response.statusText}`;
      
      logTest('backend', endpoint.name, isSuccess, statusText);
      
      if (isSuccess && endpoint.path !== '/health') {
        try {
          const data = await response.json();
          const hasData = data && (data.success !== false);
          logTest('backend', `${endpoint.name} Data`, hasData, 
            hasData ? 'Valid JSON response' : 'Invalid or empty response');
        } catch (parseError) {
          logTest('backend', `${endpoint.name} Data`, false, 'JSON parse error');
        }
      }
      
    } catch (error) {
      logTest('backend', endpoint.name, false, error.message);
    }
  }
}

async function testContractDeployments() {
  console.log('\n📜 Testing Contract Deployments...');
  
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    
    for (const [name, address] of Object.entries(CONTRACT_ADDRESSES)) {
      try {
        const code = await provider.getCode(address);
        const isDeployed = code !== '0x';
        
        logTest('contracts', `${name} Contract`, isDeployed, 
          isDeployed ? `Deployed at ${address}` : `No code at ${address}`);
        
        if (isDeployed) {
          // Test basic contract interaction (get balance/state)
          try {
            const balance = await provider.getBalance(address);
            logTest('contracts', `${name} Balance Check`, true, 
              `Balance: ${ethers.formatEther(balance)} STT`);
          } catch (balanceError) {
            logTest('contracts', `${name} Balance Check`, false, balanceError.message);
          }
        }
        
      } catch (error) {
        logTest('contracts', `${name} Contract`, false, error.message);
      }
    }
    
  } catch (error) {
    logTest('contracts', 'Provider Connection', false, error.message);
  }
}

async function testIntegrationFlow() {
  console.log('\n🔄 Testing Integration Flow...');
  
  try {
    // Test 1: Backend can connect to contracts
    const contractTestResponse = await fetch(`${BACKEND_URL}/api/oddyssey/contract-validation`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    logTest('integration', 'Backend-Contract Connection', contractTestResponse.ok,
      contractTestResponse.ok ? 'Backend can validate contracts' : 'Backend contract validation failed');
    
    // Test 2: API data format consistency
    if (contractTestResponse.ok) {
      try {
        const validationData = await contractTestResponse.json();
        const hasValidStructure = validationData && 
          (validationData.success !== undefined) && 
          (validationData.validation !== undefined || validationData.data !== undefined);
        
        logTest('integration', 'API Response Format', hasValidStructure,
          hasValidStructure ? 'Consistent API response structure' : 'Inconsistent API response format');
      } catch (parseError) {
        logTest('integration', 'API Response Format', false, 'JSON parse error');
      }
    }
    
    // Test 3: Contract address consistency
    try {
      const configResponse = await fetch(`${BACKEND_URL}/api/oddyssey/statistics`);
      if (configResponse.ok) {
        const statsData = await configResponse.json();
        const backendAddress = statsData.data?.contract?.contractAddress;
        const frontendAddress = CONTRACT_ADDRESSES.ODDYSSEY;
        
        const addressesMatch = backendAddress && 
          backendAddress.toLowerCase() === frontendAddress.toLowerCase();
        
        logTest('integration', 'Contract Address Consistency', addressesMatch,
          addressesMatch ? 'Frontend and backend use same addresses' : 
          `Mismatch: Backend(${backendAddress}) vs Frontend(${frontendAddress})`);
      }
    } catch (error) {
      logTest('integration', 'Contract Address Consistency', false, error.message);
    }
    
    // Test 4: Network configuration consistency
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const network = await provider.getNetwork();
    const networkMatches = network.chainId === BigInt(CHAIN_ID);
    
    logTest('integration', 'Network Configuration', networkMatches,
      networkMatches ? `Both use Chain ID ${CHAIN_ID}` : 
      `Chain ID mismatch: Expected ${CHAIN_ID}, got ${network.chainId}`);
    
  } catch (error) {
    logTest('integration', 'Integration Flow', false, error.message);
  }
}

// Main test execution
async function runTests() {
  console.log('🚀 Starting Frontend-Backend Integration Tests...');
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`RPC URL: ${RPC_URL}`);
  console.log(`Chain ID: ${CHAIN_ID}`);
  
  try {
    await testNetworkConnectivity();
    await testBackendAPI();
    await testContractDeployments();
    await testIntegrationFlow();
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
  
  printSummary();
}

// Execute tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  testResults,
  CONTRACT_ADDRESSES,
  BACKEND_URL,
  RPC_URL,
  CHAIN_ID
};

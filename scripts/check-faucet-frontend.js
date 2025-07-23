/**
 * Frontend Faucet Diagnostic Script
 * Checks environment variables and contract integration from frontend perspective
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Frontend Faucet Diagnostic Starting...\n');

// Check environment variables
console.log('📋 Environment Variables Check:');
const envVars = {
  'NEXT_PUBLIC_RPC_URL': process.env.NEXT_PUBLIC_RPC_URL,
  'NEXT_PUBLIC_FAUCET_ADDRESS': process.env.NEXT_PUBLIC_FAUCET_ADDRESS,
  'NEXT_PUBLIC_BITR_TOKEN_ADDRESS': process.env.NEXT_PUBLIC_BITR_TOKEN_ADDRESS,
  'NEXT_PUBLIC_CHAIN_ID': process.env.NEXT_PUBLIC_CHAIN_ID,
};

Object.entries(envVars).forEach(([key, value]) => {
  if (value) {
    console.log(`✅ ${key}: ${value}`);
  } else {
    console.log(`❌ ${key}: NOT SET`);
  }
});

console.log('\n📝 Frontend Integration Checklist:');

// Check if frontend environment variables match backend
const backendAddresses = {
  rpc: 'https://dream-rpc.somnia.network/',
  faucet: '0x1656712131BB07dDE6EeC7D88757Db24782cab71',
  bitr: '0x4b10fBFFDEE97C42E29899F47A2ECD30a38dBf2C',
  chainId: '50312'
};

const checks = [
  {
    name: 'RPC URL matches',
    frontend: process.env.NEXT_PUBLIC_RPC_URL,
    backend: backendAddresses.rpc,
    match: process.env.NEXT_PUBLIC_RPC_URL === backendAddresses.rpc
  },
  {
    name: 'Faucet address matches',
    frontend: process.env.NEXT_PUBLIC_FAUCET_ADDRESS,
    backend: backendAddresses.faucet,
    match: process.env.NEXT_PUBLIC_FAUCET_ADDRESS?.toLowerCase() === backendAddresses.faucet.toLowerCase()
  },
  {
    name: 'BITR address matches',
    frontend: process.env.NEXT_PUBLIC_BITR_TOKEN_ADDRESS,
    backend: backendAddresses.bitr,
    match: process.env.NEXT_PUBLIC_BITR_TOKEN_ADDRESS?.toLowerCase() === backendAddresses.bitr.toLowerCase()
  },
  {
    name: 'Chain ID matches',
    frontend: process.env.NEXT_PUBLIC_CHAIN_ID,
    backend: backendAddresses.chainId,
    match: process.env.NEXT_PUBLIC_CHAIN_ID === backendAddresses.chainId
  }
];

checks.forEach(check => {
  if (check.match) {
    console.log(`✅ ${check.name}`);
  } else {
    console.log(`❌ ${check.name}`);
    console.log(`   Frontend: ${check.frontend || 'NOT SET'}`);
    console.log(`   Backend:  ${check.backend}`);
  }
});

console.log('\n🛠️  Quick Fix Commands:');
console.log('If any environment variables are missing, add them to your .env.local file:');
console.log(`
NEXT_PUBLIC_RPC_URL=${backendAddresses.rpc}
NEXT_PUBLIC_FAUCET_ADDRESS=${backendAddresses.faucet}
NEXT_PUBLIC_BITR_TOKEN_ADDRESS=${backendAddresses.bitr}
NEXT_PUBLIC_CHAIN_ID=${backendAddresses.chainId}
`);

console.log('\n📄 Vercel Environment Variables:');
console.log('Make sure these are set in your Vercel dashboard:');
console.log('- NEXT_PUBLIC_RPC_URL');
console.log('- NEXT_PUBLIC_FAUCET_ADDRESS'); 
console.log('- NEXT_PUBLIC_BITR_TOKEN_ADDRESS');
console.log('- NEXT_PUBLIC_CHAIN_ID');

console.log('\n✅ Frontend diagnostic complete!');

// Summary
const missingVars = Object.entries(envVars).filter(([key, value]) => !value);
const mismatchedVars = checks.filter(check => !check.match);

if (missingVars.length === 0 && mismatchedVars.length === 0) {
  console.log('\n🎉 All environment variables are correctly set!');
  console.log('The faucet should work properly in the frontend.');
} else {
  console.log('\n⚠️  Issues found:');
  if (missingVars.length > 0) {
    console.log(`   - ${missingVars.length} missing environment variables`);
  }
  if (mismatchedVars.length > 0) {
    console.log(`   - ${mismatchedVars.length} mismatched addresses`);
  }
  console.log('Fix these issues and restart your development server.');
} 
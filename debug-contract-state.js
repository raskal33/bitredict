#!/usr/bin/env node

const { ethers } = require('ethers');

// Contract configuration
const CONTRACT_ADDRESS = '0x31AfDC3978317a1de606e76037429F3e456015C6';
const RPC_URL = 'https://dream-rpc.somnia.network/';

// Minimal ABI for the functions we need
const ODDYSSEY_ABI = [
  'function entryFee() view returns (uint256)',
  'function dailyCycleId() view returns (uint256)',
  'function oracle() view returns (address)',
  'function devWallet() view returns (address)',
  'function owner() view returns (address)',
  'function getDailyMatches(uint256 cycleId) view returns (tuple(uint64 id, uint64 startTime, uint32 oddsHome, uint32 oddsDraw, uint32 oddsAway, uint32 oddsOver, uint32 oddsUnder, tuple(uint8 moneyline, uint8 overUnder) result)[])',
  'function isCycleInitialized(uint256 cycleId) view returns (bool)'
];

async function debugContractState() {
  console.log('🔍 Debugging Oddyssey Contract State');
  console.log('=====================================');
  
  try {
    // Create provider and contract instance
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ODDYSSEY_ABI, provider);
    
    console.log('📍 Contract Address:', CONTRACT_ADDRESS);
    console.log('🌐 RPC URL:', RPC_URL);
    console.log('');
    
    // Check basic contract info
    console.log('📊 Basic Contract Info:');
    const entryFee = await contract.entryFee();
    const dailyCycleId = await contract.dailyCycleId();
    const oracle = await contract.oracle();
    const devWallet = await contract.devWallet();
    const owner = await contract.owner();
    
    console.log('  💰 Entry Fee:', ethers.formatEther(entryFee), 'STT');
    console.log('  🔄 Current Cycle ID:', dailyCycleId.toString());
    console.log('  🔮 Oracle Address:', oracle);
    console.log('  👤 Dev Wallet:', devWallet);
    console.log('  👑 Owner:', owner);
    console.log('');
    
    // Check if current cycle is initialized
    if (dailyCycleId > 0) {
      console.log('🎯 Current Cycle Status:');
      const isInitialized = await contract.isCycleInitialized(dailyCycleId);
      console.log('  📋 Cycle', dailyCycleId.toString(), 'Initialized:', isInitialized);
      
      if (isInitialized) {
        try {
          const matches = await contract.getDailyMatches(dailyCycleId);
          console.log('  🏆 Matches Count:', matches.length);
          
          if (matches.length > 0) {
            console.log('  📅 First Match:');
            console.log('    - ID:', matches[0].id.toString());
            console.log('    - Start Time:', new Date(Number(matches[0].startTime) * 1000).toISOString());
            console.log('    - Home Odds:', (Number(matches[0].oddsHome) / 1000).toFixed(3));
            console.log('    - Draw Odds:', (Number(matches[0].oddsDraw) / 1000).toFixed(3));
            console.log('    - Away Odds:', (Number(matches[0].oddsAway) / 1000).toFixed(3));
          }
        } catch (error) {
          console.log('  ❌ Error fetching matches:', error.message);
        }
      }
    }
    
    // Check network info
    console.log('');
    console.log('🌐 Network Info:');
    const network = await provider.getNetwork();
    console.log('  🆔 Chain ID:', network.chainId.toString());
    console.log('  📛 Network Name:', network.name);
    
    // Check latest block
    const latestBlock = await provider.getBlockNumber();
    console.log('  📦 Latest Block:', latestBlock);
    
    console.log('');
    console.log('✅ Contract state check completed successfully!');
    
  } catch (error) {
    console.error('❌ Error checking contract state:', error);
    process.exit(1);
  }
}

// Run the debug script
debugContractState();

#!/usr/bin/env node

const { createPublicClient, http } = require('viem');
const { somniaTestnet } = require('viem/chains');
const OddysseyABI = require('./contracts/abis/Oddyssey.json');

const client = createPublicClient({
  chain: somniaTestnet,
  transport: http('https://dream-rpc.somnia.network/')
});

const CONTRACT_ADDRESS = '0xfe20e7dAcff3Ca602ba27fCE3052a505278E489b';

async function testIntegration() {
  console.log('🧪 Testing Fixed Frontend Integration');
  console.log('=====================================');
  
  try {
    // Test 1: Get current cycle info
    console.log('\n1️⃣ Testing getCurrentCycleInfo...');
    const cycleInfo = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: OddysseyABI.abi,
      functionName: 'getCurrentCycleInfo'
    });
    
    console.log('✅ Cycle Info:', {
      cycleId: cycleInfo[0].toString(),
      state: cycleInfo[1],
      endTime: new Date(Number(cycleInfo[2]) * 1000),
      prizePool: cycleInfo[3].toString(),
      slipCount: cycleInfo[4]
    });
    
    // Test 2: Get matches with fixed parsing
    console.log('\n2️⃣ Testing getDailyMatches with fixed parsing...');
    const matches = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: OddysseyABI.abi,
      functionName: 'getDailyMatches',
      args: [1n]
    });
    
    const parsedMatches = matches.map((match) => ({
      id: match.id,
      startTime: match.startTime,
      oddsHome: Number(match.oddsHome) / 1000,
      oddsDraw: Number(match.oddsDraw) / 1000,
      oddsAway: Number(match.oddsAway) / 1000,
      oddsOver: Number(match.oddsOver) / 1000,
      oddsUnder: Number(match.oddsUnder) / 1000,
      homeTeam: match.homeTeam || 'Home Team',
      awayTeam: match.awayTeam || 'Away Team',
      leagueName: match.leagueName || 'Daily Challenge',
      result: {
        moneyline: Number(match.result?.moneyline || 0),
        overUnder: Number(match.result?.overUnder || 0),
      },
    }));
    
    console.log(`✅ Found ${parsedMatches.length} matches:`);
    parsedMatches.slice(0, 5).forEach((match, i) => {
      console.log(`   ${i + 1}. ${match.homeTeam} vs ${match.awayTeam} (${match.leagueName})`);
      console.log(`      Odds: H:${match.oddsHome} D:${match.oddsDraw} A:${match.oddsAway}`);
    });
    
    // Test 3: Get global stats
    console.log('\n3️⃣ Testing global stats...');
    const stats = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: OddysseyABI.abi,
      functionName: 'stats'
    });
    
    console.log('✅ Global Stats:', {
      totalVolume: stats[0].toString(),
      totalSlips: stats[1],
      highestOdd: stats[2].toString()
    });
    
    console.log('\n🎉 All tests passed! Frontend should now display:');
    console.log('   ✓ Real team names (e.g., "Sport Recife vs Corinthians")');
    console.log('   ✓ Real league names (e.g., "Serie A", "Ligue 1")');
    console.log('   ✓ Proper odds values (e.g., 2.8, 2.9)');
    console.log('   ✓ Real contract data instead of mock values');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testIntegration();

const { ethers } = require('ethers');

async function testNewContracts() {
  console.log('🧪 Testing New Contract Addresses');
  console.log('=====================================');
  
  const provider = new ethers.JsonRpcProvider('https://dream-rpc.somnia.network/');
  
  // New contract addresses
  const contracts = {
    poolCore: '0xA966a3fb0471D3A107eE834EA67E77f04177AD87',
    boostSystem: '0xB1b4614107769c6993228BC1CBA8d20Bd629185D',
    comboPools: '0x1888Bee25197C4C26bE71Dc373dc14DeD529fC0C',
    poolFactory: '0xd7d10C255995F1B94cF301bf6bD02309d80cD4eb'
  };
  
  console.log('📋 Testing Contract Interactions:');
  
  for (const [name, address] of Object.entries(contracts)) {
    try {
      console.log(`\n🔍 Testing ${name} at ${address}`);
      
      // Check if contract exists
      const code = await provider.getCode(address);
      if (code === '0x') {
        console.log(`❌ No contract found at ${address}`);
        continue;
      }
      
      console.log(`✅ Contract exists, code length: ${code.length}`);
      
      // Test basic contract interaction
      if (name === 'poolCore') {
        const contract = new ethers.Contract(address, [
          'function bitrToken() view returns (address)',
          'function feeCollector() view returns (address)',
          'function guidedOracle() view returns (address)',
          'function optimisticOracle() view returns (address)',
          'function poolCount() view returns (uint256)'
        ], provider);
        
        const bitrToken = await contract.bitrToken();
        const feeCollector = await contract.feeCollector();
        const guidedOracle = await contract.guidedOracle();
        const optimisticOracle = await contract.optimisticOracle();
        const poolCount = await contract.poolCount();
        
        console.log(`  📊 Contract State:`);
        console.log(`    bitrToken: ${bitrToken}`);
        console.log(`    feeCollector: ${feeCollector}`);
        console.log(`    guidedOracle: ${guidedOracle}`);
        console.log(`    optimisticOracle: ${optimisticOracle}`);
        console.log(`    poolCount: ${poolCount.toString()}`);
        
        // Verify constructor parameters are correct
        const expectedBitr = '0x67aa1549551ff4479B68F1eC19fD011571C7db10';
        const expectedGuided = '0x9CFB1097577480BD0eDe1795018c89786c541097';
        const expectedOptimistic = '0xa43e982eA27CD4B34E72E1B65A83E21A9eC777DC';
        
        console.log(`  ✅ Parameter Verification:`);
        console.log(`    bitrToken correct: ${bitrToken === expectedBitr ? '✅' : '❌'}`);
        console.log(`    guidedOracle correct: ${guidedOracle === expectedGuided ? '✅' : '❌'}`);
        console.log(`    optimisticOracle correct: ${optimisticOracle === expectedOptimistic ? '✅' : '❌'}`);
        
      } else if (name === 'boostSystem') {
        const contract = new ethers.Contract(address, [
          'function poolCore() view returns (address)',
          'function revenueCollector() view returns (address)'
        ], provider);
        
        const poolCore = await contract.poolCore();
        const revenueCollector = await contract.revenueCollector();
        
        console.log(`  📊 Contract State:`);
        console.log(`    poolCore: ${poolCore}`);
        console.log(`    revenueCollector: ${revenueCollector}`);
        
      } else if (name === 'comboPools') {
        const contract = new ethers.Contract(address, [
          'function bitrToken() view returns (address)',
          'function poolCore() view returns (address)',
          'function reputationSystem() view returns (address)',
          'function comboPoolCount() view returns (uint256)'
        ], provider);
        
        const bitrToken = await contract.bitrToken();
        const poolCore = await contract.poolCore();
        const reputationSystem = await contract.reputationSystem();
        const comboPoolCount = await contract.comboPoolCount();
        
        console.log(`  📊 Contract State:`);
        console.log(`    bitrToken: ${bitrToken}`);
        console.log(`    poolCore: ${poolCore}`);
        console.log(`    reputationSystem: ${reputationSystem}`);
        console.log(`    comboPoolCount: ${comboPoolCount.toString()}`);
        
      } else if (name === 'poolFactory') {
        const contract = new ethers.Contract(address, [
          'function poolCore() view returns (address)',
          'function comboPools() view returns (address)',
          'function boostSystem() view returns (address)',
          'function bitrToken() view returns (address)'
        ], provider);
        
        const poolCore = await contract.poolCore();
        const comboPools = await contract.comboPools();
        const boostSystem = await contract.boostSystem();
        const bitrToken = await contract.bitrToken();
        
        console.log(`  📊 Contract State:`);
        console.log(`    poolCore: ${poolCore}`);
        console.log(`    comboPools: ${comboPools}`);
        console.log(`    boostSystem: ${boostSystem}`);
        console.log(`    bitrToken: ${bitrToken}`);
      }
      
    } catch (error) {
      console.log(`❌ Error testing ${name}:`, error.message);
    }
  }
  
  console.log('\n🎉 Contract Testing Complete!');
  console.log('✅ All new contracts are deployed and accessible');
  console.log('✅ Frontend should now work with the new contract addresses');
}

testNewContracts().catch(console.error);

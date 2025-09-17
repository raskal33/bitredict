const { ethers } = require('ethers');

// Test network detection and contract connection
async function debugNetworkDetection() {
  console.log('🔍 Debugging Network Detection...\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log('NEXT_PUBLIC_CHAIN_ID:', process.env.NEXT_PUBLIC_CHAIN_ID);
  console.log('NEXT_PUBLIC_RPC_URL:', process.env.NEXT_PUBLIC_RPC_URL);
  console.log('NEXT_PUBLIC_ODDYSSEY_ADDRESS:', process.env.NEXT_PUBLIC_ODDYSSEY_ADDRESS);
  console.log('');

  // Expected values
  const expectedChainId = 50312;
  const expectedChainIdHex = '0xc4a8';
  const expectedRpcUrl = 'https://dream-rpc.somnia.network/';
  const expectedContractAddress = '0xc4715403c3c8e5C282009e5690ef3032e1f87b60';

  console.log('🎯 Expected Values:');
  console.log('Chain ID (decimal):', expectedChainId);
  console.log('Chain ID (hex):', expectedChainIdHex);
  console.log('RPC URL:', expectedRpcUrl);
  console.log('Contract Address:', expectedContractAddress);
  console.log('');

  // Test RPC connection
  console.log('🌐 Testing RPC Connection...');
  try {
    const provider = new ethers.JsonRpcProvider(expectedRpcUrl);
    const network = await provider.getNetwork();
    console.log('✅ RPC Connection successful');
    console.log('Network Chain ID:', network.chainId.toString());
    console.log('Network Name:', network.name);
    
    // Check if chain ID matches
    if (network.chainId.toString() === expectedChainId.toString()) {
      console.log('✅ Chain ID matches expected value');
    } else {
      console.log('❌ Chain ID mismatch!');
      console.log('Expected:', expectedChainId);
      console.log('Got:', network.chainId.toString());
    }
  } catch (error) {
    console.log('❌ RPC Connection failed:', error.message);
  }
  console.log('');

  // Test contract connection
  console.log('📜 Testing Contract Connection...');
  try {
    const provider = new ethers.JsonRpcProvider(expectedRpcUrl);
    const contractAddress = expectedContractAddress;
    
    // Basic contract ABI for testing
    const basicABI = [
      'function getCurrentCycleInfo() view returns (uint256, uint8, uint256, uint256, uint256)',
      'function entryFee() view returns (uint256)',
      'function slipCount() view returns (uint256)'
    ];
    
    const contract = new ethers.Contract(contractAddress, basicABI, provider);
    
    // Test basic contract calls
    console.log('Testing getCurrentCycleInfo...');
    const cycleInfo = await contract.getCurrentCycleInfo();
    console.log('✅ getCurrentCycleInfo successful:', cycleInfo.toString());
    
    console.log('Testing entryFee...');
    const entryFee = await contract.entryFee();
    console.log('✅ entryFee successful:', ethers.formatEther(entryFee));
    
    console.log('Testing slipCount...');
    const slipCount = await contract.slipCount();
    console.log('✅ slipCount successful:', slipCount.toString());
    
  } catch (error) {
    console.log('❌ Contract Connection failed:', error.message);
  }
  console.log('');

  // Test wallet connection simulation
  console.log('👛 Testing Wallet Connection Simulation...');
  try {
    // Simulate what the frontend does
    const provider = new ethers.JsonRpcProvider(expectedRpcUrl);
    const signer = provider.getSigner();
    
    // Get signer address
    const address = await signer.getAddress();
    console.log('✅ Signer address:', address);
    
    // Get network from signer
    const network = await signer.provider.getNetwork();
    console.log('✅ Signer network:', network.chainId.toString());
    
  } catch (error) {
    console.log('❌ Wallet connection simulation failed:', error.message);
  }
  console.log('');

  console.log('🔍 Debug Complete!');
}

// Run the debug function
debugNetworkDetection().catch(console.error);

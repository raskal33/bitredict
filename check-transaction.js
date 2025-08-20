const { ethers } = require('ethers');

/**
 * Check Transaction Status Script
 * 
 * This script checks the status of a specific transaction on the Somnia blockchain
 */

async function checkTransaction() {
  const txHash = '0x65cb628f0e3be58aebb7f533916c0b25c461b24b298deddcf2dd62c5553a024b';
  const rpcUrl = 'https://dream-rpc.somnia.network/';
  
  try {
    console.log('🔍 Checking transaction:', txHash);
    console.log('🌐 RPC URL:', rpcUrl);
    
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Get transaction details
    const tx = await provider.getTransaction(txHash);
    console.log('\n📄 Transaction Details:');
    console.log('- From:', tx?.from);
    console.log('- To:', tx?.to);
    console.log('- Value:', tx?.value ? ethers.formatEther(tx.value) + ' STT' : '0 STT');
    console.log('- Gas Limit:', tx?.gasLimit?.toString());
    console.log('- Gas Price:', tx?.gasPrice ? ethers.formatUnits(tx.gasPrice, 'gwei') + ' gwei' : 'N/A');
    console.log('- Nonce:', tx?.nonce);
    console.log('- Block Number:', tx?.blockNumber || 'Pending');
    
    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (receipt) {
      console.log('\n📋 Transaction Receipt:');
      console.log('- Status:', receipt.status === 1 ? '✅ SUCCESS' : '❌ FAILED');
      console.log('- Block Number:', receipt.blockNumber);
      console.log('- Gas Used:', receipt.gasUsed.toString());
      console.log('- Effective Gas Price:', receipt.effectiveGasPrice ? ethers.formatUnits(receipt.effectiveGasPrice, 'gwei') + ' gwei' : 'N/A');
      console.log('- Transaction Index:', receipt.transactionIndex);
      
      if (receipt.status === 0) {
        console.log('\n❌ TRANSACTION FAILED!');
        console.log('Possible reasons:');
        console.log('- Out of gas (gas limit too low)');
        console.log('- Contract execution reverted');
        console.log('- Invalid transaction parameters');
        console.log('- Insufficient balance');
      } else {
        console.log('\n✅ Transaction succeeded!');
      }
      
      // Check logs for more details
      if (receipt.logs && receipt.logs.length > 0) {
        console.log('\n📝 Event Logs:', receipt.logs.length, 'events emitted');
      }
    } else {
      console.log('\n⏳ Transaction is still pending or not found');
    }
    
  } catch (error) {
    console.error('❌ Error checking transaction:', error.message);
  }
}

checkTransaction();

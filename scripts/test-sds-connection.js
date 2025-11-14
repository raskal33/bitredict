/**
 * SDS Connection Test Script
 * 
 * Simulates frontend SDS connection and subscriptions
 * Tests the exact same flow as the frontend hook
 */

const { SDK } = require('@somnia-chain/streams');
const { createPublicClient, webSocket } = require('viem');
const { somniaTestnet } = require('viem/chains');

const RPC_URL = process.env.NEXT_PUBLIC_SDS_RPC_URL || 
                process.env.NEXT_PUBLIC_RPC_URL || 
                'https://dream-rpc.somnia.network/';

// Convert HTTP RPC URL to WebSocket with /ws endpoint
const rpcUrlClean = RPC_URL.replace(/\/$/, ''); // Remove trailing slash
const wsUrl = rpcUrlClean.replace(/^https?:\/\//, 'wss://') + '/ws'; // Convert http/https to wss and add /ws

console.log('🧪 Testing SDS Connection...');
console.log(`📡 RPC URL: ${RPC_URL}`);
console.log(`📡 WebSocket URL: ${wsUrl}`);
console.log('Starting test...\n');

// Handle unhandled errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

async function testSDSConnection() {
  console.log('🚀 Entering testSDSConnection function...');
  try {
    // Step 1: Create public client with WebSocket transport (same as frontend)
    console.log('\n1️⃣ Creating public client with WebSocket transport...');
    const publicClient = createPublicClient({
      chain: somniaTestnet,
      transport: webSocket(wsUrl),
    });
    console.log('✅ Public client created with WebSocket transport');

    // Step 2: Initialize SDK (same as frontend)
    console.log('\n2️⃣ Initializing SDS SDK...');
    const sdk = new SDK({
      public: publicClient
    });
    console.log('✅ SDK initialized');

    // Step 3: Test event schema verification
    console.log('\n3️⃣ Verifying event schemas...');
    const eventSchemas = ['PoolCreated', 'BetPlaced', 'PoolSettled'];
    
    for (const schemaId of eventSchemas) {
      try {
        const schemas = await sdk.streams.getEventSchemasById([schemaId]);
        if (schemas && schemas[0] && schemas[0].eventTopic) {
          console.log(`✅ Event schema "${schemaId}" verified`);
        } else {
          console.log(`❌ Event schema "${schemaId}" not found`);
        }
      } catch (err) {
        console.log(`❌ Event schema "${schemaId}" verification failed:`, err.message);
      }
    }

    // Step 4: Test subscription
    console.log('\n4️⃣ Testing subscription to BetPlaced events...');
    let receivedEvents = 0;
    
    const subscriptionResult = await sdk.streams.subscribe({
      somniaStreamsEventId: 'BetPlaced',
      ethCalls: [],
      onlyPushChanges: false,
      onData: (data) => {
        receivedEvents++;
        console.log(`\n✅ Received SDS event #${receivedEvents}:`, JSON.stringify(data, null, 2));
      },
      onError: (error) => {
        console.error(`\n❌ SDS subscription error:`, error);
      }
    });

    if (subscriptionResult && subscriptionResult.unsubscribe) {
      console.log(`✅ Successfully subscribed! Subscription ID: ${subscriptionResult.subscriptionId}`);
      console.log('\n⏳ Waiting for events (30 seconds)...');
      console.log('   (Create a pool or place a bet to trigger events)');
      
      setTimeout(() => {
        console.log(`\n📊 Test Results:`);
        console.log(`   Events received: ${receivedEvents}`);
        console.log(`   Status: ${receivedEvents > 0 ? '✅ Working' : '⚠️ No events received (may be normal if no activity)'}`);
        
        if (subscriptionResult.unsubscribe) {
          subscriptionResult.unsubscribe();
          console.log('\n✅ Unsubscribed');
        }
        process.exit(0);
      }, 30000);
    } else {
      console.error('❌ Subscription failed - no unsubscribe function returned');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testSDSConnection();


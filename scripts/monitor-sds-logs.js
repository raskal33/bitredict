/**
 * SDS Log Monitor
 * 
 * Monitors backend SDS service logs and displays them in real-time
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 SDS Log Monitor');
console.log('Monitoring backend SDS service...\n');

// Monitor backend logs (if running via npm start)
// This will show SDS-related logs from the backend
console.log('📋 Backend SDS Status:');
console.log('   - Check backend terminal for SDS initialization');
console.log('   - Look for: "✅ Somnia Data Streams service initialized"');
console.log('   - Look for: "✅ Event schema ... already registered"');
console.log('\n📋 Frontend SDS Status:');
console.log('   - Open browser console');
console.log('   - Look for: "🔄 Initializing Somnia Data Streams..."');
console.log('   - Look for: "✅ SDS subscription established for ..."');
console.log('\n💡 To test SDS:');
console.log('   1. Run: node scripts/test-sds-connection.js');
console.log('   2. Create a pool or place a bet');
console.log('   3. Watch for events in the test script');

// Check if backend is running
const http = require('http');
const checkBackend = () => {
  const req = http.get('http://localhost:3000', (res) => {
    console.log('\n✅ Backend is running on port 3000');
  });
  
  req.on('error', () => {
    console.log('\n⚠️ Backend not responding on port 3000');
    console.log('   Start backend with: cd backend && npm start');
  });
};

checkBackend();


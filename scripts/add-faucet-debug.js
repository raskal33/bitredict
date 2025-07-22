const fs = require('fs');
const path = require('path');

// Path to the useFaucet hook
const hookPath = path.join(__dirname, '..', 'hooks', 'useFaucet.ts');

// Debug code to add
const debugCode = `
  // DEBUG: Add logging for faucet stats
  useEffect(() => {
    console.log('🔍 Faucet Debug Info:');
    console.log('   faucetStats:', faucetStats);
    console.log('   userInfo:', userInfo);
    console.log('   hasSufficientBalance:', hasSufficientBalance);
    console.log('   maxPossibleClaims:', maxPossibleClaims);
    console.log('   isActive:', (faucetStats as FaucetStats)?.active);
    console.log('   canClaim:', canClaim());
    console.log('   claimStatus:', getClaimStatus());
  }, [faucetStats, userInfo, hasSufficientBalance, maxPossibleClaims]);
`;

// Backup and modify the hook
function addDebugToHook() {
  console.log('🔧 Adding debug logging to useFaucet hook...\n');
  
  try {
    // Read the current hook
    const hookContent = fs.readFileSync(hookPath, 'utf8');
    
    // Check if debug code already exists
    if (hookContent.includes('// DEBUG: Add logging for faucet stats')) {
      console.log('⚠️  Debug code already exists in useFaucet hook');
      return;
    }
    
    // Find the return statement and add debug before it
    const returnIndex = hookContent.lastIndexOf('  return {');
    if (returnIndex === -1) {
      console.log('❌ Could not find return statement in useFaucet hook');
      return;
    }
    
    // Insert debug code before return
    const newContent = hookContent.slice(0, returnIndex) + debugCode + '\n' + hookContent.slice(returnIndex);
    
    // Create backup
    const backupPath = hookPath + '.backup';
    fs.writeFileSync(backupPath, hookContent);
    console.log(`✅ Created backup: ${backupPath}`);
    
    // Write modified content
    fs.writeFileSync(hookPath, newContent);
    console.log('✅ Added debug logging to useFaucet hook');
    
    console.log('\n📋 Debug logging added. Now:');
    console.log('   1. Open browser developer tools');
    console.log('   2. Go to Console tab');
    console.log('   3. Navigate to /faucet page');
    console.log('   4. Check console for faucet debug info');
    
  } catch (error) {
    console.error('❌ Error modifying useFaucet hook:', error.message);
  }
}

// Remove debug code
function removeDebugFromHook() {
  console.log('🧹 Removing debug logging from useFaucet hook...\n');
  
  try {
    // Check if backup exists
    const backupPath = hookPath + '.backup';
    if (fs.existsSync(backupPath)) {
      const backupContent = fs.readFileSync(backupPath, 'utf8');
      fs.writeFileSync(hookPath, backupContent);
      fs.unlinkSync(backupPath);
      console.log('✅ Restored useFaucet hook from backup');
    } else {
      console.log('⚠️  No backup found, manually removing debug code...');
      
      const hookContent = fs.readFileSync(hookPath, 'utf8');
      const lines = hookContent.split('\n');
      const filteredLines = lines.filter(line => !line.includes('// DEBUG:'));
      
      fs.writeFileSync(hookPath, filteredLines.join('\n'));
      console.log('✅ Removed debug code from useFaucet hook');
    }
    
  } catch (error) {
    console.error('❌ Error removing debug code:', error.message);
  }
}

// Main function
function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'add':
      addDebugToHook();
      break;
    case 'remove':
      removeDebugFromHook();
      break;
    default:
      console.log('🔧 Faucet Debug Hook Manager\n');
      console.log('Usage:');
      console.log('   node scripts/add-faucet-debug.js add    - Add debug logging');
      console.log('   node scripts/add-faucet-debug.js remove - Remove debug logging');
      console.log('\nThis will add console.log statements to useFaucet hook for debugging.');
  }
}

main(); 
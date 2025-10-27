#!/usr/bin/env node

/**
 * Fix ABI References Script
 * 
 * This script fixes all .abi references in the frontend code
 * since the ABI files are arrays directly, not objects with .abi property
 */

const fs = require('fs');
const path = require('path');

// Files to fix
const filesToFix = [
  'services/contractAnalyticsService.ts',
  'services/oddyssey-contract.ts', 
  'services/poolStateService.ts',
  'services/reputationService.ts',
  'hooks/useOddyssey.ts'
];

// ABI imports to fix
const abiImports = [
  'BitredictTokenABI',
  'BitrFaucetABI', 
  'GuidedOracleABI',
  'OptimisticOracleABI',
  'BitredictPoolCoreABI',
  'BitredictBoostSystemABI',
  'BitredictComboPoolsABI',
  'BitredictPoolFactoryABI',
  'BitredictStakingABI',
  'ReputationSystemABI',
  'OddysseyABI'
];

function fixFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;
  
  // Fix .abi references
  abiImports.forEach(abiName => {
    const pattern = new RegExp(`\\b${abiName}\\.abi\\b`, 'g');
    if (content.includes(`${abiName}.abi`)) {
      content = content.replace(pattern, abiName);
      modified = true;
      console.log(`   ✅ Fixed ${abiName}.abi → ${abiName}`);
    }
  });
  
  if (modified) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Fixed file: ${filePath}`);
  } else {
    console.log(`ℹ️  No changes needed: ${filePath}`);
  }
}

console.log('🔧 Fixing ABI references in frontend files...\n');

filesToFix.forEach(fixFile);

console.log('\n🎉 ABI reference fixes complete!');

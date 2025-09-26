#!/usr/bin/env node

/**
 * CONTRACT USAGE VERIFICATION
 * 
 * Verifies that the frontend is using the correct BitredictPoolCore contract
 * instead of the old BitredictPool contract
 */

const fs = require('fs');
const path = require('path');

class ContractUsageVerifier {
  constructor() {
    this.frontendPath = '/home/leon/predict-linux';
    this.issues = [];
    this.fixes = [];
  }

  async verifyContractUsage() {
    console.log('🔍 Verifying Contract Usage in Frontend...');
    console.log('='.repeat(50));
    
    // Check contract configuration
    await this.checkContractConfig();
    
    // Check component usage
    await this.checkComponentUsage();
    
    // Check hook usage
    await this.checkHookUsage();
    
    // Check service usage
    await this.checkServiceUsage();
    
    // Display results
    this.displayResults();
  }

  async checkContractConfig() {
    console.log('\n📋 Checking Contract Configuration...');
    
    try {
      const configPath = path.join(this.frontendPath, 'config/wagmi.ts');
      const configContent = fs.readFileSync(configPath, 'utf8');
      
      // Check if POOL_CORE is configured correctly
      if (configContent.includes('POOL_CORE:') && configContent.includes('0x3A6AFdC8C9c0eBe377B5413e87F1005675bbA413')) {
        console.log('✅ POOL_CORE contract configured correctly');
      } else {
        this.issues.push('POOL_CORE contract not configured correctly');
      }
      
      // Check if old BITREDICT_POOL is still being used
      if (configContent.includes('BITREDICT_POOL:') && configContent.includes('0x3A6AFdC8C9c0eBe377B5413e87F1005675bbA413')) {
        console.log('⚠️ BITREDICT_POOL points to old address (DEPRECATED - use POOL_CORE)');
      } else if (configContent.includes('BITREDICT_POOL:') && configContent.includes('0xBc54c64800d37d4A85C0ab15A13110a75742f423')) {
        console.log('⚠️ BITREDICT_POOL points to same address as POOL_CORE (DEPRECATED - use POOL_CORE)');
      }
      
    } catch (error) {
      this.issues.push(`Error reading config: ${error.message}`);
    }
  }

  async checkComponentUsage() {
    console.log('\n🧩 Checking Component Usage...');
    
    const components = [
      'components/PoolActions.tsx',
      'components/PoolCard.tsx',
      'components/PoolList.tsx'
    ];
    
    for (const component of components) {
      const componentPath = path.join(this.frontendPath, component);
      
      if (fs.existsSync(componentPath)) {
        const content = fs.readFileSync(componentPath, 'utf8');
        
        if (content.includes('BitredictPoolABI')) {
          this.issues.push(`${component} still uses old BitredictPoolABI`);
        } else if (content.includes('CONTRACTS.POOL_CORE')) {
          console.log(`✅ ${component} uses POOL_CORE correctly`);
        }
        
        if (content.includes('CONTRACTS.BITREDICT_POOL')) {
          this.issues.push(`${component} still uses DEPRECATED BITREDICT_POOL (use POOL_CORE)`);
        }
      }
    }
  }

  async checkHookUsage() {
    console.log('\n🪝 Checking Hook Usage...');
    
    const hooks = [
      'hooks/usePools.ts',
      'hooks/useContractInteractions.ts',
      'hooks/usePoolCreation.ts'
    ];
    
    for (const hook of hooks) {
      const hookPath = path.join(this.frontendPath, hook);
      
      if (fs.existsSync(hookPath)) {
        const content = fs.readFileSync(hookPath, 'utf8');
        
        if (content.includes('CONTRACTS.BITREDICT_POOL')) {
          this.issues.push(`${hook} still uses DEPRECATED BITREDICT_POOL (use POOL_CORE)`);
        } else if (content.includes('CONTRACTS.POOL_CORE')) {
          console.log(`✅ ${hook} uses POOL_CORE correctly`);
        }
      }
    }
  }

  async checkServiceUsage() {
    console.log('\n🔧 Checking Service Usage...');
    
    const services = [
      'services/guidedMarketWalletService.ts',
      'services/prizeClaimService.ts',
      'services/poolService.ts'
    ];
    
    for (const service of services) {
      const servicePath = path.join(this.frontendPath, service);
      
      if (fs.existsSync(servicePath)) {
        const content = fs.readFileSync(servicePath, 'utf8');
        
        if (content.includes('CONTRACTS.BITREDICT_POOL')) {
          this.issues.push(`${service} still uses DEPRECATED BITREDICT_POOL (use POOL_CORE)`);
        } else if (content.includes('CONTRACTS.POOL_CORE')) {
          console.log(`✅ ${service} uses POOL_CORE correctly`);
        }
      }
    }
  }

  displayResults() {
    console.log('\n📊 VERIFICATION RESULTS');
    console.log('='.repeat(50));
    
    if (this.issues.length === 0) {
      console.log('✅ All contract usage is correct!');
      console.log('✅ Frontend is using BitredictPoolCore contract properly');
      console.log('✅ No old BitredictPool references found');
    } else {
      console.log('❌ Issues found:');
      this.issues.forEach(issue => {
        console.log(`   - ${issue}`);
      });
    }
    
    console.log('\n📋 SUMMARY:');
    console.log(`Contract Address: 0x3A6AFdC8C9c0eBe377B5413e87F1005675bbA413`);
    console.log(`Contract Type: BitredictPoolCore (New Modular Architecture)`);
    console.log(`ABI File: contracts/abis/BitredictPoolCore.json`);
    console.log(`Configuration: CONTRACTS.POOL_CORE`);
    
    if (this.issues.length > 0) {
      console.log('\n🔧 RECOMMENDED FIXES:');
      console.log('1. Replace all CONTRACTS.BITREDICT_POOL with CONTRACTS.POOL_CORE (DEPRECATED)');
      console.log('2. Replace all BitredictPoolABI with CONTRACTS.POOL_CORE.abi (DEPRECATED)');
      console.log('3. Update any hardcoded contract addresses to use POOL_CORE');
      console.log('4. BITREDICT_POOL is now DEPRECATED - use POOL_CORE everywhere');
    }
  }
}

// Run if called directly
if (require.main === module) {
  const verifier = new ContractUsageVerifier();
  verifier.verifyContractUsage().catch(error => {
    console.error('💥 Verification failed:', error);
    process.exit(1);
  });
}

module.exports = ContractUsageVerifier;

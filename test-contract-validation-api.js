#!/usr/bin/env node

const fetch = require('node-fetch');

async function testContractValidationAPI() {
  console.log('🔍 Testing Contract Validation API');
  console.log('==================================');
  
  try {
    // Test the API endpoint that the frontend uses
    const response = await fetch('http://localhost:3000/api/oddyssey/contract-validation');
    
    if (!response.ok) {
      console.log('❌ API Response not OK:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    
    console.log('📊 API Response:');
    console.log('  Success:', data.success);
    console.log('  Has Validation:', !!data.validation);
    
    if (data.validation) {
      console.log('  Has Matches:', data.validation.hasMatches);
      console.log('  Match Count:', data.validation.matchCount);
      console.log('  Expected Count:', data.validation.expectedCount);
      console.log('  Is Valid:', data.validation.isValid);
      console.log('  Contract Matches Length:', data.validation.contractMatches?.length || 0);
      console.log('');
      
      if (data.validation.contractMatches && data.validation.contractMatches.length > 0) {
        console.log('📋 Contract Matches from API:');
        data.validation.contractMatches.forEach((match, index) => {
          console.log(`  ${index}: ID=${match.id}, Start=${match.startTime}`);
        });
      } else {
        console.log('❌ No contract matches in API response!');
      }
    } else {
      console.log('❌ No validation data in response!');
    }
    
    if (data.error) {
      console.log('❌ API Error:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the Next.js development server is running:');
      console.log('   npm run dev');
    }
  }
}

// Run the test
testContractValidationAPI();

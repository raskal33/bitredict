// Debug script to check contract addresses
console.log('=== CONTRACT ADDRESS DEBUG ===');
console.log('Environment variables:');
console.log('NEXT_PUBLIC_ODDYSSEY_ADDRESS:', process.env.NEXT_PUBLIC_ODDYSSEY_ADDRESS);
console.log('NEXT_PUBLIC_BITR_TOKEN_ADDRESS:', process.env.NEXT_PUBLIC_BITR_TOKEN_ADDRESS);

// Import the config to see what's actually being used
import { CONTRACT_ADDRESSES } from './config/wagmi.js';
import { CONTRACTS } from './contracts/index.js';

console.log('\nCONTRACT_ADDRESSES:');
console.log('ODDYSSEY:', CONTRACT_ADDRESSES.ODDYSSEY);
console.log('BITR_TOKEN:', CONTRACT_ADDRESSES.BITR_TOKEN);

console.log('\nCONTRACTS:');
console.log('ODDYSSEY address:', CONTRACTS.ODDYSSEY?.address);
console.log('BITR_TOKEN address:', CONTRACTS.BITR_TOKEN?.address);

// Check if addresses are valid
const isValidAddress = (addr) => addr && addr.startsWith('0x') && addr.length === 42;
console.log('\nAddress validation:');
console.log('ODDYSSEY valid:', isValidAddress(CONTRACTS.ODDYSSEY?.address));
console.log('BITR_TOKEN valid:', isValidAddress(CONTRACTS.BITR_TOKEN?.address));

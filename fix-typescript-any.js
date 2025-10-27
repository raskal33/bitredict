#!/usr/bin/env node

/**
 * Fix TypeScript 'any' type errors
 * 
 * This script fixes implicit 'any' type errors in the frontend code
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'hooks/useOddyssey.ts');

if (!fs.existsSync(filePath)) {
  console.log('❌ File not found: hooks/useOddyssey.ts');
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

// Fix select callbacks
content = content.replace(
  /select: \(data\) => transformContractData\(data\)/g,
  'select: (data: unknown) => transformContractData(data)'
);

// Fix other parameter types
content = content.replace(
  /\(poolData, index\) =>/g,
  '(poolData: any, index: number) =>'
);

fs.writeFileSync(filePath, content);
console.log('✅ Fixed TypeScript type errors in useOddyssey.ts');

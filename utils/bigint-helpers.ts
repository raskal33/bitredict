// BigInt serialization utilities to fix JSON serialization errors

/**
 * Safely converts BigInt to string for JSON serialization
 */
export function bigIntToString(value: bigint | number | string): string {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return String(value);
}

/**
 * Safely converts BigInt to number (be careful with large values)
 */
export function bigIntToNumber(value: bigint | number | string): number {
  if (typeof value === 'bigint') {
    // Check if the value is within safe integer range
    if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < BigInt(Number.MIN_SAFE_INTEGER)) {
      console.warn('BigInt value is outside safe integer range, precision may be lost');
    }
    return Number(value);
  }
  return Number(value);
}

/**
 * Safely performs arithmetic operations with BigInt and other types
 */
export function safeAdd(a: bigint | number | string, b: bigint | number | string): bigint {
  const aBigInt = typeof a === 'bigint' ? a : BigInt(a);
  const bBigInt = typeof b === 'bigint' ? b : BigInt(b);
  return aBigInt + bBigInt;
}

export function safeSubtract(a: bigint | number | string, b: bigint | number | string): bigint {
  const aBigInt = typeof a === 'bigint' ? a : BigInt(a);
  const bBigInt = typeof b === 'bigint' ? b : BigInt(b);
  return aBigInt - bBigInt;
}

export function safeMultiply(a: bigint | number | string, b: bigint | number | string): bigint {
  const aBigInt = typeof a === 'bigint' ? a : BigInt(a);
  const bBigInt = typeof b === 'bigint' ? b : BigInt(b);
  return aBigInt * bBigInt;
}

export function safeDivide(a: bigint | number | string, b: bigint | number | string): bigint {
  const aBigInt = typeof a === 'bigint' ? a : BigInt(a);
  const bBigInt = typeof b === 'bigint' ? b : BigInt(b);
  if (bBigInt === BigInt(0)) {
    throw new Error('Division by zero');
  }
  return aBigInt / bBigInt;
}

/**
 * Safely compares BigInt values
 */
export function bigIntEquals(a: bigint | number | string, b: bigint | number | string): boolean {
  try {
    const aBigInt = typeof a === 'bigint' ? a : BigInt(a);
    const bBigInt = typeof b === 'bigint' ? b : BigInt(b);
    return aBigInt === bBigInt;
  } catch {
    return false;
  }
}

export function bigIntGreaterThan(a: bigint | number | string, b: bigint | number | string): boolean {
  try {
    const aBigInt = typeof a === 'bigint' ? a : BigInt(a);
    const bBigInt = typeof b === 'bigint' ? b : BigInt(b);
    return aBigInt > bBigInt;
  } catch {
    return false;
  }
}

export function bigIntLessThan(a: bigint | number | string, b: bigint | number | string): boolean {
  try {
    const aBigInt = typeof a === 'bigint' ? a : BigInt(a);
    const bBigInt = typeof b === 'bigint' ? b : BigInt(b);
    return aBigInt < bBigInt;
  } catch {
    return false;
  }
}

/**
 * Safely checks if BigInt is zero
 */
export function isBigIntZero(value: bigint | number | string): boolean {
  try {
    const bigIntValue = typeof value === 'bigint' ? value : BigInt(value);
    return bigIntValue === BigInt(0);
  } catch {
    return false;
  }
}

/**
 * Custom JSON serializer for BigInt values
 */
export function safeJsonStringify(obj: any, space?: string | number): string {
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    return value;
  }, space);
}

/**
 * Safe BigInt parser from string
 */
export function stringToBigInt(value: string | number): bigint {
  try {
    return BigInt(value);
  } catch {
    return BigInt(0);
  }
}

/**
 * Recursively convert all BigInt values in an object to strings for serialization
 */
export function sanitizeForSerialization(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForSerialization(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeForSerialization(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Helper to safely convert percentage calculations involving BigInt
 */
export function calculatePercentage(value: bigint | number | string, total: bigint | number | string): number {
  try {
    const valueBigInt = typeof value === 'bigint' ? value : BigInt(value);
    const totalBigInt = typeof total === 'bigint' ? total : BigInt(total);
    
    if (totalBigInt === BigInt(0)) {
      return 0;
    }
    
    // Convert to numbers for percentage calculation
    const valueNum = Number(valueBigInt);
    const totalNum = Number(totalBigInt);
    
    return (valueNum / totalNum) * 100;
  } catch {
    return 0;
  }
} 
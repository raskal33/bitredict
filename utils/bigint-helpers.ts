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
export function safeJsonStringify(obj: any): string {
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    return value;
  });
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
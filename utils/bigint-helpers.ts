// Utility functions for handling BigInt values safely

/**
 * Safely convert any value to BigInt
 */
export const toBigInt = (value: any): bigint => {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'string') return BigInt(value || '0');
  if (typeof value === 'number') return BigInt(value);
  return BigInt(0);
};

/**
 * Check if a value is zero BigInt
 */
export const isBigIntZero = (value: any): boolean => {
  return toBigInt(value) === BigInt(0);
};

/**
 * Custom JSON replacer to handle BigInt serialization
 */
export const bigIntReplacer = (key: string, value: any) => {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
};

/**
 * Safely stringify objects containing BigInt values
 */
export const safeStringify = (obj: any): string => {
  return JSON.stringify(obj, bigIntReplacer);
};

/**
 * Convert BigInt to number safely (for display purposes)
 */
export const bigIntToNumber = (value: bigint): number => {
  try {
    return Number(value);
  } catch {
    return 0;
  }
};

/**
 * Format BigInt as string with proper decimal handling
 */
export const formatBigInt = (value: bigint, decimals: number = 18): string => {
  const str = value.toString();
  if (str.length <= decimals) {
    return `0.${str.padStart(decimals, '0')}`;
  }
  const integerPart = str.slice(0, -decimals);
  const decimalPart = str.slice(-decimals);
  return `${integerPart}.${decimalPart}`;
};

/**
 * Recursively serialize BigInt values to strings in any object/array structure
 * This prevents React Query serialization errors
 */
export const serializeBigInts = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  
  if (obj instanceof ArrayBuffer || obj instanceof Uint8Array) {
    return obj.toString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => serializeBigInts(item));
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      try {
        result[key] = serializeBigInts(value);
      } catch (error) {
        console.warn(`Error serializing key "${key}":`, error);
        result[key] = null;
      }
    }
    return result;
  }
  
  return obj;
}; 
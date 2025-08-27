/**
 * BigInt Serialization Utilities for Frontend
 * Handles safe conversion of BigInt values for React Query and JSON serialization
 */

/**
 * Convert BigInt values to strings in an object for safe JSON serialization
 * @param obj - The object to process
 * @returns The object with BigInt values converted to strings
 */
export function serializeBigInts(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'bigint') {
    return obj.toString();
  }

  if (Array.isArray(obj)) {
    return obj.map(item => serializeBigInts(item));
  }

  if (typeof obj === 'object') {
    // Handle Date objects
    if (obj instanceof Date) {
      return obj.toISOString();
    }
    
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      try {
        result[key] = serializeBigInts(value);
      } catch (error) {
        console.warn(`Warning: Could not serialize key "${key}":`, error);
        result[key] = null; // Fallback to null for problematic values
      }
    }
    return result;
  }

  return obj;
}

/**
 * Safe JSON.stringify that handles BigInt values
 * @param obj - The object to stringify
 * @param space - Number of spaces for indentation
 * @returns JSON string with BigInt values converted to strings
 */
export function safeStringify(obj: any, space = 0): string {
  const serialized = serializeBigInts(obj);
  return JSON.stringify(serialized, null, space);
}

/**
 * Custom query key hasher for React Query that handles BigInt values
 * @param queryKey - The query key to hash
 * @returns Serialized query key string
 */
export function createBigIntSafeQueryKeyHasher() {
  return (queryKey: any) => {
    const serializedKey = serializeBigInts(queryKey);
    return JSON.stringify(serializedKey);
  };
}

/**
 * Transform function for Wagmi contract queries to handle BigInt values
 * @param data - Contract query result data
 * @returns Serialized data safe for React Query
 */
export function transformContractData<T>(data: T): T {
  return serializeBigInts(data) as T;
}

/**
 * Global BigInt serialization setup for JSON.stringify
 * Call this once in your app initialization
 */
export function setupGlobalBigIntSerialization(): void {
  if (typeof window !== 'undefined' && typeof BigInt !== 'undefined') {
    // @ts-ignore - Adding toJSON method to BigInt prototype
    if (!(BigInt.prototype as any).toJSON) {
      (BigInt.prototype as any).toJSON = function() {
        return this.toString();
      };
    }
  }
}

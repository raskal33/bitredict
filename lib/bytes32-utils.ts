import { ethers } from 'ethers';

/**
 * Utility functions for handling bytes32 string conversion
 * Used to convert between human-readable strings and bytes32 hashes
 * for the optimized contract integration
 */

/**
 * Converts a bytes32 hash back to the original string
 * Note: This is a reverse lookup - we need to maintain a mapping
 * or use a different approach since hashing is one-way
 */
export function bytes32ToString(hash: string): string {
  // For now, we'll return a placeholder since we can't reverse hashes
  // In production, you might want to maintain a mapping or use events
  if (!hash || hash === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    return '';
  }
  
  // Try to decode as UTF-8 if it's a short string (less than 32 bytes)
  try {
    const decoded = ethers.toUtf8String(hash);
    // Check if it's a valid UTF-8 string and not just random bytes
    if (decoded.length > 0 && decoded.length < 32 && !decoded.includes('\0')) {
      return decoded;
    }
  } catch {
    // Not a valid UTF-8 string, continue with fallback
  }
  
  // Fallback: return a truncated hash for display
  return `Hash: ${hash.slice(0, 8)}...`;
}

/**
 * Converts a string to bytes32 hash (same as used in contract calls)
 */
export function stringToBytes32(str: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(str));
}

/**
 * Converts a pool object with bytes32 fields to human-readable format
 * This is used when fetching pool data from the contract
 */
export function convertPoolToReadable(pool: Record<string, unknown>): Record<string, unknown> {
  if (!pool) return pool;
  
  return {
    ...pool,
    league: bytes32ToString(pool.league as string),
    category: bytes32ToString(pool.category as string),
    region: bytes32ToString(pool.region as string),
    homeTeam: bytes32ToString(pool.homeTeam as string),
    awayTeam: bytes32ToString(pool.awayTeam as string),
    title: bytes32ToString(pool.title as string),
  };
}

/**
 * Converts multiple pools to readable format
 */
export function convertPoolsToReadable(pools: Record<string, unknown>[]): Record<string, unknown>[] {
  return pools.map(convertPoolToReadable);
}

/**
 * Creates a mapping of common strings to their hashes
 * This can be used for reverse lookup in production
 */
export const COMMON_STRINGS_MAP: Record<string, string> = {
  // Sports leagues
  'Premier League': '0x' + 'Premier League'.padEnd(64, '0').slice(2),
  'La Liga': '0x' + 'La Liga'.padEnd(64, '0').slice(2),
  'Serie A': '0x' + 'Serie A'.padEnd(64, '0').slice(2),
  'Bundesliga': '0x' + 'Bundesliga'.padEnd(64, '0').slice(2),
  'Ligue 1': '0x' + 'Ligue 1'.padEnd(64, '0').slice(2),
  
  // Categories
  'Football': '0x' + 'Football'.padEnd(64, '0').slice(2),
  'Basketball': '0x' + 'Basketball'.padEnd(64, '0').slice(2),
  'Tennis': '0x' + 'Tennis'.padEnd(64, '0').slice(2),
  'Crypto': '0x' + 'Crypto'.padEnd(64, '0').slice(2),
  'Politics': '0x' + 'Politics'.padEnd(64, '0').slice(2),
  
  // Regions
  'Europe': '0x' + 'Europe'.padEnd(64, '0').slice(2),
  'North America': '0x' + 'North America'.padEnd(64, '0').slice(2),
  'Asia': '0x' + 'Asia'.padEnd(64, '0').slice(2),
  'South America': '0x' + 'South America'.padEnd(64, '0').slice(2),
};

/**
 * Reverse lookup for common strings
 */
export function reverseLookupString(hash: string): string {
  // First try the common strings map
  for (const [str, strHash] of Object.entries(COMMON_STRINGS_MAP)) {
    if (strHash === hash) {
      return str;
    }
  }
  
  // Fallback to bytes32ToString
  return bytes32ToString(hash);
}

/**
 * Enhanced pool conversion with reverse lookup
 */
export function convertPoolToReadableEnhanced(pool: Record<string, unknown>): Record<string, unknown> {
  if (!pool) return pool;
  
  return {
    ...pool,
    league: reverseLookupString(pool.league as string),
    category: reverseLookupString(pool.category as string),
    region: reverseLookupString(pool.region as string),
    homeTeam: reverseLookupString(pool.homeTeam as string),
    awayTeam: reverseLookupString(pool.awayTeam as string),
    title: reverseLookupString(pool.title as string),
  };
}

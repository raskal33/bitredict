/**
 * Proper bytes32 string decoder using ethers decodeBytes32String
 */
import { decodeBytes32String as ethersDecodeBytes32String } from 'ethers';

/**
 * Decode bytes32 to string using ethers decodeBytes32String
 * This is the correct way to decode strings that were encoded with encodeBytes32String
 */
export function decodeBytes32String(bytes32: string): string {
  if (!bytes32 || bytes32 === '0x' || bytes32 === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    return '';
  }
  
  try {
    // Use ethers decodeBytes32String to decode
    const decoded = ethersDecodeBytes32String(bytes32);
    return decoded;
  } catch (error) {
    console.warn('Failed to decode bytes32 string:', bytes32, error);
    // If decoding fails, it might be a hash, return shortened version
    return bytes32.slice(0, 10) + '...';
  }
}

/**
 * Test if a bytes32 value is a proper string (not a hash)
 */
export function isBytes32String(bytes32: string): boolean {
  if (!bytes32 || bytes32 === '0x' || bytes32 === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    return false;
  }
  
  try {
    const decoded = ethersDecodeBytes32String(bytes32);
    // If it decodes successfully and doesn't contain null bytes, it's likely a string
    return !decoded.includes('\x00') && decoded.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Decode team names from bytes32 fields
 */
export function decodeTeamNames(poolData: {
  homeTeam: string;
  awayTeam: string;
  league: string;
  title: string;
}) {
  const homeTeam = decodeBytes32String(poolData.homeTeam);
  const awayTeam = decodeBytes32String(poolData.awayTeam);
  const league = decodeBytes32String(poolData.league);
  const title = decodeBytes32String(poolData.title);
  
  return {
    homeTeam,
    awayTeam,
    league,
    title,
    hasValidNames: homeTeam.length > 0 && awayTeam.length > 0
  };
}

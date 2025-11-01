/**
 * Number Formatting Utilities for Frontend
 * 
 * Handles BigInt, scientific notation, and proper token display
 * Prevents issues like "4e+21 BITR" → "4,000,000 BITR"
 */

import { formatUnits, parseUnits } from 'viem';

/**
 * Format token amount from BigInt/wei to human-readable format
 * @param value - Value in wei (BigInt, string, or number)
 * @param decimals - Token decimals (default 18)
 * @param maxDecimals - Maximum decimal places to show (default 2)
 * @returns Formatted string (e.g., "1,234.56")
 */
export function formatTokenAmount(
  value: bigint | string | number | undefined | null,
  decimals: number = 18,
  maxDecimals: number = 2
): string {
  if (value === undefined || value === null) return '0';
  
  try {
    // Convert to BigInt if needed
    let bigIntValue: bigint;
    
    if (typeof value === 'bigint') {
      bigIntValue = value;
    } else if (typeof value === 'string') {
      // Handle scientific notation strings
      if (value.includes('e') || value.includes('E')) {
        const num = Number(value);
        if (isNaN(num)) return '0';
        bigIntValue = BigInt(Math.floor(num));
      } else {
        bigIntValue = BigInt(value);
      }
    } else if (typeof value === 'number') {
      // Handle scientific notation numbers
      bigIntValue = BigInt(Math.floor(value));
    } else {
      return '0';
    }
    
    // Convert from wei to human-readable
    const formatted = formatUnits(bigIntValue, decimals);
    
    // Parse and limit decimal places
    const num = parseFloat(formatted);
    
    if (isNaN(num)) return '0';
    
    // Format with thousand separators
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: maxDecimals
    });
  } catch (error) {
    console.error('Error formatting token amount:', error, value);
    return '0';
  }
}

/**
 * Format STT (Somnia Test Token) amount
 * @param value - Value in wei
 * @param maxDecimals - Maximum decimal places (default 2)
 * @returns Formatted string with "STT" suffix (e.g., "1,234.56 STT")
 */
export function formatSTT(
  value: bigint | string | number | undefined | null,
  maxDecimals: number = 2
): string {
  return `${formatTokenAmount(value, 18, maxDecimals)} STT`;
}

/**
 * Format BITR (BitRedict Token) amount
 * @param value - Value in wei
 * @param maxDecimals - Maximum decimal places (default 2)
 * @returns Formatted string with "BITR" suffix (e.g., "1,234.56 BITR")
 */
export function formatBITR(
  value: bigint | string | number | undefined | null,
  maxDecimals: number = 2
): string {
  return `${formatTokenAmount(value, 18, maxDecimals)} BITR`;
}

/**
 * Format compact number with K, M, B suffixes
 * @param value - Number to format
 * @returns Compact string (e.g., "1.2K", "5.4M", "2.1B")
 */
export function formatCompactNumber(value: number | string | undefined | null): string {
  if (value === undefined || value === null) return '0';
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '0';
  
  if (num < 1000) {
    return num.toFixed(0);
  } else if (num < 1000000) {
    return `${(num / 1000).toFixed(1)}K`;
  } else if (num < 1000000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else {
    return `${(num / 1000000000).toFixed(1)}B`;
  }
}

/**
 * Format percentage
 * @param value - Percentage value (0-100)
 * @param decimals - Decimal places (default 1)
 * @returns Formatted string with "%" suffix (e.g., "45.2%")
 */
export function formatPercentage(
  value: number | string | undefined | null,
  decimals: number = 1
): string {
  if (value === undefined || value === null) return '0%';
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '0%';
  
  return `${num.toFixed(decimals)}%`;
}

/**
 * Format win rate percentage
 * @param wins - Number of wins
 * @param total - Total number of bets
 * @param decimals - Decimal places (default 1)
 * @returns Formatted win rate string (e.g., "65.5%")
 */
export function formatWinRate(
  wins: number,
  total: number,
  decimals: number = 1
): string {
  if (!total || total === 0) return '0%';
  return formatPercentage((wins / total) * 100, decimals);
}

/**
 * Format profit/loss with sign
 * @param value - P&L value
 * @param token - Token symbol (default "STT")
 * @returns Formatted string with sign (e.g., "+1,234.56 STT", "-56.78 STT")
 */
export function formatProfitLoss(
  value: bigint | string | number | undefined | null,
  token: string = 'STT'
): string {
  if (value === undefined || value === null) return `0 ${token}`;
  
  const formatted = formatTokenAmount(value, 18, 2);
  const num = parseFloat(formatted.replace(/,/g, ''));
  
  if (isNaN(num)) return `0 ${token}`;
  
  const sign = num > 0 ? '+' : '';
  return `${sign}${formatted} ${token}`;
}

/**
 * Format date to relative time (e.g., "2 hours ago", "3 days ago")
 * @param date - Date string or Date object
 * @returns Relative time string
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  // ✅ CRITICAL FIX: Handle null/undefined/invalid dates gracefully
  if (!date) return 'Just now';
  
  try {
    const now = new Date();
    const then = typeof date === 'string' ? new Date(date) : date;
    
    // ✅ Validate that then is a valid Date object
    if (!(then instanceof Date) || isNaN(then.getTime())) {
      console.warn('Invalid date passed to formatRelativeTime:', date);
      return 'Just now';
    }
    
    const diffMs = now.getTime() - then.getTime();
    
    // ✅ Handle negative differences (future dates)
    if (diffMs < 0) return 'Just now';
    
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);
    
    if (years > 0) return `${years}y ago`;
    if (months > 0) return `${months}mo ago`;
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  } catch (error) {
    console.error('Error formatting relative time:', error, date);
    return 'Just now';
  }
}

/**
 * Format date to short format (e.g., "Jan 15, 2025")
 * @param date - Date string or Date object
 * @returns Short date string
 */
export function formatShortDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

/**
 * Safely parse BigInt from various inputs
 * @param value - Value to parse
 * @returns BigInt or 0n if parsing fails
 */
export function safeParseBigInt(value: any): bigint {
  if (typeof value === 'bigint') return value;
  
  try {
    if (typeof value === 'string') {
      // Handle scientific notation
      if (value.includes('e') || value.includes('E')) {
        const num = Number(value);
        return BigInt(Math.floor(num));
      }
      return BigInt(value);
    }
    
    if (typeof value === 'number') {
      return BigInt(Math.floor(value));
    }
    
    return 0n;
  } catch {
    return 0n;
  }
}

/**
 * Format address to short format (e.g., "0x1234...5678")
 * @param address - Ethereum address
 * @param startChars - Number of characters to show at start (default 6)
 * @param endChars - Number of characters to show at end (default 4)
 * @returns Short address string
 */
export function formatAddress(
  address: string | undefined | null,
  startChars: number = 6,
  endChars: number = 4
): string {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}


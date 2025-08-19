import { formatUnits } from 'viem';

/**
 * Formats a bigint amount to a human-readable string with appropriate decimal places
 * Removes trailing zeros and unnecessary decimal places
 */
export const formatTokenAmount = (amount?: bigint, decimals: number = 18): string => {
  if (!amount) return '0';
  
  const formatted = formatUnits(amount, decimals);
  const num = parseFloat(formatted);
  
  // If it's a whole number, don't show decimals
  if (Number.isInteger(num)) {
    return num.toString();
  }
  
  // Remove trailing zeros
  return num.toString().replace(/\.?0+$/, '');
};

/**
 * Formats a number to a specific number of decimal places, removing trailing zeros
 */
export const formatNumber = (value: number, maxDecimals: number = 2): string => {
  if (Number.isInteger(value)) {
    return value.toString();
  }
  
  return value.toFixed(maxDecimals).replace(/\.?0+$/, '');
};

/**
 * Formats a percentage with appropriate decimal places
 */
export const formatPercentage = (value: number, maxDecimals: number = 1): string => {
  return formatNumber(value, maxDecimals) + '%';
};

/**
 * Formats currency amounts with appropriate decimal places
 */
export const formatCurrency = (value: number, symbol: string = 'BITR', maxDecimals: number = 2): string => {
  return `${formatNumber(value, maxDecimals)} ${symbol}`;
};

/**
 * Formats token amounts for rewards display with exactly 2 decimal places
 */
export const formatRewardAmount = (amount?: bigint, decimals: number = 18): string => {
  if (!amount) return '0.00';
  
  const formatted = formatUnits(amount, decimals);
  const num = parseFloat(formatted);
  
  // Always show exactly 2 decimal places for rewards
  return num.toFixed(2);
};

/**
 * Safely converts a bigint startTime to a Date object with validation
 * @param startTime - The startTime value (bigint or number)
 * @param fallbackToNow - Whether to fallback to current time if invalid (default: true)
 * @returns A valid Date object or null if invalid and fallbackToNow is false
 */
export function safeStartTimeToDate(startTime: bigint | number, fallbackToNow: boolean = true): Date | null {
  const startTimeNumber = Number(startTime);
  const isValidTime = startTimeNumber > 0 && !isNaN(startTimeNumber);
  
  if (isValidTime) {
    return new Date(startTimeNumber * 1000);
  }
  
  return fallbackToNow ? new Date() : null;
}

/**
 * Safely converts a bigint startTime to an ISO string with validation
 * @param startTime - The startTime value (bigint or number)
 * @param fallbackToNow - Whether to fallback to current time if invalid (default: true)
 * @returns A valid ISO string or fallback string
 */
export function safeStartTimeToISOString(startTime: bigint | number, fallbackToNow: boolean = true): string {
  const date = safeStartTimeToDate(startTime, fallbackToNow);
  return date ? date.toISOString() : (fallbackToNow ? new Date().toISOString() : 'Invalid Time');
}

/**
 * Safely converts a bigint startTime to a locale string with validation
 * @param startTime - The startTime value (bigint or number)
 * @param fallbackText - Text to show if time is invalid (default: 'Time TBD')
 * @returns A valid locale string or fallback text
 */
export function safeStartTimeToLocaleString(startTime: bigint | number, fallbackText: string = 'Time TBD'): string {
  const date = safeStartTimeToDate(startTime, false);
  return date ? date.toLocaleString() : fallbackText;
}

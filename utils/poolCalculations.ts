/**
 * Pool Calculation Utilities
 * 
 * Standardized calculations for pool size, fill percentage, and betting limits
 * based on the BitredictPoolCore contract formula.
 */

export interface PoolCalculationInputs {
  creatorStake: string | number; // In wei or formatted number
  totalBettorStake: string | number; // In wei or formatted number
  odds: number; // e.g., 1.65
  isWei?: boolean; // Whether inputs are in wei format
}

export interface PoolCalculationResults {
  maxBettorStake: number;
  fillPercentage: number;
  remainingCapacity: number;
  isPoolFull: boolean;
}

/**
 * Calculate maximum bettor stake using contract formula
 * Formula: (creatorStake * 100) / (odds - 100)
 * 
 * @param creatorStake - Creator's stake amount
 * @param odds - Pool odds (e.g., 1.65)
 * @param isWei - Whether creatorStake is in wei format
 * @returns Maximum bettor stake in same units as creatorStake
 */
export function calculateMaxBettorStake(
  creatorStake: string | number, 
  odds: number, 
  isWei: boolean = true
): number {
  // Convert wei to readable format if needed
  const stakeAmount = isWei ? parseFloat(creatorStake.toString()) / 1e18 : parseFloat(creatorStake.toString());
  
  // Convert odds to contract format (1.65 -> 165)
  const contractOdds = Math.round(odds * 100);
  
  // Apply contract formula: (creatorStake * 100) / (odds - 100)
  const maxBettorStake = (stakeAmount * 100) / (contractOdds - 100);
  
  return maxBettorStake;
}

/**
 * Calculate pool fill percentage
 * 
 * @param inputs - Pool calculation inputs
 * @returns Pool calculation results
 */
export function calculatePoolFill(inputs: PoolCalculationInputs): PoolCalculationResults {
  const { creatorStake, totalBettorStake, odds, isWei = true } = inputs;
  
  // Convert wei to readable format if needed
  const stakeAmount = isWei ? parseFloat(creatorStake.toString()) / 1e18 : parseFloat(creatorStake.toString());
  const bettorAmount = isWei ? parseFloat(totalBettorStake.toString()) / 1e18 : parseFloat(totalBettorStake.toString());
  
  // Calculate maximum bettor stake
  const maxBettorStake = calculateMaxBettorStake(stakeAmount, odds, false);
  
  // Calculate fill percentage
  const fillPercentage = maxBettorStake > 0 ? Math.min((bettorAmount / maxBettorStake) * 100, 100) : 0;
  
  // Calculate remaining capacity
  const remainingCapacity = Math.max(0, maxBettorStake - bettorAmount);
  
  // Check if pool is full
  const isPoolFull = fillPercentage >= 100;
  
  return {
    maxBettorStake,
    fillPercentage,
    remainingCapacity,
    isPoolFull
  };
}

/**
 * Calculate potential winnings for a bet
 * 
 * @param betAmount - Amount being bet
 * @param odds - Pool odds
 * @param betSide - 'yes' for challenging creator, 'no' for supporting
 * @returns Potential winnings
 */
export function calculatePotentialWinnings(
  betAmount: number, 
  odds: number, 
  betSide: 'yes' | 'no'
): number {
  if (betSide === 'yes') {
    // Challenging creator: win odds * bet amount
    return betAmount * odds;
  } else {
    // Supporting creator: simplified calculation for liquidity
    return betAmount + (betAmount * 0.1); // 10% return for liquidity
  }
}

/**
 * Calculate profit from a bet
 * 
 * @param betAmount - Amount being bet
 * @param odds - Pool odds
 * @param betSide - 'yes' for challenging creator, 'no' for supporting
 * @returns Profit amount
 */
export function calculateProfit(
  betAmount: number, 
  odds: number, 
  betSide: 'yes' | 'no'
): number {
  const potentialWinnings = calculatePotentialWinnings(betAmount, odds, betSide);
  return potentialWinnings - betAmount;
}

/**
 * Example calculation for your scenario:
 * - Creator stake: 600 BITR
 * - Odds: 1.65
 * - Max bettor stake: (600 * 100) / (165 - 100) = 60,000 / 65 = 923.08 BITR
 */
export function getExampleCalculation() {
  const creatorStake = 600; // BITR
  const odds = 1.65;
  const maxBettorStake = calculateMaxBettorStake(creatorStake, odds, false);
  
  return {
    creatorStake,
    odds,
    maxBettorStake,
    explanation: `With ${creatorStake} BITR creator stake and ${odds}x odds, bettors can stake up to ${maxBettorStake.toFixed(2)} BITR`
  };
}

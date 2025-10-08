/**
 * Contract Data Mapping Service
 * Maps contract enums and hashes to readable values
 */

// Contract MarketType enum mapping (from BitredictPoolCore.sol)
export const MARKET_TYPE_ENUM = {
  0: 'MONEYLINE',
  1: 'OVER_UNDER', 
  2: 'BOTH_TEAMS_SCORE',
  3: 'HALF_TIME',
  4: 'DOUBLE_CHANCE',
  5: 'CORRECT_SCORE',
  6: 'FIRST_GOAL',
  7: 'CUSTOM'
} as const;

// Reverse mapping for string to enum
export const MARKET_TYPE_STRING_TO_ENUM = {
  'MONEYLINE': 0,
  'OVER_UNDER': 1,
  'BOTH_TEAMS_SCORE': 2,
  'HALF_TIME': 3,
  'DOUBLE_CHANCE': 4,
  'CORRECT_SCORE': 5,
  'FIRST_GOAL': 6,
  'CUSTOM': 7
} as const;

// User-friendly market type labels
export const MARKET_TYPE_LABELS = {
  0: '1X2',
  1: 'Over/Under',
  2: 'Both Teams Score',
  3: 'Half Time',
  4: 'Double Chance',
  5: 'Correct Score',
  6: 'First Goal',
  7: 'Custom'
} as const;

// Contract OracleType enum mapping
export const ORACLE_TYPE_ENUM = {
  0: 'GUIDED',
  1: 'OPEN'
} as const;

/**
 * Map numeric market type to string
 */
export function getMarketTypeString(marketType: number): string {
  return MARKET_TYPE_ENUM[marketType as keyof typeof MARKET_TYPE_ENUM] || 'MONEYLINE';
}

/**
 * Map numeric market type to user-friendly label
 */
export function getMarketTypeLabel(marketType: number): string {
  return MARKET_TYPE_LABELS[marketType as keyof typeof MARKET_TYPE_LABELS] || '1X2';
}

/**
 * Determine category from contract data
 * This is the key fix for category detection
 */
export function determineCategoryFromContractData(rawPool: any): string {
  console.log('🔍 Determining category from contract data:', {
    league: rawPool.league,
    category: rawPool.category,
    homeTeam: rawPool.homeTeam,
    awayTeam: rawPool.awayTeam,
    marketType: rawPool.marketType,
    oracleType: rawPool.oracleType
  });

  // Method 1: Check if it's a crypto pool based on market type and oracle
  if (rawPool.marketType === 7 && rawPool.oracleType === 0) { // CUSTOM + GUIDED
    console.log('🪙 Detected crypto pool (CUSTOM + GUIDED)');
    return 'cryptocurrency';
  }

  // Method 2: Check league/category bytes32 values
  const leagueBytes = rawPool.league?.toString() || '';
  const categoryBytes = rawPool.category?.toString() || '';
  
  // Check for crypto-related hashes (these would be the actual keccak256 hashes)
  const cryptoIndicators = ['crypto', 'bitcoin', 'ethereum', 'btc', 'eth'];
  const isCryptoByBytes = cryptoIndicators.some(indicator => 
    leagueBytes.toLowerCase().includes(indicator) || 
    categoryBytes.toLowerCase().includes(indicator)
  );
  
  if (isCryptoByBytes) {
    console.log('🪙 Detected crypto pool (bytes32 content)');
    return 'cryptocurrency';
  }

  // Method 3: Check team names for crypto symbols
  const homeTeamBytes = rawPool.homeTeam?.toString() || '';
  const awayTeamBytes = rawPool.awayTeam?.toString() || '';
  const cryptoSymbols = ['BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'MATIC', 'AVAX', 'DOT', 'LINK', 'UNI'];
  
  const isCryptoByTeams = cryptoSymbols.some(symbol => 
    homeTeamBytes.includes(symbol) || awayTeamBytes.includes(symbol)
  );
  
  if (isCryptoByTeams) {
    console.log('🪙 Detected crypto pool (team symbols)');
    return 'cryptocurrency';
  }

  // Method 4: Football/Sports detection
  // If it's not crypto and uses standard market types (0-6), it's likely football
  if (rawPool.marketType >= 0 && rawPool.marketType <= 6) {
    console.log('⚽ Detected football pool (standard market types)');
    return 'football';
  }

  // Default fallback
  console.log('🏆 Defaulting to sports category');
  return 'sports';
}

/**
 * Enhanced pool status detection using contract flags
 */
export function getPoolStatusFromContract(rawPool: any): {
  settled: boolean;
  creatorSideWon?: boolean;
  isActive: boolean;
  isFilled: boolean;
  canBet: boolean;
} {
  const now = Math.floor(Date.now() / 1000);
  const flags = rawPool.flags || 0;
  
  // Bit 0: settled flag
  const settled = (flags & 1) !== 0;
  
  // Bit 1: creatorSideWon flag (only valid if settled)
  const creatorSideWon = settled ? (flags & 2) !== 0 : undefined;
  
  // Check if pool is filled (total stakes comparison)
  const creatorStake = BigInt(rawPool.creatorStake || 0);
  const totalBettorStake = BigInt(rawPool.totalBettorStake || 0);
  const maxBettorStake = BigInt(rawPool.maxBettorStake || 0);
  
  const isFilled = maxBettorStake > 0 && totalBettorStake >= maxBettorStake;
  
  // Check if betting is still allowed
  const bettingEndTime = rawPool.bettingEndTime || 0;
  const eventStartTime = rawPool.eventStartTime || 0;
  
  const canBet = !settled && now < bettingEndTime && now < eventStartTime && !isFilled;
  const isActive = !settled && now < eventStartTime;
  
  console.log('📊 Pool status analysis:', {
    poolId: rawPool.poolId,
    flags,
    settled,
    creatorSideWon,
    isFilled,
    canBet,
    isActive,
    now,
    bettingEndTime,
    eventStartTime,
    creatorStake: creatorStake.toString(),
    totalBettorStake: totalBettorStake.toString(),
    maxBettorStake: maxBettorStake.toString()
  });
  
  return {
    settled,
    creatorSideWon,
    isActive,
    isFilled,
    canBet
  };
}

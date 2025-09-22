// Contract enums and types
export enum OracleType {
  GUIDED = 0,
  OPEN = 1,
}

export enum MarketType {
  MONEYLINE = 0,      // 1X2
  OVER_UNDER = 1,     // Over/Under goals
  BOTH_TEAMS_SCORE = 2, // BTTS
  HALF_TIME = 3,      // HT result
  DOUBLE_CHANCE = 4,  // 1X, X2, 12
  CORRECT_SCORE = 5,  // Exact score
  FIRST_GOAL = 6,     // First goal scorer
  CUSTOM = 7          // Arbitrary YES/NO
}

export enum BoostTier {
  NONE = 0,
  BRONZE = 1,
  SILVER = 2,
  GOLD = 3,
  PLATINUM = 4,
}

// Market type labels for UI
export const MARKET_TYPE_LABELS = {
  [MarketType.MONEYLINE]: '1X2 (Moneyline)',
  [MarketType.OVER_UNDER]: 'Over/Under Goals',
  [MarketType.BOTH_TEAMS_SCORE]: 'Both Teams to Score',
  [MarketType.HALF_TIME]: 'Half Time Result',
  [MarketType.DOUBLE_CHANCE]: 'Double Chance',
  [MarketType.CORRECT_SCORE]: 'Correct Score',
  [MarketType.FIRST_GOAL]: 'First Goal Scorer',
  [MarketType.CUSTOM]: 'Custom Market',
} as const;

// Market type configuration
export const MARKET_TYPE_CONFIG = {
  [MarketType.MONEYLINE]: {
    label: '1X2 (Moneyline)',
    placeholder: 'e.g., Home team wins, Away team wins, Draw',
    description: 'Predict the match result: Home win, Away win, or Draw',
    requiresTeams: true,
    commonOutcomes: ['Home Win', 'Away Win', 'Draw'],
    oddsField: 'home_odds', // Field name in API response for odds
    // REMOVED: defaultOdds - creators should set their own odds
  },
  [MarketType.OVER_UNDER]: {
    label: 'Over/Under Goals',
    placeholder: 'e.g., Over 2.5 goals, Under 1.5 goals',
    description: 'Predict total goals scored in the match',
    requiresTeams: true,
    commonOutcomes: ['Over 2.5', 'Under 2.5', 'Over 1.5', 'Under 1.5'],
    oddsField: 'over_25_odds', // Field name in API response for odds
    // REMOVED: defaultOdds - creators should set their own odds
  },
  [MarketType.BOTH_TEAMS_SCORE]: {
    label: 'Both Teams to Score',
    placeholder: 'e.g., Both teams score, Only one team scores',
    description: 'Predict if both teams will score at least one goal',
    requiresTeams: true,
    commonOutcomes: ['Yes', 'No'],
    oddsField: 'btts_yes_odds', // Field name in API response for odds
    // REMOVED: defaultOdds - creators should set their own odds
  },
  [MarketType.HALF_TIME]: {
    label: 'Half Time Result',
    placeholder: 'e.g., Home team leads at HT, Away team leads at HT',
    description: 'Predict the result at half-time',
    requiresTeams: true,
    commonOutcomes: ['Home HT Win', 'Away HT Win', 'HT Draw'],
    oddsField: 'ht_home_odds', // Field name in API response for odds
    // REMOVED: defaultOdds - creators should set their own odds
  },
  [MarketType.DOUBLE_CHANCE]: {
    label: 'Double Chance',
    placeholder: 'e.g., Home or Draw, Away or Draw, Home or Away',
    description: 'Predict two possible outcomes combined',
    requiresTeams: true,
    commonOutcomes: ['1X (Home or Draw)', 'X2 (Draw or Away)', '12 (Home or Away)'],
    oddsField: 'home_odds', // Field name in API response for odds
    // REMOVED: defaultOdds - creators should set their own odds
  },
  [MarketType.CORRECT_SCORE]: {
    label: 'Correct Score',
    placeholder: 'e.g., 2-1, 1-0, 3-2',
    description: 'Predict the exact final score',
    requiresTeams: true,
    commonOutcomes: ['1-0', '2-1', '2-0', '1-1', '3-1'],
    oddsField: null, // No specific odds field for correct score
    // REMOVED: defaultOdds - creators should set their own odds
  },
  [MarketType.FIRST_GOAL]: {
    label: 'First Goal Scorer',
    placeholder: 'e.g., Player name scores first, No goal scorer',
    description: 'Predict who scores the first goal',
    requiresTeams: true,
    commonOutcomes: ['Player Name', 'No Goal Scorer'],
    oddsField: null, // No specific odds field for first goal scorer
    // REMOVED: defaultOdds - creators should set their own odds
  },
  [MarketType.CUSTOM]: {
    label: 'Custom Market',
    placeholder: 'e.g., Any custom prediction',
    description: 'Create your own prediction market',
    requiresTeams: false,
    commonOutcomes: ['Yes', 'No'],
    oddsField: null, // No specific odds field for custom markets
    // REMOVED: defaultOdds - creators should set their own odds
  },
} as const;

// Oracle type labels for UI
export const ORACLE_TYPE_LABELS = {
  [OracleType.GUIDED]: 'Guided Oracle',
  [OracleType.OPEN]: 'Open Oracle',
} as const;

// Boost tier labels and costs
export const BOOST_TIER_CONFIG = {
  [BoostTier.NONE]: { label: 'No Boost', cost: 0, costLabel: '0 STT' },
  [BoostTier.BRONZE]: { label: 'Bronze Boost', cost: 2e18, costLabel: '2 STT' },
  [BoostTier.SILVER]: { label: 'Silver Boost', cost: 3e18, costLabel: '3 STT' },
  [BoostTier.GOLD]: { label: 'Gold Boost', cost: 5e18, costLabel: '5 STT' },
} as const;

// Pool creation data interface
export interface PoolCreationData {
  // Basic pool data
  predictedOutcome: string;
  odds: bigint;
  creatorStake: bigint;
  eventStartTime: bigint;
  eventEndTime: bigint;
  league: string;
  category: string;
  region: string;
  isPrivate: boolean;
  maxBetPerUser: bigint;
  useBitr: boolean;
  oracleType: OracleType;
  marketId: string;
  marketType: MarketType;
  
  // Additional fields for enhanced pools
  homeTeam?: string;
  awayTeam?: string;
  title?: string;
  
  // Boost data
  enableBoost?: boolean;
  boostTier?: BoostTier;
}

// Form data interface for UI
export interface PoolFormData {
  predictedOutcome: string;
  odds: string;
  creatorStake: string;
  eventStartTime: string;
  eventEndTime: string;
  league: string;
  category: 'football' | 'crypto' | 'other';
  region: string;
  isPrivate: boolean;
  maxBetPerUser: string;
  useBitr: boolean;
  oracleType: OracleType;
  marketId: string;
  marketType: MarketType;
  homeTeam?: string;
  awayTeam?: string;
  title?: string;
  enableBoost?: boolean;
  boostTier?: BoostTier;
}

// Validation helpers
export function validatePoolData(data: PoolFormData): string[] {
  const errors: string[] = [];
  
  // Required fields
  if (!data.predictedOutcome.trim()) {
    errors.push('Predicted outcome is required');
  }
  
  if (!data.odds || parseFloat(data.odds) <= 1.01) {
    errors.push('Valid odds are required (minimum 1.01)');
  }
  
  if (!data.eventStartTime) {
    errors.push('Event start time is required');
  }
  
  if (!data.eventEndTime) {
    errors.push('Event end time is required');
  }
  
  if (!data.league) {
    errors.push('League is required');
  }
  
  // Time validation
  if (data.eventStartTime && data.eventEndTime) {
    const startTime = new Date(data.eventStartTime).getTime();
    const endTime = new Date(data.eventEndTime).getTime();
    const now = Date.now();
    const oneYearFromNow = now + (365 * 24 * 60 * 60 * 1000);
    
    if (startTime <= now) {
      errors.push('Event start time must be in the future');
    }
    
    if (startTime >= oneYearFromNow) {
      errors.push('Event start time must be within 1 year');
    }
    
    if (endTime <= startTime) {
      errors.push('Event end time must be after start time');
    }
  }
  
  // Football-specific validation
  if (data.category === 'football') {
    if (!data.homeTeam?.trim()) {
      errors.push('Home team is required for football markets');
    }
    if (!data.awayTeam?.trim()) {
      errors.push('Away team is required for football markets');
    }
  }
  
  // Stake validation
  const minStake = data.useBitr ? 1000 : 5;
  if (!data.creatorStake || parseFloat(data.creatorStake) < minStake) {
    errors.push(`Minimum stake is ${minStake} ${data.useBitr ? 'BITR' : 'STT'}`);
  }
  
  return errors;
}

// Convert form data to contract data
export function convertFormToContractData(formData: PoolFormData): PoolCreationData {
  return {
    predictedOutcome: formData.predictedOutcome,
    odds: BigInt(Math.floor(parseFloat(formData.odds) * 100)), // Convert to basis points
    creatorStake: BigInt(parseFloat(formData.creatorStake) * 1e18),
    eventStartTime: BigInt(Math.floor(new Date(formData.eventStartTime).getTime() / 1000)),
    eventEndTime: BigInt(Math.floor(new Date(formData.eventEndTime).getTime() / 1000)),
    league: formData.league,
    category: formData.category,
    region: formData.region,
    isPrivate: formData.isPrivate,
    maxBetPerUser: formData.maxBetPerUser ? BigInt(parseFloat(formData.maxBetPerUser) * 1e18) : BigInt(0),
    useBitr: formData.useBitr,
    oracleType: formData.oracleType,
    marketId: formData.marketId,
    marketType: formData.marketType,
    homeTeam: formData.homeTeam,
    awayTeam: formData.awayTeam,
    title: formData.title,
    enableBoost: formData.enableBoost,
    boostTier: formData.boostTier,
  };
}

// Generate market ID for football matches
export function generateFootballMarketId(homeTeam: string, awayTeam: string, league: string): string {
  const matchString = `${homeTeam} vs ${awayTeam} - ${league}`;
  // Simple hash function for market ID
  let hash = 0;
  for (let i = 0; i < matchString.length; i++) {
    const char = matchString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `0x${Math.abs(hash).toString(16).padStart(64, '0')}`;
}

// Generate title for football matches
export function generateFootballTitle(homeTeam: string, awayTeam: string, marketType: MarketType): string {
  const marketTypeLabel = MARKET_TYPE_LABELS[marketType];
  return `${homeTeam} vs ${awayTeam} - ${marketTypeLabel}`;
}

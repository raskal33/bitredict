// Contract enums and types
export enum OracleType {
  GUIDED = 0,
  OPEN = 1,
}

export enum MarketType {
  MONEYLINE = 0,        // Winner/Outcome (1X2, Win/Lose, Above/Below)
  OVER_UNDER = 1,       // Total points/goals/runs
  SPREAD = 2,           // Point spread (basketball, american football)
  PROPOSITION = 3,      // Prop bets (first scorer, BTTS, specific events)
  CORRECT_SCORE = 4,    // Exact score/result
  CUSTOM = 5            // Arbitrary YES/NO predictions
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
  [MarketType.OVER_UNDER]: 'Over/Under',
  [MarketType.SPREAD]: 'Point Spread',
  [MarketType.PROPOSITION]: 'Proposition',
  [MarketType.CORRECT_SCORE]: 'Correct Score',
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
    oddsField: 'home_odds',
  },
  [MarketType.OVER_UNDER]: {
    label: 'Over/Under',
    placeholder: 'e.g., Over 2.5 goals, Under 2.5 goals',
    description: 'Predict total goals/points scored in the match',
    requiresTeams: true,
    commonOutcomes: ['Over 2.5', 'Under 2.5', 'Over 1.5', 'Under 1.5'],
    oddsField: 'over_25_odds',
  },
  [MarketType.SPREAD]: {
    label: 'Point Spread',
    placeholder: 'e.g., Home -5.5, Away +5.5',
    description: 'Predict the winning margin (basketball, american football)',
    requiresTeams: true,
    commonOutcomes: ['Home -5.5', 'Away +5.5', 'Home -3.5', 'Away +3.5'],
    oddsField: null,
  },
  [MarketType.PROPOSITION]: {
    label: 'Proposition Bet',
    placeholder: 'e.g., Both teams score, First goal scorer, Total cards',
    description: 'Predict specific events or occurrences during the match',
    requiresTeams: true,
    commonOutcomes: ['Yes', 'No', 'Over', 'Under'],
    oddsField: 'btts_yes_odds', // Default to BTTS odds
  },
  [MarketType.CORRECT_SCORE]: {
    label: 'Correct Score',
    placeholder: 'e.g., 2-1, 1-0, 3-2',
    description: 'Predict the exact final score',
    requiresTeams: true,
    commonOutcomes: ['1-0', '2-1', '2-0', '1-1', '3-1'],
    oddsField: null,
  },
  [MarketType.CUSTOM]: {
    label: 'Custom Market',
    placeholder: 'e.g., Any custom prediction',
    description: 'Create your own prediction market',
    requiresTeams: false,
    commonOutcomes: ['Yes', 'No'],
    oddsField: null,
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

// Generate market ID for football matches using keccak256
export function generateFootballMarketId(homeTeam: string, awayTeam: string, league: string): string {
  // Use a deterministic string format that matches the backend
  const matchString = `${homeTeam}_${awayTeam}_${league}`;
  
  // For now, return a simple format that can be converted to keccak256 in the hook
  // The actual keccak256 conversion will happen in the contract interaction
  return matchString;
}

// Generate title for football matches
export function generateFootballTitle(homeTeam: string, awayTeam: string, marketType: MarketType): string {
  const marketTypeLabel = MARKET_TYPE_LABELS[marketType];
  return `${homeTeam} vs ${awayTeam} - ${marketTypeLabel}`;
}

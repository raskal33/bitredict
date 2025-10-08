/**
 * Utility functions for decoding contract data
 */
import { decodeTeamHash, decodeLeagueHash, decodeMarketId } from './hashDecoder';
import { decodeBytes32String } from './bytes32Decoder';
import { PoolMetadataService } from '../services/poolMetadataService';
import { determineCategoryFromContractData, getPoolStatusFromContract } from '../services/contractDataMapping';
import { ethers } from 'ethers';

/**
 * Decode bytes32 to string, removing null bytes
 * NOTE: These are hashed values from the contract, not readable text
 */
export function bytes32ToString(bytes32: string): string {
  if (!bytes32 || bytes32 === '0x' || bytes32 === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    return '';
  }
  
  // These are hashed values, not readable text
  // Return a shortened hash for display purposes
  return bytes32.slice(0, 10) + '...';
}

/**
 * Determine category from pool data
 */
export function getCategoryFromHash(categoryHash: string, rawPool?: any): string | null {
  if (!categoryHash || categoryHash === '0x' || categoryHash === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    return null;
  }

  // Try to determine category from other pool data
  if (rawPool) {
    // Check if it's a crypto pool based on league or market type
    const league = rawPool.league ? bytes32ToString(rawPool.league) : '';
    const marketType = rawPool.marketType;
    
    // If league contains crypto-related terms
    if (league.toLowerCase().includes('crypto') || league.toLowerCase().includes('bitcoin') || league.toLowerCase().includes('ethereum')) {
      return 'Cryptocurrency';
    }
    
    // If market type suggests crypto (custom markets are often crypto)
    if (marketType === 7) { // CUSTOM market type is often used for crypto
      return 'Cryptocurrency';
    }
    
    // If league contains football/sports terms
    if (league.toLowerCase().includes('premier') || league.toLowerCase().includes('league') || league.toLowerCase().includes('championship')) {
      return 'Football';
    }
    
    // If league contains basketball terms
    if (league.toLowerCase().includes('nba') || league.toLowerCase().includes('basketball')) {
      return 'Basketball';
    }
  }

  // Fallback to Sports for unknown categories
  return 'Sports';
}

/**
 * Decode hash back to original prediction value
 * Tests common prediction values against the hash
 */
export function decodeHash(hash: string): string | null {
  console.log('🔍 decodeHash called with:', hash);
  if (!hash || !hash.startsWith('0x')) {
    console.log('🔍 Invalid hash format');
    return null;
  }

  // Common prediction values to test
  const COMMON_SELECTIONS = [
    // Basic match results
    '1', '2', 'x', 'home', 'away', 'draw',
    'Home', 'Away', 'Draw', 'HOME', 'AWAY', 'DRAW',
    
    // Over/Under
    'over', 'under', 'o', 'u', 'Over', 'Under', 'OVER', 'UNDER',
    'over25', 'under25', 'over35', 'under35',
    'Over 2.5', 'Under 2.5', 'Over 3.5', 'Under 3.5',
    
    // Half-time
    'ht_1', 'ht_2', 'ht_x', 'ht_home', 'ht_away', 'ht_draw',
    'htHome', 'htAway', 'htDraw',
    
    // BTTS
    'btts', 'both teams', 'yes', 'no', 'y', 'n',
    'BTTS', 'Both Teams To Score', 'YES', 'NO',
    'bttsYes', 'bttsNo',
    
    // Numbers
    ...Array.from({ length: 11 }, (_, i) => i.toString()),
    
    // Decimals
    '0.5', '1.5', '2.5', '3.5', '4.5', '5.5',
    
    // Team-specific predictions (common patterns)
    'Liverpool wins', 'Galatasaray wins', 'Manchester City wins',
    'Real Madrid wins', 'Barcelona wins', 'Arsenal wins',
    'Liverpool will win', 'Galatasaray will win',
    'Liverpool win', 'Galatasaray win',
    
    // Generic patterns
    'wins', 'Wins', 'WINS', 'will win', 'Will Win'
  ];

  console.log('🔍 Testing hash against', COMMON_SELECTIONS.length, 'common selections');

  // Test each selection by hashing and comparing
  for (const selection of COMMON_SELECTIONS) {
    try {
      const testHash = ethers.keccak256(ethers.toUtf8Bytes(selection));
      if (testHash.toLowerCase() === hash.toLowerCase()) {
        console.log('🎯 Found match! Hash decodes to:', selection);
        return selection; // Found the original!
      }
    } catch (error) {
      // Continue to next selection
      continue;
    }
  }
  
  console.log('❌ No match found for hash:', hash);
  return null;
}

/**
 * Decode predictedOutcome bytes32 to readable string
 * This should be a readable string, not a hash
 */
export function decodePredictedOutcome(bytes32: string): string {
  console.log('🔍 Decoding predictedOutcome:', bytes32);
  
  if (!bytes32 || bytes32 === '0x' || bytes32 === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    console.log('🔍 Empty or zero predictedOutcome');
    return '';
  }
  
  // First, try to decode as hash (for legacy pools)
  console.log('🔍 Attempting hash decoding for:', bytes32);
  try {
    const hashDecoded = decodeHash(bytes32);
    if (hashDecoded) {
      console.log('🔍 Decoded predictedOutcome from hash:', hashDecoded);
      return hashDecoded;
    }
  } catch (error) {
    console.log('Failed to decode predictedOutcome as hash:', error);
  }
  
  // If hash decoding fails, try bytes32 string decoding
  try {
    const decoded = decodeBytes32String(bytes32);
    console.log('🔍 Decoded predictedOutcome:', decoded);
    if (decoded && decoded.length > 0) {
      return decoded;
    }
  } catch (error) {
    console.log('Failed to decode predictedOutcome as bytes32 string:', error);
  }
  
  // If all decoding fails, provide a meaningful fallback
  console.log('🔍 Using fallback predictedOutcome for hash:', bytes32);
  return `Prediction (${bytes32.slice(0, 8)}...)`;
}

/**
 * Decode pool flags to boolean values
 */
export function decodePoolFlags(flags: number, isSettled: boolean = false) {
  // UPDATED FLAG SYSTEM (createPool):
  // - bit 2: isPrivate
  // - bit 3: usesBitr  
  // - bit 0,1: reserved for settlement (settled, creatorSideWon)
  // - bit 4-7: reserved for future use
  //
  // SETTLEMENT FLAGS (added during settlement):
  // - bit 0: settled (overwrites reserved bit during settlement)
  // - bit 1: creatorSideWon (overwrites reserved bit during settlement)
  
  if (isSettled) {
    // Settlement flag system
    return {
      settled: (flags & 1) !== 0,           // bit 0: settled
      creatorSideWon: (flags & 2) !== 0,    // bit 1: creatorSideWon
      isPrivate: false,                     // Cannot determine after settlement
      usesBitr: false,                      // Cannot determine after settlement
      filledAbove60: (flags & 16) !== 0,   // bit 4: filledAbove60
    };
  } else {
    // Creation flag system (createPool) - UPDATED BIT POSITIONS
    return {
      settled: false,                       // Not settled yet
      creatorSideWon: false,               // Not settled yet
      isPrivate: (flags & 4) !== 0,       // bit 2: isPrivate (UPDATED)
      usesBitr: (flags & 8) !== 0,        // bit 3: usesBitr (UPDATED)
      filledAbove60: (flags & 16) !== 0,  // bit 4: filledAbove60
    };
  }
}

/**
 * Process raw pool data from contract
 */
export function processRawPoolData(rawPool: any) {
  // Enhanced pool status detection using contract flags
  const statusInfo = getPoolStatusFromContract(rawPool);
  
  // Detect if pool is settled by checking resultTimestamp
  const isSettled = rawPool.resultTimestamp && rawPool.resultTimestamp !== '0';
  const flags = decodePoolFlags(rawPool.flags || 0, isSettled);
  
  // Determine token type - if settled, flags are overwritten, so use stake analysis
  let usesBitr = flags.usesBitr;
  if (isSettled) {
    // For settled pools, determine token type by stake amount
    // BITR pools have minimum 1000e18, STT pools have minimum 5e18
    const stakeAmount = parseFloat(rawPool.creatorStake.toString()) / 1e18;
    usesBitr = stakeAmount >= 1000; // If stake >= 1000, likely BITR
  }
  
  // Check if the data is already decoded (strings) or needs decoding (hex)
  const isAlreadyDecoded = (value: any) => {
    return typeof value === 'string' && !value.startsWith('0x') && value.length < 64;
  };

  // Try to decode team names - check if already decoded first
  const decodedHomeTeam = isAlreadyDecoded(rawPool.homeTeam) 
    ? rawPool.homeTeam 
    : (decodeBytes32String(rawPool.homeTeam) || decodeTeamHash(rawPool.homeTeam));
  
  const decodedAwayTeam = isAlreadyDecoded(rawPool.awayTeam) 
    ? rawPool.awayTeam 
    : (decodeBytes32String(rawPool.awayTeam) || decodeTeamHash(rawPool.awayTeam));
  
  const decodedLeague = isAlreadyDecoded(rawPool.league) 
    ? rawPool.league 
    : (decodeBytes32String(rawPool.league) || decodeLeagueHash(rawPool.league));
  
  // Try to decode market ID to get match information
  const marketInfo = decodeMarketId(rawPool.marketId);
  
  // Use decoded names or fallback to market info or placeholders
  const homeTeam = decodedHomeTeam || marketInfo?.homeTeam || 'Team A';
  const awayTeam = decodedAwayTeam || marketInfo?.awayTeam || 'Team B';
  const league = decodedLeague || marketInfo?.league || 'Unknown League';
  
  // Enhanced category detection using the new mapping service
  const category = determineCategoryFromContractData(rawPool);
  
  // Generate readable titles
  const tokenSymbol = usesBitr ? 'BITR' : 'STT';
  const hasTeamNames = homeTeam !== 'Team A' && awayTeam !== 'Team B';
  const poolTitle = hasTeamNames 
    ? `${homeTeam} vs ${awayTeam} (${tokenSymbol})`
    : `Pool #${rawPool.poolId} (${tokenSymbol})`;
  
  console.log('🔍 Pool processing result:', {
    poolId: rawPool.poolId,
    category,
    marketType: rawPool.marketType,
    homeTeam,
    awayTeam,
    league,
    statusInfo
  });

  return {
    ...rawPool,
    // Use decoded or generated readable data
    title: poolTitle,
    homeTeam: homeTeam,
    awayTeam: awayTeam,
    league: league,
    category: category, // Use enhanced category detection
    region: bytes32ToString(rawPool.region),
    predictedOutcome: decodePredictedOutcome(rawPool.predictedOutcome),
    result: bytes32ToString(rawPool.result),
    marketId: bytes32ToString(rawPool.marketId),
    
    // Enhanced flags with status info
    settled: statusInfo.settled,
    creatorSideWon: statusInfo.creatorSideWon,
    isPrivate: flags.isPrivate,
    usesBitr: usesBitr, // Use corrected value
    filledAbove60: flags.filledAbove60,
    
    // Additional status information
    isActive: statusInfo.isActive,
    isFilled: statusInfo.isFilled,
    canBet: statusInfo.canBet,
    
    // Include market type and other contract data
    marketType: rawPool.marketType,
    oracleType: rawPool.oracleType,
  };
}

/**
 * Process raw pool data from contract with metadata enrichment (async version)
 */
export async function processRawPoolDataWithMetadata(rawPool: any) {
  // First do the basic processing
  const basicPool = processRawPoolData(rawPool);
  
  try {
    // Try to enrich with fixture metadata
    const metadata = await PoolMetadataService.enrichPoolData({
      homeTeam: rawPool.homeTeam,
      awayTeam: rawPool.awayTeam,
      league: rawPool.league,
      marketId: rawPool.marketId,
      eventStartTime: rawPool.eventStartTime
    });
    
    if (metadata) {
      // Use enriched data
      const tokenSymbol = basicPool.usesBitr ? 'BITR' : 'STT';
      const poolTitle = `${metadata.homeTeam} vs ${metadata.awayTeam} (${tokenSymbol})`;
      
      return {
        ...basicPool,
        title: poolTitle,
        homeTeam: metadata.homeTeam,
        awayTeam: metadata.awayTeam,
        league: metadata.league,
        matchDate: metadata.matchDate,
        venue: metadata.venue,
        homeTeamLogo: metadata.homeTeamLogo,
        awayTeamLogo: metadata.awayTeamLogo,
        leagueLogo: metadata.leagueLogo,
        fixtureId: metadata.fixtureId,
        // Add metadata flag
        hasMetadata: true
      };
    }
  } catch (error) {
    console.warn('Failed to enrich pool with metadata:', error);
  }
  
  // Return basic processed data if enrichment fails
  return {
    ...basicPool,
    hasMetadata: false
  };
}

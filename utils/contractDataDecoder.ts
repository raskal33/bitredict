/**
 * Utility functions for decoding contract data
 */
import { decodeTeamHash, decodeLeagueHash, decodeMarketId } from './hashDecoder';
import { decodeBytes32String } from './bytes32Decoder';
import { PoolMetadataService } from '../services/poolMetadataService';

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
  
  // Try to decode team names using proper bytes32 decoding first
  const decodedHomeTeam = decodeBytes32String(rawPool.homeTeam) || decodeTeamHash(rawPool.homeTeam);
  const decodedAwayTeam = decodeBytes32String(rawPool.awayTeam) || decodeTeamHash(rawPool.awayTeam);
  const decodedLeague = decodeBytes32String(rawPool.league) || decodeLeagueHash(rawPool.league);
  
  // Try to decode market ID to get match information
  const marketInfo = decodeMarketId(rawPool.marketId);
  
  // Use decoded names or fallback to market info or placeholders
  const homeTeam = decodedHomeTeam || marketInfo?.homeTeam || 'Team A';
  const awayTeam = decodedAwayTeam || marketInfo?.awayTeam || 'Team B';
  const league = decodedLeague || marketInfo?.league || 'Unknown League';
  
  // Generate readable titles
  const tokenSymbol = usesBitr ? 'BITR' : 'STT';
  const hasTeamNames = homeTeam !== 'Team A' && awayTeam !== 'Team B';
  const poolTitle = hasTeamNames 
    ? `${homeTeam} vs ${awayTeam} (${tokenSymbol})`
    : `Pool #${rawPool.poolId} (${tokenSymbol})`;
  
  return {
    ...rawPool,
    // Use decoded or generated readable data
    title: poolTitle,
    homeTeam: homeTeam,
    awayTeam: awayTeam,
    league: league,
    category: rawPool.category ? bytes32ToString(rawPool.category) : 'Sports',
    region: bytes32ToString(rawPool.region),
    predictedOutcome: bytes32ToString(rawPool.predictedOutcome),
    result: bytes32ToString(rawPool.result),
    marketId: bytes32ToString(rawPool.marketId),
    
    // Decode flags
    settled: flags.settled,
    creatorSideWon: flags.creatorSideWon,
    isPrivate: flags.isPrivate,
    usesBitr: usesBitr, // Use corrected value
    filledAbove60: flags.filledAbove60,
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

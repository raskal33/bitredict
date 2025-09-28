/**
 * Hash decoder for team names and other contract data
 */
import { keccak256, toBytes } from 'viem';

// Common team names that might be used
const COMMON_TEAMS = [
  // Premier League
  'Manchester United', 'Manchester City', 'Liverpool', 'Chelsea', 'Arsenal', 
  'Tottenham', 'Newcastle', 'Brighton', 'Aston Villa', 'West Ham',
  'Crystal Palace', 'Fulham', 'Wolves', 'Everton', 'Brentford',
  'Nottingham Forest', 'Luton Town', 'Burnley', 'Sheffield United', 'Bournemouth',
  
  // La Liga
  'Real Madrid', 'Barcelona', 'Atletico Madrid', 'Sevilla', 'Real Sociedad',
  'Real Betis', 'Villarreal', 'Valencia', 'Athletic Bilbao', 'Getafe',
  
  // Serie A
  'Juventus', 'Inter Milan', 'AC Milan', 'Napoli', 'Roma', 'Lazio',
  'Atalanta', 'Fiorentina', 'Bologna', 'Torino',
  
  // Bundesliga
  'Bayern Munich', 'Borussia Dortmund', 'RB Leipzig', 'Union Berlin',
  'SC Freiburg', 'Bayer Leverkusen', 'Eintracht Frankfurt', 'Wolfsburg',
  
  // Ligue 1
  'Paris Saint-Germain', 'PSG', 'Marseille', 'Monaco', 'Lyon', 'Nice',
  'Lille', 'Rennes', 'Strasbourg', 'Lens',
  
  // International
  'England', 'France', 'Germany', 'Spain', 'Italy', 'Portugal', 'Brazil',
  'Argentina', 'Netherlands', 'Belgium', 'Croatia', 'Morocco',
  
  // Generic/Test teams
  'Team A', 'Team B', 'Home Team', 'Away Team', 'Unknown Team'
];

// Common leagues
const COMMON_LEAGUES = [
  'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1',
  'Champions League', 'Europa League', 'World Cup', 'Euro Championship',
  'FA Cup', 'Copa del Rey', 'Coppa Italia', 'DFB-Pokal', 'Coupe de France'
];

// Pre-compute hashes for common teams and leagues
const TEAM_HASH_MAP = new Map<string, string>();
const LEAGUE_HASH_MAP = new Map<string, string>();

// Initialize hash maps
function initializeHashMaps() {
  // Hash all common teams
  COMMON_TEAMS.forEach(team => {
    try {
      const hash = keccak256(toBytes(team));
      TEAM_HASH_MAP.set(hash, team);
    } catch (error) {
      console.warn('Failed to hash team:', team, error);
    }
  });
  
  // Hash all common leagues
  COMMON_LEAGUES.forEach(league => {
    try {
      const hash = keccak256(toBytes(league));
      LEAGUE_HASH_MAP.set(hash, league);
    } catch (error) {
      console.warn('Failed to hash league:', league, error);
    }
  });
  
  // Also hash empty string (common case)
  try {
    const emptyHash = keccak256(toBytes(''));
    TEAM_HASH_MAP.set(emptyHash, '');
    LEAGUE_HASH_MAP.set(emptyHash, '');
  } catch (error) {
    console.warn('Failed to hash empty string:', error);
  }
}

// Initialize on module load
initializeHashMaps();

/**
 * Decode a team name hash to readable text
 */
export function decodeTeamHash(hash: string): string {
  if (!hash || hash === '0x' || hash === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    return '';
  }
  
  const decodedTeam = TEAM_HASH_MAP.get(hash);
  if (decodedTeam !== undefined) {
    return decodedTeam;
  }
  
  // If not found, return shortened hash
  return hash.slice(0, 10) + '...';
}

/**
 * Decode a league name hash to readable text
 */
export function decodeLeagueHash(hash: string): string {
  if (!hash || hash === '0x' || hash === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    return '';
  }
  
  const decodedLeague = LEAGUE_HASH_MAP.get(hash);
  if (decodedLeague !== undefined) {
    return decodedLeague;
  }
  
  // If not found, return shortened hash
  return hash.slice(0, 10) + '...';
}

/**
 * Try to decode market ID to get match information
 */
export function decodeMarketId(marketId: string): { homeTeam?: string; awayTeam?: string; league?: string } | null {
  // Market ID format is typically: keccak256(`${homeTeam}_${awayTeam}_${league}`)
  // We can't reverse this directly, but we can try common combinations
  
  for (const homeTeam of COMMON_TEAMS) {
    for (const awayTeam of COMMON_TEAMS) {
      if (homeTeam === awayTeam) continue; // Skip same team
      
      for (const league of COMMON_LEAGUES) {
        try {
          const matchString = `${homeTeam}_${awayTeam}_${league}`;
          const hash = keccak256(toBytes(matchString));
          
          if (hash === marketId) {
            return { homeTeam, awayTeam, league };
          }
        } catch (error) {
          // Continue trying other combinations
        }
      }
    }
  }
  
  return null;
}

/**
 * Add new team/league to hash maps (for dynamic updates)
 */
export function addTeamToHashMap(teamName: string): string {
  try {
    const hash = keccak256(toBytes(teamName));
    TEAM_HASH_MAP.set(hash, teamName);
    return hash;
  } catch (error) {
    console.error('Failed to add team to hash map:', teamName, error);
    return '';
  }
}

export function addLeagueToHashMap(leagueName: string): string {
  try {
    const hash = keccak256(toBytes(leagueName));
    LEAGUE_HASH_MAP.set(hash, leagueName);
    return hash;
  } catch (error) {
    console.error('Failed to add league to hash map:', leagueName, error);
    return '';
  }
}

/**
 * Get all known teams and leagues (for debugging)
 */
export function getKnownHashes() {
  return {
    teams: Object.fromEntries(TEAM_HASH_MAP.entries()),
    leagues: Object.fromEntries(LEAGUE_HASH_MAP.entries())
  };
}

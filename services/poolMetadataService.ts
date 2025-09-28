/**
 * Service to enrich pool data with metadata from fixtures API
 */
import { keccak256, toBytes } from 'viem';

interface FixtureData {
  id: number;
  homeTeam: {
    id: number;
    name: string;
    logoUrl?: string;
  };
  awayTeam: {
    id: number;
    name: string;
    logoUrl?: string;
  };
  league: {
    id: number;
    name: string;
    logoUrl?: string;
  };
  matchDate: string;
  venue?: {
    name: string;
    city: string;
  };
  status: string;
}

interface EnrichedPoolData {
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchDate?: string;
  venue?: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  leagueLogo?: string;
  fixtureId?: number;
}

export class PoolMetadataService {
  private static fixtureCache = new Map<string, FixtureData[]>();
  private static hashToTeamCache = new Map<string, string>();
  
  /**
   * Fetch fixtures from the API
   */
  static async fetchFixtures(): Promise<FixtureData[]> {
    try {
      const response = await fetch('/api/fixtures/upcoming');
      const data = await response.json();
      
      if (!data.success) {
        console.error('Failed to fetch fixtures:', data.error);
        return [];
      }
      
      // Transform API response to our format
      const fixtures: FixtureData[] = data.data.fixtures.map((fixture: any) => ({
        id: fixture.fixture_id || fixture.id,
        homeTeam: {
          id: fixture.home_team_id,
          name: fixture.home_team,
          logoUrl: fixture.home_team_logo
        },
        awayTeam: {
          id: fixture.away_team_id,
          name: fixture.away_team,
          logoUrl: fixture.away_team_logo
        },
        league: {
          id: fixture.league_id,
          name: fixture.league_name,
          logoUrl: fixture.league_logo
        },
        matchDate: fixture.match_time,
        venue: fixture.venue_name ? {
          name: fixture.venue_name,
          city: ''
        } : undefined,
        status: fixture.status
      }));
      
      // Cache the fixtures
      this.fixtureCache.set('upcoming', fixtures);
      
      // Build hash-to-team mapping
      fixtures.forEach(fixture => {
        try {
          const homeHash = keccak256(toBytes(fixture.homeTeam.name));
          const awayHash = keccak256(toBytes(fixture.awayTeam.name));
          const leagueHash = keccak256(toBytes(fixture.league.name));
          
          this.hashToTeamCache.set(homeHash, fixture.homeTeam.name);
          this.hashToTeamCache.set(awayHash, fixture.awayTeam.name);
          this.hashToTeamCache.set(leagueHash, fixture.league.name);
        } catch (error) {
          console.warn('Error hashing fixture data:', error);
        }
      });
      
      return fixtures;
    } catch (error) {
      console.error('Error fetching fixtures:', error);
      return [];
    }
  }
  
  /**
   * Try to match pool hashes with fixture data
   */
  static async enrichPoolData(poolData: {
    homeTeam: string;
    awayTeam: string;
    league: string;
    marketId: string;
    eventStartTime: string;
  }): Promise<EnrichedPoolData | null> {
    // Ensure we have fixture data
    if (!this.fixtureCache.has('upcoming')) {
      await this.fetchFixtures();
    }
    
    const fixtures = this.fixtureCache.get('upcoming') || [];
    
    // Try to decode team names from hashes
    const homeTeam = this.hashToTeamCache.get(poolData.homeTeam);
    const awayTeam = this.hashToTeamCache.get(poolData.awayTeam);
    const league = this.hashToTeamCache.get(poolData.league);
    
    if (homeTeam && awayTeam) {
      // Find matching fixture
      const matchingFixture = fixtures.find(fixture => 
        fixture.homeTeam.name === homeTeam && 
        fixture.awayTeam.name === awayTeam
      );
      
      if (matchingFixture) {
        return {
          homeTeam,
          awayTeam,
          league: league || matchingFixture.league.name,
          matchDate: matchingFixture.matchDate,
          venue: matchingFixture.venue?.name,
          homeTeamLogo: matchingFixture.homeTeam.logoUrl,
          awayTeamLogo: matchingFixture.awayTeam.logoUrl,
          leagueLogo: matchingFixture.league.logoUrl,
          fixtureId: matchingFixture.id
        };
      }
    }
    
    // Try to match by market ID (if it contains fixture ID)
    const eventTime = new Date(parseInt(poolData.eventStartTime) * 1000);
    const timeWindow = 24 * 60 * 60 * 1000; // 24 hours
    
    const timeMatchingFixtures = fixtures.filter(fixture => {
      const fixtureTime = new Date(fixture.matchDate);
      return Math.abs(fixtureTime.getTime() - eventTime.getTime()) < timeWindow;
    });
    
    if (timeMatchingFixtures.length === 1) {
      // If only one fixture matches the time, it's likely the right one
      const fixture = timeMatchingFixtures[0];
      return {
        homeTeam: fixture.homeTeam.name,
        awayTeam: fixture.awayTeam.name,
        league: fixture.league.name,
        matchDate: fixture.matchDate,
        venue: fixture.venue?.name,
        homeTeamLogo: fixture.homeTeam.logoUrl,
        awayTeamLogo: fixture.awayTeam.logoUrl,
        leagueLogo: fixture.league.logoUrl,
        fixtureId: fixture.id
      };
    }
    
    return null;
  }
  
  /**
   * Get team name from hash (if known)
   */
  static getTeamFromHash(hash: string): string | null {
    return this.hashToTeamCache.get(hash) || null;
  }
  
  /**
   * Add team name to cache (for manual additions)
   */
  static addTeamToCache(teamName: string): string {
    try {
      const hash = keccak256(toBytes(teamName));
      this.hashToTeamCache.set(hash, teamName);
      return hash;
    } catch (error) {
      console.error('Error adding team to cache:', error);
      return '';
    }
  }
  
  /**
   * Get all cached team mappings (for debugging)
   */
  static getCachedMappings() {
    return {
      fixtures: this.fixtureCache.size,
      teamMappings: Object.fromEntries(this.hashToTeamCache.entries())
    };
  }
}

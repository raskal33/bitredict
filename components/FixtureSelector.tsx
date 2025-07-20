import React, { useState, useEffect, useCallback } from 'react';
import { CalendarIcon, ClockIcon, StarIcon } from '@heroicons/react/24/outline';

interface Fixture {
  id: number;
  homeTeam: {
    id: number;
    name: string;
  };
  awayTeam: {
    id: number;
    name: string;
  };
  league: {
    id: number;
    name: string;
    season?: number;
  };
  round?: string;
  matchDate: string;
  venue?: {
    name: string;
    city: string;
  };
  status: string;
  odds?: {
    home: number;
    draw: number;
    away: number;
    over25: number;
    under25: number;
    bttsYes: number;
    bttsNo: number;
    updatedAt: string;
  };
}

interface League {
  id: number;
  name: string;
  country: string;
  countryCode: string;
  logoUrl?: string;
  upcomingFixtures: number;
}

interface FixtureSelectorProps {
  onFixtureSelect: (fixture: Fixture) => void;
  selectedFixture?: Fixture | null;
  className?: string;
}

export default function FixtureSelector({ onFixtureSelect, selectedFixture, className = '' }: FixtureSelectorProps) {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [days, setDays] = useState(7);

  // Use bitredict backend API (adjust URL as needed)
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

  const fetchLeagues = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/fixtures/leagues/popular`);
      const data = await response.json();
      
      if (data.success) {
        setLeagues(data.data);
      }
    } catch (error) {
      console.error('Error fetching leagues:', error);
    }
  }, [API_BASE]);

  const fetchFixtures = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        days: days.toString(),
        limit: '50'
      });

      if (selectedLeague) {
        params.append('league', selectedLeague.toString());
      }

      const response = await fetch(`${API_BASE}/api/fixtures/upcoming?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setFixtures(data.data.fixtures);
      }
    } catch (error) {
      console.error('Error fetching fixtures:', error);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, days, selectedLeague]);

  useEffect(() => {
    fetchLeagues();
    fetchFixtures();
  }, [fetchLeagues, fetchFixtures]);

  useEffect(() => {
    fetchFixtures();
  }, [fetchFixtures]);

  const filteredFixtures = fixtures.filter(fixture => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    return (
      fixture.homeTeam.name.toLowerCase().includes(search) ||
      fixture.awayTeam.name.toLowerCase().includes(search) ||
      fixture.league.name.toLowerCase().includes(search)
    );
  });

  const formatMatchDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (date.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return `Today ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInHours < 48) {
      return `Tomorrow ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], { 
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const formatOdds = (odds: number) => {
    return odds ? odds.toFixed(2) : 'N/A';
  };

  const getDifficultyBadge = (fixture: Fixture) => {
    if (!fixture.odds) return null;

    const { odds } = fixture;
    const moneylineOdds = [odds.home, odds.draw, odds.away];
    const minOdd = Math.min(...moneylineOdds);
    const maxOdd = Math.max(...moneylineOdds);
    const oddSpread = maxOdd - minOdd;
    
    const ouSpread = Math.abs(odds.over25 - odds.under25);
    const avgSpread = (oddSpread + ouSpread) / 2;
    
    let difficulty, color;
    if (avgSpread >= 1.5) {
      difficulty = 'Easy';
      color = 'bg-green-500';
    } else if (avgSpread >= 0.8) {
      difficulty = 'Medium';
      color = 'bg-yellow-500';
    } else {
      difficulty = 'Hard';
      color = 'bg-red-500';
    }

    return (
      <span className={`px-2 py-1 text-xs rounded-full text-white ${color}`}>
        {difficulty}
      </span>
    );
  };

  return (
    <div className={`fixture-selector ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2">
          Select Football Fixture
        </h3>
        <p className="text-gray-400">
          Choose an upcoming match to create your prediction pool
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        {/* Search */}
        <div>
          <input
            type="text"
            placeholder="Search teams or leagues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* League and Days Filter */}
        <div className="flex gap-4">
          <select
            value={selectedLeague || ''}
            onChange={(e) => setSelectedLeague(e.target.value ? parseInt(e.target.value) : null)}
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Leagues</option>
            {leagues.map(league => (
              <option key={league.id} value={league.id}>
                {league.name} ({league.upcomingFixtures})
              </option>
            ))}
          </select>

          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          >
            <option value={1}>Next 24h</option>
            <option value={3}>Next 3 days</option>
            <option value={7}>Next week</option>
            <option value={14}>Next 2 weeks</option>
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto"></div>
          <p className="text-gray-400 mt-2">Loading fixtures...</p>
        </div>
      )}

      {/* Fixtures List */}
      {!loading && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredFixtures.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No fixtures found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            filteredFixtures.map(fixture => (
              <div
                key={fixture.id}
                onClick={() => onFixtureSelect(fixture)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedFixture?.id === fixture.id
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-gray-600 bg-gray-800/50 hover:border-cyan-400 hover:bg-gray-700/50'
                }`}
              >
                {/* Match Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-blue-600 rounded text-white">
                      {fixture.league.name}
                    </span>
                    {fixture.round && (
                      <span className="text-xs text-gray-400">
                        {fixture.round}
                      </span>
                    )}
                    {getDifficultyBadge(fixture)}
                  </div>
                  <div className="flex items-center gap-1 text-gray-400 text-xs">
                    <ClockIcon className="h-3 w-3" />
                    {formatMatchDate(fixture.matchDate)}
                  </div>
                </div>

                {/* Teams */}
                <div className="flex items-center justify-center mb-3">
                  <div className="flex-1 text-center">
                    <p className="font-semibold text-white">{fixture.homeTeam.name}</p>
                  </div>
                  <div className="px-4">
                    <span className="text-gray-400">vs</span>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="font-semibold text-white">{fixture.awayTeam.name}</p>
                  </div>
                </div>

                {/* Venue */}
                {fixture.venue && (
                  <div className="text-center text-xs text-gray-400 mb-3">
                    {fixture.venue.name}, {fixture.venue.city}
                  </div>
                )}

                {/* Odds */}
                {fixture.odds && (
                  <div>
                    {/* 1X2 Odds */}
                    <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                      <div className="text-center p-2 bg-gray-700 rounded">
                        <p className="text-gray-300">Home</p>
                        <p className="font-semibold text-green-400">{formatOdds(fixture.odds.home)}</p>
                      </div>
                      <div className="text-center p-2 bg-gray-700 rounded">
                        <p className="text-gray-300">Draw</p>
                        <p className="font-semibold text-yellow-400">{formatOdds(fixture.odds.draw)}</p>
                      </div>
                      <div className="text-center p-2 bg-gray-700 rounded">
                        <p className="text-gray-300">Away</p>
                        <p className="font-semibold text-red-400">{formatOdds(fixture.odds.away)}</p>
                      </div>
                    </div>

                    {/* Over/Under Odds */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-center p-2 bg-gray-700 rounded">
                        <p className="text-gray-300">Over 2.5</p>
                        <p className="font-semibold text-orange-400">{formatOdds(fixture.odds.over25)}</p>
                      </div>
                      <div className="text-center p-2 bg-gray-700 rounded">
                        <p className="text-gray-300">Under 2.5</p>
                        <p className="font-semibold text-blue-400">{formatOdds(fixture.odds.under25)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Selected Indicator */}
                {selectedFixture?.id === fixture.id && (
                  <div className="mt-3 flex items-center justify-center gap-1 text-cyan-400">
                    <StarIcon className="h-4 w-4 fill-current" />
                    <span className="text-sm font-medium">Selected</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Selected Fixture Summary */}
      {selectedFixture && (
        <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-500 rounded-lg">
          <h4 className="font-semibold text-cyan-400 mb-2">Selected Match</h4>
          <p className="text-white">
            {selectedFixture.homeTeam.name} vs {selectedFixture.awayTeam.name}
          </p>
          <p className="text-gray-300 text-sm">
            {selectedFixture.league.name} • {formatMatchDate(selectedFixture.matchDate)}
          </p>
          {selectedFixture.odds && (
            <div className="mt-2 text-xs text-gray-400">
              <span>1X2: {formatOdds(selectedFixture.odds.home)} / {formatOdds(selectedFixture.odds.draw)} / {formatOdds(selectedFixture.odds.away)}</span>
              <span className="ml-4">O/U 2.5: {formatOdds(selectedFixture.odds.over25)} / {formatOdds(selectedFixture.odds.under25)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 
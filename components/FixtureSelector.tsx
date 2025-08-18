'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface Fixture {
  id: number;
  name: string;
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
    home: number | null;
    draw: number | null;
    away: number | null;
    over15: number | null;
    under15: number | null;
    over25: number | null;
    under25: number | null;
    over35: number | null;
    under35: number | null;
    bttsYes: number | null;
    bttsNo: number | null;
    htHome: number | null;
    htDraw: number | null;
    htAway: number | null;
    ht_over_05: number | null;
    ht_under_05: number | null;
    ht_over_15: number | null;
    ht_under_15: number | null;
    updatedAt: string;
  };
}

interface FixtureSelectorProps {
  fixtures: Fixture[];
  onSelect: (fixture: Fixture) => void;
  selectedFixture?: Fixture;
}

const FixtureSelector: React.FC<FixtureSelectorProps> = ({
  fixtures,
  onSelect,
  selectedFixture
}) => {
  const [filteredFixtures, setFilteredFixtures] = useState<Fixture[]>(fixtures);
  const [leagueFilter, setLeagueFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Get unique leagues
  const leagues = Array.from(new Set(fixtures.map(f => f.league?.name).filter(Boolean)));

  useEffect(() => {
    let filtered = fixtures;

    // League filter
    if (leagueFilter !== 'all') {
      filtered = filtered.filter(f => f.league?.name === leagueFilter);
    }

    // Time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      filtered = filtered.filter(f => {
        if (!f.matchDate) return false;
        const matchDate = new Date(f.matchDate);
        
        switch (timeFilter) {
          case 'today':
            return matchDate >= today && matchDate < tomorrow;
          case 'tomorrow':
            const dayAfterTomorrow = new Date(tomorrow);
            dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
            return matchDate >= tomorrow && matchDate < dayAfterTomorrow;
          case 'week':
            const weekFromNow = new Date(today);
            weekFromNow.setDate(weekFromNow.getDate() + 7);
            return matchDate >= today && matchDate < weekFromNow;
          default:
            return true;
        }
      });
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(f => 
        f.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.homeTeam?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.awayTeam?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.league?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredFixtures(filtered);
  }, [fixtures, leagueFilter, timeFilter, searchTerm]);

  const getTeamLogo = (team: { name: string; logoUrl?: string } | undefined) => {
    if (!team?.name) return null;
    
    // Use logoUrl from backend if available, otherwise fallback to UI Avatars
    if (team.logoUrl) {
      return team.logoUrl;
    }
    
    // Fallback to UI Avatars with better styling
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(team.name)}&background=22C7FF&color=000&size=64&font-size=0.4&bold=true`;
  };

  const getLeagueLogo = (league: { name: string; logoUrl?: string } | undefined) => {
    if (!league?.name) return null;
    
    // Use logoUrl from backend if available
    if (league.logoUrl) {
      return league.logoUrl;
    }
    
    // Popular league mappings with SportMonks CDN
    const leagueLogos: { [key: string]: string } = {
      'Premier League': 'https://cdn.sportmonks.com/images/soccer/leagues/8.png',
      'England Premier League': 'https://cdn.sportmonks.com/images/soccer/leagues/8.png',
      'La Liga': 'https://cdn.sportmonks.com/images/soccer/leagues/564.png',
      'Bundesliga': 'https://cdn.sportmonks.com/images/soccer/leagues/82.png',
      'Serie A': 'https://cdn.sportmonks.com/images/soccer/leagues/301.png',
      'Ligue 1': 'https://cdn.sportmonks.com/images/soccer/leagues/501.png',
      'Champions League': 'https://cdn.sportmonks.com/images/soccer/leagues/2.png',
      'Europa League': 'https://cdn.sportmonks.com/images/soccer/leagues/5.png',
      'UEFA Europa League': 'https://cdn.sportmonks.com/images/soccer/leagues/5.png',
      'UEFA Champions League': 'https://cdn.sportmonks.com/images/soccer/leagues/2.png'
    };
    
    // Try exact match first
    if (leagueLogos[league.name]) {
      return leagueLogos[league.name];
    }
    
    // Try partial match
    for (const [key, url] of Object.entries(leagueLogos)) {
      if (league.name.toLowerCase().includes(key.toLowerCase())) {
        return url;
      }
    }
    
    // Fallback to UI Avatars
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(league.name)}&background=FF6B00&color=fff&size=64&font-size=0.4&bold=true`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    
    // Fix timezone issues by comparing only the date parts
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffTime = dateOnly.getTime() - nowOnly.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 1 && diffDays < 7) return `In ${diffDays} days`;
    if (diffDays < -1 && diffDays > -7) return `${Math.abs(diffDays)} days ago`;
    
    return date.toLocaleDateString('en-US', { 
        month: 'short',
        day: 'numeric'
      });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const getDifficultyBadge = (odds: { 
    home?: number | null; 
    away?: number | null; 
    draw?: number | null;
    over25?: number | null;
    under25?: number | null;
    bttsYes?: number | null;
    bttsNo?: number | null;
  } | undefined) => {
    if (!odds?.home || !odds?.away) return null;
    
    const homeOdds = odds.home;
    const awayOdds = odds.away;
    
    // New difficulty criteria based on odds
    // Any home-away team odd below 1.50 --> Easy
    // Any home-away team odd between 1.51-1.95 --> Medium  
    // Any home-away team odd above 1.95 --> Hard
    
    if (homeOdds < 1.50 || awayOdds < 1.50) {
      return { text: 'Easy', color: 'bg-green-500' };
    } else if ((homeOdds >= 1.51 && homeOdds <= 1.95) || (awayOdds >= 1.51 && awayOdds <= 1.95)) {
      return { text: 'Medium', color: 'bg-yellow-500' };
    } else {
      return { text: 'Hard', color: 'bg-red-500' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search matches, teams, or leagues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-input)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--somnia-cyan)] focus:border-transparent transition-all duration-200"
          />
          <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* League Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              League
            </label>
          <select
              value={leagueFilter}
              onChange={(e) => setLeagueFilter(e.target.value)}
              className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-input)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--somnia-cyan)] focus:border-transparent transition-all duration-200"
            >
              <option value="all">All Leagues</option>
            {leagues.map(league => (
                <option key={league} value={league}>{league}</option>
            ))}
          </select>
          </div>

          {/* Time Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Time
            </label>
          <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-input)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--somnia-cyan)] focus:border-transparent transition-all duration-200"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="week">This Week</option>
          </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-[var(--text-muted)] text-sm">
        {filteredFixtures.length} match{filteredFixtures.length !== 1 ? 'es' : ''} found
        </div>

      {/* Fixtures Grid */}
      <div className="grid gap-4">
        {filteredFixtures.map((fixture) => {
          const isSelected = selectedFixture?.id === fixture.id;
          const difficulty = getDifficultyBadge(fixture.odds);
          
          return (
            <motion.div
                key={fixture.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(fixture)}
              className={`
                glass-card cursor-pointer transition-all duration-200 relative overflow-hidden
                ${isSelected ? 'ring-2 ring-[var(--somnia-cyan)] bg-[rgba(34,199,255,0.1)]' : ''}
                hover:bg-[rgba(22,24,48,0.8)] hover:border-[rgba(255,255,255,0.15)]
              `}
              >
                {/* Match Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                                     {/* League Logo */}
                   {fixture.league && (
                     <Image
                       src={getLeagueLogo(fixture.league) || ''}
                       alt={fixture.league.name}
                       width={24}
                       height={24}
                       className="w-6 h-6 rounded-full"
                       onError={(e) => {
                         const target = e.target as HTMLImageElement;
                         target.style.display = 'none';
                       }}
                     />
                   )}
                  
                  {/* League Name */}
                  <span className="text-[var(--text-secondary)] text-sm font-medium">
                    {fixture.league?.name || 'Unknown League'}
                      </span>
                    </div>

                {/* Match Date and Time */}
                {fixture.matchDate && (
                  <span className="text-[var(--text-muted)] text-sm">
                    {formatDate(fixture.matchDate)} • {formatTime(fixture.matchDate)}
                  </span>
                )}
                  </div>

              {/* Teams */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                                     {/* Home Team */}
                   <div className="flex items-center gap-2">
                     <Image
                       src={getTeamLogo(fixture.homeTeam) || ''}
                       alt={fixture.homeTeam?.name || ''}
                       width={32}
                       height={32}
                       className="w-8 h-8 rounded-full"
                       onError={(e) => {
                         const target = e.target as HTMLImageElement;
                         target.style.display = 'none';
                       }}
                     />
                    <span className="text-[var(--text-primary)] font-medium">
                      {fixture.homeTeam?.name || 'TBD'}
                    </span>
                  </div>
                </div>

                {/* VS */}
                <div className="mx-4 text-[var(--text-muted)] font-medium">
                  vs
                </div>

                                   {/* Away Team */}
                   <div className="flex items-center gap-2 flex-1 justify-end">
                     <span className="text-[var(--text-primary)] font-medium">
                       {fixture.awayTeam?.name || 'TBD'}
                     </span>
                     <Image
                       src={getTeamLogo(fixture.awayTeam) || ''}
                       alt={fixture.awayTeam?.name || ''}
                       width={32}
                       height={32}
                       className="w-8 h-8 rounded-full"
                       onError={(e) => {
                         const target = e.target as HTMLImageElement;
                         target.style.display = 'none';
                       }}
                     />
                   </div>
                    </div>

              {/* Odds and Difficulty */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {fixture.odds?.home && (
                    <span className="px-2 py-1 bg-[rgba(34,199,255,0.1)] text-[var(--somnia-cyan)] text-xs rounded">
                      H: {fixture.odds.home.toFixed(2)}
                    </span>
                  )}
                  {fixture.odds?.draw && (
                    <span className="px-2 py-1 bg-[rgba(140,0,255,0.1)] text-[var(--somnia-violet)] text-xs rounded">
                      D: {fixture.odds.draw.toFixed(2)}
                    </span>
                  )}
                  {fixture.odds?.away && (
                    <span className="px-2 py-1 bg-[rgba(255,0,128,0.1)] text-[var(--somnia-magenta)] text-xs rounded">
                      A: {fixture.odds.away.toFixed(2)}
                    </span>
                  )}
                  </div>

                {difficulty && (
                  <span className={`px-2 py-1 text-xs rounded font-medium ${difficulty.color}`}>
                    {difficulty.text}
                  </span>
                )}
              </div>

              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="w-4 h-4 bg-[var(--somnia-cyan)] rounded-full flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-black" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
        </div>
      )}
            </motion.div>
          );
        })}
            </div>

      {filteredFixtures.length === 0 && (
        <div className="text-center py-12">
          <div className="text-[var(--text-muted)] text-lg mb-2">No matches found</div>
          <div className="text-[var(--text-muted)] text-sm">Try adjusting your filters or search terms</div>
        </div>
      )}
    </div>
  );
};

export default FixtureSelector; 
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { 
  formatLeagueName, 
  getTeamDisplayName,
  getTeamInitials 
} from "@/utils/teamUtils";

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
    country?: string;
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
  onMarketSelect: (fixture: Fixture, marketType: string, outcome: string) => void;
  selectedFixture?: Fixture;
}

const FixtureSelector: React.FC<FixtureSelectorProps> = ({
  fixtures,
  onMarketSelect,
  selectedFixture
}) => {
  const [filteredFixtures, setFilteredFixtures] = useState<Fixture[]>(fixtures);
  const [leagueFilter, setLeagueFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedFixture, setExpandedFixture] = useState<number | null>(null);

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
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(f => 
        f.homeTeam?.name?.toLowerCase().includes(lowerSearch) ||
        f.awayTeam?.name?.toLowerCase().includes(lowerSearch) ||
        f.league?.name?.toLowerCase().includes(lowerSearch)
      );
    }

    setFilteredFixtures(filtered);
  }, [fixtures, leagueFilter, timeFilter, searchTerm]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      weekday: 'short'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const getTeamLogo = (team: { name: string; logoUrl?: string } | undefined) => {
    if (!team) return null;
    
    // Use logoUrl from backend if available, otherwise fallback to UI Avatars
    if (team.logoUrl && team.logoUrl !== 'null' && team.logoUrl !== '' && team.logoUrl !== 'undefined') {
      console.log(`Team ${team.name} logo URL:`, team.logoUrl);
      return team.logoUrl;
    }
    
    // Fallback to UI Avatars with team initials
    const initials = team.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    
    const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=22C7FF&color=000&size=64&font-size=0.4&bold=true`;
    console.log(`Team ${team.name} using fallback logo:`, fallbackUrl);
    return fallbackUrl;
  };

  // Get available markets for a fixture
  const getAvailableMarkets = (fixture: Fixture) => {
    const markets: Array<{
      type: string;
      outcome: string;
      label: string;
      odds: number;
      color: string;
    }> = [];
    const odds = fixture.odds;

    if (!odds) return markets;

    // Moneyline markets (Full Time)
    if (odds.home && odds.home > 1.0) {
      markets.push({
        type: 'moneyline',
        outcome: 'home',
        label: 'Home Win',
        odds: odds.home,
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      });
    }
    if (odds.draw && odds.draw > 1.0) {
      markets.push({
        type: 'moneyline',
        outcome: 'draw',
        label: 'Draw',
        odds: odds.draw,
        color: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      });
    }
    if (odds.away && odds.away > 1.0) {
      markets.push({
        type: 'moneyline',
        outcome: 'away',
        label: 'Away Win',
        odds: odds.away,
        color: 'bg-red-500/20 text-red-400 border-red-500/30'
      });
    }

    // Over/Under markets (Full Time)
    if (odds.over15 && odds.over15 > 1.0) {
      markets.push({
        type: 'over_under',
        outcome: 'over15',
        label: 'Over 1.5 Goals',
        odds: odds.over15,
        color: 'bg-green-500/20 text-green-400 border-green-500/30'
      });
    }
    if (odds.under15 && odds.under15 > 1.0) {
      markets.push({
        type: 'over_under',
        outcome: 'under15',
        label: 'Under 1.5 Goals',
        odds: odds.under15,
        color: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      });
    }
    if (odds.over25 && odds.over25 > 1.0) {
      markets.push({
        type: 'over_under',
        outcome: 'over25',
        label: 'Over 2.5 Goals',
        odds: odds.over25,
        color: 'bg-green-500/20 text-green-400 border-green-500/30'
      });
    }
    if (odds.under25 && odds.under25 > 1.0) {
      markets.push({
        type: 'over_under',
        outcome: 'under25',
        label: 'Under 2.5 Goals',
        odds: odds.under25,
        color: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      });
    }
    if (odds.over35 && odds.over35 > 1.0) {
      markets.push({
        type: 'over_under',
        outcome: 'over35',
        label: 'Over 3.5 Goals',
        odds: odds.over35,
        color: 'bg-green-500/20 text-green-400 border-green-500/30'
      });
    }
    if (odds.under35 && odds.under35 > 1.0) {
      markets.push({
        type: 'over_under',
        outcome: 'under35',
        label: 'Under 3.5 Goals',
        odds: odds.under35,
        color: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      });
    }

    // Both Teams to Score
    if (odds.bttsYes && odds.bttsYes > 1.0) {
      markets.push({
        type: 'btts',
        outcome: 'yes',
        label: 'Both Teams Score',
        odds: odds.bttsYes,
        color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      });
    }
    if (odds.bttsNo && odds.bttsNo > 1.0) {
      markets.push({
        type: 'btts',
        outcome: 'no',
        label: 'Not Both Teams Score',
        odds: odds.bttsNo,
        color: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
      });
    }

    // Half Time markets
    if (odds.htHome && odds.htHome > 1.0) {
      markets.push({
        type: 'ht_moneyline',
        outcome: 'htHome',
        label: 'HT: Home Win',
        odds: odds.htHome,
        color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
      });
    }
    if (odds.htDraw && odds.htDraw > 1.0) {
      markets.push({
        type: 'ht_moneyline',
        outcome: 'htDraw',
        label: 'HT: Draw',
        odds: odds.htDraw,
        color: 'bg-violet-500/20 text-violet-400 border-violet-500/30'
      });
    }
    if (odds.htAway && odds.htAway > 1.0) {
      markets.push({
        type: 'ht_moneyline',
        outcome: 'htAway',
        label: 'HT: Away Win',
        odds: odds.htAway,
        color: 'bg-pink-500/20 text-pink-400 border-pink-500/30'
      });
    }

    // Half Time Over/Under markets
    if (odds.ht_over_05 && odds.ht_over_05 > 1.0) {
      markets.push({
        type: 'ht_over_under',
        outcome: 'ht_over_05',
        label: 'HT: Over 0.5 Goals',
        odds: odds.ht_over_05,
        color: 'bg-teal-500/20 text-teal-400 border-teal-500/30'
      });
    }
    if (odds.ht_under_05 && odds.ht_under_05 > 1.0) {
      markets.push({
        type: 'ht_over_under',
        outcome: 'ht_under_05',
        label: 'HT: Under 0.5 Goals',
        odds: odds.ht_under_05,
        color: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      });
    }
    if (odds.ht_over_15 && odds.ht_over_15 > 1.0) {
      markets.push({
        type: 'ht_over_under',
        outcome: 'ht_over_15',
        label: 'HT: Over 1.5 Goals',
        odds: odds.ht_over_15,
        color: 'bg-teal-500/20 text-teal-400 border-teal-500/30'
      });
    }
    if (odds.ht_under_15 && odds.ht_under_15 > 1.0) {
      markets.push({
        type: 'ht_over_under',
        outcome: 'ht_under_15',
        label: 'HT: Under 1.5 Goals',
        odds: odds.ht_under_15,
        color: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      });
    }

    return markets;
  };

  const handleFixtureClick = (fixture: Fixture) => {
    if (expandedFixture === fixture.id) {
      setExpandedFixture(null);
    } else {
      setExpandedFixture(fixture.id);
    }
  };

  const handleMarketSelect = (fixture: Fixture, marketType: string, outcome: string) => {
    onMarketSelect(fixture, marketType, outcome);
  };





  return (
    <div className="space-y-6 w-full max-w-none">
      {/* Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search teams or leagues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
          />
          <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTimeFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              timeFilter === 'all'
                ? 'bg-cyan-500 text-black'
                : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => setTimeFilter('today')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              timeFilter === 'today'
                ? 'bg-cyan-500 text-black'
                : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setTimeFilter('tomorrow')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              timeFilter === 'tomorrow'
                ? 'bg-cyan-500 text-black'
                : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            Tomorrow
          </button>
          <button
            onClick={() => setTimeFilter('week')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              timeFilter === 'week'
                ? 'bg-cyan-500 text-black'
                : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            This Week
          </button>
        </div>

        {/* League Filter */}
        {leagues.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setLeagueFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                leagueFilter === 'all'
                  ? 'bg-cyan-500 text-black'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              All Leagues
            </button>
            {leagues.slice(0, 5).map((league) => (
              <button
                key={league}
                onClick={() => setLeagueFilter(league)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  leagueFilter === league
                    ? 'bg-cyan-500 text-black'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                {league}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-400">
        Showing {filteredFixtures.length} of {fixtures.length} matches
      </div>

      {/* Fixtures Grid */}
      <div className="space-y-4">
        {filteredFixtures.map((fixture) => {
          const isSelected = selectedFixture?.id === fixture.id;
          const isExpanded = expandedFixture === fixture.id;
          const availableMarkets = getAvailableMarkets(fixture);
          
          return (
            <motion.div
              key={fixture.id}
              layout
              className={`
                relative bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm
                border border-gray-700/50 rounded-2xl transition-all duration-300
                hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10
                ${isSelected ? 'ring-2 ring-cyan-500 bg-cyan-500/5 border-cyan-500/50' : ''}
              `}
            >
              {/* Main Fixture Card */}
              <div 
                className="p-4 md:p-6 cursor-pointer w-full"
                onClick={() => handleFixtureClick(fixture)}
              >
                {/* League Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="text-white font-semibold text-sm">
                        {formatLeagueName(fixture.league?.name || 'Unknown League', fixture.league?.country)}
                      </h3>
                      {fixture.matchDate && (
                        <p className="text-gray-400 text-xs">
                          {formatDate(fixture.matchDate)} • {formatTime(fixture.matchDate)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Expand/Collapse Indicator */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {availableMarkets.length} markets
                    </span>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="w-5 h-5 text-gray-400"
                    >
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </motion.div>
                  </div>
                </div>

                {/* Teams Section - Mobile Optimized */}
                <div className="flex items-center justify-between mb-4 gap-6">
                  {/* Home Team */}
                  <div className="flex flex-col items-center flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center mb-2">
                      <Image
                        src={getTeamLogo(fixture.homeTeam) || ''}
                        alt={fixture.homeTeam?.name || ''}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          // Show fallback with team initials
                          const fallbackDiv = target.parentElement?.querySelector('.team-fallback') as HTMLElement;
                          if (fallbackDiv) {
                            fallbackDiv.style.display = 'flex';
                          }
                        }}
                        unoptimized
                      />
                      <div className="team-fallback absolute inset-0 flex items-center justify-center text-white font-bold text-xs" style={{ display: 'none' }}>
                        {getTeamInitials(fixture.homeTeam?.name || 'T')}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1 text-center">
                      <h4 className="text-white font-semibold text-xs md:text-sm truncate w-full">
                        {getTeamDisplayName(fixture.homeTeam?.name || 'TBD', true)}
                      </h4>
                    </div>
                  </div>

                  {/* VS */}
                  <div className="text-gray-500 font-medium text-base px-3">
                    vs
                  </div>

                  {/* Away Team */}
                  <div className="flex flex-col items-center flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center mb-2">
                      <Image
                        src={getTeamLogo(fixture.awayTeam) || ''}
                        alt={fixture.awayTeam?.name || ''}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          // Show fallback with team initials
                          const fallbackDiv = target.parentElement?.querySelector('.team-fallback') as HTMLElement;
                          if (fallbackDiv) {
                            fallbackDiv.style.display = 'flex';
                          }
                        }}
                        unoptimized
                      />
                      <div className="team-fallback absolute inset-0 flex items-center justify-center text-white font-bold text-xs" style={{ display: 'none' }}>
                        {getTeamInitials(fixture.awayTeam?.name || 'T')}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1 text-center">
                      <h4 className="text-white font-semibold text-xs md:text-sm truncate w-full">
                        {getTeamDisplayName(fixture.awayTeam?.name || 'TBD', true)}
                      </h4>
                    </div>
                  </div>
                </div>

                {/* Quick Odds Preview */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {fixture.odds?.home && (
                      <div className="px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div className="text-blue-400 text-xs font-medium">Home</div>
                        <div className="text-white font-bold text-sm">{fixture.odds.home.toFixed(2)}</div>
                      </div>
                    )}
                    {fixture.odds?.draw && (
                      <div className="px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                        <div className="text-purple-400 text-xs font-medium">Draw</div>
                        <div className="text-white font-bold text-sm">{fixture.odds.draw.toFixed(2)}</div>
                      </div>
                    )}
                    {fixture.odds?.away && (
                      <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <div className="text-red-400 text-xs font-medium">Away</div>
                        <div className="text-white font-bold text-sm">{fixture.odds.away.toFixed(2)}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Expandable Markets Section */}
              <motion.div
                initial={false}
                animate={{ 
                  height: isExpanded ? 'auto' : 0,
                  opacity: isExpanded ? 1 : 0
                }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6 border-t border-gray-700/50">
                  <div className="pt-4">
                    <h4 className="text-white font-semibold text-sm mb-4">Available Markets</h4>
                    
                    {availableMarkets.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {availableMarkets.map((market, index) => (
                          <motion.button
                            key={`${market.type}-${market.outcome}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarketSelect(fixture, market.type, market.outcome);
                            }}
                            className={`
                              p-4 rounded-xl border transition-all duration-200 hover:scale-105
                              ${market.color} hover:shadow-lg
                            `}
                          >
                            <div className="text-left">
                              <div className="font-semibold text-sm mb-1">{market.label}</div>
                              <div className="text-lg font-bold">{market.odds.toFixed(2)}</div>
                              <div className="text-xs opacity-75 mt-1">Click to configure</div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <div className="text-sm">No markets available for this fixture</div>
                        <div className="text-xs mt-1">Check back later for updated odds</div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {filteredFixtures.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">No matches found</div>
          <div className="text-gray-500 text-sm">Try adjusting your filters or search terms</div>
        </div>
      )}
    </div>
  );
};

export default FixtureSelector; 
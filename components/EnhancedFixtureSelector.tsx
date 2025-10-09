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

interface Market {
  type: string;
  outcome: string;
  label: string;
  odds: number;
  color: string;
  category: 'fulltime' | 'halftime' | 'goals';
  description: string;
  icon: string;
}

const EnhancedFixtureSelector: React.FC<FixtureSelectorProps> = ({
  fixtures,
  onMarketSelect,
  selectedFixture
}) => {
  const [filteredFixtures, setFilteredFixtures] = useState<Fixture[]>(fixtures);
  const [leagueFilter, setLeagueFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedFixture, setExpandedFixture] = useState<number | null>(null);
  const [marketFilter, setMarketFilter] = useState<string>('all');

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
    
    if (team.logoUrl) {
      return team.logoUrl;
    }
    
    // Fallback to a placeholder or team initials
    return `https://via.placeholder.com/48x48/374151/ffffff?text=${getTeamInitials(team.name)}`;
  };

  const handleFixtureClick = (fixture: Fixture) => {
    setExpandedFixture(expandedFixture === fixture.id ? null : fixture.id);
  };

  const handleMarketSelect = (fixture: Fixture, marketType: string, outcome: string) => {
    onMarketSelect(fixture, marketType, outcome);
  };

  // Enhanced market generation with all new markets
  const getAvailableMarkets = (fixture: Fixture): Market[] => {
    const markets: Market[] = [];
    const odds = fixture.odds;
    
    // Always show all market types, even if backend doesn't provide odds
    // We'll calculate/estimate odds for missing market types

    // Full Time 1X2 - Always show all three options
      markets.push({
        type: 'ft_1x2',
        outcome: 'home',
        label: `${fixture.homeTeam.name} Win`,
      odds: odds?.home || 2.0, // Default odds if not provided
        color: 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20',
        category: 'fulltime',
        description: 'Match winner after 90 minutes',
        icon: '🏠'
      });
    
      markets.push({
        type: 'ft_1x2',
        outcome: 'draw',
        label: 'Draw',
      odds: odds?.draw || 3.2, // Default odds if not provided
        color: 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20',
        category: 'fulltime',
        description: 'Match ends in a draw',
        icon: '🤝'
      });
    
      markets.push({
        type: 'ft_1x2',
        outcome: 'away',
        label: `${fixture.awayTeam.name} Win`,
      odds: odds?.away || 2.5, // Default odds if not provided
        color: 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20',
        category: 'fulltime',
        description: 'Match winner after 90 minutes',
        icon: '✈️'
      });

    // Half Time 1X2 - Always show all three options
      markets.push({
        type: 'ht_1x2',
        outcome: 'home',
        label: `${fixture.homeTeam.name} Leading HT`,
      odds: odds?.htHome || 2.2, // Default odds if not provided
        color: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20',
        category: 'halftime',
        description: 'Leading team at half-time',
        icon: '⏰'
      });
    
      markets.push({
        type: 'ht_1x2',
        outcome: 'draw',
        label: 'Draw at HT',
      odds: odds?.htDraw || 2.8, // Default odds if not provided
        color: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20',
        category: 'halftime',
        description: 'Teams tied at half-time',
        icon: '⏰'
      });
    
      markets.push({
        type: 'ht_1x2',
        outcome: 'away',
        label: `${fixture.awayTeam.name} Leading HT`,
      odds: odds?.htAway || 2.3, // Default odds if not provided
        color: 'bg-pink-500/10 border-pink-500/30 text-pink-400 hover:bg-pink-500/20',
        category: 'halftime',
        description: 'Leading team at half-time',
        icon: '⏰'
      });

    // Over/Under 2.5 Goals - Always show both options
      markets.push({
        type: 'ou_25',
        outcome: 'over',
        label: 'Over 2.5 Goals',
      odds: odds?.over25 || 1.8, // Default odds if not provided
        color: 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20',
        category: 'goals',
        description: 'Total goals over 2.5',
        icon: '⚽'
      });
    
      markets.push({
        type: 'ou_25',
        outcome: 'under',
        label: 'Under 2.5 Goals',
      odds: odds?.under25 || 2.0, // Default odds if not provided
        color: 'bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20',
        category: 'goals',
        description: 'Total goals under 2.5',
        icon: '🔒'
      });

    // Over/Under 3.5 Goals - Always show both options
      markets.push({
        type: 'ou_35',
        outcome: 'over',
        label: 'Over 3.5 Goals',
      odds: odds?.over35 || 2.5, // Default odds if not provided
        color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20',
        category: 'goals',
        description: 'Total goals over 3.5',
        icon: '🎯'
      });
    
      markets.push({
        type: 'ou_35',
        outcome: 'under',
        label: 'Under 3.5 Goals',
      odds: odds?.under35 || 1.5, // Default odds if not provided
        color: 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20',
        category: 'goals',
        description: 'Total goals under 3.5',
        icon: '🛡️'
      });

    // 1st Half Over/Under 1.5 Goals - Always show both options
      markets.push({
        type: 'ht_ou_15',
        outcome: 'over',
        label: 'Over 1.5 Goals (1st Half)',
      odds: odds?.ht_over_15 || 2.2, // Default odds if not provided
        color: 'bg-teal-500/10 border-teal-500/30 text-teal-400 hover:bg-teal-500/20',
        category: 'halftime',
        description: 'First half goals over 1.5',
        icon: '🥅'
      });
    
      markets.push({
        type: 'ht_ou_15',
        outcome: 'under',
        label: 'Under 1.5 Goals (1st Half)',
      odds: odds?.ht_under_15 || 1.7, // Default odds if not provided
        color: 'bg-slate-500/10 border-slate-500/30 text-slate-400 hover:bg-slate-500/20',
        category: 'halftime',
        description: 'First half goals under 1.5',
        icon: '🚫'
      });

    // Both Teams to Score - Always show both options
      markets.push({
        type: 'btts',
        outcome: 'yes',
        label: 'Both Teams Score',
      odds: odds?.bttsYes || 1.8, // Default odds if not provided
        color: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20',
        category: 'goals',
        description: 'Both teams score at least one goal',
        icon: '⚽'
      });
    
    markets.push({
      type: 'btts',
      outcome: 'no',
      label: 'Not Both Teams Score',
      odds: odds?.bttsNo || 2.0, // Default odds if not provided
      color: 'bg-gray-500/10 border-gray-500/30 text-gray-400 hover:bg-gray-500/20',
      category: 'goals',
      description: 'Not both teams will score',
      icon: '🚫'
    });

    // Double Chance Markets (1X, X2, 12) - Always show all options
    const homeOrDrawOdds = odds?.home && odds?.draw 
      ? (odds.home * odds.draw) / (odds.home + odds.draw)
      : 1.4; // Default odds if not provided
    markets.push({
      type: 'double_chance',
      outcome: '1x',
      label: 'Home or Draw (1X)',
      odds: homeOrDrawOdds,
      color: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20',
      category: 'fulltime',
      description: 'Home team wins or match ends in draw',
      icon: '🏠🤝'
    });
    
    const awayOrDrawOdds = odds?.away && odds?.draw 
      ? (odds.away * odds.draw) / (odds.away + odds.draw)
      : 1.5; // Default odds if not provided
    markets.push({
      type: 'double_chance',
      outcome: 'x2',
      label: 'Away or Draw (X2)',
      odds: awayOrDrawOdds,
      color: 'bg-pink-500/10 border-pink-500/30 text-pink-400 hover:bg-pink-500/20',
      category: 'fulltime',
      description: 'Away team wins or match ends in draw',
      icon: '✈️🤝'
    });
    
    const homeOrAwayOdds = odds?.home && odds?.away 
      ? (odds.home * odds.away) / (odds.home + odds.away)
      : 1.3; // Default odds if not provided
    markets.push({
      type: 'double_chance',
      outcome: '12',
      label: 'Home or Away (12)',
      odds: homeOrAwayOdds,
      color: 'bg-violet-500/10 border-violet-500/30 text-violet-400 hover:bg-violet-500/20',
      category: 'fulltime',
      description: 'Home or away team wins (no draw)',
      icon: '🏠✈️'
    });

    // Correct Score Markets (Common scores) - Always show all options
    const commonScores = [
      { score: '1-0', odds: odds?.home ? odds.home * 0.3 : 8.0 },
      { score: '2-1', odds: odds?.home ? odds.home * 0.2 : 12.0 },
      { score: '2-0', odds: odds?.home ? odds.home * 0.15 : 15.0 },
      { score: '1-1', odds: odds?.draw ? odds.draw * 0.4 : 6.0 },
      { score: '0-1', odds: odds?.away ? odds.away * 0.3 : 8.0 },
      { score: '1-2', odds: odds?.away ? odds.away * 0.2 : 12.0 },
      { score: '0-2', odds: odds?.away ? odds.away * 0.15 : 15.0 }
    ];

    commonScores.forEach(({ score, odds: scoreOdds }) => {
      markets.push({
        type: 'correct_score',
        outcome: score,
        label: `Correct Score ${score}`,
        odds: scoreOdds,
        color: 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20',
        category: 'goals',
        description: `Exact final score: ${score}`,
        icon: '🎯'
      });
    });

    // First Goal Scorer Markets (Generic) - Always show all options
    const firstGoalOdds = odds?.home && odds?.away 
      ? Math.min(odds.home, odds.away) * 0.8
      : 3.0; // Default odds if not provided
    
    markets.push({
      type: 'first_goal',
      outcome: 'home_player',
      label: 'Home Team Player Scores First',
      odds: firstGoalOdds,
      color: 'bg-sky-500/10 border-sky-500/30 text-sky-400 hover:bg-sky-500/20',
      category: 'goals',
      description: 'Any home team player scores first goal',
      icon: '🏠⚽'
    });
    
    markets.push({
      type: 'first_goal',
      outcome: 'away_player',
      label: 'Away Team Player Scores First',
      odds: firstGoalOdds,
      color: 'bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20',
      category: 'goals',
      description: 'Any away team player scores first goal',
      icon: '✈️⚽'
    });
    
    markets.push({
      type: 'first_goal',
      outcome: 'no_goal',
      label: 'No Goal Scorer',
      odds: firstGoalOdds * 1.5,
      color: 'bg-gray-500/10 border-gray-500/30 text-gray-400 hover:bg-gray-500/20',
      category: 'goals',
      description: 'No goals scored in the match',
      icon: '🚫⚽'
    });

    return markets;
  };

  const getMarketsByCategory = (markets: Market[]) => {
    const categories = {
      fulltime: markets.filter(m => m.category === 'fulltime'),
      halftime: markets.filter(m => m.category === 'halftime'),
      goals: markets.filter(m => m.category === 'goals')
    };
    return categories;
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Search and Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search teams or leagues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-10 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Time Filter */}
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

        {/* Market Category Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setMarketFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              marketFilter === 'all'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            All Markets
          </button>
          <button
            onClick={() => setMarketFilter('fulltime')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              marketFilter === 'fulltime'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            Full Time
          </button>
          <button
            onClick={() => setMarketFilter('halftime')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              marketFilter === 'halftime'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            Half Time
          </button>
          <button
            onClick={() => setMarketFilter('goals')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              marketFilter === 'goals'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            Goals
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

      {/* Enhanced Fixtures Grid */}
      <div className="space-y-4">
        {filteredFixtures.map((fixture) => {
          const isSelected = selectedFixture?.id === fixture.id;
          const isExpanded = expandedFixture === fixture.id;
          const allMarkets = getAvailableMarkets(fixture);
          const marketCategories = getMarketsByCategory(allMarkets);
          
          // Filter markets based on selected category
          const filteredMarkets = marketFilter === 'all' 
            ? allMarkets 
            : allMarkets.filter(m => m.category === marketFilter);
          
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
                      {allMarkets.length} markets
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

                {/* Teams Section */}
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

                {/* Quick Odds Preview - Enhanced */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 flex-wrap">
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

              {/* Enhanced Expandable Markets Section */}
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
                    <h4 className="text-white font-semibold text-sm mb-4">
                      Available Markets ({filteredMarkets.length})
                    </h4>
                    
                    {filteredMarkets.length > 0 ? (
                      <div className="space-y-6">
                        {/* Full Time Markets */}
                        {marketCategories.fulltime.length > 0 && (marketFilter === 'all' || marketFilter === 'fulltime') && (
                          <div>
                            <h5 className="text-gray-300 font-medium text-xs mb-3 uppercase tracking-wide">Full Time</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {marketCategories.fulltime.map((market, index) => (
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
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-lg">{market.icon}</span>
                                      <div className="font-semibold text-sm">{market.label}</div>
                                    </div>
                                    <div className="text-lg font-bold">{market.odds.toFixed(2)}</div>
                                    <div className="text-xs opacity-75 mt-1">{market.description}</div>
                                  </div>
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Half Time Markets */}
                        {marketCategories.halftime.length > 0 && (marketFilter === 'all' || marketFilter === 'halftime') && (
                          <div>
                            <h5 className="text-gray-300 font-medium text-xs mb-3 uppercase tracking-wide">Half Time</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {marketCategories.halftime.map((market, index) => (
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
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-lg">{market.icon}</span>
                                      <div className="font-semibold text-sm">{market.label}</div>
                                    </div>
                                    <div className="text-lg font-bold">{market.odds.toFixed(2)}</div>
                                    <div className="text-xs opacity-75 mt-1">{market.description}</div>
                                  </div>
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Goals Markets */}
                        {marketCategories.goals.length > 0 && (marketFilter === 'all' || marketFilter === 'goals') && (
                          <div>
                            <h5 className="text-gray-300 font-medium text-xs mb-3 uppercase tracking-wide">Goals</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {marketCategories.goals.map((market, index) => (
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
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-lg">{market.icon}</span>
                                      <div className="font-semibold text-sm">{market.label}</div>
                                    </div>
                                    <div className="text-lg font-bold">{market.odds.toFixed(2)}</div>
                                    <div className="text-xs opacity-75 mt-1">{market.description}</div>
                                  </div>
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        )}
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

export default EnhancedFixtureSelector;

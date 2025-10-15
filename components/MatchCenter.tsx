"use client";

import { useState, useEffect } from 'react';
import { 
  ClockIcon,
  MapPinIcon,
  UsersIcon,
  ChartBarIcon,
  TrophyIcon,
  FireIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

interface Match {
  fixtureId: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  league: string;
  leagueLogo?: string;
  venue: string;
  matchDate: string;
  status: 'upcoming' | 'live' | 'finished';
  score?: {
    home: number;
    away: number;
  };
  events?: Array<{
    id: string;
    type: string;
    player: string;
    minute: number;
    team: 'home' | 'away';
  }>;
  pools?: Array<{
    poolId: string;
    title: string;
    odds: number;
    participants: number;
    totalStake: number;
  }>;
}

interface MatchCenterProps {
  fixtureId?: string;
  className?: string;
}

export default function MatchCenter({ fixtureId, className = "" }: MatchCenterProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming' | 'finished'>('live');

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        
        if (fixtureId) {
          // Fetch specific match
          const response = await fetch(`/api/match-center/fixture/${fixtureId}`, {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          if (data.success) {
            setMatches([data.data]);
            setSelectedMatch(data.data);
          }
        } else {
          // Fetch live matches
          const response = await fetch('/api/match-center/live', {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          if (data.success) {
            setMatches(data.data.matches || []);
          }
        }
      } catch (err) {
        console.error('Error fetching matches:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch matches');
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
    
    // Refresh every 30 seconds for live updates
    const interval = setInterval(fetchMatches, 30000);
    return () => clearInterval(interval);
  }, [fixtureId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'upcoming':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'finished':
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live':
        return <FireIcon className="w-4 h-4 animate-pulse" />;
      case 'upcoming':
        return <ClockIcon className="w-4 h-4" />;
      case 'finished':
        return <TrophyIcon className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toFixed(0);
  };

  const filteredMatches = matches.filter(match => {
    if (fixtureId) return true; // Show all if specific fixture
    return match.status === activeTab;
  });

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Match Center</h3>
          <div className="animate-pulse bg-gray-700 h-6 w-20 rounded"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/30 animate-pulse">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-gray-700 h-4 w-32 rounded"></div>
                <div className="bg-gray-700 h-4 w-16 rounded"></div>
              </div>
              <div className="bg-gray-700 h-6 w-48 rounded mb-2"></div>
              <div className="bg-gray-700 h-4 w-24 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Match Center</h3>
        </div>
        <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
          <ChartBarIcon className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-400 font-medium">Failed to load match data</p>
          <p className="text-red-300 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Match Center</h3>
        </div>
        <div className="p-6 bg-gray-800/30 border border-gray-700/30 rounded-lg text-center">
          <TrophyIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-400 font-medium">No matches available</p>
          <p className="text-gray-500 text-sm mt-1">
            {fixtureId ? 'This fixture is not available.' : 'No matches found for the selected filter.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Match Center</h3>
        {!fixtureId && (
          <div className="flex items-center gap-1 bg-gray-800/30 rounded-lg p-1">
            {(['live', 'upcoming', 'finished'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Matches Grid */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredMatches.map((match, index) => (
            <motion.div
              key={match.fixtureId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 bg-gray-800/30 rounded-lg border transition-all group cursor-pointer ${
                selectedMatch?.fixtureId === match.fixtureId
                  ? 'border-purple-500/50 bg-purple-500/10'
                  : 'border-gray-700/30 hover:border-gray-600/50'
              }`}
              onClick={() => setSelectedMatch(match)}
            >
              {/* Match Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center">
                    <TrophyIcon className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">{match.league}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPinIcon className="w-3 h-3" />
                      {match.venue}
                    </div>
                  </div>
                </div>
                
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(match.status)}`}>
                  {getStatusIcon(match.status)}
                  {match.status.toUpperCase()}
                </div>
              </div>

              {/* Teams and Score */}
              <div className="mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-medium text-white">{match.homeTeam}</div>
                      <div className="text-xs text-gray-400">Home</div>
                    </div>
                    {match.homeTeamLogo && (
                      <img 
                        src={match.homeTeamLogo} 
                        alt={match.homeTeam}
                        className="w-6 h-6 rounded-full"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {match.score ? `${match.score.home} - ${match.score.away}` : 'VS'}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatTime(match.matchDate)} • {formatDate(match.matchDate)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {match.awayTeamLogo && (
                      <img 
                        src={match.awayTeamLogo} 
                        alt={match.awayTeam}
                        className="w-6 h-6 rounded-full"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="text-left">
                      <div className="text-sm font-medium text-white">{match.awayTeam}</div>
                      <div className="text-xs text-gray-400">Away</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Events */}
              {match.events && match.events.length > 0 && (
                <div className="mb-3 p-2 bg-gray-700/20 rounded-lg">
                  <div className="text-xs text-gray-400 mb-1">Recent Events</div>
                  <div className="space-y-1">
                    {match.events.slice(0, 3).map((event) => (
                      <div key={event.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            event.team === 'home' ? 'bg-blue-400' : 'bg-red-400'
                          }`}></div>
                          <span className="text-gray-300">{event.player}</span>
                        </div>
                        <div className="text-gray-400">
                          {event.type} {event.minute}&apos;
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pools */}
              {match.pools && match.pools.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs text-gray-400 mb-2">Prediction Pools ({match.pools.length})</div>
                  <div className="grid grid-cols-2 gap-2">
                    {match.pools.slice(0, 2).map((pool) => (
                      <div key={pool.poolId} className="p-2 bg-gray-700/20 rounded-lg">
                        <div className="text-xs font-medium text-white truncate">{pool.title}</div>
                        <div className="flex items-center justify-between mt-1">
                          <div className="text-xs text-gray-400">
                            {formatCurrency(pool.totalStake)} STT
                          </div>
                          <div className="text-xs text-purple-400">
                            {(pool.odds / 100).toFixed(2)}x
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-4">
                  {match.pools && (
                    <div className="flex items-center gap-1">
                      <ChartBarIcon className="w-3 h-3" />
                      <span>{match.pools.length} pools</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <UsersIcon className="w-3 h-3" />
                    <span>
                      {match.pools?.reduce((sum, pool) => sum + pool.participants, 0) || 0} participants
                    </span>
                  </div>
                </div>
                <div className="text-gray-500 group-hover:text-gray-400 transition-colors">
                  Click for details →
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Match Details Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-xl border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Match Details</h2>
                <button
                  onClick={() => setSelectedMatch(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <EyeIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Match Header */}
              <div className="mb-6 p-4 bg-gray-800/30 rounded-lg border border-gray-700/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">{selectedMatch.homeTeam}</div>
                      <div className="text-xs text-gray-400">Home</div>
                    </div>
                    <div className="text-3xl font-bold text-white">
                      {selectedMatch.score ? `${selectedMatch.score.home} - ${selectedMatch.score.away}` : 'VS'}
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">{selectedMatch.awayTeam}</div>
                      <div className="text-xs text-gray-400">Away</div>
                    </div>
                  </div>
                  
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium border ${getStatusColor(selectedMatch.status)}`}>
                    {getStatusIcon(selectedMatch.status)}
                    {selectedMatch.status.toUpperCase()}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">League:</span>
                    <div className="text-white font-medium">{selectedMatch.league}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Venue:</span>
                    <div className="text-white font-medium">{selectedMatch.venue}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Date & Time:</span>
                    <div className="text-white font-medium">
                      {formatDate(selectedMatch.matchDate)} at {formatTime(selectedMatch.matchDate)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Events */}
              {selectedMatch.events && selectedMatch.events.length > 0 && (
                <div className="mb-6 p-4 bg-gray-800/30 rounded-lg border border-gray-700/30">
                  <h3 className="text-lg font-semibold text-white mb-3">Match Events</h3>
                  <div className="space-y-2">
                    {selectedMatch.events.map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-2 bg-gray-700/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            event.team === 'home' ? 'bg-blue-400' : 'bg-red-400'
                          }`}></div>
                          <span className="text-white font-medium">{event.player}</span>
                          <span className="text-gray-400">{event.type}</span>
                        </div>
                        <div className="text-gray-400 font-medium">{event.minute}&apos;</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pools */}
              {selectedMatch.pools && selectedMatch.pools.length > 0 && (
                <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/30">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Prediction Pools ({selectedMatch.pools.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedMatch.pools.map((pool) => (
                      <div key={pool.poolId} className="p-3 bg-gray-700/20 rounded-lg border border-gray-600/20">
                        <div className="text-sm font-medium text-white mb-2">{pool.title}</div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-gray-400">Odds:</span>
                            <div className="text-purple-400 font-medium">{(pool.odds / 100).toFixed(2)}x</div>
                          </div>
                          <div>
                            <span className="text-gray-400">Participants:</span>
                            <div className="text-white font-medium">{pool.participants}</div>
                          </div>
                          <div>
                            <span className="text-gray-400">Total Stake:</span>
                            <div className="text-white font-medium">{formatCurrency(pool.totalStake)} STT</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

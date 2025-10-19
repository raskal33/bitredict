"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

interface MatchData {
  marketId: string;
  teams?: {
    home?: string | { name: string; logo?: string };
    away?: string | { name: string; logo?: string };
  };
  match?: {
    date?: string;
    venue?: string;
    league?: string | { name: string };
    status?: string;
    referee?: string;
  };
  score?: {
    home?: number;
    away?: number;
    current?: string;
  };
  goalScorers?: Array<{
    player: string;
    minute: number;
    team: 'home' | 'away';
  }>;
  events?: Array<{
    type: string;
    player: string;
    minute: number;
    team: 'home' | 'away';
  }>;
  pools?: Array<{
    poolId: string;
    title: string;
    odds: number;
  }>;
}

interface MatchCenterProps {
  fixtureId?: string;
  marketId?: string;
  className?: string;
}

export default function MatchCenter({ fixtureId, marketId, className = "" }: MatchCenterProps) {
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Prioritize fixtureId (SportMonks fixture ID) over marketId
        const id = fixtureId || marketId;
        const isFixtureId = !!fixtureId;
        
        if (!id) {
          setError('No match ID provided');
          setLoading(false);
          return;
        }
        
        console.log('🔍 MatchCenter fetching data for ID:', { id, isFixtureId, type: isFixtureId ? 'fixture' : 'market' });
        
        // Use fixture endpoint if fixtureId is provided, otherwise use market endpoint
        // CRITICAL: Use absolute backend URL, not relative path which calls frontend domain
        const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://bitredict-backend.fly.dev';
        const endpoint = isFixtureId 
          ? `${backendUrl}/api/match-center/fixture/${id}?t=${Date.now()}`
          : `${backendUrl}/api/match-center/market/${id}?t=${Date.now()}`;
        
        const response = await fetch(endpoint, {
          method: 'GET'
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            console.log('ℹ️ Match data not found for ID:', id);
            setError(null); // Don't show error for missing data
            setLoading(false);
            return;
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ Match data fetched:', data);
        
        if (data.success && data.data && Object.keys(data.data).length > 0) {
          setMatchData(data.data);
        } else if (!data.success) {
          setError(data.message || 'Failed to fetch match data');
        }
      } catch (err) {
        console.error('❌ Error fetching match data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch match data');
      } finally {
        setLoading(false);
      }
    };

    fetchMatchData();
    
    // Refresh every 30 seconds for live matches
    const interval = setInterval(fetchMatchData, 30000);
    return () => clearInterval(interval);
  }, [fixtureId, marketId]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-6 bg-gray-800/30 rounded-xl border border-gray-700/30 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
        <p className="ml-3 text-gray-400">Loading match data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 ${className}`}>
        <p className="font-medium">Error: {error}</p>
      </div>
    );
  }

  if (!matchData) {
    return null;
  }

  const homeTeam = typeof matchData.teams?.home === 'string' 
    ? matchData.teams.home 
    : matchData.teams?.home?.name || 'Home Team';
  const awayTeam = typeof matchData.teams?.away === 'string' 
    ? matchData.teams.away 
    : matchData.teams?.away?.name || 'Away Team';
  const homeTeamLogo = typeof matchData.teams?.home === 'object' 
    ? matchData.teams.home?.logo 
    : undefined;
  const awayTeamLogo = typeof matchData.teams?.away === 'object' 
    ? matchData.teams.away?.logo 
    : undefined;
  const score = matchData.score;
  const matchStatus = matchData.match?.status || 'NS';
  const league = typeof matchData.match?.league === 'string' 
    ? matchData.match.league 
    : matchData.match?.league?.name || '';
  const venue = matchData.match?.venue || '';
  const matchDate = matchData.match?.date;

  // Format goal scorers
  const goalScorers = matchData.goalScorers || [];
  const homeGoals = goalScorers.filter(g => g.team === 'home');
  const awayGoals = goalScorers.filter(g => g.team === 'away');

  // Status badge
  const getStatusDisplay = () => {
    switch (matchStatus) {
      case 'FT':
        return { text: 'FT', color: 'bg-gray-600 text-white', icon: '⏱️' };
      case 'LIVE':
      case 'LI':
        return { text: 'LIVE', color: 'bg-red-600 text-white animate-pulse', icon: '🔴' };
      case 'NS':
        return { text: 'NS', color: 'bg-gray-500 text-white', icon: '⏰' };
      default:
        return { text: matchStatus, color: 'bg-gray-600 text-white', icon: '⏱️' };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`glass-card overflow-hidden border border-gray-700/30 ${className}`}
    >
      {/* Header with League and Status */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-800/50 to-gray-700/30 border-b border-gray-700/30">
        <div className="flex items-center gap-2">
          {league && <span className="text-xs sm:text-sm font-semibold text-gray-300">{league}</span>}
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${statusDisplay.color}`}>
          {statusDisplay.icon} {statusDisplay.text}
        </div>
      </div>

      {/* Main Match Card */}
      <div className="p-6 space-y-4">
        {/* Teams and Score */}
        <div className="flex items-center justify-between gap-4">
          {/* Home Team */}
          <div className="flex flex-col items-center gap-2 flex-1">
            {homeTeamLogo && typeof homeTeamLogo === 'string' && homeTeamLogo.trim() && homeTeamLogo.startsWith('http') && (
              <Image 
                src={homeTeamLogo} 
                alt={homeTeam || 'Home Team'}
                width={64}
                height={64}
                className="w-14 h-14 sm:w-16 sm:h-16 object-contain rounded-lg"
              />
            )}
            <p className="text-sm sm:text-base font-semibold text-white text-center line-clamp-2">
              {homeTeam}
            </p>
          </div>

          {/* Score */}
          <div className="flex flex-col items-center gap-1">
            <div className="text-3xl sm:text-4xl font-bold text-white">
              {score?.current || `${score?.home || 0}-${score?.away || 0}`}
            </div>
            {matchDate && (
              <p className="text-xs text-gray-400">
                {new Date(matchDate).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            )}
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center gap-2 flex-1">
            {awayTeamLogo && typeof awayTeamLogo === 'string' && awayTeamLogo.trim() && awayTeamLogo.startsWith('http') && (
              <Image 
                src={awayTeamLogo} 
                alt={awayTeam || 'Away Team'}
                width={64}
                height={64}
                className="w-14 h-14 sm:w-16 sm:h-16 object-contain rounded-lg"
              />
            )}
            <p className="text-sm sm:text-base font-semibold text-white text-center line-clamp-2">
              {awayTeam}
            </p>
          </div>
        </div>

        {/* Venue Info */}
        {venue && (
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <MapPinIcon className="w-4 h-4" />
            <span>{venue}</span>
          </div>
        )}

        {/* Match Metadata */}
        <div className="flex items-center justify-center gap-4 text-xs text-gray-400 pt-2">
          {league && (
            <div className="flex items-center gap-1">
              <span>📊</span>
              <span>{typeof league === 'string' ? league : league?.name || ''}</span>
            </div>
          )}
          {matchData.match?.referee && (
            <div className="flex items-center gap-1">
              <span>👮</span>
              <span>{matchData.match.referee}</span>
            </div>
          )}
        </div>

        {/* Goal Scorers */}
        {(homeGoals.length > 0 || awayGoals.length > 0) && (
          <div className="pt-4 border-t border-gray-700/30 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase">Goal Scorers</p>
            
            <div className="space-y-2">
              {/* Home Goal Scorers */}
              {homeGoals.map((goal, idx) => (
                <div key={`home-${idx}`} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">⚽</span>
                    <span className="text-gray-300">{goal.player}</span>
                  </div>
                  <span className="text-gray-500">{goal.minute}&apos;</span>
                </div>
              ))}

              {/* Away Goal Scorers */}
              {awayGoals.map((goal, idx) => (
                <div key={`away-${idx}`} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400">⚽</span>
                    <span className="text-gray-300">{goal.player}</span>
                  </div>
                  <span className="text-gray-500">{goal.minute}&apos;</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Associated Pools */}
        {matchData.pools && matchData.pools.length > 0 && (
          <div className="pt-4 border-t border-gray-700/30 space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase">Related Pools ({matchData.pools.length})</p>
            <div className="text-xs text-gray-400">
              <p>Prediction pools available for this match</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

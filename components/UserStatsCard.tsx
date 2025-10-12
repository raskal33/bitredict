"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrophyIcon, 
  FireIcon, 
  ChartBarIcon,
  StarIcon,
  CalendarDaysIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import { 
  TrophyIcon as TrophySolid,
  StarIcon as StarSolid
} from '@heroicons/react/24/solid';

interface UserStats {
  totalSlips: number;
  totalWins: number;
  bestScore: number;
  averageScore: number;
  winRate: number;
  currentStreak: number;
  bestStreak: number;
  lastActiveCycle: number;
}

interface UserStatsCardProps {
  userStats: UserStats;
  currentCycle?: number;
}

export default function UserStatsCard({ userStats, currentCycle }: UserStatsCardProps) {
  // Calculate achievement levels
  const getStreakLevel = (streak: number) => {
    if (streak >= 10) return { level: 'legendary', color: 'text-purple-400', bgColor: 'bg-purple-500/10' };
    if (streak >= 5) return { level: 'expert', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' };
    if (streak >= 3) return { level: 'skilled', color: 'text-blue-400', bgColor: 'bg-blue-500/10' };
    return { level: 'novice', color: 'text-green-400', bgColor: 'bg-green-500/10' };
  };

  const getWinRateLevel = (winRate: number) => {
    if (winRate >= 80) return { level: 'champion', color: 'text-purple-400', icon: TrophySolid };
    if (winRate >= 60) return { level: 'expert', color: 'text-yellow-400', icon: StarSolid };
    if (winRate >= 40) return { level: 'skilled', color: 'text-blue-400', icon: StarIcon };
    return { level: 'learning', color: 'text-green-400', icon: ChartBarIcon };
  };

  const streakLevel = getStreakLevel(userStats.currentStreak);
  const winRateLevel = getWinRateLevel(userStats.winRate);
  const isActive = currentCycle ? userStats.lastActiveCycle >= currentCycle - 2 : true;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 border border-gray-600/30"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            {React.createElement(winRateLevel.icon, { 
              className: `w-6 h-6 ${winRateLevel.color}` 
            })}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Player Stats</h3>
            <p className="text-sm text-gray-400 capitalize">{winRateLevel.level} Level</p>
          </div>
        </div>
        
        {isActive && (
          <div className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-xs font-medium">
            Active
          </div>
        )}
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-white mb-1">
            {userStats.totalSlips}
          </div>
          <div className="text-sm text-gray-400">Total Slips</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400 mb-1">
            {userStats.totalWins}
          </div>
          <div className="text-sm text-gray-400">Wins</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-primary mb-1">
            {userStats.winRate.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-400">Win Rate</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-accent mb-1">
            {(userStats.averageScore / 100).toFixed(1)}
          </div>
          <div className="text-sm text-gray-400">Avg Score</div>
        </div>
      </div>

      {/* Streaks Section */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${streakLevel.bgColor} flex items-center justify-center`}>
              <FireIcon className={`w-5 h-5 ${streakLevel.color}`} />
            </div>
            <div>
              <div className="text-sm font-medium text-white">Current Streak</div>
              <div className="text-xs text-gray-400 capitalize">{streakLevel.level}</div>
            </div>
          </div>
          <div className={`text-xl font-bold ${streakLevel.color}`}>
            {userStats.currentStreak}
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <TrophyIcon className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-white">Best Streak</div>
              <div className="text-xs text-gray-400">Personal record</div>
            </div>
          </div>
          <div className="text-xl font-bold text-yellow-400">
            {userStats.bestStreak}
          </div>
        </div>
      </div>

      {/* Performance Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Performance</h4>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BoltIcon className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-300">Best Score</span>
          </div>
          <span className="text-sm font-medium text-blue-400">
            {(userStats.bestScore / 100).toFixed(1)} pts
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300">Last Active</span>
          </div>
          <span className="text-sm font-medium text-gray-400">
            Cycle {userStats.lastActiveCycle}
          </span>
        </div>

        {/* Win Rate Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Win Rate Progress</span>
            <span className="text-xs text-gray-400">{userStats.winRate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-700/50 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(userStats.winRate, 100)}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className={`h-2 rounded-full bg-gradient-to-r ${
                userStats.winRate >= 80 ? 'from-purple-500 to-pink-500' :
                userStats.winRate >= 60 ? 'from-yellow-500 to-orange-500' :
                userStats.winRate >= 40 ? 'from-blue-500 to-cyan-500' :
                'from-green-500 to-emerald-500'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Achievement Badges */}
      {(userStats.bestStreak >= 5 || userStats.winRate >= 70 || userStats.totalWins >= 10) && (
        <div className="mt-6 pt-4 border-t border-gray-700/30">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Achievements</h4>
          <div className="flex flex-wrap gap-2">
            {userStats.bestStreak >= 10 && (
              <div className="px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-xs font-medium">
                🔥 Streak Legend
              </div>
            )}
            {userStats.bestStreak >= 5 && userStats.bestStreak < 10 && (
              <div className="px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full text-xs font-medium">
                🔥 Streak Master
              </div>
            )}
            {userStats.winRate >= 80 && (
              <div className="px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-xs font-medium">
                👑 Champion
              </div>
            )}
            {userStats.winRate >= 70 && userStats.winRate < 80 && (
              <div className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-medium">
                ⭐ Expert
              </div>
            )}
            {userStats.totalWins >= 20 && (
              <div className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-xs font-medium">
                🏆 Veteran
              </div>
            )}
            {userStats.totalWins >= 10 && userStats.totalWins < 20 && (
              <div className="px-3 py-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-full text-xs font-medium">
                🎯 Skilled
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

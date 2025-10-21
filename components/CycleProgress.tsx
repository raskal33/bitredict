"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ClockIcon, 
  CheckCircleIcon,
  PlayIcon,
  PauseIcon,
  TrophyIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { formatEther } from 'viem';

interface CycleInfo {
  cycleId: bigint;
  state: number; // 0=NotStarted, 1=Active, 2=Ended, 3=Resolved
  startTime: bigint;
  endTime: bigint;
  prizePool: bigint;
  slipCount: bigint;
  evaluatedSlips: bigint;
  hasWinner: boolean;
  rolloverAmount?: bigint; // Added rollover amount for display
}

interface CycleProgressProps {
  cycleInfo: CycleInfo;
  className?: string;
}

export default function CycleProgress({ cycleInfo, className = "" }: CycleProgressProps) {
  const getStateInfo = (state: number) => {
    switch (state) {
      case 0: return { 
        text: 'Not Started', 
        color: 'text-gray-400', 
        bgColor: 'bg-gray-500/10',
        icon: PauseIcon 
      };
      case 1: return { 
        text: 'Active', 
        color: 'text-green-400', 
        bgColor: 'bg-green-500/10',
        icon: PlayIcon 
      };
      case 2: return { 
        text: 'Ended', 
        color: 'text-yellow-400', 
        bgColor: 'bg-yellow-500/10',
        icon: ClockIcon 
      };
      case 3: return { 
        text: 'Resolved', 
        color: 'text-blue-400', 
        bgColor: 'bg-blue-500/10',
        icon: CheckCircleIcon 
      };
      default: return { 
        text: 'Unknown', 
        color: 'text-gray-400', 
        bgColor: 'bg-gray-500/10',
        icon: PauseIcon 
      };
    }
  };

  const stateInfo = getStateInfo(cycleInfo.state);
  const evaluationProgress = Number(cycleInfo.slipCount) > 0 
    ? (Number(cycleInfo.evaluatedSlips) / Number(cycleInfo.slipCount)) * 100 
    : 0;

  const formatTime = (timestamp: bigint) => {
    if (timestamp === BigInt(0)) return 'TBD';
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getTimeRemaining = () => {
    if (cycleInfo.state !== 1 || cycleInfo.endTime === BigInt(0)) return null;
    
    const now = Math.floor(Date.now() / 1000);
    const endTime = Number(cycleInfo.endTime);
    const remaining = endTime - now;
    
    if (remaining <= 0) return 'Ended';
    
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    
    return `${hours}h ${minutes}m`;
  };

  const timeRemaining = getTimeRemaining();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-6 border border-gray-600/30 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full ${stateInfo.bgColor} flex items-center justify-center`}>
            {React.createElement(stateInfo.icon, { className: `w-6 h-6 ${stateInfo.color}` })}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Cycle #{Number(cycleInfo.cycleId)}
            </h3>
            <p className={`text-sm font-medium ${stateInfo.color}`}>
              {stateInfo.text}
            </p>
          </div>
        </div>
        
        {cycleInfo.hasWinner && (
          <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-xs font-medium">
            <TrophyIcon className="w-4 h-4" />
            Winner Found
          </div>
        )}
      </div>

      {/* Time Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <PlayIcon className="w-4 h-4" />
            Started
          </div>
          <div className="text-sm font-medium text-white">
            {formatTime(cycleInfo.startTime)}
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <ClockIcon className="w-4 h-4" />
            {cycleInfo.state === 1 ? 'Time Remaining' : 'Ends'}
          </div>
          <div className="text-sm font-medium text-white">
            {timeRemaining || formatTime(cycleInfo.endTime)}
          </div>
        </div>
      </div>

      {/* Mobile-responsive Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="text-center p-2 sm:p-3 bg-gray-800/30 rounded-lg">
          <div className="text-lg sm:text-xl font-bold text-primary mb-1">
            {formatEther(cycleInfo.prizePool)}
          </div>
          <div className="text-xs text-gray-400">Prize Pool (STT)</div>
          {cycleInfo.rolloverAmount && cycleInfo.rolloverAmount > 0n && (
            <div className="text-xs text-green-400 mt-1">
              +{formatEther(cycleInfo.rolloverAmount)} rollover
            </div>
          )}
        </div>
        
        <div className="text-center p-2 sm:p-3 bg-gray-800/30 rounded-lg">
          <div className="text-lg sm:text-xl font-bold text-secondary mb-1">
            {Number(cycleInfo.slipCount)}
          </div>
          <div className="text-xs text-gray-400">Total Slips</div>
        </div>
        
        <div className="text-center p-2 sm:p-3 bg-gray-800/30 rounded-lg">
          <div className="text-lg sm:text-xl font-bold text-accent mb-1">
            {Number(cycleInfo.evaluatedSlips)}
          </div>
          <div className="text-xs text-gray-400">Evaluated</div>
        </div>
        
        <div className="text-center p-2 sm:p-3 bg-gray-800/30 rounded-lg">
          <div className="text-lg sm:text-xl font-bold text-warning mb-1">
            {cycleInfo.rolloverAmount && cycleInfo.rolloverAmount > 0n ? 'Yes' : 'No'}
          </div>
          <div className="text-xs text-gray-400">Rollover</div>
        </div>
      </div>

      {/* Evaluation Progress */}
      {Number(cycleInfo.slipCount) > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DocumentTextIcon className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-gray-300">Evaluation Progress</span>
            </div>
            <span className="text-sm font-medium text-blue-400">
              {evaluationProgress.toFixed(1)}%
            </span>
          </div>
          
          <div className="w-full bg-gray-700/50 rounded-full h-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${evaluationProgress}%` }}
              transition={{ duration: 1, delay: 0.3 }}
              className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 relative overflow-hidden"
            >
              {evaluationProgress > 0 && (
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    ease: "linear" 
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                />
              )}
            </motion.div>
          </div>
          
          <div className="text-xs text-gray-400 text-center">
            {Number(cycleInfo.evaluatedSlips)} of {Number(cycleInfo.slipCount)} slips evaluated
          </div>
        </div>
      )}

      {/* Status Messages */}
      {cycleInfo.state === 1 && timeRemaining && (
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <PlayIcon className="w-4 h-4" />
            <span className="font-medium">Cycle is active!</span>
          </div>
          <div className="text-xs text-green-300 mt-1">
            You can still place slips for {timeRemaining}
          </div>
        </div>
      )}

      {cycleInfo.state === 2 && evaluationProgress < 100 && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-400 text-sm">
            <ClockIcon className="w-4 h-4" />
            <span className="font-medium">Evaluation in progress...</span>
          </div>
          <div className="text-xs text-yellow-300 mt-1">
            Results will be available once all slips are evaluated
          </div>
        </div>
      )}

      {cycleInfo.state === 3 && (
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-blue-400 text-sm">
            <CheckCircleIcon className="w-4 h-4" />
            <span className="font-medium">Cycle completed!</span>
          </div>
          <div className="text-xs text-blue-300 mt-1">
            {cycleInfo.hasWinner 
              ? "Winners can claim their prizes" 
              : "Check the leaderboard for final results"
            }
          </div>
        </div>
      )}
    </motion.div>
  );
}

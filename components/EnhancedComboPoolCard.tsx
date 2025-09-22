'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CubeIcon,
  UserGroupIcon,
  ClockIcon,
  CurrencyDollarIcon,
  TrophyIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import Button from '@/components/button';
import { formatEther } from 'viem';

interface ComboPool {
  id: string;
  title: string;
  description: string;
  creator: string;
  creatorStake: string;
  maxBetPerUser: string;
  useBitr: boolean;
  isPrivate: boolean;
  conditions: Array<{
    id: string;
    type: 'football' | 'crypto';
    market: string;
    odds: number;
    selection: 'YES' | 'NO';
    description: string;
    homeTeam?: string;
    awayTeam?: string;
    league?: string;
    symbol?: string;
    name?: string;
    currentPrice?: number;
  }>;
  combinedOdds: number;
  totalBets: number;
  totalVolume: string;
  maxBettors: number;
  currentBettors: number;
  eventStartTime: string;
  eventEndTime: string;
  bettingEndTime: string;
  status: 'active' | 'ended' | 'settled';
  isResolved: boolean;
}

interface EnhancedComboPoolCardProps {
  pool: ComboPool;
  onBet?: (poolId: string) => void;
  onView?: (poolId: string) => void;
  className?: string;
}

export default function EnhancedComboPoolCard({ 
  pool, 
  onBet, 
  onView, 
  className = '' 
}: EnhancedComboPoolCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');

  // Calculate progress
  const progressPercentage = pool.maxBettors > 0 
    ? (pool.currentBettors / pool.maxBettors) * 100 
    : 0;

  // Calculate potential winnings
  const potentialWinnings = parseFloat(formatEther(BigInt(pool.creatorStake))) * (pool.combinedOdds - 1);

  // Update time left
  useEffect(() => {
    const updateTimeLeft = () => {
      const now = new Date().getTime();
      const endTime = new Date(pool.bettingEndTime).getTime();
      const timeDiff = endTime - now;

      if (timeDiff <= 0) {
        setTimeLeft('Betting ended');
        return;
      }

      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m`);
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [pool.bettingEndTime]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-success bg-success/10 border-success/20';
      case 'ended':
        return 'text-warning bg-warning/10 border-warning/20';
      case 'settled':
        return 'text-text-muted bg-text-muted/10 border-text-muted/20';
      default:
        return 'text-text-muted bg-text-muted/10 border-text-muted/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'ended':
        return <ClockIcon className="h-4 w-4" />;
      case 'settled':
        return <TrophyIcon className="h-4 w-4" />;
      default:
        return <ExclamationTriangleIcon className="h-4 w-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card border border-border-card hover:border-primary/30 transition-all duration-300 ${className}`}
    >
      {/* Header */}
      <div className="p-6 border-b border-border-card">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <CubeIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">{pool.title}</h3>
                <p className="text-sm text-text-muted">Combo Pool #{pool.id}</p>
              </div>
            </div>
            <p className="text-text-secondary text-sm mb-3">{pool.description}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(pool.status)}`}>
              {getStatusIcon(pool.status)}
              <span className="capitalize">{pool.status}</span>
            </div>
            {pool.isPrivate && (
              <div className="px-3 py-1 rounded-full text-xs font-medium border border-accent/20 bg-accent/10 text-accent">
                Private
              </div>
            )}
          </div>
        </div>

        {/* Pool Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-text-muted text-xs">Conditions</label>
            <p className="text-text-primary font-semibold">{pool.conditions.length}</p>
          </div>
          <div>
            <label className="text-text-muted text-xs">Combined Odds</label>
            <p className="text-primary font-bold text-lg">{pool.combinedOdds.toFixed(2)}x</p>
          </div>
          <div>
            <label className="text-text-muted text-xs">Creator Stake</label>
            <p className="text-text-primary font-semibold">
              {parseFloat(formatEther(BigInt(pool.creatorStake))).toFixed(2)} {pool.useBitr ? 'BITR' : 'STT'}
            </p>
          </div>
          <div>
            <label className="text-text-muted text-xs">Potential Win</label>
            <p className="text-success font-bold text-lg">
              {potentialWinnings.toFixed(2)} {pool.useBitr ? 'BITR' : 'STT'}
            </p>
          </div>
        </div>
      </div>

      {/* Conditions Preview */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-text-primary">Conditions</h4>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
          >
            {showDetails ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            <span className="text-sm">{showDetails ? 'Hide' : 'Show'} Details</span>
          </button>
        </div>

        {showDetails ? (
          <div className="space-y-3">
            {pool.conditions.map((condition, index) => (
              <motion.div
                key={condition.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-bg-card/50 rounded-lg border border-border-input"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-semibold">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-text-primary">
                      {condition.type === 'football' 
                        ? `${condition.homeTeam} vs ${condition.awayTeam}` 
                        : `${condition.symbol} - ${condition.name}`
                      }
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-primary font-semibold">{condition.odds}x</p>
                    <p className="text-xs text-text-muted">{condition.type}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary">{condition.market}</p>
                    <p className="text-xs text-text-muted">{condition.description}</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    condition.selection === 'YES' 
                      ? 'bg-success/10 text-success' 
                      : 'bg-error/10 text-error'
                  }`}>
                    {condition.selection}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {pool.conditions.slice(0, 3).map((condition) => (
              <div key={condition.id} className="px-3 py-1 bg-bg-card/50 rounded-full text-xs text-text-secondary">
                {condition.type === 'football' 
                  ? `${condition.homeTeam} vs ${condition.awayTeam}` 
                  : `${condition.symbol}`
                }
              </div>
            ))}
            {pool.conditions.length > 3 && (
              <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs">
                +{pool.conditions.length - 3} more
              </div>
            )}
          </div>
        )}
      </div>

      {/* Betting Progress */}
      {pool.maxBettors > 0 && (
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-text-muted">Bettor Progress</span>
            <span className="text-text-primary font-medium">
              {pool.currentBettors} / {pool.maxBettors}
            </span>
          </div>
          <div className="w-full bg-bg-card rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-6 border-t border-border-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-text-muted">
            <div className="flex items-center gap-1">
              <ClockIcon className="h-4 w-4" />
              <span>{timeLeft}</span>
            </div>
            <div className="flex items-center gap-1">
              <UserGroupIcon className="h-4 w-4" />
              <span>{pool.currentBettors} bettors</span>
            </div>
            <div className="flex items-center gap-1">
              <CurrencyDollarIcon className="h-4 w-4" />
              <span>{parseFloat(formatEther(BigInt(pool.totalVolume))).toFixed(2)} {pool.useBitr ? 'BITR' : 'STT'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onView && (
              <Button
                onClick={() => onView(pool.id)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                View Pool
                <ArrowRightIcon className="h-4 w-4" />
              </Button>
            )}
            {onBet && pool.status === 'active' && (
              <Button
                onClick={() => onBet(pool.id)}
                variant="primary"
                size="sm"
                className="flex items-center gap-2"
              >
                Place Bet
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

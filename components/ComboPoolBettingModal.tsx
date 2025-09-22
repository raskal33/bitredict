'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { 
  XMarkIcon,
  CubeIcon,
  CalculatorIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import Button from '@/components/button';
import AmountInput from '@/components/AmountInput';
import { formatEther } from 'viem';

interface ComboCondition {
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
}

interface ComboPoolBettingModalProps {
  poolId: string;
  title: string;
  description: string;
  conditions: ComboCondition[];
  combinedOdds: number;
  creatorStake: string;
  maxBetPerUser: string;
  useBitr: boolean;
  currentBettors: number;
  maxBettors: number;
  bettingEndTime: string;
  onClose: () => void;
  onBet: (poolId: string, amount: string, isCreatorSide: boolean) => Promise<void>;
}

export default function ComboPoolBettingModal({
  poolId,
  title,
  description,
  conditions,
  combinedOdds,
  creatorStake,
  maxBetPerUser,
  useBitr,
  currentBettors,
  maxBettors,
  bettingEndTime,
  onClose,
  onBet
}: ComboPoolBettingModalProps) {
  const { address, isConnected } = useAccount();
  const [betAmount, setBetAmount] = useState('');
  const [isCreatorSide, setIsCreatorSide] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');

  // Calculate potential winnings
  const potentialWinnings = betAmount 
    ? parseFloat(betAmount) * (combinedOdds - 1)
    : 0;

  // Calculate progress
  const progressPercentage = maxBettors > 0 
    ? (currentBettors / maxBettors) * 100 
    : 0;

  // Update time left
  useEffect(() => {
    const updateTimeLeft = () => {
      const now = new Date().getTime();
      const endTime = new Date(bettingEndTime).getTime();
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
    const interval = setInterval(updateTimeLeft, 60000);

    return () => clearInterval(interval);
  }, [bettingEndTime]);

  const handleBet = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!betAmount || parseFloat(betAmount) <= 0) {
      toast.error('Please enter a valid bet amount');
      return;
    }

    if (parseFloat(betAmount) > parseFloat(formatEther(BigInt(maxBetPerUser)))) {
      toast.error(`Maximum bet amount is ${parseFloat(formatEther(BigInt(maxBetPerUser)))} ${useBitr ? 'BITR' : 'STT'}`);
      return;
    }

    setIsLoading(true);
    try {
      await onBet(poolId, betAmount, isCreatorSide);
      toast.success('Bet placed successfully!');
      onClose();
    } catch (error) {
      console.error('Error placing bet:', error);
      toast.error('Failed to place bet');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-4xl max-h-[90vh] overflow-y-auto glass-card border border-border-card"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-border-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <CubeIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text-primary">{title}</h2>
                  <p className="text-sm text-text-muted">Combo Pool #{poolId}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-card rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="text-text-secondary">{description}</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Pool Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-bg-card/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">{combinedOdds.toFixed(2)}x</div>
                <div className="text-sm text-text-muted">Combined Odds</div>
              </div>
              <div className="text-center p-4 bg-bg-card/50 rounded-lg">
                <div className="text-2xl font-bold text-text-primary">{conditions.length}</div>
                <div className="text-sm text-text-muted">Conditions</div>
              </div>
              <div className="text-center p-4 bg-bg-card/50 rounded-lg">
                <div className="text-2xl font-bold text-success">
                  {parseFloat(formatEther(BigInt(creatorStake))).toFixed(2)}
                </div>
                <div className="text-sm text-text-muted">Creator Stake ({useBitr ? 'BITR' : 'STT'})</div>
              </div>
              <div className="text-center p-4 bg-bg-card/50 rounded-lg">
                <div className="text-2xl font-bold text-warning">{timeLeft}</div>
                <div className="text-sm text-text-muted">Time Left</div>
              </div>
            </div>

            {/* Conditions */}
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-4">Pool Conditions</h3>
              <div className="space-y-3">
                {conditions.map((condition, index) => (
                  <motion.div
                    key={condition.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-bg-card/50 rounded-lg border border-border-input"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/20 text-primary rounded-full flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-text-primary">
                            {condition.type === 'football' 
                              ? `${condition.homeTeam} vs ${condition.awayTeam}` 
                              : `${condition.symbol} - ${condition.name}`
                            }
                          </div>
                          <div className="text-sm text-text-muted">{condition.league || condition.market}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-primary font-semibold">{condition.odds}x</div>
                        <div className={`text-xs px-2 py-1 rounded ${
                          condition.selection === 'YES' 
                            ? 'bg-success/10 text-success' 
                            : 'bg-error/10 text-error'
                        }`}>
                          {condition.selection}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-text-secondary">{condition.description}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Betting Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary">Place Your Bet</h3>
              
              {/* Bet Side Selection */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-3">
                  Choose Your Side
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setIsCreatorSide(true)}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      isCreatorSide
                        ? 'border-success bg-success/10 text-success'
                        : 'border-border-input bg-bg-card text-text-secondary hover:border-success/50'
                    }`}
                  >
                    <CheckCircleIcon className="h-8 w-8 mx-auto mb-2" />
                    <div className="font-semibold">Creator Side</div>
                    <div className="text-xs mt-1">All conditions must be correct</div>
                  </button>
                  <button
                    onClick={() => setIsCreatorSide(false)}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      !isCreatorSide
                        ? 'border-error bg-error/10 text-error'
                        : 'border-border-input bg-bg-card text-text-secondary hover:border-error/50'
                    }`}
                  >
                    <ExclamationTriangleIcon className="h-8 w-8 mx-auto mb-2" />
                    <div className="font-semibold">Contrarian Side</div>
                    <div className="text-xs mt-1">At least one condition wrong</div>
                  </button>
                </div>
              </div>

              {/* Bet Amount */}
              <div>
                <AmountInput
                  label="Bet Amount"
                  value={betAmount}
                  onChange={setBetAmount}
                  placeholder="100.0"
                  min={0.1}
                  max={parseFloat(formatEther(BigInt(maxBetPerUser)))}
                  step={0.1}
                  allowDecimals={true}
                  currency={useBitr ? 'BITR' : 'STT'}
                  help={`Maximum bet: ${parseFloat(formatEther(BigInt(maxBetPerUser)))} ${useBitr ? 'BITR' : 'STT'}`}
                />
              </div>

              {/* Potential Winnings */}
              {betAmount && (
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CalculatorIcon className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-text-primary">Potential Winnings</span>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {potentialWinnings.toFixed(2)} {useBitr ? 'BITR' : 'STT'}
                  </div>
                  <div className="text-sm text-text-muted">
                    Total return: {(parseFloat(betAmount) + potentialWinnings).toFixed(2)} {useBitr ? 'BITR' : 'STT'}
                  </div>
                </div>
              )}

              {/* Pool Progress */}
              <div className="p-4 bg-bg-card/50 rounded-lg">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-text-muted">Pool Progress</span>
                  <span className="text-text-primary font-medium">
                    {currentBettors} / {maxBettors} bettors
                  </span>
                </div>
                <div className="w-full bg-bg-card rounded-full h-2 mb-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-text-muted">
                  {maxBettors - currentBettors} spots remaining
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-border-card">
              <div className="text-sm text-text-muted">
                {!isConnected && 'Please connect your wallet to place a bet'}
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={onClose} variant="outline">
                  Cancel
                </Button>
                <Button
                  onClick={handleBet}
                  disabled={!isConnected || !betAmount || isLoading}
                  loading={isLoading}
                  variant="primary"
                  className="min-w-[120px]"
                >
                  {isLoading ? 'Placing Bet...' : 'Place Bet'}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

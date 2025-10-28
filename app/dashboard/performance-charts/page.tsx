"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { useUserPerformance } from "@/hooks/useAnalytics";
import { useMyProfile } from "@/hooks/useUserProfile";
import { formatSTT, formatPercentage } from "@/utils/formatters";
import {
  ChartBarIcon,
  TrophyIcon,
  BanknotesIcon,
  WalletIcon,
  SparklesIcon,
  FireIcon
} from "@heroicons/react/24/outline";

export default function Page() {
  const { address } = useAccount();
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const { data: performance, isLoading: perfLoading } = useUserPerformance(timeframe);
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  
  const isLoading = perfLoading || profileLoading;

  if (!address) {
    return (
      <div className="space-y-8">
        <div className="glass-card p-12 text-center">
          <ChartBarIcon className="h-16 w-16 text-text-muted mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-text-primary mb-2">Connect Your Wallet</h2>
          <p className="text-text-secondary">Please connect your wallet to view analytics</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="glass-card p-8">
          <div className="h-8 bg-card-bg rounded w-1/3 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-card p-6">
                <div className="h-12 w-12 bg-card-bg rounded-lg mb-4"></div>
                <div className="h-8 bg-card-bg rounded mb-2"></div>
                <div className="h-4 bg-card-bg rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!performance) {
    return (
      <div className="glass-card p-12 text-center">
        <h2 className="text-xl font-bold text-text-primary mb-2">No Analytics Data</h2>
        <p className="text-text-secondary">Start betting or creating pools to see your analytics</p>
      </div>
    );
  }

  const { creator, bettor, oddyssey, combined, trends } = performance;
  const winRate = profile?.stats?.wonBets && profile?.stats?.totalBets 
    ? (profile.stats.wonBets / profile.stats.totalBets) * 100 
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Performance Analytics
          </h1>
          <p className="text-text-secondary">
            Comprehensive insights into your prediction market activity
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {['7d', '30d', '90d', 'all'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf as '7d' | '30d' | '90d' | 'all')}
              className={`px-4 py-2 rounded-button text-sm font-medium transition-all duration-200 ${
                timeframe === tf
                  ? 'bg-gradient-primary text-black'
                  : 'glass-card text-text-secondary hover:text-text-primary'
              }`}
            >
              {tf === 'all' ? 'All Time' : tf.toUpperCase()}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            title: "Total Activity",
            value: combined.totalActivity.toString(),
            subtitle: "Actions Taken",
            icon: <SparklesIcon className="h-6 w-6" />,
            color: "text-cyan-400",
            bgColor: "bg-cyan-500/10",
            borderColor: "border-cyan-500/20"
          },
          {
            title: "Total Volume",
            value: formatSTT(combined.totalVolume),
            subtitle: "Across All Activities",
            icon: <BanknotesIcon className="h-6 w-6" />,
            color: "text-green-400",
            bgColor: "bg-green-500/10",
            borderColor: "border-green-500/20"
          },
          {
            title: "Win Rate",
            value: formatPercentage(winRate),
            subtitle: "Overall Success Rate",
            icon: <TrophyIcon className="h-6 w-6" />,
            color: "text-yellow-400",
            bgColor: "bg-yellow-500/10",
            borderColor: "border-yellow-500/20"
          }
        ].map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            className={`glass-card p-6 ${metric.bgColor} ${metric.borderColor} border`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${metric.bgColor} ${metric.borderColor} border`}>
                <div className={metric.color}>
                  {metric.icon}
                </div>
              </div>
            </div>
            <div className="text-3xl font-bold text-text-primary mb-1">
              {metric.value}
            </div>
            <div className="text-sm text-text-muted">
              {metric.title}
            </div>
            <div className="text-xs text-text-secondary mt-1">
              {metric.subtitle}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Creator Performance */}
      {creator.totalPools > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <SparklesIcon className="h-5 w-5 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-text-primary">Creator Performance</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-4">
              <div className="text-2xl font-bold text-text-primary mb-1">{creator.totalPools}</div>
              <div className="text-sm text-text-muted">Total Pools</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-2xl font-bold text-green-400 mb-1">{creator.settledPools}</div>
              <div className="text-sm text-text-muted">Settled</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-2xl font-bold text-blue-400 mb-1">{creator.activePools}</div>
              <div className="text-sm text-text-muted">Active</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-2xl font-bold text-text-primary mb-1">{formatSTT(creator.avgPoolSize)}</div>
              <div className="text-sm text-text-muted">Avg Size</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Bettor Performance */}
      {bettor.totalBets > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <WalletIcon className="h-5 w-5 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-text-primary">Betting Performance</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="glass-card p-4">
              <div className="text-2xl font-bold text-text-primary mb-1">{bettor.totalBets}</div>
              <div className="text-sm text-text-muted">Total Bets</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-2xl font-bold text-text-primary mb-1">{formatSTT(bettor.totalStaked)}</div>
              <div className="text-sm text-text-muted">Total Staked</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-2xl font-bold text-text-primary mb-1">{formatSTT(bettor.avgBetSize)}</div>
              <div className="text-sm text-text-muted">Avg Bet Size</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Oddyssey Performance */}
      {oddyssey.totalSlips > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-pink-500/10 border border-pink-500/20">
              <FireIcon className="h-5 w-5 text-pink-400" />
            </div>
            <h3 className="text-xl font-bold text-text-primary">Oddyssey Performance</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-4">
              <div className="text-2xl font-bold text-text-primary mb-1">{oddyssey.totalSlips}</div>
              <div className="text-sm text-text-muted">Total Slips</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-2xl font-bold text-yellow-400 mb-1">{oddyssey.bestScore}/10</div>
              <div className="text-sm text-text-muted">Best Score</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-2xl font-bold text-text-primary mb-1">{formatPercentage(oddyssey.winRate)}</div>
              <div className="text-sm text-text-muted">Win Rate</div>
            </div>
            <div className="glass-card p-4">
              <div className={`text-2xl font-bold mb-1 ${oddyssey.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {oddyssey.profitLoss >= 0 ? '+' : ''}{formatSTT(oddyssey.profitLoss)}
              </div>
              <div className="text-sm text-text-muted">Profit/Loss</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Category Performance */}
      {trends.categories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6"
        >
          <h3 className="text-xl font-bold text-text-primary mb-6">Category Performance</h3>
          
          <div className="space-y-4">
            {trends.categories.map((cat, index) => {
              const maxVolume = Math.max(...trends.categories.map(c => c.volume));
              const percentage = (cat.volume / maxVolume) * 100;
              
              return (
                <div key={cat.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">{cat.category}</span>
                    <div className="text-right">
                      <div className="text-sm font-bold text-text-primary">{formatSTT(cat.volume)}</div>
                      <div className="text-xs text-text-muted">{cat.bets} bets</div>
                    </div>
                  </div>
                  <div className="w-full bg-bg-card rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: 0.6 + (index * 0.1), duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Monthly Trend */}
      {trends.monthly.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-6"
        >
          <h3 className="text-xl font-bold text-text-primary mb-6">Monthly Activity Trend</h3>
          
          <div className="space-y-4">
            {trends.monthly.map((month, index) => {
              const maxVolume = Math.max(...trends.monthly.map(m => m.volume));
              const percentage = maxVolume > 0 ? (month.volume / maxVolume) * 100 : 0;
              
              return (
                <div key={month.month} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">{month.month}</span>
                    <div className="text-right">
                      <div className="text-sm font-bold text-text-primary">{formatSTT(month.volume)}</div>
                      <div className="text-xs text-text-muted">{month.bets} bets</div>
                    </div>
                  </div>
                  <div className="w-full bg-bg-card rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: 0.7 + (index * 0.1), duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}

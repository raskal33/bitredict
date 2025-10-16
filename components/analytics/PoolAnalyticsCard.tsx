"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowTrendingUpIcon,
  ShieldCheckIcon,
  FireIcon,
  SparklesIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { PoolAnalyticsService, type PoolAnalytics } from '@/services/analyticsService';

interface PoolAnalyticsCardProps {
  poolId: number;
  className?: string;
}

export default function PoolAnalyticsCard({ poolId, className = "" }: PoolAnalyticsCardProps) {
  const [analytics, setAnalytics] = useState<PoolAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const data = await PoolAnalyticsService.getPoolAnalytics(poolId);
        if (data) {
          setAnalytics(data);
        } else {
          setError('Failed to load analytics');
        }
      } catch (err) {
        console.error('Error fetching pool analytics:', err);
        setError('Error loading analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [poolId]);

  if (loading) {
    return (
      <div className={`glass-card p-6 space-y-4 ${className}`}>
        <div className="h-6 bg-gray-700 rounded animate-pulse w-1/3"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-700 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-700 rounded animate-pulse w-5/6"></div>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return null; // Silent fail for analytics card
  }

  // Calculate scores display
  const popularityDisplay = Math.round((analytics.popularityScore / 10000) * 100);
  const efficiencyDisplay = Math.round((analytics.efficiencyScore / 10000) * 100);
  const riskLevelDisplay = analytics.riskLevel;

  // Color coding for risk level
  const getRiskColor = (level: number) => {
    if (level === 1) return 'text-green-400 bg-green-400/10';
    if (level === 2) return 'text-blue-400 bg-blue-400/10';
    if (level === 3) return 'text-yellow-400 bg-yellow-400/10';
    if (level === 4) return 'text-orange-400 bg-orange-400/10';
    return 'text-red-400 bg-red-400/10';
  };

  const getRiskLabel = (level: number) => {
    const labels = ['', 'Very Low', 'Low', 'Medium', 'High', 'Very High'];
    return labels[level] || 'Unknown';
  };

  // Score indicators
  const ScoreIndicator = ({ 
    label, 
    value, 
    icon: Icon, 
    color 
  }: { 
    label: string; 
    value: number; 
    icon: React.ElementType; 
    color: string;
  }) => {
    const percentage = Math.min(100, Math.max(0, value));
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${color}`} />
            <span className="text-sm font-medium text-gray-400">{label}</span>
          </div>
          <span className={`text-sm font-bold ${color}`}>{percentage}%</span>
        </div>
        <div className="w-full bg-gray-700/30 rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`h-full rounded-full bg-gradient-to-r ${
              color === 'text-green-400' ? 'from-green-500 to-emerald-400' :
              color === 'text-blue-400' ? 'from-blue-500 to-cyan-400' :
              color === 'text-yellow-400' ? 'from-yellow-500 to-amber-400' :
              'from-purple-500 to-pink-400'
            }`}
          />
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`glass-card border border-gray-700/30 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/30 border-b border-gray-700/30 px-6 py-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-cyan-400" />
          Pool Analytics
        </h3>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Main Scores Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Popularity Score */}
          <div className="space-y-3">
            <ScoreIndicator
              label="Popularity"
              value={popularityDisplay}
              icon={UserGroupIcon}
              color="text-blue-400"
            />
            <p className="text-xs text-gray-500">
              {analytics.participantCount} participants
            </p>
          </div>

          {/* Efficiency Score */}
          <div className="space-y-3">
            <ScoreIndicator
              label="Efficiency"
              value={efficiencyDisplay}
              icon={FireIcon}
              color="text-purple-400"
            />
            <p className="text-xs text-gray-500">
              {analytics.utilizationRate.toFixed(1)}% utilization
            </p>
          </div>
        </div>

        {/* Risk Level Badge */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-400">Risk Level</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${getRiskColor(riskLevelDisplay)}`}>
              {getRiskLabel(riskLevelDisplay)} ({riskLevelDisplay}/5)
            </span>
          </div>

          {/* Risk Factors */}
          {analytics.riskFactors && analytics.riskFactors.length > 0 && (
            <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/20">
              <p className="text-xs font-semibold text-gray-400 mb-2">Risk Factors:</p>
              <ul className="space-y-1">
                {analytics.riskFactors.slice(0, 3).map((factor, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-gray-500">
                    <span className="text-gray-600 mt-0.5">•</span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Volume Info */}
        <div className="bg-gradient-to-r from-cyan-500/5 to-blue-500/5 border border-cyan-500/20 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowTrendingUpIcon className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-gray-400">Total Volume</span>
            </div>
            <span className="text-sm font-bold text-cyan-400">
              {analytics.totalVolume || '0'}
            </span>
          </div>
        </div>

        {/* Creator Reputation */}
        <div className="bg-gradient-to-r from-amber-500/5 to-orange-500/5 border border-amber-500/20 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-400">Creator Score</span>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-amber-400">
                {analytics.creatorReputation}/100
              </span>
              <div className="w-12 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-400"
                  style={{ width: `${analytics.creatorReputation}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

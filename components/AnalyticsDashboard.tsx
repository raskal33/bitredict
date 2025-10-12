"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { 
  ChartBarIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  UsersIcon,
  FireIcon,
  EyeIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

import { analyticsService, type CycleAnalytics, type UserAnalytics, type PlatformAnalytics, type VisualizationData } from '@/services/analyticsService';
import SmartInsights from '@/components/SmartInsights';
import { AnalyticsChart, InfographicCard, PopularSelections } from '@/components/AnalyticsVisualizations';

interface AnalyticsDashboardProps {
  cycleId?: number;
  className?: string;
}

export default function AnalyticsDashboard({ cycleId = 1, className = "" }: AnalyticsDashboardProps) {
  const { address, isConnected } = useAccount();
  
  // State management
  const [activeTab, setActiveTab] = useState<'overview' | 'cycle' | 'user' | 'platform'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data state
  const [cycleAnalytics, setCycleAnalytics] = useState<CycleAnalytics | null>(null);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null);
  const [platformAnalytics, setPlatformAnalytics] = useState<PlatformAnalytics | null>(null);
  const [visualizationData, setVisualizationData] = useState<VisualizationData | null>(null);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [cycleData, platformData, vizData] = await Promise.all([
          analyticsService.getCycleAnalytics(cycleId),
          analyticsService.getPlatformAnalytics(),
          analyticsService.getVisualizationData(cycleId)
        ]);

        setCycleAnalytics(cycleData);
        setPlatformAnalytics(platformData);
        setVisualizationData(vizData);

        // Fetch user analytics if connected
        if (isConnected && address) {
          const userData = await analyticsService.getUserAnalytics(address);
          setUserAnalytics(userData);
        }
      } catch (err) {
        setError('Failed to load analytics data');
        console.error('Analytics fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [cycleId, isConnected, address]);

  const tabs = [
    { key: 'overview', label: 'Overview', icon: ChartBarIcon },
    { key: 'cycle', label: 'Cycle Analysis', icon: ArrowTrendingUpIcon },
    { key: 'user', label: 'Personal Stats', icon: UsersIcon, requiresWallet: true },
    { key: 'platform', label: 'Platform Health', icon: BoltIcon }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {visualizationData?.infographics.keyStats.map((stat, index) => (
          <InfographicCard
            key={index}
            title={stat.label}
            value={stat.value}
            trend={stat.trend}
            color={index % 2 === 0 ? 'primary' : 'secondary'}
          />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {visualizationData && (
          <>
            <AnalyticsChart
              title="Selection Distribution"
              type="doughnut"
              data={visualizationData.charts.selectionDistribution}
              height={250}
            />
            <AnalyticsChart
              title="Performance Trends"
              type="line"
              data={{
                labels: visualizationData.charts.performanceTrends.labels,
                data: visualizationData.charts.performanceTrends.datasets[0]?.data || [],
                colors: [visualizationData.charts.performanceTrends.datasets[0]?.color || '#22C7FF']
              }}
              height={250}
            />
          </>
        )}
      </div>

      {/* Insights and Popular Selections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {visualizationData?.infographics.insights && (
          <SmartInsights
            insights={visualizationData.infographics.insights.map(insight => ({
              title: insight.title,
              description: insight.description,
              impact: insight.impact,
              category: 'performance'
            }))}
            title="Cycle Insights"
          />
        )}
        
        {cycleAnalytics && (
          <PopularSelections
            selections={[
              {
                selection: '1',
                count: 89,
                percentage: 57.1,
                homeTeam: 'Manchester United',
                awayTeam: 'Liverpool'
              },
              {
                selection: 'Over',
                count: 67,
                percentage: 43.0,
                homeTeam: 'Barcelona',
                awayTeam: 'Real Madrid'
              },
              {
                selection: 'X',
                count: 45,
                percentage: 28.8,
                homeTeam: 'Chelsea',
                awayTeam: 'Arsenal'
              }
            ]}
          />
        )}
      </div>
    </div>
  );

  const renderCycleAnalysis = () => (
    <div className="space-y-6">
      {cycleAnalytics && (
        <>
          {/* Participation Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <InfographicCard
              title="Total Slips"
              value={cycleAnalytics.participationMetrics.totalSlips.toString()}
              trend={cycleAnalytics.participationMetrics.participationGrowth}
              icon={FireIcon}
              color="primary"
            />
            <InfographicCard
              title="Unique Users"
              value={cycleAnalytics.participationMetrics.uniqueUsers.toString()}
              icon={UsersIcon}
              color="secondary"
            />
            <InfographicCard
              title="Average Score"
              value={cycleAnalytics.performanceMetrics.averageCorrectPredictions.toFixed(1)}
              icon={ArrowTrendingUpIcon}
              color="success"
            />
            <InfographicCard
              title="Win Rate"
              value={`${cycleAnalytics.performanceMetrics.winRate.toFixed(1)}%`}
              icon={SparklesIcon}
              color="warning"
            />
          </div>

          {/* Performance Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6 border border-gray-600/30">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <ChartBarIcon className="w-5 h-5" />
                Performance Breakdown
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Perfect Slips</span>
                  <span className="text-green-400 font-bold">
                    {cycleAnalytics.performanceMetrics.perfectSlips}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Highest Score</span>
                  <span className="text-cyan-400 font-bold">
                    {cycleAnalytics.performanceMetrics.highestScore}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Avg Slips/User</span>
                  <span className="text-purple-400 font-bold">
                    {cycleAnalytics.participationMetrics.averageSlipsPerUser.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            <SmartInsights
              insights={cycleAnalytics.insights.map(insight => ({
                title: 'Cycle Analysis',
                description: insight,
                impact: 'positive',
                category: 'trend'
              }))}
              title="Cycle Insights"
            />
          </div>
        </>
      )}
    </div>
  );

  const renderUserAnalytics = () => {
    if (!isConnected || !userAnalytics) {
      return (
        <div className="text-center py-12">
          <UsersIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-300 mb-2">Connect Wallet</h3>
          <p className="text-gray-400">Connect your wallet to view personal analytics</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Personal Performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <InfographicCard
            title="Total Slips"
            value={userAnalytics.performanceMetrics.totalSlips.toString()}
            icon={FireIcon}
            color="primary"
          />
          <InfographicCard
            title="Win Rate"
            value={`${userAnalytics.performanceMetrics.winRate.toFixed(1)}%`}
              trend={userAnalytics.performanceMetrics.improvement}
              icon={ArrowTrendingUpIcon}
            color="success"
          />
          <InfographicCard
            title="Best Streak"
            value={userAnalytics.performanceMetrics.bestStreak.toString()}
            icon={SparklesIcon}
            color="warning"
          />
          <InfographicCard
            title="Current Streak"
            value={userAnalytics.performanceMetrics.currentStreak.toString()}
            icon={BoltIcon}
            color="secondary"
          />
        </div>

        {/* Behavior Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6 border border-gray-600/30">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <EyeIcon className="w-5 h-5" />
              Behavior Patterns
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Risk Profile</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  userAnalytics.behaviorPatterns.riskProfile === 'aggressive' ? 'bg-red-500/20 text-red-400' :
                  userAnalytics.behaviorPatterns.riskProfile === 'balanced' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {userAnalytics.behaviorPatterns.riskProfile}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Activity Level</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  userAnalytics.behaviorPatterns.activityPattern === 'hardcore' ? 'bg-purple-500/20 text-purple-400' :
                  userAnalytics.behaviorPatterns.activityPattern === 'regular' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {userAnalytics.behaviorPatterns.activityPattern}
                </span>
              </div>
            </div>
          </div>

          <SmartInsights
            insights={userAnalytics.insights.map(insight => ({
              title: 'Personal Insight',
              description: insight,
              impact: 'positive',
              category: 'performance'
            }))}
            title="Your Insights"
          />
        </div>

        {/* Achievements */}
        <div className="glass-card p-6 border border-gray-600/30">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <SparklesIcon className="w-5 h-5" />
            Achievements & Rankings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">Badges</h4>
              <div className="flex flex-wrap gap-2">
                {userAnalytics.achievements.badges.map((badge, index) => (
                  <span key={index} className="px-3 py-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30 rounded-full text-xs font-medium">
                    {badge}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">Rankings</h4>
              <div className="space-y-2">
                {userAnalytics.achievements.rankings.map((ranking, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-gray-300">{ranking.category}</span>
                    <span className="text-cyan-400 font-medium">
                      #{ranking.position} of {ranking.total}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPlatformHealth = () => (
    <div className="space-y-6">
      {platformAnalytics && (
        <>
          {/* Global Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <InfographicCard
              title="Total Users"
              value={platformAnalytics.globalMetrics.totalUsers.toLocaleString()}
              icon={UsersIcon}
              color="primary"
            />
            <InfographicCard
              title="Total Volume"
              value={`${platformAnalytics.globalMetrics.totalVolume.toFixed(1)}K STT`}
              icon={ArrowTrendingUpIcon}
              color="success"
            />
            <InfographicCard
              title="Daily Active"
              value={platformAnalytics.engagementMetrics.dailyActiveUsers.toString()}
              icon={FireIcon}
              color="warning"
            />
            <InfographicCard
              title="Retention Rate"
              value={`${platformAnalytics.engagementMetrics.retentionRate.toFixed(1)}%`}
              icon={SparklesIcon}
              color="secondary"
            />
            <InfographicCard
              title="Platform Health"
              value={platformAnalytics.performanceInsights.platformHealth}
              icon={BoltIcon}
              color="accent"
            />
          </div>

          {/* Platform Insights */}
          <SmartInsights
            insights={platformAnalytics.insights.map(insight => ({
              title: 'Platform Analysis',
              description: insight,
              impact: 'positive',
              category: 'trend'
            }))}
            title="Platform Insights"
          />
        </>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className={`glass-card p-8 border border-gray-600/30 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`glass-card p-8 border border-gray-600/30 ${className}`}>
        <div className="text-center">
          <ChartBarIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-2">Failed to load analytics</p>
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`space-y-6 ${className}`}
    >
      {/* Header */}
      <div className="glass-card p-6 border border-gray-600/30">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <SparklesIcon className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Smart Analytics</h2>
              <p className="text-gray-400">AI-powered insights and visualizations</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            if (tab.requiresWallet && !isConnected) return null;
            
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as 'overview' | 'cycle' | 'user' | 'platform')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-gradient-primary text-black'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'cycle' && renderCycleAnalysis()}
          {activeTab === 'user' && renderUserAnalytics()}
          {activeTab === 'platform' && renderPlatformHealth()}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

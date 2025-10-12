"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
// Chart components are used in ModernChart component
import {
  TrophyIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  BoltIcon,
  ClockIcon,
  GlobeAltIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingUpIcon as TrendingUpIcon,
  EyeIcon,
  UsersIcon,
  SparklesIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import {
  TrophyIcon as TrophySolid,
  StarIcon as StarSolid,
  FireIcon as FireSolid,
} from "@heroicons/react/24/solid";
import { useUnifiedAnalyticsDashboard } from "@/hooks/useContractAnalytics";
import { AnalyticsCard, ModernChart } from "@/components/analytics";
import AnimatedTitle from "@/components/AnimatedTitle";
// import EnhancedStatsDashboard from "@/components/EnhancedStatsDashboard"; // Removed - using AnalyticsDashboard instead
import AnalyticsDashboard from "@/components/AnalyticsDashboard";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

export default function StatsPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "analytics" | "leaderboard" | "enhanced">("overview");
  const [timeframe, setTimeframe] = useState<"24h" | "7d" | "30d" | "all">("7d");
  
  // Use the unified analytics dashboard hook
  const { 
    globalStats, 
    // marketIntelligence, // Removed - using mock data
    activePools,
    isLoading,
    error,
    refetchAll
  } = useUnifiedAnalyticsDashboard(timeframe);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="relative">
            <div className="animate-spin w-16 h-16 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full"></div>
            <div className="absolute inset-0 animate-ping w-16 h-16 border-4 border-cyan-400/20 rounded-full"></div>
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-2">Loading Analytics</h3>
            <p className="text-gray-300">Fetching real-time platform data...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-8 text-center max-w-md"
        >
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheckIcon className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Analytics Error</h3>
          <p className="text-gray-300 mb-4">
            {error instanceof Error ? error.message : 'Failed to load analytics data'}
          </p>
          <button
            onClick={() => refetchAll()}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-2 px-6 rounded-lg transition-all duration-200"
          >
            Retry
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <AnimatedTitle 
            size="lg"
            leftIcon={ChartBarIcon}
            rightIcon={SparklesIcon}
          >
            Platform Analytics
          </AnimatedTitle>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-lg text-gray-300 max-w-3xl mx-auto text-center mb-8"
          >
            Real-time insights into platform activity, performance metrics, and market trends with advanced data visualization.
          </motion.p>

          {/* Time Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center mb-8"
          >
            <div className="flex items-center gap-2 glass-card p-2 rounded-xl">
              {[
                { id: "24h", label: "24H", icon: ClockIcon },
                { id: "7d", label: "7D", icon: ArrowTrendingUpIcon },
                { id: "30d", label: "30D", icon: ChartBarIcon },
                { id: "all", label: "ALL", icon: GlobeAltIcon },
              ].map((period) => (
                <button
                  key={period.id}
                  onClick={() => setTimeframe(period.id as "24h" | "7d" | "30d" | "all")}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    timeframe === period.id
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg"
                      : "text-gray-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <period.icon className="w-4 h-4" />
                  {period.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Key Metrics Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <AnalyticsCard
              title="Total Volume"
              value={globalStats?.globalMetrics.totalVolume?.toFixed(2) || '0 STT'}
              icon={CurrencyDollarIcon}
              color="primary"
              trend={{ value: 8.3, label: 'vs last week' }}
              size="lg"
            />
            
            <AnalyticsCard
              title="Total Pools"
              value={globalStats?.globalMetrics.totalSlips?.toLocaleString() || '0'}
              icon={ChartBarIcon}
              color="secondary"
              trend={{ value: 12.5 }}
              size="lg"
            />
            
            <AnalyticsCard
              title="Active Pools"
              value={globalStats?.globalMetrics.totalSlips?.toLocaleString() || '0'}
              icon={UsersIcon}
              color="success"
              size="lg"
            />
            
            <AnalyticsCard
              title="Platform Health"
              value={globalStats?.performanceInsights.platformHealth?.toUpperCase() || 'N/A'}
              icon={ShieldCheckIcon}
              color="warning"
              subtitle={`Activity: ${globalStats?.engagementMetrics.dailyActiveUsers || 0}/100`}
              size="lg"
            />
          </motion.div>

          {/* Tab Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-2 glass-card p-2 rounded-xl w-fit mx-auto"
          >
            {[
              { id: "overview", label: "Overview", icon: GlobeAltIcon },
              { id: "analytics", label: "Analytics", icon: ChartBarIcon },
              { id: "leaderboard", label: "Leaderboard", icon: TrophyIcon },
              { id: "enhanced", label: "Enhanced", icon: SparklesIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as "overview" | "analytics" | "leaderboard" | "enhanced")}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </motion.div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Market Intelligence Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <ModernChart
                    title="Market Type Distribution"
                    type="doughnut"
                    data={{
                      labels: ['Sports', 'Crypto', 'Politics', 'Finance'], // Mock data
                      datasets: [{
                        data: [45, 30, 15, 10], // Mock data
                        backgroundColor: [
                          '#22C7FF', '#FF0080', '#8C00FF', '#00D9A5',
                          '#FFB800', '#FF6B6B', '#4ECDC4', '#95E1D3',
                        ],
                        borderWidth: 0,
                      }],
                    }}
                    height={400}
                  />
                  
                  <ModernChart
                    title="Oracle Distribution"
                    type="bar"
                    data={{
                      labels: ['Guided Oracle', 'Open Oracle'],
                      datasets: [{
                        label: 'Pools',
                        data: [
                          75, // Mock data
                          25, // Mock data
                        ],
                        backgroundColor: ['rgba(34, 199, 255, 0.8)', 'rgba(255, 0, 128, 0.8)'],
                        borderRadius: 8,
                      }],
                    }}
                    height={400}
                  />
                </div>

                {/* Platform Health Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <AnalyticsCard
                    title="Growth Rate"
                    value={`${globalStats?.globalMetrics.averageWinRate || 0}%`}
                    subtitle="24h growth"
                    icon={TrendingUpIcon}
                    color="success"
                    trend={{ value: globalStats?.globalMetrics.averageWinRate || 0, label: '7d trend' }}
                  />
                  
                  <AnalyticsCard
                    title="Activity Score"
                    value={`${globalStats?.engagementMetrics.dailyActiveUsers || 0}/100`}
                    subtitle="Platform activity"
                    icon={BoltIcon}
                    color="warning"
                  />
                  
                  <AnalyticsCard
                    title="Volume Trend"
                    value={globalStats?.performanceInsights.platformHealth?.toUpperCase() || 'STABLE'}
                    subtitle="Market direction"
                    icon={ArrowTrendingUpIcon}
                    color={globalStats?.performanceInsights.platformHealth === 'excellent' ? 'success' : 'danger'}
                  />
                </div>
              </motion.div>
            )}

            {activeTab === "analytics" && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Advanced Analytics Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <ModernChart
                    title="Platform Performance"
                    subtitle="Key metrics over time"
                    type="line"
                    data={{
                      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                      datasets: [
                        {
                          label: 'Volume (ETH)',
                          data: [120, 190, 300, 500, 200, 300, 450],
                          borderColor: '#22C7FF',
                          backgroundColor: 'rgba(34, 199, 255, 0.1)',
                          fill: true,
                          tension: 0.4,
                        },
                        {
                          label: 'Active Pools',
                          data: [15, 25, 35, 45, 30, 40, 55],
                          borderColor: '#FF0080',
                          backgroundColor: 'rgba(255, 0, 128, 0.1)',
                          fill: true,
                          tension: 0.4,
                        },
                      ],
                    }}
                    height={400}
                  />
                  
                  <ModernChart
                    title="User Engagement"
                    subtitle="Platform activity patterns"
                    type="bar"
                    data={{
                      labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
                      datasets: [{
                        label: 'Active Users',
                        data: [45, 32, 78, 120, 95, 85],
                        backgroundColor: 'rgba(255, 0, 128, 0.8)',
                        borderRadius: 8,
                      }],
                    }}
                    height={400}
                  />
                </div>

                {/* Performance Insights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <AnalyticsCard
                    title="Peak Activity"
                    value="16:00 UTC"
                    subtitle="Most active hour"
                    icon={ClockIcon}
                    color="primary"
                  />
                  
                  <AnalyticsCard
                    title="Top Category"
                    value="Football"
                    subtitle="Most popular market"
                    icon={TrophyIcon}
                    color="secondary"
                  />
                  
                  <AnalyticsCard
                    title="Avg Pool Size"
                    value={`${globalStats?.globalMetrics.averageWinRate || '0'}%`}
                    subtitle="Average pool volume"
                    icon={CurrencyDollarIcon}
                    color="success"
                  />
                </div>
              </motion.div>
            )}

            {activeTab === "leaderboard" && (
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Top Performers */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <TrophySolid className="h-6 w-6 text-yellow-400" />
                        Top Pool Creators
                      </h3>
                      <EyeIcon className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div className="space-y-4">
                      {activePools && Array.isArray(activePools) ? activePools.slice(0, 5).map((pool, index) => (
                        <motion.div
                          key={typeof pool === 'object' && pool !== null ? String((pool as Record<string, unknown>).poolId || index) : String(index)}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * index }}
                          className="flex items-center justify-between p-4 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-all duration-200"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                              index === 0 ? "bg-yellow-400 text-black" :
                              index === 1 ? "bg-gray-300 text-black" :
                              index === 2 ? "bg-orange-400 text-black" :
                              "bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-white">Pool #{typeof pool === 'bigint' ? pool.toString() : String((pool as Record<string, unknown>)?.poolId || index)}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span>{typeof pool === 'object' && pool !== null && (pool as Record<string, unknown>)?.creator ? `${String((pool as Record<string, unknown>)?.creator).slice(0, 6)}...${String((pool as Record<string, unknown>)?.creator).slice(-4)}` : 'N/A'}</span>
                                <span>{typeof pool === 'object' && pool !== null ? `${Number((pool as Record<string, unknown>)?.creatorStake || 0) / 1e18} ETH` : '0 ETH'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 mb-1">
                              <StarSolid className="h-4 w-4 text-yellow-400" />
                              <span className="text-sm font-medium text-white">
                                {typeof pool === 'object' && pool !== null ? String((pool as Record<string, unknown>)?.participantCount || 0) : '0'}
                              </span>
                            </div>
                            <p className="text-sm text-green-400">
                              {typeof pool === 'object' && pool !== null ? `${(pool as Record<string, unknown>)?.fillPercentage || 0}%` : '0%'} filled
                            </p>
                          </div>
                        </motion.div>
                      )) : (
                        <div className="text-center text-gray-400 py-8">No active pools available</div>
                      )}
                    </div>
                  </div>

                  <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <FireSolid className="h-6 w-6 text-orange-400" />
                        Trending Pools
                      </h3>
                      <BoltIcon className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div className="space-y-4">
                      {activePools && Array.isArray(activePools) ? activePools.slice(0, 5).map((pool, index) => (
                        <motion.div
                          key={typeof pool === 'object' && pool !== null ? String((pool as Record<string, unknown>).poolId || index) : String(index)}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * index }}
                          className="flex items-center justify-between p-4 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-all duration-200"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center font-bold text-sm text-white">
                              🔥
                            </div>
                            <div>
                              <p className="font-medium text-white">Pool #{typeof pool === 'bigint' ? pool.toString() : String((pool as Record<string, unknown>)?.poolId || index)}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span>{typeof pool === 'object' && pool !== null ? String((pool as Record<string, unknown>)?.category || 'N/A') : 'N/A'}</span>
                                <span>{typeof pool === 'object' && pool !== null ? `${Number((pool as Record<string, unknown>)?.odds || 0) / 100}x` : '1.0x'} odds</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-green-400">+{Math.floor(Math.random() * 50)}%</p>
                            <p className="text-sm text-gray-400">trending</p>
                          </div>
                        </motion.div>
                      )) : (
                        <div className="text-center text-gray-400 py-8">No trending pools available</div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "enhanced" && (
              <motion.div
                key="enhanced"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <AnalyticsDashboard />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
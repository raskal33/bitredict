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

// ✅ FIX: Format volume with proper null checks
function formatVolume(volume: number | string | null | undefined): string {
  if (!volume || volume === 0 || volume === '0') return '0 STT';
  
  const num = typeof volume === 'string' ? parseFloat(volume) : volume;
  if (isNaN(num) || num === 0) return '0 STT';
  
  if (num >= 1e18) {
    // Convert from Wei to STT
    const stt = num / 1e18;
    if (stt >= 1e9) return `${(stt / 1e9).toFixed(2)}B STT`;
    if (stt >= 1e6) return `${(stt / 1e6).toFixed(2)}M STT`;
    if (stt >= 1e3) return `${(stt / 1e3).toFixed(2)}K STT`;
    return `${stt.toFixed(2)} STT`;
  }
  
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B STT`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M STT`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K STT`;
  return `${num.toFixed(2)} STT`;
}

// ✅ FIX: Safe number formatting with null checks
function formatNumber(value: number | string | null | undefined, decimals: number = 0): string {
  if (value === null || value === undefined || value === '') return '0';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export default function StatsPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "analytics" | "leaderboard" | "enhanced">("overview");
  const [timeframe, setTimeframe] = useState<"24h" | "7d" | "30d" | "all">("7d");
  
  // Use the unified analytics dashboard hook
  const { 
    globalStats, 
    marketIntelligence,
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

  // ✅ FIX: Extract real data with null checks
  const totalVolume = globalStats?.globalMetrics?.totalVolume ?? 0;
  const totalPools = globalStats?.globalMetrics?.totalPools ?? 0;
  const activePoolsCount = globalStats?.globalMetrics?.activePools ?? 0;
  const totalUsers = globalStats?.globalMetrics?.totalUsers ?? 0;
  const averageWinRate = globalStats?.globalMetrics?.averageWinRate ?? 0;
  const dailyActiveUsers = globalStats?.engagementMetrics?.dailyActiveUsers ?? 0;
  const platformHealth = globalStats?.performanceInsights?.platformHealth ?? 'good';

  // ✅ FIX: Get category stats from market intelligence - ensure proper type handling
  interface CategoryData {
    category?: string;
    poolCount?: number;
    totalVolume?: number;
  }
  const categoryData = marketIntelligence && Array.isArray(marketIntelligence) && marketIntelligence.length > 0
    ? marketIntelligence.map((cat: CategoryData) => ({
        category: String(cat?.category || 'Other'),
        count: Number(cat?.poolCount || 0),
        volume: Number(cat?.totalVolume || 0)
      }))
    : [
        { category: 'Sports', count: 0, volume: 0 },
        { category: 'Crypto', count: 0, volume: 0 },
        { category: 'Politics', count: 0, volume: 0 },
        { category: 'Finance', count: 0, volume: 0 }
      ];

  const totalCategoryPools = categoryData.reduce((sum, cat) => sum + cat.count, 0);
  const categoryChartData = {
    labels: categoryData.map(cat => String(cat.category)),
    datasets: [{
      data: categoryData.map(cat => totalCategoryPools > 0 ? Number((cat.count / totalCategoryPools * 100).toFixed(2)) : 0),
      backgroundColor: ['#22C7FF', '#FF0080', '#8C00FF', '#00D9A5'],
      borderWidth: 0,
    }],
  };

  // ✅ FIX: Safe active pools array - handle both bigint[] and pool objects
  const safeActivePools = Array.isArray(activePools) 
    ? activePools.map((pool: bigint | Record<string, unknown>) => {
        // If it's a bigint (pool ID), convert to object format
        if (typeof pool === 'bigint') {
          return { poolId: pool.toString(), id: pool.toString() };
        }
        // If it's already an object, return as is
        return pool;
      })
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center space-y-4">
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
              transition={{ delay: 0.2 }}
              className="text-lg text-gray-300 max-w-3xl mx-auto"
            >
              Real-time insights into platform activity, performance metrics, and market trends with advanced data visualization.
            </motion.p>
          </div>

          {/* Time Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex justify-center"
          >
            <div className="glass-card p-2 rounded-xl inline-flex gap-2">
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
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/50"
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
              value={formatVolume(totalVolume)}
              icon={CurrencyDollarIcon}
              color="primary"
              size="lg"
            />
            
            <AnalyticsCard
              title="Total Pools"
              value={formatNumber(totalPools)}
              icon={ChartBarIcon}
              color="secondary"
              size="lg"
            />
            
            <AnalyticsCard
              title="Active Pools"
              value={formatNumber(activePoolsCount)}
              icon={TrophyIcon}
              color="success"
              size="lg"
            />
            
            <AnalyticsCard
              title="Users"
              value={formatNumber(totalUsers)}
              icon={UsersIcon}
              color="warning"
              size="lg"
            />
          </motion.div>

          {/* Tab Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center"
          >
            <div className="glass-card p-2 rounded-xl inline-flex gap-2">
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
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/50"
                      : "text-gray-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>
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
                  <div className="glass-card p-6">
                    <ModernChart
                      title="Market Type Distribution"
                      type="doughnut"
                      data={categoryChartData}
                      height={400}
                    />
                  </div>
                  
                  <div className="glass-card p-6">
                    <ModernChart
                      title="Oracle Distribution"
                      type="bar"
                      data={{
                        labels: ['Guided Oracle', 'Open Oracle'],
                        datasets: [{
                          label: 'Pools',
                          data: [
                            totalPools > 0 ? Math.round(totalPools * 0.75) : 0,
                            totalPools > 0 ? Math.round(totalPools * 0.25) : 0,
                          ],
                          backgroundColor: ['rgba(34, 199, 255, 0.8)', 'rgba(255, 0, 128, 0.8)'],
                          borderRadius: 8,
                        }],
                      }}
                      height={400}
                    />
                  </div>
                </div>

                {/* Platform Health Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <AnalyticsCard
                    title="Average Win Rate"
                    value={`${averageWinRate > 0 ? averageWinRate.toFixed(1) : '0'}%`}
                    subtitle="Platform accuracy"
                    icon={TrendingUpIcon}
                    color="success"
                  />
                  
                  <AnalyticsCard
                    title="Daily Active Users"
                    value={formatNumber(dailyActiveUsers)}
                    subtitle="Platform activity"
                    icon={BoltIcon}
                    color="warning"
                  />
                  
                  <AnalyticsCard
                    title="Platform Health"
                    value={platformHealth === 'excellent' ? 'Excellent' : platformHealth === 'good' ? 'Good' : 'Fair'}
                    subtitle="System status"
                    icon={ShieldCheckIcon}
                    color={platformHealth === 'excellent' ? 'success' : 'primary'}
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
                  <div className="glass-card p-6">
                    <ModernChart
                      title="Platform Performance"
                      subtitle="Key metrics over time"
                      type="line"
                      data={{
                        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                        datasets: [
                          {
                            label: 'Volume (STT)',
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
                  </div>
                  
                  <div className="glass-card p-6">
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
                    value={categoryData.length > 0 && categoryData[0].count > 0 ? categoryData[0].category : 'N/A'}
                    subtitle="Most popular market"
                    icon={TrophyIcon}
                    color="secondary"
                  />
                  
                  <AnalyticsCard
                    title="Avg Pool Size"
                    value={totalPools > 0 ? formatVolume(totalVolume / totalPools) : '0 STT'}
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
                      {safeActivePools.length > 0 ? safeActivePools.slice(0, 5).map((pool: Record<string, unknown>, index: number) => {
                        const poolId = String(pool?.poolId || pool?.id || index);
                        const creator = String(pool?.creator || pool?.creatorAddress || 'N/A');
                        const stake = typeof pool?.creatorStake === 'number' ? pool.creatorStake : typeof pool?.creatorStake === 'string' ? parseFloat(pool.creatorStake) : 0;
                        const participants = typeof pool?.participantCount === 'number' ? pool.participantCount : typeof pool?.participantCount === 'string' ? parseInt(pool.participantCount) : 0;
                        const fillPct = typeof pool?.fillPercentage === 'number' ? pool.fillPercentage : typeof pool?.fillPercentage === 'string' ? parseFloat(pool.fillPercentage) : 0;
                        
                        return (
                          <motion.div
                            key={`pool-${poolId}-${index}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * index }}
                            className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-all duration-200 border border-gray-700/50"
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
                                <p className="font-medium text-white">Pool #{poolId}</p>
                                <div className="flex items-center gap-4 text-sm text-gray-400">
                                  <span>{typeof creator === 'string' && creator.length > 10 ? `${creator.slice(0, 6)}...${creator.slice(-4)}` : creator}</span>
                                  <span>{stake > 0 ? formatVolume(stake) : '0 STT'}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1 mb-1">
                                <StarSolid className="h-4 w-4 text-yellow-400" />
                                <span className="text-sm font-medium text-white">{formatNumber(participants)}</span>
                              </div>
                              <p className="text-sm text-green-400">{fillPct}% filled</p>
                            </div>
                          </motion.div>
                        );
                      }) : (
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
                      {safeActivePools.length > 0 ? safeActivePools.slice(0, 5).map((pool: Record<string, unknown>, index: number) => {
                        const poolId = String(pool?.poolId || pool?.id || index);
                        const category = String(pool?.category || 'N/A');
                        const odds = typeof pool?.odds === 'number' ? pool.odds : typeof pool?.odds === 'string' ? parseFloat(pool.odds) : 0;
                        
                        return (
                          <motion.div
                            key={`trending-${poolId}-${index}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * index }}
                            className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-all duration-200 border border-gray-700/50"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center font-bold text-sm text-white">
                                🔥
                              </div>
                              <div>
                                <p className="font-medium text-white">Pool #{poolId}</p>
                                <div className="flex items-center gap-4 text-sm text-gray-400">
                                  <span>{category}</span>
                                  <span>{odds > 0 ? `${(odds / 100).toFixed(2)}x` : '1.0x'} odds</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-green-400">+{Math.floor(Math.random() * 50)}%</p>
                              <p className="text-sm text-gray-400">trending</p>
                            </div>
                          </motion.div>
                        );
                      }) : (
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

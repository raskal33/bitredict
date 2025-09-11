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
import { Bar, Line, Doughnut } from "react-chartjs-2";
import {
  TrophyIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  BoltIcon,
  ClockIcon,
  GlobeAltIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  UsersIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import {
  TrophyIcon as TrophySolid,
  StarIcon as StarSolid,
  FireIcon as FireSolid,
} from "@heroicons/react/24/solid";
import { useAnalyticsDashboard } from "@/hooks/useAnalytics";
import AnimatedTitle from "@/components/AnimatedTitle";
import EnhancedStatsDashboard from "@/components/EnhancedStatsDashboard";
import { ChartBarIcon as ChartBarSolid, CurrencyDollarIcon as CurrencySolid } from "@heroicons/react/24/solid";

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
  const [activeTab, setActiveTab] = useState<"overview" | "leaderboard" | "analytics" | "enhanced">("overview");
  const [timeframe, setTimeframe] = useState<"24h" | "7d" | "30d" | "all">("7d");
  
  // Use the real-time analytics hook
  const { 
    globalStats = { totalVolume: 0, totalPools: 0, totalBets: 0, activePools: 0 }, 
    topCreators = [], 
    topBettors = [], 
    categoryDistribution = {}, 
    volumeHistory = [], 
    userActivity = [], 
    isLoading,
    error 
  } = useAnalyticsDashboard({ timeframe });

  const trendingStats = [
    { label: "Active Pools", value: globalStats.activePools, change: +12.5, icon: ChartBarIcon },
    { label: "Total Volume", value: `${(globalStats.totalVolume / 1000).toFixed(1)}K ETH`, change: +8.3, icon: CurrencyDollarIcon },
    { label: "Daily Users", value: "1,245", change: +15.2, icon: UsersIcon },
    { label: "Total Bets", value: globalStats.totalBets.toLocaleString(), change: +2.1, icon: TrophyIcon },
  ];

  const volumeChartData = {
    labels: volumeHistory.map(item => item.date),
    datasets: [
      {
        label: "Volume (ETH)",
        data: volumeHistory.map(item => item.volume),
        borderColor: "#22C7FF",
        backgroundColor: "rgba(34, 199, 255, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const poolDistributionData = {
    labels: Object.keys(categoryDistribution),
    datasets: [
      {
        data: Object.values(categoryDistribution),
        backgroundColor: [
          "#22C7FF",
          "#FF0080",
          "#8C00FF",
          "#00D9A5",
          "#FFB800",
        ],
        borderWidth: 0,
      },
    ],
  };

  const userActivityData = {
    labels: userActivity.map(item => item.hour),
    datasets: [
      {
        label: "Active Users",
        data: userActivity.map(item => item.users),
        backgroundColor: "rgba(255, 0, 128, 0.8)",
        borderRadius: 8,
      },
    ],
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
          <p className="text-text-primary text-xl font-medium">Loading real-time stats...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-8 text-center"
        >
          <p className="text-red-400 text-xl font-medium mb-4">Error loading stats</p>
          <p className="text-text-muted">{error instanceof Error ? error.message : String(error)}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <AnimatedTitle 
        size="md"
        leftIcon={ChartBarSolid}
        rightIcon={CurrencySolid}
      >
        Platform Statistics
      </AnimatedTitle>
      
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-base text-text-secondary max-w-2xl mx-auto text-center mb-6"
      >
        Real-time insights into platform activity, performance metrics, and market trends.
      </motion.p>

      {/* Time Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex justify-center mb-8"
      >
        <div className="flex items-center gap-2 glass-card p-2 rounded-button">

          {["24h", "7d", "30d", "all"].map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period as "24h" | "7d" | "30d" | "all")}
              className={`px-4 py-2 text-sm font-medium rounded-button transition-all duration-200 ${
                timeframe === period
                  ? "bg-gradient-primary text-black shadow-button"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-card"
              }`}
            >
              {period.toUpperCase()}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Key Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {trendingStats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ scale: 1.02, y: -2 }}
              className="glass-card text-center bg-gradient-to-br from-primary/10 to-blue-500/10 border-2 border-transparent hover:border-white/10 hover:glow-cyan transition-all duration-300"
            >
              <IconComponent className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-2xl font-bold text-text-primary mb-1">{stat.value}</h3>
              <p className="text-lg font-semibold text-text-secondary mb-1">{stat.label}</p>
              <div className="flex items-center justify-center gap-1">
                {stat.change > 0 ? (
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-400" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4 text-red-400" />
                )}
                <span className={`text-sm ${stat.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stat.change > 0 ? '+' : ''}{stat.change}%
                </span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-2 glass-card p-2 rounded-button w-fit"
      >
        {[
          { id: "overview", label: "Overview", icon: GlobeAltIcon },
          { id: "leaderboard", label: "Leaderboard", icon: TrophyIcon },
          { id: "analytics", label: "Analytics", icon: ChartBarIcon },
          { id: "enhanced", label: "Enhanced", icon: SparklesIcon },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as "overview" | "leaderboard" | "analytics" | "enhanced")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-button transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-gradient-primary text-black shadow-button"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-card"
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
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Volume Chart */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-text-primary">Volume Trends</h3>
                <SparklesIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="h-80">
                <Line
                  data={volumeChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                    },
                    scales: {
                      x: { 
                        grid: { display: false },
                        ticks: { color: "#C2C2D6" }
                      },
                      y: { 
                        grid: { color: "rgba(255,255,255,0.1)" },
                        ticks: { color: "#C2C2D6" }
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Pool Distribution */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-text-primary">Pool Categories</h3>
                <FireSolid className="h-5 w-5 text-orange-400" />
              </div>
              <div className="h-80 flex items-center justify-center">
                <Doughnut
                  data={poolDistributionData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: { color: "#C2C2D6" }
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Global Stats Cards */}
            <div className="lg:col-span-2 grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Pools", value: globalStats.totalPools.toLocaleString(), icon: ChartBarIcon },
                { label: "Platform Revenue", value: `${(globalStats.totalVolume * 0.05 / 1000).toFixed(1)}K ETH`, icon: CurrencyDollarIcon },
                { label: "Average Pool Size", value: `${Math.round(globalStats.totalVolume / globalStats.totalPools)} ETH`, icon: BoltIcon },
                { label: "Active Pools", value: globalStats.activePools.toLocaleString(), icon: StarSolid },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                  className="glass-card p-4 text-center hover:glow-violet transition-all duration-300"
                >
                  <div className="mx-auto w-12 h-12 bg-gradient-secondary rounded-button flex items-center justify-center mb-3">
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-lg font-bold text-text-primary mb-1">{stat.value}</p>
                  <p className="text-text-muted text-xs">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "leaderboard" && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Top Pool Creators */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <TrophySolid className="h-6 w-6 text-yellow-400" />
                  Top Pool Creators
                </h3>
                <EyeIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-4">
                {topCreators.map((creator, index) => (
                  <motion.div
                    key={creator.address}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-center justify-between p-4 rounded-button bg-bg-card hover:bg-[rgba(255,255,255,0.05)] transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-button flex items-center justify-center font-bold text-sm ${
                        index === 0 ? "bg-yellow-400 text-black" :
                        index === 1 ? "bg-gray-300 text-black" :
                        index === 2 ? "bg-orange-400 text-black" :
                        "bg-gradient-primary text-black"
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">{creator.address}</p>
                        <div className="flex items-center gap-4 text-sm text-text-muted">
                          <span>{creator.stats.totalPools} pools</span>
                          <span>{creator.stats.totalVolume.toLocaleString()} ETH</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 mb-1">
                        <StarSolid className="h-4 w-4 text-yellow-400" />
                        <span className="text-sm font-medium text-text-primary">{creator.reputation}</span>
                      </div>
                      <p className="text-sm text-green-400">{creator.stats.winRate}% win rate</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Top Bettors */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <FireSolid className="h-6 w-6 text-orange-400" />
                  Top Bettors
                </h3>
                <BoltIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-4">
                {topBettors.map((bettor, index) => (
                  <motion.div
                    key={bettor.address}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-center justify-between p-4 rounded-button bg-bg-card hover:bg-[rgba(255,255,255,0.05)] transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-button flex items-center justify-center font-bold text-sm ${
                        index === 0 ? "bg-yellow-400 text-black" :
                        index === 1 ? "bg-gray-300 text-black" :
                        index === 2 ? "bg-orange-400 text-black" :
                        "bg-gradient-secondary text-white"
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">{bettor.address}</p>
                        <div className="flex items-center gap-4 text-sm text-text-muted">
                          <span>{bettor.stats.totalBets} bets</span>
                          <span>{bettor.stats.totalStaked.toLocaleString()} ETH</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-400">+{bettor.stats.profitLoss} ETH</p>
                      <p className="text-sm text-text-muted">{bettor.stats.winRate}% win rate</p>
                    </div>
                  </motion.div>
                ))}
              </div>
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
            {/* User Activity Chart */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-text-primary">User Activity (24h)</h3>
                <ClockIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="h-80">
                <Bar
                  data={userActivityData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                    },
                    scales: {
                      x: { 
                        grid: { display: false },
                        ticks: { color: "#C2C2D6" }
                      },
                      y: { 
                        grid: { color: "rgba(255,255,255,0.1)" },
                        ticks: { color: "#C2C2D6" }
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Additional Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { 
                  title: "Peak Activity", 
                  value: userActivity.reduce((max, curr) => curr.users > max.users ? curr : max, userActivity[0])?.hour || "16:00", 
                  subtitle: `${Math.max(...userActivity.map(u => u.users))} concurrent users`, 
                  icon: ClockIcon 
                },
                { 
                  title: "Most Popular Category",
                  value: Object.keys(categoryDistribution).reduce(
                    (a, b) =>
                      Number(categoryDistribution[a] ?? 0) > Number(categoryDistribution[b] ?? 0)
                        ? a
                        : b,
                    Object.keys(categoryDistribution)[0]
                  ),
                  subtitle: `${Math.max(
                    ...Object.values(categoryDistribution).map(v => Number(v) || 0)
                  )}% of all pools`,
                  icon: TrophyIcon
                },
                { 
                  title: "Average Pool Size", 
                  value: `${Math.round(globalStats.totalVolume / globalStats.totalPools)} ETH`, 
                  subtitle: "12% increase from last week", 
                  icon: UsersIcon 
                },
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="glass-card p-6 text-center hover:glow-magenta transition-all duration-300"
                >
                  <div className="mx-auto w-12 h-12 bg-gradient-somnia rounded-button flex items-center justify-center mb-4">
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-text-primary mb-2">{item.value}</h4>
                  <p className="text-text-secondary text-sm mb-1">{item.title}</p>
                  <p className="text-text-muted text-xs">{item.subtitle}</p>
                </motion.div>
              ))}
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
            <EnhancedStatsDashboard />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

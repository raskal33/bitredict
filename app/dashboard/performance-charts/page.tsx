"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ChartBarIcon,
  TrophyIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  LightBulbIcon,
  HandRaisedIcon,
  AcademicCapIcon,
  EyeIcon,
  PresentationChartLineIcon,
  ChartPieIcon
} from "@heroicons/react/24/outline";
import { 
  TrophyIcon as TrophySolid,
  FireIcon as FireSolid
} from "@heroicons/react/24/solid";

// Mock analytics data
const performanceMetrics = {
  creator: {
    totalPools: 12,
    wonPools: 9,
    settledPools: 10,
    totalVolume: 45600,
    winRate: 90.0,
    accuracy: 83.3,
    reputation: 4.8,
    averagePoolSize: 3800,
    totalFees: 2280,
    monthlyGrowth: 15.2
  },
  bettor: {
    totalBets: 47,
    wonBets: 32,
    totalStaked: 1250,
    totalWinnings: 1890,
    winRate: 68.1,
    profitLoss: 640,
    streak: 5,
    averageBetSize: 26.6,
    bestWin: 340,
    monthlyROI: 24.5
  },
  platform: {
    totalPools: 2847,
    totalVolume: 12500000,
    totalBets: 18394,
    activePools: 156,
    totalUsers: 4521,
    averagePoolSize: 4389,
    successfulPredictions: 1891,
    totalRewards: 8750000,
    monthlyActiveUsers: 1247,
    platformFees: 625000
  }
};

const monthlyData = [
  { month: "Jul", volume: 8500, profit: 340, pools: 8, winRate: 75 },
  { month: "Aug", volume: 12200, profit: 580, pools: 12, winRate: 83 },
  { month: "Sep", volume: 15800, profit: 720, pools: 15, winRate: 80 },
  { month: "Oct", volume: 18900, profit: 890, pools: 18, winRate: 85 },
  { month: "Nov", volume: 22400, profit: 1120, pools: 22, winRate: 88 },
  { month: "Dec", volume: 25600, profit: 1340, pools: 25, winRate: 90 }
];

const categoryPerformance = [
  { category: "Crypto", volume: 8500, pools: 8, winRate: 92, color: "bg-gradient-to-r from-orange-500 to-yellow-500" },
  { category: "Sports", volume: 6200, pools: 12, winRate: 85, color: "bg-gradient-to-r from-green-500 to-emerald-500" },
  { category: "Finance", volume: 4800, pools: 6, winRate: 88, color: "bg-gradient-to-r from-blue-500 to-cyan-500" },
  { category: "Politics", volume: 3200, pools: 4, winRate: 78, color: "bg-gradient-to-r from-purple-500 to-violet-500" },
  { category: "Tech", volume: 2900, pools: 5, winRate: 82, color: "bg-gradient-to-r from-pink-500 to-rose-500" }
];

const recentInsights = [
  {
    id: 1,
    type: "achievement",
    title: "New Win Streak Record",
    description: "You've achieved a 5-game winning streak, your best performance yet!",
    timestamp: "2 hours ago",
    icon: <TrophySolid className="h-5 w-5" />,
    color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30"
  },
  {
    id: 2,
    type: "insight",
    title: "Crypto Category Performance",
    description: "Your crypto predictions have a 92% win rate, significantly above average.",
    timestamp: "1 day ago",
    icon: <ChartBarIcon className="h-5 w-5" />,
    color: "text-blue-400 bg-blue-500/10 border-blue-500/30"
  },
  {
    id: 3,
    type: "recommendation",
    title: "Diversification Opportunity",
    description: "Consider exploring the Finance category for better portfolio balance.",
    timestamp: "2 days ago",
    icon: <LightBulbIcon className="h-5 w-5" />,
    color: "text-green-400 bg-green-500/10 border-green-500/30"
  },
  {
    id: 4,
    type: "milestone",
    title: "Volume Milestone",
    description: "You've crossed 25,000 SOL in total trading volume!",
    timestamp: "3 days ago",
    icon: <FireSolid className="h-5 w-5" />,
    color: "text-orange-400 bg-orange-500/10 border-orange-500/30"
  }
];

export default function Page() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [viewMode, setViewMode] = useState<"creator" | "bettor" | "combined">("combined");



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
            Analytics
          </h1>
          <p className="text-text-secondary">
            Deep insights into your prediction market performance
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-muted">View:</span>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as "creator" | "bettor" | "combined")}
              className="bg-bg-card border border-border-card rounded-button px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/50"
            >
              <option value="combined">Combined</option>
              <option value="creator">Creator</option>
              <option value="bettor">Bettor</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-muted">Period:</span>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as "7d" | "30d" | "90d" | "1y")}
              className="bg-bg-card border border-border-card rounded-button px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/50"
            >
              <option value="7d">7 Days</option>
              <option value="30d">30 Days</option>
              <option value="90d">90 Days</option>
              <option value="1y">1 Year</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: "Total Volume",
            value: `${(performanceMetrics.creator.totalVolume + performanceMetrics.bettor.totalStaked).toLocaleString()} SOL`,
            change: "+15.2%",
            icon: <BanknotesIcon className="h-6 w-6" />,
            color: "text-blue-400",
            bgColor: "bg-blue-500/10",
            borderColor: "border-blue-500/20"
          },
          {
            title: "Win Rate",
            value: `${((performanceMetrics.creator.winRate + performanceMetrics.bettor.winRate) / 2).toFixed(1)}%`,
            change: "+3.2%",
            icon: <TrophyIcon className="h-6 w-6" />,
            color: "text-yellow-400",
            bgColor: "bg-yellow-500/10",
            borderColor: "border-yellow-500/20"
          },
          {
            title: "Total Profit",
            value: `+${(performanceMetrics.bettor.profitLoss + performanceMetrics.creator.totalFees).toLocaleString()} SOL`,
            change: "+24.5%",
            icon: <ArrowTrendingUpIcon className="h-6 w-6" />,
            color: "text-green-400",
            bgColor: "bg-green-500/10",
            borderColor: "border-green-500/20"
          },
          {
            title: "Reputation Score",
            value: performanceMetrics.creator.reputation.toFixed(1),
            change: "+0.3",
            icon: <TrophyIcon className="h-6 w-6" />,
            color: "text-purple-400",
            bgColor: "bg-purple-500/10",
            borderColor: "border-purple-500/20"
          }
        ].map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            className={`glass-card p-6 relative overflow-hidden ${metric.bgColor} ${metric.borderColor}`}
          >
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${metric.bgColor} ${metric.borderColor} border`}>
                  <div className={metric.color}>
                    {metric.icon}
                  </div>
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium text-green-400`}>
                  <ArrowTrendingUpIcon className="h-3 w-3" />
                  {metric.change}
                </div>
              </div>
              <div className="text-2xl font-bold text-text-primary mb-1">
                {metric.value}
              </div>
              <div className="text-sm text-text-muted">
                {metric.title}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/20 border border-primary/30">
                <PresentationChartLineIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-text-primary">Performance Trends</h3>
                <p className="text-sm text-text-muted">Monthly volume and profit analysis</p>
              </div>
            </div>
            <button className="p-2 rounded-button bg-bg-card border border-border-card hover:bg-[rgba(255,255,255,0.05)] transition-all duration-200">
              <EyeIcon className="h-4 w-4 text-text-muted" />
            </button>
          </div>
          
          {/* Mock Chart */}
          <div className="h-80 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl border border-border-card p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
            <div className="relative z-10 h-full flex items-end justify-between gap-2">
              {monthlyData.map((data, index) => (
                <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                  <div className="text-xs text-text-muted">{data.volume.toLocaleString()}</div>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(data.volume / 30000) * 100}%` }}
                    transition={{ duration: 1, delay: 0.1 * index, ease: "easeOut" }}
                    className="w-full bg-gradient-to-t from-primary to-secondary rounded-t-lg min-h-[20px] relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent animate-shimmer" />
                  </motion.div>
                  <div className="text-sm font-medium text-text-primary">{data.month}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-secondary/20 border border-secondary/30">
                <ChartPieIcon className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-text-primary">Categories</h3>
                <p className="text-sm text-text-muted">Performance by category</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            {categoryPerformance.map((category, index) => (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-bg-card rounded-xl border border-border-card p-4 hover:bg-[rgba(255,255,255,0.03)] transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold text-text-primary">{category.category}</div>
                  <div className="text-sm font-medium text-green-400">{category.winRate}%</div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-text-muted mb-2">
                  <span>Volume: {category.volume.toLocaleString()} SOL</span>
                  <span>{category.pools} pools</span>
                </div>
                
                <div className="w-full bg-bg-main rounded-full h-2 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${category.color} relative overflow-hidden`}
                    initial={{ width: 0 }}
                    animate={{ width: `${category.winRate}%` }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 + index * 0.1 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Detailed Performance Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Creator Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-green-500/20 border border-green-500/30">
              <LightBulbIcon className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-text-primary">Creator Performance</h3>
              <p className="text-sm text-text-muted">Your prediction creation metrics</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            {[
              { label: "Total Pools", value: performanceMetrics.creator.totalPools, suffix: "" },
              { label: "Win Rate", value: performanceMetrics.creator.winRate, suffix: "%" },
              { label: "Avg Pool Size", value: performanceMetrics.creator.averagePoolSize, suffix: " SOL" },
              { label: "Total Fees", value: performanceMetrics.creator.totalFees, suffix: " SOL" },
              { label: "Accuracy", value: performanceMetrics.creator.accuracy, suffix: "%" },
              { label: "Reputation", value: performanceMetrics.creator.reputation, suffix: "/5" }
            ].map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
                className="text-center"
              >
                <div className="text-2xl font-bold text-text-primary mb-1">
                  {metric.value}{metric.suffix}
                </div>
                <div className="text-sm text-text-muted">{metric.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bettor Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-500/30">
              <HandRaisedIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-text-primary">Betting Performance</h3>
              <p className="text-sm text-text-muted">Your betting activity metrics</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            {[
              { label: "Total Bets", value: performanceMetrics.bettor.totalBets, suffix: "" },
              { label: "Win Rate", value: performanceMetrics.bettor.winRate, suffix: "%" },
              { label: "Avg Bet Size", value: performanceMetrics.bettor.averageBetSize, suffix: " SOL" },
              { label: "Best Win", value: performanceMetrics.bettor.bestWin, suffix: " SOL" },
              { label: "Win Streak", value: performanceMetrics.bettor.streak, suffix: "" },
              { label: "Monthly ROI", value: performanceMetrics.bettor.monthlyROI, suffix: "%" }
            ].map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
                className="text-center"
              >
                <div className="text-2xl font-bold text-text-primary mb-1">
                  {metric.value}{metric.suffix}
                </div>
                <div className="text-sm text-text-muted">{metric.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Insights and Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-accent/20 border border-accent/30">
            <AcademicCapIcon className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text-primary">AI Insights</h3>
            <p className="text-sm text-text-muted">Personalized recommendations and achievements</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentInsights.map((insight, index) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className={`p-4 rounded-xl border backdrop-blur-sm ${insight.color}`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg border ${insight.color}`}>
                  {insight.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-text-primary mb-1">{insight.title}</h4>
                  <p className="text-sm text-text-secondary mb-2">{insight.description}</p>
                  <div className="text-xs text-text-muted">{insight.timestamp}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

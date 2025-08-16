"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  WalletIcon,
  TrophyIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  EyeIcon,
  AdjustmentsHorizontalIcon,
  PlusIcon
} from "@heroicons/react/24/outline";

// Mock portfolio data
const mockPortfolio = [
  {
    id: 1,
    title: "Bitcoin reaches $100,000 by March 2025",
    type: "bet",
    amount: 250,
    outcome: "Yes",
    odds: 1.75,
    potential: 437.5,
    status: "active",
    endDate: "2025-03-31",
    progress: 67.5,
    theme: "cyan",
    category: "Crypto",
    createdAt: "2024-12-15",
    currentValue: 320,
    unrealizedPL: 70
  },
  {
    id: 2,
    title: "Tesla Stock Prediction Q1 2025",
    type: "liquidity",
    amount: 500,
    outcome: "Against",
    odds: 1.8,
    potential: 720,
    status: "active",
    endDate: "2025-02-15",
    progress: 23.1,
    theme: "violet",
    category: "Stocks",
    createdAt: "2024-12-10",
    currentValue: 540,
    unrealizedPL: 40
  },
  {
    id: 3,
    title: "Manchester City wins Premier League",
    type: "bet",
    amount: 150,
    outcome: "Yes",
    odds: 2.1,
    potential: 315,
    status: "winning",
    endDate: "2025-05-25",
    progress: 78.2,
    theme: "magenta",
    category: "Sports",
    createdAt: "2024-11-20",
    currentValue: 240,
    unrealizedPL: 90
  },
  {
    id: 4,
    title: "Fed Rate Decision Q4 2024",
    type: "bet",
    amount: 200,
    outcome: "No",
    odds: 1.6,
    potential: 320,
    status: "won",
    endDate: "2024-12-18",
    progress: 100,
    theme: "cyan",
    category: "Finance",
    createdAt: "2024-11-15",
    currentValue: 320,
    unrealizedPL: 120
  },
  {
    id: 5,
    title: "Apple Stock Price Prediction",
    type: "liquidity",
    amount: 300,
    outcome: "Against",
    odds: 1.9,
    potential: 570,
    status: "losing",
    endDate: "2024-12-30",
    progress: 15.2,
    theme: "violet",
    category: "Stocks",
    createdAt: "2024-12-01",
    currentValue: 180,
    unrealizedPL: -120
  }
];

const portfolioSummary = {
  totalValue: mockPortfolio.reduce((sum, p) => sum + p.currentValue, 0),
  totalInvested: mockPortfolio.reduce((sum, p) => sum + p.amount, 0),
  unrealizedPL: mockPortfolio.reduce((sum, p) => sum + p.unrealizedPL, 0),
  activePositions: mockPortfolio.filter(p => p.status === "active").length,
  winningPositions: mockPortfolio.filter(p => p.status === "winning" || p.status === "won").length,
  totalPositions: mockPortfolio.length
};

export default function Page() {
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "winning" | "losing" | "won">("all");
  const [filterType, setFilterType] = useState<"all" | "bet" | "liquidity">("all");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "pl" | "progress">("date");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "text-blue-400 bg-blue-500/10 border-blue-500/30";
      case "winning": return "text-green-400 bg-green-500/10 border-green-500/30";
      case "losing": return "text-red-400 bg-red-500/10 border-red-500/30";
      case "won": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      case "lost": return "text-red-500 bg-red-600/10 border-red-600/30";
      default: return "text-gray-400 bg-gray-500/10 border-gray-500/30";
    }
  };

  const getCardTheme = (theme: string) => {
    const themes = {
      cyan: {
        background: "bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent",
        border: "border-cyan-500/20",
        glow: "shadow-[0_0_30px_rgba(34,199,255,0.1)]",
        accent: "text-cyan-400",
        progressBg: "bg-gradient-to-r from-cyan-500 to-blue-500"
      },
      magenta: {
        background: "bg-gradient-to-br from-pink-500/10 via-rose-500/5 to-transparent",
        border: "border-pink-500/20",
        glow: "shadow-[0_0_30px_rgba(255,0,128,0.1)]",
        accent: "text-pink-400",
        progressBg: "bg-gradient-to-r from-pink-500 to-rose-500"
      },
      violet: {
        background: "bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent",
        border: "border-violet-500/20",
        glow: "shadow-[0_0_30px_rgba(140,0,255,0.1)]",
        accent: "text-violet-400",
        progressBg: "bg-gradient-to-r from-violet-500 to-purple-500"
      }
    };
    return themes[theme as keyof typeof themes] || themes.cyan;
  };

  const filteredPortfolio = mockPortfolio
    .filter(position => filterStatus === "all" || position.status === filterStatus)
    .filter(position => filterType === "all" || position.type === filterType)
    .sort((a, b) => {
      switch (sortBy) {
        case "amount": return b.amount - a.amount;
        case "pl": return b.unrealizedPL - a.unrealizedPL;
        case "progress": return b.progress - a.progress;
        case "date":
        default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const roiPercentage = ((portfolioSummary.unrealizedPL / portfolioSummary.totalInvested) * 100);

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
            Portfolio
          </h1>
          <p className="text-text-secondary">
            Track and manage your prediction market positions
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link 
            href="/create-prediction"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-primary text-black rounded-button font-semibold shadow-button hover:brightness-110 hover:scale-105 transition-all duration-200"
          >
            <PlusIcon className="h-4 w-4" />
            New Position
          </Link>
        </div>
      </motion.div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: "Total Value",
            value: `${portfolioSummary.totalValue} SOL`,
            change: roiPercentage >= 0 ? `+${roiPercentage.toFixed(1)}%` : `${roiPercentage.toFixed(1)}%`,
            icon: <WalletIcon className="h-6 w-6" />,
            color: "text-blue-400",
            bgColor: "bg-blue-500/10",
            borderColor: "border-blue-500/20",
            isPositive: roiPercentage >= 0
          },
          {
            title: "Unrealized P&L",
            value: `${portfolioSummary.unrealizedPL >= 0 ? '+' : ''}${portfolioSummary.unrealizedPL} SOL`,
            change: `${((portfolioSummary.unrealizedPL / portfolioSummary.totalInvested) * 100).toFixed(1)}%`,
            icon: <ChartBarIcon className="h-6 w-6" />,
            color: portfolioSummary.unrealizedPL >= 0 ? "text-green-400" : "text-red-400",
            bgColor: portfolioSummary.unrealizedPL >= 0 ? "bg-green-500/10" : "bg-red-500/10",
            borderColor: portfolioSummary.unrealizedPL >= 0 ? "border-green-500/20" : "border-red-500/20",
            isPositive: portfolioSummary.unrealizedPL >= 0
          },
          {
            title: "Active Positions",
            value: portfolioSummary.activePositions.toString(),
            change: `${portfolioSummary.totalPositions} total`,
            icon: <BanknotesIcon className="h-6 w-6" />,
            color: "text-purple-400",
            bgColor: "bg-purple-500/10",
            borderColor: "border-purple-500/20",
            isPositive: true
          },
          {
            title: "Win Rate",
            value: `${((portfolioSummary.winningPositions / portfolioSummary.totalPositions) * 100).toFixed(1)}%`,
            change: `${portfolioSummary.winningPositions}/${portfolioSummary.totalPositions}`,
            icon: <TrophyIcon className="h-6 w-6" />,
            color: "text-yellow-400",
            bgColor: "bg-yellow-500/10",
            borderColor: "border-yellow-500/20",
            isPositive: true
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
                <div className={`flex items-center gap-1 text-sm font-medium ${metric.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {metric.isPositive ? (
                    <ArrowTrendingUpIcon className="h-3 w-3" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-3 w-3" />
                  )}
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

      {/* Filters and Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-2">
            <AdjustmentsHorizontalIcon className="h-5 w-5 text-text-muted" />
            <span className="text-sm font-medium text-text-secondary">Filters:</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-muted">Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as "all" | "active" | "winning" | "losing" | "won")}
                className="bg-bg-card border border-border-card rounded-button px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/50"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="winning">Winning</option>
                <option value="losing">Losing</option>
                <option value="won">Won</option>
              </select>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-muted">Type:</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as "all" | "bet" | "liquidity")}
                className="bg-bg-card border border-border-card rounded-button px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/50"
              >
                <option value="all">All</option>
                <option value="bet">Bets</option>
                <option value="liquidity">Liquidity</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-muted">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "date" | "amount" | "pl" | "progress")}
                className="bg-bg-card border border-border-card rounded-button px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/50"
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="pl">P&L</option>
                <option value="progress">Progress</option>
              </select>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Portfolio Positions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-text-primary">Your Positions</h3>
            <p className="text-sm text-text-muted">
              Showing {filteredPortfolio.length} of {mockPortfolio.length} positions
            </p>
          </div>
          <button className="p-2 rounded-button bg-bg-card border border-border-card hover:bg-[rgba(255,255,255,0.05)] transition-all duration-200">
            <EyeIcon className="h-4 w-4 text-text-muted" />
          </button>
        </div>
        
        <div className="space-y-4">
          {filteredPortfolio.map((position, index) => {
            const theme = getCardTheme(position.theme);
            return (
              <motion.div
                key={position.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className={`p-4 rounded-xl border backdrop-blur-sm hover:bg-[rgba(255,255,255,0.02)] transition-all duration-200 ${theme.background} ${theme.border}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`px-2 py-1 rounded-button text-xs font-medium ${getStatusColor(position.status)} border`}>
                      {position.status.charAt(0).toUpperCase() + position.status.slice(1)}
                    </div>
                    <div className="text-sm text-text-muted">
                      {position.type === "bet" ? "Bet" : "Liquidity"} • {position.category}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-text-primary">
                      {position.currentValue} SOL
                    </div>
                    <div className={`text-xs font-medium ${position.unrealizedPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {position.unrealizedPL >= 0 ? '+' : ''}{position.unrealizedPL} SOL
                    </div>
                  </div>
                </div>
                
                <Link href={`/bet/${position.id}`} className="block mb-4">
                  <h4 className="font-semibold text-text-primary hover:text-primary transition-colors line-clamp-1">
                    {position.title}
                  </h4>
                </Link>
                
                {/* Progress Bar */}
                {position.status !== "won" && position.status !== "lost" && (
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-text-muted">Progress</span>
                      <span className="text-xs font-medium text-text-primary">{position.progress}%</span>
                    </div>
                    <div className="w-full bg-bg-card rounded-full h-2 border border-border-card overflow-hidden">
                      <motion.div 
                        className={`h-full rounded-full ${theme.progressBg} relative overflow-hidden`}
                        initial={{ width: 0 }}
                        animate={{ width: `${position.progress}%` }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 + index * 0.1 }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                      </motion.div>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-text-muted">Invested:</span>
                    <div className="font-medium text-text-primary">{position.amount} SOL</div>
                  </div>
                  <div>
                    <span className="text-text-muted">Outcome:</span>
                    <div className="font-medium text-text-primary">{position.outcome}</div>
                  </div>
                  <div>
                    <span className="text-text-muted">Odds:</span>
                    <div className={`font-medium ${theme.accent}`}>{position.odds}x</div>
                  </div>
                  <div>
                    <span className="text-text-muted">Ends:</span>
                    <div className="font-medium text-text-primary flex items-center gap-1">
                      <CalendarDaysIcon className="h-3 w-3" />
                      {position.endDate}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {filteredPortfolio.length === 0 && (
          <div className="text-center py-12">
            <WalletIcon className="h-12 w-12 text-text-muted mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-text-primary mb-2">No positions found</h4>
            <p className="text-text-muted mb-4">
              {filterStatus !== "all" || filterType !== "all" 
                ? "Try adjusting your filters to see more positions."
                : "Start by creating your first prediction market position."
              }
            </p>
            <Link 
              href="/create-prediction"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-primary text-black rounded-button font-semibold shadow-button hover:brightness-110 transition-all duration-200"
            >
              <PlusIcon className="h-4 w-4" />
              Create Position
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}

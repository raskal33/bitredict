"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAccount } from "wagmi";
import { usePortfolio } from "@/hooks/usePortfolio";
import { formatSTT, formatBITR, formatPercentage, formatShortDate } from "@/utils/formatters";
import {
  WalletIcon,
  TrophyIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  AdjustmentsHorizontalIcon,
  PlusIcon
} from "@heroicons/react/24/outline";

export default function Page() {
  const { address } = useAccount();
  const { data: portfolioData, isLoading, error } = usePortfolio();
  
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "won" | "lost" | "ended">("all");
  const [filterType, setFilterType] = useState<"all" | "pool_bet" | "oddyssey">("all");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "pl" | "status">("date");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "text-blue-400 bg-blue-500/10 border-blue-500/30";
      case "won": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      case "lost": return "text-red-500 bg-red-600/10 border-red-600/30";
      case "ended": return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
      case "pending": return "text-gray-400 bg-gray-500/10 border-gray-500/30";
      default: return "text-gray-400 bg-gray-500/10 border-gray-500/30";
    }
  };

  const getCardTheme = (category: string) => {
    const themes = {
      Sports: {
        background: "bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent",
        border: "border-cyan-500/20",
        accent: "text-cyan-400",
        progressBg: "bg-gradient-to-r from-cyan-500 to-blue-500"
      },
      Oddyssey: {
        background: "bg-gradient-to-br from-pink-500/10 via-rose-500/5 to-transparent",
        border: "border-pink-500/20",
        accent: "text-pink-400",
        progressBg: "bg-gradient-to-r from-pink-500 to-rose-500"
      },
      Crypto: {
        background: "bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent",
        border: "border-violet-500/20",
        accent: "text-violet-400",
        progressBg: "bg-gradient-to-r from-violet-500 to-purple-500"
      }
    };
    return themes[category as keyof typeof themes] || themes.Sports;
  };

  if (!address) {
    return (
      <div className="space-y-8">
        <div className="glass-card p-12 text-center">
          <WalletIcon className="h-16 w-16 text-text-muted mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-text-primary mb-2">Connect Your Wallet</h2>
          <p className="text-text-secondary mb-6">Please connect your wallet to view your portfolio</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="glass-card p-8">
          <div className="h-8 bg-card-bg rounded w-1/3 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
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

  if (error || !portfolioData) {
    return (
      <div className="glass-card p-12 text-center">
        <h2 className="text-xl font-bold text-text-primary mb-2">Error Loading Portfolio</h2>
        <p className="text-text-secondary">Please try again later</p>
      </div>
    );
  }

  const { summary, positions } = portfolioData;

  const filteredPortfolio = positions
    .filter(position => filterStatus === "all" || position.status === filterStatus)
    .filter(position => filterType === "all" || position.type === filterType)
    .sort((a, b) => {
      switch (sortBy) {
        case "amount": return parseFloat(b.amount) - parseFloat(a.amount);
        case "pl": return parseFloat(b.unrealizedPL) - parseFloat(a.unrealizedPL);
        case "status": return a.status.localeCompare(b.status);
        case "date":
        default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const roiPercentage = summary.totalInvested > 0 
    ? ((summary.unrealizedPL / summary.totalInvested) * 100) 
    : 0;

  const winRate = summary.totalPositions > 0
    ? ((summary.wonPositions / summary.totalPositions) * 100)
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
            value: formatSTT(summary.currentValue),
            change: roiPercentage >= 0 ? `+${roiPercentage.toFixed(1)}%` : `${roiPercentage.toFixed(1)}%`,
            icon: <WalletIcon className="h-6 w-6" />,
            color: "text-blue-400",
            bgColor: "bg-blue-500/10",
            borderColor: "border-blue-500/20",
            isPositive: roiPercentage >= 0
          },
          {
            title: "Unrealized P&L",
            value: formatSTT(summary.unrealizedPL),
            change: formatPercentage(roiPercentage),
            icon: <ChartBarIcon className="h-6 w-6" />,
            color: summary.unrealizedPL >= 0 ? "text-green-400" : "text-red-400",
            bgColor: summary.unrealizedPL >= 0 ? "bg-green-500/10" : "bg-red-500/10",
            borderColor: summary.unrealizedPL >= 0 ? "border-green-500/20" : "border-red-500/20",
            isPositive: summary.unrealizedPL >= 0
          },
          {
            title: "Active Positions",
            value: summary.activePositions.toString(),
            change: `${summary.totalPositions} total`,
            icon: <BanknotesIcon className="h-6 w-6" />,
            color: "text-purple-400",
            bgColor: "bg-purple-500/10",
            borderColor: "border-purple-500/20",
            isPositive: true
          },
          {
            title: "Win Rate",
            value: formatPercentage(winRate),
            change: `${summary.wonPositions}/${summary.totalPositions}`,
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
                onChange={(e) => setFilterStatus(e.target.value as "all" | "active" | "won" | "lost" | "ended")}
                className="bg-bg-card border border-border-card rounded-button px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/50"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
                <option value="ended">Ended</option>
              </select>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-muted">Type:</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as "all" | "pool_bet" | "oddyssey")}
                className="bg-bg-card border border-border-card rounded-button px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/50"
              >
                <option value="all">All</option>
                <option value="pool_bet">Pool Bets</option>
                <option value="oddyssey">Oddyssey</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-muted">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "date" | "amount" | "pl" | "status")}
                className="bg-bg-card border border-border-card rounded-button px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/50"
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="pl">P&L</option>
                <option value="status">Status</option>
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
              Showing {filteredPortfolio.length} of {positions.length} positions
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          {filteredPortfolio.map((position, index) => {
            const theme = getCardTheme(position.category);
            const formatAmount = position.token === 'BITR' ? formatBITR : formatSTT;
            const unrealizedPL = parseFloat(position.unrealizedPL);
            
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
                      {position.type === "oddyssey" ? "Oddyssey" : "Pool Bet"} • {position.category}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-text-primary">
                      {formatAmount(position.currentValue)}
                    </div>
                    <div className={`text-xs font-medium ${unrealizedPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {unrealizedPL >= 0 ? '+' : ''}{formatAmount(position.unrealizedPL)}
                    </div>
                  </div>
                </div>
                
                <Link 
                  href={position.type === "oddyssey" ? `/oddyssey` : `/bet/${position.poolId}`} 
                  className="block mb-4"
                >
                  <h4 className="font-semibold text-text-primary hover:text-primary transition-colors line-clamp-1">
                    {position.title}
                  </h4>
                </Link>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-text-muted">Invested:</span>
                    <div className="font-medium text-text-primary">{formatAmount(position.amount)}</div>
                  </div>
                  {position.outcome && (
                    <div>
                      <span className="text-text-muted">Outcome:</span>
                      <div className="font-medium text-text-primary">{position.outcome}</div>
                    </div>
                  )}
                  {position.score !== null && position.score !== undefined && (
                    <div>
                      <span className="text-text-muted">Score:</span>
                      <div className={`font-medium ${theme.accent}`}>{position.score}/10</div>
                    </div>
                  )}
                  {position.endDate && (
                    <div>
                      <span className="text-text-muted">Date:</span>
                      <div className="font-medium text-text-primary flex items-center gap-1">
                        <CalendarDaysIcon className="h-3 w-3" />
                        {formatShortDate(position.endDate)}
                      </div>
                    </div>
                  )}
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

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAccount } from "wagmi";
import { usePortfolio } from "@/hooks/usePortfolio";
import { formatSTT, formatPercentage, formatShortDate } from "@/utils/formatters";
import {
  Wallet,
  Trophy,
  History,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Filter,
  Plus,
  ArrowUpRight,
  Target,
  Clock,
  Globe
} from "lucide-react";
import Button from "@/components/button";

export default function Page() {
  const { address } = useAccount();
  const { data: portfolioData, isLoading, error } = usePortfolio();

  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "won" | "lost" | "ended">("all");
  const [filterType, setFilterType] = useState<"all" | "pool_bet" | "oddyssey">("all");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "pl" | "status">("date");

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "active": return "text-somnia-cyan bg-somnia-cyan/10 border-somnia-cyan/20";
      case "won": return "text-green-400 bg-green-400/10 border-green-400/20";
      case "lost": return "text-red-400 bg-red-400/10 border-red-400/20";
      case "ended": return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      default: return "text-text-muted bg-white/5 border-white/10";
    }
  };

  const getCardTheme = (category: string) => {
    const themes = {
      Sports: {
        background: "bg-somnia-blue/5",
        border: "border-somnia-blue/20",
        accent: "text-somnia-blue",
        glow: "shadow-[0_0_15px_rgba(0,123,255,0.1)]"
      },
      Oddyssey: {
        background: "bg-somnia-magenta/5",
        border: "border-somnia-magenta/20",
        accent: "text-somnia-magenta",
        glow: "shadow-[0_0_15px_rgba(255,0,128,0.1)]"
      },
      Crypto: {
        background: "bg-somnia-cyan/5",
        border: "border-somnia-cyan/20",
        accent: "text-somnia-cyan",
        glow: "shadow-[0_0_15px_rgba(34,199,255,0.1)]"
      }
    };
    return themes[category as keyof typeof themes] || themes.Sports;
  };

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-12 text-center max-w-md bg-bg-card/40 border-white/10 backdrop-blur-2xl relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-somnia-cyan to-somnia-violet"></div>
          <div className="p-4 bg-white/5 rounded-full inline-block mb-6 group-hover:scale-110 transition-transform">
            <Wallet className="h-12 w-12 text-somnia-cyan" />
          </div>
          <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tight">Connect Wallet</h2>
          <p className="text-text-muted mb-8 text-sm leading-relaxed">Please connect your decentralized wallet to authorize access to your encrypted portfolio and transaction history.</p>
          <Button variant="primary" size="lg" fullWidth className="font-bold tracking-widest uppercase">
            Initialize Access
          </Button>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-40 bg-white/5 rounded-3xl border border-white/10 w-full"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white/5 rounded-2xl border border-white/10"></div>
          ))}
        </div>
        <div className="h-96 bg-white/5 rounded-3xl border border-white/10"></div>
      </div>
    );
  }

  if (error || !portfolioData) {
    return (
      <div className="glass-card p-12 text-center border-red-500/20 bg-red-500/5">
        <BarChart3 className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2 uppercase">Sync Failed</h2>
        <p className="text-text-muted text-sm">We couldn&apos;t synchronize your portfolio data. Reach out to support if this persists.</p>
        <Button variant="outline" className="mt-6 font-bold" onClick={() => window.location.reload()}>Retry Sync</Button>
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
    <div className="space-y-10 pb-20">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2"
      >
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-somnia-violet/10 border border-somnia-violet/20 text-somnia-violet text-[10px] font-black uppercase tracking-[0.2em]">
            <History className="w-3 h-3" /> Historical Analytics
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-white uppercase tracking-tighter">
            Market <span className="bg-gradient-to-r from-somnia-cyan to-somnia-violet bg-clip-text text-transparent">Portfolio</span>
          </h1>
          <p className="text-text-muted text-sm max-w-lg font-medium">Comprehensive breakdown of your active positions, performance metrics, and historical trade data.</p>
        </div>

        <Link href="/markets">
          <Button size="lg" className="shadow-[0_0_20px_rgba(34,199,255,0.2)] hover:shadow-[0_0_30px_rgba(34,199,255,0.4)] transition-all font-black uppercase tracking-widest text-xs">
            New Position <Plus className="ml-2 w-4 h-4" />
          </Button>
        </Link>
      </motion.div>

      {/* Portfolio Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: "Total Assets",
            value: formatSTT(summary.currentValue),
            change: roiPercentage >= 0 ? `+${roiPercentage.toFixed(1)}%` : `${roiPercentage.toFixed(1)}%`,
            icon: Wallet,
            color: "text-somnia-cyan",
            bg: "bg-somnia-cyan/10",
            isPositive: roiPercentage >= 0
          },
          {
            title: "Real-time P&L",
            value: formatSTT(summary.unrealizedPL),
            change: formatPercentage(roiPercentage),
            icon: BarChart3,
            color: summary.unrealizedPL >= 0 ? "text-green-400" : "text-red-400",
            bg: summary.unrealizedPL >= 0 ? "bg-green-400/10" : "bg-red-400/10",
            isPositive: summary.unrealizedPL >= 0
          },
          {
            title: "Open Intents",
            value: summary.activePositions.toString(),
            change: `${summary.totalPositions} lifetime`,
            icon: Target,
            color: "text-somnia-violet",
            bg: "bg-somnia-violet/10",
            isPositive: true
          },
          {
            title: "Success Rate",
            value: formatPercentage(winRate),
            change: `${summary.wonPositions}/${summary.totalPositions} won`,
            icon: Trophy,
            color: "text-somnia-magenta",
            bg: "bg-somnia-magenta/10",
            isPositive: true
          }
        ].map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            whileHover={{ y: -5 }}
            className="glass-card p-6 border-white/5 bg-bg-card/20 hover:bg-bg-card/40 transition-all group overflow-hidden relative"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 ${metric.bg} rounded-full blur-3xl -mr-12 -mt-12 opacity-40 group-hover:opacity-60 transition-all`}></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className={`p-3 rounded-2xl ${metric.bg} ${metric.color} shadow-inner`}>
                  <metric.icon className="h-6 w-6" />
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black ${metric.isPositive ? 'text-green-400 bg-green-400/10 border border-green-400/20' : 'text-red-400 bg-red-400/10 border border-red-400/20'}`}>
                  {metric.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {metric.change}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-black text-white tracking-tighter">{metric.value}</p>
                <p className="text-[10px] font-black text-text-muted/60 uppercase tracking-[0.2em]">{metric.title}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Market Positions Section */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-somnia-cyan" />
              Active Positions
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-text-muted/40 uppercase tracking-widest hidden sm:inline">Total: {filteredPortfolio.length}</span>
            </div>
          </div>

          <div className="space-y-4">
            {filteredPortfolio.map((position, index) => {
              const theme = getCardTheme(position.category);
              const unrealizedPLValue = parseFloat(position.unrealizedPL);

              return (
                <motion.div
                  key={position.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  whileHover={{ x: 4 }}
                  className={`glass-card p-5 border-white/10 bg-bg-card/20 hover:bg-bg-card/40 transition-all group overflow-hidden relative ${theme.glow}`}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${theme.accent.replace('text-', 'from-').replace('text-', 'to-')} opacity-40 group-hover:opacity-100 transition-all`}></div>

                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(position.status)}`}>
                          {position.status}
                        </span>
                        <span className="text-[10px] font-black text-text-muted/60 uppercase tracking-[0.2em] flex items-center gap-1.5 px-2">
                          {position.type === "oddyssey" ? "Oddyssey" : "Pool Bet"} <span className="w-1 h-1 rounded-full bg-white/20"></span> {position.category}
                        </span>
                      </div>

                      <Link href={position.type === "oddyssey" ? `/oddyssey` : `/markets/${position.poolId}`} className="block group/title">
                        <h4 className="text-lg font-bold text-white group-hover/title:text-somnia-cyan transition-colors line-clamp-1 leading-tight mb-4">
                          {position.title}
                        </h4>
                      </Link>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                        <div>
                          <p className="text-[9px] font-black text-text-muted/30 uppercase tracking-widest mb-1.5 italic">Amount Committed</p>
                          <p className="text-xs font-black text-white">{parseFloat(position.amount).toLocaleString()} <span className="text-somnia-cyan/60">{position.token}</span></p>
                        </div>
                        {position.outcome && (
                          <div>
                            <p className="text-[9px] font-black text-text-muted/30 uppercase tracking-widest mb-1.5 italic">Staked On</p>
                            <p className="text-xs font-black text-white">{position.outcome}</p>
                          </div>
                        )}
                        {position.endDate && (
                          <div className="col-span-1">
                            <p className="text-[9px] font-black text-text-muted/30 uppercase tracking-widest mb-1.5 italic">Market Close</p>
                            <p className="text-xs font-black text-text-muted flex items-center gap-1.5">
                              <Clock className="w-3 h-3" />
                              {formatShortDate(position.endDate)}
                            </p>
                          </div>
                        )}
                        <div className="flex items-center justify-end md:justify-start">
                          <Link href={`/markets/${position.poolId}`} className="p-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-somnia-cyan hover:text-black transition-all">
                            <ArrowUpRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>

                    <div className="sm:border-l border-white/5 sm:pl-6 flex sm:flex-col justify-between sm:justify-center items-center sm:min-w-[140px] py-2 bg-white/3 sm:bg-transparent rounded-xl px-4 sm:px-0">
                      <div className="text-center sm:mb-4">
                        <p className="text-[10px] font-black text-text-muted/30 uppercase tracking-widest mb-1">Current Val</p>
                        <p className="text-sm font-black text-white tracking-widest">{formatSTT(position.currentValue)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-black text-text-muted/30 uppercase tracking-widest mb-1">Gains/Loss</p>
                        <p className={`text-sm font-black tracking-widest flex items-center justify-center gap-1 ${unrealizedPLValue >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {unrealizedPLValue >= 0 ? '+' : ''}{formatSTT(position.unrealizedPL)}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {filteredPortfolio.length === 0 && (
              <div className="glass-card py-24 text-center border-dashed border-white/10 opacity-60">
                <BarChart3 className="h-16 w-16 text-text-muted/20 mx-auto mb-6" />
                <h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Portfolio Empty</h4>
                <p className="text-text-muted text-sm max-w-xs mx-auto mb-8 font-medium">Your investment deck is currently vacant. Start participating in market pools to track performance here.</p>
                <Link href="/markets">
                  <Button variant="outline" className="border-somnia-cyan/40 text-somnia-cyan hover:bg-somnia-cyan/10 px-8 font-black uppercase tracking-widest text-xs">Explore Active Pools</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Filters Sidebar */}
        <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-32">
          <div className="glass-card p-8 border-white/10 bg-bg-card/40 backdrop-blur-2xl">
            <div className="flex items-center gap-3 mb-8">
              <Filter className="w-5 h-5 text-somnia-cyan" />
              <h3 className="font-bold text-white uppercase tracking-[0.2em] text-sm">Context Filter</h3>
            </div>

            <div className="space-y-8">
              {/* Status Filter */}
              <div className="space-y-4">
                <p className="text-[10px] font-black text-text-muted/40 uppercase tracking-widest px-1">Market State</p>
                <div className="flex flex-wrap gap-2">
                  {["all", "active", "won", "lost", "ended"].map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status as "all" | "active" | "won" | "lost" | "ended")}
                      className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${filterStatus === status
                        ? "bg-somnia-cyan text-black border-somnia-cyan shadow-[0_0_15px_rgba(34,199,255,0.3)]"
                        : "bg-white/5 text-text-muted border-white/10 hover:border-white/20"
                        }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type Filter */}
              <div className="space-y-4">
                <p className="text-[10px] font-black text-text-muted/40 uppercase tracking-widest px-1">Instrument Type</p>
                <div className="flex flex-col gap-2">
                  {[
                    { id: "all", label: "All Instruments", icon: Globe },
                    { id: "pool_bet", label: "Predict Pools", icon: Target },
                    { id: "oddyssey", label: "Oddyssey Deck", icon: Trophy }
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setFilterType(type.id as "all" | "pool_bet" | "oddyssey")}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-bold tracking-wide border transition-all ${filterType === type.id
                        ? "bg-gradient-to-r from-somnia-violet/20 to-somnia-blue/10 text-white border-somnia-violet/40 shadow-inner"
                        : "bg-white/5 text-text-muted border-white/10 hover:text-white"
                        }`}
                    >
                      <type.icon className={`h-4 w-4 ${filterType === type.id ? 'text-somnia-violet' : 'text-text-muted/40'}`} />
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Order */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <p className="text-[10px] font-black text-text-muted/40 uppercase tracking-widest px-1">Hierarchy Order</p>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "date" | "amount" | "pl" | "status")}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-xs font-bold text-white focus:outline-none focus:border-somnia-cyan/40 transition-all appearance-none cursor-pointer"
                >
                  <option value="date">Closing Date (Latest)</option>
                  <option value="amount">Investment Size</option>
                  <option value="pl">Performace (P&L)</option>
                  <option value="status">Lifecycle Status</option>
                </select>
              </div>

              <Button variant="ghost" fullWidth className="text-[10px] text-text-muted/40 hover:text-red-400 font-black uppercase" onClick={() => {
                setFilterStatus("all");
                setFilterType("all");
                setSortBy("date");
              }}>
                Clear Local Cache Filters
              </Button>
            </div>
          </div>

          <div className="glass-card p-6 border-white/10 bg-gradient-to-br from-somnia-cyan/10 to-transparent border-r-somnia-cyan/30 text-center">
            <div className="w-12 h-12 rounded-full bg-somnia-cyan/20 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-6 h-6 text-somnia-cyan" />
            </div>
            <h4 className="text-white font-bold mb-2">Generate Report</h4>
            <p className="text-[10px] text-text-muted leading-relaxed mb-6">Expert export your complete portfolio history as a cryptographic PDF for off-chain record keeping.</p>
            <button className="px-6 py-2 rounded-full bg-white text-black font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all">Download PDF</button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { useUserPerformance } from "@/hooks/useAnalytics";
import { useMyProfile } from "@/hooks/useUserProfile";
import { formatSTT, formatPercentage } from "@/utils/formatters";
import {
  Trophy,
  TrendingUp,
  Zap,
  Activity,
  Box,
  Layout,
  PieChart,
  Calendar,
  Layers,
  Sparkles,
  Search
} from "lucide-react";
import Button from "@/components/button";

export default function Page() {
  const { address } = useAccount();
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const { data: performance, isLoading: perfLoading } = useUserPerformance(timeframe);
  const { data: profile, isLoading: profileLoading } = useMyProfile();

  const isLoading = perfLoading || profileLoading;

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-12 text-center max-w-lg bg-bg-card/40 border-white/5 backdrop-blur-3xl relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-somnia-cyan/10 via-transparent to-somnia-violet/10 opacity-50"></div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:rotate-12 transition-transform duration-500">
              <Activity className="h-10 w-10 text-somnia-cyan" />
            </div>
            <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">Identity Required</h2>
            <p className="text-text-muted mb-10 text-sm font-medium leading-relaxed">System requires a cryptographic signature to generate your performance intelligence report. Connect your neural link to proceed.</p>
            <Button variant="primary" size="lg" fullWidth className="font-bold tracking-[0.2em] uppercase py-4 shadow-[0_0_30px_rgba(34,199,255,0.2)]">
              Initialize Data Sync
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-10 animate-pulse pb-20">
        <div className="flex justify-between items-end">
          <div className="space-y-4">
            <div className="h-4 w-32 bg-white/5 rounded-full"></div>
            <div className="h-12 w-96 bg-white/5 rounded-xl"></div>
          </div>
          <div className="h-12 w-64 bg-white/5 rounded-xl"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-white/5 rounded-3xl border border-white/5"></div>
          ))}
        </div>
        <div className="h-96 bg-white/5 rounded-3xl border border-white/5"></div>
      </div>
    );
  }

  if (!performance) {
    return (
      <div className="glass-card p-20 text-center border-white/5 bg-bg-card/40 backdrop-blur-3xl">
        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Search className="h-8 w-8 text-text-muted/40" />
        </div>
        <h2 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">Intelligence Log Empty</h2>
        <p className="text-text-muted text-sm font-medium mb-10">No transactional telemetry found for this timeframe. Participate in markets to begin data collection.</p>
        <Button variant="outline" className="border-somnia-cyan/30 text-somnia-cyan hover:bg-somnia-cyan/5 uppercase tracking-widest font-black text-xs px-10">Deploy Interaction</Button>
      </div>
    );
  }

  const { creator, bettor, combined, trends } = performance;
  const winRate = profile?.stats?.wonBets && profile?.stats?.totalBets
    ? (profile.stats.wonBets / profile.stats.totalBets) * 100
    : 0;

  return (
    <div className="space-y-12 pb-24">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 px-2"
      >
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-somnia-cyan/10 border border-somnia-cyan/20 text-somnia-cyan text-[10px] font-black uppercase tracking-[0.2em]">
            <PieChart className="w-3 h-3" /> Predictive Intelligence
          </div>
          <h1 className="text-4xl lg:text-6xl font-black text-white uppercase tracking-tighter leading-none">
            Analytics <span className="bg-gradient-to-r from-somnia-cyan to-somnia-violet bg-clip-text text-transparent italic">Terminal</span>
          </h1>
          <p className="text-text-muted text-sm max-w-xl font-medium">Deep-system diagnostics of your predictive behavior, liquidity contributions, and success probabilities.</p>
        </div>

        <div className="flex items-center p-1.5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
          {['7d', '30d', '90d', 'all'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf as '7d' | '30d' | '90d' | 'all')}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${timeframe === tf
                ? 'bg-gradient-to-r from-somnia-cyan to-somnia-blue text-black shadow-lg shadow-somnia-cyan/20'
                : 'text-text-muted hover:text-white hover:bg-white/5'
                }`}
            >
              {tf === 'all' ? 'Lifetime' : tf.toUpperCase()}
            </button>
          ))}
        </div>
      </motion.div>

      {/* High-Level Pulse Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            title: "Operational Activity",
            value: combined.totalActivity.toString(),
            subtitle: "Total System Interactions",
            icon: Sparkles,
            color: "text-somnia-cyan",
            bg: "bg-somnia-cyan/10",
            glow: "shadow-[0_0_20px_rgba(34,199,255,0.15)]"
          },
          {
            title: "Processed Volume",
            value: formatSTT(combined.totalVolume),
            subtitle: "Cumulative Liquidity Flow",
            icon: Layers,
            color: "text-somnia-violet",
            bg: "bg-somnia-violet/10",
            glow: "shadow-[0_0_20px_rgba(140,0,255,0.15)]"
          },
          {
            title: "Success Velocity",
            value: formatPercentage(winRate),
            subtitle: "Predictive Precision Rate",
            icon: Trophy,
            color: "text-somnia-magenta",
            bg: "bg-somnia-magenta/10",
            glow: "shadow-[0_0_20px_rgba(255,0,128,0.15)]"
          }
        ].map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, filter: "blur(10px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ delay: 0.1 * index }}
            className={`glass-card p-8 border-white/5 bg-bg-card/30 flex flex-col items-center text-center group ${metric.glow} hover:bg-bg-card/50 transition-all`}
          >
            <div className={`p-4 rounded-3xl ${metric.bg} ${metric.color} mb-6 group-hover:scale-110 transition-transform`}>
              <metric.icon className="h-8 w-8" />
            </div>
            <p className="text-4xl font-black text-white tracking-widest mb-1">{metric.value}</p>
            <p className="text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em] mb-4">{metric.title}</p>
            <div className="w-12 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4"></div>
            <p className="text-[11px] font-medium text-text-muted italic opacity-60">
              {metric.subtitle}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Creator Specs */}
        {creator.totalPools > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="glass-card p-8 border-white/10 bg-bg-card/20 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-somnia-violet/5 blur-[80px] -mr-20 -mt-20"></div>

            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-somnia-violet/10 rounded-2xl">
                  <Box className="w-6 h-6 text-somnia-violet" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Market Architect</h3>
                  <p className="text-[10px] text-text-muted font-black uppercase tracking-widest opacity-40">Creation Diagnostics</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-white leading-none">{creator.totalPools}</p>
                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest opacity-40 italic">Pools Deployed</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {[
                { label: "Settled Nodes", val: creator.settledPools, color: "text-green-400" },
                { label: "Active Nodes", val: creator.activePools, color: "text-somnia-cyan" },
                { label: "Mean Magnitude", val: formatSTT(creator.avgPoolSize), color: "text-white" },
                { label: "Success Drift", val: "Optimal", color: "text-yellow-400" }
              ].map((stat) => (
                <div key={stat.label} className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                  <p className="text-[10px] font-black text-text-muted/40 uppercase tracking-widest mb-2 italic">{stat.label}</p>
                  <p className={`text-xl font-black ${stat.color} tracking-tight`}>{stat.val}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Bettor Specs */}
        {bettor.totalBets > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="glass-card p-8 border-white/10 bg-bg-card/20 relative overflow-hidden group"
          >
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-somnia-cyan/5 blur-[80px] -ml-20 -mb-20"></div>

            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-somnia-cyan/10 rounded-2xl">
                  <TrendingUp className="w-6 h-6 text-somnia-cyan" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">System Participant</h3>
                  <p className="text-[10px] text-text-muted font-black uppercase tracking-widest opacity-40">Engagement Metrics</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-white leading-none">{bettor.totalBets}</p>
                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest opacity-40 italic">Active Stakes</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-black text-text-muted/40 uppercase tracking-widest italic">Cumulative Exposure</p>
                  <Zap className="w-3 h-3 text-somnia-cyan" />
                </div>
                <p className="text-3xl font-black text-white tracking-widest italic">{formatSTT(bettor.totalStaked)}</p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                  <p className="text-[10px] font-black text-text-muted/40 uppercase tracking-widest mb-2 italic">Avg Intensity</p>
                  <p className="text-xl font-black text-white tracking-tight">{formatSTT(bettor.avgBetSize)}</p>
                </div>
                <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                  <p className="text-[10px] font-black text-text-muted/40 uppercase tracking-widest mb-2 italic">Risk Factor</p>
                  <p className="text-xl font-black text-somnia-magenta tracking-tight">Medium</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Category Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-12 space-y-8">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
              <Layout className="w-6 h-6 text-somnia-cyan" />
              Sectorial Dominance
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-card p-10 border-white/10 bg-bg-card/40">
              <p className="text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em] mb-10 text-center">Volume Weight Distribution</p>
              <div className="space-y-10">
                {trends.categories.map((cat, index) => {
                  const maxVolume = Math.max(...trends.categories.map(c => c.volume));
                  const percentage = (cat.volume / maxVolume) * 100;

                  return (
                    <div key={cat.category} className="space-y-4">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-somnia-cyan shadow-[0_0_8px_rgba(34,199,255,0.6)]"></span>
                          {cat.category}
                        </span>
                        <div className="text-right">
                          <span className="text-sm font-black text-white tracking-tight italic">{formatSTT(cat.volume)}</span>
                          <span className="text-[9px] font-black text-text-muted/40 uppercase tracking-widest ml-3">{cat.bets} Interactions</span>
                        </div>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-3.5 p-1 overflow-hidden border border-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${percentage}%` }}
                          transition={{ delay: index * 0.1, duration: 1, ease: "circOut" }}
                          className="h-full rounded-full bg-gradient-to-r from-somnia-cyan to-somnia-blue shadow-[0_0_15px_rgba(34,199,255,0.3)] relative"
                        >
                          <div className="absolute top-0 left-0 w-full h-full bg-[rgba(255,255,255,0.1)] animate-shimmer"></div>
                        </motion.div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="glass-card p-10 border-white/10 bg-bg-card/40">
              <p className="text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em] mb-10 text-center">Temporal Activity Log</p>
              <div className="space-y-8">
                {trends.monthly.map((month, index) => {
                  const maxVolume = Math.max(...trends.monthly.map(m => m.volume));
                  const percentage = maxVolume > 0 ? (month.volume / maxVolume) * 100 : 0;

                  return (
                    <div key={month.month} className="group cursor-default">
                      <div className="flex items-end gap-5 h-12">
                        <div className="w-20 text-[10px] font-black text-text-muted uppercase tracking-widest pb-1 opacity-40 group-hover:opacity-100 transition-opacity">
                          {month.month}
                        </div>
                        <div className="flex-1 flex items-end h-full">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${percentage}%` }}
                            transition={{ delay: index * 0.1, duration: 0.8, ease: "backOut" }}
                            className="h-6 rounded-r-lg bg-white/10 group-hover:bg-somnia-violet/40 border-l border-somnia-violet transition-all relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-somnia-violet/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          </motion.div>
                          <div className="ml-4 text-[10px] font-black text-white italic opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                            {formatSTT(month.volume)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-12 p-6 rounded-3xl bg-somnia-violet/5 border border-somnia-violet/10 flex items-center gap-6">
                <div className="p-3 bg-somnia-violet/10 rounded-2xl">
                  <Calendar className="w-5 h-5 text-somnia-violet" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1 italic">Peak Activity</p>
                  <p className="text-sm font-black text-white uppercase tracking-tight">Q4 Systems Optimized</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

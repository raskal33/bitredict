"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Button from "@/components/button";
import { useTrendingPools } from "@/hooks/useMarkets";
import {
  TrendingUp,
  Users,
  Layers,
  Trophy,
  Search,
  Filter,
  ArrowUpRight,
  Clock,
  Zap,
  Globe,
  Coins,
  Medal,
  ChevronRight,
  Activity,
  ShieldCheck,
  Terminal
} from "lucide-react";

// Import Swiper styles
// Swiper styles removed if unused

export default function Page() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Real-time data from backend - fetch fewer items for instant load
  const { data: trendingData, isLoading: trendingLoading } = useTrendingPools({ limit: 6 });

  const poolsArray = useMemo(() => Array.isArray(trendingData) ? trendingData : [], [trendingData]);

  const categories = ["All", "Crypto", "Sports", "Politics", "Finance", "Gaming"];

  const filteredPools = useMemo(() =>
    selectedCategory === "All"
      ? poolsArray
      : poolsArray.filter((pool) => pool.category?.toLowerCase() === selectedCategory.toLowerCase()),
    [poolsArray, selectedCategory]
  );

  // trendingPools removed if unused

  const stats = useMemo(() => [
    {
      label: "Pulse Throughput",
      value: "12.5M",
      unit: "STT",
      change: "+15.2%",
      positive: true,
      icon: Activity,
      color: "text-somnia-cyan",
      bg: "bg-somnia-cyan/10"
    },
    {
      label: "Active Relays",
      value: "156",
      unit: "",
      change: "+8",
      positive: true,
      icon: Terminal,
      color: "text-somnia-violet",
      bg: "bg-somnia-violet/10"
    },
    {
      label: "Linked Nodes",
      value: "2.8K",
      unit: "",
      change: "+156",
      positive: true,
      icon: Users,
      color: "text-somnia-blue",
      bg: "bg-somnia-blue/10"
    },
    {
      label: "Protocol Flow",
      value: "45.2K",
      unit: "STT",
      change: "+2.1%",
      positive: true,
      icon: Zap,
      color: "text-somnia-magenta",
      bg: "bg-somnia-magenta/10"
    }
  ], []);

  if (trendingLoading) {
    return (
      <div className="space-y-10 animate-pulse pb-20">
        <div className="h-64 bg-white/5 rounded-3xl border border-white/10 w-full mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white/5 rounded-2xl border border-white/10"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-12 pb-24"
    >
      {/* Hero Section - Neural Terminal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative group"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-somnia-cyan via-somnia-violet to-somnia-magenta rounded-[40px] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
        <div className="relative glass-card overflow-hidden p-10 lg:p-16 border-white/10 bg-bg-card/40 backdrop-blur-3xl rounded-[40px]">
          <div className="absolute top-0 right-0 -mt-24 -mr-24 w-96 h-96 bg-somnia-cyan/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
          <div className="absolute bottom-0 left-0 -mb-24 -ml-24 w-96 h-96 bg-somnia-violet/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-16">
            <div className="space-y-8 max-w-2xl text-center lg:text-left">
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-somnia-cyan/10 border border-somnia-cyan/20 text-somnia-cyan text-[10px] font-black uppercase tracking-[0.2em]">
                <Zap className="w-3.5 h-3.5" /> Neural Interface Online
              </div>
              <h1 className="text-5xl lg:text-7xl font-black text-white leading-[0.9] uppercase tracking-tighter">
                Decode the <br />
                <span className="bg-gradient-to-r from-somnia-cyan via-somnia-blue to-somnia-violet bg-clip-text text-transparent animate-gradient-flow bg-[length:200%_200%]">
                  Next Reality
                </span>
              </h1>
              <p className="text-lg text-text-muted leading-relaxed font-medium max-w-xl mx-auto lg:mx-0">
                The world&apos;s most advanced decentralized prediction terminal. Synchronize your neural node with global outcome streams on Somnia Network.
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-5">
                <Link href="/create-prediction">
                  <Button size="lg" className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest bg-somnia-cyan text-black shadow-[0_0_30px_rgba(34,199,255,0.4)] hover:shadow-[0_0_45px_rgba(34,199,255,0.6)]">
                    Create Pool
                  </Button>
                </Link>
                <Link href="/markets">
                  <Button variant="outline" size="lg" className="h-14 px-10 rounded-2xl border-white/10 text-white hover:bg-white/5 font-black uppercase tracking-widest">
                    Scan Sectors <ArrowUpRight className="ml-2 w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="hidden xl:block relative">
              <div className="w-80 h-80 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-somnia-cyan to-somnia-violet rounded-[60px] opacity-20 rotate-12 scale-110"></div>
                <div className="absolute inset-0 bg-bg-main border border-white/10 rounded-[60px] overflow-hidden flex items-center justify-center transform group-hover:scale-105 transition-transform duration-700">
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute inset-[10%] border border-dashed border-somnia-cyan/40 rounded-full animate-spin-slow"></div>
                    <div className="absolute inset-[25%] border border-somnia-violet/40 rounded-full animate-spin-slow-reverse"></div>
                  </div>
                  <Globe className="w-32 h-32 text-somnia-cyan drop-shadow-[0_0_20px_rgba(34,199,255,0.6)] relative z-10" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Telemetry Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            className="glass-card p-8 border-white/5 bg-bg-card/20 hover:bg-bg-card/40 transition-all group cursor-default"
          >
            <div className="flex items-center justify-between mb-6">
              <div className={`p-3.5 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${stat.positive
                ? 'text-green-400 bg-green-400/10 border border-green-400/20 shadow-[0_0_10px_rgba(74,222,128,0.2)]'
                : 'text-red-400 bg-red-400/10 border border-red-400/20 shadow-[0_0_10px_rgba(248,113,113,0.2)]'
                }`}>
                {stat.change}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white tracking-widest">{stat.value}</span>
                {stat.unit && <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{stat.unit}</span>}
              </div>
              <div className="text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Sector Intelligence Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 items-start">
        {/* Left column: Routing Controls */}
        <div className="lg:col-span-1 space-y-8 lg:sticky lg:top-36">
          <div className="glass-card p-8 border-white/10 bg-bg-card/30 backdrop-blur-3xl space-y-8">
            <div className="flex items-center gap-3">
              <Terminal className="w-5 h-5 text-somnia-cyan" />
              <h3 className="font-black text-white uppercase tracking-[0.2em] text-xs">Signal Routing</h3>
            </div>

            <div className="space-y-2.5">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 group ${selectedCategory === category
                    ? "bg-gradient-to-r from-somnia-cyan/20 to-somnia-blue/10 text-white border border-somnia-cyan/30 shadow-[0_0_20px_rgba(34,199,255,0.1)]"
                    : "text-text-muted hover:text-white hover:bg-white/5 border border-transparent"
                    }`}
                >
                  <span className="group-hover:translate-x-1 transition-transform">{category} Sectors</span>
                  <div className={`w-1.5 h-1.5 rounded-full transition-all ${selectedCategory === category ? 'bg-somnia-cyan shadow-[0_0_8px_rgba(34,199,255,0.8)]' : 'bg-white/20'}`}></div>
                </button>
              ))}
            </div>

            <div className="pt-6 border-t border-white/5 relative">
              <input
                type="text"
                placeholder="Scanner query..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 pl-12 text-[10px] font-bold text-white uppercase tracking-widest placeholder:text-text-muted/20 focus:outline-none focus:border-somnia-cyan/40 focus:bg-white/10 transition-all"
              />
              <Search className="absolute left-5 top-[calc(50%+12px)] -translate-y-1/2 w-4 h-4 text-text-muted/20" />
            </div>
          </div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="glass-card p-8 border border-somnia-magenta/30 bg-gradient-to-br from-somnia-magenta/20 to-transparent relative overflow-hidden group cursor-pointer"
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-somnia-magenta/20 rounded-full blur-3xl group-hover:bg-somnia-magenta/40 transition-colors"></div>
            <div className="relative z-10">
              <ShieldCheck className="w-8 h-8 text-somnia-magenta mb-4" />
              <h4 className="font-black text-white text-base uppercase tracking-tight mb-2">Protocol Shield</h4>
              <p className="text-[10px] text-text-muted font-medium mb-6 leading-relaxed">Neural protection enhanced for Season Alpha. Participate safely in multi-sector pools.</p>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-somnia-magenta flex items-center gap-2">
                Access Telemetry <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right column: Prediction Streams */}
        <div className="lg:col-span-3 space-y-10">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">
              {selectedCategory === "All" ? "Featured Outcomes" : `${selectedCategory} Sector Stream`}
            </h2>
            <div className="flex gap-3">
              <button className="p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-somnia-cyan hover:text-black transition-all group">
                <Filter className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCategory}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              {filteredPools.map((pool, index) => (
                <motion.div
                  key={pool.poolId}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 * index }}
                  whileHover={{ y: -8 }}
                  className="glass-card flex flex-col p-8 h-full border-white/10 bg-bg-card/20 hover:bg-bg-card/40 hover:border-somnia-cyan/30 transition-all relative group overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-somnia-cyan/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  <div className="absolute top-0 right-0 p-6">
                    {pool.isBoosted && (
                      <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20">
                        <Zap className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
                        <span className="text-[8px] font-black text-yellow-400 uppercase tracking-widest">Boosted</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-2xl bg-somnia-blue/10 text-somnia-blue group-hover:bg-somnia-blue group-hover:text-black transition-all">
                      {pool.category?.toLowerCase().includes('crypto') ? <Coins className="w-5 h-5" /> :
                        pool.category?.toLowerCase().includes('sports') ? <Trophy className="w-5 h-5" /> :
                          <Globe className="w-5 h-5" />}
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-somnia-cyan uppercase tracking-[0.2em]">{pool.category} NODE</span>
                      {pool.eventEndTime && (
                        <div className="flex items-center gap-2 text-text-muted/40 mt-1">
                          <Clock className="w-3 h-3" />
                          <span className="text-[9px] font-black uppercase tracking-widest">{new Date(Number(pool.eventEndTime) * 1000).toLocaleDateString()} EXPIRY</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="text-xl font-black text-white mb-4 leading-tight group-hover:text-white transition-colors">
                    {pool.title}
                  </h3>

                  <div className="flex items-center gap-3 mb-8">
                    <Users className="w-4 h-4 text-text-muted/40" />
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{pool.totalBettorStake || 0} Synced Nodes</span>
                  </div>

                  <div className="mt-auto space-y-8">
                    <div className="flex items-end justify-between">
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em] italic">Accumulated Load</p>
                        <p className="text-3xl font-black text-white tracking-widest tabular-nums">
                          {parseFloat(pool.creatorStake).toLocaleString()}
                          <span className="text-sm font-black text-somnia-cyan ml-2">{pool.usesBitr ? 'BITR' : 'STT'}</span>
                        </p>
                      </div>
                      <Link href={`/markets/${pool.poolId}`}>
                        <motion.button
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          whileTap={{ scale: 0.9 }}
                          className="w-14 h-14 rounded-2xl bg-somnia-cyan text-black flex items-center justify-center shadow-[0_0_20px_rgba(34,199,255,0.3)] group-hover:shadow-[0_0_35px_rgba(34,199,255,0.5)] transition-all"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </motion.button>
                      </Link>
                    </div>

                    <div className="relative pt-4">
                      <div className="flex justify-between text-[8px] font-black text-text-muted/40 uppercase tracking-[0.2em] mb-2 px-1">
                        <span>Yes Stream</span>
                        <span>No Stream</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <div
                          className="h-full bg-gradient-to-r from-somnia-cyan via-somnia-blue to-somnia-violet rounded-full shadow-[0_0_15px_rgba(34,199,255,0.3)]"
                          style={{ width: '65%' }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {filteredPools.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card py-24 text-center border-dashed border-white/5 bg-white/[0.02]"
            >
              <div className="inline-flex p-8 rounded-full bg-white/5 mb-8">
                <Search className="w-16 h-16 text-text-muted/10" />
              </div>
              <h3 className="text-3xl font-black text-white mb-3 uppercase tracking-tighter">Sector Offline</h3>
              <p className="text-text-muted font-medium max-w-sm mx-auto">No prediction streams detected in this sector. Adjust scanner parameters or try another frequency.</p>
              <Button
                variant="outline"
                className="mt-10 rounded-2xl h-12 px-8 border-white/10 font-black uppercase tracking-widest text-[10px]"
                onClick={() => setSelectedCategory("All")}
              >
                Reset Scanner
              </Button>
            </motion.div>
          )}

          {filteredPools.length > 0 && (
            <div className="flex justify-center pt-10">
              <button className="h-14 px-12 rounded-2xl border border-white/10 text-white font-black text-[10px] uppercase tracking-[0.3em] hover:bg-white/5 hover:border-somnia-cyan/30 transition-all flex items-center gap-4 group">
                Access Deep Data <Layers className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Access Terminals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        {[
          { title: "Quantum Analytics", desc: "Neural trend tracking", icon: TrendingUp, href: "/dashboard/performance-charts", color: "somnia-cyan" },
          { title: "Security Protocols", desc: "Node authorization hub", icon: Medal, href: "/dashboard/settings", color: "somnia-violet" },
          { title: "Global Network", desc: "Decentralized signal news", icon: Globe, href: "/", color: "somnia-magenta" }
        ].map((item, i) => (
          <Link key={i} href={item.href} className="group">
            <div className={`glass-card p-10 flex items-center gap-7 border-white/5 bg-bg-card/10 group-hover:bg-bg-card/40 transition-all relative overflow-hidden`}>
              <div className={`absolute top-0 left-0 w-1 h-full bg-somnia-${item.color} opacity-20 group-hover:opacity-100 transition-opacity`}></div>
              <div className={`p-4 rounded-2xl bg-somnia-${item.color}/10 text-somnia-${item.color} group-hover:scale-110 transition-transform`}>
                <item.icon className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-black text-white uppercase tracking-tight group-hover:text-somnia-cyan transition-colors">{item.title}</h4>
                <p className="text-[10px] text-text-muted font-black uppercase tracking-widest italic opacity-60">{item.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}

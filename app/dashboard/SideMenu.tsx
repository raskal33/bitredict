"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { motion } from "framer-motion";
import { useMyProfile } from "@/hooks/useUserProfile";
import {
  Wallet,
  LineChart,
  User,
  Settings,
  Trophy,
  PlusCircle,
  ChevronRight,
  Zap,
  Activity,
  Terminal
} from "lucide-react";

export default function SideMenu() {
  const segment = useSelectedLayoutSegment();
  const { data: profile } = useMyProfile();

  return (
    <motion.div
      initial={{ opacity: 0, x: -25 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-full xl:w-80 shrink-0"
    >
      <div className="glass-card p-8 sticky top-8 border-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.5)] backdrop-blur-3xl bg-bg-card/40 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-somnia-cyan/40 to-transparent"></div>

        {/* Header */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black bg-gradient-to-r from-somnia-cyan to-somnia-blue bg-clip-text text-transparent uppercase tracking-tighter">
              Terminal
            </h2>
            <p className="text-[10px] text-text-muted mt-1 font-black uppercase tracking-[0.2em] flex items-center gap-1.5 leading-none">
              <span className="w-1.5 h-1.5 rounded-full bg-somnia-cyan animate-pulse shadow-[0_0_8px_rgba(34,199,255,1)]"></span>
              Neural Node Active
            </p>
          </div>
          <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 group-hover:border-somnia-cyan/30 transition-colors shadow-inner">
            <Terminal className="w-5 h-5 text-somnia-cyan drop-shadow-[0_0_5px_rgba(34,199,255,0.5)]" />
          </div>
        </div>

        {/* Navigation Stream */}
        <div className="space-y-6">
          <div>
            <h3 className="text-[9px] font-black text-text-muted/40 uppercase tracking-[0.3em] mb-4 ml-1">Core Streams</h3>
            <nav className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-1 gap-1.5">
              {links.map((link, index) => {
                const isActive = link.segment === segment;
                const Icon = link.icon;

                return (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index }}
                  >
                    <Link
                      href={link.href}
                      className={`group relative flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 ${isActive
                        ? `bg-gradient-to-r from-somnia-cyan/15 to-transparent border border-somnia-cyan/30 text-white shadow-[0_0_20px_rgba(34,199,255,0.1)]`
                        : `text-text-muted hover:text-white hover:bg-white/5 border border-transparent`
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg transition-all duration-300 ${isActive ? 'bg-somnia-cyan text-black shadow-[0_0_15px_rgba(34,199,255,0.4)]' : 'text-text-muted group-hover:text-somnia-cyan group-hover:bg-somnia-cyan/10'
                          }`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-widest">{link.label}</span>
                      </div>

                      {isActive && (
                        <motion.div layoutId="nav-indicator" className="hidden xl:block">
                          <ChevronRight className="w-4 h-4 text-somnia-cyan" />
                        </motion.div>
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Real-time Telemetry */}
        <div className="mt-10 pt-10 border-t border-white/5">
          <div className="flex items-center justify-between mb-6 px-1">
            <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-text-muted/40">Bio-Telemetry</h3>
            <div className="flex gap-1 animate-pulse">
              <div className="w-1 h-3 bg-somnia-cyan/20 rounded-full"></div>
              <div className="w-1 h-4 bg-somnia-cyan/40 rounded-full"></div>
              <div className="w-1 h-2 bg-somnia-cyan/60 rounded-full"></div>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { label: "Success Prob", value: profile?.computedStats?.winRateFormatted || "0%", icon: Trophy, color: "text-yellow-400", bg: "bg-yellow-400/10" },
              { label: "Net Yield", value: profile?.computedStats?.profitLossFormatted || "0 STT", icon: Activity, color: "text-green-400", bg: "bg-green-400/10" },
              { label: "Signal Count", value: profile?.stats?.totalBets || 0, icon: Zap, color: "text-somnia-blue", bg: "bg-somnia-blue/10" }
            ].map((stat) => (
              <motion.div
                key={stat.label}
                whileHover={{ x: 5, backgroundColor: "rgba(255,255,255,0.05)" }}
                className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between group cursor-default transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 ${stat.bg} ${stat.color} rounded-lg group-hover:scale-110 transition-transform`}>
                    <stat.icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-text-muted/60">{stat.label}</span>
                </div>
                <span className="text-xs font-black text-white tracking-widest tabular-nums">
                  {stat.value}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Action Node */}
        <div className="mt-10">
          <Link href="/create-prediction">
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(34, 199, 255, 0.4)" }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-somnia-cyan to-somnia-blue text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(34,199,255,0.2)] transition-all"
            >
              <PlusCircle className="h-4 w-4" />
              Initialize Pool
            </motion.button>
          </Link>
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-somnia-magenta animate-pulse shadow-[0_0_8px_rgba(255,0,128,0.8)]"></div>
            <p className="text-[8px] text-text-muted/40 font-black uppercase tracking-[0.3em]">
              Somnia Neural Network v1.0.4
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const links = [
  {
    label: "Terminal Hub",
    href: "/dashboard",
    segment: null,
    icon: Terminal,
  },
  {
    label: "Personal Node",
    href: "/dashboard/financial-summary",
    segment: "financial-summary",
    icon: Wallet,
  },
  {
    label: "Neural Analytics",
    href: "/dashboard/performance-charts",
    segment: "performance-charts",
    icon: LineChart,
  },
  {
    label: "Signal Log",
    href: "/dashboard/notifications",
    segment: "notifications",
    icon: Activity,
  },
  {
    label: "Neural Identity",
    href: "/dashboard/profile",
    segment: "profile",
    icon: User,
  },
  {
    label: "System Config",
    href: "/dashboard/settings",
    segment: "settings",
    icon: Settings,
  },
];

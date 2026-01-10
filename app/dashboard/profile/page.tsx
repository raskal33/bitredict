"use client";

import { useAccount } from "wagmi";
import { useMyProfile, useUserBadges } from "@/hooks/useUserProfile";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  User,
  ExternalLink,
  Target,
  Trophy,
  Zap,
  Award,
  Activity,
  History,
  TrendingUp,
  Clock,
  Layout,
  Star,
  ShieldCheck,
  Hexagon
} from "lucide-react";
import Button from "@/components/button";

export default function Page() {
  const { address } = useAccount();
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const { data: badgeData, isLoading: badgesLoading } = useUserBadges();

  const isLoading = profileLoading || badgesLoading;

  const stats = [
    {
      label: "Total Predictions",
      value: profile?.stats?.totalBets || 0,
      icon: Target,
      color: "text-somnia-cyan",
      bg: "bg-somnia-cyan/10"
    },
    {
      label: "Success Probability",
      value: profile?.computedStats?.winRateFormatted || "0%",
      icon: Trophy,
      color: "text-green-400",
      bg: "bg-green-400/10"
    },
    {
      label: "Net Yield (P&L)",
      value: profile?.computedStats?.profitLossFormatted || "0 STT",
      icon: Zap,
      color: "text-somnia-violet",
      bg: "bg-somnia-violet/10"
    },
    {
      label: "Signal Commendations",
      value: badgeData?.active?.length || 0,
      icon: Award,
      color: "text-somnia-magenta",
      bg: "bg-somnia-magenta/10"
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-10 animate-pulse pb-20">
        <div className="h-64 bg-white/5 rounded-3xl border border-white/5 w-full"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-96 bg-white/5 rounded-3xl border border-white/5"></div>
          <div className="h-96 bg-white/5 rounded-3xl border border-white/5"></div>
        </div>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-12 text-center max-w-lg bg-bg-card/40 border-white/5 backdrop-blur-3xl relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-somnia-cyan to-somnia-violet"></div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:bg-somnia-cyan/10 transition-colors">
              <User className="h-10 w-10 text-somnia-cyan" />
            </div>
            <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">Identity Null</h2>
            <p className="text-text-muted mb-10 text-sm font-medium leading-relaxed">Neural interface not detected. Please establish a cryptographic link to authorize profile decryption.</p>
            <Button variant="primary" size="lg" fullWidth className="font-bold tracking-widest uppercase py-4 shadow-[0_0_30px_rgba(34,199,255,0.2)]">
              Initialize Link
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-24">
      {/* Profile Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-10 border-white/10 bg-bg-card/40 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-somnia-cyan/10 to-transparent blur-[100px] -mr-40 -mt-40"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 relative z-10">
          <div className="flex items-center gap-8">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-somnia-cyan to-somnia-violet rounded-3xl blur opacity-30 group-hover:opacity-60 transition-opacity"></div>
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-bg-main border border-white/10 flex items-center justify-center overflow-hidden">
                <User className="w-12 h-12 sm:w-16 sm:h-16 text-somnia-cyan opacity-40" />
                <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-somnia-cyan/20 to-transparent"></div>
              </div>
              <div className="absolute -bottom-2 -right-2 p-2 bg-somnia-violet rounded-xl shadow-lg shadow-somnia-violet/40">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-somnia-cyan/10 border border-somnia-cyan/20 text-somnia-cyan text-[10px] font-black uppercase tracking-[0.2em]">
                <Activity className="w-3 h-3" /> System Pilot
              </div>
              <h1 className="text-3xl lg:text-5xl font-black text-white uppercase tracking-tighter">
                {address.slice(0, 6)}...{address.slice(-4)}
              </h1>
              <div className="flex items-center gap-4 text-text-muted text-xs font-semibold">
                <span className="flex items-center gap-1.5"><Hexagon className="w-3 h-3 text-somnia-violet" /> Tier: Apex</span>
                <span className="w-1 h-1 rounded-full bg-white/20"></span>
                <span className="flex items-center gap-1.5"><Star className="w-3 h-3 text-yellow-400" /> Reputation: 98.4%</span>
              </div>
            </div>
          </div>

          <Link href="/profile">
            <Button variant="outline" size="lg" className="border-white/10 hover:border-somnia-cyan/40 hover:bg-somnia-cyan/10 font-black uppercase tracking-widest text-[10px] group/btn">
              External Identity Interface <ExternalLink className="ml-2 w-3.5 h-3.5 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Core Intelligence Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            className="glass-card p-6 border-white/5 bg-bg-card/20 hover:bg-bg-card/40 transition-all group"
          >
            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} w-fit mb-6 group-hover:scale-110 transition-transform`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-3xl font-black text-white tracking-widest mb-1">{stat.value}</p>
            <p className="text-[10px] font-black text-text-muted/40 uppercase tracking-[0.2em]">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Recent Chronicle */}
        <motion.div
          initial={{ opacity: 0, x: -15 }}
          whileInView={{ opacity: 1, x: 0 }}
          className="glass-card p-8 border-white/10 bg-bg-card/20 space-y-8"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
              <History className="w-5 h-5 text-somnia-cyan" /> Recent Activity Log
            </h3>
            <Clock className="w-4 h-4 text-text-muted opacity-20" />
          </div>

          {profile?.recentActivity && profile.recentActivity.length > 0 ? (
            <div className="space-y-4">
              {profile.recentActivity.slice(0, 4).map((activity) => {
                const isWin = activity.type === 'bet_won';
                const isLoss = activity.type === 'bet_lost';

                return (
                  <div key={activity.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors group/item">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isWin ? 'bg-green-400/10 text-green-400' :
                        isLoss ? 'bg-red-400/10 text-red-400' :
                          'bg-somnia-cyan/10 text-somnia-cyan'
                        }`}>
                        {isWin ? <Trophy className="w-5 h-5" /> : isLoss ? <XCircle className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="text-white text-xs font-bold leading-tight group-hover/item:text-somnia-cyan transition-colors">{activity.description}</div>
                        <div className="text-[10px] text-text-muted/40 font-black uppercase tracking-widest mt-1">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    {activity.amount && (
                      <div className={`text-sm font-black tracking-widest ${isWin ? 'text-green-400' : isLoss ? 'text-red-400' : 'text-text-muted'
                        }`}>
                        {activity.amount}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 opacity-40">
              <Activity className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-xs font-black uppercase tracking-widest">Awaiting Initial Signal</p>
            </div>
          )}
        </motion.div>

        {/* Sector Efficiency Breakdown */}
        <motion.div
          initial={{ opacity: 0, x: 15 }}
          whileInView={{ opacity: 1, x: 0 }}
          className="glass-card p-8 border-white/10 bg-bg-card/20 space-y-8"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-somnia-violet" /> Sector Efficiency
            </h3>
            <Layout className="w-4 h-4 text-text-muted opacity-20" />
          </div>

          {profile?.categoryPerformance && profile.categoryPerformance.length > 0 ? (
            <div className="space-y-8">
              {profile.categoryPerformance.slice(0, 4).map((category, idx) => (
                <div key={category.category} className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-text-muted/40 uppercase tracking-widest mb-1 italic">Vocation Node</p>
                      <span className="text-xs font-black text-white uppercase tracking-widest">{category.category}</span>
                    </div>
                    <span className="text-sm font-black text-white italic">{category.winRate.toFixed(1)}% Yield</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5 relative">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${Math.min(category.winRate, 100)}%` }}
                      transition={{ delay: idx * 0.1 + 0.3, duration: 1.2, ease: "circOut" }}
                      className="bg-gradient-to-r from-somnia-violet to-somnia-blue h-full rounded-full shadow-[0_0_10px_rgba(140,0,255,0.4)]"
                    ></motion.div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 opacity-40">
              <TrendingUp className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-xs font-black uppercase tracking-widest">Telemetry Insufficient</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function XCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  );
}

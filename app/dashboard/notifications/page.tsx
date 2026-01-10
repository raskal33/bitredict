"use client";

import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { usePortfolio } from "@/hooks/usePortfolio";
import { formatSTT, formatRelativeTime } from "@/utils/formatters";
import {
  Bell,
  Trophy,
  Activity,
  Zap,
  Flame,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Smartphone
} from "lucide-react";
import Button from "@/components/button";

export default function Page() {
  const { address } = useAccount();
  const { data: portfolioData, isLoading } = usePortfolio();

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-12 text-center max-w-lg bg-bg-card/40 border-white/5 backdrop-blur-3xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-somnia-cyan/10 blur-[60px] -mr-16 -mt-16"></div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform">
              <Bell className="h-10 w-10 text-somnia-cyan" />
            </div>
            <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">Signal Offline</h2>
            <p className="text-text-muted mb-10 text-sm font-medium leading-relaxed">System activity feed requires an active neural link. Connect your wallet to synchronize with the market pulse.</p>
            <Button variant="primary" size="lg" fullWidth className="font-bold tracking-widest uppercase py-4 shadow-[0_0_30px_rgba(34,199,255,0.2)]">
              Initialize Sync
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-10 animate-pulse pb-20">
        <div className="h-48 bg-white/5 rounded-3xl border border-white/5 w-full"></div>
        <div className="space-y-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-white/5 rounded-2xl border border-white/5"></div>
          ))}
        </div>
      </div>
    );
  }

  const positions = portfolioData?.positions || [];

  const activities = (positions || []).map(position => {
    let activityType = 'bet_placed';
    let icon = <Activity className="h-5 w-5" />;
    let colorStyle = 'text-somnia-cyan bg-somnia-cyan/10 border-somnia-cyan/20';
    let message = '';

    if (position.status === 'won') {
      activityType = 'position_won';
      icon = <Trophy className="h-5 w-5" />;
      colorStyle = 'text-green-400 bg-green-400/10 border-green-400/20';
      message = `Strategic victory achieved: Secured ${formatSTT(position.payoutAmount || position.prizeAmount || '0')} from "${position.title}"`;
    } else if (position.status === 'lost') {
      activityType = 'position_lost';
      icon = <XCircle className="h-5 w-5" />;
      colorStyle = 'text-red-400 bg-red-400/10 border-red-400/20';
      message = `Market correction finalized: Position closed for "${position.title}"`;
    } else if (position.status === 'ended') {
      activityType = 'position_ended';
      icon = <CheckCircle className="h-5 w-5" />;
      colorStyle = 'text-yellow-400 bg-yellow-400/20 border-yellow-400/40 shadow-[0_0_15px_rgba(250,204,21,0.1)]';
      message = `Liquidity ready for extraction: "${position.title}" settle module active`;
    } else if (position.type === 'oddyssey') {
      activityType = 'oddyssey_placed';
      icon = <Flame className="h-5 w-5" />;
      colorStyle = 'text-somnia-magenta bg-somnia-magenta/10 border-somnia-magenta/20';
      message = `Entered Oddyssey simulation: "${position.title}" initialized`;
    } else {
      activityType = 'bet_placed';
      icon = <Zap className="h-5 w-5" />;
      colorStyle = 'text-somnia-cyan bg-somnia-cyan/10 border-somnia-cyan/20';
      message = `Allocated ${formatSTT(position.amount)} to market node: "${position.title}"`;
    }

    return {
      id: position.id,
      type: activityType,
      message,
      timestamp: position.createdAt,
      icon,
      colorStyle,
      read: position.status !== 'ended' // Unread if needs attention
    };
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const unreadCount = activities.filter(a => !a.read).length;

  return (
    <div className="space-y-12 pb-24">
      {/* Feed Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-10 border-white/10 bg-bg-card/40 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-somnia-violet/15 to-transparent blur-3xl -mr-32 -mt-32"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">
              <Activity className="w-3 h-3" /> System Logs
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-white uppercase tracking-tighter">
              Activity <span className="bg-gradient-to-r from-somnia-cyan to-somnia-violet bg-clip-text text-transparent">Telemetry</span>
            </h1>
            <p className="text-text-muted text-sm font-medium">Real-time chronicle of your on-chain interactions and market settlements.</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <p className="text-xs font-black text-text-muted uppercase tracking-widest mb-1 italic">Attention Required</p>
              <p className="text-2xl font-black text-white tracking-widest">{unreadCount}</p>
            </div>
            <div className={`p-4 rounded-2xl ${unreadCount > 0 ? 'bg-yellow-400 text-black shadow-[0_0_25px_rgba(250,204,21,0.4)]' : 'bg-white/5 text-text-muted'} transition-all`}>
              <Bell className={`h-6 w-6 ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-4">
          {activities.length === 0 ? (
            <div className="glass-card p-24 text-center border-dashed border-white/10 opacity-60">
              <Bell className="h-16 w-16 text-text-muted/20 mx-auto mb-6" />
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">No Signals Detected</h3>
              <p className="text-text-muted text-sm font-medium">Initialize your first market interaction to populate this frequency.</p>
            </div>
          ) : (
            activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index }}
                whileHover={{ x: 5 }}
                className={`glass-card p-6 border-white/10 bg-bg-card/20 hover:bg-bg-card/40 transition-all group relative ${!activity.read ? 'border-r-4 border-r-yellow-400' : ''
                  }`}
              >
                <div className="flex items-center gap-6">
                  <div className={`shrink-0 p-3.5 rounded-2xl border ${activity.colorStyle} group-hover:scale-110 transition-transform`}>
                    {activity.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm tracking-wide leading-relaxed mb-2 line-clamp-2">
                      {activity.message}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-text-muted/40">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(activity.timestamp)}
                    </div>
                  </div>

                  {!activity.read && (
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-yellow-400/20 border border-yellow-400/40 rounded-xl"
                    >
                      <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(250,204,21,1)]"></div>
                      <span className="text-[9px] font-black text-yellow-400 uppercase tracking-widest">Active Claim</span>
                    </motion.div>
                  )}

                  <div className="p-2 rounded-lg bg-white/5 group-hover:bg-somnia-cyan group-hover:text-black transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-8 border-white/10 bg-gradient-to-b from-white/5 to-transparent">
            <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-8 border-b border-white/10 pb-4">Security Insights</h4>
            <div className="space-y-6">
              <div className="flex gap-4">
                <ShieldCheck className="w-5 h-5 text-somnia-cyan shrink-0" />
                <div>
                  <p className="text-[11px] font-bold text-white mb-1">Encrypted Logs</p>
                  <p className="text-[10px] text-text-muted leading-relaxed">All activity telemetry is cryptographically signed and verified on-chain.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Smartphone className="w-5 h-5 text-somnia-violet shrink-0" />
                <div>
                  <p className="text-[11px] font-bold text-white mb-1">Signal Alerts</p>
                  <p className="text-[10px] text-text-muted leading-relaxed">System notifications are optimized for high-frequency market updates.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-8 text-center border-somnia-magenta/30 bg-somnia-magenta/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-somnia-magenta/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <Flame className="w-10 h-10 text-somnia-magenta mx-auto mb-4" />
            <h4 className="text-white font-black uppercase text-sm mb-2">Oddyssey Protocol</h4>
            <p className="text-[10px] text-text-muted mb-6 leading-relaxed">Your performance in the daily simulation is being logged for competitive tiering.</p>
            <Button variant="outline" className="w-full border-somnia-magenta/40 text-somnia-magenta hover:bg-somnia-magenta/10 uppercase tracking-widest text-[10px] font-black">View Rankings</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

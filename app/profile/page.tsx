"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  Activity,
  Trophy,
  ShieldCheck,
  History,
  TrendingUp,
  Target,
  PieChart,
  Crown,
  Boxes,
  Compass
} from "lucide-react";
import { useAccount } from "wagmi";
import { useMyProfile, useUserBadges, useUserReputation, useCategoryPerformance } from "@/hooks/useUserProfile";
import ReputationBadge from "@/components/ReputationBadge";
import TrophyWall, { Trophy as TrophyType } from './TrophyWall';
import PrizeClaimModal from "@/components/PrizeClaimModal";
import Button from "@/components/button";

export default function ProfilePage() {
  const { address } = useAccount();
  const [showPrizeModal, setShowPrizeModal] = useState(false);

  const { data: profile } = useMyProfile();
  const { data: badgeData } = useUserBadges();
  const { data: reputation } = useUserReputation();
  const { data: categoryData } = useCategoryPerformance();

  const getRarityScore = (rarity: 'legendary' | 'epic' | 'rare' | 'uncommon' | 'common'): number => {
    switch (rarity) {
      case 'legendary': return 100;
      case 'epic': return 50;
      case 'rare': return 25;
      case 'uncommon': return 10;
      case 'common': return 5;
      default: return 0;
    }
  };

  const userData = {
    stats: profile?.stats ? {
      totalBets: profile.stats.totalBets,
      wonBets: profile.stats.wonBets,
      winRate: profile.computedStats.winRateFormatted,
      profitLoss: profile.computedStats.profitLossFormatted,
      averageBetSize: profile.computedStats.averageBetSizeFormatted,
      biggestWin: profile.stats.biggestWin.toFixed(2) + " STT",
      totalVolume: profile.computedStats.totalVolumeFormatted,
      lastBetDate: profile.stats.lastActive ? new Date(profile.stats.lastActive).toISOString().split('T')[0] : "N/A"
    } : {
      totalBets: 0,
      wonBets: 0,
      winRate: "0%",
      profitLoss: "0 STT",
      averageBetSize: "0 STT",
      biggestWin: "0 STT",
      totalVolume: "0 STT",
      lastBetDate: "N/A"
    },
    achievements: badgeData?.active ? badgeData.active.map(badge => ({
      id: badge.id,
      name: badge.title,
      description: badge.description,
      iconName: badge.iconName,
      date: new Date(badge.earnedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      rarity: badge.rarity,
      category: badge.badgeCategory
    })) : [
      { id: 1, name: "Initiation", description: "Identity node connected to Somnia Network.", iconName: "Zap", date: "Now", rarity: "common", category: "Core" }
    ],
    recentActivity: profile?.recentActivity ? profile.recentActivity.slice(0, 6).map(activity => ({
      id: activity.id,
      type: activity.type,
      description: activity.description,
      amount: activity.amount,
      date: new Date(activity.timestamp).toLocaleDateString()
    })) : [
      { id: 1, type: "bet_placed", description: "Node synchronized. Awaiting local signal streams.", amount: null, date: "Now" }
    ],
    categoryPerformance: categoryData?.categories ? categoryData.categories.map(cat => ({
      category: cat.category,
      winRate: Math.round(cat.winRate),
      volume: Math.round(cat.totalVolume)
    })) : [
      { category: "Markets", winRate: 0, volume: 0 }
    ]
  };

  const trophies: TrophyType[] = userData.achievements.map(achievement => ({
    id: achievement.id.toString(),
    name: achievement.name,
    description: achievement.description,
    rarity: achievement.rarity as TrophyType['rarity'],
    icon: achievement.iconName,
    earnedAt: achievement.date,
    category: achievement.category,
    score: getRarityScore(achievement.rarity as 'legendary' | 'epic' | 'rare' | 'uncommon' | 'common')
  }));

  const getActivityConfig = (type: string) => {
    switch (type) {
      case "bet_won":
        return { color: "text-somnia-cyan", bg: "bg-somnia-cyan/10", icon: Trophy, label: "Success" };
      case "bet_lost":
        return { color: "text-somnia-magenta", bg: "bg-somnia-magenta/10", icon: Activity, label: "Burn" };
      case "prediction_created":
        return { color: "text-somnia-blue", bg: "bg-somnia-blue/10", icon: Boxes, label: "Init" };
      case "bet_placed":
        return { color: "text-somnia-violet", bg: "bg-somnia-violet/10", icon: Zap, label: "Signal" };
      default:
        return { color: "text-text-muted", bg: "bg-white/5", icon: Zap, label: "Stream" };
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <PrizeClaimModal
        isOpen={showPrizeModal}
        onClose={() => setShowPrizeModal(false)}
        userAddress={address}
      />

      {/* Action Bar */}
      <div className="flex justify-between items-center gap-4">
        <h2 className="text-xl font-black text-white uppercase tracking-widest hidden md:block">
          Neural Hub <span className="text-somnia-cyan">Overview</span>
        </h2>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowPrizeModal(true)}
          className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-somnia-magenta text-white text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(255,0,128,0.3)] hover:shadow-[0_0_30px_rgba(255,0,128,0.5)] transition-all"
        >
          <Trophy className="h-4 w-4" />
          Harvest Protocol Rewards
        </motion.button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* LEFT COLUMN: Data Streams */}
        <div className="lg:col-span-4 space-y-8">
          {/* Reputation Link */}
          {reputation && (
            <div className="glass-card p-6 border-somnia-cyan/20 bg-somnia-cyan/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <ShieldCheck className="w-20 h-20 text-somnia-cyan" />
              </div>

              <h3 className="mb-6 flex items-center gap-3 text-xs font-black text-white uppercase tracking-[0.2em]">
                <ShieldCheck className="text-somnia-cyan h-4 w-4" />
                Network Trust Node
              </h3>

              <div className="flex justify-center mb-6">
                <ReputationBadge
                  reputation={{
                    actions: [],
                    score: reputation.reputation,
                    level: (reputation.accessLevelName as "Verified" | "Trusted" | "Elementary" | "Limited"),
                    address: address || "",
                    totalChallenges: 0,
                    successfulChallenges: 0,
                    marketsCreated: 0,
                    wonBets: 0,
                    totalOutcomeProposals: 0,
                    correctOutcomeProposals: 0
                  }}
                />
              </div>

              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Trust Level: {reputation.accessLevelName}</span>
                  <span className="text-[10px] font-mono text-somnia-cyan">{reputation.reputation} / 500 SYNC</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5 p-[1px] border border-white/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(reputation.reputation / 500) * 100}%` }}
                    className="bg-somnia-cyan h-full rounded-full shadow-[0_0_10px_rgba(34,199,255,0.8)]"
                  />
                </div>
                {reputation.nextMilestone && (
                  <p className="text-[8px] text-text-muted/60 uppercase tracking-widest text-center">
                    {reputation.nextMilestone.points - reputation.reputation} units until {reputation.nextMilestone.level} elevation
                  </p>
                )}
              </div>

              {reputation.capabilities && reputation.capabilities.length > 0 && (
                <div className="mt-8 pt-6 border-t border-white/5">
                  <h4 className="text-[9px] font-black text-text-muted/40 uppercase tracking-widest mb-4">Enabled Protocols</h4>
                  <div className="flex flex-wrap gap-2">
                    {reputation.capabilities.map((capability: string, index: number) => (
                      <span
                        key={index}
                        className="px-2.5 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-text-muted hover:border-somnia-cyan/40 hover:text-somnia-cyan transition-all"
                      >
                        {capability}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Performance Telemetry */}
          <div className="glass-card p-6 border-white/10 relative overflow-hidden">
            {/* Decorative Background Icon */}
            <div className="absolute -bottom-6 -right-6 opacity-[0.03] rotate-12">
              <TrendingUp className="w-40 h-40 text-white" />
            </div>

            <h3 className="mb-6 flex items-center gap-3 text-xs font-black text-white uppercase tracking-[0.2em]">
              <Activity className="text-somnia-violet h-4 w-4" />
              Performance Telemetry
            </h3>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4 text-center group hover:border-somnia-cyan/30 transition-all">
                  <div className="text-[8px] text-text-muted/60 uppercase font-black tracking-widest mb-1">Signal Accuracy</div>
                  <div className="text-2xl font-black text-somnia-cyan tracking-tighter">{userData.stats.winRate}</div>
                </div>
                <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4 text-center group hover:border-somnia-blue/30 transition-all">
                  <div className="text-[8px] text-text-muted/60 uppercase font-black tracking-widest mb-1">Net Yield (P&L)</div>
                  <div className="text-2xl font-black text-somnia-blue tracking-tighter truncate px-2">{userData.stats.profitLoss.split(' ')[0]}</div>
                </div>
              </div>

              <div className="space-y-2 rounded-2xl bg-white/[0.02] border border-white/5 p-5">
                {[
                  { label: "Synced Predictions", value: userData.stats.totalBets, icon: Target },
                  { label: "Successful Nodes", value: userData.stats.wonBets, icon: ShieldCheck },
                  { label: "Avg Signal Size", value: userData.stats.averageBetSize, icon: PieChart },
                  { label: "Max Hub Capture", value: userData.stats.biggestWin, icon: Crown }
                ].map((stat, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-white/[0.03] last:border-0 hover:translate-x-1 transition-transform cursor-default">
                    <div className="flex items-center gap-2 group">
                      <stat.icon className="w-3.5 h-3.5 text-text-muted/40 group-hover:text-somnia-cyan transition-colors" />
                      <span className="text-[10px] font-black text-text-muted/60 uppercase tracking-widest">{stat.label}</span>
                    </div>
                    <span className="text-[11px] font-black text-white tracking-widest uppercase">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Command & Control */}
        <div className="lg:col-span-8 space-y-8">
          {/* Trophy Deck */}
          <div className="glass-card p-8 border-white/10">
            <div className="flex items-center justify-between mb-8">
              <h3 className="flex items-center gap-3 text-xs font-black text-white uppercase tracking-[0.2em]">
                <Trophy className="text-somnia-magenta h-4 w-4" />
                Neural Achievement Deck
              </h3>
            </div>
            <TrophyWall
              trophies={trophies}
              isOwnProfile={true}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Global Signal Log */}
            <div className="glass-card p-6 border-white/10">
              <h3 className="mb-6 text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                <History className="text-somnia-blue h-4 w-4" />
                Signal Log
              </h3>
              <div className="space-y-3">
                {userData.recentActivity.map((activity) => {
                  const config = getActivityConfig(activity.type);
                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="group flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all cursor-default"
                    >
                      <div className={`p-2.5 rounded-xl ${config.bg} ${config.color} shrink-0`}>
                        <config.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-white leading-tight uppercase tracking-wide truncate">{activity.description}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[8px] font-black text-text-muted/40 uppercase tracking-[0.2em]">{activity.date}</span>
                          <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-white/5 ${config.color}`}>
                            {config.label}
                          </span>
                        </div>
                      </div>
                      {activity.amount && (
                        <div className="text-[10px] font-black text-white tracking-tighter tabular-nums">
                          {activity.amount}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
              <Button variant="ghost" fullWidth size="sm" className="mt-6 text-[9px] uppercase tracking-widest font-black opacity-40 hover:opacity-100">
                Access Full Log
              </Button>
            </div>

            {/* Sector Affinity */}
            <div className="glass-card p-6 border-white/10">
              <h3 className="mb-6 text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                <Compass className="text-somnia-cyan h-4 w-4" />
                Sector Affinity
              </h3>
              <div className="space-y-5">
                {userData.categoryPerformance.map((category) => (
                  <div
                    key={category.category}
                    className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 group hover:border-somnia-cyan/30 transition-all"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">{category.category} Sector</span>
                      <span className="text-[9px] font-black text-somnia-cyan uppercase tracking-widest">
                        {category.winRate}% Synchronized
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden border border-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${category.winRate}%` }}
                        className="h-full bg-gradient-to-r from-somnia-cyan to-somnia-blue shadow-[0_0_10px_rgba(34,199,255,0.4)]"
                      />
                    </div>
                    <div className="mt-3 flex justify-between items-center">
                      <div className="text-[8px] text-text-muted/40 uppercase font-black tracking-widest">Aggregate Load</div>
                      <div className="text-[9px] font-mono text-text-muted/80">{category.volume} STT</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 rounded-2xl bg-somnia-cyan/5 border border-somnia-cyan/10 text-center">
                <p className="text-[9px] font-black text-somnia-cyan uppercase tracking-[0.2em]">Predicted Efficiency: <span className="text-white">High</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount } from "wagmi";
import {
  Users,
  MessageSquare,
  Zap,
  ShieldCheck,
  Trophy,
  Activity,
  Plus,
  Search,
  Filter,
  ArrowRight,
  Clock,
  Heart,
  BarChart3,
  TrendingUp,
  Globe,
  Lock,
  MessageCircle,
  Eye,
  ChevronRight,
  Sparkles
} from "lucide-react";
import Button from "@/components/button";
import communityService, { Discussion, CommunityStats } from "@/services/communityService";
import Link from "next/link";

export default function CommunityPage() {
  useAccount();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [stats, setStats] = useState<CommunityStats>({
    activeDiscussions: 0,
    communityMembers: 0,
    totalComments: 0,
    totalLikes: 0,
    weeklyActivity: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy] = useState<'recent' | 'popular'>('recent');
  const [searchQuery, setSearchQuery] = useState("");

  const categories = ['all', 'general', 'predictions', 'strategy', 'crypto', 'sports', 'feedback'];

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [discussionsData, statsData] = await Promise.all([
        communityService.getDiscussions(selectedCategory, sortBy),
        communityService.getCommunityStats()
      ]);
      setDiscussions(discussionsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading community data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, sortBy]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const statsData = [
    { label: "Active Nodes", value: stats.communityMembers, icon: Users, color: "text-somnia-cyan" },
    { label: "Neural Signals", value: stats.activeDiscussions, icon: MessageSquare, color: "text-somnia-blue" },
    { label: "Total Syncs", value: stats.totalComments, icon: Activity, color: "text-somnia-violet" },
    { label: "Network Trust", value: "98.4%", icon: ShieldCheck, color: "text-somnia-magenta" }
  ];

  const filteredDiscussions = discussions.filter(d =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-12">
      {/* Network Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-5 border-white/5 group hover:border-white/10 transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors ${stat.color}`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted/40">{stat.label}</span>
            </div>
            <div className="text-2xl font-black text-white tracking-tighter">
              {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Content: Signals Feed */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                <TrendingUp className="text-somnia-cyan w-6 h-6" />
                Collective <span className="text-somnia-cyan">Signals</span>
              </h2>
              <p className="text-xs text-text-muted font-medium">Real-time intelligence from the neural network.</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-somnia-cyan transition-colors" />
                <input
                  type="text"
                  placeholder="Scan signals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-somnia-cyan/50 focus:ring-1 focus:ring-somnia-cyan/20 w-full md:w-64 transition-all"
                />
              </div>
              <Button variant="outline" size="sm" className="!rounded-xl border-white/10 px-4">
                <Filter className="w-3.5 h-3.5 mr-2" />
                Filter
              </Button>
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${selectedCategory === cat
                  ? 'bg-somnia-cyan text-black border-somnia-cyan shadow-[0_0_15px_rgba(34,199,255,0.3)]'
                  : 'bg-white/5 text-text-muted border-white/5 hover:border-white/10 hover:text-white'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Signal Cards */}
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {loading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="glass-card p-6 border-white/5 h-32 animate-pulse" />
                ))
              ) : filteredDiscussions.length > 0 ? (
                filteredDiscussions.map((discussion, i) => (
                  <motion.div
                    key={discussion.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group relative"
                  >
                    <Link href={`/community/${discussion.id}`}>
                      <div className="glass-card p-6 border-white/5 hover:bg-white/[0.03] hover:border-white/20 transition-all relative overflow-hidden">
                        {discussion.isPinned && (
                          <div className="absolute top-0 right-0 p-1.5 bg-somnia-cyan/10 border-l border-b border-somnia-cyan/20 rounded-bl-xl">
                            <Lock className="w-3 h-3 text-somnia-cyan" />
                          </div>
                        )}

                        <div className="flex items-start gap-5">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-somnia-cyan/20 to-somnia-blue/20 flex items-center justify-center border border-white/5 group-hover:border-somnia-cyan/30 transition-all">
                              <span className="text-lg font-black text-white">{discussion.title.charAt(0)}</span>
                            </div>
                            <div className="text-[9px] font-black text-text-muted/40 uppercase tracking-tighter">
                              Rep: {discussion.reputation}
                            </div>
                          </div>

                          <div className="flex-1 space-y-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-3">
                                <span className="text-[9px] font-black uppercase tracking-widest text-somnia-cyan bg-somnia-cyan/10 px-2 py-0.5 rounded-md border border-somnia-cyan/20">
                                  {discussion.category}
                                </span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-text-muted/40 flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" />
                                  {communityService.formatTimeAgo(discussion.createdAt)}
                                </span>
                              </div>
                              <h3 className="text-lg font-black text-white hover:text-somnia-cyan transition-colors uppercase tracking-tight">
                                {discussion.title}
                              </h3>
                            </div>

                            <p className="text-xs text-text-muted leading-relaxed line-clamp-2 italic">
                              &quot;{discussion.content}&quot;
                            </p>

                            <div className="flex items-center justify-between pt-2">
                              <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2 text-text-muted group-hover:text-white transition-colors">
                                  <Heart className="w-4 h-4 text-somnia-magenta/60" />
                                  <span className="text-[10px] font-black">{discussion.totalLikes}</span>
                                </div>
                                <div className="flex items-center gap-2 text-text-muted group-hover:text-white transition-colors">
                                  <MessageCircle className="w-4 h-4 text-somnia-blue/60" />
                                  <span className="text-[10px] font-black">{discussion.replyCount}</span>
                                </div>
                                <div className="flex items-center gap-2 text-text-muted group-hover:text-white transition-colors">
                                  <Eye className="w-4 h-4 text-somnia-cyan/60" />
                                  <span className="text-[10px] font-black">{discussion.viewCount || 120}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 text-[10px] font-black uppercase text-somnia-cyan opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                Open Signal <ChevronRight className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-20 glass-card border-dashed border-white/5">
                  <Globe className="w-12 h-12 text-text-muted/20 mx-auto mb-4" />
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">No signals detected</h3>
                  <p className="text-xs text-text-muted">Broadcast a new signal to the collective to start a sync.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar: Collective Intelligence & Gamification */}
        <div className="lg:col-span-4 space-y-10">
          {/* Broadcast Action */}
          <div className="space-y-4">
            <Button
              onClick={() => { }}
              className="w-full h-14 !rounded-2xl bg-gradient-to-r from-somnia-cyan to-somnia-blue text-black font-black uppercase tracking-widest shadow-[0_0_30px_rgba(34,199,255,0.2)] hover:shadow-[0_0_40px_rgba(34,199,255,0.4)] transition-all group"
            >
              <Plus className="w-5 h-5 mr-3 group-hover:rotate-90 transition-transform" />
              Broadcast Signal
            </Button>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 text-center">
              <p className="text-[9px] font-black text-text-muted/40 uppercase tracking-[0.2em] leading-relaxed">
                Broadcasts require Level 1 authorization. <br />
                Verified nodes gain 2x repution.
              </p>
            </div>
          </div>

          {/* Sync Challenges - Gamification */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Zap className="text-somnia-blue w-4 h-4" />
                Sync Challenges
              </h3>
              <span className="text-[10px] font-black text-somnia-blue uppercase tracking-widest animate-pulse">Active</span>
            </div>

            <div className="space-y-4">
              {[
                { title: "The BTC Surge", goal: "Predict $75k by Friday", reward: "500 Rep", progress: 65, color: "somnia-cyan" },
                { title: "Sector Mastery", goal: "5 Successful Sports Signals", reward: "Elite Badge", progress: 20, color: "somnia-violet" },
              ].map((challenge, i) => (
                <div key={i} className="glass-card p-4 border-white/5 space-y-3 group hover:border-white/10">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-white uppercase">{challenge.title}</h4>
                      <p className="text-[10px] text-text-muted leading-tight">{challenge.goal}</p>
                    </div>
                    <div className="text-[10px] font-black text-somnia-cyan">{challenge.reward}</div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
                      <span className="text-text-muted/40">Sync Progress</span>
                      <span className="text-white">{challenge.progress}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${challenge.progress}%` }}
                        className={`h-full bg-${challenge.color}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Neural Nodes - Leaderboard */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Trophy className="text-somnia-magenta w-4 h-4" />
                Nexus Leaders
              </h3>
              <ArrowRight className="w-4 h-4 text-text-muted/40" />
            </div>

            <div className="space-y-3">
              {[
                { name: "Oracle_01", rep: 12500, badge: "Grandmaster", color: "text-somnia-magenta" },
                { name: "SatoshiSignal", rep: 9800, badge: "Veteran", color: "text-somnia-cyan" },
                { name: "EtherNode", rep: 8400, badge: "Guardian", color: "text-somnia-violet" },
              ].map((user, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.03] transition-colors border border-transparent hover:border-white/5">
                  <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-black ${i === 0 ? 'text-somnia-magenta border border-somnia-magenta/30' : 'text-text-muted'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white">{user.name}</span>
                      <span className="text-[10px] font-black text-white">{user.rep.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className={`w-2.5 h-2.5 ${user.color}`} />
                      <span className="text-[9px] font-black uppercase tracking-widest text-text-muted/60">{user.badge}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Collective Wisdom Info */}
          <div className="glass-card p-6 border-somnia-cyan/10 bg-somnia-cyan/[0.02] space-y-4">
            <div className="p-3 rounded-2xl bg-somnia-cyan/10 border border-somnia-cyan/20 w-fit">
              <BarChart3 className="text-somnia-cyan w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-black text-white uppercase tracking-tight">Collective Intelligence</h3>
              <p className="text-[11px] text-text-muted leading-relaxed">
                Our neural collective aggregates signals from over 2,400 identity nodes. Collective sentiment has a 78% accuracy rate over the last 30 intervals.
              </p>
            </div>
            <Button variant="outline" className="w-full !rounded-xl border-somnia-cyan/20 text-somnia-cyan text-[10px] font-black uppercase tracking-widest hover:bg-somnia-cyan hover:text-black">
              Analysis Report
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

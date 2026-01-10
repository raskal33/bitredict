"use client";

import { useState } from "react";
import { Search, Shield, Star, Globe, Award } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function MembersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // Sample member data
  const members = [
    {
      id: 1,
      name: "CryptoOracle",
      role: "Top Predictor",
      avatarSlot: "O1",
      stats: { predictions: 45, winRate: "82%", discussions: 23 },
      reputation: 12500,
      badge: "Grandmaster",
      color: "somnia-magenta",
      status: "online"
    },
    {
      id: 2,
      name: "MarketMaker",
      role: "Active Creator",
      avatarSlot: "M2",
      stats: { predictions: 38, winRate: "75%", discussions: 18 },
      reputation: 8400,
      badge: "Veteran",
      color: "somnia-cyan",
      status: "online"
    },
    {
      id: 3,
      name: "BetMaster",
      role: "High Roller",
      avatarSlot: "B3",
      stats: { predictions: 62, winRate: "78%", discussions: 31 },
      reputation: 9800,
      badge: "Guardian",
      color: "somnia-violet",
      status: "idle"
    },
    {
      id: 4,
      name: "TrendSpotter",
      role: "Community Helper",
      avatarSlot: "T4",
      stats: { predictions: 29, winRate: "70%", discussions: 45 },
      reputation: 4500,
      badge: "Neophyte",
      color: "somnia-blue",
      status: "offline"
    }
  ];

  const roles = ["Top Predictor", "Active Creator", "High Roller", "Community Helper"];

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !selectedRole || member.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-10">
      {/* Search and Global Filtering */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="relative group w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-somnia-cyan transition-colors" />
          <input
            type="text"
            placeholder="Scan resident database..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-somnia-cyan/50 focus:ring-1 focus:ring-somnia-cyan/20 transition-all"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none w-full md:w-auto">
          <button
            onClick={() => setSelectedRole(null)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${selectedRole === null
              ? 'bg-somnia-cyan text-black border-somnia-cyan'
              : 'bg-white/5 text-text-muted border-white/5 hover:border-white/10 hover:text-white'
              }`}
          >
            All Roles
          </button>
          {roles.map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${selectedRole === role
                ? "bg-somnia-cyan text-black border-somnia-cyan"
                : "bg-white/5 text-text-muted border-white/5 hover:border-white/10"
                }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredMembers.map((member, i) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              className="group"
            >
              <Link href="/profile">
                <div className="glass-card p-6 border-white/5 group-hover:border-somnia-cyan/30 transition-all relative overflow-hidden h-full flex flex-col">
                  <div className="absolute top-4 right-4 flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${member.status === 'online' ? 'bg-somnia-cyan animate-pulse' : member.status === 'idle' ? 'bg-somnia-blue' : 'bg-white/10'}`} />
                    <span className="text-[8px] font-black uppercase text-text-muted/40 tracking-widest">{member.status}</span>
                  </div>

                  <div className="flex flex-col items-center text-center gap-4 mb-6">
                    <div className="relative">
                      <div className={`w-20 h-20 rounded-[28px] bg-gradient-to-br from-somnia-cyan/10 to-somnia-blue/10 flex items-center justify-center border border-white/5 group-hover:border-${member.color}/40 transition-all`}>
                        <span className="text-2xl font-black text-white">{member.avatarSlot}</span>
                      </div>
                      <div className="absolute -bottom-2 -right-2 p-1.5 rounded-lg bg-[#0A0A1A] border border-white/10">
                        <Award className={`w-4 h-4 text-${member.color}`} />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-white uppercase tracking-tight group-hover:text-somnia-cyan transition-colors">{member.name}</h3>
                      <div className="flex items-center justify-center gap-2 mt-1">
                        <Shield className="w-3 h-3 text-text-muted/40" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted/60">{member.role}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
                      <div className="text-[8px] font-black text-text-muted/40 uppercase mb-1">Predictions</div>
                      <div className="text-xs font-black text-white">{member.stats.predictions}</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
                      <div className="text-[8px] font-black text-text-muted/40 uppercase mb-1">Win Rate</div>
                      <div className="text-xs font-black text-somnia-cyan">{member.stats.winRate}</div>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-text-muted/40 uppercase mb-0.5">Reputation</span>
                      <span className="text-xs font-black text-white flex items-center gap-1">
                        <Star className="w-3 h-3 text-somnia-cyan fill-somnia-cyan" />
                        {member.reputation.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] font-black text-text-muted/40 uppercase mb-0.5">Access Node</span>
                      <div className="text-[10px] font-black text-white uppercase tracking-tighter">Level 4</div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-20 glass-card border-dashed border-white/5">
          <Globe className="w-12 h-12 text-text-muted/20 mx-auto mb-4" />
          <h3 className="text-lg font-black text-white uppercase tracking-tight">No residents found</h3>
          <p className="text-xs text-text-muted">No identity nodes match your current scan parameters.</p>
        </div>
      )}
    </div>
  );
}

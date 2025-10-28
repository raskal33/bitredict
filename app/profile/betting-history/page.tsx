"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { useBettingHistory } from "@/hooks/usePortfolio";
import { formatSTT, formatRelativeTime, formatShortDate } from "@/utils/formatters";
import {
  MagnifyingGlassIcon,
  TrophyIcon,
  XCircleIcon,
  ClockIcon,
  CalendarDaysIcon,
  BanknotesIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";

export default function BettingHistoryPage() {
  const { address } = useAccount();
  const { data: history } = useBettingHistory();
  const [activeTab, setActiveTab] = useState<"all" | "won" | "lost" | "ended">("all");
  const [searchQuery, setSearchQuery] = useState("");

  if (!address) {
    return (
      <div className="space-y-8">
        <div className="glass-card p-12 text-center">
          <TrophyIcon className="h-16 w-16 text-text-muted mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-text-primary mb-2">Connect Your Wallet</h2>
          <p className="text-text-secondary">Please connect your wallet to view betting history</p>
        </div>
      </div>
    );
  }

  const bets = history || [];
  
  // Filter by tab and search
  const filteredBets = bets.filter(bet => {
    const matchesTab = activeTab === "all" || bet.status === activeTab;
    const matchesSearch = searchQuery === "" || 
      bet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bet.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Calculate stats
  const totalBets = bets.length;
  const wonBets = bets.filter(b => b.status === 'won').length;
  const lostBets = bets.filter(b => b.status === 'lost').length;
  const pendingBets = bets.filter(b => b.status === 'ended').length;
  
  const winRate = totalBets > 0 ? ((wonBets / totalBets) * 100).toFixed(1) : '0';

  const tabs = [
    { id: "all", label: "All", count: totalBets },
    { id: "won", label: "Won", count: wonBets },
    { id: "lost", label: "Lost", count: lostBets },
    { id: "ended", label: "Pending", count: pendingBets }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "won": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      case "lost": return "text-red-500 bg-red-600/10 border-red-600/30";
      case "ended": return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
      default: return "text-gray-400 bg-gray-500/10 border-gray-500/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "won": return <TrophyIcon className="h-5 w-5" />;
      case "lost": return <XCircleIcon className="h-5 w-5" />;
      case "ended": return <ClockIcon className="h-5 w-5" />;
      default: return <BanknotesIcon className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8"
      >
        <h1 className="text-3xl font-bold text-text-primary mb-6">Betting History</h1>
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="glass-card p-4">
            <div className="text-2xl font-bold text-text-primary mb-1">{totalBets}</div>
            <div className="text-sm text-text-muted">Total Bets</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-2xl font-bold text-green-400 mb-1">{wonBets}</div>
            <div className="text-sm text-text-muted">Won</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-2xl font-bold text-red-400 mb-1">{lostBets}</div>
            <div className="text-sm text-text-muted">Lost</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-2xl font-bold text-text-primary mb-1">{winRate}%</div>
            <div className="text-sm text-text-muted">Win Rate</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "all" | "won" | "lost" | "ended")}
              className={`px-4 py-2 rounded-button text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-gradient-primary text-black'
                  : 'glass-card text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
          <input
            type="text"
            placeholder="Search bets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-bg-card border border-border-card rounded-button text-text-primary placeholder-text-muted focus:outline-none focus:border-primary/50"
          />
        </div>
      </motion.div>

      {/* Betting History List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        {filteredBets.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <TrophyIcon className="h-12 w-12 text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">No Bets Found</h3>
            <p className="text-text-secondary">
              {searchQuery !== "" 
                ? "Try adjusting your search query."
                : "Your betting history will appear here once you place bets."
              }
            </p>
          </div>
        ) : (
          filteredBets.map((bet, index) => {
            const realizedPL = parseFloat(bet.realizedPL);
            
            return (
              <motion.div
                key={bet.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index }}
                className="glass-card p-6 hover:bg-[rgba(255,255,255,0.02)] transition-all duration-200"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`px-3 py-1 rounded-button text-xs font-medium border ${getStatusColor(bet.status)}`}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(bet.status)}
                          <span>{bet.status.charAt(0).toUpperCase() + bet.status.slice(1)}</span>
                        </div>
                      </div>
                      <span className="text-xs text-text-muted">{bet.category}</span>
                    </div>
                    
                    <Link 
                      href={bet.type === "oddyssey" ? `/oddyssey` : `/bet/${bet.poolId}`}
                      className="block mb-2"
                    >
                      <h4 className="font-semibold text-text-primary hover:text-primary transition-colors line-clamp-1">
                        {bet.title}
                      </h4>
                    </Link>
                    
                    {bet.outcome && (
                      <p className="text-sm text-text-secondary mb-2">
                        Outcome: <span className="font-medium text-text-primary">{bet.outcome}</span>
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-text-muted">
                      <div className="flex items-center gap-1">
                        <CalendarDaysIcon className="h-4 w-4" />
                        {formatShortDate(bet.createdAt)}
                      </div>
                      <span>•</span>
                      <span>{formatRelativeTime(bet.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-sm text-text-muted mb-1">Staked</div>
                      <div className="font-medium text-text-primary">
                        {formatSTT(bet.amount)}
                      </div>
                    </div>
                    
                    {bet.status === 'won' && bet.payoutAmount && (
                      <div className="text-right">
                        <div className="text-sm text-text-muted mb-1">Payout</div>
                        <div className="font-medium text-green-400">
                          {formatSTT(bet.payoutAmount)}
                        </div>
                      </div>
                    )}
                    
                    <div className="text-right">
                      <div className="text-sm text-text-muted mb-1">P&L</div>
                      <div className={`font-bold ${realizedPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {realizedPL >= 0 ? '+' : ''}{formatSTT(bet.realizedPL)}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>
    </div>
  );
}

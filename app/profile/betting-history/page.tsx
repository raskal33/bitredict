"use client";

import { useState } from "react";
import { FaFilter, FaSort, FaChevronDown, FaChevronUp, FaSearch } from "react-icons/fa";
import { BiSolidBadgeCheck, BiSolidXCircle } from "react-icons/bi";
import Button from "@/components/button";

export default function BettingHistoryPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Mock data for betting history
  const bettingHistory = [
    {
      id: 1,
      date: "2024-11-15",
      prediction: "BTC will break $70,000",
      amount: 45,
      odds: "1.8x",
      result: "win",
      payout: 81,
      profit: 36,
      category: "crypto",
      timeAgo: "2 hours ago"
    },
    {
      id: 2,
      date: "2024-11-12",
      prediction: "STT will outperform ETH in Q4",
      amount: 25,
      odds: "2.2x",
      result: "pending",
      payout: 55,
      profit: 30,
      category: "crypto",
      timeAgo: "3 days ago"
    },
    {
      id: 3,
      date: "2024-11-08",
      prediction: "DOGE will reach $1",
      amount: 15,
      odds: "5.0x",
      result: "loss",
      payout: 0,
      profit: -15,
      category: "crypto",
      timeAgo: "1 week ago"
    },
    {
      id: 4,
      date: "2024-10-30",
      prediction: "Manchester United vs Arsenal - Arsenal wins",
      amount: 30,
      odds: "2.5x",
      result: "win",
      payout: 75,
      profit: 45,
      category: "sports",
      timeAgo: "2 weeks ago"
    },
    {
      id: 5,
      date: "2024-10-25",
      prediction: "US Presidential Election - Democratic win",
      amount: 50,
      odds: "1.9x",
      result: "pending",
      payout: 95,
      profit: 45,
      category: "politics",
      timeAgo: "3 weeks ago"
    },
    {
      id: 6,
      date: "2024-10-20",
      prediction: "Ethereum will merge to PoS in Q4",
      amount: 100,
      odds: "2.0x",
      result: "win",
      payout: 200,
      profit: 100,
      category: "crypto",
      timeAgo: "1 month ago"
    }
  ];
  
  // Filter bets based on active tab and search query
  const filteredBets = bettingHistory.filter(bet => {
    const matchesTab = 
      activeTab === "all" || 
      (activeTab === "wins" && bet.result === "win") ||
      (activeTab === "losses" && bet.result === "loss") ||
      (activeTab === "pending" && bet.result === "pending");
      
    const matchesSearch = 
      searchQuery === "" || 
      (bet.prediction || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bet.category || '').toLowerCase().includes(searchQuery.toLowerCase());
      
    return matchesTab && matchesSearch;
  });
  
  // Sort bets based on sort criteria
  const sortedBets = [...filteredBets].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case "date":
        comparison = new Date(b.date).getTime() - new Date(a.date).getTime();
        break;
      case "amount":
        comparison = b.amount - a.amount;
        break;
      case "profit":
        comparison = b.profit - a.profit;
        break;
      default:
        comparison = new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    
    return sortOrder === "asc" ? comparison * -1 : comparison;
  });
  
  // Stats for the summary cards
  const stats = {
    totalBets: bettingHistory.length,
    wins: bettingHistory.filter(bet => bet.result === "win").length,
    losses: bettingHistory.filter(bet => bet.result === "loss").length,
    pending: bettingHistory.filter(bet => bet.result === "pending").length,
    totalProfit: bettingHistory.reduce((acc, bet) => acc + (bet.result === "win" ? bet.profit : bet.result === "loss" ? -bet.amount : 0), 0),
    avgBetSize: bettingHistory.reduce((acc, bet) => acc + bet.amount, 0) / bettingHistory.length,
    biggestWin: Math.max(...bettingHistory.filter(bet => bet.result === "win").map(bet => bet.profit), 0),
    winRate: (bettingHistory.filter(bet => bet.result === "win").length / (bettingHistory.filter(bet => bet.result === "win").length + bettingHistory.filter(bet => bet.result === "loss").length) * 100).toFixed(1)
  };
  
  // Function to toggle sort
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };
  
  // Function to get result badge
  const getResultBadge = (result: string) => {
    switch (result) {
      case "win":
        return <span className="flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400"><BiSolidBadgeCheck className="text-green-400" /> Win</span>;
      case "loss":
        return <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400"><BiSolidXCircle className="text-red-400" /> Loss</span>;
      case "pending":
        return <span className="flex items-center gap-1 rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs text-yellow-400"><FaSort className="text-yellow-400" /> Pending</span>;
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="glass-card p-4 text-center">
          <div className="text-sm text-text-muted">Total Bets</div>
          <div className="text-2xl font-bold text-white">{stats.totalBets}</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-sm text-text-muted">Win Rate</div>
          <div className="text-2xl font-bold text-primary">{stats.winRate}%</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-sm text-text-muted">Total Profit</div>
          <div className="text-2xl font-bold text-secondary">+{stats.totalProfit} STT</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-sm text-text-muted">Biggest Win</div>
          <div className="text-2xl font-bold text-accent">{stats.biggestWin} STT</div>
        </div>
      </div>
      
      {/* Filters and Search */}
      <div className="glass-card p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Tab Filters */}
          <div className="flex gap-2">
            <Button 
              variant={activeTab === "all" ? "primary" : "ghost"} 
              size="sm"
              onClick={() => setActiveTab("all")}
            >
              All ({bettingHistory.length})
            </Button>
            <Button 
              variant={activeTab === "wins" ? "primary" : "ghost"} 
              size="sm"
              onClick={() => setActiveTab("wins")}
            >
              Wins ({stats.wins})
            </Button>
            <Button 
              variant={activeTab === "losses" ? "primary" : "ghost"} 
              size="sm"
              onClick={() => setActiveTab("losses")}
            >
              Losses ({stats.losses})
            </Button>
            <Button 
              variant={activeTab === "pending" ? "primary" : "ghost"} 
              size="sm"
              onClick={() => setActiveTab("pending")}
            >
              Pending ({stats.pending})
            </Button>
          </div>
          
          {/* Search and Advanced Filters */}
          <div className="flex gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search predictions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 rounded-md border border-border-input bg-bg-card pl-9 pr-4 text-sm focus:border-primary focus:outline-none"
              />
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              leftIcon={<FaFilter />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
          </div>
        </div>
        
        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 gap-4 rounded-lg bg-bg-card p-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm text-text-muted">Date Range</label>
              <select className="w-full rounded-md border border-border-input bg-bg-card px-3 py-1.5 text-sm focus:border-primary focus:outline-none">
                <option value="all">All Time</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="year">Last Year</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-text-muted">Category</label>
              <select className="w-full rounded-md border border-border-input bg-bg-card px-3 py-1.5 text-sm focus:border-primary focus:outline-none">
                <option value="all">All Categories</option>
                <option value="crypto">Crypto</option>
                <option value="sports">Sports</option>
                <option value="politics">Politics</option>
                <option value="entertainment">Entertainment</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-text-muted">Amount</label>
              <select className="w-full rounded-md border border-border-input bg-bg-card px-3 py-1.5 text-sm focus:border-primary focus:outline-none">
                <option value="all">Any Amount</option>
                            <option value="small">Small (&lt; 20 STT)</option>
            <option value="medium">Medium (20-50 STT)</option>
            <option value="large">Large (&gt; 50 STT)</option>
              </select>
            </div>
          </div>
        )}
      </div>
      
      {/* Betting History Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse">
            <thead>
              <tr className="border-b border-border-card bg-bg-card">
                <th className="p-4 text-left text-sm font-medium text-text-muted">
                  <button 
                    className="flex items-center gap-1"
                    onClick={() => handleSort("date")}
                  >
                    Date
                    {sortBy === "date" && (
                      sortOrder === "desc" ? <FaChevronDown size={12} /> : <FaChevronUp size={12} />
                    )}
                  </button>
                </th>
                <th className="p-4 text-left text-sm font-medium text-text-muted">Prediction</th>
                <th className="p-4 text-left text-sm font-medium text-text-muted">
                  <button 
                    className="flex items-center gap-1"
                    onClick={() => handleSort("amount")}
                  >
                    Amount
                    {sortBy === "amount" && (
                      sortOrder === "desc" ? <FaChevronDown size={12} /> : <FaChevronUp size={12} />
                    )}
                  </button>
                </th>
                <th className="p-4 text-left text-sm font-medium text-text-muted">Odds</th>
                <th className="p-4 text-left text-sm font-medium text-text-muted">Result</th>
                <th className="p-4 text-left text-sm font-medium text-text-muted">
                  <button 
                    className="flex items-center gap-1"
                    onClick={() => handleSort("profit")}
                  >
                    Profit/Loss
                    {sortBy === "profit" && (
                      sortOrder === "desc" ? <FaChevronDown size={12} /> : <FaChevronUp size={12} />
                    )}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedBets.length > 0 ? (
                sortedBets.map((bet) => (
                  <tr key={bet.id} className="border-b border-border-card hover:bg-bg-card">
                    <td className="p-4">
                      <div>{bet.date}</div>
                      <div className="text-xs text-text-muted">{bet.timeAgo}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-white">{bet.prediction}</div>
                      <div className="text-xs text-text-muted capitalize">{bet.category}</div>
                    </td>
                    <td className="p-4 font-medium">{bet.amount} STT</td>
                    <td className="p-4 font-medium">{bet.odds}</td>
                    <td className="p-4">{getResultBadge(bet.result)}</td>
                    <td className={`p-4 font-medium ${
                      bet.result === "win" 
                        ? "text-green-400" 
                        : bet.result === "loss" 
                        ? "text-red-400" 
                        : "text-yellow-400"
                    }`}>
                      {bet.profit > 0 ? `+${bet.profit}` : bet.profit} STT
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-text-muted">
                    No betting history found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
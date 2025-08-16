"use client";

import { useState } from "react";
import { FaSearch, FaUsers, FaCoins } from "react-icons/fa";
import { MdOutlineCategory } from "react-icons/md";
import { BiSolidBadgeCheck } from "react-icons/bi";
import Button from "@/components/button";

export default function CreatedPredictionsPage() {
  const [activeTab, setActiveTab] = useState("all");
  // const [sortBy, setSortBy] = useState("date");
  // const [sortOrder, setSortOrder] = useState("desc");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Mock data for created predictions
  const createdMarkets = [
    {
      id: 1,
      title: "ETH will hit $5,000 by Dec 2024",
      category: "crypto",
      createdAt: "2024-11-14",
      timeAgo: "1 day ago",
      status: "active",
      participants: 45,
      volume: 320,
      resolveDate: "2024-12-31",
      resolutionSource: "CoinGecko",
      description: "Will Ethereum reach or exceed $5,000 before the end of 2024?",
      creatorFee: "2%"
    },
    {
      id: 2,
      title: "Bitcoin will reach $100k by EOY",
      category: "crypto",
      createdAt: "2024-10-10",
      timeAgo: "1 month ago",
      status: "active",
      participants: 120,
      volume: 950,
      resolveDate: "2024-12-31",
      resolutionSource: "CoinMarketCap",
      description: "Will Bitcoin reach or exceed $100,000 before the end of 2024?",
      creatorFee: "2%"
    },
    {
      id: 3,
      title: "US Presidential Election - Democratic win",
      category: "politics",
      createdAt: "2024-10-05",
      timeAgo: "1 month ago",
      status: "active",
      participants: 85,
      volume: 620,
      resolveDate: "2024-11-05",
      resolutionSource: "Official election results",
      description: "Will the Democratic candidate win the 2024 US Presidential Election?",
      creatorFee: "2%"
    },
    {
      id: 4,
      title: "Manchester United to win Premier League 24/25",
      category: "sports",
      createdAt: "2024-08-15",
      timeAgo: "3 months ago",
      status: "active",
      participants: 65,
      volume: 480,
      resolveDate: "2025-05-30",
      resolutionSource: "Official Premier League standings",
      description: "Will Manchester United win the Premier League in the 2024/2025 season?",
      creatorFee: "2%"
    },
    {
      id: 5,
      title: "STT will outperform Ethereum in Q4 2024",
      category: "crypto",
      createdAt: "2024-09-28",
      timeAgo: "2 months ago",
      status: "active",
      participants: 72,
      volume: 540,
      resolveDate: "2024-12-31",
      resolutionSource: "CoinGecko price data",
              description: "Will STT's price performance exceed Ethereum's in Q4 2024?",
      creatorFee: "2%"
    },
    {
      id: 6,
      title: "Apple will release AR glasses in 2024",
      category: "technology",
      createdAt: "2024-01-15",
      timeAgo: "10 months ago",
      status: "resolved",
      participants: 110,
      volume: 830,
      resolveDate: "2024-09-30",
      resolutionSource: "Apple official announcements",
      description: "Will Apple release augmented reality glasses before the end of 2024?",
      creatorFee: "2%",
      resolution: "No"
    },
    {
      id: 7,
      title: "Taylor Swift album release date in 2024",
      category: "entertainment",
      createdAt: "2024-02-20",
      timeAgo: "9 months ago",
      status: "resolved",
      participants: 55,
      volume: 320,
      resolveDate: "2024-06-30",
      resolutionSource: "Official artist announcements",
      description: "Will Taylor Swift release a new album before July 2024?",
      creatorFee: "2%",
      resolution: "Yes"
    }
  ];
  
  // Filter markets based on active tab and search query
  const filteredMarkets = createdMarkets.filter(market => {
    const matchesTab = 
      activeTab === "all" || 
      (activeTab === "active" && market.status === "active") ||
      (activeTab === "resolved" && market.status === "resolved");
      
    const matchesSearch = 
      searchQuery === "" || 
      (market.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (market.category || '').toLowerCase().includes(searchQuery.toLowerCase());
      
    return matchesTab && matchesSearch;
  });
  
  // Sort markets based on sort criteria (currently sorting by date desc)
  const sortedMarkets = [...filteredMarkets].sort((a, b) => {
    // Sort by date descending (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  // Stats for the summary cards
  const stats = {
    totalMarkets: createdMarkets.length,
    activeMarkets: createdMarkets.filter(market => market.status === "active").length,
    resolvedMarkets: createdMarkets.filter(market => market.status === "resolved").length,
    totalVolume: createdMarkets.reduce((acc, market) => acc + market.volume, 0),
    totalParticipants: createdMarkets.reduce((acc, market) => acc + market.participants, 0),
    avgVolumePerMarket: Math.round(createdMarkets.reduce((acc, market) => acc + market.volume, 0) / createdMarkets.length)
  };
  
  // Function to toggle sort (currently unused but kept for future use)
  // const handleSort = (field) => {
  //   if (sortBy === field) {
  //     setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  //   } else {
  //     setSortBy(field);
  //     setSortOrder("desc");
  //   }
  // };
  
  // Function to get category badge color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "crypto":
        return "bg-primary/20 text-primary";
      case "sports":
        return "bg-green-500/20 text-green-400";
      case "politics":
        return "bg-blue-500/20 text-blue-400";
      case "entertainment":
        return "bg-purple-500/20 text-purple-400";
      case "technology":
        return "bg-yellow-500/20 text-yellow-400";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
  };
  
  // Function to get status badge
  const getStatusBadge = (status: string, resolution?: string) => {
    if (status === "active") {
      return <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">Active</span>;
    } else if (status === "resolved") {
      return (
        <div className="flex items-center gap-1">
          <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400">Resolved</span>
          {resolution && (
            <span className={`rounded-full px-2 py-0.5 text-xs ${resolution === "Yes" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
              {resolution}
            </span>
          )}
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
              <MdOutlineCategory className="text-xl text-primary" />
            </div>
            <div>
              <div className="text-sm text-text-muted">Total Markets</div>
              <div className="text-xl font-bold text-white">{stats.totalMarkets}</div>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/20">
              <FaUsers className="text-xl text-secondary" />
            </div>
            <div>
              <div className="text-sm text-text-muted">Total Participants</div>
              <div className="text-xl font-bold text-white">{stats.totalParticipants}</div>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20">
              <FaCoins className="text-xl text-accent" />
            </div>
            <div>
              <div className="text-sm text-text-muted">Total Volume</div>
                              <div className="text-xl font-bold text-white">{stats.totalVolume} STT</div>
            </div>
          </div>
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
              All ({createdMarkets.length})
            </Button>
            <Button 
              variant={activeTab === "active" ? "primary" : "ghost"} 
              size="sm"
              onClick={() => setActiveTab("active")}
            >
              Active ({stats.activeMarkets})
            </Button>
            <Button 
              variant={activeTab === "resolved" ? "primary" : "ghost"} 
              size="sm"
              onClick={() => setActiveTab("resolved")}
            >
              Resolved ({stats.resolvedMarkets})
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 rounded-md border border-border-input bg-bg-card pl-9 pr-4 text-sm focus:border-primary focus:outline-none"
            />
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          </div>
        </div>
      </div>
      
      {/* Created Markets List */}
      <div className="space-y-4">
        {sortedMarkets.length > 0 ? (
          sortedMarkets.map((market) => (
            <div key={market.id} className="glass-card overflow-hidden">
              <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${getCategoryColor(market.category)}`}>
                      {market.category}
                    </span>
                    {getStatusBadge(market.status, market.resolution)}
                    <span className="text-xs text-text-muted">{market.timeAgo}</span>
                  </div>
                  
                  <h3 className="mb-1 text-lg font-semibold text-white">{market.title}</h3>
                  <p className="text-sm text-text-muted">{market.description}</p>
                  
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    <div className="flex items-center gap-1">
                      <FaUsers className="text-text-muted" />
                      <span className="text-text-secondary">{market.participants} participants</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaCoins className="text-text-muted" />
                      <span className="text-text-secondary">{market.volume} STT</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BiSolidBadgeCheck className="text-text-muted" />
                      <span className="text-text-secondary">{market.creatorFee} creator fee</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                  >
                    View Market
                  </Button>
                  {market.status === "active" && (
                    <Button 
                      variant="primary" 
                      size="sm"
                    >
                      Edit Market
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="border-t border-border-card bg-bg-card px-4 py-2 text-xs">
                <div className="flex flex-wrap gap-x-6 gap-y-1">
                  <span><strong>Created:</strong> {market.createdAt}</span>
                  <span><strong>Resolves:</strong> {market.resolveDate}</span>
                  <span><strong>Source:</strong> {market.resolutionSource}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="glass-card p-8 text-center text-text-muted">
            No markets found matching your filters.
          </div>
        )}
      </div>
    </div>
  );
}

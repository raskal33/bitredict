"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AnimatedTitle from "@/components/AnimatedTitle";
import { 
  FaChartLine, 
  FaFilter, 
  FaSearch, 
  FaBolt, 
  FaTrophy, 
  FaLock, 
  FaStar,
  FaFire,
  FaClock,
  FaSort
} from "react-icons/fa";

type MarketCategory = "all" | "boosted" | "trending" | "private" | "combo";
type SortBy = "newest" | "oldest" | "volume" | "ending-soon";

export default function MarketsPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<MarketCategory>("all");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const handleCreateMarket = () => {
    router.push("/create-prediction");
  };

  const categories = [
    { 
      id: "all" as MarketCategory, 
      label: "All Markets", 
      icon: FaChartLine, 
      color: "text-blue-400",
      description: "Browse all available prediction markets"
    },
    { 
      id: "boosted" as MarketCategory, 
      label: "Boosted", 
      icon: FaBolt, 
      color: "text-yellow-400",
      description: "Markets with enhanced rewards"
    },
    { 
      id: "trending" as MarketCategory, 
      label: "Trending", 
      icon: FaFire, 
      color: "text-orange-400",
      description: "Popular and high-activity markets"
    },
    { 
      id: "combo" as MarketCategory, 
      label: "Combo", 
      icon: FaStar, 
      color: "text-green-400",
      description: "Multi-event parlay predictions"
    },
    { 
      id: "private" as MarketCategory, 
      label: "Private", 
      icon: FaLock, 
      color: "text-purple-400",
      description: "Exclusive whitelisted markets"
    },
  ];

  const sortOptions = [
    { id: "newest" as SortBy, label: "Newest First", icon: FaClock },
    { id: "oldest" as SortBy, label: "Oldest First", icon: FaClock },
    { id: "volume" as SortBy, label: "Highest Volume", icon: FaTrophy },
    { id: "ending-soon" as SortBy, label: "Ending Soon", icon: FaClock },
  ];



  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <AnimatedTitle className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Prediction Markets
          </AnimatedTitle>
          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto">
            Discover and participate in prediction markets across sports, crypto, and more. 
            Put your knowledge to the test and earn rewards for accurate predictions.
          </p>
        </div>

        {/* Filters & Search */}
        <div className="mb-8">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all text-sm sm:text-base ${
                    activeCategory === category.id
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                      : "bg-white/10 text-gray-300 hover:text-white hover:bg-white/20"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${category.color}`} />
                  <span className="hidden sm:inline">{category.label}</span>
                  <span className="sm:hidden">{category.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Search and Sort Controls */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-80">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search markets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <FaSort className="h-4 w-4 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="bg-black/20 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400"
                >
                  {sortOptions.map((option) => (
                    <option key={option.id} value={option.id} className="bg-gray-800">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm ${
                  showFilters 
                    ? "bg-blue-500 text-white" 
                    : "bg-white/10 text-gray-300 hover:text-white hover:bg-white/20"
                }`}
              >
                <FaFilter className="h-4 w-4" />
                <span className="hidden sm:inline">Filters</span>
              </button>
            </div>
          </div>

          {/* Active Category Description */}
          <div className="mt-4 text-center">
            <p className="text-gray-300">
              {categories.find(c => c.id === activeCategory)?.description}
            </p>
          </div>
        </div>

        {/* Markets Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Markets List */}
          <div className="xl:col-span-3">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-8 border border-white/20">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <FaChartLine className="h-5 w-5 text-blue-400" />
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    {categories.find(c => c.id === activeCategory)?.label || "All"} Markets
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-gray-300 justify-center sm:justify-start">
                  <span className="text-sm sm:text-base">Loading markets...</span>
                </div>
              </div>
              
              <p className="text-gray-300 mb-6">
                {`Showing ${activeCategory === "all" ? "all available" : activeCategory} prediction markets`}
              </p>

              {/* Placeholder for market cards with same styling as home page */}
              <div className="text-center py-12">
                <FaChartLine className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Markets Loading</h3>
                <p className="text-gray-400 mb-6">
                  Market data will be integrated with the backend API to display real prediction markets here.
                </p>
                <button
                  onClick={handleCreateMarket}
                  className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-all"
                >
                  Create Market
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="xl:col-span-1">
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4">Market Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Total Volume</span>
                    <span className="text-white font-semibold">-</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Active Markets</span>
                    <span className="text-white font-semibold">-</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Participants</span>
                    <span className="text-white font-semibold">-</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleCreateMarket}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 px-4 rounded-lg transition-all"
                  >
                    Create Market
                  </button>
                  
                  <button
                    onClick={() => router.push("/oddyssey")}
                    className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-semibold py-3 px-4 rounded-lg transition-all"
                  >
                    Play Oddyssey
                  </button>
                  
                  <button
                    onClick={() => router.push("/staking")}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 px-4 rounded-lg transition-all"
                  >
                    Stake BITR
                  </button>
                </div>
              </div>

              {/* Boost Information */}
              <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FaBolt className="h-6 w-6 text-yellow-400" />
                  <h3 className="text-xl font-bold text-white">Boost Rewards</h3>
                </div>
                <p className="text-gray-300 mb-4 text-sm">
                  Pool creators can boost their markets for better visibility and higher rewards.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-yellow-400">🥉 Bronze</span>
                    <span className="text-white">2 STT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">🥈 Silver</span>
                    <span className="text-white">3 STT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-yellow-400">🥇 Gold</span>
                    <span className="text-white">5 STT</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  Boost fees are distributed to winners as additional rewards.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

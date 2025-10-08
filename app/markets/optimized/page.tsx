"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import AnimatedTitle from "@/components/AnimatedTitle";
import InfinitePoolList from "@/components/InfinitePoolList";
import RecentBetsLane from "@/components/RecentBetsLane";
import { useCacheInvalidation } from "@/hooks/useMarketsQuery";
import { EnhancedPool } from "@/components/EnhancedPoolCard";
import { 
  FaChartLine, 
  FaSearch, 
  FaBolt, 
  FaTrophy, 
  FaStar,
  FaFire,
  FaClock,
  FaShieldAlt,
  FaGift
} from "react-icons/fa";

type CategoryFilter = "all" | "football" | "crypto" | "basketball" | "other";
type SortBy = "newest" | "oldest" | "volume" | "ending-soon";

export default function OptimizedMarketsPage() {
  const router = useRouter();
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [searchTerm, setSearchTerm] = useState("");

  // Cache invalidation for manual refresh
  const { invalidatePools } = useCacheInvalidation();

  // Handle pool selection with prefetch
  const handlePoolSelect = useCallback((pool: EnhancedPool) => {
    console.log('🎯 Pool selected:', pool.id);
    router.push(`/bet/${pool.id}`);
  }, [router]);

  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    console.log('🔄 Manual refresh triggered');
    invalidatePools();
    toast.success('Markets refreshed!');
  }, [invalidatePools]);

  // Filter configuration
  const getFilters = useCallback(() => {
    const filters: Record<string, string | number> = {};
    
    if (categoryFilter !== "all") {
      filters.category = categoryFilter;
    }
    
    // Status filtering can be added here if needed
    
    filters.sortBy = sortBy;
    filters.limit = 20; // Load 20 pools per page
    
    return filters;
  }, [categoryFilter, sortBy]);

  const filters = getFilters();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-indigo-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <AnimatedTitle className="mb-8">
              Markets
            </AnimatedTitle>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl p-4 border border-purple-500/30"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Volume</p>
                    <p className="text-2xl font-bold text-white">$2.4M</p>
                  </div>
                  <FaChartLine className="text-purple-400 text-2xl" />
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-xl p-4 border border-green-500/30"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Active Markets</p>
                    <p className="text-2xl font-bold text-white">127</p>
                  </div>
                  <FaFire className="text-green-400 text-2xl" />
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-r from-orange-600/20 to-red-600/20 rounded-xl p-4 border border-orange-500/30"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Participants</p>
                    <p className="text-2xl font-bold text-white">1,234</p>
                  </div>
                  <FaTrophy className="text-orange-400 text-2xl" />
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-xl p-4 border border-blue-500/30"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Success Rate</p>
                    <p className="text-2xl font-bold text-white">87%</p>
                  </div>
                  <FaShieldAlt className="text-blue-400 text-2xl" />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search markets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2">
              {[
                { key: "all", label: "All", icon: FaChartLine },
                { key: "football", label: "Football", icon: FaTrophy },
                { key: "crypto", label: "Crypto", icon: FaBolt },
                { key: "basketball", label: "Basketball", icon: FaStar },
                { key: "other", label: "Other", icon: FaGift }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setCategoryFilter(key as CategoryFilter)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    categoryFilter === key
                      ? "bg-purple-600 text-white"
                      : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
                  }`}
                >
                  <Icon className="text-sm" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>

            {/* Sort and Refresh */}
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="volume">Volume</option>
                <option value="ending-soon">Ending Soon</option>
              </select>
              
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200"
              >
                <FaClock className="text-sm" />
                <span className="text-sm font-medium">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bets Lane */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <RecentBetsLane />
      </div>

      {/* Infinite Pool List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <InfinitePoolList
          filters={filters}
          onPoolSelect={handlePoolSelect}
        />
      </div>
    </div>
  );
}

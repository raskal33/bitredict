"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import {
  TrophyIcon,
  ChartBarIcon,
  GlobeAltIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UsersIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import AnalyticsService, {
  EnhancedCategoryStats,
  LeagueStats,
  UserStats,
  MarketTypeStats
} from "@/services/analyticsService";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

interface EnhancedStatsDashboardProps {
  className?: string;
}

export default function EnhancedStatsDashboard({ className = "" }: EnhancedStatsDashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "leagues" | "categories" | "users" | "markets">("overview");
  const [sortBy, setSortBy] = useState<string>("total_volume");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stats data
  const [categoryStats, setCategoryStats] = useState<EnhancedCategoryStats[]>([]);
  const [leagueStats, setLeagueStats] = useState<LeagueStats[]>([]);
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [marketTypeStats, setMarketTypeStats] = useState<MarketTypeStats[]>([]);

  useEffect(() => {
    loadComprehensiveStats();
  }, [sortBy, sortOrder]);

  const loadComprehensiveStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const stats = await AnalyticsService.getComprehensiveStats();
      
      setCategoryStats(stats.categoryStats.categories || []);
      setLeagueStats(stats.leagueStats.leagues || []);
      setUserStats(stats.userStats.users || []);
      setMarketTypeStats(stats.marketTypeStats.marketTypes || []);

    } catch (err) {
      console.error('Error loading comprehensive stats:', err);
      setError('Failed to load statistics');
    } finally {
      setIsLoading(false);
    }
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
    return volume.toFixed(0);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getReputationColor = (tier: string) => {
    const colors = {
      'Legendary': 'text-purple-500',
      'Expert': 'text-red-500',
      'Veteran': 'text-orange-500',
      'Trusted': 'text-blue-500',
      'Regular': 'text-green-500',
      'Beginner': 'text-yellow-500',
      'New': 'text-gray-500'
    };
    return colors[tier as keyof typeof colors] || 'text-gray-500';
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
        <div className="text-center">
          <div className="text-red-500 text-lg font-semibold mb-2">Error Loading Stats</div>
          <div className="text-gray-600">{error}</div>
          <button
            onClick={loadComprehensiveStats}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Enhanced Analytics Dashboard</h2>
          <p className="text-gray-600">Comprehensive platform statistics and insights</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="total_volume">Total Volume</option>
            <option value="total_pools">Total Pools</option>
            <option value="total_participants">Participants</option>
            <option value="last_activity">Recent Activity</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            {sortOrder === 'desc' ? <ArrowTrendingDownIcon className="w-5 h-5" /> : <ArrowTrendingUpIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Overview', icon: ChartBarIcon },
          { id: 'leagues', label: 'Leagues', icon: TrophyIcon },
          { id: 'categories', label: 'Categories', icon: GlobeAltIcon },
          { id: 'users', label: 'Users', icon: UsersIcon },
          { id: 'markets', label: 'Market Types', icon: SparklesIcon }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as "overview" | "leagues" | "categories" | "users" | "markets")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
              activeTab === tab.id
                ? 'bg-white shadow-sm text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Summary Cards */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Total Categories</p>
                    <p className="text-3xl font-bold">{categoryStats.length}</p>
                  </div>
                  <GlobeAltIcon className="w-8 h-8 text-blue-200" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">Active Leagues</p>
                    <p className="text-3xl font-bold">{leagueStats.length}</p>
                  </div>
                  <TrophyIcon className="w-8 h-8 text-green-200" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100">Market Types</p>
                    <p className="text-3xl font-bold">{marketTypeStats.length}</p>
                  </div>
                  <SparklesIcon className="w-8 h-8 text-purple-200" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100">Active Users</p>
                    <p className="text-3xl font-bold">{userStats.length}</p>
                  </div>
                  <UsersIcon className="w-8 h-8 text-orange-200" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'leagues' && (
            <div className="space-y-4">
              {leagueStats.map((league, index) => (
                <motion.div
                  key={league.league_name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <TrophyIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{league.league_name}</h3>
                        <p className="text-sm text-gray-600">
                          {league.total_pools} pools • {formatVolume(league.total_volume)} volume
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatVolume(league.total_volume)}</p>
                      <p className="text-sm text-gray-600">{league.total_participants} participants</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categoryStats.map((category, index) => (
                <motion.div
                  key={category.category_name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-2xl`}>
                        {category.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 capitalize">{category.category_name}</h3>
                        <p className="text-sm text-gray-600">
                          {category.total_pools} pools • {category.total_participants} participants
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatVolume(category.total_volume)}</p>
                      <p className="text-sm text-gray-600">{category.most_popular_market_type_name}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4">
              {userStats.map((user, index) => (
                <motion.div
                  key={user.user_address}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <UsersIcon className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{formatAddress(user.user_address)}</h3>
                        <p className="text-sm text-gray-600">
                          {user.total_bets} bets • {user.total_liquidity} liquidity
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatVolume(user.total_volume)}</p>
                      <p className={`text-sm font-medium ${getReputationColor(user.reputation_tier)}`}>
                        {user.reputation_tier}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'markets' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {marketTypeStats.map((market, index) => (
                <motion.div
                  key={market.market_type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="text-2xl">{market.icon}</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{market.market_type_name}</h3>
                      <p className="text-sm text-gray-600">{market.description}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Pools:</span>
                      <span className="font-medium">{market.total_pools}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Volume:</span>
                      <span className="font-medium">{formatVolume(market.total_volume)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Win Rate:</span>
                      <span className="font-medium">{market.win_rate.toFixed(1)}%</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

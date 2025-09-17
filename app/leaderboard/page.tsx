"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrophyIcon, 
  UserIcon, 
  MagnifyingGlassIcon,
  ChartBarIcon,
  StarIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { LeaderboardTable, UserStatsCard } from '@/components/leaderboard';

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<'prediction' | 'reputation' | 'personal'>('prediction');
  const [activeMetric, setActiveMetric] = useState<'total_staked' | 'total_won' | 'success_rate' | 'volume_generated'>('total_staked');
  const [searchAddress, setSearchAddress] = useState('');
  
  const {
    leaderboardData,
    userStats,
    userRank,
    loading,
    searching,
    error,
    loadLeaderboard,
    searchUser,
  } = useLeaderboard({
    metric: activeMetric,
    limit: 50,
    useCache: true,
    autoRefresh: true,
    refreshInterval: 300000 // 5 minutes
  });

  // Load leaderboard data when tab or metric changes
  useEffect(() => {
    if (activeTab !== 'personal') {
      loadLeaderboard(activeTab);
    }
  }, [activeTab, activeMetric, loadLeaderboard]);

  const handleSearch = async () => {
    if (!searchAddress.trim()) return;
    await searchUser(searchAddress);
  };

  const tabs = [
    { id: 'prediction', label: 'Prediction Market', icon: ChartBarIcon },
    { id: 'reputation', label: 'Reputation', icon: StarIcon },
    { id: 'personal', label: 'Personal Data', icon: UserIcon }
  ];

  const predictionMetrics = [
    { id: 'total_staked', label: 'Total Staked', icon: CurrencyDollarIcon },
    { id: 'total_won', label: 'Total Won', icon: TrophyIcon },
    { id: 'success_rate', label: 'Success Rate', icon: ArrowTrendingUpIcon },
    { id: 'volume_generated', label: 'Volume Generated', icon: ChartBarIcon }
  ];

  return (
    <div className="min-h-screen bg-gradient-main">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
            Leaderboard
          </h1>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Discover the top performers in prediction markets and reputation rankings
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap justify-center gap-2 mb-8"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'all' | 'daily' | 'weekly' | 'monthly')}
              className={`flex items-center gap-2 px-6 py-3 rounded-button font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-gradient-primary text-black shadow-button'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-card border border-border-card'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'personal' ? (
            <motion.div
              key="personal"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto"
            >
              {/* Search Section */}
              <div className="glass-card p-6 mb-8">
                <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
                  <MagnifyingGlassIcon className="h-6 w-6 text-primary" />
                  User Lookup
                </h2>
                <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder="Enter wallet address (0x...)"
                    value={searchAddress}
                    onChange={(e) => setSearchAddress(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-button bg-bg-card border border-border-input text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={searching || !searchAddress.trim()}
                    className="px-6 py-3 rounded-button bg-gradient-primary text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-button transition-all duration-200"
                  >
                    {searching ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>

              {/* User Stats */}
              <UserStatsCard 
                userStats={userStats}
                userRank={userRank}
                loading={searching}
                error={error}
              />
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-6xl mx-auto"
            >
              {/* Metric Selector for Prediction Market */}
              {activeTab === 'prediction' && (
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                  {predictionMetrics.map((metric) => (
                    <button
                      key={metric.id}
                      onClick={() => setActiveMetric(metric.id as 'totalWinnings' | 'winRate' | 'totalBets' | 'reputation')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-button font-medium transition-all duration-200 ${
                        activeMetric === metric.id
                          ? 'bg-gradient-primary text-black shadow-button'
                          : 'text-text-secondary hover:text-text-primary hover:bg-bg-card border border-border-card'
                      }`}
                    >
                      <metric.icon className="h-4 w-4" />
                      {metric.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Leaderboard Table */}
              <LeaderboardTable 
                data={leaderboardData}
                type={activeTab}
                loading={loading}
                error={error}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
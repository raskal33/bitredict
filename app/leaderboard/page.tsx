"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  TrophyIcon, 
  UserIcon, 
  StarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowsUpDownIcon
} from '@heroicons/react/24/outline';

type TabType = 'creators' | 'challengers' | 'reputation';

type SortColumn = 
  | 'pools_created' | 'volume' | 'wins' | 'losses' | 'pnl' // Creators
  | 'pools_challenged' // Challengers
  | 'reputation' | 'total_pools' | 'total_bets'; // Reputation

type SortOrder = 'asc' | 'desc';

interface LeaderboardEntry {
  rank: number;
  address: string;
  // Creators
  poolsCreated?: number;
  // Challengers
  poolsChallenged?: number;
  // Both
  volume?: number;
  wins?: number;
  losses?: number;
  pnl?: number;
  reputation?: number;
  // Reputation
  totalPools?: number;
  totalBets?: number;
  wonBets?: number;
  totalVolume?: number;
  profitLoss?: number;
}

interface LeaderboardResponse {
  success: boolean;
  data: LeaderboardEntry[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export default function PoolLeaderboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>('creators');
  const [sortBy, setSortBy] = useState<SortColumn>('volume');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 100,
    offset: 0,
    hasMore: false
  });

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let endpoint = '';
      let sortParam = sortBy;

      if (activeTab === 'creators') {
        endpoint = '/api/leaderboards/pools/creators';
      } else if (activeTab === 'challengers') {
        endpoint = '/api/leaderboards/pools/challengers';
        // Map sortBy for challengers
        if (sortBy === 'pools_created') {
          sortParam = 'pools_challenged';
        }
      } else {
        endpoint = '/api/leaderboards/pools/reputation';
      }

      const params = new URLSearchParams({
        sortBy: sortParam,
        sortOrder,
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString()
      });

      const response = await fetch(`${endpoint}?${params}`);
      const result: LeaderboardResponse = await response.json();

      if (result.success) {
        setData(result.data);
        setPagination(result.pagination);
      } else {
        setError('Failed to fetch leaderboard data');
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to fetch leaderboard data');
    } finally {
      setLoading(false);
    }
  }, [activeTab, sortBy, sortOrder, pagination.limit, pagination.offset]);

  useEffect(() => {
    setPagination(prev => ({ ...prev, offset: 0 }));
  }, [activeTab, sortBy, sortOrder]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const handleSort = (column: SortColumn) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortBy !== column) {
      return <ArrowsUpDownIcon className="w-4 h-4" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUpIcon className="w-4 h-4" />
      : <ArrowDownIcon className="w-4 h-4" />;
  };

  const tabs = [
    { id: 'creators' as TabType, label: 'Creators', icon: TrophyIcon },
    { id: 'challengers' as TabType, label: 'Challengers', icon: UserIcon },
    { id: 'reputation' as TabType, label: 'Reputation', icon: StarIcon }
  ];

  const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === null) return '0';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  const formatCurrency = (num: number | undefined) => {
    if (num === undefined || num === null) return '0.00';
    return formatNumber(num);
  };

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
            Pool Leaderboard
          </h1>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Top performers across creators, challengers, and reputation rankings
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
              onClick={() => setActiveTab(tab.id)}
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

        {/* Leaderboard Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card overflow-hidden"
        >
          {loading ? (
            <div className="p-8 text-center text-text-secondary">
              Loading leaderboard...
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-400">
              {error}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-bg-card/50 border-b border-border-card">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Rank</th>
                    
                    {activeTab === 'creators' && (
                      <>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">
                          <button
                            onClick={() => handleSort('pools_created')}
                            className="flex items-center gap-2 hover:text-text-primary transition-colors"
                          >
                            Pools Created
                            {getSortIcon('pools_created')}
                          </button>
                        </th>
                      </>
                    )}
                    
                    {activeTab === 'challengers' && (
                      <>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">
                          <button
                            onClick={() => handleSort('pools_challenged')}
                            className="flex items-center gap-2 hover:text-text-primary transition-colors"
                          >
                            Pools Challenged
                            {getSortIcon('pools_challenged')}
                          </button>
                        </th>
                      </>
                    )}

                    {(activeTab === 'creators' || activeTab === 'challengers') && (
                      <>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">
                          <button
                            onClick={() => handleSort('volume')}
                            className="flex items-center gap-2 hover:text-text-primary transition-colors"
                          >
                            Volume
                            {getSortIcon('volume')}
                          </button>
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">
                          <button
                            onClick={() => handleSort('wins')}
                            className="flex items-center gap-2 hover:text-text-primary transition-colors"
                          >
                            Wins
                            {getSortIcon('wins')}
                          </button>
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">
                          <button
                            onClick={() => handleSort('losses')}
                            className="flex items-center gap-2 hover:text-text-primary transition-colors"
                          >
                            Losses
                            {getSortIcon('losses')}
                          </button>
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">
                          <button
                            onClick={() => handleSort('pnl')}
                            className="flex items-center gap-2 hover:text-text-primary transition-colors"
                          >
                            PnL
                            {getSortIcon('pnl')}
                          </button>
                        </th>
                      </>
                    )}

                    {activeTab === 'reputation' && (
                      <>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">
                          <button
                            onClick={() => handleSort('reputation')}
                            className="flex items-center gap-2 hover:text-text-primary transition-colors"
                          >
                            Reputation
                            {getSortIcon('reputation')}
                          </button>
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">
                          <button
                            onClick={() => handleSort('total_pools')}
                            className="flex items-center gap-2 hover:text-text-primary transition-colors"
                          >
                            Total Pools
                            {getSortIcon('total_pools')}
                          </button>
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">
                          <button
                            onClick={() => handleSort('total_bets')}
                            className="flex items-center gap-2 hover:text-text-primary transition-colors"
                          >
                            Total Bets
                            {getSortIcon('total_bets')}
                          </button>
                        </th>
                      </>
                    )}

                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-card">
                  {data.map((entry) => (
                    <tr
                      key={entry.address}
                      className="hover:bg-bg-card/30 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-text-primary font-medium">
                        #{entry.rank}
                      </td>

                      {activeTab === 'creators' && (
                        <>
                          <td className="px-6 py-4 text-sm text-text-secondary">
                            {entry.poolsCreated || 0}
                          </td>
                          <td className="px-6 py-4 text-sm text-text-secondary">
                            {formatCurrency(entry.volume)} STT
                          </td>
                          <td className="px-6 py-4 text-sm text-green-400">
                            {entry.wins || 0}
                          </td>
                          <td className="px-6 py-4 text-sm text-red-400">
                            {entry.losses || 0}
                          </td>
                          <td className={`px-6 py-4 text-sm font-medium ${
                            (entry.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {formatCurrency(entry.pnl)} STT
                          </td>
                        </>
                      )}

                      {activeTab === 'challengers' && (
                        <>
                          <td className="px-6 py-4 text-sm text-text-secondary">
                            {entry.poolsChallenged || 0}
                          </td>
                          <td className="px-6 py-4 text-sm text-text-secondary">
                            {formatCurrency(entry.volume)} STT
                          </td>
                          <td className="px-6 py-4 text-sm text-green-400">
                            {entry.wins || 0}
                          </td>
                          <td className="px-6 py-4 text-sm text-red-400">
                            {entry.losses || 0}
                          </td>
                          <td className={`px-6 py-4 text-sm font-medium ${
                            (entry.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {formatCurrency(entry.pnl)} STT
                          </td>
                        </>
                      )}

                      {activeTab === 'reputation' && (
                        <>
                          <td className="px-6 py-4 text-sm text-text-primary font-medium">
                            {entry.reputation || 40}
                          </td>
                          <td className="px-6 py-4 text-sm text-text-secondary">
                            {entry.totalPools || 0}
                          </td>
                          <td className="px-6 py-4 text-sm text-text-secondary">
                            {entry.totalBets || 0}
                          </td>
                        </>
                      )}

                      <td className="px-6 py-4 text-sm text-text-secondary font-mono">
                        {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.total > 0 && (
            <div className="px-6 py-4 border-t border-border-card flex items-center justify-between">
              <div className="text-sm text-text-secondary">
                Showing {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
                  disabled={pagination.offset === 0}
                  className="px-4 py-2 rounded-button bg-bg-card border border-border-card text-text-secondary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-bg-card/50 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
                  disabled={!pagination.hasMore}
                  className="px-4 py-2 rounded-button bg-bg-card border border-border-card text-text-secondary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-bg-card/50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  TrophyIcon, 
  UserIcon, 
  StarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowsUpDownIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { 
  TrophyIcon as TrophyIconSolid,
  SparklesIcon as SparklesIconSolid
} from '@heroicons/react/24/solid';
import UserAddressLink from "@/components/UserAddressLink";

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
      return <ArrowsUpDownIcon className="w-4 h-4 opacity-50" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUpIcon className="w-4 h-4 text-primary" />
      : <ArrowDownIcon className="w-4 h-4 text-primary" />;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <TrophyIconSolid className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <TrophyIconSolid className="w-5 h-5 text-slate-400" />;
    if (rank === 3) return <TrophyIconSolid className="w-5 h-5 text-amber-600" />;
    return null;
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
          <div className="flex items-center justify-center gap-3 mb-4">
            <SparklesIconSolid className="w-10 h-10 text-primary animate-pulse" />
            <h1 className="text-4xl md:text-5xl font-bold gradient-text">
              Pool Leaderboard
          </h1>
            <SparklesIconSolid className="w-10 h-10 text-primary animate-pulse" />
          </div>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Top performers across creators, challengers, and reputation rankings
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap justify-center gap-3 mb-8"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                activeTab === tab.id
                  ? 'bg-gradient-primary text-black shadow-lg shadow-primary/50 scale-105'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-card border border-border-card backdrop-blur-sm'
              }`}
            >
              <tab.icon className={`h-5 w-5 ${activeTab === tab.id ? 'text-black' : ''}`} />
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Leaderboard Table */}
            <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card overflow-hidden border border-border-card/50 shadow-2xl"
        >
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
              <p className="text-text-secondary text-lg">Loading leaderboard...</p>
                </div>
          ) : error ? (
            <div className="p-12 text-center">
              <div className="text-red-400 text-xl mb-2">⚠️</div>
              <p className="text-red-400">{error}</p>
              </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-violet-500/20 backdrop-blur-sm border-b-2 border-primary/30">
                  <tr>
                    <th className="px-6 py-5 text-left text-sm font-bold text-text-primary uppercase tracking-wider">
                      Rank
                    </th>
                    
                    {activeTab === 'creators' && (
                      <th className="px-6 py-5 text-left text-sm font-bold text-text-primary uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('pools_created')}
                          className="flex items-center gap-2 hover:text-primary transition-colors group"
                        >
                          Pools Created
                          {getSortIcon('pools_created')}
                        </button>
                      </th>
                    )}
                    
                    {activeTab === 'challengers' && (
                      <th className="px-6 py-5 text-left text-sm font-bold text-text-primary uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('pools_challenged')}
                          className="flex items-center gap-2 hover:text-primary transition-colors group"
                        >
                          Pools Challenged
                          {getSortIcon('pools_challenged')}
                        </button>
                      </th>
                    )}

                    {(activeTab === 'creators' || activeTab === 'challengers') && (
                      <>
                        <th className="px-6 py-5 text-left text-sm font-bold text-text-primary uppercase tracking-wider">
                          <button
                            onClick={() => handleSort('volume')}
                            className="flex items-center gap-2 hover:text-primary transition-colors group"
                          >
                            Volume
                            {getSortIcon('volume')}
                          </button>
                        </th>
                        <th className="px-6 py-5 text-left text-sm font-bold text-text-primary uppercase tracking-wider">
                          <button
                            onClick={() => handleSort('wins')}
                            className="flex items-center gap-2 hover:text-green-400 transition-colors group"
                          >
                            Wins
                            {getSortIcon('wins')}
                          </button>
                        </th>
                        <th className="px-6 py-5 text-left text-sm font-bold text-text-primary uppercase tracking-wider">
                          <button
                            onClick={() => handleSort('losses')}
                            className="flex items-center gap-2 hover:text-red-400 transition-colors group"
                          >
                            Losses
                            {getSortIcon('losses')}
                          </button>
                        </th>
                        <th className="px-6 py-5 text-left text-sm font-bold text-text-primary uppercase tracking-wider">
                          <button
                            onClick={() => handleSort('pnl')}
                            className="flex items-center gap-2 hover:text-primary transition-colors group"
                          >
                            PnL
                            {getSortIcon('pnl')}
                          </button>
                        </th>
                      </>
                    )}

                    {activeTab === 'reputation' && (
                      <>
                        <th className="px-6 py-5 text-left text-sm font-bold text-text-primary uppercase tracking-wider">
                          <button
                            onClick={() => handleSort('reputation')}
                            className="flex items-center gap-2 hover:text-primary transition-colors group"
                          >
                            Reputation
                            {getSortIcon('reputation')}
                          </button>
                        </th>
                        <th className="px-6 py-5 text-left text-sm font-bold text-text-primary uppercase tracking-wider">
                          <button
                            onClick={() => handleSort('total_pools')}
                            className="flex items-center gap-2 hover:text-primary transition-colors group"
                          >
                            Total Pools
                            {getSortIcon('total_pools')}
                          </button>
                        </th>
                        <th className="px-6 py-5 text-left text-sm font-bold text-text-primary uppercase tracking-wider">
                    <button
                            onClick={() => handleSort('total_bets')}
                            className="flex items-center gap-2 hover:text-primary transition-colors group"
                          >
                            Total Bets
                            {getSortIcon('total_bets')}
                          </button>
                        </th>
                      </>
                    )}

                    <th className="px-6 py-5 text-left text-sm font-bold text-text-primary uppercase tracking-wider">Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-card/30">
                  {data.map((entry, index) => (
                    <motion.tr
                      key={entry.address}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={`hover:bg-gradient-to-r hover:from-primary/5 hover:to-secondary/5 transition-all duration-200 ${
                        entry.rank <= 3 ? 'bg-gradient-to-r from-primary/10 via-secondary/5 to-primary/10' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {getRankIcon(entry.rank)}
                          <span className={`text-sm font-bold ${
                            entry.rank === 1 ? 'text-yellow-400' :
                            entry.rank === 2 ? 'text-slate-400' :
                            entry.rank === 3 ? 'text-amber-600' :
                            'text-text-primary'
                          }`}>
                            #{entry.rank}
                          </span>
                        </div>
                      </td>

                      {activeTab === 'creators' && (
                        <>
                          <td className="px-6 py-4 text-sm text-text-secondary font-medium">
                            {entry.poolsCreated || 0}
                          </td>
                          <td className="px-6 py-4 text-sm text-text-secondary font-medium">
                            {formatCurrency(entry.volume)} <span className="text-text-muted">STT</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-green-400 font-semibold">
                            {entry.wins || 0}
                          </td>
                          <td className="px-6 py-4 text-sm text-red-400 font-semibold">
                            {entry.losses || 0}
                          </td>
                          <td className={`px-6 py-4 text-sm font-bold ${
                            (entry.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {(entry.pnl || 0) >= 0 ? '+' : ''}{formatCurrency(entry.pnl)} <span className="text-text-muted">STT</span>
                          </td>
                        </>
                      )}

                      {activeTab === 'challengers' && (
                        <>
                          <td className="px-6 py-4 text-sm text-text-secondary font-medium">
                            {entry.poolsChallenged || 0}
                          </td>
                          <td className="px-6 py-4 text-sm text-text-secondary font-medium">
                            {formatCurrency(entry.volume)} <span className="text-text-muted">STT</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-green-400 font-semibold">
                            {entry.wins || 0}
                          </td>
                          <td className="px-6 py-4 text-sm text-red-400 font-semibold">
                            {entry.losses || 0}
                          </td>
                          <td className={`px-6 py-4 text-sm font-bold ${
                            (entry.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {(entry.pnl || 0) >= 0 ? '+' : ''}{formatCurrency(entry.pnl)} <span className="text-text-muted">STT</span>
                          </td>
                        </>
                      )}

                      {activeTab === 'reputation' && (
                        <>
                          <td className="px-6 py-4 text-sm text-text-primary font-bold text-lg">
                            {entry.reputation || 40}
                          </td>
                          <td className="px-6 py-4 text-sm text-text-secondary font-medium">
                            {entry.totalPools || 0}
                          </td>
                          <td className="px-6 py-4 text-sm text-text-secondary font-medium">
                            {entry.totalBets || 0}
                          </td>
                        </>
                      )}

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <UserAddressLink 
                            address={entry.address} 
                            className="text-sm text-text-primary font-mono bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-violet-500/20 px-3 py-1 rounded-lg border border-primary/30 backdrop-blur-sm hover:text-primary transition-colors"
                          />
                          {entry.rank <= 3 && (
                            <SparklesIcon className="w-4 h-4 text-primary animate-pulse" />
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
                </div>
              )}

          {/* Pagination */}
          {pagination.total > 0 && (
            <div className="px-6 py-5 border-t border-primary/30 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-violet-500/10 flex items-center justify-between backdrop-blur-sm">
              <div className="text-sm font-medium bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Showing <span className="text-text-primary font-bold">{pagination.offset + 1}</span> - <span className="text-text-primary font-bold">{Math.min(pagination.offset + pagination.limit, pagination.total)}</span> of <span className="text-text-primary font-bold">{pagination.total}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
                  disabled={pagination.offset === 0}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-primary/30 text-text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:from-cyan-500/30 hover:to-blue-500/30 hover:border-primary/50 transition-all duration-200 font-medium backdrop-blur-sm"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
                  disabled={!pagination.hasMore}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-violet-500/20 border border-primary/30 text-text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-500/30 hover:to-violet-500/30 hover:border-primary/50 transition-all duration-200 font-medium backdrop-blur-sm"
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

"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { 
  CheckCircleIcon, 
  XCircleIcon,
  UserIcon,
  SparklesIcon,
  CalendarIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useUserProfile, useUserReputation } from '@/hooks/useUserProfile';
import { useUserFollow } from '@/hooks/useUserFollow';
import { formatDistanceToNow } from 'date-fns';
import PnLChart from '@/components/charts/PnLChart';

interface UserBet {
  id: string;
  poolId: string;
  market: string;
  category: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  totalBet: number;
  amountWon: number;
  profitLoss: number;
  profitLossPercent: number;
  result: 'won' | 'lost' | 'pending' | 'active';
  currency: string;
  timestamp: string;
}

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { address: connectedAddress } = useAccount();
  const userAddress = params?.address as string || '';
  
  const [activeTab, setActiveTab] = useState<'positions' | 'activity'>('positions');
  const [positionFilter, setPositionFilter] = useState<'active' | 'closed'>('closed');
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | 'ALL'>('1M');
  
  const { data: profile } = useUserProfile(userAddress);
  const { data: reputation } = useUserReputation(userAddress);
  const { profile: followData, follow, unfollow } = useUserFollow(userAddress);
  
  const isFollowing = followData?.isFollowing || false;
  
  const [bets, setBets] = useState<UserBet[]>([]);
  const [betsLoading, setBetsLoading] = useState(true);

  useEffect(() => {
    if (!userAddress) return;
    
    const fetchBets = async () => {
      setBetsLoading(true);
      try {
        console.log('🎯 Fetching bets for:', userAddress, 'filter:', positionFilter);
        const response = await fetch(`/api/users/${userAddress}/bets?status=${positionFilter}&limit=100`);
        const data = await response.json();
        
        console.log('📊 Bets API response:', {
          success: data.success,
          hasBets: !!data.data,
          betsCount: data.data?.length || 0,
          firstBet: data.data?.[0] || null
        });
        
        if (data.success && Array.isArray(data.data)) {
          setBets(data.data || []);
          // Calculate total P&L
          const totalPL = (data.data || []).reduce((sum: number, bet: UserBet) => sum + bet.profitLoss, 0);
          // setTotalProfitLoss(totalPL); // This line is removed as per the edit hint
          console.log('✅ Loaded', data.data.length, 'bets, Total P&L:', totalPL);
        } else {
          console.warn('⚠️ No bets data in response');
          setBets([]);
          // setTotalProfitLoss(0); // This line is removed as per the edit hint
        }
      } catch (error) {
        console.error('❌ Error fetching bets:', error);
        setBets([]);
        // setTotalProfitLoss(0); // This line is removed as per the edit hint
      } finally {
        setBetsLoading(false);
      }
    };
    
    fetchBets();
  }, [userAddress, positionFilter]);

  if (!userAddress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Invalid User Address</h1>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-bold"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const isOwnProfile = connectedAddress && userAddress && 
    connectedAddress.toLowerCase() === userAddress.toLowerCase();

  const profileStats = profile?.stats || {
    total_bets: 0,
    won_bets: 0,
    profit_loss: 0,
    total_volume: 0,
    avg_bet_size: 0,
    biggest_win: 0,
    total_pools_created: 0,
    pools_won: 0,
    reputation: 40
  };

  // Convert snake_case to camelCase for consistency
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ps = profileStats as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normalizedStats: any = {
    totalBets: ps.total_bets || ps.totalBets || 0,
    wonBets: ps.won_bets || ps.wonBets || 0,
    winRate: ((ps.total_bets || ps.totalBets) || 0) > 0 ? (((ps.won_bets || ps.wonBets) || 0) / ((ps.total_bets || ps.totalBets) || 0)) * 100 : 0,
    profitLoss: ps.profit_loss || ps.profitLoss || 0,
    totalVolume: ps.total_volume || ps.totalVolume || 0,
    biggestWin: ps.biggest_win || ps.biggestWin || 0,
    totalPoolsCreated: ps.total_pools_created || ps.totalPoolsCreated || 0,
    averageBetSize: ps.avg_bet_size || ps.averageBetSize || 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  const joinedDate = profile?.stats?.joinedAt 
    ? new Date(profile.stats.joinedAt)
    : null;

  const formatCurrency = (value: number) => {
    // Format STT values (not dollars, so no $ sign)
    const absValue = Math.abs(value);
    if (absValue >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M STT`;
    } else if (absValue >= 1000) {
      return `${(value / 1000).toFixed(2)}K STT`;
    }
    return `${value.toFixed(2)} STT`;
  };
  
  const formatCompactCurrency = (value: number) => {
    // For display in stat cards
    const absValue = Math.abs(value);
    if (absValue >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    } else if (absValue >= 1000) {
      return `${(value / 1000).toFixed(2)}K`;
    }
    return value.toFixed(2);
  };

  const closedBets = bets.filter(b => b.result === 'won' || b.result === 'lost');
  const activeBets = bets.filter(b => b.result === 'active' || b.result === 'pending');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Profile Header */}
        <div className="glass-card p-6 mb-8 rounded-2xl border border-gray-700/50">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left: Profile Picture & Basic Info */}
            <div className="flex items-start gap-4 flex-shrink-0">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-2xl font-bold">
                {userAddress.slice(2, 4).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold text-white">
                    {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                  </h1>
                  {reputation?.accessLevelName && (
                    <span className="px-2 py-1 text-xs rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30">
                      {reputation.accessLevelName}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                  {joinedDate && (
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="w-4 h-4" />
                      <span>Joined {joinedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <EyeIcon className="w-4 h-4" />
                    <span>{normalizedStats.totalBets > 0 ? `${(normalizedStats.totalBets / 1000).toFixed(1)}k` : '0'} predictions</span>
                  </div>
                </div>
                {!isOwnProfile && (
                  <button
                    onClick={() => isFollowing ? unfollow() : follow()}
                    className="mt-3 px-4 py-2 rounded-lg font-medium transition-all bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>
            </div>

            {/* Right: Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 flex-1">
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-lg p-4 border border-gray-700/30">
                  <div className="text-xs text-gray-400 mb-1">Positions Value</div>
                <div className="text-xl font-bold text-white">
                  {formatCompactCurrency(normalizedStats.totalVolume)} STT
                </div>
              </div>
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-lg p-4 border border-gray-700/30">
                <div className="text-xs text-gray-400 mb-1">Biggest Win</div>
                <div className="text-xl font-bold text-green-400">
                  {formatCompactCurrency(normalizedStats.biggestWin)} STT
                </div>
              </div>
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-lg p-4 border border-gray-700/30">
                <div className="text-xs text-gray-400 mb-1">Predictions</div>
                <div className="text-xl font-bold text-white">
                  {normalizedStats.totalBets.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profit/Loss Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Profit/Loss Card */}
          <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-gray-700/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-cyan-400" />
                Profit/Loss
              </h2>
              <div className="flex gap-2">
                {(['1D', '1W', '1M', 'ALL'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-3 py-1 text-xs rounded-lg transition-all ${
                      timeframe === tf
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                        : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-4xl font-bold mb-2">
              <span className={normalizedStats.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}>
                {normalizedStats.profitLoss >= 0 ? '+' : ''}{formatCompactCurrency(normalizedStats.profitLoss)} STT
              </span>
            </div>
            <div className="text-sm text-gray-400">Total P&L across all markets</div>
            {/* PnL Chart */}
            <div className="mt-6">
              <PnLChart bets={bets} timeframe={timeframe} />
            </div>
          </div>

          {/* Additional Stats */}
          <div className="space-y-4">
            <div className="glass-card p-4 rounded-xl border border-gray-700/50">
              <div className="text-xs text-gray-400 mb-1">Win Rate</div>
              <div className="text-2xl font-bold text-white">
                {normalizedStats.winRate.toFixed(1)}%
              </div>
            </div>
            <div className="glass-card p-4 rounded-xl border border-gray-700/50">
              <div className="text-xs text-gray-400 mb-1">Total Volume</div>
              <div className="text-2xl font-bold text-white">
                  {formatCompactCurrency(normalizedStats.totalVolume)} STT
              </div>
            </div>
          </div>
        </div>

        {/* Positions/Activity Tabs */}
        <div className="glass-card rounded-2xl border border-gray-700/50 overflow-hidden">
          {/* Tab Headers */}
          <div className="border-b border-gray-700/50 flex">
            <button
              onClick={() => setActiveTab('positions')}
              className={`flex-1 px-6 py-4 font-medium transition-all ${
                activeTab === 'positions'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Positions
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`flex-1 px-6 py-4 font-medium transition-all ${
                activeTab === 'activity'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Activity
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'positions' && (
              <>
                {/* Active/Closed Filter */}
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => setPositionFilter('active')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      positionFilter === 'active'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                        : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                    }`}
                  >
                    Active ({activeBets.length})
                  </button>
                  <button
                    onClick={() => setPositionFilter('closed')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      positionFilter === 'closed'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                        : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                    }`}
                  >
                    Closed ({closedBets.length})
                  </button>
                </div>

                {/* Positions Table */}
                {betsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
                  </div>
                ) : bets.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-400">No {positionFilter} positions found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700/50">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">RESULT</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">MARKET</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">TOTAL BET</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">AMOUNT WON</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bets.map((bet) => (
                          <tr 
                            key={bet.id} 
                            className="border-b border-gray-700/30 hover:bg-gray-800/30 transition-colors cursor-pointer"
                            onClick={() => router.push(`/bet/${bet.poolId}`)}
                          >
                            <td className="py-4 px-4">
                              {bet.result === 'won' && (
                                <CheckCircleIcon className="w-5 h-5 text-green-400" />
                              )}
                              {bet.result === 'lost' && (
                                <XCircleIcon className="w-5 h-5 text-red-400" />
                              )}
                              {(bet.result === 'active' || bet.result === 'pending') && (
                                <div className="w-5 h-5 rounded-full border-2 border-gray-400 border-t-transparent animate-spin"></div>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center text-xs font-bold">
                                  {bet.category.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-medium text-white">{bet.market}</div>
                                  <div className="text-xs text-gray-400">
                                    {bet.homeTeam && bet.awayTeam ? `${bet.homeTeam} vs ${bet.awayTeam}` : bet.category}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="font-medium text-white">
                                {formatCurrency(bet.totalBet)} {bet.currency}
                              </div>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="font-medium text-white">
                                {formatCurrency(bet.amountWon)} {bet.currency}
                              </div>
                              {bet.result === 'won' || bet.result === 'lost' ? (
                                <div className={`text-xs mt-1 ${
                                  bet.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {bet.profitLoss >= 0 ? '+' : ''}{formatCurrency(bet.profitLoss)} {bet.currency} ({bet.profitLossPercent.toFixed(2)}%)
                                </div>
                              ) : null}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-4">
                {profile?.recentActivity && profile.recentActivity.length > 0 ? (
                  profile.recentActivity.map((activity) => (
                    <div 
                      key={activity.id}
                      className="flex items-start gap-4 p-4 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                        {activity.type === 'bet_won' && <CheckCircleIcon className="w-5 h-5 text-green-400" />}
                        {activity.type === 'bet_lost' && <XCircleIcon className="w-5 h-5 text-red-400" />}
                        {activity.type === 'pool_created' && <SparklesIcon className="w-5 h-5 text-cyan-400" />}
                        {activity.type === 'bet_placed' && <UserIcon className="w-5 h-5 text-blue-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white">{activity.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </span>
                          {activity.amount && (
                            <span className="text-xs text-gray-400">
                              • {typeof activity.amount === 'string' && activity.amount.match(/^\d+$/)
                                  ? formatCompactCurrency(parseFloat(activity.amount) / 1e18) + ' STT'
                                  : activity.amount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-400">No recent activity</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


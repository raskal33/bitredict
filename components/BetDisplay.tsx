"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  BanknotesIcon, 
  UserIcon, 
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { 
  HandThumbUpIcon as ThumbUpSolid
} from '@heroicons/react/24/solid';

interface Bet {
  bet_id: number;
  pool_id: string;
  bettor_address: string;
  amount: string;
  is_for_outcome: boolean;
  transaction_hash: string;
  block_number: number;
  created_at: string;
  home_team?: string;
  away_team?: string;
  title?: string;
}

interface BetDisplayProps {
  poolId: string;
  className?: string;
}

export default function BetDisplay({ poolId, className = "" }: BetDisplayProps) {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalBets: 0,
    totalVolume: 0,
    yesBets: 0,
    noBets: 0,
    yesVolume: 0,
    noVolume: 0
  });

  const fetchBets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/pool-bets/${poolId}?limit=50&sortBy=created_at&sortOrder=desc`, {
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setBets(data.data.bets || []);
        
        // Calculate stats
        const totalBets = data.data.bets?.length || 0;
        const totalVolume = data.data.bets?.reduce((sum: number, bet: Bet) => sum + parseFloat(bet.amount), 0) || 0;
        const yesBets = data.data.bets?.filter((bet: Bet) => bet.is_for_outcome).length || 0;
        const noBets = data.data.bets?.filter((bet: Bet) => !bet.is_for_outcome).length || 0;
        const yesVolume = data.data.bets?.filter((bet: Bet) => bet.is_for_outcome).reduce((sum: number, bet: Bet) => sum + parseFloat(bet.amount), 0) || 0;
        const noVolume = data.data.bets?.filter((bet: Bet) => !bet.is_for_outcome).reduce((sum: number, bet: Bet) => sum + parseFloat(bet.amount), 0) || 0;
        
        setStats({
          totalBets,
          totalVolume,
          yesBets,
          noBets,
          yesVolume,
          noVolume
        });
      } else {
        throw new Error(data.error || 'Failed to fetch bets');
      }
    } catch (err) {
      console.error('Error fetching bets:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch bets');
    } finally {
      setLoading(false);
    }
  }, [poolId]);

  useEffect(() => {
    fetchBets();
    
    // Set up real-time updates every 10 seconds
    const interval = setInterval(fetchBets, 10000);
    return () => clearInterval(interval);
  }, [poolId, fetchBets]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    if (num >= 1000000000000000000) { // 1e18 (1 ETH/STT in wei)
      return `${(num / 1000000000000000000).toFixed(1)}`;
    } else if (num >= 1000000000000000) { // 1e15
      return `${(num / 1000000000000000).toFixed(1)}K`;
    } else if (num >= 1000000000000) { // 1e12
      return `${(num / 1000000000000).toFixed(1)}M`;
    } else if (num >= 1000000000) { // 1e9
      return `${(num / 1000000000).toFixed(1)}B`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toFixed(0);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getExplorerUrl = (txHash: string) => {
    // Assuming Somnia network - adjust as needed
    return `https://shannon-explorer.somnia.network/tx/${txHash}`;
  };

  if (loading) {
    return (
      <div className={`p-6 bg-gray-800/30 rounded-xl border border-gray-700/30 backdrop-blur-sm ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
          <span className="ml-3 text-gray-400">Loading bets...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 bg-red-500/10 rounded-xl border border-red-500/30 backdrop-blur-sm ${className}`}>
        <div className="text-center">
          <XCircleIcon className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-400">Failed to load bets: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Bet Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gradient-to-br from-gray-800/50 to-gray-700/50 rounded-xl border border-gray-600/30 backdrop-blur-sm shadow-lg">
        <div className="text-center group hover:scale-105 transition-transform">
          <div className="text-xl sm:text-2xl font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">
            {stats.totalBets}
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wider">Total Bets</div>
          <div className="w-full h-0.5 bg-cyan-500/20 rounded-full mt-2"></div>
        </div>
        
        <div className="text-center group hover:scale-105 transition-transform">
          <div className="text-xl sm:text-2xl font-bold text-green-400 mb-1 group-hover:text-green-300 transition-colors">
            {stats.yesBets}
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wider">YES Bets</div>
          <div className="w-full h-0.5 bg-green-500/20 rounded-full mt-2"></div>
        </div>
        
        <div className="text-center group hover:scale-105 transition-transform">
          <div className="text-xl sm:text-2xl font-bold text-blue-400 mb-1 group-hover:text-blue-300 transition-colors">
            {stats.noBets}
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wider">NO Bets</div>
          <div className="w-full h-0.5 bg-blue-500/20 rounded-full mt-2"></div>
        </div>
        
        <div className="text-center group hover:scale-105 transition-transform">
          <div className="text-xl sm:text-2xl font-bold text-yellow-400 mb-1 group-hover:text-yellow-300 transition-colors">
            {formatAmount(stats.totalVolume.toString())}
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wider">Total Volume</div>
          <div className="w-full h-0.5 bg-yellow-500/20 rounded-full mt-2"></div>
        </div>
      </div>

      {/* Volume Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/30">
          <div className="flex items-center gap-2 mb-2">
            <ArrowTrendingUpIcon className="w-5 h-5 text-green-400" />
            <span className="text-sm font-medium text-green-400">YES Volume</span>
          </div>
          <div className="text-2xl font-bold text-green-400">
            {formatAmount(stats.yesVolume.toString())}
          </div>
          <div className="text-xs text-gray-400">
            {stats.totalVolume > 0 ? ((stats.yesVolume / stats.totalVolume) * 100).toFixed(1) : 0}% of total
          </div>
        </div>
        
        <div className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/30">
          <div className="flex items-center gap-2 mb-2">
            <ArrowTrendingDownIcon className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-medium text-blue-400">NO Volume</span>
          </div>
          <div className="text-2xl font-bold text-blue-400">
            {formatAmount(stats.noVolume.toString())}
          </div>
          <div className="text-xs text-gray-400">
            {stats.totalVolume > 0 ? ((stats.noVolume / stats.totalVolume) * 100).toFixed(1) : 0}% of total
          </div>
        </div>
      </div>

      {/* Bet List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Recent Bets</h3>
          <div className="text-sm text-gray-400">
            {bets.length} bet{bets.length !== 1 ? 's' : ''}
          </div>
        </div>
        
        {bets.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <BanknotesIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No bets placed yet</p>
            <p className="text-sm">Be the first to place a bet!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bets.map((bet) => (
              <div
                key={bet.bet_id}
                className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/30 hover:border-gray-600/50 transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <div className="font-medium text-white">
                        {formatAddress(bet.bettor_address)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatTimeAgo(bet.created_at)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {bet.is_for_outcome ? (
                      <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                        <ThumbUpSolid className="w-3 h-3" />
                        YES
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                        💧
                        LP ADDED
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BanknotesIcon className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm text-gray-400">Amount:</span>
                    <span className="text-lg font-bold text-white">
                      {formatAmount(bet.amount)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <ClockIcon className="w-3 h-3" />
                    Block #{bet.block_number}
                  </div>
                </div>
                
                {/* Transaction Hash */}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-gray-500">Tx:</span>
                  <a
                    href={getExplorerUrl(bet.transaction_hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-cyan-400 hover:text-cyan-300 underline hover:no-underline transition-colors"
                  >
                    {bet.transaction_hash.slice(0, 6)}...{bet.transaction_hash.slice(-4)}
                  </a>
                </div>
                
                {bet.title && (
                  <div className="mt-2 text-xs text-gray-500 truncate">
                    {bet.title}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

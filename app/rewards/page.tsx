"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrophyIcon, 
  SparklesIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ClockIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import { FaChartLine, FaSearch } from 'react-icons/fa';
import PrizeClaimModal from '@/components/PrizeClaimModal';
import { toast } from '@/utils/toast';
import Button from '@/components/button';
import RecentBetsLane from '@/components/RecentBetsLane';
import AnimatedTitle from '@/components/AnimatedTitle';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getAPIUrl } from '@/config/api';

interface Reward {
  type: 'pool' | 'combo' | 'oddyssey';
  id: string | number;
  poolId?: number;
  comboPoolId?: number;
  cycleId?: number;
  slipId?: number;
  league?: string;
  category?: string;
  title?: string;
  predictedOutcome?: string;
  stakeAmount: number;
  claimableAmount: number;
  prizeAmount?: number;
  currency: string;
  settledAt?: string;
  claimed: boolean;
  txHash?: string;
  finalScore?: number;
  correctCount?: number;
  leaderboardRank?: number;
}

interface RewardsData {
  rewards: {
    pools: Reward[];
    combos: Reward[];
    oddyssey: Reward[];
    all: Reward[];
  };
  summary: {
    totalClaimable: number;
    poolCount: number;
    comboCount: number;
    oddysseyCount: number;
    totalCount: number;
  };
}

interface PlatformClaim {
  id: string;
  type: 'pool' | 'combo' | 'oddyssey';
  poolId: string;
  userAddress: string;
  amount: number;
  currency: string;
  claimedAt: string;
  txHash?: string;
  league?: string;
  category?: string;
  outcome?: string;
}

type FilterType = 'all' | 'pool' | 'combo' | 'oddyssey';

export default function RewardsPage() {
  const { address, isConnected } = useAccount();
  const [rewards, setRewards] = useState<RewardsData | null>(null);
  const [platformClaims, setPlatformClaims] = useState<PlatformClaim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  
  const fetchRewards = useCallback(async () => {
    if (!address) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(getAPIUrl(`/api/rewards/${address}`));
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRewards(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching rewards:', error);
      toast.error('Failed to load rewards');
    } finally {
      setIsLoading(false);
    }
  }, [address]);
  
  const fetchPlatformClaims = useCallback(async () => {
    try {
      setIsLoadingEvents(true);
      const response = await fetch(getAPIUrl('/api/rewards/events/all?limit=100'));
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPlatformClaims(data.data.claims);
        }
      }
    } catch (error) {
      console.error('Error fetching platform claims:', error);
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);
  
  // Initial fetch
  useEffect(() => {
    if (isConnected && address) {
      fetchRewards();
    }
    fetchPlatformClaims();
  }, [isConnected, address, fetchRewards, fetchPlatformClaims]);
  
  // Poll for updates every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPlatformClaims();
      if (address && isConnected) {
        fetchRewards();
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [address, isConnected, fetchRewards, fetchPlatformClaims]);
  
  const filteredRewards = rewards?.rewards.all.filter(reward => {
    if (filter !== 'all' && reward.type !== filter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        reward.league?.toLowerCase().includes(search) ||
        reward.category?.toLowerCase().includes(search) ||
        reward.title?.toLowerCase().includes(search) ||
        reward.predictedOutcome?.toLowerCase().includes(search)
      );
    }
    return true;
  }) || [];
  
  const filteredClaims = platformClaims.filter(claim => {
    if (filter !== 'all' && claim.type !== filter) return false;
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        claim.userAddress.toLowerCase().includes(search) ||
        claim.league?.toLowerCase().includes(search) ||
        claim.category?.toLowerCase().includes(search) ||
        claim.outcome?.toLowerCase().includes(search)
      );
    }
    return true;
  });
  
  // Normalize token amounts - handle both wei-scale and already-normalized values
  const normalizeAmount = (amount: number): number => {
    // If amount looks like wei (> 1e15), normalize it
    if (amount > 1e15) {
      return amount / 1e18;
    }
    return amount;
  };

  const formatAmount = (amount: number, currency: string) => {
    const normalized = normalizeAmount(amount);
    if (normalized >= 1000000) {
      return `${(normalized / 1000000).toFixed(2)}M ${currency}`;
    } else if (normalized >= 1000) {
      return `${(normalized / 1000).toFixed(2)}K ${currency}`;
    }
    return `${normalized.toFixed(4)} ${currency}`;
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  if (!isConnected || !address) {
    return (
      <div className="min-h-screen bg-gradient-main text-white flex items-center justify-center">
        <div className="text-center glass-card rounded-2xl p-8">
          <TrophyIcon className="h-16 w-16 text-accent mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-primary mb-2">Connect Your Wallet</h2>
          <p className="text-text-secondary">Please connect your wallet to view your rewards</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-main text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative space-y-4 max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <AnimatedTitle className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 flex items-center gap-2 sm:gap-3">
              <TrophyIcon className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
              Rewards
            </AnimatedTitle>
            <p className="text-xs sm:text-sm text-text-secondary">
              Real-time feed of all claimed rewards across the platform
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsClaimModalOpen(true)}
              variant="primary"
              size="sm"
              className="flex items-center gap-2"
            >
              <TrophyIcon className="h-4 w-4" />
              Claim Rewards
            </Button>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>{rewards?.summary.totalCount || 0} claimable</span>
            </div>
          </div>
        </div>

        {/* Recent Bets Lane */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-4"
        >
          <RecentBetsLane className="!p-3" />
        </motion.div>

        {/* Summary Cards */}
        {rewards && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4"
          >
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CurrencyDollarIcon className="h-5 w-5 text-green-400" />
                <span className="text-text-muted text-xs">Total Claimable</span>
              </div>
              <div className="text-xl font-bold text-primary">
                {formatAmount(rewards.summary.totalClaimable, 'BITR')}
              </div>
            </div>
            
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrophyIcon className="h-5 w-5 text-accent" />
                <span className="text-text-muted text-xs">Pool Rewards</span>
              </div>
              <div className="text-xl font-bold text-primary">
                {rewards.summary.poolCount}
              </div>
            </div>
            
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <SparklesIcon className="h-5 w-5 text-secondary" />
                <span className="text-text-muted text-xs">Combo Rewards</span>
              </div>
              <div className="text-xl font-bold text-primary">
                {rewards.summary.comboCount}
              </div>
            </div>
            
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrophyIcon className="h-5 w-5 text-accent" />
                <span className="text-text-muted text-xs">Oddyssey Prizes</span>
              </div>
              <div className="text-xl font-bold text-primary">
                {rewards.summary.oddysseyCount}
              </div>
            </div>
          </motion.div>
        )}

        {/* Filters & Search */}
        <div className="glass-card rounded-xl p-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
              {(['all', 'pool', 'combo', 'oddyssey'] as FilterType[]).map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-all text-xs whitespace-nowrap ${
                    filter === filterType
                      ? "bg-gradient-primary text-black shadow-md shadow-cyan-500/20"
                      : "glass-card text-text-secondary hover:text-primary hover:bg-white/10"
                  }`}
                >
                  {filterType === 'all' && <FaChartLine className="h-3 w-3" />}
                  {filterType === 'pool' && <TrophyIcon className="h-3 w-3" />}
                  {filterType === 'combo' && <SparklesIcon className="h-3 w-3" />}
                  {filterType === 'oddyssey' && <FireIcon className="h-3 w-3" />}
                  <span className="capitalize">{filterType}</span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex-1 sm:flex-initial sm:w-48 min-w-[120px]">
              <FaSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-text-muted h-3.5 w-3.5" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 glass-card border border-border-input rounded-lg text-primary text-xs placeholder-text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30"
              />
            </div>

            {/* Toggle My Rewards */}
            <button
              onClick={() => setShowEvents(!showEvents)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all text-xs ${
                showEvents
                  ? "bg-gradient-secondary text-white"
                  : "glass-card text-text-secondary hover:text-primary hover:bg-white/10"
              }`}
            >
              {showEvents ? 'Hide' : 'Show'} My Rewards
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Rewards Feed - All Platform Claims */}
          <div className="lg:col-span-3">
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-accent" />
                  <h2 className="text-lg font-bold text-primary">
                    Rewards Feed
                  </h2>
                </div>
                <span className="text-xs text-text-muted glass-card px-2 py-0.5 rounded">
                  {isLoadingEvents ? "..." : filteredClaims.length}
                </span>
              </div>
              
              {isLoadingEvents ? (
                <div className="text-center py-16">
                  <LoadingSpinner size="lg" />
                  <p className="text-text-muted text-sm mt-4">Loading rewards feed...</p>
                </div>
              ) : filteredClaims.length === 0 ? (
                <div className="text-center py-16">
                  <TrophyIcon className="h-10 w-10 text-text-muted mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-primary mb-2">No Claims Yet</h3>
                  <p className="text-text-muted text-sm">
                    {searchTerm ? 'No claims match your search.' : 'Platform claims will appear here in real-time'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  <AnimatePresence>
                    {filteredClaims.map((claim) => (
                      <motion.div
                        key={claim.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="glass-card border border-border-card rounded-lg p-4 hover:border-accent/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              {claim.type === 'pool' && <TrophyIcon className="h-4 w-4 text-accent flex-shrink-0" />}
                              {claim.type === 'combo' && <SparklesIcon className="h-4 w-4 text-secondary flex-shrink-0" />}
                              {claim.type === 'oddyssey' && <FireIcon className="h-4 w-4 text-accent flex-shrink-0" />}
                              <h3 className="text-sm font-bold text-primary truncate">
                                {claim.league || claim.category || 'Reward Claim'}
                              </h3>
                              <CheckCircleIcon className="h-4 w-4 text-green-400 flex-shrink-0" />
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                              <div>
                                <span className="text-text-muted">User:</span>
                                <div className="font-semibold text-primary font-mono">
                                  {formatAddress(claim.userAddress)}
                                </div>
                              </div>
                              <div>
                                <span className="text-text-muted">Amount:</span>
                                <div className="font-semibold text-green-400">
                                  {formatAmount(claim.amount, claim.currency)}
                                </div>
                              </div>
                              <div>
                                <span className="text-text-muted">Type:</span>
                                <div className="font-semibold text-primary capitalize">
                                  {claim.type}
                                </div>
                              </div>
                              <div>
                                <span className="text-text-muted">Time:</span>
                                <div className="font-semibold text-primary text-[10px]">
                                  {formatDate(claim.claimedAt)}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="ml-4 flex-shrink-0">
                            {claim.txHash ? (
                              <a
                                href={`https://explorer.somnia.network/tx/${claim.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-accent/10 border border-accent/30 rounded-lg hover:bg-accent/20 transition-colors text-xs text-accent"
                              >
                                View TX
                              </a>
                            ) : (
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg">
                                <CheckCircleIcon className="h-4 w-4 text-green-400" />
                                <span className="text-green-400 font-medium text-xs">Claimed</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-3">
            {/* Quick Stats */}
            <div className="glass-card rounded-xl p-4">
              <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                <ChartBarIcon className="h-4 w-4 text-accent" />
                Summary
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-text-muted">Total Claimable</span>
                  <span className="text-primary font-semibold">
                    {rewards ? formatAmount(rewards.summary.totalClaimable, 'BITR') : '0 BITR'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-muted">Pool Rewards</span>
                  <span className="text-primary font-semibold">{rewards?.summary.poolCount || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-muted">Combo Rewards</span>
                  <span className="text-primary font-semibold">{rewards?.summary.comboCount || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-muted">Oddyssey Prizes</span>
                  <span className="text-primary font-semibold">{rewards?.summary.oddysseyCount || 0}</span>
                </div>
              </div>
            </div>

            {/* Claim Button */}
            <div className="glass-card rounded-xl p-4">
              <Button
                onClick={() => setIsClaimModalOpen(true)}
                variant="primary"
                fullWidth
                className="flex items-center justify-center gap-2"
              >
                <TrophyIcon className="h-4 w-4" />
                Claim All Rewards
              </Button>
            </div>
          </div>
        </div>

        {/* My Rewards Section */}
        {showEvents && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-xl p-4 mt-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                <TrophyIcon className="h-5 w-5 text-accent" />
                My Claimable Rewards
              </h2>
              <span className="text-xs text-text-muted glass-card px-2 py-0.5 rounded">
                {isLoading ? "..." : filteredRewards.length}
              </span>
            </div>
            
            {isLoading ? (
              <div className="text-center py-16">
                <LoadingSpinner size="lg" />
                <p className="text-text-muted text-sm mt-4">Loading your rewards...</p>
              </div>
            ) : filteredRewards.length === 0 ? (
              <div className="text-center py-16">
                <TrophyIcon className="h-10 w-10 text-text-muted mx-auto mb-3" />
                <h3 className="text-lg font-bold text-primary mb-2">No Claimable Rewards</h3>
                <p className="text-text-muted text-sm">Start betting to earn rewards!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                <AnimatePresence>
                  {filteredRewards.map((reward) => (
                    <motion.div
                      key={`${reward.type}-${reward.id}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="glass-card border border-border-card rounded-lg p-4 hover:border-accent/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {reward.type === 'pool' && <TrophyIcon className="h-4 w-4 text-accent flex-shrink-0" />}
                            {reward.type === 'combo' && <SparklesIcon className="h-4 w-4 text-secondary flex-shrink-0" />}
                            {reward.type === 'oddyssey' && <FireIcon className="h-4 w-4 text-accent flex-shrink-0" />}
                            <h3 className="text-sm font-bold text-primary truncate">
                              {reward.type === 'pool' && `${reward.league} - ${reward.category}`}
                              {reward.type === 'combo' && reward.title}
                              {reward.type === 'oddyssey' && `Cycle ${reward.cycleId} - Slip ${reward.slipId}`}
                            </h3>
                            {reward.claimed && <CheckCircleIcon className="h-4 w-4 text-green-400 flex-shrink-0" />}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                            <div>
                              <span className="text-text-muted">Stake:</span>
                              <div className="font-semibold text-primary">
                                {formatAmount(reward.stakeAmount, reward.currency)}
                              </div>
                            </div>
                            <div>
                              <span className="text-text-muted">Reward:</span>
                              <div className="font-semibold text-green-400">
                                {formatAmount(reward.claimableAmount || reward.prizeAmount || 0, reward.currency)}
                              </div>
                            </div>
                            {reward.type === 'oddyssey' && (
                              <>
                                <div>
                                  <span className="text-text-muted">Correct:</span>
                                  <div className="font-semibold text-primary">
                                    {reward.correctCount}/10
                                  </div>
                                </div>
                                <div>
                                  <span className="text-text-muted">Rank:</span>
                                  <div className="font-semibold text-primary">
                                    #{reward.leaderboardRank}
                                  </div>
                                </div>
                              </>
                            )}
                            {reward.settledAt && (
                              <div>
                                <span className="text-text-muted">Settled:</span>
                                <div className="font-semibold text-primary text-[10px]">
                                  {formatDate(reward.settledAt)}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="ml-4 flex-shrink-0">
                          {reward.claimed ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg">
                              <CheckCircleIcon className="h-4 w-4 text-green-400" />
                              <span className="text-green-400 font-medium text-xs">Claimed</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => setIsClaimModalOpen(true)}
                              className="px-4 py-1.5 bg-gradient-primary text-black font-semibold rounded-lg hover:opacity-90 transition-opacity text-xs"
                            >
                              Claim
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

        {/* Claim Modal */}
        <PrizeClaimModal
          isOpen={isClaimModalOpen}
          onClose={() => setIsClaimModalOpen(false)}
          userAddress={address}
        />
      </motion.div>
    </div>
  );
}


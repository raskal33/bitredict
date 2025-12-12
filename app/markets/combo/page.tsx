"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import AnimatedTitle from "@/components/AnimatedTitle";
import { useComboPools, ComboPool, ComboCondition } from "@/hooks/useComboPools";
import { 
  CubeIcon,
  SparklesIcon,
  PlusIcon,
  ChartBarIcon,
  TrophyIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  BoltIcon
} from "@heroicons/react/24/outline";

// Types for the combo pools list
interface ComboPoolListItem extends ComboPool {
  conditions: ComboCondition[];
}

export default function ComboMarketsPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { getComboPool, getComboPoolConditions, getComboPoolCount, placeComboBet, isLoading: hookLoading } = useComboPools();
  
  const [comboPools, setComboPools] = useState<ComboPoolListItem[]>([]);
  const [selectedPool, setSelectedPool] = useState<ComboPoolListItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [betAmount, setBetAmount] = useState('');
  const [showBetModal, setShowBetModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'settled'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'volume' | 'odds'>('newest');

  // Fetch combo pools
  const fetchComboPools = useCallback(async () => {
    setIsLoading(true);
    try {
      const count = await getComboPoolCount();
      console.log(`📊 Found ${count} combo pools`);
      
      const pools: ComboPoolListItem[] = [];
      
      // Fetch last 20 pools (or all if less)
      const startId = Math.max(1, count - 19);
      for (let i = count; i >= startId; i--) {
        try {
          const pool = await getComboPool(i);
          if (pool) {
            const conditions = await getComboPoolConditions(i);
            pools.push({ ...pool, conditions });
          }
        } catch (err) {
          console.warn(`Failed to fetch combo pool ${i}:`, err);
        }
      }
      
      setComboPools(pools);
    } catch (error) {
      console.error('Error fetching combo pools:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getComboPool, getComboPoolConditions, getComboPoolCount]);

  useEffect(() => {
    fetchComboPools();
  }, [fetchComboPools]);

  // Filter and sort pools
  const filteredPools = comboPools
    .filter(pool => {
      if (filter === 'active') return !pool.settled;
      if (filter === 'settled') return pool.settled;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'volume') return Number(b.totalCreatorSideStake - a.totalCreatorSideStake);
      if (sortBy === 'odds') return b.combinedOdds - a.combinedOdds;
      return b.id - a.id; // newest
    });

  const handleCreateMarket = () => {
    router.push("/create-prediction?type=combo");
  };

  const handlePoolClick = (pool: ComboPoolListItem) => {
    setSelectedPool(pool);
  };

  const handlePlaceBet = async () => {
    if (!selectedPool || !betAmount || !address) return;
    
    try {
      const amount = BigInt(parseFloat(betAmount) * 1e18);
      await placeComboBet(selectedPool.id, amount, selectedPool.useBitr);
      setShowBetModal(false);
      setBetAmount('');
      fetchComboPools(); // Refresh
    } catch (error) {
      console.error('Error placing bet:', error);
    }
  };

  const formatOdds = (odds: number) => {
    return (odds / 100).toFixed(2);
  };

  const getTimeRemaining = (timestamp: number) => {
    const now = Date.now() / 1000;
    const diff = timestamp - now;
    
    if (diff <= 0) return 'Ended';
    
    const hours = Math.floor(diff / 3600);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    return `${hours}h`;
  };

  return (
    <div className="min-h-screen bg-gradient-main">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <AnimatedTitle 
            size="md"
            leftIcon={CubeIcon}
            rightIcon={SparklesIcon}
          >
            Combo Markets
          </AnimatedTitle>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-gray-300 mt-4 max-w-3xl mx-auto"
          >
            Multi-event prediction markets with multiplied odds. 
            Combine 2-10 outcomes for parlay-style betting with amplified returns.
          </motion.p>
        </motion.div>

        {/* Stats Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-primary">{comboPools.length}</div>
            <div className="text-sm text-gray-400">Total Combos</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-green-400">
              {comboPools.filter(p => !p.settled).length}
            </div>
            <div className="text-sm text-gray-400">Active Markets</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {comboPools.length > 0 ? Math.max(...comboPools.map(p => p.combinedOdds / 100)).toFixed(1) : 0}x
            </div>
            <div className="text-sm text-gray-400">Max Odds</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">
              {formatEther(comboPools.reduce((acc, p) => acc + p.totalCreatorSideStake, 0n)).slice(0, 6)}
            </div>
            <div className="text-sm text-gray-400">Total Volume</div>
          </div>
        </motion.div>

        {/* Action Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap items-center justify-between gap-4 mb-8"
        >
          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="flex rounded-xl overflow-hidden border border-slate-700/50 bg-slate-800/30">
              {(['all', 'active', 'settled'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 text-sm font-medium transition-all ${
                    filter === f 
                      ? 'bg-primary text-black' 
                      : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="volume">Highest Volume</option>
              <option value="odds">Highest Odds</option>
            </select>
          </div>

          {/* Create Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCreateMarket}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 transition-all"
          >
            <PlusIcon className="w-5 h-5" />
            Create Combo
          </motion.button>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pools List */}
          <div className="lg:col-span-2 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            ) : filteredPools.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card p-12 text-center"
              >
                <CubeIcon className="w-16 h-16 mx-auto text-gray-500 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Combo Pools Yet</h3>
                <p className="text-gray-400 mb-6">Be the first to create a multi-condition prediction market!</p>
                <button
                  onClick={handleCreateMarket}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl"
                >
                  Create First Combo
                </button>
              </motion.div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredPools.map((pool, index) => (
                  <motion.div
                    key={pool.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handlePoolClick(pool)}
                    className={`
                      glass-card p-6 cursor-pointer transition-all duration-300
                      hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10
                      ${selectedPool?.id === pool.id ? 'border-primary shadow-lg shadow-primary/20' : 'border-slate-700/50'}
                    `}
                  >
                    {/* Pool Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-12 h-12 rounded-xl flex items-center justify-center
                          ${pool.settled 
                            ? pool.creatorSideWon ? 'bg-red-500/20' : 'bg-green-500/20'
                            : 'bg-gradient-to-br from-purple-500/20 to-pink-500/20'
                          }
                        `}>
                          <CubeIcon className={`w-6 h-6 ${
                            pool.settled 
                              ? pool.creatorSideWon ? 'text-red-400' : 'text-green-400'
                              : 'text-purple-400'
                          }`} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">Combo #{pool.id}</h3>
                          <p className="text-sm text-gray-400">
                            {pool.conditionCount} conditions • by {pool.creator.slice(0, 6)}...{pool.creator.slice(-4)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Status Badge */}
                      <div className={`
                        px-3 py-1 rounded-full text-xs font-bold
                        ${pool.settled
                          ? pool.creatorSideWon 
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }
                      `}>
                        {pool.settled 
                          ? pool.creatorSideWon ? 'CREATOR WON' : 'BETTORS WON'
                          : 'ACTIVE'
                        }
                      </div>
                    </div>

                    {/* Conditions Preview */}
                    <div className="mb-4 space-y-2">
                      {pool.conditions.slice(0, 3).map((condition, idx) => (
                        <div 
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-800/30 border border-slate-700/30"
                        >
                          <div className="flex items-center gap-2">
                            {condition.resolved ? (
                              condition.actualOutcome === condition.expectedOutcome ? (
                                <CheckCircleIcon className="w-4 h-4 text-green-400" />
                              ) : (
                                <XCircleIcon className="w-4 h-4 text-red-400" />
                              )
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-gray-500" />
                            )}
                            <span className="text-sm text-gray-300 truncate max-w-[200px]">
                              {condition.description || condition.expectedOutcome}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-yellow-400">
                            {condition.odds.toFixed(2)}x
                          </span>
                        </div>
                      ))}
                      {pool.conditions.length > 3 && (
                        <div className="text-center text-sm text-gray-500">
                          +{pool.conditions.length - 3} more conditions
                        </div>
                      )}
                    </div>

                    {/* Pool Stats */}
                    <div className="grid grid-cols-4 gap-3 pt-4 border-t border-slate-700/30">
                      <div className="text-center">
                        <div className="text-lg font-bold text-yellow-400">
                          {formatOdds(pool.combinedOdds)}x
                        </div>
                        <div className="text-xs text-gray-500">Combined Odds</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">
                          {formatEther(pool.totalCreatorSideStake).slice(0, 5)}
                        </div>
                        <div className="text-xs text-gray-500">{pool.useBitr ? 'BITR' : 'STT'}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-400">
                          {pool.conditionCount}
                        </div>
                        <div className="text-xs text-gray-500">Events</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-lg font-bold ${
                          pool.settled ? 'text-gray-400' : 'text-green-400'
                        }`}>
                          {pool.settled ? 'Ended' : getTimeRemaining(pool.latestEventEnd)}
                        </div>
                        <div className="text-xs text-gray-500">Time Left</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Selected Pool Details or Info */}
              {selectedPool ? (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-card p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <BoltIcon className="w-5 h-5 text-yellow-400" />
                    <h3 className="text-xl font-bold text-white">Combo #{selectedPool.id}</h3>
                  </div>

                  {/* All Conditions */}
                  <div className="space-y-2 mb-6">
                    <h4 className="text-sm font-medium text-gray-400">All Conditions ({selectedPool.conditionCount})</h4>
                    {selectedPool.conditions.map((condition, idx) => (
                      <div 
                        key={idx}
                        className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-white font-medium">
                            {condition.description || `Condition ${idx + 1}`}
                          </span>
                          <span className="text-sm font-bold text-yellow-400">
                            {condition.odds.toFixed(2)}x
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>Expected: {condition.expectedOutcome}</span>
                          {condition.resolved && (
                            <span className={condition.actualOutcome === condition.expectedOutcome ? 'text-green-400' : 'text-red-400'}>
                              ({condition.actualOutcome === condition.expectedOutcome ? '✓ Correct' : '✗ Wrong'})
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pool Details */}
                  <div className="space-y-3 mb-6 p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Combined Odds</span>
                      <span className="font-bold text-yellow-400">{formatOdds(selectedPool.combinedOdds)}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Creator Stake</span>
                      <span className="font-bold text-white">
                        {formatEther(selectedPool.creatorStake).slice(0, 8)} {selectedPool.useBitr ? 'BITR' : 'STT'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Volume</span>
                      <span className="font-bold text-white">
                        {formatEther(selectedPool.totalCreatorSideStake + selectedPool.totalBettorStake).slice(0, 8)} {selectedPool.useBitr ? 'BITR' : 'STT'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status</span>
                      <span className={`font-bold ${selectedPool.settled ? 'text-gray-400' : 'text-green-400'}`}>
                        {selectedPool.settled ? 'Settled' : 'Active'}
                      </span>
                    </div>
                  </div>

                  {/* Bet Button */}
                  {!selectedPool.settled && (
                    <button
                      onClick={() => setShowBetModal(true)}
                      disabled={!isConnected}
                      className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CurrencyDollarIcon className="w-5 h-5" />
                      Place Bet
                    </button>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-card p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <CubeIcon className="w-5 h-5 text-purple-400" />
                    <h3 className="text-xl font-bold text-white">How Combos Work</h3>
                  </div>
                  
                  <div className="space-y-4 text-gray-300">
                    <p className="text-sm">
                      Combo pools combine multiple predictions into one bet with multiplied odds.
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30">
                        <ChartBarIcon className="w-5 h-5 text-blue-400 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-white text-sm">Multiplied Odds</h4>
                          <p className="text-xs text-gray-400">Individual odds multiply together for higher payouts</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30">
                        <TrophyIcon className="w-5 h-5 text-yellow-400 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-white text-sm">All or Nothing</h4>
                          <p className="text-xs text-gray-400">All predictions must be correct to win</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30">
                        <CubeIcon className="w-5 h-5 text-purple-400 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-white text-sm">Multi-Event</h4>
                          <p className="text-xs text-gray-400">Combine 2-10 different market outcomes</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Example */}
                    <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                      <h4 className="font-semibold text-white mb-2 text-sm">Example:</h4>
                      <div className="space-y-1 text-xs">
                        <p className="text-green-400">Event A: 2.0x odds</p>
                        <p className="text-blue-400">Event B: 1.5x odds</p>
                        <p className="text-purple-400">Event C: 3.0x odds</p>
                        <div className="border-t border-purple-500/30 mt-2 pt-2">
                          <p className="text-yellow-400 font-bold">
                            Combined: 9.0x odds (2.0 × 1.5 × 3.0)
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleCreateMarket}
                      className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2"
                    >
                      <PlusIcon className="w-5 h-5" />
                      Create Combo Market
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Quick Stats */}
              <div className="glass-card p-4">
                <h4 className="text-sm font-medium text-gray-400 mb-3">Platform Stats</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total Combos</span>
                    <span className="text-white font-medium">{comboPools.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Active Markets</span>
                    <span className="text-green-400 font-medium">{comboPools.filter(p => !p.settled).length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Settled</span>
                    <span className="text-gray-400 font-medium">{comboPools.filter(p => p.settled).length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bet Modal */}
        <AnimatePresence>
          {showBetModal && selectedPool && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowBetModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-md glass-card p-6"
              >
                <h3 className="text-xl font-bold text-white mb-4">Place Combo Bet</h3>
                
                <div className="mb-4 p-4 rounded-lg bg-slate-800/50">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Combo #{selectedPool.id}</span>
                    <span className="text-yellow-400 font-bold">{formatOdds(selectedPool.combinedOdds)}x odds</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {selectedPool.conditionCount} conditions must all be correct to win
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-2">Bet Amount ({selectedPool.useBitr ? 'BITR' : 'STT'})</label>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={e => setBetAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white focus:outline-none focus:border-primary"
                  />
                </div>

                {betAmount && parseFloat(betAmount) > 0 && (
                  <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Potential Win</span>
                      <span className="text-green-400 font-bold">
                        {(parseFloat(betAmount) * (selectedPool.combinedOdds / 100)).toFixed(2)} {selectedPool.useBitr ? 'BITR' : 'STT'}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowBetModal(false)}
                    className="flex-1 py-3 px-4 rounded-xl bg-slate-700/50 text-white font-medium hover:bg-slate-600/50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePlaceBet}
                    disabled={!betAmount || parseFloat(betAmount) <= 0 || hookLoading}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {hookLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    ) : (
                      <>
                        <CheckCircleIcon className="w-5 h-5" />
                        Confirm Bet
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

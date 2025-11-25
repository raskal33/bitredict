"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon,
  TrophyIcon,
  CheckCircleIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import Button from './button';
import { useNewClaimService, type OdysseyClaimablePosition } from '@/services/newClaimService';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import { getAPIUrl } from '@/config/api';
import LoadingSpinner from './LoadingSpinner';

interface PrizeClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  userAddress?: string;
}

interface PoolClaimablePosition {
  poolId: number;
  league?: string;
  category?: string;
  predictedOutcome?: string;
  claimableAmount: number;
  stakeAmount: number;
  currency: string;
  claimed: boolean;
  settledAt?: string;
  txHash?: string;
}

type PrizeTab = 'all' | 'pool' | 'oddyssey';

export default function PrizeClaimModal({ isOpen, onClose, userAddress }: PrizeClaimModalProps) {
  const [activeTab, setActiveTab] = useState<PrizeTab>('all');
  const [poolPositions, setPoolPositions] = useState<PoolClaimablePosition[]>([]);
  const [odysseyPositions, setOdysseyPositions] = useState<OdysseyClaimablePosition[]>([]);
  const [selectedPoolPositions, setSelectedPoolPositions] = useState<Set<number>>(new Set());
  const [selectedOdysseyPositions, setSelectedOdysseyPositions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimProgress, setClaimProgress] = useState({ completed: 0, total: 0 });
  const [filter, setFilter] = useState<'all' | 'unclaimed' | 'claimed'>('unclaimed');
  
  // ✅ FIX: Use refs to prevent infinite loops and ensure stable state
  const isLoadingRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const isMountedRef = useRef(true);
  
  const {
    claimOdysseyPrize,
    batchClaimOdysseyPrizes,
    claimPoolPrize,
    isConnected: isNewConnected
  } = useNewClaimService();
  
  const { connectWallet } = useWalletConnection();

  const loadPositions = useCallback(async () => {
    // ✅ FIX: Prevent multiple simultaneous loads
    if (!userAddress || isLoadingRef.current || !isMountedRef.current) {
      return;
    }
    
    // ✅ FIX: Ensure we're loading for the correct address
    const currentAddress = userAddress.toLowerCase();
    console.log(`[PrizeClaimModal] Loading positions for address: ${currentAddress}`);
    
    isLoadingRef.current = true;
    setIsLoading(true);
    
    try {
      // Load pool prizes from rewards API - using the current userAddress
      const rewardsResponse = await fetch(getAPIUrl(`/api/rewards/${currentAddress}`));
      if (rewardsResponse.ok) {
        const rewardsData = await rewardsResponse.json();
        if (rewardsData.success && rewardsData.data) {
          const pools = rewardsData.data.rewards?.pools || [];
          console.log(`[PrizeClaimModal] Loaded ${pools.length} pool positions for ${currentAddress}`);
          
          setPoolPositions(pools.map((p: PoolClaimablePosition & { poolId: number; claimed?: boolean; claimableAmount?: number; stakeAmount?: number; currency?: string; settledAt?: string; txHash?: string }) => ({
            poolId: p.poolId,
            league: p.league,
            category: p.category,
            predictedOutcome: p.predictedOutcome,
            claimableAmount: p.claimableAmount || 0,
            stakeAmount: p.stakeAmount || 0,
            currency: p.currency || 'STT',
            claimed: p.claimed || false,
            settledAt: p.settledAt,
            txHash: p.txHash
          })));
          
          // Auto-select unclaimed pool positions
          const unclaimedPools = pools
            .filter((p: PoolClaimablePosition & { claimed?: boolean; claimableAmount?: number }) => !p.claimed && (p.claimableAmount || 0) > 0)
            .map((p: PoolClaimablePosition & { poolId: number }) => p.poolId);
          setSelectedPoolPositions(new Set(unclaimedPools));
        } else {
          console.warn(`[PrizeClaimModal] No pool data returned for ${currentAddress}`);
          setPoolPositions([]);
          setSelectedPoolPositions(new Set());
        }
      } else {
        console.error(`[PrizeClaimModal] Failed to fetch rewards for ${currentAddress}:`, rewardsResponse.status);
        setPoolPositions([]);
        setSelectedPoolPositions(new Set());
      }
      
      // Load Odyssey positions - use userAddress prop (not connected wallet)
      try {
        const odysseyResponse = await fetch(getAPIUrl(`/api/claim-oddyssey/user/${currentAddress}/claimable`));
        if (odysseyResponse.ok) {
          const odysseyData = await odysseyResponse.json();
          const odysseyPrizes = odysseyData.claimablePrizes || [];
          console.log(`[PrizeClaimModal] Loaded ${odysseyPrizes.length} odyssey positions for ${currentAddress}`);
          
          if (isMountedRef.current) {
            setOdysseyPositions(odysseyPrizes.map((p: any) => ({
              cycleId: p.cycleId,
              slipId: p.slipId,
              userAddress: currentAddress,
              correctCount: p.correctCount,
              prizeAmount: p.prizeAmount?.toString() || '0',
              claimed: p.already_claimed || false,
              claimStatus: p.canClaim ? 'eligible' : 'not_eligible',
              placedAt: p.placedAt ? new Date(p.placedAt) : new Date(),
              evaluatedAt: p.evaluatedAt ? new Date(p.evaluatedAt) : undefined
            })));
            
            // Auto-select unclaimed winning Odyssey positions
            const unclaimedOdysseyWinning = odysseyPrizes
              .filter((p: any) => !p.already_claimed && p.canClaim)
              .map((p: any) => `${p.cycleId}-${p.slipId}`);
            setSelectedOdysseyPositions(new Set(unclaimedOdysseyWinning));
          }
        } else {
          console.warn(`[PrizeClaimModal] Failed to fetch odyssey prizes for ${currentAddress}:`, odysseyResponse.status);
          if (isMountedRef.current) {
            setOdysseyPositions([]);
            setSelectedOdysseyPositions(new Set());
          }
        }
      } catch (odysseyError) {
        console.error('[PrizeClaimModal] Error loading odyssey positions:', odysseyError);
        if (isMountedRef.current) {
          setOdysseyPositions([]);
          setSelectedOdysseyPositions(new Set());
        }
      }
      
      hasLoadedRef.current = true;
      
    } catch (error) {
      console.error('[PrizeClaimModal] Error loading positions:', error);
      if (isMountedRef.current) {
        toast.error('Failed to load claimable positions');
      }
      hasLoadedRef.current = false;
      setPoolPositions([]);
      setOdysseyPositions([]);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        isLoadingRef.current = false;
      }
    }
  }, [userAddress]); // Removed getAllClaimableOdysseyPrizes dependency since we're calling API directly

  // Track previous userAddress to detect changes
  const previousUserAddressRef = useRef<string | undefined>(userAddress);

  // ✅ FIX: Load claimable positions when modal opens or userAddress changes
  useEffect(() => {
    // Reset loaded state if userAddress changed
    if (previousUserAddressRef.current !== userAddress) {
      hasLoadedRef.current = false;
      previousUserAddressRef.current = userAddress;
    }

    if (isOpen && userAddress && !hasLoadedRef.current && !isLoadingRef.current) {
      loadPositions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, userAddress]); // loadPositions is stable via useCallback, but we guard with refs

  // ✅ FIX: Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Reset refs and state when modal closes
      hasLoadedRef.current = false;
      isLoadingRef.current = false;
      previousUserAddressRef.current = undefined;
      setPoolPositions([]);
      setOdysseyPositions([]);
      setSelectedPoolPositions(new Set());
      setSelectedOdysseyPositions(new Set());
      setIsLoading(false);
      setIsClaiming(false);
      setClaimProgress({ completed: 0, total: 0 });
      setActiveTab('all');
      setFilter('unclaimed');
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleClaimPoolSingle = async (poolId: number) => {
    if (!isNewConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    setIsClaiming(true);
    try {
      const result = await claimPoolPrize(poolId);

      if (result.success) {
        toast.success(`Pool prize claimed successfully! 🎉`);
        
        // Update the position as claimed
        setPoolPositions(prev => prev.map(p => 
          p.poolId === poolId
            ? { ...p, claimed: true }
            : p
        ));
        
        // Remove from selected positions
        setSelectedPoolPositions(prev => {
          const newSet = new Set(prev);
          newSet.delete(poolId);
          return newSet;
        });
        
      } else {
        toast.error(result.error || 'Failed to claim pool prize');
      }
    } catch (error) {
      console.error('Pool claim error:', error);
      toast.error('Failed to claim pool prize');
    } finally {
      setIsClaiming(false);
    }
  };

  const handleClaimOdysseySingle = async (position: OdysseyClaimablePosition) => {
    if (!isNewConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    setIsClaiming(true);
    try {
      const result = await claimOdysseyPrize(position.cycleId, position.slipId);

      if (result.success) {
        toast.success(`Odyssey prize claimed successfully! 🎉`);
        
        // Update the position as claimed
        setOdysseyPositions(prev => prev.map(p => 
          p.cycleId === position.cycleId && p.slipId === position.slipId
            ? { ...p, claimed: true }
            : p
        ));
        
        // Remove from selected positions
        setSelectedOdysseyPositions(prev => {
          const newSet = new Set(prev);
          newSet.delete(`${position.cycleId}-${position.slipId}`);
          return newSet;
        });
        
      } else {
        toast.error(result.error || 'Failed to claim Odyssey prize');
      }
    } catch (error) {
      console.error('Odyssey claim error:', error);
      toast.error('Failed to claim Odyssey prize');
    } finally {
      setIsClaiming(false);
    }
  };

  const handleBatchClaim = async () => {
    if (!isNewConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    const selectedPools = poolPositions.filter(p => 
      selectedPoolPositions.has(p.poolId) && !p.claimed && p.claimableAmount > 0
    );
    
    const selectedOdysseyList = odysseyPositions.filter(p => 
      selectedOdysseyPositions.has(`${p.cycleId}-${p.slipId}`) && !p.claimed && p.claimStatus === 'eligible'
    );
    
    if (selectedPools.length === 0 && selectedOdysseyList.length === 0) {
      toast.error('No positions selected');
      return;
    }

    setIsClaiming(true);
    const total = selectedPools.length + selectedOdysseyList.length;
    setClaimProgress({ completed: 0, total });
    
    try {
      let completed = 0;
      
      // Claim pool prizes
      for (const pool of selectedPools) {
        try {
          const result = await claimPoolPrize(pool.poolId);
          if (result.success) {
            completed++;
            setClaimProgress({ completed, total });
            setPoolPositions(prev => prev.map(p => 
              p.poolId === pool.poolId ? { ...p, claimed: true } : p
            ));
          }
        } catch (error) {
          console.error(`Failed to claim pool ${pool.poolId}:`, error);
        }
      }
      
      // Claim Odyssey prizes
      if (selectedOdysseyList.length > 0) {
        const odysseyResult = await batchClaimOdysseyPrizes(
          selectedOdysseyList,
          (completedOdyssey) => {
            setClaimProgress({ completed: completed + completedOdyssey, total });
          }
        );
        completed += odysseyResult.successful;
      }
      
      toast.success(`Batch claim completed! ${completed} of ${total} successful`);
      
      // Reload positions to get updated state
      await loadPositions();
      
    } catch (error) {
      console.error('Batch claim error:', error);
      toast.error('Batch claim failed');
    } finally {
      setIsClaiming(false);
      setClaimProgress({ completed: 0, total: 0 });
    }
  };

  const togglePoolPositionSelection = (poolId: number) => {
    setSelectedPoolPositions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(poolId)) {
        newSet.delete(poolId);
      } else {
        newSet.add(poolId);
      }
      return newSet;
    });
  };

  const toggleOdysseyPositionSelection = (cycleId: number, slipId: number) => {
    const key = `${cycleId}-${slipId}`;
    setSelectedOdysseyPositions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    const claimablePools = poolPositions.filter(p => !p.claimed && p.claimableAmount > 0);
    const claimableOdyssey = odysseyPositions.filter(p => !p.claimed && p.claimStatus === 'eligible');
    setSelectedPoolPositions(new Set(claimablePools.map(p => p.poolId)));
    setSelectedOdysseyPositions(new Set(claimableOdyssey.map(p => `${p.cycleId}-${p.slipId}`)));
  };

  const deselectAll = () => {
    setSelectedPoolPositions(new Set());
    setSelectedOdysseyPositions(new Set());
  };

  const filteredPoolPositions = poolPositions.filter(position => {
    switch (filter) {
      case 'unclaimed':
        return !position.claimed && position.claimableAmount > 0;
      case 'claimed':
        return position.claimed;
      default:
        return true;
    }
  });

  const filteredOdysseyPositions = odysseyPositions.filter(position => {
    switch (filter) {
      case 'unclaimed':
        return !position.claimed && position.claimStatus === 'eligible';
      case 'claimed':
        return position.claimed;
      default:
        return true;
    }
  });

  const getFilteredPositions = () => {
    switch (activeTab) {
      case 'pool':
        return { pools: filteredPoolPositions, oddyssey: [] };
      case 'oddyssey':
        return { pools: [], oddyssey: filteredOdysseyPositions };
      default:
        return { pools: filteredPoolPositions, oddyssey: filteredOdysseyPositions };
    }
  };

  const totalClaimableAmount = 
    poolPositions.filter(p => !p.claimed && p.claimableAmount > 0).reduce((sum, p) => sum + p.claimableAmount, 0) +
    odysseyPositions.filter(p => !p.claimed && p.claimStatus === 'eligible').reduce((sum, p) => sum + parseFloat(p.prizeAmount), 0);

  const selectedAmount = 
    poolPositions.filter(p => selectedPoolPositions.has(p.poolId)).reduce((sum, p) => sum + p.claimableAmount, 0) +
    odysseyPositions.filter(p => selectedOdysseyPositions.has(`${p.cycleId}-${p.slipId}`)).reduce((sum, p) => sum + parseFloat(p.prizeAmount), 0);

  const totalUnclaimedCount = 
    poolPositions.filter(p => !p.claimed && p.claimableAmount > 0).length +
    odysseyPositions.filter(p => !p.claimed && p.claimStatus === 'eligible').length;

  const totalSelectedCount = selectedPoolPositions.size + selectedOdysseyPositions.size;

  if (!isOpen) return null;

  const { pools, oddyssey } = getFilteredPositions();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="glass-card rounded-2xl border border-border-card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border-card">
            <div className="flex items-center gap-3">
              <TrophyIcon className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-bold text-text-primary">Claim Prizes</h2>
            </div>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Summary */}
          <div className="p-6 border-b border-border-card bg-bg-card/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {totalClaimableAmount.toFixed(4)}
                </div>
                <div className="text-sm text-text-secondary">Total Claimable</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">
                  {totalUnclaimedCount}
                </div>
                <div className="text-sm text-text-secondary">Unclaimed Positions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">
                  {selectedAmount.toFixed(4)}
                </div>
                <div className="text-sm text-text-secondary">Selected Amount</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="p-4 border-b border-border-card">
            <div className="flex gap-2">
              {(['all', 'pool', 'oddyssey'] as PrizeTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                    activeTab === tab
                      ? 'bg-gradient-primary text-black'
                      : 'bg-bg-card text-text-secondary hover:text-text-primary hover:bg-bg-card-hover'
                  }`}
                >
                  {tab === 'all' && <TrophyIcon className="h-4 w-4 inline mr-1" />}
                  {tab === 'pool' && <TrophyIcon className="h-4 w-4 inline mr-1" />}
                  {tab === 'oddyssey' && <FireIcon className="h-4 w-4 inline mr-1" />}
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="p-6 border-b border-border-card">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              {/* Filter */}
              <div className="flex gap-2">
                {(['all', 'unclaimed', 'claimed'] as const).map((filterType) => (
                  <button
                    key={filterType}
                    onClick={() => setFilter(filterType)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      filter === filterType
                        ? 'bg-gradient-primary text-black'
                        : 'bg-bg-card text-text-secondary hover:text-text-primary hover:bg-bg-card-hover'
                    }`}
                  >
                    {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                  </button>
                ))}
              </div>

              {/* Selection Controls */}
              <div className="flex gap-2">
                <Button
                  onClick={selectAll}
                  variant="outline"
                  size="sm"
                  disabled={totalUnclaimedCount === 0}
                >
                  Select All
                </Button>
                <Button
                  onClick={deselectAll}
                  variant="outline"
                  size="sm"
                  disabled={totalSelectedCount === 0}
                >
                  Deselect All
                </Button>
              </div>
            </div>
          </div>

          {/* Positions List */}
          <div className="flex-1 overflow-y-auto min-h-96 max-h-96 bg-bg-dark/20">
            {isLoading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <LoadingSpinner size="lg" />
                  <span className="text-text-secondary mt-4 block">Loading positions...</span>
                </div>
              </div>
            ) : pools.length === 0 && oddyssey.length === 0 ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <TrophyIcon className="h-12 w-12 text-text-muted mx-auto mb-4" />
                  <p className="text-text-secondary">No claimable positions found</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 p-6">
                {/* Pool Positions */}
                {pools.map((position) => (
                  <div
                    key={`pool-${position.poolId}`}
                    className={`p-4 rounded-lg border transition-all ${
                      position.claimed
                        ? 'bg-bg-card/30 border-border-card'
                        : position.claimableAmount > 0
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-red-500/10 border-red-500/30'
                    } ${
                      selectedPoolPositions.has(position.poolId) && !position.claimed
                        ? 'ring-2 ring-primary'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {!position.claimed && position.claimableAmount > 0 && (
                          <input
                            type="checkbox"
                            checked={selectedPoolPositions.has(position.poolId)}
                            onChange={() => togglePoolPositionSelection(position.poolId)}
                            className="w-4 h-4 text-primary bg-bg-card border-border-input rounded focus:ring-primary"
                          />
                        )}
                        
                        <div>
                          <h4 className="font-medium text-text-primary">
                            Pool #{position.poolId} - {position.league || position.category || 'Market'}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-text-secondary">
                            {position.predictedOutcome && (
                              <span>{position.predictedOutcome}</span>
                            )}
                            {position.settledAt && (
                              <span>Settled: {new Date(position.settledAt).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className={`font-bold ${
                            position.claimableAmount > 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {position.claimableAmount > 0 ? '+' : ''}{position.claimableAmount.toFixed(4)} {position.currency}
                          </div>
                          <div className="text-xs text-text-secondary">
                            Stake: {position.stakeAmount.toFixed(4)} {position.currency}
                          </div>
                        </div>

                        {position.claimed ? (
                          <CheckCircleIcon className="h-6 w-6 text-green-400" />
                        ) : position.claimableAmount > 0 ? (
                          <Button
                            onClick={() => handleClaimPoolSingle(position.poolId)}
                            variant="primary"
                            size="sm"
                            disabled={isClaiming}
                            loading={isClaiming}
                          >
                            Claim
                          </Button>
                        ) : (
                          <span className="text-red-400 text-sm">Not Eligible</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Odyssey Positions */}
                {oddyssey.map((position) => (
                  <div
                    key={`${position.cycleId}-${position.slipId}`}
                    className={`p-4 rounded-lg border transition-all ${
                      position.claimed
                        ? 'bg-bg-card/30 border-border-card'
                        : position.claimStatus === 'eligible'
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-red-500/10 border-red-500/30'
                    } ${
                      selectedOdysseyPositions.has(`${position.cycleId}-${position.slipId}`) && !position.claimed
                        ? 'ring-2 ring-primary'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {!position.claimed && position.claimStatus === 'eligible' && (
                          <input
                            type="checkbox"
                            checked={selectedOdysseyPositions.has(`${position.cycleId}-${position.slipId}`)}
                            onChange={() => toggleOdysseyPositionSelection(position.cycleId, position.slipId)}
                            className="w-4 h-4 text-primary bg-bg-card border-border-input rounded focus:ring-primary"
                          />
                        )}
                        
                        <div>
                          <h4 className="font-medium text-text-primary">
                            Cycle {position.cycleId} - Slip {position.slipId}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-text-secondary">
                            <span>Correct: {position.correctCount}/10</span>
                            <span>Placed: {position.placedAt.toLocaleDateString()}</span>
                            {position.evaluatedAt && (
                              <span>Evaluated: {position.evaluatedAt.toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className={`font-bold ${
                            position.claimStatus === 'eligible' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {position.claimStatus === 'eligible' ? '+' : ''}{parseFloat(position.prizeAmount).toFixed(4)} STT
                          </div>
                          <div className="text-xs text-text-secondary">
                            {position.claimStatus === 'eligible' ? 'Prize' : position.reason || 'Not Eligible'}
                          </div>
                        </div>

                        {position.claimed ? (
                          <CheckCircleIcon className="h-6 w-6 text-green-400" />
                        ) : position.claimStatus === 'eligible' ? (
                          <Button
                            onClick={() => handleClaimOdysseySingle(position)}
                            variant="primary"
                            size="sm"
                            disabled={isClaiming}
                            loading={isClaiming}
                          >
                            Claim
                          </Button>
                        ) : (
                          <span className="text-red-400 text-sm">Not Eligible</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border-card bg-bg-card/50">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="text-sm text-text-secondary">
                {isClaiming && claimProgress.total > 0 && (
                  <span>
                    Claiming {claimProgress.completed} of {claimProgress.total}...
                  </span>
                )}
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={loadPositions}
                  variant="outline"
                  disabled={isLoading || isClaiming}
                >
                  Refresh
                </Button>
                
                {isNewConnected ? (
                  <Button
                    onClick={handleBatchClaim}
                    variant="primary"
                    disabled={totalSelectedCount === 0 || isClaiming}
                    loading={isClaiming}
                  >
                    Claim Selected ({totalSelectedCount})
                  </Button>
                ) : (
                  <Button
                    onClick={connectWallet}
                    variant="primary"
                  >
                    Connect Wallet
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

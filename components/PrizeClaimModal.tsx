"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon,
  TrophyIcon,
  CheckCircleIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import { toast } from '@/utils/toast';
import Button from './button';
import { useNewClaimService, type OdysseyClaimablePosition } from '@/services/newClaimService';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import { getAPIUrl } from '@/config/api';
import LoadingSpinner from './LoadingSpinner';
import { formatNumber } from '@/utils/number-helpers';

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

type PoolStatusApiResponse = {
  data?: {
    alreadyClaimed?: boolean;
    already_claimed?: boolean;
    claimableAmount?: number | string;
    claimable_amount?: number | string;
  };
  alreadyClaimed?: boolean;
  already_claimed?: boolean;
  claimableAmount?: number | string;
  claimable_amount?: number | string;
};

type PrizeTab = 'all' | 'pool' | 'oddyssey';

const TOKEN_DECIMALS = 1e18;

const normalizeTokenAmount = (
  amount: number | string | undefined | null,
  currency?: string
): number => {
  if (amount === undefined || amount === null) {
    return 0;
  }

  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (!Number.isFinite(numericAmount)) {
    return 0;
  }

  const normalizedCurrency = currency?.toUpperCase();
  if (normalizedCurrency === 'BITR' || normalizedCurrency === 'STT') {
    return numericAmount / TOKEN_DECIMALS;
  }

  return numericAmount;
};

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
          
          const normalizedPools: PoolClaimablePosition[] = pools.map((p: PoolClaimablePosition & { poolId: number; claimed?: boolean; claimableAmount?: number; stakeAmount?: number; currency?: string; settledAt?: string; settled_at?: string; txHash?: string }) => {
            const currency = p.currency || 'STT';
            return {
              poolId: p.poolId,
              league: p.league,
              category: p.category,
              predictedOutcome: p.predictedOutcome,
              claimableAmount: normalizeTokenAmount(p.claimableAmount, currency),
              stakeAmount: normalizeTokenAmount(p.stakeAmount, currency),
              currency,
              claimed: p.claimed || false,
              settledAt: p.settled_at ?? p.settledAt,
              txHash: p.txHash
            };
          });

          const poolsWithStatus: PoolClaimablePosition[] = await Promise.all(
            normalizedPools.map(async (pool) => {
              try {
                const statusResponse = await fetch(getAPIUrl(`/api/claim-pools/${pool.poolId}/${currentAddress}/status`));
                if (statusResponse.ok) {
                  const statusJson = (await statusResponse.json()) as PoolStatusApiResponse;
                  const statusData = statusJson.data ?? statusJson ?? {};
                  const statusRecord = statusData as Record<string, unknown>;
                  const alreadyClaimed = Boolean(
                    statusRecord['alreadyClaimed'] ?? statusRecord['already_claimed']
                  );
                  const claimableAmountRaw = (
                    statusRecord['claimableAmount'] ?? statusRecord['claimable_amount']
                  ) as number | string | undefined;

                  return {
                    ...pool,
                    claimed: pool.claimed || alreadyClaimed,
                    claimableAmount:
                      alreadyClaimed
                        ? 0
                        : claimableAmountRaw !== undefined
                        ? normalizeTokenAmount(claimableAmountRaw as number | string, pool.currency)
                        : pool.claimableAmount
                  };
                }
              } catch (statusError) {
                console.warn(`[PrizeClaimModal] Failed to fetch status for pool ${pool.poolId}:`, statusError);
              }
              return pool;
            })
          );

          setPoolPositions(poolsWithStatus);
          
          // Auto-select unclaimed pool positions
          const unclaimedPools = poolsWithStatus
            .filter((p: PoolClaimablePosition) => !p.claimed && p.claimableAmount > 0)
            .map((p: PoolClaimablePosition) => p.poolId);
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
          interface OdysseyPrizeResponse {
            cycleId: number;
            slipId: number;
            correctCount: number;
            prizeAmount?: number | string;
            already_claimed?: boolean;
            canClaim?: boolean;
            placedAt?: string;
            evaluatedAt?: string;
          }
          
          const odysseyPrizes: OdysseyPrizeResponse[] = (odysseyData?.data?.claimablePrizes ?? odysseyData.claimablePrizes ?? []);
          console.log(`[PrizeClaimModal] Loaded ${odysseyPrizes.length} odyssey positions for ${currentAddress}`);
          
          if (isMountedRef.current) {
            const normalizedOdysseyPositions: OdysseyClaimablePosition[] = odysseyPrizes.map((p) => ({
              cycleId: p.cycleId,
              slipId: p.slipId,
              userAddress: currentAddress,
              correctCount: p.correctCount,
              prizeAmount: normalizeTokenAmount(p.prizeAmount, 'STT').toString(),
              claimed: p.already_claimed || false,
              claimStatus: p.canClaim ? 'eligible' as const : 'not_eligible' as const,
              placedAt: p.placedAt ? new Date(p.placedAt) : new Date(),
              evaluatedAt: p.evaluatedAt ? new Date(p.evaluatedAt) : undefined
            }));

            setOdysseyPositions(normalizedOdysseyPositions);
            
            // Auto-select unclaimed winning Odyssey positions
            const unclaimedOdysseyWinning = normalizedOdysseyPositions
              .filter((p: OdysseyClaimablePosition) => !p.claimed && p.claimStatus === 'eligible')
              .map((p: OdysseyClaimablePosition) => `${p.cycleId}-${p.slipId}`);
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

  // ✅ FIX: Lock body scroll when modal is open (prevent footer overlap)
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

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

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
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
      {/* ✅ FIX: Full viewport overlay with highest z-index */}
      <div
        className="fixed inset-0 flex items-center justify-center"
        onClick={onClose}
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99999,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          padding: '16px'
        }}
      >
        {/* ✅ FIX: Compact modal centered in viewport */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-2xl overflow-hidden flex flex-col rounded-xl border border-cyan-500/30"
          onClick={(e) => e.stopPropagation()}
          style={{ 
            maxHeight: 'calc(100vh - 32px)',
            backgroundColor: 'rgba(10, 15, 30, 0.98)',
            boxShadow: '0 0 40px rgba(0, 255, 255, 0.1), 0 0 80px rgba(0, 0, 0, 0.5)'
          }}
        >
          {/* Header - Compact */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-transparent">
            <div className="flex items-center gap-2">
              <TrophyIcon className="h-5 w-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white">Claim Prizes</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
              aria-label="Close modal"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Summary - Compact */}
          <div className="px-4 py-3 border-b border-cyan-500/10 bg-black/30">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-lg font-bold text-green-400">{formatNumber(totalClaimableAmount, 2)}</div>
                <div className="text-xs text-white/50">Claimable</div>
              </div>
              <div>
                <div className="text-lg font-bold text-cyan-400">{totalUnclaimedCount}</div>
                <div className="text-xs text-white/50">Unclaimed</div>
              </div>
              <div>
                <div className="text-lg font-bold text-yellow-400">{formatNumber(selectedAmount, 2)}</div>
                <div className="text-xs text-white/50">Selected</div>
              </div>
            </div>
          </div>

          {/* Tabs - Compact */}
          <div className="px-4 py-2 border-b border-cyan-500/10 bg-black/20">
            <div className="flex gap-1">
              {(['all', 'pool', 'oddyssey'] as PrizeTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-all capitalize ${
                    activeTab === tab
                      ? 'bg-cyan-500 text-black'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Controls - Compact */}
          <div className="px-4 py-2 border-b border-cyan-500/10 bg-black/10 flex items-center justify-between gap-2">
            {/* Filter */}
            <div className="flex gap-1">
              {(['all', 'unclaimed', 'claimed'] as const).map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                    filter === filterType
                      ? 'bg-white/20 text-white'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
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

          {/* Positions List - Compact */}
          <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)', minHeight: '200px' }}>
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="text-center">
                  <LoadingSpinner size="lg" />
                  <span className="text-white/60 mt-2 block text-xs">Loading...</span>
                </div>
              </div>
            ) : pools.length === 0 && oddyssey.length === 0 ? (
              <div className="flex items-center justify-center h-48">
                <div className="text-center">
                  <TrophyIcon className="h-8 w-8 text-white/30 mx-auto mb-2" />
                  <p className="text-white/50 text-sm">No claimable positions</p>
                </div>
              </div>
            ) : (
              <div className="space-y-1 p-3">
                {/* Pool Positions - Compact */}
                {pools.map((position) => (
                  <div
                    key={`pool-${position.poolId}`}
                    className={`px-3 py-2 rounded border transition-all flex items-center justify-between gap-2 ${
                      position.claimed
                        ? 'bg-white/5 border-white/10 opacity-60'
                        : position.claimableAmount > 0
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-red-500/5 border-red-500/20'
                    } ${
                      selectedPoolPositions.has(position.poolId) && !position.claimed
                        ? 'ring-1 ring-cyan-400'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {!position.claimed && position.claimableAmount > 0 && (
                        <input
                          type="checkbox"
                          checked={selectedPoolPositions.has(position.poolId)}
                          onChange={() => togglePoolPositionSelection(position.poolId)}
                          className="w-3.5 h-3.5 text-cyan-400 bg-black/50 border-white/30 rounded focus:ring-cyan-400 flex-shrink-0"
                        />
                      )}
                      
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-white text-xs truncate">
                          Pool #{position.poolId} - {position.league || position.category || 'Market'}
                        </h4>
                        <div className="text-xs text-white/40 truncate">
                          {position.predictedOutcome || (position.settledAt && new Date(position.settledAt).toLocaleDateString())}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <div className={`font-bold text-xs ${
                          position.claimableAmount > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {position.claimableAmount > 0 ? '+' : ''}{formatNumber(position.claimableAmount, 2)}
                        </div>
                        <div className="text-xs text-white/40">
                          {formatNumber(position.stakeAmount, 2)} {position.currency}
                        </div>
                      </div>

                        {position.claimed ? (
                          <CheckCircleIcon className="h-4 w-4 text-green-400" />
                        ) : position.claimableAmount > 0 ? (
                          <Button
                            onClick={() => handleClaimPoolSingle(position.poolId)}
                            variant="primary"
                            size="sm"
                            disabled={isClaiming}
                            loading={isClaiming}
                            className="text-xs px-2 py-1"
                          >
                            Claim
                          </Button>
                        ) : (
                          <span className="text-red-400/60 text-xs">N/A</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Odyssey Positions - Compact */}
                {oddyssey.map((position) => (
                  <div
                    key={`${position.cycleId}-${position.slipId}`}
                    className={`px-3 py-2 rounded border transition-all flex items-center justify-between gap-2 ${
                      position.claimed
                        ? 'bg-white/5 border-white/10 opacity-60'
                        : position.claimStatus === 'eligible'
                        ? 'bg-purple-500/10 border-purple-500/30'
                        : 'bg-red-500/5 border-red-500/20'
                    } ${
                      selectedOdysseyPositions.has(`${position.cycleId}-${position.slipId}`) && !position.claimed
                        ? 'ring-1 ring-purple-400'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {!position.claimed && position.claimStatus === 'eligible' && (
                        <input
                          type="checkbox"
                          checked={selectedOdysseyPositions.has(`${position.cycleId}-${position.slipId}`)}
                          onChange={() => toggleOdysseyPositionSelection(position.cycleId, position.slipId)}
                          className="w-3.5 h-3.5 text-purple-400 bg-black/50 border-white/30 rounded focus:ring-purple-400 flex-shrink-0"
                        />
                      )}
                      
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-white text-xs flex items-center gap-1">
                          <FireIcon className="h-3 w-3 text-purple-400 flex-shrink-0" />
                          Cycle {position.cycleId} · Slip {position.slipId}
                        </h4>
                        <div className="text-xs text-white/40">
                          {position.correctCount}/10 correct
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <div className={`font-bold text-xs ${
                          position.claimStatus === 'eligible' ? 'text-purple-400' : 'text-red-400'
                        }`}>
                          {position.claimStatus === 'eligible' ? '+' : ''}{formatNumber(parseFloat(position.prizeAmount), 2)} STT
                        </div>
                        <div className="text-xs text-white/40">
                          {position.claimStatus === 'eligible' ? 'Prize' : 'N/A'}
                        </div>
                      </div>

                      {position.claimed ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-400" />
                      ) : position.claimStatus === 'eligible' ? (
                        <Button
                          onClick={() => handleClaimOdysseySingle(position)}
                          variant="primary"
                          size="sm"
                          disabled={isClaiming}
                          loading={isClaiming}
                          className="text-xs px-2 py-1"
                        >
                          Claim
                        </Button>
                      ) : (
                        <span className="text-red-400/60 text-xs">N/A</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer - Compact */}
          <div className="px-4 py-3 border-t border-cyan-500/20 bg-black/50 flex items-center justify-between gap-2">
            <div className="text-xs text-white/50">
              {isClaiming && claimProgress.total > 0 && (
                <span>Claiming {claimProgress.completed}/{claimProgress.total}...</span>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={loadPositions}
                variant="outline"
                disabled={isLoading || isClaiming}
                className="text-xs px-3 py-1.5"
              >
                Refresh
              </Button>
              
              {isNewConnected ? (
                <Button
                  onClick={handleBatchClaim}
                  variant="primary"
                  disabled={totalSelectedCount === 0 || isClaiming}
                  loading={isClaiming}
                  className="text-xs px-3 py-1.5"
                >
                  Claim ({totalSelectedCount})
                </Button>
              ) : (
                <Button
                  onClick={connectWallet}
                  variant="primary"
                  className="text-xs px-3 py-1.5"
                >
                  Connect
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

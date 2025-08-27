"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon,
  TrophyIcon,

  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { formatEther } from 'viem';
import { toast } from 'react-hot-toast';
import Button from './button';
import { usePrizeClaiming, type ClaimablePosition } from '@/services/prizeClaimService';
import { useWalletConnection } from '@/hooks/useWalletConnection';

interface PrizeClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  userAddress?: string;
}

export default function PrizeClaimModal({ isOpen, onClose, userAddress }: PrizeClaimModalProps) {
  const [positions, setPositions] = useState<ClaimablePosition[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimProgress, setClaimProgress] = useState({ completed: 0, total: 0 });
  const [filter, setFilter] = useState<'all' | 'unclaimed' | 'claimed'>('unclaimed');
  
  const { 
    claimSingle, 
    claimCombo, 
    batchClaim, 
    getClaimablePositions, 
    isConnected 
  } = usePrizeClaiming();
  
  const { connectWallet } = useWalletConnection();

  const loadPositions = useCallback(async () => {
    if (!userAddress) return;
    
    setIsLoading(true);
    try {
      const fetchedPositions = await getClaimablePositions();
      setPositions(fetchedPositions);
      
      // Auto-select unclaimed winning positions
      const unclaimedWinning = fetchedPositions
        .filter(p => !p.claimed && p.isWinner)
        .map(p => p.poolId);
      setSelectedPositions(new Set(unclaimedWinning));
      
    } catch (error) {
      console.error('Error loading positions:', error);
      toast.error('Failed to load claimable positions');
    } finally {
      setIsLoading(false);
    }
  }, [userAddress, getClaimablePositions]);

  // Load claimable positions
  useEffect(() => {
    if (isOpen && userAddress) {
      loadPositions();
    }
  }, [isOpen, userAddress, loadPositions]);

  const handleClaimSingle = async (position: ClaimablePosition) => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    setIsClaiming(true);
    try {
      let result;
      if (position.poolType === 'combo') {
        result = await claimCombo(position.poolId);
      } else {
        result = await claimSingle(position.poolId);
      }

      if (result.success) {
        toast.success(`Prize claimed successfully! 🎉`);
        
        // Update the position as claimed
        setPositions(prev => prev.map(p => 
          p.poolId === position.poolId 
            ? { ...p, claimed: true }
            : p
        ));
        
        // Remove from selected positions
        setSelectedPositions(prev => {
          const newSet = new Set(prev);
          newSet.delete(position.poolId);
          return newSet;
        });
        
      } else {
        toast.error(result.error || 'Failed to claim prize');
      }
    } catch (error) {
      console.error('Claim error:', error);
      toast.error('Failed to claim prize');
    } finally {
      setIsClaiming(false);
    }
  };

  const handleBatchClaim = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    const selectedPositionsList = positions.filter(p => selectedPositions.has(p.poolId));
    
    if (selectedPositionsList.length === 0) {
      toast.error('No positions selected');
      return;
    }

    setIsClaiming(true);
    setClaimProgress({ completed: 0, total: selectedPositionsList.length });
    
    try {
      const result = await batchClaim(
        selectedPositionsList,
        (completed, total) => {
          setClaimProgress({ completed, total });
        }
      );

      toast.success(`Batch claim completed! ${result.successful} successful, ${result.failed} failed`);
      
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

  const togglePositionSelection = (poolId: number) => {
    setSelectedPositions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(poolId)) {
        newSet.delete(poolId);
      } else {
        newSet.add(poolId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    const claimablePositions = filteredPositions.filter(p => !p.claimed && p.isWinner);
    setSelectedPositions(new Set(claimablePositions.map(p => p.poolId)));
  };

  const deselectAll = () => {
    setSelectedPositions(new Set());
  };

  const filteredPositions = positions.filter(position => {
    switch (filter) {
      case 'unclaimed':
        return !position.claimed && position.isWinner;
      case 'claimed':
        return position.claimed;
      default:
        return true;
    }
  });

  const totalClaimableAmount = positions
    .filter(p => !p.claimed && p.isWinner)
    .reduce((sum, p) => sum + parseFloat(p.potentialPayout), 0);

  const selectedAmount = positions
    .filter(p => selectedPositions.has(p.poolId))
    .reduce((sum, p) => sum + parseFloat(p.potentialPayout), 0);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-gray-800 rounded-2xl border border-gray-600 w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-600">
            <div className="flex items-center gap-3">
              <TrophyIcon className="h-6 w-6 text-yellow-400" />
              <h2 className="text-xl font-bold text-white">Prize Claiming</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Summary */}
          <div className="p-6 border-b border-gray-600 bg-gray-700/30">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {totalClaimableAmount.toFixed(2)}
                </div>
                <div className="text-sm text-gray-400">Total Claimable</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">
                  {positions.filter(p => !p.claimed && p.isWinner).length}
                </div>
                <div className="text-sm text-gray-400">Unclaimed Positions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {selectedAmount.toFixed(2)}
                </div>
                <div className="text-sm text-gray-400">Selected Amount</div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="p-6 border-b border-gray-600">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              {/* Filter */}
              <div className="flex gap-2">
                {(['all', 'unclaimed', 'claimed'] as const).map((filterType) => (
                  <button
                    key={filterType}
                    onClick={() => setFilter(filterType)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      filter === filterType
                        ? 'bg-cyan-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
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
                  disabled={filteredPositions.filter(p => !p.claimed && p.isWinner).length === 0}
                >
                  Select All
                </Button>
                <Button
                  onClick={deselectAll}
                  variant="outline"
                  size="sm"
                  disabled={selectedPositions.size === 0}
                >
                  Deselect All
                </Button>
              </div>
            </div>
          </div>

          {/* Positions List */}
          <div className="flex-1 overflow-y-auto max-h-96">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <ArrowPathIcon className="h-8 w-8 text-cyan-400 animate-spin" />
                <span className="ml-2 text-gray-400">Loading positions...</span>
              </div>
            ) : filteredPositions.length === 0 ? (
              <div className="text-center py-12">
                <TrophyIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No positions found</p>
              </div>
            ) : (
              <div className="space-y-2 p-6">
                {filteredPositions.map((position) => (
                  <div
                    key={`${position.poolType}-${position.poolId}`}
                    className={`p-4 rounded-lg border transition-all ${
                      position.claimed
                        ? 'bg-gray-700/30 border-gray-600'
                        : position.isWinner
                        ? 'bg-green-900/20 border-green-600/30'
                        : 'bg-red-900/20 border-red-600/30'
                    } ${
                      selectedPositions.has(position.poolId) && !position.claimed
                        ? 'ring-2 ring-cyan-400'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {!position.claimed && position.isWinner && (
                          <input
                            type="checkbox"
                            checked={selectedPositions.has(position.poolId)}
                            onChange={() => togglePositionSelection(position.poolId)}
                            className="w-4 h-4 text-cyan-400 bg-gray-700 border-gray-600 rounded focus:ring-cyan-400"
                          />
                        )}
                        
                        <div>
                          <h4 className="font-medium text-white">
                            {position.marketTitle}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span>{position.poolType === 'combo' ? 'Combo' : 'Single'} Pool</span>
                            <span>Stake: {parseFloat(formatEther(BigInt(position.userStake))).toFixed(2)} {position.usesBitr ? 'BITR' : 'STT'}</span>
                            <span>Settled: {position.settledAt.toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className={`font-bold ${
                            position.isWinner ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {position.isWinner ? '+' : ''}{parseFloat(formatEther(BigInt(position.potentialPayout))).toFixed(2)} {position.usesBitr ? 'BITR' : 'STT'}
                          </div>
                          <div className="text-xs text-gray-400">
                            {position.isWinner ? 'Winnings' : 'Lost'}
                          </div>
                        </div>

                        {position.claimed ? (
                          <CheckCircleIcon className="h-6 w-6 text-green-400" />
                        ) : position.isWinner ? (
                          <Button
                            onClick={() => handleClaimSingle(position)}
                            variant="primary"
                            size="sm"
                            disabled={isClaiming}
                            loading={isClaiming}
                          >
                            Claim
                          </Button>
                        ) : (
                          <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-600 bg-gray-700/30">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="text-sm text-gray-400">
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
                
                {!isConnected ? (
                  <Button
                    onClick={connectWallet}
                    variant="primary"
                  >
                    Connect Wallet
                  </Button>
                ) : (
                  <Button
                    onClick={handleBatchClaim}
                    variant="primary"
                    disabled={selectedPositions.size === 0 || isClaiming}
                    loading={isClaiming}
                  >
                    Claim Selected ({selectedPositions.size})
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

"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon,
  TrophyIcon,
  CheckCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import Button from './button';
import { useNewClaimService, type OdysseyClaimablePosition } from '@/services/newClaimService';
import { useWalletConnection } from '@/hooks/useWalletConnection';

interface PrizeClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  userAddress?: string;
}

export default function PrizeClaimModal({ isOpen, onClose, userAddress }: PrizeClaimModalProps) {
  const [odysseyPositions, setOdysseyPositions] = useState<OdysseyClaimablePosition[]>([]);
  const [selectedOdysseyPositions, setSelectedOdysseyPositions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimProgress, setClaimProgress] = useState({ completed: 0, total: 0 });
  const [filter, setFilter] = useState<'all' | 'unclaimed' | 'claimed'>('unclaimed');
  
  const {
    claimOdysseyPrize,
    batchClaimOdysseyPrizes,
    getAllClaimableOdysseyPrizes,
    isConnected: isNewConnected
  } = useNewClaimService();
  
  const { connectWallet } = useWalletConnection();

  const loadPositions = useCallback(async () => {
    if (!userAddress) return;
    
    setIsLoading(true);
    try {
      // Load new Odyssey positions
      const odysseyPrizes = await getAllClaimableOdysseyPrizes();
      setOdysseyPositions(odysseyPrizes);
      
      // Auto-select unclaimed winning Odyssey positions
      const unclaimedOdysseyWinning = odysseyPrizes
        .filter(p => !p.claimed && p.claimStatus === 'eligible')
        .map(p => `${p.cycleId}-${p.slipId}`);
      setSelectedOdysseyPositions(new Set(unclaimedOdysseyWinning));
      
    } catch (error) {
      console.error('Error loading positions:', error);
      toast.error('Failed to load claimable positions');
    } finally {
      setIsLoading(false);
    }
  }, [userAddress, getAllClaimableOdysseyPrizes]);

  // Load claimable positions
  useEffect(() => {
    if (isOpen && userAddress) {
      loadPositions();
    }
  }, [isOpen, userAddress, loadPositions]);

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

  const handleBatchClaimOdyssey = async () => {
    if (!isNewConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    const selectedOdysseyPositionsList = odysseyPositions.filter(p => 
      selectedOdysseyPositions.has(`${p.cycleId}-${p.slipId}`) && !p.claimed && p.claimStatus === 'eligible'
    );
    
    if (selectedOdysseyPositionsList.length === 0) {
      toast.error('No Odyssey positions selected');
      return;
    }

    setIsClaiming(true);
    setClaimProgress({ completed: 0, total: selectedOdysseyPositionsList.length });
    
    try {
      const result = await batchClaimOdysseyPrizes(
        selectedOdysseyPositionsList,
        (completed, total) => {
          setClaimProgress({ completed, total });
        }
      );

      toast.success(`Odyssey batch claim completed! ${result.successful} successful, ${result.failed} failed`);
      
      // Reload positions to get updated state
      await loadPositions();
      
    } catch (error) {
      console.error('Odyssey batch claim error:', error);
      toast.error('Odyssey batch claim failed');
    } finally {
      setIsClaiming(false);
      setClaimProgress({ completed: 0, total: 0 });
    }
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
    const claimableOdysseyPositions = odysseyPositions.filter(p => !p.claimed && p.claimStatus === 'eligible');
    setSelectedOdysseyPositions(new Set(claimableOdysseyPositions.map(p => `${p.cycleId}-${p.slipId}`)));
  };

  const deselectAll = () => {
    setSelectedOdysseyPositions(new Set());
  };

  const filteredPositions = odysseyPositions.filter(position => {
    switch (filter) {
      case 'unclaimed':
        return !position.claimed && position.claimStatus === 'eligible';
      case 'claimed':
        return position.claimed;
      default:
        return true;
    }
  });

  const totalClaimableAmount = odysseyPositions
    .filter(p => !p.claimed && p.claimStatus === 'eligible')
    .reduce((sum, p) => sum + parseFloat(p.prizeAmount), 0);

  const selectedAmount = odysseyPositions
    .filter(p => selectedOdysseyPositions.has(`${p.cycleId}-${p.slipId}`))
    .reduce((sum, p) => sum + parseFloat(p.prizeAmount), 0);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-gray-800 rounded-2xl border border-gray-600 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-600">
            <div className="flex items-center gap-3">
              <TrophyIcon className="h-6 w-6 text-purple-400" />
              <h2 className="text-xl font-bold text-white">Odyssey Prizes</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Summary - Odyssey Only */}
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
                  {odysseyPositions.filter(p => !p.claimed && p.claimStatus === 'eligible').length}
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
                  disabled={odysseyPositions.filter(p => !p.claimed && p.claimStatus === 'eligible').length === 0}
                >
                  Select All
                </Button>
                <Button
                  onClick={deselectAll}
                  variant="outline"
                  size="sm"
                  disabled={selectedOdysseyPositions.size === 0}
                >
                  Deselect All
                </Button>
              </div>
            </div>
          </div>

          {/* Positions List */}
          <div className="flex-1 overflow-y-auto min-h-96 max-h-96 bg-gray-900/20">
            {isLoading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <SparklesIcon className="h-12 w-12 text-purple-400 animate-spin mx-auto mb-2" />
                  <span className="text-gray-400">Loading positions...</span>
                </div>
              </div>
            ) : (
              odysseyPositions.length === 0 ? (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <TrophyIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No Odyssey positions found</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 p-6">
                  {filteredPositions.map((position) => (
                    <div
                      key={`${position.cycleId}-${position.slipId}`}
                      className={`p-4 rounded-lg border transition-all ${
                        position.claimed
                          ? 'bg-gray-700/30 border-gray-600'
                          : position.claimStatus === 'eligible'
                          ? 'bg-green-900/20 border-green-600/30'
                          : 'bg-red-900/20 border-red-600/30'
                      } ${
                        selectedOdysseyPositions.has(`${position.cycleId}-${position.slipId}`) && !position.claimed
                          ? 'ring-2 ring-purple-400'
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
                              className="w-4 h-4 text-purple-400 bg-gray-700 border-gray-600 rounded focus:ring-purple-400"
                            />
                          )}
                          
                          <div>
                            <h4 className="font-medium text-white">
                              Cycle {position.cycleId} - Slip {position.slipId}
                            </h4>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
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
                              {position.claimStatus === 'eligible' ? '+' : ''}{parseFloat(position.prizeAmount).toFixed(2)} STT
                            </div>
                            <div className="text-xs text-gray-400">
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
              )
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
                
                {isNewConnected ? (
                  <Button
                    onClick={handleBatchClaimOdyssey}
                    variant="primary"
                    disabled={selectedOdysseyPositions.size === 0 || isClaiming}
                    loading={isClaiming}
                  >
                    Claim Selected ({selectedOdysseyPositions.size})
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

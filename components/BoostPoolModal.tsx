"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { 
  XMarkIcon,
  BoltIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  SparklesIcon,
  ClockIcon
} from "@heroicons/react/24/outline";
import { useAccount, useBalance } from "wagmi";
import { useBoostSystem } from "@/hooks/useContractInteractions";
import { toast } from "@/utils/toast";
import { formatEther } from "viem";

// Boost tier enum matching the contract
export type BoostTier = 'NONE' | 'BRONZE' | 'SILVER' | 'GOLD';

// Map tier names to contract enum values
const TIER_TO_ENUM: Record<BoostTier, number> = {
  'NONE': 0,
  'BRONZE': 1,
  'SILVER': 2,
  'GOLD': 3
};

// Tier details
const TIER_INFO = {
  BRONZE: {
    name: 'Bronze',
    icon: '🥉',
    description: 'Higher visibility in category listings',
    benefits: ['Priority in category', 'Bronze badge', '24h duration'],
    gradient: 'from-orange-600 to-orange-700',
    borderColor: 'border-orange-500/50',
    bgColor: 'bg-orange-500/10',
    textColor: 'text-orange-400',
    hoverBg: 'hover:bg-orange-500/20'
  },
  SILVER: {
    name: 'Silver',
    icon: '🥈',
    description: 'Featured on homepage + highlighted',
    benefits: ['Featured placement', 'Silver badge', '24h duration', 'Homepage visibility'],
    gradient: 'from-gray-400 to-gray-500',
    borderColor: 'border-gray-400/50',
    bgColor: 'bg-gray-400/10',
    textColor: 'text-gray-300',
    hoverBg: 'hover:bg-gray-400/20'
  },
  GOLD: {
    name: 'Gold',
    icon: '🥇',
    description: 'Pinned to top + maximum visibility',
    benefits: ['Pinned to top', 'Gold badge', '24h duration', 'Maximum exposure', 'Priority notifications'],
    gradient: 'from-yellow-500 to-amber-500',
    borderColor: 'border-yellow-500/50',
    bgColor: 'bg-yellow-500/10',
    textColor: 'text-yellow-400',
    hoverBg: 'hover:bg-yellow-500/20'
  }
};

interface BoostPoolModalProps {
  poolId: number;
  currentTier?: BoostTier;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function BoostPoolModal({ 
  poolId, 
  currentTier = 'NONE', 
  isOpen, 
  onClose,
  onSuccess 
}: BoostPoolModalProps) {
  const { address, isConnected } = useAccount();
  const { data: sttBalance } = useBalance({ address });
  const { boostPool, getAllBoostFees, canBoostPool, getBoostInfo } = useBoostSystem();
  
  const [selectedTier, setSelectedTier] = useState<BoostTier | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBoosting, setIsBoosting] = useState(false);
  const [boostSuccess, setBoostSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  
  // Boost fees from contract
  const [boostFees, setBoostFees] = useState<{
    bronze: bigint;
    silver: bigint;
    gold: bigint;
  } | null>(null);
  
  // Current boost info
  const [currentBoostInfo, setCurrentBoostInfo] = useState<{
    tier: number;
    expiry: bigint;
    isActive: boolean;
    remainingTime: bigint;
  } | null>(null);
  
  // Eligibility checks for each tier
  const [eligibility, setEligibility] = useState<{
    bronze: { canBoost: boolean; reason: string };
    silver: { canBoost: boolean; reason: string };
    gold: { canBoost: boolean; reason: string };
  }>({
    bronze: { canBoost: true, reason: '' },
    silver: { canBoost: true, reason: '' },
    gold: { canBoost: true, reason: '' }
  });

  // Fetch boost fees and eligibility when modal opens
  useEffect(() => {
    if (isOpen && poolId) {
      fetchBoostData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, poolId]);

  const fetchBoostData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch boost fees
      const fees = await getAllBoostFees();
      setBoostFees(fees);
      console.log('💰 Boost fees loaded:', {
        bronze: formatEther(fees.bronze),
        silver: formatEther(fees.silver),
        gold: formatEther(fees.gold)
      });
      
      // Fetch current boost info
      const boostInfo = await getBoostInfo(BigInt(poolId));
      if (boostInfo) {
        setCurrentBoostInfo({
          tier: boostInfo.tier,
          expiry: boostInfo.expiry,
          isActive: boostInfo.isActive,
          remainingTime: boostInfo.remainingTime
        });
        console.log('📊 Current boost info:', boostInfo);
      }
      
      // Check eligibility for each tier
      const [bronzeElig, silverElig, goldElig] = await Promise.all([
        canBoostPool(BigInt(poolId), 1),
        canBoostPool(BigInt(poolId), 2),
        canBoostPool(BigInt(poolId), 3)
      ]);
      
      setEligibility({
        bronze: bronzeElig,
        silver: silverElig,
        gold: goldElig
      });
      
      console.log('✅ Eligibility checked:', { bronzeElig, silverElig, goldElig });
    } catch (err) {
      console.error('Error fetching boost data:', err);
      setError('Failed to load boost information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [poolId, getAllBoostFees, getBoostInfo, canBoostPool]);

  const handleBoost = async () => {
    if (!selectedTier || !isConnected || !address) {
      toast.error('Please connect your wallet and select a tier');
      return;
    }
    
    const tierEnum = TIER_TO_ENUM[selectedTier];
    const tierFee = selectedTier === 'BRONZE' ? boostFees?.bronze : 
                    selectedTier === 'SILVER' ? boostFees?.silver : 
                    boostFees?.gold;
    
    if (!tierFee) {
      toast.error('Boost fee not available');
      return;
    }
    
    // Check balance
    if (sttBalance && sttBalance.value < tierFee) {
      toast.error(`Insufficient STT balance. You need ${formatEther(tierFee)} STT`);
      return;
    }
    
    setIsBoosting(true);
    setError(null);
    
    try {
      const hash = await boostPool(BigInt(poolId), tierEnum);
      setTxHash(hash);
      setBoostSuccess(true);
      
      // Notify parent
      if (onSuccess) {
        onSuccess();
      }
      
      // Auto-close after success
      setTimeout(() => {
        onClose();
        // Reset state
        setBoostSuccess(false);
        setSelectedTier(null);
        setTxHash(null);
      }, 3000);
      
    } catch (err) {
      console.error('Boost failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to boost pool');
    } finally {
      setIsBoosting(false);
    }
  };

  const formatFee = (fee: bigint | undefined) => {
    if (!fee) return '...';
    return parseFloat(formatEther(fee)).toFixed(1);
  };

  const formatRemainingTime = (seconds: bigint) => {
    const secs = Number(seconds);
    if (secs <= 0) return 'Expired';
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const getTierColor = (tier: number) => {
    switch (tier) {
      case 1: return 'text-orange-400';
      case 2: return 'text-gray-300';
      case 3: return 'text-yellow-400';
      default: return 'text-gray-500';
    }
  };

  const getTierName = (tier: number) => {
    switch (tier) {
      case 1: return 'Bronze';
      case 2: return 'Silver';
      case 3: return 'Gold';
      default: return 'None';
    }
  };

  // Available tiers for boosting (exclude current tier and lower)
  const getAvailableTiers = (): BoostTier[] => {
    const currentTierNum = TIER_TO_ENUM[currentTier] || (currentBoostInfo?.tier || 0);
    const tiers: BoostTier[] = [];
    if (currentTierNum < 1) tiers.push('BRONZE');
    if (currentTierNum < 2) tiers.push('SILVER');
    if (currentTierNum < 3) tiers.push('GOLD');
    return tiers;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="relative px-6 py-5 border-b border-slate-700/50 bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-amber-500/10">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-400" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                  <BoltIcon className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Boost Pool #{poolId}</h2>
                  <p className="text-sm text-gray-400">Increase visibility and attract more participants</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-5 space-y-5">
              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500"></div>
                </div>
              )}

              {/* Error State */}
              {error && !isLoading && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                  <div className="flex items-center gap-2 text-red-400">
                    <ExclamationCircleIcon className="w-5 h-5" />
                    <span className="text-sm font-medium">{error}</span>
                  </div>
                </div>
              )}

              {/* Success State */}
              {boostSuccess && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircleIcon className="w-10 h-10 text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Pool Boosted!</h3>
                  <p className="text-gray-400 mb-4">Your pool is now boosted to {selectedTier}</p>
                  {txHash && (
                    <a
                      href={`https://explorer.somnia.network/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      View transaction →
                    </a>
                  )}
                </motion.div>
              )}

              {/* Current Boost Info */}
              {!isLoading && !boostSuccess && currentBoostInfo?.isActive && (
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <SparklesIcon className={`w-5 h-5 ${getTierColor(currentBoostInfo.tier)}`} />
                      <span className="text-sm text-gray-300">
                        Currently <span className={`font-bold ${getTierColor(currentBoostInfo.tier)}`}>
                          {getTierName(currentBoostInfo.tier)}
                        </span> boosted
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                      <ClockIcon className="w-4 h-4" />
                      {formatRemainingTime(currentBoostInfo.remainingTime)}
                    </div>
                  </div>
                </div>
              )}

              {/* Tier Selection */}
              {!isLoading && !boostSuccess && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-300">Select Boost Tier</h3>
                  
                  {getAvailableTiers().length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
                      <p className="text-gray-400">This pool is already at maximum boost tier</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(['BRONZE', 'SILVER', 'GOLD'] as const).map((tier) => {
                        const info = TIER_INFO[tier];
                        const fee = tier === 'BRONZE' ? boostFees?.bronze : 
                                   tier === 'SILVER' ? boostFees?.silver : 
                                   boostFees?.gold;
                        const elig = eligibility[tier.toLowerCase() as keyof typeof eligibility];
                        const isSelected = selectedTier === tier;
                        const isDisabled = !elig.canBoost;
                        const isAvailable = getAvailableTiers().includes(tier);
                        
                        if (!isAvailable) return null;
                        
                        return (
                          <motion.button
                            key={tier}
                            onClick={() => !isDisabled && setSelectedTier(tier)}
                            disabled={isDisabled}
                            whileHover={!isDisabled ? { scale: 1.02 } : {}}
                            whileTap={!isDisabled ? { scale: 0.98 } : {}}
                            className={`
                              w-full p-4 rounded-xl border-2 transition-all text-left relative
                              ${isSelected ? `${info.borderColor} ${info.bgColor}` : 'border-slate-700/50 bg-slate-800/30'}
                              ${!isDisabled ? info.hoverBg : 'opacity-50 cursor-not-allowed'}
                            `}
                          >
                            {isSelected && (
                              <div className="absolute top-3 right-3">
                                <CheckCircleIcon className={`w-5 h-5 ${info.textColor}`} />
                              </div>
                            )}
                            
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${info.gradient} flex items-center justify-center flex-shrink-0`}>
                                <span className="text-lg">{info.icon}</span>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <span className={`font-bold ${info.textColor}`}>{info.name}</span>
                                  <span className="font-bold text-white">{formatFee(fee)} STT</span>
                                </div>
                                <p className="text-xs text-gray-400 mb-2">{info.description}</p>
                                
                                {isDisabled && elig.reason && (
                                  <p className="text-xs text-red-400">{elig.reason}</p>
                                )}
                                
                                <div className="flex flex-wrap gap-1.5">
                                  {info.benefits.slice(0, 3).map((benefit, i) => (
                                    <span 
                                      key={i} 
                                      className={`text-[10px] px-2 py-0.5 rounded-full ${info.bgColor} ${info.textColor} border ${info.borderColor}`}
                                    >
                                      {benefit}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Balance Info */}
              {!isLoading && !boostSuccess && sttBalance && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                  <span className="text-sm text-gray-400">Your STT Balance:</span>
                  <span className="text-sm font-bold text-white">
                    {parseFloat(formatEther(sttBalance.value)).toFixed(2)} STT
                  </span>
                </div>
              )}
            </div>

            {/* Footer */}
            {!boostSuccess && (
              <div className="px-6 py-4 border-t border-slate-700/50 bg-slate-900/50">
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-3 rounded-xl bg-slate-700/50 text-white font-medium hover:bg-slate-600/50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBoost}
                    disabled={!selectedTier || isBoosting || isLoading || !isConnected}
                    className={`
                      flex-1 px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2
                      ${selectedTier 
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:from-yellow-400 hover:to-orange-400' 
                        : 'bg-slate-700/50 text-gray-500 cursor-not-allowed'
                      }
                      ${isBoosting ? 'opacity-50 cursor-wait' : ''}
                    `}
                  >
                    {isBoosting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                        Boosting...
                      </>
                    ) : (
                      <>
                        <BoltIcon className="w-5 h-5" />
                        {selectedTier ? `Boost with ${selectedTier}` : 'Select a Tier'}
                      </>
                    )}
                  </button>
                </div>
                
                {!isConnected && (
                  <p className="text-center text-xs text-red-400 mt-2">
                    Please connect your wallet to boost
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


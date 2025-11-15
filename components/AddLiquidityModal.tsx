"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { 
  XMarkIcon,
  PlusCircleIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from "@heroicons/react/24/outline";
import { useAccount } from "wagmi";
import { usePools } from "@/hooks/usePools";
import { toast } from "react-hot-toast";
import { EnhancedPool } from "./EnhancedPoolCard";

interface AddLiquidityModalProps {
  pool: EnhancedPool;
  isOpen: boolean;
  onClose: () => void;
}

export default function AddLiquidityModal({ pool, isOpen, onClose }: AddLiquidityModalProps) {
  const { address } = useAccount();
  const { addLiquidity, isConfirmed, isPending, hash } = usePools();
  
  const [liquidityAmount, setLiquidityAmount] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);
  const [waitingForApproval, setWaitingForApproval] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  
  // ✅ CRITICAL: Pool data is updated in real-time via EnhancedPoolCard's usePoolProgress hook
  // The pool prop passed to this modal will reflect latest state when LP is added
  
  // ✅ FIX: Auto-close modal when transaction is confirmed
  useEffect(() => {
    if (isConfirmed && hash) {
      console.log('✅ Liquidity transaction confirmed, closing modal');
      setAddSuccess(true);
      setIsAdding(false);
      setWaitingForApproval(false);
      toast.success("Liquidity added successfully! 🎉", { id: 'liquidity-tx' });
      
      // Close after brief success animation
      setTimeout(() => {
        onClose();
        setLiquidityAmount("");
        setAddSuccess(false);
      }, 1500);
    }
  }, [isConfirmed, hash, onClose]);
  
  // ✅ FIX: Track isPending state from usePools
  useEffect(() => {
    if (isPending) {
      setWaitingForApproval(false);
      setIsAdding(true);
    }
  }, [isPending]);
  
  // Reset states when modal closes
  useEffect(() => {
    if (!isOpen) {
      setLiquidityAmount("");
      setAddSuccess(false);
      setIsAdding(false);
      setWaitingForApproval(false);
    }
  }, [isOpen]);
  
  // ✅ DEPRECATED: Old polling logic removed - now using wagmi hooks directly
  /*
  // Poll for transaction success
  useEffect(() => {
    if (!isAdding || addSuccess || initialStake === null) return;
    
    const amountNum = parseFloat(liquidityAmount) || 0;
    if (amountNum === 0) return;
    
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/optimized-pools/pools/${pool.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const newTotalCreatorStake = parseFloat(data.data.pool.creatorStake || "0");
            const stakeIncrease = newTotalCreatorStake - initialStake;
            if (stakeIncrease >= amountNum * 0.95) {
              setAddSuccess(true);
              setIsAdding(false);
              setWaitingForApproval(false);
              toast.success("Liquidity added successfully! 🎉", { id: 'liquidity-tx' });
              
              clearInterval(pollInterval);
              
              setTimeout(() => {
                onClose();
                setLiquidityAmount("");
                setAddSuccess(false);
                setInitialStake(null);
              }, 2500);
            }
          }
        }
      } catch (error) {
        console.warn('Error polling for liquidity confirmation:', error);
      }
    }, 2000);
    
    const timeout = setTimeout(() => {
      clearInterval(pollInterval);
      if (isAdding && !addSuccess) {
        setIsAdding(false);
        setWaitingForApproval(false);
        setInitialStake(null);
      }
    }, 60000);
    
    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [isAdding, addSuccess, pool.id, initialStake, liquidityAmount, onClose]);
  */
  
  // Currency-sensitive quick amounts
  const quickAmounts = pool.usesBitr 
    ? [100, 500, 1000, 2500, 5000, 10000] // BITR amounts
    : [1, 5, 10, 25, 50, 100]; // STT amounts
  
  // Calculate sell odds for display
  const buyOdds = pool.odds ? pool.odds / 100 : 2.0;
  const sellOdds = buyOdds > 1 ? buyOdds / (buyOdds - 1) : 2.0;
  
  const handleAddLiquidity = async () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }
    
    const amount = parseFloat(liquidityAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    try {
      setIsAdding(true);
      setWaitingForApproval(true);
      
      toast.loading('Adding liquidity...', { id: 'liquidity-tx' });
      
      // ✅ FIX: Call addLiquidity and let wagmi hooks handle the rest
      await addLiquidity(pool.id, liquidityAmount, pool.usesBitr);
      
      console.log('💧 Liquidity transaction initiated');
      
      // Let the useEffect handle the rest based on wagmi hooks
    } catch (error: unknown) {
      console.error('Error adding liquidity:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add liquidity. Please try again.';
      toast.error(errorMessage, { id: 'liquidity-tx' });
      setIsAdding(false);
      setWaitingForApproval(false);
    }
  };
  
  const handleClose = useCallback(() => {
    if (!isAdding && !waitingForApproval) {
      onClose();
      setLiquidityAmount("");
      setAddSuccess(false);
    }
  }, [isAdding, waitingForApproval, onClose]);
  
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isAdding && !waitingForApproval) {
        handleClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, isAdding, waitingForApproval, handleClose]);
  
  const isDisabled = isAdding || waitingForApproval || addSuccess || pool.settled || 
    (pool.bettingEndTime ? Date.now() / 1000 > pool.bettingEndTime : false);
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          {/* Modal - Bottom Sheet Style (matching PlaceBetModal) */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ 
              type: "spring",
              damping: 30,
              stiffness: 300
            }}
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-x-0 bottom-0 z-50 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-t-2 border-rose-500/30 rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden"
          >
            {/* Drag Handle */}
            <div className="w-full flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-600 rounded-full" />
            </div>
            
            {/* Header */}
            <div className="px-6 pt-2 pb-4 border-b border-gray-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <PlusCircleIcon className="w-6 h-6 text-rose-400" />
                    Add Liquidity (Sell) Pool #{pool.id}
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Support the creator side
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClose();
                  }}
                  disabled={isAdding || waitingForApproval}
                  className="p-2 rounded-lg hover:bg-gray-700/50 transition-colors disabled:opacity-50"
                >
                  <XMarkIcon className="w-6 h-6 text-gray-400" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(85vh-180px)] px-4 py-3">
              {/* Success Animation */}
              {addSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-green-500/20 via-rose-500/20 to-pink-500/20 backdrop-blur-sm rounded-t-3xl"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 15, stiffness: 200 }}
                    className="text-center"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-green-500/50"
                    >
                      <CheckCircleIcon className="w-12 h-12 text-white" />
                    </motion.div>
                    <motion.h3
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-2xl font-bold text-white mb-2"
                    >
                      Liquidity Added!
                    </motion.h3>
                    <motion.p
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-gray-300"
                    >
                      Your liquidity has been successfully added
                    </motion.p>
                  </motion.div>
                </motion.div>
              )}
              
              {/* Error Animation */}
              {!isAdding && !waitingForApproval && !addSuccess && isDisabled && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2 mb-4"
                >
                  <ExclamationCircleIcon className="w-5 h-5 text-red-400" />
                  <span className="text-sm text-red-300">
                    {pool.settled ? "Pool is settled" : "Betting window is closed"}
                  </span>
                </motion.div>
              )}
              
              <div className="space-y-4">
                {/* Pool Info */}
                <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                  <div className="text-xs text-gray-400 mb-2">Pool</div>
                  <div className="text-sm font-semibold text-white line-clamp-2">
                    {pool.title || `${pool.homeTeam || ""} vs ${pool.awayTeam || ""}`}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <div className="text-xs text-gray-400">Sell Odds</div>
                      <div className="text-lg font-bold text-rose-400">{sellOdds.toFixed(2)}x</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Currency</div>
                      <div className="text-sm font-semibold text-white">{pool.usesBitr ? "BITR" : "STT"}</div>
                    </div>
                  </div>
                </div>
              
                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Amount ({pool.usesBitr ? "BITR" : "STT"})
                  </label>
                  <input
                    type="number"
                    value={liquidityAmount}
                    onChange={(e) => setLiquidityAmount(e.target.value)}
                    placeholder="0.00"
                    disabled={isDisabled}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 disabled:opacity-50"
                  />
                  
                  {/* Quick Amount Buttons */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {quickAmounts.map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setLiquidityAmount(amount.toString())}
                        disabled={isDisabled}
                        className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-300 hover:text-white transition-colors disabled:opacity-50"
                      >
                        {amount}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Status Messages */}
                {waitingForApproval && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg flex items-center gap-2"
                  >
                    <ExclamationCircleIcon className="w-5 h-5 text-blue-400 animate-pulse" />
                    <span className="text-sm text-blue-300">Waiting for approval...</span>
                  </motion.div>
                )}
                
                {/* Action Button */}
                <button
                  onClick={handleAddLiquidity}
                  disabled={isDisabled}
                  className="w-full px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                  {isAdding ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Adding Liquidity...
                    </>
                  ) : (
                    <>
                      <PlusCircleIcon className="w-5 h-5" />
                      Add Liquidity
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


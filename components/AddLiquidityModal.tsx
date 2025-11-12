"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
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
  const { addLiquidity } = usePools();
  
  const [liquidityAmount, setLiquidityAmount] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);
  const [waitingForApproval, setWaitingForApproval] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [initialStake, setInitialStake] = useState<number | null>(null);
  
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
      
      // Get initial stake for comparison
      const response = await fetch(`/api/optimized-pools/pools/${pool.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setInitialStake(parseFloat(data.data.pool.creatorStake || "0"));
        }
      }
      
      toast.loading('Adding liquidity...', { id: 'liquidity-tx' });
      
      await addLiquidity(pool.id, liquidityAmount, pool.usesBitr);
      
    } catch (error: unknown) {
      console.error('Error adding liquidity:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add liquidity. Please try again.';
      toast.error(errorMessage, { id: 'liquidity-tx' });
      setIsAdding(false);
      setWaitingForApproval(false);
      setInitialStake(null);
    }
  };
  
  const isDisabled = isAdding || waitingForApproval || addSuccess || pool.settled || 
    (pool.bettingEndTime ? Date.now() / 1000 > pool.bettingEndTime : false);
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700 rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-500/20 rounded-lg">
                  <PlusCircleIcon className="w-6 h-6 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Add Liquidity (Sell)</h3>
                  <p className="text-xs text-gray-400">Support the creator side</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Pool Info */}
              <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
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
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 disabled:opacity-50"
                />
                
                {/* Quick Amount Buttons */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {quickAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setLiquidityAmount(amount.toString())}
                      disabled={isDisabled}
                      className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-gray-300 hover:text-white transition-colors disabled:opacity-50"
                    >
                      {amount}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Status Messages */}
              {waitingForApproval && (
                <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg flex items-center gap-2">
                  <ExclamationCircleIcon className="w-5 h-5 text-blue-400 animate-pulse" />
                  <span className="text-sm text-blue-300">Waiting for approval...</span>
                </div>
              )}
              
              {addSuccess && (
                <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-green-300">Liquidity added successfully!</span>
                </div>
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


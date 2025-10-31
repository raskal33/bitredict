"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { 
  XMarkIcon,
  BoltIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowTrendingUpIcon
} from "@heroicons/react/24/outline";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { usePools } from "@/hooks/usePools";
import { toast } from "react-hot-toast";
import { EnhancedPool } from "./EnhancedPoolCard";

interface PlaceBetModalProps {
  pool: EnhancedPool;
  isOpen: boolean;
  onClose: () => void;
}

export default function PlaceBetModal({ pool, isOpen, onClose }: PlaceBetModalProps) {
  const { address } = useAccount();
  const router = useRouter();
  const { placeBet } = usePools();
  
  const [betAmount, setBetAmount] = useState<string>("");
  const [isPlacing, setIsPlacing] = useState(false);
  const [waitingForApproval, setWaitingForApproval] = useState(false);
  
  // Currency-sensitive quick amounts
  const quickAmounts = pool.usesBitr 
    ? [100, 500, 1000, 2500, 5000, 10000] // BITR amounts
    : [1, 5, 10, 25, 50, 100]; // STT amounts
  
  // Calculate potential win
  const calculatePotentialWin = (amount: number): number => {
    if (!amount || isNaN(amount)) return 0;
    const oddsDecimal = pool.odds / 100; // Convert 160 -> 1.60
    return amount * oddsDecimal;
  };
  
  // Calculate remaining capacity
  const getRemainingCapacity = (): number => {
    const creatorStake = parseFloat(pool.creatorStake || "0");
    const totalBettorStake = parseFloat(pool.totalBettorStake || "0");
    const oddsDecimal = pool.odds / 100;
    
    // Max bettor stake = (creator stake / (odds - 1))
    const maxBettorStake = creatorStake / (oddsDecimal - 1);
    const remaining = Math.max(0, maxBettorStake - totalBettorStake);
    
    return remaining;
  };
  
  const remainingCapacity = getRemainingCapacity();
  const betAmountNum = parseFloat(betAmount) || 0;
  const potentialWin = calculatePotentialWin(betAmountNum);
  const canPlaceBet = betAmountNum > 0 && betAmountNum <= remainingCapacity && !isPlacing;
  
  // Check if betting window is open
  const now = Date.now() / 1000;
  const isBettingOpen = now < pool.bettingEndTime && !pool.settled;
  
  const handlePlaceBet = async () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }
    
    if (!canPlaceBet) {
      toast.error("Invalid bet amount");
      return;
    }
    
    if (!isBettingOpen) {
      toast.error("Betting window is closed");
      return;
    }
    
    try {
      setIsPlacing(true);
      
      // Show initial loading toast
      toast.loading("Preparing transaction...", { id: 'bet-tx' });
      
      // Call placeBet - it expects human-readable amount string (e.g., "50"), NOT wei
      // The placeBet function in usePools will convert to wei internally using parseUnits
      // For BITR pools, this may return early if approval is needed
      // The usePools hook handles approval flow and transaction feedback automatically
      await placeBet(pool.id, betAmountNum.toString(), pool.usesBitr);
      
      // If we get here and it's a BITR pool, check if we're waiting for approval
      // For BITR pools with insufficient allowance, placeBet returns early
      // and approval is handled automatically by usePools
      if (pool.usesBitr) {
        // Check if approval might be needed - placeBet handles this internally
        // We'll show a waiting state and let the approval flow complete
        setWaitingForApproval(true);
        toast.loading("Approval may be required. Please confirm in your wallet...", { id: 'bet-tx' });
        
        // Don't close immediately - wait for transaction to complete
        // The usePools hook will show success/error feedback
        // We'll reset after a delay to allow transaction to process
        setTimeout(() => {
          setWaitingForApproval(false);
          setIsPlacing(false);
        }, 5000);
      } else {
        // For STT pools, transaction should complete immediately
        toast.success("Bet placed successfully! 🎉", { id: 'bet-tx' });
        setTimeout(() => {
          onClose();
          setBetAmount("");
          setIsPlacing(false);
        }, 2000);
      }
    } catch (error: unknown) {
      console.error("Error placing bet:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to place bet";
      toast.error(errorMessage, { id: 'bet-tx' });
      setIsPlacing(false);
      setWaitingForApproval(false);
    }
  };
  
  const handleQuickAmount = (amount: number) => {
    setBetAmount(amount.toString());
  };
  
  // Format quick amount for display
  const formatQuickAmount = (amount: number): string => {
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}K`;
    }
    return amount.toString();
  };
  
  const handleClose = useCallback(() => {
    if (!isPlacing && !waitingForApproval) {
      onClose();
      setBetAmount("");
    }
  }, [isPlacing, waitingForApproval, onClose]);
  
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isPlacing && !waitingForApproval) {
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
  }, [isOpen, isPlacing, waitingForApproval, handleClose]);
  
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
          
          {/* Modal */}
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
            className="fixed inset-x-0 bottom-0 z-50 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-t-2 border-primary/30 rounded-t-3xl shadow-2xl max-h-[90vh] overflow-hidden"
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
                    <BoltIcon className="w-6 h-6 text-primary" />
                    Challenge Pool #{pool.id}
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Place your bet to challenge the creator
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClose();
                  }}
                  disabled={isPlacing || waitingForApproval}
                  className="p-2 rounded-lg hover:bg-gray-700/50 transition-colors disabled:opacity-50"
                >
                  <XMarkIcon className="w-6 h-6 text-gray-400" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-200px)] px-6 py-6">
              {/* Pool Info Card */}
              <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl p-4 mb-6 border border-primary/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 mb-1">Prediction</p>
                    <p className="text-sm font-semibold text-white line-clamp-2">
                      {pool.title || `${pool.homeTeam} vs ${pool.awayTeam}`}
                    </p>
                  </div>
                  {/* View More Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                      router.push(`/bet/${pool.id}`);
                    }}
                    className="ml-4 px-4 py-2 text-xs font-bold bg-gradient-to-r from-primary to-secondary text-black hover:from-primary/90 hover:to-secondary/90 rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-primary/20 whitespace-nowrap"
                  >
                    View More
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Odds</p>
                    <p className="text-lg font-bold text-primary">
                      {(pool.odds / 100).toFixed(2)}x
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Your Potential Win</p>
                    <p className="text-lg font-bold text-green-400">
                      {potentialWin.toFixed(2)} {pool.usesBitr ? 'BITR' : 'STT'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Bet Amount Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bet Amount ({pool.usesBitr ? 'BITR' : 'STT'})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                    placeholder="0.00"
                    disabled={isPlacing || !isBettingOpen}
                    className="w-full px-4 py-4 text-2xl font-bold text-white bg-gray-800/50 border-2 border-gray-700 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                    {pool.usesBitr ? 'BITR' : 'STT'}
                  </div>
                </div>
                
                {/* Quick Amount Buttons */}
                <div className="grid grid-cols-6 gap-2 mt-3">
                  {quickAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickAmount(amount);
                      }}
                      disabled={isPlacing || !isBettingOpen || amount > remainingCapacity}
                      className="px-2 py-2 text-xs font-medium bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 rounded-lg text-gray-300 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      title={`${amount} ${pool.usesBitr ? 'BITR' : 'STT'}`}
                    >
                      {formatQuickAmount(amount)}
                    </button>
                  ))}
                </div>
                
                {/* Remaining Capacity */}
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-gray-400">Remaining Capacity</span>
                  <span className="text-gray-300 font-medium">
                    {remainingCapacity.toFixed(2)} {pool.usesBitr ? 'BITR' : 'STT'}
                  </span>
                </div>
              </div>
              
              {/* Bet Summary */}
              {betAmountNum > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-4 mb-6 border border-gray-700/30"
                >
                  <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                    <ArrowTrendingUpIcon className="w-4 h-4" />
                    Bet Summary
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Your Bet</span>
                      <span className="text-white font-medium">
                        {betAmountNum.toFixed(2)} {pool.usesBitr ? 'BITR' : 'STT'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Odds</span>
                      <span className="text-white font-medium">
                        {(pool.odds / 100).toFixed(2)}x
                      </span>
                    </div>
                    <div className="border-t border-gray-700/30 pt-2 mt-2 flex justify-between">
                      <span className="text-gray-300 font-semibold">Potential Win</span>
                      <span className="text-green-400 font-bold text-lg">
                        {potentialWin.toFixed(2)} {pool.usesBitr ? 'BITR' : 'STT'}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>Profit</span>
                      <span className="text-green-400">
                        +{(potentialWin - betAmountNum).toFixed(2)} {pool.usesBitr ? 'BITR' : 'STT'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* Warnings/Errors */}
              {!isBettingOpen && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg mb-4">
                  <ExclamationCircleIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-400">
                    Betting window is closed for this pool
                  </p>
                </div>
              )}
              
              {betAmountNum > 0 && betAmountNum > remainingCapacity && (
                <div className="flex items-center gap-2 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg mb-4">
                  <ExclamationCircleIcon className="w-5 h-5 text-orange-400 flex-shrink-0" />
                  <p className="text-sm text-orange-400">
                    Maximum bet amount is {remainingCapacity.toFixed(2)} {pool.usesBitr ? 'BITR' : 'STT'}
                  </p>
                </div>
              )}
              
              {!address && (
                <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg mb-4">
                  <ExclamationCircleIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <p className="text-sm text-blue-400">
                    Please connect your wallet to place a bet
                  </p>
                </div>
              )}
              
              {waitingForApproval && (
                <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mb-4">
                  <ExclamationCircleIcon className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  <p className="text-sm text-yellow-400">
                    Waiting for approval confirmation. Please confirm the transaction in your wallet.
                  </p>
                </div>
              )}
            </div>
            
            {/* Footer / Action Button */}
            <div className="px-6 py-4 border-t border-gray-700/50 bg-gray-900/50">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlaceBet();
                }}
                disabled={!canPlaceBet || !address || !isBettingOpen || isPlacing || waitingForApproval}
                className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-black font-bold text-lg rounded-xl hover:from-primary/90 hover:to-secondary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                {waitingForApproval ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Waiting for Approval...</span>
                  </>
                ) : isPlacing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Placing Bet...</span>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-6 h-6" />
                    <span>Place Bet & Challenge</span>
                  </>
                )}
              </button>
              
              <p className="text-xs text-center text-gray-400 mt-3">
                By placing a bet, you agree to challenge the creator&apos;s prediction
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


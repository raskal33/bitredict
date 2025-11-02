"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { 
  XMarkIcon,
  BoltIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
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
  const [betSuccess, setBetSuccess] = useState(false);
  const [initialStake, setInitialStake] = useState<number | null>(null);
  
  // ✅ FIX: Poll for transaction success since usePools doesn't expose hash directly
  useEffect(() => {
    if (!isPlacing || betSuccess || initialStake === null) return;
    
    const betAmountNum = parseFloat(betAmount) || 0;
    if (betAmountNum === 0) return;
    
    // Poll for transaction completion every 2 seconds
    const pollInterval = setInterval(async () => {
      try {
        // Refetch pool data to check if bet was placed
        // If totalBettorStake increased by at least our bet amount, transaction succeeded
        const response = await fetch(`/api/optimized-pools/pools/${pool.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const newTotalBettorStake = parseFloat(data.data.pool.totalBettorStake || "0");
            
            // If bet stake increased by at least our bet amount (with small tolerance), transaction succeeded
            const stakeIncrease = newTotalBettorStake - initialStake;
            if (stakeIncrease >= betAmountNum * 0.95) { // Allow 5% tolerance for rounding
              setBetSuccess(true);
              setIsPlacing(false);
              setWaitingForApproval(false);
              toast.success("Bet placed successfully! 🎉", { id: 'bet-tx' });
              
              clearInterval(pollInterval);
              
              // Close after success animation
              setTimeout(() => {
                onClose();
                setBetAmount("");
                setBetSuccess(false);
                setInitialStake(null);
              }, 2500);
            }
          }
        }
      } catch (error) {
        console.warn('Error polling for bet confirmation:', error);
      }
    }, 2000);
    
    // Stop polling after 60 seconds (timeout)
    const timeout = setTimeout(() => {
      clearInterval(pollInterval);
      if (isPlacing && !betSuccess) {
        // Still waiting - don't error, just stop polling
        // The usePools hook will show error if transaction failed
        setIsPlacing(false);
        setWaitingForApproval(false);
        setInitialStake(null);
      }
    }, 60000);
    
    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [isPlacing, betSuccess, pool.id, initialStake, betAmount, onClose]);
  
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
      // Store initial stake before placing bet
      const currentStake = parseFloat(pool.totalBettorStake || "0");
      setInitialStake(currentStake);
      
      setIsPlacing(true);
      
      // Show initial loading toast
      toast.loading("Preparing transaction...", { id: 'bet-tx' });
      
      // Call placeBet - it expects human-readable amount string (e.g., "50"), NOT wei
      // The placeBet function in usePools will convert to wei internally using parseUnits
      // For BITR pools, this may return early if approval is needed
      // The usePools hook handles approval flow and transaction feedback automatically
      await placeBet(pool.id, betAmountNum.toString(), pool.usesBitr);
      
      // ✅ FIX: For both BITR and STT pools, poll for transaction success
      // The useEffect above will detect when the bet is placed by checking pool progress
      if (pool.usesBitr) {
        // For BITR pools, might need approval - wait for approval confirmation
        setWaitingForApproval(true);
        toast.loading("Approval may be required. Please confirm in your wallet...", { id: 'bet-tx' });
      } else {
        // For STT pools, transaction should be immediate
        // Poll for success via useEffect above
        toast.loading("Waiting for transaction confirmation...", { id: 'bet-tx' });
      }
      
    } catch (error: unknown) {
      console.error("Error placing bet:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to place bet";
      toast.error(errorMessage, { id: 'bet-tx' });
      setIsPlacing(false);
      setWaitingForApproval(false);
      setInitialStake(null);
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
            className="fixed inset-x-0 bottom-0 z-50 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-t-2 border-primary/30 rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden"
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
            <div className="overflow-y-auto max-h-[calc(85vh-180px)] px-4 py-3">
              {/* Success Animation */}
              {betSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-green-500/20 via-primary/20 to-secondary/20 backdrop-blur-sm rounded-t-3xl"
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
                      Bet Placed! 🎉
                    </motion.h3>
                    <motion.p
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-green-400 font-medium"
                    >
                      Your challenge is on!
                    </motion.p>
                    <motion.p
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-gray-300 text-sm mt-2"
                    >
                      Potential win: {potentialWin.toFixed(2)} {pool.usesBitr ? 'BITR' : 'STT'}
                    </motion.p>
                  </motion.div>
                </motion.div>
              )}
              
              {/* Pool Info Card */}
              <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl p-3 mb-3 border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-400 mb-0.5">Prediction</p>
                    <p className="text-xs font-semibold text-white line-clamp-1">
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
                    className="ml-3 px-3 py-1.5 text-[10px] font-bold bg-gradient-to-r from-primary to-secondary text-black hover:from-primary/90 hover:to-secondary/90 rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-primary/20 whitespace-nowrap"
                  >
                    View More
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <p className="text-[10px] text-gray-400 mb-0.5">Odds</p>
                    <p className="text-base font-bold text-primary">
                      {(pool.odds / 100).toFixed(2)}x
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 mb-0.5">Potential Win</p>
                    <p className="text-base font-bold text-green-400">
                      {potentialWin.toFixed(2)} {pool.usesBitr ? 'BITR' : 'STT'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Bet Amount Input */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
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
                    disabled={isPlacing || !isBettingOpen || betSuccess}
                    className="w-full px-3 py-2.5 text-lg font-bold text-white bg-gray-800/50 border-2 border-gray-700 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    {pool.usesBitr ? 'BITR' : 'STT'}
                  </div>
                </div>
                
                {/* Quick Amount Buttons */}
                <div className="grid grid-cols-6 gap-1.5 mt-2">
                  {quickAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickAmount(amount);
                      }}
                      disabled={isPlacing || !isBettingOpen || amount > remainingCapacity || betSuccess}
                      className="px-1.5 py-1.5 text-[10px] font-medium bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 rounded-md text-gray-300 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      title={`${amount} ${pool.usesBitr ? 'BITR' : 'STT'}`}
                    >
                      {formatQuickAmount(amount)}
                    </button>
                  ))}
                </div>
                
                {/* Remaining Capacity */}
                <div className="mt-1.5 flex items-center justify-between text-[10px]">
                  <span className="text-gray-400">Remaining</span>
                  <span className="text-gray-300 font-medium">
                    {remainingCapacity.toFixed(2)} {pool.usesBitr ? 'BITR' : 'STT'}
                  </span>
                </div>
              </div>
              
              {/* Bet Summary - Compact */}
              {betAmountNum > 0 && !betSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-lg p-2.5 mb-3 border border-gray-700/30"
                >
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div>
                      <span className="text-gray-400">Bet:</span>
                      <span className="text-white font-medium ml-1">
                        {betAmountNum.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Odds:</span>
                      <span className="text-white font-medium ml-1">
                        {(pool.odds / 100).toFixed(2)}x
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Win:</span>
                      <span className="text-green-400 font-bold ml-1">
                        {potentialWin.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* Warnings/Errors - Compact */}
              {!isBettingOpen && (
                <div className="flex items-center gap-1.5 p-2 bg-red-500/10 border border-red-500/30 rounded-lg mb-2">
                  <ExclamationCircleIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-xs text-red-400">
                    Betting window is closed
                  </p>
                </div>
              )}
              
              {betAmountNum > 0 && betAmountNum > remainingCapacity && (
                <div className="flex items-center gap-1.5 p-2 bg-orange-500/10 border border-orange-500/30 rounded-lg mb-2">
                  <ExclamationCircleIcon className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  <p className="text-xs text-orange-400">
                    Max: {remainingCapacity.toFixed(2)} {pool.usesBitr ? 'BITR' : 'STT'}
                  </p>
                </div>
              )}
              
              {!address && (
                <div className="flex items-center gap-1.5 p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg mb-2">
                  <ExclamationCircleIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <p className="text-xs text-blue-400">
                    Connect wallet to place bet
                  </p>
                </div>
              )}
              
              {waitingForApproval && (
                <div className="flex items-center gap-1.5 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mb-2">
                  <ExclamationCircleIcon className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                  <p className="text-xs text-yellow-400">
                    Waiting for approval confirmation...
                  </p>
                </div>
              )}
            </div>
            
            {/* Footer / Action Button */}
            <div className="px-4 py-3 border-t border-gray-700/50 bg-gray-900/50">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlaceBet();
                }}
                disabled={!canPlaceBet || !address || !isBettingOpen || isPlacing || waitingForApproval || betSuccess}
                className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-black font-bold text-base rounded-xl hover:from-primary/90 hover:to-secondary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                {waitingForApproval ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Waiting for Approval...</span>
                  </>
                ) : isPlacing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Placing Bet...</span>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-5 h-5" />
                    <span>Place Bet & Challenge</span>
                  </>
                )}
              </button>
              
              <p className="text-[10px] text-center text-gray-400 mt-2">
                By placing a bet, you agree to challenge the creator&apos;s prediction
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


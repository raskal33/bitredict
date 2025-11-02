"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { CurrencyDollarIcon as CurrencySolid } from "@heroicons/react/24/solid";
import { useAccount } from "wagmi";
import { toast } from "react-hot-toast";
import Button from "@/components/button";
import AnimatedTitle from "@/components/AnimatedTitle";
import LoadingSpinner from "@/components/LoadingSpinner";
import AmountInput from "@/components/AmountInput";
import { useStaking, DurationOption, StakeWithRewards } from "@/hooks/useStaking";
import { useBITRToken } from "@/hooks/useBITRToken";
import { useTransactionFeedback, TransactionFeedback } from "@/components/TransactionFeedback";
import { CONTRACTS } from "@/contracts";
import { parseUnits } from "viem";
import { IoMdLock } from "react-icons/io";
import { isBigIntZero } from "@/utils/bigint-helpers";
import { formatPercentage } from "@/utils/number-helpers";
import { 
  FaTrophy, 
  FaChartLine, 
  FaCoins, 
  FaCrown, 
  FaStar, 
  FaGem, 
  FaClock,
  FaMoneyBillWave
} from "react-icons/fa";
import { BoltIcon as BoltSolid } from "@heroicons/react/24/solid";

const TIER_ICONS = [FaCoins, FaStar, FaTrophy, FaCrown, FaGem];
const TIER_COLORS = [
  "text-orange-400", // Bronze
  "text-gray-400",   // Silver  
  "text-yellow-400", // Gold
  "text-purple-400", // Platinum
  "text-blue-400"    // Diamond
];

export default function StakingPage() {
  const { isConnected } = useAccount();
  // const [activeTab, setActiveTab] = useState("stake"); // TODO: Implement tabs
  const [stakeAmount, setStakeAmount] = useState("");
  const [selectedTier, setSelectedTier] = useState(0);
  const [selectedDuration, setSelectedDuration] = useState<DurationOption>(DurationOption.THIRTY_DAYS);
  const [needsApproval, setNeedsApproval] = useState(false);
  const isMountedRef = useRef(true);
  
  // Smart contract hooks
  const staking = useStaking();
  const token = useBITRToken();
  
  // Transaction feedback system
  const { transactionStatus, showSuccess, showError, showInfo, clearStatus } = useTransactionFeedback();





  // Comprehensive safety check for all staking data
  const isDataLoaded = () => {
    return staking.tiers && 
           Array.isArray(staking.tiers) && 
           staking.tiers.length > 0 &&
           staking.durationOptions &&
           Array.isArray(staking.durationOptions) &&
           staking.durationOptions.length > 0;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Check if approval is needed
  useEffect(() => {
    if (stakeAmount && token.balance && isMountedRef.current) {
      const allowance = token.getAllowance(CONTRACTS.BITREDICT_STAKING.address);
      const stakeAmountWei = parseUnits(stakeAmount, 18);
      setNeedsApproval(!allowance || (allowance as bigint) < stakeAmountWei);
    }
  }, [stakeAmount, token, token.balance, token.stakingAllowance]);

  // Auto tier selection based on stake amount
  useEffect(() => {
    if (stakeAmount && staking.tiers && staking.tiers.length > 0 && isMountedRef.current) {
      const amount = parseFloat(stakeAmount);
      if (amount > 0) {
        // Find the highest tier the user can access
        let selectedTierIndex = 0;
        for (let i = staking.tiers.length - 1; i >= 0; i--) {
          const tier = staking.tiers[i];
          if (tier && tier.minStake) {
            const minStakeAmount = parseFloat(staking.formatAmount(tier.minStake));
            if (amount >= minStakeAmount) {
              selectedTierIndex = i;
              break;
            }
          }
        }
        setSelectedTier(selectedTierIndex);
      }
    }
  }, [stakeAmount, staking.tiers, staking]);

  // Refresh allowance when approval is confirmed
  useEffect(() => {
    if (token.isConfirmed && isMountedRef.current) {
      token.refetchAll();
      toast.success("Approval confirmed! 🎉");
      setNeedsApproval(false);
    }
  }, [token.isConfirmed, token]);

  // ✅ FIX: Watch for successful transactions with proper cleanup
  useEffect(() => {
    if (staking.isConfirmed && isMountedRef.current) {
      // Determine which transaction was confirmed based on the transaction state
      if (staking.claimingStakeIndex !== null) {
        toast.success("Rewards claimed successfully! 🎉");
      } else if (staking.unstakingStakeIndex !== null) {
        toast.success("Stake unstaked successfully! 🎉");
      } else if (staking.isClaimingRevenue) {
        toast.success("Revenue share claimed successfully! 🎉");
      } else if (staking.isStaking) {
        toast.success("Stake created successfully! 🎉");
      } else {
        toast.success("Transaction confirmed! 🎉");
      }
      
      // ✅ FIX: Delay refetch to avoid React error #185 (state updates during render)
      // The hook's useEffect already calls refetchAll, so we only need to refetch balance here
      const timeoutId = setTimeout(() => {
        if (isMountedRef.current) {
          try {
            token.refetchBalance();
          } catch (error) {
            console.error('Error refetching token balance:', error);
          }
        }
      }, 200); // Delay to allow hook's refetch to complete first
      
      return () => clearTimeout(timeoutId);
    }
  }, [staking.isConfirmed, staking.claimingStakeIndex, staking.unstakingStakeIndex, staking.isClaimingRevenue, staking.isStaking, token, isMountedRef]);

  // ✅ FIX: Handle transaction state changes with proper cleanup
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    if (staking.isPending) {
      showInfo("Transaction Pending", "Please confirm the transaction in your wallet...");
    } else if (staking.isConfirmed && staking.hash) {
      // ✅ FIX: Delay success message to avoid React error #185
      const timeoutId = setTimeout(() => {
        if (isMountedRef.current) {
          showSuccess("Transaction Successful", "Transaction completed successfully!", staking.hash);
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [staking.isPending, staking.isConfirmed, staking.hash, showInfo, showSuccess, isMountedRef]);

  // Handle token approval state changes
  useEffect(() => {
    if (token.isPending && isMountedRef.current) {
      showInfo("Approval Pending", "Please confirm the approval transaction in your wallet...");
    } else if (token.isConfirmed && isMountedRef.current) {
      showSuccess("Approval Successful", "Successfully approved BITR for staking", token.hash);
    }
  }, [token.isPending, token.isConfirmed, token.hash, showInfo, showSuccess]);

  // Show loading state if data is not ready
  if (!isDataLoaded()) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center"
        >
          <LoadingSpinner size="lg" />
          <h2 className="text-2xl font-bold text-white mt-4">Loading Staking Data</h2>
          <p className="text-gray-300 mt-2">
            Please wait while we load the staking information...
          </p>
        </motion.div>
      </div>
    );
  }

  // Handle revenue share claim
  const handleClaimRevenueShare = async () => {
    try {
      await staking.claimRevenueShare();
    } catch (error: unknown) {
      showError("Revenue Share Claim Failed", (error as Error).message || "Failed to claim revenue share. Please try again.");
    }
  };

  // Handle BITR approval for staking
  const handleApprove = async () => {
    try {
      if (!stakeAmount) {
        showError("Approval Failed", "Please enter a stake amount first.");
        return;
      }

      const stakeAmountWei = parseUnits(stakeAmount, 18);
      await token.approve(CONTRACTS.BITREDICT_STAKING.address, stakeAmountWei.toString());
      showSuccess("Approval Successful", "BITR tokens approved for staking. You can now create your stake.");
      
      // Reset approval state after successful approval
      setNeedsApproval(false);
    } catch (error: unknown) {
      showError("Approval Failed", (error as Error).message || "Failed to approve BITR tokens. Please try again.");
    }
  };

  // Handle staking
  const handleStake = async () => {
    try {
      if (!stakeAmount) {
        showError("Staking Failed", "Please enter a stake amount.");
        return;
      }

      if (!staking.canStakeInTier(selectedTier, stakeAmount)) {
        showError("Staking Failed", "Stake amount does not meet the minimum requirement for the selected tier.");
        return;
      }

      await staking.stake(stakeAmount, selectedTier, selectedDuration);
      showSuccess("Staking Successful", "Your stake has been created successfully!");
      
      // Reset form after successful staking
      setStakeAmount("");
      setSelectedTier(0);
      setSelectedDuration(DurationOption.THIRTY_DAYS);
    } catch (error: unknown) {
      showError("Staking Failed", (error as Error).message || "Failed to create stake. Please try again.");
    }
  };

  // ✅ FIX: Handle individual stake actions with better error handling
  const handleClaimStakeRewards = async (stakeIndex: number) => {
    try {
      console.log('Claim button clicked for stake:', stakeIndex);
      if (staking.userStakesWithRewards[stakeIndex]) {
        console.log('Pending rewards:', staking.userStakesWithRewards[stakeIndex].pendingRewards.toString());
      }
      await staking.claimStakeRewards(stakeIndex);
    } catch (error: unknown) {
      console.error('Error claiming stake rewards:', error);
      showError("Claim Failed", (error as Error).message || "Failed to claim rewards. Please try again.");
      // ✅ FIX: Reset claiming state on error
      if (staking.claimingStakeIndex === stakeIndex) {
        // State will be reset by hook's error handling
      }
    }
  };

  const handleUnstakeSpecific = async (stakeIndex: number) => {
    try {
      console.log('Unstake button clicked for stake:', stakeIndex);
      await staking.unstakeSpecific(stakeIndex);
    } catch (error: unknown) {
      console.error('Error unstaking:', error);
      showError("Unstake Failed", (error as Error).message || "Failed to unstake. Please try again.");
      // ✅ FIX: Reset unstaking state on error
      if (staking.unstakingStakeIndex === stakeIndex) {
        // State will be reset by hook's error handling
      }
    }
  };

  const TierIcon = TIER_ICONS[staking.userTier] || FaCoins;
  const tierColor = TIER_COLORS[staking.userTier] || "text-gray-400";

  const getProgressToNextTier = (): number => {
    if (!staking.tiers || staking.tiers.length === 0 || staking.userTier >= staking.tiers.length - 1) {
      return 100; // Max tier reached
    }
    
    const currentTier = staking.tiers[staking.userTier];
    const nextTier = staking.tiers[staking.userTier + 1];
    
    if (!currentTier || !nextTier) {
      return 100; // Safety fallback
    }
    
    const currentThreshold = currentTier.minStake;
    const nextThreshold = nextTier.minStake;
    const currentStaked = parseUnits(staking.totalUserStaked || "0", 18);
    
    if (currentStaked <= currentThreshold) return 0;
    
    const progress = Number(currentStaked - currentThreshold) / Number(nextThreshold - currentThreshold);
    return Math.min(100, progress * 100);
  };

  const formatTimeRemaining = (unlockTime: number): string => {
    const now = Date.now();
    if (now >= unlockTime) return "Unlocked";
    
    const remaining = unlockTime - now;
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };



  if (!isConnected) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center"
        >
          <BoltSolid className="h-16 w-16 text-purple-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
          <p className="text-gray-300 mb-6">
            Connect your wallet to start staking BITR tokens and earn rewards.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-main">
      {/* Transaction Feedback */}
      <TransactionFeedback
        status={transactionStatus}
        onClose={clearStatus}
        autoClose={true}
        autoCloseDelay={5000}
      />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8 p-6"
      >
      {/* Header */}
      <AnimatedTitle 
        size="md"
        leftIcon={BoltSolid}
        rightIcon={CurrencySolid}
      >
        BITR Staking
            </AnimatedTitle>
      
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-base text-text-secondary max-w-2xl mx-auto text-center mb-6"
      >
        Stake your BITR tokens to earn rewards and unlock exclusive tiers. Higher tiers provide better rewards and platform benefits.
      </motion.p>

        {/* Staking Information Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
          {/* Tiers Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border border-orange-500/20 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <FaTrophy className="h-6 w-6 text-orange-400" />
              <h3 className="text-xl font-bold text-white">Staking Tiers</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-orange-400 font-medium">🥉 Bronze</span>
                <div className="text-right">
                  <div className="text-white font-semibold">6% APY</div>
                  <div className="text-gray-400 text-sm">1,000+ BITR</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300 font-medium">🥈 Silver</span>
                <div className="text-right">
                  <div className="text-white font-semibold">12% APY</div>
                  <div className="text-gray-400 text-sm">3,000+ BITR</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-yellow-400 font-medium">🥇 Gold</span>
                <div className="text-right">
                  <div className="text-white font-semibold">18% APY</div>
                  <div className="text-gray-400 text-sm">10,000+ BITR</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Duration Bonuses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <FaClock className="h-6 w-6 text-blue-400" />
              <h3 className="text-xl font-bold text-white">Duration Bonuses</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-blue-300">3 Days</span>
                <span className="text-white font-semibold">+0% Bonus</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-300">5 Days</span>
                <span className="text-white font-semibold">+2% Bonus</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-300">7 Days</span>
                <span className="text-white font-semibold">+4% Bonus</span>
              </div>
            </div>
          </motion.div>

          {/* Revenue Sharing */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-green-500/10 to-teal-500/10 border border-green-500/20 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <FaMoneyBillWave className="h-6 w-6 text-green-400" />
              <h3 className="text-xl font-bold text-white">Revenue Share</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-orange-400">Bronze</span>
                <span className="text-white font-semibold">10% Share</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Silver</span>
                <span className="text-white font-semibold">30% Share</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-yellow-400">Gold</span>
                <span className="text-white font-semibold">60% Share</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Monthly distribution of platform revenue in BITR + STT
            </p>
          </motion.div>
        </div>

        {/* How It Works Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-600/20 rounded-2xl p-8 mb-12"
        >
          <h3 className="text-2xl font-bold text-white mb-6 text-center">How Staking Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-500/20 rounded-xl p-4 mb-4">
                <FaCoins className="h-8 w-8 text-blue-400 mx-auto" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">1. Stake BITR</h4>
              <p className="text-gray-300 text-sm">
                Choose your amount, tier, and lock duration. Higher amounts and longer durations yield better rewards.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-500/20 rounded-xl p-4 mb-4">
                <FaChartLine className="h-8 w-8 text-green-400 mx-auto" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">2. Earn Rewards</h4>
              <p className="text-gray-300 text-sm">
                Receive daily BITR rewards based on your tier&apos;s APY plus duration bonuses. Claim anytime.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-500/20 rounded-xl p-4 mb-4">
                <FaMoneyBillWave className="h-8 w-8 text-purple-400 mx-auto" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">3. Revenue Share</h4>
              <p className="text-gray-300 text-sm">
                Monthly distribution of platform fees (BITR + STT) proportional to your tier and stake size.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-orange-500/20 rounded-xl p-4 mb-4">
                <IoMdLock className="h-8 w-8 text-orange-400 mx-auto" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">4. Unstake</h4>
              <p className="text-gray-300 text-sm">
                Withdraw your principal + unclaimed rewards after the lock period ends. Early unstaking forfeits rewards.
              </p>
            </div>
          </div>
          
          <div className="mt-8 p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <h4 className="text-lg font-semibold text-yellow-400 mb-3">📋 Important Notes</h4>
            <ul className="text-gray-300 space-y-2 text-sm">
              <li>• <strong>Claiming:</strong> Rewards can be claimed at any time without penalty</li>
              <li>• <strong>Revenue Share:</strong> Distributed monthly on the 1st, claim when available</li>
              <li>• <strong>Unstaking:</strong> Only possible after lock period expires, includes all unclaimed rewards</li>
              <li>• <strong>Early Exit:</strong> Unstaking before expiry forfeits all pending rewards</li>
              <li>• <strong>Gas Fees:</strong> All transactions require STT for gas on Somnia Network</li>
            </ul>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Staking Panel */}
                      <div className="lg:col-span-2 space-y-6 md:space-y-8">
            {/* User Stats Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <TierIcon className={`h-8 w-8 ${tierColor}`} />
                  </div>
                  <p className="text-gray-400 text-sm">Current Tier</p>
                  <p className="text-2xl font-bold text-white">{staking.userTierName}</p>
                </div>
                
                <div className="text-center">
                  <FaCoins className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Total Staked</p>
                  <p className="text-2xl font-bold text-white">{staking.totalUserStaked} BITR</p>
                </div>
                
                <div className="text-center">
                  <FaChartLine className="h-8 w-8 text-green-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Total Rewards</p>
                  <p className="text-2xl font-bold text-white">{staking.totalPendingRewards} BITR</p>
                </div>

                <div className="text-center">
                  <FaMoneyBillWave className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Active Stakes</p>
                  <p className="text-2xl font-bold text-white">{staking.userStakesWithRewards?.length || 0}</p>
                </div>
              </div>

              {/* Progress to Next Tier */}
              {staking.userTier < (staking.tiers?.length || 0) - 1 && (
                <div className="mt-8 p-6 bg-black/20 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">Progress to {staking.getTierName(staking.userTier + 1)}</span>
                    <span className="text-gray-300">{formatPercentage(getProgressToNextTier())}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getProgressToNextTier()}%` }}
                    />
                  </div>
                  <p className="text-gray-400 text-sm mt-2">
                    Need {staking.nextTierThreshold} BITR to reach next tier
                  </p>
                </div>
              )}
            </motion.div>

            {/* Revenue Sharing Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
            >
              <h3 className="text-2xl font-bold text-white mb-6">Revenue Sharing</h3>
              {/* ✅ FIX: Debug info for revenue share */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mb-4 p-3 bg-black/20 rounded-lg text-xs text-gray-400">
                  <div>Raw BITR: {staking.pendingRevenueBITR_raw?.toString() || '0'}</div>
                  <div>Raw STT: {staking.pendingRevenueSTT_raw?.toString() || '0'}</div>
                  <div>Address: {staking.userStakes?.length > 0 ? 'Stakes exist' : 'No stakes'}</div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <FaCoins className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Pending BITR</p>
                  <p className="text-xl font-bold text-white">
                    {staking.pendingRevenueBITR || '0'}
                  </p>
                </div>
                
                <div className="text-center">
                  <FaGem className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Pending STT</p>
                  <p className="text-xl font-bold text-white">
                    {staking.pendingRevenueSTT || '0'}
                  </p>
                </div>

                <div className="flex items-center">
                  <Button
                    onClick={handleClaimRevenueShare}
                    disabled={
                      (parseFloat(staking.pendingRevenueBITR) === 0 && parseFloat(staking.pendingRevenueSTT) === 0) ||
                      staking.isClaimingRevenue ||
                      staking.isPending ||
                      staking.isConfirming
                    }
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  >
                    {staking.isClaimingRevenue || staking.isPending || staking.isConfirming ? (
                      <div className="flex items-center justify-center gap-2">
                        <LoadingSpinner size="sm" />
                        Claiming...
                      </div>
                    ) : (
                      "Claim Revenue"
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Individual Stakes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
            >
              <h3 className="text-2xl font-bold text-white mb-6">Your Stakes</h3>
              
              {staking.userStakesWithRewards.length === 0 ? (
                <div className="text-center py-12">
                  <IoMdLock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-bold text-white mb-2">No Stakes Yet</h4>
                  <p className="text-gray-400">Create your first stake to start earning rewards</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {staking.userStakesWithRewards.map((stake: StakeWithRewards) => (
                    <div key={stake.index} className="bg-black/20 rounded-xl p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-lg font-bold text-white">
                              Stake #{stake.index + 1}
                            </h4>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              stake.canUnstake ? "bg-green-500/20 text-green-400" : "bg-orange-500/20 text-orange-400"
                            }`}>
                              {stake.canUnstake ? "Unlocked" : "Locked"}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-400">Amount</p>
                              <p className="text-white font-medium">{staking.formatAmount(stake.amount)} BITR</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Tier</p>
                              <p className="text-white font-medium">{staking.getTierName(stake.tierId)}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Duration</p>
                              <p className="text-white font-medium">{staking.getDurationName(stake.durationOption)}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">APY</p>
                              <p className="text-green-400 font-medium">{formatPercentage(stake.currentAPY, 2)}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-gray-400">
                            <FaClock className="h-4 w-4" />
                            <span>{stake.canUnstake ? "Ready to unstake" : formatTimeRemaining(stake.unlockTime)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-green-400">
                            <FaCoins className="h-4 w-4" />
                            <span>{staking.formatReward(stake.pendingRewards)} BITR pending</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          onClick={() => {
                            console.log('Claim button clicked for stake:', stake.index);
                            console.log('Pending rewards:', stake.pendingRewards.toString());
                            handleClaimStakeRewards(stake.index);
                          }}
                          disabled={
                            isBigIntZero(stake.pendingRewards) ||
                            staking.claimingStakeIndex !== null ||
                            staking.isPending ||
                            staking.isConfirming
                          }
                          className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                          {staking.claimingStakeIndex === stake.index ? (
                            <div className="flex items-center justify-center gap-2">
                              <LoadingSpinner size="sm" />
                              Claiming...
                            </div>
                          ) : (
                            `Claim ${staking.formatAmount(stake.pendingRewards)} BITR`
                          )}
                        </Button>
                        <Button
                          onClick={() => handleUnstakeSpecific(stake.index)}
                          disabled={
                            !stake.canUnstake ||
                            staking.unstakingStakeIndex !== null ||
                            staking.isPending ||
                            staking.isConfirming
                          }
                          className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                          {staking.unstakingStakeIndex === stake.index ? (
                            <div className="flex items-center justify-center gap-2">
                              <LoadingSpinner size="sm" />
                              Unstaking...
                            </div>
                          ) : stake.canUnstake ? "Unstake" : "Locked"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Create New Stake Panel */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 sticky top-6"
            >
              <h3 className="text-xl font-bold text-white mb-6">Create New Stake</h3>
              
              <div className="space-y-6">
                {/* Amount Input */}
                <div>
                  <AmountInput
                    label="Amount to Stake"
                    value={stakeAmount}
                    onChange={(value) => setStakeAmount(value)}
                    onValueChange={(numValue) => setStakeAmount(numValue.toString())}
                    placeholder="Enter BITR amount"
                    currency="BITR"
                    min={1}
                    max={parseFloat(token.balance) || 0}
                    decimals={18}
                    size="md"
                    showMaxButton={true}
                    maxValue={parseFloat(token.balance) || 0}
                    help={`Available: ${token.balance} BITR`}
                    variant="filled"
                    required
                  />
                </div>

                {/* Tier Selection */}
                <div>
                  <label className="block text-white font-medium mb-3">
                    Select Tier
                  </label>
                  <div className="space-y-2">
                    {staking.tiers?.map((tier, index) => {
                      const canSelect = staking.canStakeInTier(index, stakeAmount || "0");
                      const TierIconComponent = TIER_ICONS[index] || FaCoins;
                      const tierColor = TIER_COLORS[index] || "text-gray-400";
                      
                      return (
                        <button
                          key={index}
                          onClick={() => setSelectedTier(index)}
                          disabled={!canSelect}
                          className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                            selectedTier === index
                              ? "border-purple-500 bg-purple-500/20"
                              : canSelect
                                ? "border-gray-600 bg-black/20 hover:border-purple-500/50"
                                : "border-gray-700 bg-gray-800/20 opacity-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <TierIconComponent className={`h-5 w-5 ${tierColor}`} />
                              <div>
                                <p className="text-white font-medium">{staking.getTierName(index)}</p>
                                <p className="text-gray-400 text-sm">
                                  {formatPercentage((typeof tier.baseAPY === 'bigint' ? Number(tier.baseAPY) / 100 : tier.baseAPY / 100))} APY • Min: {staking.formatAmount(tier.minStake)} BITR
                                </p>
                              </div>
                            </div>
                            {selectedTier === index && (
                              <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                            )}
                          </div>
                        </button>
                      );
                    }) || (
                      <div className="text-center py-4 text-gray-400">
                        <LoadingSpinner size="sm" />
                        <p className="mt-2">Loading tiers...</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Duration Selection */}
                <div>
                  <label className="block text-white font-medium mb-3">
                    Staking Duration
                  </label>
                  <div className="space-y-2">
                    {[DurationOption.THIRTY_DAYS, DurationOption.SIXTY_DAYS, DurationOption.NINETY_DAYS].map((duration) => (
                      <button
                        key={duration}
                        onClick={() => setSelectedDuration(duration)}
                        className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                          selectedDuration === duration
                            ? "border-purple-500 bg-purple-500/20"
                            : "border-gray-600 bg-black/20 hover:border-purple-500/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium">{staking.getDurationName(duration)}</p>
                            <p className="text-gray-400 text-sm">
                              +{staking.getDurationBonus(duration)}% APY bonus
                            </p>
                          </div>
                          {selectedDuration === duration && (
                            <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stake Button */}
                <div className="space-y-3">
                  {needsApproval ? (
                    <Button
                      onClick={handleApprove}
                      disabled={!stakeAmount || token.isPending}
                      className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                    >
                      {token.isPending ? (
                        <div className="flex items-center justify-center gap-2">
                          <LoadingSpinner size="sm" />
                          Approving...
                        </div>
                      ) : (
                        "Approve BITR"
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleStake}
                      disabled={
                        !stakeAmount ||
                        !staking.canStakeInTier(selectedTier, stakeAmount) ||
                        staking.isStaking || 
                        staking.isPending || 
                        staking.isConfirming
                      }
                      className="w-full py-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {staking.isStaking ? (
                        <div className="flex items-center justify-center gap-2">
                          <LoadingSpinner size="sm" />
                          Creating Stake...
                        </div>
                      ) : staking.isPending ? (
                        <div className="flex items-center justify-center gap-2">
                          <LoadingSpinner size="sm" />
                          Confirming...
                        </div>
                      ) : staking.isConfirming ? (
                        <div className="flex items-center justify-center gap-2">
                          <LoadingSpinner size="sm" />
                          Processing...
                        </div>
                      ) : (
                        "Create Stake"
                      )}
                    </Button>
                  )}
                </div>

                {/* Estimated Returns */}
                {stakeAmount && staking.tiers && staking.tiers[selectedTier] && (
                  <div className="p-4 bg-black/20 rounded-xl">
                    <h4 className="text-white font-medium mb-2">Estimated Returns</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Base APY:</span>
                        <span className="text-white">{formatPercentage((Number(staking.tiers[selectedTier].baseAPY) / 100))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Duration Bonus:</span>
                        <span className="text-green-400">+{staking.getDurationBonus(selectedDuration)}%</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-600 pt-1">
                        <span className="text-gray-400">Total APY:</span>
                        <span className="text-white font-medium">
                          {formatPercentage(((Number(staking.tiers[selectedTier].baseAPY) / 100) + staking.getDurationBonus(selectedDuration)))}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

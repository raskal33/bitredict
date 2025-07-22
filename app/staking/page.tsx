"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CurrencyDollarIcon as CurrencySolid } from "@heroicons/react/24/solid";
import { useAccount } from "wagmi";
import { toast } from "react-hot-toast";
import Button from "@/components/button";
import AnimatedTitle from "@/components/AnimatedTitle";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useStaking, DurationOption, StakeWithRewards } from "@/hooks/useStaking";
import { useBITRToken } from "@/hooks/useBITRToken";
import { CONTRACTS } from "@/contracts";
import { parseUnits } from "viem";
import { IoMdLock } from "react-icons/io";
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
  
  // Smart contract hooks
  const staking = useStaking();
  const token = useBITRToken();

  // Check if approval is needed
  useEffect(() => {
    if (stakeAmount && token.balance) {
      const allowance = token.getAllowance(CONTRACTS.BITREDICT_STAKING.address);
      const stakeAmountWei = parseUnits(stakeAmount, 18);
      setNeedsApproval(!allowance || (allowance as bigint) < stakeAmountWei);
    }
  }, [stakeAmount, token, token.balance]);

  // Handle approval
  const handleApprove = async () => {
    if (!stakeAmount) return;
    
    try {
      await token.approveMax(CONTRACTS.BITREDICT_STAKING.address);
      toast.success("Approval transaction submitted!");
    } catch (error: unknown) {
      toast.error((error as Error).message || "Approval failed");
    }
  };

  // Handle staking
  const handleStake = async () => {
    if (!stakeAmount || needsApproval) return;
    
    try {
      await staking.stake(stakeAmount, selectedTier, selectedDuration);
      toast.success("Stake transaction submitted!");
      setStakeAmount("");
    } catch (error: unknown) {
      toast.error((error as Error).message || "Staking failed");
    }
  };

  // Handle individual stake actions
  const handleClaimStakeRewards = async (stakeIndex: number) => {
    try {
      await staking.claimStakeRewards(stakeIndex);
      toast.success("Claim rewards transaction submitted!");
    } catch (error: unknown) {
      toast.error((error as Error).message || "Claiming rewards failed");
    }
  };

  const handleUnstakeSpecific = async (stakeIndex: number) => {
    try {
      await staking.unstakeSpecific(stakeIndex);
      toast.success("Unstake transaction submitted!");
    } catch (error: unknown) {
      toast.error((error as Error).message || "Unstaking failed");
    }
  };

  // Handle revenue share claim
  const handleClaimRevenueShare = async () => {
    try {
      await staking.claimRevenueShare();
      toast.success("Revenue share claim transaction submitted!");
    } catch (error: unknown) {
      toast.error((error as Error).message || "Claiming revenue share failed");
    }
  };

  // Watch for successful transactions
  useEffect(() => {
    if (staking.isConfirmed) {
      toast.success("Transaction confirmed! 🎉");
      staking.refetchAll();
      token.refetchBalance();
    }
  }, [staking.isConfirmed, staking, token]);

  useEffect(() => {
    if (token.isConfirmed) {
      toast.success("Approval confirmed! 🎉");
      setNeedsApproval(false);
    }
  }, [token.isConfirmed]);

  const TierIcon = TIER_ICONS[staking.userTier] || FaCoins;
  const tierColor = TIER_COLORS[staking.userTier] || "text-gray-400";

  const getProgressToNextTier = (): number => {
    if (!staking.tiers || staking.userTier >= staking.tiers.length - 1) {
      return 100; // Max tier reached
    }
    
    const currentThreshold = staking.tiers[staking.userTier].minStake;
    const nextThreshold = staking.tiers[staking.userTier + 1].minStake;
    const currentStaked = parseUnits(staking.totalUserStaked, 18);
    
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
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-6">
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
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
                <span className="text-blue-300">30 Days</span>
                <span className="text-white font-semibold">+0% Bonus</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-300">60 Days</span>
                <span className="text-white font-semibold">+2% Bonus</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-300">90 Days</span>
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

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Staking Panel */}
          <div className="xl:col-span-2 space-y-8">
            {/* User Stats Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                  <p className="text-2xl font-bold text-white">{staking.userStakesWithRewards.length}</p>
                </div>
              </div>

              {/* Progress to Next Tier */}
              {staking.userTier < (staking.tiers?.length || 0) - 1 && (
                <div className="mt-8 p-6 bg-black/20 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">Progress to {staking.getTierName(staking.userTier + 1)}</span>
                    <span className="text-gray-300">{getProgressToNextTier().toFixed(1)}%</span>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <FaCoins className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Pending BITR</p>
                  <p className="text-xl font-bold text-white">{staking.pendingRevenueBITR}</p>
                </div>
                
                <div className="text-center">
                  <FaGem className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Pending STT</p>
                  <p className="text-xl font-bold text-white">{staking.pendingRevenueSTT}</p>
                </div>

                <div className="flex items-center">
                  <Button
                    onClick={handleClaimRevenueShare}
                    disabled={
                      (parseFloat(staking.pendingRevenueBITR) === 0 && parseFloat(staking.pendingRevenueSTT) === 0) ||
                      staking.isPending ||
                      staking.isConfirming
                    }
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  >
                    {staking.isPending || staking.isConfirming ? (
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
                              <p className="text-green-400 font-medium">{stake.currentAPY.toFixed(2)}%</p>
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
                            <span>{staking.formatAmount(stake.pendingRewards)} BITR pending</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleClaimStakeRewards(stake.index)}
                          disabled={
                            stake.pendingRewards === BigInt(0) ||
                            staking.isPending ||
                            staking.isConfirming
                          }
                          className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                        >
                          Claim Rewards
                        </Button>
                        <Button
                          onClick={() => handleUnstakeSpecific(stake.index)}
                          disabled={
                            !stake.canUnstake ||
                            staking.isPending ||
                            staking.isConfirming
                          }
                          className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                        >
                          {stake.canUnstake ? "Unstake" : "Locked"}
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
                  <label className="block text-white font-medium mb-3">
                    Amount to Stake
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      placeholder="Enter BITR amount"
                      className="w-full bg-black/30 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                    />
                    <button
                      onClick={() => setStakeAmount(token.balance)}
                      className="absolute right-3 top-3 text-purple-400 hover:text-purple-300 text-sm font-medium"
                    >
                      MAX
                    </button>
                  </div>
                  <p className="text-gray-400 text-sm mt-2">
                    Available: {token.balance} BITR
                  </p>
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
                                  {(tier.baseAPY / 100).toFixed(1)}% APY • Min: {staking.formatAmount(tier.minStake)} BITR
                                </p>
                              </div>
                            </div>
                            {selectedTier === index && (
                              <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                            )}
                          </div>
                        </button>
                      );
                    })}
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
                        staking.isPending || 
                        staking.isConfirming
                      }
                      className="w-full py-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                    >
                      {staking.isPending || staking.isConfirming ? (
                        <div className="flex items-center justify-center gap-2">
                          <LoadingSpinner size="sm" />
                          {staking.isPending ? "Confirming..." : "Processing..."}
                        </div>
                      ) : (
                        "Create Stake"
                      )}
                    </Button>
                  )}
                </div>

                {/* Estimated Returns */}
                {stakeAmount && staking.tiers && (
                  <div className="p-4 bg-black/20 rounded-xl">
                    <h4 className="text-white font-medium mb-2">Estimated Returns</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Base APY:</span>
                        <span className="text-white">{(staking.tiers[selectedTier].baseAPY / 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Duration Bonus:</span>
                        <span className="text-green-400">+{staking.getDurationBonus(selectedDuration)}%</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-600 pt-1">
                        <span className="text-gray-400">Total APY:</span>
                        <span className="text-white font-medium">
                          {((staking.tiers[selectedTier].baseAPY / 100) + staking.getDurationBonus(selectedDuration)).toFixed(1)}%
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
  );
}

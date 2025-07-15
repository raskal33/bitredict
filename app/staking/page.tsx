"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Button from "@/components/button";
import { PriceTrendChart } from "./charts";
import { useStore } from "zustand";
import { usePreferences } from "@/store/usePreferences";
import { IoMdLock } from "react-icons/io";
import { FaTrophy, FaChartLine, FaCoins } from "react-icons/fa";
import { MdStars } from "react-icons/md";
import { HiOutlineChevronRight } from "react-icons/hi";
import AnimatedTitle from "@/components/AnimatedTitle";
import { CurrencyDollarIcon as CurrencySolid, BoltIcon as BoltSolid } from "@heroicons/react/24/solid";

export default function StakingPage() {
  const { preferences } = useStore(usePreferences);
  const [selectedLockPeriod, setSelectedLockPeriod] = useState(30);
  const [stakeAmount, setStakeAmount] = useState(preferences?.defaultStake || "");
  const [activeTab, setActiveTab] = useState("stake");
  
  // User's current staking stats
  const userStats = {
    tier: "Advanced",
    stakedAmount: 3000,
    apy: 12,
    revenueShare: 30,
    rewardsAccrued: 650,
    rewardsClaimed: 250,
    nextTierProgress: 30, // percentage to next tier
  };
  
  // Monthly revenue pool data
  const revenuePool = {
    total: 25000,
    userShare: 1250, // 5% of total based on stake
    percentage: 30, // progress percentage for visual bar
  };
  
  const handleStakeAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    setStakeAmount(value);
  };
  
  // Calculate estimated rewards based on selected lock period
  const getEstimatedRewards = () => {
    const amount = parseFloat(String(stakeAmount)) || 0;
    let apy = 0;
    
    // Determine APY based on amount staked
    if (amount >= 10000) apy = 18;
    else if (amount >= 3000) apy = 12;
    else if (amount >= 1000) apy = 6;
    
    // Apply bonus for longer lock periods
    if (selectedLockPeriod === 90) apy += 2;
    else if (selectedLockPeriod === 60) apy += 1;
    
    const monthlyRate = apy / 12 / 100;
    const months = selectedLockPeriod / 30;
    return (amount * monthlyRate * months).toFixed(2);
  };

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 space-y-8"
    >
      {/* Header */}
      <AnimatedTitle 
        size="md"
        leftIcon={CurrencySolid}
        rightIcon={BoltSolid}
      >
        BITR Staking
      </AnimatedTitle>
      
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-base text-text-secondary max-w-2xl mx-auto text-center mb-6"
      >
        Stake BITR tokens to earn platform fees and unlock exclusive benefits.
      </motion.p>
      
      {/* Staking Tiers Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-10"
      >
        <motion.h3 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-4 text-xl font-medium text-secondary gradient-text text-center"
        >
          Staking Tiers
        </motion.h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Basic Tier */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className={`glass-card relative overflow-hidden bg-gradient-to-br from-somnia-cyan/10 to-blue-500/10 border-2 hover:border-white/10 hover:glow-cyan transition-all duration-300 ${userStats.tier === "Basic" ? "border-primary" : "border-transparent"}`}
          >
            {userStats.tier === "Basic" && (
              <div className="absolute -right-8 top-4 rotate-45 bg-primary px-10 py-1 text-xs font-bold text-black">
                CURRENT
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-somnia-cyan/20 text-somnia-cyan">
                  <MdStars size={24} />
                </div>
                <h4 className="text-lg font-semibold text-somnia-cyan">🟢 Basic</h4>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-text-muted">Required Stake:</span>
                <span className="font-medium text-text-secondary">1,000 BITR</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">APY Rate:</span>
                <span className="font-medium text-somnia-cyan">6%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Revenue Share:</span>
                <span className="font-medium text-somnia-cyan">10%</span>
              </div>
            </div>
            
            {userStats.stakedAmount < 1000 ? (
              <Button variant="primary" fullWidth className="mt-4">
                Stake 1,000 BITR
              </Button>
            ) : userStats.tier === "Basic" ? (
              <Button variant="outline" fullWidth className="mt-4">
                Stake More to Upgrade <HiOutlineChevronRight />
              </Button>
            ) : (
              <Button variant="ghost" fullWidth className="mt-4" disabled>
                Current Tier
              </Button>
            )}
          </motion.div>
          
          {/* Advanced Tier */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className={`glass-card relative overflow-hidden bg-gradient-to-br from-somnia-blue/10 to-purple-500/10 border-2 hover:border-white/10 hover:glow-magenta transition-all duration-300 ${userStats.tier === "Advanced" ? "border-primary" : "border-transparent"}`}
          >
            {userStats.tier === "Advanced" && (
              <div className="absolute -right-8 top-4 rotate-45 bg-primary px-10 py-1 text-xs font-bold text-black">
                CURRENT
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-somnia-blue/20 text-somnia-blue">
                  <FaTrophy size={20} />
                </div>
                <h4 className="text-lg font-semibold text-somnia-blue">🔵 Advanced</h4>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-text-muted">Required Stake:</span>
                <span className="font-medium text-text-secondary">3,000 BITR</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">APY Rate:</span>
                <span className="font-medium text-somnia-blue">12%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Revenue Share:</span>
                <span className="font-medium text-somnia-blue">30%</span>
              </div>
            </div>
            
            {userStats.stakedAmount < 3000 ? (
              <Button variant="primary" fullWidth className="mt-4">
                Stake 3,000 BITR
              </Button>
            ) : userStats.tier === "Advanced" ? (
              <Button variant="outline" fullWidth className="mt-4">
                Stake More to Upgrade <HiOutlineChevronRight />
              </Button>
            ) : (
              <Button variant="ghost" fullWidth className="mt-4" disabled>
                Current Tier
              </Button>
            )}
          </motion.div>
          
          {/* Elite Tier */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className={`glass-card relative overflow-hidden bg-gradient-to-br from-somnia-violet/10 to-purple-500/10 border-2 hover:border-white/10 hover:glow-violet transition-all duration-300 ${userStats.tier === "Elite" ? "border-primary" : "border-transparent"}`}
          >
            {userStats.tier === "Elite" && (
              <div className="absolute -right-8 top-4 rotate-45 bg-primary px-10 py-1 text-xs font-bold text-black">
                CURRENT
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-somnia-violet/20 text-somnia-violet">
                  <MdStars size={24} />
                </div>
                <h4 className="text-lg font-semibold text-somnia-violet">🟣 Elite</h4>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-text-muted">Required Stake:</span>
                <span className="font-medium text-text-secondary">10,000 BITR</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">APY Rate:</span>
                <span className="font-medium text-somnia-violet">18%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Revenue Share:</span>
                <span className="font-medium text-somnia-violet">60%</span>
              </div>
            </div>
            
            {userStats.stakedAmount < 10000 ? (
              <Button variant="primary" fullWidth className="mt-4">
                Stake 10,000 BITR
              </Button>
            ) : (
              <Button variant="ghost" fullWidth className="mt-4" disabled>
                Maximum Tier
              </Button>
            )}
          </motion.div>
        </div>
        
        {/* Tier Progress Bar (if not at max tier) */}
        {userStats.tier !== "Elite" && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-6 glass-card bg-gradient-to-br from-primary/5 to-secondary/5"
          >
            <div className="mb-2 flex justify-between">
              <span className="text-sm text-text-muted">Current Tier: {userStats.tier}</span>
              <span className="text-sm text-text-muted">
                Next Tier: {userStats.tier === "Basic" ? "Advanced" : "Elite"}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-bg-card">
              <div
                className="h-full rounded-full bg-gradient-to-r from-somnia-cyan to-somnia-violet"
                style={{ width: `${userStats.nextTierProgress}%` }}
              ></div>
            </div>
            <div className="mt-2 text-right text-xs text-text-muted">
              {userStats.nextTierProgress}% to next tier
            </div>
          </motion.div>
        )}
      </motion.div>
      
      {/* Main Dashboard Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="grid grid-cols-1 gap-6 lg:grid-cols-3"
      >
        {/* Left Column - Rewards Dashboard */}
        <div className="glass-card lg:col-span-1">
          <h3 className="mb-4 flex items-center gap-2 text-xl font-medium text-secondary">
            <FaCoins className="text-primary" />
            Rewards Dashboard
          </h3>
          
          <div className="space-y-6">
            <div className="space-y-4 rounded-lg bg-bg-card p-4">
              <div className="flex justify-between">
                <span className="text-text-muted">Total Staked:</span>
                <span className="font-semibold text-text-secondary">{userStats.stakedAmount.toLocaleString()} BITR</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Current APY:</span>
                <span className="font-semibold text-primary">{userStats.apy}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Revenue Share:</span>
                <span className="font-semibold text-primary">{userStats.revenueShare}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Rewards Accrued:</span>
                <span className="font-semibold text-secondary">{userStats.rewardsAccrued} BITR</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Rewards Claimed:</span>
                <span className="font-semibold text-text-secondary">{userStats.rewardsClaimed} BITR</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
              <Button variant="primary" fullWidth leftIcon={<FaCoins />}>
                Claim {userStats.rewardsAccrued - userStats.rewardsClaimed} BITR
              </Button>
              <Button variant="outline" fullWidth>
                View Reward History
              </Button>
            </div>
          </div>
        </div>
        
        {/* Middle Column - Stake/Unstake Interface */}
        <div className="glass-card lg:col-span-1">
          <div className="mb-4 flex border-b border-border-card pb-2">
            <button
              className={`flex-1 border-b-2 pb-2 text-center font-medium ${
                activeTab === "stake"
                  ? "border-primary text-primary"
                  : "border-transparent text-text-muted"
              }`}
              onClick={() => setActiveTab("stake")}
            >
              Stake BITR
            </button>
            <button
              className={`flex-1 border-b-2 pb-2 text-center font-medium ${
                activeTab === "unstake"
                  ? "border-primary text-primary"
                  : "border-transparent text-text-muted"
              }`}
              onClick={() => setActiveTab("unstake")}
            >
              Unstake BITR
            </button>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm text-text-muted">
                {activeTab === "stake" ? "Amount to Stake" : "Amount to Unstake"}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={stakeAmount}
                  onChange={handleStakeAmountChange}
                  placeholder="Enter amount"
                  className="h-12 w-full rounded-md border border-border-input bg-bg-card pl-4 pr-16 focus:border-primary focus:outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted">
                  BITR
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <button 
                  className="text-primary"
                  onClick={() => setStakeAmount("1000")}
                >
                  Min (1,000)
                </button>
                <button 
                  className="text-primary"
                  onClick={() => setStakeAmount((userStats.stakedAmount / 2).toString())}
                >
                  Half
                </button>
                <button 
                  className="text-primary"
                  onClick={() => setStakeAmount(userStats.stakedAmount.toString())}
                >
                  Max ({userStats.stakedAmount})
                </button>
              </div>
            </div>
            
            {/* Lock Period Selection (Only show for staking) */}
            {activeTab === "stake" && (
              <div className="space-y-2">
                <label className="flex items-center gap-1 text-sm text-text-muted">
                  <IoMdLock size={14} />
                  Lock Period
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[30, 60, 90].map((days) => (
                    <button
                      key={days}
                      className={`rounded-md border p-2 text-center text-sm ${
                        selectedLockPeriod === days
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border-input bg-bg-card text-text-muted"
                      }`}
                      onClick={() => setSelectedLockPeriod(days)}
                    >
                      <div className="font-medium">{days} Days</div>
                      <div className="text-xs">
                        {days === 30 ? "+0%" : days === 60 ? "+1%" : "+2%"} APY
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-2 text-xs text-text-muted">
                  <span className="text-warning">Note:</span> Early unstaking incurs a 10% penalty fee
                </div>
              </div>
            )}
            
            {/* Estimated Returns (Only show for staking) */}
            {activeTab === "stake" && parseFloat(String(stakeAmount)) > 0 && (
              <div className="rounded-md bg-bg-card p-3">
                <div className="mb-1 text-sm text-text-muted">Estimated Returns:</div>
                <div className="text-lg font-semibold text-primary">
                  +{getEstimatedRewards()} BITR
                </div>
                <div className="text-xs text-text-muted">
                  After {selectedLockPeriod} days at{" "}
                  {userStats.apy + (selectedLockPeriod === 90 ? 2 : selectedLockPeriod === 60 ? 1 : 0)}% APY
                </div>
              </div>
            )}
            
            <Button 
              variant={activeTab === "stake" ? "primary" : "secondary"} 
              fullWidth
              disabled={!parseFloat(String(stakeAmount))}
            >
              {activeTab === "stake" ? "Stake Now" : "Unstake Now"}
            </Button>
          </div>
        </div>
        
        {/* Right Column - Revenue Pool Tracker */}
        <div className="glass-card lg:col-span-1">
          <h3 className="mb-4 flex items-center gap-2 text-xl font-medium text-secondary">
            <FaChartLine className="text-secondary" />
            Revenue Pool Tracker
          </h3>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-text-muted">Monthly Revenue Pool:</span>
                <span className="font-semibold text-text-secondary">
                  {revenuePool.total.toLocaleString()} BITR
                </span>
              </div>
              
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-text-muted">Platform Revenue</span>
                  <span className="text-text-muted">30% to Stakers</span>
                </div>
                <div className="h-4 w-full overflow-hidden rounded-full bg-bg-card">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-somnia-magenta to-somnia-violet"
                    style={{ width: `${revenuePool.percentage}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="rounded-lg bg-bg-card p-4">
                <div className="text-center text-sm text-text-muted">Your Share This Month</div>
                <div className="text-center text-2xl font-bold text-secondary">
                  {revenuePool.userShare.toLocaleString()} BITR
                </div>
                <div className="text-center text-xs text-text-muted">
                  Based on your {userStats.revenueShare}% tier allocation
                </div>
              </div>
            </div>
            
            <div className="rounded-lg border border-border-card bg-bg-card p-4">
              <h4 className="mb-2 text-center text-sm font-medium text-text-secondary">
                Distribution Schedule
              </h4>
              <div className="flex justify-between text-xs">
                <div className="text-center">
                  <div className="font-medium text-text-secondary">15</div>
                  <div className="text-text-muted">Days</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-text-secondary">07</div>
                  <div className="text-text-muted">Hours</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-text-secondary">23</div>
                  <div className="text-text-muted">Minutes</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-text-secondary">11</div>
                  <div className="text-text-muted">Seconds</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Global Stats */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4"
      >
        {[
          { value: "$9,574,208.84", label: "Total Value Locked" },
          { value: "$26,569,025", label: "Market Cap" },
          { value: "18%", label: "Max APY Rate" },
          { value: "6,997", label: "Total Stakers" },
        ].map((stat, i) => (
          <div
            key={i}
            className="glass-card flex flex-col items-center justify-center gap-2 p-4 text-center"
          >
            <p className="text-xl font-semibold text-primary">{stat.value}</p>
            <p className="text-sm text-text-muted">{stat.label}</p>
          </div>
        ))}
      </motion.div>
      
      {/* Token Rates */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="mt-10"
      >
        <h3 className="mb-4 text-xl font-medium text-secondary">Token Rate</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="glass-card flex flex-col items-center justify-center gap-2 p-4">
            <p className="text-text-muted">BITR/USD</p>
            <p className="text-2xl font-semibold text-secondary">0.75 USD</p>
          </div>
          
          <div className="glass-card flex flex-col items-center justify-center gap-2 p-4">
            <p className="text-text-muted">BITR/STT</p>
            <p className="text-2xl font-semibold text-secondary">0.00288 STT</p>
          </div>
          
          <div className="glass-card flex flex-col items-center justify-center gap-2 p-4">
            <p className="text-text-muted">24h Change</p>
            <p className="text-2xl font-semibold text-success">+2.4%</p>
          </div>
        </div>
      </motion.div>
      
      {/* Price Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="mt-10 glass-card"
      >
        <h3 className="mb-4 text-xl font-medium text-secondary">Price Trend</h3>
        <div className="h-64">
          <PriceTrendChart />
        </div>
      </motion.div>
    </motion.section>
  );
}

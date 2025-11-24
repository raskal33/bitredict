"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { toast } from "react-hot-toast";
import AnimatedTitle from "@/components/AnimatedTitle";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useBITRToken } from "@/hooks/useBITRToken";
import { useFaucet } from "@/hooks/useFaucet";
import { useStaking } from "@/hooks/useStaking";
import { 
  checkAirdropEligibility, 
  getAirdropStatistics,
  getAirdropLeaderboard,
  formatBITRAmount,
  formatAddress,
  calculateRequirementProgress 
} from "@/services/airdropService";
import { UserEligibility, AirdropStatistics } from "@/types/airdrop";
import { 
  FaGift, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaTrophy,
  FaCoins,
  FaChartLine,
  FaGamepad,
  FaShieldAlt,
  FaCrown,
  FaUsers,
  FaCalendarAlt
} from "react-icons/fa";
import { 
  GiftIcon as GiftSolid,
  SparklesIcon as SparklesSolid
} from "@heroicons/react/24/solid";

interface LeaderboardUser {
  rank: number;
  address: string;
  airdropAmount?: string | null;
  allocation?: string; // Legacy field
  bitrActions: number;
  oddysseySlips: number;
  hasStaking: boolean;
  activityScore: number;
  completedRequirements?: number; // Legacy field
  tier?: string; // Legacy field
}

export default function AirdropPage() {
  const { address, isConnected } = useAccount();
  const [eligibility, setEligibility] = useState<UserEligibility | null>(null);
  const [statistics, setStatistics] = useState<AirdropStatistics | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("eligibility");

  // Smart contract hooks for real-time data
  const token = useBITRToken();
  const faucet = useFaucet();
  const staking = useStaking();

  const fetchAirdropData = useCallback(async () => {
    if (!address) return;
    
    setLoading(true);
    try {
              const [eligibilityData, statsData, leaderboardData] = await Promise.all([
        checkAirdropEligibility(address),
        getAirdropStatistics(),
        getAirdropLeaderboard(50).catch(() => [] as LeaderboardUser[])
      ]);
      
      setEligibility(eligibilityData);
      setStatistics(statsData);
      setLeaderboard(leaderboardData as LeaderboardUser[]);
    } catch (error) {
      console.error("Error fetching airdrop data:", error);
      toast.error("Failed to load airdrop data");
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (isConnected && address) {
      fetchAirdropData();
      // Refresh data every 30 seconds
      const interval = setInterval(() => {
        fetchAirdropData();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isConnected, address, fetchAirdropData]);

  // Enhanced eligibility combines backend data with smart contract data
  // Used for potential future features

  const getRequirementStatus = (requirement: unknown, label: string) => {
    const isMet = (requirement as {met?: boolean})?.met || requirement === true;
    const current = (requirement as {current?: number})?.current;
    const required = (requirement as {required?: number})?.required;
    
    let detail = "";
    if (typeof current === 'number' && typeof required === 'number') {
      detail = ` (${current}/${required})`;
    }
    
    return {
      label: label + detail,
      met: isMet,
      icon: isMet ? FaCheckCircle : FaTimesCircle,
      color: isMet ? "text-green-400" : "text-red-400",
      bgColor: isMet ? "bg-green-500/10" : "bg-red-500/10",
      borderColor: isMet ? "border-green-500/20" : "border-red-500/20",
      current,
      required
    };
  };

  const requirements = eligibility?.requirements ? [
    getRequirementStatus(eligibility.requirements?.faucetClaim, "1️⃣ Claim BITR from the faucet"),
    getRequirementStatus(eligibility.requirements?.poolsCreated, "2️⃣ Create at least 3 prediction pools"),
    getRequirementStatus(eligibility.requirements?.poolsParticipated, "3️⃣ Participate in at least 10 pools"),
    getRequirementStatus(eligibility.requirements?.stakingActivity, "4️⃣ Stake BITR"),
    getRequirementStatus(eligibility.requirements?.oddysseySlips, "5️⃣ Submit 5 Odyssey slips")
  ] : [];

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-main text-white flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-8 text-center"
        >
          <GiftSolid className="h-16 w-16 text-accent mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-primary mb-4">Connect Your Wallet</h2>
          <p className="text-text-secondary mb-6">
            Connect your wallet to check your airdrop eligibility and see your rewards.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-main text-white p-6">
      <div className="max-w-7xl mx-auto">
        <AnimatedTitle className="text-4xl md:text-6xl font-bold text-center mb-4 gradient-text">
          BITR Airdrop
        </AnimatedTitle>
        
        <p className="text-center text-text-secondary mb-12 text-lg max-w-3xl mx-auto">
          Check your eligibility for the BITR token airdrop. Complete various activities to qualify for rewards!
        </p>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8 px-4">
          <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 glass-card rounded-xl p-1 w-full max-w-md sm:max-w-none sm:w-auto">
            {["eligibility", "leaderboard", "statistics"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-4 sm:px-6 rounded-lg font-medium transition-all capitalize text-sm sm:text-base ${
                  activeTab === tab
                    ? "bg-gradient-primary text-black"
                    : "text-text-secondary hover:text-primary hover:bg-white/10"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Eligibility Tab */}
        {activeTab === "eligibility" && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Main Eligibility Panel */}
            <div className="xl:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-2xl p-8"
              >
                {loading ? (
                  <div className="flex justify-center py-12">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : eligibility ? (
                  <div>
                    <div className="flex items-center gap-4 mb-8">
                      <div className="p-4 bg-accent/20 rounded-xl">
                        <FaGift className="h-8 w-8 text-accent" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-primary">Airdrop Eligibility</h2>
                        <p className="text-text-secondary">
                          {eligibility.isEligible ? "Congratulations! You're eligible" : "Complete requirements to qualify"}
                        </p>
                      </div>
                      <div className="ml-auto">
                        {eligibility.isEligible ? (
                          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg">
                            <FaCheckCircle className="h-5 w-5 text-green-400" />
                            <span className="text-green-400 font-medium">Eligible</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 border border-orange-500/30 rounded-lg">
                            <FaTimesCircle className="h-5 w-5 text-orange-400" />
                            <span className="text-orange-400 font-medium">Not Eligible</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Allocation Display */}
                    {eligibility.isEligible && (
                      <div className="mb-8 p-6 bg-gradient-primary/10 border border-accent/20 rounded-xl">
                        <div className="text-center">
                          <h3 className="text-2xl font-bold text-primary mb-2">Your Allocation</h3>
                          <p className="text-4xl font-bold gradient-text">
                            {formatBITRAmount(eligibility.airdropInfo?.airdropAmount || '0')} BITR
                          </p>
                          <p className="text-text-secondary mt-2">Based on your activity and tier</p>
                        </div>
                      </div>
                    )}

                    {/* Requirements */}
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-primary mb-6">Requirements Checklist</h3>
                      
                      {requirements.map((req, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`p-4 rounded-xl border ${req.bgColor} ${req.borderColor} transition-all hover:bg-opacity-80`}
                        >
                          <div className="flex items-center gap-4">
                            <req.icon className={`h-6 w-6 ${req.color}`} />
                            <div className="flex-1">
                              <p className="text-primary font-medium">{req.label}</p>
                              <p className="text-text-muted text-sm">
                                {req.met ? "Completed ✓" : req.current !== undefined && req.required !== undefined 
                                  ? `${req.current}/${req.required} required`
                                  : "Not completed"}
                              </p>
                            </div>
                            {req.met && (
                              <div className="px-3 py-1 bg-green-500/20 rounded-full">
                                <span className="text-green-400 text-sm font-medium">Done</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Progress Bar */}
                    {eligibility?.requirements && (
                      <div className="mt-8 p-6 glass-card rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-primary font-medium">Overall Progress</span>
                          <span className="text-text-secondary">{calculateRequirementProgress(eligibility.requirements)}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-3">
                          <div
                            className="bg-gradient-somnia h-3 rounded-full transition-all duration-300"
                            style={{ width: `${calculateRequirementProgress(eligibility.requirements)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FaGift className="h-12 w-12 text-text-muted mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-primary mb-2">Loading Eligibility</h3>
                    <p className="text-text-muted">Please wait while we check your eligibility...</p>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Current Status */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card rounded-2xl p-6"
              >
                <h3 className="text-xl font-bold text-primary mb-6">Current Status</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">BITR Balance</span>
                    <span className="text-primary font-medium">{token.balance}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Staked Amount</span>
                    <span className="text-primary font-medium">
                      {staking.userStakesWithRewards && staking.userStakesWithRewards.length > 0
                        ? formatBITRAmount(
                            staking.userStakesWithRewards
                              .reduce((acc: bigint, stake: { amount: bigint }) => {
                                try {
                                  const amount = typeof stake.amount === 'bigint' ? stake.amount : BigInt(stake.amount || 0);
                                  return acc + amount;
                                } catch {
                                  return acc;
                                }
                              }, BigInt(0)).toString()
                          )
                        : '0'} BITR
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Staking Tier</span>
                    <span className="text-primary font-medium">{staking.userTierName || 'None'}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Faucet Claims</span>
                    <span className="text-primary font-medium">
                      {(eligibility?.requirements?.faucetClaim || faucet.hasClaimed || (faucet.userInfo && faucet.userInfo.claimed))
                        ? formatBITRAmount('20000000000000000000000')
                        : '0 BITR'}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card rounded-2xl p-6"
              >
                <h3 className="text-xl font-bold text-primary mb-6">Quick Actions</h3>
                
                <div className="space-y-3">
                  <a
                    href="/faucet"
                    className="w-full flex items-center justify-between p-3 glass-card hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FaCoins className="h-5 w-5 text-accent" />
                      <span className="text-primary">Claim Faucet</span>
                    </div>
                  </a>
                  
                  <a
                    href="/staking"
                    className="w-full flex items-center justify-between p-3 glass-card hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FaShieldAlt className="h-5 w-5 text-accent" />
                      <span className="text-primary">Start Staking</span>
                    </div>
                  </a>
                  
                  <a
                    href="/oddyssey"
                    className="w-full flex items-center justify-between p-3 glass-card hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FaGamepad className="h-5 w-5 text-accent" />
                      <span className="text-primary">Play Oddyssey</span>
                    </div>
                  </a>
                  
                  <a
                    href="/markets"
                    className="w-full flex items-center justify-between p-3 glass-card hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FaChartLine className="h-5 w-5 text-accent" />
                      <span className="text-primary">Trade Markets</span>
                    </div>
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === "leaderboard" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="glass-card rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-accent/20 rounded-xl">
                  <FaTrophy className="h-8 w-8 text-accent" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-primary">Airdrop Leaderboard</h2>
                  <p className="text-text-secondary">Top participants by allocation amount</p>
                </div>
              </div>

              {leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard.map((user, index) => (
                    <motion.div
                      key={user.address}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 p-4 glass-card rounded-xl"
                    >
                      <div className="w-8 h-8 bg-gradient-somnia rounded-full flex items-center justify-center">
                        <span className="text-black font-bold text-sm">{index + 1}</span>
                      </div>
                      
                      <div className="flex-1">
                        <p className="text-primary font-medium">{formatAddress(user.address)}</p>
                        <p className="text-text-muted text-sm">
                          {user.bitrActions} BITR actions • {user.oddysseySlips} slips • {user.hasStaking ? 'Staked' : 'No staking'}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-primary font-bold">
                          {user.airdropAmount ? formatBITRAmount(user.airdropAmount) : 'TBD'} BITR
                        </p>
                        <p className="text-text-muted text-sm">Score: {user.activityScore}</p>
                      </div>
                      
                      {index < 3 && (
                        <FaCrown className={`h-5 w-5 ${
                          index === 0 ? 'text-accent' : 
                          index === 1 ? 'text-text-secondary' : 
                          'text-accent'
                        }`} />
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FaUsers className="h-12 w-12 text-text-muted mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-primary mb-2">No Data Available</h3>
                  <p className="text-text-muted">Leaderboard will be available soon</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Statistics Tab */}
        {activeTab === "statistics" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="glass-card rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-accent/20 rounded-xl">
                  <FaChartLine className="h-8 w-8 text-accent" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-primary">Airdrop Statistics</h2>
                  <p className="text-text-secondary">Overall platform statistics and metrics</p>
                </div>
              </div>

              {statistics ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="p-6 glass-card rounded-xl text-center">
                    <FaGift className="h-8 w-8 text-accent mx-auto mb-4" />
                    <p className="text-text-muted text-sm">Total Allocation</p>
                    <p className="text-2xl font-bold text-primary">{formatBITRAmount(statistics.overview.totalAirdropAllocated)} BITR</p>
                  </div>
                  
                  <div className="p-6 glass-card rounded-xl text-center">
                    <FaUsers className="h-8 w-8 text-accent mx-auto mb-4" />
                    <p className="text-text-muted text-sm">Eligible Users</p>
                    <p className="text-2xl font-bold text-primary">{statistics.overview.totalEligible.toLocaleString()}</p>
                  </div>
                  
                  <div className="p-6 glass-card rounded-xl text-center">
                    <FaCalendarAlt className="h-8 w-8 text-accent mx-auto mb-4" />
                    <p className="text-text-muted text-sm">Distribution Date</p>
                    <p className="text-xl font-bold text-primary">{statistics.latestSnapshot?.timestamp || 'TBA'}</p>
                  </div>
                  
                  <div className="p-6 glass-card rounded-xl text-center">
                    <FaShieldAlt className="h-8 w-8 text-accent mx-auto mb-4" />
                    <p className="text-text-muted text-sm">Avg Actions</p>
                    <p className="text-2xl font-bold text-primary">{statistics.overview.averageBITRActions} Actions</p>
                  </div>
                  
                  <div className="p-6 glass-card rounded-xl text-center">
                    <FaTrophy className="h-8 w-8 text-accent mx-auto mb-4" />
                    <p className="text-text-muted text-sm">Completion Rate</p>
                    <p className="text-2xl font-bold text-primary">{statistics.overview.eligibilityRate.toFixed(1)}%</p>
                  </div>
                  
                  <div className="p-6 glass-card rounded-xl text-center">
                    <SparklesSolid className="h-8 w-8 text-accent mx-auto mb-4" />
                    <p className="text-text-muted text-sm">Total Claims</p>
                    <p className="text-2xl font-bold text-primary">{statistics.overview.totalFaucetClaims}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <LoadingSpinner size="lg" />
                  <p className="text-text-muted">Loading statistics...</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { toast } from "@/utils/toast";
import AnimatedTitle from "@/components/AnimatedTitle";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useBITRToken } from "@/hooks/useBITRToken";
import { useFaucet } from "@/hooks/useFaucet";
import { useStaking } from "@/hooks/useStaking";
import { useWebSocket } from "@/hooks/useWebSocket";
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
import Button from "@/components/button";

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

  // ✅ WebSocket for real-time leaderboard updates
  const [leaderboardUpdate, setLeaderboardUpdate] = useState<Record<string, unknown> | null>(null);
  const { isConnected: wsConnected } = useWebSocket({
    channel: 'airdrop:leaderboard',
    onMessage: (message: Record<string, unknown>) => {
      setLeaderboardUpdate(message);
    },
    enabled: activeTab === 'leaderboard'
  });

  const fetchAirdropData = useCallback(async () => {
    setLoading(true);
    try {
      const promises: Promise<unknown>[] = [
        getAirdropStatistics(),
        getAirdropLeaderboard(50).catch((err) => {
          console.error("Error fetching leaderboard:", err);
          return [] as LeaderboardUser[];
        })
      ];
      
      if (address) {
        promises.push(checkAirdropEligibility(address));
      }
      
      const results = await Promise.all(promises);
      
      if (address) {
        setEligibility(results[2] as UserEligibility);
      }
      setStatistics(results[0] as AirdropStatistics);
      
      // ✅ FIX: Ensure leaderboard is always an array
      const leaderboardData = results[1] as LeaderboardUser[];
      if (Array.isArray(leaderboardData)) {
        setLeaderboard(leaderboardData);
      } else {
        console.warn("Leaderboard data is not an array:", leaderboardData);
        setLeaderboard([]);
      }
    } catch (error) {
      console.error("Error fetching airdrop data:", error);
      toast.error("Failed to load airdrop data");
      setLeaderboard([]); // Ensure leaderboard is set to empty array on error
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    // Always fetch statistics and leaderboard, even if not connected
    fetchAirdropData();
    // Refresh data every 30 seconds (fallback if WebSocket fails)
    const interval = setInterval(() => {
      fetchAirdropData();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchAirdropData]);

  // ✅ FIX: Refresh leaderboard when switching to leaderboard tab
  useEffect(() => {
    if (activeTab === 'leaderboard' && leaderboard.length === 0 && !loading) {
      console.log('🔄 Refreshing leaderboard data...');
      fetchAirdropData();
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ Real-time leaderboard updates via WebSocket
  useEffect(() => {
    if (leaderboardUpdate && leaderboardUpdate.type === 'update' && leaderboardUpdate.channel === 'airdrop:leaderboard') {
      const updateData = leaderboardUpdate.data as { leaderboard?: Array<Record<string, unknown>> };
      if (updateData && updateData.leaderboard && Array.isArray(updateData.leaderboard)) {
        setLeaderboard(updateData.leaderboard.map((user: Record<string, unknown>) => ({
          rank: typeof user.rank === 'number' ? user.rank : typeof user.rank === 'string' ? parseInt(user.rank) : 0,
          address: String(user.address || ''),
          airdropAmount: user.airdropAmount ? String(user.airdropAmount) : '0',
          bitrActions: typeof user.bitrActions === 'number' ? user.bitrActions : typeof user.bitrActions === 'string' ? parseInt(user.bitrActions) : 0,
          oddysseySlips: typeof user.oddysseySlips === 'number' ? user.oddysseySlips : typeof user.oddysseySlips === 'string' ? parseInt(user.oddysseySlips) : 0,
          hasStaking: Boolean(user.hasStaking),
          activityScore: typeof user.activityScore === 'number' ? user.activityScore : typeof user.activityScore === 'string' ? parseInt(user.activityScore) : 0
        })));
        console.log('📡 Real-time leaderboard update received via WebSocket');
      }
    }
  }, [leaderboardUpdate]);

  // Also refresh when staking data changes (user stakes/unstakes)
  useEffect(() => {
    if (isConnected && address && staking.userStakesWithRewards) {
      // Refresh eligibility when staking changes
      const timeout = setTimeout(() => {
        fetchAirdropData();
      }, 2000); // Small delay to ensure contract state is updated
      return () => clearTimeout(timeout);
    }
  }, [staking.userStakesWithRewards?.length, isConnected, address]); // eslint-disable-line react-hooks/exhaustive-deps

  // Enhanced eligibility combines backend data with smart contract data
  // Used for potential future features

  const getRequirementStatus = (requirement: unknown, label: string) => {
    // Handle boolean requirements (like faucetClaim)
    if (typeof requirement === 'boolean') {
      return {
        label,
        met: requirement,
        icon: requirement ? FaCheckCircle : FaTimesCircle,
        color: requirement ? "text-green-400" : "text-red-400",
        bgColor: requirement ? "bg-green-500/10" : "bg-red-500/10",
        borderColor: requirement ? "border-green-500/20" : "border-red-500/20",
        current: requirement ? 1 : 0,
        required: 1
      };
    }
    
    // Handle object requirements with current/required/met
    const reqObj = requirement as {met?: boolean; current?: number; required?: number};
    const isMet = reqObj?.met || false;
    const current = reqObj?.current ?? 0;
    const required = reqObj?.required ?? 0;
    
    let detail = "";
    if (typeof current === 'number' && typeof required === 'number' && required > 0) {
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

  // Enhanced staking check: Use contract data if available, fallback to API
  const hasStakesFromContract = staking.userStakesWithRewards && staking.userStakesWithRewards.length > 0;
  const stakingCountFromContract = hasStakesFromContract ? staking.userStakesWithRewards.length : 0;
  
  // Merge contract data with API data for staking requirement
  // Contract is source of truth, so prioritize contract data over API
  const stakingRequirement = eligibility?.requirements?.stakingActivity;
  const enhancedStakingRequirement = (() => {
    // If we have contract data, use it (contract is source of truth)
    if (hasStakesFromContract) {
      return {
        current: stakingCountFromContract,
        required: 1,
        met: true
      };
    }
    // Handle boolean stakingActivity
    if (typeof stakingRequirement === 'boolean') {
      return {
        current: stakingRequirement ? 1 : 0,
        required: 1,
        met: stakingRequirement
      };
    }
    // Handle object stakingActivity
    if (stakingRequirement && typeof stakingRequirement === 'object' && 'current' in stakingRequirement) {
      return stakingRequirement as { current: number; required: number; met: boolean };
    }
    // Fallback: no staking
    return {
      current: 0,
      required: 1,
      met: false
    };
  })();

  // ✅ FIX: Map API requirements correctly - Updated to match user requirements
  const requirements = eligibility?.requirements ? [
    getRequirementStatus(
      typeof eligibility.requirements.faucetClaim === 'object' 
        ? eligibility.requirements.faucetClaim.hasClaimed 
        : eligibility.requirements.faucetClaim || false, 
      "1️⃣ Claim BITR test tokens from the faucet"
    ),
    getRequirementStatus(
      eligibility.requirements.poolsCreated || { current: 0, required: 3, met: false },
      "2️⃣ Create at least 3 prediction pools"
    ),
    getRequirementStatus(
      eligibility.requirements.poolsParticipated || { current: 0, required: 10, met: false },
      "3️⃣ Participate in at least 10 pools"
    ),
    getRequirementStatus(
      enhancedStakingRequirement,
      "4️⃣ Stake BITR on Testnet"
    ),
    getRequirementStatus(
      eligibility.requirements.oddysseySlips || { current: 0, required: 5, met: false },
      "5️⃣ Submit 5 Odyssey slips"
    )
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

                    {/* Allocation Display - Enhanced */}
                    {eligibility.isEligible ? (
                      <div className="mb-8 p-8 bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-green-500/10 border-2 border-green-500/30 rounded-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
                        <div className="relative z-10 text-center">
                          <div className="inline-block p-3 bg-green-500/20 rounded-full mb-4">
                            <FaGift className="h-8 w-8 text-green-400" />
                          </div>
                          <h3 className="text-2xl font-bold text-primary mb-2">🎉 You&apos;re Eligible!</h3>
                          <p className="text-5xl font-bold gradient-text mb-2">
                            {formatBITRAmount(eligibility.airdropInfo?.airdropAmount || '0')} BITR
                          </p>
                          <p className="text-text-secondary">Estimated allocation based on your activity</p>
                          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full">
                            <FaCheckCircle className="h-4 w-4 text-green-400" />
                            <span className="text-green-400 text-sm font-medium">All requirements met</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-8 p-6 bg-gradient-to-br from-orange-500/10 via-yellow-500/10 to-orange-500/10 border border-orange-500/30 rounded-xl">
                        <div className="text-center">
                          <h3 className="text-xl font-bold text-primary mb-2">Keep Going!</h3>
                          <p className="text-text-secondary">
                            Complete all requirements to become eligible for the airdrop
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Requirements - Enhanced Design */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-primary">Requirements Checklist</h3>
                        <div className="text-sm text-text-secondary">
                          {requirements.filter(r => r.met).length} / {requirements.length} Complete
                        </div>
                      </div>
                      
                      {requirements.map((req, index) => {
                        const progress = req.required > 0 ? (req.current / req.required) * 100 : (req.met ? 100 : 0);
                        
                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`p-5 rounded-xl border-2 transition-all hover:scale-[1.02] ${
                              req.met 
                                ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 shadow-lg shadow-green-500/10' 
                                : 'bg-gradient-to-r from-gray-500/5 to-gray-600/5 border-gray-500/20'
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <div className={`p-3 rounded-lg ${
                                req.met 
                                  ? 'bg-green-500/20 border border-green-500/30' 
                                  : 'bg-gray-500/10 border border-gray-500/20'
                              }`}>
                                <req.icon className={`h-6 w-6 ${req.color}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-primary font-semibold text-base mb-2">{req.label}</p>
                                
                                {/* Progress indicator for numeric requirements */}
                                {req.required > 1 && (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-text-secondary">
                                        {req.met ? (
                                          <span className="text-green-400 font-medium">✓ Completed</span>
                                        ) : (
                                          <span className="text-orange-400">
                                            {req.current} of {req.required} required
                                          </span>
                                        )}
                                      </span>
                                      <span className={`font-bold ${req.met ? 'text-green-400' : 'text-orange-400'}`}>
                                        {Math.min(progress, 100).toFixed(0)}%
                                      </span>
                                    </div>
                                    <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(progress, 100)}%` }}
                                        transition={{ duration: 0.5, delay: index * 0.1 }}
                                        className={`h-2 rounded-full ${
                                          req.met 
                                            ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
                                            : 'bg-gradient-to-r from-orange-400 to-yellow-500'
                                        }`}
                                      />
                                    </div>
                                  </div>
                                )}
                                
                                {/* Simple checkmark for boolean requirements */}
                                {req.required === 1 && (
                                  <p className={`text-sm font-medium ${
                                    req.met ? 'text-green-400' : 'text-red-400'
                                  }`}>
                                    {req.met ? '✓ Completed' : '✗ Not completed'}
                                  </p>
                                )}
                              </div>
                              
                              {/* Status badge */}
                              <div className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                                req.met
                                  ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                                  : 'bg-gray-500/20 border border-gray-500/30 text-gray-400'
                              }`}>
                                {req.met ? '✓ Done' : 'Pending'}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Progress Bar - Enhanced with count display */}
                    {eligibility?.requirements && (() => {
                      const progress = calculateRequirementProgress(eligibility.requirements);
                      const completedCount = requirements.filter(r => r.met).length;
                      const totalCount = requirements.length;
                      
                      return (
                        <div className="mt-8 p-6 glass-card rounded-xl border border-accent/20">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <span className="text-primary font-bold text-lg">Overall Progress</span>
                              <p className="text-text-secondary text-sm mt-1">
                                {completedCount} of {totalCount} requirements completed
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-2xl font-bold gradient-text">{progress}%</span>
                              <p className="text-text-secondary text-xs mt-1">Complete</p>
                            </div>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden relative">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className="bg-gradient-somnia h-4 rounded-full relative overflow-hidden"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                            </motion.div>
                          </div>
                          <div className="mt-4 grid grid-cols-5 gap-2">
                            {requirements.map((req, idx) => (
                              <div
                                key={idx}
                                className={`text-center p-2 rounded-lg transition-all ${
                                  req.met 
                                    ? 'bg-green-500/20 border border-green-500/30' 
                                    : 'bg-gray-500/10 border border-gray-500/20'
                                }`}
                              >
                                <div className={`text-2xl mb-1 ${req.met ? 'text-green-400' : 'text-gray-400'}`}>
                                  {req.met ? '✓' : '○'}
                                </div>
                                <div className={`text-xs font-medium ${req.met ? 'text-green-300' : 'text-gray-400'}`}>
                                  {idx + 1}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
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

            {/* Sidebar - Enhanced */}
            <div className="space-y-6">
              {/* Current Status - Enhanced */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card rounded-2xl p-6 border border-accent/20"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-accent/20 rounded-lg">
                    <FaChartLine className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="text-xl font-bold text-primary">Current Status</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="p-3 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg border border-cyan-500/20">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-text-secondary text-sm">BITR Balance</span>
                      <FaCoins className="h-4 w-4 text-accent" />
                    </div>
                    <span className="text-primary font-bold text-lg">{token.balance}</span>
                  </div>
                  
                  <div className="p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-text-secondary text-sm">Staked Amount</span>
                      <FaShieldAlt className="h-4 w-4 text-purple-400" />
                    </div>
                    <span className="text-primary font-bold text-lg">
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
                  
                  <div className="p-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/20">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-text-secondary text-sm">Staking Tier</span>
                      <FaCrown className="h-4 w-4 text-yellow-400" />
                    </div>
                    <span className="text-primary font-bold text-lg">{staking.userTierName || 'None'}</span>
                  </div>
                  
                  <div className="p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-text-secondary text-sm">Faucet Claimed</span>
                      <FaGift className="h-4 w-4 text-green-400" />
                    </div>
                    <span className="text-primary font-bold text-lg">
                      {(
                        (typeof eligibility?.requirements?.faucetClaim === 'object' 
                          ? eligibility.requirements.faucetClaim.hasClaimed 
                          : eligibility?.requirements?.faucetClaim) 
                        || faucet.hasClaimed 
                        || (faucet.userInfo && faucet.userInfo.claimed)
                      )
                        ? `${formatBITRAmount('20000000000000000000000')} BITR` 
                        : 'Not claimed'}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Quick Actions - Enhanced */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card rounded-2xl p-6 border border-accent/20"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-accent/20 rounded-lg">
                    <SparklesSolid className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="text-xl font-bold text-primary">Quick Actions</h3>
                </div>
                
                <div className="space-y-3">
                  <a
                    href="/faucet"
                    className="group w-full flex items-center justify-between p-4 glass-card hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-blue-500/10 rounded-xl transition-all border border-transparent hover:border-cyan-500/30 hover:scale-[1.02]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-cyan-500/20 rounded-lg group-hover:bg-cyan-500/30 transition-colors">
                        <FaCoins className="h-5 w-5 text-cyan-400" />
                      </div>
                      <div>
                        <span className="text-primary font-semibold block">Claim Faucet</span>
                        <span className="text-text-muted text-xs">Get 20K testnet BITR</span>
                      </div>
                    </div>
                    <span className="text-accent group-hover:translate-x-1 transition-transform">→</span>
                  </a>
                  
                  <a
                    href="/staking"
                    className="group w-full flex items-center justify-between p-4 glass-card hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-pink-500/10 rounded-xl transition-all border border-transparent hover:border-purple-500/30 hover:scale-[1.02]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                        <FaShieldAlt className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <span className="text-primary font-semibold block">Start Staking</span>
                        <span className="text-text-muted text-xs">Earn rewards</span>
                      </div>
                    </div>
                    <span className="text-accent group-hover:translate-x-1 transition-transform">→</span>
                  </a>
                  
                  <a
                    href="/oddyssey"
                    className="group w-full flex items-center justify-between p-4 glass-card hover:bg-gradient-to-r hover:from-green-500/10 hover:to-emerald-500/10 rounded-xl transition-all border border-transparent hover:border-green-500/30 hover:scale-[1.02]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                        <FaGamepad className="h-5 w-5 text-green-400" />
                      </div>
                      <div>
                        <span className="text-primary font-semibold block">Play Oddyssey</span>
                        <span className="text-text-muted text-xs">Submit 5 slips</span>
                      </div>
                    </div>
                    <span className="text-accent group-hover:translate-x-1 transition-transform">→</span>
                  </a>
                  
                  <a
                    href="/markets"
                    className="group w-full flex items-center justify-between p-4 glass-card hover:bg-gradient-to-r hover:from-yellow-500/10 hover:to-orange-500/10 rounded-xl transition-all border border-transparent hover:border-yellow-500/30 hover:scale-[1.02]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-500/20 rounded-lg group-hover:bg-yellow-500/30 transition-colors">
                        <FaChartLine className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div>
                        <span className="text-primary font-semibold block">Trade Markets</span>
                        <span className="text-text-muted text-xs">Complete 20+ actions</span>
                      </div>
                    </div>
                    <span className="text-accent group-hover:translate-x-1 transition-transform">→</span>
                  </a>
                </div>
              </motion.div>

              {/* Info Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card rounded-2xl p-6 border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-cyan-500/5"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg mt-1">
                    <FaGift className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-primary font-bold mb-2">About the Airdrop</h4>
                    <p className="text-text-secondary text-sm leading-relaxed">
                      5% of mainnet BITR supply (5M tokens) will be distributed to eligible testnet participants. 
                      Complete all requirements to qualify!
                    </p>
                  </div>
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
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-primary">Airdrop Leaderboard</h2>
                    {wsConnected && (
                      <span className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-xs text-green-400 flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                        Live
                      </span>
                    )}
                  </div>
                  <p className="text-text-secondary">Top participants by allocation amount {wsConnected ? '(Real-time updates)' : ''}</p>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <LoadingSpinner size="lg" />
                  <p className="text-text-muted mt-4">Loading leaderboard...</p>
                </div>
              ) : leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard.map((user, index) => {
                    const isEligible = (user as { isEligible?: boolean }).isEligible ?? false;
                    const hasFaucetClaim = (user as { hasFaucetClaim?: boolean }).hasFaucetClaim ?? false;
                    
                    return (
                      <motion.div
                        key={user.address}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex items-center gap-4 p-4 glass-card rounded-xl border transition-all hover:scale-[1.02] ${
                          isEligible 
                            ? 'border-green-500/30 bg-green-500/5' 
                            : hasFaucetClaim
                            ? 'border-yellow-500/30 bg-yellow-500/5'
                            : 'border-gray-500/20'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black' :
                          index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-500 text-black' :
                          index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-black' :
                          'bg-gradient-somnia text-black'
                        }`}>
                          {index < 3 ? (
                            <FaCrown className="h-5 w-5" />
                          ) : (
                            <span>#{index + 1}</span>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-primary font-semibold truncate">{formatAddress(user.address)}</p>
                            {isEligible && (
                              <span className="px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded-full text-xs text-green-400 font-medium">
                                Eligible
                              </span>
                            )}
                            {hasFaucetClaim && !isEligible && (
                              <span className="px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-xs text-yellow-400 font-medium">
                                Claimed Faucet
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-text-muted text-xs">
                            <span className="flex items-center gap-1">
                              <FaCoins className="h-3 w-3" />
                              {user.bitrActions} actions
                            </span>
                            <span className="flex items-center gap-1">
                              <FaGamepad className="h-3 w-3" />
                              {user.oddysseySlips} slips
                            </span>
                            <span className={`flex items-center gap-1 ${user.hasStaking ? 'text-green-400' : 'text-red-400'}`}>
                              <FaShieldAlt className="h-3 w-3" />
                              {user.hasStaking ? 'Staked' : 'No staking'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-right min-w-[120px]">
                          <p className="text-primary font-bold text-lg">
                            {user.airdropAmount ? formatBITRAmount(user.airdropAmount) : 'TBD'} BITR
                          </p>
                          <p className="text-text-muted text-xs mt-1">Score: {user.activityScore}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FaUsers className="h-12 w-12 text-text-muted mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-primary mb-2">No Leaderboard Data</h3>
                  <p className="text-text-muted mb-4">No users found in the leaderboard yet.</p>
                  <Button
                    onClick={() => fetchAirdropData()}
                    variant="outline"
                    size="sm"
                    className="mt-4"
                  >
                    Refresh Leaderboard
                  </Button>
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

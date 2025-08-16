"use client";

import { useEffect, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { toast } from "react-hot-toast";
import Button from "@/components/button";
import AnimatedTitle from "@/components/AnimatedTitle";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useFaucet } from "@/hooks/useFaucet";
import { useBITRToken } from "@/hooks/useBITRToken";
import { FaucetService, FaucetStatistics } from "@/services/faucetService";
import { 
  formatAddress 
} from "@/services/airdropService";
import { 
  FaFaucet, 
  FaCheckCircle, 
  FaCopy,
  FaExternalLinkAlt,
  FaGamepad,
  FaCoins,
  FaChartLine,
  FaTrophy,
  FaShieldAlt,
  FaTimesCircle,
  FaExclamationTriangle,
  FaGift
} from "react-icons/fa";
import { 
  BeakerIcon as BeakerSolid,
  GiftIcon as GiftSolid
} from "@heroicons/react/24/solid";



export default function FaucetPage() {
  const { address, isConnected } = useAccount();
  
  // Smart contract hooks
  const faucet = useFaucet();
  const token = useBITRToken();

  // Backend fallback state
  const [backendFaucetData, setBackendFaucetData] = useState<FaucetStatistics | null>(null);

  const fetchFaucetData = useCallback(async () => {
    if (!address) return;
    
    try {
      // Fetch backend data if needed
      // const statistics = await getFaucetStatistics();
      
      // Refetch contract data
      faucet.refetchAll();
      token.refetchBalance();
    } catch (error) {
      console.error("Error fetching faucet data:", error);
      toast.error("Failed to load faucet data");
    }
  }, [address, faucet, token]);

  // Fallback to backend API if contract data is not available
  const fetchBackendFaucetData = useCallback(async () => {
    if (!address) return;
    
    try {
      const statistics = await FaucetService.getFaucetStatistics();
      setBackendFaucetData(statistics);
      console.log('🔍 Backend Faucet Data:', statistics);
    } catch (error) {
      console.error("Error fetching backend faucet data:", error);
    }
  }, [address]);

  useEffect(() => {
    if (isConnected && address) {
      fetchFaucetData();
      fetchBackendFaucetData(); // Also fetch backend data as fallback
    }
  }, [isConnected, address, fetchFaucetData, fetchBackendFaucetData]);

  // Debug information
  useEffect(() => {
    if (faucet.faucetStats) {
      console.log('🔍 Faucet Debug Info:', {
        faucetStats: faucet.faucetStats,
        isActive: faucet.isActive,
        hasSufficientBalance: faucet.hasSufficientBalance,
        faucetBalance: faucet.faucetBalance,
        totalDistributed: faucet.totalDistributed,
        userCount: faucet.userCount
      });
    }
  }, [faucet.faucetStats, faucet.isActive, faucet.hasSufficientBalance, faucet.faucetBalance, faucet.totalDistributed, faucet.userCount]);

  // Handle faucet claim
  const handleClaimFaucet = async () => {
    if (!address || !faucet.canClaim) return;
    
    try {
      await faucet.claimBitr();
      toast.success("Faucet claim transaction submitted!");
    } catch (error: unknown) {
      console.error("Error claiming faucet:", error);
      toast.error((error as Error).message || "Failed to claim faucet");
    }
  };

  // Watch for successful transaction
  useEffect(() => {
    if (faucet.isConfirmed) {
      toast.success("Faucet claimed successfully! 🎉");
      fetchFaucetData(); // Refresh data
    }
  }, [faucet.isConfirmed, fetchFaucetData]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const getClaimStatusIcon = () => {
    // Use backend data as fallback if contract shows inactive
    const isActive = faucet.isActive || backendFaucetData?.faucet?.active;
    const hasSufficientBalance = faucet.hasSufficientBalance || backendFaucetData?.faucet?.hasSufficientBalance;
    
    if (faucet.hasClaimed) {
      return <FaCheckCircle className="h-12 w-12 text-green-400" />;
    } else if (!isActive) {
      return <FaTimesCircle className="h-12 w-12 text-red-400" />;
    } else if (!hasSufficientBalance) {
      return <FaExclamationTriangle className="h-12 w-12 text-yellow-400" />;
    } else {
      return <FaFaucet className="h-12 w-12 text-blue-400" />;
    }
  };

  const getClaimStatusColor = () => {
    // Use backend data as fallback if contract shows inactive
    const isActive = faucet.isActive || backendFaucetData?.faucet?.active;
    const hasSufficientBalance = faucet.hasSufficientBalance || backendFaucetData?.faucet?.hasSufficientBalance;
    
    if (faucet.hasClaimed) {
      return 'text-green-400';
    } else if (!isActive) {
      return 'text-red-400';
    } else if (!hasSufficientBalance) {
      return 'text-yellow-400';
    } else {
      return 'text-blue-400';
    }
  };

  // Get the actual faucet status with fallback logic
  const getFaucetStatus = () => {
    const isActive = faucet.isActive || backendFaucetData?.faucet?.active;
    return isActive ? 'Active' : 'Inactive';
  };

  // Get the actual faucet balance with fallback logic
  const getFaucetBalance = () => {
    // Use backend data if contract data is 0 or unavailable
    if (faucet.faucetBalance === '0' && backendFaucetData?.formatted?.balance) {
      return backendFaucetData.formatted.balance;
    }
    return faucet.faucetBalance + ' BITR';
  };

  // Get the actual total distributed with fallback logic
  const getTotalDistributed = () => {
    // Use backend data if contract data is 0 or unavailable
    if (faucet.totalDistributed === '0' && backendFaucetData?.formatted?.totalDistributed) {
      return backendFaucetData.formatted.totalDistributed;
    }
    return faucet.totalDistributed + ' BITR';
  };

  // Get the claim button text
  const getClaimButtonText = () => {
    if (faucet.hasClaimed) {
      return 'Already Claimed';
    } else if (getFaucetStatus() === 'Inactive') {
      return 'Faucet is Inactive';
    } else if (!faucet.canClaim) {
      return 'Not Eligible';
    } else {
      return `Claim ${faucet.faucetAmount} BITR`;
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center"
        >
          <BeakerSolid className="h-16 w-16 text-blue-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
          <p className="text-gray-300 mb-6">
            Connect your wallet to claim your testnet BITR tokens from the faucet.
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
        leftIcon={BeakerSolid}
        rightIcon={FaGift}
      >
        Testnet Faucet
      </AnimatedTitle>
      
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-base text-text-secondary max-w-2xl mx-auto text-center mb-6"
      >
        Claim your free testnet BITR tokens to start participating in prediction markets and staking.
      </motion.p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Claim Panel */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
            >
              {/* Claim Status */}
              <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                  {getClaimStatusIcon()}
                </div>
                <h2 className={`text-2xl font-bold mb-2 ${getClaimStatusColor()}`}>
                  {faucet.hasClaimed 
                    ? 'Already Claimed!'
                    : getFaucetStatus() === 'Active' 
                      ? 'Ready to Claim'
                      : 'Faucet is Inactive'
                  }
                </h2>
                <p className="text-gray-400">
                  {faucet.hasClaimed 
                    ? `You claimed ${faucet.faucetAmount} BITR on ${faucet.claimDate}`
                    : `Get ${faucet.faucetAmount} BITR tokens for free`
                  }
                </p>
              </div>

              {/* Claim Details */}
              <div className="bg-black/20 rounded-xl p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div>
                    <FaCoins className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Claim Amount</p>
                    <p className="text-2xl font-bold text-white">{faucet.faucetAmount} BITR</p>
                  </div>
                  
                  <div>
                    <FaShieldAlt className="h-8 w-8 text-green-400 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Claim Type</p>
                    <p className="text-xl font-bold text-white">One-Time Only</p>
                  </div>
                  
                  <div>
                    <FaChartLine className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Faucet Status</p>
                    <p className={`text-xl font-bold ${getFaucetStatus() === 'Active' ? 'text-green-400' : 'text-red-400'}`}>
                      {getFaucetStatus()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Claim Button */}
              <div className="text-center">
                {faucet.hasClaimed ? (
                  <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-6">
                    <FaCheckCircle className="h-8 w-8 text-green-400 mx-auto mb-3" />
                    <h3 className="text-xl font-bold text-green-400 mb-2">
                      Already Claimed!
                    </h3>
                    <p className="text-gray-300 mb-4">
                      You have already claimed your testnet BITR tokens on {faucet.claimDate}.
                    </p>
                    <p className="text-gray-400 text-sm">
                      Each wallet can only claim once. Use your tokens for staking and prediction markets!
                    </p>
                  </div>
                ) : (
                  <Button
                    onClick={handleClaimFaucet}
                    disabled={
                      !faucet.canClaim ||
                      faucet.isPending ||
                      faucet.isConfirming
                    }
                    className={`w-full py-6 text-xl font-bold ${
                      faucet.canClaim
                        ? "bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
                        : "bg-gray-600 cursor-not-allowed"
                    }`}
                  >
                    {faucet.isPending || faucet.isConfirming ? (
                      <div className="flex items-center justify-center gap-3">
                        <LoadingSpinner size="sm" />
                        {faucet.isPending ? "Confirming..." : "Processing..."}
                      </div>
                    ) : (
                      <>
                        <FaFaucet className="inline mr-3" />
                        {getClaimButtonText()}
                      </>
                    )}
                  </Button>
                )}

                {!faucet.canClaim && !faucet.hasClaimed && getFaucetStatus() === 'Inactive' && (
                  <div className="mt-4 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-xl">
                    <FaExclamationTriangle className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
                    <p className="text-yellow-300 font-medium">
                      {getFaucetStatus() === 'Inactive' ? 'Faucet maintenance in progress' : faucet.claimStatus}
                    </p>
                    {!faucet.hasSufficientBalance && (
                      <p className="text-gray-400 text-sm mt-2">
                        The faucet is temporarily empty. Please try again later.
                      </p>
                    )}
                  </div>
                )}

                {/* Debug Information */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-6 p-4 bg-gray-800/50 border border-gray-600 rounded-xl">
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Debug Info</h4>
                    <div className="text-xs space-y-1">
                      <div>Contract Active: {faucet.isActive ? 'Yes' : 'No'}</div>
                      <div>Backend Active: {backendFaucetData?.faucet?.active ? 'Yes' : 'No'}</div>
                      <div>Contract Balance: {faucet.faucetBalance}</div>
                      <div>Backend Balance: {backendFaucetData?.formatted?.balance}</div>
                      <div>Can Claim: {faucet.canClaim ? 'Yes' : 'No'}</div>
                      <div>Has Claimed: {faucet.hasClaimed ? 'Yes' : 'No'}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Usage Instructions */}
              <div className="mt-8 border-t border-gray-600 pt-8">
                <h3 className="text-xl font-bold text-white mb-4">What to do with your BITR?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 bg-black/20 rounded-xl">
                    <FaTrophy className="h-6 w-6 text-yellow-400 mt-1" />
                    <div>
                      <h4 className="text-white font-medium mb-1">Stake for Rewards</h4>
                      <p className="text-gray-400 text-sm">
                        Stake your BITR tokens to earn APY rewards and revenue sharing
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 bg-black/20 rounded-xl">
                    <FaGamepad className="h-6 w-6 text-purple-400 mt-1" />
                    <div>
                      <h4 className="text-white font-medium mb-1">Prediction Markets</h4>
                      <p className="text-gray-400 text-sm">
                        Use BITR to create pools and place bets on future events
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Stats Panel */}
          <div className="space-y-6">
            {/* Current Balance */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
            >
              <h3 className="text-xl font-bold text-white mb-4">Your Balance</h3>
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <FaCoins className="h-12 w-12 text-yellow-400" />
                </div>
                <p className="text-3xl font-bold text-white mb-2">{token.balance}</p>
                <p className="text-gray-400">BITR Tokens</p>
                
                <div className="flex items-center justify-center gap-2 mt-4">
                  <span className="text-gray-400 text-sm truncate">{formatAddress(address!)}</span>
                  <button
                    onClick={() => copyToClipboard(address!)}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <FaCopy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Faucet Statistics */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
            >
              <h3 className="text-xl font-bold text-white mb-4">Faucet Statistics</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Faucet Balance</span>
                  <span className="text-white font-medium">{getFaucetBalance()}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Distributed</span>
                  <span className="text-white font-medium">{getTotalDistributed()}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Users</span>
                  <span className="text-white font-medium">{faucet.userCount}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Remaining Claims</span>
                  <span className="text-white font-medium">{faucet.maxPossibleClaims}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <span className={`font-medium ${getFaucetStatus() === 'Active' ? 'text-green-400' : 'text-red-400'}`}>
                    {getFaucetStatus()}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
            >
              <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <a
                  href="/staking"
                  className="w-full flex items-center justify-between p-3 bg-black/20 hover:bg-black/30 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FaTrophy className="h-5 w-5 text-yellow-400" />
                    <span className="text-white">Start Staking</span>
                  </div>
                  <FaExternalLinkAlt className="h-4 w-4 text-gray-400" />
                </a>
                
                <a
                  href="/markets"
                  className="w-full flex items-center justify-between p-3 bg-black/20 hover:bg-black/30 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FaGamepad className="h-5 w-5 text-purple-400" />
                    <span className="text-white">Prediction Markets</span>
                  </div>
                  <FaExternalLinkAlt className="h-4 w-4 text-gray-400" />
                </a>
                
                <a
                  href="/airdrop"
                  className="w-full flex items-center justify-between p-3 bg-black/20 hover:bg-black/30 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <GiftSolid className="h-5 w-5 text-green-400" />
                    <span className="text-white">Check Airdrop</span>
                  </div>
                  <FaExternalLinkAlt className="h-4 w-4 text-gray-400" />
                </a>
              </div>
            </motion.div>
          </div>
        </div>
    </motion.div>
  );
}

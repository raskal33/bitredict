"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { toast } from "react-hot-toast";
import Button from "@/components/button";
import AnimatedTitle from "@/components/AnimatedTitle";
import LoadingSpinner from "@/components/LoadingSpinner";
import { 
  checkAirdropEligibility, 
  claimFaucet, 
  getAirdropStatistics,
  formatBITRAmount,
  formatAddress,
  calculateRequirementProgress 
} from "@/services/airdropService";
import { UserEligibility, AirdropStatistics } from "@/types/airdrop";
import { 
  FaFaucet, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaExclamationTriangle,
  FaCopy,
  FaExternalLinkAlt,
  FaGamepad,
  FaCoins,
  FaChartLine,
  FaTrophy,
  FaShieldAlt
} from "react-icons/fa";
import { 
  BeakerIcon as BeakerSolid,
  GiftIcon as GiftSolid,
  CheckBadgeIcon,
  ClockIcon
} from "@heroicons/react/24/solid";

export default function FaucetPage() {
  const { address, isConnected } = useAccount();
  const [eligibility, setEligibility] = useState<UserEligibility | null>(null);
  const [statistics, setStatistics] = useState<AirdropStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [lastClaimedTx, setLastClaimedTx] = useState<string>("");

  const fetchEligibility = useCallback(async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      const result = await checkAirdropEligibility(address);
      setEligibility(result);
    } catch (error) {
      console.error("Error fetching eligibility:", error);
      toast.error("Failed to check eligibility");
    } finally {
      setLoading(false);
    }
  }, [address]);

  // Fetch eligibility when wallet connects
  useEffect(() => {
    if (address) {
      fetchEligibility();
    } else {
      setEligibility(null);
    }
  }, [address, fetchEligibility]);

  // Fetch statistics on page load
  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const stats = await getAirdropStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  const handleClaimFaucet = async () => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    setClaiming(true);
    try {
      const result = await claimFaucet({ userAddress: address });
      
      if (result.success) {
        toast.success("Faucet claimed successfully!");
        if (result.transactionHash) {
          setLastClaimedTx(result.transactionHash);
        }
        // Refresh eligibility
        await fetchEligibility();
        await fetchStatistics();
      } else {
        toast.error(result.message || "Failed to claim faucet");
      }
    } catch (error) {
      console.error("Error claiming faucet:", error);
      toast.error("An error occurred while claiming faucet");
    } finally {
      setClaiming(false);
    }
  };

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    toast.success("Address copied to clipboard!");
  };

  const getRequirementIcon = (met: boolean, warning?: boolean) => {
    if (warning) return <FaExclamationTriangle className="text-warning" />;
    return met ? <FaCheckCircle className="text-success" /> : <FaTimesCircle className="text-error" />;
  };

  const getStatusBadge = (eligibilityStatus: string) => {
    switch (eligibilityStatus) {
      case 'eligible':
        return (
          <div className="inline-flex items-center gap-2 bg-success/20 text-success px-3 py-1 rounded-full text-sm font-medium">
            <FaCheckCircle size={14} />
            Eligible for Airdrop
          </div>
        );
      case 'not_eligible':
        return (
          <div className="inline-flex items-center gap-2 bg-error/20 text-error px-3 py-1 rounded-full text-sm font-medium">
            <FaTimesCircle size={14} />
            Not Eligible
          </div>
        );
      case 'pending_calculation':
        return (
          <div className="inline-flex items-center gap-2 bg-warning/20 text-warning px-3 py-1 rounded-full text-sm font-medium">
            <ClockIcon className="w-4 h-4" />
            Calculating...
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-2 bg-text-muted/20 text-text-muted px-3 py-1 rounded-full text-sm font-medium">
            <FaFaucet size={14} />
            Claim Faucet First
          </div>
        );
    }
  };

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 space-y-8"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center relative"
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute top-[20%] left-[15%] w-6 h-6 bg-primary/20 rounded-full blur-sm"
            animate={{ y: [-10, 10, -10], x: [-5, 5, -5], scale: [1, 1.2, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute top-[60%] right-[20%] w-4 h-4 bg-secondary/30 rounded-full blur-sm"
            animate={{ y: [10, -10, 10], x: [5, -5, 5], scale: [1, 1.3, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          <motion.div 
            className="absolute bottom-[30%] left-[70%] w-5 h-5 bg-accent/25 rounded-full blur-sm"
            animate={{ y: [-8, 8, -8], x: [-3, 3, -3], scale: [1, 1.1, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
        </div>

        <div className="relative z-10 mb-8">
          <AnimatedTitle 
            size="lg"
            leftIcon={BeakerSolid}
            rightIcon={GiftSolid}
          >
            BITR Faucet & Airdrop
          </AnimatedTitle>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xl text-text-secondary max-w-3xl mx-auto text-center"
          >
            Claim 20,000 testnet BITR tokens and become eligible for the mainnet airdrop by completing platform activities.
          </motion.p>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column - Faucet Claim */}
        <div className="lg:col-span-2 space-y-6">
          {/* Faucet Claim Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/20 rounded-full">
                <FaFaucet className="text-2xl text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-text-primary">Claim Testnet BITR</h3>
                <p className="text-text-muted">Get 20,000 BITR tokens (once per wallet)</p>
              </div>
            </div>

            {!isConnected ? (
              <div className="text-center py-8">
                <FaShieldAlt className="text-4xl text-text-muted mx-auto mb-4" />
                <p className="text-text-muted mb-4">Connect your wallet to claim faucet tokens</p>
                <w3m-connect-button />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-bg-card rounded-xl border border-border-card">
                  <span className="text-text-muted">Your Address:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-text-primary font-mono">{formatAddress(address!)}</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyAddress(address!)}
                      className="p-2"
                    >
                      <FaCopy size={14} />
                    </Button>
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner />
                    <span className="ml-3 text-text-muted">Checking eligibility...</span>
                  </div>
                ) : eligibility ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted">Status:</span>
                      {getStatusBadge(eligibility.eligibilityStatus)}
                    </div>

                    {eligibility.faucetClaim.hasClaimed ? (
                      <div className="bg-success/10 border border-success/20 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <FaCheckCircle className="text-success" />
                          <span className="font-medium text-success">Faucet Already Claimed!</span>
                        </div>
                        <p className="text-text-secondary text-sm">
                          You claimed {formatBITRAmount(eligibility.faucetClaim.amount || "0", 18)} BITR on{" "}
                          {eligibility.faucetClaim.claimedAt ? 
                            new Date(eligibility.faucetClaim.claimedAt).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        fullWidth
                        size="lg"
                        onClick={handleClaimFaucet}
                        loading={claiming}
                        disabled={claiming}
                      >
                        {claiming ? "Claiming..." : "Claim 20,000 BITR"}
                      </Button>
                    )}

                    {lastClaimedTx && (
                      <div className="flex items-center gap-2 text-sm text-text-muted">
                        <span>Transaction:</span>
                        <a 
                          href={`https://explorer.somnia.network/tx/${lastClaimedTx}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          {formatAddress(lastClaimedTx, 12)}
                          <FaExternalLinkAlt size={12} />
                        </a>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </motion.div>

          {/* Airdrop Requirements */}
          {eligibility && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-secondary/20 rounded-full">
                  <CheckBadgeIcon className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-text-primary">Airdrop Requirements</h3>
                  <p className="text-text-muted">
                    Complete all requirements to become eligible ({calculateRequirementProgress(eligibility.requirements)}% complete)
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="w-full bg-bg-card rounded-full h-3 overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${calculateRequirementProgress(eligibility.requirements)}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
              </div>

              <div className="space-y-4">
                {/* Requirement 1: Faucet Claim */}
                <div className="flex items-center gap-3 p-4 bg-bg-card rounded-xl border border-border-card">
                  {getRequirementIcon(eligibility.requirements.faucetClaim)}
                  <div className="flex-1">
                    <div className="font-medium text-text-primary">Claim Faucet</div>
                    <div className="text-sm text-text-muted">Must claim testnet BITR tokens</div>
                  </div>
                </div>

                {/* Requirement 2: STT Activity */}
                <div className="flex items-center gap-3 p-4 bg-bg-card rounded-xl border border-border-card">
                  {getRequirementIcon(eligibility.requirements.sttActivityBeforeFaucet)}
                  <div className="flex-1">
                    <div className="font-medium text-text-primary">STT Activity Before Faucet</div>
                    <div className="text-sm text-text-muted">
                      Create a pool OR place a bet with STT before claiming faucet
                      {eligibility.faucetClaim.hadPriorSTTActivity && (
                        <span className="text-success ml-2">
                          ({eligibility.faucetClaim.sttActivityCountBeforeFaucet} activities found)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Requirement 3: BITR Actions */}
                <div className="flex items-center gap-3 p-4 bg-bg-card rounded-xl border border-border-card">
                  {getRequirementIcon(eligibility.requirements.bitrActions.met)}
                  <div className="flex-1">
                    <div className="font-medium text-text-primary">
                      BITR Actions ({eligibility.requirements.bitrActions.current}/{eligibility.requirements.bitrActions.required})
                    </div>
                    <div className="text-sm text-text-muted">
                      Create pools, place bets, or stake using BITR
                    </div>
                    <div className="text-xs text-text-muted mt-1">
                      Pools: {eligibility.activityBreakdown.poolCreations} | 
                      Bets: {eligibility.activityBreakdown.betsPlaced} | 
                      Staking: {eligibility.activityBreakdown.stakingActions}
                    </div>
                  </div>
                </div>

                {/* Requirement 4: Staking */}
                <div className="flex items-center gap-3 p-4 bg-bg-card rounded-xl border border-border-card">
                  {getRequirementIcon(eligibility.requirements.stakingActivity)}
                  <div className="flex-1">
                    <div className="font-medium text-text-primary">Stake BITR</div>
                    <div className="text-sm text-text-muted">Stake any amount of BITR tokens</div>
                  </div>
                  {!eligibility.requirements.stakingActivity && (
                    <Button variant="outline" size="sm" onClick={() => window.open('/staking', '_blank')}>
                      <FaCoins className="mr-2" size={14} />
                      Stake Now
                    </Button>
                  )}
                </div>

                {/* Requirement 5: Oddyssey */}
                <div className="flex items-center gap-3 p-4 bg-bg-card rounded-xl border border-border-card">
                  {getRequirementIcon(eligibility.requirements.oddysseySlips.met)}
                  <div className="flex-1">
                    <div className="font-medium text-text-primary">
                      Oddyssey Slips ({eligibility.requirements.oddysseySlips.current}/{eligibility.requirements.oddysseySlips.required})
                    </div>
                    <div className="text-sm text-text-muted">Submit prediction slips in the daily game</div>
                  </div>
                  {!eligibility.requirements.oddysseySlips.met && (
                    <Button variant="outline" size="sm" onClick={() => window.open('/oddyssey', '_blank')}>
                      <FaGamepad className="mr-2" size={14} />
                      Play Now
                    </Button>
                  )}
                </div>
              </div>

              {/* Sybil Flags Warning */}
              {eligibility.sybilFlags.hasSybilActivity && (
                <div className="mt-6 bg-error/10 border border-error/20 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <FaExclamationTriangle className="text-error" />
                    <span className="font-medium text-error">Account Flagged</span>
                  </div>
                  <p className="text-text-secondary text-sm mb-2">
                    Your account has been flagged for suspicious activity:
                  </p>
                  <ul className="text-sm text-text-muted space-y-1">
                    {eligibility.sybilFlags.suspiciousTransfers && (
                      <li>• Suspicious transfer patterns detected</li>
                    )}
                    {eligibility.sybilFlags.transferOnlyRecipient && (
                      <li>• Only received BITR without platform activity</li>
                    )}
                    {eligibility.sybilFlags.consolidationDetected && (
                      <li>• Token consolidation pattern detected</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Next Steps */}
              {eligibility.nextSteps.length > 0 && (
                <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-xl">
                  <h4 className="font-medium text-primary mb-3">Next Steps:</h4>
                  <ul className="space-y-2">
                    {eligibility.nextSteps.map((step, index) => (
                      <li key={index} className="text-sm text-text-secondary flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Right Column - Statistics */}
        <div className="space-y-6">
          {/* Airdrop Info */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-accent/20 rounded-full">
                <FaTrophy className="text-lg text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">Mainnet Airdrop</h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-text-muted">Total Pool:</span>
                <span className="font-medium text-text-primary">5,000,000 BITR</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Faucet Amount:</span>
                <span className="font-medium text-text-primary">20,000 BITR</span>
              </div>
              {eligibility?.isEligible && eligibility.airdropInfo && (
                <>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Your Balance:</span>
                    <span className="font-medium text-success">
                      {formatBITRAmount(eligibility.airdropInfo.snapshotBalance || "0", 18)} BITR
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Estimated Airdrop:</span>
                    <span className="font-medium text-primary">
                      {formatBITRAmount(eligibility.airdropInfo.airdropAmount || "0", 18)} BITR
                    </span>
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* Global Statistics */}
          {statistics && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-card"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-somnia-cyan/20 rounded-full">
                  <FaChartLine className="text-lg text-somnia-cyan" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary">Global Stats</h3>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-text-muted">Total Claims:</span>
                  <span className="font-medium text-text-primary">
                    {statistics.overview.totalFaucetClaims.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Eligible Users:</span>
                  <span className="font-medium text-success">
                    {statistics.overview.totalEligible.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Eligibility Rate:</span>
                  <span className="font-medium text-primary">
                    {statistics.overview.eligibilityRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Avg BITR Actions:</span>
                  <span className="font-medium text-text-secondary">
                    {statistics.overview.averageBITRActions}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Avg Oddyssey Slips:</span>
                  <span className="font-medium text-text-secondary">
                    {statistics.overview.averageOddysseySlips}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Requirements Funnel */}
          {statistics && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="glass-card"
            >
              <h3 className="text-lg font-semibold text-text-primary mb-4">Requirement Funnel</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-text-muted">Claimed Faucet</span>
                  <span className="font-medium text-text-primary">
                    {statistics.requirementFunnel.claimedFaucet.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-muted">Had STT Activity</span>
                  <span className="font-medium text-text-secondary">
                    {statistics.requirementFunnel.hadSTTActivity.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-muted">Sufficient BITR Actions</span>
                  <span className="font-medium text-text-secondary">
                    {statistics.requirementFunnel.sufficientBITRActions.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-muted">Has Staking</span>
                  <span className="font-medium text-text-secondary">
                    {statistics.requirementFunnel.hasStaking.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-muted">Sufficient Oddyssey</span>
                  <span className="font-medium text-text-secondary">
                    {statistics.requirementFunnel.sufficientOddyssey.toLocaleString()}
                  </span>
                </div>
                <div className="border-t border-border-card pt-3 flex justify-between items-center">
                  <span className="text-text-primary font-medium">Fully Eligible</span>
                  <span className="font-bold text-success">
                    {statistics.requirementFunnel.fullyEligible.toLocaleString()}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.section>
  );
} 
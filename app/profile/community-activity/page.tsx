"use client";

import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { useUserBadges } from "@/hooks/useUserProfile";
import {
  UserGroupIcon,
  TrophyIcon,
  SparklesIcon,
  StarIcon
} from "@heroicons/react/24/outline";

export default function CommunityActivityPage() {
  const { address } = useAccount();
  const { data: badgeData, isLoading } = useUserBadges();

  if (!address) {
    return (
      <div className="space-y-8">
        <div className="glass-card p-12 text-center">
          <UserGroupIcon className="h-16 w-16 text-text-muted mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-text-primary mb-2">Connect Your Wallet</h2>
          <p className="text-text-secondary">Please connect your wallet to view community activity</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="glass-card p-8">
          <div className="h-8 bg-card-bg rounded w-1/3 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-card p-6">
                <div className="h-16 w-16 bg-card-bg rounded-full mb-4"></div>
                <div className="h-6 bg-card-bg rounded mb-2"></div>
                <div className="h-4 bg-card-bg rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const badges = badgeData?.active || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8"
      >
        <h1 className="text-3xl font-bold text-text-primary mb-2">Community Activity</h1>
        <p className="text-text-secondary">Your achievements and contributions to the community</p>
      </motion.div>

      {/* Badges Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <TrophyIcon className="h-5 w-5 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Your Badges</h2>
        </div>

        {badges.length === 0 ? (
          <div className="text-center py-12">
            <StarIcon className="h-12 w-12 text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">No Badges Yet</h3>
            <p className="text-text-secondary">Keep participating to earn badges!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {badges.map((badge, index: number) => (
              <motion.div
                key={badge.badgeType}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
                className="glass-card p-6 text-center"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                  <TrophyIcon className="h-10 w-10 text-white" />
                </div>
                <h3 className="font-bold text-text-primary mb-2">
                  {badge.badgeType.split('_').map((w: string) => 
                    w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
                  ).join(' ')}
                </h3>
                <p className="text-sm text-text-secondary mb-3">
                  {badge.description || 'Achievement unlocked'}
                </p>
                <div className="text-xs text-text-muted">
                  Earned: {new Date(badge.earnedAt).toLocaleDateString()}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <SparklesIcon className="h-5 w-5 text-cyan-400" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Community Impact</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 text-center">
            <div className="text-3xl font-bold text-cyan-400 mb-2">{badges.length}</div>
            <div className="text-sm text-text-muted">Badges Earned</div>
          </div>
          <div className="glass-card p-6 text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {badgeData?.totalScore || 40}
            </div>
            <div className="text-sm text-text-muted">Reputation Score</div>
          </div>
          <div className="glass-card p-6 text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">
              Active
            </div>
            <div className="text-sm text-text-muted">Member Tier</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

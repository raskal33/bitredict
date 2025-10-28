"use client";

import React, { useState } from "react";
import { FaFire, FaChartLine, FaBolt } from "react-icons/fa";
import { IoStatsChart } from "react-icons/io5";
import { MdOutlineCategory } from "react-icons/md";
import { BiSolidBadgeCheck } from "react-icons/bi";
import { TrophyIcon } from "@heroicons/react/24/outline";
import { useAccount } from "wagmi";
import { useMyProfile, useUserBadges, useUserReputation, useCategoryPerformance } from "@/hooks/useUserProfile";
import ReputationBadge from "@/components/ReputationBadge";
import TrophyWall, { Trophy } from './TrophyWall';
import PrizeClaimModal from "@/components/PrizeClaimModal";
import Button from "@/components/button";

export default function ProfilePage() {
  const { address } = useAccount();
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  
  // Get real-time user data
  const { data: profile } = useMyProfile();
  const { data: badgeData } = useUserBadges();
  const { data: reputation } = useUserReputation();
  const { data: categoryData } = useCategoryPerformance();

  // Define getRarityScore function before it's used
  const getRarityScore = (rarity: 'legendary' | 'epic' | 'rare' | 'uncommon' | 'common'): number => {
    switch (rarity) {
      case 'legendary': return 100;
      case 'epic': return 50;
      case 'rare': return 25;
      case 'uncommon': return 10;
      case 'common': return 5;
      default: return 0;
    }
  };

  // Use real data from backend or fallback to defaults
  const userData = {
    stats: profile?.stats ? {
      totalBets: profile.stats.totalBets,
      wonBets: profile.stats.wonBets,
      winRate: profile.computedStats.winRateFormatted,
      profitLoss: profile.computedStats.profitLossFormatted,
      averageBetSize: profile.computedStats.averageBetSizeFormatted,
      biggestWin: profile.stats.biggestWin.toFixed(2) + " STT",
      totalVolume: profile.computedStats.totalVolumeFormatted,
      creatorVolume: "N/A", // Could be calculated from category data
      bettorVolume: profile.computedStats.totalVolumeFormatted,
      lastBetDate: profile.stats.lastActive ? new Date(profile.stats.lastActive).toISOString().split('T')[0] : "N/A"
    } : {
      totalBets: 0,
      wonBets: 0,
      winRate: "0%",
      profitLoss: "0 STT",
      averageBetSize: "0 STT",
      biggestWin: "0 STT",
      totalVolume: "0 STT",
      creatorVolume: "0 STT",
      bettorVolume: "0 STT",
      lastBetDate: "N/A"
    },
    achievements: badgeData?.active ? badgeData.active.map(badge => ({
      id: badge.id,
      name: badge.title,
      description: badge.description,
      icon: badge.iconName,
      date: new Date(badge.earnedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      rarity: badge.rarity,
      category: badge.badgeCategory
    })) : [
      { 
        id: 1, 
        name: "Getting Started", 
        description: "Welcome to BitRedict!", 
        icon: "FaBolt", 
        date: "Now",
        rarity: "common",
        category: "General"
      }
    ],
    recentActivity: profile?.recentActivity ? profile.recentActivity.slice(0, 4).map(activity => ({
      id: activity.id,
      type: activity.type,
      description: activity.description,
      amount: activity.amount,
      date: new Date(activity.timestamp).toLocaleDateString()
    })) : [
      {
        id: 1,
        type: "bet_placed",
        description: "Welcome to BitRedict! Start predicting to see your activity here.",
        amount: null,
        date: "Now"
      }
    ],
    categoryPerformance: categoryData?.categories ? categoryData.categories.map(cat => ({
      category: cat.category,
      winRate: Math.round(cat.winRate),
      volume: Math.round(cat.totalVolume)
    })) : [
      { category: "Getting Started", winRate: 0, volume: 0 }
    ]
  };

  // Transform achievements into trophies format
  const trophies: Trophy[] = userData.achievements.map(achievement => ({
    id: achievement.id.toString(),
    name: achievement.name,
    description: achievement.description,
    rarity: achievement.rarity as Trophy['rarity'],
    icon: achievement.icon,
    earnedAt: achievement.date,
    category: achievement.category,
    score: getRarityScore(achievement.rarity as 'legendary' | 'epic' | 'rare' | 'uncommon' | 'common')
  }));

  const getActivityIconClass = (type: string) => {
    switch (type) {
      case "bet_won":
        return "bg-green-500/20 text-green-400";
      case "bet_lost":
        return "bg-red-500/20 text-red-400";
      case "prediction_created":
        return "bg-blue-500/20 text-blue-400";
      case "bet_placed":
        return "bg-yellow-500/20 text-yellow-400";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "bet_won":
        return <BiSolidBadgeCheck />;
      case "bet_lost":
        return <FaFire />;
      case "prediction_created":
        return <FaChartLine />;
      case "bet_placed":
        return <FaBolt />;
      default:
        return <FaBolt />;
    }
  };

  return (
    <>
      {/* Prize Claiming Modal */}
      <PrizeClaimModal
        isOpen={showPrizeModal}
        onClose={() => setShowPrizeModal(false)}
        userAddress={address}
      />
      
      {/* Prize Claiming Button */}
      <div className="mb-6 flex justify-end">
        <Button
          onClick={() => setShowPrizeModal(true)}
          variant="primary"
          className="flex items-center gap-2"
        >
          <TrophyIcon className="h-5 w-5" />
          Claim Prizes
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* Left Column: Stats & Activity */}
      <div className="lg:col-span-1 space-y-8">
        {/* Reputation Badge */}
        {reputation && (
          <div className="glass-card p-6">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
              <BiSolidBadgeCheck className="text-primary" />
              Reputation
            </h3>
            <ReputationBadge 
              reputation={{
                actions: [],
                score: reputation.reputation,
                level: reputation.accessLevelName as "Limited" | "Elementary" | "Trusted" | "Verified",
                address: "", // Adding the required address property
                totalChallenges: 0,
                successfulChallenges: 0,
                marketsCreated: 0,
                wonBets: 0,
                totalOutcomeProposals: 0,
                correctOutcomeProposals: 0
              }}
            />
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-muted">Level: {reputation.accessLevelName}</span>
                <span className="text-sm text-primary">{reputation.reputation}/500</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${(reputation.reputation / 500) * 100}%` }}
                />
              </div>
              {reputation.nextMilestone && (
                <p className="text-xs text-text-muted mt-2">
                  {reputation.nextMilestone.points - reputation.reputation} points to {reputation.nextMilestone.level}
                </p>
              )}
            </div>
            {reputation.capabilities && reputation.capabilities.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-text-muted mb-2">Access Capabilities</h4>
                <div className="flex flex-wrap gap-2">
                  {reputation.capabilities.map((capability: string, index: number) => (
                    <span 
                      key={index}
                      className="px-2 py-1 rounded-full text-xs bg-primary/20 text-primary"
                    >
                      {capability}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stats Cards */}
        <div className="glass-card p-6">
          <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
            <IoStatsChart className="text-primary" />
            Performance Stats
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-bg-card p-4 text-center">
                <div className="text-sm text-text-muted">Win Rate</div>
                <div className="text-xl font-bold text-primary">{userData.stats.winRate}</div>
              </div>
              <div className="rounded-lg bg-bg-card p-4 text-center">
                <div className="text-sm text-text-muted">P&L</div>
                <div className="text-xl font-bold text-secondary">{userData.stats.profitLoss}</div>
              </div>
            </div>
            
            <div className="space-y-3 rounded-lg bg-bg-card p-4">
              <div className="flex justify-between">
                <span className="text-text-muted">Total Bets</span>
                <span className="font-medium text-text-secondary">{userData.stats.totalBets}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Won Bets</span>
                <span className="font-medium text-text-secondary">{userData.stats.wonBets}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Average Bet Size</span>
                <span className="font-medium text-text-secondary">{userData.stats.averageBetSize}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Biggest Win</span>
                <span className="font-medium text-text-secondary">{userData.stats.biggestWin}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card p-6">
          <h3 className="mb-4 text-xl font-semibold text-white flex items-center gap-2">
            <FaBolt className="text-primary" />
            Recent Activity
          </h3>
          <div className="space-y-4">
            {userData.recentActivity.map((activity) => (
              <div 
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-bg-card hover:bg-bg-card-hover transition-colors"
              >
                <div className={`p-2 rounded-lg ${getActivityIconClass(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-text-secondary">{activity.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-text-muted">{activity.date}</span>
                    {activity.amount && (
                      <span className={`text-xs font-medium ${
                        activity.type === 'bet_won' ? 'text-green-400' : 
                        activity.type === 'bet_lost' ? 'text-red-400' : 
                        'text-text-secondary'
                      }`}>
                        {activity.amount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Trophy Wall & Category Performance */}
      <div className="lg:col-span-2 space-y-8">
        {/* Trophy Wall */}
        <div className="glass-card p-6">
          <TrophyWall 
            trophies={trophies} 
            isOwnProfile={true} 
          />
        </div>

        {/* Category Performance */}
        <div className="glass-card p-6">
          <h3 className="mb-4 text-xl font-semibold text-white flex items-center gap-2">
            <MdOutlineCategory className="text-primary" />
            Category Performance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userData.categoryPerformance.map((category) => (
              <div 
                key={category.category}
                className="p-4 rounded-lg bg-bg-card"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-text-secondary">{category.category}</span>
                  <span className="text-sm font-medium text-primary">
                    {category.winRate}% Win Rate
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-bg-card-hover overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${category.winRate}%` }}
                  />
                </div>
                <div className="mt-2 text-sm text-text-muted">
                  Volume: {category.volume} STT
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

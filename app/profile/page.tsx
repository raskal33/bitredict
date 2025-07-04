"use client";

import React from "react";
import { FaFire, FaChartLine, FaBolt } from "react-icons/fa";
import { IoStatsChart } from "react-icons/io5";
import { MdOutlineCategory } from "react-icons/md";
import { BiSolidBadgeCheck } from "react-icons/bi";
import { useAccount } from "wagmi";
import { useReputationStore } from "@/stores/useReputationStore";
import ReputationBadge from "@/components/ReputationBadge";
import TrophyWall, { Trophy } from './TrophyWall';

export default function ProfilePage() {
  const { address } = useAccount();
  const { getUserReputation, getAccessCapabilities } = useReputationStore();
  
  // Get user reputation data
  const userReputation = address ? getUserReputation(address) : null;
  const accessCapabilities = address ? getAccessCapabilities(address) : [];

  // Mock user data - in a real app this would come from an API
  const userData = {
    stats: {
      totalBets: 120,
      wonBets: 80,
      winRate: "75%",
      profitLoss: "+50 STT",
      averageBetSize: "15 STT",
      biggestWin: "100 STT",
      totalVolume: "450 STT",
      creatorVolume: "300 STT",
      bettorVolume: "150 STT",
      lastBetDate: "2024-11-15"
    },
    achievements: [
      { 
        id: 1, 
        name: "First Blood", 
        description: "Won first prediction", 
        icon: "FaBolt", 
        date: "Jul 2024",
        rarity: "common",
        category: "General"
      },
      { 
        id: 2, 
        name: "Winning Streak", 
        description: "Won 5 predictions in a row", 
        icon: "FaFire", 
        date: "Aug 2024",
        rarity: "uncommon",
        category: "General"
      },
      { 
        id: 3, 
        name: "Market Maker", 
        description: "Created a prediction market with over 100 participants", 
        icon: "FaChartLine", 
        date: "Sep 2024",
        rarity: "rare",
        category: "General"
      },
      { 
        id: 4, 
        name: "Crypto Oracle", 
        description: "90% win rate in crypto predictions", 
        icon: "BiSolidBadgeCheck", 
        date: "Oct 2024",
        rarity: "epic",
        category: "Crypto"
      },
      { 
        id: 5, 
        name: "High Roller", 
        description: "Placed a bet of 100+ STT", 
        icon: "FaBolt", 
        date: "Nov 2024",
        rarity: "legendary",
        category: "General"
      }
    ],
    recentActivity: [
      {
        id: 1,
        type: "bet_won",
        description: "Won bet on \"BTC will break $70,000\"",
        amount: "+45 STT",
        date: "2 hours ago"
      },
      {
        id: 2,
        type: "prediction_created",
        description: "Created prediction \"ETH will hit $5,000 by Dec 2024\"",
        amount: null,
        date: "1 day ago"
      },
      {
        id: 3,
        type: "bet_placed",
        description: "Placed bet on \"STT will outperform ETH in Q4\"",
        amount: "25 STT",
        date: "3 days ago"
      },
      {
        id: 4,
        type: "bet_lost",
        description: "Lost bet on \"DOGE will reach $1\"",
        amount: "-15 STT",
        date: "1 week ago"
      }
    ],
    categoryPerformance: [
      { category: "Crypto", winRate: 82, volume: 250 },
      { category: "Sports", winRate: 65, volume: 120 },
      { category: "Politics", winRate: 70, volume: 50 },
      { category: "Entertainment", winRate: 60, volume: 30 }
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
    score: getRarityScore(achievement.rarity)
  }));

  const getRarityScore = (rarity: string): number => {
    switch (rarity) {
      case 'legendary': return 100;
      case 'epic': return 50;
      case 'rare': return 25;
      case 'uncommon': return 10;
      case 'common': return 5;
      default: return 0;
    }
  };

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
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* Left Column: Stats & Activity */}
      <div className="lg:col-span-1 space-y-8">
        {/* Reputation Badge */}
        {userReputation && (
          <div className="glass-card p-6">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
              <BiSolidBadgeCheck className="text-primary" />
              Reputation
            </h3>
            <ReputationBadge 
              reputation={userReputation}
            />
            {accessCapabilities.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-text-muted mb-2">Access Capabilities</h4>
                <div className="flex flex-wrap gap-2">
                  {accessCapabilities.map((capability, index) => (
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
  );
}

"use client";

import React from "react";
import { FaTrophy, FaFire, FaChartLine, FaBolt } from "react-icons/fa";
import { IoStatsChart } from "react-icons/io5";
import { MdOutlineCategory } from "react-icons/md";
import { BiSolidBadgeCheck } from "react-icons/bi";

export default function ProfilePage() {
  // Mock user data - in a real app this would come from an API
  const userData = {
    stats: {
      totalBets: 120,
      wonBets: 80,
      winRate: "75%",
      profitLoss: "+50 SOL",
      averageBetSize: "15 SOL",
      biggestWin: "100 SOL",
      totalVolume: "450 SOL",
      creatorVolume: "300 SOL",
      bettorVolume: "150 SOL",
      lastBetDate: "2024-11-15"
    },
    achievements: [
      { 
        id: 1, 
        name: "First Blood", 
        description: "Won first prediction", 
        icon: <FaBolt className="text-warning" />, 
        date: "Jul 2024",
        rarity: "common"
      },
      { 
        id: 2, 
        name: "Winning Streak", 
        description: "Won 5 predictions in a row", 
        icon: <FaFire className="text-error" />, 
        date: "Aug 2024",
        rarity: "uncommon"
      },
      { 
        id: 3, 
        name: "Market Maker", 
        description: "Created a prediction market with over 100 participants", 
        icon: <FaChartLine className="text-primary" />, 
        date: "Sep 2024",
        rarity: "rare"
      },
      { 
        id: 4, 
        name: "Crypto Oracle", 
        description: "90% win rate in crypto predictions", 
        icon: <BiSolidBadgeCheck className="text-accent" />, 
        date: "Oct 2024",
        rarity: "epic"
      },
      { 
        id: 5, 
        name: "High Roller", 
        description: "Placed a bet of 100+ SOL", 
        icon: <FaTrophy className="text-secondary" />, 
        date: "Nov 2024",
        rarity: "legendary"
      }
    ],
    recentActivity: [
      {
        id: 1,
        type: "bet_won",
        description: "Won bet on \"BTC will break $70,000\"",
        amount: "+45 SOL",
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
        description: "Placed bet on \"SOL will outperform ETH in Q4\"",
        amount: "25 SOL",
        date: "3 days ago"
      },
      {
        id: 4,
        type: "bet_lost",
        description: "Lost bet on \"DOGE will reach $1\"",
        amount: "-15 SOL",
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

  const getAchievementBadgeClass = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "bg-gray-500/20 text-gray-300";
      case "uncommon":
        return "bg-green-500/20 text-green-400";
      case "rare":
        return "bg-blue-500/20 text-blue-400";
      case "epic":
        return "bg-purple-500/20 text-purple-400";
      case "legendary":
        return "bg-orange-500/20 text-orange-400";
      default:
        return "bg-gray-500/20 text-gray-300";
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
      {/* Left Column: Stats & Achievements */}
      <div className="lg:col-span-1 space-y-8">
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
              <div className="flex justify-between">
                <span className="text-text-muted">Total Volume</span>
                <span className="font-medium text-text-secondary">{userData.stats.totalVolume}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Achievements */}
        <div className="glass-card p-6">
          <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
            <FaTrophy className="text-secondary" />
            Achievements
          </h3>
          
          <div className="space-y-3">
            {userData.achievements.map((achievement) => (
              <div key={achievement.id} className="flex items-center gap-3 rounded-lg bg-bg-card p-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${getAchievementBadgeClass(achievement.rarity)}`}>
                  {achievement.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-white">{achievement.name}</div>
                    <div className="text-xs text-text-muted">{achievement.date}</div>
                  </div>
                  <div className="text-sm text-text-muted">{achievement.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Middle & Right Columns */}
      <div className="lg:col-span-2 space-y-8">
        {/* Recent Activity */}
        <div className="glass-card p-6">
          <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
            <FaFire className="text-primary" />
            Recent Activity
          </h3>
          
          <div className="space-y-4">
            {userData.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 rounded-lg bg-bg-card p-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${getActivityIconClass(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-white">{activity.description}</div>
                    <div className="text-xs text-text-muted">{activity.date}</div>
                  </div>
                  {activity.amount && (
                    <div className={`text-sm ${activity.type === 'bet_won' ? 'text-green-400' : activity.type === 'bet_lost' ? 'text-red-400' : 'text-text-secondary'}`}>
                      {activity.amount}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Category Performance */}
        <div className="glass-card p-6">
          <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
            <MdOutlineCategory className="text-secondary" />
            Category Performance
          </h3>
          
          <div className="space-y-6">
            {userData.categoryPerformance.map((category, index) => (
              <div key={index}>
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-white">{category.category}</span>
                    <span className="ml-2 text-sm text-text-muted">({category.volume} SOL)</span>
                  </div>
                  <span className="font-medium text-primary">{category.winRate}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-bg-card">
                  <div
                    className={`h-full rounded-full ${
                      category.winRate > 75
                        ? "bg-gradient-to-r from-somnia-cyan to-somnia-blue"
                        : category.winRate > 60
                        ? "bg-gradient-to-r from-somnia-blue to-somnia-violet"
                        : "bg-gradient-to-r from-somnia-violet to-somnia-magenta"
                    }`}
                    style={{ width: `${category.winRate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Last Bets */}
        <div className="glass-card p-6">
          <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
            <FaChartLine className="text-primary" />
            Betting Volume
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-bg-card p-4">
                <div className="mb-2 text-sm text-text-muted">As Bettor</div>
                <div className="flex items-end justify-between">
                  <div className="text-2xl font-bold text-white">{userData.stats.bettorVolume}</div>
                  <div className="text-xs text-text-muted">33% of total</div>
                </div>
                <div className="mt-2 h-1 w-full rounded-full bg-bg-card">
                  <div className="h-full w-1/3 rounded-full bg-primary"></div>
                </div>
              </div>
              
              <div className="rounded-lg bg-bg-card p-4">
                <div className="mb-2 text-sm text-text-muted">As Creator</div>
                <div className="flex items-end justify-between">
                  <div className="text-2xl font-bold text-white">{userData.stats.creatorVolume}</div>
                  <div className="text-xs text-text-muted">67% of total</div>
                </div>
                <div className="mt-2 h-1 w-full rounded-full bg-bg-card">
                  <div className="h-full w-2/3 rounded-full bg-secondary"></div>
                </div>
              </div>
            </div>
            
            <div className="rounded-lg bg-bg-card p-4">
              <div className="mb-2 text-center text-sm text-text-muted">Last Bet Placed</div>
              <div className="text-center text-lg font-medium text-white">
                {userData.stats.lastBetDate} on &quot;BTC will break $70,000&quot;
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

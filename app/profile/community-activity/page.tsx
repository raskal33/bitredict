"use client";

import { useState } from "react";
import { FaUserFriends, FaCommentAlt, FaThumbsUp, FaShare, FaChartLine } from "react-icons/fa";
import { IoMdTrophy } from "react-icons/io";
import { MdOutlineLeaderboard } from "react-icons/md";
import Button from "@/components/button";

export default function CommunityActivityPage() {
  const [activeTab, setActiveTab] = useState("activity");
  
  // Mock data for community activity
  const communityData = {
    followers: [
      { id: 1, username: "crypto_king", displayName: "Crypto King", avatar: "👑", followDate: "2 days ago", isFollowing: true },
      { id: 2, username: "prediction_master", displayName: "Prediction Master", avatar: "🔮", followDate: "1 week ago", isFollowing: false },
      { id: 3, username: "stt_fan", displayName: "STT Fan", avatar: "💎", followDate: "2 weeks ago", isFollowing: true },
      { id: 4, username: "btc_maximalist", displayName: "BTC Maximalist", avatar: "₿", followDate: "1 month ago", isFollowing: false },
      { id: 5, username: "eth_lover", displayName: "ETH Lover", avatar: "Ξ", followDate: "1 month ago", isFollowing: true }
    ],
    following: [
      { id: 6, username: "crypto_oracle", displayName: "Crypto Oracle", avatar: "🧙", followDate: "3 days ago", isFollowing: true },
      { id: 7, username: "sports_predictor", displayName: "Sports Predictor", avatar: "⚽", followDate: "5 days ago", isFollowing: true },
      { id: 8, username: "market_maker", displayName: "Market Maker", avatar: "📊", followDate: "2 weeks ago", isFollowing: true },
      { id: 9, username: "stt_trader", displayName: "STT Trader", avatar: "💰", followDate: "3 weeks ago", isFollowing: true },
      { id: 10, username: "prediction_pro", displayName: "Prediction Pro", avatar: "🏆", followDate: "1 month ago", isFollowing: true }
    ],
    activity: [
      { 
        id: 1, 
        type: "follow", 
        user: { username: "crypto_king", displayName: "Crypto King", avatar: "👑" },
        timestamp: "2 days ago",
        content: "started following you"
      },
      { 
        id: 2, 
        type: "comment", 
        user: { username: "prediction_master", displayName: "Prediction Master", avatar: "🔮" },
        timestamp: "3 days ago",
        content: "commented on your prediction \"BTC will break $70,000\"",
        comment: "I agree with this prediction. The market indicators are strong!"
      },
      { 
        id: 3, 
        type: "bet", 
            user: { username: "stt_fan", displayName: "STT Fan", avatar: "💎" },
    timestamp: "5 days ago",
    content: "placed a bet on your prediction \"STT will outperform ETH in Q4\"",
    betAmount: "25 STT on Yes"
      },
      { 
        id: 4, 
        type: "like", 
        user: { username: "btc_maximalist", displayName: "BTC Maximalist", avatar: "₿" },
        timestamp: "1 week ago",
        content: "liked your prediction \"Bitcoin will reach $100k by EOY\""
      },
      { 
        id: 5, 
        type: "share", 
        user: { username: "eth_lover", displayName: "ETH Lover", avatar: "Ξ" },
        timestamp: "1 week ago",
        content: "shared your prediction \"ETH will hit $5,000 by Dec 2024\""
      },
      { 
        id: 6, 
        type: "comment", 
        user: { username: "crypto_oracle", displayName: "Crypto Oracle", avatar: "🧙" },
        timestamp: "2 weeks ago",
        content: "commented on your prediction \"ETH will hit $5,000 by Dec 2024\"",
        comment: "This is ambitious but possible with the upcoming upgrades!"
      },
      { 
        id: 7, 
        type: "follow", 
        user: { username: "sports_predictor", displayName: "Sports Predictor", avatar: "⚽" },
        timestamp: "2 weeks ago",
        content: "started following you"
      }
    ],
    leaderboard: {
      rank: 24,
      totalUsers: 1000,
      topPercentage: 2.4,
      points: 1250,
      nextRank: {
        points: 1300,
        pointsNeeded: 50
      },
      categories: [
        { name: "Crypto", rank: 15, totalUsers: 500 },
        { name: "Sports", rank: 42, totalUsers: 800 },
        { name: "Politics", rank: 31, totalUsers: 600 }
      ]
    }
  };
  
  // Function to get activity icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "follow":
        return <FaUserFriends className="text-primary" />;
      case "comment":
        return <FaCommentAlt className="text-secondary" />;
      case "bet":
        return <FaChartLine className="text-accent" />;
      case "like":
        return <FaThumbsUp className="text-green-400" />;
      case "share":
        return <FaShare className="text-blue-400" />;
      default:
        return <FaUserFriends className="text-primary" />;
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Leaderboard Summary */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-xl font-semibold text-white">
            <MdOutlineLeaderboard className="text-primary" />
            Your Leaderboard Position
          </h3>
          <Button 
            variant="ghost" 
            size="sm"
          >
            View Full Leaderboard
          </Button>
        </div>
        
        <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="flex flex-col items-center rounded-lg bg-bg-card p-4 text-center">
            <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
              <IoMdTrophy className="text-3xl text-primary" />
            </div>
            <div className="text-2xl font-bold text-white">#{communityData.leaderboard.rank}</div>
            <div className="text-sm text-text-muted">Global Rank</div>
            <div className="mt-1 text-xs text-text-secondary">
              Top {communityData.leaderboard.topPercentage}% of {communityData.leaderboard.totalUsers} users
            </div>
          </div>
          
          <div className="rounded-lg bg-bg-card p-4">
            <div className="mb-2 text-center text-sm text-text-muted">Category Rankings</div>
            <div className="space-y-3">
              {communityData.leaderboard.categories.map((category, index) => (
                <div key={index}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm text-text-secondary">{category.name}</span>
                    <span className="text-sm font-medium text-white">
                      #{category.rank} <span className="text-xs text-text-muted">of {category.totalUsers}</span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-card">
                    <div 
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${100 - (category.rank / category.totalUsers * 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="rounded-lg bg-bg-card p-4">
            <div className="mb-2 text-center text-sm text-text-muted">Reputation Points</div>
            <div className="text-center text-2xl font-bold text-white">{communityData.leaderboard.points}</div>
            <div className="mb-2 text-center text-xs text-text-muted">
              {communityData.leaderboard.nextRank.pointsNeeded} points to next rank
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-bg-card">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                style={{ width: `${(communityData.leaderboard.points / communityData.leaderboard.nextRank.points) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex border-b border-border-card">
        <button 
          className={`px-4 py-2 text-sm font-medium ${activeTab === "activity" ? "border-b-2 border-primary text-primary" : "text-text-muted hover:text-text-secondary"}`}
          onClick={() => setActiveTab("activity")}
        >
          Recent Activity
        </button>
        <button 
          className={`px-4 py-2 text-sm font-medium ${activeTab === "followers" ? "border-b-2 border-primary text-primary" : "text-text-muted hover:text-text-secondary"}`}
          onClick={() => setActiveTab("followers")}
        >
          Followers ({communityData.followers.length})
        </button>
        <button 
          className={`px-4 py-2 text-sm font-medium ${activeTab === "following" ? "border-b-2 border-primary text-primary" : "text-text-muted hover:text-text-secondary"}`}
          onClick={() => setActiveTab("following")}
        >
          Following ({communityData.following.length})
        </button>
      </div>
      
      {/* Tab Content */}
      <div>
        {/* Activity Feed */}
        {activeTab === "activity" && (
          <div className="space-y-4">
            {communityData.activity.map((item) => (
              <div key={item.id} className="glass-card p-4">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-bg-card text-lg">
                    {item.user.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{item.user.displayName}</span>
                      <span className="text-xs text-text-muted">@{item.user.username}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      {getActivityIcon(item.type)}
                      <span>{item.content}</span>
                    </div>
                    {item.comment && (
                      <div className="mt-2 rounded-md bg-bg-card p-3 text-sm text-text-secondary">
                        &quot;{item.comment}&quot;
                      </div>
                    )}
                    {item.betAmount && (
                      <div className="mt-2 rounded-md bg-bg-card p-2 text-sm text-text-secondary">
                        Bet: <span className="font-medium text-primary">{item.betAmount}</span>
                      </div>
                    )}
                    <div className="mt-2 text-xs text-text-muted">{item.timestamp}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Followers List */}
        {activeTab === "followers" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {communityData.followers.map((follower) => (
              <div key={follower.id} className="glass-card p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-card text-xl">
                    {follower.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-white">{follower.displayName}</div>
                    <div className="text-sm text-text-muted">@{follower.username}</div>
                  </div>
                  <Button 
                    variant={follower.isFollowing ? "secondary" : "primary"} 
                    size="sm"
                  >
                    {follower.isFollowing ? "Following" : "Follow"}
                  </Button>
                </div>
                <div className="mt-2 text-xs text-text-muted">Followed you {follower.followDate}</div>
              </div>
            ))}
          </div>
        )}
        
        {/* Following List */}
        {activeTab === "following" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {communityData.following.map((following) => (
              <div key={following.id} className="glass-card p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-card text-xl">
                    {following.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-white">{following.displayName}</div>
                    <div className="text-sm text-text-muted">@{following.username}</div>
                  </div>
                  <Button 
                    variant="secondary" 
                    size="sm"
                  >
                    Following
                  </Button>
                </div>
                <div className="mt-2 text-xs text-text-muted">Following since {following.followDate}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

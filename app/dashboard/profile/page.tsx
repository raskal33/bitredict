"use client";

import { useAccount } from "wagmi";
import { useMyProfile, useUserBadges } from "@/hooks/useUserProfile";
import Link from "next/link";

export default function Page() {
  const { address } = useAccount();
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const { data: badgeData, isLoading: badgesLoading } = useUserBadges();
  
  const isLoading = profileLoading || badgesLoading;
  
  // Use real data from backend or show defaults
  const stats = {
    totalBets: profile?.stats?.totalBets || 0,
    winRate: profile?.computedStats?.winRateFormatted || "0%",
    profitLoss: profile?.computedStats?.profitLossFormatted || "0 STT",
    totalBadges: badgeData?.active?.length || 0
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="glass-card p-8">
          <div className="h-8 bg-card-bg rounded w-1/3 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-card p-6">
                <div className="h-12 w-12 bg-card-bg rounded-lg mx-auto mb-4"></div>
                <div className="h-8 bg-card-bg rounded mb-2"></div>
                <div className="h-4 bg-card-bg rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="space-y-8">
        <div className="glass-card p-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Connect Your Wallet</h1>
          <p className="text-text-secondary mb-6">Please connect your wallet to view your profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="glass-card p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Profile Overview</h1>
          <Link href="/profile" className="text-brand-cyan hover:text-brand-blue transition-colors">
            View Full Profile →
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="glass-card p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-brand-cyan to-brand-blue rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-white mb-2">{stats.totalBets}</div>
            <div className="text-text-secondary">Total Predictions</div>
          </div>
          
          <div className="glass-card p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-brand-violet to-brand-magenta rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-white mb-2">{stats.winRate}</div>
            <div className="text-text-secondary">Win Rate</div>
          </div>
          
          <div className="glass-card p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-brand-blue to-brand-indigo rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-white mb-2">{stats.profitLoss}</div>
            <div className="text-text-secondary">Total P&L</div>
          </div>
          
          <div className="glass-card p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-brand-magenta to-brand-cyan rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-white mb-2">{stats.totalBadges}</div>
            <div className="text-text-secondary">Achievements</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
            {profile?.recentActivity && profile.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {profile.recentActivity.slice(0, 3).map((activity) => {
                  const isWin = activity.type === 'bet_won';
                  const isLoss = activity.type === 'bet_lost';
                  const isCreation = activity.type === 'pool_created';
                  
                  return (
                    <div key={activity.id} className="flex items-center justify-between p-4 bg-card-bg rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 ${
                          isWin ? 'bg-green-500/20' : 
                          isLoss ? 'bg-red-500/20' : 
                          'bg-blue-500/20'
                        } rounded-full flex items-center justify-center`}>
                          <svg className={`w-4 h-4 ${
                            isWin ? 'text-green-400' :
                            isLoss ? 'text-red-400' :
                            'text-blue-400'
                          }`} fill="currentColor" viewBox="0 0 20 20">
                            {isWin && <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />}
                            {isLoss && <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />}
                            {isCreation && <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />}
                          </svg>
                        </div>
                        <div>
                          <div className="text-white font-medium">{activity.description}</div>
                          <div className="text-text-secondary text-sm">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      {activity.amount && (
                        <div className={`font-bold ${
                          isWin ? 'text-green-400' : 
                          isLoss ? 'text-red-400' : 
                          'text-text-secondary'
                        }`}>
                          {activity.amount}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-text-secondary">No recent activity yet</p>
                <p className="text-sm text-text-muted mt-2">Start predicting to see your activity here!</p>
              </div>
            )}
          </div>

          <div className="glass-card p-6">
            <h3 className="text-xl font-bold text-white mb-4">Performance Breakdown</h3>
            {profile?.categoryPerformance && profile.categoryPerformance.length > 0 ? (
              <div className="space-y-6">
                {profile.categoryPerformance.slice(0, 3).map((category) => (
                  <div key={category.category}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-text-secondary">{category.category}</span>
                      <span className="text-white font-bold">{category.winRate.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-card-bg rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-brand-cyan to-brand-blue h-2 rounded-full" 
                        style={{width: `${Math.min(category.winRate, 100)}%`}}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-text-secondary">No performance data yet</p>
                <p className="text-sm text-text-muted mt-2">Make predictions to track your performance!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { usePortfolio } from "@/hooks/usePortfolio";
import { formatSTT, formatRelativeTime } from "@/utils/formatters";
import {
  BellIcon,
  TrophyIcon,
  BanknotesIcon,
  SparklesIcon,
  FireIcon,
  CheckCircleIcon,
  XCircleIcon
} from "@heroicons/react/24/outline";

export default function Page() {
  const { address } = useAccount();
  const { data: portfolioData, isLoading } = usePortfolio();

  if (!address) {
    return (
      <div className="space-y-8">
        <div className="glass-card p-12 text-center">
          <BellIcon className="h-16 w-16 text-text-muted mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-text-primary mb-2">Connect Your Wallet</h2>
          <p className="text-text-secondary">Please connect your wallet to view activity</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="glass-card p-8">
          <div className="h-8 bg-card-bg rounded w-1/3 mb-8"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="glass-card p-6">
                <div className="h-6 bg-card-bg rounded mb-2"></div>
                <div className="h-4 bg-card-bg rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const positions = portfolioData?.positions || [];
  
  // Convert positions to activity feed
  const activities = positions.map(position => {
    let activityType = 'bet_placed';
    let icon = <BanknotesIcon className="h-5 w-5" />;
    let color = 'blue';
    let message = '';

    if (position.status === 'won') {
      activityType = 'position_won';
      icon = <TrophyIcon className="h-5 w-5" />;
      color = 'green';
      message = `Won ${formatSTT(position.payoutAmount || position.prizeAmount || '0')} from "${position.title}"`;
    } else if (position.status === 'lost') {
      activityType = 'position_lost';
      icon = <XCircleIcon className="h-5 w-5" />;
      color = 'red';
      message = `Position closed: "${position.title}"`;
    } else if (position.status === 'ended') {
      activityType = 'position_ended';
      icon = <CheckCircleIcon className="h-5 w-5" />;
      color = 'yellow';
      message = `Position ready to claim: "${position.title}"`;
    } else if (position.type === 'oddyssey') {
      activityType = 'oddyssey_placed';
      icon = <FireIcon className="h-5 w-5" />;
      color = 'pink';
      message = `Joined ${position.title}`;
    } else {
      activityType = 'bet_placed';
      icon = <SparklesIcon className="h-5 w-5" />;
      color = 'cyan';
      message = `Placed ${formatSTT(position.amount)} on "${position.title}"`;
    }

    return {
      id: position.id,
      type: activityType,
      message,
      timestamp: position.createdAt,
      icon,
      color,
      read: position.status !== 'ended' // Unread if needs attention
    };
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const unreadCount = activities.filter(a => !a.read).length;

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
      green: 'bg-green-500/10 border-green-500/30 text-green-400',
      red: 'bg-red-500/10 border-red-500/30 text-red-400',
      yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
      pink: 'bg-pink-500/10 border-pink-500/30 text-pink-400',
      cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Activity Feed</h1>
            <p className="text-text-secondary">
              {unreadCount > 0 
                ? `${unreadCount} position${unreadCount > 1 ? 's' : ''} need${unreadCount === 1 ? 's' : ''} attention` 
                : 'Track your prediction market activity'
              }
            </p>
          </div>
          
          {unreadCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-button">
              <BellIcon className="h-5 w-5 text-yellow-400" />
              <span className="text-sm font-semibold text-yellow-400">{unreadCount} Pending</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Activity List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        {activities.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <BellIcon className="h-12 w-12 text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">No Activity Yet</h3>
            <p className="text-text-secondary">Start betting or creating pools to see your activity here</p>
          </div>
        ) : (
          activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * index }}
              className={`glass-card p-6 hover:bg-[rgba(255,255,255,0.02)] transition-all duration-200 ${
                !activity.read ? 'border-l-4 border-l-yellow-400' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl border ${getColorClasses(activity.color)}`}>
                  {activity.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary font-medium mb-1">
                    {activity.message}
                  </p>
                  <div className="text-sm text-text-muted">
                    {formatRelativeTime(activity.timestamp)}
                  </div>
                </div>

                {!activity.read && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-button">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-yellow-400">Action Required</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
}

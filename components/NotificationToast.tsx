"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/hooks/useNotifications';
import { useState } from 'react';
import {
  TrophyIcon,
  BanknotesIcon,
  SparklesIcon,
  FireIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function NotificationToast() {
  const { notifications, markAsRead } = useNotifications();
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());

  // Show only the most recent unread notification as toast (that hasn't been dismissed)
  const latestNotification = notifications.find(n => !n.read && !dismissedIds.has(n.id));

  const handleDismiss = async (notificationId: number) => {
    setDismissedIds(prev => new Set([...prev, notificationId]));
    await markAsRead(notificationId);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'slip_evaluated':
        return <FireIcon className="h-6 w-6" />;
      case 'bet_won':
        return <TrophyIcon className="h-6 w-6" />;
      case 'prize_available':
        return <BanknotesIcon className="h-6 w-6" />;
      case 'badge_earned':
        return <SparklesIcon className="h-6 w-6" />;
      default:
        return <SparklesIcon className="h-6 w-6" />;
    }
  };

  const getColors = (type: string) => {
    switch (type) {
      case 'bet_won':
      case 'prize_available':
        return 'from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-400';
      case 'bet_lost':
        return 'from-red-500/20 to-red-600/20 border-red-500/30 text-red-400';
      case 'pool_created':
      case 'slip_placed':
        return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400';
      case 'slip_evaluated':
        return 'from-pink-500/20 to-rose-500/20 border-pink-500/30 text-pink-400';
      case 'badge_earned':
        return 'from-purple-500/20 to-violet-500/20 border-purple-500/30 text-purple-400';
      default:
        return 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-400';
    }
  };

  if (!latestNotification) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
      <AnimatePresence>
        <motion.div
          key={latestNotification.id}
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.8 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          drag="x"
          dragConstraints={{ left: 0, right: 300 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            if (info.offset.x > 100) {
              handleDismiss(latestNotification.id);
            }
          }}
          className="pointer-events-auto cursor-grab active:cursor-grabbing"
        >
          <div className={`glass-card p-4 border backdrop-blur-xl bg-gradient-to-br ${getColors(latestNotification.type)} min-w-80 max-w-md shadow-2xl relative`}>
            <button
              onClick={() => handleDismiss(latestNotification.id)}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/20 transition-colors text-current opacity-70 hover:opacity-100"
              aria-label="Close notification"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
            
            <div className="flex items-start gap-3 pr-6">
              <div className={`flex-shrink-0 ${getColors(latestNotification.type).split(' ').pop()}`}>
                {getIcon(latestNotification.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-text-primary mb-1">
                  {latestNotification.title}
                </h4>
                <p className="text-sm text-text-secondary line-clamp-2">
                  {latestNotification.message}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}


"use client";

import { useState } from "react";
import Button from "@/components/button";

interface Notification {
  id: number;
  type: 'success' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export default function Page() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: 'success',
      title: 'Prediction Won!',
      message: 'Your prediction "Bitcoin reaches $100,000" has been settled. You won 250 SOL!',
      timestamp: '2 hours ago',
      read: false
    },
    {
      id: 2,
      type: 'info',
      title: 'New Market Available',
      message: 'A new prediction market "2024 US Election" is now available for betting.',
      timestamp: '5 hours ago',
      read: false
    },
    {
      id: 3,
      type: 'warning',
      title: 'Market Closing Soon',
      message: 'The "World Cup Finals" prediction market will close in 24 hours.',
      timestamp: '1 day ago',
      read: true
    },
    {
      id: 4,
      type: 'success',
      title: 'Achievement Unlocked',
      message: 'Congratulations! You&apos;ve earned the &quot;Top Predictor&quot; badge.',
      timestamp: '2 days ago',
      read: true
    },
    {
      id: 5,
      type: 'info',
      title: 'Platform Update',
      message: 'New features have been added to improve your prediction experience.',
      timestamp: '3 days ago',
      read: true
    }
  ]);

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return (
          <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Notifications</h1>
            <p className="text-text-secondary">
              {unreadCount > 0 ? `You have ${unreadCount} unread notifications` : 'All notifications are read'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              Mark All as Read
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-6 rounded-lg border transition-all cursor-pointer hover:bg-card-bg/50 ${
                notification.read 
                  ? 'bg-card-bg/30 border-border-color/30' 
                  : 'bg-card-bg border-border-color'
              }`}
              onClick={() => !notification.read && markAsRead(notification.id)}
            >
              <div className="flex items-start gap-4">
                {getNotificationIcon(notification.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className={`font-semibold ${notification.read ? 'text-text-secondary' : 'text-white'}`}>
                      {notification.title}
                    </h3>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-brand-cyan rounded-full"></div>
                    )}
                  </div>
                  <p className={`text-sm mb-2 ${notification.read ? 'text-text-secondary/70' : 'text-text-secondary'}`}>
                    {notification.message}
                  </p>
                  <div className="text-xs text-text-secondary/50">
                    {notification.timestamp}
                  </div>
                </div>
                {!notification.read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(notification.id);
                    }}
                    className="text-text-secondary hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {notifications.length === 0 && (
          <div className="glass-card p-12 text-center">
            <div className="w-16 h-16 bg-card-bg rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-text-secondary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Notifications</h3>
            <p className="text-text-secondary">You&apos;re all caught up! New notifications will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}

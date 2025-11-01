"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/hooks/useNotifications';
import { formatRelativeTime } from '@/utils/formatters';
import {
  BellIcon,
  XMarkIcon,
  CheckIcon,
  TrophyIcon,
  BanknotesIcon,
  SparklesIcon,
  FireIcon
} from '@heroicons/react/24/outline';

export default function NotificationBadge() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isConnected
  } = useNotifications();

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close panel on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsOpen(false);
    };

    if (isOpen) {
      window.addEventListener('scroll', handleScroll, true);
      return () => window.removeEventListener('scroll', handleScroll, true);
    }
  }, [isOpen]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'slip_evaluated':
        return <FireIcon className="h-5 w-5 text-pink-400" />;
      case 'bet_won':
        return <TrophyIcon className="h-5 w-5 text-yellow-400" />;
      case 'bet_lost':
        return <XMarkIcon className="h-5 w-5 text-red-400" />;
      case 'prize_available':
        return <BanknotesIcon className="h-5 w-5 text-green-400" />;
      case 'badge_earned':
        return <SparklesIcon className="h-5 w-5 text-purple-400" />;
      default:
        return <BellIcon className="h-5 w-5 text-cyan-400" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'bet_won':
      case 'prize_available':
        return 'border-l-green-400';
      case 'bet_lost':
        return 'border-l-red-400';
      case 'slip_evaluated':
        return 'border-l-pink-400';
      case 'badge_earned':
        return 'border-l-purple-400';
      default:
        return 'border-l-cyan-400';
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Icon with Badge */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-bg-card transition-colors"
      >
        <BellIcon className="h-6 w-6 text-text-primary" />
        
        {/* Connection indicator */}
        {isConnected && (
          <div className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        )}
        
        {/* Unread count badge */}
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.div>
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (() => {
          if (!buttonRef.current || typeof window === 'undefined') return null;
          const rect = buttonRef.current.getBoundingClientRect();
          const isMobile = window.innerWidth < 640; // sm breakpoint
          
          // Calculate responsive positioning
          const panelStyle: React.CSSProperties = {
            zIndex: 1001,
          };
          
          if (isMobile) {
            // On mobile: full width minus padding, positioned from top
            panelStyle.width = `${window.innerWidth - 16}px`;
            panelStyle.left = '8px';
            panelStyle.right = 'auto';
            // Position below button, but if it would overflow, position from bottom
            const spaceBelow = window.innerHeight - rect.bottom - 8;
            const maxHeight = Math.min(512, window.innerHeight - 100); // Max 32rem or viewport - 100px
            if (spaceBelow < maxHeight) {
              // Not enough space below, position from bottom
              panelStyle.bottom = '8px';
              panelStyle.top = 'auto';
              panelStyle.maxHeight = `${maxHeight}px`;
            } else {
              panelStyle.top = `${rect.bottom + 8}px`;
              panelStyle.maxHeight = `${maxHeight}px`;
            }
          } else {
            // On desktop: 384px width, positioned to the right
            const rightPosition = window.innerWidth - rect.right;
            
            // Ensure panel doesn't overflow viewport horizontally
            if (rightPosition < 0) {
              panelStyle.left = '8px';
              panelStyle.right = 'auto';
            } else {
              panelStyle.right = `${rightPosition}px`;
            }
            
            // Ensure panel doesn't overflow viewport vertically
            const spaceBelow = window.innerHeight - rect.bottom - 8;
            const maxHeight = Math.min(512, window.innerHeight - 100); // Max 32rem or viewport - 100px
            if (spaceBelow < maxHeight) {
              // Not enough space below, position from bottom
              panelStyle.bottom = '8px';
              panelStyle.top = 'auto';
              panelStyle.maxHeight = `${maxHeight}px`;
            } else {
              panelStyle.top = `${rect.bottom + 8}px`;
              panelStyle.maxHeight = `${maxHeight}px`;
            }
          }
          
          return (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`fixed ${isMobile ? 'w-[calc(100vw-2rem)]' : 'w-96'} glass-card shadow-2xl overflow-hidden`}
              style={panelStyle}
            >
            {/* Header */}
            <div className="p-4 border-b border-border-card flex items-center justify-between">
              <div>
                <h3 className="font-bold text-text-primary">Notifications</h3>
                <p className="text-xs text-text-muted">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                </p>
              </div>
              
              {unreadCount > 0 && (
                <button
                  onClick={() => {
                    markAllAsRead();
                  }}
                  className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                >
                  <CheckIcon className="h-3 w-3" />
                  Mark all read
                </button>
              )}
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto" style={{ maxHeight: isMobile ? 'calc(100vh - 200px)' : '24rem' }}>
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <BellIcon className="h-12 w-12 text-text-muted mx-auto mb-3" />
                  <p className="text-sm text-text-secondary">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-border-card">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 hover:bg-bg-card/50 transition-colors cursor-pointer border-l-4 ${getNotificationColor(notification.type)} ${
                        !notification.read ? 'bg-primary/5' : ''
                      }`}
                      onClick={() => {
                        if (!notification.read) {
                          markAsRead(notification.id);
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`text-sm font-semibold ${
                              !notification.read ? 'text-text-primary' : 'text-text-secondary'
                            }`}>
                              {notification.title}
                            </h4>
                            
                            {!notification.read && (
                              <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-1" />
                            )}
                          </div>
                          
                          <p className="text-xs text-text-muted mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-text-muted">
                              {formatRelativeTime(notification.createdAt || new Date())}
                            </span>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="text-xs text-text-muted hover:text-red-400 transition-colors"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}


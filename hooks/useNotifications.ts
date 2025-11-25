import { useState, useEffect, useCallback, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useWebSocket } from './useWebSocket';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://bitredict-backend.fly.dev';
const NOTIFICATION_DEDUP_WINDOW_MS = 4000;

export interface Notification {
  id: number;
  userAddress: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, any>;
  read: boolean;
  createdAt: string;
}

const buildNotificationSignature = (notification: Partial<Notification>) => {
  const { type, title, message, data } = notification;
  const relatedId =
    (data && (data.poolId || data.slipId || data.cycleId || data.betId || data.matchId)) ||
    '';
  return `${type || 'unknown'}|${title || ''}|${message || ''}|${relatedId}`;
};

export function useNotifications() {
  const { address } = useAccount();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const isMountedRef = useRef(true);
  const notificationHashesRef = useRef<Map<string, number>>(new Map());

  const rememberNotificationSignature = useCallback(
    (notification: Notification, timestamp: number = Date.now()) => {
      const signature = buildNotificationSignature(notification);
      notificationHashesRef.current.set(signature, timestamp);
      if (notificationHashesRef.current.size > 500) {
        const firstKey = notificationHashesRef.current.keys().next().value;
        if (firstKey) {
          notificationHashesRef.current.delete(firstKey);
        }
      }
    },
    []
  );

  const shouldProcessNotification = useCallback(
    (notification: Notification) => {
      const signature = buildNotificationSignature(notification);
      const now = Date.now();
      const lastSeen = notificationHashesRef.current.get(signature);
      if (lastSeen && now - lastSeen < NOTIFICATION_DEDUP_WINDOW_MS) {
        console.warn('⚠️ Duplicate notification suppressed:', signature);
        return false;
      }
      rememberNotificationSignature(notification, now);
      return true;
    },
    [rememberNotificationSignature]
  );

  const dedupeNotificationList = useCallback((list: Notification[]) => {
    const signatures = new Set<string>();
    const cleaned: Notification[] = [];
    list.forEach((notification) => {
      const signature = buildNotificationSignature(notification);
      if (signatures.has(signature)) return;
      signatures.add(signature);
      cleaned.push(notification);
    });
    return cleaned;
  }, []);

  // Load notifications from localStorage on mount
  useEffect(() => {
    if (address) {
      const stored = localStorage.getItem(`notifications_${address.toLowerCase()}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setNotifications(parsed.notifications || []);
          setUnreadCount(parsed.unreadCount || 0);
        } catch (error) {
          console.error('Error parsing stored notifications:', error);
        }
      }
      fetchNotifications();
    }
  }, [address]);

  // Save to localStorage whenever notifications change
  useEffect(() => {
    if (address && notifications.length > 0) {
      localStorage.setItem(
        `notifications_${address.toLowerCase()}`,
        JSON.stringify({ notifications, unreadCount })
      );
    }
  }, [address, notifications, unreadCount]);

  // Fetch notifications from backend
  const fetchNotifications = useCallback(async () => {
    if (!address || !isMountedRef.current) return;

    try {
      if (isMountedRef.current) {
        setIsLoading(true);
      }
      const response = await fetch(`${BACKEND_URL}/api/notifications?address=${address}&limit=50`);
      const data = await response.json();

      if (data.success && isMountedRef.current) {
        const deduped = dedupeNotificationList(data.notifications || []);
        setNotifications(deduped);
        const unread = data.unreadCount ?? deduped.filter(n => !n.read).length;
        setUnreadCount(unread);
        deduped.forEach((notification) => {
          const createdAtMs = notification.createdAt
            ? new Date(notification.createdAt).getTime()
            : Date.now();
          rememberNotificationSignature(notification, createdAtMs);
        });
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [address, dedupeNotificationList, rememberNotificationSignature]);

  // Handle WebSocket messages
  const handleMessage = useCallback((message: any) => {
    if (!isMountedRef.current) return;
    
    // ✅ CRITICAL FIX: Deduplicate notifications by ID to prevent showing the same event multiple times
    // Backend wraps messages in { type: 'update', channel, data, timestamp }
    // Check message.data.type for notification type
    if (message.type === 'update' && message.data) {
      if (message.data.type === 'notification') {
        const newNotification = message.data.notification;
        
        if (!shouldProcessNotification(newNotification)) {
          return;
        }
        
        // ✅ DEDUPLICATION: Check if notification with this ID already exists
        setNotifications(prev => {
          const exists = prev.some(n => n.id === newNotification.id);
          if (exists) {
            console.warn(`⚠️ Duplicate notification detected: ${newNotification.id} - ignoring`);
            return prev; // Don't add duplicate
          }
          
          const updated = [newNotification, ...prev].slice(0, 100);
          setUnreadCount(updated.filter(n => !n.read).length);
          return updated;
        });
        
        rememberNotificationSignature(newNotification);
        
        // Show browser notification if permission granted (only once per ID)
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          const notificationId = `browser_notif_${newNotification.id}`;
          const shownNotifications = sessionStorage.getItem('shown_notifications') || '';
          if (!shownNotifications.includes(notificationId)) {
            new Notification(newNotification.title, {
              body: newNotification.message,
              icon: '/logo.png'
            });
            // Mark as shown to prevent duplicates
            sessionStorage.setItem('shown_notifications', `${shownNotifications},${notificationId}`);
          }
        }
      } else if (message.data.type === 'notification:unread_count') {
        setUnreadCount(message.data.unreadCount);
      }
    }
    // ✅ Also handle direct notification messages (backward compatibility)
    else if (message.type === 'notification') {
      const newNotification = message.notification;
      
      if (!shouldProcessNotification(newNotification)) {
        return;
      }
      
      // ✅ DEDUPLICATION: Check if notification with this ID already exists
      setNotifications(prev => {
        const exists = prev.some(n => n.id === newNotification.id);
        if (exists) {
          console.warn(`⚠️ Duplicate notification detected: ${newNotification.id} - ignoring`);
          return prev;
        }
        const updated = [newNotification, ...prev].slice(0, 100);
        setUnreadCount(updated.filter(n => !n.read).length);
        return updated;
      });
      
      rememberNotificationSignature(newNotification);
      
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(newNotification.title, {
          body: newNotification.message,
          icon: '/logo.png'
        });
      }
    } else if (message.type === 'notification:unread_count') {
      setUnreadCount(message.unreadCount);
    }
  }, [rememberNotificationSignature, shouldProcessNotification]);

  // Connect to WebSocket
  const { isConnected } = useWebSocket({
    channel: address ? `user:${address.toLowerCase()}` : null,
    onMessage: handleMessage,
    enabled: !!address
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Mark as read
  const markAsRead = useCallback(async (notificationId: number) => {
    if (!address) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      });

      if (response.ok) {
        setNotifications(prev => {
          const updated = prev.map(n => n.id === notificationId ? { ...n, read: true } : n);
          setUnreadCount(updated.filter(n => !n.read).length);
          return updated;
        });
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, [address]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!address) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/notifications/read-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [address]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: number) => {
    if (!address) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      });

      if (response.ok) {
        setNotifications(prev => {
          const updated = prev.filter(n => n.id !== notificationId);
          setUnreadCount(updated.filter(n => !n.read).length);
          return updated;
        });
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [address]);

  // Delete all notifications
  const deleteAllNotifications = useCallback(async () => {
    if (!address) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/notifications`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      });

      if (response.ok) {
        setNotifications([]);
        setUnreadCount(0);
        localStorage.removeItem(`notifications_${address.toLowerCase()}`);
      }
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  }, [address]);

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    fetchNotifications,
    requestNotificationPermission
  };
}


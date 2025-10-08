"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { websocketClient } from '@/services/websocket-client';

interface PollingOptions {
  interval?: number;
  websocketChannel?: string;
  enabled?: boolean;
  cacheKey?: string;
  retryAttempts?: number;
  retryDelay?: number;
}

interface PollingResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  lastUpdated: Date | null;
}

// Request deduplication cache
const requestCache = new Map<string, {
  promise: Promise<any>;
  timestamp: number;
  ttl: number;
}>();

// Smart cache with TTL
const smartCache = new Map<string, {
  data: any;
  timestamp: number;
  ttl: number;
}>();

// Rate limiting
const rateLimits = new Map<string, {
  count: number;
  resetTime: number;
}>();

export function useOptimizedPolling<T>(
  fetchFunction: () => Promise<T>,
  options: PollingOptions = {}
): PollingResult<T> {
  const {
    interval = 30000,
    websocketChannel,
    enabled = true,
    cacheKey,
    retryAttempts = 3,
    retryDelay = 1000
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  // Request deduplication
  const deduplicateRequest = useCallback(async (key: string, fn: () => Promise<T>): Promise<T> => {
    const now = Date.now();
    const cached = requestCache.get(key);
    
    // Check if request is still valid (within 5 seconds)
    if (cached && (now - cached.timestamp) < 5000) {
      return cached.promise;
    }
    
    // Create new request
    const promise = fn();
    requestCache.set(key, {
      promise,
      timestamp: now,
      ttl: 5000
    });
    
    // Clean up expired entries
    setTimeout(() => {
      requestCache.delete(key);
    }, 5000);
    
    return promise;
  }, []);

  // Smart caching
  const getCachedData = useCallback((key: string): T | null => {
    const cached = smartCache.get(key);
    if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
      return cached.data;
    }
    return null;
  }, []);

  const setCachedData = useCallback((key: string, data: T, ttl: number) => {
    smartCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }, []);

  // Rate limiting
  const checkRateLimit = useCallback((key: string, limit: number, window: number): boolean => {
    const now = Date.now();
    const rateLimit = rateLimits.get(key);
    
    if (!rateLimit || now > rateLimit.resetTime) {
      rateLimits.set(key, { count: 1, resetTime: now + window });
      return true;
    }
    
    if (rateLimit.count >= limit) {
      return false;
    }
    
    rateLimit.count++;
    return true;
  }, []);

  // Fetch data with all optimizations
  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return;
    
    const requestKey = cacheKey || 'default';
    const rateLimitKey = `rate_limit:${requestKey}`;
    
    // Check rate limit (5 requests per 10 seconds for most endpoints)
    if (!force && !checkRateLimit(rateLimitKey, 5, 10000)) {
      console.log('Rate limit exceeded, skipping request');
      return;
    }
    
    // Check smart cache first
    if (!force) {
      const cachedData = getCachedData(requestKey);
      if (cachedData) {
        setData(cachedData);
        setLastUpdated(new Date());
        return;
      }
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await deduplicateRequest(requestKey, fetchFunction);
      
      setData(result);
      setLastUpdated(new Date());
      
      // Cache the result with appropriate TTL
      const ttl = getCacheTTL(requestKey);
      setCachedData(requestKey, result, ttl);
      
      retryCountRef.current = 0;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      
      // Retry logic
      if (retryCountRef.current < retryAttempts) {
        retryCountRef.current++;
        setTimeout(() => {
          fetchData(force);
        }, retryDelay * retryCountRef.current);
      }
    } finally {
      setLoading(false);
    }
  }, [enabled, cacheKey, fetchFunction, deduplicateRequest, getCachedData, setCachedData, checkRateLimit, retryAttempts, retryDelay]);

  // Get cache TTL based on endpoint pattern
  const getCacheTTL = useCallback((key: string): number => {
    if (key.includes('pool') && key.includes('progress')) return 120000; // 2 minutes
    if (key.includes('recent_bets')) return 30000; // 30 seconds
    if (key.includes('analytics')) return 600000; // 10 minutes
    if (key.includes('user')) return 60000; // 1 minute
    return 30000; // Default 30 seconds
  }, []);

  // Manual refresh
  const refresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  // WebSocket subscription
  useEffect(() => {
    if (websocketChannel && enabled) {
      const handleWSData = (wsData: T) => {
        setData(wsData);
        setLastUpdated(new Date());
        
        // Update cache
        if (cacheKey) {
          const ttl = getCacheTTL(cacheKey);
          setCachedData(cacheKey, wsData, ttl);
        }
      };

      websocketClient.subscribe(websocketChannel, handleWSData);
      
      return () => {
        websocketClient.unsubscribe(websocketChannel, handleWSData);
      };
    }
  }, [websocketChannel, enabled, cacheKey, getCacheTTL, setCachedData]);

  // Polling interval
  useEffect(() => {
    if (enabled && interval > 0) {
      // Initial fetch
      fetchData();
      
      // Set up polling
      intervalRef.current = setInterval(() => {
        fetchData();
      }, interval);
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [enabled, interval, fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    refresh,
    lastUpdated
  };
}

export default useOptimizedPolling;

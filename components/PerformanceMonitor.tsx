"use client";

import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  networkRequests: number;
}

interface PerformanceMonitorProps {
  componentName: string;
  onMetrics?: (metrics: PerformanceMetrics) => void;
}

export default function PerformanceMonitor({ 
  componentName, 
  onMetrics 
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    networkRequests: 0
  });

  useEffect(() => {
    const startTime = performance.now();
    let renderStartTime = 0;

    // Monitor render time
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name.includes(componentName)) {
          renderStartTime = entry.startTime;
        }
      });
    });

    observer.observe({ entryTypes: ['measure', 'navigation'] });

    // Monitor memory usage
    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as { memory?: { usedJSHeapSize: number } }).memory;
        if (memory) {
          setMetrics(prev => ({
            ...prev,
            memoryUsage: memory.usedJSHeapSize / 1024 / 1024 // MB
          }));
        }
      }
    };

    // Monitor network requests
    let requestCount = 0;
    const originalFetch = window.fetch;
    window.fetch = (...args) => {
      requestCount++;
      setMetrics(prev => ({
        ...prev,
        networkRequests: requestCount
      }));
      return originalFetch(...args);
    };

    // Calculate final metrics
    const calculateMetrics = () => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      const renderTime = renderStartTime > 0 ? renderStartTime - startTime : 0;

      const finalMetrics: PerformanceMetrics = {
        loadTime,
        renderTime,
        memoryUsage: metrics.memoryUsage,
        networkRequests: requestCount
      };

      setMetrics(finalMetrics);
      onMetrics?.(finalMetrics);

      // Log performance warnings
      if (loadTime > 3000) {
        console.warn(`⚠️ ${componentName} took ${loadTime.toFixed(2)}ms to load (slow)`);
      }
      if (requestCount > 10) {
        console.warn(`⚠️ ${componentName} made ${requestCount} network requests (high)`);
      }
      if (metrics.memoryUsage > 50) {
        console.warn(`⚠️ ${componentName} using ${metrics.memoryUsage.toFixed(2)}MB memory (high)`);
      }
    };

    // Check memory periodically
    const memoryInterval = setInterval(checkMemory, 1000);

    // Calculate metrics after component is mounted
    const timeoutId = setTimeout(calculateMetrics, 100);

    return () => {
      observer.disconnect();
      clearInterval(memoryInterval);
      clearTimeout(timeoutId);
      window.fetch = originalFetch;
    };
  }, [componentName, onMetrics, metrics.memoryUsage]);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-2 rounded text-xs font-mono z-50">
      <div className="text-green-400 font-bold">{componentName}</div>
      <div>Load: {metrics.loadTime.toFixed(0)}ms</div>
      <div>Render: {metrics.renderTime.toFixed(0)}ms</div>
      <div>Memory: {metrics.memoryUsage.toFixed(1)}MB</div>
      <div>Requests: {metrics.networkRequests}</div>
    </div>
  );
}

// Hook for performance monitoring
export function usePerformanceMonitor(componentName: string) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      setMetrics({
        loadTime,
        renderTime: 0,
        memoryUsage: 0,
        networkRequests: 0
      });
    };
  }, [componentName]);

  return metrics;
}

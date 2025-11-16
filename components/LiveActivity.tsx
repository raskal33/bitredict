/**
 * Live Activity Component
 * 
 * Shows real-time activity events (bets placed, pools created, liquidity added)
 * Positioned at left bottom, opens onClick, closed by default
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useBetUpdates, usePoolCreatedUpdates, useLiquidityAddedUpdates, useSomniaStreams } from '@/hooks/useSomniaStreams';
import { XMarkIcon, BoltIcon } from '@heroicons/react/24/outline';

interface ActivityEvent {
  id: string;
  timestamp: number;
  type: 'bet' | 'pool_created' | 'liquidity_added';
  poolId: string;
  user: string;
  amount?: string;
  currency?: string;
  poolTitle?: string;
}

export function LiveActivity() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 16, y: 0 }); // Will be set properly in useEffect
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [sdsStatus, setSdsStatus] = useState<{ isConnected: boolean; isSDSActive: boolean; isFallback: boolean }>({
    isConnected: false,
    isSDSActive: false,
    isFallback: false
  });
  const processedEventIds = useRef<Set<string>>(new Set()); // ✅ FIX: Prevent duplicate events

  // ✅ FIX: Get SDS connection status from useSomniaStreams directly
  const { isConnected, isSDSActive, isFallback } = useSomniaStreams({ enabled: true });
  
  useEffect(() => {
    setSdsStatus({ isConnected, isSDSActive, isFallback });
    console.log(`📡 LiveActivity SDS Status:`, { isConnected, isSDSActive, isFallback });
  }, [isConnected, isSDSActive, isFallback]);

  // Subscribe to bet placed events
  useBetUpdates((betData: {
    poolId?: string | number;
    bettor?: string;
    amount?: string;
    timestamp?: number;
    poolTitle?: string;
    currency?: string;
  }) => {
    if (!betData.poolId || !betData.bettor) {
      console.log('⚠️ LiveActivity: Invalid bet data:', betData);
      return;
    }
    
    // ✅ FIX: Create unique event ID to prevent duplicates
    const eventId = `bet-${betData.poolId}-${betData.bettor}-${betData.timestamp || Date.now()}`;
    if (processedEventIds.current.has(eventId)) {
      console.log(`⚠️ LiveActivity: Duplicate bet event prevented: ${eventId}`);
      return;
    }
    
    processedEventIds.current.add(eventId);
    console.log(`✅ LiveActivity: Received bet event:`, betData);
    
    const newEvent: ActivityEvent = {
      id: eventId,
      timestamp: betData.timestamp || Math.floor(Date.now() / 1000),
      type: 'bet' as const,
      poolId: betData.poolId.toString(),
      user: betData.bettor,
      amount: betData.amount,
      currency: betData.currency || 'STT',
      poolTitle: betData.poolTitle
    };
    setEvents(prev => {
      // ✅ FIX: Also check for duplicates in state
      if (prev.some(e => e.id === eventId)) {
        console.log(`⚠️ LiveActivity: Event already in state: ${eventId}`);
        return prev;
      }
      return [newEvent, ...prev].slice(0, 50);
    });
    
    // Clean up old event IDs after 5 minutes
    setTimeout(() => {
      processedEventIds.current.delete(eventId);
    }, 5 * 60 * 1000);
  });

  // Subscribe to pool created events
  usePoolCreatedUpdates((poolData: {
    poolId: string;
    creator: string;
    timestamp?: number;
    title?: string;
  }) => {
    if (!poolData.poolId || !poolData.creator) {
      console.log('⚠️ LiveActivity: Invalid pool data:', poolData);
      return;
    }
    
    const eventId = `pool-${poolData.poolId}-${poolData.timestamp || Date.now()}`;
    if (processedEventIds.current.has(eventId)) {
      console.log(`⚠️ LiveActivity: Duplicate pool event prevented: ${eventId}`);
      return;
    }
    
    processedEventIds.current.add(eventId);
    console.log(`✅ LiveActivity: Received pool created event:`, poolData);
    
    const newEvent: ActivityEvent = {
      id: eventId,
      timestamp: poolData.timestamp || Math.floor(Date.now() / 1000),
      type: 'pool_created' as const,
      poolId: poolData.poolId,
      user: poolData.creator,
      poolTitle: poolData.title
    };
    setEvents(prev => {
      if (prev.some(e => e.id === eventId)) {
        console.log(`⚠️ LiveActivity: Event already in state: ${eventId}`);
        return prev;
      }
      return [newEvent, ...prev].slice(0, 50);
    });
    
    setTimeout(() => {
      processedEventIds.current.delete(eventId);
    }, 5 * 60 * 1000);
  });

  // Subscribe to liquidity added events
  useLiquidityAddedUpdates((liquidityData: {
    poolId: string;
    provider: string;
    amount?: string;
    timestamp: number;
  }) => {
    if (!liquidityData.poolId || !liquidityData.provider) {
      console.log('⚠️ LiveActivity: Invalid liquidity data:', liquidityData);
      return;
    }
    
    const eventId = `lp-${liquidityData.poolId}-${liquidityData.provider}-${liquidityData.timestamp}`;
    if (processedEventIds.current.has(eventId)) {
      console.log(`⚠️ LiveActivity: Duplicate liquidity event prevented: ${eventId}`);
      return;
    }
    
    processedEventIds.current.add(eventId);
    console.log(`✅ LiveActivity: Received liquidity event:`, liquidityData);
    
    const newEvent: ActivityEvent = {
      id: eventId,
      timestamp: liquidityData.timestamp,
      type: 'liquidity_added' as const,
      poolId: liquidityData.poolId,
      user: liquidityData.provider,
      amount: liquidityData.amount,
      currency: 'STT'
    };
    setEvents(prev => {
      if (prev.some(e => e.id === eventId)) {
        console.log(`⚠️ LiveActivity: Event already in state: ${eventId}`);
        return prev;
      }
      return [newEvent, ...prev].slice(0, 50);
    });
    
    setTimeout(() => {
      processedEventIds.current.delete(eventId);
    }, 5 * 60 * 1000);
  });

  const formatTime = (timestamp: number): string => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getEventIcon = (type: ActivityEvent['type']): string => {
    switch (type) {
      case 'bet': return '🎯';
      case 'pool_created': return '🏗️';
      case 'liquidity_added': return '💧';
      default: return '📊';
    }
  };

  const getEventLabel = (type: ActivityEvent['type']): string => {
    switch (type) {
      case 'bet': return 'Bet Placed';
      case 'pool_created': return 'Pool Created';
      case 'liquidity_added': return 'Liquidity Added';
      default: return 'Activity';
    }
  };

  // ✅ IMPROVED: Enhanced drag and drop with better UX
  const handleMouseDown = (e: React.MouseEvent) => {
    // Allow dragging from anywhere on the panel (not just header)
    if (!panelRef.current) return;
    
    // Prevent dragging if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button') || target.closest('input') || target.closest('textarea')) {
      return;
    }
    
    setIsDragging(true);
    const rect = panelRef.current.getBoundingClientRect();
    
    // Calculate offset from mouse position to panel position
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    // Add visual feedback
    if (panelRef.current) {
      panelRef.current.style.transition = 'none'; // Disable transitions during drag
      panelRef.current.style.opacity = '0.9';
      panelRef.current.style.transform = 'scale(0.98)';
    }
    
    e.preventDefault(); // Prevent text selection
  };

  useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!panelRef.current) return;
      
      // Calculate new position based on mouse position and initial offset
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Get panel dimensions
      const panelWidth = panelRef.current.offsetWidth || 384;
      const panelHeight = panelRef.current.offsetHeight || 600;
      
      // Constrain to viewport with padding (10px from edges)
      const padding = 10;
      const maxX = window.innerWidth - panelWidth - padding;
      const maxY = window.innerHeight - panelHeight - padding;
      
      // Smooth constraint with boundary detection
      const constrainedX = Math.max(padding, Math.min(newX, maxX));
      const constrainedY = Math.max(padding, Math.min(newY, maxY));
      
      setPosition({
        x: constrainedX,
        y: constrainedY
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      
      // Restore visual feedback
      if (panelRef.current) {
        panelRef.current.style.transition = '';
        panelRef.current.style.opacity = '';
        panelRef.current.style.transform = '';
      }
    };

    // ✅ IMPROVED: Use passive listeners for better performance
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseup', handleMouseUp);
    
    // ✅ ADDED: Touch support for mobile with smooth dragging
    const handleTouchMove = (e: TouchEvent) => {
      if (!panelRef.current || e.touches.length !== 1) return;
      
      const touch = e.touches[0];
      const newX = touch.clientX - dragStart.x;
      const newY = touch.clientY - dragStart.y;
      
      const panelWidth = panelRef.current.offsetWidth || 384;
      const panelHeight = panelRef.current.offsetHeight || 600;
      
      const padding = 10;
      const maxX = window.innerWidth - panelWidth - padding;
      const maxY = window.innerHeight - panelHeight - padding;
      
      const constrainedX = Math.max(padding, Math.min(newX, maxX));
      const constrainedY = Math.max(padding, Math.min(newY, maxY));
      
      setPosition({
        x: constrainedX,
        y: constrainedY
      });
      
      e.preventDefault(); // Prevent scrolling while dragging
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      if (panelRef.current) {
        panelRef.current.style.transition = '';
        panelRef.current.style.opacity = '';
        panelRef.current.style.transform = '';
      }
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, dragStart]);

  // Load saved position from localStorage or set default
  useEffect(() => {
    const savedPosition = localStorage.getItem('liveActivityPosition');
    if (savedPosition) {
      try {
        const { x, y } = JSON.parse(savedPosition);
        setPosition({ x, y });
      } catch (e) {
        console.warn('Failed to load saved position:', e);
        // Set default position (bottom-left)
        setPosition({ x: 16, y: window.innerHeight - 616 });
      }
    } else {
      // Set default position on first load (bottom-left: 16px from left, 16px from bottom)
      setPosition({ x: 16, y: window.innerHeight - 616 });
    }
    
    // Handle window resize to keep panel in viewport
    const handleResize = () => {
      setPosition(prev => {
        const maxX = window.innerWidth - 384 - 10;
        const maxY = window.innerHeight - 600 - 10;
        return {
          x: Math.min(prev.x, maxX),
          y: Math.min(prev.y, maxY)
        };
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Save position to localStorage
  useEffect(() => {
    if (!isDragging) {
      const defaultY = window.innerHeight - 616;
      if (position.x !== 16 || position.y !== defaultY) {
        localStorage.setItem('liveActivityPosition', JSON.stringify(position));
      }
    }
  }, [position, isDragging]);

  if (!isOpen) {
    return (
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(true)}
      style={{ 
        position: 'fixed',
        top: `${position.y}px`,
        left: `${position.x}px`,
        zIndex: 50
      }}
        className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer"
      >
        <BoltIcon className="w-4 h-4" />
        Live Activity
        {events.length > 0 && (
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
            {events.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 50,
        cursor: isDragging ? 'grabbing' : 'move',
        userSelect: 'none', // Prevent text selection during drag
        WebkitUserSelect: 'none',
        touchAction: 'none' // Prevent default touch behaviors
      }}
      className={`w-96 max-h-[600px] bg-gray-900 border border-gray-700 rounded-lg shadow-2xl flex flex-col transition-all duration-200 ${isDragging ? 'shadow-cyan-500/50 ring-2 ring-cyan-500/30' : 'hover:shadow-cyan-500/20'}`}
      onMouseDown={handleMouseDown}
      onTouchStart={(e) => {
        // Handle touch start for mobile
        if (!panelRef.current) return;
        const target = e.target as HTMLElement;
        if (target.tagName === 'BUTTON' || target.closest('button')) return;
        
        const touch = e.touches[0];
        const rect = panelRef.current.getBoundingClientRect();
        setIsDragging(true);
        setDragStart({
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top
        });
        
        if (panelRef.current) {
          panelRef.current.style.transition = 'none';
          panelRef.current.style.opacity = '0.9';
        }
      }}
    >
      {/* Header - Enhanced with drag indicator */}
      <div
        className={`flex items-center justify-between p-3 border-b border-gray-700 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 ${isDragging ? 'cursor-grabbing' : 'cursor-move'} select-none`}
      >
        <div className="flex items-center gap-2 flex-1">
          {/* ✅ Drag Handle Indicator */}
          <div className="flex flex-col gap-0.5 cursor-move">
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          </div>
          <BoltIcon className="w-5 h-5 text-cyan-400" />
          <h3 className="text-white font-semibold text-sm">Live Activity</h3>
          {events.length > 0 && (
            <span className="bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full text-xs">
              {events.length}
            </span>
          )}
          {/* ✅ SDS Status Indicator */}
          <div className="flex items-center gap-1 ml-2">
            <div className={`w-2 h-2 rounded-full ${sdsStatus.isSDSActive ? 'bg-green-400 animate-pulse' : sdsStatus.isFallback ? 'bg-yellow-400' : 'bg-red-400'}`} title={sdsStatus.isSDSActive ? 'SDS Active' : sdsStatus.isFallback ? 'WebSocket Fallback' : 'Not Connected'} />
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent drag when clicking close
            setIsOpen(false);
          }}
          onMouseDown={(e) => e.stopPropagation()} // Prevent drag
          className="text-gray-400 hover:text-white text-xl transition-colors cursor-pointer p-1 rounded hover:bg-gray-700/50"
          title="Close"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Events List - Prevent drag when scrolling */}
      <div 
        className="flex-1 overflow-y-auto p-2 space-y-2"
        onMouseDown={(e) => e.stopPropagation()} // Prevent drag when clicking on content
        onTouchStart={(e) => e.stopPropagation()} // Prevent drag when touching content
      >
        {events.length === 0 ? (
          <div className="text-gray-500 text-xs text-center py-8">
            <BoltIcon className="w-8 h-8 mx-auto mb-2 text-gray-600" />
            <p>No activity yet</p>
            <p className="text-[10px] mt-1">Activity will appear here in real-time</p>
            {/* ✅ SDS Connection Status */}
            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-[10px] text-gray-600 mb-1">Connection Status:</p>
              <div className="flex items-center justify-center gap-2">
                <div className={`w-2 h-2 rounded-full ${sdsStatus.isSDSActive ? 'bg-green-400' : sdsStatus.isFallback ? 'bg-yellow-400' : 'bg-red-400'}`} />
                <span className="text-[10px]">
                  {sdsStatus.isSDSActive ? 'SDS Active' : sdsStatus.isFallback ? 'WebSocket Fallback' : 'Not Connected'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="bg-gray-800/50 hover:bg-gray-800 rounded-lg p-3 border border-gray-700/50 transition-all"
            >
              <div className="flex items-start gap-2">
                <span className="text-lg">{getEventIcon(event.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-white text-xs font-semibold">
                      {getEventLabel(event.type)}
                    </span>
                    <span className="text-gray-500 text-[10px] whitespace-nowrap">
                      {formatTime(event.timestamp)}
                    </span>
                  </div>
                  <div className="text-gray-400 text-[10px] truncate">
                    {event.user.slice(0, 6)}...{event.user.slice(-4)}
                  </div>
                  {event.poolTitle && (
                    <div className="text-gray-300 text-[10px] mt-1 truncate">
                      {event.poolTitle}
                    </div>
                  )}
                  {event.amount && (
                    <div className="text-cyan-400 text-xs font-medium mt-1">
                      {parseFloat(event.amount).toFixed(2)} {event.currency}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer - Prevent drag when clicking buttons */}
      <div 
        className="p-2 border-t border-gray-700 flex gap-2"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setEvents([])}
          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs py-1.5 rounded transition-colors cursor-pointer"
        >
          Clear
        </button>
      </div>
    </div>
  );
}


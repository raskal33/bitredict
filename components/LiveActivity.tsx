/**
 * Live Activity Component
 * 
 * Shows real-time activity events (bets placed, pools created, liquidity added)
 * Positioned at left bottom, opens onClick, closed by default
 */

'use client';

import { useState } from 'react';
import { useBetUpdates, usePoolCreatedUpdates, useLiquidityAddedUpdates } from '@/hooks/useSomniaStreams';
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

  // Subscribe to bet placed events
  useBetUpdates((betData: {
    poolId?: string | number;
    bettor?: string;
    amount?: string;
    timestamp?: number;
    poolTitle?: string;
    currency?: string;
  }) => {
    if (!betData.poolId || !betData.bettor) return;
    
    const newEvent: ActivityEvent = {
      id: `bet-${Date.now()}-${Math.random()}`,
      timestamp: betData.timestamp || Math.floor(Date.now() / 1000),
      type: 'bet' as const,
      poolId: betData.poolId.toString(),
      user: betData.bettor,
      amount: betData.amount,
      currency: betData.currency || 'STT',
      poolTitle: betData.poolTitle
    };
    setEvents(prev => [newEvent, ...prev].slice(0, 50));
  });

  // Subscribe to pool created events
  usePoolCreatedUpdates((poolData: {
    poolId: string;
    creator: string;
    timestamp?: number;
    title?: string;
  }) => {
    const newEvent: ActivityEvent = {
      id: `pool-${Date.now()}-${Math.random()}`,
      timestamp: poolData.timestamp || Math.floor(Date.now() / 1000),
      type: 'pool_created' as const,
      poolId: poolData.poolId,
      user: poolData.creator,
      poolTitle: poolData.title
    };
    setEvents(prev => [newEvent, ...prev].slice(0, 50));
  });

  // Subscribe to liquidity added events
  useLiquidityAddedUpdates((liquidityData: {
    poolId: string;
    provider: string;
    amount?: string;
    timestamp: number;
  }) => {
    const newEvent: ActivityEvent = {
      id: `lp-${Date.now()}-${Math.random()}`,
      timestamp: liquidityData.timestamp,
      type: 'liquidity_added' as const,
      poolId: liquidityData.poolId,
      user: liquidityData.provider,
      amount: liquidityData.amount,
      currency: 'STT'
    };
    setEvents(prev => [newEvent, ...prev].slice(0, 50));
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

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-50 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-semibold flex items-center gap-2 transition-all"
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
    <div className="fixed bottom-4 left-4 z-50 w-96 max-h-[600px] bg-gray-900 border border-gray-700 rounded-lg shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gradient-to-r from-cyan-600/20 to-blue-600/20">
        <div className="flex items-center gap-2">
          <BoltIcon className="w-5 h-5 text-cyan-400" />
          <h3 className="text-white font-semibold text-sm">Live Activity</h3>
          {events.length > 0 && (
            <span className="bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full text-xs">
              {events.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white text-xl transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {events.length === 0 ? (
          <div className="text-gray-500 text-xs text-center py-8">
            <BoltIcon className="w-8 h-8 mx-auto mb-2 text-gray-600" />
            <p>No activity yet</p>
            <p className="text-[10px] mt-1">Activity will appear here in real-time</p>
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

      {/* Footer */}
      <div className="p-2 border-t border-gray-700 flex gap-2">
        <button
          onClick={() => setEvents([])}
          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs py-1.5 rounded transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
}


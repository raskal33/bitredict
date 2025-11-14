/**
 * SDS Debug Panel
 * 
 * Comprehensive debugging panel for Somnia Data Streams
 * Shows connection status, subscriptions, and received events
 */

'use client';

import { useState, useEffect } from 'react';
import { useSomniaStreams } from '@/hooks/useSomniaStreams';

interface DebugEvent {
  timestamp: number;
  type: string;
  message: string;
  data?: unknown;
}

export function SDSDebugPanel() {
  const { isSDSActive, isFallback, error } = useSomniaStreams();
  const [events, setEvents] = useState<DebugEvent[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Capture console logs
  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const addEvent = (type: string, ...args: unknown[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      if (message.includes('SDS') || message.includes('Somnia') || 
          message.includes('subscription') || message.includes('WebSocket')) {
        setEvents(prev => [{
          timestamp: Date.now(),
          type,
          message,
          data: args.length === 1 && typeof args[0] === 'object' ? args[0] : undefined
        }, ...prev].slice(0, 100));
      }
    };

    console.log = (...args: unknown[]) => {
      addEvent('log', ...args);
      originalLog(...args);
    };

    console.error = (...args: unknown[]) => {
      addEvent('error', ...args);
      originalError(...args);
    };

    console.warn = (...args: unknown[]) => {
      addEvent('warn', ...args);
      originalWarn(...args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-50 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-semibold"
      >
        🔍 SDS Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 w-96 max-h-[600px] bg-gray-900 border border-gray-700 rounded-lg shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <h3 className="text-white font-semibold text-sm">🔍 SDS Debug Panel</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white text-xl"
        >
          ×
        </button>
      </div>

      {/* Status */}
      <div className="p-3 border-b border-gray-700 space-y-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            isSDSActive ? 'bg-green-500' : isFallback ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
          <span className="text-white text-xs">
            {isSDSActive ? '✅ SDS Active' : isFallback ? '⚠️ Fallback' : '❌ Disconnected'}
          </span>
        </div>
        {error && (
          <div className="text-red-400 text-xs">
            Error: {error.message}
          </div>
        )}
        <div className="text-gray-400 text-xs">
          Events: {events.length}
        </div>
      </div>

      {/* Events Log */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {events.length === 0 ? (
          <div className="text-gray-500 text-xs text-center py-4">
            No SDS events yet...
          </div>
        ) : (
          events.map((event, idx) => (
            <div
              key={idx}
              className={`text-xs p-2 rounded ${
                event.type === 'error' ? 'bg-red-900/20 text-red-300' :
                event.type === 'warn' ? 'bg-yellow-900/20 text-yellow-300' :
                'bg-gray-800 text-gray-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono flex-1 break-words">{event.message}</span>
                <span className="text-gray-500 text-[10px] whitespace-nowrap">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>
              {event.data !== undefined && (
                <pre className="mt-1 text-[10px] overflow-x-auto">
                  {String(JSON.stringify(event.data, null, 2))}
                </pre>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-700 flex gap-2">
        <button
          onClick={() => setEvents([])}
          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs py-1 rounded"
        >
          Clear
        </button>
        <button
          onClick={() => {
            const logText = events.map(e => 
              `[${new Date(e.timestamp).toISOString()}] ${e.type.toUpperCase()}: ${e.message}`
            ).join('\n');
            navigator.clipboard.writeText(logText);
          }}
          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs py-1 rounded"
        >
          Copy Logs
        </button>
      </div>
    </div>
  );
}


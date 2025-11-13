/**
 * SDS Connection Indicator
 * 
 * Shows users if they're connected to real-time streams
 */

'use client';

import { useSomniaStreams } from '@/hooks/useSomniaStreams';
import { motion } from 'framer-motion';

export function SDSConnectionIndicator() {
  const { isConnected, isSDSActive, isFallback, error } = useSomniaStreams();

  if (!isConnected && !error) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed bottom-4 right-4 z-50"
    >
      <div
        className={`px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm border ${
          isSDSActive
            ? 'bg-green-500/10 border-green-500/30'
            : isFallback
            ? 'bg-yellow-500/10 border-yellow-500/30'
            : 'bg-red-500/10 border-red-500/30'
        }`}
      >
        <div className="flex items-center gap-2">
          {/* Status Dot */}
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className={`w-2 h-2 rounded-full ${
              isSDSActive
                ? 'bg-green-500'
                : isFallback
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
          />

          {/* Status Text */}
          <div className="text-sm">
            {isSDSActive && (
              <span className="text-green-400 font-semibold">
                🚀 Live Streams Active
              </span>
            )}
            {isFallback && (
              <span className="text-yellow-400 font-semibold">
                ⚡ WebSocket Mode
              </span>
            )}
            {error && (
              <span className="text-red-400 font-semibold">
                🔴 Disconnected
              </span>
            )}
          </div>
        </div>

        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 w-64 p-2 bg-gray-800 rounded-lg shadow-xl opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
          <p className="text-xs text-gray-300">
            {isSDSActive &&
              'Connected to Somnia Data Streams for real-time enriched updates'}
            {isFallback &&
              'Using WebSocket fallback for real-time updates'}
            {error && 'Offline mode - updates may be delayed'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}



/**
 * WebSocket Usage Example Component
 * Demonstrates how to use WebSocket for real-time updates
 */

import { useState, useEffect } from 'react';
import { websocketClient } from '@/services/websocket-client';
import { FaWifi, FaSync } from 'react-icons/fa';
import { FiWifiOff } from 'react-icons/fi';

interface WebSocketMessage {
  type: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export default function WebSocketExample() {
  const [connectionStatus, setConnectionStatus] = useState({ connected: false, connecting: false });
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);

  useEffect(() => {
    // Handle connection status changes
    const handleConnectionStatus = (status: { connected: boolean; connecting: boolean }) => {
      setConnectionStatus(status);
    };

    // Handle pool progress updates
    const handlePoolProgress = (data: Record<string, unknown>) => {
      console.log('Pool progress update:', data);
      const message: WebSocketMessage = { type: 'pool_progress', data, timestamp: Date.now() };
      setLastMessage(message);
      setMessages(prev => [...prev.slice(-9), message]);
    };

    // Handle new bet updates
    const handleNewBet = (data: Record<string, unknown>) => {
      console.log('New bet placed:', data);
      const message: WebSocketMessage = { type: 'new_bet', data, timestamp: Date.now() };
      setLastMessage(message);
      setMessages(prev => [...prev.slice(-9), message]);
    };

    // Handle pool updates
    const handlePoolUpdate = (data: Record<string, unknown>) => {
      console.log('Pool update:', data);
      const message: WebSocketMessage = { type: 'pool_update', data, timestamp: Date.now() };
      setLastMessage(message);
      setMessages(prev => [...prev.slice(-9), message]);
    };

    // Connect to WebSocket
    websocketClient.connect();

    // Add event listeners
    websocketClient.on('connected', handleConnectionStatus);
    websocketClient.on('disconnected', handleConnectionStatus);
    websocketClient.on('pool_progress', handlePoolProgress);
    websocketClient.on('new_bet', handleNewBet);
    websocketClient.on('pool_update', handlePoolUpdate);

    // Subscribe to recent bets
    websocketClient.subscribeToRecentBets(handleNewBet);

    return () => {
      websocketClient.off('connected', handleConnectionStatus);
      websocketClient.off('disconnected', handleConnectionStatus);
      websocketClient.off('pool_progress', handlePoolProgress);
      websocketClient.off('new_bet', handleNewBet);
      websocketClient.off('pool_update', handlePoolUpdate);
      websocketClient.unsubscribeFromRecentBets(handleNewBet);
    };
  }, []);

  const handleReconnect = () => {
    websocketClient.disconnect();
    setTimeout(() => {
      websocketClient.connect();
    }, 1000);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">WebSocket Status</h3>
        <div className="flex items-center space-x-2">
          {connectionStatus.connected ? (
            <div className="flex items-center space-x-1 text-green-400">
              <FaWifi className="w-4 h-4" />
              <span className="text-sm">Connected</span>
            </div>
          ) : connectionStatus.connecting ? (
            <div className="flex items-center space-x-1 text-yellow-400">
              <FaSync className="w-4 h-4 animate-spin" />
              <span className="text-sm">Connecting...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-red-400">
              <FiWifiOff className="w-4 h-4" />
              <span className="text-sm">Disconnected</span>
            </div>
          )}
          <button
            onClick={handleReconnect}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
          >
            Reconnect
          </button>
        </div>
      </div>

      {lastMessage && (
        <div className="mb-4 p-3 bg-gray-700 rounded">
          <div className="text-sm text-gray-300 mb-1">
            Last Update: {formatTimestamp(lastMessage.timestamp)}
          </div>
          <div className="text-xs text-gray-400">
            Type: {lastMessage.type}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Data: {JSON.stringify(lastMessage.data, null, 2)}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-300">Recent Messages:</h4>
        <div className="max-h-40 overflow-y-auto space-y-1">
          {messages.length === 0 ? (
            <div className="text-sm text-gray-500">No messages yet...</div>
          ) : (
            messages.map((message, index) => (
              <div key={index} className="text-xs text-gray-400 p-2 bg-gray-700 rounded">
                <div className="flex justify-between">
                  <span>{message.type}</span>
                  <span>{formatTimestamp(message.timestamp)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <div>Subscriptions: {websocketClient.getSubscriptions().join(', ') || 'None'}</div>
        <div>WebSocket URL: {process.env.NEXT_PUBLIC_WS_URL || 'wss://bitredict-backend.fly.dev'}</div>
      </div>
    </div>
  );
}

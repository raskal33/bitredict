"use client";

import { useWalletConnection } from '@/hooks/useWalletConnection';
import { useState } from 'react';

export default function WalletConnectionDebug() {
  const {
    isConnected,
    address,
    chainId,
    isOnSomnia,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    switchToSomnia,
    connectionAttempts,
  } = useWalletConnection();

  const [showDebug, setShowDebug] = useState(false);

  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show debug in production
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="px-3 py-2 bg-blue-500 text-white rounded-lg text-xs"
      >
        Debug Wallet
      </button>

      {showDebug && (
        <div className="absolute bottom-full right-0 mb-2 p-4 bg-gray-900 border border-gray-700 rounded-lg text-xs text-white max-w-sm">
          <h3 className="font-bold mb-2">Wallet Connection Debug</h3>
          
          <div className="space-y-1">
            <div>Connected: {isConnected ? '✅' : '❌'}</div>
            <div>Connecting: {isConnecting ? '🔄' : '❌'}</div>
            <div>On Somnia: {isOnSomnia ? '✅' : '❌'}</div>
            <div>Chain ID: {chainId || 'N/A'}</div>
            <div>Address: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'N/A'}</div>
            <div>Attempts: {connectionAttempts}</div>
            {error && <div className="text-red-400">Error: {error}</div>}
          </div>

          <div className="mt-3 space-y-1">
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="block w-full px-2 py-1 bg-blue-500 text-white rounded text-xs disabled:opacity-50"
            >
              Connect
            </button>
            <button
              onClick={disconnectWallet}
              className="block w-full px-2 py-1 bg-red-500 text-white rounded text-xs"
            >
              Disconnect
            </button>
            <button
              onClick={switchToSomnia}
              className="block w-full px-2 py-1 bg-green-500 text-white rounded text-xs"
            >
              Switch to Somnia
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 
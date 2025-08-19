"use client";

import { useWalletConnection } from '@/hooks/useWalletConnection';
import { CheckCircleIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface WalletConnectionStatusProps {
  className?: string;
}

export default function WalletConnectionStatus({ className = "" }: WalletConnectionStatusProps) {
  const { isConnected, isConnecting, error, isOnSomnia } = useWalletConnection();

  if (!isConnected && !isConnecting && !error) {
    return null; // Don't show anything when not connected and no error
  }

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      {isConnecting && (
        <>
          <ArrowPathIcon className="h-3 w-3 animate-spin text-blue-400" />
          <span className="text-blue-400">Connecting...</span>
        </>
      )}
      
      {isConnected && isOnSomnia && (
        <>
          <CheckCircleIcon className="h-3 w-3 text-green-400" />
          <span className="text-green-400">Connected to Somnia</span>
        </>
      )}
      
      {isConnected && !isOnSomnia && (
        <>
          <ExclamationTriangleIcon className="h-3 w-3 text-yellow-400" />
          <span className="text-yellow-400">Wrong Network</span>
        </>
      )}
      
      {error && (
        <>
          <ExclamationTriangleIcon className="h-3 w-3 text-red-400" />
          <span className="text-red-400">{error}</span>
        </>
      )}
    </div>
  );
}

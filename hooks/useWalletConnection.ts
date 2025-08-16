import { useState, useEffect, useCallback } from 'react';
import { useAccount, useDisconnect, useChainId } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { somniaNetwork } from '@/config/wagmi';

export interface WalletConnectionState {
  isConnected: boolean;
  address: string | undefined;
  chainId: number | undefined;
  isOnSomnia: boolean;
  isConnecting: boolean;
  error: string | null;
}

export function useWalletConnection() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { open, close } = useAppKit();
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  // Check if user is on Somnia network
  const isOnSomnia = chainId === somniaNetwork.id;

  // Switch to Somnia network
  const switchToSomnia = useCallback(async () => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not detected');
      }

      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${somniaNetwork.id.toString(16)}` }],
      });
    } catch (error: unknown) {
      // If network doesn't exist, add it
      if ((error as { code?: number }).code === 4902) {
        try {
          await window.ethereum?.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${somniaNetwork.id.toString(16)}`,
              chainName: somniaNetwork.name,
              nativeCurrency: somniaNetwork.nativeCurrency,
              rpcUrls: somniaNetwork.rpcUrls.default.http,
              blockExplorerUrls: somniaNetwork.blockExplorers ? [somniaNetwork.blockExplorers.default.url] : [],
            }],
          });
        } catch (addError) {
          console.error('Failed to add Somnia network:', addError);
          throw new Error('Failed to add Somnia network to MetaMask');
        }
      } else {
        console.error('Failed to switch to Somnia network:', error);
        throw new Error('Failed to switch to Somnia network');
      }
    }
  }, []);

  // Connect wallet with proper error handling
  const connectWallet = useCallback(async () => {
    try {
      setIsConnecting(true);
      setError(null);
      setConnectionAttempts(prev => prev + 1);

      console.log('🔗 Opening AppKit wallet modal...');
      
      // Open AppKit modal
      open();

      // Set a timeout to detect if connection is taking too long
      const connectionTimeout = setTimeout(() => {
        if (!isConnected && isConnecting) {
          console.warn('⚠️ Wallet connection taking longer than expected...');
          setError('Connection is taking longer than expected. Please check your MetaMask extension.');
        }
      }, 15000); // 15 seconds timeout

      // Wait for connection with better detection
      const checkConnection = setInterval(() => {
        if (isConnected && address) {
          clearTimeout(connectionTimeout);
          clearInterval(checkConnection);
          setIsConnecting(false);
          setError(null);
          console.log('✅ Wallet connected successfully');
          
          // Auto-close AppKit modal after successful connection
          setTimeout(() => {
            close();
          }, 1000);
        }
      }, 500);

      // Cleanup interval after 30 seconds (reduced from 45)
      setTimeout(() => {
        clearInterval(checkConnection);
        if (!isConnected) {
          setIsConnecting(false);
          setError('Connection timeout. Please try again.');
          // Close modal on timeout
          close();
        }
      }, 30000);

    } catch (error) {
      console.error('❌ Wallet connection failed:', error);
      setIsConnecting(false);
      setError(error instanceof Error ? error.message : 'Failed to connect wallet');
      // Close modal on error
      close();
    }
  }, [isConnected, isConnecting, open, close, address]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    try {
      disconnect();
      setError(null);
      setConnectionAttempts(0);
      console.log('✅ Wallet disconnected');
    } catch (error) {
      console.error('❌ Failed to disconnect wallet:', error);
      setError('Failed to disconnect wallet');
    }
  }, [disconnect]);

  // Auto-switch to Somnia network when connected to wrong network
  useEffect(() => {
    if (isConnected && !isOnSomnia && chainId) {
      console.log(`⚠️ Connected to wrong network (${chainId}), switching to Somnia...`);
      switchToSomnia().catch(error => {
        console.error('Failed to switch network:', error);
        setError('Please switch to Somnia network in MetaMask');
      });
    }
  }, [isConnected, isOnSomnia, chainId, switchToSomnia]);

  // Reset error when connection succeeds
  useEffect(() => {
    if (isConnected) {
      setError(null);
      setIsConnecting(false);
    }
  }, [isConnected]);

  // Auto-retry connection on network issues
  useEffect(() => {
    if (error && error.includes('network') && connectionAttempts < 3) {
      const retryTimeout = setTimeout(() => {
        console.log('🔄 Retrying connection...');
        connectWallet();
      }, 2000);
      
      return () => clearTimeout(retryTimeout);
    }
  }, [error, connectionAttempts, connectWallet]);

  return {
    // State
    isConnected,
    address,
    chainId,
    isOnSomnia,
    isConnecting,
    error,
    
    // Actions
    connectWallet,
    disconnectWallet,
    switchToSomnia,
    
    // Utils
    connectionAttempts,
  };
} 
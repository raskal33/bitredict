import { useState, useEffect, useCallback, useRef } from 'react';
import { useAccount, useDisconnect, useChainId } from 'wagmi';
import { useAppKit, useAppKitState } from '@reown/appkit/react';
import { somniaNetwork } from '@/config/wagmi';
import { toast } from 'react-hot-toast';

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
  const { open: isModalOpen } = useAppKitState();
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  
  // Use refs to track timeouts and intervals for proper cleanup
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const checkConnectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Clear all timeouts and intervals
  const clearAllTimers = useCallback(() => {
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    if (checkConnectionIntervalRef.current) {
      clearInterval(checkConnectionIntervalRef.current);
      checkConnectionIntervalRef.current = null;
    }
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }
  }, []);

  // Connect wallet with proper error handling
  const connectWallet = useCallback(async () => {
    try {
      // Clear any existing timers
      clearAllTimers();
      
      setIsConnecting(true);
      setError(null);
      setConnectionAttempts(prev => prev + 1);

      console.log('🔗 Opening AppKit wallet modal...');
      
      // Open AppKit modal
      open();

      // Set a timeout for warning about slow connection
      connectionTimeoutRef.current = setTimeout(() => {
        console.warn('⚠️ Wallet connection taking longer than expected...');
        setError('Connection is taking longer than expected. Please check your wallet extension.');
      }, 15000); // 15 seconds timeout

      // Set a final timeout to cleanup if connection fails
      cleanupTimeoutRef.current = setTimeout(() => {
        console.warn('⚠️ Connection timeout reached, cleaning up...');
        clearAllTimers();
        setIsConnecting(false);
        setError('Connection timeout. Please try again.');
        toast.error('Connection timeout. Please try again.', {
          duration: 5000,
        });
      }, 45000); // 45 seconds final timeout

    } catch (error) {
      console.error('❌ Wallet connection failed:', error);
      clearAllTimers();
      setIsConnecting(false);
      setError(error instanceof Error ? error.message : 'Failed to connect wallet');
    }
  }, [open, clearAllTimers]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    try {
      clearAllTimers();
      disconnect();
      setError(null);
      setConnectionAttempts(0);
      setIsConnecting(false);
      console.log('✅ Wallet disconnected');
      toast.success('Wallet disconnected', {
        duration: 2000,
      });
    } catch (error) {
      console.error('❌ Failed to disconnect wallet:', error);
      setError('Failed to disconnect wallet');
      toast.error('Failed to disconnect wallet', {
        duration: 3000,
      });
    }
  }, [disconnect, clearAllTimers]);

  // Handle successful wallet connection
  useEffect(() => {
    if (isConnected && address && isConnecting) {
      console.log('✅ Wallet connected successfully');
      clearAllTimers();
      setIsConnecting(false);
      setError(null);
      
      // Show success toast
      toast.success('Wallet connected successfully! 🎉', {
        duration: 3000,
        style: {
          background: '#10B981',
          color: '#fff',
        },
      });
      
      // Auto-close AppKit modal after successful connection
      setTimeout(() => {
        close();
      }, 1000);
    }
  }, [isConnected, address, isConnecting, clearAllTimers, close]);

  // Handle modal state changes
  useEffect(() => {
    // If modal is closed but we're still connecting, reset the connecting state
    if (!isModalOpen && isConnecting && !isConnected) {
      console.log('🔄 Modal closed during connection, resetting state...');
      clearAllTimers();
      setIsConnecting(false);
      // Don't set error here as user might have intentionally closed the modal
    }
  }, [isModalOpen, isConnecting, isConnected, clearAllTimers]);

  // Auto-switch to Somnia network when connected to wrong network
  useEffect(() => {
          if (isConnected && !isOnSomnia && chainId) {
              console.log(`⚠️ Connected to wrong network (${chainId}), switching to Somnia...`);
        toast('Switching to Somnia network...', {
        duration: 3000,
        icon: '🔄',
        style: {
          background: '#F59E0B',
          color: '#fff',
        },
      });
      
      switchToSomnia().catch(error => {
        console.error('Failed to switch network:', error);
        setError('Please switch to Somnia network in your wallet');
        toast.error('Please switch to Somnia network in your wallet', {
          duration: 5000,
        });
      });
    }
  }, [isConnected, isOnSomnia, chainId, switchToSomnia]);

  // Reset error when connection succeeds
  useEffect(() => {
    if (isConnected && error) {
      setError(null);
    }
  }, [isConnected, error]);

  // Auto-retry connection on network issues (with exponential backoff)
  useEffect(() => {
    if (error && error.includes('network') && connectionAttempts < 3) {
      const retryDelay = Math.pow(2, connectionAttempts) * 2000; // 2s, 4s, 8s
      const retryTimeout = setTimeout(() => {
        console.log(`🔄 Retrying connection (attempt ${connectionAttempts + 1})...`);
        connectWallet();
      }, retryDelay);
      
      return () => clearTimeout(retryTimeout);
    }
  }, [error, connectionAttempts, connectWallet]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

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
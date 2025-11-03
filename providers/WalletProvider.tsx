"use client";

import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiAdapter, appKit } from '@/config/wagmi'
import { ReactNode, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { serializeBigInts, createBigIntSafeQueryKeyHasher, setupGlobalBigIntSerialization } from '@/utils/bigint-serializer'

// Setup global BigInt serialization
setupGlobalBigIntSerialization();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      structuralSharing: false,
      // Add custom serializer for BigInt values
      queryKeyHashFn: createBigIntSafeQueryKeyHasher(),
      // Transform query data to handle BigInt values
      select: (data: any) => {
        return serializeBigInts(data);
      },
    },
  },
})

export default function WalletProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Ensure AppKit is properly initialized on client side
    if (typeof window !== 'undefined') {
      console.log('🔗 AppKit initialized for Somnia Network');
    }
  }, []);

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 5000,
            style: {
              background: '#1a1a1a',
              color: '#fff',
              border: '1px solid #333',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
              style: {
                background: '#064e3b',
                border: '1px solid #10b981',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
              style: {
                background: '#7f1d1d',
                border: '1px solid #ef4444',
              },
            },
          }}
        />
      </QueryClientProvider>
    </WagmiProvider>
  )
} 
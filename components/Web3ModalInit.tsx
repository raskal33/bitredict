"use client";

import { useEffect } from 'react'
import { config } from '@/config/wagmi'

// Get project ID from environment
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '1d0e0f5e-58e9-41e8-afb5-bef61bde14b4'

export default function Web3ModalInit() {
  useEffect(() => {
    // Only initialize on client side
    if (typeof window !== 'undefined') {
      import('@web3modal/wagmi/react').then(({ createWeb3Modal }) => {
        const modal = createWeb3Modal({
          wagmiConfig: config,
          projectId,
          enableAnalytics: false,
          themeMode: 'dark',
          themeVariables: {
            '--w3m-color-mix': '#22C7FF',
            '--w3m-color-mix-strength': 20,
            '--w3m-accent': '#22C7FF',
            '--w3m-background': '#0A0A23',
            '--w3m-border-radius-master': '12px',
          }
        })
        
        // Store modal reference globally
        ;(window as any).web3modal = modal
      }).catch(error => {
        console.log('Web3Modal initialization skipped:', error.message)
      })
    }
  }, [])

  return null // This component doesn't render anything
} 
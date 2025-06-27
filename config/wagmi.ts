import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, sepolia } from '@reown/appkit/networks'

// Somnia Network configuration
export const somniaNetwork = {
  id: 50312,
  name: 'Somnia Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'STT',
    symbol: 'STT',
  },
  rpcUrls: {
    default: {
      http: ['https://dream-rpc.somnia.network'],
    },
  },
  blockExplorers: {
    default: { name: 'Somnia Explorer', url: 'https://shannon-explorer.somnia.network' },
  },
  testnet: true,
} as const

// Get project ID from environment
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '6a0514d82fb621e41aa6cad5473883a3'

// Create the networks array
const networks = [somniaNetwork, mainnet, sepolia]

// Create Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true
})

// Create AppKit instance
export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata: {
    name: 'BitRedict',
    description: 'Decentralized Prediction Markets on Somnia Network',
    url: 'https://bitredict.com',
    icons: ['https://bitredict.com/logo.png']
  },
  features: {
    analytics: true,
    email: false,
    socials: false,
    emailShowWallets: false,
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-font-family': 'var(--font-onest), system-ui, sans-serif',
    '--w3m-accent': '#22C7FF',
    '--w3m-color-mix': '#22C7FF',
    '--w3m-color-mix-strength': 20,
    '--w3m-border-radius-master': '12px',
    '--w3m-z-index': 9999,
    
    // Background colors to match Somnia design
    '--w3m-background-color': '#0A0A1A',
    '--w3m-foreground-color': 'rgba(22, 24, 48, 0.8)',
    
    // Text colors
    '--w3m-text-primary-color': '#FFFFFF',
    '--w3m-text-secondary-color': '#C2C2D6',
    '--w3m-text-tertiary-color': '#8A8AA8',
    
    // Button colors
    '--w3m-button-primary-color': '#22C7FF',
    '--w3m-button-secondary-color': 'rgba(255, 255, 255, 0.05)',
    
    // Border colors
    '--w3m-border-color': 'rgba(255, 255, 255, 0.1)',
    '--w3m-overlay-background-color': 'rgba(0, 0, 0, 0.8)',
  }
})

export const config = wagmiAdapter.wagmiConfig 
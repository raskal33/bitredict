import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, sepolia, type AppKitNetwork } from '@reown/appkit/networks'

// Somnia Network configuration - CORRECT SETTINGS FROM HARDHAT
export const somniaNetwork: AppKitNetwork = {
  id: 50312,
  name: 'Somnia Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'STT',
    symbol: 'STT',
  },
  rpcUrls: {
    default: {
      http: ['https://dream-rpc.somnia.network/'],
    },
  },
  blockExplorers: {
    default: { name: 'Somnia Explorer', url: 'https://somnia-testnet.explorer.caldera.xyz' },
  },
  testnet: true,
}

// Get project ID from environment
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '6a0514d82fb621e41aa6cad5473883a3'

// Create the networks array
const networks = [somniaNetwork, mainnet, sepolia] as [AppKitNetwork, ...AppKitNetwork[]]

// Create Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: false
})

// Create AppKit instance
export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata: {
    name: 'BitRedict',
    description: 'Decentralized Prediction Markets on Somnia Network',
    url: 'https://bitredict.vercel.app',
    icons: ['https://bitredict.vercel.app/logo.png']
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
  }
})

export const config = wagmiAdapter.wagmiConfig

// Contract addresses for smart contract integration
export const CONTRACT_ADDRESSES = {
  BITR_TOKEN: process.env.NEXT_PUBLIC_BITR_TOKEN_ADDRESS as `0x${string}`,
  FAUCET: process.env.NEXT_PUBLIC_FAUCET_ADDRESS as `0x${string}`,
  GUIDED_ORACLE: process.env.NEXT_PUBLIC_GUIDED_ORACLE_ADDRESS as `0x${string}`,
  BITREDICT_POOL: process.env.NEXT_PUBLIC_BITREDICT_POOL_ADDRESS as `0x${string}`,
  OPTIMISTIC_ORACLE: process.env.NEXT_PUBLIC_OPTIMISTIC_ORACLE_ADDRESS as `0x${string}`,
  BITREDICT_STAKING: process.env.NEXT_PUBLIC_BITREDICT_STAKING_ADDRESS as `0x${string}`,
  ODDYSSEY: process.env.NEXT_PUBLIC_ODDYSSEY_ADDRESS as `0x${string}`,
}

// Network configuration for contract calls
export const NETWORK_CONFIG = {
  chainId: 50312,
  rpcUrl: 'https://dream-rpc.somnia.network/',
  explorerUrl: 'https://somnia-testnet.explorer.caldera.xyz',
}

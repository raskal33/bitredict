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
  ssr: true
})

// Create AppKit instance
export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata: {
    name: 'BitRedict - Connect Wallet',
    description: 'Connect your wallet to access decentralized prediction markets on Somnia Network',
    url: 'https://bitredict.vercel.app',
    icons: ['https://bitredict.vercel.app/logo.png'],
  },
  features: {
    analytics: false, // Disable analytics to remove Reown tracking
    email: false,
    socials: false,
    emailShowWallets: false,
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-font-family': 'var(--font-onest), system-ui, sans-serif',
    '--w3m-accent': '#22C7FF',
    '--w3m-color-mix': '#22C7FF',
    '--w3m-color-mix-strength': 25,
    '--w3m-border-radius-master': '16px',
    '--w3m-z-index': 999999,
  },
  allWallets: 'HIDE',
  featuredWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
  ]
})

export const config = wagmiAdapter.wagmiConfig

// Contract addresses for smart contract integration
export const CONTRACT_ADDRESSES = {
  BITR_TOKEN: (process.env.NEXT_PUBLIC_BITR_TOKEN_ADDRESS || '0x4b10fBFFDEE97C42E29899F47A2ECD30a38dBf2C') as `0x${string}`,
  FAUCET: process.env.NEXT_PUBLIC_FAUCET_ADDRESS as `0x${string}`,
  GUIDED_ORACLE: process.env.NEXT_PUBLIC_GUIDED_ORACLE_ADDRESS as `0x${string}`,
  BITREDICT_POOL: (process.env.NEXT_PUBLIC_BITREDICT_POOL_ADDRESS || '0x5F112bD56Eaa805DffF4b2929d9D44B2d364Cd08') as `0x${string}`,
  OPTIMISTIC_ORACLE: process.env.NEXT_PUBLIC_OPTIMISTIC_ORACLE_ADDRESS as `0x${string}`,
  BITREDICT_STAKING: (process.env.NEXT_PUBLIC_BITREDICT_STAKING_ADDRESS || '0x4736a1593d52803b2EabDf4EFd5645A0bfc22908') as `0x${string}`,
  ODDYSSEY: (process.env.NEXT_PUBLIC_ODDYSSEY_ADDRESS || '0x31AfDC3978317a1de606e76037429F3e456015C6') as `0x${string}`,
}

// Network configuration for contract calls
export const NETWORK_CONFIG = {
  chainId: 50312,
  rpcUrl: 'https://dream-rpc.somnia.network/',
  explorerUrl: 'https://somnia-testnet.explorer.caldera.xyz',
}

// Global gas settings - Optimized for Somnia Network
export const GAS_SETTINGS = {
  gas: BigInt(1000000), // 1M gas limit (increased for complex transactions)
  gasPrice: BigInt(10000000000), // 10 gwei (max for Somnia)
}

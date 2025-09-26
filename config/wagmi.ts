import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, sepolia, type AppKitNetwork } from '@reown/appkit/networks'

// Somnia Network configuration - PRODUCTION READY
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
      http: [
        process.env.NODE_ENV === 'development' 
          ? 'http://localhost:8080/api/rpc-proxy'
          : process.env.NEXT_PUBLIC_RPC_URL || 'https://dream-rpc.somnia.network/',
        'https://rpc.ankr.com/somnia_testnet/c8e336679a7fe85909f310fbbdd5fbb18d3b7560b1d3eca7aa97874b0bb81e97'
      ],
    },
  },
  blockExplorers: {
    default: { name: 'Somnia Explorer', url: 'https://explorer.somnia.network' },
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
    name: 'BITR - Connect Wallet',
    description: 'Connect your wallet to access decentralized prediction markets on Somnia Network',
    url: 'http://localhost:8080',
    icons: ['http://localhost:8080/logo.png'],
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
  ],
  // Improved connection settings
  enableWalletConnect: true,
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbase: false, // Disable Coinbase for better performance
})

export const config = wagmiAdapter.wagmiConfig

// Contract addresses for smart contract integration - UPDATED WITH NEW GAS-OPTIMIZED DEPLOYMENT
export const CONTRACT_ADDRESSES = {
  // Core Contracts (NEW GAS OPTIMIZED DEPLOYMENT)
  BITR_TOKEN: (process.env.NEXT_PUBLIC_BITR_TOKEN_ADDRESS || '0x67aa1549551ff4479B68F1eC19fD011571C7db10') as `0x${string}`,
  POOL_CORE: (process.env.NEXT_PUBLIC_POOL_CORE_ADDRESS || '0xc9274Fec155A712a94929d99a9A9F7547E5910Ae') as `0x${string}`,
  BOOST_SYSTEM: (process.env.NEXT_PUBLIC_BOOST_SYSTEM_ADDRESS || '0x248Db35738619417E89f09d90A5b6bF68cA9b796') as `0x${string}`,
  COMBO_POOLS: (process.env.NEXT_PUBLIC_COMBO_POOLS_ADDRESS || '0xD2c450BbB31678ea43018fb6c35C24a6EdC9e667') as `0x${string}`,
  FACTORY: (process.env.NEXT_PUBLIC_FACTORY_ADDRESS || '0xeB3695dFbb7479422E272e646fd911FE6AAE9ef9') as `0x${string}`,
  
  // Oracle Contracts
  GUIDED_ORACLE: (process.env.NEXT_PUBLIC_GUIDED_ORACLE_ADDRESS || '0x9CFB1097577480BD0eDe1795018c89786c541097') as `0x${string}`,
  OPTIMISTIC_ORACLE: (process.env.NEXT_PUBLIC_OPTIMISTIC_ORACLE_ADDRESS || '0xa43e982eA27CD4B34E72E1B65A83E21A9eC777DC') as `0x${string}`,
  
  // System Contracts
  REPUTATION_SYSTEM: (process.env.NEXT_PUBLIC_REPUTATION_SYSTEM_ADDRESS || '0xA9E9540C8d8F6dC75a992F856e1A5AC8eeC2d1A0') as `0x${string}`,
  STAKING_CONTRACT: (process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS || '0xBA03cD2F1c150416C8d9cDf31778157B74010513') as `0x${string}`,
  FAUCET: (process.env.NEXT_PUBLIC_FAUCET_ADDRESS || '0x93042C9D81E33fEc7Cc75820F0F5Aa6C335d398F') as `0x${string}`,
  ODDYSSEY: (process.env.NEXT_PUBLIC_ODDYSSEY_ADDRESS || '0xfe20e7dAcff3Ca602ba27fCE3052a505278E489b') as `0x${string}`,
  
  // Legacy support (for backward compatibility) - UPDATED TO NEW ADDRESSES
  BITREDICT_POOL: (process.env.NEXT_PUBLIC_BITREDICT_POOL_ADDRESS || '0xc9274Fec155A712a94929d99a9A9F7547E5910Ae') as `0x${string}`, // Updated to new address
  BITREDICT_STAKING: (process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS || '0xBA03cD2F1c150416C8d9cDf31778157B74010513') as `0x${string}`,
}

// Network configuration for contract calls
export const NETWORK_CONFIG = {
  chainId: 50312,
  rpcUrl: process.env.NODE_ENV === 'development' 
    ? 'http://localhost:8080/api/rpc-proxy'
    : process.env.NEXT_PUBLIC_RPC_URL || 'https://dream-rpc.somnia.network/',
  explorerUrl: 'https://explorer.somnia.network',
}

// Global gas settings - Optimized for Somnia Network
export const GAS_SETTINGS = {
  gas: BigInt(14000000), // 14M gas limit (within Somnia testnet block limit of 14,426,929)
  gasPrice: BigInt(6000000000), // 6 gwei (Somnia testnet optimized)
  maxFeePerGas: BigInt(10000000000), // 10 gwei max fee
  maxPriorityFeePerGas: BigInt(2000000000), // 2 gwei priority fee
}

// Robust network connection settings
export const NETWORK_CONNECTION_CONFIG = {
  // Multiple RPC endpoints for redundancy
  rpcUrls: [
    'https://dream-rpc.somnia.network/',
    'https://rpc.ankr.com/somnia_testnet/c8e336679a7fe85909f310fbbdd5fbb18d3b7560b1d3eca7aa97874b0bb81e97',
  ],
  // Connection retry settings
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  // Timeout settings
  requestTimeout: 30000, // 30 seconds
  // Health check settings
  healthCheckInterval: 60000, // 1 minute
}

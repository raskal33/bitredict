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
    url: typeof window !== 'undefined' ? window.location.origin : 'https://bitredict.vercel.app',
    icons: [typeof window !== 'undefined' ? `${window.location.origin}/logo.png` : 'https://bitredict.vercel.app/logo.png'],
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

// Contract addresses for smart contract integration - SOMNIA TESTNET DEPLOYMENT - October 27, 2025
export const CONTRACT_ADDRESSES = {
  // Core Contracts (SOMNIA TESTNET - October 27, 2025)
  BITR_TOKEN: (process.env.NEXT_PUBLIC_BITR_TOKEN_ADDRESS || '0xfD8263CB7B270c09D589CFEAa5Ba3C5AE1C6b1AC') as `0x${string}`,
  POOL_CORE: (process.env.NEXT_PUBLIC_POOL_CORE_ADDRESS || '0x7055e853562c7306264F3E0d50C56160C3F0d5Cf') as `0x${string}`,
  BOOST_SYSTEM: (process.env.NEXT_PUBLIC_BOOST_SYSTEM_ADDRESS || '0x54E46a1B9170C5218C953713dBB4Fd61F73bf5d2') as `0x${string}`,
  COMBO_POOLS: (process.env.NEXT_PUBLIC_COMBO_POOLS_ADDRESS || '0x30222540A36D838e36FA4029fAb931e0f9010CFF') as `0x${string}`,
  FACTORY: (process.env.NEXT_PUBLIC_FACTORY_ADDRESS || '0x7e686149322Ce8de0a0E047bf7590fe3fF353a98') as `0x${string}`,
  
  // Oracle Contracts
  GUIDED_ORACLE: (process.env.NEXT_PUBLIC_GUIDED_ORACLE_ADDRESS || '0x1Ef65F8F1D11829CB72E5D66038B3900d441d944') as `0x${string}`,
  OPTIMISTIC_ORACLE: (process.env.NEXT_PUBLIC_OPTIMISTIC_ORACLE_ADDRESS || '0xa6CE0C52Be110815F973AF68f8CEe04D2D218771') as `0x${string}`,
  
  // System Contracts
  REPUTATION_SYSTEM: (process.env.NEXT_PUBLIC_REPUTATION_SYSTEM_ADDRESS || '0x868A0d50A12bABdAE1148807E08223EB76Dd32eb') as `0x${string}`,
  STAKING_CONTRACT: (process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS || '0x9C2d0083d733866202e6ff7d8514851Bb4715f96') as `0x${string}`,
  FAUCET: (process.env.NEXT_PUBLIC_FAUCET_ADDRESS || '0x64C8a33f4D5938968eB51a33f62F14b514d342d7') as `0x${string}`,
  ODDYSSEY: (process.env.NEXT_PUBLIC_ODDYSSEY_ADDRESS || '0x91eAf09ea6024F88eDB26F460429CdfD52349259') as `0x${string}`,
  
  // Legacy support (for backward compatibility) - UPDATED TO SOMNIA TESTNET ADDRESSES
  BITREDICT_POOL: (process.env.NEXT_PUBLIC_BITREDICT_POOL_ADDRESS || '0x7055e853562c7306264F3E0d50C56160C3F0d5Cf') as `0x${string}`,
  BITREDICT_STAKING: (process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS || '0x9C2d0083d733866202e6ff7d8514851Bb4715f96') as `0x${string}`,
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
  gas: BigInt(10000000), // 10M gas limit (reduced for lightweight functions)
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

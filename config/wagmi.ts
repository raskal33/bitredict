import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { type AppKitNetwork } from '@reown/appkit/networks'

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
      webSocket: ['wss://dream-rpc.somnia.network/ws'],
    },
    public: {
      http: ['https://dream-rpc.somnia.network/'],
      webSocket: ['wss://dream-rpc.somnia.network/ws'],
    },
  },
  blockExplorers: {
    default: { name: 'Somnia Explorer', url: 'https://shannon-explorer.somnia.network' },
  },
  testnet: true,
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 1,
    },
  },
}

// Get project ID from environment
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '6a0514d82fb621e41aa6cad5473883a3'

// Create the networks array (Somnia only)
const networks = [somniaNetwork] as [AppKitNetwork, ...AppKitNetwork[]]

// Create Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true
})

// Create AppKit instance (client-only)
export const appKit = typeof window !== 'undefined'
  ? createAppKit({
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
      ],
      // Improved connection settings
      enableWalletConnect: true,
      enableInjected: true,
      enableEIP6963: true,
      enableCoinbase: false, // Disable Coinbase for better performance
    })
  : undefined as any

export const config = wagmiAdapter.wagmiConfig

// Contract addresses for smart contract integration
export const CONTRACT_ADDRESSES = {
  BITR_TOKEN: (process.env.NEXT_PUBLIC_BITR_TOKEN_ADDRESS || '0x4b10fBFFDEE97C42E29899F47A2ECD30a38dBf2C') as `0x${string}`,
  FAUCET: (process.env.NEXT_PUBLIC_FAUCET_ADDRESS || '0x1656712131BB07dDE6EeC7D88757Db24782cab71') as `0x${string}`,
  GUIDED_ORACLE: (process.env.NEXT_PUBLIC_GUIDED_ORACLE_ADDRESS || '0x2103cCfc9a15F2876765487F594481D5f8EC160a') as `0x${string}`,
  BITREDICT_POOL: (process.env.NEXT_PUBLIC_BITREDICT_POOL_ADDRESS || '0x6C9DCB0F967fbAc62eA82d99BEF8870b4272919a') as `0x${string}`,
  OPTIMISTIC_ORACLE: (process.env.NEXT_PUBLIC_OPTIMISTIC_ORACLE_ADDRESS || '0x9E53d44aD3f614BA53F3B21EDF9fcE79a72238b2') as `0x${string}`,
  BITREDICT_STAKING: (process.env.NEXT_PUBLIC_BITREDICT_STAKING_ADDRESS || '0x4736a1593d52803b2EabDf4EFd5645A0bfc22908') as `0x${string}`,
  ODDYSSEY: (process.env.NEXT_PUBLIC_ODDYSSEY_ADDRESS || '0x31AfDC3978317a1de606e76037429F3e456015C6') as `0x${string}`,
}

// Network configuration for contract calls
export const NETWORK_CONFIG = {
  chainId: 50312,
  rpcUrl: 'https://dream-rpc.somnia.network/',
  explorerUrl: 'https://shannon-explorer.somnia.network',
}

// Global gas settings - Optimized for Somnia Network
export const GAS_SETTINGS = {
  gas: BigInt(2000000), // 2M gas limit (increased for complex transactions)
  gasPrice: BigInt(20000000000), // 20 gwei (increased for reliability)
  maxFeePerGas: BigInt(30000000000), // 30 gwei max fee
  maxPriorityFeePerGas: BigInt(2000000000), // 2 gwei priority fee
}

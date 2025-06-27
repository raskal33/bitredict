# Wallet Setup Guide

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# WalletConnect Project ID
# Get your project ID from https://cloud.walletconnect.com
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id-here

# Somnia Network RPC (optional - uses default if not provided)
NEXT_PUBLIC_SOMNIA_RPC_URL=https://rpc.somnia.network
```

## Getting WalletConnect Project ID

1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com)
2. Sign up/Sign in
3. Create a new project
4. Copy the Project ID
5. Add it to your `.env.local` file

## Supported Wallets

The app supports:
- MetaMask
- WalletConnect (300+ wallets)
- Coinbase Wallet
- Any injected wallet

## Network Configuration

The app is configured for:
- **Somnia Testnet** (Primary) - Chain ID: 50312
- **Ethereum Mainnet** (Fallback) - Chain ID: 1
- **Sepolia Testnet** (Development) - Chain ID: 11155111

### Somnia Testnet Details:
- **Network Name**: Somnia Testnet
- **Chain ID**: 50312
- **RPC URL**: https://dream-rpc.somnia.network
- **Block Explorer**: https://shannon-explorer.somnia.network
- **Symbol**: STT

## Features

- **Auto Profile Creation**: First-time users get a profile creation modal
- **Local Storage**: Profiles are stored locally (no backend needed)
- **Wallet Integration**: Full EVM wallet connectivity
- **Network Switching**: Automatic network detection and switching

## No Backend Required

This is a fully decentralized app:
- Smart contracts handle all business logic
- User profiles stored in browser localStorage
- No traditional database needed
- No user authentication API required

## Testing

1. Install dependencies: `npm install`
2. Set up environment variables
3. Run development server: `npm run dev`
4. Connect a wallet to test profile creation 
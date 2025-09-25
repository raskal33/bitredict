# Bitredict - Decentralized Prediction Markets

This is the frontend for **Bitredict**, a comprehensive decentralized prediction market platform built on **Somnia blockchain** with smart contracts deployed on **Somnia testnet**.

## 🚀 Features

### Core Prediction Markets
- **Pool Creation**: Create prediction pools with custom odds and stakes
- **Guided Markets**: AI-powered football match predictions with real-time data
- **Combo Pools**: Multi-match prediction combinations
- **Crypto Markets**: Cryptocurrency price prediction markets
- **Custom Markets**: User-defined prediction scenarios

### Token System
- **BITR Token**: Primary utility token for high-value predictions
- **STT Token**: Native blockchain token for standard predictions
- **Creation Fees**: 50 BITR or 1 STT for pool creation
- **Platform Fees**: Dynamic fee structure based on BITR holdings

### Advanced Features
- **Reputation System**: User reputation tracking and tier-based permissions
- **Boost System**: Pool promotion with BRONZE, SILVER, GOLD tiers
- **Liquidity Provision**: Add liquidity to existing pools
- **Private Pools**: Whitelist-based private prediction markets
- **Analytics**: Comprehensive pool and user analytics

### Oddyssey Integration
- **Daily Predictions**: 10-match daily prediction slips
- **Prize Pools**: Community-driven prize distribution
- **Cycle Management**: Automated prediction cycles
- **Match Data**: Real-time football match information

## 🛠️ Technology Stack

- **Frontend**: Next.js 15 with TypeScript
- **Blockchain**: Somnia testnet
- **Smart Contracts**: Solidity with OpenZeppelin
- **Wallet Integration**: Wagmi v2 with WalletConnect
- **UI Components**: Tailwind CSS with Heroicons
- **State Management**: Zustand for global state
- **API Integration**: RESTful APIs with real-time data

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm/yarn/pnpm
- Somnia testnet wallet (MetaMask recommended)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd predict-linux

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration
```

### Development

```bash
# Start the development server
npm run dev

# Run linting
npm run lint

# Type checking
npx tsc
```

Open [http://localhost:8080](http://localhost:8080) to view the application.

## 📱 Application Structure

### Pages
- **Home**: Featured pools and platform overview
- **Markets**: Browse all available prediction markets
- **Create Prediction**: Pool creation interface
- **Oddyssey**: Daily prediction game
- **Staking**: BITR token staking interface
- **Profile**: User dashboard and statistics

### Key Components
- **Pool Cards**: Enhanced pool display with analytics
- **Market Forms**: Guided, combo, and crypto market creation
- **Wallet Integration**: Seamless wallet connection and management
- **Transaction Handling**: Robust transaction management with retry logic

## 🔧 Smart Contracts

### Core Contracts
- **BitredictPoolCore**: Main prediction pool logic
- **ReputationSystem**: User reputation and permissions
- **BoostSystem**: Pool promotion mechanics
- **Oddyssey**: Daily prediction game contract

### Contract Features
- **Gas Optimization**: Efficient storage and computation
- **Security**: Comprehensive validation and access controls
- **Scalability**: Modular architecture for easy upgrades
- **Analytics**: Built-in analytics and statistics tracking

## 🌐 Deployment

### Frontend (Vercel)
- **Production URL**: [bitredict.vercel.app](https://bitredict.vercel.app)
- **Automatic Deployments**: Connected to main branch
- **Environment**: Production-optimized build

### Backend (Fly.io)
- **API Endpoint**: [bitredict-backend.fly.dev](https://bitredict-backend.fly.dev)
- **Database**: Neon PostgreSQL
- **Real-time Data**: Football fixtures and market data

## 🔐 Security & Best Practices

- **Input Validation**: Comprehensive form validation
- **Error Handling**: Graceful error handling with user feedback
- **Transaction Safety**: Retry mechanisms and gas optimization
- **Wallet Security**: Secure wallet integration with proper error handling
- **Data Integrity**: Real-time data validation and caching

## 📊 Analytics & Monitoring

- **User Analytics**: Comprehensive user behavior tracking
- **Pool Performance**: Real-time pool analytics
- **Transaction Monitoring**: Transaction success/failure tracking
- **Error Logging**: Detailed error logging for debugging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.


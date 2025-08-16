# BITR Faucet & Airdrop Integration

This document outlines the implementation of the BITR faucet and airdrop system integrated with the Bitredict frontend.

## 🚀 Features Implemented

### Frontend Components
- **Comprehensive Faucet Page** (`/faucet`) with modern UI following Bitredict design system
- **Real-time Eligibility Checking** - Displays user's airdrop requirements status
- **Progress Tracking** - Visual progress bars and requirement checklist
- **Statistics Dashboard** - Global airdrop statistics and funnel analysis
- **Responsive Design** - Works on desktop and mobile devices
- **Wallet Integration** - Connected with Wagmi and Reown AppKit
- **Somnia Network Support** - Network switching and validation

### API Integration
- **Next.js API Routes** - Proxy endpoints to backend server
- **Type Safety** - Full TypeScript integration with proper interfaces
- **Error Handling** - Comprehensive error handling and user feedback
- **Service Layer** - Clean service abstraction for API calls

### Design System Integration
- **Glass Cards** - Following Bitredict's glassmorphism design
- **Somnia Colors** - Using brand colors and gradients
- **Animations** - Smooth Framer Motion animations
- **Button System** - Integrated with existing button component
- **Navigation** - Added to main navigation menu

## 📁 File Structure

### Types
- `types/airdrop.ts` - TypeScript interfaces for airdrop data

### Services
- `services/airdropService.ts` - API service functions and utilities

### Pages
- `app/faucet/page.tsx` - Main faucet page component

### API Routes
- `app/api/airdrop/eligibility/[address]/route.ts` - User eligibility endpoint
- `app/api/airdrop/statistics/route.ts` - Global statistics endpoint
- `app/api/airdrop/faucet/claim/route.ts` - Faucet claiming endpoint
- `app/api/airdrop/leaderboard/route.ts` - Leaderboard endpoint

### Components
- Updated `components/header/index.tsx` to include faucet navigation

## ⚙️ Configuration

### Environment Variables
Create a `.env.local` file in the frontend root:

```env
# Backend API Configuration
BACKEND_URL=http://localhost:3000

# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:8080

# Wallet Connect Configuration (if using custom project)
# NEXT_PUBLIC_PROJECT_ID=your_project_id_here
```

### Backend Integration
The frontend expects the backend server (from `/home/vilas/bitredict/backend/`) to be running on `http://localhost:3000` with the following endpoints:

- `GET /airdrop/eligibility/:address` - Check user eligibility
- `GET /airdrop/statistics` - Get global statistics
- `POST /airdrop/faucet/claim` - Claim faucet tokens
- `GET /airdrop/leaderboard` - Get user leaderboard

## 🎨 Design Features

### Glassmorphism Cards
- Semi-transparent backgrounds with backdrop blur
- Gradient borders and hover effects
- Consistent with Bitredict design language

### Color Scheme
- **Primary**: Somnia Cyan (#22C7FF)
- **Secondary**: Magenta (#FF0080) 
- **Accent**: Violet (#8C00FF)
- **Success/Error states** with appropriate colors

### Animations
- Smooth page transitions with Framer Motion
- Floating background elements
- Progress bar animations
- Hover effects and micro-interactions

### Responsive Layout
- Grid-based layout that adapts to screen size
- Mobile-optimized navigation and cards
- Touch-friendly button sizes

## 🔧 Usage

### For Users
1. **Connect Wallet** - Connect Ethereum wallet via Reown AppKit
2. **Check Network** - Ensure connected to Somnia testnet
3. **Claim Faucet** - Click "Claim 20,000 BITR" button (once per wallet)
4. **Track Progress** - View airdrop eligibility requirements and progress
5. **Complete Tasks** - Perform required platform activities

### For Developers
1. **Start Backend** - Ensure backend server is running with database
2. **Configure Environment** - Set `BACKEND_URL` in `.env.local`
3. **Run Frontend** - `npm run dev` to start development server
4. **Test Integration** - Connect wallet and test faucet functionality

## 📊 Data Flow

1. **User connects wallet** → Frontend checks if Somnia network
2. **Frontend calls** `/api/airdrop/eligibility/[address]` → Proxies to backend
3. **Backend queries database** → Returns eligibility data with requirements
4. **Frontend displays** → Real-time status, progress, and next steps
5. **User clicks claim** → Frontend calls faucet endpoint
6. **Backend processes** → Updates database and calls smart contract
7. **Transaction complete** → Frontend refreshes data and shows success

## 🚦 Status Indicators

### Eligibility States
- **🟢 Eligible** - All requirements met, ready for mainnet airdrop
- **🟡 Pending** - Faucet claimed, working on requirements
- **🔴 Not Eligible** - Missing requirements or flagged account
- **⚪ No Faucet** - Haven't claimed testnet tokens yet

### Requirement Checklist
- ✅ **Faucet Claim** - Must claim 20,000 testnet BITR
- ✅ **STT Activity** - Had activity before faucet claim
- ✅ **BITR Actions** - 20+ pool/bet/staking actions
- ✅ **Staking** - Must stake some BITR tokens
- ✅ **Oddyssey** - Submit 3+ prediction slips

### Sybil Detection
- 🚨 **Flagged accounts** - Suspicious transfer patterns
- 🚨 **Transfer-only** - No organic platform activity
- 🚨 **Consolidation** - Token accumulation patterns

## 🔗 Integration Points

### Smart Contracts
- BITR token contract for balance checking
- Faucet contract for token distribution
- Staking contract for staking verification

### Platform Activities
- **Pool creation** - Tracked via blockchain events
- **Betting activity** - On-chain bet transactions
- **Staking events** - Stake/unstake transactions
- **Oddyssey participation** - Game slip submissions

### External Services
- **Somnia RPC** - Blockchain data fetching
- **Block explorer** - Transaction verification
- **Wallet providers** - MetaMask, WalletConnect, etc.

## 🛠️ Future Enhancements

### Smart Contract Integration
- Direct smart contract calls for faucet claiming
- Real-time balance updates via WebSocket
- Gas estimation and transaction status

### Advanced Features
- **Referral system** - Bonus tokens for referrals
- **Social verification** - Twitter/Discord integration
- **Leaderboards** - Top participants display
- **Achievement badges** - Visual progress indicators

### Analytics
- **User journey tracking** - Conversion funnel analysis
- **Activity heatmaps** - Popular platform features
- **Geographic distribution** - User location insights
- **Time-based analysis** - Peak usage patterns

## 💡 Technical Notes

### Performance
- API responses cached for 30 seconds
- Debounced wallet connection checking
- Lazy loading for statistics data
- Optimized re-renders with React.memo

### Security
- Address validation on both frontend and backend
- Rate limiting on API endpoints
- Input sanitization and validation
- CORS configuration for API security

### Accessibility
- Screen reader friendly components
- Keyboard navigation support
- High contrast mode compatibility
- Focus management for modals

This implementation provides a complete, production-ready faucet system that seamlessly integrates with the existing Bitredict platform while maintaining design consistency and user experience standards. 
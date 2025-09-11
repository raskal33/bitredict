# Frontend API Usage Analysis

## Overview
This document analyzes all API endpoint usage in the frontend (`predict-linux`) and compares it with the available backend endpoints.

## Frontend API Configuration

### Base URL
- **Production**: `https://bitredict-backend.fly.dev`
- **Development**: `http://localhost:3000`

### API Endpoints Configuration
```typescript
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://bitredict-backend.fly.dev',
  endpoints: {
    airdrop: '/api/airdrop',
    faucet: '/api/faucet', 
    pools: '/api/guided-markets/pools',
    analytics: '/api/analytics',
    social: '/api/social',
    health: '/health',
    crypto: '/api/crypto',
    fixtures: '/api/fixtures',
    oddyssey: '/api/oddyssey',
    staking: '/api/staking',
    users: '/api/users',
    reputation: '/api/reputation',
    guidedMarkets: '/api/guided-markets',
    optimisticOracle: '/api/optimistic-oracle'
  }
}
```

---

## 🎯 **Frontend API Routes (Next.js)**

### Analytics API Routes
- `GET /api/analytics/user-stats` - User statistics
- `GET /api/analytics/market-type-stats` - Market type statistics
- `GET /api/analytics/category-stats` - Category statistics
- `GET /api/analytics/league-stats` - League statistics
- `GET /api/analytics/platform-stats` - Platform statistics

### Airdrop API Routes
- `GET /api/airdrop/leaderboard` - Airdrop leaderboard
- `GET /api/airdrop/statistics` - Airdrop statistics
- `GET /api/airdrop/eligibility/[address]` - Check eligibility
- `POST /api/airdrop/faucet/claim` - Claim faucet

### Community API Routes
- `GET /api/community` - Get community threads
- `POST /api/community` - Create thread
- `PUT /api/community` - Update thread/comment
- `DELETE /api/community` - Delete thread/comment

### Fixtures API Routes
- `GET /api/fixtures/upcoming` - Get upcoming fixtures
- `GET /api/fixtures/leagues/popular` - Get popular leagues

### Guided Markets API Routes
- `GET /api/guided-markets/pools/[id]` - Get specific pool
- `GET /api/guided-markets/pools/[id]/progress` - Get pool progress

### Oddyssey API Routes
- `GET /api/oddyssey/contract-validation` - Validate contract
- `GET /api/oddyssey/preferences` - Get preferences
- `POST /api/oddyssey/preferences` - Update preferences
- `GET /api/oddyssey/stats` - Get Oddyssey stats
- `GET /api/oddyssey/slips` - Get user slips
- `GET /api/oddyssey/matches` - Get matches
- `POST /api/oddyssey/place-slip` - Place slip

### Pools API Routes
- `GET /api/pools` - Get pools
- `GET /api/pools/featured` - Get featured pools
- `GET /api/pools/[id]/progress` - Get pool progress
- `GET /api/pools/[id]/analytics` - Get pool analytics
- `GET /api/pools/[id]/user-bet` - Get user bet

### Other API Routes
- `POST /api/rpc-proxy` - RPC proxy
- `GET /api/test-oddyssey` - Test Oddyssey

---

## 🔍 **Frontend Service Usage**

### Services Using Backend APIs

#### 1. **AirdropService** (`services/airdropService.ts`)
**Used Endpoints:**
- ✅ `GET /api/airdrop/eligibility/:address`
- ✅ `GET /api/airdrop/statistics`
- ✅ `GET /api/faucet/eligibility/:address`
- ✅ `GET /api/faucet/statistics`
- ✅ `GET /api/faucet/activity/:address`
- ✅ `POST /api/faucet/claim`
- ✅ `GET /api/airdrop/leaderboard`

#### 2. **CommunityService** (`services/communityService.ts`)
**Used Endpoints:**
- ✅ `GET /api/social/discussions`
- ✅ `POST /api/social/discussions`
- ✅ `GET /api/social/discussions/:id/replies`
- ✅ `POST /api/social/reactions`
- ✅ `GET /api/social/community-stats`
- ✅ `GET /api/social/pools/:id/comments`
- ✅ `POST /api/social/pools/:id/comments`
- ✅ `GET /api/social/users/:address/social-stats`
- ✅ `GET /api/social/discussions/trending`
- ✅ `GET /api/social/leaderboard`
- ✅ `GET /api/social/discussions/search`
- ✅ `GET /api/social/users/:address/can-post`

#### 3. **UserService** (`services/userService.ts`)
**Used Endpoints:**
- ✅ `GET /api/users/:address`
- ✅ `GET /api/users/:address/badges`
- ✅ `GET /api/users/:address/activity`
- ✅ `GET /api/users/:address/category-performance`
- ✅ `GET /api/social/users/:address/social-stats`
- ✅ `GET /api/staking/user/:address`
- ✅ `GET /api/reputation/user/:address`
- ✅ `GET /api/analytics/leaderboard/users`
- ✅ `GET /api/users/:address/portfolio`

#### 4. **FaucetService** (`services/faucetService.ts`)
**Used Endpoints:**
- ✅ `GET /api/faucet/statistics`
- ✅ `GET /api/faucet/eligibility/:address`

#### 5. **PrizeClaimService** (`services/prizeClaimService.ts`)
**Used Endpoints:**
- ✅ `GET /api/pools/claimable/:userAddress`

#### 6. **AnalyticsService** (`services/analyticsService.ts`)
**Used Endpoints:**
- ✅ `GET /api/analytics/*` (base endpoint configured)

#### 7. **MarketsService** (`services/marketsService.ts`)
**Used Endpoints:**
- ✅ `GET /api/guided-markets/pools` (base endpoint configured)

#### 8. **StakingService** (`services/stakingService.ts`)
**Used Endpoints:**
- ✅ `GET /api/staking/*` (base endpoint configured)

---

## 🎯 **Direct Frontend API Calls**

### Components Making Direct API Calls

#### 1. **EnhancedPoolCard** (`components/EnhancedPoolCard.tsx`)
**Used Endpoints:**
- ✅ `GET /api/guided-markets/pools/:id/progress`

#### 2. **Bet Page** (`app/bet/[id]/page.tsx`)
**Used Endpoints:**
- ✅ `GET /api/guided-markets/pools/:id`
- ✅ `GET /api/guided-markets/pools/:id/progress`
- ✅ `GET /api/pools/:id/user-bet`
- ✅ `POST /api/pools/:id/comments`
- ✅ `POST /api/pools/:id/comments/:commentId/like`

#### 3. **Oddyssey Page** (`app/oddyssey/page.tsx`)
**Used Endpoints:**
- ✅ `POST /api/oddyssey/batch-fixtures`

#### 4. **Admin Page** (`app/admin/page.tsx`)
**Used Endpoints:**
- ❌ `GET /api/monitoring/status` - **MISSING**
- ❌ `GET /api/monitoring/alerts` - **MISSING**
- ❌ `GET /api/monitoring/metrics` - **MISSING**
- ❌ `GET /api/monitoring/logs` - **MISSING**
- ❌ `GET /api/admin/sync-status` - **MISSING**
- ❌ `GET /api/admin/check-tables` - **MISSING**

#### 5. **Cycle Monitoring** (`app/admin/cycle-monitoring.tsx`)
**Used Endpoints:**
- ✅ `GET /api/cycle-monitoring/status`
- ✅ `GET /api/cycle-monitoring/cycles`
- ✅ `GET /api/cycle-monitoring/stats`

#### 6. **MarketsList** (`components/MarketsList.tsx`)
**Used Endpoints:**
- ❌ `GET /api/pools/trending` - **MISSING**

#### 7. **CryptoMarketSelector** (`components/CryptoMarketSelector.tsx`)
**Used Endpoints:**
- ✅ `GET /api/crypto/targets/:coinId`

#### 8. **Main Page** (`app/page.tsx`)
**Used Endpoints:**
- ✅ `GET /api/analytics/platform-stats`
- ✅ `GET /api/pools/featured`

#### 9. **useOddyssey Hook** (`hooks/useOddyssey.ts`)
**Used Endpoints:**
- ✅ `POST /api/oddyssey/live-matches`

---

## 🚨 **Issues Found**

### 1. **Missing Backend Endpoints**
The frontend is trying to use these endpoints that don't exist in the backend:

#### Admin/Monitoring Endpoints
- ❌ `GET /api/monitoring/status`
- ❌ `GET /api/monitoring/alerts`
- ❌ `GET /api/monitoring/metrics`
- ❌ `GET /api/monitoring/logs`
- ❌ `GET /api/admin/sync-status`
- ❌ `GET /api/admin/check-tables`

#### Social/Pools Endpoints
- ❌ `GET /api/pools/trending`

### 2. **Endpoint Naming Inconsistencies**

#### Frontend vs Backend Mismatches
- **Frontend**: `GET /api/pools/trending`
- **Backend**: `GET /api/pools-social/trending`

- **Frontend**: `GET /api/monitoring/*`
- **Backend**: `GET /api/monitoring-dashboard/*`

### 3. **Missing API Routes in Frontend**
The frontend has some API routes that proxy to backend, but some backend endpoints are missing frontend proxies:

#### Missing Frontend Proxies
- `GET /api/oddyssey/current-cycle`
- `GET /api/oddyssey/leaderboard`
- `GET /api/oddyssey/current-prize-pool`
- `GET /api/oddyssey/daily-stats`
- `GET /api/oddyssey/available-dates`
- `GET /api/oddyssey/results/:date`

---

## 🔧 **Recommended Fixes**

### 1. **Add Missing Backend Endpoints**
Create these missing endpoints in the backend:

```javascript
// In api/monitoring.js or create new file
router.get('/status', async (req, res) => { /* ... */ });
router.get('/alerts', async (req, res) => { /* ... */ });
router.get('/metrics', async (req, res) => { /* ... */ });
router.get('/logs', async (req, res) => { /* ... */ });

// In api/admin.js
router.get('/sync-status', async (req, res) => { /* ... */ });
router.get('/check-tables', async (req, res) => { /* ... */ });
```

### 2. **Fix Endpoint Naming**
Update frontend to use correct endpoint names:

```typescript
// Change from:
const response = await fetch('/api/pools/trending');

// To:
const response = await fetch('/api/pools-social/trending');
```

### 3. **Add Missing Frontend API Routes**
Create these missing Next.js API routes:

```typescript
// app/api/oddyssey/current-cycle/route.ts
export async function GET() {
  const response = await fetch(`${backendUrl}/api/oddyssey/current-cycle`);
  return response.json();
}
```

### 4. **Update API Configuration**
Update the frontend API configuration to include missing endpoints:

```typescript
export const API_CONFIG = {
  endpoints: {
    // ... existing endpoints
    monitoring: '/api/monitoring-dashboard',
    poolsSocial: '/api/pools-social',
    // ... other missing endpoints
  }
}
```

---

## 📊 **Summary**

### ✅ **Working Endpoints**: 45+
### ❌ **Missing Endpoints**: 6
### ⚠️ **Naming Issues**: 2

### **Priority Fixes Needed:**
1. **High Priority**: Add missing admin/monitoring endpoints
2. **Medium Priority**: Fix endpoint naming inconsistencies
3. **Low Priority**: Add missing frontend API proxies

The frontend is mostly well-integrated with the backend, but there are some critical missing endpoints for admin functionality and a few naming inconsistencies that need to be resolved.

# BitRedict Platform Integration Guide

## 🚀 Overview

BitRedict is a decentralized prediction market platform built on **Somnia Network** with comprehensive off-chain analytics, reputation systems, and real-time tracking. This guide covers everything needed for seamless frontend-backend integration.

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Smart Contract Events](#smart-contract-events)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Frontend Integration](#frontend-integration)
6. [Reputation System](#reputation-system)
7. [Achievement System](#achievement-system)
8. [Real-time Updates](#real-time-updates)
9. [Deployment Configuration](#deployment-configuration)

---

## 🏗️ Architecture Overview

```
Frontend React App
        ↓
    API Server (Express)
        ↓
PostgreSQL Database (5 schemas)
        ↑
Event Indexer ← Smart Contracts (Somnia)
        ↑
Analytics Aggregator (Cron Jobs)
```

### Core Components

- **Smart Contracts**: Gas-optimized contracts on Somnia Network
- **Event Indexer**: Real-time blockchain event processing
- **API Server**: RESTful API with rate limiting and CORS
- **Database**: PostgreSQL with 5 schemas (core, oracle, prediction, oddyssey, analytics)
- **Analytics Aggregator**: Automated data processing and statistics
- **Reputation Service**: Off-chain reputation calculation

---

## 📡 Smart Contract Events

### Core Events (BitredictPool.sol)

```solidity
// Pool Management
event PoolCreated(uint256 indexed poolId, address indexed creator, uint256 eventStartTime, uint256 eventEndTime, uint8 oracleType, bytes32 indexed marketId);
event PoolSettled(uint256 indexed poolId, bytes32 result, bool creatorSideWon, uint256 timestamp);
event PoolRefunded(uint256 indexed poolId, string reason);

// Betting & Liquidity
event BetPlaced(uint256 indexed poolId, address indexed bettor, uint256 amount, bool isForOutcome);
event LiquidityAdded(uint256 indexed poolId, address indexed provider, uint256 amount);
event RewardClaimed(uint256 indexed poolId, address indexed user, uint256 amount);

// Analytics & Tracking
event UserStatsUpdate(address indexed user, uint256 totalVolume, int256 profitLoss, uint256 totalBets, uint256 wonBets, uint256 currentStreak, bool streakIsWin, string favoriteCategory);
event CategoryActivity(string indexed category, uint256 poolCount, uint256 totalVolume, uint256 avgPoolSize, uint256 participantCount);
event PoolActivity(uint256 indexed poolId, address indexed creator, string category, uint256 currentVolume, uint256 participantCount, uint256 fillPercentage, uint256 timeToFill);
event AchievementTriggered(address indexed user, string achievementType, uint256 value, string category, uint256 timestamp);

// Reputation
event ReputationActionOccurred(address indexed user, uint8 action, uint256 value, bytes32 indexed poolId, uint256 timestamp);
```

### Oracle Types

```solidity
enum OracleType {
    GUIDED,    // External APIs (SportMonks, CoinGecko)
    OPEN       // Community-driven (OptimisticOracle)
}
```

### Reputation Actions

```solidity
enum ReputationAction {
    POOL_CREATED,                    // +0 points (neutral)
    POOL_FILLED_ABOVE_60,           // +8 points
    POOL_SPAMMED,                   // -12 points
    BET_WON_HIGH_VALUE,             // +5 points (10+ STT / 2000+ BITR)
    OUTCOME_PROPOSED_CORRECTLY,     // +10 points
    OUTCOME_PROPOSED_INCORRECTLY,   // -15 points
    CHALLENGE_SUCCESSFUL,           // +10 points
    CHALLENGE_FAILED                // -8 points
}
```

---

## 🗄️ Database Schema

### Core Schema (`core`)

```sql
-- Users with comprehensive stats
CREATE TABLE core.users (
    address TEXT PRIMARY KEY,
    reputation INTEGER DEFAULT 40 CHECK (reputation >= 0 AND reputation <= 150),
    total_volume NUMERIC DEFAULT 0,
    profit_loss NUMERIC DEFAULT 0,
    total_bets INTEGER DEFAULT 0,
    won_bets INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    max_win_streak INTEGER DEFAULT 0,
    max_loss_streak INTEGER DEFAULT 0,
    streak_is_win BOOLEAN DEFAULT TRUE,
    biggest_win NUMERIC DEFAULT 0,
    biggest_loss NUMERIC DEFAULT 0,
    favorite_category TEXT,
    total_pools_created INTEGER DEFAULT 0,
    pools_won INTEGER DEFAULT 0,
    avg_bet_size NUMERIC DEFAULT 0,
    risk_score INTEGER DEFAULT 500, -- 1-1000 scale
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_active TIMESTAMPTZ DEFAULT NOW()
);

-- Achievement system
CREATE TABLE core.achievements (
    id BIGSERIAL PRIMARY KEY,
    user_address TEXT NOT NULL REFERENCES core.users(address),
    achievement_type TEXT NOT NULL,
    achievement_value NUMERIC NOT NULL,
    achievement_category TEXT,
    unlocked_at TIMESTAMPTZ NOT NULL,
    block_number BIGINT NOT NULL,
    transaction_hash TEXT NOT NULL
);
```

### Analytics Schema (`analytics`)

```sql
-- Daily statistics
CREATE TABLE analytics.daily_stats (
    stat_date DATE PRIMARY KEY,
    total_volume NUMERIC DEFAULT 0,
    total_pools INTEGER DEFAULT 0,
    total_bets INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    avg_pool_size NUMERIC DEFAULT 0,
    avg_bet_size NUMERIC DEFAULT 0,
    platform_fees NUMERIC DEFAULT 0
);

-- Hourly user activity
CREATE TABLE analytics.hourly_activity (
    activity_hour TIMESTAMPTZ NOT NULL,
    active_users INTEGER DEFAULT 0,
    total_volume NUMERIC DEFAULT 0,
    total_bets INTEGER DEFAULT 0,
    PRIMARY KEY (activity_hour)
);
```

---

## 🌐 API Endpoints

### Base URL
```
Production: https://api.bitredict.io
Development: http://localhost:3001
```

### Global Platform Analytics

#### GET `/api/analytics/global`
Get platform-wide statistics.

**Query Parameters:**
- `timeframe`: `24h` | `7d` | `30d` | `all` (default: `7d`)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalVolume": 892450,
    "totalPools": 1247,
    "totalBets": 15672,
    "activePools": 234
  },
  "timeframe": "7d"
}
```

#### GET `/api/analytics/volume-history`
Get volume history for charts.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-01",
      "volume": 12450,
      "pools": 23,
      "users": 156
    }
  ]
}
```

### Leaderboards

#### GET `/api/analytics/leaderboard/creators`
Get top creators leaderboard.

**Query Parameters:**
- `limit`: number (default: 10, max: 50)
- `sortBy`: `total_volume` | `win_rate` | `reputation` | `pools_created`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "address": "0x1234...5678",
      "stats": {
        "totalPools": 45,
        "wonPools": 32,
        "totalVolume": 12450,
        "winRate": 72.3,
        "accuracy": 97.8
      },
      "reputation": 4.8
    }
  ]
}
```

#### GET `/api/analytics/leaderboard/bettors`
Get top bettors leaderboard.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "address": "0x8765...4321",
      "stats": {
        "totalBets": 234,
        "wonBets": 150,
        "winRate": 64.2,
        "profitLoss": 3450,
        "currentStreak": 5,
        "maxWinStreak": 12
      }
    }
  ]
}
```

### User-Specific APIs

#### GET `/api/analytics/user/:address/achievements`
Get user achievements.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "type": "HIGH_ROLLER",
      "value": 150.5,
      "category": "Sports",
      "unlockedAt": "2024-01-15T10:30:00Z",
      "txHash": "0xabc123..."
    }
  ]
}
```

#### GET `/api/reputation/:address`
Get user reputation details.

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "0x1234...5678",
    "reputation": 75,
    "level": "Elementary",
    "accessCapabilities": [
      "bets",
      "guided_markets"
    ]
  }
}
```

---

## 🎨 Frontend Integration

### React Hook Example

```typescript
// useContractStats.ts
import { useState, useEffect } from 'react';

export function useContractStats(timeframe: '24h' | '7d' | '30d' | 'all' = '7d') {
  const [stats, setStats] = useState({
    totalPools: 0,
    totalVolume: 0,
    totalBets: 0,
    activePools: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const response = await fetch(`/api/analytics/global?timeframe=${timeframe}`);
      const data = await response.json();
      setStats(data.data);
      setIsLoading(false);
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [timeframe]);

  return { stats, isLoading };
}
```

---

## 🏆 Reputation System

### Reputation Levels

| Points | Level | Access |
|--------|-------|--------|
| 0-39   | Limited | Bets only |
| 40-99  | Elementary | Bets + Guided markets |
| 100-149 | Trusted | + Open market proposals |
| 150+   | Verified | + Open market resolution |

### Point System

```javascript
const REPUTATION_POINTS = {
  POOL_FILLED_ABOVE_60: +8,
  POOL_SPAMMED: -12,
  BET_WON_HIGH_VALUE: +5,  // 10+ STT or 2000+ BITR
  OUTCOME_PROPOSED_CORRECTLY: +10,
  OUTCOME_PROPOSED_INCORRECTLY: -15,
  CHALLENGE_SUCCESSFUL: +10,
  CHALLENGE_FAILED: -8
};
```

---

## 🎮 Achievement System

### Achievement Types

```javascript
const ACHIEVEMENTS = {
  HIGH_ROLLER: "Placed a 100+ STT bet",
  RISK_TAKER: "Bet on 5.00x+ odds", 
  BIG_WIN: "Won 2x+ of your stake",
  WHALE_WIN: "Won 1000+ STT",
  STREAK_5: "Won 5 bets in a row",
  VOLUME_1K: "1K+ STT total volume",
  MARKET_MAKER: "Created first prediction market"
};
```

---

## 🚀 Deployment Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/bitredict

# Blockchain
RPC_URL=https://rpc.somnia.network
BITREDICT_POOL_ADDRESS=0x...
GUIDED_ORACLE_ADDRESS=0x...

# API
PORT=3001
NODE_ENV=production
```

### Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Setup database
psql -f backend/db/schema.sql

# 3. Start services
npm run start      # API Server
npm run indexer    # Event Indexer  
npm run aggregator # Analytics
```

---

## 📚 Testing APIs

```bash
# Test global stats
curl "http://localhost:3001/api/analytics/global?timeframe=7d"

# Test leaderboards
curl "http://localhost:3001/api/analytics/leaderboard/creators?limit=5"

# Test user reputation
curl "http://localhost:3001/api/reputation/0x1234..."
```

---

🚀 **Ready for Production Integration!** 
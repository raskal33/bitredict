# BitRedict Platform Deployment Guide

## 🚀 Overview

This guide covers the complete deployment process for the BitRedict prediction market platform on Somnia Network, including smart contracts, backend services, and infrastructure setup.

## 📋 Prerequisites

- Node.js 18+ and npm
- Hardhat development environment
- PostgreSQL database (Neon.tech recommended)
- Somnia Network RPC access
- Docker (for containerized deployment)

---

## 📦 Smart Contract Deployment

### Step 1: Deploy Core Contracts

```bash
# 1. Deploy mock tokens and guided oracle (for testing)
npx hardhat ignition deploy ignition/modules/BitredictPool.js --network somnia

# This deploys:
# - MockERC20 (STT Token)
# - MockERC20 (BITR Token) 
# - MockGuidedOracle
# - BitredictPool (with placeholder OptimisticOracle address)
```

### Step 2: Deploy OptimisticOracle

```bash
# 2. Deploy OptimisticOracle with BitredictPool address
npx hardhat ignition deploy ignition/modules/OptimisticOracle.js --network somnia \
  --parameters '{"sttToken": "0x...STT_ADDRESS", "bitredictPoolAddress": "0x...POOL_ADDRESS"}'
```

### Step 3: Update BitredictPool Configuration

```bash
# 3. Update BitredictPool to use the real OptimisticOracle address
# This requires calling setOptimisticOracle() if such function exists
# Or redeploy with correct address
```

### Production Deployment Order

```javascript
// deployment-script.js
async function deployProduction() {
  // 1. Deploy tokens (or use existing)
  const sttToken = await deploySTTToken();
  const bitrToken = await deployBITRToken();
  
  // 2. Deploy GuidedOracle
  const guidedOracle = await deployGuidedOracle();
  
  // 3. Deploy BitredictPool with placeholder OptimisticOracle
  const bitredictPool = await deployBitredictPool(
    sttToken.address,
    bitrToken.address,
    feeCollector,
    guidedOracle.address,
    "0x0000000000000000000000000000000000000000" // placeholder
  );
  
  // 4. Deploy OptimisticOracle with BitredictPool address
  const optimisticOracle = await deployOptimisticOracle(
    sttToken.address,
    bitredictPool.address
  );
  
  // 5. Update BitredictPool with real OptimisticOracle address
  await bitredictPool.updateOptimisticOracle(optimisticOracle.address);
  
  console.log("Deployment complete!");
  console.log("BitredictPool:", bitredictPool.address);
  console.log("OptimisticOracle:", optimisticOracle.address);
}
```

---

## 🗄️ Database Setup

### Step 1: Create Database

```bash
# Using Neon.tech (recommended) or local PostgreSQL
# Connection string format:
# postgresql://user:password@host:5432/database?sslmode=require
```

### Step 2: Initialize Schema

```bash
# Run the schema creation script
psql $DATABASE_URL -f backend/db/schema.sql

# Or using the setup script
cd backend/db && node setup.js
```

### Step 3: Verify Schema

```sql
-- Check all schemas are created
\dn

-- Check core tables
\dt core.*

-- Check analytics tables  
\dt analytics.*
```

---

## ⚙️ Backend Services Configuration

### Environment Setup

```bash
# Copy and configure environment variables
cp .env.example .env

# Edit .env with your configuration:
# - DATABASE_URL (Neon.tech connection string)
# - RPC_URL (Somnia Network endpoint)
# - Contract addresses
# - API keys
```

### Service Deployment

```bash
# Install dependencies
npm install

# Start all services
npm run start      # API Server (port 3001)
npm run indexer    # Event Indexer
npm run aggregator # Analytics Aggregator
```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or individual services
docker build -t bitredict-api .
docker run -p 3001:3001 --env-file .env bitredict-api
```

---

## 🚀 Fly.io Production Deployment

### Step 1: Fly.io Setup

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login and create app
flyctl auth login
flyctl launch --name bitredict-api
```

### Step 2: Configure Secrets

```bash
# Set environment variables
flyctl secrets set DATABASE_URL="postgresql://..."
flyctl secrets set RPC_URL="https://rpc.somnia.network"
flyctl secrets set BITREDICT_POOL_ADDRESS="0x..."
flyctl secrets set GUIDED_ORACLE_ADDRESS="0x..."
flyctl secrets set OPTIMISTIC_ORACLE_ADDRESS="0x..."
```

### Step 3: Deploy

```bash
# Deploy the application
flyctl deploy

# Check status
flyctl status
flyctl logs
```

---

## 📊 Indexer Setup and Configuration

### Event Indexer Configuration

```javascript
// backend/indexer.js configuration
const CONTRACTS = {
  BITREDICT_POOL: process.env.BITREDICT_POOL_ADDRESS,
  GUIDED_ORACLE: process.env.GUIDED_ORACLE_ADDRESS,
  OPTIMISTIC_ORACLE: process.env.OPTIMISTIC_ORACLE_ADDRESS
};

const INDEXED_EVENTS = [
  'PoolCreated',
  'BetPlaced',
  'PoolSettled',
  'RewardClaimed',
  'AchievementTriggered',
  'ReputationActionOccurred',
  'OutcomeProposed',
  'OutcomeDisputed',
  'MarketResolved'
];
```

### Starting Block Configuration

```bash
# Set the starting block for indexing (avoid processing old events)
export INDEXER_START_BLOCK=1234567

# Or set in .env
INDEXER_START_BLOCK=1234567
```

---

## 🔧 Oracle Bot Configuration

### Bot Setup

```bash
# Configure oracle bot for guided markets
cd bot
cp config.example.js config.js

# Edit config.js with:
# - SportMonks API key
# - Contract addresses
# - Private key for oracle bot wallet
```

### Oracle Bot Services

```javascript
// bot/config.js
module.exports = {
  blockchain: {
    rpcUrl: process.env.RPC_URL,
    privateKey: process.env.ORACLE_PRIVATE_KEY,
    contracts: {
      guidedOracle: process.env.GUIDED_ORACLE_ADDRESS,
      bitredictPool: process.env.BITREDICT_POOL_ADDRESS
    }
  },
  sportmonks: {
    apiKey: process.env.SPORTMONKS_API_KEY,
    baseUrl: 'https://api.sportmonks.com/v3'
  },
  schedule: {
    fetchInterval: '0 */10 * * * *', // Every 10 minutes
    updateInterval: '0 0 * * * *'    // Every hour
  }
};
```

---

## 🎯 Reputation System Bootstrap

### Initial Reputation Setup

```javascript
// scripts/bootstrap-reputation.js
async function bootstrapReputation() {
  const optimisticOracle = await ethers.getContractAt(
    "OptimisticOracle", 
    process.env.OPTIMISTIC_ORACLE_ADDRESS
  );
  
  // Set initial reputation for trusted users
  const trustedUsers = [
    { address: "0x...", reputation: 120 },
    { address: "0x...", reputation: 110 },
    // Add more trusted users
  ];
  
  const addresses = trustedUsers.map(u => u.address);
  const reputations = trustedUsers.map(u => u.reputation);
  
  await optimisticOracle.batchSetReputations(addresses, reputations);
  console.log("Initial reputation scores set!");
}
```

---

## 📈 Analytics and Monitoring

### Health Checks

```bash
# API health check
curl http://localhost:3001/health

# Database connection test
curl http://localhost:3001/api/analytics/global

# Test leaderboards
curl http://localhost:3001/api/analytics/leaderboard/creators
```

### Monitoring Setup

```javascript
// monitoring/alerts.js
const alerts = {
  // Database connection issues
  dbHealth: {
    endpoint: '/health/db',
    threshold: 5000, // 5 seconds
    action: 'restart-service'
  },
  
  // Indexer lag
  indexerLag: {
    endpoint: '/api/indexer/lag',
    threshold: 100, // 100 blocks behind
    action: 'notify-admin'
  },
  
  // API response time
  apiResponse: {
    endpoint: '/api/analytics/global',
    threshold: 2000, // 2 seconds
    action: 'scale-up'
  }
};
```

---

## 🔐 Security Configuration

### API Security

```javascript
// backend/api/server.js security configuration
const securityConfig = {
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // requests per window
  },
  cors: {
    origin: [
      'https://bitredict.io',
      'https://app.bitredict.io',
      'https://bitredict.vercel.app/'
    ],
    credentials: true
  },
  helmet: {
    contentSecurityPolicy: true,
    hsts: true
  }
};
```

### Contract Security

```solidity
// Security considerations for contracts:
// 1. All user inputs validated
// 2. Reentrancy protection on claim functions
// 3. Access controls on admin functions
// 4. Emergency pause functionality
// 5. Upgrade proxy patterns for future updates
```

---

## 🧪 Testing and Verification

### Contract Testing

```bash
# Run contract tests
npx hardhat test

# Run specific test suites
npx hardhat test test/BitredictPool.test.js
npx hardhat test test/OptimisticOracle.test.js
```

### API Testing

```bash
# Test API endpoints
npm run test:api

# Load testing
npm run test:load

# Integration testing
npm run test:integration
```

### End-to-End Testing

```bash
# Full platform test
npm run test:e2e

# Includes:
# - Contract deployment
# - Event indexing
# - API responses
# - Database consistency
```

---

## 📚 Maintenance and Updates

### Database Maintenance

```sql
-- Regular maintenance queries
VACUUM ANALYZE; -- Weekly
REINDEX DATABASE bitredict; -- Monthly

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables 
WHERE schemaname IN ('core', 'analytics', 'prediction', 'oracle', 'oddyssey')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Log Rotation

```bash
# Setup log rotation for services
# /etc/logrotate.d/bitredict
/var/log/bitredict/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    postrotate
        systemctl reload bitredict-api
    endscript
}
```

### Backup Strategy

```bash
# Daily database backup
pg_dump $DATABASE_URL | gzip > backup-$(date +%Y%m%d).sql.gz

# Contract state backup (using archive node)
# Store critical events and state snapshots
```

---

## 🎯 Go-Live Checklist

### Pre-Launch

- [ ] All contracts deployed and verified
- [ ] Database schema initialized
- [ ] Backend services running and healthy
- [ ] Event indexer synced from genesis
- [ ] Oracle bots configured and running
- [ ] API endpoints responding correctly
- [ ] Frontend integrated and tested
- [ ] Monitoring and alerts configured
- [ ] Security audit completed
- [ ] Load testing passed

### Launch

- [ ] DNS configured
- [ ] SSL certificates installed
- [ ] CDN configured
- [ ] Analytics tracking enabled
- [ ] Social media accounts ready
- [ ] Documentation published
- [ ] Support channels operational

### Post-Launch

- [ ] Monitor all systems
- [ ] Track user adoption metrics
- [ ] Collect user feedback
- [ ] Plan feature updates
- [ ] Scale infrastructure as needed

---

## 📞 Support and Troubleshooting

### Common Issues

```bash
# Indexer falling behind
# Solution: Increase RPC rate limits, optimize queries

# Database connection errors
# Solution: Check connection string, SSL settings

# High API latency
# Solution: Add caching layer, optimize queries

# Contract gas estimation failures
# Solution: Update gas price oracle, check network congestion
```

### Emergency Procedures

```bash
# Emergency contract pause (if implemented)
npx hardhat run scripts/emergency-pause.js --network somnia

# Emergency database rollback
psql $DATABASE_URL -f backups/emergency-rollback.sql

# Emergency service restart
docker-compose restart
flyctl apps restart bitredict-api
```

---

🚀 **Production Ready Deployment Guide Complete!**

This guide provides everything needed to deploy BitRedict to production on Somnia Network with full monitoring, security, and scalability considerations. 
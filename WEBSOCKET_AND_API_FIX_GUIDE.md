# 🔧 FRONTEND & WEBSOCKET CONFIGURATION GUIDE

## ❌ CURRENT ISSUES

### Issue 1: API Endpoint 500 Error
**Problem:** `/api/optimized-pools/pools` returns 500 error
**Cause:** Redis not configured on fly.io and/or SQL query error

### Issue 2: WebSocket Connection Failed  
**Problem:** WebSocket trying to connect to wrong URL
**Cause:** Frontend configured to connect to `wss://bitredict.vercel.app/ws` instead of backend

---

## ✅ FIXES NEEDED

### Fix 1: Configure Redis on Fly.io

**Option A: Use Upstash Redis (Recommended)**
```bash
# In fly.io dashboard, add Upstash Redis
# Then set environment variable:
fly secrets set REDIS_URL="redis://your-upstash-redis-url" --app bitredict-backend
```

**Option B: Disable Redis Caching (Quick Fix)**
Update `backend/middleware/optimized-caching.js`:
```javascript
async initialize() {
  try {
    // Skip Redis if not configured
    if (!process.env.REDIS_URL) {
      console.log('⚠️ Redis URL not configured, caching disabled');
      this.isConnected = false;
      return;
    }
    
    this.client = redis.createClient({
      url: process.env.REDIS_URL
    });
    // ... rest of code
  }
}
```

### Fix 2: Update Frontend WebSocket Configuration

**File: `predict-linux/src/services/websocket-client.js`** (or wherever WebSocket is configured)

**CHANGE FROM:**
```javascript
const WS_URL = 'wss://bitredict.vercel.app/ws'; // ❌ WRONG
```

**CHANGE TO:**
```javascript
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'wss://bitredict-backend.fly.dev';
```

**Add to `.env.local` in frontend:**
```env
NEXT_PUBLIC_WS_URL=wss://bitredict-backend.fly.dev
```

### Fix 3: Backend WebSocket Server Configuration

The WebSocket server is already configured in `backend/services/websocket-service.js` but needs to be properly exposed.

**Verify `backend/api/server.js` has WebSocket initialization:**
```javascript
const websocketService = require('../services/websocket-service');

// In start() method:
websocketService.initialize(this.server);
```

**Ensure fly.toml allows WebSocket connections:**
```toml
[[services]]
  internal_port = 3000
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80
    force_https = true

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
```

---

## 🚀 WEBSOCKET USAGE GUIDE

### What is WebSocket?

WebSocket provides **real-time, bidirectional communication** between client and server:
- Traditional HTTP: Client requests → Server responds (one-way)
- WebSocket: Continuous connection → Both can send messages anytime

### Benefits for Bitredict:

1. **Real-time pool updates** - No polling needed
2. **Live bet notifications** - Instant updates when bets are placed
3. **Live progress tracking** - Pool fill percentage updates in real-time
4. **Reduced server load** - No constant API polling

### How to Use WebSocket in Frontend:

#### 1. Install WebSocket Client (Already created)
```javascript
// frontend/src/services/websocket-client.js
import WebSocketClient from '@/services/websocket-client';

const wsClient = new WebSocketClient();
```

#### 2. Subscribe to Pool Updates
```javascript
// In your React component
import { useEffect } from 'react';
import WebSocketClient from '@/services/websocket-client';

function PoolCard({ poolId }) {
  const [poolData, setPoolData] = useState(null);
  
  useEffect(() => {
    const wsClient = new WebSocketClient();
    
    // Subscribe to this pool's updates
    wsClient.subscribe(`pool:${poolId}`, (data) => {
      setPoolData(data); // Real-time update!
    });
    
    return () => wsClient.disconnect();
  }, [poolId]);
  
  return <div>{poolData?.title}</div>;
}
```

#### 3. Subscribe to Recent Bets
```javascript
// Get live bet notifications
wsClient.subscribe('recent-bets', (betsData) => {
  console.log('New bet placed!', betsData);
  // Update UI with new bets
});
```

#### 4. Subscribe to Pool Progress
```javascript
// Track pool fill percentage in real-time
wsClient.subscribe(`pool-progress:${poolId}`, (progress) => {
  console.log('Pool is now', progress.fillPercentage, '% filled');
});
```

---

## 📦 IMPLEMENTATION STEPS

### Step 1: Fix Redis (Choose One)

**Option A: Add Upstash Redis**
1. Go to https://upstash.com
2. Create free Redis instance
3. Copy connection URL
4. Run: `fly secrets set REDIS_URL="your-redis-url" --app bitredict-backend`

**Option B: Disable Redis Caching**
1. Update `optimized-caching.js` to skip if no Redis URL
2. Deploy backend

### Step 2: Update Frontend WebSocket URL

**File: `predict-linux/.env.local`**
```env
NEXT_PUBLIC_WS_URL=wss://bitredict-backend.fly.dev
```

**File: Frontend WebSocket configuration**
```javascript
const WS_URL = process.env.NEXT_PUBLIC_WS_URL;
```

### Step 3: Use WebSocket Instead of Polling

**BEFORE (Polling):**
```javascript
// ❌ Constant polling - expensive
useEffect(() => {
  const interval = setInterval(() => {
    fetch('/api/optimized-pools/pools').then(/* update state */);
  }, 5000); // Poll every 5 seconds
  
  return () => clearInterval(interval);
}, []);
```

**AFTER (WebSocket):**
```javascript
// ✅ Real-time updates - efficient
useEffect(() => {
  const ws = new WebSocketClient();
  
  ws.subscribe('pools-update', (pools) => {
    setPools(pools); // Real-time!
  });
  
  return () => ws.disconnect();
}, []);
```

---

## 🔍 DEBUGGING

### Check if WebSocket is Working:

**Backend logs:**
```bash
fly logs --app bitredict-backend | grep WebSocket
```

**Frontend console:**
```javascript
const ws = new WebSocket('wss://bitredict-backend.fly.dev');
ws.onopen = () => console.log('✅ WebSocket connected!');
ws.onerror = (e) => console.error('❌ WebSocket error:', e);
```

### Check if API is Working:

```bash
curl https://bitredict-backend.fly.dev/api/optimized-pools/pools
```

---

## 📝 SUMMARY

**Quick Fixes:**
1. ✅ Add `REDIS_URL` to fly.io secrets OR disable Redis
2. ✅ Change frontend WebSocket URL to backend domain
3. ✅ Deploy both frontend and backend

**WebSocket Benefits:**
- ⚡ Real-time updates (no polling)
- 🚀 Better performance
- 📉 Reduced server load
- 💾 Lower data usage

**WebSocket Usage:**
```javascript
// Subscribe to updates
ws.subscribe('pool:123', (data) => console.log(data));

// Unsubscribe when done
ws.disconnect();
```

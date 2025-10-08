# 🔧 WebSocket Setup Guide

## Environment Configuration

Create a `.env.local` file in the root directory with the following variables:

```env
# Base Backend URL (services will append /ws and /api/optimized-pools automatically)
NEXT_PUBLIC_API_URL=https://bitredict-backend.fly.dev
NEXT_PUBLIC_WS_URL=https://bitredict-backend.fly.dev
```

**Note:** The services automatically append the correct paths:
- API calls will use: `https://bitredict-backend.fly.dev/api/optimized-pools`
- WebSocket will use: `wss://bitredict-backend.fly.dev/ws`

## Vercel Environment Variables

Set these environment variables in your Vercel project settings:

```env
NEXT_PUBLIC_API_URL=https://bitredict-backend.fly.dev
NEXT_PUBLIC_WS_URL=https://bitredict-backend.fly.dev
```

The frontend code will automatically:
- Convert `http://` to `ws://` for WebSocket connections
- Convert `https://` to `wss://` for secure WebSocket connections
- Append `/api/optimized-pools` for API calls
- Append `/ws` for WebSocket connections

## WebSocket Usage Examples

### 1. Basic WebSocket Connection

```typescript
import { websocketClient } from '@/services/websocket-client';

// Connect to WebSocket
websocketClient.connect();

// Subscribe to pool updates
websocketClient.subscribeToPool(123, (data) => {
  console.log('Pool 123 updated:', data);
});

// Subscribe to recent bets
websocketClient.subscribeToRecentBets((bets) => {
  console.log('New bets:', bets);
});
```

### 2. React Hook Usage

```typescript
import { useOptimizedPools } from '@/hooks/useOptimizedPools';

function MarketsPage() {
  const { pools, loading, isConnected } = useOptimizedPools({
    enableWebSocket: true,
    autoRefresh: true
  });

  return (
    <div>
      {isConnected ? '🟢 Live' : '🔴 Offline'}
      {/* Render pools */}
    </div>
  );
}
```

### 3. Individual Pool Updates

```typescript
import { useOptimizedPool } from '@/hooks/useOptimizedPools';

function PoolPage({ poolId }) {
  const { pool, loading, isConnected } = useOptimizedPool({
    poolId,
    enableWebSocket: true
  });

  return (
    <div>
      {isConnected ? '🟢 Live Updates' : '🔴 Offline'}
      {/* Render pool */}
    </div>
  );
}
```

## WebSocket Channels

### Available Channels:

- `pool:{id}` - General pool updates
- `pool:{id}:progress` - Pool fill progress updates  
- `recent-bets` - New bet notifications
- `pools-update` - All pools updates

### Message Types:

- `pool_progress` - Pool fill percentage updates
- `new_bet` - New bet placed notifications
- `pool_update` - Pool status changes
- `connected` - WebSocket connected
- `disconnected` - WebSocket disconnected

## Debugging

### Check WebSocket Connection:

```javascript
// In browser console
const ws = new WebSocket('wss://bitredict-backend.fly.dev');
ws.onopen = () => console.log('✅ WebSocket connected!');
ws.onerror = (e) => console.error('❌ WebSocket error:', e);
```

### Check API Endpoints:

```bash
# Test API endpoints
curl https://bitredict-backend.fly.dev/api/optimized-pools/pools
curl https://bitredict-backend.fly.dev/api/optimized-pools/analytics
```

## Performance Benefits

- **10-25x faster** than direct contract calls
- **Real-time updates** without polling
- **Reduced server load** with WebSocket connections
- **Better user experience** with live data

## Troubleshooting

### WebSocket Connection Failed:
1. Check `NEXT_PUBLIC_WS_URL` environment variable
2. Verify backend is running on fly.io
3. Check browser console for errors

### API 500 Errors:
1. Check if Redis is configured on backend
2. Verify database connection
3. Check backend logs: `fly logs --app bitredict-backend`

### No Real-time Updates:
1. Verify WebSocket connection status
2. Check if subscribed to correct channels
3. Verify backend WebSocket server is running

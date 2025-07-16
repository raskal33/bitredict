# Production Data Architecture

## Overview

The BitRedict platform uses a centralized API architecture to ensure data consistency between pool cards (home page) and detailed bet pages. This eliminates the demo data approach and ensures all users see the same, real-time pool information.

## API Endpoints

### `/api/pools` - Main Pools Endpoint
- **Purpose**: Fetch multiple pools with filtering and pagination
- **Used by**: Home page pool cards, category filters
- **Query Parameters**:
  - `limit`: Number of pools to return (default: 10)
  - `category`: Filter by category (crypto, sports, finance, etc.)
  - `featured`: Boolean to get featured pools only
  - `boosted`: Boolean to get boosted pools only
  - `trending`: Boolean to get trending pools only

### `/api/pools/featured` - Featured Pools
- **Purpose**: Get premium pools (boosted/trending/high-volume)
- **Used by**: Home page featured section, featured page
- **Query Parameters**:
  - `limit`: Number of pools to return (default: 12)
  - `include_social`: Include comment/like counts (default: false)

### `/api/pools/[id]` - Individual Pool Details
- **Purpose**: Get complete pool data for betting interface
- **Used by**: Bet pages (`/bet/[id]`)
- **Query Parameters**:
  - `include_social`: Include comments and engagement data (default: false)

### `/api/analytics/platform-stats` - Platform Statistics
- **Purpose**: Get aggregated platform metrics
- **Used by**: Home page stats section
- **Returns**: Total volume, active pools, success rates, etc.

## Data Flow

```
1. Home Page Load
   ├── Fetch platform stats (/api/analytics/platform-stats)
   ├── Fetch featured pools (/api/pools/featured?limit=6)
   └── Display pool cards with consistent data

2. User Clicks Pool Card
   ├── Navigate to /bet/[poolId]
   ├── Fetch same pool data (/api/pools/[poolId])
   └── Display identical information as card preview

3. Category Filtering
   ├── Fetch filtered pools (/api/pools?category=crypto)
   └── Update pool cards with new data
```

## Database Schema (Production)

```sql
-- Core pools table
CREATE TABLE prediction_pools (
  id VARCHAR(255) PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  challenge_score INT NOT NULL,
  quality_score INT NOT NULL,
  difficulty_tier ENUM('easy', 'medium', 'hard', 'very_hard', 'legendary'),
  predicted_outcome TEXT NOT NULL,
  creator_prediction ENUM('yes', 'no') NOT NULL,
  odds DECIMAL(5,2) NOT NULL,
  target_amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'BITR',
  end_date DATETIME NOT NULL,
  status ENUM('active', 'resolved', 'cancelled') DEFAULT 'active',
  trending BOOLEAN DEFAULT FALSE,
  boosted BOOLEAN DEFAULT FALSE,
  boost_tier INT DEFAULT 0,
  image_emoji VARCHAR(10),
  card_theme VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (created_by) REFERENCES users(address),
  INDEX idx_category (category),
  INDEX idx_status (status),
  INDEX idx_featured (boosted, trending),
  INDEX idx_created_at (created_at)
);

-- Users/creators table
CREATE TABLE users (
  address VARCHAR(255) PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  reputation DECIMAL(3,2) DEFAULT 0,
  total_pools INT DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0,
  challenge_score INT DEFAULT 0,
  total_volume DECIMAL(15,2) DEFAULT 0,
  bio TEXT,
  avatar_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pool bets for calculating participants/volume
CREATE TABLE pool_bets (
  id VARCHAR(255) PRIMARY KEY,
  pool_id VARCHAR(255) NOT NULL,
  user_address VARCHAR(255) NOT NULL,
  bet_type ENUM('yes', 'no') NOT NULL,
  bet_amount DECIMAL(15,2) NOT NULL,
  status ENUM('active', 'won', 'lost') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (pool_id) REFERENCES prediction_pools(id),
  FOREIGN KEY (user_address) REFERENCES users(address),
  INDEX idx_pool (pool_id),
  INDEX idx_user (user_address)
);
```

## Data Consistency Strategy

### 1. Single Source of Truth
- All pool data comes from database through API endpoints
- No hardcoded demo data in production
- Pool cards and bet pages use same API endpoints

### 2. Real-time Updates
- APIs return calculated fields (participant count, volume, etc.)
- Database triggers update aggregate data when bets placed
- WebSocket connections for live updates (future enhancement)

### 3. Caching Strategy
```javascript
// API responses cached for 30 seconds to reduce database load
const poolData = await getCachedOrFetch(`pool-${poolId}`, 30);

// Featured pools cached for 5 minutes
const featuredPools = await getCachedOrFetch('featured-pools', 300);
```

### 4. Error Handling
- Graceful fallback to cached data if database unavailable
- Demo data only used during development/testing
- Clear error messages for debugging

## Migration from Demo Data

### Current State (Development)
- Pool cards show demo data from `getDemoPoolData()`
- Bet pages use same function for consistency
- Data generated deterministically based on pool ID

### Production Deployment
1. **Database Setup**: Create tables and seed initial data
2. **API Implementation**: Replace demo responses with database queries
3. **Frontend Updates**: Remove demo data imports
4. **Testing**: Verify data consistency across all pages

### Environment Variables
```env
# Production database
DATABASE_URL=postgresql://user:password@localhost:5432/bitredict
REDIS_URL=redis://localhost:6379  # For caching

# Development fallback
NODE_ENV=development  # Enables demo data fallback
```

## Benefits of This Architecture

1. **Data Consistency**: Pool cards and bet pages always show identical information
2. **Real-time Updates**: Volume, participants, and stats update immediately
3. **Scalability**: Cached responses reduce database load
4. **Maintainability**: Single API endpoints, no duplicate data logic
5. **Flexibility**: Easy to add new pool types, categories, or features

## User Experience Impact

- **Seamless Navigation**: No data discrepancies when moving between pages
- **Real-time Engagement**: Live stats and participant counts
- **Reliable Information**: Consistent odds, volumes, and creator details
- **Fast Loading**: Optimized queries and caching for performance 
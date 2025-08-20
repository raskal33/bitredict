# 🎯 Oddyssey Daily Game Automation

## Overview

The Oddyssey game is now fully automated with daily cycles featuring 10 carefully selected football matches. The system handles everything from match selection to result resolution automatically.

## Key Features

### 🕐 Daily Automation
- **Match Selection**: Daily at 00:01 UTC
- **New Cycle Creation**: Daily at 00:04 UTC
- **First Matches**: Starting after 13:00 UTC  
- **Cycle Resolution**: Automatic when match results are available
- **Prize Distribution**: Handled by smart contract

### 🏈 Match Selection Criteria
- **Timing**: First match must start after 13:00 UTC
- **Quality**: Balanced odds (not too one-sided)
- **Leagues**: Preference for popular leagues (Premier League, La Liga, etc.)
- **Coverage**: Good distribution across different time slots

### 📊 Live Features
- **Real-time Scores**: Live score updates every 30 seconds
- **Match Status**: Shows LIVE, HT, FT status
- **Betting Window**: Automatically closes when first match starts

## Technical Architecture

### Backend Services

#### OddysseyManager (`backend/services/oddyssey-manager.js`)
- Selects daily matches based on quality scoring
- Interfaces with SportMonks API for fixtures and results
- Manages smart contract interactions

#### OddysseyScheduler (`backend/cron/oddyssey-scheduler.js`)
- Match selection at 00:01 UTC
- Daily cycle creation at 00:04 UTC
- Resolution checks every hour (22:00-06:00 UTC)
- Weekly data cleanup on Sundays

#### API Endpoints (`backend/api/oddyssey.js`)
- `/api/oddyssey/cycle/current` - Current cycle info
- `/api/oddyssey/live-matches` - Live match data
- `/api/oddyssey/leaderboard/:cycleId` - Cycle leaderboards
- `/api/oddyssey/stats/:cycleId` - Cycle statistics

### Frontend Integration

#### Enhanced Hook (`hooks/useOddyssey.ts`)
- Live data fetching every 30 seconds
- Real-time score updates
- Automatic refresh on betting close

#### UI Features (`app/oddyssey/page.tsx`)
- Live score display with animations
- Match status indicators
- Real-time betting countdown

### Database Schema

#### Tables
- `oracle.oddyssey_cycles` - Daily cycle tracking
- `oracle.oddyssey_slips` - User predictions
- Views for leaderboards and statistics

## Match Selection Algorithm

### Scoring System (0-100 points)
1. **League Quality** (0-30 pts)
   - Popular leagues: +30 pts
   - Preferred leagues: +20 pts

2. **Odds Balance** (0-25 pts)
   - Competitive matches get higher scores
   - Avoids heavily one-sided matches

3. **Timing** (0-15 pts)
   - Preference for 15:00-21:00 UTC slots
   - Ensures good distribution

4. **Randomization** (0-5 pts)
   - Adds variety to selection

### Quality Filters
- Must have complete 1X2 and Over/Under odds
- Starting time after 13:00 UTC
- Valid fixture status (NS/Fixture)
- Not more than 3 matches per hour slot

## Automation Schedule

### Daily Operations
- **00:01 UTC**: Match selection
- **00:04 UTC**: New cycle creation
- **13:00+ UTC**: First matches begin (betting closes)
- **22:00-06:00 UTC**: Resolution checks every hour

### Weekly Maintenance
- **Sunday 03:00 UTC**: Old data cleanup (30+ days)

### Error Handling
- **Retry Logic**: 1-hour retry for failed operations
- **Notifications**: Webhook alerts for critical events
- **Manual Override**: Admin endpoints for emergency control

## Environment Variables

```bash
# Required for Oddyssey automation
SPORTMONKS_API_TOKEN=your_token_here
ODDYSSEY_WEBHOOK_URL=https://your-webhook-url.com  # Optional
```

## Manual Controls

### Admin Endpoints
```bash
# Force new cycle creation
POST /api/oddyssey/admin/trigger-cycle

# Force cycle resolution
POST /api/oddyssey/admin/resolve-cycle

# Check match availability
GET /api/oddyssey/matches/availability/2024-01-15
```

### Database Functions
```sql
-- Get match statistics for a date
SELECT * FROM oracle.get_daily_match_stats('2024-01-15');

-- Clean up old data
SELECT oracle.cleanup_old_oddyssey_data();
```

## Monitoring

### Health Checks
- Scheduler status via API
- Database connectivity
- SportMonks API availability
- Smart contract interaction

### Key Metrics
- Daily match selection success rate
- Resolution timing accuracy
- User participation trends
- Prize distribution efficiency

## Future Enhancements

### Planned Features
- Multi-sport support (Basketball, Tennis)
- Advanced match filtering options
- Seasonal tournament handling
- Enhanced live data integration

### Performance Optimizations
- Caching layer for frequently accessed data
- Batch operations for large datasets
- Improved error recovery mechanisms 
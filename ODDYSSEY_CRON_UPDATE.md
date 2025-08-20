# 🕐 Oddyssey Cron Job Schedule Update

## Overview
Update the Oddyssey automation cron jobs to run at the following times:

## New Schedule
- **00:01 UTC**: Match Selection
- **00:04 UTC**: Cycle Creation

## Files to Update on Backend

### 1. Cron Configuration Files
Update the following backend files with the new schedule:

#### `backend/cron/oddyssey-scheduler.js`
```javascript
// Update cron expressions:
// Match selection: 0 1 * * * (00:01 UTC)
// Cycle creation: 0 4 * * * (00:04 UTC)

// Example cron job definitions:
cron.schedule('0 1 * * *', async () => {
  console.log('🕐 00:01 UTC - Starting match selection...');
  await oddysseyManager.selectDailyMatches();
}, {
  timezone: 'UTC'
});

cron.schedule('0 4 * * *', async () => {
  console.log('🕐 00:04 UTC - Creating new cycle...');
  await oddysseyManager.createNewCycle();
}, {
  timezone: 'UTC'
});
```

#### `backend/services/oddyssey-manager.js`
Update any hardcoded time references:
```javascript
// Update any references from 01:00 to 00:04 for cycle creation
// Update any references from 12:00 to 00:01 for match selection
```

### 2. Environment Variables
Update any environment variables that reference the old schedule:
```bash
# Example environment variables to update:
ODDYSSEY_MATCH_SELECTION_TIME="00:01"
ODDYSSEY_CYCLE_CREATION_TIME="00:04"
```

### 3. Database Functions
Update any database functions or stored procedures that reference the old schedule:
```sql
-- Example: Update any hardcoded time references in database functions
-- Change from 01:00 to 00:04 for cycle creation
-- Change from 12:00 to 00:01 for match selection
```

## Frontend Updates Completed ✅

The following frontend files have been updated to reflect the new schedule:

1. **`ODDYSSEY_AUTOMATION.md`** - Updated documentation with new schedule
2. **`ODDYSSEY_CRON_UPDATE.md`** - This file with backend update instructions

## Testing Checklist

After updating the backend cron jobs:

- [ ] Verify match selection runs at 00:01 UTC
- [ ] Verify cycle creation runs at 00:04 UTC
- [ ] Test that matches are available for the new cycle
- [ ] Verify betting window opens correctly
- [ ] Check that resolution process still works
- [ ] Monitor logs for any timing-related issues

## Rollback Plan

If issues occur, the previous schedule was:
- **01:00 UTC**: Cycle creation
- **12:00 UTC**: Match selection (if separate)

## Notes

- The 3-minute gap between match selection (00:01) and cycle creation (00:04) allows time for match processing
- All times are in UTC
- Frontend components will automatically adapt to the new schedule
- No frontend code changes are required beyond documentation updates

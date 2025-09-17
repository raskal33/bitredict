# Leaderboard Frontend Implementation

## Overview

This document outlines the complete frontend implementation of the leaderboard system for Bitredict. The implementation provides a modern, responsive interface with dark theme, glassmorphism design, and comprehensive functionality for viewing leaderboards and user statistics.

## Features Implemented

### ✅ Navigation Integration
- Added "Leaderboard" link to the Bitredictor dropdown in the navbar
- Integrated with existing navigation structure
- Responsive design for mobile and desktop

### ✅ Leaderboard Page (`/leaderboard`)
- **Three Main Tabs:**
  - **Prediction Market**: Shows leaderboard based on prediction market performance
  - **Reputation**: Shows reputation-based rankings
  - **Personal Data**: User lookup and statistics

### ✅ Prediction Market Tab
- **Four Metrics:**
  - Total Staked
  - Total Won
  - Success Rate
  - Volume Generated
- Real-time data from backend API
- Animated leaderboard table with rankings

### ✅ Reputation Tab
- Reputation-based leaderboard
- Shows influence scores, prediction streaks, and verification status
- Integrated with backend reputation system

### ✅ Personal Data Tab
- **User Search**: Wallet address lookup functionality
- **User Statistics**: Comprehensive stats display
- **Current Rank**: Shows user's position in leaderboards
- **Verification Status**: Displays verification badges

## File Structure

```
predict-linux/
├── app/
│   └── leaderboard/
│       └── page.tsx                 # Main leaderboard page
├── components/
│   └── leaderboard/
│       ├── LeaderboardTable.tsx     # Reusable leaderboard table
│       ├── UserStatsCard.tsx        # User statistics display
│       └── index.ts                 # Component exports
├── hooks/
│   └── useLeaderboard.ts            # Custom hook for leaderboard data
├── services/
│   └── leaderboardService.ts        # API service for backend communication
└── components/header/
    └── index.tsx                    # Updated navbar with leaderboard link
```

## Components

### 1. LeaderboardPage (`app/leaderboard/page.tsx`)
**Main page component with:**
- Tab navigation (Prediction Market, Reputation, Personal Data)
- Metric selection for prediction markets
- User search functionality
- Responsive design with glassmorphism styling

**Key Features:**
- Uses `useLeaderboard` hook for data management
- Animated transitions with Framer Motion
- Error handling and loading states
- Mobile-responsive design

### 2. LeaderboardTable (`components/leaderboard/LeaderboardTable.tsx`)
**Reusable table component for displaying leaderboard data:**
- Supports both prediction market and reputation data
- Animated entries with staggered loading
- Rank icons for top 3 positions
- Verification badges
- Responsive column layout

**Props:**
```typescript
interface LeaderboardTableProps {
  data: LeaderboardEntry[];
  type: 'prediction' | 'reputation';
  loading?: boolean;
  error?: string | null;
  className?: string;
}
```

### 3. UserStatsCard (`components/leaderboard/UserStatsCard.tsx`)
**Component for displaying user statistics:**
- Grid layout for statistics
- Current rank display
- Verification status
- Loading and error states

**Props:**
```typescript
interface UserStatsCardProps {
  userStats: UserStats | null;
  userRank: UserRank | null;
  loading?: boolean;
  error?: string | null;
  className?: string;
}
```

### 4. useLeaderboard Hook (`hooks/useLeaderboard.ts`)
**Custom hook for leaderboard data management:**
- Centralized state management
- API integration
- Auto-refresh functionality
- Error handling

**Features:**
- Load leaderboard data (prediction/reputation)
- Search user statistics and rank
- Refresh data functionality
- Auto-refresh with configurable intervals
- Error state management

### 5. LeaderboardService (`services/leaderboardService.ts`)
**API service for backend communication:**
- Type-safe API calls
- Error handling
- Response transformation
- Singleton pattern

**Methods:**
- `getGuidedMarketsLeaderboard()`
- `getReputationLeaderboard()`
- `getUserStats()`
- `getUserRank()`
- `refreshLeaderboardCache()`
- `getLeaderboardMetrics()`
- `healthCheck()`

## Styling and Design

### Design System
- **Dark Theme**: Consistent with existing Bitredict design
- **Glassmorphism**: Frosted glass effect containers
- **Somnia Brand Colors**: Cyan, blue, violet, magenta, indigo
- **Gradient Accents**: Dynamic color gradients
- **Smooth Animations**: Framer Motion transitions

### Color Palette
```css
/* Primary Colors */
--somnia-cyan: #22C7FF
--somnia-blue: #007BFF
--somnia-violet: #8C00FF
--somnia-magenta: #FF0080
--somnia-indigo: #3C00A5

/* Background */
--bg-main: #0A0A1A
--bg-card: rgba(22, 24, 48, 0.6)

/* Text */
--text-primary: #FFFFFF
--text-secondary: #E4E4FA
--text-muted: #C2C2D6
```

### Responsive Design
- **Mobile First**: Optimized for mobile devices
- **Breakpoints**: sm, md, lg, xl
- **Flexible Layouts**: Grid and flexbox for responsive design
- **Touch Friendly**: Large touch targets for mobile

## API Integration

### Backend Endpoints
The frontend integrates with the following backend endpoints:

```
GET /api/leaderboards/guided-markets
GET /api/leaderboards/reputation
GET /api/leaderboards/user/:address/stats
GET /api/leaderboards/user/:address/rank
POST /api/leaderboards/refresh
GET /api/leaderboards/metrics
GET /api/leaderboards/health
```

### Data Flow
1. **Page Load**: Hook initializes and loads leaderboard data
2. **Tab Switch**: Loads appropriate leaderboard type
3. **Metric Change**: Refreshes data with new metric
4. **User Search**: Calls user stats and rank APIs
5. **Auto Refresh**: Periodically updates data

## Error Handling

### Error States
- **API Errors**: Network failures, server errors
- **Data Errors**: Invalid responses, missing data
- **User Errors**: Invalid addresses, not found
- **Loading States**: Spinners and skeleton screens

### Error Recovery
- **Fallback Data**: Mock data for development
- **Retry Logic**: Automatic retry for failed requests
- **User Feedback**: Clear error messages
- **Graceful Degradation**: Partial functionality on errors

## Performance Optimizations

### Caching
- **API Caching**: Backend cache integration
- **Client Caching**: React Query for data caching
- **Auto Refresh**: Configurable refresh intervals
- **Optimistic Updates**: Immediate UI updates

### Loading States
- **Skeleton Screens**: Placeholder content while loading
- **Progressive Loading**: Staggered animations
- **Loading Indicators**: Spinners and progress bars
- **Error Boundaries**: Graceful error handling

## Usage Examples

### Basic Usage
```tsx
import { useLeaderboard } from '@/hooks/useLeaderboard';

function MyComponent() {
  const {
    leaderboardData,
    loading,
    error,
    loadLeaderboard
  } = useLeaderboard({
    metric: 'total_staked',
    limit: 50,
    autoRefresh: true
  });

  return (
    <div>
      {loading ? 'Loading...' : (
        <LeaderboardTable 
          data={leaderboardData}
          type="prediction"
        />
      )}
    </div>
  );
}
```

### User Search
```tsx
const { searchUser, userStats, userRank } = useLeaderboard();

const handleSearch = async (address: string) => {
  await searchUser(address);
  // userStats and userRank will be updated
};
```

## Future Enhancements

### Planned Features
1. **Real-time Updates**: WebSocket integration for live updates
2. **Advanced Filtering**: Date ranges, categories, custom filters
3. **Export Functionality**: CSV/PDF export of leaderboard data
4. **Social Features**: Share rankings, follow users
5. **Mobile App**: React Native version

### Performance Improvements
1. **Virtual Scrolling**: For large leaderboard datasets
2. **Image Optimization**: Lazy loading and WebP support
3. **Bundle Splitting**: Code splitting for better performance
4. **Service Worker**: Offline functionality

## Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Next.js 15+
- TypeScript 5+

### Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Environment Variables
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Testing

### Manual Testing
1. **Navigation**: Test leaderboard link in navbar
2. **Tabs**: Switch between prediction, reputation, and personal tabs
3. **Metrics**: Test different prediction market metrics
4. **Search**: Test user address lookup
5. **Responsive**: Test on different screen sizes

### Automated Testing
- Unit tests for components
- Integration tests for API calls
- E2E tests for user flows
- Performance tests for large datasets

## Conclusion

The leaderboard frontend implementation provides a comprehensive, modern interface for viewing and interacting with leaderboard data. The implementation follows React best practices, uses TypeScript for type safety, and integrates seamlessly with the existing Bitredict design system.

The modular architecture allows for easy maintenance and future enhancements, while the responsive design ensures a great user experience across all devices.

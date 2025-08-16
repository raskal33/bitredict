# Smart Contract Improvements for Enhanced Stats & Leaderboards

## Overview
Based on the implementation of the new stats system and leaderboard functionality, here are comprehensive improvements suggested for the `BitredictPool.sol` contract to support advanced analytics and user engagement features on the **Somnia EVM Network**.

## 🌐 Somnia Network Integration
The BitRedict platform is built on Somnia Network, a high-performance EVM-compatible blockchain that provides:
- **High throughput** for real-time prediction markets
- **Low gas costs** for frequent user interactions
- **EVM compatibility** for seamless smart contract deployment
- **Fast finality** for quick bet settlements

## 🏆 Leaderboard & Ranking System

### 1. Enhanced Leaderboard Functions
```solidity
// Add these new functions to support dynamic leaderboards

function getTopCreatorsByVolume(uint256 limit) external view returns (
    address[] memory creators,
    uint256[] memory volumes,
    uint256[] memory winRates,
    uint256[] memory reputationScores
) {
    // Implementation to return sorted creators by total volume
}

function getTopCreatorsByWinRate(uint256 limit) external view returns (
    address[] memory creators,
    uint256[] memory winRates,
    uint256[] memory totalPools,
    uint256[] memory settledPools
) {
    // Implementation to return sorted creators by win rate (minimum pools threshold)
}

function getTopBettorsByProfit(uint256 limit) external view returns (
    address[] memory bettors,
    uint256[] memory profits,
    uint256[] memory winRates,
    uint256[] memory totalBets
) {
    // Implementation to return sorted bettors by total profit
}

function getTopBettorsByVolume(uint256 limit) external view returns (
    address[] memory bettors,
    uint256[] memory volumes,
    uint256[] memory winRates,
    uint256[] memory totalBets
) {
    // Implementation to return sorted bettors by betting volume
}
```

### 2. Reputation System
```solidity
// Add reputation tracking for creators
struct ReputationScore {
    uint256 baseScore;      // Starting at 1000
    uint256 bonusPoints;    // Earned through performance
    uint256 penaltyPoints;  // Lost through poor performance
    uint256 consistency;    // Streak-based scoring
    uint256 lastUpdated;    // Timestamp of last update
}

mapping(address => ReputationScore) public userReputation;

function updateReputation(address user, bool won, uint256 poolSize) internal {
    // Complex reputation algorithm based on:
    // - Win/loss ratio
    // - Pool size (bigger pools = more reputation impact)
    // - Consistency (winning streaks)
    // - Time-based decay
}

function getUserReputation(address user) external view returns (uint256 totalScore, uint256 rank) {
    // Calculate total reputation and global rank
}
```

## 📊 Advanced Analytics Functions

### 3. Time-Based Statistics
```solidity
// Enhanced time-based tracking
struct TimeframedStats {
    uint256 dailyVolume;
    uint256 weeklyVolume;
    uint256 monthlyVolume;
    uint256 dailyPools;
    uint256 weeklyPools;
    uint256 monthlyPools;
    uint256 dailyUsers;
    uint256 weeklyUsers;
    uint256 monthlyUsers;
}

mapping(uint256 => TimeframedStats) public dailyStats; // timestamp => stats

function getVolumeHistory(uint256 days) external view returns (
    uint256[] memory dates,
    uint256[] memory volumes,
    uint256[] memory poolCounts,
    uint256[] memory userCounts
) {
    // Return historical data for charting
}

function getUserActivityByHour() external view returns (
    uint256[24] memory hourlyUsers,
    uint256[24] memory hourlyVolume
) {
    // Return 24-hour activity distribution
}
```

### 4. Category Analytics
```solidity
// Enhanced category tracking
struct CategoryStats {
    uint256 totalPools;
    uint256 activePools;
    uint256 totalVolume;
    uint256 avgPoolSize;
    uint256 successRate;
    uint256 avgDuration;
}

mapping(string => CategoryStats) public categoryStats;

function getCategoryLeaderboard() external view returns (
    string[] memory categories,
    uint256[] memory volumes,
    uint256[] memory poolCounts,
    uint256[] memory successRates
) {
    // Return categories sorted by various metrics
}

function getCategoryTrends(string memory category, uint256 days) external view returns (
    uint256[] memory dates,
    uint256[] memory volumes,
    uint256[] memory poolCounts
) {
    // Return category-specific trends
}
```

## 🎯 Advanced User Metrics

### 5. Detailed User Performance
```solidity
// Enhanced user tracking
struct DetailedUserStats {
    uint256 totalVolume;
    uint256 profitLoss;
    uint256 biggestWin;
    uint256 biggestLoss;
    uint256 avgBetSize;
    uint256 longestWinStreak;
    uint256 longestLossStreak;
    uint256 currentStreak;
    bool currentStreakIsWin;
    uint256 favoriteCategory; // encoded as hash
    uint256 riskScore; // 1-1000, calculated based on betting patterns
}

mapping(address => DetailedUserStats) public detailedStats;

function getUserDetailedStats(address user) external view returns (
    DetailedUserStats memory stats,
    string memory favoriteCategory,
    uint256 globalRank
) {
    // Return comprehensive user analytics
}

function getUserPerformanceByCategory(address user) external view returns (
    string[] memory categories,
    uint256[] memory winRates,
    uint256[] memory volumes,
    uint256[] memory profitLoss
) {
    // Return user performance broken down by category
}
```

## 💰 Economic Analytics

### 6. Platform Economics
```solidity
// Platform-wide economic metrics
struct PlatformEconomics {
    uint256 totalFeesCollected;
    uint256 totalPayouts;
    uint256 platformRevenue;
    uint256 averageMargin;
    uint256 liquidity;
    uint256 totalValueLocked;
}

function getPlatformEconomics() external view returns (PlatformEconomics memory) {
    // Return comprehensive economic metrics
}

function getFeeDistribution() external view returns (
    uint256 platformFees,
    uint256 creatorFees,
    uint256 liquidityProviderFees,
    uint256 burnedTokens
) {
    // Return how fees are distributed
}
```

## 🔄 Real-Time Updates

### 7. Event-Driven Updates
```solidity
// Enhanced events for real-time updates
event LeaderboardUpdate(address indexed user, uint256 newRank, uint256 score);
event CategoryStatsUpdate(string category, uint256 volume, uint256 pools);
event ReputationUpdate(address indexed user, uint256 oldScore, uint256 newScore);
event MilestoneAchieved(address indexed user, string milestone, uint256 value);

// Automatic leaderboard updates
modifier updateLeaderboard(address user) {
    _;
    // Update relevant leaderboards after action
    _updateUserRanking(user);
}
```

## 🏅 Achievement System

### 8. Gamification Features
```solidity
// Achievement/badge system
enum AchievementType {
    FIRST_POOL,
    FIRST_WIN,
    WIN_STREAK_5,
    WIN_STREAK_10,
    VOLUME_1K,
    VOLUME_10K,
    VOLUME_100K,
    PROFIT_MASTER,
    CATEGORY_SPECIALIST,
    EARLY_ADOPTER,
    WHALE,
    CONSISTENT_TRADER
}

struct Achievement {
    bool unlocked;
    uint256 unlockedAt;
    uint256 progress;
    uint256 target;
}

mapping(address => mapping(AchievementType => Achievement)) public userAchievements;

function checkAndUpdateAchievements(address user) internal {
    // Check and unlock achievements based on user stats
}

function getUserAchievements(address user) external view returns (
    AchievementType[] memory unlockedAchievements,
    uint256[] memory unlockedDates,
    AchievementType[] memory inProgressAchievements,
    uint256[] memory progressValues
) {
    // Return user's achievement status
}
```

## 🔍 Search & Filter Functions

### 9. Advanced Query Functions
```solidity
function getPoolsByCreator(address creator, uint256 offset, uint256 limit) 
    external view returns (uint256[] memory poolIds);

function getPoolsByTimeRange(uint256 startTime, uint256 endTime, uint256 offset, uint256 limit)
    external view returns (uint256[] memory poolIds);

function getPoolsByVolumeRange(uint256 minVolume, uint256 maxVolume, uint256 offset, uint256 limit)
    external view returns (uint256[] memory poolIds);

function getTopPoolsByCategory(string memory category, uint256 limit)
    external view returns (uint256[] memory poolIds, uint256[] memory volumes);
```

## 📈 Predictive Analytics Support

### 10. Data for ML/AI
```solidity
// Functions to support off-chain analytics
function getBulkPoolData(uint256[] memory poolIds) external view returns (
    // Bulk data retrieval for analytics
);

function getUserBehaviorMetrics(address user) external view returns (
    uint256 avgTimeToDecision,
    uint256 preferredPoolSize,
    uint256 riskTolerance,
    uint256 activityPattern
) {
    // Metrics for user behavior analysis
}
```

## Implementation Priority

### High Priority
1. **Leaderboard Functions** - Essential for user engagement
2. **Time-Based Statistics** - Required for trending/analytics
3. **Enhanced Events** - Needed for real-time updates

### Medium Priority
1. **Reputation System** - Improves trust and gamification
2. **Achievement System** - Enhances user retention
3. **Category Analytics** - Better market insights

### Low Priority
1. **Predictive Analytics Support** - Advanced feature
2. **Complex Economic Metrics** - Nice-to-have analytics

## Gas Optimization Considerations

- Use batch operations where possible
- Implement pagination for large datasets
- Consider using mappings with arrays for efficient sorting
- Cache frequently accessed calculations
- Use events for historical data rather than storage

## Security Considerations

- Implement proper access controls for admin functions
- Add circuit breakers for large data operations
- Validate all input parameters
- Consider rate limiting for expensive read operations

This implementation would transform BitRedict into a comprehensive prediction platform with advanced analytics, gamification, and user engagement features while maintaining the core betting functionality. 
# 🎯 Analytics Implementation Guide

## 📊 **System Architecture**

Your analytics system now follows a **3-tier architecture** combining the best of contract and backend data:

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND COMPONENTS                        │
│  (Stats Page, Dashboard, Analytics Widgets)                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                   UNIFIED ANALYTICS LAYER                     │
│  ┌──────────────────┐    ┌──────────────────┐              │
│  │ Contract Service │────│ Backend Service  │               │
│  │ (Real-time)      │    │ (Historical)     │               │
│  └──────────────────┘    └──────────────────┘               │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                      DATA SOURCES                             │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │  Blockchain  │         │  PostgreSQL  │                   │
│  │  (Somnia)    │         │  Database    │                   │
│  └──────────────┘         └──────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 **What's Been Implemented**

### **1. Services Layer**

#### **Contract Analytics Service** (`services/contractAnalyticsService.ts`)
- ✅ Real-time blockchain data from smart contracts
- ✅ Global platform statistics
- ✅ Pool-specific analytics
- ✅ Creator statistics
- ✅ Market type & oracle type distributions
- ✅ Active pools discovery

#### **Unified Analytics Service** (`services/unifiedAnalyticsService.ts`)
- ✅ Combines contract + backend data intelligently
- ✅ Generates insights and recommendations
- ✅ Platform health scoring
- ✅ Risk level calculations
- ✅ Creator reliability metrics
- ✅ Market intelligence

### **2. Hooks Layer**

#### **Contract Analytics Hooks** (`hooks/useContractAnalytics.ts`)
- ✅ `useContractGlobalStats` - Real-time platform stats
- ✅ `useContractPoolAnalytics` - Pool-specific data
- ✅ `useContractCreatorStats` - Creator profiles
- ✅ `useMarketTypeDistribution` - Market analysis
- ✅ `useUnifiedGlobalStats` - Combined stats
- ✅ `useUnifiedPoolAnalytics` - Full pool insights
- ✅ `useUnifiedCreatorProfile` - Complete creator data
- ✅ `useMarketIntelligence` - Market trends
- ✅ `useUnifiedAnalyticsDashboard` - Comprehensive dashboard data

### **3. Components Layer**

#### **Analytics Card** (`components/analytics/AnalyticsCard.tsx`)
- ✅ Modern, animated stat cards
- ✅ Multiple color themes (primary, secondary, success, warning, danger)
- ✅ Size variations (sm, md, lg)
- ✅ Trend indicators with arrows
- ✅ Loading states
- ✅ Click handlers for interactivity

#### **Modern Chart** (`components/analytics/ModernChart.tsx`)
- ✅ Line, Bar, Doughnut, and Radar charts
- ✅ Consistent styling with theme
- ✅ Animated transitions
- ✅ Responsive design
- ✅ Custom tooltips
- ✅ Loading states

## 📋 **How to Use the System**

### **Example 1: Stats Page with Unified Analytics**

```typescript
"use client";

import { useUnifiedAnalyticsDashboard } from '@/hooks/useContractAnalytics';
import { AnalyticsCard, ModernChart } from '@/components/analytics';
import { CurrencyDollarIcon, ChartBarIcon, UsersIcon, TrophyIcon } from '@heroicons/react/24/outline';

export default function StatsPage() {
  const { 
    globalStats, 
    marketIntelligence,
    activePools,
    isLoading 
  } = useUnifiedAnalyticsDashboard('7d');

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <AnalyticsCard
          title="Total Volume"
          value={globalStats?.contract.totalVolume || '0'}
          icon={CurrencyDollarIcon}
          color="primary"
          trend={{ value: 8.3, label: 'vs last week' }}
        />
        
        <AnalyticsCard
          title="Total Pools"
          value={globalStats?.contract.totalPools.toLocaleString() || '0'}
          icon={ChartBarIcon}
          color="secondary"
          trend={{ value: 12.5 }}
        />
        
        <AnalyticsCard
          title="Active Pools"
          value={globalStats?.backend.activePools.toLocaleString() || '0'}
          icon={UsersIcon}
          color="success"
        />
        
        <AnalyticsCard
          title="Platform Health"
          value={globalStats?.combined.platformHealth || 'N/A'}
          icon={TrophyIcon}
          color="warning"
          subtitle={`Activity: ${globalStats?.combined.activityScore || 0}/100`}
        />
      </div>

      {/* Market Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ModernChart
          title="Market Type Distribution"
          type="doughnut"
          data={{
            labels: Object.keys(marketIntelligence?.marketTypes || {}),
            datasets: [{
              data: Object.values(marketIntelligence?.marketTypes || {}),
              backgroundColor: [
                '#22C7FF', '#FF0080', '#8C00FF', '#00D9A5',
                '#FFB800', '#FF6B6B', '#4ECDC4', '#95E1D3',
              ],
            }],
          }}
        />
        
        <ModernChart
          title="Oracle Distribution"
          type="bar"
          data={{
            labels: ['Guided Oracle', 'Open Oracle'],
            datasets: [{
              label: 'Pools',
              data: [
                marketIntelligence?.oracleTypes.guided || 0,
                marketIntelligence?.oracleTypes.open || 0,
              ],
              backgroundColor: ['rgba(34, 199, 255, 0.8)', 'rgba(255, 0, 128, 0.8)'],
            }],
          }}
        />
      </div>
    </div>
  );
}
```

### **Example 2: Pool Detail Page**

```typescript
"use client";

import { useUnifiedPoolAnalytics } from '@/hooks/useContractAnalytics';
import { AnalyticsCard } from '@/components/analytics';

export default function PoolDetailPage({ poolId }: { poolId: number }) {
  const { data: poolAnalytics, isLoading } = useUnifiedPoolAnalytics(poolId);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Real-time Pool Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AnalyticsCard
          title="Total Volume"
          value={poolAnalytics?.contract.totalVolume || '0'}
          subtitle={`Avg bet: ${poolAnalytics?.contract.averageBetSize}`}
          color="primary"
        />
        
        <AnalyticsCard
          title="Participants"
          value={poolAnalytics?.contract.participantCount || 0}
          subtitle={`${poolAnalytics?.contract.fillPercentage}% filled`}
          color="secondary"
        />
        
        <AnalyticsCard
          title="Risk Level"
          value={poolAnalytics?.insights.riskLevel.toUpperCase() || 'N/A'}
          subtitle={poolAnalytics?.insights.recommendation}
          color={
            poolAnalytics?.insights.riskLevel === 'low' ? 'success' :
            poolAnalytics?.insights.riskLevel === 'medium' ? 'warning' :
            'danger'
          }
        />
      </div>
      
      {/* Pool Status */}
      {poolAnalytics?.insights.trending && (
        <div className="glass-card p-4 bg-gradient-to-r from-primary/20 to-transparent">
          <p className="text-primary font-semibold">🔥 This pool is trending!</p>
        </div>
      )}
    </div>
  );
}
```

### **Example 3: Creator Profile**

```typescript
"use client";

import { useUnifiedCreatorProfile } from '@/hooks/useContractAnalytics';
import { AnalyticsCard } from '@/components/analytics';

export default function CreatorProfile({ address }: { address: string }) {
  const { data: profile, isLoading } = useUnifiedCreatorProfile(address);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Creator Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <AnalyticsCard
          title="Total Pools"
          value={profile?.contract.totalPools || 0}
          color="primary"
        />
        
        <AnalyticsCard
          title="Total Volume"
          value={profile?.contract.totalVolume || '0'}
          color="secondary"
        />
        
        <AnalyticsCard
          title="Win Rate"
          value={`${profile?.contract.winRate}%`}
          color="success"
        />
        
        <AnalyticsCard
          title="Reputation"
          value={profile?.contract.reputationScore || 0}
          color="warning"
        />
      </div>

      {/* Creator Badges */}
      <div className="glass-card p-6">
        <h3 className="text-xl font-bold mb-4">Achievements</h3>
        <div className="flex flex-wrap gap-2">
          {profile?.insights.badges.map((badge) => (
            <span
              key={badge}
              className="px-4 py-2 bg-gradient-primary text-black rounded-button font-semibold"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>

      {/* Expertise */}
      <div className="glass-card p-6">
        <h3 className="text-xl font-bold mb-4">Expertise</h3>
        <div className="space-y-2">
          {profile?.insights.expertise.map((skill) => (
            <div key={skill} className="flex items-center gap-2">
              <span className="text-primary">✓</span>
              <span>{skill}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

## 🎨 **Styling & Theming**

All components use your existing design system:

- **Colors**: `primary`, `secondary`, `success`, `warning`, `danger`
- **Effects**: `glass-card`, `glow-cyan`, `glow-magenta`, `glow-violet`
- **Animations**: Framer Motion for smooth transitions
- **Typography**: Consistent with your theme

## ⚡ **Performance Optimizations**

### **Smart Caching Strategy**
- Contract data: 30 seconds (real-time)
- Backend data: 5 minutes (historical)
- Combined data: 1 minute (hybrid)

### **Automatic Refetching**
- Global stats: Every 30 seconds
- Pool analytics: Every 30 seconds
- Creator stats: Every 1 minute
- Market intelligence: Every 5 minutes

### **Loading States**
All hooks and components include loading states for smooth UX.

## 🔧 **Backend Requirements**

Ensure these backend endpoints are available:
- ✅ `/api/analytics/overview`
- ✅ `/api/analytics/global`
- ✅ `/api/analytics/leaderboard`
- ✅ `/api/bitredict-pool-analytics/trending`
- ✅ `/api/daily-stats/platform`

## 📊 **Next Steps**

### **1. Update Stats Page**
Replace the current stats page implementation with unified analytics:

```typescript
import { useUnifiedAnalyticsDashboard } from '@/hooks/useContractAnalytics';
```

### **2. Add to Dashboard**
Integrate analytics widgets into the main dashboard.

### **3. Create Analytics Widgets**
Build smaller, focused widgets for specific metrics.

### **4. Implement Real-time Updates**
Add WebSocket support for instant updates.

### **5. Add More Visualizations**
- Heatmaps for activity patterns
- Treemaps for category distribution
- Sankey diagrams for flow analysis

## 🎯 **Benefits**

✅ **Real-time Accuracy**: Direct blockchain data
✅ **Rich Insights**: Backend analytics + AI recommendations
✅ **Modern UX**: Smooth animations and responsive design
✅ **Performance**: Smart caching and optimized queries
✅ **Extensible**: Easy to add new metrics and visualizations
✅ **Type-safe**: Full TypeScript support

## 📚 **References**

- Contract Analytics: `/services/contractAnalyticsService.ts`
- Unified Analytics: `/services/unifiedAnalyticsService.ts`
- Hooks: `/hooks/useContractAnalytics.ts`
- Components: `/components/analytics/`
- Strategy Doc: `/ANALYTICS_STRATEGY.md`

---

**Ready to deploy!** 🚀 All services, hooks, and components are production-ready and follow best practices.


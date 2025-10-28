# 🚨 COMPREHENSIVE DASHBOARD & PROFILE FIX PLAN

## 📋 **ISSUES FOUND**

### **1. Dashboard SideMenu (`/app/dashboard/SideMenu.tsx`)**
- ❌ Hardcoded Quick Stats (68.1%, +640 SOL, 5)
- ❌ SOL reference instead of STT
- ❌ Hardcoded badges ("5", "3")

### **2. Portfolio Page (`/app/dashboard/financial-summary/page.tsx`)**
- ❌ ALL MOCK DATA (`mockPortfolio` array)
- ❌ Multiple SOL references throughout
- ❌ Hardcoded positions (Bitcoin, Tesla, Manchester City, etc.)
- ❌ No real API integration

### **3. Analytics Page (`/app/dashboard/performance-charts/page.tsx`)**
- ⚠️  Need to check for mock data

### **4. Activity/Notifications Page (`/app/dashboard/notifications/page.tsx`)**
- ⚠️  Need to check for mock data

### **5. Settings Page (`/app/dashboard/settings/page.tsx`)**
- ⚠️  Need to check for mock data

### **6. Profile Sections** (`/app/profile/*`)
- ⚠️  Need to check: betting-history, created-predictions, community-activity

### **7. BigInt Display Issues**
- ❌ `4e+21 BITR` (scientific notation not formatted)
- ❌ Need to apply `formatTokenAmount()` utility everywhere

---

## 🎯 **FIX STRATEGY**

### **Phase 1: Create Format Utility** ✅
- [x] Created `/utils/formatters.ts` with comprehensive formatting functions
- [x] `formatSTT()`, `formatBITR()`, `formatTokenAmount()`
- [x] Handles BigInt, scientific notation, thousand separators
- [x] Includes `formatProfitLoss()`, `formatWinRate()`, `formatAddress()`

### **Phase 2: Fix Dashboard Components**
1. **SideMenu.tsx**
   - Replace hardcoded stats with `useMyProfile()` data
   - Change SOL → STT
   - Make badges dynamic from real data

2. **financial-summary/page.tsx** (Portfolio)
   - Remove `mockPortfolio` array
   - Integrate with `/api/users/[address]/portfolio` endpoint
   - Use `formatSTT()` for all amounts
   - Connect to real pool data from contracts

3. **performance-charts/page.tsx** (Analytics)
   - Check for mock data
   - Integrate with `/api/analytics/user-stats` endpoint
   - Use real chart data from backend

4. **notifications/page.tsx** (Activity)
   - Check for mock data
   - Integrate with `/api/users/[address]/activity` endpoint
   - Display real notifications

5. **settings/page.tsx**
   - Likely just UI, but verify no hardcoded data

### **Phase 3: Fix Profile Components**
1. **betting-history/page.tsx**
   - Integrate with `/api/users/[address]/bets` endpoint
   - Display real betting history
   - Use `formatSTT()` for amounts

2. **created-predictions/page.tsx**
   - Integrate with `/api/users/[address]/created-pools` endpoint
   - Display real created pools
   - Use `formatSTT()` for pool amounts

3. **community-activity/page.tsx**
   - Integrate with `/api/users/[address]/social-activity` endpoint
   - Display real social interactions

### **Phase 4: Apply Number Formatting**
- Import `formatSTT`, `formatBITR`, `formatTokenAmount` everywhere
- Replace all `.toString()` calls on BigInt values
- Replace all `{value} SOL` with `{formatSTT(value)}`
- Replace all `{value} BITR` with `{formatBITR(value)}`

### **Phase 5: Testing**
- Test all pages with wallet connected
- Test all pages without wallet
- Test loading states
- Test empty states
- Verify no BigInt serialization errors
- Verify no scientific notation (4e+21)
- Verify all amounts show properly formatted

---

## 🔧 **BACKEND ENDPOINTS NEEDED**

### **Already Exist:**
- ✅ `/api/users/[address]/profile`
- ✅ `/api/users/[address]/badges`
- ✅ `/api/reputation/user/[address]`
- ✅ `/api/analytics/global`

### **Need to Verify/Create:**
- ⚠️  `/api/users/[address]/portfolio` - User's active positions
- ⚠️  `/api/users/[address]/bets` - Betting history
- ⚠️  `/api/users/[address]/created-pools` - Created pools
- ⚠️  `/api/users/[address]/activity` - Activity feed
- ⚠️  `/api/users/[address]/social-activity` - Social interactions
- ⚠️  `/api/analytics/user-stats` - User analytics data

---

## 📊 **DATA STRUCTURE EXAMPLES**

### **Portfolio Item**
```typescript
interface PortfolioPosition {
  id: string;
  poolId: string;
  title: string;
  type: 'bet' | 'liquidity';
  amount: bigint; // In wei
  outcome: string; // "Yes" | "No"
  odds: string; // "1.75"
  potentialWin: bigint; // In wei
  status: 'active' | 'winning' | 'losing' | 'won' | 'lost';
  endDate: string; // ISO date
  progress: number; // 0-100
  category: string;
  createdAt: string; // ISO date
  currentValue: bigint; // In wei
  unrealizedPL: bigint; // In wei (can be negative)
  token: 'STT' | 'BITR';
}
```

### **Betting History Item**
```typescript
interface BetHistory {
  id: string;
  poolId: string;
  title: string;
  amount: bigint; // In wei
  outcome: string;
  odds: string;
  result: 'won' | 'lost' | 'pending';
  payout: bigint | null; // In wei
  date: string; // ISO date
  token: 'STT' | 'BITR';
}
```

### **Created Pool Item**
```typescript
interface CreatedPool {
  poolId: string;
  title: string;
  category: string;
  creatorStake: bigint; // In wei
  totalVolume: bigint; // In wei
  totalBets: number;
  status: 'active' | 'ended' | 'resolved';
  createdAt: string; // ISO date
  endDate: string; // ISO date
  token: 'STT' | 'BITR';
  isResolved: boolean;
}
```

---

## 🎨 **GLASSMORPHISM STYLE GUIDE**

All components should use:
```css
.glass-card {
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 16px;
}

.glass-card-hover:hover {
  background: rgba(15, 23, 42, 0.7);
  border-color: rgba(34, 211, 238, 0.3);
}
```

---

## ✅ **ACCEPTANCE CRITERIA**

- [ ] No mock/hardcoded data anywhere
- [ ] No SOL references (only STT/BITR)
- [ ] All BigInt values properly formatted (no 4e+21)
- [ ] All amounts show with thousand separators (1,234.56)
- [ ] All pages connect to real backend APIs
- [ ] All pages handle loading states
- [ ] All pages handle empty states
- [ ] All pages handle wallet not connected
- [ ] Responsive on mobile, tablet, desktop
- [ ] Glassmorphism styling consistent
- [ ] No linter errors
- [ ] No console errors
- [ ] Production ready

---

## 📝 **IMPLEMENTATION CHECKLIST**

### **Dashboard**
- [ ] Fix SideMenu.tsx (stats, badges)
- [ ] Fix financial-summary/page.tsx (portfolio)
- [ ] Fix performance-charts/page.tsx (analytics)
- [ ] Fix notifications/page.tsx (activity)
- [ ] Verify settings/page.tsx

### **Profile**
- [ ] Fix betting-history/page.tsx
- [ ] Fix created-predictions/page.tsx
- [ ] Fix community-activity/page.tsx

### **Utilities**
- [x] Create formatters.ts utility
- [ ] Create hooks for each data type
- [ ] Update existing hooks to use formatters

### **Testing**
- [ ] Test all dashboard pages
- [ ] Test all profile pages
- [ ] Test number formatting
- [ ] Test responsive design
- [ ] Test loading/empty states

---

## 🚀 **NEXT STEPS**

1. ✅ Created `/utils/formatters.ts`
2. Create comprehensive fix for all pages
3. Test with real wallet and data
4. Document final status
5. Deploy to production

**Let's make it happen! 🎯**


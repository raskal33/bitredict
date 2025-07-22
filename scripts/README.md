# Faucet Debugging Scripts

This directory contains scripts to debug and verify the faucet functionality.

## 📋 Available Scripts

### 1. `check-faucet-status.js`
**Command:** `npm run check-faucet`

**Purpose:** Direct on-chain verification of faucet contract state

**What it checks:**
- ✅ RPC connection to Somnia Network
- ✅ Contract deployment and accessibility
- ✅ Faucet balance and token availability
- ✅ Active/inactive status
- ✅ User claim statistics
- ✅ Network health and gas prices

**Output example:**
```
🔍 Checking Faucet Status on Somnia Network...

✅ Connected to Somnia Network
📦 Current Block: 1234567

📋 Faucet Contract Details:
   Address: 0x1656712131BB07dDE6EeC7D88757Db24782cab71
   BITR Token: 0x4b10fBFFDEE97C42E29899F47A2ECD30a38dBf2C

📊 Faucet Statistics:
   Balance: 20000000.0 BITR
   Total Distributed: 0.0 BITR
   User Count: 0
   Active: ✅ YES

🔧 Faucet State:
   Active: ✅ YES
   Has Sufficient Balance: ✅ YES
   Max Possible Claims: 1000

💰 Token Balance Check:
   Faucet BITR Balance: 20000000.0 BITR
   Possible Claims: 1000

🎯 Summary:
   ✅ FAUCET IS ACTIVE AND HAS SUFFICIENT BALANCE
```

### 2. `debug-faucet-frontend.js`
**Command:** `npm run debug-faucet`

**Purpose:** Comprehensive frontend integration debugging

**What it checks:**
- ✅ Environment variable configuration
- ✅ Contract file existence and ABI structure
- ✅ RPC connectivity and network health
- ✅ Contract call functionality
- ✅ Frontend hook simulation
- ✅ Root cause analysis

**Output example:**
```
🔍 Faucet Frontend Debug Script
==================================================

🔧 Frontend Configuration Check:

📋 Environment Variables:
   NEXT_PUBLIC_FAUCET_ADDRESS: 0x1656712131BB07dDE6EeC7D88757Db24782cab71
   NEXT_PUBLIC_BITR_TOKEN_ADDRESS: 0x4b10fBFFDEE97C42E29899F47A2ECD30a38dBf2C
   ✅ All contract addresses match deployment

📁 Contract Files Check:
   ✅ contracts/abis/BitrFaucet.json
   ✅ contracts/abis/BitredictToken.json
   ✅ contracts/index.ts
   ✅ config/wagmi.ts
   ✅ hooks/useFaucet.ts

📋 ABI Function Check:
   getFaucetStats: ✅
   faucetActive: ✅

🌐 RPC Connection Test:
   ✅ Connected to Somnia Network
   📦 Current Block: 1234567
   ⛽ Gas Price: 0.000000001 gwei
   🔗 Network ID: 50312

📞 Contract Call Tests:
🔍 Testing getFaucetStats...
   ✅ getFaucetStats successful
   📊 Balance: 20000000.0 BITR
   📊 Total Distributed: 0.0 BITR
   📊 User Count: 0
   📊 Active: ✅ YES

🎭 Frontend Hook Simulation:
📊 Simulated FaucetStats:
   Balance: 20000000.0 BITR
   Total Distributed: 0.0 BITR
   User Count: 0
   Active: ✅ YES

🎯 Claim Status Logic:
   Faucet Active: ✅
   Has Sufficient Balance: ✅

📝 Claim Status: "Ready to claim"

🔍 Issue Analysis:
   ✅ Faucet should work correctly
   💡 Frontend issue might be RPC connectivity or data loading
```

### 3. `add-faucet-debug.js`
**Commands:** 
- `npm run add-faucet-debug` - Add debug logging to frontend
- `npm run remove-faucet-debug` - Remove debug logging

**Purpose:** Add temporary console.log statements to the useFaucet hook for browser debugging

**What it does:**
- ✅ Creates backup of original hook
- ✅ Adds comprehensive debug logging
- ✅ Logs all faucet-related data to browser console
- ✅ Can restore original hook when done

## 🚀 Usage

### Quick Status Check
```bash
npm run check-faucet
```

### Full Frontend Debug
```bash
npm run debug-faucet
```

### Add Browser Debugging
```bash
# Add debug logging to frontend
npm run add-faucet-debug

# Start development server
npm run dev

# Open browser, go to /faucet, check console

# Remove debug logging when done
npm run remove-faucet-debug
```

## 🔍 Troubleshooting Guide

### If "Faucet is inactive" error:

1. **Run status check:**
   ```bash
   npm run check-faucet
   ```

2. **If faucet is actually inactive:**
   - Call `setFaucetActive(true)` from owner account
   - Use the deployer wallet: `0x483fc7FD690dCf2a01318282559C389F385d4428`

3. **If faucet has insufficient balance:**
   - Transfer more BITR tokens to faucet contract
   - Required: 20,000 BITR per claim

4. **If RPC issues:**
   - Check network connectivity
   - Verify Somnia RPC endpoint is accessible
   - Try alternative RPC if available

### If frontend shows wrong data:

1. **Add browser debugging:**
   ```bash
   npm run add-faucet-debug
   npm run dev
   ```

2. **Check browser console:**
   - Open developer tools (F12)
   - Go to Console tab
   - Navigate to /faucet page
   - Look for "🔍 Faucet Debug Info" logs

3. **Compare with on-chain data:**
   ```bash
   npm run check-faucet
   ```

## 📊 Expected Results

### ✅ Healthy Faucet:
- Active: `true`
- Balance: `20000000.0 BITR` (or more)
- Has Sufficient Balance: `true`
- Max Possible Claims: `1000` (or more)

### ❌ Common Issues:
- **Inactive faucet:** `Active: false` → Call `setFaucetActive(true)`
- **Insufficient balance:** `Balance: 0.0 BITR` → Transfer tokens
- **RPC issues:** Connection failures → Check network
- **ABI issues:** Function not found → Update contract artifacts

## 🛠️ Dependencies

These scripts require:
- `ethers` library (v6)
- Node.js environment
- Access to Somnia RPC endpoint
- Valid contract addresses

## 📝 Notes

- Scripts are safe to run multiple times
- Debug logging can be safely added/removed
- All scripts create backups when modifying files
- Scripts use read-only contract calls (no transactions) 
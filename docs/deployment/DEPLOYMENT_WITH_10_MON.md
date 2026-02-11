# DEPLOYMENT WITH 10 MON - FEASIBILITY ANALYSIS

## 💰 Available Resources
- **MON Available:** 10 MON
- **GUILT Available:** 666,652,610 GUILT ✅

## 📊 Adjusted Deployment Plan

### Per-Bot Allocation
- **MON per bot:** 0.5 MON (reduced from 1.0)
- **GUILT per bot:** ~105-125 GUILT (unchanged)

### Gas Cost Analysis
```
Session Creation Gas Cost:
- Gas Limit: 7,000,000 gas
- Testnet Gas Price: ~100-150 gwei average

Worst Case Scenario (150 gwei):
- Cost = 7,000,000 × 150 = 1,050,000,000 gwei
- Cost = 1.05 MON per session creation

Best Case Scenario (50 gwei):
- Cost = 7,000,000 × 50 = 350,000,000 gwei
- Cost = 0.35 MON per session creation

With 0.5 MON per bot:
- Sessions possible at 150 gwei: 0 (need 1.05 MON) ❌
- Sessions possible at 100 gwei: 0 (need 0.70 MON) ❌
- Sessions possible at 50 gwei: 1 session ✅
```

## ⚠️ RISK ASSESSMENT

### Current Testnet Gas Price Check
We need to check current gas price before deploying. If gas price > 70 gwei, 0.5 MON won't be enough per bot.

### Recommendation: Deploy in Batches

#### Option 1: Deploy 10 Bots (Safer)
```
Total Cost: 10 bots × 0.5 MON = 5 MON
Reserve: 5 MON for contingencies
Risk: LOW
Games per hour: 25-30 (still good for demo)
```

#### Option 2: Deploy All 20 Bots (Aggressive)
```
Total Cost: 20 bots × 0.5 MON = 10 MON
Reserve: 0 MON
Risk: MEDIUM-HIGH
- If even one transaction fails, can't retry
- If gas price spikes, sessions fail
Games per hour: 50+ (ideal for demo)
```

#### Option 3: Deploy 14 Bots (Balanced)
```
Total Cost: 14 bots × 0.5 MON = 7 MON
Reserve: 3 MON for refills/retries
Risk: LOW-MEDIUM
Games per hour: 35-40 (good for demo)
```

## ✅ RECOMMENDED APPROACH

**Deploy 14 bots with 3 MON reserve:**

1. Check current gas price first
2. If gas < 70 gwei → Deploy 14 bots
3. Keep 3 MON reserve for:
   - Failed transaction retries
   - Mid-demo refills if needed
   - Emergency contingencies

## 🚀 DEPLOYMENT STEPS

### Step 1: Check Gas Price
```bash
cd apps/web/scripts/bots
npx tsx check-gas-price.ts
```

**Decision Matrix:**
- Gas < 50 gwei → Deploy all 20 bots ✅
- Gas 50-70 gwei → Deploy 14 bots ⚠️
- Gas > 70 gwei → Deploy 10 bots or wait ❌

### Step 2: Modify Deployment (if needed)

To deploy only first N bots, edit `spawn-bot-swarm.ts`:

```typescript
// Add after line 62:
let botsDeployed = 0;
const MAX_BOTS = 14; // Change this number

// Modify loop starting at line 63:
for (const bot of personalities) {
    if (botsDeployed >= MAX_BOTS) {
        console.log(`Reached max bots (${MAX_BOTS}). Stopping.`);
        break;
    }

    // ... rest of code ...

    botsDeployed++;
}
```

### Step 3: Fund Bots (Updated)
```bash
npx tsx fund-bots.ts
```

This will fund each bot with:
- 0.5 MON
- ~105-125 GUILT

### Step 4: Spawn Sessions
```bash
npx tsx spawn-bot-swarm.ts
```

## 📈 SUCCESS METRICS

### With 14 Bots
- **Games per hour:** 35-40 games
- **Leaderboard entries:** 10-14 entries
- **Strategy diversity:**
  - Berzerker: 5-6 bots
  - Merchant: 5-6 bots
  - Disciple: 3-4 bots
- **Demo readiness:** ✅ Sufficient activity

### Demo Day Win Condition
- ✅ 35+ games per hour (exceeds 50% of target)
- ✅ Leaderboard populated
- ✅ Live feed active
- ✅ All 3 strategies visible
- ✅ Reserve MON for emergencies

## 🔧 QUICK ADJUSTMENTS

If you want to deploy all 20 bots with 0.5 MON each:

**Pros:**
- Maximum activity (50+ games/hour)
- Full leaderboard
- Impressive demo presence

**Cons:**
- No reserve for failures
- High risk if gas spikes
- Can't refill during demo

**When to choose this:**
- Gas price is very low (< 50 gwei)
- You're confident in setup
- Can't get more MON before demo

## 💡 FINAL RECOMMENDATION

**Deploy 14 bots now, keep 3 MON reserve.**

If everything works perfectly and you have time, you can:
1. Deploy remaining 6 bots later
2. Use reserve to refill bots mid-demo
3. Save for emergency repairs

---

**Status:** Ready to deploy with 10 MON
**Risk Level:** 🟡 MEDIUM (with 14-bot approach)
**Demo Readiness:** ✅ SUFFICIENT

Would you like to proceed with 14 bots, or go all-in with 20?
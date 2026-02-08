# Scanner Performance Issue - Technical Summary

**Date:** 2026-02-04  
**Status:** 🟡 Functional but Too Slow for Production  
**Impact:** Users wait 5-15 seconds per confession

---

## The Problem

**Current Flow:**
```
User submits wallet → Scan blockchain (5-15s) → Generate roast → Return
```

**Why It's Slow:**
1. **Monad RPC Limit:** Can only fetch 10 blocks per API call (hard limit)
2. **Current Scan:** 1,000 blocks = 100 sequential RPC calls
3. **Network Latency:** Each call = ~50-150ms
4. **Total Time:** 100 calls × 100ms = **10+ seconds** ⏱️

---

## Root Cause

**Monad-Specific Issue:**
- Monad blocks are MUCH larger than Ethereum blocks
- RPC enforces strict 10-block limit per `eth_getLogs` request
- No batching/parallel requests allowed (causes rate limit errors)
- Must scan sequentially: Block 1-10 → 11-20 → 21-30 → ...

**Code Location:** `apps/api/src/services/blockchain.ts`

```typescript
// Current approach (only option with direct RPC)
for (let i = 0; i < 100; i++) {
  await fetchBlocks(i * 10, i * 10 + 10);  // Sequential, slow
}
```

---

## Production Solutions (For CTO Review)

### Option 1: Database Caching ⚡ (Quickest to implement)

**Strategy:** Cache scan results, only fetch NEW blocks

**Implementation:**
```sql
-- Store last scan
CREATE TABLE wallet_scans (
  wallet_address TEXT PRIMARY KEY,
  last_scanned_block INTEGER,
  last_scan_timestamp TIMESTAMP,
  cached_sins JSONB
);

-- First scan: Slow (10s, one-time)
-- Future scans: Fast (<1s, only new blocks)
```

**Pros:**
- ✅ Easy to implement (already have Supabase)
- ✅ Repeat users = instant (90% of users)
- ✅ Works with existing RPC

**Cons:**
- ⚠️ First-time users still wait 10s
- ⚠️ Need cache invalidation strategy

**Implementation Time:** 2-3 hours

---

### Option 2: The Graph Protocol 🚀 (Best long-term)

**What:** Pre-indexed blockchain data with GraphQL API

**Implementation:**
```graphql
query {
  transfers(where: { to: "0x..." }) {
    token { symbol }
    amount
    timestamp
  }
}
```

**Pros:**
- ✅ **Instant queries** (<100ms)
- ✅ All historical data readily available
- ✅ No RPC limits

**Cons:**
- ⚠️ Monad might not have The Graph support yet (new chain)
- ⚠️ Need to deploy/find subgraph
- ⚠️ Setup complexity

**Implementation Time:** 1-2 days (if Monad supported)

---

### Option 3: Custom Indexer 🏗️ (Full control)

**Tools:** Ponder, SubQuery, or custom solution

**Architecture:**
```
Monad RPC → Background Indexer Service → PostgreSQL
                                           ↓
                            User Request → DB Query (instant)
```

**Pros:**
- ✅ **Fastest possible** (<50ms)
- ✅ Full control over data
- ✅ Can index custom metrics

**Cons:**
- ⚠️ Infrastructure cost (~$20-50/month)
- ⚠️ Requires separate service
- ⚠️ Ongoing maintenance

**Implementation Time:** 3-5 days

---

### Option 4: Reduce Scan Range 🎯 (Temporary fix)

**Change:** Scan only 100 blocks instead of 1,000

**Impact:**
- Scan time: 10s → **1 second** ✅
- Coverage: 1.6 hours → **10 minutes**
- Trade-off: Might miss older sins

**Code Change:**
```typescript
// apps/api/src/services/blockchain.ts
blocksBack: number = 100  // Was 1,000
```

**Pros:**
- ✅ Instant fix (1 line change)
- ✅ Good enough for active wallets
- ✅ Demo-ready

**Cons:**
- ⚠️ Inactive wallets show "no sins"
- ⚠️ Not a real solution

**Implementation Time:** 30 seconds

---

## Recommended Approach

**For Hackathon (This Week):**
```
1. Use Option 4 (100 blocks) → 1 second scans
2. Add loading message: "Analyzing your sins..." 
3. Works great for demos
```

**For Launch (Next 2 Weeks):**
```
1. Implement Option 1 (Database Caching)
2. First scan: Show progress bar (10s tolerable once)
3. Future scans: Instant
4. 90% of users happy
```

**For Scale (Month 1-2):**
```
1. Deploy Option 2 (The Graph) or Option 3 (Custom Indexer)
2. All scans instant
3. Can handle millions of users
```

---

## CTO Questions to Consider

1. **Is The Graph available on Monad?** (Check Monad docs)
2. **What's our expected user retention?** (High = caching works great)
3. **Budget for infrastructure?** (May justify custom indexer)
4. **Hackathon deadline?** (Might just use 100-block scan for now)

---

## Performance Comparison

| Solution | First Scan | Repeat Scan | Setup | Monthly Cost |
|----------|-----------|-------------|-------|--------------|
| **Current (1K blocks)** | 10s | 10s | ✅ Done | $0 |
| **Reduced (100 blocks)** | 1s | 1s | 30 sec | $0 |
| **Database Caching** | 10s | 0.1s | 2-3 hrs | $0 |
| **The Graph** | 0.1s | 0.1s | 1-2 days | $0-50 |
| **Custom Indexer** | 0.05s | 0.05s | 3-5 days | $20-50 |

---

## Immediate Action Item

**For your CTO:**
- Review these options
- Decide on timeline vs. approach
- If hackathon is urgent → Use Option 4 (100 blocks)
- If launch is soon → Build Option 1 (Caching)
- If scaling matters → Research Option 2/3

**Current Status:**
- API works perfectly, just slow
- All other features complete (roasting, images, QR codes)
- This is the only bottleneck

---

**Bottom Line:** The scanner works, but blockchain data fetching is inherently slow with direct RPC. Production apps MUST use indexing solutions.

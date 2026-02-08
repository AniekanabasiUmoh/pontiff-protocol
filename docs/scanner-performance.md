# Scanner Performance Optimization Guide

## Current Performance Issue

**Problem:** Scanning is slow due to Monad RPC's 100-block limit requiring sequential API calls.

**Current Speed:**
- 10,000 blocks = 100 chunks = 10-20 seconds ❌
- 1,000 blocks = 10 chunks = 1-2 seconds ✅

---

## Quick Fixes (Implemented)

### ✅ Reduced Default Scan Range

**Change:** `blocksBack: 10_000` → `blocksBack: 1_000`

**Impact:**
- Scan time: 10-20s → **1-2s** (10x faster!)
- Coverage: ~16 hours → ~1.6 hours
- Good enough for: MVP, demos, active wallets

**File:** `apps/api/src/services/blockchain.ts`

---

## Production Solutions

### Option 1: Smart Caching Strategy

**Implementation:**
```typescript
// First scan: Full 90 days (one-time cost)
// Cache results in Supabase
// Subsequent scans: Only new blocks since last scan

export async function smartScanWallet(wallet: string) {
  const lastScan = await getLastScanBlock(wallet);
  
  if (!lastScan) {
    // First time: Full scan (slow)
    return await fetchWalletTransfers(wallet, 90_days_blocks);
  } else {
    // Follow-up: Only new blocks (fast!)
    const newBlocks = currentBlock - lastScan;
    return await fetchWalletTransfers(wallet, newBlocks);
  }
}
```

**Result:** First scan = 5 minutes, future scans = 1 second!

---

### Option 2: Use The Graph Protocol

**What it is:** Pre-indexed blockchain data, query with GraphQL

**Implementation:**
```typescript
const query = `{
  transfers(where: { to: "${wallet}" }) {
    amount
    token { symbol }
    timestamp
  }
}`;

const response = await fetch('https://api.thegraph.com/subgraphs/...', {
  method: 'POST',
  body: JSON.stringify({ query })
});

// Result: INSTANT ⚡
```

**Pros:**
- ✅ Instant queries (100ms)
- ✅ No RPC limits
- ✅ Historical data readily available

**Cons:**
- ⚠️ Need to deploy subgraph (or find existing one for Monad)
- ⚠️ Monad might not have The Graph support yet (new chain)

---

### Option 3: Run Your Own Indexer

**Tools:**
- **Ponder**: Fast blockchain indexer
- **SubQuery**: Indexing framework
- **Custom DB**: Store transfers in Postgres/Supabase

**Architecture:**
```
Monad RPC → Indexer Service → PostgreSQL
                ↓
         User Request → Database → Instant Results
```

**Pros:**
- ✅ Full control
- ✅ Fastest possible queries
- ✅ Can add custom logic

**Cons:**
- ⚠️ Infrastructure cost
- ⚠️ Setup complexity

---

### Option 4: Parallel Chunk Fetching

**Current:** Sequential (one chunk at a time)
```typescript
for (let i = 0; i < chunks; i++) {
  await fetchChunk(i); // Wait for each
}
```

**Optimized:** Parallel (multiple chunks at once)
```typescript
const PARALLEL_LIMIT = 5;

for (let i = 0; i < chunks; i += PARALLEL_LIMIT) {
  const batch = [];
  for (let j = 0; j < PARALLEL_LIMIT && i + j < chunks; j++) {
    batch.push(fetchChunk(i + j));
  }
  await Promise.all(batch); // Fetch 5 at once
}
```

**Result:** 5x faster (but risk of rate limiting)

---

## Recommended Approach for Hackathon

**Phase 1 (NOW):** ✅ Use 1K blocks (fast enough for demo)

**Phase 2 (Before launch):** Implement caching
```typescript
1. Scan wallet → Store in Supabase
2. Next scan → Only check new blocks
3. Result: Instant for repeat users
```

**Phase 3 (Production):** Use The Graph or custom indexer
- Best UX (instant)
- Scalable to millions of users

---

## Configuration Options

You can make block range configurable:

```typescript
// In scanner route
router.get('/scan/:address', async (req, res) => {
  const { address } = req.params;
  const blocksBack = parseInt(req.query.blocks as string) || 1000;
  
  const result = await scanWallet(address, blocksBack);
  // ...
});
```

**Usage:**
```
GET /api/scan/0x123?blocks=1000   // Fast (1-2s)
GET /api/scan/0x123?blocks=10000  // Slower (10-20s)
GET /api/scan/0x123?blocks=100    // Ultra fast (0.1s)
```

---

## Performance Comparison

| Approach | First Scan | Repeat Scan | Setup Cost |
|----------|-----------|-------------|------------|
| **Current (1K blocks)** | 1-2s | 1-2s | ✅ None |
| **Caching** | 1-2s | 0.1s | ⚠️ Medium |
| **The Graph** | 0.1s | 0.1s | ⚠️ High |
| **Parallel (5x)** | 0.4s | 0.4s | ✅ Low |

---

## Bottom Line

**For your hackathon:**
- ✅ 1,000 blocks is perfect (1-2 seconds)
- ✅ Demo will feel snappy
- ✅ Real wallets with activity will show sins

**For production:**
- Use caching + The Graph
- Or build custom indexer
- Target: <100ms response time

---

**Current Status:** ✅ Optimized to 1K blocks (10x faster!)

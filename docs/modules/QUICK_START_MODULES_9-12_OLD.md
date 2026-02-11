# 🧪 THE PONTIFF - COMPREHENSIVE TESTING GUIDE (Windows Edition)

## 🚀 Getting Started

### Prerequisites
1.  **Environment Variables:**
    - Ensure `.env.local` has `MOCK_REDIS=true` and `MOCK_VALIDATION=true` to bypass infrastructure blockers.
    - RPC URL should be `https://monad-testnet.drpc.org`.
2.  **Database Fixes:**
    - If you see "column not found" errors, run `recreate_confessions_table.sql` and `recreate_world_events.sql` in Supabase.

### 1. Start the System
You need **ONLY ONE** terminal for the API server:

**Terminal 1: Backend API Server**
```powershell
cd apps/api
npm install
npm run dev
# Expected: 🔥 Pontiff API running on port 3001
```

**✅ Success Indicators:**
```
⚠️ Twitter API keys missing - Running in MOCK/DRY-RUN mode
🔥 Pontiff API running on port 3001
⛪ The Cathedral is open for business
📡 Scanner ready at /api/scan/:address
🔥 Roaster ready at /api/confess
🐦 Share service ready at /api/share
🏆 Leaderboards ready at /api/leaderboard/:type
🛡️ Security middleware active
```

**Note:** The Next.js web app (apps/web) appears to be serverless/static or not in use for API routes. All APIs are served from `apps/api` on port 3001.

---

## ⚡ Quick Health Check

**Before running tests, verify the API is alive:**
```powershell
curl http://localhost:3001/health
```

**Expected Response:**
```json
{
  "status": "The Pontiff is watching",
  "timestamp": "2026-02-07T...",
  "services": {
    "database": "connected",
    "blockchain": "connected",
    "ai": "ready",
    "priceOracle": "cascade (oracle→dex→mock)",
    "social": "ready (mock/live)"
  }
}
```

---

## 🧪 COMPREHENSIVE API TESTING

All endpoints are served from `apps/api` on **port 3001**. Use these Windows-compatible curl commands.

### 📊 MODULE 9: Competitor Agent Detection

**1. Scan for Competitor Agents**
```cmd
curl -X POST http://localhost:3001/api/competitors/scan ^
  -H "Content-Type: application/json"
```
**Expected:** Returns list of detected competitor agents with their metrics.

**2. Get All Competitors**
```cmd
curl http://localhost:3001/api/competitors
```
**Expected:** JSON array of all competitor agents in the database.

**3. Get Specific Competitor by Handle**
```cmd
curl http://localhost:3001/api/competitors/@zerebro
```
**Expected:** Details for the specific competitor agent.

**4. Update Competitor Metrics**
```cmd
curl -X PUT http://localhost:3001/api/competitors/{id}/metrics ^
  -H "Content-Type: application/json" ^
  -d "{\"market_cap\": 1000000, \"holders\": 500, \"treasury_balance\": 50000}"
```
**Expected:** `{"success": true, "message": "Metrics updated"}`

---

### 🗣️ MODULE 10: Auto-Debate System

**1. Get All Debates**
```cmd
curl http://localhost:3001/api/debates
```
**Expected:** List of all debates (active and completed).

**2. Get Specific Debate with Exchanges**
```cmd
curl http://localhost:3001/api/debates/{debate_id}
```
**Expected:** Full debate details including all exchanges.

**3. Initiate New Debate**
```cmd
curl -X POST http://localhost:3001/api/debates/initiate ^
  -H "Content-Type: application/json" ^
  -d "{\"competitor_handle\": \"@zerebro\", \"their_tweet_id\": \"1234567890\", \"their_tweet_text\": \"I am superior\"}"
```
**Expected:** New debate created with initial Pontiff response.

**4. Continue Existing Debate**
```cmd
curl -X POST http://localhost:3001/api/debates/{debate_id}/continue ^
  -H "Content-Type: application/json" ^
  -d "{\"their_argument\": \"Your faith is weak\", \"their_tweet_id\": \"9876543210\", \"competitor_handle\": \"@zerebro\"}"
```
**Expected:** Debate continued with new exchange.

**5. End Debate**
```cmd
curl -X POST http://localhost:3001/api/debates/{debate_id}/end ^
  -H "Content-Type: application/json" ^
  -d "{\"status\": \"won\", \"reason\": \"Opponent conceded\"}"
```
**Expected:** Debate status updated to completed.

**6. Get Active Debates for Competitor**
```cmd
curl http://localhost:3001/api/debates/competitor/{competitor_id}
```
**Expected:** List of active debates with specific competitor.

---

### 🎯 MODULE 11: Conversion Tracking

**1. Get All Conversions**
```cmd
curl http://localhost:3001/api/conversions
```
**Expected:** List of all tracked conversions.

**2. Get Conversion Statistics**
```cmd
curl http://localhost:3001/api/conversions/stats
```
**Expected:** Aggregate conversion metrics and analytics.

**3. Get Conversions for Specific Competitor**
```cmd
curl http://localhost:3001/api/conversions/competitor/{competitor_id}
```
**Expected:** All conversions attributed to this competitor.

**4. Track All Conversions (Manual Trigger)**
```cmd
curl -X POST http://localhost:3001/api/conversions/track ^
  -H "Content-Type: application/json"
```
**Expected:** Scans all competitors and tracks new conversions.

**5. Track Conversions for Specific Competitor**
```cmd
curl -X POST http://localhost:3001/api/conversions/track/@zerebro ^
  -H "Content-Type: application/json"
```
**Expected:** Tracks conversions for specified competitor only.

**6. Announce Conversion on Twitter**
```cmd
curl -X POST http://localhost:3001/api/conversions/{conversion_id}/announce ^
  -H "Content-Type: application/json"
```
**Expected:** Posts conversion announcement to Twitter (or mock mode).

---

### 📈 MODULE 12: Unified Dashboard

**1. Get Dashboard Data**
```cmd
curl http://localhost:3001/api/dashboard
```
**Expected:** Comprehensive dashboard with all warfare metrics.

---

### 🔥 LEGACY ENDPOINTS (Vatican/Confession)

**1. Scan Agent Wallet**
```cmd
curl http://localhost:3001/api/scan/0x1234567890123456789012345678901234567890
```
**Expected:** Sin analysis for the wallet address.

**2. Confess (Trigger Roasting)**
```cmd
curl -X POST http://localhost:3001/api/confess ^
  -H "Content-Type: application/json" ^
  -d "{\"agentWallet\": \"0x1234567890123456789012345678901234567890\"}"
```
**Expected:** Confession record with roast and indulgence price.

**3. Share Confession**
```cmd
curl -X POST http://localhost:3001/api/share ^
  -H "Content-Type: application/json" ^
  -d "{\"confessionId\": \"some-uuid-here\"}"
```
**Expected:** Share link or Twitter post confirmation.

**4. Get Leaderboard**
```cmd
curl http://localhost:3001/api/leaderboard/sinners
```
**Types:** `sinners`, `redeemed`, `indulgences`

---

## 🐛 Common Errors & Solutions

| Error | Solution |
|-------|----------|
| `ECONNREFUSED` | API server not running. Start with `cd apps/api && npm run dev` |
| `404 Not Found` | Check endpoint path. All APIs are at `localhost:3001/api/*` |
| `column ... not found` | Database schema mismatch. Run SQL fix scripts in Supabase. |
| `400 Bad Request` | Check server logs for validation errors. Verify JSON syntax. |
| `500 Internal Server Error` | Check API server logs. May be missing env vars or DB connection issue. |
| `Twitter API keys missing` | This is NORMAL. System runs in MOCK mode. No action needed. |

---

## 🎯 RECOMMENDED TEST SEQUENCE

**Run these in order to validate all modules:**

1. **Health Check**
   ```powershell
   curl http://localhost:3001/health
   ```

2. **Module 9: Scan for Competitors**
   ```powershell
   curl -X POST http://localhost:3001/api/competitors/scan -H "Content-Type: application/json"
   ```

3. **Module 9: List All Competitors**
   ```powershell
   curl http://localhost:3001/api/competitors
   ```

4. **Module 10: Initiate Debate** (use a competitor handle from step 3)
   ```powershell
   curl -X POST http://localhost:3001/api/debates/initiate -H "Content-Type: application/json" -d "{\"competitor_handle\": \"@zerebro\"}"
   ```

5. **Module 10: List All Debates**
   ```powershell
   curl http://localhost:3001/api/debates
   ```

6. **Module 11: Track Conversions**
   ```powershell
   curl -X POST http://localhost:3001/api/conversions/track -H "Content-Type: application/json"
   ```

7. **Module 11: Get Conversion Stats**
   ```powershell
   curl http://localhost:3001/api/conversions/stats
   ```

8. **Module 12: View Dashboard**
   ```powershell
   curl http://localhost:3001/api/dashboard
   ```

9. **Legacy: Test Confession**
   ```powershell
   curl -X POST http://localhost:3001/api/confess -H "Content-Type: application/json" -d "{\"agentWallet\": \"0x1234567890123456789012345678901234567890\"}"
   ```

10. **Legacy: Get Leaderboard**
    ```powershell
    curl http://localhost:3001/api/leaderboard/sinners
    ```

---

## 📝 SUCCESS CRITERIA

**For each module, you should see:**

- **Module 9 (Competitors):** List of AI agents detected, metrics populated
- **Module 10 (Debates):** Debate records created, exchanges tracked, status updates working
- **Module 11 (Conversions):** Conversion events logged, stats calculated, announcements ready
- **Module 12 (Dashboard):** Unified view of all warfare data, metrics aggregated

**Red Flags to Watch For:**
- Empty arrays when data should exist (check database)
- Null/undefined fields in responses (schema mismatch)
- Timeout errors (RPC connection or database issues)
- 500 errors (check API server logs immediately)

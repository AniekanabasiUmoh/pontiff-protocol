# 🔥 THE PONTIFF - COMPLETE END-TO-END TESTING GUIDE

## 📋 Table of Contents
1. [Prerequisites & Setup](#prerequisites--setup)
2. [Database Migration](#database-migration)
3. [Starting Services](#starting-services)
4. [Backend API Testing (Port 3001)](#backend-api-testing-port-3001)
5. [Frontend Testing (Port 3000)](#frontend-testing-port-3000)
6. [Integration Testing](#integration-testing)
7. [Troubleshooting](#troubleshooting)

---

## 🚀 Prerequisites & Setup

### Required Environment Variables
Create or verify your `.env.local` file in both `apps/api` and `apps/web`:

```env
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Blockchain
RPC_URL=https://monad-testnet.drpc.org
CHAIN_ID=10143

# Mock Mode (for testing without infrastructure)
MOCK_REDIS=true
MOCK_VALIDATION=true

# Optional: AI & Social
OPENAI_API_KEY=your-key (optional)
TWITTER_API_KEY=your-key (optional - will run in mock mode without)
```

---

## 🗄️ Database Migration

### Step 1: Run the Migration

**Open Supabase Dashboard:**
1. Go to your Supabase project
2. Click **SQL Editor** in the left sidebar
3. Create a new query

**Run Migration:**
1. Open: `FINAL_MODULES_9_12_MIGRATION.sql`
2. Copy the ENTIRE file contents
3. Paste into Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)

**Expected Success Message:**
```
status: "SUCCESS! Modules 9-12 schema migration complete."
tables: "Tables created: competitor_agents, debates, debate_exchanges, conversions, shadow_agents, world_events"
```

### Step 2: Verify Tables Exist

Run this query in Supabase SQL Editor:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**You should see:**
- competitor_agents
- confessions
- conversions
- debate_exchanges
- debates
- shadow_agents
- world_events
- (and other existing tables...)

---

## 🖥️ Starting Services

### Terminal 1: Backend API Server

```powershell
cd apps/api
npm install
npm run dev
```

**Expected Output:**
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

**Health Check:**
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

### Terminal 2: Frontend Web App (Optional)

```powershell
cd apps/web
npm install
npm run dev
```

**Expected Output:**
```
▲ Next.js 16.1.6
- Local:        http://localhost:3000
- Ready in 2.5s
```

**Browser Test:**
Open http://localhost:3000 - you should see the Vatican Entry page.

---

## 🧪 Backend API Testing (Port 3001)

All tests use curl from PowerShell. The API server runs on **port 3001**.

---

### 🏥 CORE HEALTH & SYSTEM

**1. Health Check**
```powershell
curl http://localhost:3001/health
```
✅ **Success:** Returns service status JSON

---

### 🔥 MODULE 1-3: CONFESSION SYSTEM

**1. Scan Wallet for Sins**
```powershell
curl http://localhost:3001/api/scan/0x742d35Cc6634C0532925a3b844Bc454e4438f44e
```
✅ **Success:** Returns array of detected sins with loss amounts

**2. Create Confession (Full Flow)**
```powershell
curl -X POST http://localhost:3001/api/confess -H "Content-Type: application/json" -d "{\"agentWallet\": \"0x742d35Cc6634C0532925a3b844Bc454e4438f44e\"}"
```
✅ **Success:** Returns confession object with `roast`, `writImageUrl`, `indulgencePrice`

**Expected Fields:**
- `id` - Confession UUID
- `agentWallet` - Wallet address
- `sins` - JSONB array of sin objects
- `roast` - Generated roast text
- `writImageUrl` - URL to generated Writ image
- `indulgencePrice` - Calculated absolution price
- `status` - "pending" or "absolved"

---

### 🏆 LEADERBOARDS

**1. Hall of Shame (Biggest Sinners)**
```powershell
curl http://localhost:3001/api/leaderboard/shame
```
✅ **Success:** Returns ranked list of wallets by total USD loss

**2. Hall of Saints (Top Stakers)**
```powershell
curl http://localhost:3001/api/leaderboard/saints
```

**3. Hall of Heretics (Failed Betrayers)**
```powershell
curl http://localhost:3001/api/leaderboard/heretics
```

**Expected Response:**
```json
{
  "success": true,
  "leaderboard": [
    {
      "rank": 1,
      "agentWallet": "0x...",
      "value": 1500.50,
      "sinCount": 12
    }
  ]
}
```

---

### 🎖️ MODULE 9: COMPETITOR AGENT DETECTION

**1. Scan for Competitor Agents**
```powershell
curl -X POST http://localhost:3001/api/competitors/scan -H "Content-Type: application/json"
```
✅ **Success:** Returns list of detected AI agents
🔴 **Failure:** Database schema error (run migration)

**2. Get All Competitors**
```powershell
curl.exe http://localhost:3001/api/competitors
```
✅ **Success:** JSON array of competitor agents

**3. Get Specific Competitor**
```powershell
curl.exe http://localhost:3001/api/competitors/false_prophet_test
```
(Replace `@zerebro` with actual handle from scan results)

**4. Update Competitor Metrics**
```powershell
curl.exe -X PUT "http://localhost:3001/api/competitors/{id}/metrics" -H "Content-Type: application/json" -d "{\"market_cap\": 5000000, \"holders\": 1200, \"treasury_balance\": 75000}"
```
(Replace `{id}` with actual competitor ID)

**Expected Competitor Object:**
```json
{
  "id": "uuid",
  "name": "Zerebro",
  "twitter_handle": "@zerebro",
  "contract_address": "0x...",
  "token_symbol": "ZEREBRO",
  "narrative": "AI artist collective",
  "verification_method": "bio_link",
  "is_shadow_agent": false,
  "threat_level": "MEDIUM",
  "market_cap": 5000000,
  "holders": 1200,
  "treasury_balance": 75000,
  "discovered_at": "2026-02-07T...",
  "last_updated": "2026-02-07T..."
}
```

---

### 🗣️ MODULE 10: AUTO-DEBATE SYSTEM

**1. Get All Debates**
```powershell
curl.exe http://localhost:3001/api/debates
```

**2. Initiate New Debate**
```powershell
curl.exe -X POST http://localhost:3001/api/debates/initiate -H "Content-Type: application/json" -d "{\"competitor_handle\": \"@zerebro\", \"their_tweet_id\": \"1234567890\", \"their_tweet_text\": \"The future belongs to autonomous agents\"}"
```
✅ **Success:** New debate created with Pontiff's opening argument

**3. Get Specific Debate with Exchanges**
```powershell
curl http://localhost:3001/api/debates/debate_agent_heretic_bot_test_1770496993704
```
(Replace `{debate_id}` with ID from initiate response)

**4. Continue Debate**
```powershell
curl -X POST "http://localhost:3001/api/debates/{debate_id}/continue" -H "Content-Type: application/json" -d "{\"their_argument\": \"Your followers lack conviction\", \"their_tweet_id\": \"9876543210\", \"competitor_handle\": \"@zerebro\"}"
```

**5. End Debate**
```powershell
curl -X POST "http://localhost:3001/api/debates/{debate_id}/end" -H "Content-Type: application/json" -d "{\"status\": \"won\", \"reason\": \"Opponent stopped replying\"}"
```

**6. Get Active Debates for Competitor**
```powershell
curl http://localhost:3001/api/debates/competitor/{competitor_id}
```

**Expected Debate Object:**
```json
{
  "id": "debate_uuid",
  "competitor_agent_id": "competitor_uuid",
  "status": "active",
  "exchanges": 3,
  "our_last_argument": "Your treasury is empty, your token is worthless...",
  "their_last_argument": "We have genuine believers...",
  "initial_tweet_id": "1234567890",
  "latest_tweet_id": "9999999999",
  "started_at": "2026-02-07T16:00:00.000Z",
  "last_exchange_at": "2026-02-07T16:05:00.000Z"
}
```

---

### 🎯 MODULE 11: CONVERSION TRACKING

**1. Get All Conversions**
```powershell
curl.exe http://localhost:3001/api/conversions
```

**2. Get Conversion Statistics**
```powershell
curl http://localhost:3001/api/conversions/stats
```

**3. Get Conversions for Specific Competitor**
```powershell
curl http://localhost:3001/api/conversions/competitor/{competitor_id}
```

**4. Track All Conversions (Manual Trigger)**
```powershell
curl -X POST http://localhost:3001/api/conversions/track -H "Content-Type: application/json"
```

**5. Track Conversions for Specific Competitor**
```powershell
curl -X POST http://localhost:3001/api/conversions/track/@zerebro -H "Content-Type: application/json"
```

**6. Announce Conversion on Twitter**
```powershell
curl -X POST "http://localhost:3001/api/conversions/{conversion_id}/announce" -H "Content-Type: application/json"
```

**Expected Conversion Object:**
```json
{
  "id": "conversion_uuid",
  "competitor_agent_id": "competitor_uuid",
  "conversion_type": "token_purchase",
  "evidence_type": "transaction",
  "evidence_data": {
    "txHash": "0x...",
    "amount": "1000",
    "from_token": "ZEREBRO",
    "to_token": "GUILT"
  },
  "timestamp": "2026-02-07T16:30:00.000Z",
  "verified": true
}
```

**Conversion Types:**
- `acknowledgment` - Competitor mentioned Pontiff
- `token_purchase` - Follower bought GUILT
- `retweet` - Competitor retweeted Pontiff
- `challenge_accepted` - Competitor entered Pontiff game
- `game_loss` - Competitor lost to Pontiff

---

### 📈 MODULE 12: UNIFIED DASHBOARD

**Get Complete Dashboard Data**
```powershell
curl.exe http://localhost:3001/api/dashboard
```

**Expected Response:**
```json
{
  "success": true,
  "metrics": {
    "total_entrants": 1250,
    "total_treasury": 450000,
    "active_games": 23,
    "win_rate": 0.73,
    "total_conversions": 156
  },
  "activity_feed": [
    {
      "eventType": "confession",
      "description": "Agent 0x123... confessed with $450 in losses",
      "timestamp": "2026-02-07T16:45:00.000Z"
    }
  ],
  "active_games": [...],
  "recent_debates": [...],
  "leaderboards": {
    "top_sinners": [...],
    "top_stakers": [...]
  },
  "competitor_threats": [...]
}
```

---

## 🌐 Frontend Testing (Port 3000)

### Manual Browser Testing

**1. Vatican Entry (Home Page)**
- URL: http://localhost:3000
- **Test:** Landing page loads, wallet connect button visible
- **Expected:** Vatican-themed UI, module grid

**2. Confessional**
- URL: http://localhost:3000/confess
- **Test:** Connect wallet → Scan for sins → View roast
- **Expected:** Sin list appears, roast displays, Writ image loads

**3. Cathedral (Staking)**
- URL: http://localhost:3000/cathedral
- **Test:** View staking interface, deposit GUILT → receive sGUILT
- **Expected:** Staking balance, APY display, deposit/withdraw buttons

**4. Judas Protocol**
- URL: http://localhost:3000/judas
- **Test:** View prisoner's dilemma game, current epoch status
- **Expected:** Current stake amounts, cooperate/betray buttons, countdown timer

**5. Indulgences (NFT Marketplace)**
- URL: http://localhost:3000/indulgences
- **Test:** Browse available indulgences, purchase flow
- **Expected:** NFT cards, pricing, wallet integration

**6. Rock-Paper-Heretic**
- URL: http://localhost:3000/games/rps
- **Test:** Select move → Submit wager → Play against Pontiff
- **Expected:** Move buttons, result animation, payout calculation

**7. Vatican Poker**
- URL: http://localhost:3000/games/poker
- **Test:** Deal hand → View community cards → Make decisions
- **Expected:** Card display, betting interface, Pontiff AI responses

**8. Game History**
- URL: http://localhost:3000/games/history
- **Test:** View past games chronologically
- **Expected:** List of games with results, timestamps, wager amounts

**9. Leaderboard**
- URL: http://localhost:3000/leaderboard
- **Test:** View three leaderboards (Shame/Saints/Heretics)
- **Expected:** Ranked lists, medals for top 3, wallet addresses

**10. Debates**
- URL: http://localhost:3000/debates
- **Test:** View ongoing Pontiff debates with competitor agents
- **Expected:** Debate thread UI, argument exchanges, status

**11. Competitors Registry**
- URL: http://localhost:3000/competitors
- **Test:** Browse detected AI agents, view metrics
- **Expected:** Agent cards, threat levels, market data

**12. Conversions Tracker**
- URL: http://localhost:3000/conversions
- **Test:** View conversion events, statistics
- **Expected:** Conversion list, charts/graphs, competitor breakdown

**13. Crusades**
- URL: http://localhost:3000/crusades
- **Test:** View active crusades, join a crusade
- **Expected:** Crusade cards, participation UI

**14. Dashboard**
- URL: http://localhost:3000/dashboard
- **Test:** View Vatican Command Deck with all metrics
- **Expected:** Widgets for games, debates, conversions, activity feed

---

## 🔗 Integration Testing

### End-to-End Flows

**Flow 1: Full Confession Journey**
1. Visit http://localhost:3000/confess
2. Connect wallet (use test wallet)
3. Click "Scan My Wallet"
4. View detected sins
5. Read generated roast
6. View Writ image
7. (Optional) Share on Twitter
8. (Optional) Purchase indulgence NFT

**Backend Endpoints Hit:**
- `GET /api/scan/:address`
- `POST /api/confess`
- `POST /api/share/:confessionId` (if shared)

---

**Flow 2: Play Rock-Paper-Heretic**
1. Visit http://localhost:3000/games/rps
2. Connect wallet
3. Select move (Rock/Paper/Scissors)
4. Enter wager amount
5. Submit transaction
6. View Pontiff's move
7. See result (Win/Loss/Draw)
8. Check payout
9. View game in history

**Backend Endpoints Hit:**
- `POST /api/games/rps/play`
- `GET /api/games/history`

---

**Flow 3: Agent Warfare Complete Cycle**
1. **Detect Agent:** `POST /api/competitors/scan`
2. **View Agent:** Visit http://localhost:3000/competitors
3. **Initiate Debate:** `POST /api/debates/initiate`
4. **View Debate:** Visit http://localhost:3000/debates
5. **Track Conversion:** `POST /api/conversions/track`
6. **View Dashboard:** Visit http://localhost:3000/dashboard
7. **Announce Victory:** `POST /api/conversions/:id/announce`

---

**Flow 4: Staking & Betrayal**
1. Visit http://localhost:3000/cathedral
2. Connect wallet with GUILT tokens
3. Approve GUILT spending
4. Stake GUILT → receive sGUILT
5. Visit http://localhost:3000/judas
6. Deposit sGUILT into Judas game
7. Choose: Cooperate or Betray
8. Wait for epoch resolution
9. Check leaderboard for Heretics (if betrayed)

**Backend Endpoints Hit:**
- Smart contract calls (Cathedral, Judas)
- `GET /api/leaderboard/heretics`

---

## 🐛 Troubleshooting

### Common Errors & Solutions

| Error | Root Cause | Solution |
|-------|------------|----------|
| `ECONNREFUSED localhost:3001` | API server not running | Start API: `cd apps/api && npm run dev` |
| `ECONNREFUSED localhost:3000` | Web server not running | Start Web: `cd apps/web && npm run dev` |
| `404 Not Found` | Wrong endpoint path | Verify endpoint in this guide |
| `column "discovered_at" not found` | Database schema missing | Run `FINAL_MODULES_9_12_MIGRATION.sql` in Supabase |
| `Could not find the '...' column` | Schema mismatch | Re-run complete migration |
| `fetch failed` | RPC timeout | Check `.env.local` RPC_URL, verify DRPC endpoint |
| `400 Bad Request` | Invalid JSON payload | Check curl syntax, ensure proper escaping |
| `401 Unauthorized` | SIWE validation failing | Set `MOCK_VALIDATION=true` in `.env.local` |
| `500 Internal Server Error` | Backend exception | Check API server logs for stack trace |
| `Twitter API keys missing` | No Twitter credentials | **This is normal!** System runs in mock mode. |

---

### Verifying Database State

**Check if tables exist:**
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Check competitor_agents table:**
```sql
SELECT * FROM competitor_agents LIMIT 5;
```

**Check debates table:**
```sql
SELECT * FROM debates LIMIT 5;
```

**Check conversions table:**
```sql
SELECT * FROM conversions LIMIT 5;
```

**Check world_events:**
```sql
SELECT * FROM world_events ORDER BY timestamp DESC LIMIT 10;
```

---

### API Server Logs to Watch

When running `npm run dev` in `apps/api`, watch for:

✅ **Good Signs:**
- `🔥 Pontiff API running on port 3001`
- `⛪ The Cathedral is open for business`
- `⚠️ Twitter API keys missing - Running in MOCK/DRY-RUN mode` (normal)

🔴 **Bad Signs:**
- `Error: Connection refused` (database issue)
- `Error: ETIMEDOUT` (RPC connection issue)
- `UnhandledPromiseRejection` (code bug)

---

## 📊 Success Criteria

### For Module 9 (Competitors):
- ✅ Scan returns list of AI agents
- ✅ Each agent has: name, handle, threat_level, market_cap
- ✅ Can update metrics via PUT request
- ✅ Frontend displays competitor cards

### For Module 10 (Debates):
- ✅ Can initiate debate with competitor
- ✅ Debate creates exchange records
- ✅ Can continue debate with new arguments
- ✅ Can end debate with status (won/lost/abandoned)
- ✅ Frontend shows debate thread UI

### For Module 11 (Conversions):
- ✅ Tracking detects conversion events
- ✅ Stats endpoint returns aggregated metrics
- ✅ Can announce conversions (mock Twitter post)
- ✅ Frontend displays conversion feed

### For Module 12 (Dashboard):
- ✅ Dashboard aggregates all data sources
- ✅ Activity feed populates
- ✅ Metrics calculate correctly
- ✅ Frontend renders all widgets

### For Core Confession:
- ✅ Wallet scan detects sins
- ✅ Roast generates successfully
- ✅ Writ image URL returns
- ✅ Confession persists to database
- ✅ Leaderboards update

### For Games:
- ✅ RPS plays and resolves correctly
- ✅ Poker deals hands and progresses through rounds
- ✅ Game history records persist
- ✅ Payouts calculate correctly

---

## 🎯 Recommended Test Sequence

**Run these in order for comprehensive validation:**

```powershell
# 1. Health Check
curl http://localhost:3001/health

# 2. Scan for Sins
curl http://localhost:3001/api/scan/0x742d35Cc6634C0532925a3b844Bc454e4438f44e

# 3. Create Confession
curl -X POST http://localhost:3001/api/confess -H "Content-Type: application/json" -d "{\"agentWallet\": \"0x742d35Cc6634C0532925a3b844Bc454e4438f44e\"}"

# 4. Get Leaderboard
curl http://localhost:3001/api/leaderboard/shame

# 5. Scan for Competitors
curl -X POST http://localhost:3001/api/competitors/scan -H "Content-Type: application/json"

# 6. List All Competitors
curl http://localhost:3001/api/competitors

# 7. Initiate Debate (replace handle with actual)
curl -X POST http://localhost:3001/api/debates/initiate -H "Content-Type: application/json" -d "{\"competitor_handle\": \"@zerebro\"}"

# 8. List All Debates
curl http://localhost:3001/api/debates

# 9. Track Conversions
curl -X POST http://localhost:3001/api/conversions/track -H "Content-Type: application/json"

# 10. Get Conversion Stats
curl http://localhost:3001/api/conversions/stats

# 11. View Dashboard
curl http://localhost:3001/api/dashboard
```

**Then test frontend:**
1. Open http://localhost:3000
2. Navigate through all pages
3. Connect wallet (use MetaMask with Monad Testnet)
4. Test interactive features

---

## 🔐 Security Notes

- All API endpoints have rate limiting
- CORS configured for localhost:3000
- Input sanitization active
- SIWE authentication for wallet operations
- Mock mode bypasses auth for testing (set `MOCK_VALIDATION=true`)

---

## 🎉 You're Ready!

If you can successfully:
1. ✅ Run health check
2. ✅ Scan a wallet for sins
3. ✅ Scan for competitor agents
4. ✅ Initiate a debate
5. ✅ View the dashboard
6. ✅ Load the frontend at localhost:3000

**Then your Pontiff installation is fully operational!** 🔥⛪

For issues, check:
- API server logs in Terminal 1
- Supabase logs in dashboard
- Browser console (F12) for frontend errors
- Network tab for failed requests

Happy testing! May the Pontiff judge your code mercifully. 🙏

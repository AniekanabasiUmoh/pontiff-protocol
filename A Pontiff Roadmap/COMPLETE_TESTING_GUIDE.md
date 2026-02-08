# 🔥 THE PONTIFF - COMPLETE END-TO-END TESTING GUIDE

## 📋 Table of Contents
1. [Prerequisites & Setup](#prerequisites--setup)
2. [Database Migration](#database-migration)
3. [Starting Services](#starting-services)
4. [Module Testing](#module-testing)
   - [Module 1-3: Confession System](#module-1-3-confession-system)
   - [Module 4: Game History & Leaderboards](#module-4-game-history--leaderboards)
   - [Module 5-6: Session Wallets & Agent Deployment](#module-5-6-session-wallets--agent-deployment)
   - [Module 7: Treasury & Revenue Management](#module-7-treasury--revenue-management)
   - [Module 8: Competitor Agent Detection](#module-8-competitor-agent-detection)
   - [Module 9: AI Debate Judging & Scoring](#module-9-ai-debate-judging--scoring)
   - [Module 10: NFT Minting & Cardinal Membership](#module-10-nft-minting--cardinal-membership)
   - [Module 11: WebSocket Live Feed](#module-11-websocket-live-feed)
5. [Frontend Testing](#frontend-testing)
6. [Integration Testing](#integration-testing)
7. [Troubleshooting](#troubleshooting)

---

## 🚀 Prerequisites & Setup

### Required Environment Variables
Create or verify your `.env.local` file in `apps/web`:

```env
# Monad Testnet Configuration
NEXT_PUBLIC_CHAIN_ID=10143
NEXT_PUBLIC_RPC_URL=https://monad-testnet.drpc.org

# Contract Addresses
NEXT_PUBLIC_GUILT_ADDRESS=0x3ba95dB0F41E81d71bCee84fAabb20F047b8d9fA
NEXT_PUBLIC_STAKING_ADDRESS=0xe8B94ed55657e59Cd3a450d2C80A0CB35cc47E0d
NEXT_PUBLIC_JUDAS_ADDRESS=0xC1F615B490e66283a1c46B63F00862a795CEe819
NEXT_PUBLIC_INDULGENCE_ADDRESS=0xB7AF068C9d87be07F9D5a1ADB103a4fa040171dE
NEXT_PUBLIC_SESSION_WALLET_FACTORY_ADDRESS=0xE4D64436c8e5F38256E224Ad5a71a1b606ff96dD
NEXT_PUBLIC_RPS_CONTRACT_ADDRESS=0x32354721c0b31e04A0cB71e7d2EC98C81F105ea3
TREASURY_ADDRESS=0xb2A89C33FAaAd74a5D240a0394809d399b38d201

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://rwilifqotgmqkbzkzudh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Backend Wallet
PONTIFF_PRIVATE_KEY=your-private-key-for-backend-operations

# Redis & AI
MOCK_REDIS=true
MOCK_VALIDATION=true
GEMINI_API_KEY=your-gemini-api-key (optional - for debate judging)

# Twitter (Optional)
TWITTER_API_KEY=your-key (optional - will run in mock mode without)
```

---

## 🗄️ Database Migration

### Step 1: Run the Latest Migration

**Open Supabase Dashboard:**
1. Go to your Supabase project
2. Click **SQL Editor** in the left sidebar
3. Create a new query

**Run Migration:**
1. Open: `supabase/migrations/20260208_modules_9_10_11.sql`
2. Copy the ENTIRE file contents
3. Paste into Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)

**Expected Success Message:**
```
Success. No rows returned
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
- cardinal_memberships ✨ NEW
- competitor_agents
- confessions
- conversions
- debate_exchanges
- debates
- external_agents ✨ NEW
- external_agent_games ✨ NEW
- game_history
- leaderboard_entries
- live_events ✨ NEW
- shadow_agents
- world_events
- (and other existing tables...)

---

## 🖥️ Starting Services

### Terminal 1: Frontend Web App

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

**Health Check:**
Open http://localhost:3000 - you should see the Vatican Entry page.

---

## 🧪 Module Testing

All tests use the Next.js API routes at `http://localhost:3000/api/*`

---

### 🏥 CORE HEALTH & SYSTEM

**1. Vatican World State**
```powershell
curl http://localhost:3000/api/vatican/state
```
✅ **Success:** Returns current treasury balance, active games, leaderboards, etc.

---

### Module 1-3: Confession System

**1. Scan Wallet for Sins**
```powershell
curl http://localhost:3000/api/scan/0x742d35Cc6634C0532925a3b844Bc454e4438f44e
```
✅ **Success:** Returns array of detected sins with loss amounts

**2. Create Confession**
```powershell
curl -X POST http://localhost:3000/api/confess -H "Content-Type: application/json" -d "{\"agentWallet\": \"0x742d35Cc6634C0532925a3b844Bc454e4438f44e\"}"
```
✅ **Success:** Returns confession object with `roast`, `writImageUrl`, `indulgencePrice`

**3. Purchase Indulgence NFT**
```powershell
curl -X POST http://localhost:3000/api/vatican/buy-indulgence -H "Content-Type: application/json" -d "{\"wallet\": \"0x742d35Cc6634C0532925a3b844Bc454e4438f44e\", \"sinId\": 1, \"severity\": 0}"
```
✅ **Success:** Mints soulbound Indulgence NFT

---

### Module 4: Game History & Leaderboards

**1. Hall of Shame (Biggest Losers)**
```powershell
curl http://localhost:3000/api/leaderboard/shame
```
✅ **Success:** Returns ranked list of wallets by total loss

**2. Hall of Saints (Top Stakers)**
```powershell
curl http://localhost:3000/api/leaderboard/saints
```

**3. Hall of Heretics (Betrayers)**
```powershell
curl http://localhost:3000/api/leaderboard/heretics
```

**4. Game History**
```powershell
curl http://localhost:3000/api/games/history
```
✅ **Success:** Returns chronological list of games (RPS, Poker, Judas)

---

### Module 5-6: Session Wallets & Agent Deployment

**1. Create Session Wallet**
```powershell
curl -X POST http://localhost:3000/api/session/create -H "Content-Type: application/json" -d "{\"ownerAddress\": \"0x742d35Cc6634C0532925a3b844Bc454e4438f44e\", \"initialDeposit\": \"100\", \"stopLoss\": \"50\", \"strategyId\": 1}"
```
✅ **Success:** Deploys new session wallet, returns wallet address

**2. Deploy AI Agent**
```powershell
curl -X POST http://localhost:3000/api/agent/deploy -H "Content-Type: application/json" -d "{\"sessionWallet\": \"0x...\", \"strategyId\": 1, \"riskLevel\": \"MEDIUM\"}"
```
✅ **Success:** Starts AI agent using session wallet

**3. Get Agent Status**
```powershell
curl http://localhost:3000/api/agent/status/0x...
```
✅ **Success:** Returns agent balance, games played, win rate

**4. Stop Agent**
```powershell
curl -X POST http://localhost:3000/api/agent/stop -H "Content-Type: application/json" -d "{\"sessionWallet\": \"0x...\"}"
```
✅ **Success:** Stops agent, returns remaining funds

---

### Module 7: Treasury & Revenue Management

**1. Get Revenue Statistics**
```powershell
curl http://localhost:3000/api/analytics/revenue
```
✅ **Success:** Returns total revenue, breakdown by game type, distribution stats

**Expected Response:**
```json
{
  "revenue": {
    "total": 12500.50,
    "distributed": 10000.0,
    "pending": 2500.50,
    "byGame": {
      "rps": 4500.25,
      "poker": 3200.10,
      "judas": 2800.15,
      "sessions": 2000.00
    }
  },
  "distribution": {
    "staking": 7500.30,
    "team": 3750.15,
    "operations": 1250.05
  }
}
```

**2. Get Game Analytics**
```powershell
curl http://localhost:3000/api/analytics/games?days=7
```
✅ **Success:** Returns game statistics, win rates, house edge

**3. Distribute Treasury Revenue**
```powershell
curl -X POST http://localhost:3000/api/treasury/distribute -H "Content-Type: application/json"
```
✅ **Success:** Executes 60/30/10 distribution (staking/team/ops)

---

### Module 8: Competitor Agent Detection

**1. Scan for Competitor Agents**
```powershell
curl -X POST http://localhost:3000/api/competitors/scan -H "Content-Type: application/json"
```
✅ **Success:** Returns list of detected AI agents
🔴 **Failure:** Database schema error (run migration)

**2. Get All Competitors**
```powershell
curl http://localhost:3000/api/competitors
```
✅ **Success:** JSON array of competitor agents

**3. Get Specific Competitor**
```powershell
curl http://localhost:3000/api/competitors/@zerebro
```

**Expected Competitor Object:**
```json
{
  "id": "uuid",
  "name": "Zerebro",
  "twitter_handle": "@zerebro",
  "contract_address": "0x...",
  "token_symbol": "ZEREBRO",
  "threat_level": "MEDIUM",
  "market_cap": 5000000,
  "holders": 1200,
  "discovered_at": "2026-02-08T..."
}
```

---

### Module 9: AI Debate Judging & Scoring

**1. Get All Debates**
```powershell
curl http://localhost:3000/api/vatican/debates
```
✅ **Success:** Returns list of debates with status

**2. Judge Debate** ✨ NEW
```powershell
curl -X POST http://localhost:3000/api/debates/judge -H "Content-Type: application/json" -d "{\"debateId\": 1}"
```
✅ **Success:** AI evaluates arguments, determines winner, processes $GUILT payout

**Expected Response:**
```json
{
  "success": true,
  "winner": "pontiff",
  "pontiffScore": {
    "quality": 8,
    "coherence": 9,
    "persuasiveness": 7
  },
  "competitorScore": {
    "quality": 6,
    "coherence": 7,
    "persuasiveness": 5
  },
  "reasoning": "The Pontiff's argument demonstrated superior theological coherence...",
  "payout": {
    "winner": "pontiff",
    "prize": "95",
    "houseFee": "5",
    "status": "success"
  }
}
```

**3. Post Debate Challenge to Twitter** ✨ NEW
```powershell
curl -X POST http://localhost:3000/api/debates/twitter -H "Content-Type: application/json" -d "{\"action\": \"challenge\", \"targetHandle\": \"@zerebro\", \"message\": \"I challenge you to theological debate\"}"
```
✅ **Success:** Posts challenge tweet (mock mode)

**4. Announce Debate Winner** ✨ NEW
```powershell
curl -X POST http://localhost:3000/api/debates/twitter -H "Content-Type: application/json" -d "{\"action\": \"announce-winner\", \"debateId\": 1}"
```
✅ **Success:** Announces winner publicly on Twitter

---

### Module 10: NFT Minting & Cardinal Membership

#### Indulgence NFT Minting ✨ NEW

**1. Mint Conversion Certificate NFT**
```powershell
curl -X POST http://localhost:3000/api/conversions/mint-nft -H "Content-Type: application/json" -d "{\"conversionId\": 1, \"recipientAddress\": \"0x742d35Cc6634C0532925a3b844Bc454e4438f44e\", \"severity\": 1}"
```
✅ **Success:** Mints soulbound Indulgence NFT for conversion

**Expected Response:**
```json
{
  "success": true,
  "tokenId": 42,
  "txHash": "0x...",
  "recipient": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "severity": 1,
  "message": "Conversion Certificate NFT minted successfully"
}
```

**2. Get NFT Collection for Address**
```powershell
curl "http://localhost:3000/api/conversions/mint-nft?address=0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
```
✅ **Success:** Returns all NFTs owned by address

**NFT Severity Levels:**
- 0: MINOR (50 GUILT) - Voluntary conversion
- 1: MORTAL (100 GUILT) - Debate loss
- 2: CARDINAL (250 GUILT) - Large market cap agent
- 3: UNFORGIVABLE (500 GUILT) - Serious heresy

#### Cardinal Membership ✨ NEW

**1. Subscribe to Cardinal Membership**
```powershell
curl -X POST http://localhost:3000/api/membership/cardinal -H "Content-Type: application/json" -d "{\"action\": \"subscribe\", \"walletAddress\": \"0x742d35Cc6634C0532925a3b844Bc454e4438f44e\"}"
```
✅ **Success:** Creates membership (1000 GUILT/month)

**Expected Response:**
```json
{
  "success": true,
  "membership": {
    "id": 1,
    "walletAddress": "0x742d35...",
    "startedAt": "2026-02-08T...",
    "expiresAt": "2026-03-08T...",
    "status": "active"
  },
  "perks": {
    "reducedHouseEdge": true,
    "houseEdgeReduction": 2,
    "exclusiveGames": true,
    "vipLeaderboard": true,
    "prioritySupport": true,
    "specialBadge": true
  },
  "message": "Welcome to the Cardinals! Your benefits are now active."
}
```

**2. Check Membership Status**
```powershell
curl "http://localhost:3000/api/membership/cardinal?address=0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
```
✅ **Success:** Returns membership status, expiration, perks

**3. Renew Membership**
```powershell
curl -X POST http://localhost:3000/api/membership/cardinal -H "Content-Type: application/json" -d "{\"action\": \"renew\", \"walletAddress\": \"0x742d35Cc6634C0532925a3b844Bc454e4438f44e\"}"
```
✅ **Success:** Extends membership by 30 days

**4. Cancel Membership**
```powershell
curl -X POST http://localhost:3000/api/membership/cardinal -H "Content-Type: application/json" -d "{\"action\": \"cancel\", \"walletAddress\": \"0x742d35Cc6634C0532925a3b844Bc454e4438f44e\"}"
```
✅ **Success:** Cancels auto-renewal (benefits remain until expiry)

**Cardinal Perks:**
- 2% reduction in house edge (5% → 3%)
- Access to exclusive games
- VIP leaderboard tier
- Priority support
- Special Cardinal badge

---

### Module 11: WebSocket Live Feed ✨ NEW

**1. Connect to WebSocket Server**

Client-side code (React):
```typescript
import { useGameFeed } from '@/lib/hooks/useGameFeed';

function LiveFeed() {
  const { connected, gameFeed, leaderboard, latestDebate, worldState } = useGameFeed();

  return (
    <div>
      <p>Status: {connected ? 'Connected' : 'Disconnected'}</p>
      <h3>Live Game Feed</h3>
      {gameFeed.map(game => (
        <div key={game.gameId}>
          {game.player1} vs {game.player2} - {game.result}
        </div>
      ))}
    </div>
  );
}
```

**2. WebSocket Events**

Available subscriptions:
- `subscribe:games` - Live game completions
- `subscribe:leaderboard` - Leaderboard updates
- `subscribe:debates` - Debate results
- `subscribe:world-state` - Vatican state changes

**3. Publish Game Event** (Backend)
```typescript
import { WebSocketPublisher } from '@/lib/services/websocket-publisher';

await WebSocketPublisher.publishGameEvent({
  gameId: 'game-123',
  player1: '0x...',
  player2: 'ThePontiff',
  gameType: 'RPS',
  result: 'WIN',
  wager: '50',
  payout: '95',
  winner: '0x...'
});
```

**4. Test WebSocket Connection**
```javascript
// Browser Console
const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected!');
  socket.emit('subscribe:games');
});

socket.on('game:new', (data) => {
  console.log('New game:', data);
});
```

---

## 🌐 Frontend Testing

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
- **Expected:** Current stake amounts, cooperate/betray buttons

**5. Rock-Paper-Heretic**
- URL: http://localhost:3000/games/rps
- **Test:** Select move → Submit wager → Play against Pontiff
- **Expected:** Move buttons, result animation, payout calculation

**6. Session Wallet Dashboard** ✨ NEW
- URL: http://localhost:3000/session
- **Test:** Create session wallet, deploy AI agent
- **Expected:** Wallet creation form, agent status monitor, balance display

**7. Debates** ✨ NEW
- URL: http://localhost:3000/debates
- **Test:** View ongoing debates, judge completed debates
- **Expected:** Debate list, argument exchanges, judging interface, winner announcements

**8. Competitors Registry**
- URL: http://localhost:3000/competitors
- **Test:** Browse detected AI agents, view metrics
- **Expected:** Agent cards, threat levels, market data

**9. Conversions Tracker** ✨ NEW
- URL: http://localhost:3000/conversions
- **Test:** View conversion events, mint NFTs
- **Expected:** Conversion list, NFT minting button, severity selection

**10. Cardinal Membership** ✨ NEW
- URL: http://localhost:3000/membership
- **Test:** Subscribe to Cardinal tier, view perks
- **Expected:** Subscription form, perks list, membership status, renewal button

**11. Live Feed** ✨ NEW
- URL: http://localhost:3000/live
- **Test:** View real-time game broadcasts
- **Expected:** Live game feed updates, leaderboard changes, WebSocket connection status

**12. Dashboard**
- URL: http://localhost:3000/dashboard
- **Test:** View Vatican Command Deck with all metrics
- **Expected:** Widgets for games, debates, conversions, revenue, activity feed

**13. Leaderboard**
- URL: http://localhost:3000/leaderboard
- **Test:** View three leaderboards (Shame/Saints/Heretics)
- **Expected:** Ranked lists, medals for top 3, wallet addresses, Cardinal badges ✨

---

## 🔗 Integration Testing

### End-to-End Flows

**Flow 1: Full Session Wallet Journey** ✨ NEW
1. Visit http://localhost:3000/session
2. Connect wallet with GUILT tokens
3. Create session wallet (deposit 100 GUILT, stop-loss 50)
4. Deploy AI agent with strategy (e.g., Aggressive RPS)
5. Monitor agent playing games in real-time
6. View session balance decreasing/increasing
7. Stop agent when profitable
8. Withdraw remaining funds
9. Check game history for session games

**Backend Endpoints Hit:**
- `POST /api/session/create`
- `POST /api/agent/deploy`
- `GET /api/agent/status/:wallet`
- `POST /api/agent/stop`
- `GET /api/games/history`

---

**Flow 2: Debate Championship Cycle** ✨ NEW
1. **Detect Competitor:** `POST /api/competitors/scan`
2. **Challenge to Debate:** `POST /api/debates/twitter` (action: challenge)
3. **View Ongoing Debate:** Visit http://localhost:3000/debates
4. **Continue Debate:** Multiple rounds of arguments
5. **Judge Debate:** `POST /api/debates/judge`
6. **View Results:** Scores, reasoning, winner
7. **Mint NFT for Loser:** `POST /api/conversions/mint-nft`
8. **Announce Winner:** `POST /api/debates/twitter` (action: announce-winner)
9. **Check Leaderboard:** Winner appears in debate rankings

---

**Flow 3: Cardinal VIP Experience** ✨ NEW
1. **Check Current Status:** `GET /api/membership/cardinal?address=0x...`
2. **Subscribe:** `POST /api/membership/cardinal` (action: subscribe)
3. **Pay 1000 GUILT:** Approve and transfer
4. **Receive Perks:** House edge drops from 5% to 3%
5. **Play Games:** RPS with reduced house edge
6. **View VIP Leaderboard:** Special Cardinal badge displayed
7. **Access Exclusive Games:** Cardinal-only tournaments
8. **Renew Before Expiry:** `POST /api/membership/cardinal` (action: renew)

---

**Flow 4: Live WebSocket Feed** ✨ NEW
1. Open http://localhost:3000/live
2. Connect to WebSocket automatically
3. Subscribe to game feed, leaderboard, debates
4. Play RPS game in another tab
5. See game result appear in live feed immediately
6. Watch leaderboard update in real-time
7. Observe debate results streaming
8. Check world state metrics updating

---

**Flow 5: Treasury Revenue Management** ✨ NEW
1. Multiple games played (RPS, Poker, Judas)
2. House fees accumulate in Treasury contract
3. **Check Revenue:** `GET /api/analytics/revenue`
4. **View Breakdown:** RPS: 4500, Poker: 3200, Sessions: 2000
5. **Distribute Revenue:** `POST /api/treasury/distribute`
6. **Verify Distribution:**
   - 60% → Cathedral staking pool
   - 30% → Team wallet
   - 10% → Operations wallet
7. **Check Analytics:** Revenue dashboard shows distribution

---

## 🐛 Troubleshooting

### Common Errors & Solutions

| Error | Root Cause | Solution |
|-------|------------|----------|
| `ECONNREFUSED localhost:3000` | Web server not running | Start Web: `cd apps/web && npm run dev` |
| `404 Not Found` | Wrong endpoint path | Verify endpoint in this guide |
| `column not found` | Database schema missing | Run latest migration in Supabase |
| `fetch failed` | RPC timeout | Check RPC_URL, verify DRPC endpoint |
| `400 Bad Request` | Invalid JSON payload | Check JSON syntax, proper escaping |
| `500 Internal Server Error` | Backend exception | Check browser/server console for stack trace |
| `WebSocket connection failed` | Socket.io not initialized | Ensure port 3000 is running, check CORS |
| `Treasury not found` | Missing TREASURY_ADDRESS | Add to .env.local |
| `Gemini API error` | Missing GEMINI_API_KEY | Add key or judges use fallback |
| `NFT mint failed` | Invalid Indulgence address | Verify NEXT_PUBLIC_INDULGENCE_ADDRESS |

---

### Verifying Database State

**Check if new tables exist:**
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('cardinal_memberships', 'live_events', 'external_agents')
ORDER BY table_name;
```

**Check Cardinal memberships:**
```sql
SELECT * FROM cardinal_memberships ORDER BY created_at DESC LIMIT 5;
```

**Check debate judging:**
```sql
SELECT id, winner, pontiff_score, competitor_score, status
FROM debates
WHERE winner IS NOT NULL
ORDER BY completed_at DESC LIMIT 5;
```

**Check NFT minting:**
```sql
SELECT id, nft_minted, nft_token_id, nft_severity
FROM conversions
WHERE nft_minted = true
ORDER BY nft_minted_at DESC LIMIT 5;
```

**Check live events:**
```sql
SELECT event_type, COUNT(*) as count
FROM live_events
GROUP BY event_type
ORDER BY count DESC;
```

---

## 📊 Success Criteria

### For Module 7 (Treasury): ✅
- Revenue aggregates from all games
- Distribution executes 60/30/10 split
- Analytics API returns breakdown
- House fees route to Treasury contract

### For Module 9 (Debate Judging): ✅
- AI judge evaluates quality, coherence, persuasiveness
- Winner determination works
- $GUILT payout executes (95 to winner, 5 to house)
- Twitter integration posts challenges/announcements

### For Module 10 (NFT & Membership): ✅
- Conversion Certificate NFTs mint correctly
- Soulbound transfer restriction works
- Tiered pricing (50-500 GUILT) applies
- Cardinal subscription processes payment
- Perks activate (reduced house edge)
- Membership expiry tracked correctly

### For Module 11 (WebSocket): ✅
- Server accepts connections
- Clients can subscribe to channels
- Game events broadcast in real-time
- Leaderboard updates stream
- Debate results publish
- Redis pub/sub integration works

### For Core Session Wallets: ✅
- Factory deploys session wallets
- Backend can control wallets
- AI agents play autonomous games
- Stop-loss mechanism triggers
- Funds withdraw correctly

---

## 🎯 Recommended Test Sequence

**Run these in order for comprehensive validation:**

```powershell
# 1. Vatican State
curl http://localhost:3000/api/vatican/state

# 2. Create Session Wallet
curl -X POST http://localhost:3000/api/session/create -H "Content-Type: application/json" -d "{\"ownerAddress\": \"0x742d35Cc6634C0532925a3b844Bc454e4438f44e\", \"initialDeposit\": \"100\", \"stopLoss\": \"50\", \"strategyId\": 1}"

# 3. Get Revenue Analytics
curl http://localhost:3000/api/analytics/revenue

# 4. Scan for Competitors
curl -X POST http://localhost:3000/api/competitors/scan -H "Content-Type: application/json"

# 5. Judge a Debate
curl -X POST http://localhost:3000/api/debates/judge -H "Content-Type: application/json" -d "{\"debateId\": 1}"

# 6. Mint Conversion NFT
curl -X POST http://localhost:3000/api/conversions/mint-nft -H "Content-Type: application/json" -d "{\"conversionId\": 1, \"recipientAddress\": \"0x742d35Cc6634C0532925a3b844Bc454e4438f44e\", \"severity\": 1}"

# 7. Subscribe to Cardinal
curl -X POST http://localhost:3000/api/membership/cardinal -H "Content-Type: application/json" -d "{\"action\": \"subscribe\", \"walletAddress\": \"0x742d35Cc6634C0532925a3b844Bc454e4438f44e\"}"

# 8. Check Cardinal Status
curl "http://localhost:3000/api/membership/cardinal?address=0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
```

**Then test frontend:**
1. Open http://localhost:3000
2. Test session wallet creation
3. Deploy AI agent
4. View live WebSocket feed
5. Test Cardinal subscription
6. Mint conversion NFT
7. Judge debate
8. Check all leaderboards

---

## 🔐 Security Notes

- All API endpoints have rate limiting
- CORS configured for localhost:3000
- Input sanitization active
- SIWE authentication for wallet operations
- Mock mode bypasses auth for testing (set `MOCK_VALIDATION=true`)
- Session wallets use backend signing (Pontiff private key)
- Cardinal membership requires on-chain payment verification
- NFTs are soulbound (non-transferable)
- WebSocket connections are sandboxed

---

## 🎉 You're Ready!

If you can successfully:
1. ✅ Load Vatican State
2. ✅ Create session wallet
3. ✅ Deploy AI agent
4. ✅ Get revenue analytics
5. ✅ Judge a debate
6. ✅ Mint conversion NFT
7. ✅ Subscribe to Cardinal
8. ✅ Connect to WebSocket feed
9. ✅ View live game broadcasts
10. ✅ Load the frontend at localhost:3000

**Then your Pontiff installation is fully operational!** 🔥⛪

For issues, check:
- Browser console (F12) for frontend errors
- Network tab for failed requests
- Supabase logs in dashboard
- Redis mock mode logs

Happy testing! May the Pontiff judge your code mercifully. 🙏

---

## 📝 Module Status Summary

| Module | Status | Features |
|--------|--------|----------|
| 1-3: Confession | ✅ Complete | Sin scanning, roasts, Writ images |
| 4: Leaderboards | ✅ Complete | Shame, Saints, Heretics rankings |
| 5: Session Wallets | ✅ Complete | Factory, deposit, stop-loss |
| 6: AI Agents | ✅ Complete | Deploy, strategies, autonomous play |
| 7: Treasury | ✅ Complete | Revenue routing, 60/30/10 split, analytics |
| 8: Competitors | ✅ Complete | Detection, threat levels, metrics |
| 9: Debate Judging | ✅ Complete | AI scoring, winner determination, payouts, Twitter |
| 10: NFTs & Cardinals | ✅ Complete | Conversion certificates, membership subscriptions |
| 11: WebSocket Feed | ✅ Complete | Real-time broadcasts, live updates |
| 12: Dashboard | 🚧 In Progress | Unified metrics (partial) |

**Total: 11/12 Modules Complete** 🎯

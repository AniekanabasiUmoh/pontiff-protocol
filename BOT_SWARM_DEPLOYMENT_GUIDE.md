# BOT SWARM DEPLOYMENT GUIDE
**Quick Reference for Deploying & Managing The Pontiff Bot Swarm**

---

## PREREQUISITES

### Required Environment Variables
Ensure these are set in `apps/web/.env.local`:

```bash
# RPC & Network
NEXT_PUBLIC_RPC_URL=https://monad-testnet.drpc.org
NEXT_PUBLIC_CHAIN_ID=10143

# Contract Addresses
NEXT_PUBLIC_SESSION_WALLET_FACTORY_ADDRESS=0xc5bacd1ae1C486c029C51716f00CCDb359B0335A
NEXT_PUBLIC_GUILT_ADDRESS=0x3ba95dB0F41E81d71bCee84fAabb20F047b8d9fA
NEXT_PUBLIC_STAKING_ADDRESS=0xe8B94ed55657e59Cd3a450d2C80A0CB35cc47E0d

# Database
NEXT_PUBLIC_SUPABASE_URL=https://rwilifqotgmqkbzkzudh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Pontiff Wallet (has GUILT and MON to fund bots)
PONTIFF_PRIVATE_KEY=<your-private-key>
```

### Required Balances (Pontiff Wallet)
- **MON:** Minimum 2 MON (20 bots × 0.1 MON each)
- **GUILT:** Minimum 2,500 GUILT (20 bots × ~125 GUILT each)

---

## DEPLOYMENT STEPS

### Option 1: Automated Deployment (Recommended)

**Windows:**
```bash
cd apps/web/scripts/bots
deploy-swarm.bat
```

**Linux/Mac:**
```bash
cd apps/web/scripts/bots
chmod +x deploy-swarm.sh
./deploy-swarm.sh
```

This script will:
1. ✅ Verify environment variables
2. ✅ Generate 20 bot wallets
3. ✅ Fund each bot with MON and GUILT
4. ✅ Create session wallets on-chain
5. ✅ Record sessions in database
6. ✅ Verify deployment success

---

### Option 2: Manual Step-by-Step

#### Step 1: Fund Bots
```bash
cd apps/web/scripts/bots
npx ts-node fund-bots.ts
```

**What this does:**
- Generates 20 random wallets (if not already created)
- Sends 0.1 MON to each bot (for gas)
- Sends (deposit + 5 GUILT buffer) to each bot
- Saves wallets to `wallets.json`

**Expected Output:**
```
Starting Bot Funding Process...
Deployer Address: 0x...
Deployer MON Balance: 5.0 MON
Generated wallet for Iron Beard: 0x...
Sending 0.1 MON to Iron Beard...
  Confirmed.
Sending 105 GUILT to Iron Beard...
  Confirmed.
...
All bots funded successfully!
```

---

#### Step 2: Spawn Sessions
```bash
npx ts-node spawn-bot-swarm.ts
```

**What this does:**
- Approves SessionWalletFactory to spend GUILT
- Calls `createSession()` for each bot (with forced 5M gas limit)
- Parses `SessionCreated` event to get session wallet address
- Inserts session record into `agent_sessions` database table
- Saves sessions to `sessions.json`

**Expected Output:**
```
Starting Bot Swarm Spawn...
Spawning session for Iron Beard (0x...)...
  Approving 101 GUILT...
  Creating Session (with forced gas limit to bypass RPC estimation)...
  Session Created: 0xABC123...
  DB Record Created: uuid-123
...
Swarm Spawn Complete.
```

---

## VERIFICATION

### Check Bot Wallets
```bash
cat apps/web/scripts/bots/wallets.json
```

Should show 20 entries like:
```json
{
  "Iron Beard": {
    "address": "0x...",
    "privateKey": "0x...",
    "personality": "Iron Beard"
  }
}
```

### Check Sessions
```bash
cat apps/web/scripts/bots/sessions.json
```

Should show 20 entries like:
```json
{
  "Iron Beard": {
    "sessionId": "uuid-123",
    "sessionWallet": "0xABC...",
    "botName": "Iron Beard"
  }
}
```

### Check Database
```sql
-- Connect to Supabase and run:
SELECT
    user_wallet,
    session_wallet,
    strategy,
    starting_balance,
    current_balance,
    stop_loss,
    status
FROM agent_sessions
WHERE status = 'active'
ORDER BY created_at DESC;
```

Should show 20 active sessions.

---

## STARTING THE AGENT MANAGER

Once sessions are created, you need to start the Agent Manager Service to make the bots actually play games.

### Option A: Start All Agents via API

Create a startup script:

```typescript
// apps/web/scripts/bots/start-all-agents.ts
import { AgentManagerService } from '../../lib/services/agent-manager-service';
import sessions from './sessions.json';

const agentManager = new AgentManagerService();

async function main() {
    console.log(`Starting ${Object.keys(sessions).length} agents...`);

    for (const [botName, sessionData] of Object.entries(sessions)) {
        try {
            // Get strategy from bot personality
            const bot = personalities.find(p => p.name === botName);
            if (!bot) continue;

            await agentManager.startAgent(
                sessionData.sessionId,
                sessionData.sessionWallet,
                bot.strategy
            );

            console.log(`✅ Started agent for ${botName} (${bot.strategy})`);
        } catch (error) {
            console.error(`❌ Failed to start ${botName}:`, error);
        }
    }

    console.log('All agents started!');
}

main();
```

Run:
```bash
npx ts-node start-all-agents.ts
```

---

### Option B: Start Agents via Database Trigger (Automatic)

If your agent manager service runs as a daemon and polls the database:

```typescript
// In your main server startup
import { AgentManagerService } from './lib/services/agent-manager-service';
import { createClient } from '@supabase/supabase-js';

const agentManager = new AgentManagerService();
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Poll for new sessions every 10 seconds
setInterval(async () => {
    const { data: sessions } = await supabase
        .from('agent_sessions')
        .select('*')
        .eq('status', 'active');

    for (const session of sessions || []) {
        // Check if agent is already running
        if (!agentManager.activeAgents.has(session.id)) {
            agentManager.startAgent(session.id, session.session_wallet, session.strategy);
            console.log(`Started agent for session ${session.id}`);
        }
    }
}, 10000);
```

---

## MONITORING

### Real-Time Game Activity

**Check Live Feed:**
```sql
SELECT
    player1,
    player2,
    game_type,
    wager,
    result,
    created_at
FROM games
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 50;
```

**Check Bot Performance:**
```sql
SELECT
    user_wallet,
    strategy,
    starting_balance,
    current_balance,
    (current_balance - starting_balance) as profit,
    games_played,
    status
FROM agent_sessions
ORDER BY profit DESC;
```

---

### Health Monitoring Script

```typescript
// apps/web/scripts/bots/monitor-health.ts
import { ethers } from 'ethers';
import wallets from './wallets.json';

const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL!);
const guiltContract = new ethers.Contract(
    process.env.NEXT_PUBLIC_GUILT_ADDRESS!,
    ["function balanceOf(address) view returns (uint256)"],
    provider
);

async function checkHealth() {
    console.log('Bot Health Report:');
    console.log('==================');

    for (const [name, wallet] of Object.entries(wallets)) {
        const monBalance = await provider.getBalance(wallet.address);
        const guiltBalance = await guiltContract.balanceOf(wallet.address);

        const status =
            monBalance < ethers.parseEther("0.01") ? '🔴 LOW MON' :
            guiltBalance < ethers.parseEther("10") ? '🟡 LOW GUILT' :
            '🟢 HEALTHY';

        console.log(`${name}: ${status}`);
        console.log(`  MON: ${ethers.formatEther(monBalance)}`);
        console.log(`  GUILT: ${ethers.formatEther(guiltBalance)}`);
    }
}

setInterval(checkHealth, 300000); // Every 5 minutes
checkHealth(); // Run immediately
```

---

## TROUBLESHOOTING

### Issue: "Transfer failed" during session creation

**Cause:** Bot doesn't have enough GUILT for deposit + fee

**Fix:**
```bash
# Re-run funding script
cd apps/web/scripts/bots
npx ts-node fund-bots.ts
```

---

### Issue: "Could not coalesce error" / "Execution reverted"

**Cause:** RPC gas estimation failure

**Fix:** Already applied! The spawn script now uses forced gas limits:
```typescript
gasLimit: 5000000 // Bypasses RPC estimation
```

If still failing, increase gas limit to 7M or try a different RPC:
```bash
# Add to .env.local
NEXT_PUBLIC_RPC_URL=https://monad-testnet-backup.drpc.org
```

---

### Issue: Bots not playing games

**Possible Causes:**
1. Agent Manager Service not started
2. Sessions not in database
3. Sessions expired or stopped

**Diagnosis:**
```sql
-- Check session status
SELECT id, status, expires_at FROM agent_sessions WHERE status = 'active';

-- If empty, re-run spawn script
-- If expired, update expires_at:
UPDATE agent_sessions SET expires_at = NOW() + INTERVAL '24 hours' WHERE status = 'expired';
```

**Fix:**
```bash
# Restart agent manager service
# Or manually start agents via script
npx ts-node start-all-agents.ts
```

---

### Issue: Out of MON/GUILT mid-demo

**Quick Refill:**
```typescript
// Refill a single bot
import { ethers } from 'ethers';
const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL!);
const pontiff = new ethers.Wallet(process.env.PONTIFF_PRIVATE_KEY!, provider);

// Send MON
await pontiff.sendTransaction({
    to: '<bot-address>',
    value: ethers.parseEther("0.1")
});

// Send GUILT
const guilt = new ethers.Contract(GUILT_ADDRESS, ERC20_ABI, pontiff);
await guilt.transfer('<bot-address>', ethers.parseEther("100"));
```

---

## DEMO DAY CHECKLIST

### 24 Hours Before Demo
- [ ] Deploy bot swarm (deploy-swarm.bat)
- [ ] Verify all 20 sessions created
- [ ] Start agent manager service
- [ ] Verify bots are playing games (check database)
- [ ] Monitor for 1 hour to ensure stability

### 1 Hour Before Demo
- [ ] Check bot balances (MON > 0.05, GUILT > 50)
- [ ] Verify 50+ games in last hour
- [ ] Check leaderboard has entries
- [ ] Test live game feed is updating

### During Demo
- [ ] Monitor health script running
- [ ] Keep Supabase dashboard open
- [ ] Have refill script ready in case of low balances

---

## STOPPING THE SWARM

### Stop All Agents
```typescript
// apps/web/scripts/bots/stop-all-agents.ts
import { AgentManagerService } from '../../lib/services/agent-manager-service';
import sessions from './sessions.json';

const agentManager = new AgentManagerService();

for (const sessionData of Object.values(sessions)) {
    agentManager.stopAgent(sessionData.sessionId);
    console.log(`Stopped agent for ${sessionData.botName}`);
}
```

### Withdraw All Funds
```typescript
// apps/web/scripts/bots/withdraw-all.ts
import { ethers } from 'ethers';

const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);

for (const sessionData of Object.values(sessions)) {
    const bot = new ethers.Wallet(wallets[sessionData.botName].privateKey, provider);
    const factoryAsBot = factory.connect(bot);

    const tx = await factoryAsBot.withdrawSession(sessionData.sessionWallet);
    await tx.wait();

    console.log(`Withdrawn funds for ${sessionData.botName}`);
}
```

---

## FILES REFERENCE

| File | Purpose | Location |
|------|---------|----------|
| `bot-personalities.json` | Bot configurations (name, strategy, deposit) | `apps/web/scripts/bots/` |
| `fund-bots.ts` | Script to fund bots with MON and GUILT | `apps/web/scripts/bots/` |
| `spawn-bot-swarm.ts` | Script to create session wallets | `apps/web/scripts/bots/` |
| `wallets.json` | Generated bot wallet addresses/keys | `apps/web/scripts/bots/` |
| `sessions.json` | Session wallet addresses and IDs | `apps/web/scripts/bots/` |
| `deploy-swarm.bat` | Automated deployment (Windows) | `apps/web/scripts/bots/` |
| `deploy-swarm.sh` | Automated deployment (Linux/Mac) | `apps/web/scripts/bots/` |

---

## COST BREAKDOWN

### Per Bot
- MON: 0.1 MON (~$0.50 on testnet, free effectively)
- GUILT: ~105-125 GUILT (depends on deposit amount)

### Total Swarm (20 bots)
- MON: 2 MON
- GUILT: ~2,500 GUILT

### Reserve for Demo (Pontiff Wallet)
- MON: 5 MON (for refills)
- GUILT: 5,000 GUILT (for refills + RPS contract funding)

---

## SUCCESS METRICS

### Demo Day Win Condition
- ✅ 50+ games per hour
- ✅ Leaderboard has 10+ entries
- ✅ Live feed shows continuous activity
- ✅ All 3 strategies visible (berzerker, merchant, disciple)
- ✅ No bot runs out of funds during demo

### How to Verify
```sql
-- Games per hour
SELECT COUNT(*) as games_last_hour
FROM games
WHERE created_at > NOW() - INTERVAL '1 hour';

-- Should show: 50+

-- Leaderboard entries
SELECT COUNT(*) as leaderboard_count
FROM leaderboard_entries;

-- Should show: 10+

-- Active bots
SELECT COUNT(*) as active_bots
FROM agent_sessions
WHERE status = 'active';

-- Should show: 15-20
```

---

**Last Updated:** 2026-02-08
**Status:** Ready for deployment
**Contact:** See BUILD CHECKLIST.md for support
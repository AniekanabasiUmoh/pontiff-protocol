# Module 5: Session Wallet System - Implementation Guide

**Status:** ✅ BUILT - Core Implementation Complete
**Priority:** CRITICAL - This IS the product
**Date:** 2026-02-08

---

## Overview

The Session Wallet System enables users to deposit $GUILT into temporary "session wallets" controlled by autonomous AI agents. These agents play games on behalf of users for a specified duration (typically 24 hours).

**Core Concept:**
1. User creates a session wallet via SessionWalletFactory
2. User deposits GUILT tokens + pays session fee
3. Backend spawns an AI agent to control the wallet
4. Agent plays games autonomously using selected strategy
5. Session ends when: time expires, stop-loss hit, or take-profit reached
6. User withdraws remaining balance

---

## Architecture

### Smart Contracts

#### 1. SessionWallet.sol
**Location:** `packages/contracts/src/session/SessionWallet.sol`

Minimal proxy contract (clone pattern) that holds user funds during a session.

**Key Features:**
- Uses OpenZeppelin's Clones pattern for gas-efficient deployment
- Owner = User who deposited funds
- Pontiff = Backend wallet that executes game transactions
- Implements withdraw function for user to reclaim funds
- Executes game transactions on behalf of user

**Security:**
- Only Pontiff can call `executeGame()` to play games
- Only Owner or Pontiff can withdraw funds
- Approves game contracts to spend tokens (requires trusted game contracts)
- Backend key security is paramount

**Functions:**
```solidity
function initialize(address _owner, address _pontiff, address _guiltToken) external
function executeGame(address target, bytes calldata data) external onlyPontiff
function withdraw() external // Owner or Pontiff can call
function withdrawETH() external onlyOwner // Escape hatch
```

#### 2. SessionWalletFactory.sol
**Location:** `packages/contracts/src/session/SessionWalletFactory.sol`

Factory contract that deploys SessionWallet clones.

**Key Features:**
- Deploys minimal proxies for gas efficiency (~$0.50 per deployment vs ~$5 for full contract)
- Tracks all user sessions in `userSessions` mapping
- Manages Pontiff address (backend controller)
- Emits SessionCreated event on successful deployment

**Functions:**
```solidity
function createSession() external returns (address wallet)
function getUserSessions(address user) external view returns (address[] memory)
function setPontiff(address _newPontiff) external onlyOwner
```

**Deployment:**
```bash
cd packages/contracts
npx hardhat run scripts/deploy-session-wallets.ts --network monadTestnet
```

**Environment Variables Required:**
- `GUILT_TOKEN_ADDRESS` - Address of deployed GUILT token
- `PONTIFF_ADDRESS` - Backend wallet that controls agents (optional, defaults to deployer)
- `TREASURY_ADDRESS` - Where session fees are collected (optional, defaults to deployer)

---

### Database Schema

#### agent_sessions Table
**Migration:** `supabase/migrations/20260208000001_add_agent_sessions.sql`

```sql
CREATE TABLE agent_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_wallet TEXT NOT NULL,
    session_wallet TEXT NOT NULL UNIQUE,
    strategy TEXT NOT NULL CHECK (strategy IN ('berzerker', 'merchant', 'disciple')),
    starting_balance NUMERIC NOT NULL,
    current_balance NUMERIC NOT NULL,
    stop_loss NUMERIC NOT NULL,
    take_profit NUMERIC,
    status TEXT NOT NULL DEFAULT 'active',
    games_played INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_game_at TIMESTAMP WITH TIME ZONE,
    stop_reason TEXT
);
```

**Indexes:**
- `idx_agent_sessions_user_wallet` - Query sessions by user
- `idx_agent_sessions_status` - Filter active sessions
- `idx_agent_sessions_session_wallet` - Lookup by session wallet address
- `idx_agent_sessions_expires_at` - Find expired sessions

**Helper Functions:**
```sql
-- Increment games played counter
increment_games_played(session_id UUID)

-- Update balance after each game
update_session_balance(session_id UUID, new_balance NUMERIC)

-- Stop a session with reason
stop_agent_session(session_id UUID, reason TEXT)
```

---

### Backend Service

#### AgentManagerService
**Location:** `apps/web/lib/services/agent-manager-service.ts`

Manages the lifecycle of autonomous AI agents.

**Key Responsibilities:**
1. Spawn new agents when sessions are created
2. Run game loop every 10 seconds for each active agent
3. Monitor stop-loss and take-profit thresholds
4. Execute strategy-specific gameplay logic
5. Stop agents when conditions are met

**Agent Strategies:**

| Strategy | Risk Level | Bet Size | Description |
|----------|-----------|----------|-------------|
| Berzerker | HIGH | 15% of balance | Aggressive, random moves |
| Merchant | MEDIUM | 5% of balance | Strategic, pattern-based |
| Disciple | LOW | 2% of balance | Conservative, low-risk |

**Core Methods:**
```typescript
startAgent(sessionId, sessionWallet, strategy) // Start agent loop
stopAgent(sessionId) // Stop agent loop
executeAgentTurn(sessionId, sessionWallet, strategy) // One game iteration
playRPS(sessionId, sessionWallet, action) // Execute RPS game
stakeTokens(sessionId, sessionWallet, action) // Execute staking
```

**Agent Loop Logic:**
```typescript
Every 10 seconds:
1. Check if session still active in DB
2. Check if session expired
3. Get current balance from on-chain session wallet
4. Check stop-loss threshold
5. Check take-profit threshold
6. Execute strategy (decide game + wager)
7. Play game via session wallet
8. Update DB with new balance
```

**Error Handling:**
- Single game failures don't stop the agent
- DB errors or session status changes stop the agent
- RPC errors are logged and retry on next turn

---

### API Endpoints

#### POST /api/sessions/create
**Location:** `apps/web/app/api/sessions/create/route.ts`

Creates session parameters for user to call smart contract.

**Request Body:**
```json
{
  "userWallet": "0x...",
  "strategy": "berzerker" | "merchant" | "disciple",
  "depositAmount": 100,
  "stopLoss": 50,
  "takeProfit": 200,  // optional
  "durationHours": 24
}
```

**Response:**
```json
{
  "success": true,
  "params": {
    "depositAmount": "100000000000000000000",
    "stopLoss": "50000000000000000000",
    "sessionFee": "1000000000000000000",
    "durationHours": 24,
    "factoryAddress": "0x...",
    "estimatedGas": "500000"
  },
  "metadata": {
    "strategy": "berzerker",
    "userWallet": "0x...",
    "takeProfit": 200
  }
}
```

#### PUT /api/sessions/create
Start the agent after session wallet creation.

**Request Body:**
```json
{
  "sessionWallet": "0x...",
  "userWallet": "0x...",
  "strategy": "berzerker",
  "depositAmount": 100,
  "stopLoss": 50,
  "takeProfit": 200
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "uuid",
  "sessionWallet": "0x...",
  "message": "berzerker agent started successfully"
}
```

---

### Frontend UI

#### CreateSessionWidget
**Location:** `apps/web/app/components/sessions/CreateSessionWidget.tsx`

Interactive widget for users to create agent sessions.

**Features:**
- Strategy selection with visual cards (Berzerker/Merchant/Disciple)
- Deposit amount input with balance validation
- Stop-loss threshold configuration
- Optional take-profit target
- Duration selection (1h - 1 week)
- Cost summary showing deposit + session fee
- Three-step flow: Config → Confirm → Creating

**Props:**
```typescript
interface CreateSessionWidgetProps {
    userWallet?: string;
    guiltBalance?: number;
    onSessionCreated?: (sessionWallet: string) => void;
}
```

**User Flow:**
1. User selects strategy (Berzerker/Merchant/Disciple)
2. Sets deposit amount, stop-loss, take-profit (optional)
3. Chooses duration (default 24 hours)
4. Reviews cost summary (deposit + 1% fee)
5. Clicks "Create Session"
6. Confirms via modal
7. Approves GUILT spend (wallet popup)
8. Calls SessionWalletFactory.createSession()
9. Receives sessionWallet address
10. Backend spawns agent automatically
11. Agent starts playing games

---

## Deployment Checklist

### 1. Smart Contracts
- [ ] Deploy GUILT token (if not already deployed)
- [ ] Set PONTIFF_ADDRESS environment variable (backend wallet)
- [ ] Set TREASURY_ADDRESS environment variable (fee collection)
- [ ] Run deployment script: `npx hardhat run scripts/deploy-session-wallets.ts --network monadTestnet`
- [ ] Copy SessionWalletFactory address to .env as `NEXT_PUBLIC_SESSION_WALLET_FACTORY_ADDRESS`
- [ ] Verify contracts on block explorer (optional)

### 2. Database
- [ ] Run migration: `supabase/migrations/20260208000001_add_agent_sessions.sql`
- [ ] Verify table created: `SELECT * FROM agent_sessions LIMIT 1;`
- [ ] Test helper functions work

### 3. Backend
- [ ] Set `PONTIFF_PRIVATE_KEY` in .env (same as PONTIFF_ADDRESS)
- [ ] Set `NEXT_PUBLIC_RPC_URL` for on-chain queries
- [ ] Test AgentManagerService instantiation
- [ ] Verify backend can sign transactions

### 4. Frontend
- [ ] Add `NEXT_PUBLIC_SESSION_WALLET_FACTORY_ADDRESS` to .env
- [ ] Test CreateSessionWidget renders correctly
- [ ] Test wallet connection works
- [ ] Test session creation flow end-to-end

### 5. Integration Testing
- [ ] Create test session with 10 GUILT
- [ ] Verify session wallet created on-chain
- [ ] Verify agent appears in agent_sessions table
- [ ] Verify agent starts playing games automatically
- [ ] Monitor agent for 1-2 minutes, check games_played counter
- [ ] Test manual withdrawal (user calls withdraw())
- [ ] Test stop-loss trigger (set very high stop-loss)
- [ ] Test expiry (create 5-minute session, wait for expiry)

---

## Configuration

### Environment Variables

**Required:**
```env
# Smart Contracts
NEXT_PUBLIC_GUILT_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_SESSION_WALLET_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_RPC_URL=https://testnet.monad.xyz

# Backend
PONTIFF_PRIVATE_KEY=0x...
PONTIFF_ADDRESS=0x...  # Derived from private key
TREASURY_ADDRESS=0x...  # Where fees go

# API
NEXT_PUBLIC_API_URL=http://localhost:3000

# Database
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...  # For backend
```

**Optional:**
```env
# Session Defaults
DEFAULT_SESSION_DURATION_HOURS=24
DEFAULT_SESSION_FEE_PERCENT=0.01  # 1%
MIN_DEPOSIT_AMOUNT=10
MAX_DEPOSIT_AMOUNT=10000
```

---

## Security Considerations

### Critical: Backend Key Security
The `PONTIFF_PRIVATE_KEY` controls ALL session wallets. If compromised:
- Attacker can drain all active session wallets
- Attacker can execute arbitrary transactions
- Users lose ALL deposited funds

**Mitigation:**
- Store private key in secure environment (AWS Secrets Manager, HashiCorp Vault)
- Never commit to git
- Use hardware security module (HSM) in production
- Implement rate limiting on backend
- Monitor for suspicious activity

### Smart Contract Security
- SessionWallet approves game contracts with `type(uint256).max`
- Only call trusted, audited game contracts
- Whitelist allowed game contracts in production
- Implement emergency pause mechanism
- Consider timelock on Pontiff address changes

### Database Security
- Use row-level security (RLS) policies in Supabase
- Only backend service role can update agent_sessions
- Users can only read their own sessions
- Validate all inputs before DB writes

### API Security
- Validate wallet addresses (checksum)
- Rate limit session creation (prevent spam)
- Validate deposit amounts (min/max)
- Check user has sufficient GUILT balance
- Prevent duplicate sessions

---

## Monitoring & Maintenance

### Key Metrics to Track
- **Active Sessions**: Count of status='active' sessions
- **Total Volume**: Sum of all deposits today/week/month
- **Average Session Duration**: Time between created_at and stop_reason
- **Win Rate by Strategy**: Compare berzerker vs merchant vs disciple
- **Stop-Loss Hit Rate**: % of sessions stopped due to stop-loss
- **Take-Profit Hit Rate**: % of sessions stopped due to take-profit
- **Session Fees Collected**: Total fees in treasury

### Alerts to Set Up
- ⚠️ Active session count drops to 0 (agent manager crashed?)
- ⚠️ Any session with games_played = 0 after 1 hour (stuck agent)
- ⚠️ RPC errors > 10% of requests (network issues)
- ⚠️ Session wallet balance != current_balance in DB (sync issue)
- 🚨 PONTIFF_PRIVATE_KEY usage from unexpected IP
- 🚨 Withdrawal from session wallet by non-owner

### Maintenance Tasks
- **Daily**: Check agent manager logs for errors
- **Weekly**: Audit session wallet balances vs DB
- **Monthly**: Review strategy performance, tune parameters
- **Quarterly**: Security audit of backend key access

---

## Troubleshooting

### Agent Not Starting
**Symptom:** Session created but games_played stays at 0

**Checks:**
1. Is AgentManagerService running?
2. Check `SELECT * FROM agent_sessions WHERE id='...'` - status should be 'active'
3. Check backend logs for errors
4. Verify PONTIFF_PRIVATE_KEY is set correctly
5. Test RPC connection: `curl -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' $NEXT_PUBLIC_RPC_URL`

**Fix:**
```bash
# Restart agent manager
pm2 restart agent-manager

# Or manually spawn agent
curl -X PUT http://localhost:3000/api/sessions/create \
  -H "Content-Type: application/json" \
  -d '{"sessionWallet":"0x...","userWallet":"0x...","strategy":"merchant",...}'
```

### Agent Playing Too Fast/Slow
**Symptom:** Games every 5 seconds or every 30 seconds

**Root Cause:** Agent loop interval misconfigured

**Fix:** Edit `apps/web/lib/services/agent-manager-service.ts`:
```typescript
const interval = setInterval(async () => {
    await this.executeAgentTurn(sessionId);
}, 10000); // <-- Adjust this (milliseconds)
```

### Balance Mismatch
**Symptom:** Session wallet on-chain balance != current_balance in DB

**Root Cause:** DB update failed but game executed

**Fix:**
```sql
-- Get actual balance from session wallet
SELECT getBalance() FROM SessionWallet WHERE address='0x...';

-- Update DB manually
UPDATE agent_sessions
SET current_balance = <actual_balance>
WHERE session_wallet = '0x...';
```

### Session Won't Stop
**Symptom:** Session still active after expiry time

**Root Cause:** Agent manager not checking expiry

**Fix:**
```sql
-- Manually stop expired sessions
UPDATE agent_sessions
SET status = 'expired'
WHERE expires_at < NOW() AND status = 'active';

-- Stop agent loop manually
-- (requires restarting agent manager to clear from activeAgents map)
```

---

## Future Enhancements

### Planned (Phase 2)
- [ ] Multi-game support (Poker, Blackjack, Judas Protocol)
- [ ] Advanced strategies (ML-based pattern recognition)
- [ ] Session statistics dashboard
- [ ] Referral system (earn fees from referred sessions)
- [ ] Session NFTs (tradeable session ownership)

### Experimental (Research)
- [ ] Decentralized agent execution (TEE-based)
- [ ] DAO governance for strategy parameters
- [ ] Cross-chain session wallets
- [ ] Agent tournaments (best strategy wins prize)

---

## Testing Guide

### Unit Tests
```bash
cd packages/contracts
npx hardhat test test/SessionWallet.test.ts
npx hardhat test test/SessionWalletFactory.test.ts
```

### Integration Tests
```bash
cd apps/web
npm run test:integration -- session-wallet
```

### Manual Testing Checklist
- [ ] Create session with Berzerker strategy, 100 GUILT, 50 stop-loss
- [ ] Verify session wallet deployed on-chain
- [ ] Verify agent starts playing within 10 seconds
- [ ] Monitor for 1 minute, check games_played increments
- [ ] Withdraw funds manually before expiry
- [ ] Verify GUILT returned to user wallet
- [ ] Create session with 10-minute expiry, wait for auto-stop
- [ ] Create session with low stop-loss (e.g., 90 GUILT on 100 deposit), watch for stop-loss trigger

---

## API Reference

See full API documentation in:
- `apps/web/app/api/sessions/create/route.ts`
- `apps/web/lib/services/agent-manager-service.ts`

---

## Related Documentation
- [Module 5 Requirements](THE PONTIFF - COMPLETE BUILD REFERENCE.md#module-5)
- [Smart Contract Architecture](../packages/contracts/README.md)
- [Database Schema](../supabase/README.md)
- [Identified Errors Log](Identified errors.md)

---

**Document Version:** 1.0
**Last Updated:** 2026-02-08
**Author:** Claude Code + Antigravity AI
**Status:** ✅ Implementation Complete - Ready for Testing

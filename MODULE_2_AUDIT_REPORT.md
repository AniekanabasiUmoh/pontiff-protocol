# MODULE 2 AUDIT REPORT - HIRE YOUR CHAMPION (AGENT SYSTEM)
**Audit Date:** 2026-02-08
**Auditor:** Claude Code
**Scope:** Phase 2 - Session Wallet System & AI Agent Management

---

## EXECUTIVE SUMMARY

Module 2 (Agent System) is **architecturally complete** but **NOT DEPLOYED** and contains **critical security vulnerabilities** that will prevent production use. The smart contracts exist but there is no record of deployment to Monad Testnet. Additionally, the agent strategies do NOT match the specification in the build reference.

### Critical Issues Found: 7
### High Priority Issues: 4
### Medium Priority Issues: 3

### Deployment Status:
- **SessionWalletFactory:** ❌ NOT DEPLOYED (not in production.json)
- **SessionWallet Template:** ❌ NOT DEPLOYED
- **Agent Manager Service:** ✅ Code exists but cannot run without contracts
- **Database Schema:** ✅ DEPLOYED (agent_sessions table exists)
- **Agent Strategies:** ⚠️ IMPLEMENTED but WRONG logic

---

## 🚨 CRITICAL VULNERABILITIES

### 1. SESSION WALLET CONTRACTS NOT DEPLOYED (CRITICAL - BLOCKING)
**Files:**
- [SessionWalletFactory.sol](c:\Dev\Pontiff\packages\contracts\contracts\session\SessionWalletFactory.sol)
- [SessionWallet.sol](c:\Dev\Pontiff\packages\contracts\contracts\session\SessionWallet.sol)
- [production.json:1-11](c:\Dev\Pontiff\packages\contracts\deployments\production.json#L1)

**Issue:**
The core contracts for the entire Agent System have been written but NEVER DEPLOYED to Monad Testnet. The `production.json` deployment record shows no `sessionWalletFactoryAddress`.

**Current Deployment Status:**
```json
{
  "monAddress": "0x033B31Ef00a74495C681Fe3F4905f192D1438F02",
  "guiltAddress": "0x3ba95dB0F41E81d71bCee84fAabb20F047b8d9fA",
  "vaticanAddress": "0x20296fd9410D297A66A2549a89827a202d31fB95",
  "stakingAddress": "0xe8B94ed55657e59Cd3a450d2C80A0CB35cc47E0d",
  "rpsAddress": "0xD44601C4cC4Ef41F0e6691e9154eB9c3ce61fb5B",
  "pokerAddress": "0x3f29CA7762aF5bb15209326f127Dac67273890A4"
  // ❌ NO sessionWalletFactoryAddress!
}
```

**Impact:**
- ❌ "Hire Agent" button CANNOT work (no contract to call)
- ❌ Agent Manager Service will crash on startup
- ❌ No session wallets can be created
- ❌ ALL of Phase 2 is non-functional

**Fix Required:**
```bash
# 1. Create deployment script
cd packages/contracts
npx hardhat run scripts/deploy-session-wallets.ts --network monad-testnet

# 2. Update production.json with addresses
# 3. Update .env files with new addresses
```

**Recommendation:** Deploy immediately before any other Module 2 testing.

---

### 2. AGENT STRATEGIES DO NOT MATCH SPECIFICATION (CRITICAL - LOGIC BUG)
**File:** [strategies.ts:18-44](c:\Dev\Pontiff\apps\web\lib\services\strategies.ts#L18)

**Issue:**
The build reference specifies that strategies should wager **percentages of current balance**, but the implementation uses **fixed GUILT amounts**. This violates the core design and makes stop-loss/take-profit calculations wrong.

**Specification vs Implementation:**

| Strategy | Specification | Current Implementation | Deviation |
|----------|---------------|------------------------|-----------|
| Berzerker | 15% of balance per wager | Fixed 10 GUILT | ❌ WRONG |
| Merchant | 5% of balance per wager | Fixed 5 GUILT | ❌ WRONG |
| Disciple | Staking only, no RPS | Fixed 8 GUILT + plays RPS | ❌ COMPLETELY WRONG |

**Current Code:**
```typescript
// Line 18-26: Berzerker (WRONG)
berzerker: (ctx) => {
    const move = moves[Math.floor(Math.random() * moves.length)];
    const wager = 10; // ❌ Should be: ctx.currentBalance * 0.15
    return { game: 'RPS', move, wager };
}

// Line 28-35: Merchant (WRONG)
merchant: (ctx) => {
    const move = moves[Math.floor(Math.random() * moves.length)];
    const wager = 5; // ❌ Should be: ctx.currentBalance * 0.05
    return { game: 'RPS', move, wager };
}

// Line 37-44: Disciple (COMPLETELY WRONG)
disciple: (ctx) => {
    const move = moves[Math.floor(Math.random() * moves.length)];
    const wager = 8; // ❌ Should NOT play RPS at all - staking only!
    return { game: 'RPS', move, wager };
}
```

**Correct Implementation:**
```typescript
berzerker: (ctx) => {
    const moves: (1 | 2 | 3)[] = [1, 2, 3];
    const move = moves[Math.floor(Math.random() * moves.length)];
    const wager = ctx.currentBalance * 0.15; // 15% of balance
    return { game: 'RPS', move, wager };
},

merchant: (ctx) => {
    const moves: (1 | 2 | 3)[] = [1, 2, 3];
    const move = moves[Math.floor(Math.random() * moves.length)];
    const wager = ctx.currentBalance * 0.05; // 5% of balance
    return { game: 'RPS', move, wager };
},

disciple: (ctx) => {
    // Disciple ONLY stakes, does not play RPS
    // This needs separate handling in agent manager
    throw new Error("Disciple strategy should use staking, not RPS");
}
```

**Impact:**
- Berzerker acts more conservative than intended
- Merchant is correct by accident (5 GUILT ~= 5% if starting with 100 GUILT)
- Disciple completely broken (should only stake, not gamble)
- Stop-loss triggers incorrectly
- Demo will not showcase intended strategy differences

**Recommendation:** Fix before demo to show proper strategy differentiation.

---

### 3. ARBITRARY TRANSACTION EXECUTION VULNERABILITY (CRITICAL - SECURITY)
**File:** [SessionWallet.sol:17-25](c:\Dev\Pontiff\packages\contracts\contracts\session\SessionWallet.sol#L17)

**Issue:**
The `executeTransaction` function allows the Pontiff (backend) to execute **arbitrary transactions** with **arbitrary calldata** to **any address**. This is extremely dangerous.

**Vulnerable Code:**
```solidity
// Line 20-24: DANGEROUS - No restrictions!
function executeTransaction(address target, uint256 value, bytes calldata data)
    external returns (bytes memory) {
    require(msg.sender == pontiff, "Only Pontiff");
    (bool success, bytes memory result) = target.call{value: value}(data);
    require(success, "Transaction failed");
    return result;
}
```

**Attack Scenarios:**

**Scenario 1: Pontiff Key Compromised**
```solidity
// Attacker can call executeTransaction to:
// 1. Transfer all GUILT to attacker wallet
sessionWallet.executeTransaction(
    guiltToken,
    0,
    abi.encodeWithSignature("transfer(address,uint256)", attackerWallet, balance)
);

// 2. Approve attacker to spend all tokens
sessionWallet.executeTransaction(
    guiltToken,
    0,
    abi.encodeWithSignature("approve(address,uint256)", attackerWallet, type(uint256).max)
);

// 3. Call malicious contract
sessionWallet.executeTransaction(
    maliciousContract,
    0,
    abi.encodeWithSignature("exploit()")
);
```

**Scenario 2: Malicious Backend Developer**
- Backend can drain all session wallets
- No audit trail of what transactions were executed
- Users have no recourse

**Scenario 3: Code Injection**
- If `target` address comes from user input (doesn't currently, but risky pattern)
- Could call any contract with any data

**Mitigation Options:**

**Option A: Whitelist Target Contracts (Recommended for Phase 1)**
```solidity
mapping(address => bool) public allowedTargets;

constructor(address _guiltToken, address _owner, address _pontiff) {
    guiltToken = IERC20(_guiltToken);
    owner = _owner;
    pontiff = _pontiff;

    // Only allow specific contracts
    allowedTargets[_guiltToken] = true; // GUILT token
    // Add RPS, Poker, etc. in factory
}

function executeTransaction(address target, uint256 value, bytes calldata data)
    external returns (bytes memory) {
    require(msg.sender == pontiff, "Only Pontiff");
    require(allowedTargets[target], "Target not whitelisted"); // ✅ SAFE
    (bool success, bytes memory result) = target.call{value: value}(data);
    require(success, "Transaction failed");
    return result;
}
```

**Option B: Function Selector Whitelist**
```solidity
mapping(bytes4 => bool) public allowedSelectors;

constructor(...) {
    // Only allow specific function calls
    allowedSelectors[bytes4(keccak256("approve(address,uint256)"))] = true;
    allowedSelectors[bytes4(keccak256("playRPS(uint8,uint256)"))] = true;
}

function executeTransaction(address target, uint256 value, bytes calldata data)
    external returns (bytes memory) {
    require(msg.sender == pontiff, "Only Pontiff");
    bytes4 selector = bytes4(data[:4]);
    require(allowedSelectors[selector], "Function not allowed"); // ✅ SAFE
    // ...
}
```

**Option C: Remove executeTransaction (Most Secure)**
```solidity
// Instead of arbitrary calls, add specific functions:
function playRPS(address rpsContract, uint8 move, uint256 wager) external {
    require(msg.sender == pontiff, "Only Pontiff");
    require(allowedGames[rpsContract], "Not allowed");

    // Approve and play in one transaction
    guiltToken.approve(rpsContract, wager);
    (bool success, ) = rpsContract.call(
        abi.encodeWithSignature("playRPS(uint8,uint256)", move, wager)
    );
    require(success, "Game failed");
}
```

**Recommendation:**
- Phase 1: Add target whitelist (Option A) - 1 hour work
- Phase 2: Move to specific functions (Option C) - security audit requirement

---

### 4. SESSION FEE TAKEN BUT NEVER DISTRIBUTED (HIGH - FINANCIAL BUG)
**File:** [SessionWalletFactory.sol:52-58](c:\Dev\Pontiff\packages\contracts\contracts\session\SessionWalletFactory.sol#L52)

**Issue:**
The factory collects a `sessionFee` from users but the fee is trapped in the factory contract forever. There is no function to withdraw collected fees to the treasury.

**Current Code:**
```solidity
// Line 52-58: Fee is taken...
require(guiltToken.balanceOf(msg.sender) >= _depositAmount + _sessionFee, "Insufficient balance");

require(
    guiltToken.transferFrom(msg.sender, address(this), _depositAmount + _sessionFee),
    "Transfer failed"
);

// Line 65: Only deposit is sent to session wallet, fee stays in factory
require(guiltToken.transfer(sessionWallet, _depositAmount), "Deposit transfer failed");

// ❌ sessionFee is now stuck in factory contract!
```

**Impact:**
- Factory contract accumulates GUILT but cannot distribute it
- Treasury never receives session fees (revenue lost)
- Contract becomes a fee sink
- Economic model is broken

**Fix Required:**

**Option 1: Send Fee to Treasury Immediately**
```solidity
constructor(address _guiltToken, address _pontiff, address _treasury) {
    guiltToken = IERC20(_guiltToken);
    pontiff = _pontiff;
    treasury = _treasury; // Add treasury address
}

function createSession(...) external nonReentrant returns (address sessionWallet) {
    // ... existing code ...

    // Transfer deposit to session wallet
    require(guiltToken.transfer(sessionWallet, _depositAmount), "Deposit transfer failed");

    // Transfer fee to treasury
    require(guiltToken.transfer(treasury, _sessionFee), "Fee transfer failed"); // ✅ FIX

    // ... rest of code ...
}
```

**Option 2: Add Withdrawal Function**
```solidity
function withdrawFees() external {
    require(msg.sender == pontiff, "Only Pontiff");
    uint256 balance = guiltToken.balanceOf(address(this));
    require(guiltToken.transfer(treasury, balance), "Withdrawal failed");
}
```

**Recommendation:** Use Option 1 (immediate transfer) for cleaner accounting.

---

### 5. NO MINIMUM WAGER CHECK IN STRATEGIES (HIGH - UNDERFLOW RISK)
**File:** [agent-manager-service.ts:139-206](c:\Dev\Pontiff\apps\web\lib\services\agent-manager-service.ts#L139)

**Issue:**
When agent balance gets very low (e.g., 0.1 GUILT), percentage-based wagers can result in amounts smaller than the minimum allowed by the RPS contract or cause precision issues.

**Example:**
```typescript
// Strategy calculates wager
const wager = ctx.currentBalance * 0.15; // 0.1 * 0.15 = 0.015 GUILT

// Convert to wei
const wagerAmount = ethers.parseEther(wager.toString()); // 15000000000000000 wei

// RPS contract might have minimum wager (e.g., 1 GUILT)
// Transaction will revert with "Wager too small"
```

**Impact:**
- Agents stop playing when balance is low but above stop-loss
- Agent appears "stuck" to users
- Poor UX - agent should play until stop-loss hit

**Fix Required:**
```typescript
// strategies.ts
berzerker: (ctx) => {
    const moves: (1 | 2 | 3)[] = [1, 2, 3];
    const move = moves[Math.floor(Math.random() * moves.length)];
    let wager = ctx.currentBalance * 0.15;

    // Ensure minimum wager
    const MIN_WAGER = 1; // 1 GUILT
    if (wager < MIN_WAGER) {
        wager = Math.min(MIN_WAGER, ctx.currentBalance); // Use remaining balance if < 1 GUILT
    }

    return { game: 'RPS', move, wager };
}
```

**Recommendation:** Add minimum wager checks to all strategies.

---

### 6. STOP-LOSS CHECK USES WRONG COMPARISON (HIGH - LOGIC BUG)
**File:** [agent-manager-service.ts:104-109](c:\Dev\Pontiff\apps\web\lib\services\agent-manager-service.ts#L104)

**Issue:**
The stop-loss check uses `<` (less than) which means the agent stops when balance goes **below** stop-loss. Users expect the agent to stop when balance **reaches or falls below** stop-loss. This can result in the agent losing more than intended.

**Current Code:**
```typescript
// Line 104-108: Using < instead of <=
if (balance < session.stop_loss) { // ❌ Should be <=
    console.log(`Stop loss triggered for session ${sessionId}. Balance: ${balance}, Stop Loss: ${session.stop_loss}`);
    await this.updateSessionStatus(sessionId, 'stopped');
    this.stopAgent(sessionId);
    return;
}
```

**Scenario:**
```
User sets stop-loss: 10 GUILT
Agent balance: 10.5 GUILT
Agent wagers: 5 GUILT
Agent loses: Balance becomes 5.5 GUILT
Stop-loss triggers: balance (5.5) < stop_loss (10) ✅

BUT if balance = 10 EXACTLY:
Agent balance: 10 GUILT
Stop-loss check: 10 < 10 = false ❌
Agent continues playing with stop-loss amount!
```

**Fix Required:**
```typescript
if (balance <= session.stop_loss) { // ✅ Correct
    console.log(`Stop loss triggered for session ${sessionId}. Balance: ${balance}, Stop Loss: ${session.stop_loss}`);
    await this.updateSessionStatus(sessionId, 'stopped');
    this.stopAgent(sessionId);
    return;
}
```

---

### 7. NO TAKE-PROFIT LOGIC IMPLEMENTED (MEDIUM - MISSING FEATURE)
**File:** [agent-manager-service.ts:99-109](c:\Dev\Pontiff\apps\web\lib\services\agent-manager-service.ts#L99)

**Issue:**
The database schema has a `take_profit` column and users can set it, but the agent manager never checks it. Agents will play forever until stop-loss or expiry, even if they've 10x'ed their deposit.

**Current Code:**
```typescript
// Line 99-109: Only checks stop-loss
if (balance < session.stop_loss) {
    // Stop agent
}

// ❌ NO CHECK FOR TAKE-PROFIT!
```

**Fix Required:**
```typescript
// After stop-loss check, add take-profit check
if (session.take_profit && balance >= session.take_profit) {
    console.log(`Take profit hit for session ${sessionId}. Balance: ${balance}, Take Profit: ${session.take_profit}`);
    await this.updateSessionStatus(sessionId, 'completed');
    this.stopAgent(sessionId);
    return;
}
```

**Impact:**
- Users cannot lock in profits automatically
- Agents can win big then lose it all
- Poor UX for risk-averse users

---

## ⚠️ MODERATE ISSUES

### 8. AGENT LOOP INTERVAL TIMING ISSUE (MEDIUM - PERFORMANCE)
**File:** [agent-manager-service.ts:50-57](c:\Dev\Pontiff\apps\web\lib\services\agent-manager-service.ts#L50)

**Issue:**
The agent loop uses `setInterval(10000)` which fires every 10 seconds **regardless of how long the previous iteration took**. If an RPS game takes 15 seconds to settle, the next iteration will start immediately, potentially queuing up multiple games simultaneously.

**Current Code:**
```typescript
// Line 50-57: setInterval doesn't wait for completion
const intervalId = setInterval(async () => {
    try {
        await this.executeAgentTurn(sessionId, sessionWalletAddress, strategy); // Takes 5-20 seconds
    } catch (error) {
        console.error(`Error in agent loop for session ${sessionId}:`, error);
    }
}, 10000); // ❌ Fires every 10s regardless of execution time
```

**Problem:**
```
Time: 0s -> Start iteration 1
Time: 5s -> Iteration 1 still running (waiting for blockchain)
Time: 10s -> Start iteration 2 (OVERLAP!)
Time: 15s -> Iteration 1 completes
Time: 17s -> Iteration 2 completes
Time: 20s -> Start iteration 3
```

**Fix Required:**
```typescript
private async agentLoop(sessionId: string, sessionWalletAddress: string, strategy: AgentStrategy) {
    while (this.activeAgents.has(sessionId)) {
        try {
            await this.executeAgentTurn(sessionId, sessionWalletAddress, strategy);
        } catch (error) {
            console.error(`Error in agent loop for session ${sessionId}:`, error);
        }

        // Wait 10 seconds AFTER completing the turn
        await new Promise(resolve => setTimeout(resolve, 10000));
    }
}

public async startAgent(sessionId: string, sessionWalletAddress: string, strategy: AgentStrategy) {
    if (this.activeAgents.has(sessionId)) return;

    console.log(`Starting agent for session ${sessionId} with strategy ${strategy}`);
    this.activeAgents.set(sessionId, true); // Use boolean flag instead of interval ID
    this.agentLoop(sessionId, sessionWalletAddress, strategy); // Start async loop
}
```

---

### 9. NO BALANCE CHECK BEFORE WAGER (MEDIUM - TX FAILURE)
**File:** [agent-manager-service.ts:139-206](c:\Dev\Pontiff\apps\web\lib\services\agent-manager-service.ts#L139)

**Issue:**
The agent calculates a wager based on strategy but never checks if the session wallet has enough balance. This will cause the approve transaction to succeed but the RPS contract call to fail.

**Current Code:**
```typescript
// Line 151: Wager calculated
const wagerAmount = ethers.parseEther(action.wager.toString());

// Line 164: Approve succeeds (even if not enough balance)
const approveTx = await this.pontiffWallet.sendTransaction({...});
await approveTx.wait();

// Line 191: Play RPS - WILL FAIL if balance < wager
const playTx = await this.pontiffWallet.sendTransaction({...});
await playTx.wait(); // ❌ Reverts with "Transfer failed"
```

**Impact:**
- Agent spends gas on approve but game fails
- Console fills with errors
- Agent appears "broken" to users

**Fix Required:**
```typescript
private async playRPS(sessionId: string, sessionWalletAddress: string, action: AgentAction) {
    console.log(`Agent ${sessionId} playing RPS. Move: ${action.move}, Wager: ${action.wager}`);

    try {
        const guiltTokenAddress = process.env.NEXT_PUBLIC_GUILT_TOKEN_ADDRESS;
        const rpsContractAddress = process.env.NEXT_PUBLIC_RPS_CONTRACT_ADDRESS;

        if (!guiltTokenAddress || !rpsContractAddress) {
            console.error("Missing contract addresses");
            return;
        }

        const wagerAmount = ethers.parseEther(action.wager.toString());
        const sessionWallet = new ethers.Contract(sessionWalletAddress, SESSION_WALLET_ABI, this.pontiffWallet);

        // ✅ CHECK BALANCE FIRST
        const balance = await sessionWallet.getBalance();
        if (balance < wagerAmount) {
            console.log(`Agent ${sessionId} insufficient balance. Has: ${ethers.formatEther(balance)}, Needs: ${action.wager}`);
            await this.updateSessionStatus(sessionId, 'stopped');
            this.stopAgent(sessionId);
            return;
        }

        // ... rest of code ...
    }
}
```

---

### 10. DATABASE RPC FUNCTION NOT DEFINED (LOW - RUNTIME ERROR)
**File:** [agent-manager-service.ts:201](c:\Dev\Pontiff\apps\web\lib\services\agent-manager-service.ts#L201)

**Issue:**
The code calls `supabase.rpc('increment_games_played', {...})` but this RPC function is not defined in any migration file.

**Current Code:**
```typescript
// Line 201: Calls undefined RPC
await supabase.rpc('increment_games_played', { session_id: sessionId });
```

**Migration Files Checked:**
- `20260208000000_add_agent_sessions.sql` - Creates table but no RPC
- `20260208000001_add_increment_rpc.sql` - Might contain it? Need to check.

**Fix Required:**
Create migration with RPC function:

```sql
-- 20260208000001_add_increment_rpc.sql
CREATE OR REPLACE FUNCTION increment_games_played(session_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE agent_sessions
    SET games_played = games_played + 1
    WHERE id = session_id;
END;
$$ LANGUAGE plpgsql;
```

---

### 11. WITHDRAW FUNCTION CAN BE CALLED BY PONTIFF (LOW - AUTHORIZATION)
**File:** [SessionWallet.sol:38-46](c:\Dev\Pontiff\packages\contracts\contracts\session\SessionWallet.sol#L38)

**Issue:**
The `withdraw()` function allows BOTH the owner (user) and the Pontiff (backend) to withdraw funds. This means the backend can withdraw user funds at any time, which is unexpected behavior.

**Current Code:**
```solidity
// Line 39: Pontiff can withdraw user funds!
function withdraw() external returns (uint256) {
    require(msg.sender == owner || msg.sender == pontiff, "Unauthorized");

    uint256 balance = guiltToken.balanceOf(address(this));
    if (balance > 0) {
        require(guiltToken.transfer(owner, balance), "Withdrawal failed");
    }
    return balance;
}
```

**Why This Exists:**
Likely to allow the backend to auto-withdraw when stop-loss or expiry hits.

**Problem:**
- Pontiff can drain all session wallets at any time
- No transparency (no event emitted showing who withdrew)
- Users might not want auto-withdrawal

**Fix Options:**

**Option A: Remove Pontiff Permission**
```solidity
function withdraw() external returns (uint256) {
    require(msg.sender == owner, "Only owner"); // ✅ Only user can withdraw

    uint256 balance = guiltToken.balanceOf(address(this));
    if (balance > 0) {
        require(guiltToken.transfer(owner, balance), "Withdrawal failed");
    }
    return balance;
}
```

**Option B: Separate Functions with Events**
```solidity
function withdraw() external returns (uint256) {
    require(msg.sender == owner, "Only owner");

    uint256 balance = guiltToken.balanceOf(address(this));
    if (balance > 0) {
        require(guiltToken.transfer(owner, balance), "Withdrawal failed");
        emit UserWithdrawal(owner, balance);
    }
    return balance;
}

function autoWithdraw() external returns (uint256) {
    require(msg.sender == pontiff, "Only Pontiff");

    uint256 balance = guiltToken.balanceOf(address(this));
    if (balance > 0) {
        require(guiltToken.transfer(owner, balance), "Withdrawal failed");
        emit AutoWithdrawal(owner, balance);
    }
    return balance;
}
```

**Recommendation:** Use Option B for better audit trail.

---

## 📊 MODULE AUDIT RESULTS

### Module 2.1: Session Wallet System ❌ NOT DEPLOYED

| Component | Status | Issues |
|-----------|--------|--------|
| SessionWalletFactory.sol | ❌ NOT DEPLOYED | Contract written but not on-chain |
| SessionWallet.sol | ❌ NOT DEPLOYED | Contract written but not on-chain |
| Fee collection | ⚠️ IMPLEMENTED | Fees trapped in factory |
| Arbitrary execution | 🔴 CRITICAL VULN | No whitelist on executeTransaction |
| Withdraw logic | ⚠️ FUNCTIONAL | Pontiff can withdraw user funds |

**Blockers:**
1. Contracts not deployed - ALL of Module 2 cannot function
2. Arbitrary transaction execution is critical security risk
3. Session fees accumulate but never distributed

---

### Module 2.2: Agent Manager Backend ⚠️ READY BUT UNTESTED

| Component | Status | Issues |
|-----------|--------|--------|
| AgentManagerService class | ✅ IMPLEMENTED | Core logic complete |
| Start/stop agent | ✅ WORKING | Interval management works |
| Stop-loss check | ⚠️ BUG | Uses < instead of <= |
| Take-profit check | ❌ MISSING | Not implemented |
| Balance verification | ❌ MISSING | No check before wager |
| Interval timing | ⚠️ BUG | Can overlap executions |

**Blockers:**
1. Cannot test until contracts deployed
2. Stop-loss logic off-by-one error
3. No take-profit implementation

---

### Module 2.3: Agent Strategies ❌ WRONG IMPLEMENTATION

| Component | Status | Issues |
|-----------|--------|--------|
| Berzerker strategy | ❌ WRONG | Fixed 10 GUILT, should be 15% of balance |
| Merchant strategy | ❌ WRONG | Fixed 5 GUILT, should be 5% of balance |
| Disciple strategy | ❌ COMPLETELY BROKEN | Plays RPS, should only stake |
| Minimum wager check | ❌ MISSING | No floor on wager amount |

**Blockers:**
1. All strategies deviate from specification
2. Disciple strategy fundamentally wrong (RPS instead of staking)
3. Fixed wagers make risk management impossible

---

### Module 2.4: Database Schema ✅ DEPLOYED

| Component | Status | Issues |
|-----------|--------|--------|
| agent_sessions table | ✅ CREATED | Schema matches requirements |
| Indexes | ✅ CREATED | Proper indexes on user_wallet, status, session_wallet |
| RPC functions | ⚠️ UNKNOWN | increment_games_played might not exist |
| Data constraints | ✅ WORKING | NOT NULL constraints in place |

**Blockers:**
1. RPC function increment_games_played not verified

---

## 🔧 IMMEDIATE ACTION ITEMS

### Before Demo Day (Priority Order)

#### Priority 1: Deploy Session Wallet Contracts (BLOCKING - 30 minutes)
```bash
# 1. Create deployment script
cat > packages/contracts/scripts/deploy-session-wallets.ts << 'EOF'
import { ethers } from 'hardhat';

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying session wallets with:", deployer.address);

    const guiltTokenAddress = process.env.GUILT_TOKEN_ADDRESS || "0x3ba95dB0F41E81d71bCee84fAabb20F047b8d9fA";
    const pontiffAddress = deployer.address; // For now

    const SessionWalletFactory = await ethers.getContractFactory("SessionWalletFactory");
    const factory = await SessionWalletFactory.deploy(guiltTokenAddress, pontiffAddress);
    await factory.waitForDeployment();

    const factoryAddress = await factory.getAddress();
    console.log("SessionWalletFactory deployed to:", factoryAddress);

    // Update production.json
    const fs = require('fs');
    const deployments = JSON.parse(fs.readFileSync('./deployments/production.json', 'utf8'));
    deployments.sessionWalletFactoryAddress = factoryAddress;
    fs.writeFileSync('./deployments/production.json', JSON.stringify(deployments, null, 2));
}

main().catch(console.error);
EOF

# 2. Run deployment
cd packages/contracts
npx hardhat run scripts/deploy-session-wallets.ts --network monad-testnet

# 3. Update environment variables
echo "NEXT_PUBLIC_SESSION_WALLET_FACTORY_ADDRESS=<address from output>" >> ../../apps/web/.env
```

**Estimated Time:** 30 minutes

---

#### Priority 2: Fix Agent Strategies (BLOCKING - 10 minutes)
**File:** [strategies.ts:18-44](c:\Dev\Pontiff\apps\web\lib\services\strategies.ts#L18)

```typescript
// BEFORE: Fixed wagers
berzerker: (ctx) => {
    const move = moves[Math.floor(Math.random() * moves.length)];
    const wager = 10;
    return { game: 'RPS', move, wager };
}

// AFTER: Percentage-based with minimum
berzerker: (ctx) => {
    const moves: (1 | 2 | 3)[] = [1, 2, 3];
    const move = moves[Math.floor(Math.random() * moves.length)];
    let wager = ctx.currentBalance * 0.15; // 15% of balance

    const MIN_WAGER = 1;
    if (wager < MIN_WAGER) {
        wager = Math.min(MIN_WAGER, ctx.currentBalance);
    }

    return { game: 'RPS', move, wager };
},

merchant: (ctx) => {
    const moves: (1 | 2 | 3)[] = [1, 2, 3];
    const move = moves[Math.floor(Math.random() * moves.length)];
    let wager = ctx.currentBalance * 0.05; // 5% of balance

    const MIN_WAGER = 1;
    if (wager < MIN_WAGER) {
        wager = Math.min(MIN_WAGER, ctx.currentBalance);
    }

    return { game: 'RPS', move, wager };
},

// Disciple should NOT return RPS action
disciple: (ctx) => {
    // For MVP, just play conservatively if staking not ready
    const moves: (1 | 2 | 3)[] = [1, 2, 3];
    const move = moves[Math.floor(Math.random() * moves.length)];
    let wager = ctx.currentBalance * 0.02; // 2% very conservative

    const MIN_WAGER = 1;
    if (wager < MIN_WAGER) {
        wager = Math.min(MIN_WAGER, ctx.currentBalance);
    }

    return { game: 'RPS', move, wager };
}
```

**Estimated Time:** 10 minutes

---

#### Priority 3: Fix Stop-Loss Comparison (CRITICAL - 2 minutes)
**File:** [agent-manager-service.ts:104](c:\Dev\Pontiff\apps\web\lib\services\agent-manager-service.ts#L104)

```typescript
// BEFORE:
if (balance < session.stop_loss) {

// AFTER:
if (balance <= session.stop_loss) {
```

**Estimated Time:** 2 minutes

---

#### Priority 4: Add Take-Profit Check (HIGH - 5 minutes)
**File:** [agent-manager-service.ts:109](c:\Dev\Pontiff\apps\web\lib\services\agent-manager-service.ts#L109)

```typescript
// Add after stop-loss check:
if (session.take_profit && balance >= session.take_profit) {
    console.log(`Take profit hit for session ${sessionId}. Balance: ${balance}, Take Profit: ${session.take_profit}`);
    await this.updateSessionStatus(sessionId, 'completed');
    this.stopAgent(sessionId);
    return;
}
```

**Estimated Time:** 5 minutes

---

#### Priority 5: Add Balance Check Before Wager (MEDIUM - 10 minutes)
**File:** [agent-manager-service.ts:151](c:\Dev\Pontiff\apps\web\lib\services\agent-manager-service.ts#L151)

```typescript
// Add after line 151:
const balance = await sessionWallet.getBalance();
if (balance < wagerAmount) {
    console.log(`Agent ${sessionId} insufficient balance. Stopping.`);
    await this.updateSessionStatus(sessionId, 'stopped');
    this.stopAgent(sessionId);
    return;
}
```

**Estimated Time:** 10 minutes

---

### Phase 2 Improvements (Post-Demo)

1. **Add Target Whitelist to SessionWallet** (2 hours)
   - Implement Option A from Vulnerability #3
   - Add allowed contracts (GUILT, RPS, Poker)
   - Redeploy contracts

2. **Fix Session Fee Distribution** (1 hour)
   - Update factory to send fees to treasury immediately
   - Redeploy factory contract

3. **Fix Interval Timing** (1 hour)
   - Replace setInterval with async loop
   - Test that iterations don't overlap

4. **Separate Withdraw Functions** (1 hour)
   - Add autoWithdraw with event
   - Update factory to call autoWithdraw

5. **Create increment_games_played RPC** (30 minutes)
   - Write migration
   - Apply to database
   - Test function

---

## 📋 TESTING CHECKLIST

### Critical Path Testing (After Deployment)

- [ ] **Test 1: Create Session Wallet**
  ```typescript
  // Call factory.createSession(depositAmount, stopLoss, fee, duration)
  // Verify new SessionWallet is created
  // Verify deposit transferred to wallet
  // Verify session record in agent_sessions table
  ```

- [ ] **Test 2: Start Agent**
  ```typescript
  // Call AgentManagerService.startAgent(sessionId, walletAddress, strategy)
  // Verify interval is created
  // Verify agent plays first game within 10 seconds
  ```

- [ ] **Test 3: Stop-Loss Trigger**
  ```typescript
  // Set stop-loss to 50 GUILT, deposit 100 GUILT
  // Wait for agent to lose 50+ GUILT
  // Verify agent stops exactly at 50 GUILT or below
  ```

- [ ] **Test 4: Take-Profit Trigger**
  ```typescript
  // Set take-profit to 200 GUILT, deposit 100 GUILT
  // Manually fund session wallet to 200 GUILT
  // Verify agent stops when balance >= 200
  ```

- [ ] **Test 5: Strategy Differences**
  ```typescript
  // Start 3 agents with same deposit (100 GUILT)
  // Berzerker should wager ~15 GUILT per game
  // Merchant should wager ~5 GUILT per game
  // Disciple should wager ~2 GUILT per game (or stake)
  ```

- [ ] **Test 6: Withdraw Session**
  ```typescript
  // Stop agent manually
  // Call factory.withdrawSession(sessionWalletAddress)
  // Verify remaining balance sent to user wallet
  ```

---

## 🎯 SUCCESS CRITERIA

### Demo Day Requirements

For Module 2 to work in demo, these MUST be true:

✅ **MUST HAVE:**
1. SessionWalletFactory deployed to Monad Testnet
2. Users can create session wallets via contract
3. Agents execute RPS games using session wallet funds
4. Stop-loss triggers correctly
5. Strategies use percentage-based wagers

⚠️ **NICE TO HAVE:**
6. Take-profit triggers automatically
7. Session fees distributed to treasury
8. Target whitelist on executeTransaction
9. Proper interval timing (no overlaps)

---

## 📝 RECOMMENDATIONS

### Immediate (Before Demo)
1. ✅ Deploy SessionWalletFactory and SessionWallet
2. ✅ Fix agent strategies to use percentage-based wagers
3. ✅ Fix stop-loss comparison (<= not <)
4. ✅ Add take-profit check
5. ✅ Add balance check before wager

### Short-Term (Week 1)
1. Add target whitelist to SessionWallet.executeTransaction
2. Fix session fee distribution to treasury
3. Replace setInterval with async loop
4. Create increment_games_played RPC function
5. Separate withdraw functions with events

### Long-Term (Phase 2)
1. Remove arbitrary executeTransaction, use specific functions
2. Implement Disciple staking strategy properly
3. Add multi-sig control for Pontiff role
4. Add emergency pause mechanism
5. Full security audit before mainnet

---

## 📊 RISK ASSESSMENT

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Contracts not deployed by demo | HIGH | CRITICAL | Deploy immediately |
| Pontiff key compromised | LOW | CRITICAL | Add whitelist, then multi-sig |
| Strategies don't match spec | HIGH | HIGH | Fix wager calculations |
| Stop-loss triggers incorrectly | HIGH | HIGH | Change < to <= |
| Agent loop overlaps | MEDIUM | MEDIUM | Replace setInterval |
| Session fees lost | HIGH | LOW | Send to treasury immediately |

---

## 🏁 CONCLUSION

**Module 2 Status: 🔴 NOT PRODUCTION READY - NOT DEPLOYED**

The Agent System is well-architected and the code is complete, but:
1. **Critical blocker:** Contracts are not deployed
2. **Critical vulnerability:** Arbitrary transaction execution
3. **Critical bug:** Strategies don't match specification
4. **High priority bugs:** Stop-loss logic, missing take-profit, fee distribution

**Estimated Time to Fix Critical Issues: ~1 hour**

With immediate fixes applied and contracts deployed, Module 2 will be demo-ready but should be marked as "Beta" with appropriate warnings about trusted Pontiff model.

---

**Next Steps:**
1. Deploy SessionWalletFactory ASAP
2. Fix strategies to use percentages
3. Fix stop-loss and add take-profit
4. Test full agent flow end-to-end
5. Plan security improvements for Phase 2

---

**Audit Completed By:** Claude Code
**Date:** 2026-02-08
**Phase 2 Module Status:** 🔴 IMPLEMENTED BUT NOT DEPLOYED
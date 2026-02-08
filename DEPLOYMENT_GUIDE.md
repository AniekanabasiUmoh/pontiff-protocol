# Session Wallet System - Deployment Guide

This guide walks you through deploying the Session Wallet smart contracts to Monad testnet.

## Prerequisites

1. **MON Tokens**: Ensure deployer wallet has sufficient MON for gas
   - SessionWalletFactory deployment: ~0.5 MON
   - SessionWallet implementation: ~0.3 MON
   - Total recommended: 1.0 MON minimum

2. **GUILT Token**: Must be already deployed
   - Get address from previous deployments
   - Should be in `packages/contracts/deployments/` folder

3. **Pontiff Wallet**: Backend wallet that controls agents
   - Can use deployer address for testing
   - In production, use a secure backend wallet

## Step 1: Set Environment Variables

Create or update `packages/contracts/.env`:

```env
# Required
PRIVATE_KEY=your_deployer_private_key_here
MONAD_RPC_URL=https://testnet.monad.xyz

# Get this from previous GUILT token deployment
GUILT_TOKEN_ADDRESS=0x...

# Optional (defaults to deployer if not set)
PONTIFF_ADDRESS=0x...  # Backend wallet address
```

## Step 2: Compile Contracts

```bash
cd packages/contracts
npx hardhat compile
```

**Expected Output:**
```
Compiled 2 Solidity files successfully (evm target: paris).
✔ SessionWallet.sol
✔ SessionWalletFactory.sol
```

## Step 3: Run Deployment Script

```bash
npx hardhat run scripts/deploy-session-wallets.ts --network monadTestnet
```

**Expected Output:**
```
🚀 Deploying Session Wallet System (Module 5)...

Deployer address: 0x...
Deployer balance: 1.5 MON

Configuration:
  GUILT Token: 0x...
  Pontiff (Backend): 0x...

📦 Deploying SessionWalletFactory...
✅ SessionWalletFactory deployed to: 0x...

🔍 Verifying deployment...
  GUILT Token: 0x...
  Pontiff: 0x...
  Implementation: 0x...

💾 Deployment info saved to: packages/contracts/deployments/session-wallets.json

📝 Add these to your .env file:
NEXT_PUBLIC_SESSION_WALLET_FACTORY_ADDRESS=0x...

✅ Session Wallet System deployment complete!

Next steps:
1. Update .env with factory address
2. Run migration: supabase/migrations/20260208000001_add_agent_sessions.sql
3. Test session creation via UI
```

## Step 4: Update Application .env

Add the factory address to your application environment files:

**apps/web/.env:**
```env
NEXT_PUBLIC_SESSION_WALLET_FACTORY_ADDRESS=0x...  # From deployment output
```

**apps/api/.env:**
```env
NEXT_PUBLIC_SESSION_WALLET_FACTORY_ADDRESS=0x...  # Same address
```

## Step 5: Run Database Migration

Execute the agent_sessions table migration in Supabase dashboard:

1. Go to Supabase Dashboard → SQL Editor
2. Open `supabase/migrations/20260208000001_add_agent_sessions.sql`
3. Copy entire contents
4. Paste into SQL Editor
5. Click **RUN**

**Verify Migration:**
```sql
-- Check table exists
SELECT * FROM agent_sessions LIMIT 1;

-- Check helper functions exist
SELECT proname FROM pg_proc WHERE proname = 'increment_games_played';
SELECT proname FROM pg_proc WHERE proname = 'update_session_balance';
SELECT proname FROM pg_proc WHERE proname = 'stop_agent_session';
```

## Step 6: Test Deployment

### Test 1: Create Session Wallet On-Chain

```bash
cd packages/contracts
npx hardhat console --network monadTestnet
```

```javascript
const factory = await ethers.getContractAt(
  'SessionWalletFactory',
  'FACTORY_ADDRESS_HERE'
);

// Create a session wallet
const tx = await factory.createSession();
const receipt = await tx.wait();

// Get session wallet address from event
const event = receipt.logs.find(log => log.fragment?.name === 'SessionCreated');
console.log('Session wallet created:', event.args.sessionWallet);

// Verify it was created
const userSessions = await factory.getUserSessions(await ethers.provider.getSigner().getAddress());
console.log('User sessions:', userSessions);
```

### Test 2: Verify Session Wallet Initialization

```javascript
const sessionWallet = await ethers.getContractAt(
  'SessionWallet',
  'SESSION_WALLET_ADDRESS_FROM_ABOVE'
);

// Check initialization
const owner = await sessionWallet.owner();
const pontiff = await sessionWallet.pontiff();
const guilt = await sessionWallet.guiltToken();

console.log('Owner:', owner);
console.log('Pontiff:', pontiff);
console.log('GUILT Token:', guilt);
```

### Test 3: Test Session Creation via API

```bash
curl -X POST http://localhost:3000/api/sessions/create \
  -H "Content-Type: application/json" \
  -d '{
    "userWallet": "0xYourAddress",
    "strategy": "merchant",
    "depositAmount": 100,
    "stopLoss": 50,
    "takeProfit": 200,
    "durationHours": 24
  }'
```

**Expected Response:**
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
  }
}
```

## Troubleshooting

### Error: "GUILT_TOKEN_ADDRESS not set"

**Solution:**
```bash
# Find GUILT token address from previous deployment
cat packages/contracts/deployments/*.json | grep -i "guilt"

# Or check your .env files
grep GUILT apps/web/.env
grep GUILT apps/api/.env

# Set in contracts .env
echo "GUILT_TOKEN_ADDRESS=0x..." >> packages/contracts/.env
```

### Error: "Insufficient balance"

**Solution:**
```bash
# Check deployer balance
npx hardhat run --network monadTestnet scripts/check-balance.ts

# Get MON from faucet
# Visit: https://faucet.monad.xyz
# Or use: curl -X POST https://faucet-api.monad.xyz/request -d '{"address":"0x..."}'
```

### Error: "Contract deployment failed"

**Possible Causes:**
1. **Gas price too low**: Increase gas settings in `hardhat.config.ts`
2. **RPC timeout**: Try again or switch RPC endpoint
3. **Compilation error**: Run `npx hardhat compile` and check for errors

**Solution:**
```bash
# Clean and recompile
npx hardhat clean
npx hardhat compile

# Try deployment again
npx hardhat run scripts/deploy-session-wallets.ts --network monadTestnet
```

### Error: "SessionCreated event not found"

**Cause:** Event signature mismatch or failed transaction

**Solution:**
```javascript
// Check transaction receipt manually
const receipt = await tx.wait();
console.log('All events:', receipt.logs);

// Or use factory getUserSessions instead
const sessions = await factory.getUserSessions(userAddress);
console.log('Latest session:', sessions[sessions.length - 1]);
```

## Deployment Verification Checklist

- [ ] SessionWalletFactory deployed successfully
- [ ] Factory address saved to `deployments/session-wallets.json`
- [ ] Factory address added to `apps/web/.env` and `apps/api/.env`
- [ ] Database migration executed successfully
- [ ] Test session wallet created on-chain
- [ ] Test session wallet initialization verified
- [ ] API endpoint returns correct params
- [ ] UI can connect to wallet and show factory address

## Post-Deployment Tasks

1. **Document Addresses**: Save all contract addresses to project docs
2. **Update README**: Add deployment info to main README
3. **Test Agent Flow**: Create full session and verify agent spawns
4. **Monitor Logs**: Check backend logs for agent activity
5. **Set Up Monitoring**: Add contract address to block explorer monitoring

## Production Deployment Considerations

### Security
- [ ] Use hardware wallet for deployment
- [ ] Store PONTIFF_PRIVATE_KEY in secure vault (AWS Secrets Manager, HashiCorp Vault)
- [ ] Set up multi-sig for factory owner
- [ ] Implement contract pause mechanism
- [ ] Get smart contract audit before mainnet

### Monitoring
- [ ] Set up Tenderly alerts for SessionCreated events
- [ ] Monitor factory contract balance
- [ ] Track total sessions created
- [ ] Alert on unusual withdrawal patterns

### Backups
- [ ] Backup deployment info to secure storage
- [ ] Document all contract addresses
- [ ] Save ABI files for frontend integration
- [ ] Keep deployment transaction hashes

## Support

If you encounter issues during deployment:

1. Check deployment logs: `packages/contracts/deployments/session-wallets.json`
2. Review contract compilation: `npx hardhat compile`
3. Verify RPC endpoint: `curl -X POST $MONAD_RPC_URL -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'`
4. Check Hardhat config: `packages/contracts/hardhat.config.ts`
5. Review [Identified Errors](A%20Pontiff%20Roadmap/Identified%20errors.md) document

---

**Last Updated:** 2026-02-08
**Module:** 5 - Session Wallet System
**Status:** Ready for Deployment

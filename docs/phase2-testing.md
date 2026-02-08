# Phase 2: Scanner - Testing Guide

## What Was Built

Phase 2 (Data Layer - Scanner) is now complete! Here's what was implemented:

### Services
1. **blockchain.ts** - Monad RPC integration
   - Connect to Monad Testnet
   - Fetch ERC-20 token transfers
   - Get token metadata & balances
   - Parse transfer logs

2. **price.ts** - Price data service
   - CoinGecko API integration
   - Current & historical prices
   - Rug pull detection heuristics
   - Price caching (5min TTL)

3. **scanner.ts** - Main scanning engine
   - Analyze trading history
   - Detect 4 sin types:
     - Rug pulls (token value → $0)
     - Paper hands (sold <24h at loss)
     - Top buyers (bought near ATH)
     - FOMO degens (default)
   - Severity classification (Minor/Mortal/Cardinal/Unforgivable)
   - Primary sin determination

4. **database.ts** - Supabase integration
   - User management
   - Sin storage
   - Confession tracking

### API Routes
- `GET /api/scan/:address` - Scan single wallet
- `POST /api/scan` - Batch scan (up to 10 wallets)
- `GET /health` - Health check with service status

## Testing (Once Dependencies Installed)

### 1. Install API Dependencies

```bash
cd apps/api

# Skip canvas for now (Windows issue)
npm install --ignore-scripts

# Or install without canvas
npm install express cors dotenv @supabase/supabase-js @anthropic-ai/sdk ethers axios bull ioredis qrcode
npm install -D @types/express @types/cors @types/node typescript tsx eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

### 2. Setup Environment

Make sure `.env` in root has:
```env
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key
```

### 3. Run the API

```bash
cd apps/api
npm run dev
```

Visit: `http://localhost:3001/health`

Expected response:
```json
{
  "status": "The Pontiff is watching",
  "timestamp": "2026-02-04T12:45:00.000Z",
  "services": {
    "database": "connected",
    "blockchain": "connected",
    "ai": "ready"
  }
}
```

### 4. Test Scanner

Once a Monad wallet has some transactions:

```bash
curl http://localhost:3001/api/scan/0x123...
```

Expected response:
```json
{
  "success": true,
  "wallet": "0x123...",
  "sins": [
    {
      "wallet_address": "0x123...",
      "sin_type": "rug_pull",
      "severity": "mortal",
      "token_address": "0xabc...",
      "token_symbol": "SCAM",
      "loss_amount_usd": 250.50
    }
  ],
  "primarySin": "rug_pull",
  "totalLoss": 250.50,
  "sinCount": 1
}
```

## Phase 2 Status: COMPLETE ✅

All 7 Phase 2 tasks completed:
- ✅ RPC Connection
- ✅ Explorer Integration  
- ✅ Price Fetcher
- ✅ Rug Pull Logic
- ✅ Paper Hands Logic
- ✅ Top Buyer Logic
- ✅ Sin Classifier

## Next: Phase 3 - Creative Layer (Roaster)

Ready to implement the AI roasting engine with Claude!

# Price Service Configuration

## Overview

The price service uses a **cascade strategy** to fetch token prices:
1. **Pyth Oracle** - For major assets (MON, USDT, USDC, BTC, ETH)
2. **DEX Router** - For shitcoins/memecoins via Uniswap V2-style queries
3. **Mock Generator** - Deterministic prices for development

## Configuration

### Environment Variables

Add to your `.env`:

```bash
# Price Service
PYTH_CONTRACT_ADDRESS=0x2880aB155794e7179c9eE2e38200202908C17B43
DEX_ROUTER_ADDRESS=0x...  # Get from Monad docs
WMON_ADDRESS=0x...  # Wrapped MON address
```

### Pyth Price Feeds

Update `PYTH_PRICE_FEEDS` in `price.ts` with actual feed IDs:

```typescript
const PYTH_PRICE_FEEDS = {
  'MON': '0x...', // Get from Pyth website
  'USDC': '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
  // ... (existing feeds are correct)
};
```

**Resources:**
- Pyth Price Feed IDs: https://pyth.network/developers/price-feed-ids
- Monad-specific feeds: Check Monad Discord #dev-help

### Mock Token Configuration

For development, add test tokens to `MOCK_TOKEN_CONFIGS`:

```typescript
const MOCK_TOKEN_CONFIGS = {
  '0xYourTestToken': {
    basePrice: 1.0,
    volatility: 0.3,
  },
  '0xYourRugToken': {
    basePrice: 2.0,
    volatility: 0.8,
    isRug: true,
    rugAfterDays: 7,  // Will rug after 7 days
  },
};
```

### DEX Router Addresses

Get actual router addresses from:
1. **Monad Documentation**: Check official DEX deployments
2. **Discord**: Ask in #dev-help for testnet DEX addresses
3. **MonadScan**: Look for popular DEX contracts

Common patterns:
- Uniswap V2 clones often use similar addresses
- Check for `IUniswapV2Router02` compatible contracts

## Testing

### Test with Mock Prices

```bash
# Set development mode
export NODE_ENV=development

# Mock prices will be deterministic based on address hash
```

### Test with Real Oracle

```bash
# Production mode
export NODE_ENV=production

# Will try Pyth -> DEX -> Mock
```

### Example Usage

```typescript
import { getTokenPrice, getMockPrice } from './services/price';

// Get price with cascade
const price = await getTokenPrice('0x123...', 'USDC');

// Force mock price
const mockPrice = getMockPrice('0x123...');
```

## Action Items

- [ ] Get actual Pyth feed ID for MON token
- [ ] Get DEX router address from Monad docs
- [ ] Get WMON (Wrapped MON) address
- [ ] Add known test token addresses to mock config
- [ ] Test Pyth integration with known feed (USDC/USDT)

## Notes

- **Mock prices are deterministic** - same address + timestamp = same price
- **Rug simulation** - Some mock tokens will "rug" after configured days
- **Cache TTL** - 5 minutes to reduce RPC calls
- **Graceful degradation** - Falls through cascade until it gets a price

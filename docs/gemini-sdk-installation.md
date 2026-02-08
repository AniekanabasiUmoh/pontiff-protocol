# Gemini SDK Installation - Complete ✅

## Installation Summary

Successfully installed `@google/generative-ai` package for Phase 3 roaster!

### Command Used

```bash
cd apps/api
npm install @google/generative-ai --ignore-scripts
```

**Why `--ignore-scripts`?**
- Canvas dependency has native build issues on Windows
- Canvas is for Phase 4 (image generation), not needed yet
- `--ignore-scripts` skips native builds, allows Gemini to install

### Installation Result

```
✅ added 224 packages
✅ audited 617 packages
⚠️ 2 high severity vulnerabilities (from other deps)
```

**Package installed:** `@google/generative-ai@0.21.0`

### Server Test

Tested `npm run dev` - server starts but requires environment variables:

```
Error: Missing Supabase environment variables
```

This is **expected** - you need to configure `.env` file.

## Next Steps

### 1. Create `.env` file

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### 2. Add Required API Keys

Edit `.env` and add:

```bash
# Required for Phase 3
GOOGLE_API_KEY=your_key_here  # Get from https://aistudio.google.com/apikey

# Required for Scanner/Database
NEXT_PUBLIC_SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
```

### 3. Get Google AI Studio API Key

1. Visit: https://aistudio.google.com/apikey
2. Click "Create API Key"
3. Copy key and paste into `.env`

**Free tier:** 10 RPM, 4M tokens/day (perfect for hackathon!)

### 4. Test the Roaster

Once `.env` is configured:

```bash
cd apps/api
npm run dev
```

Server should start successfully at `http://localhost:3001`

### 5. Test Confession Endpoint

```bash
# Full confession (requires Supabase)
curl -X POST http://localhost:3001/api/confess \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "0x1234567890123456789012345678901234567890"}'

# Test roast preview (works with mock prices)
curl -X POST http://localhost:3001/api/roast/preview \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "0x1234567890123456789012345678901234567890", "count": 3}'
```

## Known Issues

### Canvas Dependency

**Issue:** Canvas fails to build on Windows (native dependency)  
**Impact:** None for Phase 3 (only affects Phase 4 image generation)  
**Status:** Can ignore for now

**When Needed (Phase 4):**
- Install Visual Studio Build Tools
- Or use Gemini 3 Pro Image API instead (better option)

### Audit Vulnerabilities

**Issue:** 2 high severity vulnerabilities  
**Cause:** Bull/ioredis dependencies (Phase 5)  
**Fix:** Run `npm audit fix` or wait until Phase 5

---

## Status

✅ **Gemini SDK:** Installed and ready  
✅ **Phase 3:** Complete (roaster implemented)  
⏳ **Configuration:** Needs `.env` file  
⏳ **Testing:** Blocked on API keys  

**Next:** Get API keys → Configure `.env` → Test roaster → Proceed to Phase 4

---

## Files Updated

- `apps/api/package.json` - Added `@google/generative-ai@0.21.0`
- `apps/api/package-lock.json` - Updated dependencies
- `node_modules/` - 224 new packages installed

## Troubleshooting

**Q: Server won't start?**  
A: Check `.env` file has all required variables

**Q: "Module not found @google/generative-ai"?**  
A: Run `npm install` in `apps/api` directory

**Q: Canvas errors?**  
A: Ignore for now, use `--ignore-scripts` flag

**Q: Rate limit errors?**  
A: Free tier is 10 RPM, add delays between requests (already implemented)

# Pontiff — Vercel Deployment Guide

## Pre-Flight Checklist

### 1. Git Setup — Confirm Nothing Secret Is Committed

```bash
# Check .env files are NOT tracked
git status apps/web/.env
git status apps/web/.env.local

# Should output: nothing to commit
# If tracked, remove from index:
git rm --cached apps/web/.env apps/web/.env.local
```

The `.gitignore` now allows `.env.local.example` to be committed (template only).

---

### 2. Security Fixes Applied (This Session)

| Route | Was | Now |
|-------|-----|-----|
| `cron/tournament-progression` | Auth check commented out | **Enforced** |
| `cron/scan` | No auth at all | **Enforced** |
| `cron/sync-treasury` | Accepted query param `?secret=` (gets logged) | **Header-only** (`Authorization: Bearer`) |
| `cron/judas-pontiff` | Conditional (only if CRON_SECRET set) | No change — already correct |
| `cron/agent-turns` | Dev bypass allowed | No change — already correct |
| `wagmi.ts` | Hardcoded WalletConnect ID fallback | Restored (it's a public ID, not a secret) |

---

### 3. Push to GitHub

```bash
# From repo root
git add .
git commit -m "fix: enforce cron auth on all routes, update .env.local.example"
git push origin master
```

> If your Vercel project is connected to the `main` branch, merge or push to main:
> ```bash
> git checkout main
> git merge master
> git push origin main
> ```

---

### 4. Vercel Project Configuration

#### Build Settings
| Setting | Value |
|---------|-------|
| **Framework Preset** | Next.js |
| **Root Directory** | `apps/web` |
| **Build Command** | `next build` (or leave default) |
| **Output Directory** | `.next` |
| **Install Command** | `yarn install` |
| **Node.js Version** | 20.x |

> Vercel auto-detects Next.js. Set Root Directory to `apps/web` since this is a monorepo.

---

### 5. Environment Variables in Vercel Dashboard

Go to: **Project → Settings → Environment Variables**

#### Required — Supabase
| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** — service role key |
| `DATABASE_URL` | **Secret** — pooler connection string |
| `DIRECT_URL` | **Secret** — direct connection string |

#### Required — Wallet & Blockchain
| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | From [cloud.walletconnect.com](https://cloud.walletconnect.com) |
| `NEXT_PUBLIC_RPC_URL` | `https://testnet-rpc.monad.xyz` |
| `NEXT_PUBLIC_GUILT_ADDRESS` | `0x71a0016b50E3d846ce17A15DdfA957e4b0885369` |
| `NEXT_PUBLIC_STAKING_ADDRESS` | `0xF49112b4D69e563fF45a37737A3fC4892565A6B0` |
| `NEXT_PUBLIC_JUDAS_ADDRESS` | `0x7EDFFE93aF0B6DE4fCCeeD7f7a9767E4d01611F9` |
| `NEXT_PUBLIC_NFT_ADDRESS` | `0xaB2963feE9adF52f8E77280ebBd89e25E2b6d23b` |
| `NEXT_PUBLIC_RPS_CONTRACT_ADDRESS` | RPS contract address |
| `NEXT_PUBLIC_SESSION_WALLET_FACTORY_ADDRESS` | Session wallet factory address |

#### Required — AI
| Variable | Value |
|----------|-------|
| `GEMINI_API_KEY` | **Secret** — Google AI Studio key |
| `GOOGLE_API_KEY` | Same or separate Google key |

#### Required — Agent System (Private Keys)
| Variable | Value |
|----------|-------|
| `PONTIFF_PRIVATE_KEY` | **Secret** — testnet wallet private key |
| `DEPLOYER_PRIVATE_KEY` | **Secret** — deployer wallet private key |
| `JUDAS_AGENT_PRIVATE_KEY` | **Secret** — Judas agent wallet private key |

> ⚠️ These are testnet keys. For mainnet, use a hardware wallet or key management service.

#### Required — Cron Security
| Variable | Value |
|----------|-------|
| `CRON_SECRET` | **Secret** — random string ≥32 chars. Generate: `openssl rand -hex 32` |

#### Required — App URLs
| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |
| `NEXT_PUBLIC_API_URL` | Same as APP_URL (Next.js API routes are co-located) |

#### Optional — Twitter
| Variable | Value |
|----------|-------|
| `TWITTER_API_KEY` | Twitter app API key |
| `TWITTER_API_SECRET` | Twitter app API secret |
| `TWITTER_ACCESS_TOKEN` | Access token |
| `TWITTER_ACCESS_SECRET` | Access token secret |
| `TWITTER_BEARER_TOKEN` | Bearer token |

---

### 6. Vercel Cron Configuration

`vercel.json` is already configured at `apps/web/vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/agent-turns", "schedule": "* * * * *" },
    { "path": "/api/cron/sync-treasury", "schedule": "*/5 * * * *" },
    { "path": "/api/cron/judas-pontiff", "schedule": "*/5 * * * *" },
    { "path": "/api/cron/tournament-progression", "schedule": "*/10 * * * *" }
  ]
}
```

Vercel will automatically pass `Authorization: Bearer <CRON_SECRET>` to these routes.
Ensure `CRON_SECRET` is set in Vercel env vars — all 4 cron routes now enforce it.

---

### 7. Private Key Security Notes

**Current setup (testnet):** Private keys are stored as Vercel environment variables. This is acceptable for hackathon/testnet use.

**For mainnet (future):** Consider:
- AWS Secrets Manager or HashiCorp Vault
- Dedicated signer service (e.g. AWS KMS, Dfns, Privy)
- Never use the same private key across environments

**Key rotation checklist before any public/mainnet launch:**
- [ ] Rotate `PONTIFF_PRIVATE_KEY` — create a fresh wallet
- [ ] Rotate `DEPLOYER_PRIVATE_KEY` — create a fresh wallet
- [ ] Rotate `JUDAS_AGENT_PRIVATE_KEY` — create a fresh wallet
- [ ] Rotate Supabase `SERVICE_ROLE_KEY` if it was ever exposed
- [ ] Rotate `GEMINI_API_KEY` / `GOOGLE_API_KEY`
- [ ] Generate a fresh `CRON_SECRET`

---

### 8. Deployment Steps Summary

```bash
# 1. Confirm git status
git status

# 2. Commit security fixes + example file
git add apps/web/app/api/cron/ apps/web/.gitignore apps/web/.env.local.example
git commit -m "fix: enforce cron auth, update env template"

# 3. Push to GitHub
git push origin master    # or main

# 4. In Vercel:
#    - Import project from GitHub
#    - Set Root Directory: apps/web
#    - Add all environment variables from Section 5 above
#    - Deploy

# 5. After deploy, verify crons work:
#    Vercel Dashboard → your project → Cron Jobs tab
```

---

### 9. Post-Deploy Verification

| Check | URL |
|-------|-----|
| App loads | `https://your-app.vercel.app` |
| API health | `https://your-app.vercel.app/api/dashboard` |
| Cron agent-turns | Vercel Cron Jobs tab — should show last run |
| Leaderboard | `https://your-app.vercel.app/api/leaderboard` |
| Debates | `https://your-app.vercel.app/debates` |
| Arena | `https://your-app.vercel.app/arena` |

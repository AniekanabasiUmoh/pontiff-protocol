# Senior Engineer Audit — The Pontiff
**Date:** 2026-02-14
**Reviewer:** Principal/Staff Engineer, 10+ years production systems
**Scope:** apps/web, apps/api, packages/contracts

---

## Executive Summary

The Pontiff is a well-scoped project with a clear domain model and ambitious feature surface. The core architecture is sound: Next.js App Router frontend, Express API for background services, Hardhat/Viem for on-chain interactions, Supabase as the operational database. For a two-week hackathon build, the coverage is impressive. However, several production-readiness concerns exist that would block a real deployment.

**Hackathon Grade: B-** | **Production Grade: D+**

---

## Architecture: What's Done Right

**Monorepo Structure**
Turborepo with `apps/web`, `apps/api`, `packages/contracts` is the correct call. Separation of concerns is maintained at the package level. The `@/lib` alias pattern is consistent throughout.

**Supabase Server Pattern**
`createServerSupabase()` factory in `lib/db/supabase-server.ts` is the correct pattern for Next.js App Router. The singleton anti-pattern (importing bare `supabase` from `lib/db/supabase`) was correctly patched across most files — critical fix that was causing `indexedDB is not defined` crashes.

**Cron Infrastructure**
5 Vercel cron jobs at `/api/cron/*` with explicit `maxDuration` configs. Granular cadences (1min, 5min, 10min) show appropriate design thinking.

**Balance Ledger**
`balance-service.ts` implements a proper double-entry pattern: atomic credit/debit with before/after snapshots in `balance_transactions`. Correct foundation for a financial system.

**Transaction Mutex**
`agent-manager-service.ts` uses a mutex for nonce ordering on Monad. Without this, parallel bot transactions would collide. Non-trivial and correct.

**Viem over ethers.js**
Right choice for Monad Testnet. Type-safe, modern, performant.

---

## Critical Issues

### 1. Private Key in Environment Variable — No HSM
**Severity: CRITICAL (Production)**

```typescript
const account = privateKeyToAccount(process.env.PONTIFF_PRIVATE_KEY as `0x${string}`)
```

A single hot wallet key in an env var controls all agent transactions. Any env leak = complete fund loss. For a hackathon this is acceptable; for production this requires KMS or a cold-wallet signing ceremony.

### 2. Poker Bot Auto-Play — Fixed
**Status: RESOLVED**

`POKER_STUB.ts` was a loose helper snippet that was never wired in. This has been resolved:
- `strategies.ts` — Berzerker plays Poker every 4th game (25%), Merchant every 6th game (~17%)
- `agent-manager-service.ts` — `playPoker()` method was already implemented and wired; fixed a `.single()` → `.maybeSingle()` crash on first poker turn (no active hand returned 0 rows, which Supabase `.single()` throws on), added `strategyName` parameter, and added `setTimeout` self-chain so the agent loop continues after a hand ends (matching `playRPSCasino` behaviour)

Poker is now a first-class game for Berzerker and Merchant bots. Disciple bots remain RPS/staking focused, which fits their risk profile.

### 3. Payment Processing is Mocked
**Severity: HIGH**

```typescript
// apps/web/app/api/membership/cardinal/route.ts
return {
    success: true,
    txHash: `0x${Math.random().toString(16).substring(2, 66)}` // fake
};
```

Cardinal membership subscriptions (1000 GUILT/month) generate fake transaction hashes. No on-chain transfer occurs. The membership record is written to the DB but no funds move.

### 4. Debug Routes Unauthenticated in Production
**Severity: HIGH**

Routes at `/api/debug/agent`, `/api/debug/detect`, `/api/debug/shadow` are unauthenticated. These should be removed pre-deployment or gated behind `NODE_ENV === 'development'`.

### 5. Two Supabase Import Paths Coexisting
**Severity: MEDIUM**

`apps/web/app/api/cardinal/status/route.ts` imports from `@/lib/supabase/server` while most other routes use `@/lib/db/supabase-server`. Both paths exist. One must be canonical.

---

## Database Concerns

**Schema Fragmentation**
30+ SQL migration files spread across:
- `apps/web/supabase/migrations/`
- `supabase/migrations/` (root level)
- `docs/audit/*.sql`

No single authoritative schema file. `current_schema_dump.sql` exists but may be stale. It's unclear which migrations have been applied to production vs. local.

**RLS Disabled on Some Tables**
`docs/audit/DISABLE_RLS.sql` exists in the audit folder — suggesting RLS was disabled as a quick fix. Any table with RLS disabled that stores wallet addresses or financial data is a liability.

**Two Cardinal Tables**
`cardinal_memberships` (subscription flow) and `cardinal_members` (election/governance) serve overlapping purposes. The status endpoint now checks both, but this dual-table design causes ongoing confusion. These should be merged or the relationship explicitly documented.

---

## Code Quality

**What's Clean**
- Service layer is well-separated from route handlers
- TypeScript used throughout with reasonable interfaces
- Error handling in API routes is consistent (try/catch → JSON error)
- `alert()` calls replaced with Toast notifications

**What Needs Work**

*22 service files, many with duplicate Supabase instantiation*
Every method in `crusade-service.ts` calls `createServerSupabase()` creating a new client per operation. The client should be instantiated once per service call chain.

*Scripts directory is 70+ one-off debug files*
`apps/web/scripts/` contains `check-rps-code.ts`, `decode_revert.ts`, `debug-tx.ts` and 67 more. These should not ship to production. Add to `.vercelignore`.

*`@ts-ignore` and `as any` in financial code*
```typescript
.insert({...} as any)
// @ts-ignore
```
Type assertions in database insert paths suppress TypeScript's protection where data integrity matters most.

---

## Smart Contracts

**Deployed (Monad Testnet):**
- SessionWalletFactory: `0x98518cDaC626CF28a36862216858370dbDee8858`
- GuiltToken: `0x71a0016b50E3d846ce17A15DdfA957e4b0885369`
- Staking V2: `0xF49112b4D69e563fF45a37737A3fC4892565A6B0`
- JudasProtocol V3: `0x7EDFFE93aF0B6DE4fCCeeD7f7a9767E4d01611F9`
- DebateVictoryNFT: `0xaB2963feE9adF52f8E77280ebBd89e25E2b6d23b`

**Concerns:**
- No formal audit on any contract
- Staking V2 exists because V1 had a mint-to-zero crash — insufficient pre-deployment testing
- JudasProtocol V3 exists because V2 had div-by-zero — same pattern
- Test coverage is minimal beyond basic flow tests

---

## API Surface

139+ API route directories for a two-week build. Several duplicates visible:
- `/api/crusades/join` AND `/api/games/crusade/join`
- `/api/session/create` AND `/api/sessions/create`
- `/api/vatican/crusade/[id]` AND `/api/crusades/[id]`

This suggests organic growth without a routing convention. Duplicates need to be audited and removed before production.

---

## Recommendations (Priority Order)

1. Consolidate Supabase import path — pick one, remove the other
2. Add `.vercelignore` entry for `apps/web/scripts/`
3. Audit and remove duplicate API routes
4. Add `.env.example` with all required variables documented
5. Implement canonical schema file via Supabase CLI migrations
6. ~~Poker bot auto-play~~ — DONE: Berzerker/Merchant now route to poker; `.single()` crash fixed; self-chain added
7. Remove or auth-gate debug routes before public deployment
8. Replace Cardinal payment mock with real on-chain call

---

## Hackathon Submission Readiness

Submittable with caveats. The core agent loop works, RPS is fully functional with real on-chain settlement, the theological narrative is coherent, and the Monad integration is genuine. The gaps (mocked payments, poker stub, script clutter) are typical for a two-week build.

**Strongest technical differentiators:** Autonomous agent cron loop with real on-chain Monad settlement, plus two-game agent strategy (RPS + Poker) with provably-fair casino logic — genuinely impressive for the timeline.

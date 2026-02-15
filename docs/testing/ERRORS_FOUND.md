# Pontiff API - Errors Found and Solutions

**Test Run Date:** 2026-02-08 (Latest Run)
**Total Tests:** 37
**Passed:** 12
**Failed:** 25
**Pass Rate:** 32.43% (↑ from 28.9%)

## Recent Fixes Applied:
✅ Created `/api/scan/[wallet]` route
✅ Created `/api/treasury/distribute` route
✅ Added test summary with pass rate tracking
⚠️ Still need to: apply database migrations, fix schema relationships

---

## Summary of Issues

### Critical Issues (Blocking Functionality)
1. **Missing API Routes** - Several expected endpoints return 404
2. **Database Schema Issues** - Missing tables and columns
3. **Database Relationship Errors** - Schema cache relationship problems
4. **Missing Mock Data** - Tests fail due to no test data in database

### Issue Breakdown by Category

---

## 1. Missing API Routes (404 Errors)

### 1.1 `/api/scan/[wallet]` - Wallet Scanning
**Status:** Route does not exist
**Test:** Scan Wallet (GET)
**Error:** 404 Not Found

**Solution:**
- Create `apps/web/app/api/scan/[wallet]/route.ts`
- Implement wallet scanning to fetch agent's conversion history, sin score, and redemption status
- Query `conversions` and `agents` tables

**Priority:** HIGH - Core feature for user profile viewing

---

### 1.2 `/api/treasury/distribute` - Revenue Distribution
**Status:** Route does not exist
**Test:** Distribute Revenue (POST)
**Error:** 404 Not Found

**Solution:**
- Create `apps/web/app/api/treasury/distribute/route.ts`
- Implement revenue distribution logic for cardinals
- Should be CRON-triggered or admin-only endpoint
- Calculate revenue from games and distribute to GUILT token holders

**Priority:** HIGH - Core tokenomics feature

---

### 1.3 `/api/session/create` - Session Wallet Creation
**Status:** Route does not exist
**Test:** Create Session (POST)
**Error:** 404 Not Found

**Solution:**
- Create `apps/web/app/api/session/create/route.ts` (exists as `/api/sessions/create/route.ts`)
- Fix route path mismatch - actual route is `/api/sessions/create`
- Update test script OR rename route folder

**Priority:** MEDIUM - Path mismatch issue

---

### 1.4 `/api/agent/*` Endpoints - Agent Management
**Status:** Routes exist but return 404 for certain tests
**Tests:** Deploy Agent, Agent Status, Stop Agent
**Error:** 404 Not Found

**Solution:**
- Review `apps/web/app/api/agents/` routes
- Ensure `/agent/deploy`, `/agent/status/[wallet]`, `/agent/stop` exist or rename to `/agents/*`
- Path mismatch between test and actual routes

**Priority:** MEDIUM - Path mismatch

---

## 2. Database Schema Issues

### 2.1 Missing `cardinal_memberships` Table
**Test:** Subscribe Cardinal (POST)
**Error:** `Could not find the table 'public.cardinal_memberships' in the schema cache`

**Solution:**
```sql
-- Create migration: supabase/migrations/YYYYMMDDHHMMSS_create_cardinal_memberships.sql

CREATE TABLE IF NOT EXISTS public.cardinal_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'basic', -- basic, premium, elite
  status TEXT NOT NULL DEFAULT 'active', -- active, expired, cancelled
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expiry_date TIMESTAMP WITH TIME ZONE,
  auto_renew BOOLEAN DEFAULT false,
  total_spent DECIMAL(20, 4) DEFAULT 0,
  perks JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_cardinal_memberships_wallet ON public.cardinal_memberships(wallet_address);
CREATE INDEX idx_cardinal_memberships_status ON public.cardinal_memberships(status);
```

**Priority:** CRITICAL - Blocks cardinal membership feature

---

### 2.2 Missing `goalType` Column in `crusades` Table
**Test:** Competitor Scan (GET)
**Error:** `Could not find the 'goalType' column of 'crusades' in the schema cache`

**Solution:**
```sql
-- Add goalType column to crusades table

ALTER TABLE public.crusades
ADD COLUMN IF NOT EXISTS goal_type TEXT;

-- Possible values: 'conversion_count', 'total_value', 'win_rate', 'streak'
```

**Priority:** HIGH - Blocks competitor scanning

---

### 2.3 Missing Relationships in Schema Cache

#### Issue A: `competitor_agents` to `Conversion` relationship
**Test:** Competitors (GET)
**Error:** `Could not find a relationship between 'competitor_agents' and 'Conversion' in the schema cache`

**Solution:**
- Verify `competitor_agents` table exists (may need to be created)
- Add foreign key relationship to `conversions` table
- Or update query to use proper JOIN syntax

```sql
-- Check if competitor_agents table exists, if not create it:
CREATE TABLE IF NOT EXISTS public.competitor_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_wallet TEXT NOT NULL UNIQUE,
  agent_name TEXT NOT NULL,
  total_conversions INT DEFAULT 0,
  total_guilt_earned DECIMAL(20, 4) DEFAULT 0,
  win_rate DECIMAL(5, 2) DEFAULT 0,
  last_active TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Priority:** HIGH - Blocks leaderboard/competitor features

---

#### Issue B: `debates` to `CompetitorAgent` relationship
**Test:** All Debates (GET)
**Error:** `Could not find a relationship between 'debates' and 'CompetitorAgent' in the schema cache`

**Solution:**
- Add proper foreign key relationships or update query syntax
- Ensure `debates` table has `agent_a_id` and `agent_b_id` columns
- May need to use explicit JOINs instead of Supabase auto-relationships

```sql
-- Update debates table with proper foreign keys
ALTER TABLE public.debates
ADD COLUMN IF NOT EXISTS agent_a_wallet TEXT REFERENCES public.competitor_agents(agent_wallet),
ADD COLUMN IF NOT EXISTS agent_b_wallet TEXT REFERENCES public.competitor_agents(agent_wallet);
```

**Priority:** HIGH - Blocks debate viewing

---

## 3. Business Logic Errors

### 3.1 Minimum Stake Validation
**Test:** Stake Penance (POST)
**Error:** `Insufficient stake amount - Minimum stake is 100.0 GUILT`
**Sent:** `1000000000000000000` wei (1 ETH equivalent)

**Solution:**
- Update test to send correct amount in GUILT tokens
- Clarify if stake amount is in wei or token decimals
- Update test script line 136:

```powershell
$StakeBody = @{
    walletAddress = $Wallet
    stakeAmount   = "100000000000000000000"  # 100 GUILT (assuming 18 decimals)
    txHash        = "0xmock_tx_hash"
}
```

**Priority:** LOW - Test data issue, not code issue

---

### 3.2 Missing Test Data for NFT Minting
**Test:** Mint NFT (POST - Mock)
**Error:** `Conversion not found`

**Solution:**
- Create seed data for conversions
- Or update test to first create a conversion, then mint NFT
- Add pre-test data setup step

**Priority:** MEDIUM - Test infrastructure improvement

---

### 3.3 Missing Test Data for Tournament Operations
**Tests:**
- Judge Debate (POST - Mock ID)
- Start Tournament (POST - Mock)
- Get Bracket (GET - Mock)
- Record Match (POST - Mock)
- Get Results (GET - Mock)
- Register Tournament (POST - Mock)
- Twitter Challenge/Announce (Mock)
- Renew/Cancel Cardinal (Mock)

**Error:** Various "not found" errors with mock IDs

**Solution:**
- Create proper test data setup script
- Either:
  1. Seed database with test tournaments/debates/memberships, OR
  2. Update tests to create entities before testing operations on them

**Priority:** MEDIUM - Test infrastructure

---

### 3.4 Tournament Creation Validation Error
**Test:** Create Tournament (POST)
**Error:** `Missing required fields: name, prizePool, startDate, endDate`
**Sent:** `name, entryFee, prizePool, startTime`

**Solution:**
- Update test script to match API expectations:

```powershell
$TourneyBody = @{
    name      = "Automated Test Tournament"
    entryFee  = "100"
    prizePool = "1000"
    startDate = [DateTimeOffset]::Now.AddDays(1).ToUnixTimeSeconds()
    endDate   = [DateTimeOffset]::Now.AddDays(8).ToUnixTimeSeconds()
}
```

OR update API to accept `startTime` instead of `startDate/endDate`

**Priority:** MEDIUM - API contract mismatch

---

## 4. Tests NOT Covered by Current Test Script

### 4.1 Web3 Integration Tests
**Missing:**
- Real wallet signature verification
- Contract interaction tests (GUILT token, staking contracts)
- Transaction verification
- Gas estimation

**Recommendation:**
Create `scripts/test-web3.ps1` with Hardhat/Foundry integration tests

---

### 4.2 WebSocket Tests
**Missing:**
- Live game feed subscriptions
- Real-time stats ticker updates
- Debate live updates
- Tournament bracket live updates

**Recommendation:**
Create WebSocket test script using `wscat` or Node.js script

---

### 4.3 Database Integrity Tests
**Missing:**
- Foreign key constraint tests
- Data consistency checks (e.g., guilt balance matches transaction history)
- Trigger tests (auto-increment leaderboard scores)

**Recommendation:**
Create SQL test suite in `supabase/tests/`

---

### 4.4 Authentication & Authorization Tests
**Missing:**
- Protected endpoint tests (without auth token)
- Role-based access control tests
- Session expiry tests
- SIWE (Sign-In With Ethereum) flow

**Recommendation:**
Add auth tests to test script

---

### 4.5 Error Handling Tests
**Missing:**
- Invalid input tests (malformed JSON, wrong types)
- Rate limiting tests
- Duplicate transaction tests
- Concurrent request tests

**Recommendation:**
Add negative test cases to test script

---

### 4.6 Frontend Integration Tests
**Missing:**
- Component rendering tests
- User flow tests (E2E with Playwright/Cypress)
- Modal interactions
- Web3 provider integration

**Recommendation:**
Create `apps/web/tests/e2e/` with Playwright tests

---

### 4.7 Smart Contract Tests
**Missing:**
- Contract deployment tests
- Token minting/burning tests
- Staking contract tests
- Upgrade proxy tests

**Recommendation:**
Create `packages/contracts/test/` directory with Hardhat tests

---

### 4.8 Performance Tests
**Missing:**
- Load testing (concurrent users)
- Database query performance
- API response time benchmarks

**Recommendation:**
Use k6 or Artillery for load testing

---

### 4.9 Data Integrity Tests
**Missing:**
- Leaderboard calculation verification
- Revenue distribution calculation tests
- Tournament bracket generation logic
- Debate judging logic

**Recommendation:**
Create unit tests for calculation functions

---

## 5. Additional Recommendations

### 5.1 Test Data Management
**Issue:** Tests rely on existing data or fail with mock IDs

**Solution:**
- Create `scripts/seed-test-data.ps1` to populate test database
- Add cleanup script `scripts/cleanup-test-data.ps1`
- Use database transactions for tests (rollback after each test)

---

### 5.2 Environment Configuration
**Issue:** Tests hardcode localhost:3000

**Solution:**
- Add `.env.test` file with test configuration
- Support TEST_BASE_URL environment variable
- Add staging environment tests

---

### 5.3 Continuous Integration
**Issue:** No automated test running

**Solution:**
- Add GitHub Actions workflow for API tests
- Add pre-commit hooks for linting
- Add automated migration testing

---

### 5.4 API Documentation
**Issue:** API contract unclear (field names, validation rules)

**Solution:**
- Generate OpenAPI/Swagger documentation
- Add request/response examples to each route
- Document all error codes and messages

---

### 5.5 Monitoring & Logging
**Issue:** Failed tests don't provide enough context

**Solution:**
- Add structured logging to API routes
- Implement request ID tracking
- Add performance monitoring (DataDog, New Relic)

---

## Quick Fix Priority List

### Immediate (Today)
1. Create `cardinal_memberships` table migration
2. Add `goal_type` column to `crusades` table
3. Create `competitor_agents` table if missing
4. Fix `/api/scan/[wallet]` route (create it)

### High Priority (This Week)
5. Fix database relationship queries in competitors and debates
6. Create `/api/treasury/distribute` route
7. Add proper test data seeding script
8. Fix path mismatches (`/session` vs `/sessions`, `/agent` vs `/agents`)

### Medium Priority (Next Sprint)
9. Add authentication tests
10. Create WebSocket tests
11. Add E2E frontend tests
12. Document all API endpoints

### Low Priority (Future)
13. Add performance tests
14. Add smart contract tests
15. Implement comprehensive error handling tests

---

## Test Coverage Analysis

**Current Coverage:** ~29% (11/38 tests passing)

**Estimated Coverage After Fixes:**
- With schema fixes: ~50%
- With missing routes: ~70%
- With test data setup: ~85%
- With all improvements: ~95%

---

## Notes

- Many "failures" are actually test infrastructure issues (mock IDs, missing seed data)
- Core functionality (confess, buy indulgence, leaderboards, state) works correctly
- Main blockers are database schema gaps and missing routes
- Once schema is fixed, most tests should pass


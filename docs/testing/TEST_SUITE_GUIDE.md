# Pontiff Complete Test Suite Guide

**Last Updated:** 2026-02-08

## Overview

The Pontiff test suite consists of 6 comprehensive test categories covering backend APIs, frontend flows, smart contracts, and infrastructure.

---

## 📁 Test Structure

```
pontiff/
├── scripts/
│   ├── test-api.ps1           # 1. REST API endpoint tests
│   ├── test-auth.ps1          # 2. Authentication & security tests
│   ├── test-websockets.ps1    # 3. Real-time WebSocket tests
│   ├── test-database.sql      # 4. Database integrity tests
│   └── test-all.ps1           # Master orchestrator
├── tests/
│   ├── e2e/                   # 5. Frontend E2E tests (Playwright)
│   │   ├── setup.ts
│   │   ├── auth.spec.ts
│   │   ├── games.spec.ts
│   │   ├── tournaments.spec.ts
│   │   └── confession.spec.ts
│   └── contracts/             # 6. Smart contract tests (Hardhat)
│       ├── GUILT.test.ts
│       └── Staking.test.ts
└── playwright.config.ts       # Playwright configuration
```

---

## 🚀 Quick Start

### Run All Tests
```powershell
.\scripts\test-all.ps1
```

### Run Specific Test Suite
```powershell
# API tests only (fastest)
.\scripts\test-api.ps1

# Authentication tests
.\scripts\test-auth.ps1

# WebSocket tests
.\scripts\test-websockets.ps1

# Database tests
psql $env:DATABASE_URL -f .\scripts\test-database.sql

# E2E tests
npx playwright test

# Contract tests
npx hardhat test
```

### Fast Mode (Skip Slow Tests)
```powershell
.\scripts\test-all.ps1 -Fast
```

### CI Mode (Fail-Fast)
```powershell
.\scripts\test-all.ps1 -CI
```

---

## 📊 Test Suite Details

### 1. API Tests (`test-api.ps1`)
**Purpose:** Test all REST API endpoints
**Runtime:** 1-2 minutes
**Coverage:** 37+ endpoints

**Categories Tested:**
- Vatican operations (confess, indulgence)
- Leaderboards (shame, saints, heretics)
- Game history & analytics
- Competitors & debates
- Treasury & revenue
- Confession system
- Cardinal membership
- Tournaments
- NFT minting
- Agent management

**Run:**
```powershell
.\scripts\test-api.ps1
```

**Expected Output:**
```
=== STARTING PONTIFF API TESTS ===

Testing Confess (POST)... [PASS]
Testing Buy Indulgence (POST)... [PASS]
...

Total Tests: 37
Passed: 25
Failed: 12
Pass Rate: 67.57%
```

---

### 2. Authentication Tests (`test-auth.ps1`)
**Purpose:** Test SIWE flow and protected endpoints
**Runtime:** 30 seconds
**Coverage:** Wallet connection, JWT validation, session management

**Tests:**
- Nonce generation
- Signature verification (mocked)
- Protected endpoint access
- Token validation
- Logout flow

**Run:**
```powershell
.\scripts\test-auth.ps1
```

---

### 3. WebSocket Tests (`test-websockets.ps1`)
**Purpose:** Test real-time features
**Runtime:** 1 minute
**Coverage:** Live game feed, stats ticker, debate updates

**Tests:**
- Live game feed connection
- Stats ticker updates
- Debate updates stream
- Connection/disconnection handling

**Run:**
```powershell
.\scripts\test-websockets.ps1
```

**Requirements:**
- Node.js installed
- `ws` npm package (auto-installed)

---

### 4. Database Tests (`test-database.sql`)
**Purpose:** Validate database schema and integrity
**Runtime:** 10 seconds
**Coverage:** Tables, indexes, foreign keys, RLS policies

**Tests:**
- Table existence (19 tables)
- Index coverage
- Foreign key constraints
- Column data types
- RLS policies
- Orphaned records

**Run:**
```bash
psql $DATABASE_URL -f scripts/test-database.sql
```

**Requirements:**
- PostgreSQL client (`psql`)
- Database connection string

---

### 5. E2E Frontend Tests (`tests/e2e/`)
**Purpose:** Test complete user flows
**Runtime:** 3-5 minutes
**Coverage:** Authentication, games, tournaments, confession

**Test Files:**
- `auth.spec.ts` - Wallet connection flows
- `games.spec.ts` - RPS, Poker, Judas gameplay
- `tournaments.spec.ts` - Registration, brackets, leaderboard
- `confession.spec.ts` - Stake, roast, history

**Run:**
```bash
npx playwright test
```

**Run Specific Test:**
```bash
npx playwright test tests/e2e/auth.spec.ts
```

**View Report:**
```bash
npx playwright show-report
```

**Requirements:**
- Playwright installed (`npm install -D @playwright/test`)
- Dev server running on localhost:3000

---

### 6. Smart Contract Tests (`tests/contracts/`)
**Purpose:** Test contract logic and security
**Runtime:** 30 seconds
**Coverage:** GUILT token, staking mechanisms

**Test Files:**
- `GUILT.test.ts` - Token minting, transfers, burning
- `Staking.test.ts` - Staking, rewards, unstaking

**Run:**
```bash
npx hardhat test
```

**Run Specific Test:**
```bash
npx hardhat test tests/contracts/GUILT.test.ts
```

**Requirements:**
- Hardhat installed (`npm install --save-dev hardhat`)
- Contract files in `packages/contracts/`

---

## 🎯 Test Execution Strategies

### Development Workflow
```powershell
# Quick feedback (30 seconds)
.\scripts\test-api.ps1

# Before committing (2-3 minutes)
.\scripts\test-all.ps1 -Fast
```

### Pre-Release Validation
```powershell
# Full test suite (7-10 minutes)
.\scripts\test-all.ps1
```

### CI/CD Pipeline
```yaml
# .github/workflows/test.yml
jobs:
  api-tests:
    runs-on: ubuntu-latest
    steps:
      - run: pwsh ./scripts/test-api.ps1

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - run: npx playwright test

  contract-tests:
    runs-on: ubuntu-latest
    steps:
      - run: npx hardhat test
```

---

## 📈 Current Test Coverage

| Category | Tests | Pass Rate | Status |
|----------|-------|-----------|--------|
| API Endpoints | 37+ | ~68% | 🟡 Needs DB migrations |
| Authentication | 5 | ~60% | 🟡 Needs real signatures |
| WebSocket | 3 | TBD | ⚪ Not yet run |
| Database | 15 | TBD | ⚪ Not yet run |
| E2E Frontend | 20+ | TBD | ⚪ Not yet run |
| Smart Contracts | 30+ | TBD | ⚪ Not yet run |

**Overall Estimated Coverage:** ~60% → Target: 85%+

---

## 🐛 Troubleshooting

### API Tests Failing
**Issue:** Many 500 errors
**Solution:** Apply database migrations first
```bash
supabase db push
# or
.\scripts\apply-fixes.ps1
```

### WebSocket Tests Timeout
**Issue:** Connection refused
**Solution:** Ensure dev server is running
```bash
npm run dev
```

### E2E Tests Can't Find Elements
**Issue:** Selectors outdated
**Solution:** Update test selectors to match current UI
```bash
npx playwright codegen http://localhost:3000
```

### Contract Tests Fail to Compile
**Issue:** Missing Hardhat config
**Solution:** Initialize Hardhat
```bash
npx hardhat init
```

---

## 📝 Adding New Tests

### Add API Test
Edit `scripts/test-api.ps1`:
```powershell
$NewTestBody = @{
    field1 = "value1"
    field2 = "value2"
}
Test-Endpoint -Name "New Feature (POST)" -Method "Post" -Url "/api/new-feature" -Body $NewTestBody
```

### Add E2E Test
Create `tests/e2e/new-feature.spec.ts`:
```typescript
import { test, expect } from './setup';

test.describe('New Feature', () => {
  test('should work correctly', async ({ authenticatedPage: page }) => {
    await page.goto('http://localhost:3000/new-feature');
    await expect(page.getByText(/new feature/i)).toBeVisible();
  });
});
```

### Add Contract Test
Create `tests/contracts/NewContract.test.ts`:
```typescript
import { expect } from "chai";
import { ethers } from "hardhat";

describe("NewContract", function () {
  it("Should deploy correctly", async function () {
    const Contract = await ethers.getContractFactory("NewContract");
    const contract = await Contract.deploy();
    await contract.deployed();
    expect(contract.address).to.be.properAddress;
  });
});
```

---

## 🎬 Demo Day Checklist

Before demo:
- [ ] Run `.\scripts\test-all.ps1` - All suites pass
- [ ] API pass rate ≥ 85%
- [ ] Database migrations applied
- [ ] Dev server stable for 30+ minutes
- [ ] At least 1 tournament created
- [ ] At least 10 competitor agents seeded
- [ ] WebSocket connections tested manually
- [ ] Wallet connection works in browser
- [ ] No console errors on homepage

---

## 🔗 Related Documentation

- [ERRORS_FOUND.md](./ERRORS_FOUND.md) - Detailed error analysis
- [SOLUTIONS_APPLIED.md](./SOLUTIONS_APPLIED.md) - Fixes and progress
- [Test Results](./test-results-new.txt) - Latest test output

---

## 💡 Best Practices

1. **Run tests before pushing code**
2. **Update tests when adding features**
3. **Keep test data isolated** (use test wallets)
4. **Use descriptive test names**
5. **Mock external dependencies** (Twitter API, etc.)
6. **Clean up test data after runs**
7. **Document test assumptions**

---

**Questions?** Review the test output files or check the inline comments in each test script.

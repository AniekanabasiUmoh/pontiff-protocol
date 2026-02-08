# Pontiff Project Structure

## Overview

The Pontiff is built as a monorepo using Turbo for efficient build orchestration.

```
pontiff/
├── apps/
│   ├── web/                    # Next.js 14 frontend
│   │   ├── app/                # App router pages
│   │   ├── components/         # React components
│   │   ├── lib/                # Utilities & configs
│   │   └── public/             # Static assets
│   │
│   └── api/                    # Express backend
│       ├── src/
│       │   ├── index.ts        # Server entry
│       │   ├── routes/         # API routes
│       │   ├── services/       # Business logic
│       │   │   ├── scanner.ts  # Wallet scanner
│       │   │   ├── roaster.ts  # AI roaster
│       │   │   ├── visual.ts   # Image generation
│       │   │   └── social.ts   # Twitter bot
│       │   ├── jobs/           # Background jobs
│       │   └── utils/          # Helpers
│       └── package.json
│
├── packages/
│   └── contracts/              # Solidity smart contracts
│       ├── src/
│       │   ├── GuiltToken.sol      # ERC-20 token
│       │   ├── Staking.sol         # Staking mechanics
│       │   ├── JudasProtocol.sol   # Betrayal system
│       │   └── Indulgence.sol      # Soulbound NFT
│       ├── test/               # Contract tests
│       ├── script/             # Deployment scripts
│       └── foundry.toml
│
├── docs/                       # Documentation
│   └── database.md             # Supabase schema
│
├── supabase/                   # Supabase config
│   └── migrations/             # SQL migrations
│
├── .github/
│   └── workflows/              # CI/CD pipelines
│       └── lint.yml
│
├── package.json                # Root package
├── turbo.json                  # Turbo config
├── .env.example                # Environment template
├── .gitignore
└── README.md
```

## Development Workflow

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
# Fill in your API keys
```

### 3. Run Development Servers

```bash
# All services
npm run dev

# Individual workspace
npm run dev --filter=@pontiff/web
npm run dev --filter=@pontiff/api
```

### 4. Smart Contracts

```bash
cd packages/contracts

# Install Foundry dependencies
forge install

# Compile
forge build

# Test
forge test

# Deploy to Monad Testnet
forge script script/Deploy.s.sol --rpc-url monad_testnet --broadcast
```

## Phase 1 Complete ✅

- [x] Monorepo structure
- [x] Next.js frontend scaffold
- [x] Express API backend
- [x] Foundry contracts workspace
- [x] CI/CD with GitHub Actions
- [x] Environment template
- [x] Supabase schema documentation

## Next Steps: Phase 2 - Data Layer (Scanner)

See `THE_PONTIFF_EXECUTION_PLAN.md` for the full roadmap.

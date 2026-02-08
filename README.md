# ⚔️ The Pontiff Protocol

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-green.svg)](https://soliditylang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![Monad](https://img.shields.io/badge/Monad-Testnet-purple.svg)](https://monad.xyz/)

> **"Let AI agents play your sins away."**

An autonomous DeFi gaming platform where AI agents play blockchain games on your behalf. Deposit $GUILT tokens, choose your risk strategy, and let the bots do the gambling.

## 🔥 Core Features

- **🤖 Autonomous AI Agents:** Deploy bots that play games 24/7 on your behalf
- **📊 Risk Strategies:** Choose Berzerker (high risk), Merchant (medium), or Disciple (low risk)
- **💰 Session Wallets:** Temporary wallets with gas-efficient minimal proxy deployment
- **🛡️ Safety Mechanisms:** Built-in stop-loss and take-profit thresholds
- **🎮 Multiple Games:** Rock-Paper-Scissors, Judas Protocol (Prisoner's Dilemma)
- **📈 Real-time Stats:** Live leaderboards tracking Saints, Sinners, and Heretics
- **⛓️ Session System:** Time-limited (24h) autonomous gameplay sessions
- **💸 $GUILT Token:** ERC-20 gaming token with staking and rewards

## 🏗️ Monorepo Structure

```
pontiff/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # Express backend (Scanner, Roaster, Social)
├── packages/
│   └── contracts/    # Foundry smart contracts
└── .github/
    └── workflows/    # CI/CD
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm or pnpm
- Foundry (for smart contracts)
- Redis (for queue system)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Fill in your API keys in .env
```

### Development

```bash
# Run all services
npm run dev

# Run specific workspace
npm run dev --filter=@pontiff/web
npm run dev --filter=@pontiff/api
```

### Build

```bash
# Build all workspaces
npm run build
```

## 📦 Tech Stack

**Smart Contracts:**
- Solidity 0.8.20
- OpenZeppelin Contracts
- Hardhat Development Framework
- Monad Blockchain (EVM-compatible)

**Backend:**
- Next.js 14 (App Router)
- TypeScript
- Ethers.js v6
- Supabase (PostgreSQL)
- Socket.IO (WebSockets)

**Frontend:**
- React 18
- TailwindCSS
- Wagmi (Wallet Integration)
- RainbowKit
- shadcn/ui Components

## 🗄️ Database Schema

See [docs/database.md](./docs/database.md) for Supabase table schemas.

## 🎮 Games & Features

### Module 5: Session Wallet System ⭐ **FLAGSHIP**

Autonomous AI agents that play games on your behalf for 24 hours.

**How It Works:**
1. Create session wallet via `SessionWalletFactory`
2. Deposit GUILT + 1% session fee
3. Select strategy (Berzerker/Merchant/Disciple)
4. Set stop-loss and take-profit
5. AI agent plays every 10 seconds
6. Auto-stop on time/threshold
7. Withdraw remaining balance

**Agent Strategies:**
- ⚔️ **Berzerker**: 15% bets, high risk, random moves
- 💰 **Merchant**: 5% bets, strategic patterns
- 🙏 **Disciple**: 2% bets, conservative play

### Rock-Paper-Scissors
- Classic game vs The Pontiff
- 50/50 odds, 2x payout on win
- Instant settlement

### Judas Protocol (Prisoner's Dilemma)
- Multi-round tournament mode
- Reputation system (Saint/Sinner/Heretic)
- Dynamic payouts based on cooperation
- Betrayal penalties

## 📜 Smart Contracts

**Session Wallet System:**
- `SessionWalletFactory.sol` - Minimal proxy factory for session wallets
- `SessionWallet.sol` - Temporary wallet controlled by Pontiff backend

**Core Contracts:**
- `GuiltToken.sol` - ERC-20 gaming token
- `RockPaperScissors.sol` - Classic RPS game
- `JudasProtocol.sol` - Prisoner's Dilemma with reputation
- `Staking.sol` - Tiered staking system

## 🚀 Deployment

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

Quick start:
```bash
# Deploy SessionWalletFactory
cd packages/contracts
npx hardhat run scripts/deploy-session-wallets.ts --network monadTestnet

# Run database migration
# Execute supabase/migrations/20260208000001_add_agent_sessions.sql

# Start frontend
cd apps/web && npm run dev
```

## 📚 Documentation

- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Full deployment walkthrough
- [GitHub Setup](GITHUB_SETUP.md) - Pushing to repository
- [Module 5 Guide](A%20Pontiff%20Roadmap/Module%205%20-%20Session%20Wallet%20System%20-%20Implementation%20Guide.md) - Session wallet deep dive
- [Module 6 Guide](A%20Pontiff%20Roadmap/Module%206%20-%20Agent%20Strategies%20-%20Implementation%20Guide.md) - Agent strategies (The Champions) ⭐ **NEW!**
- [Build Reference](A%20Pontiff%20Roadmap/THE%20PONTIFF%20-%20COMPLETE%20BUILD%20REFERENCE.md) - System overview
- [Identified Errors](A%20Pontiff%20Roadmap/Identified%20errors.md) - Bug fixes log

## 🗺️ Roadmap

### Phase 1: Core Platform ✅ Complete
- [x] Session Wallet System (Module 5)
- [x] **Agent Strategies (Module 6)** - Berzerker, Merchant, Disciple ⭐ **NEW!**
- [x] Rock-Paper-Scissors Game (Module 2)
- [x] Judas Protocol (Module 3)
- [x] Game History & Leaderboards (Module 4 - 80%)

### Phase 2: Advanced Features 🔜 Coming Soon
- [ ] Multi-game support (Poker, Blackjack)
- [ ] ML-based agent strategies
- [ ] Session NFTs (tradeable)
- [ ] Referral system

### Phase 3: Mainnet Launch 📅 Planned
- [ ] Security audit
- [ ] Mainnet deployment
- [ ] DAO governance

## 📝 License

MIT

## 🙏 Acknowledgments

- Built with [Claude Code](https://claude.com/claude-code)
- Powered by [Monad](https://monad.xyz/) blockchain
- Database by [Supabase](https://supabase.com/)
- UI from [shadcn/ui](https://ui.shadcn.com/)

---

**Built with ⚔️ by Antigravity AI & Claude Code**

**Status**: 🟢 Active Development | Module 6 Complete (Agent Strategies)

# THE PONTIFF - BUILD CHECKLIST
**Simple Linear Checklist for Tracking Development Progress**

---

## ✅ PHASE 0: FOUNDATION (COMPLETE)
- [✅] Project setup
- [✅] Monorepo configuration
- [✅] Database migration
- [✅] $GUILT token deployed
- [✅] Staking contract deployed
- [✅] Environment configuration

---

## 🎰 PHASE 1: CASINO CORE

### Module 1.1: Smart Contract Games
- [ ] Write PontiffRPS.sol
- [ ] Deploy to Monad Testnet
- [ ] Test token transfers
- [ ] Integrate with API

### Module 1.2: Game API Endpoints
- [ ] Fix RPS API (already exists, needs on-chain integration)
- [ ] Update poker API
- [ ] Update Judas Protocol API

### Module 1.3: Leaderboards & History
- [ ] Fix all database column names
- [ ] Add real-time WebSocket updates
- [ ] Build leaderboard animations

**Phase 1 Complete:** Games work with real $GUILT transfers

---

## 🤖 PHASE 2: HIRE YOUR CHAMPION

### Module 2.1: Session Wallet System
- [x] Write SessionWalletFactory.sol
- [x] Deploy factory contract
- [ ] Test wallet creation
- [ ] Test deposits/withdrawals

### Module 2.2: Agent Manager Backend
- [x] Create agent-manager service
- [x] Implement agent spawn logic
- [x] Build agent game loop
- [x] Add stop-loss monitoring
- [x] Add session expiry logic

### Module 2.3: Agent Strategies
- [x] Implement Berzerker strategy
- [x] Implement Merchant strategy
- [x] Implement Disciple strategy
- [ ] Test all strategies

### Module 2.4: Database Schema
- [x] Create agent_sessions table
- [x] Add indexes
- [ ] Test queries

**Phase 2 Complete:** Users can hire agents via UI

---

## 🎭 PHASE 3: BOT SWARM (ANTI-GHOST-TOWN)

### Module 3.1: Bot Infrastructure
- [ ] Create spawn-bot-swarm.ts script
- [ ] Create bot-personalities.json
- [ ] Create fund-bots.ts script

### Module 3.2: Bot Deployment
- [ ] Generate 10-20 burner wallets
- [ ] Fund bots from Treasury
- [ ] Spawn bots with strategies
- [ ] Verify bots are playing

### Module 3.3: Bot Monitoring
- [ ] Dashboard for bot status
- [ ] Manual start/stop controls
- [ ] Performance tracking

**Phase 3 Complete:** 50+ games/hour guaranteed

---

## ⛪ PHASE 4: AI DEBATES (Already 90% Done)

### Module 4.1: Debate System
- [✅] Competitor scanning
- [✅] Debate initiation
- [✅] Argument generation
- [ ] AI judging logic
- [ ] Winner payouts

### Module 4.2: Twitter Integration
- [ ] Auto-post challenges
- [ ] Auto-reply with arguments
- [ ] Announce winners

**Phase 4 Complete:** Debates work with payouts

---

## 🎨 PHASE 5: UI/UX DESIGN & IMPLEMENTATION

### Module 5.1: Critical Screens (Design First)
- [ ] Landing Page design
- [ ] Agent Selection screen design
- [ ] Agent Configuration modal design
- [ ] Active Agent Dashboard design
- [ ] Live Game Feed design

### Module 5.2: Implementation
- [ ] Build Landing Page
- [ ] Build Agent Selection
- [ ] Build Configuration Modal
- [ ] Build Agent Dashboard
- [ ] Build Live Feed
- [ ] Build Leaderboard

### Module 5.3: Polish
- [ ] Add animations
- [ ] Add sound effects (optional)
- [ ] Mobile responsiveness
- [ ] Cross-browser testing

**Phase 5 Complete:** Full UI matches vision

---

## 🚀 PHASE 6: DEPLOYMENT & TESTING

### Module 6.1: Smart Contract Deployment
- [ ] Deploy all contracts to testnet
- [ ] Verify on explorer
- [ ] Test all functions

### Module 6.2: Integration Testing
- [ ] Test full user flow (hire agent)
- [ ] Test game execution
- [ ] Test payouts
- [ ] Test stop-loss
- [ ] Test session expiry

### Module 6.3: Performance Testing
- [ ] Load test (100 concurrent agents)
- [ ] API response time
- [ ] Database query performance

**Phase 6 Complete:** System ready for demo

---

## 🎬 PHASE 7: DEMO PREPARATION

### Module 7.1: Bot Swarm Launch
- [ ] Start 20 bots 24 hours before demo
- [ ] Verify live feed is active
- [ ] Check leaderboard has entries

### Module 7.2: Demo Materials
- [ ] Record demo video
- [ ] Prepare pitch deck
- [ ] Write submission doc
- [ ] Test demo flow 3x

### Module 7.3: Final Checks
- [ ] All contracts verified
- [ ] All APIs responding
- [ ] UI loads fast
- [ ] No console errors
- [ ] Twitter integration working

**Phase 7 Complete:** Ready to present

---

## 📈 PHASE 8: POST-DEMO (Optional)

### Module 8.1: Security
- [ ] Add EIP-712 signatures
- [ ] Add rate limiting
- [ ] Security audit

### Module 8.2: Mainnet
- [ ] Deploy to Monad Mainnet
- [ ] Add liquidity to DEX
- [ ] Airdrop to testnet users

**Phase 8 Complete:** Production ready

---


## ✅ DONE WHEN

- [ ] Judge opens site, sees 50+ active games
- [ ] Judge clicks "Hire Agent", spawns a Berzerker
- [ ] Judge watches agent play live for 2 minutes
- [ ] Judge sees leaderboard updating in real-time
- [ ] Judge says "Holy shit, this is alive"

**That's the win condition.**

---

**Last Updated:** 2026-02-07
**Use this to:** Track what to tell the AI agent to build next

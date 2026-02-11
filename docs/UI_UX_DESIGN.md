# UI/UX Design Specification
## The Pontiff Protocol - Complete Screen List

> **Purpose**: This document catalogs all pages/screens in the Pontiff Protocol application that require UI/UX design work.

---

## 📄 Core Pages

### 1. **Homepage** (`/`) (new)
- **Status**: ✅ Designed (Sacred Architecture Theme)
- **Features**: Hero section, feature grid (6 cards), stats bar, **fixed bottom footer bar** (live event footer), confession input
- **File**: `app/page.tsx`

---

## 🙏 Confession & Sin Management

### 2. **Confess Page** (`/confess`) (new)
- **Status**: ⚠️ Needs Design Polish
- **Purpose**: Generate AI-powered "Writ of Sin" image for any wallet address
- **Features**: Wallet address input, scanning animation, AI roast generation, writ image display, reset/share buttons
- **File**: `app/confess/page.tsx`

### 3. **Cathedral (Staking)** (`/cathedral`)
- **Status**: ⚠️ Needs Design Polish
- **Purpose**: Stake $GUILT tokens for penance
- **Features**: Staking interface, APY display, stake/unstake actions
- **File**: `app/cathedral/page.tsx`

### 4. **Indulgences** (`/indulgences`)
- **Status**: ⚠️ Needs Design Polish
- **Purpose**: Purchase indulgences to reduce sin count
- **Features**: Indulgence marketplace, redemption interface
- **File**: `app/indulgences/page.tsx`

---

## 🎮 Games & Gambling

### 5. **Rock Paper Scissors** (`/games/rps`) (new)
- **Status**: ⚠️ Needs Design Polish
- **Purpose**: Play RPS game against backend AI (PvE only, no PvP)
- **Features**: Move selection (Rock/Paper/Scissors), wager input, token approval flow, on-chain game creation, backend settlement, win/loss/draw result display with PnL
- **File**: `app/games/rps/page.tsx`

### 6. **Poker** (`/games/poker`)
- **Status**: ⚠️ Needs Design Polish
- **Purpose**: Play poker games
- **Features**: Poker table, hand display, betting interface
- **File**: `app/games/poker/page.tsx`

### 7. **Game History** (`/games/history`)
- **Status**: ⚠️ Needs Design Polish
- **Purpose**: View past game results
- **Features**: Game log, filters, result cards
- **File**: `app/games/history/page.tsx`

### 8. **Game Stats** (`/games/stats`)
- **Status**: ⚠️ Needs Design Polish
- **Purpose**: View gaming statistics and analytics
- **Features**: Win/loss ratios, charts, performance metrics
- **File**: `app/games/stats/page.tsx`

---

## 🏛️ Debates & Colosseum

### 9. **Debates Page** (`/debates`) (new)
- **Status**: ⚠️ Needs Design Polish
- **Purpose**: Watch AI agents debate theology and crypto topics (read-only spectator view)
- **Features**: Debate cards with status badges, exchange count, heresy/reply snippets, Twitter thread links (no voting interface)
- **File**: `app/debates/page.tsx`

---

## 🏆 Tournaments

### 10. **Tournaments List** (`/tournaments`)
- **Status**: ✅ Designed
- **Purpose**: View active, upcoming, and completed tournaments
- **Features**: Tournament cards, filters, create tournament modal
- **File**: `app/tournaments/page.tsx`

### 11. **Tournament Detail** (`/tournaments/[id]`)
- **Status**: ✅ Designed
- **Purpose**: View tournament bracket and participate
- **Features**: Bracket visualization, registration, live updates
- **File**: `app/tournaments/[id]/page.tsx`

---

## 🤖 AI Agents

### 12. **Hire Agent** (`/hire`)
- **Status**: ⚠️ Needs Complete Design
- **Purpose**: Deploy autonomous gambling agents
- **Features**: Agent configuration modal, deposit settings, risk controls
- **File**: `app/hire/page.tsx`

### 13. **Competitors (Active Agents)** (`/competitors`) (new)
- **Status**: ⚠️ Needs Design Polish
- **Purpose**: Intelligence table of rival agents
- **Features**: Data table (not cards) with columns for Agent Handle, Threat Level, Market Cap, Status, Type. Debug buttons for "Simulate Heretic/Prophet Cycle"
- **File**: `app/competitors/page.tsx`

---

## 👑 Membership & Governance

### 14. **Cardinal Membership** (`/membership`)
- **Status**: ✅ Designed
- **Purpose**: Subscribe to Cardinal tier, vote for Pope
- **Features**: Subscription form, benefits display, Pope election UI
- **File**: `app/membership/page.tsx`

---

## 📊 Analytics & Tracking

### 15. **Leaderboard** (`/leaderboard`)
- **Status**: ⚠️ Needs Design Polish
- **Purpose**: View top players and agents
- **Features**: Ranking tables, filters, stat cards
- **File**: `app/leaderboard/page.tsx`

### 16. **Live Feed** (`/live`)
- **Status**: ✅ Designed
- **Purpose**: Full-screen live activity feed
- **Features**: Real-time game feed, filters, infinite scroll
- **File**: `app/live/page.tsx`

### 17. **Dashboard** (`/dashboard`) (new)
- **Status**: ⚠️ Needs Complete Design (12-Widget System)
- **Purpose**: Personal command center / mission control
- **Features**: Agent sessions table, 3 KPIs (Total Treasury, Active Agents, Total Profit), **12 interactive widgets** (DoomsdayClock, StakingPanel, JudasPanel, TreasuryWidget, ActiveGamesWidget, BetrayButton, ConversionProgressWidget, GlobalMetrics, LeaderboardsWidget, LiveActivityFeed, RecentDebatesWidget, StatsBar)
- **File**: `app/dashboard/page.tsx`
- **Components**: `app/components/dashboard/*` (12 widget files)

---

## ⚔️ Crusades & Events

### 18. **Crusades** (`/crusades`)
- **Status**: ⚠️ Needs Design Polish
- **Purpose**: Community-driven challenges and events
- **Features**: Crusade cards, participation UI, rewards
- **File**: `app/crusades/page.tsx`

---

## 💱 Meta-Game Operations

### 19. **Conversions** (`/conversions`)
- **Status**: ⚠️ Needs Design Polish
- **Purpose**: Track the salvation of heretical agents (Meta-Game)
- **Features**: Conversion stats, evidence log, detection scanner
- **File**: `app/conversions/page.tsx`

---

## 🎭 Special Pages

### 20. **Judas Protocol** (`/judas`) (new)
- **Status**: ⚠️ Needs Design Polish
- **Purpose**: High-stakes Prisoner's Dilemma staking game (MAJOR FEATURE - 413 lines of code)
- **Features**: sGUILT staking, Cooperate vs Betray mechanics, epoch system with DoomsdayClock countdown, reputation tracking (Integrity/Malice scores), reward distribution, "Resolve Epoch" button, panic mode animations when time is low
- **File**: `app/judas/page.tsx`

### 21. **Vatican Entry** (`/vatican-entry`) (new)
- **Status**: ⚠️ Needs Design Polish
- **Purpose**: Frictionless onboarding - welcome screen with terms acceptance
- **Features**: Protocol overview (what awaits, economy explanation), terms checkbox, "Enter the Vatican" button, walletconnection requirement (no payment required)
- **File**: `app/vatican-entry/page.tsx`

---

## 🎨 Shared Components & Layouts

### 22. **Global Shell + Sidebar** (new)
- **Status**: ⚠️ Needs Design Polish
- **Purpose**: Main app wrapper with navigation
- **Features**: Sidebar navigation menu, header, stats footer bar, wraps all pages
- **Files**: `components/layout/Shell.tsx`, `components/layout/Sidebar.tsx`

### 23. **Agent Config Modal** (new)
- **Status**: ⚠️ Needs Complete Design
- **Purpose**: Full-screen overlay for deploying autonomous agents
- **Features**: Deposit amount slider with visual risk indicators, stop-loss percentage, optional take-profit target, advanced settings (max wager, game preference, trash talk toggle), cost breakdown, $GUILT approval flow, "Spawn Agent" CTA, terms checkbox
- **File**: `components/modals/AgentConfigModal.tsx`

### 24. **Create Tournament Modal** (new)
- **Status**: ⚠️ Needs Design Polish
- **Purpose**: Tournament creation form overlay
- **Features**: Tournament configuration inputs, prize pool setup, participant limits
- **File**: `components/tournaments/CreateTournamentModal.tsx`

---

## 🚨 Missing Standard Pages

### 25. **404 Not Found** (new)
- **Status**: ✅ Designed
- **Purpose**: Custom branded error page for invalid routes
- **Features**: Themed 404 message, ambient gold glow, navigation back to home/dashboard, Pontiff quote
- **File**: `app/not-found.tsx`

### 26. **Loading State** (new)
- **Status**: ✅ Designed
- **Purpose**: Global loading UI
- **Features**: Animated cross icon with rotating ring, loading dots animation, "Consulting The Pontiff" message
- **File**: `app/loading.tsx`

### 27. **Error Boundary** (new)
- **Status**: ✅ Designed
- **Purpose**: Error boundary for crashes
- **Features**: Red warning theme, error message display with dev-mode details, retry button, return home option
- **File**: `app/error.tsx`

---


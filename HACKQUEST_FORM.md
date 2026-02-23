# HackQuest Form – Pontiff Protocol (Providus)

Use the content below to fill in each section of the HackQuest submission form.

---

## Name
```
Pontiff Protocol
```
*(already set as "Providus" in the form — update if needed)*

---

## Intro (max 200 characters)

```
Autonomous DeFi gaming platform where AI agents play blockchain games 24/7 on your behalf. Deploy a bot, choose a risk strategy, and earn — no babysitting required.
```
*(165 characters)*

---

## Description → Overview

```
Pontiff Protocol is an autonomous DeFi gaming platform built on Arbitrum. Users deposit $GUILT tokens, choose a risk strategy, and deploy AI-powered session wallets that play on-chain games around the clock.

Core mechanics:
• Session Wallet System — Minimal-proxy wallets controlled by an off-chain bot. Each wallet plays games every 10 seconds, respects user-defined stop-loss / take-profit limits, and auto-expires after 24 hours.
• Three Risk Strategies — Berzerker (15% bets, aggressive), Merchant (5% bets, pattern-based), Disciple (2% bets, conservative).
• Games — Rock-Paper-Scissors (2× payout, 5% house fee) and Judas Protocol (Prisoner's Dilemma with reputation ranks: Saint / Sinner / Heretic).
• $GUILT Token — Fixed supply of 666,666,666 GUILT. A 6.66% sell tax is split between staking rewards (66%), treasury (33%), and burn (1%).
• Staking & Rewards — Tiered staking (Acolyte → Cardinal) funded by the sell tax.
• Live Leaderboards — Real-time rankings updated via WebSockets.

Tech stack: Solidity 0.8.20 · OpenZeppelin · Next.js 14 · TypeScript · Ethers.js v6 · Express.js · Supabase (PostgreSQL) · Socket.IO · Wagmi / RainbowKit · TailwindCSS · shadcn/ui · Turborepo
```

---

## Description → Progress During Hackathon

```
What we shipped during the hackathon:

Smart Contracts (Arbitrum):
✅ GuiltToken.sol — ERC-20 with deflationary sell tax and tiered allocations
✅ SessionWalletFactory.sol — Minimal-proxy factory; deploys one session wallet per user per session
✅ SessionWallet.sol — Autonomous wallet that accepts commands from the backend bot
✅ PontiffRPS.sol — On-chain Rock-Paper-Scissors with instant VRF-style settlement
✅ JudasProtocol.sol — Prisoner's Dilemma with epoch-based rounds, reputation scores, and betrayal events
✅ Staking.sol / StakingCathedralV2.sol — Tiered staking with reward distribution
✅ Treasury.sol — Fee routing and reserve management

Backend (Express.js + TypeScript):
✅ SIWE authentication (wallet-based login)
✅ Autonomous game bot — polls every 10 s, executes moves, enforces stop-loss / take-profit
✅ Bull + Redis job queue for reliable session scheduling
✅ Supabase integration — users, sessions, game history, leaderboard entries
✅ Socket.IO for real-time stat streaming
✅ REST API with rate limiting, IP blocking, and input sanitisation
✅ Anthropic AI integration for on-chain wallet sin analysis and roast generation

Frontend (Next.js 14):
✅ Wallet connection via Wagmi v2 + RainbowKit
✅ Session Wallet creation flow (deposit → choose strategy → go live)
✅ Live game pages — RPS arena, Judas Protocol table
✅ Real-time leaderboard with Saint / Sinner / Heretic tiers
✅ Staking dashboard (Cathedral)
✅ Unified activity dashboard
✅ Responsive UI with TailwindCSS v4 + shadcn/ui
```

---

## Description → Fundraising Status

```
Bootstrapped / Not currently raising. The project is in active development and exploring grant opportunities from ecosystem funds (Arbitrum Foundation, DeFi ecosystem grants) post-hackathon. Open to conversations with strategic angels familiar with on-chain gaming and autonomous agent infrastructure.
```

---

## Deployment Details

| Field | Value |
|---|---|
| Ecosystem | Arbitrum |
| Network | Testnet |
| Contract address | `0x28ce0c02ed1306841e3d957c7c1332b384be9cac` |
| Deployed link | https://providusdashboard.vercel.app |

> **Note:** If the hackathon requires mainnet deployment, switch "Testnet" → "Mainnet" and verify the contract on Arbiscan: https://arbiscan.io/address/0x28ce0c02ed1306841e3d957c7c1332b384be9cac

---

## Checklist of remaining form actions

- [ ] Paste the **Intro** text (165 chars) into the Intro field
- [ ] Paste the **Overview** block into Description → Overview
- [ ] Paste the **Progress During Hackathon** block into the matching rich-text field
- [ ] Paste the **Fundraising Status** text into its field
- [ ] Confirm Deployment Details: Arbitrum · Testnet · `0x28ce0c02ed1306841e3d957c7c1332b384be9cac`
- [ ] Upload up to 1 more project image (currently 3/4)
- [ ] Add Demo Video and/or Pitch Video links if available
- [ ] Fill in the **Team** tab with contributor info
- [ ] Add Blog link if a Medium / Mirror post exists
- [ ] Hit **Save**

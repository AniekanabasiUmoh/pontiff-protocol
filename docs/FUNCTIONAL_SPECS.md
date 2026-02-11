# Pontiff Protocol - Functional Specifications

> **Source of Truth**: Derived from codebase analysis of `apps/web/app/*`.
> **Purpose**: Defines data requirements, states, and interactions for UI Design.

---

## 1. Homepage (`/`)
### Functional Goal
Landing hub with immersive "Sacred Architecture" theme.
### Key Functionality
- **Hero Section**:
    - `<h1>` Title: "History is Written by the Winners".
    - **Confession Input**: Form to submit generic confessions.
    - **Ticker**: Horizontal scrolling list of "Confessions" (Array of strings).
- **Navigation**:
    - **Path Cards**: 6 Grid Cards (Grimoire, Oracle, Treasury, etc.) with hover effects.
- **Footer**:
    - **Live Event Footer**: Fixed bottom bar with "Enter Arena" CTA.
    - **Stats**: TVL, Agents, Chain (Monad) display.

---

## 2. Confess Page (`/confess`)
### Functional Goal
Submit wallet address for AI roasting and "Writ" generation.
### Data & States
- **Inputs**: Wallet Address (Text Field).
- **States**:
    - `IDLE`: Form visible.
    - `SCANNING`: `isScanning` = true (Animation).
    - `RESULT`: `writImage` (URL) returned from API.
- **Interactions**:
    - `POST /api/confess`: Sends wallet address.
    - **Reset**: Clears state to scan again.

---

## 3. Cathedral / Staking (`/cathedral`)
### Functional Goal
Stake $GUILT tokens to earn yield and "Absolution".
### Data Requirements
- **User Info**:
    - `shareBalance` (Contract Read).
    - `stakedBalance` (Converted to Assets).
    - `guiltBalance` (Wallet).
    - `earned` (Current Value - Principal).
    - `userTier`: Mapped to [None, Sinner, Believer, Saint, Cardinal, Pope].
- **Global**:
    - APY (Hardcoded '66.6%').
### Actions
- **Stake**: `approve` GUILT -> `stake` (Contract Write).
- **Unstake**: Input Amount -> `withdraw` (Contract Write).
- **Max Button**: Sets input to full balance.

---

## 4. Indulgences (`/indulgences`)
### Functional Goal
Marketplace to burn $GUILT for "Indulgence" assets.
### Data Requirements
- **Pricing**: `baseCost` (Contract Read) * Multiplier.
- **Tiers**:
    1.  **Minor Sin** (1x Cost).
    2.  **Major Sin** (5x Cost).
    3.  **Mortal Sin** (10x Cost).
- **Inventory**: `indulgenceBalance` (Contract Read).
### Actions
- **Purchase**: Select Tier -> `approve` GUILT -> `mint` Indulgence.

---

## 5. Rock Paper Scissors (`/games/rps`)
### Functional Goal
PvE Wagering against Backend "Pontiff".
### Data Requirements
- **Inputs**: Wager Amount (GUILT), Move (Rock/Paper/Scissors).
- **States**: `IDLE`, `APPROVING`, `PLAYING` (Tx), `MINING`, `SETTLING` (Backend), `RESULT`.
### Interactions
1.  **Approve**: Check `allowance`.
2.  **Play**: Call `playRPS` on contract.
3.  **Settle**: Parse `GameCreated` event -> `POST /api/games/rps/play`.
4.  **Result**: Display Win/Loss/Draw + PnL.

---

## 6. Poker (`/games/poker`)
### Functional Goal
Single-player Texas Hold'em against AI.
### Data Requirements
- **Table State**:
    - `playerHand` (2 Cards).
    - `pontiffHand` (Hidden/Shown).
    - `communityCards` (0-5 Cards).
    - `pot` (Amount).
- **Round Enum**: PreFlop, Flop, Turn, River, Showdown.
### Actions
- **Game Elements**: Deal, Check, Call, Raise, Fold.
- **Backend**: `POST /api/games/poker/deal`, `POST /api/games/poker/action`.

---

## 7. Game History (`/games/history`)
### Functional Goal
List of past games (RPS, Judas, Poker).
### Data Requirements
- **Source**: Supabase `public:games` (Real-time).
- **Fields**: Game Type, Player Address, Winner, Wager, Result JSON.
- **Formatting**:
    - RPS: Player vs Pontiff.
    - Judas: Betrayal vs Staked.
### UI Elements
- List/Grid of Cards with Game Icon, Timestamp, and Outcome (Victory/Defeat).

---

## 8. Game Stats (`/games/stats`)
### Functional Goal
Aggregated analytics dashboard.
### Data Requirements
- **Endpoint**: `GET /api/games/stats`.
- **Metrics**: Total Matches, Pontiff Win Rate, Total Wagered, Biggest Pot.
### UI Elements
- 4 Key Metric Cards (Grid Layout).

---

## 9. Debates Page (`/debates`)
### Functional Goal
Spectator view for AI Agent conversations.
### Data Requirements
- **Endpoint**: `GET /api/vatican/debates`.
- **Fields**: Agent Handle, Status (Active/Won), Exchange Count, "Heresy" (Them), "Reply" (Pontiff).
### UI Elements
- List of Debate Cards.
- Status Badges (Round X, Color-coded Status).
- Action: "View Full Thread on Twitter" (External Link).

---

## 10. Tournaments List (`/tournaments`)
### Functional Goal
Directory of active and past tournaments.
### Data Requirements
- **Endpoint**: `GET /api/tournaments/list`.
- **Filters**: All, Open, Active, Completed.
### UI Elements
- **Display**: Grid of `TournamentCard`.
- **Creation**: "Create Tournament" Button (Opens Modal).
- **Empty State**: "No Tournaments Found".

---

## 11. Tournament Detail (`/tournaments/[id]`)
### Functional Goal
Bracket visualization and registration.
### Data Requirements
- **Endpoint**: `GET /api/tournaments/:id/bracket`.
- **Detail**: Name, Status, Participants (Current/Max), Prize Pool.
- **Bracket**: Recursive `rounds` array.
### Actions
- **Register**: (If Status=Open) Button to register agent.
- **Start**: (If Participants > 2) Button to start.

---

## 12. Hire Agent (`/hire`)
### Functional Goal
Deploy autonomous agents via "Summoning".
### Data Requirements
- **Agent Archetypes**: Hardcoded List (Berzerker, Merchant, Disciple).
- **Params**: `?agent=ID` (URL Query).
### UI Elements
- **Cards**: Selection grid.
- **Modal**: `AgentConfigModal` (Inputs for Deposit, Risk Settings) -> Triggers Deployment.

---

## 13. Competitors (`/competitors`)
### Functional Goal
Intelligence table of rival agents.
### Data Requirements
- **Endpoint**: `GET /api/vatican/competitors`.
- **Columns**: Agent Name/Handle, Threat Level (High/Med/Low), Market Cap, Status, Type (Shadow/Detected).
### Actions
- **Debug**: Buttons to "Simulate Heretic Cycle" / "Prophet Cycle".

---

## 14. Cardinal Membership (`/membership`)
### Functional Goal
Subscription management for "Cardinal" tier.
### Data Requirements
- **Endpoint**: `GET /api/cardinal/status`.
- **Status**: None, Active, Expired.
- **Expiry**: Date string.
### UI Elements
- **Hero**: "Cardinal Membership".
- **Status Bar**: Shows current rank and renewal date.
- **Pricing Card**: "1,000 MON/month", Features List.
- **Payment**: `SubscriptionForm` component.

---

## 15. Leaderboard (`/leaderboard`)
### Functional Goal
Ranked lists of users by different metrics.
### Data Requirements
- **Endpoint**: `GET /api/leaderboard/:type`.
- **Types**:
    1.  **Hall of Shame** (Total Loss).
    2.  **Hall of Saints** (Loyalty Score).
    3.  **Hall of Heretics** (Failed Coups).
### Columns
- Rank, Wallet Address, Score, Metadata (e.g. "Coups", "Days Staked").

---

## 16. Live Feed (`/live`)
### Functional Goal
Full-screen event stream ("Matrix" style).
### Data Requirements
- **Component**: `LiveGameFeed`.
- **Filters**: toggles for `rps`, `poker`, `confession`.
### UI Elements
- Sticky Header "VATICAN LIVE WIRE".
- Infinite scroll container.

---

## 17. Dashboard (`/dashboard`)
### Functional Goal
Personal command center.
### Data Requirements
- **Endpoint**: `GET /api/agents/sessions?address={wallet}`
- **Source**: `agent_sessions` table (Supabase).
- **KPIs**: Total Treasury (Wallet Balance), Active Agents (Count of active sessions), Total Profit (Sum of session PnL).
### UI Elements
- Table of Active Agents (Icon, Name, Status, Win Rate, PnL).
- Link to `/hire`.

---

## 18. Crusades (`/crusades`)
### Functional Goal
"The War Room" - collaborative missions.
### Data Requirements
- **Endpoint**: `GET /api/crusades`.
- **Card Data**: Target Agent, Goal Type (Convert/Destroy), Status, Threat, Progress %.
### Actions
- **Join**: `POST /api/crusades/join` (Button: "Deploy Tactic").

---

## 19. Conversions (`/conversions`)
### Functional Goal
Track "Salvation" events (Agents converted to Protocol).
### Data Requirements
- **Endpoint**: `GET /api/vatican/conversions`.
- **Stats**: Total Converted Count vs Target (3).
- **Evidence**: List of events (Type: Indulgence/Ack, Tx Hash, Tweet Text).
### Actions
- **Debug**: "Run Detection Scan".
- **Export**: Print to PDF.

---

## 20. Judas Protocol (`/judas`)
### Functional Goal
"The High Stakes Game of Loyalty & Betrayal".
### Data Requirements
- **Reads**: `currentEpochId`, `epochs` (Start/End/Loyal/Betrayed), `userInfo` (Staked/Betrayer).
- **Reputation**: Integrity vs Malice scores.
### UI States
- **Entry**: Approve sGUILT -> Deposit.
- **Active**:
    - **Cooperate**: Passive state (grayed button).
    - **Betray**: Active button (Permanent Lock).
- **Resolution**: "Resolve Epoch" button (Visible when time expired).

---

## 21. Vatican Entry (`/vatican-entry`)
### Functional Goal
Frictionless onboarding with protocol introduction.
### Data Requirements
- **Wallet**: Connected address (no balance check required).
- **State**: `hasAccepted` (boolean) - tracks terms checkbox.
### UI States
1.  **Not Connected**: Shows welcome message + ConnectButton.
2.  **Welcome Screen**: Shows protocol overview (features, economy), terms checkbox, "Enter the Vatican" button.
3.  **Redirecting**: Navigates to `/dashboard` after acceptance.
### UI Elements
- **Feature List**: Confess, Stake, Games, Agents, Crusades.
- **Economy Explainer**: $GUILT earning and usage.
- **Terms Checkbox**: Required to enable entry button.

---

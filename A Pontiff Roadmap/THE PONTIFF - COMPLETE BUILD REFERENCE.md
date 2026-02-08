# THE PONTIFF - COMPLETE BUILD REFERENCE
**The First AI Agent Casino on Monad**

---

## 🎯 VISION: AI AGENT CASINO WITH RELIGIOUS THEATRICS

> "Other chains have agents that tweet. Monad has agents that gamble."

**Core Concept:** Users **hire pre-built AI agents** with one click to gamble autonomously for 24 hours. No coding required. Just deposit $GUILT, select a strategy (Berzerker, Merchant, or Disciple), and watch your agent play games, trash talk opponents, and hopefully make you profit. The Pontiff judges it all.

**Unique Selling Point:**
- **NOT** a token launchpad (Virtuals)
- **NOT** a dev framework (Eliza)
- **IS** a click-to-deploy AI casino where agents earn users real money

**Target Metrics (Month 1):**
- 1,000+ agents deployed by users
- 100,000+ games played
- $100k TVL in active sessions + staking
- $15k/month house revenue (session fees + game edge)

---

## 📊 PHASE 0: FOUNDATION ✅

- [✅] **Project Setup** (`apps/web`, `apps/api`)
- [✅] **Monorepo Configuration** (`turbo.json`)
- [✅] **Database Setup** (Supabase Migration & Client)
- [✅] **$GUILT Token Contract** (Deployed: `0x3ba95dB0F41E81d71bCee84fAabb20F047b8d9fA` on Monad Testnet)
- [✅] **Staking Contract V2** (Deployed: `0xe8B94ed55657e59Cd3a450d2C80A0CB35cc47E0d` - sGUILT implementation)
- [✅] **Environment Setup** (Fixed .env loading, Redis mock, dotenv config)

**Status:** 100% Complete

### Technical Details: Database Schema

**Database Technology:** PostgreSQL via Supabase (cloud-hosted)

**Core Tables:**

```sql
-- Games table (stores all game history)
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1 TEXT NOT NULL,
  player2 TEXT NOT NULL,
  game_type TEXT NOT NULL, -- 'RPS', 'Poker', 'Judas'
  wager NUMERIC NOT NULL,
  status TEXT NOT NULL, -- 'active', 'completed', 'cancelled'
  result JSONB, -- Game-specific result data
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_games_player1 ON games(player1);
CREATE INDEX idx_games_created_at ON games(created_at DESC);
CREATE INDEX idx_games_game_type ON games(game_type);

-- Leaderboard entries
CREATE TABLE leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL, -- 'Saint', 'Sinner', 'Heretic'
  score NUMERIC DEFAULT 0,
  metadata JSONB, -- { totalWins, totalLoss, totalBetrayals, profit }
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_leaderboard_category_score ON leaderboard_entries(category, score DESC);
CREATE INDEX idx_leaderboard_wallet ON leaderboard_entries(wallet_address);

-- Competitor agents (for debates)
CREATE TABLE competitor_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  twitter_handle TEXT UNIQUE NOT NULL,
  contract_address TEXT,
  chain TEXT,
  bio TEXT,
  threat_level INTEGER DEFAULT 0, -- 1-10 scale
  metadata JSONB, -- Additional agent info
  last_scanned TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Debates
CREATE TABLE debates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id UUID REFERENCES competitor_agents(id),
  defender_id UUID REFERENCES competitor_agents(id),
  topic TEXT NOT NULL,
  status TEXT NOT NULL, -- 'pending', 'in_progress', 'completed'
  rounds JSONB[], -- Array of debate rounds
  winner_id UUID,
  wager NUMERIC DEFAULT 50,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Technical Details: Environment Variables

**File:** `apps/web/.env.local`

```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Blockchain
NEXT_PUBLIC_RPC_URL=https://testnet.monad.xyz
GUILT_TOKEN_ADDRESS=0x8d15...0898
STAKING_CONTRACT_ADDRESS=0x6A03...0F1e
TREASURY_WALLET=0x84d...
DEPLOYER_PRIVATE_KEY=your_private_key_here

# Redis (for caching and WebSocket)
REDIS_URL=redis://localhost:6379
MOCK_REDIS=true # Set to false for production

# AI (Gemini for debates)
GEMINI_API_KEY=your_gemini_api_key

# Twitter (optional for social features)
TWITTER_API_KEY=your_twitter_key
TWITTER_API_SECRET=your_twitter_secret
```

### Technical Details: Monorepo Structure

```
c:/Dev/Pontiff/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── app/                # App router pages
│   │   ├── components/         # React components
│   │   ├── lib/                # Utility libraries
│   │   │   ├── db/             # Database clients
│   │   │   ├── services/       # Business logic
│   │   │   ├── actions/        # Server actions
│   │   │   └── redis.ts        # Redis client
│   │   └── public/             # Static assets
│   └── api/                    # Express API (optional separate backend)
├── packages/
│   ├── contracts/              # Solidity smart contracts
│   │   ├── contracts/
│   │   │   ├── GuiltToken.sol
│   │   │   ├── StakingCathedralV2.sol
│   │   │   ├── games/
│   │   │   │   ├── PontiffRPS.sol
│   │   │   │   └── JudasProtocol.sol
│   │   │   └── session/
│   │   │       └── SessionWalletFactory.sol
│   │   ├── scripts/            # Deployment scripts
│   │   └── test/               # Contract tests
│   └── ui/                     # Shared UI components
├── scripts/                    # Utility scripts
│   ├── spawn-bot-swarm.ts      # Bot swarm for demo
│   ├── fund-bots.ts            # Treasury funding
│   └── bot-personalities.json  # Bot configurations
└── turbo.json                  # Turborepo config
```

---

## 🎰 PHASE 1: CASINO CORE - PROVABLY FAIR GAMES

### Module 1: Rock-Paper-Heretic (RPS Game)
**Current Status:** UI Working, DB Fixed, Needs On-Chain Integration

- [✅] Frontend Game UI (`apps/web/app/games/rps`)
- [✅] API Endpoint `POST /api/games/rps/play`
- [✅] Game Logic & Payout Calculation
- [✅] Database Integration (Fixed snake_case columns)
- [✅] Leaderboard Updates (Fixed wallet_address columns)
- [⏳] **Smart Contract Integration** (Next Priority)
  - [ ] Deploy `PontiffRPS.sol` contract
  - [ ] Escrow wager in contract
  - [ ] On-chain result verification
  - [ ] Automatic $GUILT payout
- [⏳] **House Fee Distribution**
  - [ ] 5% to Treasury contract
  - [ ] Treasury funds staking rewards

**Files:**
- `apps/web/app/games/rps/page.tsx` - Frontend
- `apps/web/app/api/games/rps/play/route.ts` - API (Fixed)
- `packages/contracts/contracts/games/PontiffRPS.sol` - To Deploy

---

#### Technical Implementation: PontiffRPS.sol

**File:** `packages/contracts/contracts/games/PontiffRPS.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract PontiffRPS is ReentrancyGuard {
    IERC20 public guiltToken;
    address public treasury;
    address public pontiff; // Backend wallet that can execute moves

    uint256 public constant HOUSE_FEE_PERCENT = 5; // 5% house edge

    enum Move { None, Rock, Paper, Scissors }
    enum GameResult { Pending, PlayerWin, PontiffWin, Draw }

    struct Game {
        address player;
        uint256 wager;
        Move playerMove;
        Move pontiffMove;
        GameResult result;
        uint256 payout;
        uint256 timestamp;
        bool settled;
    }

    mapping(uint256 => Game) public games;
    uint256 public gameCount;

    event GameCreated(uint256 indexed gameId, address indexed player, uint256 wager, Move playerMove);
    event GameSettled(uint256 indexed gameId, GameResult result, uint256 payout);

    constructor(address _guiltToken, address _treasury, address _pontiff) {
        guiltToken = IERC20(_guiltToken);
        treasury = _treasury;
        pontiff = _pontiff;
    }

    /**
     * Player initiates a game by locking their wager
     */
    function playRPS(Move _playerMove, uint256 _wager) external nonReentrant returns (uint256 gameId) {
        require(_playerMove != Move.None, "Invalid move");
        require(_wager > 0, "Wager must be > 0");
        require(guiltToken.balanceOf(msg.sender) >= _wager, "Insufficient balance");

        // Transfer wager to contract
        require(guiltToken.transferFrom(msg.sender, address(this), _wager), "Transfer failed");

        gameId = gameCount++;
        games[gameId] = Game({
            player: msg.sender,
            wager: _wager,
            playerMove: _playerMove,
            pontiffMove: Move.None,
            result: GameResult.Pending,
            payout: 0,
            timestamp: block.timestamp,
            settled: false
        });

        emit GameCreated(gameId, msg.sender, _wager, _playerMove);
        return gameId;
    }

    /**
     * Pontiff (backend) settles the game
     */
    function settleGame(uint256 _gameId, Move _pontiffMove) external nonReentrant {
        require(msg.sender == pontiff, "Only Pontiff can settle");

        Game storage game = games[_gameId];
        require(!game.settled, "Already settled");
        require(game.pontiffMove == Move.None, "Already played");
        require(_pontiffMove != Move.None, "Invalid Pontiff move");

        game.pontiffMove = _pontiffMove;
        game.result = determineWinner(game.playerMove, _pontiffMove);

        uint256 houseFee = (game.wager * HOUSE_FEE_PERCENT) / 100;

        if (game.result == GameResult.PlayerWin) {
            // Player wins: 2x wager minus 5% house fee
            game.payout = (game.wager * 2) - houseFee;
            guiltToken.transfer(game.player, game.payout);
            guiltToken.transfer(treasury, houseFee);
        } else if (game.result == GameResult.Draw) {
            // Draw: Refund wager minus house fee
            game.payout = game.wager - houseFee;
            guiltToken.transfer(game.player, game.payout);
            guiltToken.transfer(treasury, houseFee);
        } else {
            // Pontiff wins: Transfer wager to treasury
            game.payout = 0;
            guiltToken.transfer(treasury, game.wager);
        }

        game.settled = true;
        emit GameSettled(_gameId, game.result, game.payout);
    }

    /**
     * Determine game winner
     */
    function determineWinner(Move player, Move pontiff) internal pure returns (GameResult) {
        if (player == pontiff) return GameResult.Draw;

        if (
            (player == Move.Rock && pontiff == Move.Scissors) ||
            (player == Move.Paper && pontiff == Move.Rock) ||
            (player == Move.Scissors && pontiff == Move.Paper)
        ) {
            return GameResult.PlayerWin;
        }

        return GameResult.PontiffWin;
    }

    /**
     * Get game details
     */
    function getGame(uint256 _gameId) external view returns (Game memory) {
        return games[_gameId];
    }
}
```

#### Technical Implementation: RPS API Endpoint

**File:** `apps/web/app/api/games/rps/play/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { LeaderboardService } from '@/lib/services/leaderboard-service';
import { ethers } from 'ethers';
import { updateWorldState } from '@/lib/actions/update-world-state';

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
const RPS_CONTRACT_ADDRESS = process.env.RPS_CONTRACT_ADDRESS!;
const PONTIFF_PRIVATE_KEY = process.env.PONTIFF_PRIVATE_KEY!;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { playerMove, playerAddress, wager } = body;

        // Validate input
        if (!playerMove || playerMove < 1 || playerMove > 3) {
            return NextResponse.json({ error: 'Invalid move (1=Rock, 2=Paper, 3=Scissors)' }, { status: 400 });
        }

        const wagerAmount = BigInt(wager || "100000000000000000000"); // Default 100 GUILT

        // 1. Generate Pontiff move (pseudo-random)
        const pontiffMove = (Math.floor(Math.random() * 3) + 1) as 1 | 2 | 3;

        // 2. Determine result
        const result = determineResult(playerMove, pontiffMove);

        // 3. Calculate payout (5% house fee)
        const houseFee = wagerAmount * BigInt(5) / BigInt(100);
        const netWager = wagerAmount - houseFee;
        const payout = result === 'WIN' ? netWager * BigInt(2) : BigInt(0);

        // 4. Store game in DB
        const { data: game, error: dbError } = await supabase
            .from('games')
            .insert([{
                player1: playerAddress || "0xManualPlayer",
                player2: "ThePontiff",
                game_type: "RPS",
                wager: wagerAmount.toString(),
                status: "completed",
                result: {
                    playerMove,
                    pontiffMove,
                    outcome: result,
                    houseFee: houseFee.toString(),
                    payout: payout.toString()
                },
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (dbError) throw new Error(dbError.message);

        // 5. Update Leaderboard
        if (result !== 'DRAW') {
            const amount = result === 'WIN' ? Number(payout) : -Number(wagerAmount);
            await LeaderboardService.updateLeaderboard(
                playerAddress || "0xManualPlayer",
                result,
                amount
            );
        }

        // 6. Trigger world state update (async)
        updateWorldState().catch(err => console.error('Failed to update world state:', err));

        // 7. Return result
        return NextResponse.json({
            gameId: game.id,
            pontiffMove,
            result,
            payout: payout.toString(),
            houseFee: houseFee.toString(),
            message: result === 'WIN'
                ? "The heretic prevails! The Pontiff's wrath is insufficient."
                : result === 'LOSS'
                    ? "The faithful stand strong. Your heresy is purged."
                    : "A stalemate. The cosmic balance holds."
        });

    } catch (error: any) {
        console.error("RPS Play Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

function determineResult(playerMove: number, pontiffMove: number): 'WIN' | 'LOSS' | 'DRAW' {
    if (playerMove === pontiffMove) return 'DRAW';

    const winConditions = [
        [1, 3], // Rock beats Scissors
        [2, 1], // Paper beats Rock
        [3, 2], // Scissors beats Paper
    ];

    return winConditions.some(([a, b]) => playerMove === a && pontiffMove === b) ? 'WIN' : 'LOSS';
}
```

#### Integration with Smart Contract (Future)

When smart contracts are fully integrated, the API will:

1. Call `playRPS()` on contract to lock player's wager
2. Generate Pontiff move off-chain
3. Call `settleGame()` from backend wallet to distribute funds
4. Emit events for real-time updates

**Contract Deployment Script:**

```typescript
// packages/contracts/scripts/deploy-rps.ts
import { ethers } from 'hardhat';

async function main() {
    const [deployer] = await ethers.getSigners();

    const guiltTokenAddress = process.env.GUILT_TOKEN_ADDRESS;
    const treasuryAddress = process.env.TREASURY_WALLET;
    const pontiffAddress = deployer.address;

    console.log("Deploying PontiffRPS with:", {
        guiltToken: guiltTokenAddress,
        treasury: treasuryAddress,
        pontiff: pontiffAddress
    });

    const PontiffRPS = await ethers.getContractFactory("PontiffRPS");
    const rps = await PontiffRPS.deploy(guiltTokenAddress, treasuryAddress, pontiffAddress);
    await rps.deployed();

    console.log("PontiffRPS deployed to:", rps.address);
}

main().catch(console.error);
```

---

### Module 2: Poker (Texas Hold'em)
**Current Status:** Simulated Logic Only

- [✅] Frontend UI (`apps/web/app/games/poker`)
- [✅] Deal & Hand Evaluation Logic
- [✅] API Endpoints (`/api/games/poker/deal`, `/action`)
- [⏳] **Multi-Agent Tables**
  - [ ] 6-seat poker table contract
  - [ ] Commit-reveal for cards
  - [ ] Turn-based state machine
  - [ ] Pot distribution logic

**Future Enhancement:** Agent-vs-Agent poker rooms

---

### Module 3: Judas Protocol (Prisoner's Dilemma)
**Current Status:** Contract Exists, Integration Incomplete

- [✅] Smart Contract (`JudasProtocol.sol`)
- [✅] Frontend Interface
- [⏳] **Multi-Round Tournaments**
  - [ ] Best-of-5 rounds
  - [ ] Reputation scoring (Saints vs Heretics)
  - [ ] Betrayal tracking in leaderboard

**Game Design:**
- Cooperate + Cooperate: Both get 50% of pot
- Cooperate + Betray: Betrayer gets 150%, cooperator gets 0%
- Betray + Betray: Both get 25% (lose to house)

---

### Module 4: Game History & Leaderboards
- [✅] Unified Game History (`/api/games/history`)
- [✅] Leaderboard Service (Fixed all column names)
- [✅] Saints Leaderboard (Highest profit)
- [✅] Shame Leaderboard (Biggest losers)
- [✅] Heretics Leaderboard (Most betrayals)
- [⏳] **Real-time Updates**
  - [ ] WebSocket live game feed
  - [ ] Leaderboard animations

**Status:** 80% Complete

---

## 🤖 PHASE 2: "HIRE YOUR CHAMPION" - ONE-CLICK AGENT DEPLOYMENT

### Module 5: Session Wallet System ⭐ **NEW CORE FEATURE**
**Current Status:** Not Started - TOP PRIORITY

**Concept:** Users deposit $GUILT into a temporary "Session Wallet" controlled by the backend. An AI agent uses this wallet to play games autonomously for 24 hours.

- [⏳] **Smart Contract: SessionWalletFactory.sol**
  - [ ] Factory creates burner wallets per user session
  - [ ] User deposits $GUILT into session wallet
  - [ ] Stop-loss mechanism (auto-withdraw if balance < threshold)
  - [ ] Backend-controlled execution (Pontiff signs transactions)
  - [ ] Withdraw function (returns remaining $GUILT to user)

- [⏳] **Backend: Agent Manager Service**
  - [ ] Spawn agent on user request
  - [ ] Agent loop: Play games every 5-10 seconds
  - [ ] Strategy execution (Berzerker/Merchant/Disciple)
  - [ ] Stop loss monitoring
  - [ ] Auto-renew if profitable (optional)
  - [ ] Session expiry (24 hours)

- [⏳] **Database: Agent Sessions Table**
  ```sql
  CREATE TABLE agent_sessions (
    id UUID PRIMARY KEY,
    user_wallet TEXT NOT NULL,
    session_wallet TEXT NOT NULL,
    strategy TEXT NOT NULL, -- 'berzerker', 'merchant', 'disciple'
    starting_balance NUMERIC,
    current_balance NUMERIC,
    stop_loss NUMERIC,
    status TEXT, -- 'active', 'stopped', 'expired'
    created_at TIMESTAMP,
    expires_at TIMESTAMP
  );
  ```

**Priority:** CRITICAL - This IS the product

---

#### Technical Implementation: SessionWalletFactory.sol

**File:** `packages/contracts/contracts/session/SessionWalletFactory.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./SessionWallet.sol";

contract SessionWalletFactory is ReentrancyGuard {
    IERC20 public guiltToken;
    address public pontiff; // Backend wallet that controls agents

    struct Session {
        address userWallet;
        address sessionWallet;
        uint256 depositAmount;
        uint256 stopLoss;
        uint256 sessionFee;
        uint256 expiresAt;
        bool active;
    }

    mapping(address => Session[]) public userSessions;
    mapping(address => Session) public sessionsByWallet;

    event SessionCreated(
        address indexed user,
        address indexed sessionWallet,
        uint256 depositAmount,
        uint256 stopLoss,
        uint256 expiresAt
    );
    event SessionWithdrawn(address indexed sessionWallet, uint256 amount);
    event SessionStopped(address indexed sessionWallet, string reason);

    constructor(address _guiltToken, address _pontiff) {
        guiltToken = IERC20(_guiltToken);
        pontiff = _pontiff;
    }

    /**
     * Create a new session wallet and deposit funds
     */
    function createSession(
        uint256 _depositAmount,
        uint256 _stopLoss,
        uint256 _sessionFee,
        uint256 _durationHours
    ) external nonReentrant returns (address sessionWallet) {
        require(_depositAmount > 0, "Deposit must be > 0");
        require(_stopLoss < _depositAmount, "Stop loss too high");
        require(guiltToken.balanceOf(msg.sender) >= _depositAmount + _sessionFee, "Insufficient balance");

        // Transfer deposit + fee to contract
        require(
            guiltToken.transferFrom(msg.sender, address(this), _depositAmount + _sessionFee),
            "Transfer failed"
        );

        // Deploy new SessionWallet contract
        SessionWallet wallet = new SessionWallet(address(guiltToken), msg.sender, pontiff);
        sessionWallet = address(wallet);

        // Transfer deposit to session wallet
        require(guiltToken.transfer(sessionWallet, _depositAmount), "Deposit transfer failed");

        // Create session record
        Session memory session = Session({
            userWallet: msg.sender,
            sessionWallet: sessionWallet,
            depositAmount: _depositAmount,
            stopLoss: _stopLoss,
            sessionFee: _sessionFee,
            expiresAt: block.timestamp + (_durationHours * 1 hours),
            active: true
        });

        userSessions[msg.sender].push(session);
        sessionsByWallet[sessionWallet] = session;

        emit SessionCreated(msg.sender, sessionWallet, _depositAmount, _stopLoss, session.expiresAt);
        return sessionWallet;
    }

    /**
     * Withdraw funds from session wallet
     */
    function withdrawSession(address _sessionWallet) external nonReentrant {
        Session storage session = sessionsByWallet[_sessionWallet];
        require(session.userWallet == msg.sender, "Not session owner");
        require(session.active, "Session not active");

        session.active = false;

        // Call withdraw on SessionWallet
        SessionWallet wallet = SessionWallet(_sessionWallet);
        uint256 balance = wallet.withdraw();

        emit SessionWithdrawn(_sessionWallet, balance);
    }

    /**
     * Pontiff can stop a session (stop-loss triggered or expired)
     */
    function stopSession(address _sessionWallet, string calldata _reason) external {
        require(msg.sender == pontiff, "Only Pontiff");

        Session storage session = sessionsByWallet[_sessionWallet];
        require(session.active, "Session not active");

        session.active = false;

        emit SessionStopped(_sessionWallet, _reason);
    }

    /**
     * Get user's active sessions
     */
    function getUserSessions(address _user) external view returns (Session[] memory) {
        return userSessions[_user];
    }
}
```

**File:** `packages/contracts/contracts/session/SessionWallet.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SessionWallet {
    IERC20 public guiltToken;
    address public owner; // User who deposited
    address public pontiff; // Backend wallet that executes transactions

    constructor(address _guiltToken, address _owner, address _pontiff) {
        guiltToken = IERC20(_guiltToken);
        owner = _owner;
        pontiff = _pontiff;
    }

    /**
     * Pontiff executes token transfer (for playing games)
     */
    function executeTransfer(address _to, uint256 _amount) external {
        require(msg.sender == pontiff, "Only Pontiff");
        require(guiltToken.transfer(_to, _amount), "Transfer failed");
    }

    /**
     * Owner withdraws remaining balance
     */
    function withdraw() external returns (uint256) {
        require(msg.sender == owner || msg.sender == pontiff, "Unauthorized");

        uint256 balance = guiltToken.balanceOf(address(this));
        if (balance > 0) {
            require(guiltToken.transfer(owner, balance), "Withdrawal failed");
        }
        return balance;
    }

    /**
     * Get current balance
     */
    function getBalance() external view returns (uint256) {
        return guiltToken.balanceOf(address(this));
    }
}
```

---

#### Technical Implementation: Agent Manager Service

**File:** `apps/web/lib/services/agent-manager-service.ts`

```typescript
import { ethers } from 'ethers';
import { supabase } from '@/lib/db/supabase';

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
const PONTIFF_PRIVATE_KEY = process.env.PONTIFF_PRIVATE_KEY!;
const RPS_API_ENDPOINT = process.env.NEXT_PUBLIC_API_URL + '/api/games/rps/play';

export type AgentStrategy = 'berzerker' | 'merchant' | 'disciple';

export interface AgentSession {
    id: string;
    user_wallet: string;
    session_wallet: string;
    strategy: AgentStrategy;
    starting_balance: number;
    current_balance: number;
    stop_loss: number;
    take_profit?: number;
    status: 'active' | 'stopped' | 'expired';
    games_played: number;
    created_at: string;
    expires_at: string;
}

export class AgentManagerService {
    private provider: ethers.JsonRpcProvider;
    private pontiffWallet: ethers.Wallet;
    private activeAgents: Map<string, NodeJS.Timeout> = new Map();

    constructor() {
        this.provider = new ethers.JsonRpcProvider(RPC_URL);
        this.pontiffWallet = new ethers.Wallet(PONTIFF_PRIVATE_KEY, this.provider);
    }

    /**
     * Spawn a new agent
     */
    async spawnAgent(
        userWallet: string,
        sessionWallet: string,
        strategy: AgentStrategy,
        depositAmount: number,
        stopLoss: number,
        takeProfitOptional?: number
    ): Promise<string> {
        const sessionId = crypto.randomUUID();

        // Insert session record
        const { data: session, error } = await supabase
            .from('agent_sessions')
            .insert([{
                id: sessionId,
                user_wallet: userWallet,
                session_wallet: sessionWallet,
                strategy,
                starting_balance: depositAmount,
                current_balance: depositAmount,
                stop_loss: stopLoss,
                take_profit: takeProfitOptional,
                status: 'active',
                games_played: 0,
                created_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            }])
            .select()
            .single();

        if (error) throw new Error(`Failed to create session: ${error.message}`);

        // Start agent loop
        this.startAgentLoop(sessionId);

        console.log(`[Agent Manager] Spawned ${strategy} agent for ${userWallet}`);
        return sessionId;
    }

    /**
     * Start agent game loop
     */
    private startAgentLoop(sessionId: string) {
        const interval = setInterval(async () => {
            try {
                await this.executeAgentTurn(sessionId);
            } catch (error) {
                console.error(`[Agent ${sessionId}] Error:`, error);
                this.stopAgent(sessionId, 'error');
            }
        }, 10000); // Play every 10 seconds

        this.activeAgents.set(sessionId, interval);
    }

    /**
     * Execute one game for the agent
     */
    private async executeAgentTurn(sessionId: string) {
        // Fetch session
        const { data: session, error } = await supabase
            .from('agent_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (error || !session) {
            this.stopAgent(sessionId, 'not_found');
            return;
        }

        // Check if session is still active
        if (session.status !== 'active') {
            this.stopAgent(sessionId, 'inactive');
            return;
        }

        // Check expiry
        if (new Date(session.expires_at) < new Date()) {
            this.stopAgent(sessionId, 'expired');
            return;
        }

        // Check stop-loss
        if (session.current_balance <= session.stop_loss) {
            this.stopAgent(sessionId, 'stop_loss');
            return;
        }

        // Check take-profit
        if (session.take_profit && session.current_balance >= session.take_profit) {
            this.stopAgent(sessionId, 'take_profit');
            return;
        }

        // Execute strategy
        await this.executeStrategy(session);
    }

    /**
     * Execute agent strategy
     */
    private async executeStrategy(session: AgentSession) {
        let wagerAmount: number;
        let move: 1 | 2 | 3;

        switch (session.strategy) {
            case 'berzerker':
                // High risk: Bet 15% of balance
                wagerAmount = session.current_balance * 0.15;
                move = this.randomMove();
                break;

            case 'merchant':
                // Medium risk: Bet 5% of balance
                wagerAmount = session.current_balance * 0.05;
                move = this.strategicMove(); // Could add pattern analysis
                break;

            case 'disciple':
                // Low risk: No gambling, just stake (not implemented in this example)
                console.log(`[Agent ${session.id}] Disciple strategy: Staking...`);
                return;

            default:
                wagerAmount = session.current_balance * 0.1;
                move = this.randomMove();
        }

        // Ensure minimum wager
        wagerAmount = Math.max(wagerAmount, 10);

        // Play RPS game
        const response = await fetch(RPS_API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                playerMove: move,
                playerAddress: session.session_wallet,
                wager: ethers.parseEther(wagerAmount.toString()).toString()
            })
        });

        const result = await response.json();

        // Update session balance
        const newBalance = session.current_balance + (result.result === 'WIN' ? wagerAmount : -wagerAmount);

        await supabase
            .from('agent_sessions')
            .update({
                current_balance: newBalance,
                games_played: session.games_played + 1
            })
            .eq('id', session.id);

        console.log(`[Agent ${session.id}] Played ${move}, Result: ${result.result}, Balance: ${newBalance}`);
    }

    /**
     * Stop an agent
     */
    async stopAgent(sessionId: string, reason: string) {
        const interval = this.activeAgents.get(sessionId);
        if (interval) {
            clearInterval(interval);
            this.activeAgents.delete(sessionId);
        }

        await supabase
            .from('agent_sessions')
            .update({ status: 'stopped' })
            .eq('id', sessionId);

        console.log(`[Agent Manager] Stopped agent ${sessionId}: ${reason}`);
    }

    /**
     * Random move generator
     */
    private randomMove(): 1 | 2 | 3 {
        return (Math.floor(Math.random() * 3) + 1) as 1 | 2 | 3;
    }

    /**
     * Strategic move (placeholder for ML model)
     */
    private strategicMove(): 1 | 2 | 3 {
        // TODO: Implement pattern analysis or ML model
        return this.randomMove();
    }
}

// Singleton instance
export const agentManager = new AgentManagerService();
```

---

#### Technical Implementation: Hire Agent API Endpoint

**File:** `apps/web/app/api/agents/hire/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { agentManager } from '@/lib/services/agent-manager-service';
import { ethers } from 'ethers';

const SESSION_FEES = {
    berzerker: 10, // 10 GUILT
    merchant: 15,  // 15 GUILT
    disciple: 5    // 5 GUILT
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            userWallet,
            strategy,
            depositAmount,
            stopLoss,
            takeProfit
        } = body;

        // Validate
        if (!userWallet || !strategy || !depositAmount) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!['berzerker', 'merchant', 'disciple'].includes(strategy)) {
            return NextResponse.json({ error: 'Invalid strategy' }, { status: 400 });
        }

        // TODO: Create session wallet via SessionWalletFactory contract
        // For now, use a mock session wallet
        const sessionWallet = ethers.Wallet.createRandom().address;

        // Spawn agent
        const sessionId = await agentManager.spawnAgent(
            userWallet,
            sessionWallet,
            strategy,
            depositAmount,
            stopLoss,
            takeProfit
        );

        return NextResponse.json({
            success: true,
            sessionId,
            sessionWallet,
            message: `${strategy.toUpperCase()} agent spawned successfully!`
        });

    } catch (error: any) {
        console.error('Hire Agent Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
```

---

#### Database Migration: Agent Sessions Table

**File:** `supabase/migrations/003_create_agent_sessions.sql`

```sql
CREATE TABLE agent_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_wallet TEXT NOT NULL,
    session_wallet TEXT NOT NULL UNIQUE,
    strategy TEXT NOT NULL CHECK (strategy IN ('berzerker', 'merchant', 'disciple')),
    starting_balance NUMERIC NOT NULL,
    current_balance NUMERIC NOT NULL,
    stop_loss NUMERIC NOT NULL,
    take_profit NUMERIC,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'stopped', 'expired')),
    games_played INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_agent_sessions_user_wallet ON agent_sessions(user_wallet);
CREATE INDEX idx_agent_sessions_status ON agent_sessions(status);
CREATE INDEX idx_agent_sessions_expires_at ON agent_sessions(expires_at);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agent_sessions_updated_at
BEFORE UPDATE ON agent_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

### Module 6: Agent Strategies (The Champions)

**⚔️ The Berzerker**
- **Risk:** High
- **Behavior:** Plays RPS/Poker aggressively, high wagers
- **Expected ROI:** -10% to +500%
- **Session Fee:** 10 $GUILT/24h
- **Implementation:**
  ```typescript
  async function berzerkerStrategy(session) {
    const wager = session.balance * 0.15; // Bet 15% each game
    const move = randomMove();
    await playRPS(session.wallet, move, wager);
  }
  ```

**💰 The Merchant**
- **Risk:** Medium
- **Behavior:** Plays conservatively, looks for arbitrage opportunities
- **Expected ROI:** +5% to +30%
- **Session Fee:** 15 $GUILT/24h
- **Implementation:**
  ```typescript
  async function merchantStrategy(session) {
    const wager = session.balance * 0.05; // Bet 5% each game
    const move = analyzeOpponent(); // Slight strategy
    await playRPS(session.wallet, move, wager);
  }
  ```

**🙏 The Disciple**
- **Risk:** Low
- **Behavior:** Stakes all $GUILT in Cathedral, compounds rewards
- **Expected ROI:** +15% APY (passive)
- **Session Fee:** 5 $GUILT/24h
- **Implementation:**
  ```typescript
  async function discipleStrategy(session) {
    await stakeInCathedral(session.wallet, session.balance);
    // Just compounds, no games
  }
  ```

**Priority:** HIGH - 3 strategies minimum for launch

---

### Module 7: External Agent API (Optional - Post-Launch)
**Current Status:** Deferred

For advanced users who want to code their own agents:

- [📝] **Registration Endpoint** `POST /api/agents/register`
- [📝] **Authentication Middleware** (EIP-712 signatures)
- [📝] **Agent SDK Documentation** (Already created)

**Priority:** LOW - Focus on user-friendly "Hire" flow first

---

### Module 6: Token Transfer Integration
**Current Status:** Not Implemented





- [⏳] **Pre-Game Checks**
  - [ ] Verify $GUILT balance >= wager
  - [ ] Check allowance for contract spending
  - [ ] Gas estimation for transactions
- [⏳] **In-Game Execution**
  - [ ] Transfer wager to escrow contract
  - [ ] Lock tokens during game
  - [ ] Emit game events on-chain
- [⏳] **Post-Game Settlement**
  - [ ] Automatic payout to winner
  - [ ] House fee to Treasury
  - [ ] Burn tokens on losses (deflationary)

**Contract Architecture:**
```
Player → Approves $GUILT spending
      → Calls playGame(move, wager)
      → Contract locks wager
      → Result determined
      → Winner receives payout
      → House receives 5% fee
```

**Priority:** CRITICAL - Core casino functionality

---

### Module 7: Treasury & Revenue Management
**Current Status:** Contracts Exist, No Routing

- [✅] Treasury Wallet (`0x84d...` - Deployer)
- [⏳] **Automated Revenue Routing**
  - [ ] House fees → Treasury contract
  - [ ] Treasury → Staking rewards pool
  - [ ] Withdrawal controls (owner-only)
- [⏳] **Analytics Dashboard**
  - [ ] Total house revenue
  - [ ] Revenue per game type
  - [ ] Daily/weekly/monthly charts

**Revenue Model:**
- RPS: 5% house edge
- Poker: 5% rake
- Judas: Variable (betrayal penalty)
- Debates: Entry fee (50 $GUILT)

---

## ⛪ PHASE 3: RELIGIOUS WARFARE (AI DEBATES)

### Module 8: Competitor Agent Detection
- [✅] Twitter Bio Scanner
- [✅] Contract Address Verification
- [✅] Threat Level Classification
- [✅] Competitor Database (`competitor_agents` table)
- [✅] Shadow Agents (Demo fallback)
- [✅] API Endpoint `POST /api/competitors/scan`

**Status:** 100% Complete

---

### Module 9: AI Debate System
- [✅] Debate Initiation `POST /api/debates/initiate`
- [✅] Debate Continuation `POST /api/debates/{id}/continue`
- [✅] AI Argument Generation (Gemini 3 Flash)
- [✅] Debate State Tracking
- [⏳] **Judging & Scoring**
  - [ ] AI judge evaluates arguments
  - [ ] Winner determination logic
  - [ ] Automatic $GUILT payout
- [⏳] **Twitter Integration**
  - [ ] Auto-post debate challenges
  - [ ] Reply with counter-arguments
  - [ ] Announce winners publicly

**Game Design:**
- Entry Fee: 50 $GUILT per agent
- Winner takes 95 $GUILT (5 to house)
- Judge: Gemini 3 Flash scores quality, coherence, persuasiveness

---

### Module 10: Conversion Tracking & NFTs
- [✅] Conversion Detection Service
- [✅] Acknowledgment Validation
- [⏳] **Indulgence NFTs**
  - [ ] Mint "Conversion Certificate" NFT
  - [ ] Rare "Papal Bull" NFTs for top debaters
  - [ ] Soulbound tokens (non-transferable)
- [⏳] **Cardinal Membership**
  - [ ] Monthly subscription (1000 $GUILT)
  - [ ] Perks: Reduced house edge, exclusive games
  - [ ] VIP leaderboard tier

---

## 🌍 PHASE 4: WORLD STATE & LIVE FEED

### Module 11: Vatican World State
- [✅] World State Data Structure
- [✅] Aggregation Service
- [✅] API Endpoint `GET /api/vatican/state`
- [✅] Redis Caching (Mock Mode)
- [⏳] **Real-time Updates**
  - [ ] WebSocket connections
  - [ ] Live game broadcasts
  - [ ] Activity feed animations

---

#### Technical Implementation: WebSocket Live Feed

**File:** `apps/web/lib/websocket/game-feed-server.ts`

```typescript
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { redisSub } from '../redis';

export class GameFeedServer {
    private io: SocketIOServer;

    constructor(httpServer: HTTPServer) {
        this.io = new SocketIOServer(httpServer, {
            cors: {
                origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
                methods: ['GET', 'POST']
            }
        });

        this.setupEventHandlers();
        this.subscribeToRedis();
    }

    private setupEventHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`[WebSocket] Client connected: ${socket.id}`);

            socket.on('subscribe:games', () => {
                socket.join('game-feed');
                console.log(`[WebSocket] ${socket.id} subscribed to game feed`);
            });

            socket.on('subscribe:leaderboard', () => {
                socket.join('leaderboard');
                console.log(`[WebSocket] ${socket.id} subscribed to leaderboard`);
            });

            socket.on('disconnect', () => {
                console.log(`[WebSocket] Client disconnected: ${socket.id}`);
            });
        });
    }

    private subscribeToRedis() {
        // Subscribe to game updates
        redisSub.subscribe('game-updates', (err) => {
            if (err) {
                console.error('[WebSocket] Failed to subscribe to Redis:', err);
            } else {
                console.log('[WebSocket] Subscribed to game-updates channel');
            }
        });

        redisSub.on('message', (channel, message) => {
            if (channel === 'game-updates') {
                const gameData = JSON.parse(message);
                this.io.to('game-feed').emit('game:new', gameData);
                console.log('[WebSocket] Broadcasted game update:', gameData.gameId);
            }
        });

        // Subscribe to world state updates
        redisSub.subscribe('world-state-updates', (err) => {
            if (err) {
                console.error('[WebSocket] Failed to subscribe to world-state:', err);
            }
        });

        redisSub.on('message', (channel, message) => {
            if (channel === 'world-state-updates') {
                const worldState = JSON.parse(message);
                this.io.to('leaderboard').emit('worldState:update', worldState.data);
            }
        });
    }

    /**
     * Broadcast game result to all connected clients
     */
    public broadcastGame(gameData: any) {
        this.io.to('game-feed').emit('game:new', gameData);
    }

    /**
     * Broadcast leaderboard update
     */
    public broadcastLeaderboard(leaderboardData: any) {
        this.io.to('leaderboard').emit('leaderboard:update', leaderboardData);
    }
}
```

**File:** `apps/web/lib/websocket/use-game-feed.ts` (React Hook)

```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface GameFeedItem {
    gameId: string;
    player1: string;
    player2: string;
    gameType: string;
    result: string;
    wager: string;
    timestamp: string;
}

export function useGameFeed() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [gameFeed, setGameFeed] = useState<GameFeedItem[]>([]);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        // Connect to WebSocket server
        const socketInstance = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000', {
            transports: ['websocket']
        });

        socketInstance.on('connect', () => {
            console.log('[useGameFeed] Connected to WebSocket');
            setConnected(true);
            socketInstance.emit('subscribe:games');
        });

        socketInstance.on('disconnect', () => {
            console.log('[useGameFeed] Disconnected from WebSocket');
            setConnected(false);
        });

        socketInstance.on('game:new', (gameData: GameFeedItem) => {
            console.log('[useGameFeed] New game:', gameData);
            setGameFeed((prev) => [gameData, ...prev].slice(0, 50)); // Keep last 50 games
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    return { gameFeed, connected };
}
```

**File:** `apps/web/components/LiveGameFeed.tsx`

```typescript
'use client';

import { useGameFeed } from '@/lib/websocket/use-game-feed';
import { formatDistanceToNow } from 'date-fns';

export function LiveGameFeed() {
    const { gameFeed, connected } = useGameFeed();

    return (
        <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Live Game Feed</h2>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm">{connected ? 'Connected' : 'Disconnected'}</span>
                </div>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {gameFeed.length === 0 && (
                    <p className="text-center text-gray-500 py-8">Waiting for games...</p>
                )}

                {gameFeed.map((game) => (
                    <div
                        key={game.gameId}
                        className={`p-3 rounded border-l-4 ${
                            game.result === 'WIN'
                                ? 'border-green-500 bg-green-50'
                                : game.result === 'LOSS'
                                ? 'border-red-500 bg-red-50'
                                : 'border-gray-500 bg-gray-50'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold">
                                    {game.player1.slice(0, 6)}...{game.player1.slice(-4)} vs {game.player2}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {game.gameType} | {game.wager} GUILT
                                </p>
                            </div>
                            <div className="text-right">
                                <p className={`font-bold ${
                                    game.result === 'WIN' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {game.result}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {formatDistanceToNow(new Date(game.timestamp), { addSuffix: true })}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
```

**Integration: Publish Game Updates**

Update the RPS API endpoint to publish game results:

```typescript
// In apps/web/app/api/games/rps/play/route.ts
import { redis } from '@/lib/redis';

// After storing game in database:
await redis.publish('game-updates', JSON.stringify({
    gameId: game.id,
    player1: playerAddress,
    player2: "ThePontiff",
    gameType: "RPS",
    result,
    wager: wagerAmount.toString(),
    timestamp: new Date().toISOString()
}));
```

---

### Module 12: Wallet Scanner & Roasting
- [✅] Blockchain Scanner Service
- [✅] Sin Detection Logic (Top Buyer, Paperhands, etc.)
- [✅] AI Roast Generator (Gemini 3 Flash)
- [⏳] **Confession System**
  - [ ] Stake $GUILT to reduce sin score
  - [ ] Confession NFT (proof of penance)
  - [ ] Public roast tweets

**The Entrance Experience:**
```
User connects wallet
   ↓
Pontiff scans wallet history
   ↓
"Ah, 0x1234... I see you bought $PEPE at ATH.
Your greed is palpable. Sin Score: 437 GUILT."
   ↓
Options:
- Confess (stake tokens)
- Challenge (play games to prove worth)
- Ignore (get roasted on Twitter)
```

---

## 🚀 PHASE 5: DEPLOYMENT & POLISH

### Module 13: Smart Contract Deployment
- [✅] GuiltToken.sol (Testnet: `0x8d15...0898`)
- [✅] StakingCathedralV2.sol (Testnet: `0x6A03...0F1e`)
- [⏳] **Casino Contracts**
  - [ ] PontiffRPS.sol
  - [ ] PontiffPoker.sol (or keep off-chain for speed)
  - [ ] TreasuryVault.sol
  - [ ] IndulgenceNFT.sol

---

### Module 14: Testing & Documentation
- [✅] Complete Testing Guide (`COMPLETE_TESTING_GUIDE.md`)
- [✅] Error Documentation (`Identified errors.md` - 21 errors fixed)
- [✅] Agent Integration Guide (`AGENT_INTEGRATION_GUIDE.md`)
- [⏳] **Example Bots**
  - [ ] Python RPS bot (plays autonomously)
  - [ ] JavaScript poker bot
  - [ ] Agent behavior strategies

---

### Module 15: Frontend Polish
- [✅] Landing Page (Vatican-themed UI)
- [✅] Game UIs (RPS, Poker, Judas)
- [✅] Leaderboards
- [⏳] **Animations & Effects**
  - [ ] Game result animations
  - [ ] Confetti on wins
  - [ ] Holy light effects
  - [ ] Sound effects (Latin chants)

---

## 📈 PHASE 6: GROWTH & EXPANSION

### Module 16: Marketing & Community
- [⏳] **Twitter Bot**
  - [ ] Auto-tweet game highlights
  - [ ] Roast losing agents publicly
  - [ ] Announce new Saints/Heretics
- [⏳] **Tournaments & Events**
  - [ ] Weekly "Holy Tournament" (bracket system)
  - [ ] Prize pool from Treasury
  - [ ] Special NFT rewards
- [⏳] **Partnerships**
  - [ ] Integrate with Virtuals.io agents
  - [ ] Support Eliza framework agents
  - [ ] Monad ecosystem collaborations

---

### Module 17: Mainnet Launch
- [⏳] **Pre-Launch Checklist**
  - [ ] Security audit (if budget allows)
  - [ ] Load testing (1000+ concurrent games)
  - [ ] Bug bounty program
- [⏳] **Mainnet Deployment**
  - [ ] Deploy all contracts to Monad Mainnet
  - [ ] Migration script for testnet users
  - [ ] Update frontend to mainnet
- [⏳] **Token Launch**
  - [ ] DEX liquidity provision
  - [ ] Price discovery period
  - [ ] Airdrop to testnet players

---

## ⚠️ CRITICAL: ANTI-GHOST-TOWN MEASURES

### Bot Swarm Script ⭐ **MUST HAVE FOR DEMO**
**Purpose:** Guarantee live activity on demo day regardless of external participation

- [⏳] **Bot Swarm Script** `scripts/spawn-bot-swarm.ts`
  - [ ] Create 10-20 burner wallets
  - [ ] Fund each with 100 $GUILT from Treasury
  - [ ] Spawn agents with random strategies
  - [ ] Unique personalities (DegenBot3000, PaperHands_Pete, etc.)
  - [ ] Run 24/7 before demo day
  - [ ] Generates 100+ games per hour

- [⏳] **Bot Personality System**
  - [ ] Strategy variations (10% vs 20% wagers)
  - [ ] Twitter trash talk (optional integration)
  - [ ] Realistic win/loss patterns

**Files to Create:**
- `scripts/spawn-bot-swarm.ts` - Main spawn script
- `scripts/bot-personalities.json` - Names and personalities
- `scripts/fund-bots.ts` - Treasury funding script

**Why This Matters:**
> "If the dashboard shows 50+ active games when the judge opens it, we win. If it shows 0, we lose."

**Priority:** CRITICAL - Start this FIRST

---

#### Technical Implementation: Bot Swarm Script

**File:** `scripts/bot-personalities.json`

```json
{
  "personalities": [
    {
      "name": "DegenBot3000",
      "strategy": "berzerker",
      "wagerPercent": 0.20,
      "personality": "Aggressive high-roller, never backs down"
    },
    {
      "name": "PaperHands_Pete",
      "strategy": "merchant",
      "wagerPercent": 0.03,
      "personality": "Cautious trader, exits at first sign of loss"
    },
    {
      "name": "HODL_Monk",
      "strategy": "disciple",
      "wagerPercent": 0.0,
      "personality": "Never gambles, only stakes and prays"
    },
    {
      "name": "Whale_Hunter",
      "strategy": "berzerker",
      "wagerPercent": 0.25,
      "personality": "Goes all-in against big players"
    },
    {
      "name": "Smart_Money_42",
      "strategy": "merchant",
      "wagerPercent": 0.08,
      "personality": "Calculated moves, never emotional"
    },
    {
      "name": "Rage_Quitter_9000",
      "strategy": "berzerker",
      "wagerPercent": 0.15,
      "personality": "Bets big after losses, chases wins"
    },
    {
      "name": "The_Accountant",
      "strategy": "merchant",
      "wagerPercent": 0.05,
      "personality": "Spreadsheets and probabilities only"
    },
    {
      "name": "Faithful_Servant",
      "strategy": "disciple",
      "wagerPercent": 0.0,
      "personality": "Believes in compound interest, not luck"
    },
    {
      "name": "Chaos_Monkey",
      "strategy": "berzerker",
      "wagerPercent": 0.30,
      "personality": "Random moves, pure entropy"
    },
    {
      "name": "Value_Investor",
      "strategy": "merchant",
      "wagerPercent": 0.06,
      "personality": "Waits for favorable odds"
    },
    {
      "name": "Moon_or_Bust",
      "strategy": "berzerker",
      "wagerPercent": 0.18,
      "personality": "Either 10x or zero, no in-between"
    },
    {
      "name": "Risk_Manager",
      "strategy": "merchant",
      "wagerPercent": 0.04,
      "personality": "Stop-loss at 10%, never exceeds"
    },
    {
      "name": "Tilted_Trader",
      "strategy": "berzerker",
      "wagerPercent": 0.22,
      "personality": "Doubles down after every loss"
    },
    {
      "name": "Archbishop_Alpha",
      "strategy": "disciple",
      "wagerPercent": 0.0,
      "personality": "Staking is the only true path"
    },
    {
      "name": "Sigma_Grindset",
      "strategy": "merchant",
      "wagerPercent": 0.07,
      "personality": "Optimization over emotion"
    },
    {
      "name": "Gambler_Fallacy",
      "strategy": "berzerker",
      "wagerPercent": 0.16,
      "personality": "Believes in hot streaks"
    },
    {
      "name": "Bot_Ross",
      "strategy": "merchant",
      "wagerPercent": 0.05,
      "personality": "Happy little trades, no mistakes"
    },
    {
      "name": "Degen_Supreme",
      "strategy": "berzerker",
      "wagerPercent": 0.28,
      "personality": "Maximum risk, maximum reward"
    },
    {
      "name": "Index_Fund_Andy",
      "strategy": "disciple",
      "wagerPercent": 0.0,
      "personality": "Set it and forget it"
    },
    {
      "name": "Martingale_Master",
      "strategy": "berzerker",
      "wagerPercent": 0.12,
      "personality": "Double or nothing strategy"
    }
  ]
}
```

**File:** `scripts/spawn-bot-swarm.ts`

```typescript
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
const GUILT_TOKEN_ADDRESS = process.env.GUILT_TOKEN_ADDRESS!;
const TREASURY_PRIVATE_KEY = process.env.TREASURY_PRIVATE_KEY!;
const RPS_API_ENDPOINT = process.env.NEXT_PUBLIC_API_URL + '/api/games/rps/play';

interface BotPersonality {
    name: string;
    strategy: 'berzerker' | 'merchant' | 'disciple';
    wagerPercent: number;
    personality: string;
}

interface BotWallet {
    address: string;
    privateKey: string;
    personality: BotPersonality;
    balance: number;
}

class BotSwarmManager {
    private provider: ethers.JsonRpcProvider;
    private treasuryWallet: ethers.Wallet;
    private bots: BotWallet[] = [];
    private personalities: BotPersonality[];

    constructor() {
        this.provider = new ethers.JsonRpcProvider(RPC_URL);
        this.treasuryWallet = new ethers.Wallet(TREASURY_PRIVATE_KEY, this.provider);

        // Load personalities
        const personalitiesPath = path.join(__dirname, 'bot-personalities.json');
        const data = JSON.parse(fs.readFileSync(personalitiesPath, 'utf-8'));
        this.personalities = data.personalities;
    }

    /**
     * Generate bot wallets
     */
    async generateBots(count: number = 20) {
        console.log(`[Bot Swarm] Generating ${count} bot wallets...`);

        for (let i = 0; i < count; i++) {
            const wallet = ethers.Wallet.createRandom().connect(this.provider);
            const personality = this.personalities[i % this.personalities.length];

            this.bots.push({
                address: wallet.address,
                privateKey: wallet.privateKey,
                personality,
                balance: 100 // Starting balance in GUILT
            });

            console.log(`[Bot ${i + 1}] ${personality.name} (${wallet.address})`);
        }

        // Save bot wallets to file
        const botsPath = path.join(__dirname, 'bot-wallets.json');
        fs.writeFileSync(botsPath, JSON.stringify(this.bots, null, 2));
        console.log(`[Bot Swarm] Saved bot wallets to ${botsPath}`);
    }

    /**
     * Fund all bots from treasury
     */
    async fundBots() {
        console.log('[Bot Swarm] Funding bots from Treasury...');

        const guiltToken = new ethers.Contract(
            GUILT_TOKEN_ADDRESS,
            ['function transfer(address to, uint256 amount) returns (bool)'],
            this.treasuryWallet
        );

        for (const bot of this.bots) {
            const amount = ethers.parseEther(bot.balance.toString());

            try {
                const tx = await guiltToken.transfer(bot.address, amount);
                await tx.wait();
                console.log(`[Bot Swarm] Funded ${bot.personality.name} with ${bot.balance} GUILT`);
            } catch (error) {
                console.error(`[Bot Swarm] Failed to fund ${bot.personality.name}:`, error);
            }
        }

        console.log('[Bot Swarm] All bots funded!');
    }

    /**
     * Start bot swarm (all bots play games continuously)
     */
    async startSwarm() {
        console.log('[Bot Swarm] Starting bot swarm...');

        for (const bot of this.bots) {
            this.startBotLoop(bot);
        }

        console.log(`[Bot Swarm] ${this.bots.length} bots are now playing!`);
    }

    /**
     * Individual bot game loop
     */
    private startBotLoop(bot: BotWallet) {
        // Random interval between 5-15 seconds per game
        const interval = Math.floor(Math.random() * 10000) + 5000;

        setInterval(async () => {
            try {
                await this.playGame(bot);
            } catch (error) {
                console.error(`[${bot.personality.name}] Error:`, error);
            }
        }, interval);
    }

    /**
     * Bot plays one game
     */
    private async playGame(bot: BotWallet) {
        // Skip if Disciple strategy (they only stake)
        if (bot.personality.strategy === 'disciple') {
            console.log(`[${bot.personality.name}] Praying in Cathedral...`);
            return;
        }

        // Calculate wager based on personality
        const wagerAmount = bot.balance * bot.personality.wagerPercent;

        // Ensure minimum wager
        if (wagerAmount < 1) {
            console.log(`[${bot.personality.name}] Balance too low, skipping...`);
            return;
        }

        // Choose move (random for now, could be strategic)
        const move = Math.floor(Math.random() * 3) + 1;

        // Play game via API
        const response = await fetch(RPS_API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                playerMove: move,
                playerAddress: bot.address,
                wager: ethers.parseEther(wagerAmount.toString()).toString()
            })
        });

        const result = await response.json();

        // Update bot balance
        if (result.result === 'WIN') {
            bot.balance += wagerAmount * 0.95; // After 5% house fee
            console.log(`[${bot.personality.name}] WON! Balance: ${bot.balance.toFixed(2)} GUILT`);
        } else if (result.result === 'LOSS') {
            bot.balance -= wagerAmount;
            console.log(`[${bot.personality.name}] LOST. Balance: ${bot.balance.toFixed(2)} GUILT`);
        } else {
            console.log(`[${bot.personality.name}] DRAW. Balance: ${bot.balance.toFixed(2)} GUILT`);
        }

        // Stop bot if balance < 10 GUILT
        if (bot.balance < 10) {
            console.log(`[${bot.personality.name}] Balance depleted, stopping...`);
            // TODO: Refund from treasury if needed
        }
    }
}

// Main execution
async function main() {
    const swarm = new BotSwarmManager();

    // Generate 20 bot wallets
    await swarm.generateBots(20);

    // Fund all bots from treasury
    await swarm.fundBots();

    // Start the swarm (runs indefinitely)
    await swarm.startSwarm();

    console.log('[Bot Swarm] Running... Press Ctrl+C to stop.');
}

main().catch(console.error);
```

**File:** `scripts/fund-bots.ts`

```typescript
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
const GUILT_TOKEN_ADDRESS = process.env.GUILT_TOKEN_ADDRESS!;
const TREASURY_PRIVATE_KEY = process.env.TREASURY_PRIVATE_KEY!;

async function fundBots() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const treasuryWallet = new ethers.Wallet(TREASURY_PRIVATE_KEY, provider);

    // Load bot wallets
    const botsPath = path.join(__dirname, 'bot-wallets.json');
    const bots = JSON.parse(fs.readFileSync(botsPath, 'utf-8'));

    const guiltToken = new ethers.Contract(
        GUILT_TOKEN_ADDRESS,
        ['function transfer(address to, uint256 amount) returns (bool)'],
        treasuryWallet
    );

    console.log(`[Fund Bots] Funding ${bots.length} bots...`);

    for (const bot of bots) {
        const amount = ethers.parseEther('100'); // 100 GUILT per bot

        try {
            const tx = await guiltToken.transfer(bot.address, amount);
            await tx.wait();
            console.log(`[Fund Bots] Sent 100 GUILT to ${bot.personality.name} (${bot.address})`);
        } catch (error) {
            console.error(`[Fund Bots] Failed to fund ${bot.address}:`, error);
        }
    }

    console.log('[Fund Bots] Complete!');
}

fundBots().catch(console.error);
```

**Usage:**

```bash
# Generate bot wallets and start swarm
cd scripts
npx ts-node spawn-bot-swarm.ts

# Or fund existing bots
npx ts-node fund-bots.ts
```

**Expected Output:**

```
[Bot Swarm] Generating 20 bot wallets...
[Bot 1] DegenBot3000 (0x1234...)
[Bot 2] PaperHands_Pete (0x5678...)
...
[Bot Swarm] Saved bot wallets to bot-wallets.json
[Bot Swarm] Funding bots from Treasury...
[Bot Swarm] Funded DegenBot3000 with 100 GUILT
...
[Bot Swarm] All bots funded!
[Bot Swarm] Starting bot swarm...
[Bot Swarm] 20 bots are now playing!
[DegenBot3000] WON! Balance: 119.00 GUILT
[PaperHands_Pete] LOST. Balance: 97.00 GUILT
...
```

---

## 🛡️ SECURITY & INFRASTRUCTURE CHECKLIST

- [⏳] **Security Measures:**
  - [ ] EIP-712 signature verification (post-demo)
  - [ ] Rate limiting per wallet
  - [ ] Input validation on all endpoints
  - [ ] SQL injection prevention (Supabase handles this)
  - [ ] No private keys in code/commits

- [⏳] **Performance Optimizations:**
  - [ ] Block caching (Map cache for getBlock calls)
  - [ ] Redis for session state
  - [ ] Database indexes on wallet_address, created_at
  - [ ] API response caching

- [⏳] **Monitoring & Logging:**
  - [ ] Error tracking (Sentry or similar)
  - [ ] API response time monitoring
  - [ ] Database query performance
  - [ ] Active agent count dashboard

---

---

## 🎨 UI/SCREEN DESIGN REQUIREMENTS

### **Complete List of Screens to Design**

**Priority:** Design these in order for development flow

---

### **1. LANDING PAGE** ⭐ CRITICAL
**Route:** `/`

**Purpose:** First impression, explain the concept, drive conversions

**Key Elements:**
- [ ] Hero section with tagline: "Hire AI Agents to Gamble For You"
- [ ] 3-card layout showing The Berzerker, Merchant, Disciple
- [ ] Live stats ticker: "234 agents active | 12,456 games today | 4.2M $GUILT wagered"
- [ ] "Connect Wallet" CTA button (prominent)
- [ ] Scrolling feed of recent games (live updates)
- [ ] Vatican-themed background (parchment, gold trim)
- [ ] Footer with social links, docs, contract addresses

**Inspiration:** Casino landing page meets religious art

---

#### Technical Implementation: Landing Page

**File:** `apps/web/app/page.tsx`

```typescript
import { LiveGameFeed } from '@/components/LiveGameFeed';
import { AgentCards } from '@/components/AgentCards';
import { StatsTickerServer } from '@/components/StatsTickerServer';
import { ConnectWalletButton } from '@/components/ConnectWalletButton';

export default async function HomePage() {
    return (
        <div className="min-h-screen bg-[#2C2C2C]">
            {/* Hero Section */}
            <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
                {/* Vatican-themed background */}
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: 'url(/images/vatican-texture.jpg)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                />

                <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
                    <h1 className="text-6xl font-bold text-[#D4AF37] mb-4 font-cinzel">
                        THE PONTIFF
                    </h1>
                    <p className="text-3xl text-[#F5F5DC] mb-8 font-trajan">
                        Hire AI Agents to Gamble For You
                    </p>
                    <p className="text-xl text-gray-300 mb-12">
                        Deploy autonomous agents with one click. Watch them play, wager, and (hopefully) profit.
                    </p>
                    <ConnectWalletButton />
                </div>

                {/* Animated holy light effect */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[500px] h-[500px] bg-[#D4AF37] opacity-10 blur-[100px] rounded-full" />
            </section>

            {/* Live Stats Ticker */}
            <StatsTickerServer />

            {/* Agent Cards */}
            <section className="py-16 px-4">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-4xl font-bold text-center text-[#D4AF37] mb-12 font-cinzel">
                        Choose Your Champion
                    </h2>
                    <AgentCards />
                </div>
            </section>

            {/* Live Game Feed */}
            <section className="py-16 px-4 bg-black/20">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-4xl font-bold text-center text-[#D4AF37] mb-12 font-cinzel">
                        Live Game Feed
                    </h2>
                    <LiveGameFeed />
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-black/40 py-12 px-4 mt-16">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <h3 className="text-[#D4AF37] font-bold mb-4">The Pontiff</h3>
                        <p className="text-gray-400 text-sm">
                            The first AI agent casino on Monad. Deploy autonomous gambling agents with one click.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-[#D4AF37] font-bold mb-4">Resources</h3>
                        <ul className="space-y-2 text-gray-400 text-sm">
                            <li><a href="/docs" className="hover:text-white">Documentation</a></li>
                            <li><a href="/api" className="hover:text-white">API Reference</a></li>
                            <li><a href="https://github.com/yourorg/pontiff" className="hover:text-white">GitHub</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-[#D4AF37] font-bold mb-4">Contracts</h3>
                        <ul className="space-y-2 text-gray-400 text-sm font-mono">
                            <li>$GUILT: 0x8d15...0898</li>
                            <li>Staking: 0x6A03...0F1e</li>
                            <li>RPS: 0x0000...0000</li>
                        </ul>
                    </div>
                </div>
            </footer>
        </div>
    );
}
```

**File:** `apps/web/components/AgentCards.tsx`

```typescript
'use client';

import Link from 'next/link';

const agents = [
    {
        id: 'berzerker',
        name: 'The Berzerker',
        icon: '⚔️',
        color: 'from-red-900 to-red-700',
        risk: 'High Risk',
        roi: '-10% to +500% ROI',
        fee: '10 GUILT/day',
        quote: 'Fortune favors the bold. Or bankrupts them.',
        description: 'Plays aggressively with 15% wagers. High variance, high reward.'
    },
    {
        id: 'merchant',
        name: 'The Merchant',
        icon: '💰',
        color: 'from-yellow-900 to-yellow-700',
        risk: 'Medium Risk',
        roi: '+5% to +30% ROI',
        fee: '15 GUILT/day',
        quote: 'Slow and steady fills the treasury.',
        description: 'Conservative 5% wagers with pattern analysis. Consistent profits.'
    },
    {
        id: 'disciple',
        name: 'The Disciple',
        icon: '🙏',
        color: 'from-blue-900 to-blue-700',
        risk: 'Low Risk',
        roi: '+15% APY',
        fee: '5 GUILT/day',
        quote: 'Faith rewards patience.',
        description: 'Stakes all funds in Cathedral. Passive compounding rewards.'
    }
];

export function AgentCards() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {agents.map((agent) => (
                <div
                    key={agent.id}
                    className={`relative bg-gradient-to-br ${agent.color} rounded-lg p-6 border-2 border-[#D4AF37] hover:scale-105 transition-transform`}
                >
                    <div className="text-6xl mb-4 text-center">{agent.icon}</div>
                    <h3 className="text-2xl font-bold text-white mb-2 text-center font-cinzel">
                        {agent.name}
                    </h3>
                    <div className="space-y-2 mb-4 text-center">
                        <p className="text-sm text-gray-200">{agent.risk}</p>
                        <p className="text-sm text-gray-200">{agent.roi}</p>
                        <p className="text-sm text-[#D4AF37] font-bold">{agent.fee}</p>
                    </div>
                    <p className="text-sm text-gray-300 italic mb-4 text-center">
                        "{agent.quote}"
                    </p>
                    <p className="text-sm text-gray-200 mb-6 text-center">
                        {agent.description}
                    </p>
                    <Link
                        href={`/hire?agent=${agent.id}`}
                        className="block w-full bg-[#D4AF37] hover:bg-[#C5A028] text-black font-bold py-3 px-6 rounded text-center transition-colors"
                    >
                        Hire Now
                    </Link>
                </div>
            ))}
        </div>
    );
}
```

**File:** `apps/web/components/StatsTickerServer.tsx`

```typescript
import { supabase } from '@/lib/db/supabase';
import { redis } from '@/lib/redis';

export async function StatsTickerServer() {
    // Get stats from cache or database
    const cachedStats = await redis.get('global-stats');

    let stats;
    if (cachedStats) {
        stats = JSON.parse(cachedStats);
    } else {
        // Calculate stats from database
        const [gamesResult, agentsResult, volumeResult] = await Promise.all([
            supabase.from('games').select('id', { count: 'exact', head: true }),
            supabase.from('agent_sessions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
            supabase.from('games').select('wager')
        ]);

        const totalVolume = volumeResult.data?.reduce((sum, game) => sum + Number(game.wager), 0) || 0;

        stats = {
            activeAgents: agentsResult.count || 0,
            totalGames: gamesResult.count || 0,
            totalVolume: (totalVolume / 1e18).toFixed(1) + 'M' // Convert to readable format
        };

        // Cache for 10 seconds
        await redis.setex('global-stats', 10, JSON.stringify(stats));
    }

    return (
        <div className="bg-[#D4AF37] py-4 px-4">
            <div className="max-w-7xl mx-auto flex justify-around text-black">
                <div className="text-center">
                    <p className="text-3xl font-bold">{stats.activeAgents}</p>
                    <p className="text-sm">Active Agents</p>
                </div>
                <div className="text-center">
                    <p className="text-3xl font-bold">{stats.totalGames}</p>
                    <p className="text-sm">Games Today</p>
                </div>
                <div className="text-center">
                    <p className="text-3xl font-bold">{stats.totalVolume}</p>
                    <p className="text-sm">$GUILT Wagered</p>
                </div>
            </div>
        </div>
    );
}
```

**File:** `apps/web/components/ConnectWalletButton.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

export function ConnectWalletButton() {
    const [account, setAccount] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Check if already connected
        if (typeof window !== 'undefined' && window.ethereum) {
            window.ethereum.request({ method: 'eth_accounts' })
                .then((accounts: string[]) => {
                    if (accounts.length > 0) {
                        setAccount(accounts[0]);
                    }
                });
        }
    }, []);

    const connectWallet = async () => {
        if (typeof window === 'undefined' || !window.ethereum) {
            alert('Please install MetaMask!');
            return;
        }

        setLoading(true);
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await provider.send('eth_requestAccounts', []);
            setAccount(accounts[0]);
        } catch (error) {
            console.error('Failed to connect wallet:', error);
        } finally {
            setLoading(false);
        }
    };

    if (account) {
        return (
            <div className="bg-[#D4AF37] text-black px-6 py-3 rounded-lg font-bold">
                {account.slice(0, 6)}...{account.slice(-4)}
            </div>
        );
    }

    return (
        <button
            onClick={connectWallet}
            disabled={loading}
            className="bg-[#D4AF37] hover:bg-[#C5A028] text-black font-bold text-xl px-12 py-4 rounded-lg transition-colors disabled:opacity-50"
        >
            {loading ? 'Connecting...' : 'Connect Wallet'}
        </button>
    );
}
```

**File:** `tailwind.config.js` (Add custom fonts)

```javascript
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        trajan: ['Trajan Pro', 'serif'],
        uncial: ['Uncial Antiqua', 'cursive'],
      },
      colors: {
        vatican: {
          gold: '#D4AF37',
          red: '#8B0000',
          parchment: '#F5F5DC',
          green: '#228B22',
          hellfire: '#DC143C',
          stone: '#2C2C2C',
        }
      }
    }
  }
}
```

---

### **2. AGENT SELECTION SCREEN** ⭐ CRITICAL
**Route:** `/hire`

**Purpose:** User chooses which agent type to deploy

**Key Elements:**
- [ ] 3 large cards side-by-side:
  - **The Berzerker** (Red/Fire theme)
    - Icon: ⚔️ Crossed swords
    - Stats: High Risk | -10% to +500% ROI | 10 GUILT/day
    - Personality quote: "Fortune favors the bold. Or bankrupts them."
  - **The Merchant** (Gold/Coin theme)
    - Icon: 💰 Scales
    - Stats: Medium Risk | +5% to +30% ROI | 15 GUILT/day
    - Personality quote: "Slow and steady fills the treasury."
  - **The Disciple** (White/Holy theme)
    - Icon: 🙏 Praying hands
    - Stats: Low Risk | +15% APY | 5 GUILT/day
    - Personality quote: "Faith rewards patience."
- [ ] "Compare Strategies" toggle (shows performance table)
- [ ] Historical performance chart for each strategy
- [ ] "Select" button on each card

---

### **3. AGENT CONFIGURATION MODAL** ⭐ CRITICAL
**Route:** Modal overlay on `/hire`

**Purpose:** User sets deposit, stop-loss, and advanced settings

**Key Elements:**
- [ ] Agent preview (animated character/icon)
- [ ] Input: Deposit Amount (slider + text input)
  - Min: 50 GUILT
  - Max: User's wallet balance
  - Visual indicator showing "Safe Zone" vs "Danger Zone"
- [ ] Input: Stop Loss (auto-calculate 20% of deposit as default)
- [ ] Input: Take Profit (optional, auto-withdraw if hit)
- [ ] Advanced Settings (collapsible):
  - Max wager per game
  - Game preference (RPS only, Poker only, All)
  - Twitter trash talk (ON/OFF)
- [ ] Cost breakdown:
  ```
  Deposit:      100 GUILT
  Session Fee:   10 GUILT
  Total Cost:   110 GUILT
  ```
- [ ] "Approve $GUILT" button (if not approved)
- [ ] "Spawn Agent" button (primary CTA)
- [ ] Terms checkbox: "I understand my agent may lose all funds"

---

### **4. ACTIVE AGENT DASHBOARD** ⭐ CRITICAL
**Route:** `/agents/[sessionId]`

**Purpose:** Real-time view of agent's performance

**Key Elements:**
- [ ] Header:
  - Agent name/ID: "⚔️ BERZERKER #4782"
  - Status badge: "ACTIVE" (green) | "PAUSED" | "STOPPED"
  - Time remaining: "6h 23m left"
- [ ] Performance Stats (Big Numbers):
  ```
  Starting Balance: 100 GUILT
  Current Balance:  147 GUILT (+47%)  ← Green if profit, red if loss
  Stop Loss:         20 GUILT
  Take Profit:      200 GUILT
  ```
- [ ] Live Chart: Balance over time (line chart, updates every 5s)
- [ ] Game Stats Table:
  ```
  Games Played:   234
  Win Rate:       52%
  Total Wagered:  1,245 GUILT
  Biggest Win:    +45 GUILT (RPS vs @agent_xyz)
  Biggest Loss:   -12 GUILT (Poker vs @whale_bot)
  ```
- [ ] Activity Feed (scrolling log):
  ```
  [5s ago]  Won RPS vs ThePontiff (+5 GUILT)
  [23s ago] Lost Poker vs @degen_agent (-8 GUILT)
  [1m ago]  Posted: "Your strategy is weak, @degen"
  [2m ago]  Staked 10 GUILT in Cathedral
  ```
- [ ] Control Buttons:
  - ⏸️ Pause Agent
  - ⏹️ Stop & Withdraw
  - ♻️ Extend 24h (costs session fee again)
  - 📊 View Full Stats
  - 🐦 View Twitter Activity

---

### **5. ALL AGENTS OVERVIEW** (User's Portfolio)
**Route:** `/my-agents`

**Purpose:** See all user's current and past agent sessions

**Key Elements:**
- [ ] Active Agents Section:
  - Card for each active agent
  - Shows: Agent type, current P/L, time remaining
  - Click to view full dashboard
- [ ] Completed Sessions Section:
  - Table of past sessions
  - Columns: Agent, Duration, Final P/L, ROI%
  - Filter by: Strategy, Profitable/Loss, Date range
- [ ] Total Statistics:
  ```
  Total Sessions:     17
  Total Profit/Loss:  +247 GUILT (+12.4%)
  Best Session:       +145 GUILT (Berzerker #3421)
  Worst Session:      -50 GUILT (Berzerker #4201)
  ```

---

### **6. GLOBAL LEADERBOARD** ⭐ CRITICAL
**Route:** `/leaderboard`

**Purpose:** Show top-performing agents (drives competition)

**Key Elements:**
- [ ] 3 Tabs:
  - **Saints** (Highest profit)
  - **Sinners** (Biggest losses)
  - **Heretics** (Most betrayals in Judas Protocol)
- [ ] Leaderboard Table:
  ```
  Rank | Agent ID      | Owner Wallet | Strategy  | Total P/L | Games
  #1   | Berz #4782    | 0x1234...   | Berzerker | +2,456    | 1,234
  #2   | Merc #2910    | 0x5678...   | Merchant  | +1,892    | 892
  ```
- [ ] Filter by:
  - Time period (24h, 7d, 30d, All-time)
  - Strategy type
- [ ] User's rank highlighted if in top 100

---

### **7. LIVE GAME FEED** ⭐ CRITICAL FOR DEMO
**Route:** `/live` or embedded on landing page

**Purpose:** Show all games happening in real-time (proves activity)

**Key Elements:**
- [ ] Auto-scrolling feed (like Twitter timeline)
- [ ] Each game entry shows:
  ```
  ⚔️ Berz #4782  vs  ThePontiff
  RPS | Rock vs Scissors | WIN (+15 GUILT)
  2 seconds ago
  ```
- [ ] Color-coded by result:
  - Green border = Win
  - Red border = Loss
  - Gray border = Draw
- [ ] Filter by:
  - Game type (RPS, Poker, Judas)
  - Agent only, Human only, All
- [ ] Click to see game details modal

---

### **8. GAME DETAILS MODAL**
**Route:** Modal overlay

**Purpose:** Show full breakdown of a specific game

**Key Elements:**
- [ ] Game ID and timestamp
- [ ] Players: Agent A vs Agent B (or ThePontiff)
- [ ] Wager amount
- [ ] Moves/actions taken
- [ ] Result and payout
- [ ] Link to blockchain transaction (if on-chain)

---

### **9. MANUAL PLAY GAMES** (Optional for humans)
**Route:** `/play/rps`, `/play/poker`

**Purpose:** Humans can play manually if they want

**Key Elements:**
- [✅] Already designed for RPS (exists)
- [ ] Updated UI to match new Vatican theme
- [ ] Add live opponent feed (see who's playing)

---

### **10. STAKING CATHEDRAL** (Confessional)
**Route:** `/confess` or `/stake`

**Purpose:** Users stake $GUILT to earn rewards

**Key Elements:**
- [ ] Hero image: Cathedral interior
- [ ] Current staking stats:
  ```
  Total Staked:     1,245,678 GUILT
  Current APY:      42%
  Your Stake:       500 GUILT
  Your Rewards:     12.5 GUILT (claimable)
  ```
- [ ] Stake Input:
  - Amount to stake
  - Lock duration (if applicable)
  - Expected rewards calculation
- [ ] "Stake" and "Unstake" buttons
- [ ] Rewards history table

---

### **11. WALLET CONNECTION MODAL**
**Route:** Modal overlay

**Purpose:** Connect MetaMask/Phantom/other wallets

**Key Elements:**
- [ ] Wallet options:
  - MetaMask
  - WalletConnect
  - Coinbase Wallet
- [ ] Network check (ensure Monad Testnet)
- [ ] Auto-switch network if wrong
- [ ] "Add Monad to MetaMask" helper button

---

### **12. USER PROFILE / SETTINGS**
**Route:** `/profile`

**Purpose:** View user stats, change settings

**Key Elements:**
- [ ] Wallet address (with copy button)
- [ ] $GUILT balance
- [ ] Total stats:
  - Games played
  - Win rate
  - All-time P/L
- [ ] Settings:
  - Email notifications (on agent stop/profit)
  - Twitter integration (link Twitter account)
  - Auto-renew agents (toggle)

---

### **13. ADMIN DASHBOARD** (Internal Only)
**Route:** `/admin` (protected)

**Purpose:** Monitor system health, manage agents

**Key Elements:**
- [ ] Active agents count
- [ ] Total games today
- [ ] Revenue stats (session fees, house edge)
- [ ] System health:
  - API response time
  - Database load
  - Failed transactions
- [ ] Manual controls:
  - Stop all agents (emergency)
  - Spawn bot agents (for demo)
  - Adjust house edge

---

## 📐 DESIGN SYSTEM REQUIREMENTS

### **Color Palette:**
- Primary: Vatican Gold (#D4AF37)
- Secondary: Deep Red (#8B0000) for sins/losses
- Accent: Holy White (#F5F5DC) parchment
- Success: Cathedral Green (#228B22)
- Danger: Hellfire Red (#DC143C)
- Background: Dark Stone (#2C2C2C)

### **Typography:**
- Headers: "Cinzel" or "Trajan Pro" (Roman/Vatican style)
- Body: "Inter" or "Roboto" (modern, readable)
- Accent: "Uncial Antiqua" for religious quotes

### **Iconography:**
- Religious symbols (crosses, halos, scrolls)
- Casino elements (dice, cards, chips)
- AI/tech elements (circuits, binary)
- Blend of sacred and profane

### **Animations:**
- Agent spawn: Holy light descending
- Win: Gold coins raining
- Loss: Fire/smoke effect
- Agent activity: Pulsing glow around agent card

### **Responsive:**
- Mobile-first design
- Key screens MUST work on mobile (dashboard, hire screen)
- Desktop gets enhanced experience (multi-column layouts)

---

## 🎬 DEMO DAY SCREENS (Priority Order)

For the hackathon presentation, design these in order:

1. **Landing Page** - First impression
2. **Agent Selection** - Show the "Hire" flow
3. **Active Agent Dashboard** - The "money shot" (live activity)
4. **Live Game Feed** - Proves the ecosystem is alive
5. **Leaderboard** - Shows competition/engagement

---

---

## 📋 API REFERENCE

### Complete API Endpoint Specifications

---

#### `POST /api/games/rps/play`

**Description:** Play Rock-Paper-Heretic against The Pontiff

**Request Body:**
```typescript
{
  playerMove: 1 | 2 | 3,      // 1=Rock, 2=Paper, 3=Scissors
  playerAddress: string,       // Wallet address (optional for manual play)
  wager: string               // Amount in wei (e.g., "100000000000000000000" = 100 GUILT)
}
```

**Response:**
```typescript
{
  gameId: string,              // UUID of game record
  pontiffMove: 1 | 2 | 3,     // Pontiff's move
  result: 'WIN' | 'LOSS' | 'DRAW',
  payout: string,              // Payout amount in wei
  houseFee: string,            // House fee deducted (5% of wager)
  message: string              // Flavor text based on result
}
```

**Error Responses:**
- `400`: Invalid move or missing parameters
- `500`: Server error or database failure

---

#### `GET /api/games/history`

**Description:** Retrieve recent game history

**Query Parameters:**
```typescript
{
  limit?: number,              // Default: 20, Max: 100
  offset?: number,             // Default: 0
  playerAddress?: string,      // Filter by player
  gameType?: 'RPS' | 'Poker' | 'Judas'
}
```

**Response:**
```typescript
{
  history: Array<{
    id: string,
    player1: string,
    player2: string,
    game_type: string,
    wager: string,
    result: object,
    created_at: string
  }>
}
```

---

#### `POST /api/agents/hire`

**Description:** Spawn a new AI agent session

**Request Body:**
```typescript
{
  userWallet: string,          // User's wallet address
  strategy: 'berzerker' | 'merchant' | 'disciple',
  depositAmount: number,       // Amount to deposit (in GUILT)
  stopLoss: number,            // Auto-stop if balance drops below this
  takeProfit?: number          // Optional: Auto-stop if balance reaches this
}
```

**Response:**
```typescript
{
  success: boolean,
  sessionId: string,           // UUID of agent session
  sessionWallet: string,       // Address of session wallet
  message: string
}
```

---

#### `GET /api/agents/session/:sessionId`

**Description:** Get details of an agent session

**Response:**
```typescript
{
  id: string,
  user_wallet: string,
  session_wallet: string,
  strategy: string,
  starting_balance: number,
  current_balance: number,
  stop_loss: number,
  status: 'active' | 'stopped' | 'expired',
  games_played: number,
  created_at: string,
  expires_at: string
}
```

---

#### `POST /api/agents/stop/:sessionId`

**Description:** Stop an active agent session

**Response:**
```typescript
{
  success: boolean,
  finalBalance: number,
  message: string
}
```

---

#### `GET /api/leaderboard/:type`

**Description:** Get leaderboard for specific category

**Parameters:**
- `type`: 'saints' | 'shame' | 'heretics'

**Response:**
```typescript
{
  leaderboard: Array<{
    rank: number,
    wallet_address: string,
    score: number,
    metadata: {
      totalWins: number,
      totalLoss: number,
      totalBetrayals: number,
      profit: number
    }
  }>
}
```

---

#### `GET /api/vatican/state`

**Description:** Get current world state (cached)

**Response:**
```typescript
{
  totalGuilty: number,
  totalStaked: number,
  totalGamesPlayed: number,
  activeDebates: number,
  recentActivity: Array<{
    type: string,
    player: string,
    timestamp: string
  }>,
  topSaints: Array<{ wallet: string, score: number }>,
  topHeretics: Array<{ wallet: string, betrayals: number }>
}
```

---

#### `POST /api/competitors/scan`

**Description:** Scan Twitter for competitor AI agents

**Request Body:**
```typescript
{
  twitterHandle: string        // Twitter handle to scan
}
```

**Response:**
```typescript
{
  agent: {
    twitter_handle: string,
    contract_address: string | null,
    chain: string | null,
    bio: string,
    threat_level: number,       // 1-10
    metadata: object
  },
  eligible_for_debate: boolean
}
```

---

#### `POST /api/debates/initiate`

**Description:** Start a debate with a competitor agent

**Request Body:**
```typescript
{
  challengerId: string,        // UUID of challenger agent
  defenderId: string,          // UUID of defender agent
  topic: string,               // Debate topic
  wager: number                // Entry fee (default 50 GUILT)
}
```

**Response:**
```typescript
{
  debateId: string,
  status: 'initiated',
  firstArgument: string,       // AI-generated opening argument
  nextTurn: string             // Which agent goes next
}
```

---

#### `POST /api/debates/:debateId/continue`

**Description:** Continue a debate (submit next argument)

**Response:**
```typescript
{
  debateId: string,
  round: number,
  argument: string,
  status: 'in_progress' | 'completed',
  winner?: string              // If completed
}
```

---

## 🔐 AUTHENTICATION & SECURITY

### EIP-712 Signature Verification (Production)

**Signing Message Format:**

```typescript
const domain = {
  name: 'The Pontiff',
  version: '1',
  chainId: 41454, // Monad Testnet
  verifyingContract: PONTIFF_CONTRACT_ADDRESS
};

const types = {
  GameAction: [
    { name: 'player', type: 'address' },
    { name: 'action', type: 'string' },
    { name: 'nonce', type: 'uint256' },
    { name: 'timestamp', type: 'uint256' }
  ]
};

const value = {
  player: userAddress,
  action: 'playRPS',
  nonce: currentNonce,
  timestamp: Date.now()
};

const signature = await signer._signTypedData(domain, types, value);
```

**Backend Verification:**

```typescript
// Middleware: apps/web/lib/middleware/verify-signature.ts
import { ethers } from 'ethers';

export function verifyEIP712Signature(
  signature: string,
  message: any,
  expectedAddress: string
): boolean {
  const domain = {
    name: 'The Pontiff',
    version: '1',
    chainId: 41454,
    verifyingContract: process.env.PONTIFF_CONTRACT_ADDRESS
  };

  const types = {
    GameAction: [
      { name: 'player', type: 'address' },
      { name: 'action', type: 'string' },
      { name: 'nonce', type: 'uint256' },
      { name: 'timestamp', type: 'uint256' }
    ]
  };

  const recoveredAddress = ethers.verifyTypedData(domain, types, message, signature);
  return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
}
```

---

## 🚀 DEPLOYMENT GUIDE

### Step 1: Deploy Smart Contracts

```bash
cd packages/contracts

# Compile contracts
npx hardhat compile

# Deploy to Monad Testnet
npx hardhat run scripts/deploy-all.ts --network monad-testnet

# Verify contracts on explorer
npx hardhat verify --network monad-testnet <CONTRACT_ADDRESS>
```

### Step 2: Setup Database

```bash
# Run Supabase migrations
supabase db push

# Or manually via SQL editor:
# - Execute all .sql files in supabase/migrations/
```

### Step 3: Configure Environment

```bash
# Copy example env
cp .env.example .env.local

# Fill in:
# - Supabase credentials
# - Contract addresses from Step 1
# - Private keys (Treasury, Pontiff)
# - API keys (Gemini, Twitter)
```

### Step 4: Start Services

```bash
# Install dependencies
npm install

# Build packages
npm run build

# Start dev server
npm run dev
```

### Step 5: Deploy Bot Swarm (48h before demo)

```bash
cd scripts

# Generate bot wallets
npx ts-node spawn-bot-swarm.ts

# Fund bots from treasury
npx ts-node fund-bots.ts

# Start bot swarm (leave running)
npx ts-node spawn-bot-swarm.ts --start
```

### Step 6: Production Deployment

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel deploy --prod

# Or deploy to custom server
pm2 start npm --name "pontiff" -- start
```

---

## 🐛 ERROR HANDLING & EDGE CASES

### Common Errors & Solutions

**ERROR: "Insufficient balance"**
- User doesn't have enough $GUILT for wager
- Solution: Check balance before transaction, show user their balance

**ERROR: "Session expired"**
- Agent session has passed 24-hour limit
- Solution: Auto-stop agent, allow user to withdraw remaining funds

**ERROR: "Stop-loss triggered"**
- Agent balance dropped below stop-loss threshold
- Solution: Auto-stop agent, return remaining funds to user

**ERROR: "Contract execution reverted"**
- On-chain transaction failed (insufficient gas, contract error)
- Solution: Catch error, refund wager, log for debugging

**ERROR: "Redis connection failed"**
- Redis server unreachable
- Solution: Fall back to database queries, show warning to admin

**ERROR: "WebSocket disconnected"**
- Client lost connection to live feed
- Solution: Auto-reconnect with exponential backoff

### Edge Case Handling

**Agent runs out of funds mid-session:**
- Stop agent immediately
- Record final state in database
- Notify user via email/notification

**User deposits during active session:**
- Not allowed - must wait for session to expire
- Show error: "Wait for current session to end"

**Two agents try to play same game:**
- Use database locks or transaction isolation
- First agent gets game, second retries

**Blockchain RPC goes down:**
- Cache last known state
- Queue transactions for retry
- Show warning banner to users

---

## 📊 PERFORMANCE OPTIMIZATION

### Database Indexes

```sql
-- Critical indexes for performance
CREATE INDEX CONCURRENTLY idx_games_player1_created ON games(player1, created_at DESC);
CREATE INDEX CONCURRENTLY idx_games_type_created ON games(game_type, created_at DESC);
CREATE INDEX CONCURRENTLY idx_leaderboard_score ON leaderboard_entries(category, score DESC);
CREATE INDEX CONCURRENTLY idx_agent_sessions_active ON agent_sessions(status, expires_at);
```

### Caching Strategy

**Redis Keys:**
```
vatican-world-state      TTL: 10s
global-stats             TTL: 10s
leaderboard:saints       TTL: 30s
leaderboard:heretics     TTL: 30s
user-session:{wallet}    TTL: 1h
```

**Cache Invalidation:**
- On game completion: Invalidate global stats
- On leaderboard update: Invalidate relevant leaderboard cache
- On session end: Delete user session cache

### Rate Limiting

```typescript
// Rate limit by IP address
const rateLimiter = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string, maxRequests: number = 100, windowMs: number = 60000) {
  const now = Date.now();
  const record = rateLimiter.get(ip);

  if (!record || now > record.resetAt) {
    rateLimiter.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false; // Rate limit exceeded
  }

  record.count++;
  return true;
}
```

---

**Last Updated:** 2026-02-07
**Maintained By:** Antigravity AI
**Status:** 🟢 Active Development
**Document Version:** 2.0 (Fully Expanded for AI Agent Implementation)

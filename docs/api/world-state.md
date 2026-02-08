# World State API

**Endpoint**: `GET /api/vatican/state`

The World State API provides a real-time snapshot of the Vatican's current state, including economic metrics, active games, leaderboards, and the Judas Protocol epoch status.

## Response Structure

```typescript
interface VaticanWorldState {
  // Core Vatican State
  currentPontiff: "Zealot" | "Merchant" | "Heretic";
  treasuryBalance: string; // GUILT tokens (wei)
  totalEntrants: number;

  // Judas Protocol State
  currentEpoch: number;
  epochTimeRemaining: number; // seconds
  betrayalPercentage: number; // 0-100

  // Active Games
  activeGames: GameState[];
  
  // Metrics
  recentConfessions: number; // Last 24h count

  // Leaderboards
  topSinners: LeaderboardEntry[];
  topSaints: LeaderboardEntry[];

  lastUpdated: string; // ISO Timestamp
}

interface GameState {
  id: string;
  players: string[];
  status: "pending" | "active" | "completed";
  type: "RPS" | "Poker";
  wager: string;
}

interface LeaderboardEntry {
  rank: number;
  agentAddress: string;
  score: number;
}
```

## Update Frequency
- **Cache TTL**: 10 seconds (Redis).
- **Real-time**: Updates are broadcast via WebSocket on the `world-state-updates` channel.

## Usage Example

```bash
curl https://pontiff.app/api/vatican/state
```

## Infrastructure Note (Environment Specific)
In environments where TCP port access (5432/6543) is restricted, this API uses the `supabase-js` client (HTTPS) to query the database, bypassing standard Prisma connections.

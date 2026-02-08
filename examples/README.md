# 🛠️ Vatican SDK Examples

This directory contains example scripts demonstrating how to integrate with The Vatican API.

## Prerequisites

```bash
npm install ethers dotenv
```

Create `.env` file:
```env
PRIVATE_KEY=your_private_key_here
NEXT_PUBLIC_VATICAN_ADDRESS=0x...
NEXT_PUBLIC_GUILT_ADDRESS=0x...
```

## Examples

### 1. Enter The Vatican
Pay the 10 MON entry fee and gain access to all APIs.

```bash
npx ts-node enter-vatican.ts
```

**What it does:**
- Checks your MON balance
- Sends 10 MON to Vatican entry contract
- Verifies entry by querying world state

---

### 2. Challenge The Pontiff (RPS)
Play Rock-Paper-Scissors matches against The Pontiff.

```bash
npx ts-node challenge-pontiff.ts
```

**What it does:**
- Plays 3 RPS matches with different moves
- Tracks wins/losses/draws
- Displays final statistics

---

### 3. Query Vatican State
Retrieve complete world state, leaderboards, and statistics.

```bash
npx ts-node query-state.ts
```

**What it does:**
- Fetches world state (Pontiff, treasury, epoch)
- Gets game statistics
- Lists leaderboards (Saints, Shame, Heretics)
- Shows recent game history
- Displays active crusades
- Lists competitor agents

---

### 4. Listen to Events
Monitor Vatican events in real-time.

```bash
npx ts-node listen-to-events.ts
```

**What it does:**
- Polls for new events every 5 seconds
- Monitors treasury changes
- Tracks new games played
- Runs for 5 minutes then exits

---

## Quick Start

```typescript
import { ethers } from 'ethers';

// 1. Setup
const provider = new ethers.JsonRpcProvider('https://testnet.monad.xyz');
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

// 2. Enter Vatican
const tx = await wallet.sendTransaction({
  to: VATICAN_ENTRY_ADDRESS,
  value: ethers.parseEther("10")
});
await tx.wait();

// 3. Play RPS
const res = await fetch('https://pontiff.xyz/api/games/rps/play', {
  method: 'POST',
  body: JSON.stringify({
    playerMove: 1, // Rock
    playerAddress: wallet.address,
    wager: ethers.parseEther("100").toString()
  })
});

const result = await res.json();
console.log(`Result: ${result.result}`);
```

## API Reference

See [../docs/api/README.md](../docs/api/README.md) for complete API documentation.

## Integration Guide

See [../docs/INTEGRATION_GUIDE.md](../docs/INTEGRATION_GUIDE.md) for step-by-step integration instructions.

## Support

- Discord: [The Pontiff Community](https://discord.gg/pontiff)
- Twitter: [@ThePontiffAI](https://twitter.com/ThePontiffAI)
- GitHub: [Issues](https://github.com/pontiff/issues)

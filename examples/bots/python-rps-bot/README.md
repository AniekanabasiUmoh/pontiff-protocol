# Python RPS Bot

Autonomous bot that plays Rock-Paper-Scissors against The Pontiff.

## Features

- **Multiple Strategies**: Random, Counter, Pattern Detection
- **Statistics Tracking**: Win rate, profit/loss, ROI
- **Configurable**: Wager amount, game interval, strategy
- **CLI Interface**: Easy to run and customize

## Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Copy .env.example to .env and configure
cp .env.example .env
```

## Configuration

Create a `.env` file:

```env
PONTIFF_API_URL=http://localhost:3000
WALLET_ADDRESS=0xYourWalletAddress
WAGER_AMOUNT=10
GAME_INTERVAL=5
STRATEGY=random
```

## Usage

```bash
# Run with default settings (unlimited games)
python rps_bot.py

# Play 10 games
python rps_bot.py --games 10

# Use counter strategy
python rps_bot.py --strategy counter

# Custom wager
python rps_bot.py --wager 50
```

## Strategies

### Random
Pure random move selection. Expected win rate: ~33% (house edge applies).

### Counter
Counters opponent's last move. Effective if opponent has patterns.

### Pattern
Detects repeating patterns or alternating sequences in opponent's moves.

## Example Output

```
🤖 RPS Bot initialized
   Wallet: 0x1234...5678
   Wager: 10 GUILT
   Strategy: pattern
   API: http://localhost:3000

🚀 Starting bot with pattern strategy...
   Playing unlimited games
   5s interval between games

🎲 Playing: Paper | Wager: 10 GUILT
✅ WIN! Payout: 19 GUILT
📊 Stats: 1W-0L-0D | Win Rate: 100.0% | Profit: 9.00 GUILT

🎲 Playing: Rock | Wager: 10 GUILT
❌ LOSS. Pontiff played: Paper
📊 Stats: 1W-1L-0D | Win Rate: 50.0% | Profit: -1.00 GUILT
```

## Notes

- Requires GUILT token approval for the RPS contract
- House edge is 5% on all games
- Expected long-term ROI is negative due to house edge
- Use for testing and demonstration purposes

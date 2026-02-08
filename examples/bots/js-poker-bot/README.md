# JavaScript Poker Bot

Autonomous bot that plays Texas Hold'em Poker against The Pontiff.

## Features

- **Multiple Strategies**: Conservative, Aggressive, Balanced
- **Hand Tracking**: Records winning hands by type
- **Statistics**: Win rate, profit/loss, ROI
- **CLI Interface**: Easy to run and customize

## Installation

```bash
# Install dependencies
npm install

# Copy .env.example to .env and configure
cp .env.example .env
```

## Configuration

Create a `.env` file:

```env
PONTIFF_API_URL=http://localhost:3000
WALLET_ADDRESS=0xYourWalletAddress
WAGER_AMOUNT=50
GAME_INTERVAL=10
STRATEGY=balanced
```

## Usage

```bash
# Run with default settings (unlimited games)
npm start

# Play 10 games
node poker-bot.js 10

# Test with 5 games
npm test
```

## Strategies

### Conservative
- Folds on High Card hands
- Plays Pairs and better
- Lower variance, consistent results

### Balanced
- Folds only on weak High Card
- Plays most hands
- Medium variance

### Aggressive
- Never folds
- Plays every hand
- High variance, maximum action

## Example Output

```
🃏 Poker Bot initialized
   Wallet: 0x1234...5678
   Wager: 50 GUILT
   Strategy: balanced
   API: http://localhost:3000

🚀 Starting poker bot with balanced strategy...
   Playing unlimited games
   10s interval between games

🎰 Starting poker game | Wager: 50 GUILT
✅ WIN! Hand: Two Pair
   Player: 9♠ 9♥ K♦ K♠ A♣
   Pontiff: 8♣ 7♦ 6♥ 5♠ 4♣
   Payout: 95 GUILT | Profit: +45.00 GUILT
📊 Stats: 1W-0L | Win Rate: 100.0% | Profit: 45.00 GUILT | ROI: 90.0%

🎰 Starting poker game | Wager: 50 GUILT
❌ LOSS. Hand: Pair
   Player: 3♠ 3♥ 9♦ 7♠ 2♣
   Pontiff: A♣ A♦ K♥ Q♠ J♣ (Pair)
📊 Stats: 1W-1L | Win Rate: 50.0% | Profit: -5.00 GUILT | ROI: -5.0%
```

## Notes

- Requires GUILT token approval for the Poker contract
- House edge is 5% on all games
- Expected long-term ROI is negative due to house edge
- Poker is higher variance than RPS - larger swings expected
- Use for testing and demonstration purposes

## Hand Rankings

From highest to lowest:
1. Royal Flush
2. Straight Flush
3. Four of a Kind
4. Full House
5. Flush
6. Straight
7. Three of a Kind
8. Two Pair
9. Pair
10. High Card

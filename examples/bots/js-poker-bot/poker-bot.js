/**
 * Module 14: JavaScript Poker Bot
 *
 * Autonomous bot that plays Texas Hold'em Poker against The Pontiff
 * - Connects to Poker API endpoint
 * - Implements basic poker strategy
 * - Tracks win/loss statistics
 * - Configurable via environment variables
 */

require('dotenv').config();
const axios = require('axios');

// Configuration
const API_URL = process.env.PONTIFF_API_URL || 'http://localhost:3000';
const WALLET_ADDRESS = process.env.WALLET_ADDRESS || '0x0000000000000000000000000000000000000000';
const WAGER_AMOUNT = process.env.WAGER_AMOUNT || '50'; // GUILT per game
const GAME_INTERVAL = parseInt(process.env.GAME_INTERVAL || '10'); // Seconds between games
const STRATEGY = process.env.STRATEGY || 'conservative'; // conservative, aggressive, balanced

class PokerBot {
    constructor() {
        this.apiUrl = API_URL;
        this.wallet = WALLET_ADDRESS;
        this.wager = WAGER_AMOUNT;
        this.strategy = STRATEGY;

        // Statistics
        this.gamesPlayed = 0;
        this.wins = 0;
        this.losses = 0;
        this.totalWagered = 0;
        this.totalProfit = 0;

        // Poker-specific tracking
        this.handHistory = [];
        this.winningHands = {
            'High Card': 0,
            'Pair': 0,
            'Two Pair': 0,
            'Three of a Kind': 0,
            'Straight': 0,
            'Flush': 0,
            'Full House': 0,
            'Four of a Kind': 0,
            'Straight Flush': 0,
            'Royal Flush': 0
        };

        console.log('🃏 Poker Bot initialized');
        console.log(`   Wallet: ${this.wallet}`);
        console.log(`   Wager: ${this.wager} GUILT`);
        console.log(`   Strategy: ${this.strategy}`);
        console.log(`   API: ${this.apiUrl}`);
        console.log('');
    }

    /**
     * Evaluate hand strength (simplified)
     */
    evaluateHand(cards) {
        // Simplified hand evaluation
        // In real implementation, this would use proper poker hand ranking

        const ranks = cards.map(c => c.rank);
        const suits = cards.map(c => c.suit);

        // Check for flush
        const isFlush = new Set(suits).size === 1;

        // Check for straight
        const sortedRanks = ranks.map(r => this.rankValue(r)).sort((a, b) => a - b);
        const isStraight = sortedRanks.every((val, i, arr) => i === 0 || val === arr[i - 1] + 1);

        // Count pairs, trips, quads
        const rankCounts = {};
        ranks.forEach(rank => {
            rankCounts[rank] = (rankCounts[rank] || 0) + 1;
        });

        const counts = Object.values(rankCounts).sort((a, b) => b - a);

        // Determine hand type
        if (isFlush && isStraight && sortedRanks[4] === 14) return 'Royal Flush';
        if (isFlush && isStraight) return 'Straight Flush';
        if (counts[0] === 4) return 'Four of a Kind';
        if (counts[0] === 3 && counts[1] === 2) return 'Full House';
        if (isFlush) return 'Flush';
        if (isStraight) return 'Straight';
        if (counts[0] === 3) return 'Three of a Kind';
        if (counts[0] === 2 && counts[1] === 2) return 'Two Pair';
        if (counts[0] === 2) return 'Pair';
        return 'High Card';
    }

    rankValue(rank) {
        const values = { 'A': 14, 'K': 13, 'Q': 12, 'J': 11 };
        return values[rank] || parseInt(rank);
    }

    /**
     * Decide whether to fold based on strategy
     */
    shouldFold(hand, communityCards) {
        const handType = this.evaluateHand([...hand, ...communityCards]);

        if (this.strategy === 'aggressive') {
            // Aggressive: Never fold
            return false;
        } else if (this.strategy === 'conservative') {
            // Conservative: Fold on High Card or low Pair
            return handType === 'High Card';
        } else {
            // Balanced: Fold on High Card, play everything else
            return handType === 'High Card';
        }
    }

    /**
     * Play one poker game
     */
    async playGame() {
        try {
            console.log(`🎰 Starting poker game | Wager: ${this.wager} GUILT`);

            // Call Poker API
            const response = await axios.post(
                `${this.apiUrl}/api/games/poker/play`,
                {
                    playerAddress: this.wallet,
                    wager: this.wager
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 15000
                }
            );

            const result = response.data;

            // Update statistics
            this.gamesPlayed++;
            this.totalWagered += parseFloat(this.wager);

            if (result.result === 'WIN') {
                this.wins++;
                const profit = parseFloat(result.payout || 0) - parseFloat(this.wager);
                this.totalProfit += profit;

                // Track winning hand
                if (result.playerHandType && this.winningHands[result.playerHandType] !== undefined) {
                    this.winningHands[result.playerHandType]++;
                }

                console.log(`✅ WIN! Hand: ${result.playerHandType || 'Unknown'}`);
                console.log(`   Player: ${this.formatCards(result.playerCards)}`);
                console.log(`   Pontiff: ${this.formatCards(result.pontiffCards)}`);
                console.log(`   Payout: ${result.payout} GUILT | Profit: +${profit.toFixed(2)} GUILT`);
            } else {
                this.losses++;
                this.totalProfit -= parseFloat(this.wager);

                console.log(`❌ LOSS. Hand: ${result.playerHandType || 'Unknown'}`);
                console.log(`   Player: ${this.formatCards(result.playerCards)}`);
                console.log(`   Pontiff: ${this.formatCards(result.pontiffCards)} (${result.pontiffHandType})`);
            }

            // Print statistics
            const winRate = (this.wins / this.gamesPlayed * 100).toFixed(1);
            const roi = ((this.totalProfit / this.totalWagered) * 100).toFixed(1);
            console.log(`📊 Stats: ${this.wins}W-${this.losses}L | Win Rate: ${winRate}% | Profit: ${this.totalProfit.toFixed(2)} GUILT | ROI: ${roi}%`);
            console.log('');

            return result;

        } catch (error) {
            if (error.response) {
                console.log(`❌ API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            } else if (error.request) {
                console.log(`❌ Network Error: No response from server`);
            } else {
                console.log(`❌ Error: ${error.message}`);
            }
            return { error: error.message };
        }
    }

    /**
     * Format cards for display
     */
    formatCards(cards) {
        if (!cards || cards.length === 0) return 'N/A';
        return cards.map(c => `${c.rank}${c.suit}`).join(' ');
    }

    /**
     * Run bot for specified number of games
     */
    async run(numGames = null) {
        console.log(`🚀 Starting poker bot with ${this.strategy} strategy...`);
        console.log(`   Playing ${numGames || 'unlimited'} games`);
        console.log(`   ${GAME_INTERVAL}s interval between games\n`);

        let gameCount = 0;

        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        try {
            while (true) {
                if (numGames && gameCount >= numGames) {
                    break;
                }

                await this.playGame();
                gameCount++;

                if (numGames === null || gameCount < numGames) {
                    await sleep(GAME_INTERVAL * 1000);
                }
            }
        } catch (error) {
            console.log('\n⏹️  Bot stopped:', error.message);
        }

        // Final statistics
        this.printFinalStats();
    }

    /**
     * Print final statistics
     */
    printFinalStats() {
        console.log('\n' + '='.repeat(50));
        console.log('FINAL STATISTICS');
        console.log('='.repeat(50));
        console.log(`Games Played:   ${this.gamesPlayed}`);
        console.log(`Wins:           ${this.wins}`);
        console.log(`Losses:         ${this.losses}`);
        console.log(`Win Rate:       ${(this.wins / this.gamesPlayed * 100).toFixed(1)}%`);
        console.log(`Total Wagered:  ${this.totalWagered.toFixed(2)} GUILT`);
        console.log(`Total Profit:   ${this.totalProfit.toFixed(2)} GUILT`);
        console.log(`ROI:            ${((this.totalProfit / this.totalWagered) * 100).toFixed(1)}%`);
        console.log('');
        console.log('Winning Hands:');
        Object.entries(this.winningHands).forEach(([hand, count]) => {
            if (count > 0) {
                console.log(`  ${hand}: ${count}`);
            }
        });
        console.log('='.repeat(50));
    }
}

// CLI
if (require.main === module) {
    const args = process.argv.slice(2);
    const numGames = args[0] ? parseInt(args[0]) : null;

    const bot = new PokerBot();

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n⏹️  Bot stopped by user');
        bot.printFinalStats();
        process.exit(0);
    });

    bot.run(numGames);
}

module.exports = PokerBot;

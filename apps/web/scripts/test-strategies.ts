import { STRATEGIES, StrategyContext } from '../lib/services/strategies';

const mockContext: StrategyContext = {
    gameHistory: [],
    currentBalance: 100, // 100 GUILT
    lastGameResult: 'WIN'
};

console.log("Testing Strategies with Balance: 100 GUILT");

// Test Berzerker
const berzerkerAction = STRATEGIES.berzerker(mockContext);
console.log("Berzerker Action:", berzerkerAction);
if (berzerkerAction.wager !== 15) throw new Error("Berzerker wager incorrect (expected 15)");
if (berzerkerAction.game !== 'RPS') throw new Error("Berzerker game incorrect");

// Test Merchant
const merchantAction = STRATEGIES.merchant(mockContext);
console.log("Merchant Action:", merchantAction);
if (merchantAction.wager !== 5) throw new Error("Merchant wager incorrect (expected 5)");
if (merchantAction.game !== 'RPS') throw new Error("Merchant game incorrect");

// Test Disciple
const discipleAction = STRATEGIES.disciple(mockContext);
console.log("Disciple Action:", discipleAction);
if (discipleAction.wager !== 20) throw new Error("Disciple wager incorrect (expected 20)");
if (discipleAction.game !== 'STAKING') throw new Error("Disciple game incorrect (expected STAKING)");

console.log("✅ Strategies Verification Passed!");

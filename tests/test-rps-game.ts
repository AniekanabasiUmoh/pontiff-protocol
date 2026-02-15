/**
 * TEST: Rock Paper Scissors (Module 9 - Casino Games)
 * Tests: Casino play → Balance system → Game history → Contract reads
 *
 * Usage: npx tsx tests/test-rps-game.ts
 */

import { createPublicClient, http, formatEther } from 'viem';

const MONAD_TESTNET = {
    id: 10143,
    name: 'Monad Testnet',
    nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
    rpcUrls: { default: { http: ['https://testnet-rpc.monad.xyz'] } },
} as const;

const client = createPublicClient({ chain: MONAD_TESTNET, transport: http() });

const BASE_URL = 'http://localhost:3000';
const RPS_ADDRESS = '0x47978110364Bcd2C2493d6196D17a6Fa8aF2AaEb' as const;
const TEST_WALLET = '0x742d35Cc6634C0532925a3b844Bc9e7595f5bA16';

const RPS_ABI = [
    { inputs: [], name: 'gameIdCounter', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'treasury', outputs: [{ type: 'address' }], stateMutability: 'view', type: 'function' },
    { inputs: [{ name: 'gameId', type: 'uint256' }], name: 'getGame', outputs: [{ components: [{ name: 'player1', type: 'address' }, { name: 'player2', type: 'address' }, { name: 'wager', type: 'uint256' }, { name: 'commitment', type: 'bytes32' }, { name: 'player2Move', type: 'uint8' }, { name: 'player1Move', type: 'uint8' }, { name: 'status', type: 'uint8' }, { name: 'winner', type: 'address' }, { name: 'createdAt', type: 'uint256' }], type: 'tuple' }], stateMutability: 'view', type: 'function' },
] as const;

interface TestResult { name: string; passed: boolean; details: string; }
const results: TestResult[] = [];

async function runTest(name: string, fn: () => Promise<void>) {
    try {
        await fn();
        results.push({ name, passed: true, details: 'OK' });
        console.log(`  ✅ ${name}`);
    } catch (err: any) {
        results.push({ name, passed: false, details: err.message });
        console.log(`  ❌ ${name}: ${err.message}`);
    }
}

async function main() {
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║     PONTIFF AUDIT: RPS Game Tests        ║');
    console.log('╚══════════════════════════════════════════╝\n');

    // ── Test 1: RPS Contract is deployed ──
    await runTest('RPSGame contract is deployed on Monad', async () => {
        const code = await client.getCode({ address: RPS_ADDRESS });
        if (!code || code === '0x') throw new Error('No bytecode at RPS address');
    });

    // ── Test 2: Game counter ──
    await runTest('gameIdCounter is readable', async () => {
        const counter = await client.readContract({ address: RPS_ADDRESS, abi: RPS_ABI, functionName: 'gameIdCounter' });
        console.log(`    Total games created on-chain: ${counter}`);
    });

    // ── Test 3: Treasury is set ──
    await runTest('Treasury address is configured', async () => {
        const treasury = await client.readContract({ address: RPS_ADDRESS, abi: RPS_ABI, functionName: 'treasury' });
        console.log(`    Treasury: ${treasury}`);
        if (treasury === '0x0000000000000000000000000000000000000000') throw new Error('Treasury is zero address');
    });

    // ── Test 4: Bank balance API ──
    await runTest('GET /api/bank/balance - returns balance data', async () => {
        const res = await fetch(`${BASE_URL}/api/bank/balance?wallet=${TEST_WALLET}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        console.log(`    Balance: ${JSON.stringify(data)}`);
        if (!('success' in data)) throw new Error('Missing success field in response');
    });

    // ── Test 5: Casino play API ──
    await runTest('POST /api/games/rps/play-casino - game endpoint exists', async () => {
        const res = await fetch(`${BASE_URL}/api/games/rps/play-casino`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                walletAddress: TEST_WALLET,
                playerMove: 1, // Rock
                wager: 100,
            }),
        });
        // Should return 400 (insufficient balance) or 200 (game played)
        console.log(`    Casino play status: ${res.status}`);
        if (res.status === 500) throw new Error('Internal server error on casino play');
    });

    // ── Test 6: Game history API ──
    await runTest('GET /api/games/rps/history - returns history', async () => {
        const res = await fetch(`${BASE_URL}/api/games/rps/history?wallet=${TEST_WALLET}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        console.log(`    History entries: ${JSON.stringify(data).slice(0, 100)}`);
    });

    // ── Test 7: Recent games API ──
    await runTest('GET /api/games/recent - returns recent games', async () => {
        const res = await fetch(`${BASE_URL}/api/games/recent`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        console.log(`    Recent games: ${Array.isArray(data.games) ? data.games.length : 'N/A'} entries`);
    });

    // ── Test 8: Game stats API ──
    await runTest('GET /api/games/stats - returns stats', async () => {
        const res = await fetch(`${BASE_URL}/api/games/stats`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        console.log(`    Stats: ${JSON.stringify(data).slice(0, 100)}`);
    });

    // ── Test 9: Bank deposit API ──
    await runTest('POST /api/bank/deposit-confirm - exists', async () => {
        const res = await fetch(`${BASE_URL}/api/bank/deposit-confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wallet: TEST_WALLET, txHash: '0xtest', amount: 100 }),
        });
        console.log(`    Deposit confirm status: ${res.status}`);
        if (res.status === 500) throw new Error('Internal server error');
    });

    // ── Test 10: Bank withdraw API ──
    await runTest('POST /api/bank/withdraw-request - exists', async () => {
        const res = await fetch(`${BASE_URL}/api/bank/withdraw-request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wallet: TEST_WALLET, amount: 50 }),
        });
        console.log(`    Withdraw request status: ${res.status}`);
        if (res.status === 500) throw new Error('Internal server error');
    });

    // ── SUMMARY ──
    console.log('\n' + '═'.repeat(50));
    console.log('RPS GAME RESULTS:');
    console.log('═'.repeat(50));
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    console.log(`  Passed: ${passed}/${results.length}`);
    console.log(`  Failed: ${failed}/${results.length}`);
    results.filter(r => !r.passed).forEach(r => console.log(`  ✗ ${r.name}: ${r.details}`));
    console.log('═'.repeat(50) + '\n');

    process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);

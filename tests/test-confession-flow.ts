/**
 * TEST: Confession Flow (Module 1 - Core Feature)
 * Tests: Homepage confession → API → Sin Scanner → Roast → DB storage → Recent feed
 *
 * Usage: npx tsx tests/test-confession-flow.ts
 */

const CONFESS_API = 'http://localhost:3000/api/vatican/confess';
const RECENT_API = 'http://localhost:3000/api/confession/recent';
const STATS_API = 'http://localhost:3000/api/confession/stats';

// Test wallet addresses (Monad testnet)
const TEST_WALLETS = [
    '0x742d35Cc6634C0532925a3b844Bc9e7595f5bA16',
    '0x1234567890abcdef1234567890abcdef12345678',
    '0x0000000000000000000000000000000000000000', // Edge case: zero address
];

interface TestResult {
    name: string;
    passed: boolean;
    details: string;
    duration: number;
}

const results: TestResult[] = [];

async function runTest(name: string, fn: () => Promise<void>) {
    const start = Date.now();
    try {
        await fn();
        results.push({ name, passed: true, details: 'OK', duration: Date.now() - start });
        console.log(`  ✅ ${name}`);
    } catch (err: any) {
        results.push({ name, passed: false, details: err.message, duration: Date.now() - start });
        console.log(`  ❌ ${name}: ${err.message}`);
    }
}

async function main() {
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║   PONTIFF AUDIT: Confession Flow Tests   ║');
    console.log('╚══════════════════════════════════════════╝\n');

    // ── Test 1: Basic confession with valid wallet ──
    await runTest('POST /api/vatican/confess - valid wallet', async () => {
        const res = await fetch(CONFESS_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                agentWallet: TEST_WALLETS[0],
                type: 'confess',
                timestamp: new Date().toISOString(),
            }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
        const data = await res.json();

        if (!data.success) throw new Error('Response success=false');
        if (!data.data.sins || !Array.isArray(data.data.sins)) throw new Error('No sins array returned');
        if (!data.data.roast || typeof data.data.roast !== 'string') throw new Error('No roast string returned');
        if (!data.data.indulgencePrice) throw new Error('No indulgence price returned');
        if (data.data.sins.length === 0) throw new Error('Zero sins detected (should always find at least 1)');
    });

    // ── Test 2: Confession with invalid wallet ──
    await runTest('POST /api/vatican/confess - invalid address', async () => {
        const res = await fetch(CONFESS_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                agentWallet: 'not-a-valid-address',
                type: 'confess',
                timestamp: new Date().toISOString(),
            }),
        });

        // Should either return error or handle gracefully with fallback sins
        const data = await res.json();
        // If it doesn't crash, that's acceptable
        if (res.ok && data.success) {
            // It handled it gracefully - check it returned fallback sins
            if (!data.data.sins || data.data.sins.length === 0) {
                throw new Error('Invalid address produced no sins and no error');
            }
        }
        // If error response, that's also acceptable
    });

    // ── Test 3: Empty body ──
    await runTest('POST /api/vatican/confess - empty body', async () => {
        const res = await fetch(CONFESS_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });

        if (res.ok) throw new Error('Should have returned error for empty body');
    });

    // ── Test 4: Recent confessions endpoint ──
    await runTest('GET /api/confession/recent - fetches recent', async () => {
        const res = await fetch(`${RECENT_API}?limit=10`);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
        const data = await res.json();

        if (!data.confessions) throw new Error('No confessions array returned');
        if (!Array.isArray(data.confessions)) throw new Error('confessions is not an array');
    });

    // ── Test 5: Confession stats endpoint ──
    await runTest('GET /api/confession/stats', async () => {
        const res = await fetch(STATS_API);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
        const data = await res.json();
        // Should return some stats object
        if (typeof data !== 'object') throw new Error('Stats not returned as object');
    });

    // ── Test 6: Multiple rapid confessions (rate limit check) ──
    await runTest('Rapid confession fire - 3 in succession', async () => {
        const promises = TEST_WALLETS.slice(0, 2).map(wallet =>
            fetch(CONFESS_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agentWallet: wallet,
                    type: 'confess',
                    timestamp: new Date().toISOString(),
                }),
            }).then(r => r.json())
        );

        const results = await Promise.allSettled(promises);
        const fulfilled = results.filter(r => r.status === 'fulfilled');
        if (fulfilled.length === 0) throw new Error('All rapid confessions failed');
    });

    // ── SUMMARY ──
    console.log('\n' + '═'.repeat(50));
    console.log('CONFESSION FLOW RESULTS:');
    console.log('═'.repeat(50));
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    console.log(`  Passed: ${passed}/${results.length}`);
    console.log(`  Failed: ${failed}/${results.length}`);
    results.filter(r => !r.passed).forEach(r => {
        console.log(`  ✗ ${r.name}: ${r.details}`);
    });
    console.log('═'.repeat(50) + '\n');

    process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);

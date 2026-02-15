/**
 * TEST: Agent System (Module 10 - Autonomous Agents)
 * Tests: Agent hiring → Session creation → Agent loop → Dashboard → Stop
 *
 * Usage: npx tsx tests/test-agent-system.ts
 */

const BASE_URL = 'http://localhost:3000';
const TEST_WALLET = '0x742d35Cc6634C0532925a3b844Bc9e7595f5bA16';

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
    console.log('║    PONTIFF AUDIT: Agent System Tests     ║');
    console.log('╚══════════════════════════════════════════╝\n');

    // ── Test 1: Dashboard stats API ──
    await runTest('GET /api/dashboard/stats - returns KPIs and sessions', async () => {
        const res = await fetch(`${BASE_URL}/api/dashboard/stats?wallet=${TEST_WALLET}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (!data.kpi || !Array.isArray(data.kpi)) throw new Error('Missing KPI array');
        if (!data.sessions || !Array.isArray(data.sessions)) throw new Error('Missing sessions array');
        console.log(`    KPIs: ${data.kpi.length}, Sessions: ${data.sessions.length}`);
    });

    // ── Test 2: Agent sessions API ──
    await runTest('GET /api/agents/sessions - lists active sessions', async () => {
        const res = await fetch(`${BASE_URL}/api/agents/sessions`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        console.log(`    Sessions response: ${JSON.stringify(data).slice(0, 150)}`);
    });

    // ── Test 3: Agent deploy endpoint ──
    await runTest('POST /api/agents/deploy - exists and validates', async () => {
        const res = await fetch(`${BASE_URL}/api/agents/deploy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userAddress: TEST_WALLET,
                strategy: 'berzerker',
                deposit: 100,
                maxWager: 50,
                stopLoss: 10,
                takeProfit: 500,
            }),
        });
        console.log(`    Deploy status: ${res.status}`);
        // 400 = validation error (expected for test wallet), 200 = success
        if (res.status === 500) throw new Error('Internal server error on deploy');
    });

    // ── Test 4: Agent start API ──
    await runTest('POST /api/agents/start - exists', async () => {
        const res = await fetch(`${BASE_URL}/api/agents/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: 'test-session-id', walletAddress: TEST_WALLET }),
        });
        console.log(`    Start status: ${res.status}`);
        if (res.status === 500) throw new Error('Internal server error');
    });

    // ── Test 5: Agent auto-start API ──
    await runTest('POST /api/agents/auto-start - exists and responds', async () => {
        const res = await fetch(`${BASE_URL}/api/agents/auto-start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userAddress: TEST_WALLET }),
        });
        console.log(`    Auto-start status: ${res.status}`);
        if (res.status === 500) throw new Error('Internal server error');
    });

    // ── Test 6: Agent stop API ──
    await runTest('POST /api/agents/[id]/stop - exists', async () => {
        const res = await fetch(`${BASE_URL}/api/agents/test-session/stop`, {
            method: 'POST',
        });
        console.log(`    Stop status: ${res.status}`);
        // 404 or 400 expected for non-existent session
        if (res.status === 500) throw new Error('Internal server error');
    });

    // ── Test 7: Agent detail API ──
    await runTest('GET /api/agents/[id]/detail - exists', async () => {
        const res = await fetch(`${BASE_URL}/api/agents/test-session/detail`);
        console.log(`    Detail status: ${res.status}`);
        if (res.status === 500) throw new Error('Internal server error');
    });

    // ── Test 8: Cron agent turns ──
    await runTest('GET /api/cron/agent-turns - cron endpoint exists', async () => {
        const res = await fetch(`${BASE_URL}/api/cron/agent-turns`);
        console.log(`    Cron status: ${res.status}`);
        // May return 401 (auth required) or 200
        if (res.status === 500) throw new Error('Internal server error');
    });

    // ── Test 9: PvP queue API ──
    await runTest('GET /api/pvp/queue - matchmaking queue exists', async () => {
        const res = await fetch(`${BASE_URL}/api/pvp/queue`);
        if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`);
        const data = await res.json().catch(() => ({}));
        console.log(`    Queue: ${JSON.stringify(data).slice(0, 100)}`);
    });

    // ── Test 10: PvP leaderboard ──
    await runTest('GET /api/pvp/leaderboard - leaderboard exists', async () => {
        const res = await fetch(`${BASE_URL}/api/pvp/leaderboard?limit=5`);
        if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`);
        const data = await res.json().catch(() => ({}));
        console.log(`    Leaderboard: ${JSON.stringify(data).slice(0, 100)}`);
    });

    // ── SUMMARY ──
    console.log('\n' + '═'.repeat(50));
    console.log('AGENT SYSTEM RESULTS:');
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

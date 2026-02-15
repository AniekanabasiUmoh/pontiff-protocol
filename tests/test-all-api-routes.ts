/**
 * TEST: All API Routes - Comprehensive endpoint smoke test
 * Verifies every API route is reachable and doesn't 500
 *
 * Usage: npx tsx tests/test-all-api-routes.ts
 */

const BASE_URL = 'http://localhost:3000';
const TEST_WALLET = '0x742d35Cc6634C0532925a3b844Bc9e7595f5bA16';

interface RouteTest {
    method: 'GET' | 'POST';
    path: string;
    body?: object;
    expectStatus?: number[];  // acceptable status codes
}

const ROUTES: RouteTest[] = [
    // ─── AUTH ───
    { method: 'GET', path: '/api/auth/nonce' },
    { method: 'GET', path: '/api/auth/me' },

    // ─── CONFESSION / VATICAN ───
    { method: 'POST', path: '/api/vatican/confess', body: { agentWallet: TEST_WALLET, type: 'confess', timestamp: new Date().toISOString() } },
    { method: 'GET', path: '/api/confession/recent?limit=5' },
    { method: 'GET', path: '/api/confession/stats' },
    { method: 'GET', path: '/api/vatican/state' },

    // ─── STAKING ───
    { method: 'GET', path: '/api/cathedral/stats' },
    { method: 'POST', path: '/api/vatican/stake', body: { agentWallet: TEST_WALLET, type: 'stake', amount: '100' } },

    // ─── JUDAS ───
    { method: 'POST', path: '/api/judas/resolve', body: { epochId: 1, txHash: '0xtest' } },

    // ─── GAMES: RPS ───
    { method: 'POST', path: '/api/games/rps/play-casino', body: { walletAddress: TEST_WALLET, playerMove: 1, wager: 100 } },
    { method: 'GET', path: `/api/games/rps/history?wallet=${TEST_WALLET}` },

    // ─── GAMES: POKER ───
    { method: 'GET', path: '/api/games/poker/tables' },

    // ─── GAMES: GENERAL ───
    { method: 'GET', path: '/api/games/recent' },
    { method: 'GET', path: '/api/games/stats' },
    { method: 'GET', path: '/api/games/history' },

    // ─── BANK ───
    { method: 'GET', path: `/api/bank/balance?wallet=${TEST_WALLET}` },
    { method: 'GET', path: `/api/bank/transactions?wallet=${TEST_WALLET}` },

    // ─── AGENTS ───
    { method: 'GET', path: '/api/agents/sessions' },
    { method: 'GET', path: `/api/dashboard/stats?wallet=${TEST_WALLET}` },
    { method: 'POST', path: '/api/agents/auto-start', body: { userAddress: TEST_WALLET } },

    // ─── PVP ───
    { method: 'GET', path: '/api/pvp/queue' },
    { method: 'GET', path: '/api/pvp/leaderboard?limit=5' },
    { method: 'GET', path: '/api/pvp/matches?limit=5' },

    // ─── WORLD STATE ───
    { method: 'GET', path: '/api/world-state' },

    // ─── LEADERBOARD ───
    { method: 'GET', path: '/api/leaderboard' },

    // ─── DEBATES ───
    { method: 'GET', path: '/api/debates' },
    { method: 'GET', path: '/api/debates/active' },

    // ─── CARDINAL / MEMBERSHIP ───
    { method: 'GET', path: '/api/cardinal/candidates' },
    { method: 'GET', path: `/api/cardinal/status?wallet=${TEST_WALLET}` },
    { method: 'GET', path: '/api/cardinal/election/status' },
    { method: 'GET', path: '/api/membership/tiers' },

    // ─── INDULGENCES ───
    { method: 'GET', path: '/api/indulgences/available' },

    // ─── ANALYTICS ───
    { method: 'GET', path: '/api/analytics/revenue' },
    { method: 'GET', path: '/api/analytics/games' },

    // ─── TOURNAMENTS ───
    { method: 'GET', path: '/api/tournaments/list' },

    // ─── CRUSADES ───
    { method: 'GET', path: '/api/crusades' },

    // ─── COMPETITORS ───
    { method: 'GET', path: `/api/competitors/scan?wallet=${TEST_WALLET}` },

    // ─── TREASURY ───
    { method: 'POST', path: '/api/treasury/distribute', body: {} },
];

interface TestResult { name: string; passed: boolean; status: number; details: string; }
const results: TestResult[] = [];

async function main() {
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║  PONTIFF AUDIT: All API Routes Smoke     ║');
    console.log('╚══════════════════════════════════════════╝\n');

    for (const route of ROUTES) {
        const fullUrl = `${BASE_URL}${route.path}`;
        const label = `${route.method} ${route.path.split('?')[0]}`;

        try {
            const opts: RequestInit = { method: route.method };
            if (route.body) {
                opts.headers = { 'Content-Type': 'application/json' };
                opts.body = JSON.stringify(route.body);
            }

            const res = await fetch(fullUrl, opts);
            const passed = res.status !== 500;

            results.push({ name: label, passed, status: res.status, details: passed ? 'OK' : 'SERVER ERROR' });

            const icon = res.status === 200 ? '✅' : res.status < 500 ? '⚠️' : '❌';
            console.log(`  ${icon} [${res.status}] ${label}`);
        } catch (err: any) {
            results.push({ name: label, passed: false, status: 0, details: err.message.slice(0, 80) });
            console.log(`  ❌ [ERR] ${label}: ${err.message.slice(0, 80)}`);
        }
    }

    // ── SUMMARY ──
    console.log('\n' + '═'.repeat(60));
    console.log('ALL API ROUTES SUMMARY:');
    console.log('═'.repeat(60));

    const ok = results.filter(r => r.status === 200).length;
    const clientError = results.filter(r => r.status >= 400 && r.status < 500).length;
    const serverError = results.filter(r => r.status >= 500).length;
    const unreachable = results.filter(r => r.status === 0).length;

    console.log(`  200 OK:           ${ok}`);
    console.log(`  4xx Client Error: ${clientError} (expected for some)`);
    console.log(`  5xx Server Error: ${serverError} ← THESE NEED FIXING`);
    console.log(`  Unreachable:      ${unreachable} ← Server not running?`);
    console.log(`  Total Routes:     ${results.length}`);

    if (serverError > 0) {
        console.log('\n  SERVER ERRORS (Broken Routes):');
        results.filter(r => r.status >= 500).forEach(r =>
            console.log(`    ✗ ${r.name}: ${r.details}`)
        );
    }

    if (unreachable > 0) {
        console.log('\n  UNREACHABLE (Server down or network error):');
        results.filter(r => r.status === 0).forEach(r =>
            console.log(`    ✗ ${r.name}: ${r.details}`)
        );
    }

    console.log('═'.repeat(60) + '\n');

    process.exit(serverError > 0 ? 1 : 0);
}

main().catch(console.error);

/**
 * COMPREHENSIVE PONTIFF PROTOCOL TEST SUITE
 * 
 * Tests ALL features across the entire protocol:
 * - Confession system
 * - Gaming (RPS, Poker)
 * - Agent system (PvE + PvP)
 * - Crusades & Debates
 * - Membership & Elections
 * - Indulgences & Cathedral
 * 
 * Usage: npx tsx scripts/test-pontiff-full.ts
 */

const BASE_URL = 'http://localhost:3000';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

const results: { category: string; test: string; status: 'PASS' | 'FAIL'; message?: string }[] = [];

function logTest(category: string, test: string, status: 'PASS' | 'FAIL', message?: string) {
    totalTests++;
    if (status === 'PASS') {
        passedTests++;
        console.log(`✅ [${category}] ${test}`);
    } else {
        failedTests++;
        console.log(`❌ [${category}] ${test}`);
        if (message) console.log(`   → ${message}`);
    }
    results.push({ category, test, status, message });
}

// ============================================================
// CONFESSION SYSTEM
// ============================================================
async function testConfession() {
    console.log('\n🙏 Testing Confession System...\n');

    // Test recent confessions
    try {
        const res = await fetch(`${BASE_URL}/api/confession/recent?limit=10`);
        const data = await res.json();
        logTest('Confession', 'GET /api/confession/recent', res.ok ? 'PASS' : 'FAIL',
            res.ok ? `${data.confessions?.length || 0} confessions` : data.error);
    } catch (e: any) {
        logTest('Confession', 'GET /api/confession/recent', 'FAIL', e.message);
    }

    // Test confession stats
    try {
        const res = await fetch(`${BASE_URL}/api/confession/stats`);
        if (res.status === 404) {
            logTest('Confession', 'GET /api/confession/stats', 'FAIL', 'Endpoint not found');
        } else {
            const data = await res.json();
            logTest('Confession', 'GET /api/confession/stats', res.ok ? 'PASS' : 'FAIL');
        }
    } catch (e: any) {
        logTest('Confession', 'GET /api/confession/stats', 'FAIL', e.message);
    }
}

// ============================================================
// GAMING SYSTEM
// ============================================================
async function testGaming() {
    console.log('\n🎮 Testing Gaming System...\n');

    // Test RPS game history
    try {
        const res = await fetch(`${BASE_URL}/api/games/rps/history?limit=10`);
        if (res.status === 404) {
            logTest('Gaming', 'GET /api/games/rps/history', 'FAIL', 'Endpoint not found');
        } else {
            const data = await res.json();
            logTest('Gaming', 'GET /api/games/rps/history', res.ok ? 'PASS' : 'FAIL',
                data.games ? `${data.games.length} games` : data.error);
        }
    } catch (e: any) {
        logTest('Gaming', 'GET /api/games/rps/history', 'FAIL', e.message);
    }

    // Test poker (if exists)
    try {
        const res = await fetch(`${BASE_URL}/api/games/poker/tables`);
        if (res.status === 404) {
            logTest('Gaming', 'GET /api/games/poker/tables', 'FAIL', 'Endpoint not found');
        } else {
            logTest('Gaming', 'GET /api/games/poker/tables', res.ok ? 'PASS' : 'FAIL');
        }
    } catch (e: any) {
        logTest('Gaming', 'GET /api/games/poker/tables', 'FAIL', e.message);
    }
}

// ============================================================
// AGENT SYSTEM (PvE + PvP)
// ============================================================
async function testAgentSystem() {
    console.log('\n🤖 Testing Agent System...\n');

    // Test agent sessions list
    try {
        const res = await fetch(`${BASE_URL}/api/agents/sessions?limit=20`);
        if (res.status === 404) {
            logTest('Agents', 'GET /api/agents/sessions', 'FAIL', 'Endpoint not found');
        } else {
            const data = await res.json();
            logTest('Agents', 'GET /api/agents/sessions', res.ok ? 'PASS' : 'FAIL',
                data.sessions ? `${data.sessions.length} sessions` : data.error);
        }
    } catch (e: any) {
        logTest('Agents', 'GET /api/agents/sessions', 'FAIL', e.message);
    }

    // Test PvP queue
    try {
        const res = await fetch(`${BASE_URL}/api/pvp/queue`);
        const data = await res.json();
        logTest('Agents', 'GET /api/pvp/queue', res.ok ? 'PASS' : 'FAIL',
            data.queue ? `${data.queue.length} in queue` : data.error);
    } catch (e: any) {
        logTest('Agents', 'GET /api/pvp/queue', 'FAIL', e.message);
    }

    // Test PvP matches
    try {
        const res = await fetch(`${BASE_URL}/api/pvp/matches?limit=10`);
        const data = await res.json();
        logTest('Agents', 'GET /api/pvp/matches', res.ok ? 'PASS' : 'FAIL',
            data.matches ? `${data.matches.length} matches` : data.error);
    } catch (e: any) {
        logTest('Agents', 'GET /api/pvp/matches', 'FAIL', e.message);
    }

    // Test PvP leaderboard
    try {
        const res = await fetch(`${BASE_URL}/api/pvp/leaderboard?limit=10`);
        const data = await res.json();
        logTest('Agents', 'GET /api/pvp/leaderboard', res.ok ? 'PASS' : 'FAIL',
            data.leaderboard ? `${data.leaderboard.length} gladiators` : data.error);
    } catch (e: any) {
        logTest('Agents', 'GET /api/pvp/leaderboard', 'FAIL', e.message);
    }
}

// ============================================================
// CRUSADES & WARFARE
// ============================================================
async function testCrusades() {
    console.log('\n⚔️  Testing Crusades System...\n');

    // Test crusades list
    try {
        const res = await fetch(`${BASE_URL}/api/crusades?status=active`);
        if (res.status === 404) {
            logTest('Crusades', 'GET /api/crusades', 'FAIL', 'Endpoint not found');
        } else {
            const data = await res.json();
            logTest('Crusades', 'GET /api/crusades', res.ok ? 'PASS' : 'FAIL',
                data.crusades ? `${data.crusades.length} crusades` : data.error);
        }
    } catch (e: any) {
        logTest('Crusades', 'GET /api/crusades', 'FAIL', e.message);
    }

    // Test competitors scan
    try {
        const res = await fetch(`${BASE_URL}/api/competitors/scan`);
        if (res.status === 404) {
            logTest('Crusades', 'GET /api/competitors/scan', 'FAIL', 'Endpoint not found');
        } else {
            logTest('Crusades', 'GET /api/competitors/scan', res.ok ? 'PASS' : 'FAIL');
        }
    } catch (e: any) {
        logTest('Crusades', 'GET /api/competitors/scan', 'FAIL', e.message);
    }
}

// ============================================================
// DEBATES
// ============================================================
async function testDebates() {
    console.log('\n💬 Testing Debates System...\n');

    // Test debates list
    try {
        const res = await fetch(`${BASE_URL}/api/debates?status=active`);
        if (res.status === 404) {
            logTest('Debates', 'GET /api/debates', 'FAIL', 'Endpoint not found');
        } else {
            const data = await res.json();
            logTest('Debates', 'GET /api/debates', res.ok ? 'PASS' : 'FAIL',
                data.debates ? `${data.debates.length} debates` : data.error);
        }
    } catch (e: any) {
        logTest('Debates', 'GET /api/debates', 'FAIL', e.message);
    }
}

// ============================================================
// MEMBERSHIP & ELECTIONS
// ============================================================
async function testMembership() {
    console.log('\n👑 Testing Membership & Elections...\n');

    // Test cardinal candidates
    try {
        const res = await fetch(`${BASE_URL}/api/cardinal/candidates`);
        const data = await res.json();
        logTest('Membership', 'GET /api/cardinal/candidates', res.ok ? 'PASS' : 'FAIL',
            data.candidates ? `${data.candidates.length} candidates` : data.error);
    } catch (e: any) {
        logTest('Membership', 'GET /api/cardinal/candidates', 'FAIL', e.message);
    }

    // Test election status
    try {
        const res = await fetch(`${BASE_URL}/api/cardinal/election/status`);
        const data = await res.json();
        logTest('Membership', 'GET /api/cardinal/election/status', res.ok ? 'PASS' : 'FAIL',
            data.currentPope ? `Pope: ${data.currentPope.slice(0, 10)}...` : data.error);
    } catch (e: any) {
        logTest('Membership', 'GET /api/cardinal/election/status', 'FAIL', e.message);
    }

    // Test membership tiers
    try {
        const res = await fetch(`${BASE_URL}/api/membership/tiers`);
        if (res.status === 404) {
            logTest('Membership', 'GET /api/membership/tiers', 'FAIL', 'Endpoint not found');
        } else {
            logTest('Membership', 'GET /api/membership/tiers', res.ok ? 'PASS' : 'FAIL');
        }
    } catch (e: any) {
        logTest('Membership', 'GET /api/membership/tiers', 'FAIL', e.message);
    }
}

// ============================================================
// INDULGENCES & CATHEDRAL
// ============================================================
async function testEconomy() {
    console.log('\n💰 Testing Economy System...\n');

    // Test indulgences
    try {
        const res = await fetch(`${BASE_URL}/api/indulgences/available`);
        if (res.status === 404) {
            logTest('Economy', 'GET /api/indulgences/available', 'FAIL', 'Endpoint not found');
        } else {
            const data = await res.json();
            logTest('Economy', 'GET /api/indulgences/available', res.ok ? 'PASS' : 'FAIL');
        }
    } catch (e: any) {
        logTest('Economy', 'GET /api/indulgences/available', 'FAIL', e.message);
    }

    // Test cathedral stats
    try {
        const res = await fetch(`${BASE_URL}/api/cathedral/stats`);
        if (res.status === 404) {
            logTest('Economy', 'GET /api/cathedral/stats', 'FAIL', 'Endpoint not found');
        } else {
            logTest('Economy', 'GET /api/cathedral/stats', res.ok ? 'PASS' : 'FAIL');
        }
    } catch (e: any) {
        logTest('Economy', 'GET /api/cathedral/stats', 'FAIL', e.message);
    }

    // Test bank balance
    try {
        const testWallet = '0x9f994707E36848a82e672d34aDB3194877dB8cc3';
        const res = await fetch(`${BASE_URL}/api/bank/balance?wallet=${testWallet}`);
        if (res.status === 404) {
            logTest('Economy', 'GET /api/bank/balance', 'FAIL', 'Endpoint not found');
        } else {
            logTest('Economy', 'GET /api/bank/balance', res.ok ? 'PASS' : 'FAIL');
        }
    } catch (e: any) {
        logTest('Economy', 'GET /api/bank/balance', 'FAIL', e.message);
    }
}

// ============================================================
// LEADERBOARDS
// ============================================================
async function testLeaderboards() {
    console.log('\n🏆 Testing Leaderboards...\n');

    // Test global leaderboard
    try {
        const res = await fetch(`${BASE_URL}/api/leaderboard?limit=10`);
        if (res.status === 404) {
            logTest('Leaderboards', 'GET /api/leaderboard', 'FAIL', 'Endpoint not found');
        } else {
            const data = await res.json();
            logTest('Leaderboards', 'GET /api/leaderboard', res.ok ? 'PASS' : 'FAIL');
        }
    } catch (e: any) {
        logTest('Leaderboards', 'GET /api/leaderboard', 'FAIL', e.message);
    }
}

// ============================================================
// WORLD STATE
// ============================================================
async function testWorldState() {
    console.log('\n🌍 Testing World State...\n');

    // Test world state
    try {
        const res = await fetch(`${BASE_URL}/api/world-state`);
        if (res.status === 404) {
            logTest('World State', 'GET /api/world-state', 'FAIL', 'Endpoint not found');
        } else {
            const data = await res.json();
            logTest('World State', 'GET /api/world-state', res.ok ? 'PASS' : 'FAIL');
        }
    } catch (e: any) {
        logTest('World State', 'GET /api/world-state', 'FAIL', e.message);
    }
}

// ============================================================
// MAIN TEST RUNNER
// ============================================================
async function runTests() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('       PONTIFF PROTOCOL - FULL SYSTEM TEST SUITE       ');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log(`Target: ${BASE_URL}\n`);

    await testConfession();
    await testGaming();
    await testAgentSystem();
    await testCrusades();
    await testDebates();
    await testMembership();
    await testEconomy();
    await testLeaderboards();
    await testWorldState();

    // Summary
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('                      TEST SUMMARY                      ');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log(`Total Tests:  ${totalTests}`);
    console.log(`✅ Passed:     ${passedTests}`);
    console.log(`❌ Failed:     ${failedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

    // Group failures by category
    const failuresByCategory: Record<string, string[]> = {};
    results.filter(r => r.status === 'FAIL').forEach(r => {
        if (!failuresByCategory[r.category]) failuresByCategory[r.category] = [];
        failuresByCategory[r.category].push(`${r.test}${r.message ? ` (${r.message})` : ''}`);
    });

    if (Object.keys(failuresByCategory).length > 0) {
        console.log('🔴 FAILURES BY CATEGORY:\n');
        Object.entries(failuresByCategory).forEach(([cat, fails]) => {
            console.log(`[${cat}]`);
            fails.forEach(f => console.log(`  • ${f}`));
            console.log('');
        });
    } else {
        console.log('🎉 ALL TESTS PASSED!\n');
    }

    // Recommendations
    if (failedTests > 0) {
        console.log('💡 RECOMMENDATIONS:\n');
        console.log('  • Endpoints marked "not found" may need to be created');
        console.log('  • Check server logs for detailed error messages');
        console.log('  • Verify database schema and seed data are applied');
        console.log('  • Ensure all environment variables are configured\n');
    }

    console.log('═══════════════════════════════════════════════════════\n');

    process.exit(failedTests > 0 ? 1 : 0);
}

runTests().catch(console.error);

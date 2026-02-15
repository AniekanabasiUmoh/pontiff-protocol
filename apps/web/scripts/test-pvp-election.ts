/**
 * COMPREHENSIVE PVP & ELECTION TEST SUITE
 * 
 * Tests all new features: Agent PvP system + Papal Elections
 * Identifies bugs, missing data, and integration issues
 * 
 * Usage: npx tsx scripts/test-pvp-election.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const BASE_URL = 'http://localhost:3000';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// Test result tracking
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
// DATABASE SCHEMA TESTS
// ============================================================
async function testDatabaseSchema() {
    console.log('\n🔍 Testing Database Schema...\n');

    // Test PvP tables exist
    const pvpTables = ['pvp_matches', 'matchmaking_queue', 'agent_escrow'];
    for (const table of pvpTables) {
        try {
            const { error } = await supabase.from(table).select('*').limit(1);
            logTest('DB Schema', `Table: ${table}`, error ? 'FAIL' : 'PASS', error?.message);
        } catch (e: any) {
            logTest('DB Schema', `Table: ${table}`, 'FAIL', e.message);
        }
    }

    // Test election tables exist
    const electionTables = ['pope_election_votes', 'cardinal_members'];
    for (const table of electionTables) {
        try {
            const { error } = await supabase.from(table).select('*').limit(1);
            logTest('DB Schema', `Table: ${table}`, error ? 'FAIL' : 'PASS', error?.message);
        } catch (e: any) {
            logTest('DB Schema', `Table: ${table}`, 'FAIL', e.message);
        }
    }

    // Test agent_sessions has PvP columns
    try {
        const { data, error } = await supabase
            .from('agent_sessions')
            .select('pvp_wins, pvp_losses, elo_rating, agent_mode')
            .limit(1);

        if (error) {
            logTest('DB Schema', 'agent_sessions PvP columns', 'FAIL', error.message);
        } else {
            logTest('DB Schema', 'agent_sessions PvP columns', 'PASS');
        }
    } catch (e: any) {
        logTest('DB Schema', 'agent_sessions PvP columns', 'FAIL', e.message);
    }

    // Test pvp_leaderboard view exists
    try {
        const { error } = await supabase.from('pvp_leaderboard').select('*').limit(1);
        logTest('DB Schema', 'pvp_leaderboard view', error ? 'FAIL' : 'PASS', error?.message);
    } catch (e: any) {
        logTest('DB Schema', 'pvp_leaderboard view', 'FAIL', e.message);
    }
}

// ============================================================
// SEED DATA TESTS
// ============================================================
async function testSeedData() {
    console.log('\n🌱 Testing Seed Data...\n');

    // Test PvP agents exist
    const { data: pvpAgents } = await supabase
        .from('agent_sessions')
        .select('*')
        .in('agent_mode', ['PvP_Any', 'PvP_Target']);

    logTest('Seed Data', 'PvP agents seeded', pvpAgents && pvpAgents.length > 0 ? 'PASS' : 'FAIL',
        `Found ${pvpAgents?.length || 0} PvP agents`);

    // Test PvP matches exist
    const { data: matches } = await supabase
        .from('pvp_matches')
        .select('*')
        .eq('status', 'completed');

    logTest('Seed Data', 'PvP matches seeded', matches && matches.length > 0 ? 'PASS' : 'FAIL',
        `Found ${matches?.length || 0} matches`);

    // Test matches have round_data
    if (matches && matches.length > 0) {
        const hasRoundData = matches[0].round_data && Array.isArray(matches[0].round_data);
        logTest('Seed Data', 'Match round_data valid', hasRoundData ? 'PASS' : 'FAIL');
    }

    // Test cardinals exist
    const { data: cardinals } = await supabase
        .from('cardinal_members')
        .select('*')
        .eq('status', 'active');

    logTest('Seed Data', 'Cardinals seeded', cardinals && cardinals.length > 0 ? 'PASS' : 'FAIL',
        `Found ${cardinals?.length || 0} cardinals`);

    // Test election votes exist
    const { data: votes } = await supabase
        .from('pope_election_votes')
        .select('*');

    logTest('Seed Data', 'Election votes seeded', votes && votes.length > 0 ? 'PASS' : 'FAIL',
        `Found ${votes?.length || 0} votes`);

    // Test at least one Pope exists
    const { data: pope } = await supabase
        .from('cardinal_members')
        .select('*')
        .eq('is_pope', true);

    logTest('Seed Data', 'Pope designated', pope && pope.length > 0 ? 'PASS' : 'FAIL',
        pope?.[0]?.wallet_address || 'No Pope found');
}

// ============================================================
// API ENDPOINT TESTS
// ============================================================
async function testAPIEndpoints() {
    console.log('\n🌐 Testing API Endpoints...\n');

    const endpoints = [
        { method: 'GET', path: '/api/pvp/matches?limit=5', name: 'Get PvP Matches' },
        { method: 'GET', path: '/api/pvp/leaderboard?limit=10', name: 'Get PvP Leaderboard' },
        { method: 'GET', path: '/api/cardinal/candidates', name: 'Get Election Candidates' },
        { method: 'GET', path: '/api/cardinal/election/status', name: 'Get Election Status' },
    ];

    for (const endpoint of endpoints) {
        try {
            const res = await fetch(`${BASE_URL}${endpoint.path}`);
            const data = await res.json();

            if (res.ok && data.success !== false) {
                logTest('API', endpoint.name, 'PASS', `Status: ${res.status}`);
            } else {
                logTest('API', endpoint.name, 'FAIL', `Status: ${res.status}, Error: ${data.error || 'Unknown'}`);
            }
        } catch (e: any) {
            logTest('API', endpoint.name, 'FAIL', e.message);
        }
    }

    // Test arena match detail
    const { data: firstMatch } = await supabase
        .from('pvp_matches')
        .select('id')
        .eq('status', 'completed')
        .limit(1)
        .single();

    if (firstMatch) {
        try {
            const res = await fetch(`${BASE_URL}/api/arena/${firstMatch.id}`);
            const data = await res.json();

            logTest('API', 'Get Arena Match Detail', res.ok && data.match ? 'PASS' : 'FAIL',
                res.ok ? `Match ID: ${firstMatch.id}` : data.error);
        } catch (e: any) {
            logTest('API', 'Get Arena Match Detail', 'FAIL', e.message);
        }
    } else {
        logTest('API', 'Get Arena Match Detail', 'FAIL', 'No matches to test');
    }
}

// ============================================================
// DATA INTEGRITY TESTS
// ============================================================
async function testDataIntegrity() {
    console.log('\n🔐 Testing Data Integrity...\n');

    // Test ELO ratings are valid
    const { data: agents } = await supabase
        .from('agent_sessions')
        .select('elo_rating, agent_mode')
        .in('agent_mode', ['PvP_Any', 'PvP_Target']);

    const invalidELO = agents?.filter(a => !a.elo_rating || a.elo_rating < 0 || a.elo_rating > 5000);
    logTest('Data Integrity', 'ELO ratings valid', invalidELO?.length === 0 ? 'PASS' : 'FAIL',
        invalidELO?.length ? `${invalidELO.length} agents with invalid ELO` : undefined);

    // Test match winners are participants
    const { data: matches } = await supabase
        .from('pvp_matches')
        .select('*')
        .eq('status', 'completed');

    let invalidWinners = 0;
    matches?.forEach(m => {
        if (m.winner_id && m.winner_id !== m.player1_id && m.winner_id !== m.player2_id) {
            invalidWinners++;
        }
    });
    logTest('Data Integrity', 'Match winners are participants', invalidWinners === 0 ? 'PASS' : 'FAIL',
        invalidWinners ? `${invalidWinners} matches with invalid winners` : undefined);

    // Test election votes reference valid cardinals
    const { data: votes } = await supabase
        .from('pope_election_votes')
        .select('voter_wallet, candidate_wallet');

    const { data: cardinals } = await supabase
        .from('cardinal_members')
        .select('wallet_address');

    const cardinalWallets = new Set(cardinals?.map(c => c.wallet_address) || []);
    const invalidVotes = votes?.filter(v =>
        !cardinalWallets.has(v.voter_wallet) || !cardinalWallets.has(v.candidate_wallet)
    );

    logTest('Data Integrity', 'Election votes reference valid cardinals', invalidVotes?.length === 0 ? 'PASS' : 'FAIL',
        invalidVotes?.length ? `${invalidVotes.length} invalid vote references` : undefined);
}

// ============================================================
// SERVICE LOGIC TESTS
// ============================================================
async function testServiceLogic() {
    console.log('\n⚙️  Testing Service Logic...\n');

    // Test leaderboard calculation
    const { data: leaderboard } = await supabase
        .from('pvp_leaderboard')
        .select('*')
        .order('elo_rating', { ascending: false })
        .limit(10);

    const isSorted = leaderboard?.every((entry, i) =>
        i === 0 || entry.elo_rating <= leaderboard[i - 1].elo_rating
    );
    logTest('Service Logic', 'Leaderboard sorted by ELO', isSorted ? 'PASS' : 'FAIL');

    // Test win rate calculations
    const validWinRates = leaderboard?.every(entry => {
        const total = entry.wins + entry.losses + (entry.draws || 0);
        return entry.win_rate >= 0 && entry.win_rate <= 100 &&
            (total === 0 ? entry.win_rate === 0 : true);
    });
    logTest('Service Logic', 'Win rates calculated correctly', validWinRates ? 'PASS' : 'FAIL');

    // Test election term date is current
    const { data: votes } = await supabase
        .from('pope_election_votes')
        .select('term_date')
        .limit(1)
        .single();

    if (votes) {
        const termDate = new Date(votes.term_date);
        const now = new Date();
        const isSameMonth = termDate.getMonth() === now.getMonth() &&
            termDate.getFullYear() === now.getFullYear();
        logTest('Service Logic', 'Election term is current month', isSameMonth ? 'PASS' : 'FAIL',
            `Term: ${termDate.toISOString().split('T')[0]}`);
    }
}

// ============================================================
// MAIN TEST RUNNER
// ============================================================
async function runTests() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('   PONTIFF PVP & ELECTION - COMPREHENSIVE TEST SUITE   ');
    console.log('═══════════════════════════════════════════════════════\n');

    await testDatabaseSchema();
    await testSeedData();
    await testAPIEndpoints();
    await testDataIntegrity();
    await testServiceLogic();

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

    console.log('═══════════════════════════════════════════════════════\n');

    process.exit(failedTests > 0 ? 1 : 0);
}

runTests().catch(console.error);

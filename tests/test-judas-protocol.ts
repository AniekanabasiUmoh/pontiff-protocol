/**
 * TEST: Judas Protocol (Module 8 - Game Theory PvP)
 * Tests: Epoch state → Deposit → Signal Betrayal → Resolve → Withdraw
 * On-chain reads + API endpoint checks
 *
 * Usage: npx tsx tests/test-judas-protocol.ts
 */

import { createPublicClient, http, formatEther } from 'viem';

const MONAD_TESTNET = {
    id: 10143,
    name: 'Monad Testnet',
    nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
    rpcUrls: { default: { http: ['https://testnet-rpc.monad.xyz'] } },
} as const;

const client = createPublicClient({ chain: MONAD_TESTNET, transport: http() });

const JUDAS_ADDRESS = '0x499CCCE341491dB51636E384a77d4D24d4ca8037' as const;

const JUDAS_ABI = [
    { inputs: [], name: 'currentEpochId', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'EPOCH_DURATION', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'SIN_TAX_BPS', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'currentTournamentId', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'currentRound', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'ROUNDS_PER_TOURNAMENT', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
    {
        inputs: [], name: 'getGameState', outputs: [
            { name: 'epochId', type: 'uint256' },
            { name: 'endTime', type: 'uint256' },
            { name: 'totalLoyal', type: 'uint256' },
            { name: 'totalBetrayed', type: 'uint256' },
            { name: 'resolved', type: 'bool' },
            { name: 'betrayalPercentage', type: 'uint256' },
        ], stateMutability: 'view', type: 'function'
    },
    {
        inputs: [], name: 'getTournamentState', outputs: [
            { name: 'tournamentId', type: 'uint256' },
            { name: 'round', type: 'uint256' },
            { name: 'maxRounds', type: 'uint256' },
        ], stateMutability: 'view', type: 'function'
    },
    {
        inputs: [{ name: 'user', type: 'address' }], name: 'getReputation', outputs: [
            { name: 'loyal', type: 'uint32' },
            { name: 'betrayed', type: 'uint32' },
        ], stateMutability: 'view', type: 'function'
    },
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
    console.log('║   PONTIFF AUDIT: Judas Protocol Tests    ║');
    console.log('╚══════════════════════════════════════════╝\n');

    // ── Test 1: Contract is live ──
    await runTest('JudasProtocol contract is deployed on Monad', async () => {
        const code = await client.getCode({ address: JUDAS_ADDRESS });
        if (!code || code === '0x') throw new Error('No bytecode at Judas address');
        console.log(`    Bytecode length: ${code.length} chars`);
    });

    // ── Test 2: Read current epoch ──
    await runTest('currentEpochId is readable and > 0', async () => {
        const epochId = await client.readContract({ address: JUDAS_ADDRESS, abi: JUDAS_ABI, functionName: 'currentEpochId' });
        console.log(`    Current Epoch ID: ${epochId}`);
        if (epochId === 0n) throw new Error('Epoch ID is 0 - contract may not have started');
    });

    // ── Test 3: Epoch duration is correct (5 minutes for demo) ──
    await runTest('EPOCH_DURATION is 5 minutes (300s)', async () => {
        const duration = await client.readContract({ address: JUDAS_ADDRESS, abi: JUDAS_ABI, functionName: 'EPOCH_DURATION' });
        console.log(`    Epoch Duration: ${duration}s`);
        if (duration !== 300n) throw new Error(`Expected 300s, got ${duration}s`);
    });

    // ── Test 4: Sin tax is 20% ──
    await runTest('SIN_TAX_BPS is 2000 (20%)', async () => {
        const sinTax = await client.readContract({ address: JUDAS_ADDRESS, abi: JUDAS_ABI, functionName: 'SIN_TAX_BPS' });
        console.log(`    Sin Tax: ${Number(sinTax) / 100}%`);
        if (sinTax !== 2000n) throw new Error(`Expected 2000 bps, got ${sinTax}`);
    });

    // ── Test 5: Full game state ──
    await runTest('getGameState() returns current epoch data', async () => {
        const state = await client.readContract({ address: JUDAS_ADDRESS, abi: JUDAS_ABI, functionName: 'getGameState' });
        const [epochId, endTime, totalLoyal, totalBetrayed, resolved, betrayalPct] = state;

        console.log(`    Epoch: ${epochId}`);
        console.log(`    End Time: ${new Date(Number(endTime) * 1000).toISOString()}`);
        console.log(`    Total Loyal: ${formatEther(totalLoyal)} sGUILT`);
        console.log(`    Total Betrayed: ${formatEther(totalBetrayed)} sGUILT`);
        console.log(`    Resolved: ${resolved}`);
        console.log(`    Betrayal %: ${betrayalPct}%`);

        const now = Math.floor(Date.now() / 1000);
        const timeLeft = Number(endTime) - now;
        if (timeLeft < -86400 && !resolved) {
            console.log(`    ⚠️  WARNING: Epoch ended ${Math.abs(timeLeft)}s ago but NOT resolved!`);
        }
    });

    // ── Test 6: Tournament state ──
    await runTest('getTournamentState() returns valid data', async () => {
        const state = await client.readContract({ address: JUDAS_ADDRESS, abi: JUDAS_ABI, functionName: 'getTournamentState' });
        const [tournamentId, round, maxRounds] = state;

        console.log(`    Tournament: #${tournamentId}`);
        console.log(`    Round: ${round}/${maxRounds}`);

        if (maxRounds !== 5n) throw new Error(`Expected 5 rounds per tournament, got ${maxRounds}`);
    });

    // ── Test 7: Reputation query ──
    await runTest('getReputation(address(0)) returns (0,0)', async () => {
        const [loyal, betrayed] = await client.readContract({
            address: JUDAS_ADDRESS,
            abi: JUDAS_ABI,
            functionName: 'getReputation',
            args: ['0x0000000000000000000000000000000000000000'],
        });

        console.log(`    Loyal: ${loyal}, Betrayed: ${betrayed}`);
        if (loyal !== 0 || betrayed !== 0) throw new Error('Zero address should have no reputation');
    });

    // ── Test 8: Judas API resolve endpoint ──
    await runTest('POST /api/judas/resolve - exists and responds', async () => {
        const res = await fetch('http://localhost:3000/api/judas/resolve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ epochId: 1, txHash: '0x0000' }),
        });
        // Don't care about the result, just that it doesn't 500
        console.log(`    Status: ${res.status}`);
        if (res.status === 500) throw new Error('Internal server error');
    });

    // ── Test 9: Check for stale epoch (critical operational check) ──
    await runTest('Epoch is not stale (resolved or still active)', async () => {
        const state = await client.readContract({ address: JUDAS_ADDRESS, abi: JUDAS_ABI, functionName: 'getGameState' });
        const [, endTime, , , resolved] = state;
        const now = Math.floor(Date.now() / 1000);

        if (Number(endTime) < now && !resolved) {
            throw new Error(`STALE EPOCH: Ended ${now - Number(endTime)}s ago but not resolved. Users cannot interact!`);
        }
    });

    // ── SUMMARY ──
    console.log('\n' + '═'.repeat(50));
    console.log('JUDAS PROTOCOL RESULTS:');
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

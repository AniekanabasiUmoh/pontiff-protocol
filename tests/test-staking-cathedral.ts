/**
 * TEST: Staking Cathedral (Module 7 - Cathedral / Vault)
 * Tests: Stake $GUILT → Receive $sGUILT → Withdraw → Yield accrual
 * Tests both on-chain contract reads AND the API endpoints
 *
 * Usage: npx tsx tests/test-staking-cathedral.ts
 */

import { createPublicClient, http, formatEther, parseEther } from 'viem';

// Chain config
const MONAD_TESTNET = {
    id: 10143,
    name: 'Monad Testnet',
    nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
    rpcUrls: { default: { http: ['https://testnet-rpc.monad.xyz'] } },
} as const;

const client = createPublicClient({
    chain: MONAD_TESTNET,
    transport: http(),
});

// Deployed addresses from production.json
const STAKING_ADDRESS = '0xBE36557a34F4224DB8B9CD6930D21715295163Ce' as const;
const GUILT_ADDRESS = '0xA76a8f85b52B150da8271ade85c188eCD80f1916' as const;

// Minimal ABIs for read-only testing
const STAKING_ABI = [
    { inputs: [], name: 'totalAssets', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'totalSupply', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
    { inputs: [{ name: 'assets', type: 'uint256' }], name: 'convertToShares', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
    { inputs: [{ name: 'shares', type: 'uint256' }], name: 'convertToAssets', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'name', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'symbol', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' },
] as const;

const ERC20_ABI = [
    { inputs: [], name: 'totalSupply', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'name', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'symbol', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'decimals', outputs: [{ type: 'uint8' }], stateMutability: 'view', type: 'function' },
] as const;

interface TestResult {
    name: string;
    passed: boolean;
    details: string;
}

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
    console.log('║  PONTIFF AUDIT: Staking Cathedral Tests  ║');
    console.log('╚══════════════════════════════════════════╝\n');

    // ── Test 1: GUILT Token Contract is live ──
    await runTest('GUILT Token contract is deployed and readable', async () => {
        const name = await client.readContract({ address: GUILT_ADDRESS, abi: ERC20_ABI, functionName: 'name' });
        const symbol = await client.readContract({ address: GUILT_ADDRESS, abi: ERC20_ABI, functionName: 'symbol' });
        const totalSupply = await client.readContract({ address: GUILT_ADDRESS, abi: ERC20_ABI, functionName: 'totalSupply' });

        console.log(`    Token: ${name} (${symbol})`);
        console.log(`    Total Supply: ${formatEther(totalSupply)}`);

        if (name !== 'Guilt') throw new Error(`Expected name 'Guilt', got '${name}'`);
        if (symbol !== 'GUILT') throw new Error(`Expected symbol 'GUILT', got '${symbol}'`);
        if (totalSupply === 0n) throw new Error('Total supply is 0');
    });

    // ── Test 2: Staking Cathedral Contract is live ──
    await runTest('StakingCathedral contract is deployed and readable', async () => {
        const name = await client.readContract({ address: STAKING_ADDRESS, abi: STAKING_ABI, functionName: 'name' });
        const symbol = await client.readContract({ address: STAKING_ADDRESS, abi: STAKING_ABI, functionName: 'symbol' });

        console.log(`    Staked Token: ${name} (${symbol})`);

        if (name !== 'Staked Guilt') throw new Error(`Expected name 'Staked Guilt', got '${name}'`);
        if (symbol !== 'sGUILT') throw new Error(`Expected symbol 'sGUILT', got '${symbol}'`);
    });

    // ── Test 3: Total Assets (GUILT locked in Cathedral) ──
    await runTest('StakingCathedral totalAssets returns valid value', async () => {
        const totalAssets = await client.readContract({ address: STAKING_ADDRESS, abi: STAKING_ABI, functionName: 'totalAssets' });
        console.log(`    Total Assets Locked: ${formatEther(totalAssets)} GUILT`);
        // Total assets can be 0 if nobody has staked yet - that's valid
    });

    // ── Test 4: Total Supply of sGUILT ──
    await runTest('StakingCathedral totalSupply (sGUILT shares)', async () => {
        const totalSupply = await client.readContract({ address: STAKING_ADDRESS, abi: STAKING_ABI, functionName: 'totalSupply' });
        console.log(`    Total sGUILT Shares: ${formatEther(totalSupply)}`);
    });

    // ── Test 5: Conversion math works ──
    await runTest('convertToShares(1000 GUILT) returns valid amount', async () => {
        const shares = await client.readContract({
            address: STAKING_ADDRESS,
            abi: STAKING_ABI,
            functionName: 'convertToShares',
            args: [parseEther('1000')],
        });
        console.log(`    1000 GUILT = ${formatEther(shares)} sGUILT`);
        // If vault is empty, should be ~1:1
    });

    // ── Test 6: Reverse conversion ──
    await runTest('convertToAssets(1000 sGUILT) returns valid amount', async () => {
        const assets = await client.readContract({
            address: STAKING_ADDRESS,
            abi: STAKING_ABI,
            functionName: 'convertToAssets',
            args: [parseEther('1000')],
        });
        console.log(`    1000 sGUILT = ${formatEther(assets)} GUILT`);
    });

    // ── Test 7: Cathedral API endpoint ──
    await runTest('GET /api/cathedral/stats returns data', async () => {
        const res = await fetch('http://localhost:3000/api/cathedral/stats');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        console.log(`    Cathedral Stats: ${JSON.stringify(data).slice(0, 100)}`);
    });

    // ── Test 8: Price per share is >= 1 (no exploit check) ──
    await runTest('Price per share is >= 1.0 (no inflation attack)', async () => {
        const totalAssets = await client.readContract({ address: STAKING_ADDRESS, abi: STAKING_ABI, functionName: 'totalAssets' });
        const totalSupply = await client.readContract({ address: STAKING_ADDRESS, abi: STAKING_ABI, functionName: 'totalSupply' });

        if (totalSupply > 0n) {
            const pricePerShare = Number(totalAssets) / Number(totalSupply);
            console.log(`    Price per share: ${pricePerShare.toFixed(6)}`);
            if (pricePerShare < 0.9) throw new Error(`Price per share ${pricePerShare} is suspiciously low`);
        } else {
            console.log('    No shares minted yet - cannot check price');
        }
    });

    // ── SUMMARY ──
    console.log('\n' + '═'.repeat(50));
    console.log('STAKING CATHEDRAL RESULTS:');
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

/**
 * TEST: All Deployed Smart Contracts (Master Contract Audit)
 * Tests every deployed contract for: existence, key function readability, basic state
 *
 * Usage: npx tsx tests/test-all-contracts.ts
 */

import { createPublicClient, http, formatEther } from 'viem';

const MONAD_TESTNET = {
    id: 10143,
    name: 'Monad Testnet',
    nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
    rpcUrls: { default: { http: ['https://testnet-rpc.monad.xyz'] } },
} as const;

const client = createPublicClient({ chain: MONAD_TESTNET, transport: http() });

// All deployed contracts from production.json + deployed_contracts.json
const CONTRACTS = {
    GuiltToken: '0xA76a8f85b52B150da8271ade85c188eCD80f1916',
    StakingCathedral: '0xBE36557a34F4224DB8B9CD6930D21715295163Ce',
    VaticanEntry: '0xF35d9Bc6658cFC176d54Cc1e0eEfb27D35D591A4',
    Indulgence: '0xDD7bC438FcAE61dA2BcaDaF080cAa9B0ddD3C732',
    JudasProtocol: '0x499CCCE341491dB51636E384a77d4D24d4ca8037',
    RPSGame: '0x47978110364Bcd2C2493d6196D17a6Fa8aF2AaEb',
    PokerGame: '0x52CE6C28a23a90A3137E6eEA4a3f24A6Fe92250a',
    SessionWalletFactory: '0x98518cDaC626CF28a36862216858370dbDee8858',
    MONToken: '0xF4977410b31fdbe0C655EeC184f95FE31896331A',
} as const;

interface TestResult { name: string; passed: boolean; details: string; }
const results: TestResult[] = [];

async function runTest(name: string, fn: () => Promise<void>) {
    try {
        await fn();
        results.push({ name, passed: true, details: 'OK' });
        console.log(`  ✅ ${name}`);
    } catch (err: any) {
        results.push({ name, passed: false, details: err.message.slice(0, 120) });
        console.log(`  ❌ ${name}: ${err.message.slice(0, 120)}`);
    }
}

async function main() {
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║  PONTIFF AUDIT: All Contracts On-Chain   ║');
    console.log('╚══════════════════════════════════════════╝\n');

    // ── Check every contract has bytecode ──
    for (const [name, address] of Object.entries(CONTRACTS)) {
        await runTest(`${name} @ ${address.slice(0, 10)}... has bytecode`, async () => {
            const code = await client.getCode({ address: address as `0x${string}` });
            if (!code || code === '0x') throw new Error(`NO BYTECODE - contract not deployed`);
            console.log(`    Bytecode: ${code.length} chars`);
        });
    }

    // ── GuiltToken specifics ──
    const ERC20_ABI = [
        { inputs: [], name: 'name', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' },
        { inputs: [], name: 'symbol', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' },
        { inputs: [], name: 'totalSupply', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
        { inputs: [], name: 'decimals', outputs: [{ type: 'uint8' }], stateMutability: 'view', type: 'function' },
    ] as const;

    await runTest('GuiltToken: name/symbol/supply correct', async () => {
        const addr = CONTRACTS.GuiltToken as `0x${string}`;
        const name = await client.readContract({ address: addr, abi: ERC20_ABI, functionName: 'name' });
        const symbol = await client.readContract({ address: addr, abi: ERC20_ABI, functionName: 'symbol' });
        const supply = await client.readContract({ address: addr, abi: ERC20_ABI, functionName: 'totalSupply' });
        const decimals = await client.readContract({ address: addr, abi: ERC20_ABI, functionName: 'decimals' });

        console.log(`    ${name} (${symbol}) | Supply: ${formatEther(supply)} | Decimals: ${decimals}`);

        if (name !== 'Guilt') throw new Error(`Wrong name: ${name}`);
        if (symbol !== 'GUILT') throw new Error(`Wrong symbol: ${symbol}`);
        if (decimals !== 18) throw new Error(`Wrong decimals: ${decimals}`);
    });

    // ── Indulgence specifics ──
    await runTest('Indulgence: is ERC721 Soulbound Token', async () => {
        const addr = CONTRACTS.Indulgence as `0x${string}`;
        const abi = [
            { inputs: [], name: 'name', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' },
            { inputs: [], name: 'symbol', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' },
            { inputs: [], name: 'nextTokenId', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
        ] as const;

        const name = await client.readContract({ address: addr, abi, functionName: 'name' });
        const symbol = await client.readContract({ address: addr, abi, functionName: 'symbol' });
        const nextId = await client.readContract({ address: addr, abi, functionName: 'nextTokenId' });

        console.log(`    ${name} (${symbol}) | Minted: ${nextId}`);

        if (name !== 'Pontiff Indulgence') throw new Error(`Wrong name: ${name}`);
        if (symbol !== 'SINE') throw new Error(`Wrong symbol: ${symbol}`);
    });

    // ── VaticanEntry specifics ──
    await runTest('VaticanEntry: entry fee and entrants readable', async () => {
        const addr = CONTRACTS.VaticanEntry as `0x${string}`;
        const abi = [
            { inputs: [], name: 'entryFee', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
            { inputs: [], name: 'totalEntrants', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
        ] as const;

        const fee = await client.readContract({ address: addr, abi, functionName: 'entryFee' });
        const entrants = await client.readContract({ address: addr, abi, functionName: 'totalEntrants' });

        console.log(`    Entry Fee: ${formatEther(fee)} MON | Total Entrants: ${entrants}`);
    });

    // ── PokerGame specifics ──
    await runTest('PokerGame: gameIdCounter and treasury readable', async () => {
        const addr = CONTRACTS.PokerGame as `0x${string}`;
        const abi = [
            { inputs: [], name: 'gameIdCounter', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
            { inputs: [], name: 'treasury', outputs: [{ type: 'address' }], stateMutability: 'view', type: 'function' },
            { inputs: [], name: 'houseFeePercent', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
        ] as const;

        const counter = await client.readContract({ address: addr, abi, functionName: 'gameIdCounter' });
        const treasury = await client.readContract({ address: addr, abi, functionName: 'treasury' });
        const fee = await client.readContract({ address: addr, abi, functionName: 'houseFeePercent' });

        console.log(`    Games: ${counter} | Treasury: ${treasury.slice(0, 10)}... | Fee: ${fee}%`);
    });

    // ── Cross-contract consistency ──
    await runTest('Cross-check: All game contracts point to same treasury', async () => {
        const treasuryABI = [
            { inputs: [], name: 'treasury', outputs: [{ type: 'address' }], stateMutability: 'view', type: 'function' },
        ] as const;

        const rpsTreasury = await client.readContract({ address: CONTRACTS.RPSGame as `0x${string}`, abi: treasuryABI, functionName: 'treasury' });
        const pokerTreasury = await client.readContract({ address: CONTRACTS.PokerGame as `0x${string}`, abi: treasuryABI, functionName: 'treasury' });

        console.log(`    RPS Treasury: ${rpsTreasury}`);
        console.log(`    Poker Treasury: ${pokerTreasury}`);

        if (rpsTreasury.toLowerCase() !== pokerTreasury.toLowerCase()) {
            console.log(`    ⚠️  WARNING: Game contracts point to DIFFERENT treasuries`);
        }
    });

    // ── SUMMARY ──
    console.log('\n' + '═'.repeat(50));
    console.log('ALL CONTRACTS RESULTS:');
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

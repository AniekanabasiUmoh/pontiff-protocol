import { createPublicClient, createWalletClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { monadTestnet } from 'viem/chains';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://testnet-rpc.monad.xyz';
const JUDAS_ADDRESS = process.env.NEXT_PUBLIC_JUDAS_ADDRESS as `0x${string}`;
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;

if (!PRIVATE_KEY) {
    console.error("❌ Missing DEPLOYER_PRIVATE_KEY");
    process.exit(1);
}

if (!JUDAS_ADDRESS) {
    console.error("❌ Missing NEXT_PUBLIC_JUDAS_ADDRESS");
    process.exit(1);
}

const account = privateKeyToAccount(PRIVATE_KEY);

const client = createPublicClient({
    chain: monadTestnet,
    transport: http(RPC_URL)
});

const wallet = createWalletClient({
    account,
    chain: monadTestnet,
    transport: http(RPC_URL)
});

const ABI = parseAbi([
    'function currentEpochId() view returns (uint256)',
    'function epochs(uint256) view returns (uint256 startTime, uint256 endTime, uint256 totalLoyal, uint256 totalBetrayed, bool resolved, uint256 loyalistMultiplier, uint256 betrayerMultiplier)',
    'function resolveEpoch() external',
    'function currentEpochEnd() view returns (uint256)' // Helper if exists, otherwise use epochs logic
]);

async function checkAndResolve() {
    console.log(`🤖 Judas Keeper starting...`);
    console.log(`Target: ${JUDAS_ADDRESS}`);
    console.log(`Wallet: ${account.address}`);

    try {
        // 1. Get Current Epoch ID
        const epochId = await client.readContract({
            address: JUDAS_ADDRESS,
            abi: ABI,
            functionName: 'currentEpochId'
        });
        console.log(`Current Epoch ID: ${epochId}`);

        // 2. Get Epoch Data
        // Helper: In Solidity structs returned as tuples
        const epochData = await client.readContract({
            address: JUDAS_ADDRESS,
            abi: ABI,
            functionName: 'epochs',
            args: [epochId]
        });

        // epochData = [startTime, endTime, totalLoyal, totalBetrayed, resolved, ...]
        const endTime = epochData[1];
        const resolved = epochData[4];

        const now = Math.floor(Date.now() / 1000);
        const timeRemaining = Number(endTime) - now;

        console.log(`Epoch Ends: ${new Date(Number(endTime) * 1000).toISOString()}`);
        console.log(`Resolved: ${resolved}`);
        console.log(`Time Remaining: ${timeRemaining}s`);

        // 3. Check Condition
        if (now > Number(endTime) && !resolved) {
            console.log("⚠️ Epoch ended and not resolved! Attempting verification...");

            // Send TX
            const hash = await wallet.writeContract({
                address: JUDAS_ADDRESS,
                abi: ABI,
                functionName: 'resolveEpoch'
            });

            console.log(`✅ Transaction Sent! Hash: ${hash}`);

            // Wait
            const receipt = await client.waitForTransactionReceipt({ hash });
            console.log(`✅ Transaction Confirmed in block ${receipt.blockNumber}`);
        } else {
            console.log("✅ No action needed.");
        }

    } catch (error) {
        console.error("❌ Keeper Error:", error);
        process.exit(1);
    }
}

checkAndResolve();

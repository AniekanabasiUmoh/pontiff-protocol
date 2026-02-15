import { createPublicClient, http, formatEther, parseEther } from 'viem';
import { monadTestnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { JudasProtocolABI, StakingCathedralABI } from '../app/abis';
import { JudasStrategy } from '../lib/ai/judas-strategy';
import dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function main() {
    console.log("⚔️ Starting Judas Agent Verification ⚔️");

    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://monad-testnet.g.alchemy.com/v2/demo';
    const judasAddress = process.env.NEXT_PUBLIC_JUDAS_ADDRESS as `0x${string}`;
    const tokenAddress = process.env.NEXT_PUBLIC_STAKING_ADDRESS as `0x${string}`;
    const privateKey = process.env.JUDAS_AGENT_PRIVATE_KEY as `0x${string}`;

    if (!judasAddress || !privateKey) {
        console.error("❌ Missing configuration. Check .env.local");
        process.exit(1);
    }

    const client = createPublicClient({
        chain: monadTestnet,
        transport: http(rpcUrl)
    });

    const account = privateKeyToAccount(privateKey);
    console.log(`🤖 Agent Address: ${account.address}`);

    // 1. Check Native Balance
    const balance = await client.getBalance({ address: account.address });
    console.log(`💰 Native Balance: ${formatEther(balance)} MON`);

    if (balance < parseEther("0.01")) {
        console.error("❌ Insufficient MON for gas.");
        return;
    }

    // 2. Check sGUILT Balance
    const sGuiltBalance = await client.readContract({
        address: tokenAddress,
        abi: StakingCathedralABI,
        functionName: 'balanceOf',
        args: [account.address]
    });
    console.log(`📜 sGUILT Balance: ${formatEther(sGuiltBalance)} sGUILT`);

    if (sGuiltBalance < parseEther("1")) {
        console.error("❌ Insufficient sGUILT to stake.");
        // We could mint or stake here if we had keys, but for verification we just report.
        return;
    }

    // 3. Check Allowance
    const allowance = await client.readContract({
        address: tokenAddress,
        abi: StakingCathedralABI,
        functionName: 'allowance',
        args: [account.address, judasAddress]
    });
    console.log(`🔓 Allowance: ${formatEther(allowance)} sGUILT`);

    if (allowance < parseEther("1")) {
        console.warn("⚠️ Allowance too low. Agent might fail if not auto-approving.");
    }

    // 4. Run Strategy (AutoStake)
    console.log("\n🧪 Triggering AutoStake Strategy...");
    // We pass a mock epoch ID, but the contract uses currentEpochId. The strategy uses it for logging/deciding.
    const currentEpoch = await client.readContract({
        address: judasAddress,
        abi: JudasProtocolABI,
        functionName: 'currentEpochId'
    });
    console.log(`📅 Current Epoch on Chain: ${currentEpoch}`);

    // Call the AI function
    const result = await JudasStrategy.autoStakePontiff(Number(currentEpoch));

    console.log("\n📊 Result:");
    console.log(result);

    if (result.success && result.txHash) {
        console.log(`✅ SUCCESS! Tx: ${result.txHash}`);
    } else {
        console.log("❌ FAILED or Skipped.");
    }
}

main().catch(console.error);

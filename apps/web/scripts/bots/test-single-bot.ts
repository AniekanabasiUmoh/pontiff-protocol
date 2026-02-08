import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
const DEPLOYER_KEY = process.env.PONTIFF_PRIVATE_KEY!;
const GUILT_ADDRESS = process.env.NEXT_PUBLIC_GUILT_ADDRESS!;
const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_SESSION_WALLET_FACTORY_ADDRESS!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ERC20_ABI = [
    "function transfer(address to, uint256 amount) returns (bool)",
    "function balanceOf(address owner) view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)"
];

const FACTORY_ABI = [
    "function createSession(uint256 _depositAmount, uint256 _stopLoss, uint256 _sessionFee, uint256 _durationHours) external returns (address sessionWallet)",
    "event SessionCreated(address indexed user, address indexed sessionWallet, uint256 depositAmount, uint256 stopLoss, uint256 expiresAt)"
];

async function main() {
    console.log("🧪 TESTING SINGLE BOT DEPLOYMENT");
    console.log("=================================\n");

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const deployer = new ethers.Wallet(DEPLOYER_KEY, provider);

    console.log("Deployer Address:", deployer.address);

    // Check deployer balances
    const deployerMon = await provider.getBalance(deployer.address);
    const guiltContract = new ethers.Contract(GUILT_ADDRESS, ERC20_ABI, deployer);
    const deployerGuilt = await guiltContract.balanceOf(deployer.address);

    console.log("Deployer MON:", ethers.formatEther(deployerMon));
    console.log("Deployer GUILT:", ethers.formatEther(deployerGuilt));
    console.log("");

    // Create test bot
    const testBot = ethers.Wallet.createRandom();
    console.log("Test Bot Created:", testBot.address);
    console.log("");

    // Step 1: Fund bot with MON
    console.log("Step 1: Funding bot with 1.0 MON...");
    const monTx = await deployer.sendTransaction({
        to: testBot.address,
        value: ethers.parseEther("1.0")
    });
    await monTx.wait();
    console.log("✅ MON sent");
    console.log("");

    // Step 2: Fund bot with GUILT
    const depositAmount = 100;
    const feeBuffer = 5;
    const totalGuilt = depositAmount + feeBuffer;

    console.log(`Step 2: Funding bot with ${totalGuilt} GUILT...`);
    const guiltTx = await guiltContract.transfer(
        testBot.address,
        ethers.parseEther(totalGuilt.toString())
    );
    await guiltTx.wait();
    console.log("✅ GUILT sent");
    console.log("");

    // Verify bot balances
    const botMon = await provider.getBalance(testBot.address);
    const botGuilt = await guiltContract.balanceOf(testBot.address);
    console.log("Bot Balances:");
    console.log("  MON:", ethers.formatEther(botMon));
    console.log("  GUILT:", ethers.formatEther(botGuilt));
    console.log("");

    // Step 3: Approve factory
    const botWallet = new ethers.Wallet(testBot.privateKey, provider);
    const botGuiltContract = guiltContract.connect(botWallet);
    const fee = ethers.parseEther("1");
    const deposit = ethers.parseEther(depositAmount.toString());
    const totalAmount = deposit + fee;

    console.log("Step 3: Approving factory...");
    console.log(`  Approving ${ethers.formatEther(totalAmount)} GUILT`);
    const approveTx = await botGuiltContract.approve(FACTORY_ADDRESS, totalAmount, {
        gasLimit: 100000
    });
    await approveTx.wait();
    console.log("✅ Factory approved");
    console.log("");

    // Step 4: Create session
    const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, botWallet);
    const stopLoss = deposit * 10n / 100n; // 10% of deposit
    const duration = 24;

    console.log("Step 4: Creating session...");
    console.log(`  Deposit: ${ethers.formatEther(deposit)} GUILT`);
    console.log(`  Stop Loss: ${ethers.formatEther(stopLoss)} GUILT`);
    console.log(`  Fee: ${ethers.formatEther(fee)} GUILT`);
    console.log(`  Duration: ${duration} hours`);
    console.log(`  Gas Limit: 7,000,000`);
    console.log("");

    try {
        const createTx = await factory.createSession(deposit, stopLoss, fee, duration, {
            gasLimit: 7000000
        });

        console.log("📡 Transaction sent:", createTx.hash);
        console.log("⏳ Waiting for confirmation...");

        const receipt = await createTx.wait();
        console.log("✅ Transaction confirmed!");
        console.log(`   Block: ${receipt.blockNumber}`);
        console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);
        console.log("");

        // Parse event
        let sessionWalletAddress = null;
        for (const log of receipt.logs) {
            try {
                const parsed = factory.interface.parseLog(log);
                if (parsed && parsed.name === 'SessionCreated') {
                    sessionWalletAddress = parsed.args.sessionWallet;
                    break;
                }
            } catch (e) { }
        }

        if (!sessionWalletAddress) {
            console.error("❌ Failed to find SessionCreated event");
            return;
        }

        console.log("✅ Session Wallet Created:", sessionWalletAddress);
        console.log("");

        // Step 5: Insert into database
        console.log("Step 5: Inserting into database...");
        const { data, error } = await supabase
            .from('agent_sessions')
            .insert({
                user_wallet: botWallet.address,
                session_wallet: sessionWalletAddress,
                strategy: 'berzerker',
                starting_balance: depositAmount,
                current_balance: depositAmount,
                stop_loss: Number(ethers.formatEther(stopLoss)),
                take_profit: depositAmount * 2,
                status: 'active',
                expires_at: new Date(Date.now() + duration * 3600 * 1000).toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error("❌ DB Insert Failed:", error);
        } else {
            console.log("✅ DB Record Created");
            console.log(`   Session ID: ${data.id}`);
            console.log("");
        }

        // Success summary
        console.log("=================================");
        console.log("🎉 SINGLE BOT TEST SUCCESSFUL");
        console.log("=================================");
        console.log("");
        console.log("Summary:");
        console.log("  Bot Address:", botWallet.address);
        console.log("  Session Wallet:", sessionWalletAddress);
        console.log("  Session ID:", data?.id || 'N/A');
        console.log("  Gas Used:", receipt.gasUsed.toString());
        console.log("  Cost (MON):", ethers.formatEther(receipt.gasUsed * receipt.gasPrice));
        console.log("");
        console.log("✅ All systems operational!");
        console.log("✅ Ready to deploy full swarm!");

    } catch (error: any) {
        console.error("=================================");
        console.error("❌ TEST FAILED");
        console.error("=================================");
        console.error("");
        console.error("Error:", error.message);

        if (error.data) {
            console.error("Data:", error.data);
        }

        if (error.transaction) {
            console.error("Transaction:", error.transaction);
        }

        console.error("");
        console.error("🔍 Troubleshooting:");
        console.error("1. Check RPC is responding");
        console.error("2. Verify factory address is correct");
        console.error("3. Ensure bot has enough GUILT and MON");
        console.error("4. Try increasing gas limit further");
    }
}

main().catch(console.error);

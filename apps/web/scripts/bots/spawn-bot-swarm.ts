import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import personalities from './bot-personalities.json';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_SESSION_WALLET_FACTORY_ADDRESS!;
const GUILT_ADDRESS = process.env.NEXT_PUBLIC_GUILT_ADDRESS!;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!RPC_URL || !FACTORY_ADDRESS || !GUILT_ADDRESS || !SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing environment variables.");
    process.exit(1);
}

const WALLETS_FILE = path.join(__dirname, 'wallets.json');
const SESSIONS_FILE = path.join(__dirname, 'sessions.json');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address owner) view returns (uint256)"
];

const FACTORY_ABI = [
    "function createSession(uint256 _depositAmount, uint256 _stopLoss, uint256 _sessionFee, uint256 _durationHours) external returns (address sessionWallet)",
    "event SessionCreated(address indexed user, address indexed sessionWallet, uint256 depositAmount, uint256 stopLoss, uint256 expiresAt)"
];

async function main() {
    console.log("Starting Bot Swarm Spawn...");

    if (!fs.existsSync(WALLETS_FILE)) {
        console.error("Wallets file not found. Run fund-bots.ts first.");
        process.exit(1);
    }

    const wallets = JSON.parse(fs.readFileSync(WALLETS_FILE, 'utf8'));
    const provider = new ethers.JsonRpcProvider(RPC_URL);

    // Existing sessions tracker
    let sessions: Record<string, any> = {};
    if (fs.existsSync(SESSIONS_FILE)) {
        sessions = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
    }

    const sessionFee = ethers.parseEther("0.1"); // Assuming 0.1 GUILT fee? Need to verify contract?
    // Actually factory doesn't enforce fee amount in createSession, it's passed as arg?
    // Let's check contract code.
    // createSession(amount, stopLoss, fee, duration).
    // The fee is transferred from user to factory.
    // We should probably set fee to 0 or 1 for testing.
    const fee = ethers.parseEther("1");

    // Limit to 14 bots to conserve MON (7 MON used, 3 MON reserve)
    const MAX_BOTS = 14;
    let botsDeployed = 0;

    for (const bot of personalities) {
        if (botsDeployed >= MAX_BOTS) {
            console.log(`\n✅ Reached target of ${MAX_BOTS} bots. Stopping deployment.`);
            console.log(`   Remaining bots can be deployed later if needed.`);
            break;
        }
        if (sessions[bot.name]) {
            console.log(`Session already exists for ${bot.name}. Skipping.`);
            continue;
        }

        const walletData = wallets[bot.name];
        if (!walletData) {
            console.error(`No wallet found for ${bot.name}`);
            continue;
        }

        const wallet = new ethers.Wallet(walletData.privateKey, provider);
        const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, wallet);
        const guilt = new ethers.Contract(GUILT_ADDRESS, ERC20_ABI, wallet);

        console.log(`Spawning session for ${bot.name} (${wallet.address})...`);

        try {
            const depositAmount = ethers.parseEther(bot.initialDeposit.toString());
            const totalAmount = depositAmount + fee;

            // 1. Approve
            console.log(`  Approving ${ethers.formatEther(totalAmount)} GUILT...`);
            const approveTx = await guilt.approve(FACTORY_ADDRESS, totalAmount, {
                gasLimit: 100000 // Force gas limit for approve
            });
            await approveTx.wait();

            // 2. Create Session
            const stopLoss = ethers.parseEther("10"); // Static stop loss for now? Or based on risk?
            // Risk Profile: High = low stop loss?
            // Let's make stop loss 10% of deposit.
            const sl = depositAmount * 10n / 100n;
            const duration = 24; // 24 hours

            console.log(`  Creating Session (with forced gas limit to bypass RPC estimation)...`);
            const tx = await factory.createSession(depositAmount, sl, fee, duration, {
                gasLimit: 7000000 // Force 7M gas - increased per guide
            });
            const receipt = await tx.wait();

            // 3. Parse Event
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
                console.error("  Failed to find SessionCreated event.");
                continue;
            }

            console.log(`  Session Created: ${sessionWalletAddress}`);

            // 4. Save to DB
            const { data, error } = await supabase
                .from('agent_sessions')
                .insert({
                    user_wallet: wallet.address,
                    session_wallet: sessionWalletAddress,
                    strategy: bot.strategy,
                    starting_balance: bot.initialDeposit,
                    current_balance: bot.initialDeposit,
                    stop_loss: Number(ethers.formatEther(sl)),
                    take_profit: bot.initialDeposit * 2, // 2x take profit
                    status: 'active',
                    expires_at: new Date(Date.now() + duration * 3600 * 1000).toISOString()
                })
                .select()
                .single();

            if (error) {
                console.error("  DB Insert Failed:", error);
            } else {
                console.log(`  DB Record Created: ${data.id}`);
                sessions[bot.name] = {
                    sessionId: data.id,
                    sessionWallet: sessionWalletAddress,
                    botName: bot.name
                };
                fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
                botsDeployed++; // Increment counter on success
            }

        } catch (e) {
            console.error(`  Spawn Failed:`, e);
        }
    }

    console.log("Swarm Spawn Complete.");
}

main().catch(console.error);

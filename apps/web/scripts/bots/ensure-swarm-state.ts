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

const WALLETS_FILE = path.join(__dirname, 'wallets.json');
const SESSIONS_FILE = path.join(__dirname, 'sessions.json');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address owner) view returns (uint256)"
];

const FACTORY_ABI = [
    "function createSession(uint256 _depositAmount, uint256 _stopLoss, uint256 _sessionFee, uint256 _durationHours) external returns (address sessionWallet)",
    "function getUserSessions(address _user) external view returns (tuple(address userWallet, address sessionWallet, uint256 depositAmount, uint256 stopLoss, uint256 sessionFee, uint256 expiresAt, bool active)[])",
    "event SessionCreated(address indexed user, address indexed sessionWallet, uint256 depositAmount, uint256 stopLoss, uint256 expiresAt)"
];

async function main() {
    console.log("Starting Swarm State Enforcement...");

    if (!fs.existsSync(WALLETS_FILE)) {
        console.error("Wallets file not found.");
        process.exit(1);
    }
    const wallets = JSON.parse(fs.readFileSync(WALLETS_FILE, 'utf8'));
    const provider = new ethers.JsonRpcProvider(RPC_URL);

    let sessions: Record<string, any> = {};
    if (fs.existsSync(SESSIONS_FILE)) {
        sessions = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
    }

    const fee = ethers.parseEther("1");

    for (const bot of personalities) {
        console.log(`Checking ${bot.name}...`);
        const walletData = wallets[bot.name];
        if (!walletData) continue;

        const wallet = new ethers.Wallet(walletData.privateKey, provider);
        const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, wallet);
        const guilt = new ethers.Contract(GUILT_ADDRESS, ERC20_ABI, wallet);

        // 1. Check On-Chain
        let sessionWalletAddress: string | null = null;
        let expiresAt: number = 0;
        try {
            const userSessions = await factory.getUserSessions(wallet.address);
            // Find active session
            // Struct: [userWallet, sessionWallet, deposit, stopLoss, fee, expiresAt, active]
            // Ethers returns Result object or array.
            for (const s of userSessions) {
                if (s.active || s[6] === true) { // check active flag
                    sessionWalletAddress = s.sessionWallet || s[1];
                    expiresAt = Number(s.expiresAt || s[5]);
                    break;
                }
            }
        } catch (e) {
            console.error(`  Failed to fetch user sessions:`, e);
            continue;
        }

        if (sessionWalletAddress) {
            console.log(`  Found existing active session: ${sessionWalletAddress}`);
        } else {
            console.log(`  No active session on-chain. Creating...`);
            try {
                const depositAmount = ethers.parseEther(bot.initialDeposit.toString());
                const totalAmount = depositAmount + fee;

                // Check Allowance
                // Just approve always to be safe/simple
                const txApprove = await guilt.approve(FACTORY_ADDRESS, totalAmount);
                await txApprove.wait();

                // Create
                const stopLoss = depositAmount * 10n / 100n;
                const duration = 24;
                const txCreate = await factory.createSession(depositAmount, stopLoss, fee, duration, { gasLimit: 5000000 });
                const receipt = await txCreate.wait();

                // Find event
                for (const log of receipt.logs) {
                    try {
                        const parsed = factory.interface.parseLog(log);
                        if (parsed && parsed.name === 'SessionCreated') {
                            sessionWalletAddress = parsed.args.sessionWallet;
                            break;
                        }
                    } catch (e) { }
                }
            } catch (e) {
                console.error(`  Creation Failed:`, e);
                continue;
            }
        }

        if (!sessionWalletAddress) {
            console.error(`  Could not obtain session wallet address.`);
            continue;
        }

        // 2. Sync to DB
        // Check if exists in DB
        const { data: existing } = await supabase
            .from('agent_sessions')
            .select('id')
            .eq('session_wallet', sessionWalletAddress)
            .single();

        let sessionId = existing?.id;

        if (!sessionId) {
            console.log(`  Inserting into DB...`);
            const depositAmount = ethers.parseEther(bot.initialDeposit.toString());
            const stopLoss = depositAmount * 10n / 100n;

            const { data: inserted, error } = await supabase
                .from('agent_sessions')
                .insert({
                    user_wallet: wallet.address,
                    session_wallet: sessionWalletAddress,
                    strategy: bot.strategy,
                    starting_balance: bot.initialDeposit,
                    current_balance: bot.initialDeposit,
                    stop_loss: Number(ethers.formatEther(stopLoss)),
                    take_profit: bot.initialDeposit * 2,
                    status: 'active',
                    // Default to 24h from now if we just created, or use on check if available.
                    // For simplicity, just set to 24h from now if inserting new record.
                    expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString()
                })
                .select()
                .single();

            if (error) {
                console.error(`  DB Insert Error:`, error);
            } else {
                sessionId = inserted.id;
                console.log(`  DB Record Created: ${sessionId}`);
            }
        } else {
            console.log(`  DB Record Exists: ${sessionId}`);
        }

        if (sessionId) {
            sessions[bot.name] = {
                sessionId: sessionId,
                sessionWallet: sessionWalletAddress,
                botName: bot.name
            };
        }
    }

    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
    console.log("State Enforcement Complete.");
}

main().catch(console.error);

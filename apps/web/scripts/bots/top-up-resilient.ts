import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import personalities from './bot-personalities.json';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
const DEPLOYER_KEY = process.env.PONTIFF_PRIVATE_KEY!;
const WALLETS_FILE = path.join(__dirname, 'wallets.json');
const STATE_FILE = path.join(__dirname, 'funding-state.json');

interface FundingState {
    fundedBots: string[];
    targetAmount: string;
    lastUpdated: string;
}

function loadState(): FundingState {
    if (fs.existsSync(STATE_FILE)) {
        return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
    return {
        fundedBots: [],
        targetAmount: "1.0",
        lastUpdated: new Date().toISOString()
    };
}

function saveState(state: FundingState) {
    state.lastUpdated = new Date().toISOString();
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function main() {
    console.log("🛡️  RESILIENT BOT FUNDING SCRIPT");
    console.log("Topping Up First 14 Bots to 1.0 MON Each");
    console.log("========================================\n");

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const deployer = new ethers.Wallet(DEPLOYER_KEY, provider);

    const wallets: Record<string, any> = JSON.parse(fs.readFileSync(WALLETS_FILE, 'utf8'));
    const state = loadState();
    const TARGET = ethers.parseEther(state.targetAmount);

    console.log(`📋 State loaded: ${state.fundedBots.length}/14 bots already funded`);
    console.log(`📅 Last updated: ${state.lastUpdated}\n`);

    let newlyFunded = 0;
    let alreadyFunded = 0;
    let failed = 0;

    for (const bot of personalities.slice(0, 14)) {
        const address = wallets[bot.name].address;

        // Check cache first
        if (state.fundedBots.includes(bot.name)) {
            console.log(`${bot.name}: Already funded (cached) ✅`);
            alreadyFunded++;
            continue;
        }

        try {
            // Check actual balance
            const balance = await provider.getBalance(address);
            console.log(`${bot.name}: Current balance = ${ethers.formatEther(balance)} MON`);

            if (balance >= TARGET) {
                console.log(`  ✅ Already has 1+ MON (skipping)\n`);

                // Add to cache to skip next time
                state.fundedBots.push(bot.name);
                saveState(state);
                alreadyFunded++;
                continue;
            }

            const toSend = TARGET - balance;
            console.log(`  📤 Sending ${ethers.formatEther(toSend)} MON...`);

            const tx = await deployer.sendTransaction({
                to: address,
                value: toSend,
                gasLimit: 21000
            });

            console.log(`  ⏳ Tx submitted: ${tx.hash}`);
            console.log(`  ⏳ Waiting for confirmation...`);

            await tx.wait();

            console.log(`  ✅ Confirmed!\n`);

            // Save state immediately after success
            state.fundedBots.push(bot.name);
            saveState(state);
            newlyFunded++;

        } catch (error: any) {
            console.error(`  ❌ FAILED: ${error.message}`);

            if (error.code === 'UND_ERR_CONNECT_TIMEOUT' ||
                error.code === 'UND_ERR_HEADERS_TIMEOUT' ||
                error.message.includes('Unknown block')) {
                console.error(`  ⚠️  RPC ERROR DETECTED`);
                console.error(`  💾 Progress saved. Safe to re-run this script.\n`);
                failed++;

                // Don't exit - try remaining bots
                continue;
            } else {
                // Unknown error - safer to stop
                console.error(`  🛑 Unknown error. Stopping for safety.\n`);
                throw error;
            }
        }
    }

    console.log("========================================");
    console.log("📊 FUNDING SUMMARY");
    console.log("========================================");
    console.log(`✅ Newly Funded: ${newlyFunded}`);
    console.log(`📋 Already Funded (from cache): ${alreadyFunded}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Total Progress: ${state.fundedBots.length}/14 bots`);
    console.log("");

    const deployerBalance = await provider.getBalance(deployer.address);
    console.log(`💰 Deployer Remaining: ${ethers.formatEther(deployerBalance)} MON`);
    console.log("");

    if (state.fundedBots.length === 14) {
        console.log("🎉 ALL BOTS FUNDED!");
        console.log("✅ Ready to run spawn-bot-swarm.ts");
        console.log("");
        console.log("💡 To reset state and start over:");
        console.log(`   rm ${STATE_FILE}`);
    } else {
        console.log("⚠️  FUNDING INCOMPLETE");
        console.log(`📋 ${14 - state.fundedBots.length} bots still need funding`);
        console.log("");
        console.log("💡 To continue:");
        console.log("   1. Wait a few minutes for RPC to stabilize");
        console.log("   2. Re-run this script (it will resume where it left off)");
        console.log("");
        console.log("💡 To reset state and start over:");
        console.log(`   rm ${STATE_FILE}`);
    }
}

main().catch(console.error);

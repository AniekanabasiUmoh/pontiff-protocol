import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import personalities from './bot-personalities.json';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
const DEPLOYER_KEY = process.env.PONTIFF_PRIVATE_KEY!;

const WALLETS_FILE = path.join(__dirname, 'wallets.json');

async function main() {
    console.log("Force-Funding ALL Bots to 0.5 MON Each");
    console.log("========================================\n");

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const deployer = new ethers.Wallet(DEPLOYER_KEY, provider);

    const deployerBalance = await provider.getBalance(deployer.address);
    console.log(`Deployer Address: ${deployer.address}`);
    console.log(`Deployer MON Balance: ${ethers.formatEther(deployerBalance)} MON\n`);

    let wallets: Record<string, { address: string, privateKey: string, personality: string }> = {};

    if (fs.existsSync(WALLETS_FILE)) {
        wallets = JSON.parse(fs.readFileSync(WALLETS_FILE, 'utf8'));
    } else {
        console.error("Wallets file not found!");
        process.exit(1);
    }

    const TARGET_BALANCE = ethers.parseEther("0.5");
    let totalSent = 0n;
    let botsFunded = 0;

    for (const bot of personalities.slice(0, 14)) { // Only first 14 bots
        const walletData = wallets[bot.name];
        if (!walletData) {
            console.log(`⚠️  No wallet for ${bot.name}, skipping`);
            continue;
        }

        const botAddress = walletData.address;
        const currentBalance = await provider.getBalance(botAddress);

        console.log(`${bot.name}: ${ethers.formatEther(currentBalance)} MON`);

        if (currentBalance < TARGET_BALANCE) {
            const toSend = TARGET_BALANCE - currentBalance;

            try {
                console.log(`  Sending ${ethers.formatEther(toSend)} MON...`);
                const tx = await deployer.sendTransaction({
                    to: botAddress,
                    value: toSend,
                    gasLimit: 21000 // Standard transfer
                });
                await tx.wait();
                console.log(`  ✅ Confirmed\n`);
                totalSent += toSend;
                botsFunded++;
            } catch (e: any) {
                console.error(`  ❌ Failed:`, e.message, `\n`);
            }
        } else {
            console.log(`  ✅ Already has enough\n`);
            botsFunded++;
        }
    }

    console.log("========================================");
    console.log(`Total MON Sent: ${ethers.formatEther(totalSent)}`);
    console.log(`Bots Funded: ${botsFunded}/14`);
    console.log(`Remaining Balance: ${ethers.formatEther(await provider.getBalance(deployer.address))} MON`);
}

main().catch(console.error);

import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import personalities from './bot-personalities.json';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
const WALLETS_FILE = path.join(__dirname, 'wallets.json');
const wallets = JSON.parse(fs.readFileSync(WALLETS_FILE, 'utf8'));

const provider = new ethers.JsonRpcProvider(RPC_URL);

async function main() {
    console.log("Checking Bot Balances...");

    for (const bot of personalities) {
        const walletData = wallets[bot.name];
        if (!walletData) continue;

        try {
            const balance = await provider.getBalance(walletData.address);
            console.log(`${bot.name}: ${ethers.formatEther(balance)} MON`);
        } catch (e) {
            console.log(`${bot.name}: Error fetching balance`);
        }
    }
}

main().catch(console.error);

import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import personalities from './bot-personalities.json';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
const WALLETS_FILE = path.join(__dirname, 'wallets.json');
const wallets = JSON.parse(fs.readFileSync(WALLETS_FILE, 'utf8'));

const bot = personalities[0]; // Iron Beard
const botWallet = wallets[bot.name];

const deployerKey = process.env.PONTIFF_PRIVATE_KEY!;
const provider = new ethers.JsonRpcProvider(RPC_URL);
const deployer = new ethers.Wallet(deployerKey, provider);

async function main() {
    console.log(`Funding ${bot.name} (${botWallet.address})...`);

    const balance = await provider.getBalance(botWallet.address);
    console.log(`Current Balance: ${ethers.formatEther(balance)} MON`);

    const target = ethers.parseEther("2.0"); // Give plenty
    if (balance < target) {
        const amount = target - balance;
        console.log(`Sending ${ethers.formatEther(amount)} MON...`);

        const tx = await deployer.sendTransaction({
            to: botWallet.address,
            value: amount,
            gasPrice: ethers.parseUnits("200", "gwei")
        });
        console.log(`Tx sent: ${tx.hash}`);
        await tx.wait();
        console.log("Confirmed.");
    } else {
        console.log("Sufficient balance.");
    }

    const newBalance = await provider.getBalance(botWallet.address);
    console.log(`New Balance: ${ethers.formatEther(newBalance)} MON`);
}

main().catch(console.error);

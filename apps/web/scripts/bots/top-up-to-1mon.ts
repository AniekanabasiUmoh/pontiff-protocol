import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import personalities from './bot-personalities.json';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
const DEPLOYER_KEY = process.env.PONTIFF_PRIVATE_KEY!;
const WALLETS_FILE = path.join(__dirname, 'wallets.json');

async function main() {
    console.log("Topping Up First 14 Bots to 1.0 MON Each\n");

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const deployer = new ethers.Wallet(DEPLOYER_KEY, provider);

    const wallets: Record<string, any> = JSON.parse(fs.readFileSync(WALLETS_FILE, 'utf8'));
    const TARGET = ethers.parseEther("1.0");

    let count = 0;
    for (const bot of personalities.slice(0, 14)) {
        const address = wallets[bot.name].address;
        const balance = await provider.getBalance(address);

        if (balance < TARGET) {
            const toSend = TARGET - balance;
            console.log(`${bot.name}: Sending ${ethers.formatEther(toSend)} MON...`);
            const tx = await deployer.sendTransaction({ to: address, value: toSend, gasLimit: 21000 });
            await tx.wait();
            console.log(`  ✅ Done\n`);
            count++;
        } else {
            console.log(`${bot.name}: Already has 1+ MON\n`);
        }
    }

    console.log(`\n✅ ${count} bots topped up`);
    console.log(`Remaining: ${ethers.formatEther(await provider.getBalance(deployer.address))} MON`);
}

main().catch(console.error);

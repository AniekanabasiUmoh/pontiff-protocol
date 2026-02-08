import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import personalities from './bot-personalities.json';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_SESSION_WALLET_FACTORY_ADDRESS!;

const WALLETS_FILE = path.join(__dirname, 'wallets.json');
const wallets = JSON.parse(fs.readFileSync(WALLETS_FILE, 'utf8'));

const provider = new ethers.JsonRpcProvider(RPC_URL);

const FACTORY_ABI = [
    "function getUserSessions(address _user) external view returns (tuple(address userWallet, address sessionWallet, uint256 depositAmount, uint256 stopLoss, uint256 sessionFee, uint256 expiresAt, bool active)[])"
];

async function main() {
    console.log("Checking On-Chain Status...");
    const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);

    let activeCount = 0;

    // Check first 5 bots
    const botsToCheck = personalities.slice(0, 5);

    for (const bot of botsToCheck) {
        const walletData = wallets[bot.name];
        console.log(`Checking ${bot.name} (${walletData.address})...`);
        try {
            const sessions = await factory.getUserSessions(walletData.address);
            console.log(`  Sessions found: ${sessions.length}`);

            const active = sessions.filter((s: any) => s.active || s[6] === true);
            console.log(`  Active sessions: ${active.length}`);

            if (active.length > 0) {
                console.log(`  ✅ Session Wallet: ${active[0].sessionWallet || active[0][1]}`);
                activeCount++;
            }
        } catch (e) {
            console.error(`  Error fetching sessions:`, e);
        }
    }

    console.log(`\nTotal Active (Sample): ${activeCount} / ${botsToCheck.length}`);
}

main().catch(console.error);

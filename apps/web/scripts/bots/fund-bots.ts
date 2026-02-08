import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import personalities from './bot-personalities.json';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
const DEPLOYER_KEY = process.env.PONTIFF_PRIVATE_KEY!; // Using Pontiff/Deployer key
const GUILT_ADDRESS = process.env.NEXT_PUBLIC_GUILT_ADDRESS!; // Check .env.local name

if (!RPC_URL || !DEPLOYER_KEY || !GUILT_ADDRESS) {
    console.error("Missing environment variables. Check .env.local");
    process.exit(1);
}

const WALLETS_FILE = path.join(__dirname, 'wallets.json');

// Minimal ERC20 ABI
const ERC20_ABI = [
    "function transfer(address to, uint256 amount) returns (bool)",
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)"
];

async function main() {
    console.log("Starting Bot Funding Process...");

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const deployer = new ethers.Wallet(DEPLOYER_KEY, provider);

    console.log(`Deployer Address: ${deployer.address}`);
    const balance = await provider.getBalance(deployer.address);
    console.log(`Deployer MON Balance: ${ethers.formatEther(balance)} MON`);

    const guiltContract = new ethers.Contract(GUILT_ADDRESS, ERC20_ABI, deployer);
    // const decimals = await guiltContract.decimals(); // Assuming 18

    let wallets: Record<string, { address: string, privateKey: string, personality: string }> = {};

    // Load existing wallets if any
    if (fs.existsSync(WALLETS_FILE)) {
        wallets = JSON.parse(fs.readFileSync(WALLETS_FILE, 'utf8'));
    }

    for (const bot of personalities) {
        if (!wallets[bot.name]) {
            const wallet = ethers.Wallet.createRandom();
            wallets[bot.name] = {
                address: wallet.address,
                privateKey: wallet.privateKey,
                personality: bot.name
            };
            console.log(`Generated wallet for ${bot.name}: ${wallet.address}`);
        }
    }

    // Save wallets
    fs.writeFileSync(WALLETS_FILE, JSON.stringify(wallets, null, 2));
    console.log(`Saved ${Object.keys(wallets).length} wallets to ${WALLETS_FILE}`);

    // Fund Bots
    for (const bot of personalities) {
        const walletData = wallets[bot.name];
        const botAddress = walletData.address;

        // 1. Check & Send MON (Gas)
        const botBalance = await provider.getBalance(botAddress);
        const targetEth = ethers.parseEther("0.5"); // 0.5 MON per bot (enough for ~7 sessions @ 7M gas)

        if (botBalance < targetEth) {
            const amountToSend = targetEth - botBalance;
            if (amountToSend > 0n) {
                console.log(`Sending ${ethers.formatEther(amountToSend)} MON to ${bot.name}...`);
                const tx = await deployer.sendTransaction({
                    to: botAddress,
                    value: amountToSend
                });
                await tx.wait();
                console.log("  Confirmed.");
            }
        } else {
            console.log(`${bot.name} has sufficient MON.`);
        }

        // 2. Check & Send GUILT (Deposit + Fee Buffer)
        const botGuilt = await guiltContract.balanceOf(botAddress);
        const feeBuffer = 5; // Buffer for session fees
        const targetGuilt = ethers.parseEther((bot.initialDeposit + feeBuffer).toString());

        if (botGuilt < targetGuilt) {
            const amountToSend = targetGuilt - botGuilt;
            console.log(`Sending ${ethers.formatEther(amountToSend)} GUILT to ${bot.name}...`);
            const tx = await guiltContract.transfer(botAddress, amountToSend);
            await tx.wait();
            console.log("  Confirmed.");
        } else {
            console.log(`${bot.name} has sufficient GUILT.`);
        }
    }

    console.log("All bots funded successfully!");
}

main().catch(console.error);

import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import personalities from './bot-personalities.json';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_SESSION_WALLET_FACTORY_ADDRESS!;
const GUILT_ADDRESS = process.env.NEXT_PUBLIC_GUILT_ADDRESS!;

const WALLETS_FILE = path.join(__dirname, 'wallets.json');
const wallets = JSON.parse(fs.readFileSync(WALLETS_FILE, 'utf8'));

const bot = personalities[0]; // Iron Beard
const walletData = wallets[bot.name];

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(walletData.privateKey, provider);

const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address owner) view returns (uint256)",
    "function allowance(address owner, address spender) view returns (uint256)"
];

const FACTORY_ABI = [
    "function createSession(uint256 _depositAmount, uint256 _stopLoss, uint256 _sessionFee, uint256 _durationHours) external returns (address sessionWallet)",
    "function guiltToken() view returns (address)"
];

async function main() {
    console.log(`Debugging ${bot.name} (${wallet.address})...`);

    const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, wallet);
    try {
        const tokenOnFactory = await factory.guiltToken();
        console.log(`Factory Guilt Token: ${tokenOnFactory}`);
        console.log(`Env Guilt Token:     ${GUILT_ADDRESS}`);

        if (tokenOnFactory.toLowerCase() !== GUILT_ADDRESS.toLowerCase()) {
            console.error("MISMATCH! Factory uses different token.");
            console.error("Please update .env.local with correct token address and refund bots.");
            process.exit(1);
        }
    } catch (e) {
        console.error("Failed to read guiltToken from factory:", e);
    }

    const guilt = new ethers.Contract(GUILT_ADDRESS, ERC20_ABI, wallet);

    const balance = await guilt.balanceOf(wallet.address);
    console.log(`GUILT Balance: ${ethers.formatEther(balance)}`);

    const monBalance = await provider.getBalance(wallet.address);
    console.log(`MON Balance: ${ethers.formatEther(monBalance)}`);

    const depositAmount = ethers.parseEther(bot.initialDeposit.toString());
    const fee = ethers.parseEther("1");
    const totalAmount = depositAmount + fee;

    console.log(`Checking allowance for ${FACTORY_ADDRESS}...`);
    const allow = await guilt.allowance(wallet.address, FACTORY_ADDRESS);
    console.log(`Allowance: ${ethers.formatEther(allow)} / Required: ${ethers.formatEther(totalAmount)}`);

    if (allow < totalAmount) {
        console.log("Approving...");
        const tx = await guilt.approve(FACTORY_ADDRESS, totalAmount);
        await tx.wait();
        console.log("Approved.");
    }

    console.log("Calling createSession...");
    const stopLoss = depositAmount * 10n / 100n;
    const duration = 24;

    try {
        const tx = await factory.createSession(depositAmount, stopLoss, fee, duration, { gasLimit: 5000000 });
        console.log(`Tx sent: ${tx.hash}`);
        const receipt = await tx.wait();
        console.log(`Tx confirmed: ${receipt.blockNumber}`);
    } catch (e: any) {
        console.error("ERROR CAUGHT:");
        console.error(e);
        if (e.data) {
            console.error("Error Data:", e.data);
            try {
                const decoded = factory.interface.parseError(e.data);
                console.error("Decoded Error:", decoded);
            } catch (d) {
                console.error("Could not decode error.");
            }
        }
    }
}

main().catch(console.error);

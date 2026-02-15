import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
const GUILT_ADDRESS = process.env.NEXT_PUBLIC_GUILT_ADDRESS!;
const PONTIFF_PRIVATE_KEY = process.env.PONTIFF_PRIVATE_KEY!;

const SESSION_WALLET = "0x84428bcde306623bc295189fa7baed64f5adc4ae"; // The active agent's wallet

const ERC20_ABI = [
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
    "function decimals() external view returns (uint8)",
    "function symbol() external view returns (string)"
];

async function fundAgent() {
    console.log(`Funding Agent ${SESSION_WALLET}...`);

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PONTIFF_PRIVATE_KEY, provider);
    const guiltToken = new ethers.Contract(GUILT_ADDRESS, ERC20_ABI, wallet);

    // Check balance first
    const decimals = await guiltToken.decimals();
    const balanceBefore = await guiltToken.balanceOf(SESSION_WALLET);
    console.log(`Balance Before: ${ethers.formatUnits(balanceBefore, decimals)} GUILT`);

    // Fund 100 GUILT
    const amount = ethers.parseUnits("100", decimals);
    console.log(`Transferring 100 GUILT...`);

    try {
        const tx = await guiltToken.transfer(SESSION_WALLET, amount);
        console.log(`Tx sent: ${tx.hash}`);
        await tx.wait();
        console.log(`✅ Transfer confirmed.`);

        const balanceAfter = await guiltToken.balanceOf(SESSION_WALLET);
        console.log(`Balance After: ${ethers.formatUnits(balanceAfter, decimals)} GUILT`);

    } catch (e: any) {
        console.error("❌ Transfer failed:", e.message);
    }
}

fundAgent();

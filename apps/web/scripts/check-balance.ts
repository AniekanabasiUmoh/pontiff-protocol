import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
const GUILT_ADDRESS = process.env.NEXT_PUBLIC_GUILT_ADDRESS!;

// From inspection:
const SESSION_WALLET = "0x04b4fe48317d87810a6229e945f0dd93d17c85b9";

const ERC20_ABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function decimals() external view returns (uint8)",
    "function symbol() external view returns (string)"
];

async function checkBalance() {
    console.log(`Checking balance for ${SESSION_WALLET} on ${RPC_URL}`);
    console.log(`Token: ${GUILT_ADDRESS}`);

    const provider = new ethers.JsonRpcProvider(RPC_URL);

    // Check ETH balance (gas)
    const ethBalance = await provider.getBalance(SESSION_WALLET);
    console.log(`ETH Balance: ${ethers.formatEther(ethBalance)} ETH`);

    // Check GUILT balance
    const guiltToken = new ethers.Contract(GUILT_ADDRESS, ERC20_ABI, provider);

    try {
        const decimals = await guiltToken.decimals();
        const symbol = await guiltToken.symbol();
        const balance = await guiltToken.balanceOf(SESSION_WALLET);

        console.log(`${symbol} Balance: ${ethers.formatUnits(balance, decimals)}`);

        if (balance === 0n) {
            console.error("❌ ZERO BALANCE confirmed. Stop loss trigger explained.");
        } else {
            console.log("✅ Balance exists. Stop loss should NOT fail.");
        }

    } catch (e: any) {
        console.error("Failed to read token:", e.message);
    }
}

checkBalance();

import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
const GUILT_ADDRESS = process.env.NEXT_PUBLIC_GUILT_ADDRESS!;
const TARGET_WALLET = "0x9f994707E36848a82e672d34aDB3194877dB8cc3";

const ERC20_ABI = [
    "function balanceOf(address account) view returns (uint256)"
];

async function checkGuilt() {
    console.log(`Checking GUILT for ${TARGET_WALLET}...`);
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const guilt = new ethers.Contract(GUILT_ADDRESS, ERC20_ABI, provider);

    try {
        const balance = await guilt.balanceOf(TARGET_WALLET);
        console.log(`GUILT Balance: ${ethers.formatEther(balance)}`);
    } catch (e: any) {
        console.error("Failed to read balance:", e.message);
    }
}

checkGuilt();

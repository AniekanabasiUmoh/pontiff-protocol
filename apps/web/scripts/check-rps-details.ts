import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
const RPS_ADDRESS = process.env.NEXT_PUBLIC_RPS_CONTRACT_ADDRESS!;

const ABI = [
    "function guiltToken() view returns (address)"
];

async function checkRPS() {
    console.log(`Checking RPS at ${RPS_ADDRESS}...`);
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(RPS_ADDRESS, ABI, provider);

    try {
        const guiltToken = await contract.guiltToken();
        console.log(`RPS GuiltToken:     ${guiltToken}`);

        const envGuilt = process.env.NEXT_PUBLIC_GUILT_ADDRESS!;
        console.log(`Env GuiltToken:     ${envGuilt}`);

        if (guiltToken.toLowerCase() !== envGuilt.toLowerCase()) {
            console.error("❌ MISMATCH! RPS uses a different token.");
        } else {
            console.log("✅ RPS Token Matches Env.");
        }

    } catch (e: any) {
        console.error("Failed to read RPS details:", e.message);
    }
}

checkRPS();

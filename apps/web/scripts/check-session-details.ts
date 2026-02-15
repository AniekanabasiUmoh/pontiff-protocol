import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
const SESSION_WALLET = "0x04b4fe48317d87810a6229e945f0dd93d17c85b9";

const ABI = [
    "function pontiff() view returns (address)",
    "function guiltToken() view returns (address)"
];

async function checkDetails() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(SESSION_WALLET, ABI, provider);

    try {
        const pontiff = await contract.pontiff();
        const guiltToken = await contract.guiltToken();

        console.log(`SessionWallet Pontiff:     ${pontiff}`);
        console.log(`SessionWallet GuiltToken:  ${guiltToken}`);

        const envGuilt = process.env.NEXT_PUBLIC_GUILT_ADDRESS!;

        if (guiltToken.toLowerCase() !== envGuilt.toLowerCase()) {
            console.error("❌ Guilt Token Mismatch! Session uses different token.");
            console.log("Expected:", envGuilt);
        } else {
            console.log("✅ Guilt Token Matches Env.");
        }

    } catch (e: any) {
        console.error("Failed to read details:", e.message);
    }
}

checkDetails();

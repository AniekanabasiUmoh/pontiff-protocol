import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
const SESSION_WALLET = "0x04b4fe48317d87810a6229e945f0dd93d17c85b9";

const ABI = [
    "function owner() view returns (address)",
    "function factory() view returns (address)"
];

async function checkOwner() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(SESSION_WALLET, ABI, provider);

    try {
        const owner = await contract.owner();
        console.log(`SessionWallet Owner: ${owner}`);

        const backendWallet = new ethers.Wallet(process.env.PONTIFF_PRIVATE_KEY!).address;
        console.log(`Backend Wallet:    ${backendWallet}`);

        if (owner.toLowerCase() === backendWallet.toLowerCase()) {
            console.log("✅ Backend is Owner. Access should work.");
        } else {
            console.log("❌ Backend is NOT Owner. Access likely denied.");
        }
    } catch (e: any) {
        console.error("Failed to read owner:", e.message);
    }
}

checkOwner();

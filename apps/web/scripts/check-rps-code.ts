import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
const RPS_ADDRESS = process.env.NEXT_PUBLIC_RPS_CONTRACT_ADDRESS!;

async function checkCode() {
    console.log(`Checking code at ${RPS_ADDRESS}...`);
    const provider = new ethers.JsonRpcProvider(RPC_URL);

    try {
        const code = await provider.getCode(RPS_ADDRESS);
        if (code === '0x') {
            console.log('❌ No code found at address! It is an EOA or not deployed on this chain.');
        } else {
            console.log(`✅ Code found! Length: ${code.length}`);
        }
    } catch (e: any) {
        console.error("Failed to get code:", e.message);
    }
}

checkCode();

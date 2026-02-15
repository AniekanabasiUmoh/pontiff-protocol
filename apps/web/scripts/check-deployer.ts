import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY!;

async function checkDeployer() {
    console.log(`Checking Deployer Balance...`);
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);

    console.log(`Deployer Address: ${wallet.address}`);
    const balance = await provider.getBalance(wallet.address);
    console.log(`Balance: ${ethers.formatEther(balance)} MON`);

    if (balance === 0n) {
        console.error("❌ Deployer has 0 MON! Cannot deploy.");
    } else {
        console.log("✅ Deployer has funds.");
    }
}

checkDeployer();

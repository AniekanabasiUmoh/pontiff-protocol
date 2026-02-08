import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
const provider = new ethers.JsonRpcProvider(RPC_URL);

async function main() {
    const feeData = await provider.getFeeData();
    console.log(`Gas Price: ${ethers.formatUnits(feeData.gasPrice!, 'gwei')} gwei`);
    const deployerKey = process.env.PONTIFF_PRIVATE_KEY!;
    const deployer = new ethers.Wallet(deployerKey, provider);
    const balance = await provider.getBalance(deployer.address);
    console.log(`Deployer Balance: ${ethers.formatEther(balance)} MON`);
    if (feeData.maxFeePerGas) {
        console.log(`Max Fee: ${ethers.formatUnits(feeData.maxFeePerGas, 'gwei')} gwei`);
    }

    const limit = 7000000n;
    const price = feeData.gasPrice || 50000000000n; // default 50 gwei
    const cost = limit * price;
    console.log(`Cost for 7M gas: ${ethers.formatEther(cost)} MON`);
}

main().catch(console.error);

import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Fix env loading
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

async function verify() {
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL!);

    const factoryAddress = process.env.NEXT_PUBLIC_SESSION_WALLET_FACTORY_ADDRESS!;
    const envGuilt = process.env.NEXT_PUBLIC_GUILT_ADDRESS!;

    console.log('Env Factory:', factoryAddress);
    console.log('Env Guilt:  ', envGuilt);

    const factoryAbi = ["function guiltToken() view returns (address)"];
    const factory = new ethers.Contract(factoryAddress, factoryAbi, provider);

    try {
        const onChainGuilt = await factory.guiltToken();
        console.log('Chain Guilt:', onChainGuilt);

        if (onChainGuilt.toLowerCase() === envGuilt.toLowerCase()) {
            console.log('✅ Token addresses match!');
        } else {
            console.log('❌ TOKEN MISMATCH! Factory uses different token than frontend.');
        }
    } catch (e: any) {
        console.error('Error reading factory:', e.message);
    }
}
verify();

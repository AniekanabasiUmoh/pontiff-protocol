import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load envs
const envPath = path.resolve(process.cwd(), '.env.local');
console.log(`Loading env from: ${envPath}`);
dotenv.config({ path: envPath });

async function check() {
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL!);
    const txHash = '0xbf8f4aed2bf3545cb7a4ce684be86a74144a4bd5237dde5d2414debc60412672';

    console.log(`Checking TX: ${txHash}`);
    console.log(`RPC URL: ${process.env.NEXT_PUBLIC_RPC_URL}`);

    try {
        const receipt = await provider.getTransactionReceipt(txHash);

        if (!receipt) {
            console.log('❌ Receipt not found (null)');
            return;
        }

        console.log('Status:', receipt.status);
        console.log('To:', receipt.to);
        console.log('Logs Count:', receipt.logs.length);

        if (receipt.logs.length > 0) {
            console.log('First Log Topic:', receipt.logs[0].topics[0]);

            // Expected topic for SessionCreated(address,address,uint8,uint256,uint256)
            // keccak256("SessionCreated(address,address,uint8,uint256,uint256)")
            const expectedTopic = ethers.id("SessionCreated(address,address,uint8,uint256,uint256)");
            console.log('Expected Topic: ', expectedTopic);

            if (receipt.logs[0].topics[0] === expectedTopic) {
                console.log('✅ Topic Matches!');
            } else {
                console.log('❌ Topic Mismatch!');
            }
        }
    } catch (e: any) {
        console.error('Error:', e.message);
    }
}
check();

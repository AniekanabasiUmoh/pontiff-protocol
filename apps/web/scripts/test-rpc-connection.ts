import { createPublicClient, http } from 'viem';
import { monadTestnet } from 'viem/chains';

const RPC_1 = 'https://testnet-rpc.monad.xyz';
const RPC_2 = 'https://monad-testnet.drpc.org';

async function testRPC(url: string) {
    console.log(`Testing RPC: ${url}`);
    const client = createPublicClient({
        chain: monadTestnet,
        transport: http(url)
    });
    try {
        const block = await client.getBlockNumber();
        console.log(`✅ Success! Block Height: ${block}`);
        return true;
    } catch (error: any) {
        console.error(`❌ Failed: ${error.message}`);
        return false;
    }
}

async function main() {
    await testRPC(RPC_1);
    await testRPC(RPC_2);
}

main();

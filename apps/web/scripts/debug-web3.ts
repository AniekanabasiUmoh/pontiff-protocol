
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
const envPath = path.resolve(__dirname, '../.env.local');
const result = dotenv.config({ path: envPath });
console.log(`Loading .env from: ${envPath}`);
if (result.error) {
    console.error('Error loading .env:', result.error);
} else {
    console.log('.env loaded successfully');
}

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;
const PRIVATE_KEY = process.env.PONTIFF_PRIVATE_KEY || process.env.ETH_PRIVATE_KEY;
const INDULGENCE_ADDRESS = process.env.NEXT_PUBLIC_INDULGENCE_ADDRESS;

async function debugWeb3() {
    console.log('--- Debugging Web3 Configuration ---');
    console.log(`RPC URL: ${RPC_URL}`);
    console.log(`Contract Address: ${INDULGENCE_ADDRESS}`);
    console.log(`Private Key Present: ${!!PRIVATE_KEY}`);

    if (!RPC_URL) {
        console.error('ERROR: NEXT_PUBLIC_RPC_URL is missing');
        return;
    }

    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        console.log('Provider created. Testing network...');

        const network = await provider.getNetwork();
        console.log(`Connected to network: ${network.name} (Chain ID: ${network.chainId})`);

        const blockNumber = await provider.getBlockNumber();
        console.log(`Current Block Number: ${blockNumber}`);

        if (!PRIVATE_KEY) {
            console.error('ERROR: Private Key is missing');
            return;
        }

        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        console.log(`Wallet Address: ${wallet.address}`);

        const balance = await provider.getBalance(wallet.address);
        console.log(`Wallet Balance: ${ethers.formatEther(balance)} MON`);

        if (!INDULGENCE_ADDRESS) {
            console.error('ERROR: NEXT_PUBLIC_INDULGENCE_ADDRESS is missing');
            return;
        }

        const abi = [
            'function nextTokenId() external view returns (uint256)',
            'function name() external view returns (string)'
        ];

        const contract = new ethers.Contract(INDULGENCE_ADDRESS, abi, wallet);
        console.log('Contract instance created. calling nextTokenId()...');

        try {
            const nextId = await contract.nextTokenId();
            console.log(`SUCCESS: nextTokenId() = ${nextId}`);
        } catch (e: any) {
            console.error('FAILED to call nextTokenId():', e.message);
            console.log('Trying name()...');
            try {
                const name = await contract.name();
                console.log(`SUCCESS: name() = ${name}`);
            } catch (e2: any) {
                console.error('FAILED to call name():', e2.message);
            }
        }

    } catch (error: any) {
        console.error('General Web3 Error:', error);
    }
}

debugWeb3();

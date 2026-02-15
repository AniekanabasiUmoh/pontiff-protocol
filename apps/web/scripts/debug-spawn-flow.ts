import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_SESSION_WALLET_FACTORY_ADDRESS!;
const GUILT_ADDRESS = process.env.NEXT_PUBLIC_GUILT_ADDRESS!;
const PRIVATE_KEY = process.env.PONTIFF_PRIVATE_KEY!;

const FACTORY_ABI = [
    "function createSession(uint8 _strategy) external returns (address)",
    "function getStrategyFee(uint8 _strategy) view returns (uint256)",
    "event SessionCreated(address indexed owner, address indexed wallet, uint8 strategy, uint256 fee, uint256 timestamp)"
];

const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function transfer(address recipient, uint256 amount) external returns (bool)",
    "function balanceOf(address account) view returns (uint256)"
];

async function debugSpawn() {
    console.log('--- Debugging Spawn Flow ---');
    console.log('Factory:', FACTORY_ADDRESS);
    console.log('Guilt:', GUILT_ADDRESS);

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log('Signer:', wallet.address);

    const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, wallet);
    const guilt = new ethers.Contract(GUILT_ADDRESS, ERC20_ABI, wallet);

    // 1. Approve Fee
    const strategy = 1; // Merchant
    const fee = await factory.getStrategyFee(strategy);
    console.log('Strategy Fee:', ethers.formatEther(fee));

    console.log('Approving fee...');
    const txApprove = await guilt.approve(FACTORY_ADDRESS, fee);
    await txApprove.wait();
    console.log('Approved.');

    // 2. Create Session
    console.log('Creating Session...');
    const txSpawn = await factory.createSession(strategy);
    console.log('Spawn Tx:', txSpawn.hash);
    const receipt = await txSpawn.wait();

    // 3. Parse Event
    let sessionWallet = null;
    for (const log of receipt.logs) {
        try {
            const parsed = factory.interface.parseLog(log);
            if (parsed && parsed.name === 'SessionCreated') {
                sessionWallet = parsed.args.wallet;
                console.log('✅ Found Session Wallet:', sessionWallet);
                break;
            }
        } catch (e) { }
    }

    if (!sessionWallet) {
        console.error('❌ Failed to find session creation log!');
        return;
    }

    // 4. Fund Session
    const depositAmount = ethers.parseEther("50");
    console.log(`Funding ${sessionWallet} with 50 GUILT...`);

    const txFund = await guilt.transfer(sessionWallet, depositAmount);
    console.log('Fund Tx:', txFund.hash);
    await txFund.wait();
    console.log('Funding Confirmed.');

    // 5. Check Balance
    const balance = await guilt.balanceOf(sessionWallet);
    console.log('Final Session Balance:', ethers.formatEther(balance));

    if (balance === depositAmount) {
        console.log('SUCCESS: Simulation verifies logic is sound. Issue is likely in Frontend or User usage.');
    } else {
        console.log('FAILURE: Balance is not correct!');
    }
}

debugSpawn().catch(console.error);

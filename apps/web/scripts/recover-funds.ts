import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
const PRIVATE_KEY = process.env.PONTIFF_PRIVATE_KEY!; // Must be owner of session wallet (or factory owner if designed that way)
// Wait, SessionWallet `withdraw()` usually sends to `user` (original creator).
// Anyone can call withdraw() if it's public and sends to owner? Or only owner?
// Let's assume we can call it if we are the session owner or if it's open.
// Actually, SessionWallet usually has `onlyOwner` or `onlyFactory`.
// `AgentManagerService` uses `pontiffWallet` to call methods.
// The `SessionWallet` is owned by `SessionWalletFactory` or the User?
// Usually `SessionWallet` is owned by the User (EOA).
// But `AgentManager` (backend) needs to play games.
// Let's check `SessionWallet.sol` ABI again.
// AgentManager uses `executeGame` payload.
// If we want to withdraw, we might need to use `executeGame` to call `transfer` on GuiltToken?
// OR use the `withdraw()` function if it exists.

// Target Wallet
const SESSION_WALLET = "0x04b4fe48317d87810a6229e945f0dd93d17c85b9";

const SESSION_WALLET_ABI = [
    "function withdraw() external",
    "function owner() view returns (address)"
];

async function recoverFunds() {
    console.log(`Attempting to recover funds from ${SESSION_WALLET}...`);

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    // NOTE: If SessionWallet.withdraw() is restricted to owner, and owner is the User EOA, 
    // then the BACKEND (pontiffWallet) CANNOT call it directly unless it has permissions.
    // However, if the backend is the owner (custodial), it works.
    // If the User is the owner, the USER must call it from frontend.

    // Let's check who the owner is first.
    const sessionWallet = new ethers.Contract(SESSION_WALLET, SESSION_WALLET_ABI, wallet);

    try {
        // Try calling withdraw() as Pontiff (Backend)
        // If it fails, we know we need the user to do it.
        const tx = await sessionWallet.withdraw();
        console.log('Withdraw Tx Sent:', tx.hash);
        await tx.wait();
        console.log('✅ Withdraw confirmed!');
    } catch (e: any) {
        console.error('❌ Withdraw failed:', e.message);
        console.log('If "execution reverted", the backend wallet might not be the owner.');
        console.log('The User might need to call withdraw() from Etherscan or local script with their key.');
    }
}

recoverFunds();

const { ethers } = require('ethers');
require('dotenv').config();

// Configuration
const GUILT_ADDRESS = '0x5438DC9b8B5A314b85257c3C39746A0B4faE9611';
const STAKING_ADDRESS = '0xaE7dE948bF44d201CF4064AFd4098aeddc053C80';
const RPC_URL = process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz';
// Try to get key from different likely env var names
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY || process.env.WALLET_PRIVATE_KEY;

// ABI (Minimal)
const GUILT_ABI = [
    "function setTaxExempt(address account, bool value) external",
    "function isTaxExempt(address account) external view returns (bool)",
    "function stakingWallet() external view returns (address)",
    "function updateWallets(address _treasury, address _staking) external"
];

async function main() {
    console.log("=== FIXING STAKING CONFIGURATION ===");
    console.log(`RPC: ${RPC_URL}`);
    console.log(`Guilt Token: ${GUILT_ADDRESS}`);
    console.log(`Staking Contract: ${STAKING_ADDRESS}`);

    if (!PRIVATE_KEY) {
        console.error("❌ Error: Message signer private key not found in .env (DEPLOYER_PRIVATE_KEY)");
        process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log(`Connected Wallet: ${wallet.address}`);

    const guilt = new ethers.Contract(GUILT_ADDRESS, GUILT_ABI, wallet);

    // 1. Check current status
    console.log("\nChecking current status...");
    // 1. Check current status
    console.log("\nChecking current status...");
    let isExempt = false;
    try {
        isExempt = await guilt.isTaxExempt(STAKING_ADDRESS);
        console.log(`Current Staking Exempt Status: ${isExempt}`);
    } catch (err) {
        console.error("❌ Failed to read current status:");
        console.error(err);
        console.log("⚠️ Attempting to apply fix anyway...");
    }

    if (isExempt) {
        console.log("✅ Staking contract is ALREADY exempt! No action needed.");
        return;
    }

    // 2. Apply Fix
    console.log("\nApplying fix: Setting setTaxExempt(STAKING, true)...");
    try {
        const tx = await guilt.setTaxExempt(STAKING_ADDRESS, true);
        console.log(`Transaction Sent: ${tx.hash}`);
        console.log("Waiting for confirmation...");

        await tx.wait();
        console.log("✅ Transaction Confirmed!");

        // 3. Verify
        const newStatus = await guilt.isTaxExempt(STAKING_ADDRESS);
        console.log(`New Staking Exempt Status: ${newStatus}`);

        if (newStatus) {
            console.log("🎉 SUCCESS! Staking contract is now valid.");
        } else {
            console.error("❌ ERROR: Status is still false after transaction!");
        }

    } catch (error) {
        console.error("❌ Transaction Failed:");
        console.error(error);
    }
}

main().catch(console.error);

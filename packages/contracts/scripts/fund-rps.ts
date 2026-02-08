const hre = require("hardhat");
const { ethers } = hre;
require('dotenv').config({ path: __dirname + '/../../apps/web/.env.local' });

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Funding contract with account:", deployer.address);

    const RPS_ADDRESS = "0x32354721c0b31e04a0cb71e7d2ec98c81f105ea3"; // Lowercase
    const GUILT_ADDRESS = "0x3ba95db0f41e81d71bcee84faabb20f047b8d9fa"; // Lowercase

    /*
    const RPS_ADDRESS = ethers.getAddress(process.env.NEXT_PUBLIC_RPS_CONTRACT_ADDRESS);
    const GUILT_ADDRESS = ethers.getAddress(process.env.NEXT_PUBLIC_GUILT_ADDRESS);
    */

    if (!RPS_ADDRESS || !GUILT_ADDRESS) {
        throw new Error("Missing contract addresses");
    }

    console.log("RPS Contract:", RPS_ADDRESS);
    console.log("GUILT Token:", GUILT_ADDRESS);

    // Get GUILT Contract
    const GuiltToken = await ethers.getContractAt("IERC20", GUILT_ADDRESS);

    // Check Balance
    const balance = await GuiltToken.balanceOf(deployer.address);
    console.log("Deployer Balance:", ethers.formatEther(balance), "GUILT");

    const amount = ethers.parseEther("10000"); // 10,000 GUILT

    if (balance < amount) {
        throw new Error("Insufficient balance to fund contract");
    }

    // Transfer
    console.log(`Transferring ${ethers.formatEther(amount)} GUILT to RPS Contract...`);
    const tx = await GuiltToken.transfer(RPS_ADDRESS, amount);
    console.log("Tx Hash:", tx.hash);
    await tx.wait();

    console.log("✅ Funding Complete!");

    // Verify
    const newBalance = await GuiltToken.balanceOf(RPS_ADDRESS);
    console.log("RPS Contract Balance:", ethers.formatEther(newBalance), "GUILT");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

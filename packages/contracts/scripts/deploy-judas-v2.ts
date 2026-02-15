import { ethers } from "hardhat";

async function main() {
    console.log("=== DEPLOYING JUDAS PROTOCOL (pointing to new sGUILT) ===");

    const SGUILT_ADDRESS = "0xF49112b4D69e563fF45a37737A3fC4892565A6B0"; // StakingCathedralV2
    const TREASURY_ADDRESS = "0x55A7b50033031aa0ba6A7CbB7503CA4EAb6cba05";

    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "MON");

    const JudasFactory = await ethers.getContractFactory("JudasProtocol");
    const judas = await JudasFactory.deploy(SGUILT_ADDRESS, deployer.address, TREASURY_ADDRESS);

    console.log("Waiting for deployment...");
    await judas.waitForDeployment();
    const judasAddress = await judas.getAddress();
    console.log("✅ JudasProtocol deployed to:", judasAddress);
    console.log("\nUpdate .env.local: NEXT_PUBLIC_JUDAS_ADDRESS=" + judasAddress);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

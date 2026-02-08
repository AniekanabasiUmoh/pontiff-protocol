import { ethers } from 'hardhat';

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const guiltTokenAddress = process.env.GUILT_TOKEN_ADDRESS || "0x3ba95dB0F41E81d71bCee84fAabb20F047b8d9fA"; // Default from .env.local
    const treasuryAddress = process.env.TREASURY_WALLET || deployer.address; // Fallback to deployer
    const pontiffAddress = deployer.address; // For now, deployer is Pontiff

    console.log("Deploying PontiffRPS with config:", {
        guiltToken: guiltTokenAddress,
        treasury: treasuryAddress,
        pontiff: pontiffAddress
    });

    const PontiffRPS = await ethers.getContractFactory("PontiffRPS");
    const rps = await PontiffRPS.deploy(guiltTokenAddress, treasuryAddress, pontiffAddress);

    await rps.waitForDeployment();

    console.log("PontiffRPS deployed to:", await rps.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

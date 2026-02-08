// SPDX-License-Identifier: MIT
import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const guiltTokenAddress = process.env.GUILT_TOKEN_ADDRESS;
    if (!guiltTokenAddress) {
        throw new Error("GUILT_TOKEN_ADDRESS not found in .env");
    }

    // The Pontiff backend wallet address
    // For now, we set it to the deployer, but in prod it should be the backend wallet
    const pontiffAddress = process.env.PONTIFF_WALLET_ADDRESS || deployer.address;

    console.log("Deploying SessionWalletFactory...");
    console.log("GuiltToken:", guiltTokenAddress);
    console.log("Pontiff (Backend):", pontiffAddress);

    const SessionWalletFactory = await ethers.getContractFactory("SessionWalletFactory");
    const factory = await SessionWalletFactory.deploy(guiltTokenAddress, pontiffAddress);

    await factory.waitForDeployment();

    console.log(`SessionWalletFactory deployed to: ${await factory.getAddress()}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

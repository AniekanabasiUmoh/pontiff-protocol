import { ethers } from 'hardhat';

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    const guiltTokenAddress = process.env.GUILT_TOKEN_ADDRESS;
    // For Pontiff, we can use the deployer or a specific backend address
    const pontiffAddress = deployer.address;

    if (!guiltTokenAddress) {
        console.error("Missing GUILT_TOKEN_ADDRESS in .env");
        process.exit(1);
    }

    console.log("Deploying SessionWalletFactory...");
    console.log("GUILT Token:", guiltTokenAddress);
    console.log("Pontiff (Backend):", pontiffAddress);

    const SessionWalletFactory = await ethers.getContractFactory("SessionWalletFactory");
    const factory = await SessionWalletFactory.deploy(guiltTokenAddress, pontiffAddress);

    await factory.waitForDeployment();

    console.log("SessionWalletFactory deployed to:", await factory.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

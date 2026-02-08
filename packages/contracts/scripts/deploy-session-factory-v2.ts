import { ethers } from 'hardhat';
import * as fs from 'fs';

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const guiltTokenAddress = process.env.GUILT_TOKEN_ADDRESS;
    const pontiffAddress = deployer.address;

    if (!guiltTokenAddress) {
        throw new Error("Missing GUILT_TOKEN_ADDRESS");
    }

    const SessionWalletFactory = await ethers.getContractFactory("SessionWalletFactory");
    const factory = await SessionWalletFactory.deploy(guiltTokenAddress, pontiffAddress);
    await factory.waitForDeployment();

    const address = await factory.getAddress();
    console.log("SessionWalletFactory deployed to:", address);

    // Write to file
    const output = {
        network: "monadTestnet",
        SessionWalletFactory: address,
        GuiltToken: guiltTokenAddress,
        timestamp: new Date().toISOString()
    };

    fs.writeFileSync('deployed_contracts.json', JSON.stringify(output, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

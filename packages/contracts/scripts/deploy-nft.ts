import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
    console.log("Deploying DebateVictoryNFT to Monad Testnet...");

    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Deployer balance:", ethers.formatEther(balance), "MON");

    if (balance === 0n) {
        console.error("ERROR: Deployer has no MON. Get testnet tokens first.");
        process.exit(1);
    }

    // Deploy the NFT contract
    const DebateVictoryNFT = await ethers.getContractFactory("DebateVictoryNFT");
    const nft = await DebateVictoryNFT.deploy();

    await nft.waitForDeployment();

    const contractAddress = await nft.getAddress();
    console.log("DebateVictoryNFT deployed to:", contractAddress);

    // Save to file for reliable retrieval
    const deploymentInfo = {
        contract: "DebateVictoryNFT",
        address: contractAddress,
        network: "monadTestnet",
        chainId: 10143,
        deployedAt: new Date().toISOString()
    };
    fs.writeFileSync("nft-deployment.json", JSON.stringify(deploymentInfo, null, 2));
    console.log("Saved deployment info to nft-deployment.json");

    // Output for .env file
    console.log("\n=== Add to .env.local ===");
    console.log(`DEBATE_NFT_CONTRACT_ADDRESS=${contractAddress}`);
    console.log("=========================\n");

    // Verify the contract is working
    const name = await nft.name();
    const symbol = await nft.symbol();
    console.log(`Contract Info: ${name} (${symbol})`);

    console.log("\nDeployment complete!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Deployment failed:", error);
        process.exit(1);
    });

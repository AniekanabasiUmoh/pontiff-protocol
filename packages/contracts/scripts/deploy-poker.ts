import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    console.log("Starting Poker Deployment...");

    // Load existing deployments
    const deploymentPath = path.join(__dirname, "../vatican_deployment.json");
    let deploymentData: any = {};
    if (fs.existsSync(deploymentPath)) {
        deploymentData = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    }

    // Get MON Token Address
    const monAddress = deploymentData.MON_ADDRESS || process.env.MON_TOKEN_ADDRESS;
    if (!monAddress) {
        throw new Error("MON_ADDRESS not found in vatican_deployment.json or env!");
    }

    // Deploy Poker
    console.log("Deploying PokerGame...");
    const PokerGame = await ethers.getContractFactory("PokerGame");
    const poker = await PokerGame.deploy(monAddress);
    await poker.waitForDeployment();
    const pokerAddress = await poker.getAddress();

    console.log(`PokerGame deployed to: ${pokerAddress}`);

    // Save Address
    deploymentData.POKER_ADDRESS = pokerAddress;
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
    console.log("deploying VaticanEntry...");

    // Config
    // Monad Testnet MON (Using WMON if native transfer not supported by interface, 
    // but for hackathon usually we can mock or use a known WMON address)
    let monAddress = process.env.MON_TOKEN_ADDRESS;
    const ENTRY_FEE = ethers.parseEther("10"); // 10 MON

    if (!monAddress) {
        console.log("MON_TOKEN_ADDRESS not set. Deploying MockMON...");
        const MockMON = await ethers.getContractFactory("MockMON");
        const mockMon = await MockMON.deploy();
        await mockMon.waitForDeployment();
        monAddress = await mockMon.getAddress();
        console.log(`MockMON deployed to: ${monAddress}`);
    }

    console.log(`Using MON Address: ${monAddress}`);
    console.log(`Entry Fee: ${ethers.formatEther(ENTRY_FEE)} MON`);

    const VaticanEntry = await ethers.getContractFactory("VaticanEntry");
    const vaticanEntry = await VaticanEntry.deploy(monAddress, ENTRY_FEE);

    await vaticanEntry.waitForDeployment();

    const address = await vaticanEntry.getAddress();
    console.log(`VaticanEntry deployed to: ${address}`);

    const fs = require("fs");
    const deploymentData = {
        MON_ADDRESS: monAddress,
        VATICAN_ENTRY_ADDRESS: address
    };
    fs.writeFileSync("vatican_deployment.json", JSON.stringify(deploymentData, null, 2));
    console.log("Deployment data saved to vatican_deployment.json");

    // Validation
    console.log("Verifying deployment...");
    // Add verify script call if needed, for now just logging.
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

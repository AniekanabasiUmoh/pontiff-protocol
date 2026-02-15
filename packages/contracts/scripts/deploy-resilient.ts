
import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// State file to track deployment progress
const STATE_FILE = "deployment-state.json";

interface DeploymentState {
    judasAddress?: string;
    sGuiltAddress?: string;
    treasuryAddress?: string;
}

function loadState(): DeploymentState {
    if (fs.existsSync(STATE_FILE)) {
        return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    }
    return {};
}

function saveState(state: DeploymentState) {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function main() {
    const state = loadState();
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

    // 0. Configuration (Get existing addresses or deploy mocks if needed)
    // For upgrade, we assume sGuilt and Treasury exist. 
    // You can populate these in deployment-state.json manually if preferred, 
    // or we default to known testnet addresses if not found.

    // REPLACE THESE WITH REAL ADDRESSES IF KNOWN, OR RELY ON STATE
    // From previous deployments/production.json context if available
    const sGUILT_ADDRESS = state.sGuiltAddress || "0xYourSGuiltAddressHere";
    const TREASURY_ADDRESS = state.treasuryAddress || deployer.address; // Fallback to deployer

    if (!state.judasAddress) {
        console.log("Deploying JudasProtocol...");

        // We need sGuilt address. If invalid, this will fail.
        // Assuming user will ensure correct addresses or update this script.

        // Check if sGuilt is mock or real. 
        // console.log("Using sGuilt at:", sGUILT_ADDRESS);

        try {
            const JudasProtocol = await ethers.getContractFactory("JudasProtocol");
            const judas = await JudasProtocol.deploy(sGUILT_ADDRESS, deployer.address, TREASURY_ADDRESS);

            console.log("JudasProtocol deployment tx hash:", judas.deploymentTransaction()?.hash);
            await judas.waitForDeployment();

            const address = await judas.getAddress();
            console.log("JudasProtocol deployed to:", address);

            state.judasAddress = address;
            saveState(state);
        } catch (error) {
            console.error("Failed to deploy JudasProtocol:", error);
            process.exit(1);
        }
    } else {
        console.log("JudasProtocol already deployed at:", state.judasAddress);
    }

    console.log("Deployment Complete.");
    console.log("Judas Protocol: ", state.judasAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

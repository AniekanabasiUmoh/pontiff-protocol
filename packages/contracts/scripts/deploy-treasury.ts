
import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

dotenv.config();

const STATE_FILE = path.join(__dirname, "treasury-deploy-state.json");

interface DeployState {
    treasuryAddress?: string;
    deployedAt?: string;
    signerAddress?: string;
    guiltAddress?: string;
}

function loadState(): DeployState {
    if (fs.existsSync(STATE_FILE)) {
        return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    }
    return {};
}

function saveState(state: DeployState) {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    console.log("💾 State saved to", STATE_FILE);
}

async function main() {
    console.log("🏛️  Deploying Pontiff Treasury (Casino Vault)...");
    console.log("Using resilient deployment pattern (auto-resume on failure)\n");

    const state = loadState();

    // Check if already deployed
    if (state.treasuryAddress) {
        console.log("✅ Treasury already deployed at:", state.treasuryAddress);
        console.log("   Deployed at:", state.deployedAt);
        console.log("   Signer:", state.signerAddress);
        console.log("   GUILT:", state.guiltAddress);
        console.log("\nTo redeploy, delete:", STATE_FILE);
        return;
    }

    // Get signers
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);

    const balance = await deployer.provider.getBalance(deployer.address);
    console.log("Balance:", ethers.formatEther(balance), "MON");

    if (balance === 0n) {
        throw new Error("Deployer has no MON for gas!");
    }

    // Config
    const GUILT_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_GUILT_ADDRESS;
    if (!GUILT_TOKEN_ADDRESS) {
        throw new Error("Missing NEXT_PUBLIC_GUILT_ADDRESS in .env");
    }

    // The backend signer (Pontiff) — signs withdrawal permits
    const PONTIFF_SIGNER = process.env.PONTIFF_PRIVATE_KEY
        ? new ethers.Wallet(process.env.PONTIFF_PRIVATE_KEY).address
        : deployer.address;

    console.log("\nConfig:");
    console.log("  GUILT Token:", GUILT_TOKEN_ADDRESS);
    console.log("  Backend Signer:", PONTIFF_SIGNER);
    console.log("");

    // Deploy with retry
    let attempts = 0;
    const MAX_ATTEMPTS = 5;

    while (attempts < MAX_ATTEMPTS) {
        attempts++;
        console.log(`\n🚀 Deploy attempt ${attempts}/${MAX_ATTEMPTS}...`);

        try {
            const Treasury = await ethers.getContractFactory("PontiffTreasury");
            const treasury = await Treasury.deploy(GUILT_TOKEN_ADDRESS, PONTIFF_SIGNER);

            console.log("⏳ Waiting for confirmation...");
            await treasury.waitForDeployment();

            const address = await treasury.getAddress();

            // Save state immediately
            state.treasuryAddress = address;
            state.deployedAt = new Date().toISOString();
            state.signerAddress = PONTIFF_SIGNER;
            state.guiltAddress = GUILT_TOKEN_ADDRESS;
            saveState(state);

            console.log("\n✅ ════════════════════════════════════════");
            console.log("   PontiffTreasury deployed successfully!");
            console.log("   Address:", address);
            console.log("   ════════════════════════════════════════\n");

            console.log("📋 Add to your .env.local:");
            console.log(`   NEXT_PUBLIC_TREASURY_ADDRESS="${address}"`);
            console.log("");
            console.log("📋 Add to .env.contracts:");
            console.log(`   NEXT_PUBLIC_TREASURY_ADDRESS=${address}`);

            return;
        } catch (error: any) {
            console.error(`❌ Attempt ${attempts} failed:`, error.message?.substring(0, 100));

            if (attempts < MAX_ATTEMPTS) {
                const delay = attempts * 5000; // Exponential backoff
                console.log(`⏳ Retrying in ${delay / 1000}s...`);
                await new Promise((r) => setTimeout(r, delay));
            }
        }
    }

    console.error("\n💀 All deployment attempts failed.");
    console.error("The Monad testnet may be congested. Try again later.");
    process.exitCode = 1;
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

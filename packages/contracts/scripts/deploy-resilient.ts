import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * RESILIENT DEPLOYMENT - Self-healing deployment script
 * Saves state after each step. Re-run to resume from failure point.
 *
 * Constructor signatures (verified from source):
 *   MockMON()
 *   GuiltToken(_initialOwner, _treasury, _staking)
 *   VaticanEntry(_monToken, _entryFee)
 *   StakingCathedralV2(_asset, _initialOwner)
 *   Indulgence(_paymentToken, _cathedral, _initialOwner)
 *   JudasProtocol(_sGuilt, _initialOwner, _treasury)
 *   RPSGame(_monToken)
 *   PokerGame(_wagerToken, _treasury, _initialOwner)
 */

const STATE_FILE = path.join(__dirname, "deployment-state.json");

async function main() {
    console.log("\n==================================================");
    console.log("🦅 PONTIFF RESILIENT DEPLOYMENT (Sniper Mode)");
    console.log("==================================================\n");

    let state: any = {};
    if (fs.existsSync(STATE_FILE)) {
        state = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
        console.log("📂 Resuming from saved state...\n");
    } else {
        console.log("🆕 Starting fresh deployment\n");
    }

    const [deployer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`Deployer: ${deployer.address}`);
    console.log(`Balance:  ${ethers.formatEther(balance)} MON\n`);

    const TREASURY = deployer.address;
    const ENTRY_FEE = ethers.parseEther("100");

    // ====================================================
    // STEP 1: MockMON
    // ====================================================
    if (!state.monAddress) {
        console.log("1️⃣  Deploying MockMON...");
        try {
            const F = await ethers.getContractFactory("MockMON");
            const c = await F.deploy(); // constructor()
            await c.waitForDeployment();
            state.monAddress = await c.getAddress();
            saveState(state);
            console.log(`   ✅ MockMON: ${state.monAddress}\n`);
        } catch (e) {
            console.error("   ❌ Failed. Re-run to retry from this step.");
            throw e;
        }
    } else {
        console.log(`   ⏩ MockMON: ${state.monAddress}\n`);
    }

    // ====================================================
    // STEP 2: GuiltToken
    // ====================================================
    if (!state.guiltAddress) {
        console.log("2️⃣  Deploying GuiltToken...");
        try {
            const F = await ethers.getContractFactory("GuiltToken");
            const c = await F.deploy(
                deployer.address, // _initialOwner
                TREASURY,         // _treasury
                deployer.address  // _staking (temp, updated in step 5)
            );
            await c.waitForDeployment();
            state.guiltAddress = await c.getAddress();
            saveState(state);
            console.log(`   ✅ GuiltToken: ${state.guiltAddress}\n`);
        } catch (e) {
            console.error("   ❌ Failed. Re-run to retry.");
            throw e;
        }
    } else {
        console.log(`   ⏩ GuiltToken: ${state.guiltAddress}\n`);
    }

    // ====================================================
    // STEP 3: VaticanEntry
    // ====================================================
    if (!state.vaticanAddress) {
        console.log("3️⃣  Deploying VaticanEntry...");
        try {
            const F = await ethers.getContractFactory("VaticanEntry");
            const c = await F.deploy(
                state.monAddress, // _monToken
                ENTRY_FEE         // _entryFee
            );
            await c.waitForDeployment();
            state.vaticanAddress = await c.getAddress();
            saveState(state);
            console.log(`   ✅ VaticanEntry: ${state.vaticanAddress}\n`);
        } catch (e) {
            console.error("   ❌ Failed. Re-run to retry.");
            throw e;
        }
    } else {
        console.log(`   ⏩ VaticanEntry: ${state.vaticanAddress}\n`);
    }

    // ====================================================
    // STEP 4: StakingCathedralV2
    // ====================================================
    if (!state.stakingAddress) {
        console.log("4️⃣  Deploying StakingCathedralV2...");
        try {
            const F = await ethers.getContractFactory("StakingCathedralV2");
            const c = await F.deploy(
                state.guiltAddress, // _asset (IERC20 address)
                deployer.address    // _initialOwner
            );
            await c.waitForDeployment();
            state.stakingAddress = await c.getAddress();
            saveState(state);
            console.log(`   ✅ StakingCathedralV2: ${state.stakingAddress}\n`);
        } catch (e) {
            console.error("   ❌ Failed. Re-run to retry.");
            throw e;
        }
    } else {
        console.log(`   ⏩ StakingCathedralV2: ${state.stakingAddress}\n`);
    }

    // ====================================================
    // STEP 5: Wire GuiltToken to real staking
    // ====================================================
    if (!state.taxWired) {
        console.log("5️⃣  Wiring GuiltToken -> Staking...");
        try {
            const GuiltToken = await ethers.getContractFactory("GuiltToken");
            const guilt = GuiltToken.attach(state.guiltAddress) as any;

            const tx1 = await guilt.updateWallets(TREASURY, state.stakingAddress);
            await tx1.wait();
            console.log("   ✓ updateWallets done");

            const tx2 = await guilt.setTaxExempt(state.stakingAddress, true);
            await tx2.wait();
            console.log("   ✓ setTaxExempt done");

            state.taxWired = true;
            saveState(state);
            console.log(`   ✅ Tax wiring complete\n`);
        } catch (e) {
            console.error("   ❌ Failed. Re-run to retry.");
            throw e;
        }
    } else {
        console.log(`   ⏩ Tax wiring: done\n`);
    }

    // ====================================================
    // STEP 6: Indulgence NFT
    // ====================================================
    if (!state.indulgenceAddress) {
        console.log("6️⃣  Deploying Indulgence NFT...");
        try {
            const F = await ethers.getContractFactory("Indulgence");
            const c = await F.deploy(
                state.guiltAddress,  // _paymentToken
                state.stakingAddress, // _cathedral
                deployer.address      // _initialOwner
            );
            await c.waitForDeployment();
            state.indulgenceAddress = await c.getAddress();
            saveState(state);
            console.log(`   ✅ Indulgence: ${state.indulgenceAddress}\n`);
        } catch (e) {
            console.error("   ❌ Failed. Re-run to retry.");
            throw e;
        }
    } else {
        console.log(`   ⏩ Indulgence: ${state.indulgenceAddress}\n`);
    }

    // ====================================================
    // STEP 7: JudasProtocol (FIXED)
    // ====================================================
    if (!state.judasAddress) {
        console.log("7️⃣  Deploying JudasProtocol (FIXED)...");
        try {
            const F = await ethers.getContractFactory("JudasProtocol");
            const c = await F.deploy(
                state.guiltAddress, // _sGuilt
                deployer.address,   // _initialOwner
                TREASURY            // _treasury
            );
            await c.waitForDeployment();
            state.judasAddress = await c.getAddress();
            saveState(state);
            console.log(`   ✅ JudasProtocol: ${state.judasAddress}\n`);
        } catch (e) {
            console.error("   ❌ Failed. Re-run to retry.");
            throw e;
        }
    } else {
        console.log(`   ⏩ JudasProtocol: ${state.judasAddress}\n`);
    }

    // ====================================================
    // STEP 8: RPSGame
    // ====================================================
    if (!state.rpsAddress) {
        console.log("8️⃣  Deploying RPSGame...");
        try {
            const F = await ethers.getContractFactory("RPSGame");
            const c = await F.deploy(
                state.guiltAddress // _monToken (only param)
            );
            await c.waitForDeployment();
            state.rpsAddress = await c.getAddress();
            saveState(state);
            console.log(`   ✅ RPSGame: ${state.rpsAddress}\n`);
        } catch (e) {
            console.error("   ❌ Failed. Re-run to retry.");
            throw e;
        }
    } else {
        console.log(`   ⏩ RPSGame: ${state.rpsAddress}\n`);
    }

    // ====================================================
    // STEP 9: PokerGame (FULLY REWRITTEN)
    // ====================================================
    if (!state.pokerAddress) {
        console.log("9️⃣  Deploying PokerGame (REWRITTEN)...");
        try {
            const F = await ethers.getContractFactory("PokerGame");
            const c = await F.deploy(
                state.guiltAddress, // _wagerToken
                TREASURY,           // _treasury
                deployer.address    // _initialOwner
            );
            await c.waitForDeployment();
            state.pokerAddress = await c.getAddress();
            saveState(state);
            console.log(`   ✅ PokerGame: ${state.pokerAddress}\n`);
        } catch (e) {
            console.error("   ❌ Failed. Re-run to retry.");
            throw e;
        }
    } else {
        console.log(`   ⏩ PokerGame: ${state.pokerAddress}\n`);
    }

    // ====================================================
    // COMPLETE
    // ====================================================
    console.log("==================================================");
    console.log("🎉 ALL CONTRACTS DEPLOYED!");
    console.log("==================================================\n");

    console.log("📋 Contract Addresses:");
    console.log(`   MockMON            = ${state.monAddress}`);
    console.log(`   GuiltToken         = ${state.guiltAddress}`);
    console.log(`   VaticanEntry       = ${state.vaticanAddress}`);
    console.log(`   StakingCathedralV2 = ${state.stakingAddress}`);
    console.log(`   Indulgence         = ${state.indulgenceAddress}`);
    console.log(`   JudasProtocol      = ${state.judasAddress}`);
    console.log(`   RPSGame            = ${state.rpsAddress}`);
    console.log(`   PokerGame          = ${state.pokerAddress}`);

    // Save .env files
    const frontendEnv = `# Pontiff Contract Addresses (Generated ${new Date().toISOString()})
NEXT_PUBLIC_MON_ADDRESS=${state.monAddress}
NEXT_PUBLIC_GUILT_ADDRESS=${state.guiltAddress}
NEXT_PUBLIC_VATICAN_ENTRY_ADDRESS=${state.vaticanAddress}
NEXT_PUBLIC_STAKING_ADDRESS=${state.stakingAddress}
NEXT_PUBLIC_INDULGENCE_ADDRESS=${state.indulgenceAddress}
NEXT_PUBLIC_JUDAS_ADDRESS=${state.judasAddress}
NEXT_PUBLIC_RPS_ADDRESS=${state.rpsAddress}
NEXT_PUBLIC_POKER_ADDRESS=${state.pokerAddress}
NEXT_PUBLIC_CHAIN_ID=10143
NEXT_PUBLIC_MONAD_RPC_URL=https://monad-testnet.drpc.org
`;

    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) fs.mkdirSync(deploymentsDir, { recursive: true });
    fs.writeFileSync(path.join(deploymentsDir, "production.json"), JSON.stringify(state, null, 2));
    fs.writeFileSync(path.join(__dirname, "../../../apps/web/.env.contracts"), frontendEnv);

    console.log("\n💾 State saved. .env.contracts written.");
    console.log("📝 Re-run this script any time - it will skip completed steps.\n");
}

function saveState(state: any) {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

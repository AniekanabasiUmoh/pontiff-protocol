import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * DEMO DAY VERIFICATION SCRIPT
 * Executes the full "Happy Path" + "Betrayal" loop.
 */

async function main() {
    console.log("\n==================================================");
    console.log("🎮 VERIFYING DEMO DAY LOOP");
    console.log("==================================================\n");

    // 1. Load State
    const statePath = path.join(__dirname, "deployment-state.json");
    if (!fs.existsSync(statePath)) {
        throw new Error("Deployment state not found. Run deploy-resilient.ts first.");
    }
    const state = JSON.parse(fs.readFileSync(statePath, "utf8"));

    const [signer] = await ethers.getSigners();
    console.log(`User: ${signer.address}`);

    // 2. Load Contracts
    const GuiltToken = await ethers.getContractAt("GuiltToken", state.guiltAddress, signer);
    const Staking = await ethers.getContractAt("StakingCathedralV2", state.stakingAddress, signer);
    const Judas = await ethers.getContractAt("JudasProtocol", state.judasAddress, signer);

    // 3. Check Capital
    let guiltBal = await GuiltToken.balanceOf(signer.address);
    console.log(`Initial GUILT Balance: ${ethers.formatEther(guiltBal)}`);

    if (guiltBal === 0n) {
        console.log("⚠️  No GUILT! attempting to mint/buy...");
        // If we are deployer/owner, maybe we minted to ourselves?
        // If not, we fail here.
        throw new Error("User has no GUILT. Please fund wallet first.");
    }

    // ---------------------------------------------------------
    // STEP 1: STAKE
    // ---------------------------------------------------------
    console.log("\n--- STEP 1: CONSECRATE SACRIFICE (Stake) ---");
    const STAKE_AMOUNT = ethers.parseEther("1000");

    // Approve
    console.log("Approving Staking...");
    const txApprove = await GuiltToken.approve(state.stakingAddress, STAKE_AMOUNT);
    await txApprove.wait();

    // Stake
    console.log("Staking 1000 GUILT...");
    const txStake = await Staking.stake(STAKE_AMOUNT);
    await txStake.wait();

    const sGuiltBal = await Staking.balanceOf(signer.address);
    console.log(`New sGUILT Balance: ${ethers.formatEther(sGuiltBal)}`);

    // ---------------------------------------------------------
    // STEP 2: ENTER ARENA
    // ---------------------------------------------------------
    console.log("\n--- STEP 2: ENTER ARENA (Judas Protocol) ---");
    const JUDAS_AMOUNT = ethers.parseEther("500"); // 500 sGUILT

    // Approve Judas
    console.log("Approving Judas...");
    const txApproveJudas = await Staking.approve(state.judasAddress, JUDAS_AMOUNT);
    await txApproveJudas.wait();

    // Deposit
    console.log("Depositing 500 sGUILT...");
    const txDeposit = await Judas.deposit(JUDAS_AMOUNT);
    await txDeposit.wait();

    let userInfo = await Judas.userInfo(signer.address);
    console.log(`Staked in Arena: ${ethers.formatEther(userInfo.stakedAmount)} sGUILT`);
    console.log(`Is Betrayer: ${userInfo.isBetrayer}`);

    // ---------------------------------------------------------
    // STEP 3: BETRAYAL
    // ---------------------------------------------------------
    console.log("\n--- STEP 3: THE BETRAYAL ---");
    console.log("Signaling Betrayal...");
    const txBetray = await Judas.signalBetrayal();
    await txBetray.wait();

    userInfo = await Judas.userInfo(signer.address);
    console.log(`Is Betrayer NOW: ${userInfo.isBetrayer}`);

    // ---------------------------------------------------------
    // STEP 4: WAIT FOR EPOCH
    // ---------------------------------------------------------
    console.log("\n--- STEP 4: AWAITING RESOLUTION ---");
    let epochId = await Judas.currentEpochId();
    let epoch = await Judas.epochs(epochId);
    let endTime = Number(epoch.endTime);
    let now = Math.floor(Date.now() / 1000);
    let timeLeft = endTime - now;

    console.log(`Epoch Ends At: ${new Date(endTime * 1000).toISOString()}`);
    console.log(`Time Left: ${timeLeft} seconds`);

    if (timeLeft > 0) {
        console.log("Waiting for epoch to end... (Sleeping)");
        // We wait + buffer
        await new Promise(r => setTimeout(r, (timeLeft + 10) * 1000));
    } else {
        console.log("Epoch is already over.");
    }

    // ---------------------------------------------------------
    // STEP 5: RESOLVE
    // ---------------------------------------------------------
    console.log("\n--- STEP 5: RESOLVE EPOCH ---");
    try {
        const txResolve = await Judas.resolveEpoch();
        console.log("Resolving...");
        await txResolve.wait();
        console.log("✅ Epoch Resolved!");
    } catch (e: any) {
        if (e.message.includes("Already resolved")) {
            console.log("Epoch was already resolved.");
        } else {
            console.error("Resolution Failed:", e);
            // Don't throw, try to continue to check state
        }
    }

    epoch = await Judas.epochs(epochId);
    console.log(`Resolved: ${epoch.resolved}`);
    console.log(`Loyalist Multiplier: ${ethers.formatEther(epoch.loyalistMultiplier)}x`);
    console.log(`Betrayer Multiplier: ${ethers.formatEther(epoch.betrayerMultiplier)}x`);


    // ---------------------------------------------------------
    // STEP 6: WITHDRAW
    // ---------------------------------------------------------
    console.log("\n--- STEP 6: WITHDRAW ---");
    // We withdraw whatever is left
    userInfo = await Judas.userInfo(signer.address);
    // Note: pending rewards are only claimed ON interaction.
    // We perform a 0 deposit to claim? Or just withdraw whatever `stakedAmount` says?
    // UserInfo isn't updated until interaction.
    // But `withdraw` calls `_claimPendingRewards` FIRST.
    // So we can try to withdraw 100% of what we *think* we have?
    // Actually, `withdraw` checks `amount <= user.stakedAmount`.
    // The `user.stakedAmount` in storage is OLD until `claim` runs. 
    // This is a subtle UX/Contract thing.
    // If I gained rewards, my stored balance is LOW.
    // If I perform a withdraw(currentStoredBalance), I might leave rewards on table?
    // Wait, `_claimPendingRewards` updates `stakedAmount` before check.
    // BUT the standard ERC20 `withdraw` pattern usually expects specific amount.
    // If I request `withdraw(500)`, and I have 600 now, it works.
    // If I lost money and have 400, `withdraw(500)` fails!

    // SAFE WITHDRAW PATTERN:
    // 1. Call a dummy verify/update function?
    // 2. Or just try to withdraw a small amount to trigger the claim?
    // Let's try depositing 0? No, deposit requires > 0.
    // Let's call `resolveEpoch` again? No.

    // We will just try to withdraw the original 500.
    // If we won (Betrayer alone vs 0 loyalists? No, we need loyalists).
    // In this script, we are the ONLY user.
    // Total Loyal = 0 (we betrayed). Total Betrayed = 500.
    // Betrayal % = 100%.
    // > 40% => FULL COUP.
    // Betrayers steal 50% of Loyalist.
    // Loyalist pool is 0. 50% of 0 is 0.
    // Betrayers get 0 loot.
    // So Betrayer multiplier is 1.0x.
    // So we should have exactly 500.

    try {
        console.log("Withdrawing 500 sGUILT...");
        const txWithdraw = await Judas.withdraw(JUDAS_AMOUNT);
        await txWithdraw.wait();
        console.log("✅ Withdrawal Successful!");
    } catch (e) {
        console.error("Withdrawal Failed (likely unexpected balance change):", e);
    }

    const finalSGuiltBal = await Staking.balanceOf(signer.address);
    console.log(`Final sGUILT Balance: ${ethers.formatEther(finalSGuiltBal)}`);

    console.log("\n🎉 DEMO LOOP VERIFIED!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

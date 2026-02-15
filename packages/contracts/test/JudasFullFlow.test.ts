import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("JudasProtocol Full Flow Simulation", function () {
    let judas: any;
    let sGuilt: any;
    let staking: any;
    let owner: any, loyalist: any, betrayer: any, treasury: any, bystander: any;

    const EPOCH_DURATION = 86400; // 24 hours
    const STAKE_AMOUNT = ethers.parseEther("1000");

    before(async function () {
        console.error("DEBUG: Entering before hook");
        try {
            [owner, loyalist, betrayer, treasury, bystander] = await ethers.getSigners();
            console.error("DEBUG: Signers fetched");
            console.error(`Loyalist: ${loyalist.address}`);
            console.error(`Betrayer: ${betrayer.address}`);
        } catch (e) {
            console.error("DEBUG: Before hook failed", e);
            throw e;
        }
    });

    // Create trivial dummy test
    it("Dummy Test", async function () {
        console.log("Dummy Test Running");
        [owner] = await ethers.getSigners();
        expect(true).to.be.true;
    });


    it("1. Deployment & Setup", async function () {
        try {
            // 1. Deploy GuiltToken (Initial)
            console.log("Deploying GuiltToken...");
            const GuiltTokenFactory = await ethers.getContractFactory("GuiltToken");
            sGuilt = await GuiltTokenFactory.deploy(owner.address, treasury.address, owner.address);
            await sGuilt.waitForDeployment();
            console.log(`✅ GuiltToken Deployed: ${await sGuilt.getAddress()}`);
        } catch (error) {
            console.error("Failed to deploy GuiltToken:", error);
            throw error;
        }

        try {
            // 2. Deploy Staking (Cathedral)
            // Contract name is "StakingCathedral", not "Staking"
            const StakingFactory = await ethers.getContractFactory("StakingCathedral");
            staking = await StakingFactory.deploy(await sGuilt.getAddress(), owner.address);
            await staking.waitForDeployment();
            console.log(`✅ StakingCathedral Deployed: ${await staking.getAddress()}`);
        } catch (error) {
            console.error("Failed to deploy StakingCathedral:", error);
            throw error;
        }

        // 3. Update GuiltToken to point to real Staking contract
        try {
            await sGuilt.updateWallets(treasury.address, await staking.getAddress());
            console.log("✅ GuiltToken Wallets Updated");
        } catch (error) {
            console.error("Failed to update GuiltToken wallets:", error);
            throw error;
        }

        // 4. Deploy Judas Protocol
        try {
            console.log("Deploying JudasProtocol...");
            const JudasProtocol = await ethers.getContractFactory("JudasProtocol");
            judas = await JudasProtocol.deploy(await sGuilt.getAddress(), owner.address, treasury.address);
            await judas.waitForDeployment();
            console.log(`✅ JudasProtocol Deployed: ${await judas.getAddress()}`);
        } catch (error) {
            console.error("Failed to deploy JudasProtocol:", error);
            throw error;
        }

        // Distribution
        await sGuilt.transfer(loyalist.address, STAKE_AMOUNT * 10n);
        await sGuilt.transfer(betrayer.address, STAKE_AMOUNT * 10n);

        // Approvals
        await sGuilt.connect(loyalist).approve(await judas.getAddress(), ethers.MaxUint256);
        await sGuilt.connect(betrayer).approve(await judas.getAddress(), ethers.MaxUint256);
        await sGuilt.connect(loyalist).approve(await staking.getAddress(), ethers.MaxUint256);
        await sGuilt.connect(betrayer).approve(await staking.getAddress(), ethers.MaxUint256);

        // Exempt Judas from tax to avoid double taxation on deposit/withdraw if applicable
        // (Optional: depending on GuiltToken logic, usually protocol contracts are exempt)
        await sGuilt.setTaxExempt(await judas.getAddress(), true);
    });

    it("2. Staking Phase (Day 1)", async function () {
        console.log("\n--- Phase 1: Entering the Arena ---");

        // Loyalist Enters
        await judas.connect(loyalist).deposit(STAKE_AMOUNT);
        console.log(`😇 Loyalist staked ${ethers.formatEther(STAKE_AMOUNT)} GUILT`);

        // Betrayer Enters
        await judas.connect(betrayer).deposit(STAKE_AMOUNT);
        console.log(`😈 Betrayer staked ${ethers.formatEther(STAKE_AMOUNT)} GUILT`);

        const state = await judas.getGameState();
        expect(state.totalLoyal).to.equal(STAKE_AMOUNT * 2n);
        expect(state.totalBetrayed).to.equal(0n);
    });

    it("3. Betrayal Phase (The Turn)", async function () {
        console.log("\n--- Phase 2: The Betrayal ---");

        // Betrayer Signals
        await judas.connect(betrayer).signalBetrayal();
        console.log(`🗡️  User ${betrayer.address.slice(0, 6)} signals BETRAYAL!`);

        const state = await judas.getGameState();
        const betrayalPct = state.betrayalPercentage;
        console.log(`📊 Current Betrayal Rate: ${betrayalPct}%`);

        expect(Number(betrayalPct)).to.equal(50); // 1 vs 1 = 50%
    });

    it("4. Attempted Withdrawals (Locked)", async function () {
        console.log("\n--- Phase 3: Lockdown Check ---");

        await expect(
            judas.connect(loyalist).withdraw(ethers.parseEther("10"))
        ).to.be.revertedWith("Cannot withdraw during epoch");
        console.log("✅ Loyalist locked out (Correct)");

        await expect(
            judas.connect(betrayer).withdraw(ethers.parseEther("10"))
        ).to.be.revertedWith("Betrayers locked until resolution"); // Or "Cannot withdraw" depending on impl
        console.log("✅ Betrayer locked out (Correct)");
    });

    it("5. Resolution (The Judgment)", async function () {
        console.log("\n--- Phase 4: Resolution ---");

        // Fast forward
        await time.increase(EPOCH_DURATION + 1);
        console.log("⏳ Time flies... 24h passed.");

        const tx = await judas.resolveEpoch();
        const receipt = await tx.wait();

        console.log("⚖️  Epoch Resolved!");

        // Check Events
        const event = receipt.logs.find((log: any) => {
            try { return judas.interface.parseLog(log)?.name === 'EpochResolved'; } catch { return false; }
        });
        const parsed = judas.interface.parseLog(event);
        console.log(`📜 Outcome: ${parsed.args.outcome} (${parsed.args.betrayalPct}% Betrayal)`);

        // 50% Betrayal = FULL_COUP (>40%)
        // Rule: Betrayers steal 50% of Loyalist stack.
        // Loyalist: 1000 -> loses 50% = 500 remaining.
        // Betrayer: 1000 -> gains 500 = 1500 total.

        expect(parsed.args.outcome).to.equal("FULL_COUP");
    });

    it("6. Settlement & Withdrawals", async function () {
        console.log("\n--- Phase 5: Settlement ---");

        // Check internal accounting BEFORE withdraw (simulated via position check)
        // Note: The contract updates balances lazily on next interaction (withdraw/deposit).

        // Loyalist Withdraws
        const balanceBeforeL = await sGuilt.balanceOf(loyalist.address);
        await judas.connect(loyalist).withdraw(ethers.parseEther("1")); // Trigger update
        const posL = await judas.getUserPosition(loyalist.address);

        // Should have ~500 left (minus the 1 withdrawn)
        // 1000 start - 50% penalty = 500.
        // Withdraw 1 -> 499 remaining stake.
        console.log(`😇 Loyalist Remaining Stake: ${ethers.formatEther(posL.stakedAmount)}`);
        // We expect approx 500 (allow for minor rounding/withdraw amount)
        expect(posL.stakedAmount).to.be.closeTo(ethers.parseEther("499"), ethers.parseEther("0.1"));

        // Betrayer Withdraws
        // 1000 start + 500 stolen = 1500.
        await judas.connect(betrayer).withdraw(ethers.parseEther("1500"));
        const balanceAfterB = await sGuilt.balanceOf(betrayer.address);

        // Betrayers pay 20% SIN TAX on exit? 
        // Logic: withdraw(amount) -> tax = 20% of amount.
        // Withdrew 1500 -> Tax 300 -> Receive 1200.
        console.log(`😈 Betrayer Received (after tax): ${ethers.formatEther(balanceAfterB - (10000n * 10n ** 18n))}`); // Subtract initial endowment

        // Check Treasury for Tax
        const treasuryBal = await sGuilt.balanceOf(treasury.address);
        console.log(`🏛️  Treasury Collected Tax: ${ethers.formatEther(treasuryBal)}`);

        expect(treasuryBal).to.be.closeTo(ethers.parseEther("300"), ethers.parseEther("1"));
    });

});

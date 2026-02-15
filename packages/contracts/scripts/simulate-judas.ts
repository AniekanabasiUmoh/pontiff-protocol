import { ethers } from "hardhat";

async function main() {
    console.log("=== 🎭 STARTING JUDAS PROTOCOL SIMULATION (SCRIPT) ===");

    const [owner, loyalist, betrayer, treasury, bystander] = await ethers.getSigners();
    console.log(`Loyalist: ${loyalist.address}`);
    console.log(`Betrayer: ${betrayer.address}`);

    const STAKE_AMOUNT = ethers.parseEther("1000");

    // 1. Deployment
    console.log("\n--- Phase 1: Deployment ---");

    // GuiltToken
    const GuiltTokenFactory = await ethers.getContractFactory("GuiltToken");
    // 3 args: owner, treasury, staking (owner as temp)
    const sGuilt = await GuiltTokenFactory.deploy(owner.address, treasury.address, owner.address);
    await sGuilt.waitForDeployment();
    console.log(`✅ GuiltToken Deployed: ${await sGuilt.getAddress()}`);

    // StakingCathedral
    const StakingFactory = await ethers.getContractFactory("StakingCathedral");
    const staking = await StakingFactory.deploy(await sGuilt.getAddress(), owner.address);
    await staking.waitForDeployment();
    console.log(`✅ StakingCathedral Deployed: ${await staking.getAddress()}`);

    // Update GuiltToken Wallet
    await sGuilt.updateWallets(treasury.address, await staking.getAddress());
    console.log("✅ GuiltToken Wallets Updated");

    // JudasProtocol
    const JudasProtocolFactory = await ethers.getContractFactory("JudasProtocol");
    const judas = await JudasProtocolFactory.deploy(await sGuilt.getAddress(), owner.address, treasury.address);
    await judas.waitForDeployment();
    console.log(`✅ JudasProtocol Deployed: ${await judas.getAddress()}`);

    // Config
    // Exempt Judas?
    await sGuilt.setTaxExempt(await judas.getAddress(), true);
    // Exempt Staking? (Already done in constructor if passed correctly, but here we passed owner. So maybe needed?)
    // In constructor of GuiltToken: isTaxExempt[_staking] = true;
    // But we passed owner as _staking. 
    // Now we updated _staking to real address.
    // Need to set real staking as tax exempt explicitly if updateWallets doesn't do it.
    // Checking GuiltToken.sol... updateWallets DOES NOT auto-exempt.
    await sGuilt.setTaxExempt(await staking.getAddress(), true);
    console.log("✅ Exemptions Updated");

    // Distribution
    await sGuilt.transfer(loyalist.address, STAKE_AMOUNT * 10n);
    await sGuilt.transfer(betrayer.address, STAKE_AMOUNT * 10n);
    console.log("✅ Tokens Distributed");

    // Approvals
    await sGuilt.connect(loyalist).approve(await judas.getAddress(), ethers.MaxUint256);
    await sGuilt.connect(betrayer).approve(await judas.getAddress(), ethers.MaxUint256);
    console.log("✅ Approvals Done");

    // 2. Staking
    console.log("\n--- Phase 2: Entering Arena ---");
    await judas.connect(loyalist).deposit(STAKE_AMOUNT);
    console.log(`😇 Loyalist staked`);

    await judas.connect(betrayer).deposit(STAKE_AMOUNT);
    console.log(`😈 Betrayer staked`);

    // 3. Betrayal
    console.log("\n--- Phase 3: Betrayal ---");
    await judas.connect(betrayer).signalBetrayal();
    console.log("🗡️ Betrayal Signaled");

    const state = await judas.getGameState();
    console.log(`Betrayal %: ${state.betrayalPercentage}`);

    // 4. Time Travel
    console.log("\n--- Phase 4: Time Travel ---");
    // Hardhat Helper
    await ethers.provider.send("evm_increaseTime", [86400 + 1]);
    await ethers.provider.send("evm_mine", []);
    console.log("⏳ Time Advanced 24h+");

    // 5. Resolution
    console.log("\n--- Phase 5: Resolution ---");
    const tx = await judas.resolveEpoch();
    const receipt = await tx.wait();

    // Find event
    const logs = receipt.logs;
    // We can just log that it finished.
    console.log("⚖️ Epoch Resolved");

    // 6. Withdraw
    console.log("\n--- Phase 6: Withdrawal ---");
    // Verify results
    const posL = await judas.getUserPosition(loyalist.address);
    console.log(`Loyalist Pos: ${ethers.formatEther(posL.stakedAmount)} (Expected ~500)`);

    await judas.connect(betrayer).withdraw(ethers.parseEther("1500"));
    const balB = await sGuilt.balanceOf(betrayer.address);
    console.log(`Betrayer Balance: ${ethers.formatEther(balB)} (Expected > initial)`);

    console.log("\n=== ✅ SIMULATION COMPLETE ===");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

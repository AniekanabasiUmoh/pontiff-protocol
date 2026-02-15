import { ethers } from "hardhat";

async function main() {
    console.log("=== DEPLOYING STAKING V2 ===");

    // Configuration
    const GUILT_ADDRESS = "0x71a0016b50E3d846ce17A15DdfA957e4b0885369";
    const TREASURY_ADDRESS = "0x9f994707E36848a82e672d34aDB3194877dB8cc3";

    // 1. Get Signer
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "MON");

    // 2. Deploy Staking V2
    console.log("\n1. Deploying StakingCathedralV2...");
    const StakingFactory = await ethers.getContractFactory("StakingCathedralV2");
    // Constructor: (IERC20 _asset, address _initialOwner)
    const stakingV2 = await StakingFactory.deploy(GUILT_ADDRESS, deployer.address);

    console.log("Transaction sent. Waiting for deployment...");
    await stakingV2.waitForDeployment();
    const stakingAddress = await stakingV2.getAddress();
    console.log("✅ StakingCathedralV2 deployed to:", stakingAddress);

    // 3. Configure Guilt Token (Exemptions & Wallet Update)
    console.log("\n2. Configuring GuiltToken...");
    const GuiltToken = await ethers.getContractAt("GuiltToken", GUILT_ADDRESS);

    // Exempt New Staking Contract
    console.log("Setting Tax Exempt for V2...");
    let tx = await GuiltToken.setTaxExempt(stakingAddress, true);
    console.log("Tx sent:", tx.hash);
    await tx.wait();
    console.log("✅ Set Tax Exempt: TRUE");

    // Update Staking Wallet
    console.log("Updating Staking Wallet to V2...");
    tx = await GuiltToken.updateWallets(TREASURY_ADDRESS, stakingAddress);
    console.log("Tx sent:", tx.hash);
    await tx.wait();
    console.log("✅ Updated Staking Wallet to V2");

    console.log("\n=== DEPLOYMENT COMPLETE ===");
    console.log("New Staking Address:", stakingAddress);
    console.log("Please update .env and frontend config.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

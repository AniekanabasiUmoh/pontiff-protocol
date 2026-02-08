import { ethers } from "hardhat";

async function main() {
    console.log("Deploying Treasury contract...");

    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);

    // Contract addresses from previous deployments
    const GUILT_TOKEN = "0x3ba95dB0F41E81d71bCee84fAabb20F047b8d9fA";
    const STAKING_POOL = "0x6a0375cc5d837ef0c27c6ced1e0a94d24aa80f1e"; // Cathedral V2
    const TEAM_WALLET = deployer.address;
    const OPS_WALLET = deployer.address;

    const Treasury = await ethers.getContractFactory("Treasury");
    const treasury = await Treasury.deploy(
        GUILT_TOKEN,
        STAKING_POOL,
        TEAM_WALLET,
        OPS_WALLET
    );

    await treasury.waitForDeployment();
    const treasuryAddress = await treasury.getAddress();

    console.log("\n✅ Treasury deployed to:", treasuryAddress);

    // Setup revenue sources
    console.log("\nSetting up revenue sources...");

    const RPS_GAME = "0x32354721c0b31e04a0cb71e7d2ec98c81f105ea3";
    const SESSION_FACTORY = "0xe4d64436c8e5f38256e224ad5a71a1b606ff96dd";

    await treasury.setRevenueSource(RPS_GAME, "RPS", true);
    console.log("✅ RPS Game authorized as revenue source");

    await treasury.setRevenueSource(SESSION_FACTORY, "SESSIONS", true);
    console.log("✅ Session Factory authorized as revenue source");

    console.log("\n📊 Treasury Configuration:");
    console.log("- GUILT Token:", GUILT_TOKEN);
    console.log("- Staking Pool (60%):", STAKING_POOL);
    console.log("- Team Wallet (30%):", TEAM_WALLET);
    console.log("- Operations Wallet (10%):", OPS_WALLET);
    console.log("\n💰 Revenue Sources:");
    console.log("- RPS Game:", RPS_GAME);
    console.log("- Session Factory:", SESSION_FACTORY);

    console.log("\n⚠️ Next Steps:");
    console.log("1. Update RPSGame treasury address:");
    console.log(`   npx hardhat run scripts/update-rps-treasury.ts --network monad-testnet`);
    console.log("2. Add TREASURY_ADDRESS to .env files:");
    console.log(`   TREASURY_ADDRESS=${treasuryAddress}`);
    console.log("3. Test revenue distribution:");
    console.log(`   npx hardhat run scripts/test-treasury.ts --network monad-testnet`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

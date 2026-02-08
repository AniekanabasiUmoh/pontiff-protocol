import { ethers } from "hardhat";

async function main() {
    console.log("🦅 Pontiff Deployment: SEQUENCE START");
    const [deployer] = await ethers.getSigners();
    console.log(`👨‍✈️ Deployer: ${deployer.address}`);

    // 1. Deploy GuiltToken (use deployer as temporary staking address)
    console.log("1️⃣ Deploying GuiltToken...");
    const GuiltToken = await ethers.getContractFactory("GuiltToken");
    const guilt = await GuiltToken.deploy(
        deployer.address,  // _initialOwner
        deployer.address,  // _treasury
        deployer.address   // _staking (temporary, will update)
    );
    await guilt.waitForDeployment();
    const guiltAddress = await guilt.getAddress();
    console.log(`   -> GuiltToken: ${guiltAddress}`);

    // 2. Deploy Staking (The Cathedral)
    console.log("2️⃣ Deploying Staking...");
    const Staking = await ethers.getContractFactory("StakingCathedral");
    const staking = await Staking.deploy(
        guiltAddress,      // _asset
        deployer.address   // _initialOwner
    );
    await staking.waitForDeployment();
    const stakingAddress = await staking.getAddress();
    console.log(`   -> Staking: ${stakingAddress}`);

    // 3. WIRE THE TAX (Update staking wallet in GuiltToken)
    console.log("3️⃣ Wiring Tax Protocol...");
    const tx = await guilt.setStakingWallet(stakingAddress);
    await tx.wait();
    console.log(`   -> Staking wallet updated`);

    // 4. Deploy Judas (PVP)
    console.log("4️⃣ Deploying Judas Protocol...");
    const Judas = await ethers.getContractFactory("JudasProtocol");
    const judas = await Judas.deploy(
        stakingAddress,    // _sGuilt
        deployer.address   // _initialOwner
    );
    await judas.waitForDeployment();
    const judasAddress = await judas.getAddress();
    console.log(`   -> Judas: ${judasAddress}`);

    // 5. Deploy Indulgence (NFT)
    console.log("5️⃣ Deploying Indulgence NFT...");
    const Indulgence = await ethers.getContractFactory("Indulgence");
    const indulgence = await Indulgence.deploy(
        guiltAddress,      // _paymentToken
        stakingAddress,    // _cathedral
        deployer.address   // _initialOwner
    );
    await indulgence.waitForDeployment();
    const indulgenceAddress = await indulgence.getAddress();
    console.log(`   -> Indulgence: ${indulgenceAddress}`);

    console.log("\n✅ DEPLOYMENT COMPLETE");
    console.log("\n📋 Contract Addresses:");
    console.log(`NEXT_PUBLIC_GUILT_ADDRESS=${guiltAddress}`);
    console.log(`NEXT_PUBLIC_STAKING_ADDRESS=${stakingAddress}`);
    console.log(`NEXT_PUBLIC_JUDAS_ADDRESS=${judasAddress}`);
    console.log(`NEXT_PUBLIC_INDULGENCE_ADDRESS=${indulgenceAddress}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

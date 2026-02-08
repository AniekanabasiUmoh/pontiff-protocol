import { ethers } from "hardhat";

async function main() {
    console.log("Setting up Treasury revenue sources...");

    const [deployer] = await ethers.getSigners();
    const TREASURY_ADDRESS = "0xb2A89C33FAaAd74a5D240a0394809d399b38d201";

    const Treasury = await ethers.getContractAt("Treasury", TREASURY_ADDRESS);

    const RPS_GAME = "0x32354721c0b31e04a0cb71e7d2ec98c81f105ea3";
    const SESSION_FACTORY = "0xe4d64436c8e5f38256e224ad5a71a1b606ff96dd";

    console.log("\nAuthorizing revenue sources...");

    const tx1 = await Treasury.setRevenueSource(RPS_GAME, "RPS", true);
    await tx1.wait();
    console.log("✅ RPS Game authorized");

    const tx2 = await Treasury.setRevenueSource(SESSION_FACTORY, "SESSIONS", true);
    await tx2.wait();
    console.log("✅ Session Factory authorized");

    console.log("\n✅ Treasury setup complete!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

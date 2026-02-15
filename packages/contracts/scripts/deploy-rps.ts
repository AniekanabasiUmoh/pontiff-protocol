import { ethers } from 'hardhat';

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const guiltTokenAddress = process.env.GUILT_TOKEN_ADDRESS || "0x71a0016b50E3d846ce17A15DdfA957e4b0885369"; // From .env.local NEXT_PUBLIC_GUILT_ADDRESS
    const treasuryAddress = process.env.TREASURY_WALLET || process.env.TREASURY_ADDRESS || "0x3B11E2E0eCCC2fe3979307386A34ccf86722d1dF";
    const pontiffAddress = deployer.address; // Pontiff wallet (can settle games)

    console.log("Deploying PontiffRPS with config:", {
        guiltToken: guiltTokenAddress,
        treasury: treasuryAddress,
        pontiff: pontiffAddress
    });

    const PontiffRPS = await ethers.getContractFactory("PontiffRPS");

    // Explicitly set gas limit to avoid estimation errors if any
    try {
        const rps = await PontiffRPS.deploy(guiltTokenAddress, treasuryAddress, pontiffAddress, {
            gasLimit: 3000000
        });

        console.log("Tx sent: ", await rps.deploymentTransaction()?.hash);
        await rps.waitForDeployment();
        console.log("PontiffRPS deployed to:", await rps.getAddress());

    } catch (e: any) {
        console.error("FATAL DEPLOY ERROR:");
        console.error(e);
        if (e.data) console.error("Error Data:", e.data);
    }
}

main().catch((error) => {
    console.error("Unhandle Promise Rejection:");
    console.error(error);
    process.exitCode = 1;
});

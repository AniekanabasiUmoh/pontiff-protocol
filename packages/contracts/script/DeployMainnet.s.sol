// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/GuiltToken.sol";
import "../src/Staking.sol";
import "../src/JudasProtocol.sol";
import "../src/Indulgence.sol";

/**
 * Mainnet Deployment Script
 *
 * USAGE:
 *   forge script script/DeployMainnet.s.sol:DeployMainnet --rpc-url $MONAD_RPC_URL --broadcast --verify
 *
 * IMPORTANT: Review all parameters before deploying to mainnet!
 */
contract DeployMainnet is Script {
    // Deployment addresses (UPDATE THESE!)
    address constant TREASURY = 0x1111111111111111111111111111111111111111; // TODO: Set treasury address
    address constant TEAM = 0x2222222222222222222222222222222222222222;     // TODO: Set team address
    address constant AIRDROP = 0x3333333333333333333333333333333333333333;  // TODO: Set airdrop address
    address constant OWNER = 0x4444444444444444444444444444444444444444;    // TODO: Set owner address

    // Deployment artifacts
    GuiltToken public guiltToken;
    Staking public staking;
    JudasProtocol public judas;
    Indulgence public indulgence;

    function run() external {
        // Safety check
        require(TREASURY != address(0x1111111111111111111111111111111111111111), "Update TREASURY address!");
        require(TEAM != address(0x2222222222222222222222222222222222222222), "Update TEAM address!");
        require(AIRDROP != address(0x3333333333333333333333333333333333333333), "Update AIRDROP address!");
        require(OWNER != address(0x4444444444444444444444444444444444444444), "Update OWNER address!");

        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=================================");
        console.log("MAINNET DEPLOYMENT");
        console.log("=================================");
        console.log("Deployer:", deployer);
        console.log("Treasury:", TREASURY);
        console.log("Team:", TEAM);
        console.log("Airdrop:", AIRDROP);
        console.log("Owner:", OWNER);
        console.log("=================================\n");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy GUILT Token
        console.log("Deploying GuiltToken...");
        guiltToken = new GuiltToken(TREASURY, TEAM, AIRDROP, address(0), OWNER);
        console.log("GuiltToken deployed at:", address(guiltToken));

        // 2. Deploy Staking Cathedral
        console.log("\nDeploying Staking Cathedral...");
        staking = new Staking(address(guiltToken), OWNER);
        console.log("Staking deployed at:", address(staking));

        // 3. Update GUILT with staking address
        console.log("\nUpdating GUILT staking vault...");
        // NOTE: This requires GUILT to have a setStakingVault function or redeploy
        // For now, log a warning
        console.log("WARNING: GUILT was deployed with address(0) as staking vault");
        console.log("Manual intervention may be required to route taxes correctly");

        // 4. Deploy Judas Protocol
        console.log("\nDeploying Judas Protocol...");
        judas = new JudasProtocol(address(staking), OWNER);
        console.log("Judas Protocol deployed at:", address(judas));

        // 5. Deploy Indulgence NFT
        console.log("\nDeploying Indulgence NFT...");
        indulgence = new Indulgence(address(guiltToken), address(staking), OWNER);
        console.log("Indulgence deployed at:", address(indulgence));

        vm.stopBroadcast();

        // Print summary
        console.log("\n=================================");
        console.log("DEPLOYMENT COMPLETE!");
        console.log("=================================");
        console.log("GuiltToken:", address(guiltToken));
        console.log("Staking:", address(staking));
        console.log("JudasProtocol:", address(judas));
        console.log("Indulgence:", address(indulgence));
        console.log("=================================");

        // Save addresses to file
        string memory addresses = string(abi.encodePacked(
            "NEXT_PUBLIC_GUILT_ADDRESS=", vm.toString(address(guiltToken)), "\n",
            "NEXT_PUBLIC_STAKING_ADDRESS=", vm.toString(address(staking)), "\n",
            "NEXT_PUBLIC_JUDAS_ADDRESS=", vm.toString(address(judas)), "\n",
            "NEXT_PUBLIC_NFT_ADDRESS=", vm.toString(address(indulgence)), "\n"
        ));

        vm.writeFile(".env.mainnet", addresses);
        console.log("\nAddresses saved to .env.mainnet");

        // Post-deployment checklist
        console.log("\n=================================");
        console.log("POST-DEPLOYMENT CHECKLIST:");
        console.log("=================================");
        console.log("[ ] Verify contracts on MonadScan");
        console.log("[ ] Update frontend .env with new addresses");
        console.log("[ ] Set up Uniswap/Nad.fun liquidity");
        console.log("[ ] Initialize staking rewards");
        console.log("[ ] Test all contract interactions");
        console.log("[ ] Announce on Twitter");
        console.log("=================================\n");
    }
}

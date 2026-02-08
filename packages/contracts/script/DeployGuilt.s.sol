// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/GuiltToken.sol";

contract DeployGuilt is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying GuiltToken with deployer:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy GuiltToken
        // Owner: Deployer
        // Treasury: Deployer (Placeholder for now)
        // Staking: Deployer (Placeholder until Phase 7)
        GuiltToken token = new GuiltToken(deployer, deployer, deployer);

        console.log("GuiltToken deployed at:", address(token));

        vm.stopBroadcast();
    }
}

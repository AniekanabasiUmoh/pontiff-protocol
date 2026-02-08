// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/GuiltToken.sol";
import "../src/Staking.sol";

/**
 * @title DiagnoseAndFixStaking
 * @dev Script to diagnose and fix the staking tax exemption issue
 *
 * USAGE:
 * 1. Diagnosis: forge script script/DiagnoseAndFixStaking.s.sol:DiagnoseAndFixStaking --rpc-url $RPC_URL
 * 2. Fix: forge script script/DiagnoseAndFixStaking.s.sol:DiagnoseAndFixStaking --rpc-url $RPC_URL --broadcast
 */
contract DiagnoseAndFixStaking is Script {
    // Contract addresses from deployment
    address constant GUILT_TOKEN = 0x5438DC9b8B5A314b85257c3C39746A0B4faE9611;
    address constant STAKING_CONTRACT = 0xaE7dE948bF44d201CF4064AFd4098aeddc053C80;

    function run() external {
        console.log("=== STAKING DIAGNOSTIC REPORT ===");
        console.log("");

        // Load contracts
        GuiltToken guilt = GuiltToken(GUILT_TOKEN);
        StakingCathedral staking = StakingCathedral(STAKING_CONTRACT);

        // === DIAGNOSIS PHASE ===
        console.log("1. CONTRACT ADDRESSES:");
        console.log("   Guilt Token:", address(guilt));
        console.log("   Staking Contract:", address(staking));
        console.log("");

        console.log("2. STAKING CONTRACT CONFIGURATION:");
        address assetAddress = address(staking.asset());
        console.log("   Asset Address:", assetAddress);
        console.log("   Matches Guilt Token:", assetAddress == address(guilt) ? "YES" : "NO");
        console.log("");

        console.log("3. GUILT TOKEN CONFIGURATION:");
        address configuredStakingWallet = guilt.stakingWallet();
        address configuredTreasuryWallet = guilt.treasuryWallet();
        console.log("   Treasury Wallet:", configuredTreasuryWallet);
        console.log("   Staking Wallet:", configuredStakingWallet);
        console.log("   Staking Wallet Matches Contract:", configuredStakingWallet == address(staking) ? "YES" : "NO");
        console.log("");

        console.log("4. TAX EXEMPTION STATUS:");
        bool stakingIsExempt = guilt.isTaxExempt(address(staking));
        bool stakingWalletIsExempt = guilt.isTaxExempt(configuredStakingWallet);
        console.log("   Staking Contract Exempt:", stakingIsExempt ? "TRUE" : "FALSE");
        console.log("   Configured Staking Wallet Exempt:", stakingWalletIsExempt ? "TRUE" : "FALSE");
        console.log("");

        // === PROBLEM IDENTIFICATION ===
        bool hasConfigurationProblem = false;
        console.log("5. PROBLEM ANALYSIS:");

        if (assetAddress != address(guilt)) {
            console.log("   ERROR: Staking contract points to wrong asset!");
            hasConfigurationProblem = true;
        }

        if (configuredStakingWallet != address(staking)) {
            console.log("   WARNING: stakingWallet does not point to StakingCathedral contract");
            console.log("   This means tax rewards go to:", configuredStakingWallet);
            hasConfigurationProblem = true;
        }

        if (!stakingIsExempt) {
            console.log("   ERROR: Staking contract is NOT tax exempt!");
            console.log("   This causes infinite recursion during transfers");
            hasConfigurationProblem = true;
        }

        if (!hasConfigurationProblem) {
            console.log("   Configuration looks correct!");
        }
        console.log("");

        // === FIX PHASE ===
        if (hasConfigurationProblem) {
            console.log("6. APPLYING FIXES:");

            uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
            address deployer = vm.addr(deployerPrivateKey);

            console.log("   Deployer address:", deployer);
            console.log("   Token owner:", guilt.owner());

            require(guilt.owner() == deployer, "Deployer is not the token owner");

            vm.startBroadcast(deployerPrivateKey);

            // Fix 1: Ensure staking contract is tax exempt
            if (!stakingIsExempt) {
                console.log("   - Setting StakingCathedral as tax exempt...");
                guilt.setTaxExempt(address(staking), true);
                console.log("     DONE");
            }

            // Fix 2: Update stakingWallet to point to the actual staking contract
            if (configuredStakingWallet != address(staking)) {
                console.log("   - Updating stakingWallet address...");
                guilt.updateWallets(configuredTreasuryWallet, address(staking));
                console.log("     DONE");
            }

            vm.stopBroadcast();

            console.log("");
            console.log("=== FIXES APPLIED SUCCESSFULLY ===");
        } else {
            console.log("6. NO FIXES NEEDED - Configuration is correct");
        }

        console.log("");
        console.log("=== END DIAGNOSTIC REPORT ===");
    }
}

/**
 * Diagnostic Script for Staking Tax Exemption Issue
 *
 * This script checks the configuration of the GuiltToken and StakingCathedral contracts
 * to identify why the staking transaction is reverting with "Execution Reverted (Out of Gas)"
 */

const { ethers } = require('ethers');

// Contract addresses
const GUILT_TOKEN = '0x5438DC9b8B5A314b85257c3C39746A0B4faE9611';
const STAKING_CONTRACT_V1 = '0xaE7dE948bF44d201CF4064AFd4098aeddc053C80'; // Old (has OZ v5 bug)
const STAKING_CONTRACT_V2 = '0x6A03d4Fcd4F84a4FC0c45d2c9fEEb35302A20F1e'; // New (fixed)
const STAKING_CONTRACT = STAKING_CONTRACT_V2; // Use V2 by default
const RPC_URL = 'https://testnet-rpc.monad.xyz';

// ABIs (minimal, only what we need)
const GUILT_TOKEN_ABI = [
    'function stakingWallet() view returns (address)',
    'function treasuryWallet() view returns (address)',
    'function isTaxExempt(address) view returns (bool)',
    'function owner() view returns (address)',
];

const STAKING_ABI = [
    'function asset() view returns (address)',
    'function totalAssets() view returns (uint256)',
    'function totalSupply() view returns (uint256)',
];

async function diagnose() {
    console.log('=== STAKING DIAGNOSTIC REPORT ===\n');

    // Connect to network
    const provider = new ethers.JsonRpcProvider(RPC_URL);

    // Load contracts
    const guiltToken = new ethers.Contract(GUILT_TOKEN, GUILT_TOKEN_ABI, provider);
    const stakingContract = new ethers.Contract(STAKING_CONTRACT, STAKING_ABI, provider);

    console.log('1. CONTRACT ADDRESSES:');
    console.log(`   Guilt Token: ${GUILT_TOKEN}`);
    console.log(`   Staking Contract: ${STAKING_CONTRACT}\n`);

    // Check Staking Contract Configuration
    console.log('2. STAKING CONTRACT CONFIGURATION:');
    const assetAddress = await stakingContract.asset();
    console.log(`   Asset Address: ${assetAddress}`);
    console.log(`   Matches Guilt Token: ${assetAddress.toLowerCase() === GUILT_TOKEN.toLowerCase() ? 'YES ✓' : 'NO ✗'}\n`);

    // Check Guilt Token Configuration
    console.log('3. GUILT TOKEN CONFIGURATION:');
    const stakingWallet = await guiltToken.stakingWallet();
    const treasuryWallet = await guiltToken.treasuryWallet();
    const owner = await guiltToken.owner();

    console.log(`   Owner: ${owner}`);
    console.log(`   Treasury Wallet: ${treasuryWallet}`);
    console.log(`   Staking Wallet: ${stakingWallet}`);
    console.log(`   Staking Wallet Matches Contract: ${stakingWallet.toLowerCase() === STAKING_CONTRACT.toLowerCase() ? 'YES ✓' : 'NO ✗'}\n`);

    // Check Tax Exemptions
    console.log('4. TAX EXEMPTION STATUS:');
    const stakingContractExempt = await guiltToken.isTaxExempt(STAKING_CONTRACT);
    const stakingWalletExempt = await guiltToken.isTaxExempt(stakingWallet);
    const ownerExempt = await guiltToken.isTaxExempt(owner);

    console.log(`   Owner Exempt: ${ownerExempt ? 'TRUE ✓' : 'FALSE ✗'}`);
    console.log(`   Staking Contract Exempt: ${stakingContractExempt ? 'TRUE ✓' : 'FALSE ✗'}`);
    console.log(`   Configured Staking Wallet Exempt: ${stakingWalletExempt ? 'TRUE ✓' : 'FALSE ✗'}\n`);

    // Check Staking Contract State
    console.log('5. STAKING CONTRACT STATE:');
    const totalAssets = await stakingContract.totalAssets();
    const totalSupply = await stakingContract.totalSupply();
    console.log(`   Total Assets: ${ethers.formatEther(totalAssets)} GUILT`);
    console.log(`   Total Supply: ${ethers.formatEther(totalSupply)} sGUILT`);
    console.log(`   First Deposit: ${totalSupply === 0n ? 'YES (will burn MINIMUM_LIQUIDITY)' : 'NO'}\n`);

    // Problem Analysis
    console.log('6. PROBLEM ANALYSIS:');
    let hasConfigurationProblem = false;

    if (assetAddress.toLowerCase() !== GUILT_TOKEN.toLowerCase()) {
        console.log('   ✗ ERROR: Staking contract points to wrong asset!');
        hasConfigurationProblem = true;
    } else {
        console.log('   ✓ Asset configuration is correct');
    }

    if (stakingWallet.toLowerCase() !== STAKING_CONTRACT.toLowerCase()) {
        console.log(`   ⚠ WARNING: stakingWallet (${stakingWallet}) does not point to StakingCathedral contract`);
        console.log(`   This means tax rewards go to a different address`);
        hasConfigurationProblem = true;
    } else {
        console.log('   ✓ Staking wallet points to correct contract');
    }

    if (!stakingContractExempt) {
        console.log('   ✗ CRITICAL ERROR: Staking contract is NOT tax exempt!');
        console.log('   This causes infinite recursion/high gas during transfers');
        console.log('   ROOT CAUSE: When user stakes, the transferFrom triggers tax logic,');
        console.log('               which tries to send tax to stakingWallet, creating nested transfers');
        hasConfigurationProblem = true;
    } else {
        console.log('   ✓ Staking contract is properly tax exempt');
    }

    console.log('');

    // Recommendations
    console.log('7. RECOMMENDED FIXES:');
    if (!stakingContractExempt) {
        console.log('   1. Call setTaxExempt(stakingContract, true) to exempt the staking contract');
        console.log(`      Command: guilt.setTaxExempt("${STAKING_CONTRACT}", true)`);
    }

    if (stakingWallet.toLowerCase() !== STAKING_CONTRACT.toLowerCase()) {
        console.log('   2. Call updateWallets to set stakingWallet to the actual StakingCathedral address');
        console.log(`      Command: guilt.updateWallets("${treasuryWallet}", "${STAKING_CONTRACT}")`);
    }

    if (!hasConfigurationProblem) {
        console.log('   ✓ No configuration issues detected!');
        console.log('   The problem may be elsewhere. Consider:');
        console.log('   - Checking user has approved sufficient tokens');
        console.log('   - Checking user has sufficient balance');
        console.log('   - Verifying the amount being staked is not too small');
    }

    console.log('\n=== END DIAGNOSTIC REPORT ===');
}

// Run the diagnostic
diagnose()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Error running diagnostic:', error);
        process.exit(1);
    });

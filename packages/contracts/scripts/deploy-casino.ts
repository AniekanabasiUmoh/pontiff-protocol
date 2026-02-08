import { ethers } from 'hardhat';

/**
 * Module 13: Casino Contract Deployment Script
 *
 * Deploys:
 * - PontiffRPS
 * - TreasuryVault
 * - IndulgenceNFT (already exists)
 *
 * Updates .env with deployed addresses
 */

async function main() {
    console.log('🏛️  Deploying Pontiff Casino Contracts...\n');

    const [deployer] = await ethers.getSigners();
    console.log('Deploying with account:', deployer.address);
    console.log('Account balance:', ethers.formatEther(await ethers.provider.getBalance(deployer.address)), 'ETH\n');

    // Get existing contract addresses from environment
    const GUILT_TOKEN = process.env.GUILT_TOKEN_ADDRESS || '0x8d15e30b362e79cdA74f5C0C8C46bfCe2Cba0898';
    const STAKING_CATHEDRAL = process.env.STAKING_CATHEDRAL_ADDRESS || '0x6A0309F7Ed3A6f8a32A0dDB3c03dE8ceBfdf0F1e';

    console.log('Using existing contracts:');
    console.log('- GUILT Token:', GUILT_TOKEN);
    console.log('- Staking Cathedral:', STAKING_CATHEDRAL);
    console.log('');

    // Define wallet addresses
    const PONTIFF_WALLET = deployer.address; // Backend wallet
    const TEAM_WALLET = process.env.TEAM_WALLET || deployer.address;
    const OPS_WALLET = process.env.OPS_WALLET || deployer.address;

    // 1. Deploy TreasuryVault
    console.log('📦 Deploying TreasuryVault...');
    const TreasuryVault = await ethers.getContractFactory('TreasuryVault');
    const treasuryVault = await TreasuryVault.deploy(
        GUILT_TOKEN,
        STAKING_CATHEDRAL, // Staking pool address
        TEAM_WALLET,
        OPS_WALLET
    );
    await treasuryVault.waitForDeployment();
    const treasuryAddress = await treasuryVault.getAddress();
    console.log('✅ TreasuryVault deployed to:', treasuryAddress);
    console.log('');

    // 2. Deploy PontiffRPS
    console.log('🎲 Deploying PontiffRPS...');
    const PontiffRPS = await ethers.getContractFactory('PontiffRPS');
    const pontiffRPS = await PontiffRPS.deploy(
        GUILT_TOKEN,
        treasuryAddress,
        PONTIFF_WALLET
    );
    await pontiffRPS.waitForDeployment();
    const rpsAddress = await pontiffRPS.getAddress();
    console.log('✅ PontiffRPS deployed to:', rpsAddress);
    console.log('');

    // 3. Deploy IndulgenceNFT (if not already deployed)
    let indulgenceAddress = process.env.INDULGENCE_NFT_ADDRESS;
    if (!indulgenceAddress) {
        console.log('🖼️  Deploying IndulgenceNFT...');
        const IndulgenceNFT = await ethers.getContractFactory('Indulgence');
        const indulgenceNFT = await IndulgenceNFT.deploy(
            GUILT_TOKEN,
            treasuryAddress
        );
        await indulgenceNFT.waitForDeployment();
        indulgenceAddress = await indulgenceNFT.getAddress();
        console.log('✅ IndulgenceNFT deployed to:', indulgenceAddress);
        console.log('');
    } else {
        console.log('ℹ️  IndulgenceNFT already deployed at:', indulgenceAddress);
        console.log('');
    }

    // Summary
    console.log('\n🎉 Deployment Complete!\n');
    console.log('═══════════════════════════════════════');
    console.log('DEPLOYED CONTRACT ADDRESSES:');
    console.log('═══════════════════════════════════════');
    console.log('TreasuryVault:     ', treasuryAddress);
    console.log('PontiffRPS:        ', rpsAddress);
    console.log('IndulgenceNFT:     ', indulgenceAddress);
    console.log('');
    console.log('EXISTING CONTRACTS:');
    console.log('GuiltToken:        ', GUILT_TOKEN);
    console.log('StakingCathedral:  ', STAKING_CATHEDRAL);
    console.log('═══════════════════════════════════════\n');

    // Generate .env update
    console.log('📝 Add these to your .env file:\n');
    console.log(`TREASURY_VAULT_ADDRESS=${treasuryAddress}`);
    console.log(`PONTIFF_RPS_ADDRESS=${rpsAddress}`);
    if (!process.env.INDULGENCE_NFT_ADDRESS) {
        console.log(`INDULGENCE_NFT_ADDRESS=${indulgenceAddress}`);
    }
    console.log('');

    // Verify contracts (optional)
    console.log('To verify on Monad Explorer:');
    console.log(`npx hardhat verify --network monad ${treasuryAddress} ${GUILT_TOKEN} ${STAKING_CATHEDRAL} ${TEAM_WALLET} ${OPS_WALLET}`);
    console.log(`npx hardhat verify --network monad ${rpsAddress} ${GUILT_TOKEN} ${treasuryAddress} ${PONTIFF_WALLET}`);
    if (!process.env.INDULGENCE_NFT_ADDRESS) {
        console.log(`npx hardhat verify --network monad ${indulgenceAddress} ${GUILT_TOKEN} ${treasuryAddress}`);
    }
    console.log('');

    // Post-deployment setup instructions
    console.log('⚠️  POST-DEPLOYMENT SETUP:');
    console.log('1. Fund TreasuryVault with GUILT for game payouts');
    console.log('2. Fund PontiffRPS contract with GUILT for player wins');
    console.log('3. Update frontend .env with new contract addresses');
    console.log('4. Test a game to ensure proper integration');
    console.log('');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

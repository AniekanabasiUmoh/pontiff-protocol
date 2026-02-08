/**
 * Deployment Script: Session Wallet System
 * Deploys SessionWalletFactory for Module 5
 */

import { ethers } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    console.log('🚀 Deploying Session Wallet System (Module 5)...\n');

    const [deployer] = await ethers.getSigners();
    console.log('Deployer address:', deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log('Deployer balance:', ethers.formatEther(balance), 'MON\n');

    // Load contract addresses from environment or previous deployments
    const GUILT_TOKEN_ADDRESS = process.env.GUILT_TOKEN_ADDRESS;
    const PONTIFF_ADDRESS = process.env.PONTIFF_ADDRESS || deployer.address; // Backend wallet

    if (!GUILT_TOKEN_ADDRESS) {
        throw new Error('GUILT_TOKEN_ADDRESS not set in environment');
    }

    console.log('Configuration:');
    console.log('  GUILT Token:', GUILT_TOKEN_ADDRESS);
    console.log('  Pontiff (Backend):', PONTIFF_ADDRESS);
    console.log('');

    // Deploy SessionWalletFactory
    console.log('📦 Deploying SessionWalletFactory...');
    const SessionWalletFactory = await ethers.getContractFactory('SessionWalletFactory');
    const factory = await SessionWalletFactory.deploy(
        GUILT_TOKEN_ADDRESS,
        PONTIFF_ADDRESS
    );

    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();
    console.log('✅ SessionWalletFactory deployed to:', factoryAddress);
    console.log('');

    // Verify deployment
    console.log('🔍 Verifying deployment...');
    const verifiedGuilt = await factory.guiltToken();
    const verifiedPontiff = await factory.pontiff();
    const implementationAddress = await factory.sessionWalletImplementation();

    console.log('  GUILT Token:', verifiedGuilt);
    console.log('  Pontiff:', verifiedPontiff);
    console.log('  Implementation:', implementationAddress);
    console.log('');

    // Save deployment info
    const deploymentInfo = {
        network: (await ethers.provider.getNetwork()).name,
        chainId: (await ethers.provider.getNetwork()).chainId.toString(),
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        contracts: {
            SessionWalletFactory: {
                address: factoryAddress,
                guiltToken: GUILT_TOKEN_ADDRESS,
                pontiff: PONTIFF_ADDRESS,
                implementation: implementationAddress
            }
        }
    };

    const deploymentsDir = path.join(__dirname, '../../deployments');
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const filename = path.join(deploymentsDir, 'session-wallets.json');
    fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
    console.log('💾 Deployment info saved to:', filename);
    console.log('');

    // Print .env updates
    console.log('📝 Add these to your .env file:');
    console.log(`NEXT_PUBLIC_SESSION_WALLET_FACTORY_ADDRESS=${factoryAddress}`);
    console.log('');

    console.log('✅ Session Wallet System deployment complete!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Update .env with factory address');
    console.log('2. Run migration: supabase/migrations/20260208000001_add_agent_sessions.sql');
    console.log('3. Test session creation via UI');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

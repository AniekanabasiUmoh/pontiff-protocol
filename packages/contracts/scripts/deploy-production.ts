import { ethers } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

/**
 * PRODUCTION DEPLOYMENT SCRIPT
 * Deploys all Pontiff contracts with correct constructor parameters
 */

async function main() {
    console.log('\n==================================================');
    console.log('🏛️  THE PONTIFF - PRODUCTION DEPLOYMENT');
    console.log('==================================================\n');

    const [deployer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(deployer.address);

    console.log(`Deployer: ${deployer.address}`);
    console.log(`Balance: ${ethers.formatEther(balance)} MON\n`);

    if (balance === 0n) {
        throw new Error('Deployer wallet has no balance!');
    }

    // Configuration
    const TREASURY = deployer.address;
    const ENTRY_FEE = ethers.parseEther('100');
    const deployed: any = {};

    try {
        // 1. MockMON
        console.log('1️⃣  Deploying MockMON...');
        const MockMON = await ethers.getContractFactory('MockMON');
        const mon = await MockMON.deploy();
        await mon.waitForDeployment();
        deployed.MON = await mon.getAddress();
        console.log(`✅ MockMON: ${deployed.MON}\n`);

        // 2. GuiltToken
        console.log('2️⃣  Deploying GuiltToken...');
        const GuiltToken = await ethers.getContractFactory('GuiltToken');
        const guilt = await GuiltToken.deploy(
            deployer.address,  // _initialOwner
            TREASURY,          // _treasury
            deployer.address   // _staking (temporary)
        );
        await guilt.waitForDeployment();
        deployed.GUILT = await guilt.getAddress();
        console.log(`✅ GuiltToken: ${deployed.GUILT}\n`);

        // 3. VaticanEntry
        console.log('3️⃣  Deploying VaticanEntry...');
        const VaticanEntry = await ethers.getContractFactory('VaticanEntry');
        const vatican = await VaticanEntry.deploy(
            deployed.MON,  // _monToken
            ENTRY_FEE      // _entryFee
        );
        await vatican.waitForDeployment();
        deployed.VaticanEntry = await vatican.getAddress();
        console.log(`✅ VaticanEntry: ${deployed.VaticanEntry}\n`);

        // 4. StakingCathedralV2
        console.log('4️⃣  Deploying StakingCathedralV2...');
        const StakingCathedral = await ethers.getContractFactory('StakingCathedralV2');
        const staking = await StakingCathedral.deploy(
            deployed.GUILT,  // _asset (address of IERC20)
            deployer.address // _initialOwner
        );
        await staking.waitForDeployment();
        deployed.StakingCathedral = await staking.getAddress();
        console.log(`✅ StakingCathedralV2: ${deployed.StakingCathedral}\n`);

        // 5. Update GuiltToken with real staking address
        console.log('5️⃣  Updating GuiltToken staking address...');
        const tx1 = await guilt.updateWallets(TREASURY, deployed.StakingCathedral);
        await tx1.wait();
        console.log(`✅ Staking address updated\n`);

        // 6. Set StakingCathedral as tax exempt
        console.log('6️⃣  Setting StakingCathedral as tax exempt...');
        const tx2 = await guilt.setTaxExempt(deployed.StakingCathedral, true);
        await tx2.wait();
        console.log(`✅ Tax exemption granted\n`);

        // 7. Indulgence NFT
        console.log('7️⃣  Deploying Indulgence NFT...');
        const Indulgence = await ethers.getContractFactory('Indulgence');
        const indulgence = await Indulgence.deploy(
            deployed.GUILT,            // _paymentToken
            deployed.StakingCathedral, // _cathedral
            deployer.address           // _initialOwner
        );
        await indulgence.waitForDeployment();
        deployed.Indulgence = await indulgence.getAddress();
        console.log(`✅ Indulgence: ${deployed.Indulgence}\n`);

        // 8. JudasProtocol (FIXED VERSION)
        console.log('8️⃣  Deploying JudasProtocol (FIXED)...');
        const JudasProtocol = await ethers.getContractFactory('JudasProtocol');
        const judas = await JudasProtocol.deploy(
            deployed.GUILT,   // _sGuilt
            deployer.address, // _initialOwner
            TREASURY          // _treasury
        );
        await judas.waitForDeployment();
        deployed.JudasProtocol = await judas.getAddress();
        console.log(`✅ JudasProtocol: ${deployed.JudasProtocol}\n`);

        // 9. RPSGame
        console.log('9️⃣  Deploying RPSGame...');
        const RPSGame = await ethers.getContractFactory('RPSGame');
        const rps = await RPSGame.deploy(
            deployed.GUILT    // _monToken (only param)
        );
        await rps.waitForDeployment();
        deployed.RPSGame = await rps.getAddress();
        console.log(`✅ RPSGame: ${deployed.RPSGame}\n`);

        // 10. PokerGame (FULLY REWRITTEN)
        console.log('🔟 Deploying PokerGame (FULLY REWRITTEN)...');
        const PokerGame = await ethers.getContractFactory('PokerGame');
        const poker = await PokerGame.deploy(
            deployed.GUILT,   // _wagerToken
            TREASURY,         // _treasury
            deployer.address  // _initialOwner
        );
        await poker.waitForDeployment();
        deployed.PokerGame = await poker.getAddress();
        console.log(`✅ PokerGame: ${deployed.PokerGame}\n`);

        // Summary
        console.log('\n==================================================');
        console.log('🎉 DEPLOYMENT COMPLETE!');
        console.log('==================================================\n');

        console.log('📋 Contract Addresses:\n');
        for (const [name, address] of Object.entries(deployed)) {
            console.log(`${name.padEnd(25)} ${address}`);
        }

        // Save deployment
        const deploymentData = {
            network: 'monad-testnet',
            chainId: 10143,
            timestamp: new Date().toISOString(),
            deployer: deployer.address,
            treasury: TREASURY,
            contracts: deployed
        };

        const deploymentsDir = path.join(__dirname, '../deployments');
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir, { recursive: true });
        }

        const deploymentFile = path.join(deploymentsDir, 'production-deployment.json');
        fs.writeFileSync(deploymentFile, JSON.stringify(deploymentData, null, 2));

        console.log(`\n💾 Saved to: ${deploymentFile}`);

        // Create .env files
        const frontendEnv = `# Frontend Environment Variables
NEXT_PUBLIC_MON_ADDRESS=${deployed.MON}
NEXT_PUBLIC_GUILT_ADDRESS=${deployed.GUILT}
NEXT_PUBLIC_VATICAN_ENTRY_ADDRESS=${deployed.VaticanEntry}
NEXT_PUBLIC_STAKING_ADDRESS=${deployed.StakingCathedral}
NEXT_PUBLIC_INDULGENCE_ADDRESS=${deployed.Indulgence}
NEXT_PUBLIC_JUDAS_ADDRESS=${deployed.JudasProtocol}
NEXT_PUBLIC_RPS_ADDRESS=${deployed.RPSGame}
NEXT_PUBLIC_POKER_ADDRESS=${deployed.PokerGame}
NEXT_PUBLIC_CHAIN_ID=10143
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
`;

        const apiEnv = `# API Environment Variables
MON_ADDRESS=${deployed.MON}
GUILT_ADDRESS=${deployed.GUILT}
VATICAN_ENTRY_ADDRESS=${deployed.VaticanEntry}
STAKING_ADDRESS=${deployed.StakingCathedral}
INDULGENCE_ADDRESS=${deployed.Indulgence}
JUDAS_ADDRESS=${deployed.JudasProtocol}
RPS_ADDRESS=${deployed.RPSGame}
POKER_ADDRESS=${deployed.PokerGame}
TREASURY_ADDRESS=${TREASURY}
CHAIN_ID=10143
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
`;

        fs.writeFileSync(path.join(__dirname, '../../../apps/web/.env.contracts'), frontendEnv);
        fs.writeFileSync(path.join(__dirname, '../../../apps/api/.env.contracts'), apiEnv);

        console.log('\n✅ Environment files created');
        console.log('\n📝 Next Steps:');
        console.log('1. Run SQL migrations on Supabase');
        console.log('2. Verify contracts on MonadScan');
        console.log('3. Update API/Frontend .env files');
        console.log('4. Test all contract integrations\n');

    } catch (error) {
        console.error('\n❌ Deployment failed:', error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

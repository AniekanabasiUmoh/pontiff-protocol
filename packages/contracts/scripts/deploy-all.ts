import { ethers } from 'hardhat'
import * as fs from 'fs'
import * as path from 'path'

async function main() {
    console.log('🚀 Deploying The Pontiff contracts to Monad Testnet...\n')
    console.log('==================================================')
    console.log('🏛️  THE PONTIFF - COMPLETE DEPLOYMENT')
    console.log('==================================================\n')

    const [deployer] = await ethers.getSigners()
    console.log(`📝 Deploying from: ${deployer.address}`)

    const balance = await ethers.provider.getBalance(deployer.address)
    console.log(`💰 Balance: ${ethers.formatEther(balance)} MON\n`)

    if (balance === 0n) {
        console.error('❌ Deployer wallet has no balance!')
        console.error('Please fund the wallet with Monad testnet MON')
        process.exit(1)
    }

    // Configuration
    const TREASURY = deployer.address // Change to your treasury address
    const ENTRY_FEE = ethers.parseEther('100') // 100 MON entry fee
    const REWARD_RATE = 1000 // 10% APY for staking

    // 1. Deploy MockMON (for testing)
    console.log('1️⃣ Deploying MockMON (Test Token)...')
    const MockMON = await ethers.getContractFactory('MockMON')
    const mon = await MockMON.deploy() // No constructor parameters
    await mon.waitForDeployment()
    const monAddress = await mon.getAddress()
    console.log(`✅ MockMON deployed at: ${monAddress}`)
    console.log(`   TX: ${mon.deploymentTransaction()?.hash}\n`)

    // 2. Deploy GuiltToken (sGUILT) - temporary staking address
    console.log('2️⃣ Deploying GuiltToken (sGUILT)...')
    const GuiltToken = await ethers.getContractFactory('GuiltToken')
    const guilt = await GuiltToken.deploy(
        deployer.address,  // _initialOwner
        TREASURY,          // _treasury
        deployer.address   // _staking (temporary, will update later)
    )
    await guilt.waitForDeployment()
    const guiltAddress = await guilt.getAddress()
    console.log(`✅ GuiltToken deployed at: ${guiltAddress}`)
    console.log(`   TX: ${guilt.deploymentTransaction()?.hash}\n`)

    // 3. Deploy VaticanEntry
    console.log('3️⃣ Deploying VaticanEntry...')
    const VaticanEntry = await ethers.getContractFactory('VaticanEntry')
    const vatican = await VaticanEntry.deploy(
        monAddress,
        guiltAddress,
        ENTRY_FEE,
        deployer.address
    )
    await vatican.waitForDeployment()
    const vaticanAddress = await vatican.getAddress()
    console.log(`✅ VaticanEntry deployed at: ${vaticanAddress}`)
    console.log(`   TX: ${vatican.deploymentTransaction()?.hash}\n`)

    // 4. Deploy StakingCathedralV2
    console.log('4️⃣ Deploying StakingCathedralV2...')
    const StakingCathedral = await ethers.getContractFactory('StakingCathedralV2')
    const staking = await StakingCathedral.deploy(
        guiltAddress,
        REWARD_RATE,
        deployer.address
    )
    await staking.waitForDeployment()
    const stakingAddress = await staking.getAddress()
    console.log(`✅ StakingCathedralV2 deployed at: ${stakingAddress}`)
    console.log(`   TX: ${staking.deploymentTransaction()?.hash}\n`)

    // 5. Deploy Indulgence NFT
    console.log('5️⃣ Deploying Indulgence NFT...')
    const Indulgence = await ethers.getContractFactory('Indulgence')
    const indulgence = await Indulgence.deploy(guiltAddress, deployer.address)
    await indulgence.waitForDeployment()
    const indulgenceAddress = await indulgence.getAddress()
    console.log(`✅ Indulgence deployed at: ${indulgenceAddress}`)
    console.log(`   TX: ${indulgence.deploymentTransaction()?.hash}\n`)

    // 6. Deploy JudasProtocol (FIXED VERSION)
    console.log('6️⃣ Deploying JudasProtocol (FIXED)...')
    const JudasProtocol = await ethers.getContractFactory('JudasProtocol')
    const judas = await JudasProtocol.deploy(
        guiltAddress,
        deployer.address,
        TREASURY
    )
    await judas.waitForDeployment()
    const judasAddress = await judas.getAddress()
    console.log(`✅ JudasProtocol deployed at: ${judasAddress}`)
    console.log(`   TX: ${judas.deploymentTransaction()?.hash}\n`)

    // 7. Deploy RPSGame
    console.log('7️⃣ Deploying RPSGame...')
    const RPSGame = await ethers.getContractFactory('RPSGame')
    const rps = await RPSGame.deploy(guiltAddress, deployer.address)
    await rps.waitForDeployment()
    const rpsAddress = await rps.getAddress()
    console.log(`✅ RPSGame deployed at: ${rpsAddress}`)
    console.log(`   TX: ${rps.deploymentTransaction()?.hash}\n`)

    // 8. Deploy PokerGame (FULLY REWRITTEN)
    console.log('8️⃣ Deploying PokerGame (FULLY REWRITTEN)...')
    const PokerGame = await ethers.getContractFactory('PokerGame')
    const poker = await PokerGame.deploy(
        guiltAddress,
        TREASURY,
        deployer.address
    )
    await poker.waitForDeployment()
    const pokerAddress = await poker.getAddress()
    console.log(`✅ PokerGame deployed at: ${pokerAddress}`)
    console.log(`   TX: ${poker.deploymentTransaction()?.hash}\n`)

    // 9. Configure contracts
    console.log('9️⃣ Configuring contracts...')

    // Grant MINTER_ROLE to VaticanEntry
    const MINTER_ROLE = await guilt.MINTER_ROLE()
    const tx1 = await guilt.grantRole(MINTER_ROLE, vaticanAddress)
    await tx1.wait()
    console.log(`   ✓ GUILT: MINTER_ROLE granted to VaticanEntry`)

    // Grant MINTER_ROLE to StakingCathedral
    const tx2 = await guilt.grantRole(MINTER_ROLE, stakingAddress)
    await tx2.wait()
    console.log(`   ✓ GUILT: MINTER_ROLE granted to StakingCathedral`)

    console.log(`✅ Contracts configured\n`)

    // 10. Output deployment summary
    console.log('==================================================')
    console.log('🎉 DEPLOYMENT COMPLETE!')
    console.log('==================================================\n')
    console.log('📋 Deployment Summary:')
    console.log('====================')
    console.log(`Network: Monad Testnet (Chain ID: 10143)`)
    console.log(`Deployer: ${deployer.address}`)
    console.log(`Treasury: ${TREASURY}`)
    console.log(`\n✅ Contract Addresses:`)
    console.log(`MockMON            = ${monAddress}`)
    console.log(`GuiltToken         = ${guiltAddress}`)
    console.log(`VaticanEntry       = ${vaticanAddress}`)
    console.log(`StakingCathedral   = ${stakingAddress}`)
    console.log(`Indulgence         = ${indulgenceAddress}`)
    console.log(`JudasProtocol      = ${judasAddress}`)
    console.log(`RPSGame            = ${rpsAddress}`)
    console.log(`PokerGame          = ${pokerAddress}`)
    console.log('====================\n')

    // 11. Save deployment info
    const deploymentInfo = {
        network: 'monad-testnet',
        chainId: 10143,
        deployer: deployer.address,
        treasury: TREASURY,
        timestamp: new Date().toISOString(),
        contracts: {
            MockMON: {
                address: monAddress,
                tx: mon.deploymentTransaction()?.hash,
            },
            GuiltToken: {
                address: guiltAddress,
                tx: guilt.deploymentTransaction()?.hash,
            },
            VaticanEntry: {
                address: vaticanAddress,
                tx: vatican.deploymentTransaction()?.hash,
            },
            StakingCathedralV2: {
                address: stakingAddress,
                tx: staking.deploymentTransaction()?.hash,
            },
            Indulgence: {
                address: indulgenceAddress,
                tx: indulgence.deploymentTransaction()?.hash,
            },
            JudasProtocol: {
                address: judasAddress,
                tx: judas.deploymentTransaction()?.hash,
            },
            RPSGame: {
                address: rpsAddress,
                tx: rps.deploymentTransaction()?.hash,
            },
            PokerGame: {
                address: pokerAddress,
                tx: poker.deploymentTransaction()?.hash,
            },
        },
    }

    const deploymentsDir = path.join(__dirname, '../deployments')
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true })
    }

    const deploymentFile = path.join(deploymentsDir, 'monad-testnet.json')
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2))

    console.log(`💾 Deployment info saved to: ${deploymentFile}`)

    // 12. Create .env file for frontend
    const envContent = `# Monad Testnet Contract Addresses
# Generated: ${new Date().toISOString()}
# ⚠️ ALL CONTRACTS HAVE BEEN UPDATED WITH AUDIT FIXES

NEXT_PUBLIC_MON_ADDRESS=${monAddress}
NEXT_PUBLIC_GUILT_ADDRESS=${guiltAddress}
NEXT_PUBLIC_VATICAN_ENTRY_ADDRESS=${vaticanAddress}
NEXT_PUBLIC_STAKING_ADDRESS=${stakingAddress}
NEXT_PUBLIC_INDULGENCE_ADDRESS=${indulgenceAddress}
NEXT_PUBLIC_JUDAS_ADDRESS=${judasAddress}
NEXT_PUBLIC_RPS_ADDRESS=${rpsAddress}
NEXT_PUBLIC_POKER_ADDRESS=${pokerAddress}

NEXT_PUBLIC_CHAIN_ID=10143
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
`

    const webEnvFile = path.join(__dirname, '../../../apps/web/.env.local')
    fs.writeFileSync(webEnvFile, envContent)
    console.log(`💾 Frontend .env.local updated: ${webEnvFile}`)

    // 13. Create .env file for backend API
    const apiEnvContent = `# Monad Testnet Contract Addresses
# Generated: ${new Date().toISOString()}

MON_ADDRESS=${monAddress}
GUILT_ADDRESS=${guiltAddress}
VATICAN_ENTRY_ADDRESS=${vaticanAddress}
STAKING_ADDRESS=${stakingAddress}
INDULGENCE_ADDRESS=${indulgenceAddress}
JUDAS_ADDRESS=${judasAddress}
RPS_ADDRESS=${rpsAddress}
POKER_ADDRESS=${pokerAddress}

TREASURY_ADDRESS=${TREASURY}
CHAIN_ID=10143
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
`

    const apiEnvFile = path.join(__dirname, '../../../apps/api/.env.contracts')
    fs.writeFileSync(apiEnvFile, apiEnvContent)
    console.log(`💾 Backend .env.contracts created: ${apiEnvFile}`)

    console.log('\n🎉 Deployment complete!')
    console.log('\n📝 Next steps:')
    console.log('1. Run SQL migrations on Supabase')
    console.log('2. Update API .env with Supabase credentials')
    console.log('3. Verify contracts on MonadScan')
    console.log('4. Test contract integrations')
    console.log('5. Fund deployer wallet with test tokens')
    console.log('\n✅ All critical audit fixes have been deployed!')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Deployment failed:', error)
        process.exit(1)
    })

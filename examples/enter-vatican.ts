/**
 * Example: Enter The Vatican
 *
 * This script demonstrates how to pay the 10 MON entry fee
 * and gain access to The Vatican's APIs and games.
 */

import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

const MONAD_RPC = 'https://testnet.monad.xyz';
const VATICAN_ENTRY_ADDRESS = process.env.NEXT_PUBLIC_VATICAN_ADDRESS || '0x...';
const ENTRY_FEE = ethers.parseEther("10");

async function main() {
  // 1. Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(MONAD_RPC);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

  console.log(`🏛️  Entering The Vatican...`);
  console.log(`Wallet: ${wallet.address}`);

  // 2. Check MON balance
  const balance = await provider.getBalance(wallet.address);
  console.log(`Balance: ${ethers.formatEther(balance)} MON`);

  if (balance < ENTRY_FEE) {
    console.error('❌ Insufficient MON balance. Need at least 10 MON.');
    process.exit(1);
  }

  // 3. Pay entry fee
  console.log(`\n💰 Paying 10 MON entry fee...`);

  const tx = await wallet.sendTransaction({
    to: VATICAN_ENTRY_ADDRESS,
    value: ENTRY_FEE,
  });

  console.log(`TX Hash: ${tx.hash}`);

  // 4. Wait for confirmation
  const receipt = await tx.wait();
  console.log(`✅ Confirmed in block ${receipt?.blockNumber}`);

  // 5. Verify entry by querying world state
  console.log(`\n🔍 Verifying entry...`);

  const res = await fetch('http://localhost:3000/api/vatican/state');
  const state = await res.json();

  console.log(`\n🏛️  Welcome to The Vatican!`);
  console.log(`Current Pontiff: ${state.currentPontiff}`);
  console.log(`Treasury: ${ethers.formatEther(state.treasuryBalance)} MON`);
  console.log(`Total Entrants: ${state.totalEntrants}`);
  console.log(`\n✨ You can now interact with all Vatican APIs!`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

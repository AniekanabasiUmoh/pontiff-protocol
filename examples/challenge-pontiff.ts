/**
 * Example: Challenge The Pontiff to RPS
 *
 * This script demonstrates how to challenge The Pontiff
 * to a Rock-Paper-Scissors match and handle the result.
 */

import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

enum RPSMove {
  ROCK = 1,
  PAPER = 2,
  SCISSORS = 3
}

const MOVE_NAMES = ['', 'Rock 🪨', 'Paper 📄', 'Scissors ✂️'];

async function playRPS(playerAddress: string, move: RPSMove, wagerEth: string) {
  const wagerWei = ethers.parseEther(wagerEth);

  console.log(`\n⚔️  Challenging The Pontiff to RPS...`);
  console.log(`Your move: ${MOVE_NAMES[move]}`);
  console.log(`Wager: ${wagerEth} GUILT\n`);

  const res = await fetch('http://localhost:3000/api/games/rps/play', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      playerMove: move,
      playerAddress,
      wager: wagerWei.toString()
    })
  });

  const result = await res.json();

  if (result.error) {
    console.error(`❌ Error: ${result.error}`);
    return;
  }

  // Display result
  console.log(`═══════════════════════════════════════`);
  console.log(`  THE PONTIFF HAS SPOKEN`);
  console.log(`═══════════════════════════════════════`);
  console.log(`\nYou played:     ${MOVE_NAMES[move]}`);
  console.log(`Pontiff played: ${MOVE_NAMES[result.pontiffMove]}`);
  console.log(`\n${result.message}`);
  console.log(`\nResult: ${result.result === 'WIN' ? '🎉 VICTORY!' : result.result === 'LOSS' ? '💀 DEFEAT!' : '🤝 DRAW!'}`);
  console.log(`Payout: ${ethers.formatEther(result.payout)} GUILT`);
  console.log(`House Fee (5%): ${ethers.formatEther(result.houseFee)} GUILT`);
  console.log(`\n═══════════════════════════════════════\n`);

  return result;
}

async function main() {
  const provider = new ethers.JsonRpcProvider('https://testnet.monad.xyz');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

  console.log(`🏛️  The Vatican - RPS Challenge`);
  console.log(`Player: ${wallet.address}\n`);

  // Play 3 matches with different moves
  const matches = [
    { move: RPSMove.ROCK, wager: '100' },
    { move: RPSMove.PAPER, wager: '150' },
    { move: RPSMove.SCISSORS, wager: '200' }
  ];

  let wins = 0;
  let losses = 0;
  let draws = 0;

  for (const match of matches) {
    const result = await playRPS(wallet.address, match.move, match.wager);

    if (result.result === 'WIN') wins++;
    else if (result.result === 'LOSS') losses++;
    else draws++;

    // Wait 2 seconds between matches
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  console.log(`\n📊 MATCH SUMMARY`);
  console.log(`═══════════════════════════════════════`);
  console.log(`Wins:   ${wins}`);
  console.log(`Losses: ${losses}`);
  console.log(`Draws:  ${draws}`);
  console.log(`Win Rate: ${((wins / matches.length) * 100).toFixed(1)}%`);
  console.log(`═══════════════════════════════════════\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

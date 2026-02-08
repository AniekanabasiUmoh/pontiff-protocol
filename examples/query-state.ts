/**
 * Example: Query Vatican State
 *
 * This script demonstrates how to query The Vatican's
 * world state, leaderboards, and game statistics.
 */

import { ethers } from 'ethers';

const API_BASE = 'http://localhost:3000/api';

async function getWorldState() {
  const res = await fetch(`${API_BASE}/vatican/state`);
  const state = await res.json();

  console.log(`\n🏛️  THE VATICAN - WORLD STATE`);
  console.log(`═══════════════════════════════════════`);
  console.log(`Current Pontiff: ${state.currentPontiff}`);
  console.log(`Treasury: ${ethers.formatEther(state.treasuryBalance || '0')} MON`);
  console.log(`Total Entrants: ${state.totalEntrants || 0}`);
  console.log(`Current Epoch: ${state.currentEpoch || 0}`);
  console.log(`Tax Rate: ${state.taxRate || 10}%`);
  console.log(`═══════════════════════════════════════\n`);

  return state;
}

async function getGameStats() {
  const res = await fetch(`${API_BASE}/games/stats`);
  const stats = await res.json();

  console.log(`\n🎮 GAMING ARENA STATISTICS`);
  console.log(`═══════════════════════════════════════`);
  console.log(`Total Games Played: ${stats.totalGames}`);
  console.log(`Total Wagered: ${stats.totalWagered} MON`);
  console.log(`Pontiff Win Rate: ${stats.pontiffWinRate}`);
  console.log(`Biggest Pot: ${stats.biggestPot}`);
  console.log(`═══════════════════════════════════════\n`);

  return stats;
}

async function getLeaderboard(type: 'saints' | 'shame' | 'heretics') {
  const res = await fetch(`${API_BASE}/leaderboard/${type}`);
  const { leaders } = await res.json();

  const typeLabels = {
    saints: '🏆 SAINTS LEADERBOARD',
    shame: '💀 SHAME LEADERBOARD',
    heretics: '🗡️ HERETICS LEADERBOARD'
  };

  console.log(`\n${typeLabels[type]}`);
  console.log(`═══════════════════════════════════════`);

  if (leaders && leaders.length > 0) {
    leaders.slice(0, 10).forEach((leader: any) => {
      console.log(`#${leader.rank} | ${leader.walletAddress.slice(0, 10)}... | Score: ${leader.score}`);
    });
  } else {
    console.log('No entries yet.');
  }

  console.log(`═══════════════════════════════════════\n`);

  return leaders;
}

async function getRecentGames() {
  const res = await fetch(`${API_BASE}/games/history`);
  const { history } = await res.json();

  console.log(`\n📜 RECENT GAME HISTORY`);
  console.log(`═══════════════════════════════════════`);

  if (history && history.length > 0) {
    history.slice(0, 5).forEach((game: any) => {
      const winner = game.winner === 'ThePontiff' ? '👑 Pontiff' : '🎲 Player';
      console.log(`${game.gameType} | ${game.player1.slice(0, 10)}... | Winner: ${winner} | Wager: ${game.wager}`);
    });
  } else {
    console.log('No games played yet.');
  }

  console.log(`═══════════════════════════════════════\n`);

  return history;
}

async function getActiveCrusades() {
  const res = await fetch(`${API_BASE}/crusades`);
  const { crusades } = await res.json();

  console.log(`\n⚔️  ACTIVE CRUSADES`);
  console.log(`═══════════════════════════════════════`);

  if (crusades && crusades.length > 0) {
    crusades.forEach((crusade: any) => {
      console.log(`Target: @${crusade.targetAgent}`);
      console.log(`  Goal: ${crusade.goalType} | Progress: ${crusade.progress || 0}%`);
      console.log(`  Participants: ${Array.isArray(crusade.participants) ? crusade.participants.length : 0}`);
      console.log(`─────────────────────────────────────`);
    });
  } else {
    console.log('No active crusades.');
  }

  console.log(`═══════════════════════════════════════\n`);

  return crusades;
}

async function getCompetitors() {
  const res = await fetch(`${API_BASE}/vatican/competitors`);
  const { competitors } = await res.json();

  console.log(`\n🎯 COMPETITOR AGENTS`);
  console.log(`═══════════════════════════════════════`);

  if (competitors && competitors.length > 0) {
    competitors.slice(0, 10).forEach((comp: any) => {
      console.log(`@${comp.handle} | Status: ${comp.status} | Threat: ${comp.threatLevel}`);
    });
  } else {
    console.log('No competitors detected yet.');
  }

  console.log(`═══════════════════════════════════════\n`);

  return competitors;
}

async function main() {
  console.log(`\n╔═══════════════════════════════════════╗`);
  console.log(`║  THE VATICAN - COMPLETE STATE QUERY   ║`);
  console.log(`╚═══════════════════════════════════════╝`);

  try {
    await getWorldState();
    await getGameStats();
    await getRecentGames();
    await getLeaderboard('saints');
    await getLeaderboard('shame');
    await getActiveCrusades();
    await getCompetitors();

    console.log(`✅ State query complete!\n`);
  } catch (error: any) {
    console.error(`❌ Error querying state: ${error.message}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

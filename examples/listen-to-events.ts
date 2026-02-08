/**
 * Example: Listen to Vatican Events
 *
 * This script demonstrates how to monitor world events
 * in real-time using polling.
 */

const API_BASE = 'http://localhost:3000/api';

interface WorldEvent {
  id: string;
  agentWallet: string;
  eventType: string;
  eventData: any;
  timestamp: string;
}

class VaticanEventListener {
  private lastEventId: string | null = null;
  private pollingInterval: number;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(pollingIntervalMs: number = 5000) {
    this.pollingInterval = pollingIntervalMs;
  }

  async start() {
    console.log(`\n📡 Starting Vatican Event Listener...`);
    console.log(`Polling every ${this.pollingInterval / 1000} seconds\n`);

    // Initial fetch
    await this.pollEvents();

    // Start polling
    this.intervalId = setInterval(() => {
      this.pollEvents();
    }, this.pollingInterval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      console.log(`\n✅ Event listener stopped.`);
    }
  }

  private async pollEvents() {
    try {
      // Note: This endpoint would need to be created
      // For now, we'll use game history as a proxy
      const res = await fetch(`${API_BASE}/games/history`);
      const { history } = await res.json();

      if (!history || history.length === 0) return;

      // Get new events since last poll
      const newEvents = this.lastEventId
        ? history.filter((e: any) => e.id > this.lastEventId)
        : history.slice(0, 3); // Show last 3 on first run

      newEvents.reverse().forEach((event: any) => {
        this.handleEvent({
          id: event.id,
          agentWallet: event.player1,
          eventType: `game_${event.status}`,
          eventData: {
            gameType: event.gameType,
            wager: event.wager,
            winner: event.winner
          },
          timestamp: event.createdAt || new Date().toISOString()
        });
      });

      if (history.length > 0) {
        this.lastEventId = history[0].id;
      }

    } catch (error: any) {
      console.error(`❌ Error polling events: ${error.message}`);
    }
  }

  private handleEvent(event: WorldEvent) {
    const timestamp = new Date(event.timestamp).toLocaleTimeString();
    const wallet = event.agentWallet.slice(0, 10) + '...';

    console.log(`\n[${timestamp}] 📢 EVENT: ${event.eventType}`);
    console.log(`  Agent: ${wallet}`);

    switch (event.eventType) {
      case 'game_completed':
        console.log(`  Game: ${event.eventData.gameType}`);
        console.log(`  Winner: ${event.eventData.winner}`);
        console.log(`  Wager: ${event.eventData.wager} GUILT`);
        break;

      case 'confession':
        console.log(`  Sins analyzed: ${event.eventData.sinCount || 0}`);
        console.log(`  Indulgence: ${event.eventData.price || 'N/A'}`);
        break;

      case 'crusade_launched':
        console.log(`  Target: @${event.eventData.targetAgent}`);
        console.log(`  Goal: ${event.eventData.goalType}`);
        break;

      case 'conversion':
        console.log(`  Type: ${event.eventData.conversionType}`);
        console.log(`  Amount: ${event.eventData.amount || 'N/A'}`);
        break;

      default:
        console.log(`  Data: ${JSON.stringify(event.eventData, null, 2)}`);
    }

    console.log(`─────────────────────────────────────`);
  }
}

async function monitorStateChanges() {
  let lastTreasuryBalance = '0';
  let lastTotalGames = 0;

  setInterval(async () => {
    try {
      const stateRes = await fetch(`${API_BASE}/vatican/state`);
      const state = await stateRes.json();

      const statsRes = await fetch(`${API_BASE}/games/stats`);
      const stats = await statsRes.json();

      // Check for treasury changes
      if (state.treasuryBalance && state.treasuryBalance !== lastTreasuryBalance) {
        console.log(`\n💰 TREASURY UPDATE: ${state.treasuryBalance} MON`);
        lastTreasuryBalance = state.treasuryBalance;
      }

      // Check for new games
      if (stats.totalGames && stats.totalGames > lastTotalGames) {
        const newGames = stats.totalGames - lastTotalGames;
        console.log(`\n🎮 NEW GAMES PLAYED: +${newGames} (Total: ${stats.totalGames})`);
        lastTotalGames = stats.totalGames;
      }

    } catch (error) {
      // Silently fail to avoid spam
    }
  }, 10000); // Check every 10 seconds
}

async function main() {
  console.log(`╔═══════════════════════════════════════╗`);
  console.log(`║   THE VATICAN - EVENT MONITOR         ║`);
  console.log(`╚═══════════════════════════════════════╝`);

  const listener = new VaticanEventListener(5000);
  listener.start();

  // Also monitor state changes
  monitorStateChanges();

  // Run for 5 minutes then exit
  setTimeout(() => {
    listener.stop();
    console.log(`\n👋 Monitoring session ended.`);
    process.exit(0);
  }, 300000); // 5 minutes

  // Keep process alive
  console.log(`\n💡 Monitoring for 5 minutes. Press Ctrl+C to stop early.\n`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

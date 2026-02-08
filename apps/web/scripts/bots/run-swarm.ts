import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Load env before importing service
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });


// Remove static import
// import { AgentManagerService } from '../../lib/services/agent-manager-service';

const SESSIONS_FILE = path.join(__dirname, 'sessions.json');
const PERSONALITIES_FILE = path.join(__dirname, 'bot-personalities.json');

async function main() {
    console.log("Starting Bot Swarm Runner...");

    // Dynamic import to ensure env vars are loaded first
    const { AgentManagerService } = await import('../../lib/services/agent-manager-service');

    if (!fs.existsSync(SESSIONS_FILE)) {
        console.error("Sessions file not found. Run spawn-bot-swarm.ts first.");
        process.exit(1);
    }

    const sessions = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
    const personalities = JSON.parse(fs.readFileSync(PERSONALITIES_FILE, 'utf8'));

    // Map personality name to strategy
    const strategyMap: Record<string, string> = {};
    for (const p of personalities) {
        strategyMap[p.name] = p.strategy;
    }

    const manager = new AgentManagerService();

    let activeCount = 0;
    for (const botName in sessions) {
        const sessionData = sessions[botName];
        const strategy = strategyMap[botName];

        if (!strategy) {
            console.warn(`Strategy not found for ${botName}. Skipping.`);
            continue;
        }

        console.log(`Starting agent for ${botName} (${sessionData.sessionId})...`);
        await manager.startAgent(sessionData.sessionId, sessionData.sessionWallet, strategy as any);
        activeCount++;
    }

    console.log(`Swarm active with ${activeCount} agents.`);

    // Keep process alive
    setInterval(() => {
        // Status check or just heartbeat
    }, 60000);
}

main().catch(console.error);

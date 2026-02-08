
import dotenv from 'dotenv';
import path from 'path';

// Fix ESM import issues
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// import { ShadowHeretic } from '../lib/agents/shadow-heretic';

async function main() {
    console.log("👻 Starting Shadow Agent Simulation...");

    // Dynamic import to ensure env vars are loaded first
    const { ShadowHeretic } = await import('../lib/agents/shadow-heretic');

    console.log("Mock Redis:", process.env.MOCK_REDIS);

    try {
        await ShadowHeretic.runCycle();
        console.log("✅ Shadow Agent Simulation Complete.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Simulation Failed:", error);
        process.exit(1);
    }
}

main();

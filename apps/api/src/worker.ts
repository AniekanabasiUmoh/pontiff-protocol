import { calculateLeaderboards } from './services/leaderboard';
import { syncWorldEvents } from './services/sync-world-events';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    console.log('👷 Pontiff Worker Starting...');

    // Initial Run
    try {
        await calculateLeaderboards();
        await calculateLeaderboards();
        // await syncWorldEvents(); // Disabled: API routes write directly
    } catch (e) {
        console.error('Initial calculation failed:', e);
    }

    // Interval (every 5 minutes)
    setInterval(async () => {
        try {
            await calculateLeaderboards();
        } catch (e) {
            console.error('Scheduled calculation failed:', e);
        }
    }, 5 * 60 * 1000);

    console.log('👷 Worker running schedule: 5m');
}

main();

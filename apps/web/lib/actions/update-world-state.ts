import { getVaticanState } from '../services/world-state-service';
import { redis, redisSub } from '../redis';

export async function updateWorldState() {
    try {
        // 1. Force fetch fresh state (bypass cache if needed, or we just rely on TTL expiring)
        // Actually, we probably want a way to force refresh.
        // For now, let's just fetch it.
        console.log('Updating world state...');

        // Invalidate cache first to force refresh
        await redis.del('vatican-world-state');

        const newState = await getVaticanState();

        // 2. Publish to Redis channel
        const message = JSON.stringify({
            type: 'WORLD_STATE_UPDATE',
            data: newState,
            timestamp: Date.now()
        });

        await redis.publish('world-state-updates', message);
        console.log('World state updated and published');

        return newState;
    } catch (error) {
        console.error('Failed to update world state:', error);
        throw error;
    }
}

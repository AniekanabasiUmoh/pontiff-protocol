import 'dotenv/config';
import { getVaticanState } from '../lib/services/world-state-service';
import { redis } from '../lib/redis';


async function main() {
    console.log('--- Testing World State API ---');

    // 1. Clear Cache
    await redis.del('vatican-world-state');
    console.log('Cleared Redis cache.');

    // 2. Metadata
    console.log('Skipping seed check (DB seeded via seed-data.ts).');

    // 3. Fetch State (Cache Miss)
    console.log('Fetching state (Cache Miss expected)...');
    const start1 = Date.now();
    const state1 = await getVaticanState();
    const time1 = Date.now() - start1;
    console.log(`Fetch 1 took ${time1}ms`);
    console.log('State 1 Betrayal %:', state1.betrayalPercentage);

    // 4. Fetch State (Cache Hit)
    console.log('Fetching state again (Cache Hit expected)...');
    const start2 = Date.now();
    const state2 = await getVaticanState();
    const time2 = Date.now() - start2;
    console.log(`Fetch 2 took ${time2}ms`);

    // Verify
    if (time2 < time1 && time2 < 50) {
        console.log('SUCCESS: Cache hit appears to work (sub-50ms).');
    } else {
        console.warn('WARNING: Cache hit might not be working or first fetch was fast.');
    }

    if (state1.betrayalPercentage !== state2.betrayalPercentage) {
        console.error('ERROR: States do not match!');
    } else {
        console.log('SUCCESS: States match.');
    }

    // 5. Check Redis Key
    const ttl = await redis.ttl('vatican-world-state');
    console.log(`Redis Key TTL: ${ttl}s`);

    // Cleanup
    await redis.quit();
}

main().catch((e) => {
    console.error('--- ERROR ---');
    console.error('Message:', e.message);
    console.error('Code:', e.code);
    console.error('Meta:', e.meta);
    console.error('Stack:', e.stack);
    process.exit(1);
});

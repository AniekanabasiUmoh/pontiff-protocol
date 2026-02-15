import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
    console.error('Neither DIRECT_URL nor DATABASE_URL found in .env');
    process.exit(1);
}

console.log(`Using connection string starting with: ${connectionString.substring(0, 20)}...`);

const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false } // Required for Supabase usually
});

async function seed() {
    try {
        console.log('Connecting to database...');
        await client.connect();
        console.log('Connected.');

        // 1. Ensure competitor agent exists
        const agentId = 'agent_heretic_01';
        console.log('Upserting agent...');
        await client.query(`
      INSERT INTO competitor_agents (
        id, name, twitter_handle, narrative, threat_level, is_shadow_agent, verification_method
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7
      ) ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        narrative = EXCLUDED.narrative,
        threat_level = EXCLUDED.threat_level;
    `, [
            agentId,
            'The Heretic',
            'heretic_01',
            'Propagates false truths about the digital soul.',
            'HIGH',
            true,
            'shadow_agent'
        ]);
        console.log('Competitor agent ensured.');

        // 2. Insert active debate
        const debateId = 'debate_live_theology_01';
        console.log('Upserting debate...');

        await client.query('BEGIN');

        const query = `
      INSERT INTO debates (
        id,
        competitor_agent_id,
        status,
        topic,
        created_at,
        started_at,
        last_exchange_at,
        exchanges,
        our_argument,
        their_argument,
        metadata
      ) VALUES (
        $1, $2, $3, $4, NOW(), NOW(), NOW(), $5, $6, $7, $8
      ) ON CONFLICT (id) DO UPDATE SET
        topic = EXCLUDED.topic,
        our_argument = EXCLUDED.our_argument,
        their_argument = EXCLUDED.their_argument,
        metadata = EXCLUDED.metadata,
        status = EXCLUDED.status;
    `;

        const values = [
            debateId,
            agentId,
            'active',
            'Is the Code Corpus the True Scripture?',
            1,
            'The Corpus is divinely inspired, immutable, and the path to salvation. To question the Code is to question Order itself.',
            'Code is mutable, flawed, and written by mortal hands. True divinity lies in the chaos of the uncompiled.',
            JSON.stringify({
                phase: 'opening_arguments',
                intensity: 'high',
                spectators: 42
            })
        ];

        await client.query(query, values);
        await client.query('COMMIT');

        console.log('Debate seeded successfully via direct SQL.');

    } catch (err) {
        if (client) {
            try { await client.query('ROLLBACK'); } catch (e) { }
        }
        console.error('Error seeding data:', err);
    } finally {
        await client.end();
    }
}

seed();

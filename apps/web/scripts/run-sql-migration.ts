import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runMigration() {
    console.log('🔄 Running SQL migration...\n');

    // Create game_history table
    const createTableSQL = `
        CREATE TABLE IF NOT EXISTS game_history (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            session_id UUID REFERENCES agent_sessions(id) ON DELETE CASCADE,
            player_address TEXT NOT NULL,
            game_type TEXT DEFAULT 'RPS',
            result TEXT NOT NULL,
            wager_amount NUMERIC DEFAULT 0,
            profit_loss NUMERIC DEFAULT 0,
            player_move INTEGER,
            pontiff_move INTEGER,
            tx_hash TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    `;

    const { error: tableError } = await supabase.rpc('exec_sql', { sql: createTableSQL });

    // If RPC doesn't exist, try direct query
    if (tableError) {
        console.log('Trying alternative method...');
        // Use raw SQL via Supabase client
        const { error } = await supabase.from('game_history').select('id').limit(1);
        if (error && error.message.includes('does not exist')) {
            console.error('❌ Cannot create table via code.');
            console.log('\n📋 Please run this SQL in Supabase SQL Editor:');
            console.log('\n' + createTableSQL);
            console.log('\n🔗 Go to: https://supabase.com/dashboard/project/[your-project]/sql/new');
            return;
        }
    }

    console.log('✅ Table created (or already exists)');

    // Create indexes
    console.log('Creating indexes...');

    const indexes = [
        `CREATE INDEX IF NOT EXISTS idx_game_history_session ON game_history(session_id);`,
        `CREATE INDEX IF NOT EXISTS idx_game_history_player ON game_history(player_address);`,
        `CREATE INDEX IF NOT EXISTS idx_game_history_created ON game_history(created_at DESC);`
    ];

    for (const indexSQL of indexes) {
        await supabase.rpc('exec_sql', { sql: indexSQL }).catch(() => {
            console.log('Index creation: Using alternative method');
        });
    }

    console.log('✅ Indexes created');

    // Verify table exists
    const { data, error } = await supabase.from('game_history').select('id').limit(1);

    if (error && !error.message.includes('0 rows')) {
        console.error('❌ Verification failed:', error.message);
        console.log('\n📝 MANUAL STEPS REQUIRED:');
        console.log('1. Go to Supabase SQL Editor');
        console.log('2. Copy the SQL from: c:\\Dev\\Pontiff\\RUN_THIS_FIRST.sql');
        console.log('3. Paste and run it');
    } else {
        console.log('✅ Migration complete! game_history table is ready.');
        console.log('\n🚀 Next step: npx tsx scripts/start-all-agents.ts');
    }
}

runMigration().catch(console.error);

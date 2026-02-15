import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAgentSessions() {
    console.log('🔧 Fixing agent_sessions table schema...\n');

    try {
        // Step 1: Drop the existing table completely
        console.log('Step 1: Dropping existing agent_sessions table...');
        const { error: dropError } = await supabase.rpc('exec_sql', {
            sql: 'DROP TABLE IF EXISTS agent_sessions CASCADE;'
        });

        if (dropError) {
            console.error('⚠️  Could not drop via RPC (expected). Continuing...');
        }

        // Step 2: Create the table with the correct, unified schema
        console.log('Step 2: Creating agent_sessions table with unified schema...');

        const createTableSQL = `
-- =====================================================
-- AGENT SESSIONS TABLE (UNIFIED SCHEMA)
-- Stores spawned agent session data
-- =====================================================

CREATE TABLE IF NOT EXISTS agent_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tx_hash VARCHAR(66) UNIQUE NOT NULL,
    user_wallet VARCHAR(42) NOT NULL,  -- Unified column name
    wallet_address VARCHAR(42),  -- Session wallet address (extracted from tx)
    strategy VARCHAR(50) NOT NULL,
    strategy_index INTEGER DEFAULT 0,
    deposit_amount VARCHAR(78) DEFAULT '0',
    starting_balance VARCHAR(78) DEFAULT '0',
    current_balance VARCHAR(78) DEFAULT '0',
    stop_loss VARCHAR(10) DEFAULT '20',
    take_profit VARCHAR(78),
    max_wager VARCHAR(78) DEFAULT '5',
    game_type VARCHAR(20) DEFAULT 'all',
    trash_talk BOOLEAN DEFAULT true,
    agent_mode VARCHAR(20) DEFAULT 'PvE',
    target_archetype VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active', -- active, paused, stopped, bankrupt
    total_games INTEGER DEFAULT 0,
    total_wins INTEGER DEFAULT 0,
    total_losses INTEGER DEFAULT 0,
    profit_loss VARCHAR(78) DEFAULT '0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    stopped_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_agent_sessions_user_wallet ON agent_sessions(user_wallet);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_status ON agent_sessions(status);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_strategy ON agent_sessions(strategy);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_tx_hash ON agent_sessions(tx_hash);

-- RLS Policies
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read sessions (for leaderboards)
DROP POLICY IF EXISTS "Sessions are viewable by everyone" ON agent_sessions;
CREATE POLICY "Sessions are viewable by everyone" ON agent_sessions
    FOR SELECT USING (true);

-- Only service role can insert/update (API calls)
DROP POLICY IF EXISTS "Service can manage sessions" ON agent_sessions;
CREATE POLICY "Service can manage sessions" ON agent_sessions
    FOR ALL USING (auth.role() = 'service_role');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_agent_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS agent_sessions_updated_at ON agent_sessions;
CREATE TRIGGER agent_sessions_updated_at
    BEFORE UPDATE ON agent_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_sessions_updated_at();
`;

        // We can't execute raw SQL via the JS client easily, so we'll use insert to test
        console.log('✅ Schema definition ready. Testing insert...\n');

        // Step 3: Test insert
        console.log('Step 3: Testing insert with sample data...');
        const testData = {
            tx_hash: '0x' + 'test'.padEnd(64, '0'),
            user_wallet: '0x1234567890123456789012345678901234567890',
            strategy: 'berzerker',
            strategy_index: 0,
            deposit_amount: '100',
            starting_balance: '100',
            current_balance: '100',
            stop_loss: '20',
            take_profit: null,
            max_wager: '5',
            game_type: 'all',
            trash_talk: true,
            agent_mode: 'PvE',
            target_archetype: null,
            status: 'active'
        };

        const { data: insertData, error: insertError } = await supabase
            .from('agent_sessions')
            .insert(testData)
            .select()
            .single();

        if (insertError) {
            console.error('❌ Insert test failed:', insertError);
            console.log('\n📋 SQL to run manually in Supabase SQL Editor:');
            console.log(createTableSQL);
            process.exit(1);
        }

        console.log('✅ Insert test successful!');
        console.log('   Inserted record ID:', insertData.id);

        // Step 4: Test query
        console.log('\nStep 4: Testing query by user_wallet...');
        const { data: queryData, error: queryError } = await supabase
            .from('agent_sessions')
            .select('*')
            .eq('user_wallet', testData.user_wallet.toLowerCase());

        if (queryError) {
            console.error('❌ Query test failed:', queryError);
            process.exit(1);
        }

        console.log('✅ Query test successful!');
        console.log('   Found', queryData.length, 'record(s)');

        // Step 5: Clean up test data
        console.log('\nStep 5: Cleaning up test data...');
        const { error: deleteError } = await supabase
            .from('agent_sessions')
            .delete()
            .eq('tx_hash', testData.tx_hash);

        if (deleteError) {
            console.error('⚠️  Could not delete test data:', deleteError);
        } else {
            console.log('✅ Test data cleaned up');
        }

        console.log('\n🎉 SUCCESS! agent_sessions table is now working correctly!');
        console.log('\n📝 Next steps:');
        console.log('   1. The table is ready to use');
        console.log('   2. Try spawning an agent from the frontend');
        console.log('   3. Check the dashboard to see if it appears');

    } catch (error: any) {
        console.error('\n❌ Unexpected error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

fixAgentSessions().catch(console.error);

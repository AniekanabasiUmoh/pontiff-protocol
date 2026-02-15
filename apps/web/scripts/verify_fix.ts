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

async function testAgentSessionInsert() {
    console.log('🧪 Testing Agent Session Insert (Post-Fix Verification)\n');

    // Simulate the exact data the frontend sends
    const testSession = {
        tx_hash: '0x' + 'test_' + Date.now().toString(16).padEnd(60, '0'),
        user_wallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0', // Example wallet
        strategy: 'berzerker',
        strategy_index: 0,
        deposit_amount: '100',  // This was the missing column!
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

    console.log('📤 Inserting test session...');
    console.log('   TX Hash:', testSession.tx_hash);
    console.log('   User Wallet:', testSession.user_wallet);
    console.log('   Strategy:', testSession.strategy);
    console.log('   Deposit Amount:', testSession.deposit_amount, '(CRITICAL COLUMN)');
    console.log('');

    const { data: session, error } = await supabase
        .from('agent_sessions')
        .insert(testSession)
        .select()
        .single();

    if (error) {
        console.error('❌ INSERT FAILED!');
        console.error('   Error:', error.message);
        console.error('   Code:', error.code);
        console.error('   Details:', error.details);
        console.error('   Hint:', error.hint);
        console.log('\n⚠️  The SQL fix may not have been applied yet.');
        console.log('   Please run FIX_AGENT_SESSIONS.sql in Supabase SQL Editor.');
        process.exit(1);
    }

    console.log('✅ INSERT SUCCESSFUL!');
    console.log('   Session ID:', session.id);
    console.log('   Created At:', session.created_at);
    console.log('');

    // Test query by user_wallet
    console.log('🔍 Testing query by user_wallet...');
    const { data: sessions, error: queryError } = await supabase
        .from('agent_sessions')
        .select('*')
        .eq('user_wallet', testSession.user_wallet.toLowerCase());

    if (queryError) {
        console.error('❌ QUERY FAILED:', queryError.message);
        process.exit(1);
    }

    console.log(`✅ QUERY SUCCESSFUL! Found ${sessions.length} session(s)`);
    console.log('');

    // Clean up test data
    console.log('🧹 Cleaning up test data...');
    const { error: deleteError } = await supabase
        .from('agent_sessions')
        .delete()
        .eq('id', session.id);

    if (deleteError) {
        console.error('⚠️  Could not delete test data:', deleteError.message);
    } else {
        console.log('✅ Test data cleaned up');
    }

    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('\n✨ The agent_sessions table is now working correctly!');
    console.log('   You can now spawn agents from the frontend.');
    console.log('   They will appear on your dashboard at /dashboard');
}

testAgentSessionInsert().catch((error) => {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
});

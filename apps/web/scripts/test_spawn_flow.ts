import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testEndToEnd() {
    console.log('🧪 Testing End-to-End Agent Spawn Flow\n');

    const testWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';
    const testTxHash = '0x' + 'test_' + Date.now().toString(16).padEnd(60, '0');

    // Step 1: Simulate agent spawn (what the frontend does)
    console.log('Step 1: Simulating agent spawn...');
    console.log(`   Wallet: ${testWallet}`);
    console.log(`   TX Hash: ${testTxHash}`);

    const spawnData = {
        txHash: testTxHash,
        ownerAddress: testWallet,
        strategy: 'berzerker',
        strategyIndex: 0,
        depositAmount: '100',
        stopLoss: '20',
        takeProfit: null,
        maxWager: '5',
        gameType: 'all',
        trashTalk: true,
        agentMode: 'PvE',
        targetArchetype: null
    };

    const { data: session, error: insertError } = await supabase
        .from('agent_sessions')
        .insert(spawnData)
        .select()
        .single();

    if (insertError) {
        console.error('❌ Step 1 FAILED:', insertError.message);
        return;
    }

    console.log('✅ Step 1 PASSED: Agent registered');
    console.log(`   Session ID: ${session.id}\n`);

    // Step 2: Query dashboard stats (what the dashboard does)
    console.log('Step 2: Querying dashboard for this wallet...');

    const { data: dashboardSessions, error: queryError } = await supabase
        .from('agent_sessions')
        .select('*')
        .eq('user_wallet', testWallet.toLowerCase())
        .order('created_at', { ascending: false });

    if (queryError) {
        console.error('❌ Step 2 FAILED:', queryError.message);
        return;
    }

    const found = dashboardSessions?.find(s => s.tx_hash === testTxHash);

    if (!found) {
        console.error('❌ Step 2 FAILED: Agent not found in dashboard query');
        console.log(`   Found ${dashboardSessions?.length || 0} sessions for this wallet`);
        return;
    }

    console.log('✅ Step 2 PASSED: Agent appears in dashboard query');
    console.log(`   Found ${dashboardSessions.length} total sessions for wallet\n`);

    // Step 3: Verify all required fields
    console.log('Step 3: Verifying all required fields...');

    const requiredFields = [
        'id', 'tx_hash', 'user_wallet', 'strategy', 'deposit_amount',
        'starting_balance', 'current_balance', 'stop_loss', 'status'
    ];

    const missingFields = requiredFields.filter(field => !(field in found));

    if (missingFields.length > 0) {
        console.error('❌ Step 3 FAILED: Missing fields:', missingFields);
        return;
    }

    console.log('✅ Step 3 PASSED: All required fields present');
    console.log(`   deposit_amount: ${found.deposit_amount}`);
    console.log(`   starting_balance: ${found.starting_balance}`);
    console.log(`   status: ${found.status}\n`);

    // Cleanup
    console.log('Cleanup: Deleting test data...');
    await supabase.from('agent_sessions').delete().eq('id', session.id);
    console.log('✅ Test data cleaned up\n');

    console.log('🎉 ALL TESTS PASSED!');
    console.log('\n✨ The spawn flow is working correctly:');
    console.log('   1. Agent can be registered ✅');
    console.log('   2. Agent appears in dashboard query ✅');
    console.log('   3. All required fields are present ✅');
    console.log('\n🚀 You can now spawn agents from /hire and they will appear on /dashboard');
}

testEndToEnd().catch(console.error);

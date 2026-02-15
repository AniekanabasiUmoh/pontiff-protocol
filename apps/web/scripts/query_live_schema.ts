import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function queryLiveSchema() {
    console.log('🔍 Querying live Supabase database schema...\n');

    const output: string[] = [];
    output.push('='.repeat(80));
    output.push('LIVE DATABASE SCHEMA INSPECTION');
    output.push('='.repeat(80));
    output.push(`Timestamp: ${new Date().toISOString()}`);
    output.push(`Supabase URL: ${supabaseUrl}`);
    output.push('='.repeat(80));
    output.push('');

    // Query 1: Check if agent_sessions table exists
    console.log('1️⃣  Checking if agent_sessions table exists...');
    output.push('1. TABLE EXISTENCE CHECK');
    output.push('-'.repeat(80));

    const { data: tableCheck, error: tableError } = await supabase
        .from('agent_sessions')
        .select('*')
        .limit(1);

    if (tableError) {
        console.log('   ❌ Table does not exist or is not accessible');
        output.push(`❌ ERROR: ${tableError.message}`);
        output.push(`   Code: ${tableError.code}`);
        output.push(`   Details: ${JSON.stringify(tableError.details, null, 2)}`);
        output.push(`   Hint: ${tableError.hint || 'N/A'}`);
    } else {
        console.log('   ✅ Table exists and is accessible');
        output.push('✅ Table exists and is accessible');

        if (tableCheck && tableCheck.length > 0) {
            output.push(`   Found ${tableCheck.length} row(s)`);
            output.push(`   Columns: ${Object.keys(tableCheck[0]).join(', ')}`);
        } else {
            output.push('   Table is empty (no rows)');
        }
    }
    output.push('');

    // Query 2: Test column existence
    console.log('\n2️⃣  Testing specific columns...');
    output.push('2. COLUMN EXISTENCE TEST');
    output.push('-'.repeat(80));

    const columnsToTest = [
        'id', 'tx_hash', 'user_wallet', 'owner_address', 'wallet_address',
        'strategy', 'strategy_index', 'deposit_amount', 'starting_balance',
        'current_balance', 'stop_loss', 'take_profit', 'max_wager',
        'game_type', 'trash_talk', 'agent_mode', 'target_archetype',
        'status', 'total_games', 'total_wins', 'total_losses',
        'profit_loss', 'created_at', 'updated_at', 'stopped_at'
    ];

    const existingColumns: string[] = [];
    const missingColumns: string[] = [];

    for (const col of columnsToTest) {
        const { error } = await supabase
            .from('agent_sessions')
            .select(col)
            .limit(1);

        if (!error) {
            existingColumns.push(col);
            console.log(`   ✅ ${col}`);
        } else {
            missingColumns.push(col);
            console.log(`   ❌ ${col}`);
        }
    }

    output.push(`Existing columns (${existingColumns.length}):`);
    output.push(existingColumns.map(c => `  ✅ ${c}`).join('\n'));
    output.push('');
    output.push(`Missing columns (${missingColumns.length}):`);
    output.push(missingColumns.map(c => `  ❌ ${c}`).join('\n'));
    output.push('');

    // Query 3: Try to get all data
    console.log('\n3️⃣  Fetching all existing data...');
    output.push('3. EXISTING DATA');
    output.push('-'.repeat(80));

    const { data: allData, error: allError } = await supabase
        .from('agent_sessions')
        .select('*')
        .limit(100);

    if (allError) {
        console.log('   ❌ Could not fetch data');
        output.push(`❌ ERROR: ${allError.message}`);
    } else {
        console.log(`   ✅ Found ${allData?.length || 0} row(s)`);
        output.push(`Found ${allData?.length || 0} row(s)`);

        if (allData && allData.length > 0) {
            output.push('');
            output.push('Sample data (first 3 rows):');
            allData.slice(0, 3).forEach((row, idx) => {
                output.push(`\nRow ${idx + 1}:`);
                output.push(JSON.stringify(row, null, 2));
            });
        }
    }
    output.push('');

    // Query 4: Test insert capability
    console.log('\n4️⃣  Testing insert capability...');
    output.push('4. INSERT TEST');
    output.push('-'.repeat(80));

    const testData = {
        tx_hash: '0x' + 'test_' + Date.now().toString(16).padEnd(60, '0'),
        user_wallet: '0x0000000000000000000000000000000000000001',
        strategy: 'berzerker',
        strategy_index: 0,
        deposit_amount: '100',
        starting_balance: '100',
        current_balance: '100',
        stop_loss: '20',
        max_wager: '5',
        game_type: 'all',
        trash_talk: true,
        agent_mode: 'PvE',
        status: 'active'
    };

    const { data: insertData, error: insertError } = await supabase
        .from('agent_sessions')
        .insert(testData)
        .select()
        .single();

    if (insertError) {
        console.log('   ❌ Insert failed');
        output.push(`❌ INSERT FAILED: ${insertError.message}`);
        output.push(`   Code: ${insertError.code}`);
        output.push(`   Details: ${JSON.stringify(insertError.details, null, 2)}`);
        output.push(`   Hint: ${insertError.hint || 'N/A'}`);
        output.push('');
        output.push('Test data that failed:');
        output.push(JSON.stringify(testData, null, 2));
    } else {
        console.log('   ✅ Insert successful');
        output.push('✅ INSERT SUCCESSFUL');
        output.push(`   Inserted ID: ${insertData.id}`);
        output.push('');
        output.push('Inserted data:');
        output.push(JSON.stringify(insertData, null, 2));

        // Clean up test data
        console.log('\n5️⃣  Cleaning up test data...');
        const { error: deleteError } = await supabase
            .from('agent_sessions')
            .delete()
            .eq('id', insertData.id);

        if (!deleteError) {
            console.log('   ✅ Test data cleaned up');
            output.push('');
            output.push('✅ Test data cleaned up successfully');
        }
    }

    output.push('');
    output.push('='.repeat(80));
    output.push('END OF SCHEMA INSPECTION');
    output.push('='.repeat(80));

    // Write to file
    const outputPath = path.join(process.cwd(), 'live_schema_report.txt');
    fs.writeFileSync(outputPath, output.join('\n'));

    console.log(`\n📄 Full report written to: ${outputPath}`);
    console.log('\n✅ Schema inspection complete!');
}

queryLiveSchema().catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
});

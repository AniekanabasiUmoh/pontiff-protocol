import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env
const envPath = path.resolve(process.cwd(), 'apps/web/.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncTreasury() {
    console.log('Starting treasury sync...');

    try {
        // 1. Fetch House Edge transactions
        console.log('Fetching HOUSE_EDGE transactions...');
        const { data: rows, error } = await supabase
            .from('balance_transactions')
            .select('game_type, amount')
            .eq('type', 'HOUSE_EDGE');

        if (error) {
            throw new Error(`Failed to read balance_transactions: ${error.message}`);
        }

        if (!rows || rows.length === 0) {
            console.log('No house edge data found.');
            return;
        }

        console.log(`Found ${rows.length} transactions.`);

        // 2. Aggregate
        const totals: Record<string, { total: number; count: number }> = {};
        for (const row of rows) {
            const gameType = row.game_type || 'UNKNOWN';
            if (!totals[gameType]) {
                totals[gameType] = { total: 0, count: 0 };
            }
            totals[gameType].total += parseFloat(row.amount || '0');
            totals[gameType].count += 1;
        }

        // Grand total
        const grandTotal = Object.values(totals).reduce((sum, t) => sum + t.total, 0);
        const grandCount = Object.values(totals).reduce((sum, t) => sum + t.count, 0);
        totals['ALL'] = { total: grandTotal, count: grandCount };

        // 3. Upsert
        const now = new Date().toISOString();
        const upsertRows = Object.entries(totals).map(([gameType, data]) => ({
            game_type: gameType,
            total_revenue: data.total,
            total_tx_count: data.count,
            last_synced_at: now,
            updated_at: now,
        }));

        console.log('Upserting totals:', upsertRows);

        const { error: upsertError } = await supabase
            .from('treasury_totals')
            .upsert(upsertRows, { onConflict: 'game_type' });

        if (upsertError) {
            throw new Error(`Failed to upsert treasury_totals: ${upsertError.message}`);
        }

        console.log('Sync complete!');

    } catch (error: any) {
        console.error('Sync failed:', error.message);
    }
}

syncTreasury();

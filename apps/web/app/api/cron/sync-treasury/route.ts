import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/db/supabase-server';


/**
 * GET /api/cron/sync-treasury
 *
 * Aggregates HOUSE_EDGE rows from balance_transactions by game type
 * and upserts into treasury_totals for fast dashboard reads.
 *
 * Run this on a schedule (e.g. every 5 minutes via Vercel cron or external cron).
 * Protected by CRON_SECRET header.
 */
export async function GET(req: NextRequest) {
    const supabase = createServerSupabase();
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Aggregate all HOUSE_EDGE transactions by game_type
        const { data: rows, error } = await supabase
            .from('balance_transactions')
            .select('game_type, amount')
            .eq('type', 'HOUSE_EDGE');

        if (error) {
            throw new Error(`Failed to read balance_transactions: ${error.message}`);
        }

        if (!rows || rows.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No house edge data found',
                synced: 0
            });
        }

        // Sum by game_type
        const totals: Record<string, { total: number; count: number }> = {};
        for (const row of rows) {
            const gameType = row.game_type || 'UNKNOWN';
            if (!totals[gameType]) {
                totals[gameType] = { total: 0, count: 0 };
            }
            totals[gameType].total += parseFloat(row.amount || '0');
            totals[gameType].count += 1;
        }

        // Also add a combined total row
        const grandTotal = Object.values(totals).reduce((sum, t) => sum + t.total, 0);
        const grandCount = Object.values(totals).reduce((sum, t) => sum + t.count, 0);
        totals['ALL'] = { total: grandTotal, count: grandCount };

        // Upsert into treasury_totals
        const now = new Date().toISOString();
        const upsertRows = Object.entries(totals).map(([gameType, data]) => ({
            game_type: gameType,
            total_revenue: data.total,
            total_tx_count: data.count,
            last_synced_at: now,
            updated_at: now,
        }));

        const { error: upsertError } = await supabase
            .from('treasury_totals')
            .upsert(upsertRows, { onConflict: 'game_type' });

        if (upsertError) {
            throw new Error(`Failed to upsert treasury_totals: ${upsertError.message}`);
        }

        return NextResponse.json({
            success: true,
            synced: upsertRows.length,
            totals: Object.fromEntries(
                Object.entries(totals).map(([k, v]) => [k, v.total.toFixed(4)])
            ),
            lastSyncedAt: now
        });

    } catch (error: any) {
        console.error('[sync-treasury] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Sync failed' },
            { status: 500 }
        );
    }
}

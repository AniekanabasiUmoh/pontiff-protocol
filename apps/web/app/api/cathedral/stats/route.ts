import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/db/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const supabase = createServerSupabase();
    try {
        // Total staked: sum from staking_records table (NOT confession_stakes — that table doesn't exist)
        const { data: stakeData } = await supabase
            .from('staking_records')
            .select('amount')
            .eq('action', 'STAKE');

        const totalStaked = stakeData?.reduce((sum, r) => sum + parseFloat(r.amount || '0'), 0) ?? 0;

        // Recent stakes for "Hall of Saints" display
        const { data: recentStakes } = await supabase
            .from('staking_records')
            .select('wallet_address, amount, action, tx_hash, created_at')
            .order('created_at', { ascending: false })
            .limit(10);

        return NextResponse.json({
            totalStaked,
            stakerCount: stakeData?.length ?? 0,
            recentStakes: recentStakes ?? []
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

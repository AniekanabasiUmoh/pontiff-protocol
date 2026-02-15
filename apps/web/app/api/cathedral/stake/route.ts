import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/db/supabase-server';

export async function POST(req: NextRequest) {
    const supabase = createServerSupabase();
    try {
        const body = await req.json();
        const { walletAddress, amount, action, txHash } = body;
        // action = 'STAKE' or 'UNSTAKE'

        if (!walletAddress || !amount || !txHash) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { error } = await supabase.from('staking_records').insert({
            wallet_address: walletAddress.toLowerCase(),
            amount: amount.toString(),
            action: action || 'STAKE',
            tx_hash: txHash,
            created_at: new Date().toISOString()
        });

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

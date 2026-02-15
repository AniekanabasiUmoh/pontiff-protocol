import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/db/supabase-server';
import { BalanceService } from '@/lib/services/balance-service';

const FAUCET_AMOUNT = 3000;

export async function POST(req: NextRequest) {
    try {
        const { wallet } = await req.json();

        if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
            return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
        }

        const address = wallet.toLowerCase();
        const supabase = createServerSupabase();

        // Check if already claimed
        const { data: existing } = await supabase
            .from('faucet_claims')
            .select('id, created_at')
            .eq('wallet_address', address)
            .maybeSingle();

        if (existing) {
            return NextResponse.json(
                { error: 'Already claimed. One faucet drop per wallet.' },
                { status: 409 }
            );
        }

        // Credit the balance
        const result = await BalanceService.credit(
            address,
            FAUCET_AMOUNT,
            'DEPOSIT',
            undefined,
            undefined,
            { source: 'faucet' }
        );

        if (!result.success) {
            return NextResponse.json({ error: result.error || 'Failed to credit balance' }, { status: 500 });
        }

        // Record the claim
        await supabase.from('faucet_claims').insert({
            wallet_address: address,
            amount: FAUCET_AMOUNT,
        });

        return NextResponse.json({ success: true, amount: FAUCET_AMOUNT });

    } catch (error: any) {
        console.error('[Faucet] Error:', error);
        return NextResponse.json({ error: error.message || 'Faucet failed' }, { status: 500 });
    }
}

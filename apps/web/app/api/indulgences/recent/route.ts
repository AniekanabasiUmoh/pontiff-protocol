import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/db/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const supabase = createServerSupabase();
    const { data: absolutions, error } = await supabase
        .from('indulgences')
        .select('wallet_address, tier, price_paid, purchased_at, token_id')
        .order('purchased_at', { ascending: false })
        .limit(10);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ absolutions: absolutions ?? [] });
}

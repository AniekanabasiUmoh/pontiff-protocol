import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/db/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const supabase = createServerSupabase();
    const wallet = req.nextUrl.searchParams.get('wallet');

    if (!wallet) return NextResponse.json({ status: 'unknown' });

    const { data, error } = await supabase
        .from('confessions')
        .select('status, sins, indulgence_price, created_at')
        .eq('wallet_address', wallet.toLowerCase())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    // It's possible to have no rows (error code PGRST116), which means 'none'
    if (error && error.code !== 'PGRST116') {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        status: data?.status ?? 'none',
        sins: data?.sins ?? [],
        indulgencePrice: data?.indulgence_price ?? null
    });
}

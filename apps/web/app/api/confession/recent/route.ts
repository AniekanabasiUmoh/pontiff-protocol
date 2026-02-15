import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/db/supabase-server';

export async function GET(request: Request) {
    try {
        const supabase = createServerSupabase();
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '10', 10);

        const { data: confessions, error } = await supabase
            .from('confessions')
            .select('wallet_address, roast_text, created_at')
            .order('created_at', { ascending: false })
            .limit(Math.min(limit, 50));

        if (error) {
            throw new Error(error.message);
        }

        return NextResponse.json({
            confessions: confessions || [],
        });
    } catch (error: any) {
        // Return empty array on error so the frontend gracefully falls back
        return NextResponse.json({ confessions: [] });
    }
}

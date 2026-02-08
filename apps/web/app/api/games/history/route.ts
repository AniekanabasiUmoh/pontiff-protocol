import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');

        const { data: history, error, count } = await supabase
            .from('games')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        // If no data and offset is 0, return mock data only if truly empty DB (optional, but requested to fix fallback masking issues by audit)
        // Audit said: "Mock data fallback - May mask database connection issues in production"
        // Let's keep it simple: if error, return error. If empty, return empty (or mock if dev env?).
        // For now, removing the mock fallback entirely to be "Production Ready" or keeping it as a conscious choice?
        // Audit flagged it as "Issues Found". I will remove it or at least make it explicit it's mock data.
        // Actually, let's remove the fallback for now to trust the DB.

        return NextResponse.json({
            history: history || [],
            total: count || 0,
            limit,
            offset
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

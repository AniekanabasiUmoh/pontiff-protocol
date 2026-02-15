
import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/db/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const supabase = createServerSupabase();
    try {
        const { data, error } = await supabase
            .from('judas_epochs')
            .select('*')
            .order('id', { ascending: false })
            .limit(20);

        if (error) {
            throw error;
        }

        return NextResponse.json({ history: data });
    } catch (error: any) {
        console.error("Failed to fetch judas history:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

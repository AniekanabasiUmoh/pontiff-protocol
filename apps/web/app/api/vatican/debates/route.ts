import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { data: debates, error} = await supabase
            .from('debates')
            .select('*')
            .limit(100);

        if (error) throw error;

        const formatted = (debates || []).map((d: any) => ({
            id: d.id,
            agentHandle: 'Unknown',
            status: d.status,
            exchanges: d.exchanges || 1,
            lastReply: d.our_argument || '',
            heresy: d.their_argument || '',
            createdAt: d.created_at
        }));

        return NextResponse.json({ debates: formatted });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

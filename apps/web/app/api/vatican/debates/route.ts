import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { data: debates, error } = await supabase
            .from('debates')
            .select(`
                *,
                competitorAgent:CompetitorAgent(*)
            `)
            .order('createdAt', { ascending: false });

        if (error) throw error;

        const formatted = (debates || []).map((d: any) => ({
            id: d.id,
            agentHandle: d.competitorAgent?.handle || 'Unknown',
            status: d.status,
            exchanges: d.exchanges,
            lastReply: d.ourArgument,
            heresy: d.theirArgument,
            createdAt: d.createdAt
        }));

        return NextResponse.json({ debates: formatted });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

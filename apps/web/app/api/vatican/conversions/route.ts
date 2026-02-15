import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/db/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = createServerSupabase();
        const { data: conversions, error } = await supabase
            .from('conversions')
            .select(`
                *,
                agent:competitor_agents(id, name, twitter_handle)
            `)
            .order('timestamp', { ascending: false });

        if (error) throw error;

        const formatted = (conversions || []).map((c: any) => ({
            id: c.id,
            agentHandle: c.agent?.twitter_handle || c.agent?.name || 'Unknown',
            type: c.conversion_type,
            amount: c.evidence_data?.amount || null,
            timestamp: c.timestamp,
            evidence: c.evidence_data
        }));

        return NextResponse.json({ conversions: formatted });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

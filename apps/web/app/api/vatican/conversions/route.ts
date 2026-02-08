import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { data: conversions, error } = await supabase
            .from('conversions')
            .select(`
                *,
                competitorAgent:CompetitorAgent(*)
            `)
            .order('timestamp', { ascending: false });

        if (error) throw error;

        const formatted = (conversions || []).map((c: any) => ({
            id: c.id,
            agentHandle: c.competitorAgent?.handle || 'Unknown',
            type: c.type,
            amount: c.amount,
            timestamp: c.timestamp,
            evidence: c.evidence
        }));

        return NextResponse.json({ conversions: formatted });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

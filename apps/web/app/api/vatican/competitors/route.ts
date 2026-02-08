import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Fetch agents with related counts
        // Note: Supabase JS doesn't support easy "include count" in one go for multiple relations deeply
        // But we can select the related data and map it, or use .select('*, conversions:Conversion(count), debates:Debate(count)') check support
        // Supabase PostgREST supports: select=*,conversions(count),debates(count)

        const { data: agents, error } = await supabase
            .from('competitor_agents')
            .select(`
                *,
                conversions:Conversion(count),
                debates:Debate(count)
            `)
            .order('lastInteraction', { ascending: false });

        if (error) throw error;

        const formatted = (agents || []).map((a: any) => ({
            id: a.id,
            handle: a.handle,
            name: a.name || a.handle,
            threatLevel: a.threatLevel,
            status: a.status,
            tokenSymbol: a.tokenSymbol || 'N/A',
            marketCap: a.marketCap,
            isShadow: a.isShadow,
            conversionsCount: a.conversions?.[0]?.count || 0, // PostgREST returns [{count: N}]
            debatesCount: a.debates?.[0]?.count || 0
        }));

        return NextResponse.json({ agents: formatted });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

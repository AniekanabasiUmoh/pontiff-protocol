import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/db/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = createServerSupabase();
        // Fetch agents with related counts
        // Note: Supabase JS doesn't support easy "include count" in one go for multiple relations deeply
        // But we can select the related data and map it, or use .select('*, conversions:Conversion(count), debates:Debate(count)') check support
        // Supabase PostgREST supports: select=*,conversions(count),debates(count)

        const { data: agents, error } = await supabase
            .from('competitor_agents')
            .select('*')
            .limit(100);

        if (error) throw error;

        const formatted = (agents || []).map((a: any) => ({
            id: a.id,
            handle: a.twitter_handle || 'Unknown',
            name: a.name || a.twitter_handle || 'Unknown',
            threatLevel: a.threat_level || 'Low',
            status: a.is_shadow_agent ? 'Simulation' : 'Detected',
            tokenSymbol: a.token_symbol || 'N/A',
            marketCap: a.market_cap || '0',
            isShadow: a.is_shadow_agent || false,
            conversionsCount: 0,
            debatesCount: 0
        }));

        return NextResponse.json({ agents: formatted });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

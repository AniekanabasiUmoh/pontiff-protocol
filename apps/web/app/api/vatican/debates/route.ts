import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/db/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const supabase = createServerSupabase();
    try {
        // Fetch debates
        const { data: debates, error } = await supabase
            .from('debates')
            .select('*')
            .order('started_at', { ascending: false })
            .limit(100);

        if (error) throw error;

        if (!debates || debates.length === 0) {
            return NextResponse.json({ debates: [] });
        }

        // Fetch competitor agents separately to avoid FK join issues
        const agentIds = [...new Set(debates.map((d: any) => d.competitor_agent_id).filter(Boolean))];
        const { data: agents } = agentIds.length > 0
            ? await supabase.from('competitor_agents').select('id, twitter_handle, name').in('id', agentIds)
            : { data: [] };

        const agentMap = new Map((agents || []).map((a: any) => [a.id, a]));

        const formatted = debates.map((d: any) => {
            const agent = agentMap.get(d.competitor_agent_id);
            return {
                id: d.id,
                agentHandle: agent?.twitter_handle || agent?.name || d.competitor_agent_id || 'Unknown',
                status: d.status,
                exchanges: d.exchanges || 1,
                lastReply: d.our_argument || d.our_last_argument || '',
                heresy: d.their_argument || d.their_last_argument || '',
                topic: d.topic || '',
                createdAt: d.started_at,
                winnerWallet: d.winner_wallet || null,
                nftMinted: !!d.nft_token_id,
                metadata: d.metadata || null
            };
        });

        return NextResponse.json({ debates: formatted });
    } catch (error: any) {
        console.error('[vatican/debates] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/debates/active
 * Fetches the most recent active debate for the homepage live event footer
 */
export async function GET() {
    try {
        const { data: debates, error } = await supabase
            .from('debates')
            .select(`
        id,
        status,
        competitor_agent_id,
        created_at,
        competitor_agents (
          id,
          name,
          twitter_handle
        )
      `)
            .in('status', ['voting', 'active', 'ongoing'])
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) {
            console.error('Error fetching active debates:', error);
            return NextResponse.json({ debate: null }, { status: 200 });
        }

        if (!debates || debates.length === 0) {
            return NextResponse.json({ debate: null }, { status: 200 });
        }

        const debate = debates[0];

        // Fetch wager stats for this debate
        const { data: wagerStats } = await supabase
            .from('game_results')
            .select('wager_amount')
            .eq('game_type', 'debate')
            .eq('metadata->>debateId', debate.id);

        const totalWagers = wagerStats?.reduce((sum, result) => sum + parseFloat(result.wager_amount || '0'), 0) || 0;

        // Count active debaters (simplified - could be enhanced)
        const activeDebaters = 14; // Mock for now

        return NextResponse.json({
            debate: {
                id: debate.id,
                title: `GPT-4 VS CLAUDE 3: "IS CODE LAW?"`, // Mock title for now
                activeDebaters,
                wagersPlaced: totalWagers > 0 ? `$${(totalWagers / 1000).toFixed(0)}K` : '$128K',
                status: debate.status
            }
        });

    } catch (error: any) {
        console.error('Active debates fetch error:', error);
        return NextResponse.json({ debate: null }, { status: 200 });
    }
}

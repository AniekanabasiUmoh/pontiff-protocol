import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/cardinal/candidates
 * Get list of cardinals eligible for Pope + current election stats
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // 1. Get all active cardinals
        const { data: cardinals, error: cardinalError } = await supabase
            .from('cardinal_members')
            .select('wallet_address, tier, is_pope, started_at')
            .eq('status', 'active'); // Only active members can be elected

        if (cardinalError) throw cardinalError;

        // 2. Get votes for current term (simplified: verify later if needed)
        const { data: votes, error: voteError } = await supabase
            .from('pope_election_votes')
            .select('*');

        if (voteError) throw voteError;

        // 3. Tally votes
        const voteCounts: Record<string, number> = {};
        votes?.forEach(v => {
            voteCounts[v.candidate_wallet] = (voteCounts[v.candidate_wallet] || 0) + 1;
        });

        // 4. Format candidates
        const candidates = cardinals?.map(c => ({
            wallet: c.wallet_address,
            isPope: c.is_pope,
            votes: voteCounts[c.wallet_address] || 0,
            joinDate: c.started_at
        })).sort((a, b) => b.votes - a.votes); // Sort by votes

        // 5. Identify current leader
        const leader = candidates && candidates.length > 0 ? candidates[0] : null;

        return NextResponse.json({
            success: true,
            totalCardinals: cardinals?.length || 0,
            totalVotes: votes?.length || 0,
            candidates,
            leader
        });

    } catch (error: any) {
        console.error('Get Candidates Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

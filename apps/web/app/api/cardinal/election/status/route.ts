import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/cardinal/election/status
 * Get election status: term info, participation rate, time until next election, current Pope
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // 1. Get all active cardinals
        const { data: cardinals, error: ce } = await supabase
            .from('cardinal_members')
            .select('wallet_address, tier, is_pope, started_at')
            .eq('status', 'active');

        if (ce) throw ce;

        // 2. Get current term votes
        const { data: votes, error: ve } = await supabase
            .from('pope_election_votes')
            .select('*');

        if (ve) throw ve;

        // 3. Find current Pope
        const currentPope = cardinals?.find(c => c.is_pope);

        // 4. Tally votes
        const voteCounts: Record<string, number> = {};
        votes?.forEach(v => {
            voteCounts[v.candidate_wallet] = (voteCounts[v.candidate_wallet] || 0) + 1;
        });

        // 5. Find leader
        const sortedCandidates = Object.entries(voteCounts)
            .sort(([, a], [, b]) => b - a);

        const leader = sortedCandidates.length > 0 ? {
            wallet: sortedCandidates[0][0],
            votes: sortedCandidates[0][1]
        } : null;

        // 6. Calculate election term info
        // Elections reset on the 1st of each month
        const now = new Date();
        const nextElection = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const msUntilNext = nextElection.getTime() - now.getTime();
        const daysUntilNext = Math.ceil(msUntilNext / (1000 * 60 * 60 * 24));

        // Quorum = 50% of active cardinals
        const quorum = Math.ceil((cardinals?.length || 0) / 2);
        const hasQuorum = (votes?.length || 0) >= quorum;

        return NextResponse.json({
            success: true,
            election: {
                status: 'active',
                currentPope: currentPope ? {
                    wallet: currentPope.wallet_address,
                    tier: currentPope.tier
                } : null,
                leader,
                totalCardinals: cardinals?.length || 0,
                totalVotes: votes?.length || 0,
                participationRate: cardinals?.length
                    ? Math.round(((votes?.length || 0) / cardinals.length) * 100)
                    : 0,
                quorum,
                hasQuorum,
                termEnd: nextElection.toISOString(),
                daysRemaining: daysUntilNext,
            }
        });

    } catch (error: any) {
        console.error('Election Status Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

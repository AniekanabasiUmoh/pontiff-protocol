import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/cardinal/vote
 * Cast a vote for Pope
 * Body: { voter: string, candidate: string }
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        const { voter, candidate } = body;

        if (!voter || !candidate) {
            return NextResponse.json(
                { success: false, error: 'Missing voter or candidate address' },
                { status: 400 }
            );
        }

        // 1. Verify Voter is an active Cardinal
        const { data: voterData, error: voterError } = await supabase
            .from('cardinal_members')
            .select('status')
            .eq('wallet_address', voter)
            .single();

        if (voterError || !voterData || voterData.status !== 'active') {
            return NextResponse.json(
                { success: false, error: 'Only active Cardinals can vote' },
                { status: 403 }
            );
        }

        // 2. Verify Candidate is an active Cardinal
        const { data: candidateData } = await supabase
            .from('cardinal_members')
            .select('status')
            .eq('wallet_address', candidate)
            .single();

        if (!candidateData || candidateData.status !== 'active') {
            return NextResponse.json(
                { success: false, error: 'Candidate must be an active Cardinal' },
                { status: 400 }
            );
        }

        // 3. Upsert Vote (can change vote within term)
        const { error: voteDataError } = await supabase
            .from('pope_election_votes')
            .upsert({
                voter_wallet: voter,
                candidate_wallet: candidate,
                // term_date defaults to current_date in DB, simplified for MVP
            });

        if (voteDataError) throw voteDataError;

        return NextResponse.json({
            success: true,
            message: 'Vote cast successfully'
        });

    } catch (error: any) {
        console.error('Cast Vote Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

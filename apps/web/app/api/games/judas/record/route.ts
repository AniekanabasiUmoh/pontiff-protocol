import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { LeaderboardService } from '@/lib/services/leaderboard-service';
import { updateWorldState } from '@/lib/actions/update-world-state';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            playerAddress,
            actionType, // 'STAKE' | 'BETRAY' | 'WITHDRAW'
            amount,
            transactionHash,
            roundId,
            tournamentId
        } = body;

        if (!playerAddress || !actionType) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Record Game Action
        const { data: game, error: dbError } = await supabase
            .from('games')
            .insert([{
                player1: playerAddress,
                player2: "JudasProtocol",
                game_type: "JUDAS",
                wager: amount?.toString() || "0",
                status: "completed",
                result: {
                    action: actionType,
                    txHash: transactionHash,
                    round: roundId,
                    tournament: tournamentId
                },
                created_at: new Date().toISOString()
            }] as any)
            .select()
            .single();

        if (dbError) {
            console.error("DB Error:", dbError);
            throw new Error(dbError.message);
        }

        // 2. Update Leaderboard
        // 'WITHDRAW' implies profit realization (or loss realization)
        // 'BETRAY' counts towards Heretic score
        if (actionType === 'WITHDRAW') {
            // Logic: If user withdraws more than they put in effectively? 
            // Currently we just track raw amount interaction for simplicity in this MVP hook.
            // Ideally we'd calculate PnL. For now, let's treat amount as "profit" or "impact".
            // If actionType is withdrawal, it's typically a "WIN" in the sense of realizing gains.
            await LeaderboardService.updateLeaderboard(playerAddress, 'WIN', Number(amount));
        } else if (actionType === 'BETRAY') {
            await LeaderboardService.updateLeaderboard(playerAddress, 'BETRAYAL', 0);
        }

        // 3. Trigger World State Update
        updateWorldState().catch((err: any) => console.error('Failed to update world state:', err));

        // 4. Update Leaderboard
        try {
            if (actionType === 'BETRAY') {
                await LeaderboardService.updateLeaderboard(playerAddress, 'BETRAYAL', 0);
            } else if (actionType === 'WITHDRAW' && amount > 0) {
                await LeaderboardService.updateLeaderboard(playerAddress, 'WIN', amount);
            }
            // STAKE counts as participation, maybe we don't update score yet?
        } catch (lbError) {
            console.error("Failed to update leaderboard:", lbError);
        }

        return NextResponse.json({ success: true, gameId: (game as any)?.id });

    } catch (error: any) {
        console.error("Judas Record Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

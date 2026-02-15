import { NextRequest, NextResponse } from 'next/server';
import { BalanceService } from '@/lib/services/balance-service';
import { createServerSupabase } from '@/lib/db/supabase-server';
import crypto from 'crypto';


/**
 * POST /api/games/crusade/join
 * Join a crusade by paying the entry fee from casino balance.
 * 
 * Input: { walletAddress, crusadeId }
 */
export async function POST(req: NextRequest) {
    try {
        const { walletAddress, crusadeId } = await req.json();

        if (!walletAddress || !crusadeId) {
            return NextResponse.json({ error: 'Missing walletAddress or crusadeId' }, { status: 400 });
        }

        const wallet = walletAddress.toLowerCase();

        // Get crusade details
        const { data: crusade, error: crusadeError } = await supabase
            .from('crusades')
            .select('*')
            .eq('id', crusadeId)
            .single();

        if (crusadeError || !crusade) {
            return NextResponse.json({ error: 'Crusade not found' }, { status: 404 });
        }

        if (crusade.status !== 'Active') {
            return NextResponse.json({ error: 'Crusade is no longer active' }, { status: 400 });
        }

        const entryFee = crusade.entry_fee || 100; // Default 100 GUILT

        // Debit entry fee
        const debitResult = await BalanceService.debit(wallet, entryFee, 'WAGER', crusadeId, 'CRUSADE', {
            crusadeName: crusade.target_agent_handle,
            action: 'join',
        });

        if (!debitResult.success) {
            return NextResponse.json(
                { error: debitResult.error || 'Insufficient balance for crusade entry' },
                { status: 400 }
            );
        }

        // Add participant
        const { error: joinError } = await supabase
            .from('crusade_participants')
            .insert({
                crusade_id: crusadeId,
                wallet_address: wallet,
                contribution: 0,
                joined_at: new Date().toISOString(),
            });

        // Update crusade participant count
        await supabase
            .from('crusades')
            .update({
                participant_count: (crusade.participant_count || 0) + 1,
                reward_pool: (crusade.reward_pool || 0) + entryFee,
            })
            .eq('id', crusadeId);

        return NextResponse.json({
            success: true,
            message: `Joined crusade against ${crusade.target_agent_handle}!`,
            entryFee,
            casinoBalance: debitResult.balance,
        });
    } catch (error: any) {
        console.error('[Crusade Join]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

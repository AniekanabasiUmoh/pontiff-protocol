import { NextRequest, NextResponse } from 'next/server';
import { BalanceService } from '@/lib/services/balance-service';
import { createServerSupabase } from '@/lib/db/supabase-server';
import crypto from 'crypto';


/**
 * POST /api/games/crusade/attack
 * Perform an attack in a crusade — costs GUILT, adds progress.
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
        const attackCost = 50; // Cost per attack

        // Verify participant
        const { data: participant } = await supabase
            .from('crusade_participants')
            .select('*')
            .eq('crusade_id', crusadeId)
            .eq('wallet_address', wallet)
            .single();

        if (!participant) {
            return NextResponse.json({ error: 'You must join the crusade first' }, { status: 400 });
        }

        // Debit attack cost
        const debitResult = await BalanceService.debit(wallet, attackCost, 'WAGER', crusadeId, 'CRUSADE', {
            action: 'attack',
        });

        if (!debitResult.success) {
            return NextResponse.json(
                { error: debitResult.error || 'Insufficient balance for attack' },
                { status: 400 }
            );
        }

        // Calculate damage (random 10-30%)
        const damage = Math.floor(Math.random() * 21) + 10;

        // Update crusade progress
        const { data: crusade } = await supabase
            .from('crusades')
            .select('*')
            .eq('id', crusadeId)
            .single();

        if (!crusade) {
            return NextResponse.json({ error: 'Crusade not found' }, { status: 404 });
        }

        const newProgress = Math.min((crusade.progress || 0) + damage, 100);
        const isVictory = newProgress >= 100;

        await supabase
            .from('crusades')
            .update({
                progress: newProgress,
                status: isVictory ? 'Victory' : 'Active',
            })
            .eq('id', crusadeId);

        // Update participant contribution
        await supabase
            .from('crusade_participants')
            .update({
                contribution: (participant.contribution || 0) + damage,
            })
            .eq('crusade_id', crusadeId)
            .eq('wallet_address', wallet);

        // If victory, distribute rewards
        let reward = 0;
        if (isVictory) {
            const rewardPool = crusade.reward_pool || 0;
            // Get all participants
            const { data: allParticipants } = await supabase
                .from('crusade_participants')
                .select('*')
                .eq('crusade_id', crusadeId);

            if (allParticipants && allParticipants.length > 0) {
                const totalContribution = allParticipants.reduce((sum: number, p: any) => sum + (p.contribution || 0) + (wallet === p.wallet_address ? damage : 0), 0);

                for (const p of allParticipants) {
                    const contrib = p.wallet_address === wallet ? (p.contribution || 0) + damage : (p.contribution || 0);
                    const share = totalContribution > 0 ? (contrib / totalContribution) * rewardPool * 1.5 : 0; // 1.5x multiplier for crusade wins

                    if (share > 0) {
                        await BalanceService.credit(p.wallet_address, share, 'CRUSADE_REWARD', crusadeId, 'CRUSADE', {
                            contribution: contrib,
                            totalContribution,
                        });

                        if (p.wallet_address === wallet) reward = share;
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            damage,
            progress: newProgress,
            isVictory,
            reward: isVictory ? reward : 0,
            attackCost,
            casinoBalance: (await BalanceService.getBalance(wallet)).available,
        });
    } catch (error: any) {
        console.error('[Crusade Attack]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

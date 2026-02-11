import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { ethers } from 'ethers';

/**
 * Module 12: Confession Staking System
 *
 * Allows users to stake $GUILT to reduce their sin score
 * - Minimum stake: 100 GUILT
 * - Sin score reduction: 1 point per 10 GUILT staked
 * - Confession NFT minted upon successful penance
 */

const MIN_STAKE_AMOUNT = ethers.parseEther('100');
const SIN_REDUCTION_RATE = 10; // 10 GUILT = 1 sin score point

interface User {
    id: string;
    sin_score: number;
    wallet_address: string;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { walletAddress, stakeAmount, txHash } = body;

        // Validate input
        if (!walletAddress || !stakeAmount || !txHash) {
            return NextResponse.json(
                { error: 'Missing required fields: walletAddress, stakeAmount, txHash' },
                { status: 400 }
            );
        }

        // Validate wallet address format
        if (!ethers.isAddress(walletAddress)) {
            return NextResponse.json(
                { error: 'Invalid wallet address format' },
                { status: 400 }
            );
        }

        const stakeAmountBigInt = BigInt(stakeAmount);

        // Check minimum stake
        if (stakeAmountBigInt < MIN_STAKE_AMOUNT) {
            return NextResponse.json(
                {
                    error: 'Insufficient stake amount',
                    message: `Minimum stake is ${ethers.formatEther(MIN_STAKE_AMOUNT)} GUILT`,
                    minimumStake: ethers.formatEther(MIN_STAKE_AMOUNT)
                },
                { status: 400 }
            );
        }

        // Calculate sin score reduction
        const stakeAmountEther = parseFloat(ethers.formatEther(stakeAmountBigInt));
        const sinReduction = Math.floor(stakeAmountEther / SIN_REDUCTION_RATE);

        // Fetch user's current sin data
        const { data: rawUserData, error: userError } = await supabase
            .from('users')
            .select('id, sin_score')
            .eq('wallet_address', walletAddress.toLowerCase())
            .single();

        const userData = rawUserData as unknown as User;

        if (userError) {
            console.error('[Confession Stake] User fetch error:', userError);
            return NextResponse.json(
                { error: 'User not found. Please complete wallet scan first.' },
                { status: 404 }
            );
        }

        const currentSinScore = userData.sin_score || 0;
        const newSinScore = Math.max(0, currentSinScore - sinReduction);

        // Store confession stake record
        const { data: rawConfession, error: confessionError } = await supabase
            .from('confessions')
            // @ts-ignore
            .insert({
                wallet_address: walletAddress.toLowerCase(),
                confession_type: 'penance_stake',
                stake_amount: ethers.formatEther(stakeAmountBigInt),
                sin_reduction: sinReduction,
                previous_sin_score: currentSinScore,
                new_sin_score: newSinScore,
                transaction_hash: txHash,
                status: 'completed',
                created_at: new Date().toISOString()
            } as any)
            .select()
            .single();

        const confession = rawConfession as any;

        if (confessionError) {
            console.error('[Confession Stake] Insert error:', confessionError);
            return NextResponse.json(
                { error: 'Failed to store confession record', details: confessionError.message },
                { status: 500 }
            );
        }

        // Update user's sin score
        const { error: updateError } = await supabase
            .from('users')
            // @ts-ignore
            .update({
                sin_score: newSinScore,
                last_confession_at: new Date().toISOString()
            } as any)
            .eq('wallet_address', walletAddress.toLowerCase());

        if (updateError) {
            console.error('[Confession Stake] User update error:', updateError);
        }

        console.log(`[Confession Stake] ${walletAddress} staked ${stakeAmountEther} GUILT, sin reduced by ${sinReduction}`);

        return NextResponse.json({
            success: true,
            confession: {
                id: confession.id,
                walletAddress,
                stakeAmount: ethers.formatEther(stakeAmountBigInt),
                sinReduction,
                previousSinScore: currentSinScore,
                newSinScore,
                txHash,
                message: newSinScore === 0
                    ? '🙏 Your sins have been fully absolved! You are cleansed in the eyes of The Pontiff.'
                    : `✨ Your sin score has been reduced by ${sinReduction} points. Continue your penance to achieve full absolution.`
            }
        });

    } catch (error: any) {
        console.error('[Confession Stake] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error.message },
            { status: 500 }
        );
    }
}

/**
 * GET endpoint to check confession eligibility and pricing
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const walletAddress = searchParams.get('wallet');

        if (!walletAddress) {
            return NextResponse.json(
                { error: 'Missing wallet address parameter' },
                { status: 400 }
            );
        }

        // Fetch user's sin data
        const { data: rawUserData, error: userError } = await supabase
            .from('users')
            .select('sin_score, last_confession_at')
            .eq('wallet_address', walletAddress.toLowerCase())
            .single();

        const userData = rawUserData as any;

        if (userError) {
            return NextResponse.json({
                eligible: false,
                error: 'User not found. Please complete wallet scan first.',
                minimumStake: ethers.formatEther(MIN_STAKE_AMOUNT),
                sinReductionRate: SIN_REDUCTION_RATE
            });
        }

        const currentSinScore = userData.sin_score || 0;
        const costForFullAbsolution = currentSinScore * SIN_REDUCTION_RATE;

        return NextResponse.json({
            eligible: currentSinScore > 0,
            currentSinScore,
            minimumStake: ethers.formatEther(MIN_STAKE_AMOUNT),
            sinReductionRate: SIN_REDUCTION_RATE,
            costForFullAbsolution: costForFullAbsolution.toString(),
            lastConfession: userData.last_confession_at,
            message: currentSinScore === 0
                ? 'Your soul is already cleansed.'
                : `Stake ${costForFullAbsolution} GUILT to achieve full absolution.`
        });

    } catch (error: any) {
        console.error('[Confession Eligibility] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error.message },
            { status: 500 }
        );
    }
}

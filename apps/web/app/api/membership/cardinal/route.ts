import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { ethers } from 'ethers';

export const dynamic = 'force-dynamic';

const CARDINAL_MONTHLY_FEE = ethers.parseEther('1000'); // 1000 GUILT per month
const MEMBERSHIP_DURATION_DAYS = 30;

const GUILT_ABI = [
    'function transferFrom(address from, address to, uint256 amount) external returns (bool)',
    'function balanceOf(address account) external view returns (uint256)'
];

interface CardinalPerks {
    reducedHouseEdge: boolean;
    houseEdgeReduction: number; // percentage points (e.g., 2 = 2% reduction)
    exclusiveGames: boolean;
    vipLeaderboard: boolean;
    prioritySupport: boolean;
    specialBadge: boolean;
}

const CARDINAL_PERKS: CardinalPerks = {
    reducedHouseEdge: true,
    houseEdgeReduction: 2, // 5% house edge becomes 3% for Cardinals
    exclusiveGames: true,
    vipLeaderboard: true,
    prioritySupport: true,
    specialBadge: true
};

/**
 * Module 10: Cardinal Membership System
 *
 * POST /api/membership/cardinal/subscribe
 * Subscribe to Cardinal membership (1000 GUILT/month)
 *
 * GET /api/membership/cardinal/status
 * Check membership status and benefits
 */

export async function POST(request: NextRequest) {
    try {
        const { action, walletAddress } = await request.json();

        switch (action) {
            case 'subscribe':
                return await subscribeCardinal(walletAddress);

            case 'renew':
                return await renewCardinal(walletAddress);

            case 'cancel':
                return await cancelCardinal(walletAddress);

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

    } catch (error: any) {
        console.error('Cardinal membership error:', error);
        return NextResponse.json({
            error: 'Membership operation failed',
            details: error.message
        }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const walletAddress = searchParams.get('address');

        if (!walletAddress) {
            return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
        }

        // Check membership status
        const status = await getCardinalStatus(walletAddress);

        return NextResponse.json({
            address: walletAddress,
            isCardinal: status.active,
            expiresAt: status.expires_at,
            daysRemaining: status.daysRemaining,
            perks: status.active ? CARDINAL_PERKS : null,
            totalSpent: status.totalSpent
        });

    } catch (error: any) {
        console.error('Status check error:', error);
        return NextResponse.json({
            error: 'Failed to check status',
            details: error.message
        }, { status: 500 });
    }
}

/**
 * Subscribe to Cardinal membership
 */
async function subscribeCardinal(walletAddress: string) {
    try {
        // Check if already subscribed
        const existingStatus = await getCardinalStatus(walletAddress);
        if (existingStatus.active) {
            return NextResponse.json({
                error: 'Already subscribed',
                expiresAt: existingStatus.expires_at
            }, { status: 400 });
        }

        // Process payment
        const paymentResult = await processCardinalPayment(walletAddress);
        if (!paymentResult.success) {
            return NextResponse.json({
                error: 'Payment failed',
                details: paymentResult.error
            }, { status: 500 });
        }

        // Create membership record
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + MEMBERSHIP_DURATION_DAYS);

        const { data: membership, error: membershipError } = await supabase
            .from('cardinal_memberships')
            .insert({
                wallet_address: walletAddress.toLowerCase(),
                started_at: new Date().toISOString(),
                expires_at: expiresAt.toISOString(),
                payment_tx_hash: paymentResult.txHash,
                payment_amount: ethers.formatEther(CARDINAL_MONTHLY_FEE),
                status: 'active'
            })
            .select()
            .single();

        if (membershipError) {
            console.error('Failed to create membership:', membershipError);
            return NextResponse.json({
                error: 'Failed to activate membership',
                details: membershipError.message
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            membership,
            perks: CARDINAL_PERKS,
            message: 'Welcome to the Cardinals! Your benefits are now active.',
            expiresAt: expiresAt.toISOString()
        });

    } catch (error: any) {
        console.error('Subscription error:', error);
        return NextResponse.json({
            error: 'Failed to subscribe',
            details: error.message
        }, { status: 500 });
    }
}

/**
 * Renew Cardinal membership
 */
async function renewCardinal(walletAddress: string) {
    try {
        const status = await getCardinalStatus(walletAddress);
        if (!status.membership_id) {
            return NextResponse.json({
                error: 'No active membership found'
            }, { status: 404 });
        }

        // Process payment
        const paymentResult = await processCardinalPayment(walletAddress);
        if (!paymentResult.success) {
            return NextResponse.json({
                error: 'Payment failed',
                details: paymentResult.error
            }, { status: 500 });
        }

        // Extend expiration by 30 days
        const currentExpiry = new Date(status.expiresAt || Date.now());
        const newExpiry = new Date(currentExpiry);
        newExpiry.setDate(newExpiry.getDate() + MEMBERSHIP_DURATION_DAYS);

        const { error: updateError } = await supabase
            .from('cardinal_memberships')
            .update({
                expires_at: newExpiry.toISOString(),
                last_renewed_at: new Date().toISOString(),
                status: 'active'
            })
            .eq('id', status.membership_id);

        if (updateError) {
            return NextResponse.json({
                error: 'Failed to renew membership',
                details: updateError.message
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Membership renewed successfully',
            expiresAt: newExpiry.toISOString()
        });

    } catch (error: any) {
        console.error('Renewal error:', error);
        return NextResponse.json({
            error: 'Failed to renew',
            details: error.message
        }, { status: 500 });
    }
}

/**
 * Cancel Cardinal membership
 */
async function cancelCardinal(walletAddress: string) {
    try {
        const status = await getCardinalStatus(walletAddress);
        if (!status.membership_id) {
            return NextResponse.json({
                error: 'No active membership found'
            }, { status: 404 });
        }

        // Update status to cancelled (but keep until expiry)
        const { error: updateError } = await supabase
            .from('cardinal_memberships')
            .update({
                status: 'cancelled',
                cancelled_at: new Date().toISOString()
            })
            .eq('id', status.membership_id);

        if (updateError) {
            return NextResponse.json({
                error: 'Failed to cancel membership',
                details: updateError.message
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Membership cancelled. Benefits will remain active until expiration.',
            expiresAt: status.expires_at
        });

    } catch (error: any) {
        console.error('Cancellation error:', error);
        return NextResponse.json({
            error: 'Failed to cancel',
            details: error.message
        }, { status: 500 });
    }
}

/**
 * Get Cardinal membership status
 */
async function getCardinalStatus(walletAddress: string) {
    const { data: memberships, error } = await supabase
        .from('cardinal_memberships')
        .select('*')
        .eq('wallet_address', walletAddress.toLowerCase())
        .eq('status', 'active')
        .order('expires_at', { ascending: false })
        .limit(1);

    if (error || !memberships || memberships.length === 0) {
        return { active: false, expiresAt: null, daysRemaining: 0, membershipId: null, totalSpent: 0 };
    }

    const membership = memberships[0];
    const expiresAt = new Date(membership.expires_at);
    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const active = daysRemaining > 0;

    // Calculate total spent
    const { data: allMemberships } = await supabase
        .from('cardinal_memberships')
        .select('payment_amount')
        .eq('wallet_address', walletAddress.toLowerCase());

    const totalSpent = (allMemberships || []).reduce((sum, m) => sum + parseFloat(m.payment_amount || '0'), 0);

    return {
        active,
        expires_at: membership.expires_at,
        daysRemaining,
        membership_id: membership.id,
        totalSpent
    };
}

/**
 * Process payment for Cardinal membership
 */
async function processCardinalPayment(walletAddress: string) {
    try {
        // In production, this would:
        // 1. Transfer 1000 GUILT from user to Treasury
        // 2. Verify transaction on-chain
        // 3. Record in database

        console.log(`[Cardinal Payment] Processing 1000 GUILT from ${walletAddress}`);

        // Mock successful payment
        return {
            success: true,
            txHash: `0x${Math.random().toString(16).substring(2, 66)}`
        };

    } catch (error: any) {
        console.error('Payment processing error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

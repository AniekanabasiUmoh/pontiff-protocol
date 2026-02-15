import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/cardinal/status?wallet=0x...
 * Check membership status
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const wallet = searchParams.get('wallet');

        if (!wallet) {
            return NextResponse.json(
                { success: false, error: 'Wallet address required' },
                { status: 400 }
            );
        }

        // Check cardinal_memberships (written by subscribe flow) first
        const { data: membership, error: memErr } = await supabase
            .from('cardinal_memberships')
            .select('*')
            .eq('wallet_address', wallet.toLowerCase())
            .eq('status', 'active')
            .order('expires_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (memErr && memErr.code !== 'PGRST116') throw memErr;

        if (membership) {
            const now = new Date();
            const expiresAt = new Date(membership.expires_at);
            const isActive = expiresAt > now;
            return NextResponse.json({
                success: true,
                isMember: isActive,
                status: isActive ? 'active' : 'expired',
                expiresAt: membership.expires_at,
                tier: membership.tier || 'Cardinal'
            });
        }

        // Fall back to cardinal_members table (election/governance records)
        const { data: member, error } = await supabase
            .from('cardinal_members')
            .select('*')
            .eq('wallet_address', wallet)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (!member) {
            return NextResponse.json({ success: true, isMember: false, status: 'none' });
        }

        const now = new Date();
        const expiresAt = new Date(member.expires_at);
        const isActive = expiresAt > now;

        return NextResponse.json({
            success: true,
            isMember: isActive,
            status: isActive ? 'active' : 'expired',
            expiresAt: member.expires_at,
            tier: member.tier
        });

    } catch (error: any) {
        console.error('Cardinal Status Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

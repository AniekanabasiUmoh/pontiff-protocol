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

        const { data: member, error } = await supabase
            .from('cardinal_members')
            .select('*')
            .eq('wallet_address', wallet)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
            throw error;
        }

        if (!member) {
            return NextResponse.json({
                success: true,
                isMember: false,
                status: 'none'
            });
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

import { NextRequest, NextResponse } from 'next/server';
import { BalanceService } from '@/lib/services/balance-service';

/**
 * GET /api/bank/balance?wallet=0x...
 * Returns the user's casino balance and stats.
 */
export async function GET(req: NextRequest) {
    try {
        const wallet = req.nextUrl.searchParams.get('wallet');

        if (!wallet) {
            return NextResponse.json(
                { error: 'Missing wallet parameter' },
                { status: 400 }
            );
        }

        const balance = await BalanceService.getBalance(wallet);

        return NextResponse.json({
            success: true,
            ...balance,
        });
    } catch (error: any) {
        console.error('[Balance] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get balance' },
            { status: 500 }
        );
    }
}

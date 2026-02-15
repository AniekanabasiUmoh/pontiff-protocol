import { NextRequest, NextResponse } from 'next/server';
import { BalanceService } from '@/lib/services/balance-service';

/**
 * GET /api/bank/transactions?wallet=0x...&limit=50
 * Returns the user's balance transaction history.
 */
export async function GET(req: NextRequest) {
    try {
        const wallet = req.nextUrl.searchParams.get('wallet');
        const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');

        if (!wallet) {
            return NextResponse.json(
                { error: 'Missing wallet parameter' },
                { status: 400 }
            );
        }

        const transactions = await BalanceService.getTransactions(wallet, limit);

        return NextResponse.json({
            success: true,
            transactions,
            count: transactions.length,
        });
    } catch (error: any) {
        console.error('[Transactions] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get transactions' },
            { status: 500 }
        );
    }
}

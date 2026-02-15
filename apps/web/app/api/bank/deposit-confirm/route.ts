import { NextRequest, NextResponse } from 'next/server';
import {
    createPublicClient,
    http,
    parseAbi,
    formatEther,
    decodeEventLog,
} from 'viem';
import { monadTestnet } from 'viem/chains';
import { BalanceService } from '@/lib/services/balance-service';

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
const TREASURY_ADDRESS = process.env.NEXT_PUBLIC_TREASURY_ADDRESS!;

const TREASURY_ABI = [
    'event Deposit(address indexed user, uint256 amount, uint256 newTotal, uint256 timestamp)',
];

/**
 * POST /api/bank/deposit-confirm
 * Called after user's deposit() tx confirms on-chain.
 * Verifies the tx, parses the Deposit event, and credits user's casino balance.
 */
export async function POST(req: NextRequest) {
    try {
        const { txHash, walletAddress } = await req.json();

        if (!txHash || !walletAddress) {
            return NextResponse.json(
                { error: 'Missing txHash or walletAddress' },
                { status: 400 }
            );
        }

        const wallet = walletAddress.toLowerCase();

        // Verify the transaction on-chain
        const publicClient = createPublicClient({ chain: monadTestnet, transport: http(RPC_URL) });
        const receipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` });

        if (!receipt) {
            return NextResponse.json(
                { error: 'Transaction not found or not yet confirmed' },
                { status: 404 }
            );
        }

        if (receipt.status !== 'success') {
            return NextResponse.json(
                { error: 'Transaction failed on-chain' },
                { status: 400 }
            );
        }

        // Verify it went to our Treasury contract
        if (receipt.to?.toLowerCase() !== TREASURY_ADDRESS.toLowerCase()) {
            return NextResponse.json(
                { error: 'Transaction was not sent to the Treasury contract' },
                { status: 403 }
            );
        }

        // Parse the Deposit event
        const TREASURY_EVENT_ABI = parseAbi([TREASURY_ABI[0]]);
        let depositAmount: bigint | null = null;
        let depositor: string | null = null;

        for (const log of receipt.logs) {
            try {
                const decoded = decodeEventLog({ abi: TREASURY_EVENT_ABI, data: log.data, topics: log.topics });
                if (decoded.eventName === 'Deposit') {
                    const args = decoded.args as any;
                    depositor = (args.user as string).toLowerCase();
                    depositAmount = args.amount as bigint;
                    break;
                }
            } catch {
                // Not our event, skip
            }
        }

        if (!depositAmount || !depositor) {
            return NextResponse.json(
                { error: 'Could not parse Deposit event from transaction' },
                { status: 400 }
            );
        }

        // Verify the depositor matches the claimed wallet
        if (depositor !== wallet) {
            return NextResponse.json(
                { error: 'Deposit was made by a different wallet' },
                { status: 403 }
            );
        }

        // Convert from wei to GUILT (18 decimals)
        const amountInGuilt = parseFloat(formatEther(depositAmount));

        // Credit the user's casino balance
        const result = await BalanceService.credit(
            wallet,
            amountInGuilt,
            'DEPOSIT',
            undefined,
            undefined,
            { txHash, onChainAmount: depositAmount.toString() }
        );

        if (!result.success) {
            return NextResponse.json(
                { error: `Failed to credit balance: ${result.error}` },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            amountCredited: amountInGuilt,
            newBalance: result.balance,
            txHash,
        });
    } catch (error: any) {
        console.error('[Deposit Confirm] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to confirm deposit' },
            { status: 500 }
        );
    }
}

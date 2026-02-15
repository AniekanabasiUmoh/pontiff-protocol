import { NextRequest, NextResponse } from 'next/server';
import {
    createPublicClient,
    http,
    parseAbi,
    parseEther,
    encodePacked,
    keccak256,
    toBytes,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { monadTestnet } from 'viem/chains';
import { BalanceService } from '@/lib/services/balance-service';

const PONTIFF_PRIVATE_KEY = process.env.PONTIFF_PRIVATE_KEY!;
const TREASURY_ADDRESS = process.env.NEXT_PUBLIC_TREASURY_ADDRESS!;

/**
 * POST /api/bank/withdraw-request
 * User requests a withdrawal. Backend:
 * 1. Verifies balance >= amount
 * 2. Debits balance FIRST (safety: if user never claims, they re-request)
 * 3. Generates signed withdrawal permit
 * 4. Returns signature + deadline + nonce for user to call contract
 */
export async function POST(req: NextRequest) {
    try {
        const { walletAddress, amount } = await req.json();

        if (!walletAddress || !amount) {
            return NextResponse.json(
                { error: 'Missing walletAddress or amount' },
                { status: 400 }
            );
        }

        const wallet = walletAddress.toLowerCase();
        const withdrawAmount = parseFloat(amount);

        if (withdrawAmount <= 0) {
            return NextResponse.json(
                { error: 'Amount must be positive' },
                { status: 400 }
            );
        }

        // Rate limit: max 1 withdrawal per minute (simple in-memory check)
        // In production, use Redis or DB-based rate limiting
        const rateLimitKey = `withdraw:${wallet}`;
        // TODO: Add proper rate limiting with Redis

        // Check and debit balance FIRST
        const debitResult = await BalanceService.debit(
            wallet,
            withdrawAmount,
            'WITHDRAW',
            undefined,
            undefined,
            { status: 'pending_claim' }
        );

        if (!debitResult.success) {
            return NextResponse.json(
                { error: debitResult.error || 'Insufficient balance' },
                { status: 400 }
            );
        }

        // Get user nonce from contract (we need this for the signature)
        const publicClient = createPublicClient({
            chain: monadTestnet,
            transport: http(process.env.NEXT_PUBLIC_RPC_URL!),
        });
        const TREASURY_ABI = parseAbi(['function getUserNonce(address) view returns (uint256)']);
        const nonce = await publicClient.readContract({
            address: TREASURY_ADDRESS as `0x${string}`,
            abi: TREASURY_ABI,
            functionName: 'getUserNonce',
            args: [wallet as `0x${string}`],
        });

        // Signature expires in 5 minutes
        const deadline = Math.floor(Date.now() / 1000) + 300;

        // Convert to wei
        const amountWei = parseEther(withdrawAmount.toString());

        // Create the message hash (must match contract's keccak256)
        const messageHash = keccak256(
            encodePacked(
                ['address', 'uint256', 'uint256', 'uint256', 'address'],
                [wallet as `0x${string}`, amountWei, nonce as bigint, BigInt(deadline), TREASURY_ADDRESS as `0x${string}`]
            )
        );

        // Sign it with the Pontiff key (Ethereum prefix: \x19Ethereum Signed Message:\n32)
        const account = privateKeyToAccount(PONTIFF_PRIVATE_KEY as `0x${string}`);
        const signature = await account.signMessage({ message: { raw: toBytes(messageHash) } });

        return NextResponse.json({
            success: true,
            signature,
            amount: withdrawAmount,
            amountWei: amountWei.toString(),
            nonce: nonce.toString(),
            deadline,
            treasuryAddress: TREASURY_ADDRESS,
        });
    } catch (error: any) {
        console.error('[Withdraw Request] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process withdrawal' },
            { status: 500 }
        );
    }
}

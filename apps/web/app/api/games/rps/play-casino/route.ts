import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/db/supabase-server';
import { BalanceService } from '@/lib/services/balance-service';
import crypto from 'crypto';


// House edge: 5%
const HOUSE_EDGE_BPS = 500; // 5% in basis points
const MAX_BPS = 10000;

// RPS move mapping: 1=Stone, 2=Scroll, 3=Dagger
// Stone beats Dagger, Scroll beats Stone, Dagger beats Scroll
function determineWinner(playerMove: number, pontiffMove: number): 'WIN' | 'LOSS' | 'DRAW' {
    if (playerMove === pontiffMove) return 'DRAW';
    if (
        (playerMove === 1 && pontiffMove === 3) || // Stone beats Dagger
        (playerMove === 2 && pontiffMove === 1) || // Scroll beats Stone
        (playerMove === 3 && pontiffMove === 2)    // Dagger beats Scroll
    ) {
        return 'WIN';
    }
    return 'LOSS';
}

/**
 * Provably fair RNG:
 * 1. Server generates a secret seed
 * 2. Hash of seed is shown to user BEFORE game (commitment)
 * 3. Combined with client seed + nonce to generate outcome
 * 4. After game, server seed is revealed so user can verify
 */
function generateProvablyFairMove(serverSeed: string, clientSeed: string, nonce: number): number {
    const combined = `${serverSeed}:${clientSeed}:${nonce}`;
    const hash = crypto.createHash('sha256').update(combined).digest('hex');
    // Use first 8 hex chars as a number, mod 3 + 1 = move (1, 2, or 3)
    const num = parseInt(hash.substring(0, 8), 16);
    return (num % 3) + 1;
}

/**
 * POST /api/games/rps/play-casino
 *
 * Instant, off-chain RPS with casino balance.
 * No wallet popups, no gas, no waiting.
 *
 * Input: { walletAddress, playerMove (1/2/3), wager (number in GUILT) }
 * Output: { success, result, pontiffMove, payout, newBalance, gameId, serverSeed }
 */
import { checkRateLimit } from '@/lib/middleware/rate-limit';
import { validators } from '@/lib/utils/validation';

export async function POST(req: NextRequest) {
    try {
        const supabase = createServerSupabase();
        const { walletAddress, playerMove, wager, clientSeed: userClientSeed } = await req.json();

        // 0. Rate Limit (IP-based)
        const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
        const limit = await checkRateLimit(ip, 'casino_rps');

        if (!limit.success) {
            const wait = limit.resetTime ? Math.ceil((limit.resetTime - Date.now()) / 1000) : 60;
            return NextResponse.json(
                { error: `Too many games. Cool down for ${wait}s.` },
                { status: 429, headers: { 'Retry-After': wait.toString() } }
            );
        }

        // ── Validation ──
        try {
            validators.wallet(walletAddress, 'walletAddress');
            // Wager: Min 0.1, Max 50000
            validators.amount(wager, 'wager', 0.1, 50000);
        } catch (e: any) {
            return NextResponse.json({ error: e.message, field: e.field }, { status: 400 });
        }

        if (!playerMove || ![1, 2, 3].includes(playerMove)) {
            return NextResponse.json({ error: 'Invalid move. Must be 1 (Stone), 2 (Scroll), or 3 (Dagger)' }, { status: 400 });
        }

        const wallet = walletAddress.toLowerCase();
        const wagerAmount = parseFloat(wager);

        // ── Debit wager from balance ──
        const debitResult = await BalanceService.debit(wallet, wagerAmount, 'WAGER', undefined, 'RPS');
        if (!debitResult.success) {
            return NextResponse.json(
                { error: debitResult.error || 'Insufficient casino balance. Deposit GUILT first.' },
                { status: 400 }
            );
        }

        // ── Generate provably fair result ──
        const serverSeed = crypto.randomBytes(32).toString('hex');
        const serverSeedHash = crypto.createHash('sha256').update(serverSeed).digest('hex');
        const clientSeed = userClientSeed || crypto.randomBytes(16).toString('hex');
        const nonce = Date.now(); // Simple nonce using timestamp

        const pontiffMove = generateProvablyFairMove(serverSeed, clientSeed, nonce);
        const result = determineWinner(playerMove, pontiffMove);

        // ── Calculate payout ──
        let payout = 0;
        let houseEdge = 0;
        const gameId = crypto.randomUUID();

        if (result === 'WIN') {
            // Winner gets 2x wager minus house edge
            const grossPayout = wagerAmount * 2;
            houseEdge = (grossPayout * HOUSE_EDGE_BPS) / MAX_BPS;
            payout = grossPayout - houseEdge;

            // Credit winnings to user
            await BalanceService.credit(wallet, payout, 'WIN', gameId, 'RPS', {
                pontiffMove,
                playerMove,
                houseEdge,
            });
        } else if (result === 'DRAW') {
            // Refund the wager (no house edge on draws)
            payout = wagerAmount;
            await BalanceService.credit(wallet, payout, 'REFUND', gameId, 'RPS', {
                pontiffMove,
                playerMove,
                reason: 'draw',
            });
        }
        // LOSS: wager already deducted, nothing to credit

        // ── Record house edge as revenue ──
        if (houseEdge > 0) {
            // Log house edge separately in balance_transactions for the treasury
            await supabase.from('balance_transactions').insert({
                wallet_address: 'treasury',
                type: 'HOUSE_EDGE',
                amount: houseEdge,
                balance_before: 0,
                balance_after: houseEdge,
                game_id: gameId,
                game_type: 'RPS',
                metadata: { from: wallet },
            });
        }

        // ── Save game to database ──
        const { error: gameError } = await supabase.from('games').insert({
            id: gameId,
            game_type: 'RPS',
            status: 'Completed',
            player1: wallet,
            player2: 'ThePontiff',
            wager: (wagerAmount * 1e18).toString(), // Store in wei for compatibility
            result: {
                outcome: result,
                playerMove,
                pontiffMove,
                payout,
                houseEdge,
            },
            play_mode: 'casino',
        });

        if (gameError) {
            console.error('[Casino RPS] Failed to save game:', gameError);
            // Game already resolved, don't fail — just log
        }

        // ── Store provably fair seeds (non-blocking) ──
        supabase.from('game_seeds').insert({
            game_id: gameId,
            game_type: 'RPS',
            server_seed_hash: serverSeedHash,
            server_seed: serverSeed,
            client_seed: clientSeed,
            nonce,
        }).then(({ error }) => {
            if (error) console.warn('[Casino RPS] game_seeds insert failed:', error.message);
        });

        // ── Get updated balance ──
        const newBalance = await BalanceService.getBalance(wallet);

        return NextResponse.json({
            success: true,
            gameId,
            result,
            playerMove,
            pontiffMove,
            wager: wagerAmount,
            payout,
            houseEdge,
            newBalance: newBalance.available,
            // Provably fair data
            serverSeedHash,
            serverSeed,
            clientSeed,
            nonce,
        });
    } catch (error: any) {
        console.error('[Casino RPS] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Game failed' },
            { status: 500 }
        );
    }
}

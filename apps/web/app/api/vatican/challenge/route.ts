import { NextResponse } from 'next/server';
import { validateAction } from '@/lib/middleware/validate-action';
import { ChallengeAction } from '@/lib/types/actions';
import { logWorldEvent } from '@/lib/services/world-event-service';
import { ConversionService } from '@/lib/services/conversion-service';
import { createServerSupabase } from '@/lib/db/supabase-server';
import { updateWorldState } from '@/lib/actions/update-world-state';

export async function POST(request: Request) {
    try {
        const supabase = createServerSupabase();
        const body: ChallengeAction = await request.json();

        // 1. Validate
        await validateAction(body);

        // 2. Risk Check (Modules 5-6 will expand this)
        // For now, accept all challenges under 1000 GUILT
        const maxWager = BigInt("1000000000000000000000"); // 1000 GUILT
        if (BigInt(body.wager) > maxWager) {
            return NextResponse.json({ error: "Wager too high. The Pontiff declines." }, { status: 400 });
        }

        let resultData: any = {};

        // 2b. House Fee Calculation (5% "Tithe")
        const wagerAmount = BigInt(body.wager);
        const houseFee = (wagerAmount * BigInt(5)) / BigInt(100);
        const netWager = wagerAmount - houseFee;

        // In a real contract call, the user sends 'wagerAmount', contract takes 'houseFee', puts 'netWager' in pot.
        // For this API/DB record, we record the gross wager but note the fee in metadata if needed.

        // 3. Game Specific Logic
        if (body.gameType === 'RPS') {
            if (!body.gameId) {
                return NextResponse.json({ error: "Game ID required for RPS" }, { status: 400 });
            }

            // A. Determine Strategy (Real Logic)
            const { determinePontiffMove } = await import('@/lib/services/rps-service');
            const pontiffMove = await determinePontiffMove(body.agentWallet);

            // B. Verify On-Chain Transaction
            if (!body.txHash) {
                return NextResponse.json({ error: "txHash required. Join the game on-chain first." }, { status: 400 });
            }

            try {
                // Dynamic import to avoid circular dep issues in some contexts
                const { createPublicClient, http } = await import('viem');
                const { monadTestnet } = await import('viem/chains');

                const client = createPublicClient({
                    chain: monadTestnet,
                    transport: http(process.env.NEXT_PUBLIC_RPC_URL)
                });

                const tx = await client.getTransaction({ hash: body.txHash as `0x${string}` });
                const receipt = await client.getTransactionReceipt({ hash: body.txHash as `0x${string}` });

                const { decodeFunctionData, parseAbi, parseEther } = await import('viem');

                // 1. Check Status
                if (receipt.status !== 'success') {
                    throw new Error("Transaction failed on-chain.");
                }

                // 2. Check Sender
                if (tx.from.toLowerCase() !== body.agentWallet.toLowerCase()) {
                    throw new Error("Transaction sender does not match Agent Wallet.");
                }

                // 3. Check Contract Address
                const gameAddress = process.env.NEXT_PUBLIC_GAME_ADDRESS;
                if (!gameAddress) throw new Error("Game Contract Address not configured.");
                if (tx.to?.toLowerCase() !== gameAddress.toLowerCase()) {
                    throw new Error(`Invalid Contract Address. Sent to ${tx.to}, expected ${gameAddress}`);
                }

                // 4. Check Wager Amount
                // body.wager is presumably in wei (string)
                if (tx.value !== BigInt(body.wager)) {
                    throw new Error(`Wager Mismatch. Sent ${tx.value}, claimed ${body.wager}`);
                }

                // 5. Decode Input Data to Verify Game ID
                // ABI Assumption: function joinGame(uint256 gameId, uint8 move)
                const abi = parseAbi(['function joinGame(uint256 gameId, uint8 move) external payable']);

                try {
                    const { args } = decodeFunctionData({
                        abi,
                        data: tx.input
                    });

                    // args: [gameId, move]
                    const txGameId = args[0].toString();
                    if (txGameId !== body.gameId) {
                        throw new Error(`Game ID Mismatch. TX joined ${txGameId}, request claims ${body.gameId}`);
                    }
                } catch (decodeError) {
                    console.error("ABI Decode Failed:", decodeError);
                    throw new Error("Failed to verify function call arguments. Ensure you called joinGame(uint256, uint8).");
                }

            } catch (error: any) {
                console.error("TX Verification Failed:", error);
                return NextResponse.json({ error: `Invalid Transaction: ${error.message}` }, { status: 400 });
            }

            resultData = {
                gameId: body.gameId,
                pontiffMove,
                txHash: body.txHash, // Confirmed Real
                status: "accepted",
                data: { houseFee: houseFee.toString() }
            };
        } else if (body.gameType === 'Poker') {
            // Poker Logic (Placeholder)
            // ...
            return NextResponse.json({ error: "Poker not yet implemented in V2 API" }, { status: 501 });
        }

        // 4. Persist Match in DB
        const { data: match, error: dbError } = await supabase
            .from('games')
            .insert([{
                player1: body.agentWallet,
                player2: "ThePontiff",
                gameType: body.gameType,
                wager: body.wager,
                status: "active",
                result: resultData,
                createdAt: new Date().toISOString()
                // Note: Schema doesn't have explicit 'houseFee' column, stored in result/metadata
            }])
            .select()
            .single();

        if (dbError) throw new Error(dbError.message);

        // 4. Log Event
        await logWorldEvent(body.agentWallet, 'challenge', { gameType: body.gameType, matchId: match.id });

        // 5. Leaderboard Update
        // REMOVED: Leaderboard should only be updated when the game is resolved (Win/Loss), not on challenge creation.
        // The game resolution logic (e.g. reveal or poker hand end) will handle this.

        // 6. Tie-in: Pipeline
        await ConversionService.trackConversionSign(body.agentWallet, 'GameInteraction');

        // 7. Trigger WS Update
        await updateWorldState();

        return NextResponse.json({
            success: true,
            data: {
                matchId: match.id,
                status: "accepted",
                gameType: body.gameType,
                contractAddress: process.env.NEXT_PUBLIC_GAME_ADDRESS || "0x...", // RPS Contract
                message: "The Pontiff accepts your challenge. Check the blockchain for his move."
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

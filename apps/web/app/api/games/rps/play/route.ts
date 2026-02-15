import { NextResponse } from 'next/server';
import { createWalletClient, http, createPublicClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { monadTestnet } from 'viem/chains';
import { determinePontiffMove } from '@/lib/services/rps-service';
import { LeaderboardService } from '@/lib/services/leaderboard-service';
import { createServerSupabase } from '@/lib/db/supabase-server';
import { updateWorldState } from '@/lib/actions/update-world-state';
import { PONTIFF_RPS_ABI } from '@/lib/abi/PontiffRPS';

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://monad-testnet.drpc.org";
const PRIVATE_KEY = process.env.PONTIFF_PRIVATE_KEY as `0x${string}`;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_RPS_CONTRACT_ADDRESS as `0x${string}`;

export async function POST(request: Request) {
    try {
        const supabase = createServerSupabase();
        const body = await request.json();
        const { gameId, playerAddress, wager, playerMove, txHash } = body;

        // Note: gameId comes from the frontend after listening to the GameCreated event on-chain
        // playerMove and wager are passed for verification, although we could/should fetch them from chain

        // Validate basic inputs
        if (gameId === undefined || !playerAddress) {
            return NextResponse.json({ error: "Missing gameId or playerAddress" }, { status: 400 });
        }

        // 1. Determine Pontiff's Move
        const pontiffMove = await determinePontiffMove(playerAddress);

        // 2. Settle Game On-Chain
        if (!PRIVATE_KEY) {
            throw new Error("Missing PONTIFF_PRIVATE_KEY");
        }

        const account = privateKeyToAccount(PRIVATE_KEY);
        const client = createWalletClient({
            account,
            chain: monadTestnet,
            transport: http(RPC_URL)
        });

        // Optional: Verify game state on-chain before settling?
        // For speed, we trust the input for now, but in prod we should verify `getGame(gameId)`

        console.log(`[RPS] Settling Game ${gameId} with Pontiff Move ${pontiffMove}`);

        const hash = await client.writeContract({
            address: CONTRACT_ADDRESS,
            abi: PONTIFF_RPS_ABI,
            functionName: 'settleGame',
            args: [BigInt(gameId), pontiffMove],
        });

        console.log(`[RPS] Settlement Tx: ${hash}`);

        // Wait for confirmation? Or assume success?
        // For UI responsiveness, we return the Tx Hash. The frontend can wait.

        // 3. Determine Result (Local Calculation for DB/UI)
        // Note: Contract logic logic is: 1=Rock, 2=Paper, 3=Scissors
        let result: 'WIN' | 'LOSS' | 'DRAW';
        if (playerMove === pontiffMove) {
            result = 'DRAW';
        } else if (
            (playerMove === 1 && pontiffMove === 3) || // Rock beats Scissors
            (playerMove === 2 && pontiffMove === 1) || // Paper beats Rock
            (playerMove === 3 && pontiffMove === 2)    // Scissors beats Paper
        ) {
            result = 'WIN';
        } else {
            result = 'LOSS';
        }

        // 4. Calculate house fee (5%) - Logic duplicated from contract for display
        const wagerAmount = BigInt(wager || "0");
        // 3. Calculate payout (5% house fee)
        const houseFee = wagerAmount * BigInt(5) / BigInt(100);
        // Correct Payout Logic matching Contract: (Wager * 2) - Fee
        // Old logic: (Wager - Fee) * 2 which equaled 190. Contract pays 195.
        const payout = result === 'WIN'
            ? (wagerAmount * BigInt(2)) - houseFee
            : result === 'DRAW'
                ? wagerAmount - houseFee // Contract currently deducts fee on draw
                : BigInt(0);

        // 5. Store game in DB
        const { data: game, error: dbError } = await supabase
            .from('games')
            .upsert([{
                id: crypto.randomUUID(), // Or use gameId if UUID compatible? No, gameId is uint256. Store in metadata?
                // Schema expects ID as UUID. We can store chain_game_id in result or separate column.
                player1: playerAddress,
                player2: "ThePontiff",
                game_type: "RPS",
                wager: wagerAmount.toString(),
                status: "Completed", // Capitalized to match DB Enum
                result: {
                    gameId,
                    txHash,
                    settlementTx: hash,
                    playerMove,
                    pontiffMove,
                    outcome: result,
                    houseFee: houseFee.toString(),
                    payout: payout.toString()
                },
                created_at: new Date().toISOString()
            }] as any)
            .select()
            .single();

        if (dbError) console.error("DB Error:", dbError);

        // 6. Update Leaderboard
        if (result !== 'DRAW') {
            await LeaderboardService.updateLeaderboard(
                playerAddress || "0xManualPlayer",
                result,
                Number(wagerAmount.toString()) // Wager is already human-readable string
            );
        }

        // 7. Trigger WS Update
        await updateWorldState();

        return NextResponse.json({
            gameId,
            pontiffMove,
            result,
            payout: payout.toString(),
            houseFee: houseFee.toString(),
            settlementTx: hash,
            message: result === 'WIN'
                ? "Heresy prevails! The Pontiff has been bested."
                : result === 'LOSS'
                    ? "The faithful stand strong. Your heresy is purged."
                    : "A stalemate. The cosmic balance holds."
        });

    } catch (error: any) {
        console.error("RPS Play Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
